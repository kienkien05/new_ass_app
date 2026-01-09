const express = require('express');
const router = express.Router();
const {
    getRooms, createRoom, updateRoom, deleteRoom,
    toggleRoomActive, toggleSeatActive, updateRoomSeats
} = require('../controllers/roomController');
const { protect, admin } = require('../middleware/authMiddleware');
const { validate, createRoomRules, idParamRules } = require('../middleware/validationMiddleware');

// Public routes (for ticket booking)
router.get('/', getRooms);

// Admin routes
router.use(protect);
router.use(admin);

router.post('/', createRoomRules, validate, createRoom);
router.put('/:id', idParamRules, validate, updateRoom);
router.delete('/:id', idParamRules, validate, deleteRoom);
router.put('/:id/seats', idParamRules, validate, updateRoomSeats);
router.patch('/:id/toggle', idParamRules, validate, toggleRoomActive);
router.patch('/:roomId/seats/:seatId/toggle', toggleSeatActive);

module.exports = router;
