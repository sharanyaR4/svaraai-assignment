const mongoose = require('mongoose');
const User = require('../../../src/models/User');
const Project = require('../../../src/models/Project');
const projectRepository = require('../../../src/repositories/projectRepository');

describe('ProjectRepository', () => {
  let userId;

  beforeAll(async () => {
    const MONGODB_URI = process.env.MONGODB_URI_TEST || 'mongodb://localhost:27017/svaraai-tasks-test';
    await mongoose.connect(MONGODB_URI);
  });

  beforeEach(async () => {
    await User.deleteMany({});
    await Project.deleteMany({});

    // Create test user
    const user = new User({
      name: 'Test User',
      email: 'test@example.com',
      password: 'password123'
    });
    await user.save();
    userId = user._id;
  });

  afterAll(async () => {
    await mongoose.connection.close();
  });

  describe('create', () => {
    it('should create a new project', async () => {
      const projectData = {
        name: 'Test Project',
        description: 'Test project description',
        owner: userId,
        priority: 'medium'
      };

      const project = await projectRepository.create(projectData);

      expect(project._id).toBeDefined();
      expect(project.name).toBe(projectData.name);
      expect(project.description).toBe(projectData.description);
      expect(project.owner.toString()).toBe(userId.toString());
    });
  });

  describe('findById', () => {
    it('should find project by id with populated owner', async () => {
      const project = new Project({
        name: 'Test Project',
        description: 'Test description',
        owner: userId
      });
      await project.save();

      const foundProject = await projectRepository.findById(project._id);

      expect(foundProject._id.toString()).toBe(project._id.toString());
      expect(foundProject.owner.name).toBe('Test User');
    });
  });

  describe('findByIdAndOwner', () => {
    it('should find project by id and owner', async () => {
      const project = new Project({
        name: 'Test Project',
        description: 'Test description',
        owner: userId
      });
      await project.save();

      const foundProject = await projectRepository.findByIdAndOwner(project._id, userId);

      expect(foundProject).toBeDefined();
      expect(foundProject.name).toBe('Test Project');
    });

    it('should return null if project not owned by user', async () => {
      const otherUser = new User({
        name: 'Other User',
        email: 'other@example.com',
        password: 'password123'
      });
      await otherUser.save();

      const project = new Project({
        name: 'Test Project',
        description: 'Test description',
        owner: otherUser._id
      });
      await project.save();

      const foundProject = await projectRepository.findByIdAndOwner(project._id, userId);

      expect(foundProject).toBeNull();
    });
  });

  describe('findAllByOwner', () => {
    beforeEach(async () => {
      const projects = [
        {
          name: 'Project 1',
          description: 'Description 1',
          owner: userId,
          status: 'active',
          priority: 'high'
        },
        {
          name: 'Project 2',
          description: 'Description 2',
          owner: userId,
          status: 'completed',
          priority: 'medium'
        },
        {
          name: 'Project 3',
          description: 'Description 3',
          owner: userId,
          status: 'active',
          priority: 'low'
        }
      ];

      await Project.insertMany(projects);
    });

    it('should return projects with pagination', async () => {
      const result = await projectRepository.findAllByOwner(userId, { page: 1, limit: 2 });

      expect(result.projects).toHaveLength(2);
      expect(result.pagination.total).toBe(2);
      expect(result.pagination.totalItems).toBe(3);
    });

    it('should filter projects by status', async () => {
      const result = await projectRepository.findAllByOwner(userId, { status: 'active' });

      expect(result.projects).toHaveLength(2);
      result.projects.forEach(project => {
        expect(project.status).toBe('active');
      });
    });

    it('should filter projects by priority', async () => {
      const result = await projectRepository.findAllByOwner(userId, { priority: 'high' });

      expect(result.projects).toHaveLength(1);
      expect(result.projects[0].priority).toBe('high');
    });
  });

  describe('update', () => {
    it('should update project', async () => {
      const project = new Project({
        name: 'Original Project',
        description: 'Original description',
        owner: userId
      });
      await project.save();

      const updateData = {
        name: 'Updated Project',
        description: 'Updated description'
      };

      const updatedProject = await projectRepository.update(project._id, userId, updateData);

      expect(updatedProject.name).toBe('Updated Project');
      expect(updatedProject.description).toBe('Updated description');
    });
  });

  describe('delete', () => {
    it('should delete project', async () => {
      const project = new Project({
        name: 'Project to Delete',
        description: 'Description',
        owner: userId
      });
      await project.save();

      await projectRepository.delete(project._id, userId);

      const deletedProject = await Project.findById(project._id);
      expect(deletedProject).toBeNull();
    });
  });

  describe('getProjectStats', () => {
    beforeEach(async () => {
      const projects = [
        { name: 'P1', description: 'D1', owner: userId, status: 'active' },
        { name: 'P2', description: 'D2', owner: userId, status: 'active' },
        { name: 'P3', description: 'D3', owner: userId, status: 'completed' },
        { name: 'P4', description: 'D4', owner: userId, status: 'on-hold' }
      ];

      await Project.insertMany(projects);
    });

    it('should return project statistics', async () => {
      const stats = await projectRepository.getProjectStats(userId);

      expect(stats.total).toBe(4);
      expect(stats.active).toBe(2);
      expect(stats.completed).toBe(1);
      expect(stats.onHold).toBe(1);
    });
  });

  describe('findByName', () => {
    it('should find project by name and owner', async () => {
      const project = new Project({
        name: 'Unique Project Name',
        description: 'Description',
        owner: userId
      });
      await project.save();

      const foundProject = await projectRepository.findByName('Unique Project Name', userId);

      expect(foundProject).toBeDefined();
      expect(foundProject.name).toBe('Unique Project Name');
    });

    it('should exclude specific project from search', async () => {
      const project = new Project({
        name: 'Test Project',
        description: 'Description',
        owner: userId
      });
      await project.save();

      const foundProject = await projectRepository.findByName('Test Project', userId, project._id);

      expect(foundProject).toBeNull();
    });
  });
});