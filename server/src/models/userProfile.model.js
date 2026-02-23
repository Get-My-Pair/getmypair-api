const mongoose = require('mongoose');

const addressSchema = new mongoose.Schema(
    {
        addressLine1: {
            type: String,
            required: true,
            trim: true,
            maxlength: 500,
        },
        city: {
            type: String,
            required: true,
            trim: true,
            maxlength: 100,
        },
        state: {
            type: String,
            required: true,
            trim: true,
            maxlength: 100,
        },
        pincode: {
            type: String,
            required: true,
            trim: true,
            match: [/^\d{4,10}$/, 'Please provide a valid pincode'],
        },
    },
    { _id: true }
);

const userProfileSchema = new mongoose.Schema(
    {
        userId: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'User',
            required: true,
            unique: true,
            index: true,
        },
        name: {
            type: String,
            required: true,
            trim: true,
            maxlength: 100,
        },
        phone: {
            type: String,
            required: true,
            trim: true,
        },
        email: {
            type: String,
            lowercase: true,
            trim: true,
            default: null,
        },
        profileImage: {
            type: String,
            default: null,
        },
        addresses: {
            type: [addressSchema],
            default: [],
        },
    },
    {
        timestamps: true,
        toJSON: {
            virtuals: false,
            transform(doc, ret) {
                delete ret.__v;
                return ret;
            },
        },
        toObject: { virtuals: false },
    }
);

userProfileSchema.index({ userId: 1 }, { unique: true });
userProfileSchema.index({ phone: 1 });

const UserProfile = mongoose.model('UserProfile', userProfileSchema);

module.exports = UserProfile;
