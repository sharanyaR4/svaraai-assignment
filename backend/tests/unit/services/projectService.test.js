const projectService = require('../../../src/services/projectService');
const projectRepository = require('../../../src/repositories/projectRepository');
const taskRepository = require('../../../src/repositories/taskRepository');
const { AppError } = require('../../../src/middlewares/errorMiddleware');

// Mock dependencies
jest.mock('../../../src/repositories/projectRepository');
jest.mock('../../../src/repositories/taskRepository');

describe('ProjectService', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('createProject', () => {
    const mockProjectData = {
      name: 'Test Project',
      description: 'Test project description',
      priority: 'high'
    };
    const mockOwnerId = 'mockOwnerId';

    it('should create project successfully', async () => {
      const mockProject = {
        _id: 'mockProjectId',
        ...mockProjectData,
        owner: mockOwnerId
      };

      projectRepository.findByName.mockResolvedValue(null);
      projectRepository.create.mockResolvedValue(mockProject);

      const result = await projectService.createProject(mockProjectData, mockOwnerId);

      expect(result.success).toBe(true);
      expect(result.data).toEqual(mockProject);
      expect(result.message).toBe('Project created successfully');
    });

    it('should throw error if project name already exists', async () => {
      const existingProject = { name: 'Test Project' };
      
      projectRepository.findByName.mockResolvedValue(existingProject);

      await expect(projectService.createProject(mockProjectData, mockOwnerId))
        .rejects.toThrow(AppError);
    });
  });

  describe('getProjects', () => {
    const mockOwnerId = 'mockOwnerId';

    it('should return projects with pagination', async () => {
      const mockResult = {
        projects: [
          { _id: '1', name: 'Project 1' },
          { _id: '2', name: 'Project 2' }
        ],
        pagination: {
          current: 1,
          total: 1,
          totalItems: 2
        }
      };

      projectRepository.findAllByOwner.mockResolvedValue(mockResult);

      const result = await projectService.getProjects(mockOwnerId);

      expect(result.success).toBe(true);
      expect(result.data).toEqual(mockResult.projects);
      expect(result.pagination).toEqual(mockResult.pagination);
    });
  });

  describe('deleteProject', () => {
    const mockProjectId = 'mockProjectId';
    const mockOwnerId = 'mockOwnerId';

    it('should delete project successfully if no tasks exist', async () => {
      const mockProject = { _id: mockProjectId, name: 'Test Project' };
      const mockTaskResult = { tasks: [] };

      projectRepository.findByIdAndOwner.mockResolvedValue(mockProject);
      taskRepository.findByProject.mockResolvedValue(mockTaskResult);
      projectRepository.delete.mockResolvedValue(mockProject);

      const result = await projectService.deleteProject(mockProjectId, mockOwnerId);

      expect(result.success).toBe(true);
      expect(result.message).toBe('Project deleted successfully');
    });

    it('should throw error if project has tasks', async () => {
      const mockProject = { _id: mockProjectId, name: 'Test Project' };
      const mockTaskResult = { tasks: [{ _id: 'taskId' }] };

      projectRepository.findByIdAndOwner.mockResolvedValue(mockProject);
      taskRepository.findByProject.mockResolvedValue(mockTaskResult);

      await expect(projectService.deleteProject(mockProjectId, mockOwnerId))
        .rejects.toThrow(AppError);
    });

    it('should throw error if project not found', async () => {
      projectRepository.findByIdAndOwner.mockResolvedValue(null);

      await expect(projectService.deleteProject(mockProjectId, mockOwnerId))
        .rejects.toThrow(AppError);
    });
  });

  describe('validateProjectData', () => {
    it('should return empty array for valid data', () => {
      const validData = {
        name: 'Valid Project Name',
        description: 'This is a valid project description',
        priority: 'medium'
      };

      const errors = projectService.validateProjectData(validData);
      expect(errors).toEqual([]);
    });

    it('should return errors for invalid data', () => {
      const invalidData = {
        name: 'A', // Too short
        description: 'ABC', // Too short
        priority: 'invalid', // Invalid priority
        endDate: 'invalid-date' // Invalid date
      };

      const errors = projectService.validateProjectData(invalidData);
      expect(errors.length).toBeGreaterThan(0);
    });
  });
});