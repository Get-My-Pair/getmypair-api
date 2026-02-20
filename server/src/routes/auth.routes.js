const express = require('express');
const router = express.Router();
const authController = require('../controllers/auth.controller');
const authMiddleware = require('../middleware/auth.middleware');
const {
  sendOTPValidation,
  verifyOTPValidation,
  completeProfileValidation,
  refreshTokenValidation,
<<<<<<< HEAD
  forgotPasswordValidation,
  resetPasswordValidation,
  verifyMobileOTPValidation,
  completeMobileRegistrationValidation,
  updateProfileValidation,
=======
>>>>>>> 87393ab8441ae77f9658bd8e2f32b2026e3272ac
} = require('../validations/auth.validation');
const {
  otpRateLimiter,
} = require('../middleware/rateLimit');

/**
 * @swagger
 * /api/auth/send-otp:
 *   post:
 *     summary: Send OTP to mobile number
 *     description: Generate and send a one-time password (OTP) to the user's mobile number for authentication.
 *     tags: [Authentication]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - mobile
 *             properties:
 *               mobile:
 *                 type: string
 *                 example: "+1234567890"
 *                 description: User mobile number
 *           example:
 *             mobile: "+1234567890"
 *     responses:
 *       200:
 *         description: OTP sent successfully
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
 *                   example: "OTP sent successfully"
 *                 data:
 *                   type: object
 *                   properties:
 *                     expiresIn:
 *                       type: number
 *                       example: 600
 *       400:
 *         description: Bad request - Validation error or rate limit exceeded
 */
router.post('/send-otp', otpRateLimiter, sendOTPValidation, authController.sendOTP);

/**
 * @swagger
 * /api/auth/verify-otp:
 *   post:
 *     summary: Verify OTP and check if user exists
 *     description: Verify the OTP code sent to user's mobile. If user exists, returns JWT tokens. If new user, returns flag for profile completion.
 *     tags: [Authentication]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - mobile
 *               - otp
 *             properties:
 *               mobile:
 *                 type: string
 *                 example: "+1234567890"
 *               otp:
 *                 type: string
 *                 example: "123456"
 *                 description: 6-digit OTP code
 *           example:
 *             mobile: "+1234567890"
 *             otp: "123456"
 *     responses:
 *       200:
 *         description: OTP verified successfully
 *         content:
 *           application/json:
 *             schema:
 *               oneOf:
 *                 - type: object
 *                   description: Existing user - Login successful
 *                   properties:
 *                     success:
 *                       type: boolean
 *                       example: true
 *                     message:
 *                       type: string
 *                       example: "Login successful"
 *                     data:
 *                       type: object
 *                       properties:
 *                         user:
 *                           $ref: '#/components/schemas/User'
 *                         tokens:
 *                           type: object
 *                           properties:
 *                             accessToken:
 *                               type: string
 *                             refreshToken:
 *                               type: string
 *                             expiresIn:
 *                               type: string
 *                 - type: object
 *                   description: New user - Profile completion required
 *                   properties:
 *                     success:
 *                       type: boolean
 *                       example: true
 *                     message:
 *                       type: string
 *                       example: "Please complete your profile"
 *                     data:
 *                       type: object
 *                       properties:
 *                         requiresProfileCompletion:
 *                           type: boolean
 *                           example: true
 *                         mobile:
 *                           type: string
 *       400:
 *         description: Invalid or expired OTP
 */
router.post('/verify-otp', otpRateLimiter, verifyOTPValidation, authController.verifyOTP);

/**
 * @swagger
 * /api/auth/complete-profile:
 *   post:
 *     summary: Complete profile for new user
 *     description: Create user account with name, date of birth, and gender. Returns JWT tokens upon successful registration.
 *     tags: [Authentication]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - mobile
 *               - name
 *               - dateOfBirth
 *               - gender
 *             properties:
 *               mobile:
 *                 type: string
 *                 example: "+1234567890"
 *               name:
 *                 type: string
 *                 example: "John Doe"
 *               dateOfBirth:
 *                 type: string
 *                 format: date
 *                 example: "1990-01-01"
 *               gender:
 *                 type: string
 *                 enum: [male, female, other]
 *                 example: "male"
 *           example:
 *             mobile: "+1234567890"
 *             name: "John Doe"
 *             dateOfBirth: "1990-01-01"
 *             gender: "male"
 *     responses:
 *       201:
 *         description: Profile completed successfully. Login successful.
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
 *                   example: "Profile completed successfully. Login successful."
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
 *       400:
 *         description: Bad request - Validation error or user already exists
 */
router.post('/complete-profile', completeProfileValidation, authController.completeProfile);

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
 *       401:
 *         description: Invalid or expired refresh token
 */
router.post('/refresh-token', refreshTokenValidation, authController.refreshToken);

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
 *     responses:
 *       200:
 *         description: Logout successful
 *       401:
 *         description: Unauthorized - Invalid or missing token
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
 *       401:
 *         description: Unauthorized - Invalid or missing token
 *       404:
 *         description: User not found
 */
router.get('/me', authMiddleware, authController.getCurrentUser);

<<<<<<< HEAD
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

=======
>>>>>>> 87393ab8441ae77f9658bd8e2f32b2026e3272ac
module.exports = router;
