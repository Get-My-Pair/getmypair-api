const express = require('express');
const router = express.Router();
const authMiddleware = require('../middleware/auth.middleware');
const roleMiddleware = require('../middleware/role.middleware');
const { uploadArticleImage } = require('../middleware/upload.middleware');
const donateController = require('../controllers/donate.controller');

router.use(authMiddleware);
router.use(roleMiddleware(['USER']));

router.post('/upload-image', uploadArticleImage, donateController.uploadImage);
router.post('/requests', donateController.createRequest);
router.get('/requests', donateController.listMine);

module.exports = router;
