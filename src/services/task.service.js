const Task = require('../models/Task');

class TaskService {
  static async getAllTasks(userId, filters = {}, pagination = {}) {
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
      query.$text = { $search: filters.search };
    }

    const sort = {};
    if (filters.sortBy === 'dueDate') sort.dueDate = 1;
    else if (filters.sortBy === 'priority') sort.priority = -1;
    else sort.createdAt = -1;

    const page = parseInt(pagination.page) || 1;
    const limit = parseInt(pagination.limit) || 20;
    const skip = (page - 1) * limit;

    const [tasks, total] = await Promise.all([
      Task.find(query).sort(sort).skip(skip).limit(limit),
      Task.countDocuments(query),
    ]);

    return {
      tasks,
      pagination: {
        page,
        limit,
        total,
        pages: Math.ceil(total / limit),
      },
    };
  }

  static async getTaskById(taskId, userId) {
    const task = await Task.findOne({ _id: taskId, userId });
    if (!task) {
      const error = new Error('Task not found');
      error.statusCode = 404;
      throw error;
    }
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
    if (!task) {
      const error = new Error('Task not found');
      error.statusCode = 404;
      throw error;
    }
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
    const task = await Task.findOne({ _id: taskId, userId });
    if (!task) {
      const error = new Error('Task not found');
      error.statusCode = 404;
      throw error;
    }
    await task.softDelete();
    return task;
  }

  static async clearAllTasks(userId, confirmation) {
    if (confirmation !== 'DELETE_ALL') {
      const error = new Error('Confirmation required. Send confirmation: "DELETE_ALL" in request body');
      error.statusCode = 400;
      throw error;
    }
    const result = await Task.updateMany(
      { userId, isDeleted: false },
      { isDeleted: true, deletedAt: new Date() }
    );
    return result;
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
    if (!subtask) {
      const error = new Error('Subtask not found');
      error.statusCode = 404;
      throw error;
    }
    Object.assign(subtask, updates);
    await task.save();
    return task;
  }

  static async toggleSubtaskComplete(taskId, userId, subtaskId) {
    const task = await this.getTaskById(taskId, userId);
    const subtask = task.subtasks.id(subtaskId);
    if (!subtask) {
      const error = new Error('Subtask not found');
      error.statusCode = 404;
      throw error;
    }
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
    
    const now = new Date();
    const overdueTasks = tasks.filter(t => !t.isCompleted && t.dueDate && t.dueDate < now);
    
    const stats = {
      total: tasks.length,
      completed: tasks.filter(t => t.isCompleted).length,
      pending: tasks.filter(t => !t.isCompleted).length,
      overdue: overdueTasks.length,
      byPriority: {
        low: tasks.filter(t => t.priority === 0).length,
        medium: tasks.filter(t => t.priority === 1).length,
        high: tasks.filter(t => t.priority === 2).length,
        urgent: tasks.filter(t => t.priority === 3).length,
      },
      byCategory: {},
      completionRate: tasks.length > 0 
        ? Math.round((tasks.filter(t => t.isCompleted).length / tasks.length) * 100) 
        : 0,
    };

    tasks.forEach(task => {
      stats.byCategory[task.category] = (stats.byCategory[task.category] || 0) + 1;
    });

    return stats;
  }
}

module.exports = TaskService;
