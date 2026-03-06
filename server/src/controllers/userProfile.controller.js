/**
 * ----------------------------------------------------------------------------
 * Project    : GetMypair
 * File       : userProfile.controller.js
 * Description: User profile CRUD – create, get, update, image, addresses
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

const UserProfile = require('../models/userProfile.model');
const { success, error: errorResponse, notFound } = require('../utils/response');
const logger = require('../utils/logger');
const { uploadToCloudinary, deleteFromCloudinary, getPublicIdFromUrl } = require('../config/cloudinary');

/**
 * Create User Profile
 * POST /api/user/profile/create
 */
const createProfile = async (req, res) => {
    try {
        const { name, phone, email } = req.body;
        const userId = req.user._id;

        // Check if profile already exists
        const existingProfile = await UserProfile.findOne({ userId });
        if (existingProfile) {
            return errorResponse(res, 'User profile already exists', 409);
        }

        const profile = await UserProfile.create({
            userId,
            name,
            phone,
            email: email || null,
        });

        logger.info(`User profile created for userId: ${userId}`);
        return success(res, 'User profile created successfully', { profile }, 201);
    } catch (err) {
        logger.error(`Create user profile error: ${err.message}`);
        return errorResponse(res, err.message, 500);
    }
};

/**
 * Get User Profile (own)
 * GET /api/user/profile/me
 */
const getProfile = async (req, res) => {
    try {
        const userId = req.user._id;

        let profile = await UserProfile.findOne({ userId });
        if (!profile) {
            // Auto-create profile if missing, getting details from user registration
            profile = await UserProfile.create({
                userId,
                name: req.user.name || 'User',
                phone: req.user.mobile || '',
                email: req.user.email || null,
            });
            logger.info(`Auto-created user profile for userId: ${userId}`);
        }

        return success(res, 'User profile retrieved successfully', { profile });
    } catch (err) {
        logger.error(`Get user profile error: ${err.message}`);
        return errorResponse(res, err.message, 500);
    }
};

/**
 * Update User Profile
 * PUT /api/user/profile/update
 */
const updateProfile = async (req, res) => {
    try {
        const userId = req.user._id;
        const { name, email } = req.body;

        const profile = await UserProfile.findOne({ userId });
        if (!profile) {
            return notFound(res, 'User profile not found');
        }

        if (name !== undefined) profile.name = name;
        if (email !== undefined) profile.email = email;

        await profile.save();

        logger.info(`User profile updated for userId: ${userId}`);
        return success(res, 'User profile updated successfully', { profile });
    } catch (err) {
        logger.error(`Update user profile error: ${err.message}`);
        return errorResponse(res, err.message, 500);
    }
};

/**
 * Upload Profile Image
 * POST /api/user/profile/upload-image
 */
const uploadProfileImage = async (req, res) => {
    try {
        const userId = req.user._id;

        if (!req.file) {
            return errorResponse(res, 'No file uploaded', 400);
        }

        const profile = await UserProfile.findOne({ userId });
        if (!profile) {
            return notFound(res, 'User profile not found. Create profile first.');
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
            public_id: `user-${userId}-${Date.now()}`,
            resource_type: 'image',
            transformation: [{ width: 500, height: 500, crop: 'limit', quality: 'auto' }],
        });

        profile.profileImage = result.secure_url;
        await profile.save();

        logger.info(`Profile image uploaded to Cloudinary for userId: ${userId}`);
        return success(res, 'Profile image uploaded successfully', {
            profileImage: result.secure_url,
            cloudinaryId: result.public_id,
        });
    } catch (err) {
        logger.error(`Upload profile image error: ${err.message}`);
        return errorResponse(res, err.message, 500);
    }
};

/**
 * Add Address
 * POST /api/user/profile/address/add
 */
const addAddress = async (req, res) => {
    try {
        const userId = req.user._id;
        const { addressLine1, city, state, pincode } = req.body;

        const profile = await UserProfile.findOne({ userId });
        if (!profile) {
            return notFound(res, 'User profile not found. Create profile first.');
        }

        const newAddress = { addressLine1, city, state, pincode };
        profile.addresses.push(newAddress);
        await profile.save();

        const addedAddress = profile.addresses[profile.addresses.length - 1];

        logger.info(`Address added for userId: ${userId}`);
        return success(res, 'Address added successfully', {
            address: addedAddress,
            totalAddresses: profile.addresses.length,
        }, 201);
    } catch (err) {
        logger.error(`Add address error: ${err.message}`);
        return errorResponse(res, err.message, 500);
    }
};

/**
 * Update Address
 * PUT /api/user/profile/address/update
 */
const updateAddress = async (req, res) => {
    try {
        const userId = req.user._id;
        const { addressId, addressLine1, city, state, pincode } = req.body;

        if (!addressId) {
            return errorResponse(res, 'addressId is required', 400);
        }

        const profile = await UserProfile.findOne({ userId });
        if (!profile) {
            return notFound(res, 'User profile not found');
        }

        const address = profile.addresses.id(addressId);
        if (!address) {
            return notFound(res, 'Address not found');
        }

        if (addressLine1 !== undefined) address.addressLine1 = addressLine1;
        if (city !== undefined) address.city = city;
        if (state !== undefined) address.state = state;
        if (pincode !== undefined) address.pincode = pincode;

        await profile.save();

        logger.info(`Address updated for userId: ${userId}, addressId: ${addressId}`);
        return success(res, 'Address updated successfully', { address });
    } catch (err) {
        logger.error(`Update address error: ${err.message}`);
        return errorResponse(res, err.message, 500);
    }
};

/**
 * Delete Address
 * DELETE /api/user/profile/address/delete/:addressId
 */
const deleteAddress = async (req, res) => {
    try {
        const userId = req.user._id;
        const { addressId } = req.params;

        const profile = await UserProfile.findOne({ userId });
        if (!profile) {
            return notFound(res, 'User profile not found');
        }

        const address = profile.addresses.id(addressId);
        if (!address) {
            return notFound(res, 'Address not found');
        }

        address.deleteOne();
        await profile.save();

        logger.info(`Address deleted for userId: ${userId}, addressId: ${addressId}`);
        return success(res, 'Address deleted successfully', {
            totalAddresses: profile.addresses.length,
        });
    } catch (err) {
        logger.error(`Delete address error: ${err.message}`);
        return errorResponse(res, err.message, 500);
    }
};

module.exports = {
    createProfile,
    getProfile,
    updateProfile,
    uploadProfileImage,
    addAddress,
    updateAddress,
    deleteAddress,
};
