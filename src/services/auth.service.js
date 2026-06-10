const jwt = require('jsonwebtoken');
const User = require('../models/User');
const config = require('../config/env');

class AuthService {
  static generateToken(userId) {
    return jwt.sign({ id: userId }, config.jwt.secret, {
      expiresIn: config.jwt.expire,
    });
  }

  static async register(name, email, password) {
    const user = await User.create({ name, email, password });
    const token = this.generateToken(user._id);
    return { user, token };
  }

  static async login(email, password) {
    const user = await User.findOne({ email }).select('+password');
    
    if (!user || !(await user.comparePassword(password))) {
      throw new Error('Invalid credentials');
    }

    const token = this.generateToken(user._id);
    user.password = undefined;
    return { user, token };
  }
}

module.exports = AuthService;
