const express = require('express');
const router = express.Router();
const {
    getAllUsers,
    getUserById,
    updateUser,
    deleteUser,
    toggleUserStatus
} = require('../controllers/userController');
const { protect, admin } = require('../middleware/authMiddleware');

// All routes require admin authentication
router.use(protect, admin);

// User management routes
router.get('/', getAllUsers);
router.get('/:id', getUserById);
router.put('/:id', updateUser);
router.delete('/:id', deleteUser);
router.patch('/:id/toggle-status', toggleUserStatus);

module.exports = router;
