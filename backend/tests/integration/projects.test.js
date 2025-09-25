const request = require('supertest');
const mongoose = require('mongoose');
const app = require('../../src/app');
const User = require('../../src/models/User');
const Project = require('../../src/models/Project');
const Task = require('../../src/models/Task');

describe('Projects Integration Tests', () => {
  let authToken;
  let userId;

  beforeAll(async () => {
    const MONGODB_URI = process.env.MONGODB_URI_TEST || 'mongodb://localhost:27017/svaraai-tasks-test';
    await mongoose.connect(MONGODB_URI);
  });

  beforeEach(async () => {
    // Clean database
    await User.deleteMany({});
    await Project.deleteMany({});
    await Task.deleteMany({});

    // Create and authenticate user
    const userData = {
      name: 'Test User',
      email: 'test@example.com',
      password: 'password123'
    };

    const registerResponse = await request(app)
      .post('/api/auth/register')
      .send(userData);

    authToken = registerResponse.body.data.token;
    userId = registerResponse.body.data.user._id;
  });

  afterAll(async () => {
    await mongoose.connection.close();
  });

  describe('POST /api/projects', () => {
    const validProjectData = {
      name: 'Test Project',
      description: 'This is a test project description',
      priority: 'high'
    };

    it('should create a new project', async () => {
      const response = await request(app)
        .post('/api/projects')
        .set('Authorization', `Bearer ${authToken}`)
        .send(validProjectData)
        .expect(201);

      expect(response.body.success).toBe(true);
      expect(response.body.data.name).toBe(validProjectData.name);
      expect(response.body.data.description).toBe(validProjectData.description);
      expect(response.body.data.priority).toBe(validProjectData.priority);
      expect(response.body.data.owner).toBe(userId);
      expect(response.body.message).toBe('Project created successfully');
    });

    it('should not create project with duplicate name', async () => {
      // Create first project
      await request(app)
        .post('/api/projects')
        .set('Authorization', `Bearer ${authToken}`)
        .send(validProjectData);

      // Try to create second project with same name
      const response = await request(app)
        .post('/api/projects')
        .set('Authorization', `Bearer ${authToken}`)
        .send(validProjectData)
        .expect(409);

      expect(response.body.success).toBe(false);
      expect(response.body.message).toContain('already exists');
    });

    it('should validate project data', async () => {
      const invalidData = {
        name: 'A', // Too short
        description: 'ABC', // Too short
        priority: 'invalid' // Invalid priority
      };

      const response = await request(app)
        .post('/api/projects')
        .set('Authorization', `Bearer ${authToken}`)
        .send(invalidData)
        .expect(400);

      expect(response.body.success).toBe(false);
      expect(response.body.message).toBe('Validation failed');
    });

    it('should require authentication', async () => {
      await request(app)
        .post('/api/projects')
        .send(validProjectData)
        .expect(401);
    });
  });

  describe('GET /api/projects', () => {
    beforeEach(async () => {
      // Create test projects
      const projects = [
        {
          name: 'Project 1',
          description: 'First project description',
          owner: userId,
          status: 'active',
          priority: 'high'
        },
        {
          name: 'Project 2',
          description: 'Second project description',
          owner: userId,
          status: 'completed',
          priority: 'medium'
        },
        {
          name: 'Project 3',
          description: 'Third project description',
          owner: userId,
          status: 'active',
          priority: 'low'
        }
      ];

      await Project.insertMany(projects);
    });

    it('should get all user projects', async () => {
      const response = await request(app)
        .get('/api/projects')
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data).toHaveLength(3);
      expect(response.body.pagination).toBeDefined();
    });

    it('should filter projects by status', async () => {
      const response = await request(app)
        .get('/api/projects?status=active')
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data).toHaveLength(2);
      response.body.data.forEach(project => {
        expect(project.status).toBe('active');
      });
    });

    it('should filter projects by priority', async () => {
      const response = await request(app)
        .get('/api/projects?priority=high')
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data).toHaveLength(1);
      expect(response.body.data[0].priority).toBe('high');
    });

    it('should paginate results', async () => {
      const response = await request(app)
        .get('/api/projects?page=1&limit=2')
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data).toHaveLength(2);
      expect(response.body.pagination.current).toBe(1);
      expect(response.body.pagination.total).toBe(2);
    });
  });

  describe('GET /api/projects/:id', () => {
    let projectId;

    beforeEach(async () => {
      const project = new Project({
        name: 'Test Project',
        description: 'Test description',
        owner: userId
      });
      await project.save();
      projectId = project._id;
    });

    it('should get project by id', async () => {
      const response = await request(app)
        .get(`/api/projects/${projectId}`)
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data._id).toBe(projectId.toString());
      expect(response.body.data.name).toBe('Test Project');
    });

    it('should return 404 for non-existent project', async () => {
      const nonExistentId = new mongoose.Types.ObjectId();
      
      await request(app)
        .get(`/api/projects/${nonExistentId}`)
        .set('Authorization', `Bearer ${authToken}`)
        .expect(404);
    });

    it('should not allow access to other users projects', async () => {
      // Create another user
      const otherUser = new User({
        name: 'Other User',
        email: 'other@example.com',
        password: 'password123'
      });
      await otherUser.save();

      // Create project owned by other user
      const otherProject = new Project({
        name: 'Other Project',
        description: 'Other description',
        owner: otherUser._id
      });
      await otherProject.save();

      await request(app)
        .get(`/api/projects/${otherProject._id}`)
        .set('Authorization', `Bearer ${authToken}`)
        .expect(404);
    });
  });

  describe('PUT /api/projects/:id', () => {
    let projectId;

    beforeEach(async () => {
      const project = new Project({
        name: 'Original Project',
        description: 'Original description',
        owner: userId
      });
      await project.save();
      projectId = project._id;
    });

    it('should update project', async () => {
      const updateData = {
        name: 'Updated Project',
        description: 'Updated description',
        status: 'completed'
      };

      const response = await request(app)
        .put(`/api/projects/${projectId}`)
        .set('Authorization', `Bearer ${authToken}`)
        .send(updateData)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.name).toBe(updateData.name);
      expect(response.body.data.description).toBe(updateData.description);
      expect(response.body.data.status).toBe(updateData.status);
    });

    it('should not update with duplicate name', async () => {
      // Create another project
      const anotherProject = new Project({
        name: 'Another Project',
        description: 'Another description',
        owner: userId
      });
      await anotherProject.save();

      const updateData = {
        name: 'Another Project'
      };

      const response = await request(app)
        .put(`/api/projects/${projectId}`)
        .set('Authorization', `Bearer ${authToken}`)
        .send(updateData)
        .expect(409);

      expect(response.body.success).toBe(false);
      expect(response.body.message).toContain('already exists');
    });
  });

  describe('DELETE /api/projects/:id', () => {
    let projectId;

    beforeEach(async () => {
      const project = new Project({
        name: 'Project to Delete',
        description: 'Description',
        owner: userId
      });
      await project.save();
      projectId = project._id;
    });

    it('should delete project without tasks', async () => {
      const response = await request(app)
        .delete(`/api/projects/${projectId}`)
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.message).toBe('Project deleted successfully');

      // Verify project is deleted
      const deletedProject = await Project.findById(projectId);
      expect(deletedProject).toBeNull();
    });

    it('should not delete project with existing tasks', async () => {
      // Create a task for the project
      const task = new Task({
        title: 'Test Task',
        status: 'todo',
        priority: 'medium',
        deadline: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
        projectId: projectId,
        createdBy: userId
      });
      await task.save();

      const response = await request(app)
        .delete(`/api/projects/${projectId}`)
        .set('Authorization', `Bearer ${authToken}`)
        .expect(400);

      expect(response.body.success).toBe(false);
      expect(response.body.message).toContain('existing tasks');
    });
  });

  describe('GET /api/projects/stats', () => {
    beforeEach(async () => {
      // Create projects with different statuses
      const projects = [
        {
          name: 'Active Project 1',
          description: 'Description 1',
          owner: userId,
          status: 'active'
        },
        {
          name: 'Active Project 2',
          description: 'Description 2',
          owner: userId,
          status: 'active'
        },
        {
          name: 'Completed Project',
          description: 'Description 3',
          owner: userId,
          status: 'completed'
        },
        {
          name: 'On Hold Project',
          description: 'Description 4',
          owner: userId,
          status: 'on-hold'
        }
      ];

      await Project.insertMany(projects);

      // Create some tasks
      const tasks = [
        {
          title: 'Todo Task',
          status: 'todo',
          priority: 'high',
          deadline: new Date(Date.now() + 24 * 60 * 60 * 1000),
          projectId: projects[0]._id,
          createdBy: userId
        },
        {
          title: 'In Progress Task',
          status: 'in-progress',
          priority: 'medium',
          deadline: new Date(Date.now() + 48 * 60 * 60 * 1000),
          projectId: projects[0]._id,
          createdBy: userId
        },
        {
          title: 'Done Task',
          status: 'done',
          priority: 'low',
          deadline: new Date(Date.now() - 24 * 60 * 60 * 1000),
          projectId: projects[1]._id,
          createdBy: userId
        }
      ];

      await Task.insertMany(tasks);
    });

    it('should get project and task statistics', async () => {
      const response = await request(app)
        .get('/api/projects/stats')
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.projects).toBeDefined();
      expect(response.body.data.tasks).toBeDefined();
      
      expect(response.body.data.projects.total).toBe(4);
      expect(response.body.data.projects.active).toBe(2);
      expect(response.body.data.projects.completed).toBe(1);
      expect(response.body.data.projects.onHold).toBe(1);
      
      expect(response.body.data.tasks.total).toBe(3);
      expect(response.body.data.tasks.todo).toBe(1);
      expect(response.body.data.tasks.inProgress).toBe(1);
      expect(response.body.data.tasks.done).toBe(1);
    });
  });

  describe('GET /api/projects/recent', () => {
    beforeEach(async () => {
      const projects = [];
      for (let i = 1; i <= 10; i++) {
        projects.push({
          name: `Project ${i}`,
          description: `Description ${i}`,
          owner: userId,
          createdAt: new Date(Date.now() - i * 24 * 60 * 60 * 1000) // Different dates
        });
      }

      await Project.insertMany(projects);
    });

    it('should get recent projects', async () => {
      const response = await request(app)
        .get('/api/projects/recent')
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data).toHaveLength(5); // Default limit
      expect(response.body.data[0].name).toBe('Project 1'); // Most recent first
    });

    it('should respect custom limit', async () => {
      const response = await request(app)
        .get('/api/projects/recent?limit=3')
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data).toHaveLength(3);
    });
  });

  describe('GET /api/projects/:id/with-tasks', () => {
    let projectId;

    beforeEach(async () => {
      const project = new Project({
        name: 'Project with Tasks',
        description: 'Description',
        owner: userId
      });
      await project.save();
      projectId = project._id;

      // Create tasks with different statuses
      const tasks = [
        {
          title: 'Todo Task',
          status: 'todo',
          priority: 'high',
          deadline: new Date(Date.now() + 24 * 60 * 60 * 1000),
          projectId: projectId,
          createdBy: userId
        },
        {
          title: 'In Progress Task',
          status: 'in-progress',
          priority: 'medium',
          deadline: new Date(Date.now() + 48 * 60 * 60 * 1000),
          projectId: projectId,
          createdBy: userId
        },
        {
          title: 'Done Task',
          status: 'done',
          priority: 'low',
          deadline: new Date(Date.now() + 72 * 60 * 60 * 1000),
          projectId: projectId,
          createdBy: userId
        }
      ];

      await Task.insertMany(tasks);
    });

    it('should get project with tasks grouped by status', async () => {
      const response = await request(app)
        .get(`/api/projects/${projectId}/with-tasks`)
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.project).toBeDefined();
      expect(response.body.data.tasks).toBeDefined();
      expect(response.body.data.tasks.todo).toHaveLength(1);
      expect(response.body.data.tasks['in-progress']).toHaveLength(1);
      expect(response.body.data.tasks.done).toHaveLength(1);
    });
  });

  describe('Authentication and Authorization', () => {
    it('should require authentication for all endpoints', async () => {
      const endpoints = [
        { method: 'post', path: '/api/projects' },
        { method: 'get', path: '/api/projects' },
        { method: 'get', path: '/api/projects/stats' },
        { method: 'get', path: '/api/projects/recent' }
      ];

      for (const endpoint of endpoints) {
        await request(app)
          [endpoint.method](endpoint.path)
          .expect(401);
      }
    });

    it('should only allow access to own projects', async () => {
      // Create another user and their project
      const otherUser = new User({
        name: 'Other User',
        email: 'other@example.com',
        password: 'password123'
      });
      await otherUser.save();

      const otherProject = new Project({
        name: 'Other Project',
        description: 'Other description',
        owner: otherUser._id
      });
      await otherProject.save();

      // Try to access other user's project
      await request(app)
        .get(`/api/projects/${otherProject._id}`)
        .set('Authorization', `Bearer ${authToken}`)
        .expect(404);

      // Try to update other user's project
      await request(app)
        .put(`/api/projects/${otherProject._id}`)
        .set('Authorization', `Bearer ${authToken}`)
        .send({ name: 'Hacked Name' })
        .expect(404);

      // Try to delete other user's project
      await request(app)
        .delete(`/api/projects/${otherProject._id}`)
        .set('Authorization', `Bearer ${authToken}`)
        .expect(404);
    });
  });
});