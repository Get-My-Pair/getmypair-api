const mongoose = require('mongoose');
const OTP = require('../src/models/otp.model');
const otpService = require('../src/services/otp.service');

describe('OTP Service', () => {
  beforeAll(async () => {
    const mongoUri = process.env.MONGODB_URI || 'mongodb://localhost:27017/getmypair-test';
    await mongoose.connect(mongoUri);
  });

  afterAll(async () => {
    await OTP.deleteMany({});
    await mongoose.connection.close();
  });

  beforeEach(async () => {
    await OTP.deleteMany({});
  });

  describe('createOTP', () => {
    it('should create a new OTP', async () => {
      const result = await otpService.createOTP(
        'test@example.com',
        null,
        'email',
        'verification'
      );

      expect(result).toHaveProperty('otp');
      expect(result).toHaveProperty('expiresAt');
      expect(result.otp).toHaveLength(6);
    });

    it('should delete existing unused OTPs', async () => {
      await otpService.createOTP('test@example.com', null, 'email', 'verification');
      await otpService.createOTP('test@example.com', null, 'email', 'verification');

      const otps = await OTP.find({ email: 'test@example.com', isUsed: false });
      expect(otps.length).toBe(1);
    });
  });

  describe('verifyOTP', () => {
    it('should verify valid OTP', async () => {
      const { otp } = await otpService.createOTP(
        'test@example.com',
        null,
        'email',
        'verification'
      );

      const result = await otpService.verifyOTP(
        'test@example.com',
        null,
        otp,
        'email'
      );

      expect(result.valid).toBe(true);
    });

    it('should reject invalid OTP', async () => {
      await otpService.createOTP('test@example.com', null, 'email', 'verification');

      const result = await otpService.verifyOTP(
        'test@example.com',
        null,
        '000000',
        'email'
      );

      expect(result.valid).toBe(false);
    });

    it('should reject expired OTP', async () => {
      // Create OTP with short expiration (for testing)
      const otp = new OTP({
        email: 'test@example.com',
        otp: '123456',
        type: 'email',
        expiresAt: new Date(Date.now() - 1000), // Expired 1 second ago
      });
      await otp.save();

      const result = await otpService.verifyOTP(
        'test@example.com',
        null,
        '123456',
        'email'
      );

      expect(result.valid).toBe(false);
    });
  });

  describe('checkRateLimit', () => {
    it('should return false when under rate limit', async () => {
      const result = await otpService.checkRateLimit(
        'test@example.com',
        null,
        'email'
      );
      expect(result).toBe(false);
    });
  });
});
