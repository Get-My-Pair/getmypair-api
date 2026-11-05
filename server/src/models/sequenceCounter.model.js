/**
 * Atomic sequence counters (e.g. public service / order codes).
 */
const mongoose = require('mongoose');

const sequenceCounterSchema = new mongoose.Schema(
  {
    _id: { type: String, required: true },
    seq: { type: Number, default: 0 },
  },
  { versionKey: false }
);

module.exports = mongoose.model('SequenceCounter', sequenceCounterSchema);
