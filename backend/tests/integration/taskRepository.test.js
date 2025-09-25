const mongoose = require('mongoose');
const User = require('../../../src/models/User');
const Project = require('../../../src/models/Project');
const Task = require('../../../src/models/Task');
const taskRepository = require('../../../src/repositories/taskRepository');

describe('TaskRepository', () => {
  let userId;
  let projectId;

  beforeAll(async () => {
    const MONGODB_URI = process.env.MONGODB_URI_TEST || 'mongodb://localhost:27017/svaraai-tasks-test';
    await mongoose.connect(MONGODB_URI);
  });

  beforeEach(async () => {
    await User.deleteMany({});
    await Project.deleteMany({});
    await Task.deleteMany({});

    // Create test user
    const user = new User({
      name: 'Test User',
      email: 'test@example.com',
      password: 'password123'
    });
    await user.save();
    userId = user._id;

    // Create test project
    const project = new Project({
      name: 'Test Project',
      description: 'Test project description',
      owner: userId
    });
    await project.save();
    projectId = project._id;
  });

  afterAll(async () => {
    await mongoose.connection.close();
  });

  describe('create', () => {
    it('should create a new task', async () => {
      const taskData = {
        title: 'Test Task',
        description: 'Test task description',
        status: 'todo',
        priority: 'high',
        deadline: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
        projectId: projectId,
        createdBy: userId
      };

      const task = await taskRepository.create(taskData);

      expect(task._id).toBeDefined();
      expect(task.title).toBe(taskData.title);
      expect(task.status).toBe(taskData.status);
      expect(task.priority).toBe(taskData.priority);
      expect(task.projectId.toString()).toBe(projectId.toString());
      expect(task.createdBy.toString()).toBe(userId.toString());
    });
  });

  describe('findById', () => {
    it('should find task by id with populated fields', async () => {
      const task = new Task({
        title: 'Test Task',
        status: 'todo',
        priority: 'medium',
        deadline: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
        projectId: projectId,
        createdBy: userId
      });
      await task.save();

      const foundTask = await taskRepository.findById(task._id);

      expect(foundTask._id.toString()).toBe(task._id.toString());
      expect(foundTask.projectId.name).toBe('Test Project');
      expect(foundTask.createdBy.name).toBe('Test User');
    });

    it('should return null for non-existent task', async () => {
      const nonExistentId = new mongoose.Types.ObjectId();
      const task = await taskRepository.findById(nonExistentId);
      expect(task).toBeNull();
    });
  });

  describe('findByProject', () => {
    beforeEach(async () => {
      const tasks = [
        {
          title: 'Task 1',
          status: 'todo',
          priority: 'high',
          deadline: new Date(Date.now() + 24 * 60 * 60 * 1000),
          projectId: projectId,
          createdBy: userId
        },
        {
          title: 'Task 2',
          status: 'in-progress',
          priority: 'medium',
          deadline: new Date(Date.now() + 48 * 60 * 60 * 1000),
          projectId: projectId,
          createdBy: userId
        },
        {
          title: 'Task 3',
          status: 'done',
          priority: 'low',
          deadline: new Date(Date.now() + 72 * 60 * 60 * 1000),
          projectId: projectId,
          createdBy: userId
        }
      ];

      await Task.insertMany(tasks);
    });

    it('should find all tasks by project', async () => {
      const result = await taskRepository.findByProject(projectId);

      expect(result.tasks).toHaveLength(3);
      expect(result.pagination).toBeDefined();
    });

    it('should filter tasks by status', async () => {
      const result = await taskRepository.findByProject(projectId, { status: 'todo' });

      expect(result.tasks).toHaveLength(1);
      expect(result.tasks[0].status).toBe('todo');
    });

    it('should filter tasks by priority', async () => {
      const result = await taskRepository.findByProject(projectId, { priority: 'high' });

      expect(result.tasks).toHaveLength(1);
      expect(result.tasks[0].priority).toBe('high');
    });

    it('should paginate results', async () => {
      const result = await taskRepository.findByProject(projectId, { page: 1, limit: 2 });

      expect(result.tasks).toHaveLength(2);
      expect(result.pagination.current).toBe(1);
      expect(result.pagination.totalItems).toBe(3);
    });
  });

  describe('findByProjectAndStatus', () => {
    beforeEach(async () => {
      const tasks = [
        {
          title: 'Todo Task 1',
          status: 'todo',
          priority: 'high',
          deadline: new Date(Date.now() + 24 * 60 * 60 * 1000),
          projectId: projectId,
          createdBy: userId,
          position: 1
        },
        {
          title: 'Todo Task 2',
          status: 'todo',
          priority: 'medium',
          deadline: new Date(Date.now() + 48 * 60 * 60 * 1000),
          projectId: projectId,
          createdBy: userId,
          position: 2
        },
        {
          title: 'In Progress Task',
          status: 'in-progress',
          priority: 'high',
          deadline: new Date(Date.now() + 72 * 60 * 60 * 1000),
          projectId: projectId,
          createdBy: userId,
          position: 1
        }
      ];

      await Task.insertMany(tasks);
    });

    it('should find tasks by project and status', async () => {
      const todoTasks = await taskRepository.findByProjectAndStatus(projectId, 'todo');

      expect(todoTasks).toHaveLength(2);
      todoTasks.forEach(task => {
        expect(task.status).toBe('todo');
      });
    });

    it('should sort tasks by position', async () => {
      const todoTasks = await taskRepository.findByProjectAndStatus(projectId, 'todo');

      expect(todoTasks[0].position).toBe(1);
      expect(todoTasks[1].position).toBe(2);
    });
  });

  describe('update', () => {
    it('should update task', async () => {
      const task = new Task({
        title: 'Original Task',
        status: 'todo',
        priority: 'medium',
        deadline: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
        projectId: projectId,
        createdBy: userId
      });
      await task.save();

      const updateData = {
        title: 'Updated Task',
        status: 'in-progress',
        priority: 'high'
      };

      const updatedTask = await taskRepository.update(task._id, updateData);

      expect(updatedTask.title).toBe('Updated Task');
      expect(updatedTask.status).toBe('in-progress');
      expect(updatedTask.priority).toBe('high');
    });
  });

  describe('delete', () => {
    it('should delete task', async () => {
      const task = new Task({
        title: 'Task to Delete',
        status: 'todo',
        priority: 'medium',
        deadline: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
        projectId: projectId,
        createdBy: userId
      });
      await task.save();

      await taskRepository.delete(task._id);

      const deletedTask = await Task.findById(task._id);
      expect(deletedTask).toBeNull();
    });
  });

  describe('getTaskStats', () => {
    beforeEach(async () => {
      const now = new Date();
      const tasks = [
        {
          title: 'Todo Task',
          status: 'todo',
          priority: 'high',
          deadline: new Date(now.getTime() + 24 * 60 * 60 * 1000),
          projectId: projectId,
          createdBy: userId
        },
        {
          title: 'In Progress Task',
          status: 'in-progress',
          priority: 'medium',
          deadline: new Date(now.getTime() + 48 * 60 * 60 * 1000),
          projectId: projectId,
          createdBy: userId
        },
        {
          title: 'Done Task',
          status: 'done',
          priority: 'low',
          deadline: new Date(now.getTime() + 72 * 60 * 60 * 1000),
          projectId: projectId,
          createdBy: userId
        },
        {
          title: 'Overdue Task',
          status: 'todo',
          priority: 'high',
          deadline: new Date(now.getTime() - 24 * 60 * 60 * 1000),
          projectId: projectId,
          createdBy: userId
        }
      ];

      await Task.insertMany(tasks);
    });

    it('should return task statistics', async () => {
      const stats = await taskRepository.getTaskStats(userId);

      expect(stats.total).toBe(4);
      expect(stats.todo).toBe(2);
      expect(stats.inProgress).toBe(1);
      expect(stats.done).toBe(1);
      expect(stats.overdue).toBe(1);
      expect(stats.highPriority).toBe(2);
    });
  });

  describe('getOverdueTasks', () => {
    beforeEach(async () => {
      const now = new Date();
      const tasks = [
        {
          title: 'Overdue Task 1',
          status: 'todo',
          priority: 'high',
          deadline: new Date(now.getTime() - 48 * 60 * 60 * 1000), // 2 days ago
          projectId: projectId,
          createdBy: userId
        },
        {
          title: 'Overdue Task 2',
          status: 'in-progress',
          priority: 'medium',
          deadline: new Date(now.getTime() - 24 * 60 * 60 * 1000), // 1 day ago
          projectId: projectId,
          createdBy: userId
        },
        {
          title: 'Future Task',
          status: 'todo',
          priority: 'low',
          deadline: new Date(now.getTime() + 24 * 60 * 60 * 1000), // 1 day future
          projectId: projectId,
          createdBy: userId
        },
        {
          title: 'Done Task',
          status: 'done',
          priority: 'high',
          deadline: new Date(now.getTime() - 72 * 60 * 60 * 1000), // 3 days ago
          projectId: projectId,
          createdBy: userId
        }
      ];

      await Task.insertMany(tasks);
    });

    it('should return overdue tasks', async () => {
      const overdueTasks = await taskRepository.getOverdueTasks(userId);

      expect(overdueTasks).toHaveLength(2);
      overdueTasks.forEach(task => {
        expect(task.status).not.toBe('done');
        expect(new Date(task.deadline)).toBeLessThan(new Date());
      });
    });

    it('should sort overdue tasks by deadline', async () => {
      const overdueTasks = await taskRepository.getOverdueTasks(userId);

      // Should be sorted by deadline ascending (most overdue first)
      expect(new Date(overdueTasks[0].deadline)).toBeLessThan(new Date(overdueTasks[1].deadline));
    });

    it('should respect limit parameter', async () => {
      const overdueTasks = await taskRepository.getOverdueTasks(userId, 1);
      expect(overdueTasks).toHaveLength(1);
    });
  });

  describe('updateTaskStatus', () => {
    it('should update task status and set completedAt for done tasks', async () => {
      const task = new Task({
        title: 'Test Task',
        status: 'todo',
        priority: 'medium',
        deadline: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
        projectId: projectId,
        createdBy: userId
      });
      await task.save();

      const updatedTask = await taskRepository.updateTaskStatus(task._id, 'done');

      expect(updatedTask.status).toBe('done');
      expect(updatedTask.completedAt).toBeDefined();
    });

    it('should clear completedAt when status changes from done', async () => {
      const task = new Task({
        title: 'Test Task',
        status: 'done',
        priority: 'medium',
        deadline: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
        projectId: projectId,
        createdBy: userId,
        completedAt: new Date()
      });
      await task.save();

      const updatedTask = await taskRepository.updateTaskStatus(task._id, 'todo');

      expect(updatedTask.status).toBe('todo');
      expect(updatedTask.completedAt).toBeNull();
    });
  });

  describe('getTasksByDeadlineRange', () => {
    beforeEach(async () => {
      const now = new Date();
      const tasks = [
        {
          title: 'Task 1',
          status: 'todo',
          priority: 'high',
          deadline: new Date(now.getTime() + 24 * 60 * 60 * 1000), // 1 day
          projectId: projectId,
          createdBy: userId
        },
        {
          title: 'Task 2',
          status: 'in-progress',
          priority: 'medium',
          deadline: new Date(now.getTime() + 3 * 24 * 60 * 60 * 1000), // 3 days
          projectId: projectId,
          createdBy: userId
        },
        {
          title: 'Task 3',
          status: 'todo',
          priority: 'low',
          deadline: new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000), // 7 days
          projectId: projectId,
          createdBy: userId
        },
        {
          title: 'Task 4',
          status: 'done',
          priority: 'high',
          deadline: new Date(now.getTime() + 14 * 24 * 60 * 60 * 1000), // 14 days
          projectId: projectId,
          createdBy: userId
        }
      ];

      await Task.insertMany(tasks);
    });

    it('should return tasks within deadline range', async () => {
      const now = new Date();
      const startDate = now.toISOString();
      const endDate = new Date(now.getTime() + 5 * 24 * 60 * 60 * 1000).toISOString();

      const tasks = await taskRepository.getTasksByDeadlineRange(userId, startDate, endDate);

      expect(tasks).toHaveLength(2); // Tasks with deadlines in 1 day and 3 days
      tasks.forEach(task => {
        const deadline = new Date(task.deadline);
        expect(deadline).toBeGreaterThanOrEqual(new Date(startDate));
        expect(deadline).toBeLessThanOrEqual(new Date(endDate));
      });
    });

    it('should sort tasks by deadline', async () => {
      const now = new Date();
      const startDate = now.toISOString();
      const endDate = new Date(now.getTime() + 10 * 24 * 60 * 60 * 1000).toISOString();

      const tasks = await taskRepository.getTasksByDeadlineRange(userId, startDate, endDate);

      for (let i = 0; i < tasks.length - 1; i++) {
        expect(new Date(tasks[i].deadline)).toBeLessThanOrEqual(new Date(tasks[i + 1].deadline));
      }
    });
  });
});