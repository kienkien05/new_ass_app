const prisma = require('../config/db');

// @desc    Validate QR code and check-in ticket
// @route   POST /api/tickets/validate-qr
// @access  Private/Admin
const validateQR = async (req, res) => {
    try {
        const { ticket_code } = req.body;

        if (!ticket_code) {
            return res.status(400).json({
                success: false,
                valid: false,
                message: 'Ticket code is required'
            });
        }

        // Find ticket by code
        const ticket = await prisma.ticket.findUnique({
            where: { ticketCode: ticket_code },
            include: {
                event: {
                    select: {
                        id: true,
                        title: true,
                        startTime: true,
                        endTime: true,
                        location: true,
                        bannerImage: true
                    }
                },
                ticketType: {
                    select: { id: true, name: true }
                },
                user: {
                    select: { id: true, fullName: true, email: true }
                },
                seat: {
                    include: { room: true }
                }
            }
        });

        if (!ticket) {
            return res.status(404).json({
                success: false,
                valid: false,
                message: 'Vé không tồn tại'
            });
        }

        // Check ticket status
        if (ticket.status === 'cancelled') {
            return res.status(400).json({
                success: false,
                valid: false,
                message: 'Vé đã bị huỷ',
                ticket_info: {
                    ticket_code: ticket.ticketCode,
                    status: ticket.status,
                    event: ticket.event.title
                }
            });
        }

        if (ticket.status === 'used') {
            return res.status(400).json({
                success: false,
                valid: false,
                message: 'Vé đã được sử dụng',
                ticket_info: {
                    ticket_code: ticket.ticketCode,
                    status: ticket.status,
                    used_at: ticket.usedAt,
                    event: ticket.event.title,
                    buyer: ticket.user.fullName
                }
            });
        }

        // Check if event has started or within valid window
        const now = new Date();
        const eventStart = ticket.event.startTime ? new Date(ticket.event.startTime) : null;
        const eventEnd = ticket.event.endTime ? new Date(ticket.event.endTime) : null;

        // Allow check-in 2 hours before event start
        const checkInWindow = eventStart ? new Date(eventStart.getTime() - 2 * 60 * 60 * 1000) : null;

        // Warning if too early (but still allow)
        let warning = null;
        if (checkInWindow && now < checkInWindow) {
            warning = 'Sự kiện chưa bắt đầu. Check-in sớm có thể được phép.';
        }

        if (eventEnd && now > eventEnd) {
            return res.status(400).json({
                success: false,
                valid: false,
                message: 'Sự kiện đã kết thúc',
                ticket_info: {
                    ticket_code: ticket.ticketCode,
                    event: ticket.event.title,
                    end_time: eventEnd
                }
            });
        }

        // Mark ticket as used
        const updatedTicket = await prisma.ticket.update({
            where: { id: ticket.id },
            data: {
                status: 'used',
                usedAt: now
            }
        });

        res.json({
            success: true,
            valid: true,
            message: 'Check-in thành công!',
            warning,
            ticket_info: {
                id: ticket.id,
                ticket_code: ticket.ticketCode,
                status: 'used',
                used_at: now,
                price: Number(ticket.priceAtPurchase),
                event: {
                    id: ticket.event.id,
                    title: ticket.event.title,
                    start_time: ticket.event.startTime,
                    location: ticket.event.location
                },
                ticket_type: {
                    id: ticket.ticketType.id,
                    name: ticket.ticketType.name
                },
                buyer: {
                    id: ticket.user.id,
                    name: ticket.user.fullName,
                    email: ticket.user.email
                },
                seat: ticket.seat ? {
                    room: ticket.seat.room.name,
                    row: ticket.seat.row,
                    number: ticket.seat.number
                } : null
            }
        });

    } catch (error) {
        console.error('Validate QR error:', error);
        res.status(500).json({
            success: false,
            valid: false,
            message: 'Server error validating ticket'
        });
    }
};

// @desc    Get ticket info without marking as used (for preview)
// @route   GET /api/tickets/info/:code
// @access  Private/Admin
const getTicketInfo = async (req, res) => {
    try {
        const { code } = req.params;

        const ticket = await prisma.ticket.findUnique({
            where: { ticketCode: code },
            include: {
                event: {
                    select: {
                        id: true,
                        title: true,
                        startTime: true,
                        location: true,
                        bannerImage: true
                    }
                },
                ticketType: {
                    select: { id: true, name: true }
                },
                user: {
                    select: { id: true, fullName: true, email: true }
                },
                seat: {
                    include: { room: true }
                }
            }
        });

        if (!ticket) {
            return res.status(404).json({
                success: false,
                message: 'Ticket not found'
            });
        }

        res.json({
            success: true,
            data: {
                id: ticket.id,
                ticket_code: ticket.ticketCode,
                qr_code: ticket.qrCode,
                status: ticket.status,
                used_at: ticket.usedAt,
                price: Number(ticket.priceAtPurchase),
                created_at: ticket.createdAt,
                event: {
                    id: ticket.event.id,
                    title: ticket.event.title,
                    start_time: ticket.event.startTime,
                    location: ticket.event.location,
                    banner_image: ticket.event.bannerImage
                },
                ticket_type: {
                    id: ticket.ticketType.id,
                    name: ticket.ticketType.name
                },
                buyer: {
                    id: ticket.user.id,
                    name: ticket.user.fullName,
                    email: ticket.user.email
                },
                seat: ticket.seat ? {
                    room: ticket.seat.room.name,
                    row: ticket.seat.row,
                    number: ticket.seat.number
                } : null
            }
        });
    } catch (error) {
        console.error('Get ticket info error:', error);
        res.status(500).json({
            success: false,
            message: 'Server error fetching ticket info'
        });
    }
};

module.exports = {
    validateQR,
    getTicketInfo
};
