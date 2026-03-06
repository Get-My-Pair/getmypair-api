/**
 * ----------------------------------------------------------------------------
 * Project    : GetMypair
 * File       : cloudinary.js
 * Description: Cloudinary config and upload helpers for images/docs
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

const cloudinary = require('cloudinary').v2;
const config = require('./env');
const logger = require('../utils/logger');

// Configure Cloudinary
cloudinary.config({
    cloud_name: config.CLOUDINARY_CLOUD_NAME,
    api_key: config.CLOUDINARY_API_KEY,
    api_secret: config.CLOUDINARY_API_SECRET,
});

/**
 * Upload file buffer to Cloudinary
 * @param {Buffer} fileBuffer - File buffer from multer memoryStorage
 * @param {Object} options - Upload options
 * @param {String} options.folder - Cloudinary folder name
 * @param {String} options.public_id - Custom public ID (optional)
 * @param {String} options.resource_type - 'image' | 'raw' | 'auto' (default: 'auto')
 * @returns {Object} Cloudinary upload result { secure_url, public_id, ... }
 */
const uploadToCloudinary = (fileBuffer, options = {}) => {
    return new Promise((resolve, reject) => {
        const uploadOptions = {
            folder: options.folder || 'getmypair',
            resource_type: options.resource_type || 'auto',
            ...(options.public_id && { public_id: options.public_id }),
            ...(options.transformation && { transformation: options.transformation }),
        };

        const uploadStream = cloudinary.uploader.upload_stream(
            uploadOptions,
            (error, result) => {
                if (error) {
                    logger.error(`Cloudinary upload error: ${error.message}`);
                    return reject(error);
                }
                resolve(result);
            }
        );

        uploadStream.end(fileBuffer);
    });
};

/**
 * Delete file from Cloudinary by public_id
 * @param {String} publicId - Cloudinary public ID
 * @param {String} resourceType - 'image' | 'raw' | 'video'
 * @returns {Object} Cloudinary deletion result
 */
const deleteFromCloudinary = async (publicId, resourceType = 'image') => {
    try {
        const result = await cloudinary.uploader.destroy(publicId, {
            resource_type: resourceType,
        });
        logger.info(`Cloudinary delete: ${publicId} -> ${result.result}`);
        return result;
    } catch (error) {
        logger.error(`Cloudinary delete error: ${error.message}`);
        throw error;
    }
};

/**
 * Extract public_id from a Cloudinary URL
 * @param {String} url - Cloudinary secure URL
 * @returns {String|null} public_id or null
 */
const getPublicIdFromUrl = (url) => {
    if (!url || !url.includes('cloudinary.com')) return null;
    try {
        // URL format: https://res.cloudinary.com/<cloud>/image/upload/v123/folder/filename.ext
        const parts = url.split('/upload/');
        if (parts.length < 2) return null;
        const pathAfterUpload = parts[1];
        // Remove version (v123/) if present
        const withoutVersion = pathAfterUpload.replace(/^v\d+\//, '');
        // Remove file extension
        const publicId = withoutVersion.replace(/\.[^/.]+$/, '');
        return publicId;
    } catch {
        return null;
    }
};

module.exports = {
    cloudinary,
    uploadToCloudinary,
    deleteFromCloudinary,
    getPublicIdFromUrl,
};
