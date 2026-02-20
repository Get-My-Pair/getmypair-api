const express = require('express');
const router = express.Router();
const authController = require('../controllers/auth.controller');
const authMiddleware = require('../middleware/auth.middleware');
const {
  registerValidation,
  loginValidation,
  sendOTPValidation,
  verifyOTPValidation,
  refreshTokenValidation,
  forgotPasswordValidation,
  resetPasswordValidation,
  verifyMobileOTPValidation,
  completeMobileRegistrationValidation,
  updateProfileValidation,
} = require('../validations/auth.validation');
const {
  globalRateLimiter,
  loginRateLimiter,
  otpRateLimiter,
  registerRateLimiter,
} = require('../middleware/rateLimit');

/**
 * @swagger
 * /api/auth/register:
 *   post:
 *     summary: Register a new user
 *     description: Register a new user account. An OTP will be sent to the provided email for verification.
 *     tags: [Authentication]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/RegisterRequest'
 *           example:
 *             email: user@example.com
 *             password: SecurePass123!
 *             firstName: John
 *             lastName: Doe
 *             phone: "+1234567890"
 *     responses:
 *       201:
 *         description: Registration successful. OTP sent to email.
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 message:
 *                   type: string
 *                   example: "Registration successful. Please verify your email."
 *                 data:
 *                   type: object
 *                   properties:
 *                     userId:
 *                       type: string
 *                     email:
 *                       type: string
 *                     otpSent:
 *                       type: boolean
 *                       example: true
 *       400:
 *         description: Bad request - Validation error or user already exists
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 *             example:
 *               success: false
 *               message: "User with this email already exists"
 */
router.post(
  '/register',
  registerRateLimiter,
  registerValidation,
  authController.register
);

/**
 * @swagger
 * /api/auth/send-otp:
 *   post:
 *     summary: Send OTP to user's email or phone
 *     description: Send a one-time password (OTP) to the user's email or phone for verification purposes.
 *     tags: [Authentication]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - type
 *             properties:
 *               email:
 *                 type: string
 *                 format: email
 *                 example: user@example.com
 *                 description: User email (required if type is 'email')
 *               phone:
 *                 type: string
 *                 example: "+1234567890"
 *                 description: User phone number (required if type is 'phone')
 *               type:
 *                 type: string
 *                 enum: [email, phone]
 *                 example: email
 *                 description: OTP delivery method
 *           example:
 *             email: user@example.com
 *             type: email
 *     responses:
 *       200:
 *         description: OTP sent successfully
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/SuccessResponse'
 *             example:
 *               success: true
 *               message: "OTP sent successfully"
 *               data:
 *                 expiresIn: 600
 *       400:
 *         description: Bad request - Validation error or rate limit exceeded
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 */
router.post('/send-otp', otpRateLimiter, sendOTPValidation, authController.sendOTP);

/**
 * @swagger
 * /api/auth/verify-otp:
 *   post:
 *     summary: Verify OTP code
 *     description: Verify the OTP code sent to user's email or phone. If verifying email during registration, this will complete the registration and return tokens.
 *     tags: [Authentication]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - otp
 *               - type
 *             properties:
 *               email:
 *                 type: string
 *                 format: email
 *                 example: user@example.com
 *               phone:
 *                 type: string
 *                 example: "+1234567890"
 *               otp:
 *                 type: string
 *                 example: "123456"
 *                 description: 6-digit OTP code
 *               type:
 *                 type: string
 *                 enum: [email, phone]
 *                 example: email
 *           example:
 *             email: user@example.com
 *             otp: "123456"
 *             type: email
 *     responses:
 *       200:
 *         description: OTP verified successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 message:
 *                   type: string
 *                 data:
 *                   type: object
 *                   properties:
 *                     verified:
 *                       type: boolean
 *                     user:
 *                       $ref: '#/components/schemas/User'
 *                     tokens:
 *                       type: object
 *                       properties:
 *                         accessToken:
 *                           type: string
 *                         refreshToken:
 *                           type: string
 *                         expiresIn:
 *                           type: string
 *       400:
 *         description: Invalid or expired OTP
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 */
router.post(
  '/verify-otp',
  otpRateLimiter,
  verifyOTPValidation,
  authController.verifyOTP
);

/**
 * @swagger
 * /api/auth/login:
 *   post:
 *     summary: Login user and get JWT tokens
 *     description: Authenticate user with email and password. Returns access and refresh tokens upon successful login.
 *     tags: [Authentication]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/LoginRequest'
 *           example:
 *             email: user@example.com
 *             password: SecurePass123!
 *     responses:
 *       200:
 *         description: Login successful
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 message:
 *                   type: string
 *                   example: "Login successful"
 *                 data:
 *                   type: object
 *                   properties:
 *                     user:
 *                       $ref: '#/components/schemas/User'
 *                     tokens:
 *                       type: object
 *                       properties:
 *                         accessToken:
 *                           type: string
 *                         refreshToken:
 *                           type: string
 *                         expiresIn:
 *                           type: string
 *       401:
 *         description: Invalid credentials
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 *       403:
 *         description: Account locked or email not verified
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 */
router.post('/login', loginRateLimiter, loginValidation, authController.login);

/**
 * @swagger
 * /api/auth/refresh-token:
 *   post:
 *     summary: Refresh access token
 *     description: Generate a new access token using a valid refresh token.
 *     tags: [Authentication]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - refreshToken
 *             properties:
 *               refreshToken:
 *                 type: string
 *                 example: "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
 *           example:
 *             refreshToken: "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
 *     responses:
 *       200:
 *         description: Token refreshed successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 message:
 *                   type: string
 *                   example: "Token refreshed successfully"
 *                 data:
 *                   type: object
 *                   properties:
 *                     accessToken:
 *                       type: string
 *                     expiresIn:
 *                       type: string
 *       401:
 *         description: Invalid or expired refresh token
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 */
router.post(
  '/refresh-token',
  refreshTokenValidation,
  authController.refreshToken
);

/**
 * @swagger
 * /api/auth/logout:
 *   post:
 *     summary: Logout user and invalidate session
 *     description: Logout the authenticated user and invalidate their session. Requires authentication.
 *     tags: [Authentication]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: false
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               refreshToken:
 *                 type: string
 *                 example: "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
 *                 description: Optional refresh token to revoke
 *     responses:
 *       200:
 *         description: Logout successful
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 message:
 *                   type: string
 *                   example: "Logout successful"
 *       401:
 *         description: Unauthorized - Invalid or missing token
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 */
router.post('/logout', authMiddleware, authController.logout);

/**
 * @swagger
 * /api/auth/me:
 *   get:
 *     summary: Get current authenticated user
 *     description: Retrieve the profile information of the currently authenticated user. Requires authentication.
 *     tags: [Authentication]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: User profile retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 message:
 *                   type: string
 *                   example: "User retrieved successfully"
 *                 data:
 *                   type: object
 *                   properties:
 *                     user:
 *                       $ref: '#/components/schemas/User'
 *       401:
 *         description: Unauthorized - Invalid or missing token
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 *       404:
 *         description: User not found
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 */
router.get('/me', authMiddleware, authController.getCurrentUser);

/**
 * @swagger
 * /api/auth/verify-mobile-otp:
 *   post:
 *     summary: Verify mobile OTP and login or get profile required
 *     tags: [Authentication]
 */
router.post(
  '/verify-mobile-otp',
  otpRateLimiter,
  verifyMobileOTPValidation,
  authController.verifyMobileOTP
);

/**
 * @swagger
 * /api/auth/complete-mobile-registration:
 *   post:
 *     summary: Complete mobile registration with profile
 *     tags: [Authentication]
 */
router.post(
  '/complete-mobile-registration',
  completeMobileRegistrationValidation,
  authController.completeMobileRegistration
);

/**
 * @swagger
 * /api/auth/profile:
 *   put:
 *     summary: Update profile (location allowed for Flutter)
 *     tags: [Authentication]
 *     security:
 *       - bearerAuth: []
 */
router.put(
  '/profile',
  authMiddleware,
  updateProfileValidation,
  authController.updateProfile
);

/**
 * @swagger
 * /api/auth/forgot-password:
 *   post:
 *     summary: Request password reset OTP
 *     description: Send a password reset OTP to the user's email address.
 *     tags: [Authentication]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - email
 *             properties:
 *               email:
 *                 type: string
 *                 format: email
 *                 example: user@example.com
 *           example:
 *             email: user@example.com
 *     responses:
 *       200:
 *         description: Password reset OTP sent successfully
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/SuccessResponse'
 *             example:
 *               success: true
 *               message: "Password reset OTP sent to your email"
 *       400:
 *         description: Bad request - User not found or validation error
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 */
router.post(
  '/forgot-password',
  otpRateLimiter,
  forgotPasswordValidation,
  authController.forgotPassword
);

/**
 * @swagger
 * /api/auth/reset-password:
 *   post:
 *     summary: Reset password using OTP
 *     description: Reset user password by verifying the OTP sent to their email.
 *     tags: [Authentication]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - email
 *               - otp
 *               - newPassword
 *             properties:
 *               email:
 *                 type: string
 *                 format: email
 *                 example: user@example.com
 *               otp:
 *                 type: string
 *                 example: "123456"
 *                 description: 6-digit OTP code received via email
 *               newPassword:
 *                 type: string
 *                 minLength: 6
 *                 example: "NewSecurePass123!"
 *           example:
 *             email: user@example.com
 *             otp: "123456"
 *             newPassword: "NewSecurePass123!"
 *     responses:
 *       200:
 *         description: Password reset successful
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/SuccessResponse'
 *             example:
 *               success: true
 *               message: "Password reset successful"
 *       400:
 *         description: Bad request - Invalid OTP, expired OTP, or validation error
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 */
router.post(
  '/reset-password',
  resetPasswordValidation,
  authController.resetPassword
);

module.exports = router;
