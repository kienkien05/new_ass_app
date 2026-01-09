const mongoose = require('mongoose');

const ticketSchema = mongoose.Schema({
    order_id: {
        type: mongoose.Schema.Types.ObjectId,
        required: true,
        ref: 'Order',
    },
    ticket_type_id: {
        type: mongoose.Schema.Types.ObjectId,
        required: true,
        ref: 'TicketType',
    },
    user_id: {
        type: mongoose.Schema.Types.ObjectId,
        required: true,
        ref: 'User',
    },
    event_id: {
        type: mongoose.Schema.Types.ObjectId, // Denormalized for query speed
        required: true,
        ref: 'Event',
    },
    ticket_code: {
        type: String,
        required: true,
        unique: true,
    },
    status: {
        type: String,
        enum: ['valid', 'used', 'cancelled'],
        default: 'valid',
    },
    used_at: {
        type: Date,
    },
    price_at_purchase: {
        type: Number,
        required: true,
    },
}, {
    timestamps: { createdAt: 'created_at', updatedAt: 'updated_at' }
});

const Ticket = mongoose.model('Ticket', ticketSchema);

module.exports = Ticket;
