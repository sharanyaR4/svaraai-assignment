const projectController = require('../../../src/controllers/projectController');
const projectService = require('../../../src/services/projectService');
const { validationResult } = require('express-validator');

// Mock dependencies
jest.mock('../../../src/services/projectService');
jest.mock('express-validator');

describe('ProjectController', () => {
  let req, res, next;

  beforeEach(() => {
    req = {
      body: {},
      params: {},
      query: {},
      user: { id: 'mockUserId' }
    };
    res = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn()
    };
    next = jest.fn();
    jest.clearAllMocks();
  });

  describe('createProject', () => {
    it('should create project successfully', async () => {
      const mockResult = {
        success: true,
        data: { _id: 'projectId', name: 'Test Project' },
        message: 'Project created successfully'
      };

      validationResult.mockReturnValue({ isEmpty: () => true });
      projectService.createProject.mockResolvedValue(mockResult);

      req.body = {
        name: 'Test Project',
        description: 'Test description'
      };

      await projectController.createProject(req, res, next);

      expect(res.status).toHaveBeenCalledWith(201);
      expect(res.json).toHaveBeenCalledWith(mockResult);
      expect(projectService.createProject).toHaveBeenCalledWith(req.body, 'mockUserId');
    });

    it('should return validation errors', async () => {
      const mockErrors = [{ field: 'name', message: 'Name is required' }];

      validationResult.mockReturnValue({
        isEmpty: () => false,
        array: () => mockErrors
      });

      await projectController.createProject(req, res, next);

      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.json).toHaveBeenCalledWith({
        success: false,
        message: 'Validation failed',
        errors: mockErrors
      });
    });
  });

  describe('getProjects', () => {
    it('should get projects successfully', async () => {
      const mockResult = {
        success: true,
        data: [{ _id: '1', name: 'Project 1' }],
        pagination: { current: 1, total: 1 }
      };

      projectService.getProjects.mockResolvedValue(mockResult);

      req.query = { page: '1', limit: '10' };

      await projectController.getProjects(req, res, next);

      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.json).toHaveBeenCalledWith(mockResult);
      expect(projectService.getProjects).toHaveBeenCalledWith('mockUserId', req.query);
    });
  });

  describe('getProjectById', () => {
    it('should get project by id successfully', async () => {
      const mockResult = {
        success: true,
        data: { _id: 'projectId', name: 'Test Project' }
      };

      projectService.getProjectById.mockResolvedValue(mockResult);

      req.params.id = 'projectId';

      await projectController.getProjectById(req, res, next);

      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.json).toHaveBeenCalledWith(mockResult);
      expect(projectService.getProjectById).toHaveBeenCalledWith('projectId', 'mockUserId');
    });
  });

  describe('updateProject', () => {
    it('should update project successfully', async () => {
      const mockResult = {
        success: true,
        data: { _id: 'projectId', name: 'Updated Project' },
        message: 'Project updated successfully'
      };

      validationResult.mockReturnValue({ isEmpty: () => true });
      projectService.updateProject.mockResolvedValue(mockResult);

      req.params.id = 'projectId';
      req.body = { name: 'Updated Project' };

      await projectController.updateProject(req, res, next);

      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.json).toHaveBeenCalledWith(mockResult);
      expect(projectService.updateProject).toHaveBeenCalledWith('projectId', 'mockUserId', req.body);
    });
  });

  describe('deleteProject', () => {
    it('should delete project successfully', async () => {
      const mockResult = {
        success: true,
        message: 'Project deleted successfully'
      };

      projectService.deleteProject.mockResolvedValue(mockResult);

      req.params.id = 'projectId';

      await projectController.deleteProject(req, res, next);

      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.json).toHaveBeenCalledWith(mockResult);
      expect(projectService.deleteProject).toHaveBeenCalledWith('projectId', 'mockUserId');
    });
  });

  describe('getProjectStats', () => {
    it('should get project statistics successfully', async () => {
      const mockResult = {
        success: true,
        data: {
          projects: { total: 5, active: 3, completed: 2 },
          tasks: { total: 20, todo: 8, done: 5 }
        }
      };

      projectService.getProjectStats.mockResolvedValue(mockResult);

      await projectController.getProjectStats(req, res, next);

      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.json).toHaveBeenCalledWith(mockResult);
      expect(projectService.getProjectStats).toHaveBeenCalledWith('mockUserId');
    });
  });

  describe('getRecentProjects', () => {
    it('should get recent projects successfully', async () => {
      const mockResult = {
        success: true,
        data: [
          { _id: '1', name: 'Recent Project 1' },
          { _id: '2', name: 'Recent Project 2' }
        ]
      };

      projectService.getRecentProjects.mockResolvedValue(mockResult);

      req.query.limit = '5';

      await projectController.getRecentProjects(req, res, next);

      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.json).toHaveBeenCalledWith(mockResult);
      expect(projectService.getRecentProjects).toHaveBeenCalledWith('mockUserId', 5);
    });

    it('should use default limit if not provided', async () => {
      const mockResult = { success: true, data: [] };

      projectService.getRecentProjects.mockResolvedValue(mockResult);

      await projectController.getRecentProjects(req, res, next);

      expect(projectService.getRecentProjects).toHaveBeenCalledWith('mockUserId', 5);
    });
  });

  describe('getProjectWithTasks', () => {
    it('should get project with tasks successfully', async () => {
      const mockResult = {
        success: true,
        data: {
          project: { _id: 'projectId', name: 'Test Project' },
          tasks: {
            todo: [],
            'in-progress': [],
            done: []
          }
        }
      };

      projectService.getProjectWithTasks.mockResolvedValue(mockResult);

      req.params.id = 'projectId';

      await projectController.getProjectWithTasks(req, res, next);

      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.json).toHaveBeenCalledWith(mockResult);
      expect(projectService.getProjectWithTasks).toHaveBeenCalledWith('projectId', 'mockUserId');
    });
  });

  describe('error handling', () => {
    it('should handle service errors', async () => {
      const mockError = new Error('Service error');

      validationResult.mockReturnValue({ isEmpty: () => true });
      projectService.createProject.mockRejectedValue(mockError);

      req.body = { name: 'Test Project', description: 'Test description' };

      await projectController.createProject(req, res, next);

      expect(next).toHaveBeenCalledWith(mockError);
    });
  });
});