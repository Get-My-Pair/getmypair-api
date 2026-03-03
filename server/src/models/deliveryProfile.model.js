/**
 * ----------------------------------------------------------------------------
 * Project    : GetMypair
 * File       : deliveryProfile.model.js
 * Description: Delivery profile schema – userId, vehicle, documents, verification
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

const documentSchema = new mongoose.Schema(
    {
        docType: {
            type: String,
            required: true,
            trim: true,
            enum: ['aadhaar', 'pan', 'driving_license', 'vehicle_rc', 'insurance', 'other'],
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

const deliveryProfileSchema = new mongoose.Schema(
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

        // Vehicle Details
        vehicleType: {
            type: String,
            trim: true,
            enum: ['bicycle', 'bike', 'scooter', 'auto', 'car', 'van', 'other'],
            default: null,
        },
        vehicleNumber: {
            type: String,
            trim: true,
            maxlength: 20,
            default: null,
        },

        // Documents & Verification
        documents: {
            type: [documentSchema],
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

deliveryProfileSchema.index({ userId: 1 }, { unique: true });
deliveryProfileSchema.index({ verificationStatus: 1 });

const DeliveryProfile = mongoose.model('DeliveryProfile', deliveryProfileSchema);

module.exports = DeliveryProfile;
