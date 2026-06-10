const AuthService = require('../../services/auth.service');
const User = require('../../models/User');
const RefreshToken = require('../../models/RefreshToken');

describe('AuthService', () => {
  describe('register', () => {
    it('should register a new user successfully', async () => {
      const userData = {
        name: 'Test User',
        email: 'test@example.com',
        password: 'password123',
      };

      const result = await AuthService.register(userData.name, userData.email, userData.password);

      expect(result).toHaveProperty('user');
      expect(result).toHaveProperty('accessToken');
      expect(result).toHaveProperty('refreshToken');
      expect(result.user.email).toBe(userData.email);
      expect(result.user.password).toBeUndefined();
    });

    it('should throw error for duplicate email', async () => {
      const userData = {
        name: 'Test User',
        email: 'test@example.com',
        password: 'password123',
      };

      await AuthService.register(userData.name, userData.email, userData.password);

      await expect(
        AuthService.register(userData.name, userData.email, userData.password)
      ).rejects.toThrow('Authentication failed');
    });
  });

  describe('login', () => {
    beforeEach(async () => {
      await AuthService.register('Test User', 'test@example.com', 'password123');
    });

    it('should login successfully with correct credentials', async () => {
      const result = await AuthService.login('test@example.com', 'password123');

      expect(result).toHaveProperty('user');
      expect(result).toHaveProperty('accessToken');
      expect(result).toHaveProperty('refreshToken');
      expect(result.user.email).toBe('test@example.com');
    });

    it('should throw error with incorrect password', async () => {
      await expect(
        AuthService.login('test@example.com', 'wrongpassword')
      ).rejects.toThrow('Authentication failed');
    });

    it('should throw error with non-existent email', async () => {
      await expect(
        AuthService.login('nonexistent@example.com', 'password123')
      ).rejects.toThrow('Authentication failed');
    });
  });

  describe('refresh', () => {
    it('should refresh tokens successfully', async () => {
      const { refreshToken } = await AuthService.register('Test User', 'test@example.com', 'password123');

      const result = await AuthService.refresh(refreshToken);

      expect(result).toHaveProperty('accessToken');
      expect(result).toHaveProperty('refreshToken');
      expect(result.accessToken).toBeDefined();
      expect(result.refreshToken).toBeDefined();
    });

    it('should throw error with invalid refresh token', async () => {
      await expect(
        AuthService.refresh('invalid-token')
      ).rejects.toThrow('Invalid or expired refresh token');
    });

    it('should throw error with revoked refresh token', async () => {
      const { refreshToken } = await AuthService.register('Test User', 'test@example.com', 'password123');
      
      await AuthService.logout(refreshToken);

      await expect(
        AuthService.refresh(refreshToken)
      ).rejects.toThrow('Invalid or expired refresh token');
    });
  });
});
