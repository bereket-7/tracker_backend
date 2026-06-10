const TaskService = require('../../services/task.service');
const Task = require('../../models/Task');
const User = require('../../models/User');

describe('TaskService', () => {
  let userId;

  beforeEach(async () => {
    const user = await User.create({
      name: 'Test User',
      email: 'test@example.com',
      password: 'password123',
    });
    userId = user._id;
  });

  describe('createTask', () => {
    it('should create a task successfully', async () => {
      const taskData = {
        title: 'Test Task',
        description: 'Test Description',
        priority: 2,
      };

      const task = await TaskService.createTask(userId, taskData);

      expect(task.title).toBe(taskData.title);
      expect(task.description).toBe(taskData.description);
      expect(task.priority).toBe(taskData.priority);
      expect(task.userId.toString()).toBe(userId.toString());
    });
  });

  describe('getAllTasks', () => {
    beforeEach(async () => {
      await Task.create([
        { userId, title: 'Task 1', priority: 0 },
        { userId, title: 'Task 2', priority: 2, isCompleted: true },
        { userId, title: 'Task 3', priority: 1 },
      ]);
    });

    it('should get all tasks with pagination', async () => {
      const result = await TaskService.getAllTasks(userId, {}, { page: 1, limit: 10 });

      expect(result.tasks).toHaveLength(3);
      expect(result.pagination.total).toBe(3);
      expect(result.pagination.page).toBe(1);
    });

    it('should filter tasks by completion status', async () => {
      const result = await TaskService.getAllTasks(userId, { completed: 'true' }, {});

      expect(result.tasks).toHaveLength(1);
      expect(result.tasks[0].isCompleted).toBe(true);
    });

    it('should filter tasks by priority', async () => {
      const result = await TaskService.getAllTasks(userId, { priority: '2' }, {});

      expect(result.tasks).toHaveLength(1);
      expect(result.tasks[0].priority).toBe(2);
    });

    it('should paginate tasks correctly', async () => {
      const result = await TaskService.getAllTasks(userId, {}, { page: 1, limit: 2 });

      expect(result.tasks).toHaveLength(2);
      expect(result.pagination.pages).toBe(2);
    });
  });

  describe('updateTask', () => {
    it('should update a task successfully', async () => {
      const task = await Task.create({ userId, title: 'Original Title' });

      const updated = await TaskService.updateTask(task._id, userId, { title: 'Updated Title' });

      expect(updated.title).toBe('Updated Title');
    });

    it('should throw error when task not found', async () => {
      const fakeId = '507f1f77bcf86cd799439011';

      await expect(
        TaskService.updateTask(fakeId, userId, { title: 'Updated' })
      ).rejects.toThrow('Task not found');
    });
  });

  describe('deleteTask (soft delete)', () => {
    it('should soft delete a task', async () => {
      const task = await Task.create({ userId, title: 'To Delete' });

      await TaskService.deleteTask(task._id, userId);

      const found = await Task.findById(task._id);
      expect(found).toBeNull(); // Soft delete means it won't be found by default
    });
  });

  describe('clearAllTasks', () => {
    it('should require confirmation', async () => {
      await Task.create({ userId, title: 'Task 1' });

      await expect(
        TaskService.clearAllTasks(userId, 'WRONG')
      ).rejects.toThrow('Confirmation required');
    });

    it('should clear all tasks with correct confirmation', async () => {
      await Task.create([
        { userId, title: 'Task 1' },
        { userId, title: 'Task 2' },
      ]);

      const result = await TaskService.clearAllTasks(userId, 'DELETE_ALL');

      expect(result.modifiedCount).toBe(2);
    });
  });

  describe('subtask operations', () => {
    let taskId;

    beforeEach(async () => {
      const task = await Task.create({ userId, title: 'Parent Task' });
      taskId = task._id;
    });

    it('should add a subtask', async () => {
      const task = await TaskService.addSubtask(taskId, userId, { title: 'Subtask 1' });

      expect(task.subtasks).toHaveLength(1);
      expect(task.subtasks[0].title).toBe('Subtask 1');
    });

    it('should update a subtask', async () => {
      const task = await TaskService.addSubtask(taskId, userId, { title: 'Subtask 1' });
      const subtaskId = task.subtasks[0]._id;

      const updated = await TaskService.updateSubtask(taskId, userId, subtaskId, { title: 'Updated Subtask' });

      expect(updated.subtasks[0].title).toBe('Updated Subtask');
    });

    it('should toggle subtask completion', async () => {
      const task = await TaskService.addSubtask(taskId, userId, { title: 'Subtask 1' });
      const subtaskId = task.subtasks[0]._id;

      const updated = await TaskService.toggleSubtaskComplete(taskId, userId, subtaskId);

      expect(updated.subtasks[0].isCompleted).toBe(true);
    });

    it('should delete a subtask', async () => {
      const task = await TaskService.addSubtask(taskId, userId, { title: 'Subtask 1' });
      const subtaskId = task.subtasks[0]._id;

      const updated = await TaskService.deleteSubtask(taskId, userId, subtaskId);

      expect(updated.subtasks).toHaveLength(0);
    });
  });

  describe('getStats', () => {
    beforeEach(async () => {
      const yesterday = new Date();
      yesterday.setDate(yesterday.getDate() - 1);

      await Task.create([
        { userId, title: 'Task 1', priority: 0, isCompleted: true },
        { userId, title: 'Task 2', priority: 2, isCompleted: false, dueDate: yesterday },
        { userId, title: 'Task 3', priority: 1, isCompleted: false, category: 'Work' },
      ]);
    });

    it('should return correct statistics', async () => {
      const stats = await TaskService.getStats(userId);

      expect(stats.total).toBe(3);
      expect(stats.completed).toBe(1);
      expect(stats.pending).toBe(2);
      expect(stats.overdue).toBe(1);
      expect(stats.completionRate).toBe(33);
      expect(stats.byCategory.Personal).toBe(2);
      expect(stats.byCategory.Work).toBe(1);
    });
  });
});
