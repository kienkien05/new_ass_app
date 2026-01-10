const express = require('express');
const router = express.Router();
const { validateQR, getTicketInfo } = require('../controllers/ticketController');
const { protect, admin } = require('../middleware/authMiddleware');

// QR validation - requires admin/staff access
router.post('/validate-qr', protect, admin, validateQR);
router.get('/info/:code', protect, admin, getTicketInfo);

module.exports = router;
