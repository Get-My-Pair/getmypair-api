const express = require('express');
const router = express.Router();
const authMiddleware = require('../middleware/auth.middleware');
const roleMiddleware = require('../middleware/role.middleware');
const thriftController = require('../controllers/thrift.controller');

router.use(authMiddleware);
router.use(roleMiddleware(['USER']));

router.get('/meta', thriftController.meta);
router.get('/products', thriftController.listProducts);
router.get('/products/:id', thriftController.getProduct);
router.post('/checkout', thriftController.checkout);

module.exports = router;
