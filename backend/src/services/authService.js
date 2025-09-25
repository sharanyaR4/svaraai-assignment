const bcrypt = require('bcryptjs');
const userRepository = require('../repositories/userRepository');
const { generateToken } = require('../config/jwt');
const { AppError } = require('../middlewares/errorMiddleware');

class AuthService {
  async register(userData) {
    try {
      const { name, email, password } = userData;

      // Check if user already exists
      const existingUser = await userRepository.findByEmailWithoutPassword(email);
      if (existingUser) {
        throw new AppError('User already exists with this email', 409);
      }

      // Create user
      const user = await userRepository.create({
        name,
        email,
        password
      });

      // Generate token
      const token = generateToken(user._id);

      return {
        success: true,
        data: {
          user,
          token
        },
        message: 'User registered successfully'
      };
    } catch (error) {
      throw error;
    }
  }

  async login(loginData) {
    try {
      const { email, password } = loginData;

      // Find user with password
      const user = await userRepository.findByEmail(email);
      if (!user) {
        throw new AppError('Invalid email or password', 401);
      }

      // Check if user is active
      if (!user.isActive) {
        throw new AppError('Account has been deactivated', 401);
      }

      // Validate password
      const isPasswordValid = await user.matchPassword(password);
      if (!isPasswordValid) {
        throw new AppError('Invalid email or password', 401);
      }

      // Generate token
      const token = generateToken(user._id);

      // Remove password from response
      user.password = undefined;

      return {
        success: true,
        data: {
          user,
          token
        },
        message: 'Login successful'
      };
    } catch (error) {
      throw error;
    }
  }

  async getCurrentUser(userId) {
    try {
      const user = await userRepository.findById(userId);
      if (!user) {
        throw new AppError('User not found', 404);
      }

      return {
        success: true,
        data: user,
        message: 'User retrieved successfully'
      };
    } catch (error) {
      throw error;
    }
  }

  async updateProfile(userId, updateData) {
    try {
      const { name, email, avatar } = updateData;

      // Check if email is being updated and already exists
      if (email) {
        const emailExists = await userRepository.checkEmailExists(email, userId);
        if (emailExists) {
          throw new AppError('Email already exists', 409);
        }
      }

      const updatedUser = await userRepository.update(userId, {
        name,
        email,
        avatar
      });

      if (!updatedUser) {
        throw new AppError('User not found', 404);
      }

      return {
        success: true,
        data: updatedUser,
        message: 'Profile updated successfully'
      };
    } catch (error) {
      throw error;
    }
  }

  async changePassword(userId, passwordData) {
    try {
      const { currentPassword, newPassword } = passwordData;

      // Find user with password
      const user = await userRepository.findByEmail(
        (await userRepository.findById(userId)).email
      );

      if (!user) {
        throw new AppError('User not found', 404);
      }

      // Validate current password
      const isCurrentPasswordValid = await user.matchPassword(currentPassword);
      if (!isCurrentPasswordValid) {
        throw new AppError('Current password is incorrect', 400);
      }

      // Hash new password
      const salt = await bcrypt.genSalt(10);
      const hashedNewPassword = await bcrypt.hash(newPassword, salt);

      // Update password
      const updatedUser = await userRepository.updatePassword(userId, hashedNewPassword);

      return {
        success: true,
        data: updatedUser,
        message: 'Password changed successfully'
      };
    } catch (error) {
      throw error;
    }
  }

  async deactivateAccount(userId) {
    try {
      const updatedUser = await userRepository.update(userId, { isActive: false });
      
      if (!updatedUser) {
        throw new AppError('User not found', 404);
      }

      return {
        success: true,
        message: 'Account deactivated successfully'
      };
    } catch (error) {
      throw error;
    }
  }

  validateUserData(userData, isUpdate = false) {
    const errors = [];

    if (!isUpdate || userData.name !== undefined) {
      if (!userData.name || userData.name.trim().length < 2) {
        errors.push('Name must be at least 2 characters long');
      }
    }

    if (!isUpdate || userData.email !== undefined) {
      const emailRegex = /^\w+([.-]?\w+)*@\w+([.-]?\w+)*(\.\w{2,3})+$/;
      if (!userData.email || !emailRegex.test(userData.email)) {
        errors.push('Please provide a valid email address');
      }
    }

    if (!isUpdate || userData.password !== undefined) {
      if (!userData.password || userData.password.length < 6) {
        errors.push('Password must be at least 6 characters long');
      }
    }

    return errors;
  }
}

module.exports = new AuthService();