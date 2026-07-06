const BaseModel = require('./BaseModel');
const db = require('../config/database');
const bcrypt = require('bcryptjs');
const { v4: uuidv4 } = require('uuid');

class RegisteredUser extends BaseModel {
  constructor() {
    super('registered_users');
  }

  async findByEmail(email) {
    const query = 'SELECT * FROM registered_users WHERE email = $1';
    const result = await db.query(query, [email]);
    return result.rows[0];
  }

  async createUser(userData) {
    // Validate email format
    const emailRegex = /^[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}$/;
    if (!emailRegex.test(userData.email)) {
      throw new Error('Invalid email format');
    }

    // Check if email already exists
    const existingUser = await this.findByEmail(userData.email);
    if (existingUser) {
      throw new Error('Email already registered');
    }

    // Hash password
    const salt = await bcrypt.genSalt(10);
    userData.password_hash = await bcrypt.hash(userData.password, salt);
    delete userData.password;

    // Generate email verification token
    userData.email_verification_token = uuidv4();
    userData.email_verification_expires = new Date(Date.now() + 24 * 60 * 60 * 1000); // 24 hours

    return await this.create(userData);
  }

  async verifyPassword(password, hashedPassword) {
    return await bcrypt.compare(password, hashedPassword);
  }

  async verifyEmail(token) {
    const user = await this.findOne({ 
      email_verification_token: token,
      email_verification_expires: { $gt: new Date() }
    });

    if (!user) {
      throw new Error('Invalid or expired verification token');
    }

    await this.update(user.id, {
      email_verified: true,
      email_verification_token: null,
      email_verification_expires: null
    });

    return true;
  }

  async updateLastLogin(userId) {
    return await this.update(userId, { last_login: new Date() });
  }

  async requestPasswordReset(email) {
    const user = await this.findByEmail(email);
    if (!user) {
      // Don't reveal if user exists for security
      return null;
    }

    const resetToken = uuidv4();
    const resetExpires = new Date(Date.now() + 1 * 60 * 60 * 1000); // 1 hour

    await this.update(user.id, {
      password_reset_token: resetToken,
      password_reset_expires: resetExpires
    });

    return {
      userId: user.id,
      resetToken,
      resetExpires
    };
  }

  async resetPassword(token, newPassword) {
    const user = await this.findOne({ 
      password_reset_token: token,
      password_reset_expires: { $gt: new Date() }
    });

    if (!user) {
      throw new Error('Invalid or expired reset token');
    }

    const salt = await bcrypt.genSalt(10);
    const password_hash = await bcrypt.hash(newPassword, salt);

    await this.update(user.id, {
      password_hash,
      password_reset_token: null,
      password_reset_expires: null,
      last_password_change: new Date()
    });

    return true;
  }
}

module.exports = new RegisteredUser();