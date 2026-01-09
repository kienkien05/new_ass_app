const prisma = require('../config/db');

// @desc    Get all banners
// @route   GET /api/banners
// @access  Public
// @desc    Get all banners
// @route   GET /api/banners
// @access  Public
const getBanners = async (req, res) => {
    try {
        const banners = await prisma.banner.findMany({
            orderBy: { priority: 'desc' },
            include: {
                event: {
                    select: {
                        id: true,
                        title: true,
                        slug: true,
                    }
                }
            }
        });

        // Transform to frontend format
        const transformedBanners = banners.map(banner => ({
            id: banner.id.toString(),
            title: banner.title,
            image_url: banner.imageUrl,
            link_url: banner.linkUrl || '',
            event_id: banner.eventId,
            event: banner.event,
            is_active: banner.isActive,
            is_homepage: banner.isHomepage,
            order: banner.priority,
        }));

        res.json({
            success: true,
            data: transformedBanners
        });
    } catch (error) {
        console.error('Get banners error:', error);
        res.status(500).json({
            success: false,
            message: 'Server error fetching banners'
        });
    }
};

// @desc    Get public homepage banners
// @route   GET /api/banners/public
// @access  Public
const getPublicBanners = async (req, res) => {
    try {
        const banners = await prisma.banner.findMany({
            where: {
                isActive: true,
                isHomepage: true,
            },
            orderBy: { priority: 'desc' },
            include: {
                event: {
                    select: {
                        id: true,
                        title: true,
                        slug: true,
                    }
                }
            }
        });

        const transformedBanners = banners.map(banner => ({
            id: banner.id.toString(),
            title: banner.title,
            image_url: banner.imageUrl,
            link_url: banner.linkUrl || '',
            event_id: banner.eventId,
            event: banner.event,
            is_active: banner.isActive,
            is_homepage: banner.isHomepage,
            order: banner.priority,
        }));

        res.json({
            success: true,
            data: transformedBanners
        });
    } catch (error) {
        console.error('Get public banners error:', error);
        res.status(500).json({
            success: false,
            message: 'Server error fetching public banners'
        });
    }
};

// @desc    Create a banner
// @route   POST /api/banners
// @access  Private/Admin
const createBanner = async (req, res) => {
    try {
        const { title, image_url, link_url, event_id, is_active, is_homepage, priority } = req.body;

        if (!title || !image_url) {
            return res.status(400).json({
                success: false,
                message: 'Title and image_url are required'
            });
        }

        const banner = await prisma.banner.create({
            data: {
                title,
                imageUrl: image_url,
                linkUrl: link_url || null,
                eventId: event_id || null,
                isActive: is_active ?? true,
                isHomepage: is_homepage ?? false,
                priority: priority ?? 0,
            }
        });

        res.status(201).json({
            success: true,
            data: {
                id: banner.id.toString(),
                title: banner.title,
                image_url: banner.imageUrl,
                link_url: banner.linkUrl,
                event_id: banner.eventId,
                is_active: banner.isActive,
                is_homepage: banner.isHomepage,
                order: banner.priority,
            }
        });
    } catch (error) {
        console.error('Create banner error:', error);
        res.status(500).json({
            success: false,
            message: 'Server error creating banner'
        });
    }
};

// @desc    Update a banner
// @route   PUT /api/banners/:id
// @access  Private/Admin
const updateBanner = async (req, res) => {
    try {
        const { id } = req.params;
        const { title, image_url, link_url, event_id, is_active, is_homepage, priority } = req.body;

        // Build data object dynamically to avoid overwriting with null/undefined
        const updateData = {};
        if (title !== undefined) updateData.title = title;
        if (image_url !== undefined) updateData.imageUrl = image_url;
        if (link_url !== undefined) updateData.linkUrl = link_url;
        if (event_id !== undefined) updateData.eventId = event_id;
        if (is_active !== undefined) updateData.isActive = is_active;
        if (is_homepage !== undefined) updateData.isHomepage = is_homepage;
        if (priority !== undefined) updateData.priority = priority;

        const banner = await prisma.banner.update({
            where: { id: parseInt(id) },
            data: updateData
        });

        res.json({
            success: true,
            data: {
                id: banner.id.toString(),
                title: banner.title,
                image_url: banner.imageUrl,
                link_url: banner.linkUrl,
                event_id: banner.eventId,
                is_active: banner.isActive,
                is_homepage: banner.isHomepage,
                order: banner.priority,
            }
        });
    } catch (error) {
        console.error('Update banner error:', error);
        res.status(500).json({
            success: false,
            message: 'Server error updating banner'
        });
    }
};

// @desc    Delete a banner
// @route   DELETE /api/banners/:id
// @access  Private/Admin
const deleteBanner = async (req, res) => {
    try {
        const { id } = req.params;

        await prisma.banner.delete({
            where: { id: parseInt(id) }
        });

        res.json({
            success: true,
            message: 'Banner deleted successfully'
        });
    } catch (error) {
        console.error('Delete banner error:', error);
        res.status(500).json({
            success: false,
            message: 'Server error deleting banner'
        });
    }
};

// @desc    Toggle banner active status
// @route   PATCH /api/banners/:id/toggle
// @access  Private/Admin
const toggleBannerActive = async (req, res) => {
    try {
        const { id } = req.params;

        const banner = await prisma.banner.findUnique({
            where: { id: parseInt(id) }
        });

        if (!banner) {
            return res.status(404).json({
                success: false,
                message: 'Banner not found'
            });
        }

        const updatedBanner = await prisma.banner.update({
            where: { id: parseInt(id) },
            data: { isActive: !banner.isActive }
        });

        res.json({
            success: true,
            data: {
                id: updatedBanner.id.toString(),
                title: updatedBanner.title,
                image_url: updatedBanner.imageUrl,
                is_active: updatedBanner.isActive,
                is_homepage: updatedBanner.isHomepage,
            }
        });
    } catch (error) {
        console.error('Toggle banner error:', error);
        res.status(500).json({
            success: false,
            message: 'Server error toggling banner'
        });
    }
};

module.exports = { getBanners, getPublicBanners, createBanner, updateBanner, deleteBanner, toggleBannerActive };
