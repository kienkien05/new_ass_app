const mongoose = require('mongoose');

const ticketTypeSchema = mongoose.Schema({
    event_id: {
        type: mongoose.Schema.Types.ObjectId,
        required: true,
        ref: 'Event',
    },
    name: {
        type: String,
        required: true,
    },
    description: {
        type: String,
    },
    price: {
        type: Number,
        required: true,
    },
    original_price: {
        type: Number,
    },
    quantity_total: {
        type: Number,
        required: true,
    },
    quantity_sold: {
        type: Number,
        required: true,
        default: 0,
    },
    status: {
        type: String,
        enum: ['active', 'sold_out', 'hidden'],
        default: 'active',
    },
}, {
    timestamps: false // The requirement didn't specify timestamps for this table explicitly
});

const TicketType = mongoose.model('TicketType', ticketTypeSchema);

module.exports = TicketType;
