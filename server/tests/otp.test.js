const otpService = require('../src/services/otp.service');
const OTP = require('../src/models/otp.model');
const mongoose = require('mongoose');

describe('OTP Service', () => {
  beforeAll(async () => {
    await mongoose.connect(process.env.TEST_DB_URI || 'mongodb://localhost:27017/getmypair-test');
  });

  afterAll(async () => {
    await OTP.deleteMany({});
    await mongoose.connection.close();
  });

  beforeEach(async () => {
    await OTP.deleteMany({});
  });

  describe('generateOTP', () => {
    it('should generate a 6-digit OTP by default', () => {
      const otp = otpService.generateOTP();
      expect(otp).toHaveLength(6);
      expect(otp).toMatch(/^\d+$/);
    });

    it('should generate OTP of specified length', () => {
      const otp = otpService.generateOTP(4);
      expect(otp).toHaveLength(4);
      expect(otp).toMatch(/^\d+$/);
    });
  });

  describe('createOTP', () => {
    it('should create a new OTP', async () => {
      const otpDoc = await otpService.createOTP('test@example.com', 'email');
      
      expect(otpDoc).toHaveProperty('identifier', 'test@example.com');
      expect(otpDoc).toHaveProperty('type', 'email');
      expect(otpDoc).toHaveProperty('otp');
      expect(otpDoc.otp).toHaveLength(6);
      expect(otpDoc.isUsed).toBe(false);
    });

    it('should invalidate existing unused OTPs', async () => {
      const firstOTP = await otpService.createOTP('test@example.com', 'email');
      const secondOTP = await otpService.createOTP('test@example.com', 'email');

      const firstOTPDoc = await OTP.findById(firstOTP._id);
      expect(firstOTPDoc.isUsed).toBe(true);
      expect(secondOTP.isUsed).toBe(false);
    });
  });

  describe('verifyOTP', () => {
    it('should verify a valid OTP', async () => {
      const otpDoc = await otpService.createOTP('test@example.com', 'email');
      const result = await otpService.verifyOTP('test@example.com', otpDoc.otp, 'email');

      expect(result.valid).toBe(true);
      expect(result.message).toBe('OTP verified successfully');

      const updatedOTP = await OTP.findById(otpDoc._id);
      expect(updatedOTP.isUsed).toBe(true);
    });

    it('should reject invalid OTP', async () => {
      await otpService.createOTP('test@example.com', 'email');
      const result = await otpService.verifyOTP('test@example.com', '000000', 'email');

      expect(result.valid).toBe(false);
      expect(result.message).toBe('Invalid OTP');
    });

    it('should reject expired OTP', async () => {
      const otpDoc = await otpService.createOTP('test@example.com', 'email');
      
      // Manually expire the OTP
      await OTP.findByIdAndUpdate(otpDoc._id, {
        expiresAt: new Date(Date.now() - 1000),
      });

      const result = await otpService.verifyOTP('test@example.com', otpDoc.otp, 'email');
      expect(result.valid).toBe(false);
      expect(result.message).toBe('OTP not found or expired');
    });
  });
});
