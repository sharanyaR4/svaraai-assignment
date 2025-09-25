const authController = require('../../../src/controllers/authController');
const authService = require('../../../src/services/authService');
const { validationResult } = require('express-validator');

// Mock dependencies
jest.mock('../../../src/services/authService');
jest.mock('express-validator');

describe('AuthController', () => {
  let req, res, next;

  beforeEach(() => {
    req = {
      body: {},
      user: { id: 'mockUserId' }
    };
    res = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn()
    };
    next = jest.fn();
    jest.clearAllMocks();
  });

  describe('register', () => {
    it('should register user successfully', async () => {
      const mockResult = {
        success: true,
        data: { user: { name: 'John' }, token: 'mockToken' },
        message: 'User registered successfully'
      };

      validationResult.mockReturnValue({ isEmpty: () => true });
      authService.register.mockResolvedValue(mockResult);

      req.body = {
        name: 'John Doe',
        email: 'john@example.com',
        password: 'password123'
      };

      await authController.register(req, res, next);

      expect(res.status).toHaveBeenCalledWith(201);
      expect(res.json).toHaveBeenCalledWith(mockResult);
      expect(authService.register).toHaveBeenCalledWith(req.body);
    });

    it('should return validation errors', async () => {
      const mockErrors = [
        { field: 'email', message: 'Invalid email' }
      ];

      validationResult.mockReturnValue({
        isEmpty: () => false,
        array: () => mockErrors
      });

      await authController.register(req, res, next);

      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.json).toHaveBeenCalledWith({
        success: false,
        message: 'Validation failed',
        errors: mockErrors
      });
    });

    it('should handle service errors', async () => {
      const mockError = new Error('Service error');

      validationResult.mockReturnValue({ isEmpty: () => true });
      authService.register.mockRejectedValue(mockError);

      await authController.register(req, res, next);

      expect(next).toHaveBeenCalledWith(mockError);
    });
  });

  describe('login', () => {
    it('should login user successfully', async () => {
      const mockResult = {
        success: true,
        data: { user: { name: 'John' }, token: 'mockToken' },
        message: 'Login successful'
      };

      validationResult.mockReturnValue({ isEmpty: () => true });
      authService.login.mockResolvedValue(mockResult);

      req.body = {
        email: 'john@example.com',
        password: 'password123'
      };

      await authController.login(req, res, next);

      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.json).toHaveBeenCalledWith(mockResult);
      expect(authService.login).toHaveBeenCalledWith(req.body);
    });
  });

  describe('getCurrentUser', () => {
    it('should get current user successfully', async () => {
      const mockResult = {
        success: true,
        data: { name: 'John Doe', email: 'john@example.com' }
      };

      authService.getCurrentUser.mockResolvedValue(mockResult);

      await authController.getCurrentUser(req, res, next);

      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.json).toHaveBeenCalledWith(mockResult);
      expect(authService.getCurrentUser).toHaveBeenCalledWith('mockUserId');
    });
  });

  describe('updateProfile', () => {
    it('should update profile successfully', async () => {
      const mockResult = {
        success: true,
        data: { name: 'Jane Doe', email: 'jane@example.com' },
        message: 'Profile updated successfully'
      };

      validationResult.mockReturnValue({ isEmpty: () => true });
      authService.updateProfile.mockResolvedValue(mockResult);

      req.body = {
        name: 'Jane Doe',
        email: 'jane@example.com'
      };

      await authController.updateProfile(req, res, next);

      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.json).toHaveBeenCalledWith(mockResult);
      expect(authService.updateProfile).toHaveBeenCalledWith('mockUserId', req.body);
    });
  });

  describe('changePassword', () => {
    it('should change password successfully', async () => {
      const mockResult = {
        success: true,
        message: 'Password changed successfully'
      };

      validationResult.mockReturnValue({ isEmpty: () => true });
      authService.changePassword.mockResolvedValue(mockResult);

      req.body = {
        currentPassword: 'oldPassword',
        newPassword: 'newPassword123'
      };

      await authController.changePassword(req, res, next);

      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.json).toHaveBeenCalledWith(mockResult);
      expect(authService.changePassword).toHaveBeenCalledWith('mockUserId', req.body);
    });
  });

  describe('logout', () => {
    it('should logout successfully', async () => {
      await authController.logout(req, res, next);

      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.json).toHaveBeenCalledWith({
        success: true,
        message: 'Logged out successfully'
      });
    });

    it('should handle logout errors', async () => {
      const mockError = new Error('Logout error');
      // Mock an error scenario
      res.json.mockImplementation(() => {
        throw mockError;
      });

      await authController.logout(req, res, next);

      expect(next).toHaveBeenCalledWith(mockError);
    });
  });
});