const express = require('express');
const recyclerController = require('../controllers/recycler.controller');
const { recyclerAuth } = require('../middleware/recycler.middleware');

const router = express.Router();

/**
 * Recycler portal API (mounted at /api/recycler)
 *   POST /auth/register       create account (email + password)
 *   POST /auth/login          returns { accessToken, recycler }
 *   GET  /auth/me             current recycler profile        [recycler token]
 *   GET  /requests            own bulk submissions            [recycler token]
 *   POST /requests            submit a bulk batch             [recycler token]
 */
router.post('/auth/register', recyclerController.register);
router.post('/auth/login', recyclerController.login);
router.get('/auth/me', recyclerAuth, recyclerController.me);
router.get('/requests', recyclerAuth, recyclerController.listMyRequests);
router.post('/requests', recyclerAuth, recyclerController.createRequest);

module.exports = router;
