/**
 * ----------------------------------------------------------------------------
 * Project    : GetMypair
 * File       : deliveryProfile.controller.js
 * Description: Delivery profile CRUD – create, update, vehicle, docs, image, verification
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

const DeliveryProfile = require('../models/deliveryProfile.model');
const { success, error: errorResponse, notFound } = require('../utils/response');
const logger = require('../utils/logger');
const { uploadToCloudinary, deleteFromCloudinary, getPublicIdFromUrl } = require('../config/cloudinary');

/**
 * Create Delivery Profile
 * POST /api/delivery/profile/create
 */
const createProfile = async (req, res) => {
    try {
        const { name, phone } = req.body;
        const userId = req.user._id;

        // Check if profile already exists
        const existingProfile = await DeliveryProfile.findOne({ userId });
        if (existingProfile) {
            return errorResponse(res, 'Delivery profile already exists', 409);
        }

        const profile = await DeliveryProfile.create({
            userId,
            name,
            phone,
        });

        logger.info(`Delivery profile created for userId: ${userId}`);
        return success(res, 'Delivery profile created successfully', { profile }, 201);
    } catch (err) {
        logger.error(`Create delivery profile error: ${err.message}`);
        return errorResponse(res, err.message, 500);
    }
};

/**
 * Get Delivery Profile (own)
 * GET /api/delivery/profile/me
 */
const getProfile = async (req, res) => {
    try {
        const userId = req.user._id;

        const profile = await DeliveryProfile.findOne({ userId });
        if (!profile) {
            return notFound(res, 'Delivery profile not found');
        }

        return success(res, 'Delivery profile retrieved successfully', { profile });
    } catch (err) {
        logger.error(`Get delivery profile error: ${err.message}`);
        return errorResponse(res, err.message, 500);
    }
};

/**
 * Update Delivery Profile
 * PUT /api/delivery/profile/update
 */
const updateProfile = async (req, res) => {
    try {
        const userId = req.user._id;
        const { name, phone } = req.body;

        const profile = await DeliveryProfile.findOne({ userId });
        if (!profile) {
            return notFound(res, 'Delivery profile not found');
        }

        if (name !== undefined) profile.name = name;
        if (phone !== undefined) profile.phone = phone;

        await profile.save();

        logger.info(`Delivery profile updated for userId: ${userId}`);
        return success(res, 'Delivery profile updated successfully', { profile });
    } catch (err) {
        logger.error(`Update delivery profile error: ${err.message}`);
        return errorResponse(res, err.message, 500);
    }
};

/**
 * Update Vehicle Details
 * PUT /api/delivery/profile/vehicle
 */
const updateVehicleDetails = async (req, res) => {
    try {
        const userId = req.user._id;
        const { vehicleType, vehicleNumber } = req.body;

        const profile = await DeliveryProfile.findOne({ userId });
        if (!profile) {
            return notFound(res, 'Delivery profile not found');
        }

        if (vehicleType !== undefined) profile.vehicleType = vehicleType;
        if (vehicleNumber !== undefined) profile.vehicleNumber = vehicleNumber;

        await profile.save();

        logger.info(`Vehicle details updated for delivery userId: ${userId}`);
        return success(res, 'Vehicle details updated successfully', {
            vehicleType: profile.vehicleType,
            vehicleNumber: profile.vehicleNumber,
        });
    } catch (err) {
        logger.error(`Update vehicle details error: ${err.message}`);
        return errorResponse(res, err.message, 500);
    }
};

/**
 * Upload Document
 * POST /api/delivery/profile/upload-doc
 */
const uploadDocument = async (req, res) => {
    try {
        const userId = req.user._id;
        const { docType } = req.body;

        if (!req.file) {
            return errorResponse(res, 'No file uploaded', 400);
        }

        if (!docType) {
            return errorResponse(
                res,
                'docType is required (aadhaar, pan, driving_license, vehicle_rc, insurance, other)',
                400
            );
        }

        const profile = await DeliveryProfile.findOne({ userId });
        if (!profile) {
            return notFound(res, 'Delivery profile not found. Create profile first.');
        }

        // Upload to Cloudinary
        const result = await uploadToCloudinary(req.file.buffer, {
            folder: 'getmypair/documents',
            public_id: `doc-${userId}-${docType}-${Date.now()}`,
            resource_type: 'auto',
        });

        profile.documents.push({
            docType,
            docUrl: result.secure_url,
            uploadedAt: new Date(),
        });
        await profile.save();

        const addedDoc = profile.documents[profile.documents.length - 1];

        logger.info(`Document uploaded to Cloudinary for delivery userId: ${userId}, type: ${docType}`);
        return success(res, 'Document uploaded successfully', {
            document: addedDoc,
            cloudinaryId: result.public_id,
            totalDocs: profile.documents.length,
        }, 201);
    } catch (err) {
        logger.error(`Upload delivery document error: ${err.message}`);
        return errorResponse(res, err.message, 500);
    }
};

/**
 * Upload Profile Image
 * POST /api/delivery/profile/upload-image
 */
const uploadProfileImage = async (req, res) => {
    try {
        const userId = req.user._id;

        if (!req.file) {
            return errorResponse(res, 'No file uploaded', 400);
        }

        const profile = await DeliveryProfile.findOne({ userId });
        if (!profile) {
            return notFound(res, 'Delivery profile not found. Create profile first.');
        }

        // Delete old image from Cloudinary if exists
        if (profile.profileImage) {
            const oldPublicId = getPublicIdFromUrl(profile.profileImage);
            if (oldPublicId) {
                await deleteFromCloudinary(oldPublicId).catch(() => { });
            }
        }

        // Upload to Cloudinary
        const result = await uploadToCloudinary(req.file.buffer, {
            folder: 'getmypair/profiles',
            public_id: `delivery-${userId}-${Date.now()}`,
            resource_type: 'image',
            transformation: [{ width: 500, height: 500, crop: 'limit', quality: 'auto' }],
        });

        profile.profileImage = result.secure_url;
        await profile.save();

        logger.info(`Profile image uploaded to Cloudinary for delivery userId: ${userId}`);
        return success(res, 'Profile image uploaded successfully', {
            profileImage: result.secure_url,
            cloudinaryId: result.public_id,
        });
    } catch (err) {
        logger.error(`Upload delivery profile image error: ${err.message}`);
        return errorResponse(res, err.message, 500);
    }
};

/**
 * Get Verification Status
 * GET /api/delivery/profile/verification
 */
const getVerificationStatus = async (req, res) => {
    try {
        const userId = req.user._id;

        const profile = await DeliveryProfile.findOne({ userId }).select(
            'verificationStatus documents'
        );
        if (!profile) {
            return notFound(res, 'Delivery profile not found');
        }

        return success(res, 'Verification status retrieved successfully', {
            verificationStatus: profile.verificationStatus,
            documentsCount: profile.documents.length,
            documents: profile.documents,
        });
    } catch (err) {
        logger.error(`Get delivery verification status error: ${err.message}`);
        return errorResponse(res, err.message, 500);
    }
};

module.exports = {
    createProfile,
    getProfile,
    updateProfile,
    updateVehicleDetails,
    uploadDocument,
    uploadProfileImage,
    getVerificationStatus,
};
