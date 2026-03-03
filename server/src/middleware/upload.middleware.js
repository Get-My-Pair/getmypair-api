/**
 * ----------------------------------------------------------------------------
 * Project    : GetMypair
 * File       : upload.middleware.js
 * Description: Multer upload – memory storage, file type/size checks for Cloudinary
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

const multer = require('multer');

/**
 * Upload middleware using multer memoryStorage
 * Files are stored in memory as Buffer, then uploaded to Cloudinary in controllers
 */

// Memory storage (no disk writes - files go to req.file.buffer)
const memoryStorage = multer.memoryStorage();
const logger = require('../utils/logger');

// File filter for images — allow common image MIME types; fallback to extension check
const imageFileFilter = (req, file, cb) => {
    const allowedTypes = [
        'image/jpeg',
        'image/jpg',
        'image/png',
        'image/webp',
        'image/gif',
        'image/svg+xml',
        'image/tiff',
        'image/bmp',
        'image/heic',
        'image/avif',
        'image/x-icon',
    ];

    const allowedExtensions = [
        '.jpeg', '.jpg', '.png', '.webp', '.gif', '.svg', '.tif', '.tiff', '.bmp', '.heic', '.avif', '.ico'
    ];

    // If mimetype exists and indicates image, accept
    if (file.mimetype && (allowedTypes.includes(file.mimetype) || file.mimetype.startsWith('image/'))) {
        return cb(null, true);
    }

    // Fallback: check file extension from originalname
    const originalName = (file.originalname || '').toLowerCase();
    const matchedExt = allowedExtensions.find(ext => originalName.endsWith(ext));
    if (matchedExt) {
        return cb(null, true);
    }

    // If no mimetype and no extension match, log and reject with helpful message
    logger.warn(`Rejected upload attempt - not an image. ip=${req.ip || req.connection.remoteAddress} originalname=${file.originalname} mimetype=${file.mimetype}`);
    cb(new Error('Only image files are allowed (supported: jpg, jpeg, png, webp, gif, svg, tiff, bmp, heic, avif, ico)'), false);
};

// File filter for documents (images + PDF)
const documentFileFilter = (req, file, cb) => {
    const allowedTypes = [
        'image/jpeg',
        'image/jpg',
        'image/png',
        'image/webp',
        'application/pdf',
    ];
    if (allowedTypes.includes(file.mimetype)) {
        cb(null, true);
    } else {
        cb(new Error('Only JPEG, JPG, PNG, WEBP, and PDF files are allowed'), false);
    }
};

// Upload middlewares (memoryStorage → buffer → Cloudinary in controller)
const uploadProfileImage = multer({
    storage: memoryStorage,
    fileFilter: imageFileFilter,
    limits: {
        fileSize: 5 * 1024 * 1024, // 5MB
    },
}).single('file');

const uploadKycDoc = multer({
    storage: memoryStorage,
    fileFilter: documentFileFilter,
    limits: {
        fileSize: 10 * 1024 * 1024, // 10MB
    },
}).single('file');

const uploadDeliveryDoc = multer({
    storage: memoryStorage,
    fileFilter: documentFileFilter,
    limits: {
        fileSize: 10 * 1024 * 1024, // 10MB
    },
}).single('file');

/**
 * Wrapper to handle multer errors gracefully
 */
const handleUpload = (uploadMiddleware) => {
    return (req, res, next) => {
        uploadMiddleware(req, res, (err) => {
            if (err instanceof multer.MulterError) {
                if (err.code === 'LIMIT_FILE_SIZE') {
                    return res.status(400).json({
                        success: false,
                        message: 'File too large. Maximum size allowed is specified in the upload config.',
                        statusCode: 400,
                    });
                }
                return res.status(400).json({
                    success: false,
                    message: `Upload error: ${err.message}`,
                    statusCode: 400,
                });
            } else if (err) {
                return res.status(400).json({
                    success: false,
                    message: err.message,
                    statusCode: 400,
                });
            }
            // Log successful upload metadata for debugging
            if (req.file) {
                logger.info(`Received upload: fieldname=${req.file.fieldname} originalname=${req.file.originalname} mimetype=${req.file.mimetype} size=${req.file.size}`);
            }
            next();
        });
    };
};

module.exports = {
    uploadProfileImage: handleUpload(uploadProfileImage),
    uploadKycDoc: handleUpload(uploadKycDoc),
    uploadDeliveryDoc: handleUpload(uploadDeliveryDoc),
};
