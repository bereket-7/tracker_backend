const Task = require('../models/Task');

class TaskService {
  static async getAllTasks(userId, filters = {}) {
    const query = { userId };

    if (filters.completed !== undefined) {
      query.isCompleted = filters.completed === 'true';
    }

    if (filters.priority !== undefined) {
      query.priority = parseInt(filters.priority);
    }

    if (filters.category) {
      query.category = filters.category;
    }

    if (filters.search) {
      query.$or = [
        { title: { $regex: filters.search, $options: 'i' } },
        { description: { $regex: filters.search, $options: 'i' } },
      ];
    }

    const sort = {};
    if (filters.sortBy === 'dueDate') sort.dueDate = 1;
    else if (filters.sortBy === 'priority') sort.priority = -1;
    else sort.createdAt = -1;

    return await Task.find(query).sort(sort);
  }

  static async getTaskById(taskId, userId) {
    const task = await Task.findOne({ _id: taskId, userId });
    if (!task) throw new Error('Task not found');
    return task;
  }

  static async createTask(userId, taskData) {
    return await Task.create({ ...taskData, userId });
  }

  static async updateTask(taskId, userId, updates) {
    const task = await Task.findOneAndUpdate(
      { _id: taskId, userId },
      updates,
      { new: true, runValidators: true }
    );
    if (!task) throw new Error('Task not found');
    return task;
  }

  static async toggleComplete(taskId, userId) {
    const task = await this.getTaskById(taskId, userId);
    task.isCompleted = !task.isCompleted;
    task.completedAt = task.isCompleted ? new Date() : null;
    await task.save();
    return task;
  }

  static async deleteTask(taskId, userId) {
    const task = await Task.findOneAndDelete({ _id: taskId, userId });
    if (!task) throw new Error('Task not found');
    return task;
  }

  static async clearAllTasks(userId) {
    await Task.deleteMany({ userId });
  }

  static async addSubtask(taskId, userId, subtaskData) {
    const task = await this.getTaskById(taskId, userId);
    task.subtasks.push(subtaskData);
    await task.save();
    return task;
  }

  static async updateSubtask(taskId, userId, subtaskId, updates) {
    const task = await this.getTaskById(taskId, userId);
    const subtask = task.subtasks.id(subtaskId);
    if (!subtask) throw new Error('Subtask not found');
    Object.assign(subtask, updates);
    await task.save();
    return task;
  }

  static async toggleSubtaskComplete(taskId, userId, subtaskId) {
    const task = await this.getTaskById(taskId, userId);
    const subtask = task.subtasks.id(subtaskId);
    if (!subtask) throw new Error('Subtask not found');
    subtask.isCompleted = !subtask.isCompleted;
    await task.save();
    return task;
  }

  static async deleteSubtask(taskId, userId, subtaskId) {
    const task = await this.getTaskById(taskId, userId);
    task.subtasks.pull(subtaskId);
    await task.save();
    return task;
  }

  static async getStats(userId) {
    const tasks = await Task.find({ userId });
    
    const stats = {
      total: tasks.length,
      completed: tasks.filter(t => t.isCompleted).length,
      pending: tasks.filter(t => !t.isCompleted).length,
      byPriority: {
        low: tasks.filter(t => t.priority === 0).length,
        medium: tasks.filter(t => t.priority === 1).length,
        high: tasks.filter(t => t.priority === 2).length,
        urgent: tasks.filter(t => t.priority === 3).length,
      },
      byCategory: {},
    };

    tasks.forEach(task => {
      stats.byCategory[task.category] = (stats.byCategory[task.category] || 0) + 1;
    });

    return stats;
  }
}

module.exports = TaskService;
