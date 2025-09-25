const User = require('../models/User');

class UserRepository {
  async create(userData) {
    try {
      const user = new User(userData);
      return await user.save();
    } catch (error) {
      throw error;
    }
  }

  async findById(id) {
    try {
      return await User.findById(id).select('-password');
    } catch (error) {
      throw error;
    }
  }

  async findByEmail(email) {
    try {
      return await User.findOne({ email }).select('+password');
    } catch (error) {
      throw error;
    }
  }

  async findByEmailWithoutPassword(email) {
    try {
      return await User.findOne({ email });
    } catch (error) {
      throw error;
    }
  }

  async update(id, updateData) {
    try {
      return await User.findByIdAndUpdate(
        id,
        { $set: updateData },
        { new: true, runValidators: true }
      ).select('-password');
    } catch (error) {
      throw error;
    }
  }

  async delete(id) {
    try {
      return await User.findByIdAndDelete(id);
    } catch (error) {
      throw error;
    }
  }

  async findAll(query = {}) {
    try {
      return await User.find(query).select('-password');
    } catch (error) {
      throw error;
    }
  }

  async updatePassword(id, hashedPassword) {
    try {
      return await User.findByIdAndUpdate(
        id,
        { password: hashedPassword },
        { new: true }
      ).select('-password');
    } catch (error) {
      throw error;
    }
  }

  async checkEmailExists(email, excludeId = null) {
    try {
      const query = { email };
      if (excludeId) {
        query._id = { $ne: excludeId };
      }
      const user = await User.findOne(query);
      return !!user;
    } catch (error) {
      throw error;
    }
  }
}

module.exports = new UserRepository();