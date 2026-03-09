const mongoose = require('mongoose');

const taskBunchSchema = new mongoose.Schema({
  name: {
    type: String,
    required: [true, 'Bunch name is required'],
    trim: true,
    maxlength: [100, 'Bunch name cannot exceed 100 characters']
  },
  description: {
    type: String,
    trim: true,
    maxlength: [500, 'Description cannot exceed 500 characters']
  },
  project: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Project',
    required: [true, 'Project reference is required']
  },
  phase: {
    type: String,
    enum: [
      'Frontend Development',
      'Backend Development',
      'Full Stack Development',
      'Integration',
      'AI Functionalities',
      'Testing & QA',
      'DevOps & Deployment',
      'Production & Deployment',
      'Design & UI/UX',
      'Database & Architecture',
      'Security & Performance',
      'Documentation',
      'Other'
    ],
    required: [true, 'Phase is required']
  },
  tasks: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Task'
  }],
  assignedTo: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    default: null // Senior employee who oversees this bunch
  },
  assignedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: [true, 'Assigner reference is required']
  },
  status: {
    type: String,
    enum: ['pending-assignment', 'assigned', 'in-progress', 'review', 'completed', 'blocked'],
    default: 'pending-assignment'
  },
  requiredSkills: [{
    type: String,
    trim: true
  }],
  estimatedDuration: {
    type: Number, // In days
    min: [1, 'Duration must be at least 1 day']
  },
  bufferTime: {
    type: Number, // In days - buffer time between phases
    default: 0
  },
  startDate: {
    type: Date,
    default: Date.now
  },
  deadline: {
    type: Date,
    required: [true, 'Deadline is required']
  },
  order: {
    type: Number, // Chronological order of bunch in project timeline
    default: 1
  },
  // Bunch can execute in parallel with others (no dependencies)
  isParallel: {
    type: Boolean,
    default: true
  },
  // Dependencies on other bunches (for Integration phase, etc.)
  dependsOnBunches: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'TaskBunch'
  }],
  totalPoints: {
    type: Number,
    default: 0
  },
  completedPoints: {
    type: Number,
    default: 0
  },
  progress: {
    type: Number,
    min: 0,
    max: 100,
    default: 0
  },
  // Task delegation tracking within bunch
  delegations: [{
    task: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Task'
    },
    delegatedTo: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User' // Intern or junior who received the task
    },
    delegatedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User' // Senior who delegated
    },
    delegatedAt: {
      type: Date,
      default: Date.now
    },
    notes: String
  }],
  aiGenerated: {
    type: Boolean,
    default: false
  },
  notes: {
    type: String,
    trim: true,
    maxlength: [1000, 'Notes cannot exceed 1000 characters']
  }
}, {
  timestamps: true
});

// Index for faster queries
taskBunchSchema.index({ project: 1, assignedTo: 1 });
taskBunchSchema.index({ project: 1, status: 1 });
taskBunchSchema.index({ assignedTo: 1, status: 1 });

// Virtual to get task count
taskBunchSchema.virtual('taskCount').get(function () {
  return (this.tasks && Array.isArray(this.tasks)) ? this.tasks.length : 0;
});

// Calculate progress based on completed tasks
taskBunchSchema.methods.calculateProgress = async function () {
  if (!this.tasks || !Array.isArray(this.tasks) || this.tasks.length === 0) {
    this.progress = 0;
    return this.progress;
  }

  const Task = mongoose.model('Task');
  const tasks = await Task.find({ _id: { $in: this.tasks } });

  const completedTasks = tasks.filter(task => task.status === 'completed').length;
  this.progress = Math.round((completedTasks / tasks.length) * 100);

  // Calculate points
  this.totalPoints = tasks.reduce((sum, task) => sum + (task.points || 0), 0);
  this.completedPoints = tasks
    .filter(task => task.status === 'completed')
    .reduce((sum, task) => sum + (task.points || 0), 0);

  return this.progress;
};

// Get bunches assigned to a user (either whole bunch or individual tasks)
taskBunchSchema.statics.getBunchesByUser = async function (userId) {
  const Task = require('./Task');

  // Find all tasks assigned to this user
  const userTasks = await Task.find({ assignedTo: userId }).select('_id');
  const userTaskIds = userTasks.map(t => t._id);

  // Find bunches where:
  // 1. The whole bunch is assigned to the user, OR
  // 2. At least one task in the bunch is assigned to the user
  const bunches = await this.find({
    $or: [
      { assignedTo: userId },
      { tasks: { $in: userTaskIds } }
    ]
  })
    .populate('project', 'name deadline status')
    .populate({
      path: 'tasks',
      populate: [
        {
          path: 'assignedTo',
          select: 'firstName lastName email role'
        },
        {
          path: 'delegatedBy',
          select: 'firstName lastName email role'
        },
        {
          path: 'revisionHistory.requestedBy',
          select: 'firstName lastName email role'
        }
      ]
    })
    .populate('assignedBy', 'firstName lastName email')
    .populate('assignedTo', 'firstName lastName email')
    .sort({ order: 1, deadline: 1 });

  // Filter tasks: Show only tasks assigned to this user
  // Unless the whole bunch is assigned to them
  const filteredBunches = bunches.map(bunch => {
    const bunchObj = bunch.toObject();

    // If whole bunch is assigned to user, show all tasks
    const bunchAssignedToId = bunch.assignedTo ?
      (typeof bunch.assignedTo === 'object' ? bunch.assignedTo._id : bunch.assignedTo) : null;

    if (bunchAssignedToId && bunchAssignedToId.toString() === userId.toString()) {
      console.log(`[TaskBunch] Whole bunch "${bunch.name}" assigned to user ${userId}`);
      return bunchObj;
    }

    // Otherwise, filter to show only user's tasks
    const originalTaskCount = bunchObj.tasks.length;
    bunchObj.tasks = bunchObj.tasks.filter(task => {
      if (!task.assignedTo) return false;
      const taskAssignedToId = typeof task.assignedTo === 'object' ?
        task.assignedTo._id : task.assignedTo;
      return taskAssignedToId && taskAssignedToId.toString() === userId.toString();
    });

    console.log(`[TaskBunch] Bunch "${bunch.name}" - Original tasks: ${originalTaskCount}, User tasks: ${bunchObj.tasks.length}`);

    return bunchObj;
  });

  // Calculate progress for each bunch and filter out empty ones
  const bunchesWithProgress = filteredBunches.map(bunchObj => {
    const totalTasks = bunchObj.tasks ? bunchObj.tasks.length : 0;
    const completedTasks = bunchObj.tasks ? bunchObj.tasks.filter(t => t.status === 'completed').length : 0;

    bunchObj.progress = totalTasks > 0 ? Math.round((completedTasks / totalTasks) * 100) : 0;
    bunchObj.completedTasks = completedTasks;
    bunchObj.totalTasks = totalTasks;

    return bunchObj;
  });

  // Filter out bunches with no tasks (unless the whole bunch is assigned)
  return bunchesWithProgress.filter(bunch => {
    const isWholeBunchAssigned = bunch.assignedTo &&
      (typeof bunch.assignedTo === 'object' ? bunch.assignedTo._id : bunch.assignedTo).toString() === userId.toString();

    return isWholeBunchAssigned || (bunch.tasks && bunch.tasks.length > 0);
  });
};

// Get all bunches for a project
taskBunchSchema.statics.getBunchesByProject = function (projectId) {
  return this.find({ project: projectId })
    .populate('assignedTo', 'firstName lastName email skills seniorityLevel')
    .populate({
      path: 'tasks',
      populate: [
        {
          path: 'assignedTo',
          select: 'firstName lastName email role'
        },
        {
          path: 'delegatedBy',
          select: 'firstName lastName email role'
        }
      ]
    })
    .populate('dependsOnBunches', 'name status progress')
    .sort({ order: 1 })
    .exec();
};

// Check if bunch dependencies are met
taskBunchSchema.methods.areDependenciesMet = async function () {
  if (!this.dependsOnBunches || this.dependsOnBunches.length === 0) {
    return true;
  }

  const TaskBunch = mongoose.model('TaskBunch');
  const dependencies = await TaskBunch.find({
    _id: { $in: this.dependsOnBunches }
  });

  // All dependent bunches must be completed
  return dependencies.every(bunch => bunch.status === 'completed');
};

// Delegate a task within the bunch to an intern/junior
taskBunchSchema.methods.delegateTask = async function (taskId, delegatedToId, delegatedById, notes) {
  const Task = mongoose.model('Task');
  const task = await Task.findById(taskId);

  if (!task || !this.tasks.includes(taskId)) {
    throw new Error('Task not found in this bunch');
  }

  // Update task assignment
  task.assignedTo = delegatedToId;
  task.assignedBy = delegatedById;
  await task.save();

  // Record delegation
  this.delegations.push({
    task: taskId,
    delegatedTo: delegatedToId,
    delegatedBy: delegatedById,
    delegatedAt: new Date(),
    notes: notes || ''
  });

  await this.save();
  return this;
};

// Configure toJSON to include virtuals
taskBunchSchema.set('toJSON', { virtuals: true });
taskBunchSchema.set('toObject', { virtuals: true });

module.exports = mongoose.model('TaskBunch', taskBunchSchema);
