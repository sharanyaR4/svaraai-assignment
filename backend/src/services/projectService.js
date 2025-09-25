const projectRepository = require('../repositories/projectRepository');
const taskRepository = require('../repositories/taskRepository');
const { AppError } = require('../middlewares/errorMiddleware');

class ProjectService {
  async createProject(projectData, ownerId) {
    try {
      const { name, description, priority, endDate, color } = projectData;

      // Check if project with same name exists for this user
      const existingProject = await projectRepository.findByName(name, ownerId);
      if (existingProject) {
        throw new AppError('Project with this name already exists', 409);
      }

      const project = await projectRepository.create({
        name,
        description,
        owner: ownerId,
        priority: priority || 'medium',
        endDate: endDate ? new Date(endDate) : null,
        color: color || '#3B82F6'
      });

      return {
        success: true,
        data: project,
        message: 'Project created successfully'
      };
    } catch (error) {
      throw error;
    }
  }

  async getProjects(ownerId, queryParams = {}) {
    try {
      const {
        page = 1,
        limit = 10,
        status,
        priority,
        search,
        sortBy = 'createdAt',
        sortOrder = 'desc'
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

      const result = await projectRepository.findAllByOwner(ownerId, options);

      return {
        success: true,
        data: result.projects,
        pagination: result.pagination,
        message: 'Projects retrieved successfully'
      };
    } catch (error) {
      throw error;
    }
  }

  async getProjectById(projectId, ownerId) {
    try {
      const project = await projectRepository.findByIdAndOwner(projectId, ownerId);
      
      if (!project) {
        throw new AppError('Project not found', 404);
      }

      return {
        success: true,
        data: project,
        message: 'Project retrieved successfully'
      };
    } catch (error) {
      throw error;
    }
  }

  async updateProject(projectId, ownerId, updateData) {
    try {
      const { name, description, status, priority, endDate, color } = updateData;

      // Check if project exists
      const existingProject = await projectRepository.findByIdAndOwner(projectId, ownerId);
      if (!existingProject) {
        throw new AppError('Project not found', 404);
      }

      // Check if name is being updated and already exists
      if (name && name !== existingProject.name) {
        const duplicateProject = await projectRepository.findByName(name, ownerId, projectId);
        if (duplicateProject) {
          throw new AppError('Project with this name already exists', 409);
        }
      }

      const updatedProject = await projectRepository.update(projectId, ownerId, {
        name,
        description,
        status,
        priority,
        endDate: endDate ? new Date(endDate) : existingProject.endDate,
        color
      });

      return {
        success: true,
        data: updatedProject,
        message: 'Project updated successfully'
      };
    } catch (error) {
      throw error;
    }
  }

  async deleteProject(projectId, ownerId) {
    try {
      // Check if project exists
      const project = await projectRepository.findByIdAndOwner(projectId, ownerId);
      if (!project) {
        throw new AppError('Project not found', 404);
      }

      // Check if project has tasks
      const projectTasks = await taskRepository.findByProject(projectId, { limit: 1 });
      if (projectTasks.tasks.length > 0) {
        throw new AppError('Cannot delete project with existing tasks', 400);
      }

      await projectRepository.delete(projectId, ownerId);

      return {
        success: true,
        message: 'Project deleted successfully'
      };
    } catch (error) {
      throw error;
    }
  }

  async getProjectStats(ownerId) {
    try {
      const stats = await projectRepository.getProjectStats(ownerId);
      const taskStats = await taskRepository.getTaskStats(ownerId);

      return {
        success: true,
        data: {
          projects: stats,
          tasks: taskStats
        },
        message: 'Project statistics retrieved successfully'
      };
    } catch (error) {
      throw error;
    }
  }

  async getRecentProjects(ownerId, limit = 5) {
    try {
      const projects = await projectRepository.getRecentProjects(ownerId, limit);

      return {
        success: true,
        data: projects,
        message: 'Recent projects retrieved successfully'
      };
    } catch (error) {
      throw error;
    }
  }

  async getProjectWithTasks(projectId, ownerId) {
    try {
      // Get project
      const project = await projectRepository.findByIdAndOwner(projectId, ownerId);
      if (!project) {
        throw new AppError('Project not found', 404);
      }

      // Get tasks grouped by status
      const todoTasks = await taskRepository.findByProjectAndStatus(projectId, 'todo');
      const inProgressTasks = await taskRepository.findByProjectAndStatus(projectId, 'in-progress');
      const doneTasks = await taskRepository.findByProjectAndStatus(projectId, 'done');

      return {
        success: true,
        data: {
          project,
          tasks: {
            todo: todoTasks,
            'in-progress': inProgressTasks,
            done: doneTasks
          }
        },
        message: 'Project with tasks retrieved successfully'
      };
    } catch (error) {
      throw error;
    }
  }

  validateProjectData(projectData, isUpdate = false) {
    const errors = [];

    if (!isUpdate || projectData.name !== undefined) {
      if (!projectData.name || projectData.name.trim().length < 2) {
        errors.push('Project name must be at least 2 characters long');
      }
      if (projectData.name && projectData.name.length > 100) {
        errors.push('Project name cannot exceed 100 characters');
      }
    }

    if (!isUpdate || projectData.description !== undefined) {
      if (!projectData.description || projectData.description.trim().length < 5) {
        errors.push('Project description must be at least 5 characters long');
      }
      if (projectData.description && projectData.description.length > 500) {
        errors.push('Project description cannot exceed 500 characters');
      }
    }

    if (projectData.priority && !['low', 'medium', 'high'].includes(projectData.priority)) {
      errors.push('Priority must be one of: low, medium, high');
    }

    if (projectData.status && !['active', 'completed', 'on-hold', 'cancelled'].includes(projectData.status)) {
      errors.push('Status must be one of: active, completed, on-hold, cancelled');
    }

    if (projectData.endDate) {
      const endDate = new Date(projectData.endDate);
      if (isNaN(endDate.getTime())) {
        errors.push('End date must be a valid date');
      } else if (endDate < new Date()) {
        errors.push('End date cannot be in the past');
      }
    }

    return errors;
  }
}

module.exports = new ProjectService();