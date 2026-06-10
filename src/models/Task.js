const mongoose = require('mongoose');

const subTaskSchema = new mongoose.Schema({
  title: {
    type: String,
    required: [true, 'Subtask title is required'],
    trim: true,
  },
  isCompleted: {
    type: Boolean,
    default: false,
  },
});

const taskSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true,
    },
    title: {
      type: String,
      required: [true, 'Task title is required'],
      trim: true,
    },
    description: {
      type: String,
      default: '',
      trim: true,
    },
    isCompleted: {
      type: Boolean,
      default: false,
    },
    completedAt: {
      type: Date,
      default: null,
    },
    dueDate: {
      type: Date,
      default: null,
      index: true,
    },
    priority: {
      type: Number,
      enum: [0, 1, 2, 3], // 0: low, 1: medium, 2: high, 3: urgent
      default: 1,
    },
    category: {
      type: String,
      default: 'Personal',
      trim: true,
    },
    subtasks: [subTaskSchema],
  },
  {
    timestamps: true,
  }
);

taskSchema.index({ userId: 1, createdAt: -1 });
taskSchema.index({ userId: 1, priority: -1 });
taskSchema.index({ userId: 1, isCompleted: 1 });

module.exports = mongoose.model('Task', taskSchema);
