const express = require('express');
const { body, param, query } = require('express-validator');
const taskController = require('../controllers/task.controller');
const { protect } = require('../middleware/auth.middleware');
const { validate } = require('../middleware/validation.middleware');
const { userLimiter } = require('../middleware/rateLimit.middleware');

const router = express.Router();

router.use(protect);
router.use(userLimiter(200)); // 200 requests per 15 minutes per user

router
  .route('/')
  .get(
    [
      query('page').optional().isInt({ min: 1 }).withMessage('Page must be a positive integer'),
      query('limit').optional().isInt({ min: 1, max: 100 }).withMessage('Limit must be between 1 and 100'),
      query('priority').optional().isIn(['0', '1', '2', '3']).withMessage('Invalid priority'),
      validate,
    ],
    taskController.getAllTasks
  )
  .post(
    [
      body('title')
        .notEmpty()
        .withMessage('Task title is required')
        .trim()
        .isLength({ max: 200 })
        .withMessage('Title cannot exceed 200 characters'),
      body('description')
        .optional()
        .trim()
        .isLength({ max: 2000 })
        .withMessage('Description cannot exceed 2000 characters'),
      body('priority')
        .optional()
        .isIn([0, 1, 2, 3])
        .withMessage('Priority must be 0, 1, 2, or 3'),
      body('category')
        .optional()
        .trim()
        .isLength({ max: 50 })
        .withMessage('Category cannot exceed 50 characters'),
      body('dueDate')
        .optional()
        .isISO8601()
        .withMessage('Invalid date format'),
      validate,
    ],
    taskController.createTask
  )
  .delete(
    [
      body('confirmation')
        .equals('DELETE_ALL')
        .withMessage('Confirmation required: "DELETE_ALL"'),
      validate,
    ],
    taskController.clearAllTasks
  );

router
  .route('/:id')
  .get(
    [
      param('id').isMongoId().withMessage('Invalid task ID'),
      validate,
    ],
    taskController.getTask
  )
  .put(
    [
      param('id').isMongoId().withMessage('Invalid task ID'),
      body('title')
        .optional()
        .trim()
        .isLength({ max: 200 })
        .withMessage('Title cannot exceed 200 characters'),
      body('description')
        .optional()
        .trim()
        .isLength({ max: 2000 })
        .withMessage('Description cannot exceed 2000 characters'),
      validate,
    ],
    taskController.updateTask
  )
  .delete(
    [
      param('id').isMongoId().withMessage('Invalid task ID'),
      validate,
    ],
    taskController.deleteTask
  );

router.patch(
  '/:id/complete',
  [
    param('id').isMongoId().withMessage('Invalid task ID'),
    validate,
  ],
  taskController.toggleComplete
);

router.post(
  '/:id/subtasks',
  [
    param('id').isMongoId().withMessage('Invalid task ID'),
    body('title')
      .notEmpty()
      .withMessage('Subtask title is required')
      .trim()
      .isLength({ max: 200 })
      .withMessage('Subtask title cannot exceed 200 characters'),
    validate,
  ],
  taskController.addSubtask
);

router
  .route('/:taskId/subtasks/:subtaskId')
  .put(
    [
      param('taskId').isMongoId().withMessage('Invalid task ID'),
      param('subtaskId').isMongoId().withMessage('Invalid subtask ID'),
      validate,
    ],
    taskController.updateSubtask
  )
  .delete(
    [
      param('taskId').isMongoId().withMessage('Invalid task ID'),
      param('subtaskId').isMongoId().withMessage('Invalid subtask ID'),
      validate,
    ],
    taskController.deleteSubtask
  );

router.patch(
  '/:taskId/subtasks/:subtaskId/complete',
  [
    param('taskId').isMongoId().withMessage('Invalid task ID'),
    param('subtaskId').isMongoId().withMessage('Invalid subtask ID'),
    validate,
  ],
  taskController.toggleSubtaskComplete
);

module.exports = router;
