const Task = require('../models/Task');
const Project = require('../models/Project');
const User = require('../models/User');

// @desc    Get team report data with project and date filtering
// @route   GET /api/team-reports
// @access  Private (Manager, CEO, Co-founder)
const getTeamReportData = async (req, res) => {
    try {
        const { projectId = 'all', startDate, endDate } = req.query;
        const userRole = req.user.role;

        // Build base query for tasks
        let taskQuery = {};

        // If specific project selected
        if (projectId && projectId !== 'all') {
            taskQuery.project = projectId;
        }

        // Add date filters if provided
        if (startDate || endDate) {
            taskQuery.createdAt = {};
            if (startDate) {
                taskQuery.createdAt.$gte = new Date(startDate);
            }
            if (endDate) {
                taskQuery.createdAt.$lte = new Date(endDate);
            }
        }

        // For managers, only show tasks from their projects
        // For now, we'll show all tasks since hierarchy might not be fully configured
        // This can be enhanced later based on project.createdBy or project.assignedManager

        // Fetch tasks with populated fields
        const tasks = await Task.find(taskQuery)
            .populate('assignedTo', 'firstName lastName email')
            .populate('project', 'name')
            .sort({ createdAt: -1 });

        // Calculate summary statistics
        const totalTasks = tasks.length;
        const completedTasks = tasks.filter(t => t.status === 'completed').length;
        const activeTasks = tasks.filter(t => t.status === 'in-progress').length;
        const notStartedTasks = tasks.filter(t => t.status === 'not-started').length;
        const reviewTasks = tasks.filter(t => t.status === 'review').length;

        // Calculate overdue tasks (deadline passed and not completed)
        const now = new Date();
        const overdueTasks = tasks.filter(t =>
            t.status !== 'completed' && t.deadline && new Date(t.deadline) < now
        ).length;

        // Calculate total points (from completed tasks)
        const totalPoints = tasks
            .filter(t => t.status === 'completed')
            .reduce((sum, task) => sum + (task.points || 0), 0);

        // Get unique team members
        const uniqueTeamMembers = new Set(
            tasks
                .filter(t => t.assignedTo)
                .map(t => t.assignedTo._id.toString())
        );
        const teamSize = uniqueTeamMembers.size;

        // Task distribution by status
        const taskDistribution = {
            'Not Started': notStartedTasks,
            'In Progress': activeTasks,
            'Completed': completedTasks,
            'Review': reviewTasks,
            'Cant Complete': tasks.filter(t => t.status === 'cant-complete').length
        };

        // Calculate top performers
        const performerMap = {};
        tasks.forEach(task => {
            if (task.assignedTo && task.status === 'completed') {
                const userId = task.assignedTo._id.toString();
                const userName = `${task.assignedTo.firstName} ${task.assignedTo.lastName}`;

                if (!performerMap[userId]) {
                    performerMap[userId] = {
                        name: userName,
                        points: 0,
                        tasks: 0
                    };
                }

                performerMap[userId].points += task.points || 0;
                performerMap[userId].tasks += 1;
            }
        });

        // Convert to array and sort by points
        const topPerformers = Object.values(performerMap)
            .sort((a, b) => b.points - a.points)
            .slice(0, 5); // Top 5 performers

        // Prepare response
        const reportData = {
            summary: {
                totalTasks,
                completedTasks,
                activeTasks,
                overdueTask: overdueTasks,
                totalPoints,
                teamMembers: teamSize
            },
            taskDistribution,
            topPerformers,
            filters: {
                projectId,
                startDate,
                endDate
            },
            generatedAt: new Date()
        };

        res.status(200).json({
            success: true,
            data: reportData
        });

    } catch (error) {
        console.error('Get team report data error:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to fetch team report data',
            error: process.env.NODE_ENV === 'development' ? error.message : {}
        });
    }
};

module.exports = {
    getTeamReportData
};
