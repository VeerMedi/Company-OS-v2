const RevenueTarget = require('../models/RevenueTarget');
const User = require('../models/User');

class RevenueTargetService {
  /**
   * Create revenue target set by Co-Founder for HOS
   */
  static async createRevenueTarget(targetData, setBy) {
    // Verify setBy is a co-founder
    const coFounder = await User.findById(setBy);
    if (!coFounder || coFounder.role !== 'co-founder') {
      throw new Error('Only Co-Founders can set revenue targets');
    }

    // Verify assignedTo is HOS
    const hos = await User.findById(targetData.assignedTo);
    if (!hos || hos.role !== 'head-of-sales') {
      throw new Error('Revenue target must be assigned to Head of Sales');
    }

    const target = new RevenueTarget({
      setBy,
      assignedTo: targetData.assignedTo,
      targetPeriod: targetData.targetPeriod,
      startDate: targetData.startDate,
      endDate: targetData.endDate,
      targetAmount: targetData.targetAmount,
      currency: targetData.currency || 'INR',
      notes: targetData.notes,
      status: 'pending'
    });

    // Add activity
    target.activities.push({
      action: 'created',
      description: `Revenue target created for ${targetData.targetPeriod}`,
      performedBy: setBy,
      timestamp: new Date()
    });

    await target.save();
    return target;
  }

  /**
   * HOS responds to revenue target
   */
  static async hosRespondToTarget(targetId, hosId, response) {
    const target = await RevenueTarget.findById(targetId);
    if (!target) {
      throw new Error('Revenue target not found');
    }

    if (target.assignedTo.toString() !== hosId.toString()) {
      throw new Error('Only assigned HOS can respond to this target');
    }

    target.hosResponse = {
      status: response.status, // 'accepted', 'negotiating', 'rejected'
      message: response.message,
      respondedAt: new Date()
    };

    // Update target status based on response
    if (response.status === 'accepted') {
      target.status = 'approved';
    }

    // Add activity
    target.activities.push({
      action: 'hos_response',
      description: `HOS ${response.status} the target`,
      performedBy: hosId,
      timestamp: new Date()
    });

    await target.save();
    return target;
  }

  /**
   * HOS proposes strategy for achieving target
   */
  static async proposeStrategy(targetId, hosId, strategyData) {
    const target = await RevenueTarget.findById(targetId);
    if (!target) {
      throw new Error('Revenue target not found');
    }

    if (target.assignedTo.toString() !== hosId.toString()) {
      throw new Error('Only assigned HOS can propose strategy');
    }

    target.strategy = {
      targetLocations: strategyData.targetLocations || [],
      expectedCompanies: strategyData.expectedCompanies,
      expectedLeads: strategyData.expectedLeads,
      proposedAt: new Date(),
      approvedByCoFounder: false
    };

    // Add activity
    target.activities.push({
      action: 'strategy_proposed',
      description: 'HOS proposed strategy for achieving target',
      performedBy: hosId,
      timestamp: new Date()
    });

    await target.save();
    return target;
  }

  /**
   * Co-Founder approves or rejects strategy
   */
  static async reviewStrategy(targetId, coFounderId, approved, feedback) {
    const target = await RevenueTarget.findById(targetId);
    if (!target) {
      throw new Error('Revenue target not found');
    }

    const coFounder = await User.findById(coFounderId);
    if (!coFounder || coFounder.role !== 'co-founder') {
      throw new Error('Only Co-Founders can review strategies');
    }

    if (!target.strategy || !target.strategy.proposedAt) {
      throw new Error('No strategy has been proposed yet');
    }

    target.strategy.approvedByCoFounder = approved;
    target.strategy.coFounderFeedback = feedback;

    if (approved) {
      target.status = 'in-progress';
    }

    // Add activity
    target.activities.push({
      action: approved ? 'strategy_approved' : 'strategy_rejected',
      description: approved 
        ? 'Co-Founder approved the strategy' 
        : 'Co-Founder requested strategy revision',
      performedBy: coFounderId,
      timestamp: new Date()
    });

    await target.save();
    return target;
  }

  /**
   * Update achieved amount (called when deals close)
   */
  static async updateAchievedAmount(targetId, amount) {
    const target = await RevenueTarget.findById(targetId);
    if (!target) {
      throw new Error('Revenue target not found');
    }

    target.achievedAmount += amount;
    
    // Add activity
    target.activities.push({
      action: 'progress_updated',
      description: `Achieved amount increased by ${amount}`,
      timestamp: new Date()
    });

    await target.save();
    return target;
  }

  /**
   * Get revenue targets for HOS
   */
  static async getTargetsForHOS(hosId, filters = {}) {
    const query = {
      assignedTo: hosId,
      ...filters
    };

    const targets = await RevenueTarget.find(query)
      .populate('setBy', 'firstName lastName email')
      .populate('assignedTo', 'firstName lastName email')
      .populate('strategy.targetLocations.assignedReps', 'firstName lastName')
      .sort({ startDate: -1 });

    return targets;
  }

  /**
   * Get revenue targets set by Co-Founder
   */
  static async getTargetsByCoFounder(coFounderId, filters = {}) {
    const query = {
      setBy: coFounderId,
      ...filters
    };

    const targets = await RevenueTarget.find(query)
      .populate('setBy', 'firstName lastName email')
      .populate('assignedTo', 'firstName lastName email')
      .sort({ startDate: -1 });

    return targets;
  }

  /**
   * Calculate period dates
   */
  static calculatePeriodDates(period, startDate = null) {
    const start = startDate ? new Date(startDate) : new Date();
    const end = new Date(start);

    switch (period) {
      case 'monthly':
        end.setMonth(end.getMonth() + 1);
        break;
      case 'quarterly':
        end.setMonth(end.getMonth() + 3);
        break;
      case 'half-yearly':
        end.setMonth(end.getMonth() + 6);
        break;
      case 'yearly':
        end.setFullYear(end.getFullYear() + 1);
        break;
      default:
        end.setMonth(end.getMonth() + 1);
    }

    return { startDate: start, endDate: end };
  }
}

module.exports = RevenueTargetService;
