const express = require('express');
const { body } = require('express-validator');
const taskController = require('../controllers/task.controller');
const { protect } = require('../middleware/auth.middleware');
const { validate } = require('../middleware/validation.middleware');

const router = express.Router();

router.use(protect);

router
  .route('/')
  .get(taskController.getAllTasks)
  .post(
    [
      body('title').notEmpty().withMessage('Task title is required'),
      body('priority')
        .optional()
        .isIn([0, 1, 2, 3])
        .withMessage('Priority must be 0, 1, 2, or 3'),
      validate,
    ],
    taskController.createTask
  )
  .delete(taskController.clearAllTasks);

router
  .route('/:id')
  .get(taskController.getTask)
  .put(taskController.updateTask)
  .delete(taskController.deleteTask);

router.patch('/:id/complete', taskController.toggleComplete);

router.post(
  '/:id/subtasks',
  [
    body('title').notEmpty().withMessage('Subtask title is required'),
    validate,
  ],
  taskController.addSubtask
);

router
  .route('/:taskId/subtasks/:subtaskId')
  .put(taskController.updateSubtask)
  .delete(taskController.deleteSubtask);

router.patch(
  '/:taskId/subtasks/:subtaskId/complete',
  taskController.toggleSubtaskComplete
);

module.exports = router;
