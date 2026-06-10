const request = require('supertest');
const app = require('../../app');
const User = require('../../models/User');

describe('Task Integration Tests', () => {
  let accessToken;
  let userId;

  beforeEach(async () => {
    const user = await User.create({
      name: 'Test User',
      email: 'test@example.com',
      password: 'password123',
    });
    userId = user._id;

    const AuthService = require('../../services/auth.service');
    accessToken = AuthService.generateAccessToken(userId);
  });

  describe('POST /api/v1/tasks', () => {
    it('should create a new task', async () => {
      const response = await request(app)
        .post('/api/v1/tasks')
        .set('Authorization', `Bearer ${accessToken}`)
        .send({
          title: 'Test Task',
          description: 'Test Description',
          priority: 2,
        })
        .expect(201);

      expect(response.body.success).toBe(true);
      expect(response.body.data.task.title).toBe('Test Task');
    });

    it('should return 400 for missing title', async () => {
      await request(app)
        .post('/api/v1/tasks')
        .set('Authorization', `Bearer ${accessToken}`)
        .send({
          description: 'Test Description',
        })
        .expect(400);
    });

    it('should return 401 without token', async () => {
      await request(app)
        .post('/api/v1/tasks')
        .send({
          title: 'Test Task',
        })
        .expect(401);
    });
  });

  describe('GET /api/v1/tasks', () => {
    beforeEach(async () => {
      const Task = require('../../models/Task');
      await Task.create([
        { userId, title: 'Task 1', priority: 0 },
        { userId, title: 'Task 2', priority: 2, isCompleted: true },
        { userId, title: 'Task 3', priority: 1 },
      ]);
    });

    it('should get all tasks with pagination', async () => {
      const response = await request(app)
        .get('/api/v1/tasks')
        .set('Authorization', `Bearer ${accessToken}`)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.tasks).toHaveLength(3);
      expect(response.body.data.pagination).toBeDefined();
    });

    it('should filter by completion status', async () => {
      const response = await request(app)
        .get('/api/v1/tasks?completed=true')
        .set('Authorization', `Bearer ${accessToken}`)
        .expect(200);

      expect(response.body.data.tasks).toHaveLength(1);
      expect(response.body.data.tasks[0].isCompleted).toBe(true);
    });

    it('should paginate results', async () => {
      const response = await request(app)
        .get('/api/v1/tasks?page=1&limit=2')
        .set('Authorization', `Bearer ${accessToken}`)
        .expect(200);

      expect(response.body.data.tasks).toHaveLength(2);
      expect(response.body.data.pagination.pages).toBe(2);
    });
  });

  describe('PUT /api/v1/tasks/:id', () => {
    let taskId;

    beforeEach(async () => {
      const Task = require('../../models/Task');
      const task = await Task.create({ userId, title: 'Original Task' });
      taskId = task._id;
    });

    it('should update a task', async () => {
      const response = await request(app)
        .put(`/api/v1/tasks/${taskId}`)
        .set('Authorization', `Bearer ${accessToken}`)
        .send({
          title: 'Updated Task',
        })
        .expect(200);

      expect(response.body.data.task.title).toBe('Updated Task');
    });

    it('should return 400 for invalid task ID', async () => {
      await request(app)
        .put('/api/v1/tasks/invalid-id')
        .set('Authorization', `Bearer ${accessToken}`)
        .send({
          title: 'Updated Task',
        })
        .expect(400);
    });
  });

  describe('PATCH /api/v1/tasks/:id/complete', () => {
    let taskId;

    beforeEach(async () => {
      const Task = require('../../models/Task');
      const task = await Task.create({ userId, title: 'Task to Complete' });
      taskId = task._id;
    });

    it('should toggle task completion', async () => {
      const response = await request(app)
        .patch(`/api/v1/tasks/${taskId}/complete`)
        .set('Authorization', `Bearer ${accessToken}`)
        .expect(200);

      expect(response.body.data.task.isCompleted).toBe(true);
      expect(response.body.data.task.completedAt).toBeDefined();
    });
  });

  describe('DELETE /api/v1/tasks/:id', () => {
    let taskId;

    beforeEach(async () => {
      const Task = require('../../models/Task');
      const task = await Task.create({ userId, title: 'Task to Delete' });
      taskId = task._id;
    });

    it('should delete a task', async () => {
      await request(app)
        .delete(`/api/v1/tasks/${taskId}`)
        .set('Authorization', `Bearer ${accessToken}`)
        .expect(200);
    });
  });

  describe('DELETE /api/v1/tasks (clear all)', () => {
    beforeEach(async () => {
      const Task = require('../../models/Task');
      await Task.create([
        { userId, title: 'Task 1' },
        { userId, title: 'Task 2' },
      ]);
    });

    it('should require confirmation', async () => {
      await request(app)
        .delete('/api/v1/tasks')
        .set('Authorization', `Bearer ${accessToken}`)
        .send({ confirmation: 'WRONG' })
        .expect(400);
    });

    it('should clear all tasks with confirmation', async () => {
      const response = await request(app)
        .delete('/api/v1/tasks')
        .set('Authorization', `Bearer ${accessToken}`)
        .send({ confirmation: 'DELETE_ALL' })
        .expect(200);

      expect(response.body.data.deletedCount).toBe(2);
    });
  });

  describe('Subtask operations', () => {
    let taskId;

    beforeEach(async () => {
      const Task = require('../../models/Task');
      const task = await Task.create({ userId, title: 'Parent Task' });
      taskId = task._id;
    });

    it('should add a subtask', async () => {
      const response = await request(app)
        .post(`/api/v1/tasks/${taskId}/subtasks`)
        .set('Authorization', `Bearer ${accessToken}`)
        .send({ title: 'Subtask 1' })
        .expect(201);

      expect(response.body.data.task.subtasks).toHaveLength(1);
      expect(response.body.data.task.subtasks[0].title).toBe('Subtask 1');
    });

    it('should toggle subtask completion', async () => {
      const addRes = await request(app)
        .post(`/api/v1/tasks/${taskId}/subtasks`)
        .set('Authorization', `Bearer ${accessToken}`)
        .send({ title: 'Subtask 1' });

      const subtaskId = addRes.body.data.task.subtasks[0]._id;

      const response = await request(app)
        .patch(`/api/v1/tasks/${taskId}/subtasks/${subtaskId}/complete`)
        .set('Authorization', `Bearer ${accessToken}`)
        .expect(200);

      expect(response.body.data.task.subtasks[0].isCompleted).toBe(true);
    });

    it('should delete a subtask', async () => {
      const addRes = await request(app)
        .post(`/api/v1/tasks/${taskId}/subtasks`)
        .set('Authorization', `Bearer ${accessToken}`)
        .send({ title: 'Subtask 1' });

      const subtaskId = addRes.body.data.task.subtasks[0]._id;

      const response = await request(app)
        .delete(`/api/v1/tasks/${taskId}/subtasks/${subtaskId}`)
        .set('Authorization', `Bearer ${accessToken}`)
        .expect(200);

      expect(response.body.data.task.subtasks).toHaveLength(0);
    });
  });

  describe('GET /api/v1/dashboard/stats', () => {
    beforeEach(async () => {
      const Task = require('../../models/Task');
      await Task.create([
        { userId, title: 'Task 1', priority: 0, isCompleted: true },
        { userId, title: 'Task 2', priority: 2, isCompleted: false },
        { userId, title: 'Task 3', priority: 1, isCompleted: false },
      ]);
    });

    it('should return task statistics', async () => {
      const response = await request(app)
        .get('/api/v1/dashboard/stats')
        .set('Authorization', `Bearer ${accessToken}`)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.stats.total).toBe(3);
      expect(response.body.data.stats.completed).toBe(1);
      expect(response.body.data.stats.pending).toBe(2);
    });
  });
});
