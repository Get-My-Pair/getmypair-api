/**
 * ----------------------------------------------------------------------------
 * Project    : GetMypair
 * File       : userProfile.model.js
 * Description: User profile schema – userId, name, phone, email, addresses, profileImage
 * ----------------------------------------------------------------------------
 * Developer  : C Ranjith Kumar
 * Role       : Backend and Database Developer, Team Lead
 * ----------------------------------------------------------------------------
 * LinkedIn         : https://www.linkedin.com/in/coding-ranjith/
 * Personal GitHub  : https://github.com/CodingRanjith
 * Project GitHub   : https://github.com/Ranjithgmp
 * Personal Email   : ranjith.c96me@gmail.com
 * Project Email    : ranjith.kumar@getmypair.com
 * ----------------------------------------------------------------------------
 * Last modified : 2025-03-03
 * ----------------------------------------------------------------------------
 */

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
