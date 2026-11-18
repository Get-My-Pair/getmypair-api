const express = require('express');
const router = express.Router();
const authMiddleware = require('../middleware/auth.middleware');
const roleMiddleware = require('../middleware/role.middleware');
const { uploadArticleImage } = require('../middleware/upload.middleware');
const rentController = require('../controllers/rent.controller');

router.use(authMiddleware);
router.use(roleMiddleware(['USER']));

router.post('/upload-image', uploadArticleImage, rentController.uploadImage);
router.post('/listings', rentController.createListing);
router.get('/listings', rentController.listMine);
router.get('/available', rentController.listAvailable);
router.post('/requests', rentController.createRequest);
router.get('/requests/incoming', rentController.listIncoming);

module.exports = router;
