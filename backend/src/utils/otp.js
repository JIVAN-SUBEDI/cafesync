// src/utils/otp.js
const crypto = require('crypto');

class OTPService {
  constructor() {
    // Store OTPs in memory with expiration (in production, use Redis)
    this.otpStore = new Map();
    
    // OTP configuration
    this.OTP_LENGTH = 6;
    this.OTP_EXPIRY = 5 * 60 * 1000; // 5 minutes
    this.MAX_ATTEMPTS = 5;
  }

  /**
   * Generate a numeric OTP
   * @returns {string} 6-digit OTP
   */
  generateOTP() {
    return crypto.randomInt(100000, 999999).toString();
  }

  /**
   * Store OTP for a hotel
   * @param {string} hotelId - Hotel ID
   * @param {string} email - Hotel admin email
   * @returns {Object} OTP data
   */
  createOTP(hotelId, email) {
    const otp = this.generateOTP();
    const expiresAt = Date.now() + this.OTP_EXPIRY;
    
    this.otpStore.set(hotelId, {
      otp,
      email,
      expiresAt,
      attempts: 0,
      verified: false,
      createdAt: Date.now()
    });

    // Auto cleanup after expiry
    setTimeout(() => {
      this.otpStore.delete(hotelId);
    }, this.OTP_EXPIRY);

    return { otp, expiresAt };
  }

  /**
   * Verify OTP for a hotel
   * @param {string} hotelId - Hotel ID
   * @param {string} enteredOtp - OTP entered by user
   * @returns {Object} Verification result
   */
  verifyOTP(hotelId, enteredOtp) {
    const otpData = this.otpStore.get(hotelId);
    
    if (!otpData) {
      return { 
        success: false, 
        message: 'OTP not found or expired. Please request a new one.' 
      };
    }

    // Check if already verified
    if (otpData.verified) {
      return { 
        success: false, 
        message: 'OTP already verified. Please proceed with password change.' 
      };
    }

    // Check expiry
    if (Date.now() > otpData.expiresAt) {
      this.otpStore.delete(hotelId);
      return { 
        success: false, 
        message: 'OTP has expired. Please request a new one.' 
      };
    }

    // Check attempts
    if (otpData.attempts >= this.MAX_ATTEMPTS) {
      this.otpStore.delete(hotelId);
      return { 
        success: false, 
        message: 'Maximum attempts exceeded. Please request a new OTP.' 
      };
    }

    // Increment attempts
    otpData.attempts += 1;

    // Verify OTP
    if (otpData.otp !== enteredOtp) {
      return { 
        success: false, 
        message: `Invalid OTP. ${this.MAX_ATTEMPTS - otpData.attempts} attempts remaining.` 
      };
    }

    // Mark as verified
    otpData.verified = true;
    this.otpStore.set(hotelId, otpData);

    return { 
      success: true, 
      message: 'OTP verified successfully' 
    };
  }

  /**
   * Check if OTP is verified for a hotel
   * @param {string} hotelId - Hotel ID
   * @returns {boolean}
   */
  isVerified(hotelId) {
    const otpData = this.otpStore.get(hotelId);
    return otpData?.verified || false;
  }

  /**
   * Clear OTP data after successful password change
   * @param {string} hotelId - Hotel ID
   */
  clearOTP(hotelId) {
    this.otpStore.delete(hotelId);
  }

  /**
   * Resend OTP (creates new one)
   * @param {string} hotelId - Hotel ID
   * @param {string} email - Hotel admin email
   * @returns {Object} New OTP data
   */
  resendOTP(hotelId, email) {
    // Clear existing OTP
    this.otpStore.delete(hotelId);
    // Create new OTP
    return this.createOTP(hotelId, email);
  }
}

module.exports = new OTPService();