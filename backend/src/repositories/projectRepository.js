const Project = require('../models/Project');
const mongoose = require('mongoose');

class ProjectRepository {
  async create(projectData) {
    try {
      const project = new Project(projectData);
      return await project.save();
    } catch (error) {
      throw error;
    }
  }

  async findById(id) {
    try {
      return await Project.findById(id)
        .populate('owner', 'name email')
        .populate('taskCount');
    } catch (error) {
      throw error;
    }
  }

  async findByIdAndOwner(id, ownerId) {
    try {
      return await Project.findOne({ _id: id, owner: ownerId })
        .populate('owner', 'name email')
        .populate('taskCount');
    } catch (error) {
      throw error;
    }
  }

  async findAllByOwner(ownerId, options = {}) {
    try {
      const {
        page = 1,
        limit = 10,
        sortBy = 'createdAt',
        sortOrder = 'desc',
        status,
        priority,
        search
      } = options;

      const query = { owner: ownerId };

      // Add filters
      if (status) {
        query.status = status;
      }
      if (priority) {
        query.priority = priority;
      }
      if (search) {
        query.$text = { $search: search };
      }

      const sort = {};
      sort[sortBy] = sortOrder === 'desc' ? -1 : 1;

      const skip = (page - 1) * limit;

      const projects = await Project.find(query)
        .populate('owner', 'name email')
        .populate('taskCount')
        .sort(sort)
        .skip(skip)
        .limit(parseInt(limit));

      const total = await Project.countDocuments(query);

      return {
        projects,
        pagination: {
          current: page,
          total: Math.ceil(total / limit),
          totalItems: total,
          hasNext: page < Math.ceil(total / limit),
          hasPrev: page > 1
        }
      };
    } catch (error) {
      throw error;
    }
  }

  async update(id, ownerId, updateData) {
    try {
      return await Project.findOneAndUpdate(
        { _id: id, owner: ownerId },
        { $set: updateData },
        { new: true, runValidators: true }
      ).populate('owner', 'name email');
    } catch (error) {
      throw error;
    }
  }

  async delete(id, ownerId) {
    try {
      return await Project.findOneAndDelete({ _id: id, owner: ownerId });
    } catch (error) {
      throw error;
    }
  }

  async getProjectStats(ownerId) {
    try {
      // Convert ownerId to ObjectId if it's a string
      const ownerObjectId = mongoose.Types.ObjectId.isValid(ownerId) 
        ? new mongoose.Types.ObjectId(ownerId) 
        : ownerId;

      const stats = await Project.aggregate([
        { $match: { owner: ownerObjectId } },
        {
          $group: {
            _id: null,
            total: { $sum: 1 },
            active: {
              $sum: { $cond: [{ $eq: ['$status', 'active'] }, 1, 0] }
            },
            completed: {
              $sum: { $cond: [{ $eq: ['$status', 'completed'] }, 1, 0] }
            },
            onHold: {
              $sum: { $cond: [{ $eq: ['$status', 'on-hold'] }, 1, 0] }
            },
            cancelled: {
              $sum: { $cond: [{ $eq: ['$status', 'cancelled'] }, 1, 0] }
            },
            highPriority: {
              $sum: { $cond: [{ $eq: ['$priority', 'high'] }, 1, 0] }
            },
            mediumPriority: {
              $sum: { $cond: [{ $eq: ['$priority', 'medium'] }, 1, 0] }
            },
            lowPriority: {
              $sum: { $cond: [{ $eq: ['$priority', 'low'] }, 1, 0] }
            }
          }
        }
      ]);

      const result = stats.length > 0 ? stats[0] : {
        total: 0,
        active: 0,
        completed: 0,
        onHold: 0,
        cancelled: 0,
        highPriority: 0,
        mediumPriority: 0,
        lowPriority: 0
      };

      return {
        total: result.total,
        active: result.active,
        completed: result.completed,
        onHold: result.onHold,
        cancelled: result.cancelled,
        byStatus: {
          active: result.active,
          completed: result.completed,
          'on-hold': result.onHold,
          cancelled: result.cancelled
        },
        byPriority: {
          high: result.highPriority,
          medium: result.mediumPriority,
          low: result.lowPriority
        }
      };
    } catch (error) {
      throw error;
    }
  }

  async findByName(name, ownerId, excludeId = null) {
    try {
      const query = { name, owner: ownerId };
      if (excludeId) {
        query._id = { $ne: excludeId };
      }
      return await Project.findOne(query);
    } catch (error) {
      throw error;
    }
  }

  async getRecentProjects(ownerId, limit = 5) {
    try {
      return await Project.find({ owner: ownerId })
        .populate('owner', 'name email')
        .populate('taskCount')
        .sort({ updatedAt: -1 })
        .limit(limit);
    } catch (error) {
      throw error;
    }
  }
}

module.exports = new ProjectRepository();