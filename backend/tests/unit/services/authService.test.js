const authService = require('../../../src/services/authService');
const userRepository = require('../../../src/repositories/userRepository');
const { generateToken } = require('../../../src/config/jwt');
const { AppError } = require('../../../src/middlewares/errorMiddleware');

// Mock dependencies
jest.mock('../../../src/repositories/userRepository');
jest.mock('../../../src/config/jwt');

describe('AuthService', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('register', () => {
    const mockUserData = {
      name: 'John Doe',
      email: 'john@example.com',
      password: 'password123'
    };

    it('should register a new user successfully', async () => {
      const mockUser = {
        _id: 'mockUserId',
        name: 'John Doe',
        email: 'john@example.com'
      };
      const mockToken = 'mockJwtToken';

      userRepository.findByEmailWithoutPassword.mockResolvedValue(null);
      userRepository.create.mockResolvedValue(mockUser);
      generateToken.mockReturnValue(mockToken);

      const result = await authService.register(mockUserData);

      expect(result.success).toBe(true);
      expect(result.data.user).toEqual(mockUser);
      expect(result.data.token).toBe(mockToken);
      expect(result.message).toBe('User registered successfully');
    });

    it('should throw error if user already exists', async () => {
      const existingUser = { email: 'john@example.com' };
      
      userRepository.findByEmailWithoutPassword.mockResolvedValue(existingUser);

      await expect(authService.register(mockUserData))
        .rejects.toThrow(AppError);
    });
  });

  describe('login', () => {
    const mockLoginData = {
      email: 'john@example.com',
      password: 'password123'
    };

    it('should login user with valid credentials', async () => {
      const mockUser = {
        _id: 'mockUserId',
        email: 'john@example.com',
        isActive: true,
        matchPassword: jest.fn().mockResolvedValue(true)
      };
      const mockToken = 'mockJwtToken';

      userRepository.findByEmail.mockResolvedValue(mockUser);
      generateToken.mockReturnValue(mockToken);

      const result = await authService.login(mockLoginData);

      expect(result.success).toBe(true);
      expect(result.data.token).toBe(mockToken);
      expect(result.message).toBe('Login successful');
    });

    it('should throw error for invalid email', async () => {
      userRepository.findByEmail.mockResolvedValue(null);

      await expect(authService.login(mockLoginData))
        .rejects.toThrow(AppError);
    });

    it('should throw error for invalid password', async () => {
      const mockUser = {
        isActive: true,
        matchPassword: jest.fn().mockResolvedValue(false)
      };

      userRepository.findByEmail.mockResolvedValue(mockUser);

      await expect(authService.login(mockLoginData))
        .rejects.toThrow(AppError);
    });

    it('should throw error for inactive user', async () => {
      const mockUser = {
        isActive: false,
        matchPassword: jest.fn().mockResolvedValue(true)
      };

      userRepository.findByEmail.mockResolvedValue(mockUser);

      await expect(authService.login(mockLoginData))
        .rejects.toThrow(AppError);
    });
  });

  describe('getCurrentUser', () => {
    it('should return current user', async () => {
      const mockUser = {
        _id: 'mockUserId',
        name: 'John Doe',
        email: 'john@example.com'
      };

      userRepository.findById.mockResolvedValue(mockUser);

      const result = await authService.getCurrentUser('mockUserId');

      expect(result.success).toBe(true);
      expect(result.data).toEqual(mockUser);
    });

    it('should throw error if user not found', async () => {
      userRepository.findById.mockResolvedValue(null);

      await expect(authService.getCurrentUser('mockUserId'))
        .rejects.toThrow(AppError);
    });
  });

  describe('validateUserData', () => {
    it('should return empty array for valid data', () => {
      const validData = {
        name: 'John Doe',
        email: 'john@example.com',
        password: 'password123'
      };

      const errors = authService.validateUserData(validData);
      expect(errors).toEqual([]);
    });

    it('should return errors for invalid data', () => {
      const invalidData = {
        name: 'J',
        email: 'invalid-email',
        password: '123'
      };

      const errors = authService.validateUserData(invalidData);
      expect(errors).toHaveLength(3);
    });
  });
});