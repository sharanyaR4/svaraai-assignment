const taskRepository = require('../repositories/taskRepository');
const projectRepository = require('../repositories/projectRepository');
const { AppError } = require('../middlewares/errorMiddleware');

class TaskService {
  async createTask(taskData, createdBy) {
    try {
      const { title, description, status, priority, deadline, projectId, assignedTo, tags, estimatedHours } = taskData;

      // Verify project exists and user has access
      const project = await projectRepository.findByIdAndOwner(projectId, createdBy);
      if (!project) {
        throw new AppError('Project not found or access denied', 404);
      }

      // Validate deadline
      if (new Date(deadline) < new Date()) {
        throw new AppError('Deadline cannot be in the past', 400);
      }

      const task = await taskRepository.create({
        title,
        description,
        status: status || 'todo',
        priority: priority || 'medium',
        deadline: new Date(deadline),
        projectId,
        assignedTo: assignedTo || createdBy,
        createdBy,
        tags: tags || [],
        estimatedHours: estimatedHours || 0
      });

      return {
        success: true,
        data: task,
        message: 'Task created successfully'
      };
    } catch (error) {
      throw error;
    }
  }

  async getTasksByProject(projectId, userId, queryParams = {}) {
    try {
      // Verify project access
      const project = await projectRepository.findByIdAndOwner(projectId, userId);
      if (!project) {
        throw new AppError('Project not found or access denied', 404);
      }

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
      } = queryParams;

      const options = {
        page: parseInt(page),
        limit: parseInt(limit),
        status,
        priority,
        assignedTo,
        search,
        sortBy,
        sortOrder,
        deadlineFrom,
        deadlineTo
      };

      const result = await taskRepository.findByProject(projectId, options);

      return {
        success: true,
        data: result.tasks,
        pagination: result.pagination,
        message: 'Tasks retrieved successfully'
      };
    } catch (error) {
      throw error;
    }
  }

  async getTaskById(taskId, userId) {
    try {
      const task = await taskRepository.findById(taskId);
      
      if (!task) {
        throw new AppError('Task not found', 404);
      }

      // Check if user has access to this task's project
      const project = await projectRepository.findByIdAndOwner(task.projectId._id, userId);
      if (!project) {
        throw new AppError('Access denied', 403);
      }

      return {
        success: true,
        data: task,
        message: 'Task retrieved successfully'
      };
    } catch (error) {
      throw error;
    }
  }

  async updateTask(taskId, userId, updateData) {
    try {
      const { title, description, status, priority, deadline, assignedTo, tags, estimatedHours } = updateData;

      // Get existing task
      const existingTask = await taskRepository.findById(taskId);
      if (!existingTask) {
        throw new AppError('Task not found', 404);
      }

      // Check project access
      const project = await projectRepository.findByIdAndOwner(existingTask.projectId._id, userId);
      if (!project) {
        throw new AppError('Access denied', 403);
      }

      // Validate deadline if provided
      if (deadline && new Date(deadline) < new Date() && status !== 'done') {
        throw new AppError('Deadline cannot be in the past for active tasks', 400);
      }

      const updatedTask = await taskRepository.update(taskId, {
        title,
        description,
        status,
        priority,
        deadline: deadline ? new Date(deadline) : existingTask.deadline,
        assignedTo,
        tags,
        estimatedHours
      });

      return {
        success: true,
        data: updatedTask,
        message: 'Task updated successfully'
      };
    } catch (error) {
      throw error;
    }
  }

  async updateTaskStatus(taskId, userId, status) {
    try {
      // Get existing task
      const existingTask = await taskRepository.findById(taskId);
      if (!existingTask) {
        throw new AppError('Task not found', 404);
      }

      // Check project access
      const project = await projectRepository.findByIdAndOwner(existingTask.projectId._id, userId);
      if (!project) {
        throw new AppError('Access denied', 403);
      }

      const updatedTask = await taskRepository.updateTaskStatus(taskId, status);

      return {
        success: true,
        data: updatedTask,
        message: 'Task status updated successfully'
      };
    } catch (error) {
      throw error;
    }
  }

  async deleteTask(taskId, userId) {
    try {
      // Get existing task
      const existingTask = await taskRepository.findById(taskId);
      if (!existingTask) {
        throw new AppError('Task not found', 404);
      }

      // Check project access
      const project = await projectRepository.findByIdAndOwner(existingTask.projectId._id, userId);
      if (!project) {
        throw new AppError('Access denied', 403);
      }

      await taskRepository.delete(taskId);

      return {
        success: true,
        message: 'Task deleted successfully'
      };
    } catch (error) {
      throw error;
    }
  }

  async getKanbanBoard(projectId, userId) {
    try {
      // Verify project access
      const project = await projectRepository.findByIdAndOwner(projectId, userId);
      if (!project) {
        throw new AppError('Project not found or access denied', 404);
      }

      // Get tasks grouped by status
      const todoTasks = await taskRepository.findByProjectAndStatus(projectId, 'todo');
      const inProgressTasks = await taskRepository.findByProjectAndStatus(projectId, 'in-progress');
      const doneTasks = await taskRepository.findByProjectAndStatus(projectId, 'done');

      return {
        success: true,
        data: {
          project,
          columns: {
            todo: {
              id: 'todo',
              title: 'To Do',
              tasks: todoTasks
            },
            'in-progress': {
              id: 'in-progress',
              title: 'In Progress',
              tasks: inProgressTasks
            },
            done: {
              id: 'done',
              title: 'Done',
              tasks: doneTasks
            }
          }
        },
        message: 'Kanban board data retrieved successfully'
      };
    } catch (error) {
      throw error;
    }
  }

  async moveTask(taskId, userId, newStatus, newPosition = 0) {
    try {
      // Get existing task
      const existingTask = await taskRepository.findById(taskId);
      if (!existingTask) {
        throw new AppError('Task not found', 404);
      }

      // Check project access
      const project = await projectRepository.findByIdAndOwner(existingTask.projectId._id, userId);
      if (!project) {
        throw new AppError('Access denied', 403);
      }

      // Update task status and position
      const updatedTask = await taskRepository.update(taskId, {
        status: newStatus,
        position: newPosition
      });

      return {
        success: true,
        data: updatedTask,
        message: 'Task moved successfully'
      };
    } catch (error) {
      throw error;
    }
  }

  async getTaskStats(userId) {
    try {
      const stats = await taskRepository.getTaskStats(userId);
      const overdueTasks = await taskRepository.getOverdueTasks(userId, 5);

      return {
        success: true,
        data: {
          ...stats,
          overdueTasks
        },
        message: 'Task statistics retrieved successfully'
      };
    } catch (error) {
      throw error;
    }
  }

  async getMyTasks(userId, queryParams = {}) {
    try {
      const {
        page = 1,
        limit = 10,
        status,
        priority,
        search,
        sortBy = 'deadline',
        sortOrder = 'asc'
      } = queryParams;

      const options = {
        page: parseInt(page),
        limit: parseInt(limit),
        status,
        priority,
        search,
        sortBy,
        sortOrder
      };

      const result = await taskRepository.findByUser(userId, options);

      return {
        success: true,
        data: result.tasks,
        pagination: result.pagination,
        message: 'My tasks retrieved successfully'
      };
    } catch (error) {
      throw error;
    }
  }

  async getUpcomingTasks(userId, days = 7) {
    try {
      const startDate = new Date();
      const endDate = new Date();
      endDate.setDate(endDate.getDate() + days);

      const tasks = await taskRepository.getTasksByDeadlineRange(
        userId,
        startDate.toISOString(),
        endDate.toISOString()
      );

      return {
        success: true,
        data: tasks,
        message: `Upcoming tasks for next ${days} days retrieved successfully`
      };
    } catch (error) {
      throw error;
    }
  }

  validateTaskData(taskData, isUpdate = false) {
    const errors = [];

    if (!isUpdate || taskData.title !== undefined) {
      if (!taskData.title || taskData.title.trim().length < 3) {
        errors.push('Task title must be at least 3 characters long');
      }
      if (taskData.title && taskData.title.length > 200) {
        errors.push('Task title cannot exceed 200 characters');
      }
    }

    if (taskData.description && taskData.description.length > 1000) {
      errors.push('Task description cannot exceed 1000 characters');
    }

    if (taskData.status && !['todo', 'in-progress', 'done'].includes(taskData.status)) {
      errors.push('Status must be one of: todo, in-progress, done');
    }

    if (taskData.priority && !['low', 'medium', 'high'].includes(taskData.priority)) {
      errors.push('Priority must be one of: low, medium, high');
    }

    if (!isUpdate || taskData.deadline !== undefined) {
      if (!taskData.deadline) {
        errors.push('Deadline is required');
      } else {
        const deadline = new Date(taskData.deadline);
        if (isNaN(deadline.getTime())) {
          errors.push('Deadline must be a valid date');
        }
      }
    }

    if (taskData.estimatedHours && (taskData.estimatedHours < 0 || taskData.estimatedHours > 1000)) {
      errors.push('Estimated hours must be between 0 and 1000');
    }

    return errors;
  }
}

module.exports = new TaskService();