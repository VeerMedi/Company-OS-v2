const analyticsController = {
  // Get VOICE analytics data
  getVOICEAnalytics: async (req, res) => {
    try {
      const { serviceType } = req.query; // 'service-onboarding' or 'service-delivery'
      
      // Determine which role to analyze based on service type
      const targetRole = serviceType === 'service-onboarding' 
        ? 'service-onboarding' 
        : 'service-delivery';

      // Fetch all users with the target role
      const User = require('../models/User');
      const SalesTarget = require('../models/SalesTarget');
      const Sale = require('../models/Sale');
      const Lead = require('../models/Lead');
      const Company = require('../models/Company');
      const Attendance = require('../models/Attendance');

      const teamMembers = await User.find({ role: targetRole }).select('name email createdAt');

      if (teamMembers.length === 0) {
        return res.json({
          success: true,
          data: {
            overview: {
              totalMembers: 0,
              averageTQS: 0,
            },
            voiceCategories: {
              goingGood: [],
              needsImprovement: [],
              terriblyBad: [],
              needsAttention: []
            },
            metrics: {
              avgAlignment: 0,
              avgEfficiency: 0,
              avgCompletion: 0,
              avgCompliance: 0
            },
            teamStats: {
              totalRevenue: 0,
              totalLeads: 0,
              totalCompanies: 0,
              totalSales: 0,
              conversionRate: 0,
              avgDealValue: 0,
              avgResponseTime: 0
            },
            topPerformers: [],
            recentActivity: []
          }
        });
      }

      // Calculate date ranges
      const now = new Date();
      const last30Days = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
      const last7Days = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
      const thisMonth = new Date(now.getFullYear(), now.getMonth(), 1);
      const lastMonth = new Date(now.getFullYear(), now.getMonth() - 1, 1);
      const lastMonthEnd = new Date(now.getFullYear(), now.getMonth(), 0);

      // Fetch comprehensive data for all team members
      const [allSales, allLeads, allCompanies, allTargets, allAttendance] = await Promise.all([
        Sale.find({ 
          createdBy: { $in: teamMembers.map(m => m._id) }
        }).sort({ createdAt: -1 }),
        Lead.find({ 
          assignedTo: { $in: teamMembers.map(m => m._id) }
        }).populate('assignedTo', 'name email'),
        Company.find({ 
          submittedBy: { $in: teamMembers.map(m => m._id) }
        }).populate('submittedBy', 'name email'),
        SalesTarget.find({ 
          userId: { $in: teamMembers.map(m => m._id) }
        }),
        Attendance.find({
          userId: { $in: teamMembers.map(m => m._id) },
          date: { $gte: last30Days }
        })
      ]);

      // Calculate team-wide statistics
      const teamStats = {
        totalRevenue: allSales.reduce((sum, s) => sum + (s.amount || 0), 0),
        totalLeads: allLeads.length,
        totalCompanies: allCompanies.length,
        totalSales: allSales.length,
        conversionRate: allLeads.length > 0 
          ? (allLeads.filter(l => l.stage === 'closed-won').length / allLeads.length * 100)
          : 0,
        avgDealValue: allSales.length > 0 
          ? allSales.reduce((sum, s) => sum + (s.amount || 0), 0) / allSales.length
          : 0,
        avgResponseTime: calculateAvgResponseTime(allLeads),
        revenueGrowth: calculateRevenueGrowth(allSales, thisMonth, lastMonth, lastMonthEnd),
        leadsThisMonth: allLeads.filter(l => new Date(l.createdAt) >= thisMonth).length,
        leadsLastMonth: allLeads.filter(l => 
          new Date(l.createdAt) >= lastMonth && new Date(l.createdAt) <= lastMonthEnd
        ).length,
        companiesApproved: allCompanies.filter(c => c.approvalStatus === 'approved').length,
        companiesPending: allCompanies.filter(c => c.approvalStatus === 'pending').length,
        companiesRejected: allCompanies.filter(c => c.approvalStatus === 'rejected').length,
        activeLeads: allLeads.filter(l => l.status === 'active' && !['closed-won', 'closed-lost'].includes(l.stage)).length
      };

      // Calculate TQS for each team member with enhanced metrics
      const memberAnalytics = await Promise.all(
        teamMembers.map(async (member) => {
          // Filter data for this member
          const memberSales = allSales.filter(s => s.createdBy.toString() === member._id.toString());
          const memberLeads = allLeads.filter(l => l.assignedTo && l.assignedTo._id.toString() === member._id.toString());
          const memberCompanies = allCompanies.filter(c => c.submittedBy && c.submittedBy._id.toString() === member._id.toString());
          const memberTargets = allTargets.filter(t => t.userId.toString() === member._id.toString());
          const memberAttendance = allAttendance.filter(a => a.userId.toString() === member._id.toString());

          // Calculate additional metrics
          const memberMetrics = calculateEnhancedMetrics({
            member,
            sales: memberSales,
            leads: memberLeads,
            companies: memberCompanies,
            targets: memberTargets,
            attendance: memberAttendance,
            dateRanges: { last30Days, last7Days, thisMonth, lastMonth, lastMonthEnd }
          });

          // Calculate the 4 key TQS scores
          const scores = calculateTQSScores({
            member,
            targets: memberTargets,
            sales: memberSales,
            leads: memberLeads,
            companies: memberCompanies,
            attendanceRecords: memberAttendance
          });

          // Calculate TQS using weighted formula
          const weights = {
            alignment: 0.3,
            efficiency: 0.3,
            completion: 0.3,
            compliance: 0.1
          };

          const tqs = 
            weights.alignment * scores.alignment +
            weights.efficiency * scores.efficiency +
            weights.completion * scores.completion +
            weights.compliance * scores.compliance;

          return {
            userId: member._id,
            name: member.name,
            email: member.email,
            joinedDate: member.createdAt,
            scores,
            tqs,
            metrics: memberMetrics,
            triggers: determineTriggers(scores, tqs, { 
              sales: memberSales, 
              leads: memberLeads, 
              companies: memberCompanies, 
              targets: memberTargets, 
              attendanceRecords: memberAttendance 
            }),
            performance: {
              trend: calculatePerformanceTrend(memberSales, memberLeads, last7Days, last30Days),
              rank: 0 // Will be calculated after sorting
            }
          };
        })
      );

      // Rank members by TQS
      memberAnalytics.sort((a, b) => b.tqs - a.tqs);
      memberAnalytics.forEach((member, index) => {
        member.performance.rank = index + 1;
      });

      // Categorize members into VOICE buckets
      const voiceCategories = {
        goingGood: [],
        needsImprovement: [],
        terriblyBad: [],
        needsAttention: []
      };

      memberAnalytics.forEach(member => {
        const dqsIPS = (member.scores.efficiency + member.scores.completion) / 2;
        
        if (dqsIPS >= 0.85 && member.tqs >= 0.85) {
          voiceCategories.goingGood.push(member);
        } else if (dqsIPS < 0.6 || member.tqs < 0.6) {
          voiceCategories.terriblyBad.push(member);
        } else if ((dqsIPS >= 0.6 && dqsIPS < 0.8) || member.scores.efficiency < 0.75) {
          voiceCategories.needsImprovement.push(member);
        } else {
          voiceCategories.needsAttention.push(member);
        }
      });

      // Calculate overall metrics
      const avgTQS = memberAnalytics.reduce((sum, m) => sum + m.tqs, 0) / memberAnalytics.length;
      const avgAlignment = memberAnalytics.reduce((sum, m) => sum + m.scores.alignment, 0) / memberAnalytics.length;
      const avgEfficiency = memberAnalytics.reduce((sum, m) => sum + m.scores.efficiency, 0) / memberAnalytics.length;
      const avgCompletion = memberAnalytics.reduce((sum, m) => sum + m.scores.completion, 0) / memberAnalytics.length;
      const avgCompliance = memberAnalytics.reduce((sum, m) => sum + m.scores.compliance, 0) / memberAnalytics.length;

      // Get top performers (top 3)
      const topPerformers = memberAnalytics.slice(0, 3).map(m => ({
        name: m.name,
        tqs: m.tqs,
        revenue: m.metrics.totalRevenue,
        deals: m.metrics.totalDeals
      }));

      // Get recent activity
      const recentActivity = generateRecentActivity(allSales, allLeads, allCompanies);

      res.json({
        success: true,
        data: {
          overview: {
            totalMembers: memberAnalytics.length,
            averageTQS: avgTQS,
            serviceType,
            lastUpdated: new Date()
          },
          voiceCategories,
          metrics: {
            avgAlignment,
            avgEfficiency,
            avgCompletion,
            avgCompliance
          },
          teamStats,
          topPerformers,
          recentActivity: recentActivity.slice(0, 10),
          rawData: memberAnalytics,
          insights: generateInsights(memberAnalytics, voiceCategories, teamStats)
        }
      });

    } catch (error) {
      console.error('Error fetching VOICE analytics:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to fetch analytics data',
        error: error.message
      });
    }
  },

  // Process natural language queries about analytics
  processQuery: async (req, res) => {
    try {
      const { query, serviceType, analyticsData } = req.body;

      // Parse the query and generate intelligent response
      const response = await generateQueryResponse(query, analyticsData, serviceType);

      res.json({
        success: true,
        data: {
          response,
          timestamp: new Date()
        }
      });

    } catch (error) {
      console.error('Error processing query:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to process query',
        error: error.message
      });
    }
  }
};

// Helper function to calculate TQS scores
function calculateTQSScores({ member, targets, sales, leads, companies, attendanceRecords }) {
  // 1. ALIGNMENT - Time spent on assigned vs off-road tasks
  // Higher score = more time on assigned tasks
  let alignment = 0.8; // Default baseline
  
  if (targets.length > 0) {
    const activeTarget = targets[0];
    const assignedTaskTime = leads.length + companies.length + sales.length;
    const totalTime = assignedTaskTime + (targets.length > 1 ? 10 : 0); // Penalty for multiple targets
    alignment = assignedTaskTime / (totalTime || 1);
  }

  // 2. EFFICIENCY - Ratio of estimated time vs reported time spent
  let efficiency = 0.75; // Default baseline
  
  if (targets.length > 0 && sales.length > 0) {
    const activeTarget = targets[0];
    const targetAmount = activeTarget.revenueTarget || activeTarget.companiesTarget || 1;
    const actualRevenue = sales.reduce((sum, sale) => sum + (sale.amount || 0), 0);
    
    // Calculate efficiency as actual/target, capped at 1.0
    efficiency = Math.min(actualRevenue / targetAmount, 1.0);
  }

  // If no sales but has leads, partial credit
  if (sales.length === 0 && leads.length > 0) {
    const convertedLeads = leads.filter(l => l.stage === 'closed-won').length;
    efficiency = convertedLeads / (leads.length || 1) * 0.8;
  }

  // 3. COMPLETION - Rewards tasks marked complete and signed off
  let completion = 0.7; // Default baseline
  
  const completedLeads = leads.filter(l => l.stage === 'closed-won' || l.status === 'completed').length;
  const totalLeads = leads.length || 1;
  const approvedCompanies = companies.filter(c => c.approvalStatus === 'approved').length;
  const totalCompanies = companies.length || 1;
  
  // Weighted completion based on leads and companies
  completion = (
    (completedLeads / totalLeads) * 0.6 +
    (approvedCompanies / totalCompanies) * 0.4
  );

  // Bonus for closing sales
  if (sales.length > 0) {
    completion = Math.min(completion + 0.1, 1.0);
  }

  // 4. COMPLIANCE - Zero tolerance for policy/process deviation
  let compliance = 1.0; // Start with perfect compliance
  
  // Check attendance compliance
  const workDaysInPeriod = 22; // Approximately 30 days = 22 working days
  const attendedDays = attendanceRecords.filter(a => a.status === 'present').length;
  const attendanceRate = attendedDays / workDaysInPeriod;
  
  if (attendanceRate < 0.9) {
    compliance = 0; // Any attendance violation = 0
  }

  // Check for process violations
  const pendingCompanies = companies.filter(c => 
    c.approvalStatus === 'pending' && 
    (new Date() - new Date(c.createdAt)) > 7 * 24 * 60 * 60 * 1000 // Pending > 7 days
  );
  
  if (pendingCompanies.length > 0) {
    compliance = 0; // Process violation
  }

  // Check for missed deadlines in leads
  const overdueLeads = leads.filter(l => 
    l.nextFollowUp && 
    new Date(l.nextFollowUp) < new Date() && 
    l.stage !== 'closed-won' && 
    l.stage !== 'closed-lost'
  );
  
  if (overdueLeads.length > 2) {
    compliance = 0; // Multiple missed follow-ups
  }

  return {
    alignment: Math.max(0, Math.min(1, alignment)),
    efficiency: Math.max(0, Math.min(1, efficiency)),
    completion: Math.max(0, Math.min(1, completion)),
    compliance: Math.max(0, Math.min(1, compliance))
  };
}

// Helper function to determine trigger conditions
function determineTriggers(scores, tqs, data) {
  const triggers = [];
  const { sales, leads, companies, targets, attendanceRecords } = data;

  // Going Good triggers
  if (tqs >= 0.85) {
    triggers.push('DQS/IPS > 0.85');
    if (targets.length > 0 && targets[0].priority === 1) {
      triggers.push('Tier 1/2 Priority Task Completed');
    }
    if (scores.efficiency >= 0.9) {
      triggers.push('Consistently High Efficiency Ratio');
    }
  }

  // Needs Improvement triggers
  if (tqs >= 0.6 && tqs < 0.8) {
    triggers.push('DQS/IPS: 0.6 - 0.8');
    if (scores.efficiency < 0.75) {
      triggers.push('Efficiency Ratio < 0.75');
    }
    
    const overdueLeads = leads.filter(l => 
      l.nextFollowUp && 
      new Date(l.nextFollowUp) < new Date()
    );
    if (overdueLeads.length > 0) {
      triggers.push('Elevated DOT (Off-track Time)');
    }
  }

  // Terribly Bad triggers
  if (tqs < 0.6) {
    triggers.push('DQS/IPS < 0.6');
    
    if (targets.length > 0) {
      const deadline = new Date(targets[0].endDate);
      const now = new Date();
      if (now > deadline) {
        triggers.push('Missed Major Deadline');
      }
    }
    
    if (scores.compliance === 0) {
      triggers.push('CRITICAL: Shared Blocker (High DRI)');
    }
  }

  // Needs Attention triggers
  if (scores.compliance < 1 && tqs >= 0.6) {
    triggers.push('Consistent but minor DRI');
  }
  
  const unresolvedLeads = leads.filter(l => 
    l.status === 'active' && 
    (new Date() - new Date(l.createdAt)) > 14 * 24 * 60 * 60 * 1000
  );
  
  if (unresolvedLeads.length > 0) {
    triggers.push('Unresolved Requests');
  }

  const conflictKeywords = ['conflict', 'issue', 'problem', 'blocker'];
  const hasConflicts = leads.some(l => 
    l.notes && conflictKeywords.some(kw => l.notes.toLowerCase().includes(kw))
  );
  
  if (hasConflicts) {
    triggers.push('Emerging Conflict Keywords');
  }

  return triggers;
}

// Helper function to calculate enhanced metrics
function calculateEnhancedMetrics({ member, sales, leads, companies, targets, attendance, dateRanges }) {
  const { last30Days, last7Days, thisMonth, lastMonth, lastMonthEnd } = dateRanges;
  
  // Sales metrics
  const totalRevenue = sales.reduce((sum, s) => sum + (s.amount || 0), 0);
  const salesThisMonth = sales.filter(s => new Date(s.createdAt) >= thisMonth);
  const salesLastMonth = sales.filter(s => 
    new Date(s.createdAt) >= lastMonth && new Date(s.createdAt) <= lastMonthEnd
  );
  const salesLast7Days = sales.filter(s => new Date(s.createdAt) >= last7Days);
  
  // Lead metrics
  const totalLeads = leads.length;
  const activeLeads = leads.filter(l => l.status === 'active' && !['closed-won', 'closed-lost'].includes(l.stage));
  const wonLeads = leads.filter(l => l.stage === 'closed-won');
  const lostLeads = leads.filter(l => l.stage === 'closed-lost');
  const conversionRate = totalLeads > 0 ? (wonLeads.length / totalLeads) * 100 : 0;
  
  // Lead stage distribution
  const leadsByStage = {
    lead: leads.filter(l => l.stage === 'lead').length,
    qualified: leads.filter(l => l.stage === 'qualified').length,
    proposal: leads.filter(l => l.stage === 'proposal').length,
    negotiation: leads.filter(l => l.stage === 'negotiation').length,
    won: wonLeads.length,
    lost: lostLeads.length
  };
  
  // Company metrics
  const totalCompanies = companies.length;
  const approvedCompanies = companies.filter(c => c.approvalStatus === 'approved').length;
  const pendingCompanies = companies.filter(c => c.approvalStatus === 'pending').length;
  const rejectedCompanies = companies.filter(c => c.approvalStatus === 'rejected').length;
  
  // Response time calculation
  const leadsWithFollowups = leads.filter(l => l.followUps && l.followUps.length > 0);
  let avgResponseTime = 0;
  if (leadsWithFollowups.length > 0) {
    const responseTimes = leadsWithFollowups.map(l => {
      if (l.followUps.length > 0) {
        const firstFollowup = new Date(l.followUps[0].date);
        const leadCreated = new Date(l.createdAt);
        return (firstFollowup - leadCreated) / (1000 * 60 * 60); // hours
      }
      return 0;
    });
    avgResponseTime = responseTimes.reduce((sum, t) => sum + t, 0) / responseTimes.length;
  }
  
  // Target progress
  const activeTarget = targets.find(t => t.status === 'active');
  let targetProgress = 0;
  if (activeTarget) {
    if (activeTarget.revenueTarget) {
      const currentRevenue = salesThisMonth.reduce((sum, s) => sum + (s.amount || 0), 0);
      targetProgress = (currentRevenue / activeTarget.revenueTarget) * 100;
    } else if (activeTarget.companiesTarget) {
      const companiesThisMonth = companies.filter(c => 
        new Date(c.createdAt) >= thisMonth && c.approvalStatus === 'approved'
      ).length;
      targetProgress = (companiesThisMonth / activeTarget.companiesTarget) * 100;
    }
  }
  
  // Attendance metrics
  const workDaysInPeriod = 22; // Approximately 30 days
  const attendedDays = attendance.filter(a => a.status === 'present').length;
  const attendanceRate = (attendedDays / workDaysInPeriod) * 100;
  const lateDays = attendance.filter(a => a.isLate).length;
  
  // Activity metrics
  const avgFollowupsPerLead = totalLeads > 0 
    ? leads.reduce((sum, l) => sum + (l.followUps ? l.followUps.length : 0), 0) / totalLeads 
    : 0;
  
  // Deal metrics
  const avgDealValue = sales.length > 0 ? totalRevenue / sales.length : 0;
  const avgDealCycle = calculateAvgDealCycle(leads);
  
  return {
    totalRevenue,
    revenueThisMonth: salesThisMonth.reduce((sum, s) => sum + (s.amount || 0), 0),
    revenueLastMonth: salesLastMonth.reduce((sum, s) => sum + (s.amount || 0), 0),
    revenueLast7Days: salesLast7Days.reduce((sum, s) => sum + (s.amount || 0), 0),
    totalDeals: sales.length,
    dealsThisMonth: salesThisMonth.length,
    dealsLastMonth: salesLastMonth.length,
    totalLeads,
    activeLeads: activeLeads.length,
    wonLeads: wonLeads.length,
    lostLeads: lostLeads.length,
    conversionRate,
    leadsByStage,
    totalCompanies,
    approvedCompanies,
    pendingCompanies,
    rejectedCompanies,
    avgResponseTime,
    avgFollowupsPerLead,
    avgDealValue,
    avgDealCycle,
    targetProgress,
    currentTarget: activeTarget ? {
      type: activeTarget.targetPeriod,
      revenue: activeTarget.revenueTarget || 0,
      companies: activeTarget.companiesTarget || 0,
      progress: targetProgress
    } : null,
    attendanceRate,
    attendedDays,
    lateDays,
    streak: calculateAttendanceStreak(attendance)
  };
}

// Calculate average deal cycle time
function calculateAvgDealCycle(leads) {
  const wonLeads = leads.filter(l => l.stage === 'closed-won' && l.closedAt);
  if (wonLeads.length === 0) return 0;
  
  const cycleTimes = wonLeads.map(l => {
    const created = new Date(l.createdAt);
    const closed = new Date(l.closedAt);
    return (closed - created) / (1000 * 60 * 60 * 24); // days
  });
  
  return cycleTimes.reduce((sum, t) => sum + t, 0) / cycleTimes.length;
}

// Calculate attendance streak
function calculateAttendanceStreak(attendance) {
  if (attendance.length === 0) return 0;
  
  const sorted = attendance.sort((a, b) => new Date(b.date) - new Date(a.date));
  let streak = 0;
  
  for (const record of sorted) {
    if (record.status === 'present') {
      streak++;
    } else {
      break;
    }
  }
  
  return streak;
}

// Calculate average response time
function calculateAvgResponseTime(leads) {
  const leadsWithFollowups = leads.filter(l => l.followUps && l.followUps.length > 0);
  if (leadsWithFollowups.length === 0) return 0;
  
  const responseTimes = leadsWithFollowups.map(l => {
    const firstFollowup = new Date(l.followUps[0].date);
    const leadCreated = new Date(l.createdAt);
    return (firstFollowup - leadCreated) / (1000 * 60 * 60); // hours
  });
  
  return responseTimes.reduce((sum, t) => sum + t, 0) / responseTimes.length;
}

// Calculate revenue growth
function calculateRevenueGrowth(sales, thisMonth, lastMonth, lastMonthEnd) {
  const thisMonthSales = sales.filter(s => new Date(s.createdAt) >= thisMonth);
  const lastMonthSales = sales.filter(s => 
    new Date(s.createdAt) >= lastMonth && new Date(s.createdAt) <= lastMonthEnd
  );
  
  const thisMonthRevenue = thisMonthSales.reduce((sum, s) => sum + (s.amount || 0), 0);
  const lastMonthRevenue = lastMonthSales.reduce((sum, s) => sum + (s.amount || 0), 0);
  
  if (lastMonthRevenue === 0) return thisMonthRevenue > 0 ? 100 : 0;
  
  return ((thisMonthRevenue - lastMonthRevenue) / lastMonthRevenue) * 100;
}

// Calculate performance trend
function calculatePerformanceTrend(sales, leads, last7Days, last30Days) {
  const recent = {
    sales: sales.filter(s => new Date(s.createdAt) >= last7Days).length,
    revenue: sales.filter(s => new Date(s.createdAt) >= last7Days).reduce((sum, s) => sum + (s.amount || 0), 0),
    leads: leads.filter(l => new Date(l.createdAt) >= last7Days).length
  };
  
  const previous = {
    sales: sales.filter(s => {
      const date = new Date(s.createdAt);
      return date >= new Date(last30Days.getTime()) && date < last7Days;
    }).length / 3, // Average per week
    revenue: sales.filter(s => {
      const date = new Date(s.createdAt);
      return date >= new Date(last30Days.getTime()) && date < last7Days;
    }).reduce((sum, s) => sum + (s.amount || 0), 0) / 3,
    leads: leads.filter(l => {
      const date = new Date(l.createdAt);
      return date >= new Date(last30Days.getTime()) && date < last7Days;
    }).length / 3
  };
  
  let trendScore = 0;
  if (previous.sales > 0) trendScore += ((recent.sales - previous.sales) / previous.sales) * 0.3;
  if (previous.revenue > 0) trendScore += ((recent.revenue - previous.revenue) / previous.revenue) * 0.4;
  if (previous.leads > 0) trendScore += ((recent.leads - previous.leads) / previous.leads) * 0.3;
  
  if (trendScore > 0.1) return 'improving';
  if (trendScore < -0.1) return 'declining';
  return 'stable';
}

// Generate recent activity
function generateRecentActivity(sales, leads, companies) {
  const activities = [];
  
  // Add recent sales
  sales.slice(0, 5).forEach(sale => {
    activities.push({
      type: 'sale',
      title: `New sale: ₹${sale.amount?.toLocaleString() || 0}`,
      description: sale.customerName || 'Customer',
      timestamp: sale.createdAt,
      user: sale.createdBy
    });
  });
  
  // Add recent leads
  leads.filter(l => l.stage === 'closed-won').slice(0, 5).forEach(lead => {
    activities.push({
      type: 'lead_won',
      title: `Lead won: ${lead.companyName || 'Company'}`,
      description: lead.contactName || 'Contact',
      timestamp: lead.closedAt || lead.updatedAt,
      user: lead.assignedTo
    });
  });
  
  // Add recent companies
  companies.filter(c => c.approvalStatus === 'approved').slice(0, 5).forEach(company => {
    activities.push({
      type: 'company_approved',
      title: `Company approved: ${company.name}`,
      description: `${company.industry || 'Industry'}`,
      timestamp: company.updatedAt,
      user: company.submittedBy
    });
  });
  
  // Sort by timestamp
  activities.sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp));
  
  return activities;
}

// Generate insights
function generateInsights(memberAnalytics, voiceCategories, teamStats) {
  const insights = [];
  
  // Critical alerts
  if (voiceCategories.terriblyBad.length > 0) {
    insights.push({
      type: 'critical',
      title: `${voiceCategories.terriblyBad.length} team member(s) need immediate attention`,
      description: `Critical performance issues detected. Schedule urgent 1-on-1 meetings.`,
      action: 'Review terribly bad category',
      priority: 'high'
    });
  }
  
  // Performance warnings
  if (voiceCategories.needsImprovement.length > memberAnalytics.length * 0.3) {
    insights.push({
      type: 'warning',
      title: 'High percentage of team needs improvement',
      description: `${voiceCategories.needsImprovement.length} members (${Math.round(voiceCategories.needsImprovement.length / memberAnalytics.length * 100)}%) require coaching`,
      action: 'Review improvement strategies',
      priority: 'medium'
    });
  }
  
  // Positive insights
  if (voiceCategories.goingGood.length > memberAnalytics.length * 0.5) {
    insights.push({
      type: 'success',
      title: 'Strong team performance',
      description: `${voiceCategories.goingGood.length} members (${Math.round(voiceCategories.goingGood.length / memberAnalytics.length * 100)}%) performing excellently`,
      action: 'Continue current strategies',
      priority: 'low'
    });
  }
  
  // Conversion rate insights
  if (teamStats.conversionRate < 15) {
    insights.push({
      type: 'warning',
      title: 'Low conversion rate detected',
      description: `Team conversion rate at ${teamStats.conversionRate.toFixed(1)}%. Industry average is 15-25%.`,
      action: 'Review sales process and lead qualification',
      priority: 'high'
    });
  }
  
  // Revenue insights
  if (teamStats.revenueGrowth < 0) {
    insights.push({
      type: 'critical',
      title: 'Revenue declining',
      description: `Revenue down ${Math.abs(teamStats.revenueGrowth).toFixed(1)}% compared to last month`,
      action: 'Investigate pipeline and close rates',
      priority: 'high'
    });
  } else if (teamStats.revenueGrowth > 20) {
    insights.push({
      type: 'success',
      title: 'Strong revenue growth',
      description: `Revenue up ${teamStats.revenueGrowth.toFixed(1)}% from last month`,
      action: 'Document successful strategies',
      priority: 'low'
    });
  }
  
  // Activity insights
  if (teamStats.activeLeads < teamStats.totalLeads * 0.3) {
    insights.push({
      type: 'warning',
      title: 'Low active lead pipeline',
      description: `Only ${teamStats.activeLeads} active leads. Consider lead generation initiatives.`,
      action: 'Increase lead generation activities',
      priority: 'medium'
    });
  }
  
  return insights;
}

// Helper function to generate intelligent query responses
async function generateQueryResponse(query, analyticsData, serviceType) {
  const lowerQuery = query.toLowerCase();

  // Revenue queries
  if (lowerQuery.includes('revenue') || lowerQuery.includes('sales')) {
    const stats = analyticsData.teamStats;
    return `**Revenue & Sales Analysis:**\n\n**Total Revenue:** ₹${stats.totalRevenue.toLocaleString()}\n**Total Deals Closed:** ${stats.totalSales}\n**Average Deal Value:** ₹${Math.round(stats.avgDealValue).toLocaleString()}\n**Revenue Growth:** ${stats.revenueGrowth >= 0 ? '+' : ''}${stats.revenueGrowth.toFixed(1)}%\n\n**Monthly Comparison:**\n- This Month Leads: ${stats.leadsThisMonth}\n- Last Month Leads: ${stats.leadsLastMonth}\n- Change: ${stats.leadsThisMonth - stats.leadsLastMonth >= 0 ? '+' : ''}${stats.leadsThisMonth - stats.leadsLastMonth}\n\n**Top Revenue Generators:**\n${analyticsData.topPerformers.map((p, i) => `${i + 1}. ${p.name}: ₹${p.revenue.toLocaleString()} (${p.deals} deals)`).join('\n')}`;
  }

  // Conversion queries
  if (lowerQuery.includes('conversion') || lowerQuery.includes('win rate')) {
    const stats = analyticsData.teamStats;
    return `**Conversion Rate Analysis:**\n\n**Overall Conversion Rate:** ${stats.conversionRate.toFixed(1)}%\n**Total Leads:** ${stats.totalLeads}\n**Active Leads:** ${stats.activeLeads}\n**Won Deals:** ${analyticsData.rawData.reduce((sum, m) => sum + m.metrics.wonLeads, 0)}\n**Lost Deals:** ${analyticsData.rawData.reduce((sum, m) => sum + m.metrics.lostLeads, 0)}\n\n**Industry Benchmark:** 15-25%\n**Status:** ${stats.conversionRate >= 15 ? '✅ Meeting benchmark' : '⚠️ Below benchmark'}\n\n**Top Converters:**\n${analyticsData.rawData.filter(m => m.metrics.conversionRate > 0).sort((a, b) => b.metrics.conversionRate - a.metrics.conversionRate).slice(0, 3).map((m, i) => `${i + 1}. ${m.name}: ${m.metrics.conversionRate.toFixed(1)}% (${m.metrics.wonLeads}/${m.metrics.totalLeads})`).join('\n')}`;
  }

  // Lead pipeline queries
  if (lowerQuery.includes('pipeline') || lowerQuery.includes('leads')) {
    const stats = analyticsData.teamStats;
    return `**Lead Pipeline Status:**\n\n**Total Leads in System:** ${stats.totalLeads}\n**Active Leads:** ${stats.activeLeads}\n**Conversion Rate:** ${stats.conversionRate.toFixed(1)}%\n\n**Companies:**\n- ✅ Approved: ${stats.companiesApproved}\n- ⏳ Pending: ${stats.companiesPending}\n- ❌ Rejected: ${stats.companiesRejected}\n\n**Lead Stage Distribution:**\n${analyticsData.rawData.length > 0 ? `- New Leads: ${analyticsData.rawData.reduce((sum, m) => sum + m.metrics.leadsByStage.lead, 0)}\n- Qualified: ${analyticsData.rawData.reduce((sum, m) => sum + m.metrics.leadsByStage.qualified, 0)}\n- Proposal: ${analyticsData.rawData.reduce((sum, m) => sum + m.metrics.leadsByStage.proposal, 0)}\n- Negotiation: ${analyticsData.rawData.reduce((sum, m) => sum + m.metrics.leadsByStage.negotiation, 0)}\n- Won: ${analyticsData.rawData.reduce((sum, m) => sum + m.metrics.leadsByStage.won, 0)}\n- Lost: ${analyticsData.rawData.reduce((sum, m) => sum + m.metrics.leadsByStage.lost, 0)}` : 'No lead data available'}`;
  }

  // Target progress queries
  if (lowerQuery.includes('target') || lowerQuery.includes('quota') || lowerQuery.includes('goal')) {
    const membersWithTargets = analyticsData.rawData.filter(m => m.metrics.currentTarget);
    if (membersWithTargets.length === 0) {
      return `**Target Progress:**\n\nNo active targets found for team members. Consider setting monthly/quarterly targets to track performance.`;
    }
    return `**Target Achievement Status:**\n\n**Team Members with Active Targets:** ${membersWithTargets.length}\n\n**Individual Progress:**\n${membersWithTargets.map(m => `\n**${m.name}:**\n- Target Type: ${m.metrics.currentTarget.type}\n- Revenue Target: ₹${m.metrics.currentTarget.revenue.toLocaleString()}\n- Progress: ${m.metrics.targetProgress.toFixed(1)}%\n- Status: ${m.metrics.targetProgress >= 100 ? '✅ Achieved' : m.metrics.targetProgress >= 75 ? '🟡 On Track' : '🔴 Behind'}`).join('\n')}\n\n**Average Progress:** ${(membersWithTargets.reduce((sum, m) => sum + m.metrics.targetProgress, 0) / membersWithTargets.length).toFixed(1)}%`;
  }

  // Attendance queries
  if (lowerQuery.includes('attendance') || lowerQuery.includes('presence')) {
    const avgAttendance = analyticsData.rawData.reduce((sum, m) => sum + m.metrics.attendanceRate, 0) / analyticsData.rawData.length;
    const poorAttendance = analyticsData.rawData.filter(m => m.metrics.attendanceRate < 90);
    return `**Attendance Overview:**\n\n**Team Average Attendance:** ${avgAttendance.toFixed(1)}%\n**Standard:** Minimum 90%\n\n${poorAttendance.length > 0 ? `**⚠️ Below Standard (${poorAttendance.length} members):**\n${poorAttendance.map(m => `- ${m.name}: ${m.metrics.attendanceRate.toFixed(1)}% (${m.metrics.attendedDays} days, ${m.metrics.lateDays} late)`).join('\n')}\n\n**Action Required:** Address attendance issues with affected members` : '✅ All team members meeting attendance standards!'}\n\n**Top Attendance Streaks:**\n${analyticsData.rawData.sort((a, b) => b.metrics.streak - a.metrics.streak).slice(0, 3).map((m, i) => `${i + 1}. ${m.name}: ${m.metrics.streak} days`).join('\n')}`;
  }

  // Activity metrics
  if (lowerQuery.includes('activity') || lowerQuery.includes('engagement')) {
    return `**Team Activity Metrics:**\n\n**Recent Activity (Last 10):**\n${analyticsData.recentActivity.map(a => `\n${a.type === 'sale' ? '💰' : a.type === 'lead_won' ? '🎯' : '🏢'} **${a.title}**\n   ${a.description}\n   ${new Date(a.timestamp).toLocaleDateString()}`).join('\n')}\n\n**Average Response Time:** ${analyticsData.teamStats.avgResponseTime.toFixed(1)} hours\n**Total Active Leads:** ${analyticsData.teamStats.activeLeads}`;
  }

  // Performance trends
  if (lowerQuery.includes('trend') || lowerQuery.includes('improving') || lowerQuery.includes('declining')) {
    const improving = analyticsData.rawData.filter(m => m.performance.trend === 'improving');
    const declining = analyticsData.rawData.filter(m => m.performance.trend === 'declining');
    const stable = analyticsData.rawData.filter(m => m.performance.trend === 'stable');
    
    return `**Performance Trends:**\n\n**📈 Improving:** ${improving.length} members\n${improving.slice(0, 3).map(m => `   - ${m.name} (Rank #${m.performance.rank})`).join('\n')}\n\n**📉 Declining:** ${declining.length} members\n${declining.slice(0, 3).map(m => `   - ${m.name} (Rank #${m.performance.rank})`).join('\n')}\n\n**➡️ Stable:** ${stable.length} members\n\n${declining.length > 0 ? '**⚠️ Recommendation:** Schedule check-ins with declining performers to identify blockers.' : '✅ No concerning trends detected.'}`;
  }

  // Insights query
  if (lowerQuery.includes('insight') || lowerQuery.includes('recommendation') || lowerQuery.includes('suggest')) {
    if (!analyticsData.insights || analyticsData.insights.length === 0) {
      return `**AI Insights:**\n\nNo specific insights generated. Team performance is within normal parameters.`;
    }
    return `**AI-Generated Insights:**\n\n${analyticsData.insights.map((insight, i) => `\n**${i + 1}. ${insight.title}** [${insight.priority.toUpperCase()} PRIORITY]\n${insight.type === 'critical' ? '🚨' : insight.type === 'warning' ? '⚠️' : '✅'} ${insight.description}\n📋 **Action:** ${insight.action}`).join('\n\n')}`;
  }

  // Check for specific member queries
  if (lowerQuery.includes('who') || lowerQuery.includes('member') || lowerQuery.includes('person')) {
    if (lowerQuery.includes('best') || lowerQuery.includes('top') || lowerQuery.includes('highest')) {
      const topPerformer = analyticsData.rawData[0]; // Already sorted by rank
      return `**Top Performer:** ${topPerformer.name} 🏆\n\n**Overall Metrics:**\n- TQS Score: ${topPerformer.tqs.toFixed(2)} (Rank #${topPerformer.performance.rank})\n- Trend: ${topPerformer.performance.trend === 'improving' ? '📈' : topPerformer.performance.trend === 'declining' ? '📉' : '➡️'} ${topPerformer.performance.trend}\n\n**TQS Breakdown:**\n- Alignment: ${(topPerformer.scores.alignment * 100).toFixed(1)}%\n- Efficiency: ${(topPerformer.scores.efficiency * 100).toFixed(1)}%\n- Completion: ${(topPerformer.scores.completion * 100).toFixed(1)}%\n- Compliance: ${(topPerformer.scores.compliance * 100).toFixed(1)}%\n\n**Performance Stats:**\n- Revenue: ₹${topPerformer.metrics.totalRevenue.toLocaleString()}\n- Deals Closed: ${topPerformer.metrics.totalDeals}\n- Conversion Rate: ${topPerformer.metrics.conversionRate.toFixed(1)}%\n- Active Leads: ${topPerformer.metrics.activeLeads}\n- Attendance: ${topPerformer.metrics.attendanceRate.toFixed(1)}%\n\n✨ **${topPerformer.name} is excelling across all metrics and should be recognized!**`;
    }
    
    if (lowerQuery.includes('worst') || lowerQuery.includes('lowest') || lowerQuery.includes('struggling')) {
      const lowestPerformer = analyticsData.rawData[analyticsData.rawData.length - 1];
      return `**Needs Immediate Attention:** ${lowestPerformer.name} ⚠️\n\n**Overall Metrics:**\n- TQS Score: ${lowestPerformer.tqs.toFixed(2)} (Rank #${lowestPerformer.performance.rank})\n- Trend: ${lowestPerformer.performance.trend === 'improving' ? '📈' : lowestPerformer.performance.trend === 'declining' ? '📉' : '➡️'} ${lowestPerformer.performance.trend}\n\n**Critical Areas:**\n- Alignment: ${(lowestPerformer.scores.alignment * 100).toFixed(1)}%\n- Efficiency: ${(lowestPerformer.scores.efficiency * 100).toFixed(1)}%\n- Completion: ${(lowestPerformer.scores.completion * 100).toFixed(1)}%\n- Compliance: ${(lowestPerformer.scores.compliance * 100).toFixed(1)}%\n\n**Performance Stats:**\n- Revenue: ₹${lowestPerformer.metrics.totalRevenue.toLocaleString()}\n- Deals Closed: ${lowestPerformer.metrics.totalDeals}\n- Conversion Rate: ${lowestPerformer.metrics.conversionRate.toFixed(1)}%\n- Active Leads: ${lowestPerformer.metrics.activeLeads}\n- Attendance: ${lowestPerformer.metrics.attendanceRate.toFixed(1)}%\n\n**🚨 Recommended Actions:**\n1. Schedule emergency 1-on-1 meeting TODAY\n2. Review workload and identify blockers\n3. Provide immediate support and resources\n4. Set clear 7-day improvement goals\n5. Daily check-ins until performance stabilizes`;
    }
  }

  // Check for metric-specific queries
  if (lowerQuery.includes('efficiency')) {
    const avgEfficiency = analyticsData.metrics.avgEfficiency;
    const lowEfficiency = analyticsData.rawData.filter(m => m.scores.efficiency < 0.7);
    return `**Efficiency Analysis:**\n\n**Team Average:** ${(avgEfficiency * 100).toFixed(1)}%\n\n**Members Below Threshold (<70%):** ${lowEfficiency.length}\n\n${lowEfficiency.length > 0 ? `**Affected Members:**\n${lowEfficiency.map(m => `- ${m.name}: ${(m.scores.efficiency * 100).toFixed(1)}% | Avg Deal: ₹${Math.round(m.metrics.avgDealValue).toLocaleString()}`).join('\n')}\n\n**Recommendations:**\n- Review task estimation processes\n- Identify common blockers or bottlenecks\n- Consider process optimization or automation` : '✅ All team members meeting efficiency standards!'}`;
  }

  if (lowerQuery.includes('completion')) {
    const avgCompletion = analyticsData.metrics.avgCompletion;
    const lowCompletion = analyticsData.rawData.filter(m => m.scores.completion < 0.7);
    return `**Completion Rate Analysis:**\n\n**Team Average:** ${(avgCompletion * 100).toFixed(1)}%\n\n**Members Below Threshold (<70%):** ${lowCompletion.length}\n\n${lowCompletion.length > 0 ? `**Affected Members:**\n${lowCompletion.map(m => `- ${m.name}: ${(m.scores.completion * 100).toFixed(1)}% | Won/Total: ${m.metrics.wonLeads}/${m.metrics.totalLeads}`).join('\n')}\n\n**Action Items:**\n- Review task complexity and deadlines\n- Provide support for pending items\n- Consider workload rebalancing` : '✅ Team maintaining strong completion rates!'}`;
  }

  if (lowerQuery.includes('compliance')) {
    const nonCompliant = analyticsData.rawData.filter(m => m.scores.compliance < 1);
    return `**Compliance Status:**\n\n**Fully Compliant Members:** ${analyticsData.rawData.length - nonCompliant.length}\n**Non-Compliant Members:** ${nonCompliant.length}\n\n${nonCompliant.length > 0 ? `⚠️ **Compliance Issues Detected:**\n${nonCompliant.map(m => `- ${m.name}: Compliance ${(m.scores.compliance * 100).toFixed(1)}% | Attendance: ${m.metrics.attendanceRate.toFixed(1)}%`).join('\n')}\n\n**Critical:** Compliance violations require immediate attention. Review attendance, process adherence, and policy violations.` : '✅ Perfect compliance across the team!'}`;
  }

  // Category-specific queries
  if (lowerQuery.includes('good') || lowerQuery.includes('excellent')) {
    const count = analyticsData.voiceCategories.goingGood.length;
    return `**"Going Good" Category:**\n\n**Total Members:** ${count}\n\n${count > 0 ? `**High Performers:**\n${analyticsData.voiceCategories.goingGood.slice(0, 5).map(m => `- ${m.name} (TQS: ${m.tqs.toFixed(2)}) | ₹${m.metrics.totalRevenue.toLocaleString()} revenue`).join('\n')}\n\nThese team members are consistently delivering high-quality work and meeting/exceeding expectations!` : 'No members currently in the "Going Good" category. Consider reviewing team support and resources.'}`;
  }

  if (lowerQuery.includes('improvement') || lowerQuery.includes('improve')) {
    const members = analyticsData.voiceCategories.needsImprovement;
    return `**"Needs Improvement" Category:**\n\n**Total Members:** ${members.length}\n\n${members.length > 0 ? `**Members Requiring Support:**\n${members.slice(0, 5).map(m => `- ${m.name} (TQS: ${m.tqs.toFixed(2)})\n  Revenue: ₹${m.metrics.totalRevenue.toLocaleString()} | Conversion: ${m.metrics.conversionRate.toFixed(1)}%\n  Primary Issues: ${m.triggers.join(', ')}`).join('\n\n')}\n\n**Action Plan:**\n1. Schedule coaching sessions\n2. Review and adjust targets\n3. Identify skill gaps or resource needs\n4. Set 30-day improvement goals` : '✅ No members in "Needs Improvement" category!'}`;
  }

  if (lowerQuery.includes('bad') || lowerQuery.includes('critical') || lowerQuery.includes('terribly')) {
    const members = analyticsData.voiceCategories.terriblyBad;
    return `🚨 **"Terribly Bad" Category - CRITICAL ALERT:**\n\n**Total Members:** ${members.length}\n\n${members.length > 0 ? `**Immediate Intervention Required:**\n${members.map(m => `- **${m.name}** (TQS: ${m.tqs.toFixed(2)})\n  Revenue: ₹${m.metrics.totalRevenue.toLocaleString()} | Deals: ${m.metrics.totalDeals}\n  Critical Issues: ${m.triggers.join(', ')}\n  Status: Requires immediate management attention`).join('\n\n')}\n\n**URGENT ACTION REQUIRED:**\n1. ⚠️ Schedule emergency 1-on-1 meetings TODAY\n2. ⚠️ Assess workload and remove non-critical tasks\n3. ⚠️ Identify and resolve blockers immediately\n4. ⚠️ Daily check-ins until performance improves\n5. ⚠️ Consider performance improvement plan if no progress` : '✅ No critical performance issues detected!'}`;
  }

  if (lowerQuery.includes('attention')) {
    const members = analyticsData.voiceCategories.needsAttention;
    return `**"Needs Attention" (Low Priority) Category:**\n\n**Total Members:** ${members.length}\n\n${members.length > 0 ? `**Monitor These Members:**\n${members.slice(0, 5).map(m => `- ${m.name} (TQS: ${m.tqs.toFixed(2)}) | Trend: ${m.performance.trend}\n  Watch For: ${m.triggers.join(', ')}`).join('\n\n')}\n\nThese members are performing adequately but show early warning signs that should be monitored.` : 'No members requiring monitoring at this time.'}`;
  }

  // Team overview
  if (lowerQuery.includes('overview') || lowerQuery.includes('summary') || lowerQuery.includes('status')) {
    return `**Team Performance Overview:**\n\n**Total Team Size:** ${analyticsData.overview.totalMembers}\n**Average TQS:** ${analyticsData.overview.averageTQS.toFixed(2)}\n**Service Type:** ${serviceType === 'service-onboarding' ? 'Service Onboarding' : 'Service Delivery'}\n\n**VOICE Distribution:**\n- 🟢 Going Good: ${analyticsData.voiceCategories.goingGood.length} (${((analyticsData.voiceCategories.goingGood.length / analyticsData.overview.totalMembers) * 100).toFixed(1)}%)\n- 🟡 Needs Improvement: ${analyticsData.voiceCategories.needsImprovement.length} (${((analyticsData.voiceCategories.needsImprovement.length / analyticsData.overview.totalMembers) * 100).toFixed(1)}%)\n- 🔴 Terribly Bad: ${analyticsData.voiceCategories.terriblyBad.length} (${((analyticsData.voiceCategories.terriblyBad.length / analyticsData.overview.totalMembers) * 100).toFixed(1)}%)\n- 🔵 Needs Attention: ${analyticsData.voiceCategories.needsAttention.length} (${((analyticsData.voiceCategories.needsAttention.length / analyticsData.overview.totalMembers) * 100).toFixed(1)}%)\n\n**Key Metrics:**\n- Alignment: ${(analyticsData.metrics.avgAlignment * 100).toFixed(1)}%\n- Efficiency: ${(analyticsData.metrics.avgEfficiency * 100).toFixed(1)}%\n- Completion: ${(analyticsData.metrics.avgCompletion * 100).toFixed(1)}%\n- Compliance: ${(analyticsData.metrics.avgCompliance * 100).toFixed(1)}%\n\n**Business Metrics:**\n- Total Revenue: ₹${analyticsData.teamStats.totalRevenue.toLocaleString()}\n- Conversion Rate: ${analyticsData.teamStats.conversionRate.toFixed(1)}%\n- Active Pipeline: ${analyticsData.teamStats.activeLeads} leads`;
  }

  // Default response
  return `I can help you analyze team performance data! Here are some things you can ask me:\n\n**People:**\n- "Who is the top performer?"\n- "Who needs help?"\n- "Show me struggling members"\n\n**Metrics:**\n- "What's the revenue status?"\n- "Show conversion rates"\n- "Pipeline status"\n- "Target progress"\n- "Attendance overview"\n\n**Categories:**\n- "Who is in Going Good?"\n- "Show members needing improvement"\n- "Any critical cases?"\n- "Who needs attention?"\n\n**Analysis:**\n- "Performance trends"\n- "Activity metrics"\n- "Give me insights"\n- "Team overview"\n\nWhat would you like to know?`;
}

module.exports = analyticsController;
