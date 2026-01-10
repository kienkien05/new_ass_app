const express = require('express');
const router = express.Router();
const { getRevenue, exportRevenueExcel } = require('../controllers/reportController');
const { protect, admin } = require('../middleware/authMiddleware');

// All routes require admin authentication
router.use(protect, admin);

// Revenue reports
router.get('/revenue', getRevenue);
router.get('/revenue/export', exportRevenueExcel);

module.exports = router;
