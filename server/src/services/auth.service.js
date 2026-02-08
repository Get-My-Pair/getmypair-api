const User = require('../models/user.model');
const Role = require('../models/role.model');
const otpService = require('./otp.service');
const tokenService = require('./token.service');
const AuditLog = require('../models/auditLog.model');
const logger = require('../utils/logger');
const { validateEmail, validatePassword } = require('../utils/validators');

const register = async (userData, deviceInfo = {}) => {
  try {
    const { email, password, firstName, lastName, phone } = userData;

    // Validate inputs
    if (!validateEmail(email)) {
      throw new Error('Invalid email format');
    }

    if (!validatePassword(password)) {
      throw new Error('Password must be at least 6 characters long');
    }

    // Check if user already exists
    const existingUser = await User.findOne({ email });
    if (existingUser) {
      throw new Error('User with this email already exists');
    }

    // Get default role (user)
    let role = await Role.findOne({ name: 'user' });
    if (!role) {
      // Create default role if it doesn't exist
      role = await Role.create({
        name: 'user',
        permissions: ['read'],
        isActive: true,
      });
    }

    // Create user
    const user = await User.create({
      email,
      password,
      firstName,
      lastName,
      phone,
      role: role._id,
    });

    // Generate OTP for email verification
    await otpService.createOTP(email, 'email');

    // Log audit
    await AuditLog.create({
      userId: user._id,
      action: 'user_registered',
      resource: 'user',
      resourceId: user._id,
      method: 'POST',
      status: 'success',
      ipAddress: deviceInfo.ipAddress,
      userAgent: deviceInfo.userAgent,
    });

    logger.info(`User registered: ${email}`);
    return user;
  } catch (error) {
    logger.error('Error in register service:', error);
    throw error;
  }
};

const login = async (email, password, deviceInfo = {}) => {
  try {
    // Find user with role populated
    const user = await User.findOne({ email }).populate('role');

    if (!user) {
      throw new Error('Invalid credentials');
    }

    if (!user.isActive) {
      throw new Error('Account is deactivated');
    }

    // Verify password
    const isPasswordValid = await user.comparePassword(password);
    if (!isPasswordValid) {
      // Log failed login attempt
      await AuditLog.create({
        userId: user._id,
        action: 'login_failed',
        resource: 'auth',
        method: 'POST',
        status: 'failure',
        errorMessage: 'Invalid password',
        ipAddress: deviceInfo.ipAddress,
        userAgent: deviceInfo.userAgent,
      });
      throw new Error('Invalid credentials');
    }

    // Generate tokens
    const { accessToken, refreshToken } = tokenService.generateTokenPair(user);

    // Create session
    await tokenService.createSession(user._id, refreshToken, deviceInfo);

    // Update last login
    user.lastLogin = new Date();
    await user.save();

    // Log successful login
    await AuditLog.create({
      userId: user._id,
      action: 'login_success',
      resource: 'auth',
      method: 'POST',
      status: 'success',
      ipAddress: deviceInfo.ipAddress,
      userAgent: deviceInfo.userAgent,
    });

    logger.info(`User logged in: ${email}`);
    return {
      user,
      accessToken,
      refreshToken,
    };
  } catch (error) {
    logger.error('Error in login service:', error);
    throw error;
  }
};

const verifyEmail = async (email, otp) => {
  try {
    const verification = await otpService.verifyOTP(email, otp, 'email');
    if (!verification.valid) {
      throw new Error(verification.message);
    }

    const user = await User.findOneAndUpdate(
      { email },
      { isEmailVerified: true },
      { new: true }
    );

    if (!user) {
      throw new Error('User not found');
    }

    await AuditLog.create({
      userId: user._id,
      action: 'email_verified',
      resource: 'user',
      resourceId: user._id,
      status: 'success',
    });

    return user;
  } catch (error) {
    logger.error('Error in verifyEmail service:', error);
    throw error;
  }
};

const requestPasswordReset = async (email) => {
  try {
    const user = await User.findOne({ email });
    if (!user) {
      // Don't reveal if user exists for security
      return { message: 'If the email exists, a password reset OTP has been sent' };
    }

    await otpService.createOTP(email, 'password_reset');

    await AuditLog.create({
      userId: user._id,
      action: 'password_reset_requested',
      resource: 'auth',
      status: 'success',
    });

    return { message: 'If the email exists, a password reset OTP has been sent' };
  } catch (error) {
    logger.error('Error in requestPasswordReset service:', error);
    throw error;
  }
};

const resetPassword = async (email, otp, newPassword) => {
  try {
    if (!validatePassword(newPassword)) {
      throw new Error('Password must be at least 6 characters long');
    }

    const verification = await otpService.verifyOTP(email, otp, 'password_reset');
    if (!verification.valid) {
      throw new Error(verification.message);
    }

    const user = await User.findOne({ email });
    if (!user) {
      throw new Error('User not found');
    }

    user.password = newPassword;
    await user.save();

    // Revoke all sessions for security
    await tokenService.revokeAllUserSessions(user._id);

    await AuditLog.create({
      userId: user._id,
      action: 'password_reset',
      resource: 'auth',
      status: 'success',
    });

    return user;
  } catch (error) {
    logger.error('Error in resetPassword service:', error);
    throw error;
  }
};

const logout = async (refreshToken, userId) => {
  try {
    await tokenService.revokeSession(refreshToken);

    await AuditLog.create({
      userId,
      action: 'logout',
      resource: 'auth',
      status: 'success',
    });

    return { message: 'Logged out successfully' };
  } catch (error) {
    logger.error('Error in logout service:', error);
    throw error;
  }
};

module.exports = {
  register,
  login,
  verifyEmail,
  requestPasswordReset,
  resetPassword,
  logout,
};
