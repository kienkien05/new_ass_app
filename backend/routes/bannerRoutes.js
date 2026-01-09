const express = require('express');
const router = express.Router();
const { getBanners, getPublicBanners, createBanner, updateBanner, deleteBanner, toggleBannerActive } = require('../controllers/bannerController');
const { protect, admin } = require('../middleware/authMiddleware');
const { validate, createBannerRules, updateBannerRules, idParamRules } = require('../middleware/validationMiddleware');

// Public routes
router.get('/public', getPublicBanners);
router.get('/', getBanners);

// Admin routes
router.use(protect);
router.use(admin);

router.post('/', createBannerRules, validate, createBanner);
router.put('/:id', idParamRules, updateBannerRules, validate, updateBanner);
router.delete('/:id', idParamRules, validate, deleteBanner);
router.patch('/:id/toggle', idParamRules, validate, toggleBannerActive);

module.exports = router;
