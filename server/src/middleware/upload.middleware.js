const multer = require('multer');

/**
 * Upload middleware using multer memoryStorage
 * Files are stored in memory as Buffer, then uploaded to Cloudinary in controllers
 */

// Memory storage (no disk writes - files go to req.file.buffer)
const memoryStorage = multer.memoryStorage();

// File filter for images — allow all common image MIME types
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
    if (allowedTypes.includes(file.mimetype) || file.mimetype.startsWith('image/')) {
        cb(null, true);
    } else {
        cb(new Error('Only image files are allowed'), false);
    }
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
            next();
        });
    };
};

module.exports = {
    uploadProfileImage: handleUpload(uploadProfileImage),
    uploadKycDoc: handleUpload(uploadKycDoc),
    uploadDeliveryDoc: handleUpload(uploadDeliveryDoc),
};
