const express = require('express');
const router = express.Router();
const { validateQR, getTicketInfo, resendTicketEmails } = require('../controllers/ticketController');
const { createManualTicket, getMyTickets } = require('../controllers/orderController');
const { protect, admin } = require('../middleware/authMiddleware');

// QR validation - requires admin/staff access
router.post('/validate-qr', protect, admin, validateQR);
router.get('/info/:code', protect, admin, getTicketInfo);
router.post('/resend-email', protect, admin, resendTicketEmails);

// Manual ticket creation
router.post('/create-manual', protect, admin, createManualTicket);

// User's tickets
router.get('/my-tickets', protect, getMyTickets);

module.exports = router;
