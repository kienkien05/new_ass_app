const express = require('express');
const router = express.Router();
const { getTicketTypes, createTicketType, updateTicketType, deleteTicketType } = require('../controllers/ticketTypeController');
const { protect, admin } = require('../middleware/authMiddleware');

router.get('/', getTicketTypes);
router.post('/', protect, admin, createTicketType);
router.put('/:id', protect, admin, updateTicketType);
router.delete('/:id', protect, admin, deleteTicketType);

module.exports = router;
