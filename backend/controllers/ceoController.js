const User = require('../models/User');
const Company = require('../models/Company');
const Project = require('../models/Project');
const Sale = require('../models/Sale');
const Lead = require('../models/Lead');
const Payroll = require('../models/Payroll');
const Attendance = require('../models/Attendance');
const Leave = require('../models/Leave');
const RevenueTarget = require('../models/RevenueTarget');
const SalesTarget = require('../models/SalesTarget');

const ceoController = {
  // Get comprehensive CEO dashboard data
  getCEODashboard: async (req, res) => {
    try {
      const now = new Date();
      const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
      const endOfMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0);
      const startOfLastMonth = new Date(now.getFullYear(), now.getMonth() - 1, 1);
      const endOfLastMonth = new Date(now.getFullYear(), now.getMonth(), 0);
      const startOfYear = new Date(now.getFullYear(), 0, 1);
      const startOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate());
      const startOfWeek = new Date(now);
      startOfWeek.setDate(now.getDate() - now.getDay());
      startOfWeek.setHours(0, 0, 0, 0);

      // 1. Current Funds in Bank (Revenue - Expenses)
      const [allSales, allPayrolls] = await Promise.all([
        Sale.find({ stage: 'closed-won' }),
        Payroll.find({})
      ]);

      const totalRevenue = allSales.reduce((sum, sale) => sum + (sale.actualValue || sale.estimatedValue || 0), 0);
      const totalExpenses = allPayrolls.reduce((sum, payroll) => sum + (payroll.netSalary || 0), 0);
      const currentFunds = totalRevenue - totalExpenses;

      // 2. Monthly Revenue & Profit
      const [monthlyRevenue, lastMonthRevenue] = await Promise.all([
        Sale.find({
          stage: 'closed-won',
          closedAt: { $gte: startOfMonth, $lte: endOfMonth }
        }),
        Sale.find({
          stage: 'closed-won',
          closedAt: { $gte: startOfLastMonth, $lte: endOfLastMonth }
        })
      ]);

      const thisMonthRevenue = monthlyRevenue.reduce((sum, sale) => 
        sum + (sale.actualValue || sale.estimatedValue || 0), 0
      );
      const lastMonthRevenueAmount = lastMonthRevenue.reduce((sum, sale) => 
        sum + (sale.actualValue || sale.estimatedValue || 0), 0
      );
      const revenueGrowth = lastMonthRevenueAmount > 0 
        ? ((thisMonthRevenue - lastMonthRevenueAmount) / lastMonthRevenueAmount * 100).toFixed(1)
        : 0;

      // 3. Monthly Expenses/Losses
      const [monthlyPayrolls, lastMonthPayrolls] = await Promise.all([
        Payroll.find({
          salaryMonth: { $gte: startOfMonth, $lte: endOfMonth }
        }),
        Payroll.find({
          salaryMonth: { $gte: startOfLastMonth, $lte: endOfLastMonth }
        })
      ]);

      const thisMonthExpenses = monthlyPayrolls.reduce((sum, payroll) => 
        sum + (payroll.netSalary || 0), 0
      );
      const lastMonthExpensesAmount = lastMonthPayrolls.reduce((sum, payroll) => 
        sum + (payroll.netSalary || 0), 0
      );
      const expenseChange = lastMonthExpensesAmount > 0
        ? ((thisMonthExpenses - lastMonthExpensesAmount) / lastMonthExpensesAmount * 100).toFixed(1)
        : 0;

      const monthlyProfit = thisMonthRevenue - thisMonthExpenses;
      const profitMargin = thisMonthRevenue > 0 
        ? ((monthlyProfit / thisMonthRevenue) * 100).toFixed(1)
        : 0;

      // 4. Current Clients & Projects
      const [activeClients, activeProjects, totalClients, totalProjects] = await Promise.all([
        Sale.distinct('clientName', { stage: { $in: ['negotiation', 'closed-won'] } }),
        Project.countDocuments({ status: { $in: ['in-progress', 'not-started'] } }),
        Sale.distinct('clientName', { stage: 'closed-won' }),
        Project.countDocuments({})
      ]);

      // 5. Team Size & Departments
      const allUsers = await User.find({ isActive: true });
      const departmentBreakdown = allUsers.reduce((acc, user) => {
        const dept = user.department || 'Unassigned';
        acc[dept] = (acc[dept] || 0) + 1;
        return acc;
      }, {});

      const roleBreakdown = allUsers.reduce((acc, user) => {
        const role = user.roleDisplay || user.role || 'Unknown';
        acc[role] = (acc[role] || 0) + 1;
        return acc;
      }, {});

      // 6. Active Prospects & Lead Flow
      const [activeLeads, todayLeads, weekLeads, monthLeads, conversionRate] = await Promise.all([
        Lead.countDocuments({ 
          stage: { $in: ['new', 'contacted', 'qualified', 'proposal', 'negotiation'] }
        }),
        Lead.countDocuments({ 
          createdAt: { $gte: startOfToday }
        }),
        Lead.countDocuments({ 
          createdAt: { $gte: startOfWeek }
        }),
        Lead.countDocuments({ 
          createdAt: { $gte: startOfMonth }
        }),
        Lead.aggregate([
          {
            $group: {
              _id: null,
              total: { $sum: 1 },
              converted: {
                $sum: { $cond: [{ $eq: ['$stage', 'closed-won'] }, 1, 0] }
              }
            }
          }
        ])
      ]);

      const conversionRateValue = conversionRate[0]?.total > 0
        ? ((conversionRate[0].converted / conversionRate[0].total) * 100).toFixed(1)
        : 0;

      // Pipeline Value
      const pipelineLeads = await Lead.find({
        stage: { $in: ['qualified', 'proposal', 'negotiation'] }
      });
      const pipelineValue = pipelineLeads.reduce((sum, lead) => 
        sum + (lead.potentialValue || 0), 0
      );

      // 7. Meetings (Day/Week/Month) - Based on Lead follow-ups
      const [todayMeetings, weekMeetings, monthMeetings] = await Promise.all([
        Lead.countDocuments({
          nextFollowUp: {
            $gte: startOfToday,
            $lt: new Date(startOfToday.getTime() + 24 * 60 * 60 * 1000)
          }
        }),
        Lead.countDocuments({
          nextFollowUp: {
            $gte: startOfWeek,
            $lt: new Date(startOfWeek.getTime() + 7 * 24 * 60 * 60 * 1000)
          }
        }),
        Lead.countDocuments({
          nextFollowUp: {
            $gte: startOfMonth,
            $lte: endOfMonth
          }
        })
      ]);

      // Upcoming meetings details
      const upcomingMeetings = await Lead.find({
        nextFollowUp: { $gte: now }
      })
        .sort({ nextFollowUp: 1 })
        .limit(10)
        .populate('assignedTo', 'firstName lastName email')
        .populate('company', 'companyName');

      // 8. Team Meetings / Scrum Calls - Based on attendance patterns
      const todayAttendance = await Attendance.find({
        date: {
          $gte: startOfToday,
          $lt: new Date(startOfToday.getTime() + 24 * 60 * 60 * 1000)
        }
      }).populate('userId', 'firstName lastName role');

      const attendanceRate = allUsers.length > 0
        ? ((todayAttendance.length / allUsers.length) * 100).toFixed(1)
        : 0;

      // 9 & 10. BOD Data and Investors/Fundraisers (Placeholder - to be expanded)
      const executives = await User.find({
        role: { $in: ['ceo', 'co-founder', 'cto', 'cfo'] }
      }).select('firstName lastName role email phoneNumber');

      // Year-to-date metrics
      const ytdSales = await Sale.find({
        stage: 'closed-won',
        closedAt: { $gte: startOfYear }
      });
      const ytdRevenue = ytdSales.reduce((sum, sale) => 
        sum + (sale.actualValue || sale.estimatedValue || 0), 0
      );

      const ytdPayrolls = await Payroll.find({
        salaryMonth: { $gte: startOfYear }
      });
      const ytdExpenses = ytdPayrolls.reduce((sum, payroll) => 
        sum + (payroll.netSalary || 0), 0
      );

      // Recent activities
      const recentActivities = await Promise.all([
        Sale.find({ stage: 'closed-won' })
          .sort({ closedAt: -1 })
          .limit(5)
          .populate('createdBy', 'firstName lastName'),
        Project.find({})
          .sort({ createdAt: -1 })
          .limit(5)
          .populate('createdBy', 'firstName lastName'),
        Lead.find({ stage: 'closed-won' })
          .sort({ updatedAt: -1 })
          .limit(5)
          .populate('assignedTo', 'firstName lastName')
      ]);

      const [recentSales, recentProjects, recentConversions] = recentActivities;

      // Combine and format activities
      const activities = [
        ...recentSales.map(sale => ({
          type: 'sale',
          icon: 'DollarSign',
          title: `New sale closed: ${sale.clientName}`,
          subtitle: `₹${(sale.actualValue || sale.estimatedValue || 0).toLocaleString('en-IN')} by ${sale.createdBy?.firstName || 'Unknown'}`,
          timestamp: sale.closedAt || sale.createdAt,
          color: 'green'
        })),
        ...recentProjects.map(project => ({
          type: 'project',
          icon: 'Target',
          title: `New project: ${project.name}`,
          subtitle: `Created by ${project.createdBy?.firstName || 'Unknown'}`,
          timestamp: project.createdAt,
          color: 'blue'
        })),
        ...recentConversions.map(lead => ({
          type: 'conversion',
          icon: 'TrendingUp',
          title: `Lead converted: ${lead.companyName || 'Company'}`,
          subtitle: `Assigned to ${lead.assignedTo?.firstName || 'Unknown'}`,
          timestamp: lead.updatedAt,
          color: 'purple'
        }))
      ]
        .sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp))
        .slice(0, 10);

      // Response
      res.json({
        success: true,
        data: {
          // 1. Financial Overview
          financials: {
            currentFunds: {
              value: currentFunds,
              formatted: `₹${currentFunds.toLocaleString('en-IN')}`,
              label: 'Current Funds in Bank'
            },
            monthlyRevenue: {
              value: thisMonthRevenue,
              formatted: `₹${thisMonthRevenue.toLocaleString('en-IN')}`,
              growth: revenueGrowth,
              label: 'Monthly Revenue'
            },
            monthlyProfit: {
              value: monthlyProfit,
              formatted: `₹${monthlyProfit.toLocaleString('en-IN')}`,
              margin: profitMargin,
              label: 'Monthly Profit'
            },
            monthlyExpenses: {
              value: thisMonthExpenses,
              formatted: `₹${thisMonthExpenses.toLocaleString('en-IN')}`,
              change: expenseChange,
              label: 'Monthly Expenses'
            },
            ytdRevenue: {
              value: ytdRevenue,
              formatted: `₹${ytdRevenue.toLocaleString('en-IN')}`,
              label: 'Year-to-Date Revenue'
            },
            ytdExpenses: {
              value: ytdExpenses,
              formatted: `₹${ytdExpenses.toLocaleString('en-IN')}`,
              label: 'Year-to-Date Expenses'
            }
          },

          // 2. Business Metrics
          business: {
            activeClients: {
              value: activeClients.length,
              total: totalClients.length,
              label: 'Active Clients'
            },
            activeProjects: {
              value: activeProjects,
              total: totalProjects,
              label: 'Active Projects'
            },
            pipelineValue: {
              value: pipelineValue,
              formatted: `₹${pipelineValue.toLocaleString('en-IN')}`,
              label: 'Pipeline Value'
            }
          },

          // 3. Team & Organization
          team: {
            totalEmployees: allUsers.length,
            departmentBreakdown,
            roleBreakdown,
            attendanceRate: {
              value: attendanceRate,
              label: 'Today\'s Attendance',
              present: todayAttendance.length,
              total: allUsers.length
            }
          },

          // 4. Sales & Leads
          sales: {
            activeLeads: {
              value: activeLeads,
              label: 'Active Prospects'
            },
            leadFlow: {
              today: todayLeads,
              week: weekLeads,
              month: monthLeads
            },
            conversionRate: {
              value: conversionRateValue,
              label: 'Conversion Rate'
            }
          },

          // 5. Meetings & Activities
          meetings: {
            today: todayMeetings,
            week: weekMeetings,
            month: monthMeetings,
            upcoming: upcomingMeetings.map(meeting => ({
              id: meeting._id,
              title: meeting.companyName || 'Meeting',
              date: meeting.nextFollowUp,
              assignedTo: meeting.assignedTo ? 
                `${meeting.assignedTo.firstName} ${meeting.assignedTo.lastName}` : 
                'Unassigned',
              company: meeting.company?.companyName || 'N/A',
              stage: meeting.stage
            }))
          },

          // 6. Leadership Team
          leadership: {
            executives: executives.map(exec => ({
              id: exec._id,
              name: `${exec.firstName} ${exec.lastName}`,
              role: exec.roleDisplay || exec.role,
              email: exec.email,
              phone: exec.phoneNumber
            }))
          },

          // 7. Recent Activities
          recentActivities: activities,

          // 8. Dashboard metadata
          metadata: {
            lastUpdated: now,
            reportingPeriod: {
              start: startOfMonth,
              end: endOfMonth
            }
          }
        }
      });

    } catch (error) {
      console.error('❌ Error fetching CEO dashboard:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to fetch CEO dashboard data',
        error: error.message
      });
    }
  },

  // Get detailed financial report
  getFinancialReport: async (req, res) => {
    try {
      const { startDate, endDate } = req.query;
      
      const start = startDate ? new Date(startDate) : new Date(new Date().getFullYear(), 0, 1);
      const end = endDate ? new Date(endDate) : new Date();

      const [sales, payrolls] = await Promise.all([
        Sale.find({
          stage: 'closed-won',
          closedAt: { $gte: start, $lte: end }
        }).populate('createdBy', 'firstName lastName'),
        Payroll.find({
          salaryMonth: { $gte: start, $lte: end }
        }).populate('employeeId', 'firstName lastName')
      ]);

      const revenue = sales.reduce((sum, sale) => 
        sum + (sale.actualValue || sale.estimatedValue || 0), 0
      );
      const expenses = payrolls.reduce((sum, payroll) => 
        sum + (payroll.netSalary || 0), 0
      );

      res.json({
        success: true,
        data: {
          period: { start, end },
          revenue: {
            total: revenue,
            formatted: `₹${revenue.toLocaleString('en-IN')}`,
            breakdown: sales.map(sale => ({
              client: sale.clientName,
              amount: sale.actualValue || sale.estimatedValue,
              date: sale.closedAt,
              salesPerson: sale.createdBy ? 
                `${sale.createdBy.firstName} ${sale.createdBy.lastName}` : 
                'Unknown'
            }))
          },
          expenses: {
            total: expenses,
            formatted: `₹${expenses.toLocaleString('en-IN')}`,
            breakdown: payrolls.map(payroll => ({
              employee: payroll.employeeId ? 
                `${payroll.employeeId.firstName} ${payroll.employeeId.lastName}` : 
                'Unknown',
              amount: payroll.netSalary,
              month: payroll.salaryMonth
            }))
          },
          netProfit: {
            value: revenue - expenses,
            formatted: `₹${(revenue - expenses).toLocaleString('en-IN')}`,
            margin: revenue > 0 ? ((revenue - expenses) / revenue * 100).toFixed(2) : 0
          }
        }
      });

    } catch (error) {
      console.error('❌ Error fetching financial report:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to fetch financial report',
        error: error.message
      });
    }
  }
};

module.exports = ceoController;
