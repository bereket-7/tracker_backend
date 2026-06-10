const jwt = require('jsonwebtoken');
const User = require('../models/User');
const RefreshToken = require('../models/RefreshToken');
const config = require('../config/env');

class AuthService {
  static generateAccessToken(userId) {
    return jwt.sign({ id: userId, type: 'access' }, config.jwt.secret, {
      expiresIn: config.jwt.expire,
    });
  }

  static generateRefreshToken(userId) {
    return jwt.sign({ id: userId, type: 'refresh' }, config.jwt.refreshSecret, {
      expiresIn: config.jwt.refreshExpire,
    });
  }

  static async saveRefreshToken(userId, token) {
    const decoded = jwt.decode(token);
    await RefreshToken.create({
      token,
      userId,
      expiresAt: new Date(decoded.exp * 1000),
    });
  }

  static async register(name, email, password) {
    const existingUser = await User.findOne({ email });
    if (existingUser) {
      const error = new Error('Authentication failed');
      error.statusCode = 400;
      throw error;
    }

    const user = await User.create({ name, email, password });
    const accessToken = this.generateAccessToken(user._id);
    const refreshToken = this.generateRefreshToken(user._id);
    
    await this.saveRefreshToken(user._id, refreshToken);
    
    return { user, accessToken, refreshToken };
  }

  static async login(email, password) {
    const user = await User.findOne({ email, isActive: true }).select('+password');
    
    if (!user || !(await user.comparePassword(password))) {
      const error = new Error('Authentication failed');
      error.statusCode = 401;
      throw error;
    }

    user.lastLogin = new Date();
    await user.save();

    const accessToken = this.generateAccessToken(user._id);
    const refreshToken = this.generateRefreshToken(user._id);
    
    await this.saveRefreshToken(user._id, refreshToken);
    
    user.password = undefined;
    return { user, accessToken, refreshToken };
  }

  static async refresh(refreshToken) {
    try {
      const decoded = jwt.verify(refreshToken, config.jwt.refreshSecret);
      
      if (decoded.type !== 'refresh') {
        throw new Error('Invalid token type');
      }

      const storedToken = await RefreshToken.findOne({
        token: refreshToken,
        userId: decoded.id,
        isRevoked: false,
      });

      if (!storedToken || storedToken.expiresAt < new Date()) {
        throw new Error('Invalid or expired refresh token');
      }

      const user = await User.findById(decoded.id);
      if (!user || !user.isActive) {
        throw new Error('User not found');
      }

      const newAccessToken = this.generateAccessToken(user._id);
      const newRefreshToken = this.generateRefreshToken(user._id);

      // Revoke old refresh token
      storedToken.isRevoked = true;
      await storedToken.save();

      // Save new refresh token
      await this.saveRefreshToken(user._id, newRefreshToken);

      return { accessToken: newAccessToken, refreshToken: newRefreshToken };
    } catch (error) {
      const err = new Error('Invalid or expired refresh token');
      err.statusCode = 401;
      throw err;
    }
  }

  static async logout(refreshToken) {
    await RefreshToken.updateOne(
      { token: refreshToken },
      { isRevoked: true }
    );
  }

  static async revokeAllUserTokens(userId) {
    await RefreshToken.updateMany(
      { userId, isRevoked: false },
      { isRevoked: true }
    );
  }
}

module.exports = AuthService;
