const Task = require('../models/Task');
const mongoose = require('mongoose');

class TaskRepository {
  async create(taskData) {
    try {
      const task = new Task(taskData);
      const savedTask = await task.save();
      return await this.findById(savedTask._id);
    } catch (error) {
      throw error;
    }
  }

  async findById(id) {
    try {
      return await Task.findById(id)
        .populate('projectId', 'name color')
        .populate('assignedTo', 'name email')
        .populate('createdBy', 'name email');
    } catch (error) {
      throw error;
    }
  }

  async findByProject(projectId, options = {}) {
    try {
      const {
        page = 1,
        limit = 20,
        status,
        priority,
        assignedTo,
        search,
        sortBy = 'createdAt',
        sortOrder = 'desc',
        deadlineFrom,
        deadlineTo
      } = options;

      const query = { projectId: new mongoose.Types.ObjectId(projectId) };
      
      if (status) query.status = status;
      if (priority) query.priority = priority;
      if (assignedTo) query.assignedTo = assignedTo;
      if (search) {
        query.$or = [
          { title: { $regex: search, $options: 'i' } },
          { description: { $regex: search, $options: 'i' } }
        ];
      }
      if (deadlineFrom || deadlineTo) {
        query.deadline = {};
        if (deadlineFrom) query.deadline.$gte = new Date(deadlineFrom);
        if (deadlineTo) query.deadline.$lte = new Date(deadlineTo);
      }

      const sort = {};
      sort[sortBy] = sortOrder === 'desc' ? -1 : 1;

      const skip = (page - 1) * limit;
      const tasks = await Task.find(query)
        .sort(sort)
        .skip(skip)
        .limit(limit)
        .populate('projectId', 'name color')
        .populate('assignedTo', 'name email')
        .populate('createdBy', 'name email');

      const total = await Task.countDocuments(query);

      return {
        tasks,
        pagination: {
          page,
          limit,
          total,
          pages: Math.ceil(total / limit)
        }
      };
    } catch (error) {
      throw error;
    }
  }

  async findByProjectAndStatus(projectId, status) {
    try {
      return await Task.find({ 
        projectId: new mongoose.Types.ObjectId(projectId), 
        status 
      })
      .sort({ position: 1, createdAt: 1 })
      .populate('assignedTo', 'name email')
      .populate('createdBy', 'name email');
    } catch (error) {
      throw error;
    }
  }

  async findByUser(userId, options = {}) {
    try {
      const {
        page = 1,
        limit = 10,
        status,
        priority,
        search,
        sortBy = 'deadline',
        sortOrder = 'asc'
      } = options;

      const userObjectId = new mongoose.Types.ObjectId(userId);
      const query = { 
        $or: [
          { assignedTo: userObjectId },
          { createdBy: userObjectId }
        ]
      };
      
      if (status) query.status = status;
      if (priority) query.priority = priority;
      if (search) {
        query.$and = query.$and || [];
        query.$and.push({
          $or: [
            { title: { $regex: search, $options: 'i' } },
            { description: { $regex: search, $options: 'i' } }
          ]
        });
      }

      const sort = {};
      sort[sortBy] = sortOrder === 'desc' ? -1 : 1;

      const skip = (page - 1) * limit;
      const tasks = await Task.find(query)
        .sort(sort)
        .skip(skip)
        .limit(limit)
        .populate('projectId', 'name color')
        .populate('assignedTo', 'name email')
        .populate('createdBy', 'name email');

      const total = await Task.countDocuments(query);

      return {
        tasks,
        pagination: {
          page,
          limit,
          total,
          pages: Math.ceil(total / limit)
        }
      };
    } catch (error) {
      throw error;
    }
  }

  async update(taskId, updateData) {
    try {
      return await Task.findByIdAndUpdate(
        taskId,
        updateData,
        { new: true, runValidators: true }
      )
      .populate('projectId', 'name color')
      .populate('assignedTo', 'name email')
      .populate('createdBy', 'name email');
    } catch (error) {
      throw error;
    }
  }

  async updateTaskStatus(taskId, status) {
    try {
      return await this.update(taskId, { status });
    } catch (error) {
      throw error;
    }
  }

  async delete(taskId) {
    try {
      return await Task.findByIdAndDelete(taskId);
    } catch (error) {
      throw error;
    }
  }

  async getTaskStats(userId) {
    try {
      const userObjectId = mongoose.Types.ObjectId.isValid(userId) 
        ? new mongoose.Types.ObjectId(userId) 
        : userId;

      const stats = await Task.aggregate([
        {
          $match: {
            $or: [
              { assignedTo: userObjectId },
              { createdBy: userObjectId }
            ]
          }
        },
        {
          $group: {
            _id: null,
            total: { $sum: 1 },
            todo: { $sum: { $cond: [{ $eq: ['$status', 'todo'] }, 1, 0] } },
            inProgress: { $sum: { $cond: [{ $eq: ['$status', 'in-progress'] }, 1, 0] } },
            completed: { $sum: { $cond: [{ $eq: ['$status', 'done'] }, 1, 0] } },
            overdue: {
              $sum: {
                $cond: [
                  {
                    $and: [
                      { $ne: ['$status', 'done'] },
                      { $lt: ['$deadline', new Date()] }
                    ]
                  },
                  1,
                  0
                ]
              }
            },
            highPriority: { $sum: { $cond: [{ $eq: ['$priority', 'high'] }, 1, 0] } },
            mediumPriority: { $sum: { $cond: [{ $eq: ['$priority', 'medium'] }, 1, 0] } },
            lowPriority: { $sum: { $cond: [{ $eq: ['$priority', 'low'] }, 1, 0] } }
          }
        }
      ]);

      const result = stats[0] || {
        total: 0,
        todo: 0,
        inProgress: 0,
        completed: 0,
        overdue: 0,
        highPriority: 0,
        mediumPriority: 0,
        lowPriority: 0
      };

      return {
        total: result.total,
        todo: result.todo,
        inProgress: result.inProgress,
        completed: result.completed,
        overdue: result.overdue,
        byStatus: {
          todo: result.todo,
          'in-progress': result.inProgress,
          done: result.completed
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

  async getOverdueTasks(userId, limit = 5) {
    try {
      const userObjectId = new mongoose.Types.ObjectId(userId);
      return await Task.find({
        $or: [
          { assignedTo: userObjectId },
          { createdBy: userObjectId }
        ],
        status: { $ne: 'done' },
        deadline: { $lt: new Date() }
      })
      .sort({ deadline: 1 })
      .limit(limit)
      .populate('projectId', 'name color')
      .populate('assignedTo', 'name email');
    } catch (error) {
      throw error;
    }
  }

  async getTasksByDeadlineRange(userId, startDate, endDate) {
    try {
      const userObjectId = new mongoose.Types.ObjectId(userId);
      return await Task.find({
        $or: [
          { assignedTo: userObjectId },
          { createdBy: userObjectId }
        ],
        status: { $ne: 'done' },
        deadline: {
          $gte: new Date(startDate),
          $lte: new Date(endDate)
        }
      })
      .sort({ deadline: 1 })
      .populate('projectId', 'name color')
      .populate('assignedTo', 'name email');
    } catch (error) {
      throw error;
    }
  }
}

module.exports = new TaskRepository();