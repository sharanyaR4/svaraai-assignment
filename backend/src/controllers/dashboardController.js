const projectService = require('../services/projectService');
const taskService = require('../services/taskService');

class DashboardController {
  async getDashboardStats(req, res, next) {
    try {
      const userId = req.user.id;

      // Get all stats in parallel
      const [projectStats, taskStats] = await Promise.all([
        projectService.getProjectStats(userId),
        taskService.getTaskStats(userId)
      ]);

      // Extract data from the service responses
      const projectData = projectStats.data?.projects || {
        total: 0,
        active: 0,
        byPriority: { high: 0, medium: 0, low: 0 }
      };

      const taskData = taskStats.data || {
        total: 0,
        completed: 0,
        overdue: 0,
        todo: 0,
        inProgress: 0,
        byStatus: { todo: 0, 'in-progress': 0, done: 0 }
      };

      // Get recent projects and upcoming tasks
      const [recentProjects, upcomingTasks] = await Promise.all([
        projectService.getRecentProjects(userId, 5),
        taskService.getUpcomingTasks(userId, 7)
      ]);

      const dashboardData = {
        totalProjects: projectData.total || 0,
        activeProjects: projectData.active || 0,
        totalTasks: taskData.total || 0,
        completedTasks: taskData.completed || 0,
        overdueTasks: taskData.overdue || 0,
        inProgressTasks: taskData.inProgress || 0,
        todoTasks: taskData.todo || 0,
        tasksByStatus: {
          todo: taskData.byStatus?.todo || taskData.todo || 0,
          'in-progress': taskData.byStatus?.['in-progress'] || taskData.inProgress || 0,
          done: taskData.byStatus?.done || taskData.completed || 0
        },
        projectsByPriority: {
          high: projectData.byPriority?.high || 0,
          medium: projectData.byPriority?.medium || 0,
          low: projectData.byPriority?.low || 0
        },
        recentActivity: {
          recentProjects: recentProjects.data || [],
          upcomingTasks: upcomingTasks.data || []
        }
      };

      res.status(200).json({
        success: true,
        data: dashboardData,
        message: 'Dashboard statistics retrieved successfully'
      });
    } catch (error) {
      console.error('Dashboard stats error:', error);
      next(error);
    }
  }

  async getQuickStats(req, res, next) {
    try {
      const userId = req.user.id;

      // Get basic counts quickly
      const [projects, tasks] = await Promise.all([
        projectService.getProjects(userId, { limit: 1 }),
        taskService.getMyTasks(userId, { limit: 1 })
      ]);

      res.status(200).json({
        success: true,
        data: {
          hasProjects: (projects.data && projects.data.length > 0),
          hasTasks: (tasks.data && tasks.data.length > 0)
        },
        message: 'Quick stats retrieved successfully'
      });
    } catch (error) {
      console.error('Quick stats error:', error);
      next(error);
    }
  }
}

module.exports = new DashboardController();