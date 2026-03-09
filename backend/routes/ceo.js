const express = require('express');
const router = express.Router();
const mongoose = require('mongoose');
const User = require('../models/User');
const Project = require('../models/Project');
const Company = require('../models/Company');
const Lead = require('../models/Lead');
const Attendance = require('../models/Attendance');
const Sale = require('../models/Sale');
const auth = require('../middleware/auth'); // Assuming auth middleware exists

// Helper to get date ranges
const getDateRanges = () => {
    const now = new Date();
    const startOfDay = new Date(now.setHours(0, 0, 0, 0));
    const startOfWeek = new Date(now.setDate(now.getDate() - now.getDay()));
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
    const startOfYear = new Date(now.getFullYear(), 0, 1);
    return { startOfDay, startOfWeek, startOfMonth, startOfYear };
};

// GET /api/ceo/dashboard
router.get('/dashboard', async (req, res) => {
    try {
        const { startOfDay, startOfWeek, startOfMonth, startOfYear } = getDateRanges();

        // 1. Team Stats
        // Count all active employees (excluding system/admin if any, although role enum doesn't have admin)
        const totalEmployees = await User.countDocuments({ isActive: true });

        // Attendance calculation
        const attendanceToday = await Attendance.countDocuments({
            date: { $gte: startOfDay },
            status: { $in: ['present', 'late', 'half-day'] }
        });

        // Department Breakdown
        const users = await User.find({ isActive: true });
        const departmentBreakdown = users.reduce((acc, user) => {
            const dept = user.department || 'Unassigned';
            acc[dept] = (acc[dept] || 0) + 1;
            return acc;
        }, {});

        // 2. Business/Project Stats
        const [activeProjects, totalProjects, approvedClients, totalClients, allActiveProjects, allClients] = await Promise.all([
            Project.countDocuments({
                status: { $in: ['not-started', 'in-progress', 'on-hold', 'ready-for-assignment'] },
                isDeleted: { $ne: true }
            }),
            Project.countDocuments({ isDeleted: { $ne: true } }),
            Company.countDocuments({ status: 'approved', isDeleted: { $ne: true } }),
            Company.countDocuments({ isDeleted: { $ne: true } }),
            Project.find({
                status: { $nin: ['cancelled'] },
                isDeleted: { $ne: true }
            })
                .populate('assignedManager', 'firstName lastName')
                .sort({ updatedAt: -1 }),
            Company.find({
                status: { $in: ['approved', 'in-contact', 'researching', 'identified', 'on-hold'] },
                isDeleted: { $ne: true }
            })
                .populate('identifiedBy', 'firstName lastName')
                .sort({ updatedAt: -1 })
        ]);

        // Client Industry Breakdown
        const clientIndustryBreakdown = allClients.reduce((acc, client) => {
            const industry = client.industry || 'Other';
            acc[industry] = (acc[industry] || 0) + 1;
            return acc;
        }, {});

        // 3. Sales Stats
        const activeLeads = await Lead.countDocuments({ status: { $nin: ['converted', 'lost'] } });
        const leadsToday = await Lead.countDocuments({ createdAt: { $gte: startOfDay } });
        const leadsWeek = await Lead.countDocuments({ createdAt: { $gte: startOfWeek } });
        const leadsMonth = await Lead.countDocuments({ createdAt: { $gte: startOfMonth } });

        // 4. Financials (Mocked logic for calculations as simple aggregations)
        const monthlyRevenue = 1500000;
        const monthlyExpenses = 850000;
        const currentFunds = 2450000;

        // 5. Leadership (Fetch users with specific roles)
        const executives = await User.find({ role: { $in: ['admin', 'manager', 'director', 'ceo', 'co-ceo'] } })
            .select('firstName lastName email phone role')
            .limit(5);

        const responseData = {
            financials: {
                currentFunds: { value: currentFunds },
                monthlyRevenue: { value: monthlyRevenue, growth: 12.5 },
                monthlyProfit: { value: monthlyRevenue - monthlyExpenses, margin: Math.round(((monthlyRevenue - monthlyExpenses) / monthlyRevenue) * 100) },
                monthlyExpenses: { value: monthlyExpenses, change: -5.2 },
                ytdExpenses: { value: monthlyExpenses * 12 },
                ytdRevenue: { value: monthlyRevenue * 12 }
            },
            business: {
                activeProjects: { value: activeProjects, total: totalProjects },
                activeClients: { value: approvedClients, total: totalClients },
                pipelineValue: { value: 5000000 },
                projects: allActiveProjects,
                clients: allClients,
                clientIndustryBreakdown
            },
            team: {
                totalEmployees,
                attendanceRate: {
                    value: totalEmployees ? Math.round((attendanceToday / totalEmployees) * 100) : 0,
                    present: attendanceToday,
                    total: totalEmployees
                },
                departmentBreakdown
            },
            sales: {
                activeLeads: { value: activeLeads },
                leadFlow: { today: leadsToday, week: leadsWeek, month: leadsMonth },
                conversionRate: { value: 24 }
            },
            meetings: {
                today: 4, week: 12, month: 45,
                upcoming: [
                    { id: 1, title: 'Strategy Review', date: new Date().toISOString(), assignedTo: 'Board' },
                    { id: 2, title: 'Quarterly Planning', date: new Date(Date.now() + 86400000).toISOString(), assignedTo: 'Team Leads' }
                ]
            },
            leadership: {
                executives: executives.map(ex => ({
                    id: ex._id,
                    name: `${ex.firstName} ${ex.lastName}`,
                    role: ex.role,
                    email: ex.email,
                    phone: ex.phone
                }))
            },
            recentActivities: [
                { title: 'New Project Signed', subtitle: 'Global Tech Solution', timestamp: new Date().toISOString(), icon: 'Target', color: 'green' },
                { title: 'Revenue Milestone', subtitle: 'Crossed 1Cr Monthly', timestamp: new Date(Date.now() - 3600000).toISOString(), icon: 'TrendingUp', color: 'blue' },
                { title: 'New Hire', subtitle: 'Senior Developer joined', timestamp: new Date(Date.now() - 7200000).toISOString(), icon: 'Users', color: 'purple' }
            ],
            metadata: {
                lastUpdated: new Date()
            }
        };

        res.json({
            success: true,
            data: responseData
        });

    } catch (error) {
        console.error('CEO Dashboard Error:', error);
        res.status(500).json({ success: false, message: 'Server error retrieving dashboard data' });
    }
});

module.exports = router;
