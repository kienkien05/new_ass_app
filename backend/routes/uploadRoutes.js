const express = require('express');
const router = express.Router();
const upload = require('../middleware/uploadMiddleware');
const { protect, admin } = require('../middleware/authMiddleware');

// Protected - only admin can upload
router.post('/', protect, admin, upload.single('image'), (req, res) => {
    if (!req.file) {
        return res.status(400).send({ message: 'No file uploaded' });
    }

    // Cloudinary returns the URL in file.path
    res.send({
        status: 'success',
        imagePath: req.file.path
    });
});

module.exports = router;
