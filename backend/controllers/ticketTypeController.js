const prisma = require('../config/db');

// @desc    Get all ticket types (or filter by event)
// @route   GET /api/ticket-types
// @access  Public
const getTicketTypes = async (req, res) => {
    try {
        const { event_id } = req.query;
        const where = {};
        if (event_id) {
            where.eventId = event_id;
        }

        const ticketTypes = await prisma.ticketType.findMany({
            where,
            include: {
                event: {
                    select: { title: true }
                }
            },
            orderBy: { price: 'asc' }
        });

        const transformed = ticketTypes.map(tt => ({
            id: tt.id,
            event_id: tt.eventId,
            event_title: tt.event?.title,
            name: tt.name,
            description: tt.description,
            price: Number(tt.price),
            original_price: Number(tt.originalPrice),
            quantity_total: tt.quantityTotal,
            quantity_sold: tt.quantitySold,
            status: tt.status
        }));

        res.json({ success: true, data: transformed });
    } catch (error) {
        console.error('Get ticket types error:', error);
        res.status(500).json({ success: false, message: 'Server error' });
    }
};

// @desc    Create a ticket type
// @route   POST /api/ticket-types
// @access  Private/Admin
const createTicketType = async (req, res) => {
    try {
        const { event_id, name, price, quantity_total, description } = req.body;

        if (!event_id || !price || !quantity_total) {
            return res.status(400).json({ success: false, message: 'Missing required fields' });
        }

        const ticketType = await prisma.ticketType.create({
            data: {
                eventId: event_id,
                name: name || 'Standard',
                price: price,
                quantityTotal: quantity_total,
                description: description,
                status: 'active'
            },
            include: {
                event: { select: { title: true } }
            }
        });

        res.status(201).json({
            success: true,
            data: {
                id: ticketType.id,
                event_id: ticketType.eventId,
                event_title: ticketType.event?.title,
                name: ticketType.name,
                price: Number(ticketType.price),
                quantity_total: ticketType.quantityTotal,
                quantity_sold: ticketType.quantitySold,
                status: ticketType.status
            }
        });
    } catch (error) {
        console.error('Create ticket type error:', error);
        res.status(500).json({ success: false, message: 'Server error' });
    }
};

// @desc    Update a ticket type
// @route   PUT /api/ticket-types/:id
// @access  Private/Admin
const updateTicketType = async (req, res) => {
    try {
        const { name, price, quantity_total, status, description } = req.body;

        const ticketType = await prisma.ticketType.update({
            where: { id: req.params.id },
            data: {
                name,
                price,
                quantityTotal: quantity_total,
                status,
                description
            },
            include: {
                event: { select: { title: true } }
            }
        });

        res.json({
            success: true,
            data: {
                id: ticketType.id,
                event_id: ticketType.eventId,
                event_title: ticketType.event?.title,
                name: ticketType.name,
                price: Number(ticketType.price),
                quantity_total: ticketType.quantityTotal,
                quantity_sold: ticketType.quantitySold,
                status: ticketType.status
            }
        });
    } catch (error) {
        console.error('Update ticket type error:', error);
        res.status(500).json({ success: false, message: 'Server error' });
    }
};

// @desc    Delete a ticket type
// @route   DELETE /api/ticket-types/:id
// @access  Private/Admin
const deleteTicketType = async (req, res) => {
    try {
        // Check if sold
        const ticketType = await prisma.ticketType.findUnique({
            where: { id: req.params.id }
        });

        if (ticketType.quantitySold > 0) {
            return res.status(400).json({ success: false, message: 'Cannot delete ticket type with sales' });
        }

        await prisma.ticketType.delete({
            where: { id: req.params.id }
        });

        res.json({ success: true, message: 'Ticket type deleted' });
    } catch (error) {
        console.error('Delete ticket type error:', error);
        res.status(500).json({ success: false, message: 'Server error' });
    }
};

module.exports = {
    getTicketTypes,
    createTicketType,
    updateTicketType,
    deleteTicketType
};
