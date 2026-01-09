const prisma = require('../config/db');

// @desc    Fetch all events
// @route   GET /api/events
// @access  Public
const getEvents = async (req, res) => {
    try {
        const pageSize = Number(req.query.limit) || 10;
        const page = Number(req.query.page) || 1;
        const category = req.query.category;
        const search = req.query.search;

        // Build where clause
        const where = {};

        if (category) {
            where.category = {
                contains: category,
                mode: 'insensitive'
            };
        }

        if (search) {
            where.title = {
                contains: search,
                mode: 'insensitive'
            };
        }

        // Get total count
        const count = await prisma.event.count({ where });

        // Get events with pagination
        const events = await prisma.event.findMany({
            where,
            take: pageSize,
            skip: pageSize * (page - 1),
            orderBy: { createdAt: 'desc' },
            include: {
                ticketTypes: {
                    select: {
                        id: true,
                        name: true,
                        price: true,
                        quantityTotal: true,
                        quantitySold: true,
                        status: true,
                    }
                },
                rooms: true
            }
        });

        // Transform to API response format
        const transformedEvents = events.map(event => ({
            id: event.id,
            title: event.title,
            slug: event.slug,
            description: event.description,
            location: event.location,
            start_time: event.startTime,
            end_time: event.endTime,
            banner_image: event.bannerImage,
            thumbnail_image: event.thumbnailImage,
            category: event.category,
            status: event.status,
            is_hot: event.isHot,
            created_at: event.createdAt,
            ticket_types: event.ticketTypes.map(tt => ({
                id: tt.id,
                name: tt.name,
                price: Number(tt.price),
                quantity_total: tt.quantityTotal,
                quantity_sold: tt.quantitySold,
                status: tt.status,
            })),
            rooms: event.rooms
        }));

        res.json({
            success: true,
            data: transformedEvents,
            pagination: {
                page,
                pages: Math.ceil(count / pageSize),
                total: count
            }
        });
    } catch (error) {
        console.error('Get events error:', error);
        res.status(500).json({
            success: false,
            message: 'Server error fetching events'
        });
    }
};

// @desc    Fetch single event
// @route   GET /api/events/:id
// @access  Public
const getEventById = async (req, res) => {
    try {
        const event = await prisma.event.findUnique({
            where: { id: req.params.id },
            include: {
                ticketTypes: true,
                rooms: true
            }
        });

        if (!event) {
            return res.status(404).json({
                success: false,
                message: 'Event not found'
            });
        }

        // Transform response
        res.json({
            success: true,
            data: {
                id: event.id,
                title: event.title,
                slug: event.slug,
                description: event.description,
                content: event.content,
                location: event.location,
                start_time: event.startTime,
                end_time: event.endTime,
                banner_image: event.bannerImage,
                thumbnail_image: event.thumbnailImage,
                category: event.category,
                status: event.status,
                is_hot: event.isHot,
                created_at: event.createdAt,
                ticket_types: event.ticketTypes.map(tt => ({
                    id: tt.id,
                    name: tt.name,
                    description: tt.description,
                    price: Number(tt.price),
                    quantity_total: tt.quantityTotal,
                    quantity_sold: tt.quantitySold,
                    status: tt.status,
                })),
                rooms: event.rooms
            }
        });

    } catch (error) {
        console.error('Get event by id error:', error);
        res.status(500).json({
            success: false,
            message: 'Server error fetching event'
        });
    }
};

// @desc    Fetch featured events
// @route   GET /api/events/featured
// @access  Public
const getFeaturedEvents = async (req, res) => {
    try {
        const events = await prisma.event.findMany({
            where: {
                isHot: true,
                status: 'published'
            },
            take: 5,
            orderBy: { createdAt: 'desc' }
        });

        const transformedEvents = events.map(event => ({
            id: event.id,
            title: event.title,
            slug: event.slug,
            description: event.description,
            location: event.location,
            start_time: event.startTime,
            end_time: event.endTime,
            banner_image: event.bannerImage,
            thumbnail_image: event.thumbnailImage,
            category: event.category,
            is_hot: event.isHot,
        }));

        res.json({ success: true, data: transformedEvents });
    } catch (error) {
        console.error('Get featured events error:', error);
        res.status(500).json({
            success: false,
            message: 'Server error fetching featured events'
        });
    }
};

// @desc    Create an event with ticket types and optional banner
// @route   POST /api/events
// @access  Private/Admin
const createEvent = async (req, res) => {
    try {
        const {
            title,
            slug,
            description,
            content,
            location,
            start_time,
            end_time,
            banner_image,
            thumbnail_image,
            category,
            is_hot,
            status,
            room_ids,
            // NEW: Inline ticket types
            ticket_types,
            // NEW: Banner options
            create_banner,
            banner_is_homepage,
            banner_priority
        } = req.body;

        if (!title) {
            return res.status(400).json({
                success: false,
                message: 'Title is required'
            });
        }

        // Auto-generate slug from title if not provided
        const generatedSlug = slug || title
            .toLowerCase()
            .normalize('NFD')
            .replace(/[\u0300-\u036f]/g, '')
            .replace(/[^a-z0-9]+/g, '-')
            .replace(/^-+|-+$/g, '')
            + '-' + Date.now();

        // Use transaction to ensure atomicity
        const result = await prisma.$transaction(async (tx) => {
            // 1. Create Event
            const event = await tx.event.create({
                data: {
                    title,
                    slug: generatedSlug,
                    description: description || null,
                    content: content || null,
                    location: location || null,
                    startTime: start_time ? new Date(start_time) : null,
                    endTime: end_time ? new Date(end_time) : null,
                    bannerImage: banner_image || null,
                    thumbnailImage: thumbnail_image || null,
                    category: category || null,
                    status: status || 'draft',
                    isHot: is_hot || false,
                    rooms: room_ids && room_ids.length > 0 ? {
                        connect: room_ids.map(id => ({ id }))
                    } : undefined
                }
            });

            // 2. Create Ticket Types (if provided)
            let createdTicketTypes = [];
            if (ticket_types && ticket_types.length > 0) {
                for (const tt of ticket_types) {
                    const ticketType = await tx.ticketType.create({
                        data: {
                            eventId: event.id,
                            name: tt.name || 'Standard',
                            description: tt.description || null,
                            price: tt.price || 0,
                            originalPrice: tt.original_price || null,
                            quantityTotal: tt.quantity_total || 100,
                            quantitySold: 0,
                            status: 'active'
                        }
                    });
                    createdTicketTypes.push(ticketType);
                }
            }

            // 3. Create Banner (if requested)
            let createdBanner = null;
            if (create_banner && banner_image) {
                createdBanner = await tx.banner.create({
                    data: {
                        title: title,
                        imageUrl: banner_image,
                        linkUrl: `/events/${event.id}`,
                        eventId: event.id,
                        isActive: banner_is_homepage || false,
                        priority: banner_priority || 0
                    }
                });
            }

            // Return event with relations
            const fullEvent = await tx.event.findUnique({
                where: { id: event.id },
                include: {
                    rooms: true,
                    ticketTypes: true,
                    banners: true
                }
            });

            return { event: fullEvent, ticketTypes: createdTicketTypes, banner: createdBanner };
        });

        // Transform response
        const event = result.event;
        res.status(201).json({
            success: true,
            data: {
                id: event.id,
                title: event.title,
                slug: event.slug,
                description: event.description,
                location: event.location,
                start_time: event.startTime,
                end_time: event.endTime,
                banner_image: event.bannerImage,
                category: event.category,
                status: event.status,
                is_hot: event.isHot,
                rooms: event.rooms,
                ticket_types: event.ticketTypes.map(tt => ({
                    id: tt.id,
                    name: tt.name,
                    price: Number(tt.price),
                    quantity_total: tt.quantityTotal,
                    quantity_sold: tt.quantitySold,
                    status: tt.status
                })),
                banner_created: !!result.banner
            }
        });
    } catch (error) {
        console.error('Create event error:', error);

        if (error.code === 'P2002') {
            return res.status(400).json({
                success: false,
                message: 'Event with this slug already exists'
            });
        }

        res.status(500).json({
            success: false,
            message: 'Server error creating event'
        });
    }
};

// @desc    Update an event
// @route   PUT /api/events/:id
// @access  Private/Admin
const updateEvent = async (req, res) => {
    try {
        const {
            title,
            slug,
            description,
            content,
            location,
            start_time,
            end_time,
            banner_image,
            thumbnail_image,
            category,
            is_hot,
            room_ids,
            status
        } = req.body;

        const event = await prisma.event.update({
            where: { id: req.params.id },
            data: {
                title,
                slug,
                description,
                content,
                location,
                startTime: start_time ? new Date(start_time) : null,
                endTime: end_time ? new Date(end_time) : null,
                bannerImage: banner_image,
                thumbnailImage: thumbnail_image,
                category,
                isHot: is_hot,
                status,
                rooms: room_ids ? {
                    set: room_ids.map(id => ({ id })) // Replace all
                } : undefined
            },
            include: { rooms: true }
        });

        res.json({
            success: true,
            data: event
        });
    } catch (error) {
        console.error('Update event error:', error);
        res.status(500).json({
            success: false,
            message: 'Server error updating event'
        });
    }
};

// @desc    Delete an event
// @route   DELETE /api/events/:id
// @access  Private/Admin
const deleteEvent = async (req, res) => {
    try {
        await prisma.event.delete({
            where: { id: req.params.id }
        });

        res.json({
            success: true,
            message: 'Event deleted'
        });
    } catch (error) {
        console.error('Delete event error:', error);
        res.status(500).json({
            success: false,
            message: 'Server error deleting event'
        });
    }
};

module.exports = { getEvents, getEventById, getFeaturedEvents, createEvent, updateEvent, deleteEvent };
