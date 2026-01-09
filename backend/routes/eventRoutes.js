const express = require('express');
const router = express.Router();
const { getEvents, getEventById, getFeaturedEvents, createEvent, updateEvent, deleteEvent } = require('../controllers/eventController');
const { protect, admin } = require('../middleware/authMiddleware');
const { validate, createEventRules, idParamRules } = require('../middleware/validationMiddleware');

// Public routes
router.get('/', getEvents);
router.get('/featured', getFeaturedEvents);
router.get('/:id', getEventById);

// Admin routes - protected
router.post('/', protect, admin, createEventRules, validate, createEvent);
router.put('/:id', protect, admin, idParamRules, validate, updateEvent);
router.delete('/:id', protect, admin, idParamRules, validate, deleteEvent);

module.exports = router;
