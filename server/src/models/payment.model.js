/**
 * Payment schema – jobId, cobblerId, amount (for dashboard earnings)
 */
const mongoose = require('mongoose');

const paymentSchema = new mongoose.Schema(
    {
        jobId: { type: mongoose.Schema.Types.ObjectId, ref: 'Job', index: true },
        cobblerId: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'User',
            required: true,
            index: true,
        },
        amount: { type: Number, required: true, default: 0 },
        paymentStatus: {
            type: String,
            enum: ['pending', 'completed', 'failed'],
            default: 'pending',
        },
    },
    { timestamps: true }
);

paymentSchema.index({ cobblerId: 1, createdAt: -1 });
const Payment = mongoose.model('Payment', paymentSchema);
module.exports = Payment;
