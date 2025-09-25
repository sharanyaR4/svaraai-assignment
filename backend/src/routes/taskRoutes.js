const express = require('express');
const taskController = require('../controllers/taskController');
const { authMiddleware } = require('../middlewares/authMiddleware');
const {
  createTaskValidation,
  updateTaskValidation,
  updateTaskStatusValidation,
  moveTaskValidation,
  validateObjectId,
  validateProjectId
} = require('../middlewares/validateMiddleware');

const router = express.Router();

// Apply auth middleware to all routes
router.use(authMiddleware);

// Task stats and personal tasks
router.get('/stats', taskController.getTaskStats);
router.get('/my-tasks', taskController.getMyTasks);
router.get('/upcoming', taskController.getUpcomingTasks);

// Task CRUD routes
router.post('/', createTaskValidation, taskController.createTask);
router.get('/:id', validateObjectId, taskController.getTaskById);
router.put('/:id', validateObjectId, updateTaskValidation, taskController.updateTask);
router.delete('/:id', validateObjectId, taskController.deleteTask);

// Task status and movement
router.patch('/:id/status', validateObjectId, updateTaskStatusValidation, taskController.updateTaskStatus);
router.patch('/:id/move', validateObjectId, moveTaskValidation, taskController.moveTask);

// Project-specific task routes
router.get('/project/:projectId', validateProjectId, taskController.getTasksByProject);
router.get('/project/:projectId/kanban', validateProjectId, taskController.getKanbanBoard);

module.exports = router;