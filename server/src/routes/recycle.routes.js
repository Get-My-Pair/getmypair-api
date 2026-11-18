const express = require('express');
const router = express.Router();
const authMiddleware = require('../middleware/auth.middleware');
const roleMiddleware = require('../middleware/role.middleware');
const recycleController = require('../controllers/recycle.controller');

router.use(authMiddleware);
router.use(roleMiddleware(['USER']));

router.get('/slides', recycleController.listSlides);

module.exports = router;
