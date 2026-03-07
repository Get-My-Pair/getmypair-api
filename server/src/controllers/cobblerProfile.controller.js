/**
 * ----------------------------------------------------------------------------
 * Project    : GetMypair
 * File       : cobblerProfile.controller.js
 * Description: Cobbler profile CRUD – create, update, booth, services, tools, KYC, image
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

const CobblerProfile = require('../models/cobblerProfile.model');
const { success, error: errorResponse, notFound } = require('../utils/response');
const logger = require('../utils/logger');
const { uploadToCloudinary, deleteFromCloudinary, getPublicIdFromUrl } = require('../config/cloudinary');

/**
 * Create Cobbler Profile
 * POST /api/cobbler/profile/create
 */
const createProfile = async (req, res) => {
    try {
        const {
            name,
            phone,
            shopName,
            shopAddress,
            servicesOffered,
            serviceAreas,
            toolsOwned,
            toolsNeeded,
        } = req.body;
        const userId = req.user._id;

        // Check if profile already exists
        const existingProfile = await CobblerProfile.findOne({ userId });
        if (existingProfile) {
            return errorResponse(res, 'Cobbler profile already exists', 409);
        }

        const profileData = {
            userId,
            name,
            phone,
        };
        if (shopName !== undefined) profileData.shopName = shopName;
        if (shopAddress !== undefined) profileData.shopAddress = shopAddress;
        if (Array.isArray(servicesOffered)) profileData.servicesOffered = servicesOffered;
        if (Array.isArray(serviceAreas)) profileData.serviceAreas = serviceAreas;
        if (Array.isArray(toolsOwned)) profileData.toolsOwned = toolsOwned;
        if (Array.isArray(toolsNeeded)) profileData.toolsNeeded = toolsNeeded;

        const profile = await CobblerProfile.create(profileData);

        logger.info(`Cobbler profile created for userId: ${userId}`);
        return success(res, 'Cobbler profile created successfully', { profile }, 201);
    } catch (err) {
        logger.error(`Create cobbler profile error: ${err.message}`);
        return errorResponse(res, err.message, 500);
    }
};

/**
 * Get Cobbler Profile (own)
 * GET /api/cobbler/profile/me
 */
const getProfile = async (req, res) => {
    try {
        const userId = req.user._id;

        const profile = await CobblerProfile.findOne({ userId });
        if (!profile) {
            return notFound(res, 'Cobbler profile not found');
        }

        return success(res, 'Cobbler profile retrieved successfully', { profile });
    } catch (err) {
        logger.error(`Get cobbler profile error: ${err.message}`);
        return errorResponse(res, err.message, 500);
    }
};

/**
 * Update Cobbler Profile
 * PUT /api/cobbler/profile/update
 */
const updateProfile = async (req, res) => {
    try {
        const userId = req.user._id;
        const { name, phone } = req.body;

        const profile = await CobblerProfile.findOne({ userId });
        if (!profile) {
            return notFound(res, 'Cobbler profile not found');
        }

        if (name !== undefined) profile.name = name;
        if (phone !== undefined) profile.phone = phone;

        await profile.save();

        logger.info(`Cobbler profile updated for userId: ${userId}`);
        return success(res, 'Cobbler profile updated successfully', { profile });
    } catch (err) {
        logger.error(`Update cobbler profile error: ${err.message}`);
        return errorResponse(res, err.message, 500);
    }
};

/**
 * Update Booth Details (Booth name with number, Booth address)
 * PUT /api/cobbler/profile/shop
 */
const updateShopDetails = async (req, res) => {
    try {
        const userId = req.user._id;
        const { shopName, shopAddress } = req.body;

        const profile = await CobblerProfile.findOne({ userId });
        if (!profile) {
            return notFound(res, 'Cobbler profile not found');
        }

        if (shopName !== undefined) profile.shopName = shopName;
        if (shopAddress !== undefined) profile.shopAddress = shopAddress;

        await profile.save();

        logger.info(`Booth details updated for cobbler userId: ${userId}`);
        return success(res, 'Booth details updated successfully', {
            shopName: profile.shopName,
            shopAddress: profile.shopAddress,
        });
    } catch (err) {
        logger.error(`Update booth details error: ${err.message}`);
        return errorResponse(res, err.message, 500);
    }
};

/**
 * Update Services
 * PUT /api/cobbler/profile/services
 */
const updateServices = async (req, res) => {
    try {
        const userId = req.user._id;
        const { servicesOffered, serviceAreas } = req.body;

        const profile = await CobblerProfile.findOne({ userId });
        if (!profile) {
            return notFound(res, 'Cobbler profile not found');
        }

        if (servicesOffered !== undefined) profile.servicesOffered = servicesOffered;
        if (serviceAreas !== undefined) profile.serviceAreas = serviceAreas;

        await profile.save();

        logger.info(`Services updated for cobbler userId: ${userId}`);
        return success(res, 'Services updated successfully', {
            servicesOffered: profile.servicesOffered,
            serviceAreas: profile.serviceAreas,
        });
    } catch (err) {
        logger.error(`Update services error: ${err.message}`);
        return errorResponse(res, err.message, 500);
    }
};

/**
 * Update Tools Owned
 * PUT /api/cobbler/profile/tools-owned
 */
const updateToolsOwned = async (req, res) => {
    try {
        const userId = req.user._id;
        const { toolsOwned } = req.body;

        const profile = await CobblerProfile.findOne({ userId });
        if (!profile) {
            return notFound(res, 'Cobbler profile not found');
        }

        if (!Array.isArray(toolsOwned)) {
            return errorResponse(res, 'toolsOwned must be an array', 400);
        }

        profile.toolsOwned = toolsOwned;
        await profile.save();

        logger.info(`Tools owned updated for cobbler userId: ${userId}`);
        return success(res, 'Tools owned updated successfully', {
            toolsOwned: profile.toolsOwned,
        });
    } catch (err) {
        logger.error(`Update tools owned error: ${err.message}`);
        return errorResponse(res, err.message, 500);
    }
};

/**
 * Update Tools Needed
 * PUT /api/cobbler/profile/tools-needed
 */
const updateToolsNeeded = async (req, res) => {
    try {
        const userId = req.user._id;
        const { toolsNeeded } = req.body;

        const profile = await CobblerProfile.findOne({ userId });
        if (!profile) {
            return notFound(res, 'Cobbler profile not found');
        }

        if (!Array.isArray(toolsNeeded)) {
            return errorResponse(res, 'toolsNeeded must be an array', 400);
        }

        profile.toolsNeeded = toolsNeeded;
        await profile.save();

        logger.info(`Tools needed updated for cobbler userId: ${userId}`);
        return success(res, 'Tools needed updated successfully', {
            toolsNeeded: profile.toolsNeeded,
        });
    } catch (err) {
        logger.error(`Update tools needed error: ${err.message}`);
        return errorResponse(res, err.message, 500);
    }
};

/**
 * Upload Profile Image
 * POST /api/cobbler/profile/upload-image
 */
const uploadProfileImage = async (req, res) => {
    try {
        const userId = req.user._id;

        if (!req.file) {
            return errorResponse(res, 'No file uploaded', 400);
        }

        const profile = await CobblerProfile.findOne({ userId });
        if (!profile) {
            return notFound(res, 'Cobbler profile not found. Create profile first.');
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
            public_id: `cobbler-${userId}-${Date.now()}`,
            resource_type: 'image',
            transformation: [{ width: 500, height: 500, crop: 'limit', quality: 'auto' }],
        });

        profile.profileImage = result.secure_url;
        await profile.save();

        logger.info(`Profile image uploaded to Cloudinary for cobbler userId: ${userId}`);
        return success(res, 'Profile image uploaded successfully', {
            profileImage: result.secure_url,
            cloudinaryId: result.public_id,
        });
    } catch (err) {
        logger.error(`Upload cobbler profile image error: ${err.message}`);
        return errorResponse(res, err.message, 500);
    }
};

/**
 * Upload KYC Document
 * POST /api/cobbler/profile/upload-doc
 */
const uploadKycDoc = async (req, res) => {
    try {
        const userId = req.user._id;
        const { docType } = req.body;

        if (!req.file) {
            return errorResponse(res, 'No file uploaded', 400);
        }

        if (!docType) {
            return errorResponse(res, 'docType is required (aadhaar, pan, voter_id, driving_license, other)', 400);
        }

        const profile = await CobblerProfile.findOne({ userId });
        if (!profile) {
            return notFound(res, 'Cobbler profile not found. Create profile first.');
        }

        // Upload to Cloudinary
        const result = await uploadToCloudinary(req.file.buffer, {
            folder: 'getmypair/kyc',
            public_id: `kyc-${userId}-${docType}-${Date.now()}`,
            resource_type: 'auto',
        });

        profile.kycDocs.push({
            docType,
            docUrl: result.secure_url,
            uploadedAt: new Date(),
        });
        await profile.save();

        const addedDoc = profile.kycDocs[profile.kycDocs.length - 1];

        logger.info(`KYC document uploaded to Cloudinary for cobbler userId: ${userId}, type: ${docType}`);
        return success(res, 'KYC document uploaded successfully', {
            document: addedDoc,
            cloudinaryId: result.public_id,
            totalDocs: profile.kycDocs.length,
        }, 201);
    } catch (err) {
        logger.error(`Upload KYC doc error: ${err.message}`);
        return errorResponse(res, err.message, 500);
    }
};

/**
 * Update Bank Details
 * PUT /api/cobbler/profile/bank
 */
const updateBankDetails = async (req, res) => {
    try {
        const userId = req.user._id;
        const { accountHolderName, accountNumber, ifscCode, bankName } = req.body;

        const profile = await CobblerProfile.findOne({ userId });
        if (!profile) {
            return notFound(res, 'Cobbler profile not found');
        }

        if (!profile.bankDetails) {
            profile.bankDetails = {};
        }
        if (accountHolderName !== undefined) profile.bankDetails.accountHolderName = accountHolderName;
        if (accountNumber !== undefined) profile.bankDetails.accountNumber = accountNumber;
        if (ifscCode !== undefined) profile.bankDetails.ifscCode = ifscCode;
        if (bankName !== undefined) profile.bankDetails.bankName = bankName;

        await profile.save();

        logger.info(`Bank details updated for cobbler userId: ${userId}`);
        return success(res, 'Bank details updated successfully', {
            bankDetails: profile.bankDetails,
        });
    } catch (err) {
        logger.error(`Update bank details error: ${err.message}`);
        return errorResponse(res, err.message, 500);
    }
};

/**
 * Update online status
 * PUT /api/cobbler/profile/update-status
 */
const updateStatus = async (req, res) => {
    try {
        const userId = req.user._id;
        const { isOnline } = req.body;

        const profile = await CobblerProfile.findOne({ userId });
        if (!profile) {
            return notFound(res, 'Cobbler profile not found');
        }

        if (typeof isOnline === 'boolean') {
            profile.isOnline = isOnline;
            await profile.save();
        }

        logger.info(`Cobbler status updated for userId: ${userId}, isOnline: ${profile.isOnline}`);
        return success(res, 'Status updated successfully', {
            isOnline: profile.isOnline,
        });
    } catch (err) {
        logger.error(`Update status error: ${err.message}`);
        return errorResponse(res, err.message, 500);
    }
};

/**
 * Get Verification Status
 * GET /api/cobbler/profile/verification
 */
const getVerificationStatus = async (req, res) => {
    try {
        const userId = req.user._id;

        const profile = await CobblerProfile.findOne({ userId }).select(
            'verificationStatus kycDocs'
        );
        if (!profile) {
            return notFound(res, 'Cobbler profile not found');
        }

        return success(res, 'Verification status retrieved successfully', {
            verificationStatus: profile.verificationStatus,
            kycDocsCount: profile.kycDocs.length,
            kycDocs: profile.kycDocs,
        });
    } catch (err) {
        logger.error(`Get verification status error: ${err.message}`);
        return errorResponse(res, err.message, 500);
    }
};

module.exports = {
    createProfile,
    getProfile,
    updateProfile,
    updateShopDetails,
    updateServices,
    updateToolsOwned,
    updateToolsNeeded,
    updateBankDetails,
    updateStatus,
    uploadProfileImage,
    uploadKycDoc,
    getVerificationStatus,
};
