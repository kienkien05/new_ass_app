const prisma = require('../config/db');

// @desc    Get all users (Admin)
// @route   GET /api/admin/users
// @access  Private/Admin
const getAllUsers = async (req, res) => {
    try {
        const { search, role, is_active, page = 1, limit = 10 } = req.query;
        const skip = (parseInt(page) - 1) * parseInt(limit);

        // Build where clause
        const where = {};

        if (search) {
            where.OR = [
                { fullName: { contains: search, mode: 'insensitive' } },
                { email: { contains: search, mode: 'insensitive' } },
                { phoneNumber: { contains: search, mode: 'insensitive' } }
            ];
        }

        if (role) {
            where.role = role;
        }

        if (is_active !== undefined) {
            where.isActive = is_active === 'true';
        }

        // Count total
        const total = await prisma.user.count({ where });

        // Fetch users
        const users = await prisma.user.findMany({
            where,
            select: {
                id: true,
                email: true,
                fullName: true,
                avatarUrl: true,
                role: true,
                isActive: true,
                dateOfBirth: true,
                phoneNumber: true,
                facebookUrl: true,
                gender: true,
                address: true,
                createdAt: true,
                updatedAt: true,
                _count: {
                    select: { tickets: true, orders: true }
                }
            },
            orderBy: { createdAt: 'desc' },
            skip,
            take: parseInt(limit)
        });

        // Transform response
        const transformedUsers = users.map(u => ({
            id: u.id,
            email: u.email,
            full_name: u.fullName,
            avatar_url: u.avatarUrl,
            role: u.role,
            is_active: u.isActive,
            date_of_birth: u.dateOfBirth,
            phone_number: u.phoneNumber,
            facebook_url: u.facebookUrl,
            gender: u.gender,
            address: u.address,
            created_at: u.createdAt,
            updated_at: u.updatedAt,
            ticket_count: u._count.tickets,
            order_count: u._count.orders
        }));

        res.json({
            success: true,
            data: transformedUsers,
            pagination: {
                page: parseInt(page),
                limit: parseInt(limit),
                total,
                totalPages: Math.ceil(total / parseInt(limit))
            }
        });
    } catch (error) {
        console.error('Get all users error:', error);
        res.status(500).json({
            success: false,
            message: 'Server error fetching users'
        });
    }
};

// @desc    Get user by ID with purchase history (Admin)
// @route   GET /api/admin/users/:id
// @access  Private/Admin
const getUserById = async (req, res) => {
    try {
        const { id } = req.params;

        const user = await prisma.user.findUnique({
            where: { id },
            select: {
                id: true,
                email: true,
                fullName: true,
                avatarUrl: true,
                role: true,
                isActive: true,
                dateOfBirth: true,
                phoneNumber: true,
                facebookUrl: true,
                gender: true,
                address: true,
                createdAt: true,
                updatedAt: true,
                tickets: {
                    include: {
                        event: {
                            select: { id: true, title: true, startTime: true }
                        },
                        ticketType: {
                            select: { id: true, name: true }
                        }
                    },
                    orderBy: { createdAt: 'desc' },
                    take: 50
                },
                orders: {
                    orderBy: { createdAt: 'desc' },
                    take: 20
                }
            }
        });

        if (!user) {
            return res.status(404).json({
                success: false,
                message: 'User not found'
            });
        }

        res.json({
            success: true,
            data: {
                id: user.id,
                email: user.email,
                full_name: user.fullName,
                avatar_url: user.avatarUrl,
                role: user.role,
                is_active: user.isActive,
                date_of_birth: user.dateOfBirth,
                phone_number: user.phoneNumber,
                facebook_url: user.facebookUrl,
                gender: user.gender,
                address: user.address,
                created_at: user.createdAt,
                updated_at: user.updatedAt,
                tickets: user.tickets.map(t => ({
                    id: t.id,
                    ticket_code: t.ticketCode,
                    status: t.status,
                    price: Number(t.priceAtPurchase),
                    created_at: t.createdAt,
                    event: {
                        id: t.event.id,
                        title: t.event.title,
                        start_time: t.event.startTime
                    },
                    ticket_type: {
                        id: t.ticketType.id,
                        name: t.ticketType.name
                    }
                })),
                orders: user.orders.map(o => ({
                    id: o.id,
                    total_amount: Number(o.totalAmount),
                    status: o.status,
                    created_at: o.createdAt
                }))
            }
        });
    } catch (error) {
        console.error('Get user by id error:', error);
        res.status(500).json({
            success: false,
            message: 'Server error fetching user'
        });
    }
};

// @desc    Update user (Admin)
// @route   PUT /api/admin/users/:id
// @access  Private/Admin
const updateUser = async (req, res) => {
    try {
        const { id } = req.params;
        const { full_name, email, role, is_active, date_of_birth, phone_number, facebook_url, gender, address } = req.body;

        // Check if user exists
        const existingUser = await prisma.user.findUnique({ where: { id } });
        if (!existingUser) {
            return res.status(404).json({
                success: false,
                message: 'User not found'
            });
        }

        // Check email uniqueness
        if (email && email !== existingUser.email) {
            const emailExists = await prisma.user.findUnique({ where: { email } });
            if (emailExists) {
                return res.status(400).json({
                    success: false,
                    message: 'Email already in use'
                });
            }
        }

        // Update user
        const updatedUser = await prisma.user.update({
            where: { id },
            data: {
                ...(full_name && { fullName: full_name }),
                ...(email && { email }),
                ...(role && { role }),
                ...(is_active !== undefined && { isActive: is_active }),
                ...(date_of_birth && { dateOfBirth: new Date(date_of_birth) }),
                ...(phone_number !== undefined && { phoneNumber: phone_number }),
                ...(facebook_url !== undefined && { facebookUrl: facebook_url }),
                ...(gender !== undefined && { gender }),
                ...(address !== undefined && { address })
            }
        });

        res.json({
            success: true,
            data: {
                id: updatedUser.id,
                email: updatedUser.email,
                full_name: updatedUser.fullName,
                role: updatedUser.role,
                is_active: updatedUser.isActive
            }
        });
    } catch (error) {
        console.error('Update user error:', error);
        res.status(500).json({
            success: false,
            message: 'Server error updating user'
        });
    }
};

// @desc    Delete user (Admin)
// @route   DELETE /api/admin/users/:id
// @access  Private/Admin
const deleteUser = async (req, res) => {
    try {
        const { id } = req.params;

        // Check if user exists
        const user = await prisma.user.findUnique({ where: { id } });
        if (!user) {
            return res.status(404).json({
                success: false,
                message: 'User not found'
            });
        }

        // Prevent deleting admin users
        if (user.role === 'admin') {
            return res.status(400).json({
                success: false,
                message: 'Cannot delete admin users'
            });
        }

        // Delete user (cascade will handle related records if configured)
        await prisma.user.delete({ where: { id } });

        res.json({
            success: true,
            message: 'User deleted successfully'
        });
    } catch (error) {
        console.error('Delete user error:', error);
        res.status(500).json({
            success: false,
            message: 'Server error deleting user'
        });
    }
};

// @desc    Toggle user active status (Admin)
// @route   PATCH /api/admin/users/:id/toggle-status
// @access  Private/Admin
const toggleUserStatus = async (req, res) => {
    try {
        const { id } = req.params;

        const user = await prisma.user.findUnique({ where: { id } });
        if (!user) {
            return res.status(404).json({
                success: false,
                message: 'User not found'
            });
        }

        // Prevent deactivating self
        if (req.user.id === id) {
            return res.status(400).json({
                success: false,
                message: 'Cannot deactivate your own account'
            });
        }

        const updatedUser = await prisma.user.update({
            where: { id },
            data: { isActive: !user.isActive }
        });

        res.json({
            success: true,
            data: {
                id: updatedUser.id,
                is_active: updatedUser.isActive
            },
            message: updatedUser.isActive ? 'User activated' : 'User deactivated'
        });
    } catch (error) {
        console.error('Toggle user status error:', error);
        res.status(500).json({
            success: false,
            message: 'Server error toggling user status'
        });
    }
};

module.exports = {
    getAllUsers,
    getUserById,
    updateUser,
    deleteUser,
    toggleUserStatus
};
