const User = require('../models/User');
const Project = require('../models/Project');
const Task = require('../models/Task');
const DeveloperPerformance = require('../models/DeveloperPerformance');

// Cache for HR dashboard data
const dashboardCache = new Map();
const CACHE_DURATION = 3 * 60 * 1000; // 3 minutes

// Helper function to get cached dashboard data
const getCachedDashboardData = (cacheKey) => {
  const cached = dashboardCache.get(cacheKey);
  
  if (cached && (Date.now() - cached.timestamp < CACHE_DURATION)) {
    return cached.data;
  }
  
  return null;
};

// Helper function to set cached dashboard data
const setCachedDashboardData = (cacheKey, data) => {
  dashboardCache.set(cacheKey, {
    data: data,
    timestamp: Date.now()
  });
  
  // Clean up old cache entries periodically
  if (dashboardCache.size > 100) {
    const cutoff = Date.now() - CACHE_DURATION;
    for (const [key, value] of dashboardCache.entries()) {
      if (value.timestamp < cutoff) {
        dashboardCache.delete(key);
      }
    }
  }
};

// @desc    Get optimized HR dashboard data
// @route   GET /api/hr/dashboard
// @access  Private (HR, CEO, Co-founder)
const getHRDashboard = async (req, res) => {
  try {
    const cacheKey = `hr-dashboard-${req.user.id}`;
    
    // Check cache first
    const cachedData = getCachedDashboardData(cacheKey);
    if (cachedData) {
      return res.status(200).json({
        success: true,
        data: cachedData,
        cached: true
      });
    }

    // Fetch data in parallel for better performance
    const [employees, projects, tasks] = await Promise.all([
      // Get only essential employee data
      User.find({ role: { $in: ['individual', 'service-delivery', 'service-onboarding'] } })
        .select('firstName lastName email employeeId department isActive')
        .lean(),
        
      // Get project stats
      Project.find()
        .select('name status deadline createdAt')
        .lean(),
        
      // Get task stats with minimal population
      Task.find()
        .select('status deadline points assignedTo project createdAt')
        .populate('assignedTo', 'firstName lastName _id')
        .lean()
    ]);

    // Calculate metrics efficiently
    const totalEmployees = employees.length;
    const activeProjects = projects.filter(p => p.status === 'in-progress').length;
    const completedProjects = projects.filter(p => p.status === 'completed').length;
    const totalTasks = tasks.length;
    const completedTasks = tasks.filter(t => t.status === 'completed').length;
    const overdueTasks = tasks.filter(t => 
      t.status !== 'completed' && 
      new Date(t.deadline) < new Date()
    ).length;

    // Calculate employee performance efficiently
    const employeePerformance = employees.map(employee => {
      const employeeTasks = tasks.filter(task => 
        task.assignedTo && task.assignedTo._id.toString() === employee._id.toString()
      );
      const completedEmployeeTasks = employeeTasks.filter(task => task.status === 'completed');
      const overdueEmployeeTasks = employeeTasks.filter(task => 
        task.status !== 'completed' && 
        new Date(task.deadline) < new Date()
      );
      
      const totalPoints = employeeTasks.reduce((sum, task) => sum + (task.points || 0), 0);
      const earnedPoints = completedEmployeeTasks.reduce((sum, task) => sum + (task.points || 0), 0);
      
      return {
        ...employee,
        totalTasks: employeeTasks.length,
        completedTasks: completedEmployeeTasks.length,
        overdueTasks: overdueEmployeeTasks.length,
        totalPoints,
        earnedPoints,
        completionRate: employeeTasks.length > 0 ? 
          Math.round((completedEmployeeTasks.length / employeeTasks.length) * 100) : 0
      };
    });

    // Get top performers
    const topPerformers = employeePerformance
      .filter(emp => emp.totalTasks > 0)
      .sort((a, b) => {
        if (b.completionRate !== a.completionRate) {
          return b.completionRate - a.completionRate;
        }
        return b.earnedPoints - a.earnedPoints;
      })
      .slice(0, 5);

    // Get recent projects (last 3)
    const recentProjects = projects
      .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt))
      .slice(0, 3);

    const dashboardData = {
      stats: {
        totalEmployees,
        activeProjects,
        completedProjects,
        totalTasks,
        completedTasks,
        overdueTasks,
        taskCompletionRate: totalTasks > 0 ? Math.round((completedTasks / totalTasks) * 100) : 0
      },
      topPerformers,
      recentProjects,
      employeePerformance: employeePerformance.slice(0, 10), // Limit to 10 for initial view
      timestamp: new Date().toISOString()
    };

    // Cache the data
    setCachedDashboardData(cacheKey, dashboardData);

    res.status(200).json({
      success: true,
      data: dashboardData,
      cached: false
    });

  } catch (error) {
    console.error('Get HR dashboard error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch HR dashboard data',
      error: process.env.NODE_ENV === 'development' ? error.message : {}
    });
  }
};

// @desc    Get paginated employee list
// @route   GET /api/hr/employees
// @access  Private (HR, CEO, Co-founder)
const getEmployees = async (req, res) => {
  try {
    const { page = 1, limit = 10, search, role, department } = req.query;
    
    // Build query
    let query = {};
    
    if (role) query.role = role.toLowerCase();
    if (department) query.department = new RegExp(department, 'i');
    
    // Search functionality
    if (search) {
      query.$or = [
        { firstName: new RegExp(search, 'i') },
        { lastName: new RegExp(search, 'i') },
        { email: new RegExp(search, 'i') },
        { employeeId: new RegExp(search, 'i') }
      ];
    }

    // Pagination
    const skip = (page - 1) * limit;
    const limitInt = parseInt(limit);
    
    const [employees, total] = await Promise.all([
      User.find(query)
        .select('-password')
        .skip(skip)
        .limit(limitInt)
        .sort({ createdAt: -1 })
        .lean(),
      User.countDocuments(query)
    ]);

    res.status(200).json({
      success: true,
      data: {
        employees,
        pagination: {
          currentPage: parseInt(page),
          totalPages: Math.ceil(total / limitInt),
          totalEmployees: total,
          hasNext: page < Math.ceil(total / limitInt),
          hasPrev: page > 1
        }
      }
    });

  } catch (error) {
    console.error('Get employees error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch employees',
      error: process.env.NODE_ENV === 'development' ? error.message : {}
    });
  }
};

// @desc    Get paginated project list
// @route   GET /api/hr/projects
// @access  Private (HR, CEO, Co-founder)
const getProjects = async (req, res) => {
  try {
    const { page = 1, limit = 10, status } = req.query;
    
    let query = {};
    if (status) query.status = status;

    const skip = (page - 1) * limit;
    const limitInt = parseInt(limit);
    
    const [projects, total] = await Promise.all([
      Project.find(query)
        .select('name description status deadline createdAt')
        .populate('assignedManager', 'firstName lastName')
        .skip(skip)
        .limit(limitInt)
        .sort({ createdAt: -1 })
        .lean(),
      Project.countDocuments(query)
    ]);

    res.status(200).json({
      success: true,
      data: {
        projects,
        pagination: {
          currentPage: parseInt(page),
          totalPages: Math.ceil(total / limitInt),
          totalProjects: total,
          hasNext: page < Math.ceil(total / limitInt),
          hasPrev: page > 1
        }
      }
    });

  } catch (error) {
    console.error('Get projects error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch projects',
      error: process.env.NODE_ENV === 'development' ? error.message : {}
    });
  }
};

// @desc    Get paginated task list
// @route   GET /api/hr/tasks
// @access  Private (HR, CEO, Co-founder)
const getTasks = async (req, res) => {
  try {
    const { page = 1, limit = 10, status, projectId } = req.query;
    
    let query = {};
    if (status) query.status = status;
    if (projectId) query.project = projectId;

    const skip = (page - 1) * limit;
    const limitInt = parseInt(limit);
    
    const [tasks, total] = await Promise.all([
      Task.find(query)
        .select('title status deadline points createdAt')
        .populate('assignedTo', 'firstName lastName')
        .populate('project', 'name')
        .skip(skip)
        .limit(limitInt)
        .sort({ deadline: 1 })
        .lean(),
      Task.countDocuments(query)
    ]);

    res.status(200).json({
      success: true,
      data: {
        tasks,
        pagination: {
          currentPage: parseInt(page),
          totalPages: Math.ceil(total / limitInt),
          totalTasks: total,
          hasNext: page < Math.ceil(total / limitInt),
          hasPrev: page > 1
        }
      }
    });

  } catch (error) {
    console.error('Get tasks error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch tasks',
      error: process.env.NODE_ENV === 'development' ? error.message : {}
    });
  }
};

// @desc    Get detailed performance metrics for all employees
// @route   GET /api/hr/performance/all
// @access  Private (HR, CEO, Co-founder)
const getAllEmployeePerformance = async (req, res) => {
  try {
    const { period = 'all-time', sortBy = 'completionRate', page = 1, limit = 50 } = req.query;
    
    // Build date filter based on period
    let dateFilter = {};
    const now = new Date();
    
    switch (period) {
      case 'this-month':
        dateFilter = {
          $gte: new Date(now.getFullYear(), now.getMonth(), 1),
          $lte: new Date(now.getFullYear(), now.getMonth() + 1, 0)
        };
        break;
      case 'last-30-days':
        dateFilter = {
          $gte: new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000),
          $lte: now
        };
        break;
      case 'this-quarter':
        const quarter = Math.floor(now.getMonth() / 3);
        dateFilter = {
          $gte: new Date(now.getFullYear(), quarter * 3, 1),
          $lte: new Date(now.getFullYear(), (quarter + 1) * 3, 0)
        };
        break;
      case 'this-year':
        dateFilter = {
          $gte: new Date(now.getFullYear(), 0, 1),
          $lte: new Date(now.getFullYear(), 11, 31)
        };
        break;
      case 'all-time':
      default:
        // No date filter for all-time
        break;
    }

    // Get all employees - exclude only admin roles (HR, CEO, Co-founder)
    // This ensures we track performance for all working employees
    const employees = await User.find({ 
      role: { 
        $nin: ['ceo', 'co-founder', 'hr']  // Exclude admin roles
      },
      isActive: true 
    }).select('firstName lastName email employeeId department totalPoints createdAt role').lean();

    console.log(`[HR Performance] Found ${employees.length} active employees for performance tracking`);
    if (employees.length > 0) {
      console.log('[HR Performance] Sample roles:', employees.slice(0, 5).map(e => `${e.firstName} - ${e.role}`));
    }

    // Calculate performance metrics for each employee
    const employeePerformance = await Promise.all(
      employees.map(async (employee) => {
        // Get DeveloperPerformance record for pre-calculated metrics
        const developerPerf = await DeveloperPerformance.findOne({ developer: employee._id });
        
        // Build task query with date filter if specified
        let taskQuery = { assignedTo: employee._id };
        if (Object.keys(dateFilter).length > 0) {
          taskQuery.createdAt = dateFilter;
        }

        // Get all tasks assigned to this employee
        const allTasks = await Task.find(taskQuery).lean();
        
        // Get completed tasks
        const completedTasks = allTasks.filter(task => task.status === 'completed');
        const inProgressTasks = allTasks.filter(task => task.status === 'in-progress');
        const notStartedTasks = allTasks.filter(task => task.status === 'not-started');
        const overdueTasks = allTasks.filter(task => 
          task.status !== 'completed' && 
          new Date(task.deadline) < new Date()
        );
        
        // Calculate points earned in the period
        let pointsEarned = 0;
        let totalPoints = 0;
        
        if (Object.keys(dateFilter).length > 0) {
          // For specific periods, calculate points from completed tasks in that period
          const completedTasksInPeriod = await Task.find({
            assignedTo: employee._id,
            status: 'completed',
            completedAt: dateFilter
          }).lean();
          pointsEarned = completedTasksInPeriod.reduce((sum, task) => sum + (task.points || 0), 0);
          totalPoints = allTasks.reduce((sum, task) => sum + (task.points || 0), 0);
        } else {
          // For all-time, use DeveloperPerformance total or calculate from all tasks
          pointsEarned = developerPerf?.allTimeStats?.totalPointsEarned || 
                        completedTasks.reduce((sum, task) => sum + (task.points || 0), 0);
          totalPoints = allTasks.reduce((sum, task) => sum + (task.points || 0), 0);
        }

        // Calculate completion rate
        const completionRate = allTasks.length > 0 
          ? Math.round((completedTasks.length / allTasks.length) * 100) 
          : 0;
        
        // Calculate average completion time
        const tasksWithDuration = completedTasks.filter(task => 
          task.acceptedAt && task.completedAt
        );
        const avgCompletionTime = tasksWithDuration.length > 0
          ? tasksWithDuration.reduce((sum, task) => {
              const duration = new Date(task.completedAt) - new Date(task.acceptedAt);
              return sum + duration;
            }, 0) / tasksWithDuration.length
          : 0;
        const avgCompletionDays = Math.round(avgCompletionTime / (1000 * 60 * 60 * 24));
        
        // Calculate on-time delivery rate
        const onTimeCompletions = completedTasks.filter(task => 
          task.deadline && task.completedAt && 
          new Date(task.completedAt) <= new Date(task.deadline)
        ).length;
        const onTimeRate = completedTasks.length > 0 
          ? Math.round((onTimeCompletions / completedTasks.length) * 100) 
          : 0;

        return {
          employeeId: employee._id,
          name: `${employee.firstName} ${employee.lastName}`,
          email: employee.email,
          employeeCode: employee.employeeId,
          department: employee.department,
          joinedDate: employee.createdAt,
          
          // Task Metrics
          totalTasks: allTasks.length,
          completedTasks: completedTasks.length,
          inProgressTasks: inProgressTasks.length,
          notStartedTasks: notStartedTasks.length,
          overdueTasks: overdueTasks.length,
          
          // Performance Metrics
          completionRate,
          avgCompletionTime: avgCompletionDays,
          onTimeDeliveryRate: onTimeRate,
          
          // Points Metrics
          totalPointsEarned: pointsEarned,
          totalPointsAvailable: totalPoints,
          pointsCompletionRate: totalPoints > 0 ? Math.round((pointsEarned / totalPoints) * 100) : 0,
          
          // Additional Metrics from DeveloperPerformance
          productivityScore: developerPerf?.metrics?.productivityScore || 0,
          currentStreak: developerPerf?.streak?.currentStreak || 0,
          longestStreak: developerPerf?.streak?.longestStreak || 0,
          
          // Last Activity
          lastTaskCompleted: completedTasks.length > 0 
            ? completedTasks.sort((a, b) => new Date(b.completedAt) - new Date(a.completedAt))[0].completedAt
            : null
        };
      })
    );

    // Sort based on sortBy parameter
    let sortedPerformance = [...employeePerformance];
    switch (sortBy) {
      case 'completionRate':
        sortedPerformance.sort((a, b) => b.completionRate - a.completionRate);
        break;
      case 'totalTasks':
        sortedPerformance.sort((a, b) => b.totalTasks - a.totalTasks);
        break;
      case 'points':
        sortedPerformance.sort((a, b) => b.totalPointsEarned - a.totalPointsEarned);
        break;
      case 'productivity':
        sortedPerformance.sort((a, b) => b.productivityScore - a.productivityScore);
        break;
      case 'name':
        sortedPerformance.sort((a, b) => a.name.localeCompare(b.name));
        break;
      default:
        sortedPerformance.sort((a, b) => b.completionRate - a.completionRate);
    }

    // Pagination
    const skip = (page - 1) * limit;
    const paginatedData = sortedPerformance.slice(skip, skip + parseInt(limit));

    // Calculate aggregate statistics
    const totalEmployees = employeePerformance.length;
    const avgCompletionRate = totalEmployees > 0 
      ? Math.round(employeePerformance.reduce((sum, emp) => sum + emp.completionRate, 0) / totalEmployees)
      : 0;
    const totalPointsEarned = employeePerformance.reduce((sum, emp) => sum + emp.totalPointsEarned, 0);
    const totalTasksCompleted = employeePerformance.reduce((sum, emp) => sum + emp.completedTasks, 0);
    const avgProductivityScore = totalEmployees > 0
      ? Math.round(employeePerformance.reduce((sum, emp) => sum + emp.productivityScore, 0) / totalEmployees)
      : 0;

    res.status(200).json({
      success: true,
      data: paginatedData,
      pagination: {
        currentPage: parseInt(page),
        totalPages: Math.ceil(totalEmployees / parseInt(limit)),
        totalEmployees,
        hasNext: page < Math.ceil(totalEmployees / parseInt(limit)),
        hasPrev: page > 1
      },
      statistics: {
        totalEmployees,
        avgCompletionRate,
        totalPointsEarned,
        totalTasksCompleted,
        avgProductivityScore,
        period
      },
      generatedAt: new Date()
    });

  } catch (error) {
    console.error('Get all employee performance error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch employee performance data',
      error: process.env.NODE_ENV === 'development' ? error.message : {}
    });
  }
};

// @desc    Get detailed performance metrics for a specific employee
// @route   GET /api/hr/performance/:employeeId
// @access  Private (HR, CEO, Co-founder)
const getEmployeePerformance = async (req, res) => {
  try {
    const { employeeId } = req.params;
    const { period = 'all-time' } = req.query;
    
    console.log(`[HR Performance Detail] Fetching performance for employee ID: ${employeeId}, period: ${period}`);
    
    // Verify employee exists
    const employee = await User.findById(employeeId)
      .select('firstName lastName email employeeId department totalPoints createdAt role isActive');
    
    if (!employee) {
      console.log(`[HR Performance Detail] Employee not found with ID: ${employeeId}`);
      return res.status(404).json({
        success: false,
        message: 'Employee not found'
      });
    }
    
    console.log(`[HR Performance Detail] Found employee: ${employee.firstName} ${employee.lastName}`);

    // Build date filter based on period
    let dateFilter = {};
    const now = new Date();
    
    switch (period) {
      case 'this-month':
        dateFilter = {
          $gte: new Date(now.getFullYear(), now.getMonth(), 1),
          $lte: new Date(now.getFullYear(), now.getMonth() + 1, 0)
        };
        break;
      case 'last-30-days':
        dateFilter = {
          $gte: new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000),
          $lte: now
        };
        break;
      case 'this-quarter':
        const quarter = Math.floor(now.getMonth() / 3);
        dateFilter = {
          $gte: new Date(now.getFullYear(), quarter * 3, 1),
          $lte: new Date(now.getFullYear(), (quarter + 1) * 3, 0)
        };
        break;
      case 'this-year':
        dateFilter = {
          $gte: new Date(now.getFullYear(), 0, 1),
          $lte: new Date(now.getFullYear(), 11, 31)
        };
        break;
      case 'all-time':
      default:
        // No date filter for all-time
        break;
    }

    // Get DeveloperPerformance record
    const developerPerf = await DeveloperPerformance.findOne({ developer: employeeId });
    
    // Build task query with date filter if specified
    let taskQuery = { assignedTo: employeeId };
    if (Object.keys(dateFilter).length > 0) {
      taskQuery.createdAt = dateFilter;
    }

    // Get all tasks assigned to this employee
    const allTasks = await Task.find(taskQuery)
      .populate('project', 'name')
      .lean();
    
    // Categorize tasks by status
    const completedTasks = allTasks.filter(task => task.status === 'completed');
    const inProgressTasks = allTasks.filter(task => task.status === 'in-progress');
    const notStartedTasks = allTasks.filter(task => task.status === 'not-started');
    const reviewTasks = allTasks.filter(task => task.status === 'review');
    const cantCompleteTasks = allTasks.filter(task => task.status === 'cant-complete');
    const overdueTasks = allTasks.filter(task => 
      task.status !== 'completed' && 
      new Date(task.deadline) < new Date()
    );
    
    // Calculate points earned
    let pointsEarned = 0;
    let totalPoints = allTasks.reduce((sum, task) => sum + (task.points || 0), 0);
    
    if (Object.keys(dateFilter).length > 0) {
      const completedTasksInPeriod = await Task.find({
        assignedTo: employeeId,
        status: 'completed',
        completedAt: dateFilter
      }).lean();
      pointsEarned = completedTasksInPeriod.reduce((sum, task) => sum + (task.points || 0), 0);
    } else {
      pointsEarned = developerPerf?.allTimeStats?.totalPointsEarned || 
                    completedTasks.reduce((sum, task) => sum + (task.points || 0), 0);
    }

    // Calculate completion rate
    const completionRate = allTasks.length > 0 
      ? Math.round((completedTasks.length / allTasks.length) * 100) 
      : 0;
    
    // Calculate average completion time
    const tasksWithDuration = completedTasks.filter(task => 
      task.acceptedAt && task.completedAt
    );
    const avgCompletionTime = tasksWithDuration.length > 0
      ? tasksWithDuration.reduce((sum, task) => {
          const duration = new Date(task.completedAt) - new Date(task.acceptedAt);
          return sum + duration;
        }, 0) / tasksWithDuration.length
      : 0;
    const avgCompletionDays = Math.round(avgCompletionTime / (1000 * 60 * 60 * 24));
    
    // Calculate on-time delivery rate
    const onTimeCompletions = completedTasks.filter(task => 
      task.deadline && task.completedAt && 
      new Date(task.completedAt) <= new Date(task.deadline)
    ).length;
    const onTimeRate = completedTasks.length > 0 
      ? Math.round((onTimeCompletions / completedTasks.length) * 100) 
      : 0;

    // Get recent completed tasks (last 5)
    const recentCompletedTasks = completedTasks
      .sort((a, b) => new Date(b.completedAt) - new Date(a.completedAt))
      .slice(0, 5)
      .map(task => ({
        id: task._id,
        title: task.title,
        points: task.points,
        completedAt: task.completedAt,
        project: task.project?.name
      }));

    // Calculate daily/weekly/monthly stats
    let periodStats = {};
    if (developerPerf) {
      periodStats = {
        daily: {
          tasksCompleted: developerPerf.dailyStats.tasksCompletedToday,
          pointsEarned: developerPerf.dailyStats.pointsEarnedToday,
          onTimeCompletions: developerPerf.dailyStats.onTimeCompletionsToday
        },
        weekly: {
          tasksCompleted: developerPerf.weeklyStats.tasksCompletedThisWeek,
          pointsEarned: developerPerf.weeklyStats.pointsEarnedThisWeek,
          onTimeCompletions: developerPerf.weeklyStats.onTimeCompletionsThisWeek
        },
        monthly: {
          tasksCompleted: developerPerf.monthlyStats.tasksCompletedThisMonth,
          pointsEarned: developerPerf.monthlyStats.pointsEarnedThisMonth,
          onTimeCompletions: developerPerf.monthlyStats.onTimeCompletionsThisMonth
        }
      };
    }

    const performanceData = {
      employee: {
        id: employee._id,
        name: `${employee.firstName} ${employee.lastName}`,
        email: employee.email,
        employeeCode: employee.employeeId,
        department: employee.department,
        role: employee.role,
        isActive: employee.isActive,
        joinedDate: employee.createdAt
      },
      
      // Task Statistics
      taskStats: {
        total: allTasks.length,
        completed: completedTasks.length,
        inProgress: inProgressTasks.length,
        notStarted: notStartedTasks.length,
        review: reviewTasks.length,
        cantComplete: cantCompleteTasks.length,
        overdue: overdueTasks.length
      },
      
      // Performance Metrics
      metrics: {
        completionRate,
        avgCompletionTime: avgCompletionDays,
        onTimeDeliveryRate: onTimeRate,
        productivityScore: developerPerf?.metrics?.productivityScore || 0,
        averagePointsPerTask: developerPerf?.metrics?.averagePointsPerTask || 0
      },
      
      // Points Statistics
      pointsStats: {
        totalEarned: pointsEarned,
        totalAvailable: totalPoints,
        completionRate: totalPoints > 0 ? Math.round((pointsEarned / totalPoints) * 100) : 0
      },
      
      // Streak Information
      streak: {
        current: developerPerf?.streak?.currentStreak || 0,
        longest: developerPerf?.streak?.longestStreak || 0,
        lastActiveDate: developerPerf?.streak?.lastActiveDate || null
      },
      
      // Period-specific stats
      periodStats,
      
      // Recent Activity
      recentCompletedTasks,
      lastTaskCompleted: completedTasks.length > 0 
        ? completedTasks.sort((a, b) => new Date(b.completedAt) - new Date(a.completedAt))[0].completedAt
        : null,
      
      period,
      generatedAt: new Date()
    };

    res.status(200).json({
      success: true,
      data: performanceData
    });

  } catch (error) {
    console.error('Get employee performance error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch employee performance data',
      error: process.env.NODE_ENV === 'development' ? error.message : {}
    });
  }
};

// @desc    Get all employees with payroll calculation preview
// @route   GET /api/hr/payroll/preview
// @access  Private (HR, CEO, Co-founder)
const getAllEmployeePayrollPreview = async (req, res) => {
  try {
    console.log('Getting all employee payroll preview...');
    
    const { month, year } = req.query;
    
    // Use current month/year if not provided
    const targetDate = new Date();
    if (month && year) {
      targetDate.setMonth(parseInt(month) - 1);
      targetDate.setFullYear(parseInt(year));
    }
    
    // Get all active employees (exclude admin roles)
    const employees = await User.find({
      role: { $nin: ['ceo', 'co-founder', 'hr'] },
      isActive: { $ne: false }
    }).select('_id firstName lastName employeeId email role department salary');

    console.log(`Found ${employees.length} employees for payroll preview`);

    // Import required models for performance calculation
    const Task = require('../models/Task');
    const Attendance = require('../models/Attendance');
    const { Leave } = require('../models/Leave');
    const AutomatedPayrollService = require('../services/AutomatedPayrollService');

    // Calculate working days boundaries for the month
    const startDate = new Date(targetDate.getFullYear(), targetDate.getMonth(), 1);
    const endDate = new Date(targetDate.getFullYear(), targetDate.getMonth() + 1, 0);

    // Process each employee in parallel
    const payrollPreviews = await Promise.all(employees.map(async (employee) => {
      try {
        // Get basic salary from employee profile or use default
        const basicSalary = employee.salary || 30000;

        // Calculate task metrics
        const [allTasks, completedTasks, overdueTasks] = await Promise.all([
          Task.countDocuments({ 
            assignedTo: employee._id,
            createdAt: { $gte: startDate, $lte: endDate }
          }),
          Task.countDocuments({ 
            assignedTo: employee._id,
            status: 'completed',
            createdAt: { $gte: startDate, $lte: endDate }
          }),
          Task.countDocuments({ 
            assignedTo: employee._id,
            status: { $nin: ['completed', 'cancelled'] },
            dueDate: { $lt: new Date() },
            createdAt: { $gte: startDate, $lte: endDate }
          })
        ]);

        // Calculate completion rate
        const completionRate = allTasks > 0 ? 
          Math.round((completedTasks / allTasks) * 100) : 0;

        // Get points earned
        const completedTasksWithPoints = await Task.find({
          assignedTo: employee._id,
          status: 'completed',
          createdAt: { $gte: startDate, $lte: endDate }
        }).select('points');
        
        const totalPointsEarned = completedTasksWithPoints.reduce((sum, task) => 
          sum + (task.points || 0), 0);

        // Calculate attendance
        const attendanceRecords = await Attendance.find({
          employeeId: employee._id,
          date: { $gte: startDate, $lte: endDate }
        });

        const presentDays = attendanceRecords.filter(record => 
          ['present', 'partial', 'late', 'early-departure'].includes(record.status)
        ).length;

        // Get leave days
        const leaveRecords = await Leave.find({
          employee: employee._id,
          status: { $in: ['approved', 'hr_approved'] },
          $or: [
            { startDate: { $gte: startDate, $lte: endDate } },
            { endDate: { $gte: startDate, $lte: endDate } },
            { startDate: { $lte: startDate }, endDate: { $gte: endDate } }
          ]
        });

        // Calculate leave days in this month
        let leaveDays = 0;
        leaveRecords.forEach(leave => {
          const leaveStart = new Date(Math.max(leave.startDate, startDate));
          const leaveEnd = new Date(Math.min(leave.endDate, endDate));
          
          // Count working days in leave period
          let currentDate = new Date(leaveStart);
          while (currentDate <= leaveEnd) {
            const dayOfWeek = currentDate.getDay();
            if (dayOfWeek !== 0 && dayOfWeek !== 6) {
              leaveDays++;
            }
            currentDate.setDate(currentDate.getDate() + 1);
          }
        });

        // Calculate total working days
        const totalWorkingDays = AutomatedPayrollService.getWorkingDaysInMonth(startDate, endDate);
        
        // Calculate attendance rate
        const attendanceRate = totalWorkingDays > 0 ? 
          Math.round((presentDays / totalWorkingDays) * 100) : 0;

        // ========================================
        // SIMPLIFIED PAYROLL CALCULATION
        // Parameters: Basic Salary, Attendance, Leaves, Performance
        // No tax/PF/insurance deductions
        // ========================================
        
        let payrollCalculation = null;
        try {
          // Step 1: Calculate Attendance-Adjusted Base Salary (70% weightage)
          // Formula: Base Salary × (Present Days + Approved Leave Days) / Total Working Days
          const effectiveDays = presentDays + leaveDays; // Present + approved leaves
          const attendanceFactor = totalWorkingDays > 0 ? effectiveDays / totalWorkingDays : 1;
          const attendanceAdjustedSalary = Math.round(basicSalary * attendanceFactor);
          
          // Step 2: Calculate Performance Bonus (30% weightage)
          // Based on task completion rate
          let performanceBonusPercentage = 0;
          if (completionRate >= 90) {
            performanceBonusPercentage = 0.25; // 25% bonus for excellent performance
          } else if (completionRate >= 80) {
            performanceBonusPercentage = 0.20; // 20% bonus for great performance
          } else if (completionRate >= 70) {
            performanceBonusPercentage = 0.15; // 15% bonus for good performance
          } else if (completionRate >= 60) {
            performanceBonusPercentage = 0.10; // 10% bonus for satisfactory performance
          } else {
            performanceBonusPercentage = 0; // No bonus for poor performance
          }
          
          const performanceBonus = Math.round(attendanceAdjustedSalary * performanceBonusPercentage);
          
          // Step 3: Calculate Points-Based Incentive
          // ₹100 per point earned
          const pointValue = 100;
          const pointsIncentive = totalPointsEarned * pointValue;
          
          // Step 4: Calculate Final Net Salary
          const netSalary = attendanceAdjustedSalary + performanceBonus + pointsIncentive;
          
          // Determine performance tier based on completion rate
          let performanceTier = null;
          if (completionRate >= 90) performanceTier = 'Excellent';
          else if (completionRate >= 80) performanceTier = 'Great';
          else if (completionRate >= 70) performanceTier = 'Good';
          else if (completionRate >= 60) performanceTier = 'Satisfactory';
          else if (completionRate > 0) performanceTier = 'Needs Improvement';
          
          payrollCalculation = {
            // Base components
            basicSalary: basicSalary,
            
            // Attendance adjustment (70% weightage)
            attendanceAdjustedSalary: attendanceAdjustedSalary,
            attendanceFactor: Math.round(attendanceFactor * 100), // as percentage
            
            // Performance bonus (30% weightage)
            performanceBonus: performanceBonus,
            performanceBonusPercentage: Math.round(performanceBonusPercentage * 100),
            
            // Points incentive
            pointsIncentive: pointsIncentive,
            pointValue: pointValue,
            
            // Final salary
            netSalary: netSalary,
            
            // Breakdown for display
            workingDays: {
              total: totalWorkingDays,
              present: presentDays,
              leave: leaveDays,
              effective: effectiveDays
            },
            
            // Performance tier
            performanceTier: performanceTier
          };
        } catch (payrollError) {
          console.warn(`Payroll calculation failed for ${employee.employeeId}:`, payrollError.message);
        }

        return {
          employeeId: employee._id,
          employeeCode: employee.employeeId,
          name: `${employee.firstName} ${employee.lastName}`,
          email: employee.email,
          role: employee.role,
          department: employee.department,
          
          // Performance metrics
          performance: {
            totalTasks: allTasks,
            completedTasks,
            overdueTasks,
            completionRate,
            totalPointsEarned
          },
          
          // Attendance metrics
          attendance: {
            totalWorkingDays,
            presentDays,
            leaveDays,
            attendanceRate
          },
          
          // Payroll calculation
          payroll: payrollCalculation
        };
      } catch (employeeError) {
        console.error(`Error processing employee ${employee.employeeId}:`, employeeError);
        return {
          employeeId: employee._id,
          employeeCode: employee.employeeId,
          name: `${employee.firstName} ${employee.lastName}`,
          error: 'Failed to calculate payroll preview'
        };
      }
    }));

    console.log(`Processed ${payrollPreviews.length} employee payroll previews`);

    res.status(200).json({
      success: true,
      data: payrollPreviews.filter(p => !p.error),
      month: targetDate.getMonth() + 1,
      year: targetDate.getFullYear(),
      count: payrollPreviews.filter(p => !p.error).length
    });

  } catch (error) {
    console.error('Get payroll preview error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch payroll preview data',
      error: process.env.NODE_ENV === 'development' ? error.message : {}
    });
  }
};

// Helper function to invalidate HR dashboard cache
const invalidateHRCache = () => {
  for (const key of dashboardCache.keys()) {
    if (key.startsWith('hr-dashboard-')) {
      dashboardCache.delete(key);
    }
  }
};

module.exports = {
  getHRDashboard,
  getEmployees,
  getProjects,
  getTasks,
  getAllEmployeePerformance,
  getEmployeePerformance,
  getAllEmployeePayrollPreview,
  invalidateHRCache
};