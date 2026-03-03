/**
 * ----------------------------------------------------------------------------
 * Project    : GetMypair
 * File       : adminProfile.controller.js
 * Description: Admin – list users/cobblers/delivery, get by id, verify, activate/deactivate
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

const UserProfile = require('../models/userProfile.model');
const CobblerProfile = require('../models/cobblerProfile.model');
const DeliveryProfile = require('../models/deliveryProfile.model');
const { success, error: errorResponse, notFound } = require('../utils/response');
const logger = require('../utils/logger');

/**
 * Get All Users
 * GET /api/admin/profile/users
 */
const getAllUsers = async (req, res) => {
    try {
        const page = parseInt(req.query.page) || 1;
        const limit = parseInt(req.query.limit) || 20;
        const skip = (page - 1) * limit;

        const [profiles, total] = await Promise.all([
            UserProfile.find()
                .sort({ createdAt: -1 })
                .skip(skip)
                .limit(limit)
                .populate('userId', 'mobile role isActive lastLogin'),
            UserProfile.countDocuments(),
        ]);

        return success(res, 'All user profiles retrieved successfully', {
            profiles,
            pagination: {
                currentPage: page,
                totalPages: Math.ceil(total / limit),
                totalRecords: total,
                limit,
            },
        });
    } catch (err) {
        logger.error(`Get all users error: ${err.message}`);
        return errorResponse(res, err.message, 500);
    }
};

/**
 * Get All Cobblers
 * GET /api/admin/profile/cobblers
 */
const getAllCobblers = async (req, res) => {
    try {
        const page = parseInt(req.query.page) || 1;
        const limit = parseInt(req.query.limit) || 20;
        const skip = (page - 1) * limit;
        const { status } = req.query; // Optional filter by verificationStatus

        const filter = {};
        if (status && ['pending', 'verified', 'rejected'].includes(status)) {
            filter.verificationStatus = status;
        }

        const [profiles, total] = await Promise.all([
            CobblerProfile.find(filter)
                .sort({ createdAt: -1 })
                .skip(skip)
                .limit(limit)
                .populate('userId', 'mobile role isActive lastLogin'),
            CobblerProfile.countDocuments(filter),
        ]);

        return success(res, 'All cobbler profiles retrieved successfully', {
            profiles,
            pagination: {
                currentPage: page,
                totalPages: Math.ceil(total / limit),
                totalRecords: total,
                limit,
            },
        });
    } catch (err) {
        logger.error(`Get all cobblers error: ${err.message}`);
        return errorResponse(res, err.message, 500);
    }
};

/**
 * Get All Delivery Partners
 * GET /api/admin/profile/delivery
 */
const getAllDeliveryPartners = async (req, res) => {
    try {
        const page = parseInt(req.query.page) || 1;
        const limit = parseInt(req.query.limit) || 20;
        const skip = (page - 1) * limit;
        const { status } = req.query; // Optional filter by verificationStatus

        const filter = {};
        if (status && ['pending', 'verified', 'rejected'].includes(status)) {
            filter.verificationStatus = status;
        }

        const [profiles, total] = await Promise.all([
            DeliveryProfile.find(filter)
                .sort({ createdAt: -1 })
                .skip(skip)
                .limit(limit)
                .populate('userId', 'mobile role isActive lastLogin'),
            DeliveryProfile.countDocuments(filter),
        ]);

        return success(res, 'All delivery profiles retrieved successfully', {
            profiles,
            pagination: {
                currentPage: page,
                totalPages: Math.ceil(total / limit),
                totalRecords: total,
                limit,
            },
        });
    } catch (err) {
        logger.error(`Get all delivery partners error: ${err.message}`);
        return errorResponse(res, err.message, 500);
    }
};

/**
 * Get Profile by ID (any profile type)
 * GET /api/admin/profile/:id
 */
const getProfileById = async (req, res) => {
    try {
        const { id } = req.params;

        // Try to find in all profile collections
        let profile = null;
        let profileType = null;

        profile = await UserProfile.findById(id).populate('userId', 'mobile role isActive lastLogin');
        if (profile) {
            profileType = 'user';
        }

        if (!profile) {
            profile = await CobblerProfile.findById(id).populate('userId', 'mobile role isActive lastLogin');
            if (profile) profileType = 'cobbler';
        }

        if (!profile) {
            profile = await DeliveryProfile.findById(id).populate('userId', 'mobile role isActive lastLogin');
            if (profile) profileType = 'delivery';
        }

        if (!profile) {
            return notFound(res, 'Profile not found');
        }

        return success(res, 'Profile retrieved successfully', {
            profileType,
            profile,
        });
    } catch (err) {
        logger.error(`Get profile by ID error: ${err.message}`);
        return errorResponse(res, err.message, 500);
    }
};

/**
 * Verify Profile (Cobbler / Delivery)
 * PUT /api/admin/profile/verify
 */
const verifyProfile = async (req, res) => {
    try {
        const { profileId, status } = req.body;

        if (!profileId) {
            return errorResponse(res, 'profileId is required', 400);
        }

        if (!status || !['pending', 'verified', 'rejected'].includes(status)) {
            return errorResponse(
                res,
                'status is required and must be one of: pending, verified, rejected',
                400
            );
        }

        // Try cobbler first
        let profile = await CobblerProfile.findById(profileId);
        let profileType = 'cobbler';

        if (!profile) {
            // Try delivery
            profile = await DeliveryProfile.findById(profileId);
            profileType = 'delivery';
        }

        if (!profile) {
            return notFound(res, 'Profile not found. Only cobbler and delivery profiles can be verified.');
        }

        profile.verificationStatus = status;
        await profile.save();

        logger.info(
            `Profile verified by admin: profileId=${profileId}, type=${profileType}, status=${status}`
        );
        return success(res, `Profile verification status updated to '${status}'`, {
            profileType,
            profileId,
            verificationStatus: profile.verificationStatus,
        });
    } catch (err) {
        logger.error(`Verify profile error: ${err.message}`);
        return errorResponse(res, err.message, 500);
    }
};

/**
 * Activate / Deactivate User Account
 * PUT /api/admin/profile/status
 */
const updateAccountStatus = async (req, res) => {
    try {
        const { userId, isActive } = req.body;

        if (!userId) {
            return errorResponse(res, 'userId is required', 400);
        }

        if (typeof isActive !== 'boolean') {
            return errorResponse(res, 'isActive must be a boolean (true/false)', 400);
        }

        const User = require('../models/user.model');
        const user = await User.findById(userId);

        if (!user) {
            return notFound(res, 'User not found');
        }

        user.isActive = isActive;
        await user.save();

        const action = isActive ? 'activated' : 'deactivated';
        logger.info(`Account ${action} by admin: userId=${userId}`);
        return success(res, `Account ${action} successfully`, {
            userId,
            isActive: user.isActive,
        });
    } catch (err) {
        logger.error(`Update account status error: ${err.message}`);
        return errorResponse(res, err.message, 500);
    }
};

module.exports = {
    getAllUsers,
    getAllCobblers,
    getAllDeliveryPartners,
    getProfileById,
    verifyProfile,
    updateAccountStatus,
};
