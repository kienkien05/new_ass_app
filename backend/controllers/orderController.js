const prisma = require('../config/db');
const { v4: uuidv4 } = require('uuid');

// @desc    Create new order (Book tickets)
// @route   POST /api/orders
// @access  Private
const createOrder = async (req, res) => {
    const { ticket_items, seat_id } = req.body;
    // ticket_items: [{ ticket_type_id, quantity }]
    // seat_id: optional, for single ticket purchase with seat selection

    if (!ticket_items || ticket_items.length === 0) {
        return res.status(400).json({
            success: false,
            message: 'No items in order'
        });
    }

    try {
        // Use transaction for atomicity
        const result = await prisma.$transaction(async (tx) => {
            // 1. Fetch all requested ticket types in one query
            const itemIds = ticket_items.map(item => item.ticket_type_id);
            const ticketTypes = await tx.ticketType.findMany({
                where: { id: { in: itemIds } }
            });

            const ticketTypeMap = new Map(ticketTypes.map(tt => [tt.id, tt]));

            // 2. Validate and Calculate Total
            let totalAmount = 0;
            const validatedItems = [];
            const ticketsToCreate = [];

            for (const item of ticket_items) {
                const ticketType = ticketTypeMap.get(item.ticket_type_id);

                if (!ticketType) {
                    throw new Error(`Ticket Type not found: ${item.ticket_type_id}`);
                }

                if (ticketType.status !== 'active') {
                    throw new Error(`Ticket Type not available: ${ticketType.name}`);
                }

                if (ticketType.quantitySold + item.quantity > ticketType.quantityTotal) {
                    throw new Error(`Not enough tickets remaining for: ${ticketType.name}`);
                }

                totalAmount += Number(ticketType.price) * item.quantity;
                validatedItems.push({ ticketType, quantity: item.quantity });

                // Prepare tickets data for bulk insert
                for (let i = 0; i < item.quantity; i++) {
                    ticketsToCreate.push({
                        ticketTypeId: ticketType.id,
                        userId: req.user.id,
                        eventId: ticketType.eventId,
                        ticketCode: uuidv4().replace(/-/g, '').substring(0, 12).toUpperCase(), // Better code format
                        priceAtPurchase: ticketType.price,
                        seatId: seat_id || null // Assign seat if provided (assumes 1 ticket for now if seat selected)
                    });
                }
            }

            // Check if seat is already taken if seat_id is provided
            if (seat_id) {
                const existingTicket = await tx.ticket.findFirst({
                    where: {
                        seatId: seat_id,
                        status: { not: 'cancelled' },
                        eventId: ticketsToCreate[0].eventId // Seat availability is per event!
                    }
                });

                if (existingTicket) {
                    throw new Error('Ghế này đã có người đặt!');
                }
            }

            // 3. Create Order
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

            // 4. Update TicketTypes (Stock) and Bulk Create Tickets
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

            // 5. Fetch created tickets to return
            const createdTickets = await tx.ticket.findMany({
                where: { orderId: order.id }
            });

            return { order, tickets: createdTickets };
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

module.exports = { createOrder, getMyTickets, getAllTickets };
