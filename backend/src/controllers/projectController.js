const projectService = require('../services/projectService');
const { validationResult } = require('express-validator');

class ProjectController {
  async createProject(req, res, next) {
    try {
      // Check validation errors
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({
          success: false,
          message: 'Validation failed',
          errors: errors.array()
        });
      }

      const result = await projectService.createProject(req.body, req.user.id);
      
      res.status(201).json(result);
    } catch (error) {
      next(error);
    }
  }

  async getProjects(req, res, next) {
    try {
      const result = await projectService.getProjects(req.user.id, req.query);
      
      res.status(200).json(result);
    } catch (error) {
      next(error);
    }
  }

  async getProjectById(req, res, next) {
    try {
      const result = await projectService.getProjectById(req.params.id, req.user.id);
      
      res.status(200).json(result);
    } catch (error) {
      next(error);
    }
  }

  async updateProject(req, res, next) {
    try {
      // Check validation errors
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({
          success: false,
          message: 'Validation failed',
          errors: errors.array()
        });
      }

      const result = await projectService.updateProject(req.params.id, req.user.id, req.body);
      
      res.status(200).json(result);
    } catch (error) {
      next(error);
    }
  }

  async deleteProject(req, res, next) {
    try {
      const result = await projectService.deleteProject(req.params.id, req.user.id);
      
      res.status(200).json(result);
    } catch (error) {
      next(error);
    }
  }

  async getProjectStats(req, res, next) {
    try {
      const result = await projectService.getProjectStats(req.user.id);
      
      res.status(200).json(result);
    } catch (error) {
      next(error);
    }
  }

  async getRecentProjects(req, res, next) {
    try {
      const limit = parseInt(req.query.limit) || 5;
      const result = await projectService.getRecentProjects(req.user.id, limit);
      
      res.status(200).json(result);
    } catch (error) {
      next(error);
    }
  }

  async getProjectWithTasks(req, res, next) {
    try {
      const result = await projectService.getProjectWithTasks(req.params.id, req.user.id);
      
      res.status(200).json(result);
    } catch (error) {
      next(error);
    }
  }
}

module.exports = new ProjectController();