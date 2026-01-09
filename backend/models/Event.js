const mongoose = require('mongoose');

const eventSchema = mongoose.Schema({
    title: {
        type: String,
        required: true,
    },
    slug: {
        type: String,
        required: true,
        unique: true,
    },
    description: {
        type: String,
    },
    content: {
        type: String, // HTML content
    },
    location: {
        type: String,
    },
    start_time: {
        type: Date,
    },
    end_time: {
        type: Date,
    },
    banner_image: {
        type: String,
    },
    thumbnail_image: {
        type: String,
    },
    category: {
        type: String,
    },
    status: {
        type: String,
        enum: ['draft', 'published', 'cancelled', 'completed'],
        default: 'draft',
    },
    is_hot: {
        type: Boolean,
        default: false,
    },
}, {
    timestamps: { createdAt: 'created_at', updatedAt: 'updated_at' }
});

const Event = mongoose.model('Event', eventSchema);

module.exports = Event;
