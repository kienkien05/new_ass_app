const prisma = require('../config/db');
const { v4: uuidv4 } = require('uuid');
const { generateQRCode } = require('../utils/qrGenerator');

// @desc    Create new order (Book tickets)
// @route   POST /api/orders
// @access  Private
const createOrder = async (req, res) => {
    const { ticket_items, seat_ids } = req.body;
    // ticket_items: [{ ticket_type_id, quantity }]
    // seat_ids: optional array of seat IDs for seat selection

    if (!ticket_items || ticket_items.length === 0) {
        return res.status(400).json({
            success: false,
            message: 'No items in order'
        });
    }

    try {
        // Use transaction for atomicity
        const result = await prisma.$transaction(async (tx) => {
            // 1. Fetch all requested ticket types with event info
            const itemIds = ticket_items.map(item => item.ticket_type_id);
            const ticketTypes = await tx.ticketType.findMany({
                where: { id: { in: itemIds } },
                include: {
                    event: {
                        select: {
                            id: true,
                            title: true,
                            maxTicketsPerUser: true
                        }
                    }
                }
            });

            const ticketTypeMap = new Map(ticketTypes.map(tt => [tt.id, tt]));

            // 2. Calculate total tickets per event and validate limits
            const eventTicketCounts = {};
            let totalTicketsInOrder = 0;

            for (const item of ticket_items) {
                const ticketType = ticketTypeMap.get(item.ticket_type_id);
                if (!ticketType) {
                    throw new Error(`Ticket Type not found: ${item.ticket_type_id}`);
                }

                const eventId = ticketType.event.id;
                eventTicketCounts[eventId] = (eventTicketCounts[eventId] || 0) + item.quantity;
                totalTicketsInOrder += item.quantity;
            }

            // 3. Check max_tickets_per_user for each event
            for (const [eventId, requestedCount] of Object.entries(eventTicketCounts)) {
                // Get existing ticket count for this user and event
                const existingTickets = await tx.ticket.count({
                    where: {
                        userId: req.user.id,
                        eventId: eventId,
                        status: { not: 'cancelled' }
                    }
                });

                // Get event's max limit
                const event = await tx.event.findUnique({
                    where: { id: eventId },
                    select: { maxTicketsPerUser: true, title: true }
                });

                const maxAllowed = event?.maxTicketsPerUser || 10;
                const totalAfterOrder = existingTickets + requestedCount;

                if (totalAfterOrder > maxAllowed) {
                    const remaining = Math.max(0, maxAllowed - existingTickets);
                    throw new Error(
                        `Bạn chỉ có thể mua tối đa ${maxAllowed} vé cho sự kiện "${event?.title}". ` +
                        `Bạn đã mua ${existingTickets} vé, còn có thể mua ${remaining} vé.`
                    );
                }
            }

            // 4. Validate stock and calculate total
            let totalAmount = 0;
            const validatedItems = [];
            const ticketsToCreate = [];
            let seatIndex = 0;

            for (const item of ticket_items) {
                const ticketType = ticketTypeMap.get(item.ticket_type_id);

                if (ticketType.status !== 'active') {
                    throw new Error(`Loại vé không khả dụng: ${ticketType.name}`);
                }

                if (ticketType.quantitySold + item.quantity > ticketType.quantityTotal) {
                    const remaining = ticketType.quantityTotal - ticketType.quantitySold;
                    throw new Error(`Không đủ vé "${ticketType.name}". Còn lại: ${remaining} vé.`);
                }

                totalAmount += Number(ticketType.price) * item.quantity;
                validatedItems.push({ ticketType, quantity: item.quantity });

                // Prepare tickets data for bulk insert
                for (let i = 0; i < item.quantity; i++) {
                    const ticketCode = uuidv4().replace(/-/g, '').substring(0, 12).toUpperCase();
                    ticketsToCreate.push({
                        ticketTypeId: ticketType.id,
                        userId: req.user.id,
                        eventId: ticketType.eventId,
                        ticketCode,
                        priceAtPurchase: ticketType.price,
                        seatId: seat_ids && seat_ids[seatIndex] ? seat_ids[seatIndex] : null
                    });
                    seatIndex++;
                }
            }

            // 5. Check if seats are already taken
            if (seat_ids && seat_ids.length > 0) {
                const validSeatIds = seat_ids.filter(id => id);
                if (validSeatIds.length > 0) {
                    const existingTickets = await tx.ticket.findMany({
                        where: {
                            seatId: { in: validSeatIds },
                            status: { not: 'cancelled' },
                            eventId: ticketsToCreate[0].eventId
                        }
                    });

                    if (existingTickets.length > 0) {
                        throw new Error('Một số ghế đã có người đặt!');
                    }
                }
            }

            // 6. Create Order
            const order = await tx.order.create({
                data: {
                    userId: req.user.id,
                    totalAmount,
                    status: 'paid', // Auto-pay for now
                    paymentMethod: 'test_credit',
                    paymentTransactionId: uuidv4(),
                }
            });

            // Add orderId to tickets
            const ticketsData = ticketsToCreate.map(t => ({ ...t, orderId: order.id }));

            // 7. Update TicketTypes (Stock) and Bulk Create Tickets
            await Promise.all([
                // Update stock for each type
                ...validatedItems.map(item => {
                    const newSold = item.ticketType.quantitySold + item.quantity;
                    return tx.ticketType.update({
                        where: { id: item.ticketType.id },
                        data: {
                            quantitySold: newSold,
                            status: newSold >= item.ticketType.quantityTotal ? 'sold_out' : 'active'
                        }
                    });
                }),
                // Bulk create tickets
                tx.ticket.createMany({ data: ticketsData })
            ]);

            // 8. Fetch created tickets and generate QR codes
            const createdTickets = await tx.ticket.findMany({
                where: { orderId: order.id }
            });

            // Generate QR codes for each ticket
            const qrUpdates = await Promise.all(
                createdTickets.map(async (ticket) => {
                    const qrCode = await generateQRCode(ticket.ticketCode);
                    return tx.ticket.update({
                        where: { id: ticket.id },
                        data: { qrCode }
                    });
                })
            );

            return { order, tickets: qrUpdates };
        });

        // Send email for each ticket created
        const { sendTicketEmail } = require('../services/otpService');

        // Fetch full ticket details for email
        const fullTickets = await prisma.ticket.findMany({
            where: { orderId: result.order.id },
            include: {
                event: { select: { title: true, startTime: true, location: true } },
                ticketType: { select: { name: true } },
                seat: { include: { room: true } }
            }
        });

        // Send emails in background (don't block response)
        Promise.all(
            fullTickets.map(async (ticket) => {
                try {
                    const ticketData = {
                        ticketCode: ticket.ticketCode,
                        qrCode: ticket.qrCode,
                        eventTitle: ticket.event.title,
                        eventDate: ticket.event.startTime,
                        eventLocation: ticket.event.location,
                        ticketTypeName: ticket.ticketType.name,
                        price: Number(ticket.priceAtPurchase),
                        seatInfo: ticket.seat ? {
                            room: ticket.seat.room.name,
                            row: ticket.seat.row,
                            number: ticket.seat.number
                        } : null
                    };
                    await sendTicketEmail(ticketData, req.user.email);
                } catch (emailError) {
                    console.error(`Failed to send email for ticket ${ticket.ticketCode}:`, emailError);
                }
            })
        ).catch(err => console.error('Email sending errors:', err));

        // Transform response
        res.status(201).json({
            success: true,
            data: {
                order: {
                    id: result.order.id,
                    total_amount: Number(result.order.totalAmount),
                    status: result.order.status,
                    payment_method: result.order.paymentMethod,
                    created_at: result.order.createdAt,
                },
                tickets: result.tickets.map(t => ({
                    id: t.id,
                    ticket_code: t.ticketCode,
                    qr_code: t.qrCode,
                    status: t.status,
                    price_at_purchase: Number(t.priceAtPurchase),
                }))
            }
        });

    } catch (error) {
        console.error('Create order error:', error);
        res.status(400).json({
            success: false,
            message: error.message || 'Server Error during booking'
        });
    }
};

// @desc    Get remaining tickets user can buy for an event
// @route   GET /api/orders/remaining/:eventId
// @access  Private
const getRemainingTickets = async (req, res) => {
    try {
        const { eventId } = req.params;

        // Get event max limit
        const event = await prisma.event.findUnique({
            where: { id: eventId },
            select: { maxTicketsPerUser: true, title: true }
        });

        if (!event) {
            return res.status(404).json({
                success: false,
                message: 'Event not found'
            });
        }

        // Count user's existing tickets for this event
        const existingCount = await prisma.ticket.count({
            where: {
                userId: req.user.id,
                eventId,
                status: { not: 'cancelled' }
            }
        });

        const maxAllowed = event.maxTicketsPerUser || 10;
        const remaining = Math.max(0, maxAllowed - existingCount);

        res.json({
            success: true,
            data: {
                event_id: eventId,
                max_tickets_per_user: maxAllowed,
                already_purchased: existingCount,
                remaining_allowed: remaining
            }
        });
    } catch (error) {
        console.error('Get remaining tickets error:', error);
        res.status(500).json({
            success: false,
            message: 'Server error'
        });
    }
};

// @desc    Get logged in user tickets
// @route   GET /api/users/tickets
// @access  Private
const getMyTickets = async (req, res) => {
    try {
        const tickets = await prisma.ticket.findMany({
            where: { userId: req.user.id },
            include: {
                event: {
                    select: {
                        id: true,
                        title: true,
                        startTime: true,
                        location: true,
                        bannerImage: true,
                    }
                },
                ticketType: {
                    select: {
                        id: true,
                        name: true,
                    }
                },
                seat: {
                    include: {
                        room: true
                    }
                }
            },
            orderBy: { createdAt: 'desc' }
        });

        // Transform response
        const transformedTickets = tickets.map(t => ({
            id: t.id,
            ticket_code: t.ticketCode,
            qr_code: t.qrCode,
            status: t.status,
            used_at: t.usedAt,
            price_at_purchase: Number(t.priceAtPurchase),
            created_at: t.createdAt,
            event: {
                id: t.event.id,
                title: t.event.title,
                start_time: t.event.startTime,
                location: t.event.location,
                banner_image: t.event.bannerImage,
            },
            ticket_type: {
                id: t.ticketType.id,
                name: t.ticketType.name,
            },
            seat: t.seat ? {
                id: t.seat.id,
                room: t.seat.room.name,
                row: t.seat.row,
                number: t.seat.number
            } : null
        }));

        res.json({ success: true, data: transformedTickets });
    } catch (error) {
        console.error('Get my tickets error:', error);
        res.status(500).json({
            success: false,
            message: 'Server error fetching tickets'
        });
    }
};

// @desc    Get all tickets (Admin)
// @route   GET /api/orders/tickets
// @access  Private/Admin
const getAllTickets = async (req, res) => {
    try {
        const tickets = await prisma.ticket.findMany({
            include: {
                event: {
                    select: {
                        id: true,
                        title: true,
                        startTime: true,
                        location: true,
                    }
                },
                ticketType: {
                    select: {
                        id: true,
                        name: true,
                    }
                },
                user: {
                    select: {
                        id: true,
                        fullName: true,
                        email: true
                    }
                },
                seat: {
                    include: {
                        room: true
                    }
                }
            },
            orderBy: { createdAt: 'desc' }
        });

        // Transform for frontend
        const transformedTickets = tickets.map(t => ({
            id: t.id,
            ticket_code: t.ticketCode,
            qr_code: t.qrCode,
            event_id: t.event.id,
            event_title: t.event.title,
            event_date: t.event.startTime ? t.event.startTime.toISOString() : '',
            event_location: t.event.location,
            price: Number(t.priceAtPurchase),
            buyer_id: t.user.id,
            buyer_name: t.user.fullName,
            buyer_email: t.user.email,
            purchase_date: t.createdAt.toISOString().split('T')[0],
            status: t.status,
            seat: t.seat ? {
                id: t.seat.id,
                room: t.seat.room.name,
                row: t.seat.row,
                number: t.seat.number
            } : undefined
        }));

        res.json({ success: true, data: transformedTickets });
    } catch (error) {
        console.error('getAllTickets error:', error);
        res.status(500).json({ message: error.message });
    }
}

// @desc    Admin creates ticket manually (offline sale)
// @route   POST /api/tickets/create-manual
// @access  Private/Admin
const createManualTicket = async (req, res) => {
    try {
        const {
            email,
            eventId,
            ticketTypeId,
            seatId,
            customPrice
        } = req.body;

        // 1. Find user by email
        const user = await prisma.user.findUnique({ where: { email } });
        if (!user) {
            return res.status(400).json({
                success: false,
                message: `Không tìm thấy user với email: ${email}. Vui lòng tạo tài khoản trước.`
            });
        }

        // 2. Validate event and ticket type
        const event = await prisma.event.findUnique({
            where: { id: eventId },
            select: { id: true, title: true, startTime: true, location: true }
        });

        if (!event) {
            return res.status(404).json({
                success: false,
                message: 'Không tìm thấy sự kiện'
            });
        }

        const ticketType = await prisma.ticketType.findUnique({
            where: { id: ticketTypeId },
            select: { id: true, name: true, price: true }
        });

        if (!ticketType) {
            return res.status(404).json({
                success: false,
                message: 'Không tìm thấy loại vé'
            });
        }

        // 3. Validate seat if provided
        let seat = null;
        if (seatId) {
            seat = await prisma.seat.findUnique({
                where: { id: seatId },
                include: { room: true }
            });

            if (!seat) {
                return res.status(404).json({
                    success: false,
                    message: 'Không tìm thấy ghế'
                });
            }

            // Check if seat is already taken
            const existingTicket = await prisma.ticket.findFirst({
                where: {
                    eventId,
                    seatId,
                    status: { not: 'cancelled' }
                }
            });

            if (existingTicket) {
                return res.status(400).json({
                    success: false,
                    message: `Ghế ${seat.row}${seat.number} đã có người đặt`
                });
            }
        }

        // 4. Calculate price and generate ticket code
        const finalPrice = customPrice !== undefined ? customPrice : ticketType.price;
        const ticketCode = uuidv4().replace(/-/g, '').substring(0, 12).toUpperCase();

        // 5. Create a dummy order for manual ticket (orderId is required)
        const order = await prisma.order.create({
            data: {
                userId: user.id,
                totalAmount: finalPrice,
                status: 'paid',
                paymentMethod: 'manual_admin',
                paymentTransactionId: `MANUAL-${Date.now()}`
            }
        });

        // 6. Create ticket
        const ticket = await prisma.ticket.create({
            data: {
                orderId: order.id,
                userId: user.id,
                eventId,
                ticketTypeId,
                seatId: seatId || null,
                ticketCode,
                priceAtPurchase: finalPrice,
                status: 'valid'
            }
        });

        // 7. Generate QR code
        const qrCode = await generateQRCode(ticket.ticketCode);
        const updatedTicket = await prisma.ticket.update({
            where: { id: ticket.id },
            data: { qrCode }
        });

        // 8. Send email automatically
        const { sendTicketEmail } = require('../services/otpService');
        const ticketData = {
            ticketCode: updatedTicket.ticketCode,
            qrCode: updatedTicket.qrCode,
            eventTitle: event.title,
            eventDate: event.startTime,
            eventLocation: event.location,
            ticketTypeName: ticketType.name,
            price: Number(finalPrice),
            seatInfo: seat ? {
                room: seat.room.name,
                row: seat.row,
                number: seat.number
            } : null
        };

        // Send email in background
        sendTicketEmail(ticketData, user.email).catch(err =>
            console.error(`Failed to send email for manual ticket ${ticketCode}:`, err)
        );

        res.status(201).json({
            success: true,
            message: 'Đã tạo và gửi vé thành công',
            data: {
                id: updatedTicket.id,
                ticket_code: updatedTicket.ticketCode,
                qr_code: updatedTicket.qrCode,
                user_email: user.email,
                event_title: event.title,
                seat: seat ? `${seat.row}${seat.number}` : null
            }
        });

    } catch (error) {
        console.error('Create manual ticket error:', error);
        res.status(500).json({
            success: false,
            message: error.message || 'Lỗi khi tạo vé thủ công'
        });
    }
};

module.exports = { createOrder, getMyTickets, getAllTickets, getRemainingTickets, createManualTicket };
