const taskService = require('../services/taskService');
const { validationResult } = require('express-validator');

class TaskController {
  async createTask(req, res, next) {
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

      const result = await taskService.createTask(req.body, req.user.id);
      
      res.status(201).json(result);
    } catch (error) {
      next(error);
    }
  }

  async getTasksByProject(req, res, next) {
    try {
      const result = await taskService.getTasksByProject(req.params.projectId, req.user.id, req.query);
      
      res.status(200).json(result);
    } catch (error) {
      next(error);
    }
  }

  async getTaskById(req, res, next) {
    try {
      const result = await taskService.getTaskById(req.params.id, req.user.id);
      
      res.status(200).json(result);
    } catch (error) {
      next(error);
    }
  }

  async updateTask(req, res, next) {
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

      const result = await taskService.updateTask(req.params.id, req.user.id, req.body);
      
      res.status(200).json(result);
    } catch (error) {
      next(error);
    }
  }

  async updateTaskStatus(req, res, next) {
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

      const result = await taskService.updateTaskStatus(req.params.id, req.user.id, req.body.status);
      
      res.status(200).json(result);
    } catch (error) {
      next(error);
    }
  }

  async deleteTask(req, res, next) {
    try {
      const result = await taskService.deleteTask(req.params.id, req.user.id);
      
      res.status(200).json(result);
    } catch (error) {
      next(error);
    }
  }

  async getKanbanBoard(req, res, next) {
    try {
      const result = await taskService.getKanbanBoard(req.params.projectId, req.user.id);
      
      res.status(200).json(result);
    } catch (error) {
      next(error);
    }
  }

  async moveTask(req, res, next) {
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

      const { status, position } = req.body;
      const result = await taskService.moveTask(req.params.id, req.user.id, status, position);
      
      res.status(200).json(result);
    } catch (error) {
      next(error);
    }
  }

  async getTaskStats(req, res, next) {
    try {
      const result = await taskService.getTaskStats(req.user.id);
      
      res.status(200).json(result);
    } catch (error) {
      next(error);
    }
  }

  async getMyTasks(req, res, next) {
    try {
      const result = await taskService.getMyTasks(req.user.id, req.query);
      
      res.status(200).json(result);
    } catch (error) {
      next(error);
    }
  }

  async getUpcomingTasks(req, res, next) {
    try {
      const days = parseInt(req.query.days) || 7;
      const result = await taskService.getUpcomingTasks(req.user.id, days);
      
      res.status(200).json(result);
    } catch (error) {
      next(error);
    }
  }
}

module.exports = new TaskController();