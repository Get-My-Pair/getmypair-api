/**
 * Hub drop-off locations managed by Masteradmin (multiple allowed).
 * Delivery members use these for Hub direction / maps.
 * Customers see them on CareMyPair Self Drop off.
 */
const mongoose = require('mongoose');

const WEEK_DAYS = [
  'monday',
  'tuesday',
  'wednesday',
  'thursday',
  'friday',
  'saturday',
  'sunday',
];

const dayHoursSchema = new mongoose.Schema(
  {
    day: {
      type: String,
      enum: WEEK_DAYS,
      required: true,
    },
    openTime: {
      type: String,
      trim: true,
      default: '09:00',
    },
    closeTime: {
      type: String,
      trim: true,
      default: '18:00',
    },
    isClosed: {
      type: Boolean,
      default: false,
    },
  },
  { _id: false }
);

function defaultWeeklyHours() {
  return WEEK_DAYS.map((day) => ({
    day,
    openTime: '09:00',
    closeTime: '18:00',
    isClosed: false,
  }));
}

const hubSettingsSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      trim: true,
      default: 'GetMyPair Hub',
    },
    /**
     * Optional 2-letter area code used in public order IDs (e.g. AM = Ambattur).
     * When empty, the first two letters of `name` are used.
     */
    areaCode: {
      type: String,
      trim: true,
      uppercase: true,
      maxlength: 2,
      default: '',
    },
    address: {
      type: String,
      trim: true,
      default: '',
    },
    city: {
      type: String,
      trim: true,
      default: '',
    },
    state: {
      type: String,
      trim: true,
      default: '',
    },
    pincode: {
      type: String,
      trim: true,
      default: '',
    },
    lat: {
      type: Number,
      default: null,
    },
    lng: {
      type: Number,
      default: null,
    },
    notes: {
      type: String,
      trim: true,
      default: '',
    },
    weeklyHours: {
      type: [dayHoursSchema],
      default: defaultWeeklyHours,
    },
    isActive: {
      type: Boolean,
      default: true,
      index: true,
    },
    updatedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'AdminMaster',
      default: null,
    },
  },
  { timestamps: true }
);

module.exports = mongoose.model('HubSettings', hubSettingsSchema);
module.exports.WEEK_DAYS = WEEK_DAYS;
module.exports.defaultWeeklyHours = defaultWeeklyHours;
