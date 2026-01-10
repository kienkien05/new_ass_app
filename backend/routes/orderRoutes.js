const express = require('express');
const router = express.Router();
const { createOrder, getAllTickets, getRemainingTickets } = require('../controllers/orderController');
const { protect, admin } = require('../middleware/authMiddleware');

router.route('/').post(protect, createOrder);
router.route('/tickets').get(protect, admin, getAllTickets);
router.route('/remaining/:eventId').get(protect, getRemainingTickets);

module.exports = router;
