const mongoose = require('mongoose');
const User = require('../../../src/models/User');
const userRepository = require('../../../src/repositories/userRepository');

describe('UserRepository', () => {
  beforeAll(async () => {
    const MONGODB_URI = process.env.MONGODB_URI_TEST || 'mongodb://localhost:27017/svaraai-tasks-test';
    await mongoose.connect(MONGODB_URI);
  });

  beforeEach(async () => {
    await User.deleteMany({});
  });

  afterAll(async () => {
    await mongoose.connection.close();
  });

  describe('create', () => {
    it('should create a new user', async () => {
      const userData = {
        name: 'John Doe',
        email: 'john@example.com',
        password: 'password123'
      };

      const user = await userRepository.create(userData);

      expect(user._id).toBeDefined();
      expect(user.name).toBe(userData.name);
      expect(user.email).toBe(userData.email);
      expect(user.password).not.toBe(userData.password); // Should be hashed
    });

    it('should throw error for duplicate email', async () => {
      const userData = {
        name: 'John Doe',
        email: 'john@example.com',
        password: 'password123'
      };

      await userRepository.create(userData);

      await expect(userRepository.create(userData))
        .rejects.toThrow();
    });
  });

  describe('findById', () => {
    it('should find user by id', async () => {
      const userData = {
        name: 'John Doe',
        email: 'john@example.com',
        password: 'password123'
      };

      const createdUser = await userRepository.create(userData);
      const foundUser = await userRepository.findById(createdUser._id);

      expect(foundUser._id.toString()).toBe(createdUser._id.toString());
      expect(foundUser.name).toBe(userData.name);
      expect(foundUser.password).toBeUndefined(); // Should not include password
    });

    it('should return null for non-existent user', async () => {
      const nonExistentId = new mongoose.Types.ObjectId();
      const user = await userRepository.findById(nonExistentId);
      
      expect(user).toBeNull();
    });
  });

  describe('findByEmail', () => {
    it('should find user by email with password', async () => {
      const userData = {
        name: 'John Doe',
        email: 'john@example.com',
        password: 'password123'
      };

      await userRepository.create(userData);
      const foundUser = await userRepository.findByEmail(userData.email);

      expect(foundUser.email).toBe(userData.email);
      expect(foundUser.password).toBeDefined(); // Should include password
    });

    it('should return null for non-existent email', async () => {
      const user = await userRepository.findByEmail('nonexistent@example.com');
      expect(user).toBeNull();
    });
  });

  describe('update', () => {
    it('should update user data', async () => {
      const userData = {
        name: 'John Doe',
        email: 'john@example.com',
        password: 'password123'
      };

      const createdUser = await userRepository.create(userData);
      const updateData = {
        name: 'Jane Doe',
        email: 'jane@example.com'
      };

      const updatedUser = await userRepository.update(createdUser._id, updateData);

      expect(updatedUser.name).toBe(updateData.name);
      expect(updatedUser.email).toBe(updateData.email);
    });
  });

  describe('delete', () => {
    it('should delete user', async () => {
      const userData = {
        name: 'John Doe',
        email: 'john@example.com',
        password: 'password123'
      };

      const createdUser = await userRepository.create(userData);
      await userRepository.delete(createdUser._id);

      const deletedUser = await userRepository.findById(createdUser._id);
      expect(deletedUser).toBeNull();
    });
  });

  describe('checkEmailExists', () => {
    it('should return true if email exists', async () => {
      const userData = {
        name: 'John Doe',
        email: 'john@example.com',
        password: 'password123'
      };

      await userRepository.create(userData);
      const exists = await userRepository.checkEmailExists(userData.email);

      expect(exists).toBe(true);
    });

    it('should return false if email does not exist', async () => {
      const exists = await userRepository.checkEmailExists('nonexistent@example.com');
      expect(exists).toBe(false);
    });

    it('should exclude specific user from check', async () => {
      const userData = {
        name: 'John Doe',
        email: 'john@example.com',
        password: 'password123'
      };

      const createdUser = await userRepository.create(userData);
      const exists = await userRepository.checkEmailExists(userData.email, createdUser._id);

      expect(exists).toBe(false);
    });
  });
});