const mongoose = require('mongoose');

const subTaskSchema = new mongoose.Schema({
  title: {
    type: String,
    required: [true, 'Subtask title is required'],
    trim: true,
    maxlength: [200, 'Subtask title cannot exceed 200 characters'],
  },
  isCompleted: {
    type: Boolean,
    default: false,
  },
}, { timestamps: true });

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
      maxlength: [200, 'Task title cannot exceed 200 characters'],
    },
    description: {
      type: String,
      default: '',
      trim: true,
      maxlength: [2000, 'Description cannot exceed 2000 characters'],
    },
    isCompleted: {
      type: Boolean,
      default: false,
      index: true,
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
      index: true,
    },
    category: {
      type: String,
      default: 'Personal',
      trim: true,
      maxlength: [50, 'Category cannot exceed 50 characters'],
      index: true,
    },
    subtasks: [subTaskSchema],
    isDeleted: {
      type: Boolean,
      default: false,
      select: false,
    },
    deletedAt: {
      type: Date,
      default: null,
      select: false,
    },
  },
  {
    timestamps: true,
  }
);

// Compound indexes for common queries
taskSchema.index({ userId: 1, createdAt: -1 });
taskSchema.index({ userId: 1, priority: -1, createdAt: -1 });
taskSchema.index({ userId: 1, isCompleted: 1, dueDate: 1 });
taskSchema.index({ userId: 1, category: 1 });
taskSchema.index({ userId: 1, isDeleted: 1 });

// Text index for search
taskSchema.index({ title: 'text', description: 'text' });

// Soft delete middleware
taskSchema.pre(/^find/, function (next) {
  this.where({ isDeleted: { $ne: true } });
  next();
});

taskSchema.methods.softDelete = async function () {
  this.isDeleted = true;
  this.deletedAt = new Date();
  return await this.save();
};

module.exports = mongoose.model('Task', taskSchema);
