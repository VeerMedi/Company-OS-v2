const Task = require('../models/Task');
const User = require('../models/User');
const { Leave } = require('../models/Leave');

// @desc    Get performance report data with employee filtering
// @route   GET /api/performance-reports
// @access  Private (Manager, CEO, Co-founder)
const getPerformanceReportData = async (req, res) => {
    try {
        const { employeeId = 'all', period = 'all-time' } = req.query;

        // Build date filter based on period
        let dateFilter = {};
        const now = new Date();

        switch (period) {
            case 'current-month':
                dateFilter = {
                    $gte: new Date(now.getFullYear(), now.getMonth(), 1),
                    $lte: new Date(now.getFullYear(), now.getMonth() + 1, 0)
                };
                break;
            case 'current-quarter':
                const quarter = Math.floor(now.getMonth() / 3);
                dateFilter = {
                    $gte: new Date(now.getFullYear(), quarter * 3, 1),
                    $lte: new Date(now.getFullYear(), (quarter + 1) * 3, 0)
                };
                break;
            case 'all-time':
            default:
                break;
        }

        // Get all team members (developers, team-leads, interns)
        const teamMembers = await User.find({
            role: { $in: ['developer', 'team-lead', 'intern', 'individual', 'service-delivery', 'service-onboarding'] },
            isActive: true
        }).select('firstName lastName email role');

        // Build task query
        let taskQuery = {};
        const mongoose = require('mongoose');

        if (employeeId && employeeId !== 'all') {
            try {
                taskQuery.assignedTo = new mongoose.Types.ObjectId(employeeId);
            } catch (err) {
                console.error('Invalid employeeId format:', employeeId);
                // Fallback or handle error
            }
        } else {
            // Get tasks for all team members
            const memberIds = teamMembers.map(m => m._id);
            taskQuery.assignedTo = { $in: memberIds };
        }

        if (Object.keys(dateFilter).length > 0) {
            taskQuery.createdAt = dateFilter;
        }

        // Fetch tasks with populated fields for detailed view
        const tasks = await Task.find(taskQuery)
            .populate('assignedTo', 'firstName lastName email role')
            .populate('project', 'name')
            .sort({ createdAt: -1 });

        // Calculate summary statistics
        const totalTasks = tasks.length;
        const completedTasksList = tasks.filter(t => t.status === 'completed');
        const completedTasks = completedTasksList.length;
        const inProgressTasks = tasks.filter(t => t.status === 'in-progress').length;
        const notStartedTasks = tasks.filter(t => t.status === 'not-started').length;
        const reviewTasks = tasks.filter(t => t.status === 'review').length;

        // Calculate overdue tasks
        const overdueTasks = tasks.filter(t =>
            t.status !== 'completed' && t.deadline && new Date(t.deadline) < now
        ).length;

        // Calculate total points earned
        const totalPoints = completedTasksList.reduce((sum, task) => sum + (task.points || 0), 0);

        // Calculate completion rate
        const completionRate = totalTasks > 0
            ? Math.round((completedTasks / totalTasks) * 100)
            : 0;

        // Calculate team size/stats (unique assignees)
        const uniqueAssignees = new Set(
            tasks
                .filter(t => t.assignedTo)
                .map(t => t.assignedTo._id.toString())
        );
        const teamSize = uniqueAssignees.size;

        // Task distribution by status
        const taskDistribution = {
            'Not Started': notStartedTasks,
            'In Progress': inProgressTasks,
            'Completed': completedTasks,
            'Review': reviewTasks,
            'Overdue': overdueTasks
        };

        // Calculate performer stats
        const performerMap = {};
        tasks.forEach(task => {
            if (task.assignedTo) {
                const usrId = task.assignedTo._id.toString();
                const userName = `${task.assignedTo.firstName} ${task.assignedTo.lastName}`;

                if (!performerMap[usrId]) {
                    performerMap[usrId] = {
                        id: usrId,
                        name: userName,
                        role: task.assignedTo.role,
                        points: 0,
                        tasks: 0,
                        totalTasks: 0,
                        completedTasks: 0
                    };
                }

                performerMap[usrId].totalTasks += 1;
                if (task.status === 'completed') {
                    performerMap[usrId].points += task.points || 0;
                    performerMap[usrId].completedTasks += 1;
                }
            }
        });

        // Convert to array and sort by points
        const topPerformers = Object.values(performerMap)
            .map(p => ({
                ...p,
                tasks: p.completedTasks, // for backward compatibility in UI
                completionRate: p.totalTasks > 0 ? Math.round((p.completedTasks / p.totalTasks) * 100) : 0
            }))
            .sort((a, b) => b.points - a.points);

        // Fetch Performance Evaluations for the selected employee if provided
        let evaluations = [];
        let attendanceSummary = null;
        let leaveSummary = null;

        if (employeeId && employeeId !== 'all') {
            try {
                // Determine date range for attendance/leave
                let start, end = now;
                if (period === 'current-month') {
                    start = new Date(now.getFullYear(), now.getMonth(), 1);
                } else if (period === 'current-quarter') {
                    const quarter = Math.floor(now.getMonth() / 3);
                    start = new Date(now.getFullYear(), quarter * 3, 1);
                } else {
                    start = new Date(2020, 0, 1); // fallback to all-time
                }

                // Fetch Attendance Summary
                const Attendance = mongoose.model('Attendance');
                const rawAttendance = await Attendance.getAttendanceSummary(employeeId, start, end);

                // Calculate Total Attended Days (All days they came to work)
                const totalAttendedDays = (rawAttendance.presentDays || 0) +
                    (rawAttendance.lateDays || 0) +
                    (rawAttendance.partialDays || 0) +
                    (rawAttendance.earlyDepartureDays || 0);

                attendanceSummary = {
                    ...rawAttendance,
                    totalAttendedDays
                };

                // Fetch Leave Summary (Year-To-Date to show full picture)
                const currentYearStart = new Date(now.getFullYear(), 0, 1);
                const currentYearEnd = new Date(now.getFullYear(), 11, 31, 23, 59, 59);

                const leaves = await Leave.find({
                    employee: employeeId,
                    startDate: { $lte: currentYearEnd },
                    endDate: { $gte: currentYearStart }
                });

                console.log('Leave Query Result:', {
                    employeeId,
                    totalLeaves: leaves.length,
                    leavesData: leaves.map(l => ({ 
                        status: l.status, 
                        totalDays: l.totalDays,
                        leaveType: l.leaveType 
                    }))
                });

                const approvedLeaves = leaves.filter(l => l.status === 'approved');

                leaveSummary = {
                    totalAppliedDays: leaves.reduce((sum, l) => sum + (l.totalDays || 0), 0),
                    totalApprovedDays: approvedLeaves.reduce((sum, l) => sum + (l.totalDays || 0), 0),
                    appliedCount: leaves.length,
                    approvedCount: approvedLeaves.length,
                    details: approvedLeaves.map(l => ({
                        type: l.leaveType,
                        days: l.totalDays,
                        startDate: l.startDate,
                        endDate: l.endDate
                    }))
                };

                // Fetch evaluations
                const PerformanceEvaluation = mongoose.model('PerformanceEvaluation');
                evaluations = await PerformanceEvaluation.find({ employee: employeeId })
                    .populate('manager', 'firstName lastName')
                    .sort({ 'evaluationPeriod.endDate': -1 });
            } catch (modelErr) {
                console.warn('Model fetching error in performance report:', modelErr.message);
            }
        }

        // Prepare response
        const reportData = {
            summary: {
                totalTasks,
                completedTasks,
                inProgressTasks,
                notStartedTasks, // Extra detail
                overdueTasks,
                totalPoints,
                completionRate,
                teamSize
            },
            taskDistribution,
            topPerformers,
            // For specific employee view
            employeeDetails: employeeId !== 'all' ? {
                tasks: tasks.map(t => ({
                    _id: t._id,
                    title: t.title,
                    status: t.status,
                    points: t.points,
                    deadline: t.deadline,
                    project: t.project?.name,
                    completedAt: t.completedAt
                })),
                evaluations: evaluations,
                attendance: attendanceSummary,
                leaves: leaveSummary
            } : null,
            employees: teamMembers.map(m => ({
                id: m._id,
                name: `${m.firstName} ${m.lastName}`,
                email: m.email,
                role: m.role
            })),
            filters: {
                employeeId,
                period
            },
            generatedAt: new Date()
        };

        res.status(200).json({
            success: true,
            data: reportData
        });

    } catch (error) {
        console.error('Get performance report data error:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to fetch performance report data',
            error: process.env.NODE_ENV === 'development' ? error.message : {}
        });
    }
};

module.exports = {
    getPerformanceReportData
};
