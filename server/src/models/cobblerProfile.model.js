/**
 * ----------------------------------------------------------------------------
 * Project    : GetMypair
 * File       : cobblerProfile.model.js
 * Description: Cobbler profile schema – userId, shop, services, tools, KYC, verification
 * ----------------------------------------------------------------------------
 * Developer  : C Ranjith Kumar
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

const kycDocSchema = new mongoose.Schema(
    {
        docType: {
            type: String,
            required: true,
            trim: true,
            enum: ['aadhaar', 'pan', 'voter_id', 'driving_license', 'other'],
        },
        docUrl: {
            type: String,
            required: true,
        },
        uploadedAt: {
            type: Date,
            default: Date.now,
        },
    },
    { _id: true }
);

const cobblerProfileSchema = new mongoose.Schema(
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
        profileImage: {
            type: String,
            default: null,
        },

        // Shop Details
        shopName: {
            type: String,
            trim: true,
            maxlength: 200,
            default: null,
        },
        shopAddress: {
            type: String,
            trim: true,
            maxlength: 500,
            default: null,
        },
        serviceAreas: {
            type: [String],
            default: [],
        },
        servicesOffered: {
            type: [String],
            default: [],
        },
        toolsOwned: {
            type: [String],
            default: [],
        },
        toolsNeeded: {
            type: [String],
            default: [],
        },

        // KYC & Verification
        kycDocs: {
            type: [kycDocSchema],
            default: [],
        },
        verificationStatus: {
            type: String,
            enum: ['pending', 'verified', 'rejected'],
            default: 'pending',
            index: true,
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

cobblerProfileSchema.index({ userId: 1 }, { unique: true });
cobblerProfileSchema.index({ verificationStatus: 1 });

const CobblerProfile = mongoose.model('CobblerProfile', cobblerProfileSchema);

module.exports = CobblerProfile;
