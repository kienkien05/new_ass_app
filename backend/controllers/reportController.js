const prisma = require('../config/db');
const { generateRevenueReport } = require('../utils/excelExport');

// @desc    Get revenue statistics
// @route   GET /api/admin/reports/revenue
// @access  Private/Admin
const getRevenue = async (req, res) => {
    try {
        const { start_date, end_date, group_by = 'day', event_id } = req.query;

        // Build date filter
        const dateFilter = {};
        if (start_date) {
            dateFilter.gte = new Date(start_date);
        }
        if (end_date) {
            const endDate = new Date(end_date);
            endDate.setHours(23, 59, 59, 999);
            dateFilter.lte = endDate;
        }

        // Default to last 30 days if no dates provided
        if (!start_date && !end_date) {
            const now = new Date();
            dateFilter.gte = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
            dateFilter.lte = now;
        }

        // Fetch orders with tickets
        const orders = await prisma.order.findMany({
            where: {
                status: 'paid',
                createdAt: dateFilter,
                ...(event_id && {
                    tickets: {
                        some: { eventId: event_id }
                    }
                })
            },
            include: {
                tickets: {
                    include: {
                        event: { select: { id: true, title: true } }
                    }
                }
            },
            orderBy: { createdAt: 'asc' }
        });

        // Aggregate data based on group_by
        const aggregated = {};
        const eventStats = {};

        orders.forEach(order => {
            let dateKey;
            const orderDate = new Date(order.createdAt);

            switch (group_by) {
                case 'week':
                    const weekStart = new Date(orderDate);
                    weekStart.setDate(weekStart.getDate() - weekStart.getDay());
                    dateKey = weekStart.toISOString().split('T')[0];
                    break;
                case 'month':
                    dateKey = `${orderDate.getFullYear()}-${String(orderDate.getMonth() + 1).padStart(2, '0')}`;
                    break;
                case 'year':
                    dateKey = String(orderDate.getFullYear());
                    break;
                default: // day
                    dateKey = orderDate.toISOString().split('T')[0];
            }

            if (!aggregated[dateKey]) {
                aggregated[dateKey] = { revenue: 0, tickets: 0, orders: 0 };
            }

            aggregated[dateKey].revenue += Number(order.totalAmount);
            aggregated[dateKey].tickets += order.tickets.length;
            aggregated[dateKey].orders += 1;

            // Event stats
            order.tickets.forEach(ticket => {
                const eventId = ticket.event.id;
                if (!eventStats[eventId]) {
                    eventStats[eventId] = {
                        id: eventId,
                        title: ticket.event.title,
                        tickets: 0,
                        revenue: 0
                    };
                }
                eventStats[eventId].tickets += 1;
                eventStats[eventId].revenue += Number(ticket.priceAtPurchase);
            });
        });

        // Convert to arrays
        const timeSeriesData = Object.entries(aggregated).map(([date, data]) => ({
            date,
            ...data
        }));

        const eventData = Object.values(eventStats).sort((a, b) => b.revenue - a.revenue);

        // Calculate totals
        const totalRevenue = timeSeriesData.reduce((sum, d) => sum + d.revenue, 0);
        const totalTickets = timeSeriesData.reduce((sum, d) => sum + d.tickets, 0);
        const totalOrders = timeSeriesData.reduce((sum, d) => sum + d.orders, 0);

        res.json({
            success: true,
            data: {
                summary: {
                    total_revenue: totalRevenue,
                    total_tickets: totalTickets,
                    total_orders: totalOrders,
                    period_start: dateFilter.gte,
                    period_end: dateFilter.lte
                },
                time_series: timeSeriesData,
                by_event: eventData.slice(0, 10) // Top 10 events
            }
        });
    } catch (error) {
        console.error('Get revenue error:', error);
        res.status(500).json({
            success: false,
            message: 'Server error fetching revenue data'
        });
    }
};

// @desc    Export revenue report as Excel
// @route   GET /api/admin/reports/revenue/export
// @access  Private/Admin
const exportRevenueExcel = async (req, res) => {
    try {
        const { start_date, end_date } = req.query;

        // Build date filter
        const dateFilter = {};
        if (start_date) {
            dateFilter.gte = new Date(start_date);
        }
        if (end_date) {
            const endDate = new Date(end_date);
            endDate.setHours(23, 59, 59, 999);
            dateFilter.lte = endDate;
        }

        // Default to last 30 days
        if (!start_date && !end_date) {
            const now = new Date();
            dateFilter.gte = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
            dateFilter.lte = now;
        }

        // Fetch data
        const tickets = await prisma.ticket.findMany({
            where: {
                createdAt: dateFilter,
                order: { status: 'paid' }
            },
            include: {
                event: { select: { title: true } }
            },
            orderBy: { createdAt: 'asc' }
        });

        // Group by date and event
        const grouped = {};
        tickets.forEach(ticket => {
            const dateKey = ticket.createdAt.toISOString().split('T')[0];
            const eventTitle = ticket.event.title;
            const key = `${dateKey}|${eventTitle}`;

            if (!grouped[key]) {
                grouped[key] = {
                    date: dateKey,
                    eventTitle,
                    ticketCount: 0,
                    revenue: 0
                };
            }
            grouped[key].ticketCount += 1;
            grouped[key].revenue += Number(ticket.priceAtPurchase);
        });

        const reportData = Object.values(grouped).sort((a, b) =>
            a.date.localeCompare(b.date) || a.eventTitle.localeCompare(b.eventTitle)
        );

        // Generate Excel
        const buffer = await generateRevenueReport(reportData);

        // Send file
        const filename = `revenue_report_${new Date().toISOString().split('T')[0]}.xlsx`;
        res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
        res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
        res.send(buffer);

    } catch (error) {
        console.error('Export revenue error:', error);
        res.status(500).json({
            success: false,
            message: 'Server error exporting revenue data'
        });
    }
};

module.exports = {
    getRevenue,
    exportRevenueExcel
};
