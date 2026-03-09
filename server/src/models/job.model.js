/**
 * Job schema – cobblerId, status, price, etc. (for dashboard aggregation)
 */
const mongoose = require('mongoose');

const jobSchema = new mongoose.Schema(
    {
        cobblerId: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'User',
            required: true,
            index: true,
        },
        status: {
            type: String,
            enum: ['new', 'accepted', 'completed', 'cancelled'],
            default: 'new',
            index: true,
        },
        price: { type: Number, default: 0 },
    },
    { timestamps: true }
);

jobSchema.index({ cobblerId: 1, status: 1 });
const Job = mongoose.model('Job', jobSchema);
module.exports = Job;
