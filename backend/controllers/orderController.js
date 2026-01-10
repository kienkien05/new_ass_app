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

module.exports = { createOrder, getMyTickets, getAllTickets, getRemainingTickets };
