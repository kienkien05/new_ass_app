const { body, param, query, validationResult } = require('express-validator');

// Middleware to check validation result
const validate = (req, res, next) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
        return res.status(400).json({
            success: false,
            message: 'Validation failed',
            errors: errors.array().map(err => ({
                field: err.path,
                message: err.msg
            }))
        });
    }
    next();
};

// Auth validation rules
const registerRules = [
    body('full_name')
        .trim()
        .notEmpty().withMessage('Tên không được để trống')
        .isLength({ min: 2, max: 100 }).withMessage('Tên phải từ 2-100 ký tự'),
    body('email')
        .trim()
        .notEmpty().withMessage('Email không được để trống')
        .isEmail().withMessage('Email không hợp lệ')
        .normalizeEmail(),
    body('password')
        .notEmpty().withMessage('Mật khẩu không được để trống')
        .isLength({ min: 6 }).withMessage('Mật khẩu phải ít nhất 6 ký tự')
        .matches(/\d/).withMessage('Mật khẩu phải chứa ít nhất 1 số'),
];

const loginRules = [
    body('email')
        .trim()
        .notEmpty().withMessage('Email không được để trống')
        .isEmail().withMessage('Email không hợp lệ'),
    body('password')
        .notEmpty().withMessage('Mật khẩu không được để trống'),
];

// Event validation rules
const createEventRules = [
    body('title')
        .trim()
        .notEmpty().withMessage('Tiêu đề không được để trống')
        .isLength({ min: 2, max: 200 }).withMessage('Tiêu đề phải từ 2-200 ký tự'),
    body('description')
        .optional()
        .trim(),
    body('category')
        .optional()
        .isIn(['Music', 'Tech', 'Food', 'Business', 'Sports', 'Art', 'Education', 'concert', 'sports', 'theater', 'conference', 'festival', 'exhibition', 'other', ''])
        .withMessage('Danh mục không hợp lệ'),
    body('location')
        .optional()
        .trim(),
    body('start_time')
        .optional({ values: 'falsy' }),
    body('end_time')
        .optional({ values: 'falsy' }),
];

// Banner validation rules
const createBannerRules = [
    body('title')
        .trim()
        .notEmpty().withMessage('Tiêu đề không được để trống')
        .isLength({ max: 200 }).withMessage('Tiêu đề tối đa 200 ký tự'),
    body('image_url')
        .notEmpty().withMessage('URL hình ảnh không được để trống'),
    body('is_active')
        .optional()
        .isBoolean().withMessage('is_active phải là boolean'),
    body('is_homepage')
        .optional()
        .isBoolean().withMessage('is_homepage phải là boolean'),
    body('priority')
        .optional()
        .isInt({ min: 0 }).withMessage('priority phải là số nguyên >= 0'),
];

// Order validation rules
const createOrderRules = [
    body('eventId')
        .notEmpty().withMessage('Event ID không được để trống'),
    body('tickets')
        .isArray({ min: 1 }).withMessage('Phải có ít nhất 1 vé'),
    body('tickets.*.ticketTypeId')
        .notEmpty().withMessage('Ticket type ID không được để trống'),
    body('tickets.*.quantity')
        .isInt({ min: 1, max: 10 }).withMessage('Số lượng vé phải từ 1-10'),
];

// Room validation rules
const createRoomRules = [
    body('name')
        .trim()
        .notEmpty().withMessage('Tên phòng không được để trống')
        .isLength({ max: 100 }).withMessage('Tên phòng tối đa 100 ký tự'),
    body('rows')
        .isInt({ min: 1, max: 26 }).withMessage('Số hàng phải từ 1-26'),
    body('seatsPerRow')
        .isInt({ min: 1, max: 50 }).withMessage('Số ghế mỗi hàng phải từ 1-50'),
];

// ID parameter validation
const idParamRules = [
    param('id')
        .notEmpty().withMessage('ID không được để trống'),
];

module.exports = {
    validate,
    registerRules,
    loginRules,
    createEventRules,
    createBannerRules,
    createOrderRules,
    createRoomRules,
    idParamRules,
};
