const express = require('express');
const projectController = require('../controllers/projectController');
const { authMiddleware } = require('../middlewares/authMiddleware');
const {
  createProjectValidation,
  updateProjectValidation,
  validateObjectId
} = require('../middlewares/validateMiddleware');

const router = express.Router();

// Apply auth middleware to all routes
router.use(authMiddleware);

// Project CRUD routes
router.post('/', createProjectValidation, projectController.createProject);
router.get('/', projectController.getProjects);
router.get('/stats', projectController.getProjectStats);
router.get('/recent', projectController.getRecentProjects);
router.get('/:id', validateObjectId, projectController.getProjectById);
router.put('/:id', validateObjectId, updateProjectValidation, projectController.updateProject);
router.delete('/:id', validateObjectId, projectController.deleteProject);

// Project with tasks
router.get('/:id/with-tasks', validateObjectId, projectController.getProjectWithTasks);

module.exports = router;