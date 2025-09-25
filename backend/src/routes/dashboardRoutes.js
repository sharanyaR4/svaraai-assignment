// Add this route to your dashboardRoutes.js for debugging
const express = require('express');
const dashboardController = require('../controllers/dashboardController');
const { authMiddleware } = require('../middlewares/authMiddleware');

const router = express.Router();

// Apply auth middleware to all routes
router.use(authMiddleware);

// Dashboard routes
router.get('/stats', dashboardController.getDashboardStats);
router.get('/quick-stats', dashboardController.getQuickStats);

// Debug route to check if data exists
router.get('/debug', async (req, res, next) => {
  try {
    const userId = req.user.id;
    
    // Check if projects exist
    const projectService = require('../services/projectService');
    const taskService = require('../services/taskService');
    
    const projects = await projectService.getProjects(userId, { limit: 10 });
    const tasks = await taskService.getMyTasks(userId, { limit: 10 });
    const projectStats = await projectService.getProjectStats(userId);
    const taskStats = await taskService.getTaskStats(userId);
    
    res.json({
      success: true,
      debug: {
        userId,
        projectCount: projects.data ? projects.data.length : 0,
        taskCount: tasks.data ? tasks.data.length : 0,
        projects: projects,
        tasks: tasks,
        projectStats: projectStats,
        taskStats: taskStats
      }
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message,
      stack: error.stack
    });
  }
});

module.exports = router;