const express = require('express');
const router = express.Router();
const authMiddleware = require('../middleware/auth.middleware');
const roleMiddleware = require('../middleware/role.middleware');
const { uploadSellProof } = require('../middleware/upload.middleware');
const sellListingController = require('../controllers/sellListing.controller');
const { createSellListingValidation } = require('../validations/sellListing.validation');

router.use(authMiddleware);
router.use(roleMiddleware(['USER']));

router.post('/upload-proof', uploadSellProof, sellListingController.uploadProof);
router.post('/listings', createSellListingValidation, sellListingController.createListing);
router.get('/listings', sellListingController.listMine);

module.exports = router;
