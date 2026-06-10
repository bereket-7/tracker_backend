const TaskService = require('../services/task.service');
const ApiResponse = require('../utils/apiResponse');
const logger = require('../config/logger');

exports.getAllTasks = async (req, res, next) => {
  try {
    const result = await TaskService.getAllTasks(req.user._id, req.query, req.query);
    ApiResponse.success(
      res, 
      result, 
      'Tasks retrieved successfully'
    );
  } catch (error) {
    next(error);
  }
};

exports.getTask = async (req, res, next) => {
  try {
    const task = await TaskService.getTaskById(req.params.id, req.user._id);
    ApiResponse.success(res, { task }, 'Task retrieved successfully');
  } catch (error) {
    next(error);
  }
};

exports.createTask = async (req, res, next) => {
  try {
    const task = await TaskService.createTask(req.user._id, req.body);
    logger.info(`Task created: ${task._id} by user: ${req.user.email}`);
    ApiResponse.success(res, { task }, 'Task created successfully', 201);
  } catch (error) {
    next(error);
  }
};

exports.updateTask = async (req, res, next) => {
  try {
    const task = await TaskService.updateTask(req.params.id, req.user._id, req.body);
    logger.info(`Task updated: ${task._id} by user: ${req.user.email}`);
    ApiResponse.success(res, { task }, 'Task updated successfully');
  } catch (error) {
    next(error);
  }
};

exports.toggleComplete = async (req, res, next) => {
  try {
    const task = await TaskService.toggleComplete(req.params.id, req.user._id);
    ApiResponse.success(res, { task }, 'Task status updated successfully');
  } catch (error) {
    next(error);
  }
};

exports.deleteTask = async (req, res, next) => {
  try {
    await TaskService.deleteTask(req.params.id, req.user._id);
    logger.info(`Task deleted: ${req.params.id} by user: ${req.user.email}`);
    ApiResponse.success(res, null, 'Task deleted successfully');
  } catch (error) {
    next(error);
  }
};

exports.clearAllTasks = async (req, res, next) => {
  try {
    const result = await TaskService.clearAllTasks(req.user._id, req.body.confirmation);
    logger.warn(`All tasks cleared by user: ${req.user.email}`);
    ApiResponse.success(res, { deletedCount: result.modifiedCount }, 'All tasks cleared successfully');
  } catch (error) {
    next(error);
  }
};

exports.addSubtask = async (req, res, next) => {
  try {
    const task = await TaskService.addSubtask(req.params.id, req.user._id, req.body);
    ApiResponse.success(res, { task }, 'Subtask added successfully', 201);
  } catch (error) {
    next(error);
  }
};

exports.updateSubtask = async (req, res, next) => {
  try {
    const task = await TaskService.updateSubtask(
      req.params.taskId,
      req.user._id,
      req.params.subtaskId,
      req.body
    );
    ApiResponse.success(res, { task }, 'Subtask updated successfully');
  } catch (error) {
    next(error);
  }
};

exports.toggleSubtaskComplete = async (req, res, next) => {
  try {
    const task = await TaskService.toggleSubtaskComplete(
      req.params.taskId,
      req.user._id,
      req.params.subtaskId
    );
    ApiResponse.success(res, { task }, 'Subtask status updated successfully');
  } catch (error) {
    next(error);
  }
};

exports.deleteSubtask = async (req, res, next) => {
  try {
    const task = await TaskService.deleteSubtask(
      req.params.taskId,
      req.user._id,
      req.params.subtaskId
    );
    ApiResponse.success(res, { task }, 'Subtask deleted successfully');
  } catch (error) {
    next(error);
  }
};

exports.getStats = async (req, res, next) => {
  try {
    const stats = await TaskService.getStats(req.user._id);
    ApiResponse.success(res, { stats }, 'Statistics retrieved successfully');
  } catch (error) {
    next(error);
  }
};
