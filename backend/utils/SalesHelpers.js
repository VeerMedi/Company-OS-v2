const User = require('../models/User');

/**
 * Helper utilities for sales role verification and permissions
 */
class SalesHelpers {
  /**
   * Check if user is Co-Founder
   */
  static async isCoFounder(userId) {
    const user = await User.findById(userId);
    return user && user.role === 'co-founder';
  }

  /**
   * Check if user is Head of Sales
   */
  static async isHeadOfSales(userId) {
    const user = await User.findById(userId);
    return user && user.role === 'head-of-sales';
  }

  /**
   * Check if user is in sales role (HOS or Sales Team)
   */
  static async isSalesRole(userId) {
    const user = await User.findById(userId);
    return user && ['head-of-sales', 'individual'].includes(user.role);
  }

  /**
   * Get all Head of Sales users
   */
  static async getAllHOS() {
    return await User.find({ role: 'head-of-sales' })
      .select('firstName lastName email');
  }

  /**
   * Get all sales team members (individuals in sales)
   */
  static async getSalesTeamMembers() {
    return await User.find({ 
      role: 'individual',
      // Can add additional filter if sales team has specific department
    }).select('firstName lastName email');
  }

  /**
   * Get all Co-Founders
   */
  static async getAllCoFounders() {
    return await User.find({ role: 'co-founder' })
      .select('firstName lastName email');
  }

  /**
   * Verify user can set revenue targets (Co-Founder only)
   */
  static async canSetRevenueTarget(userId) {
    return await this.isCoFounder(userId);
  }

  /**
   * Verify user can approve companies (HOS only)
   */
  static async canApproveCompanies(userId) {
    return await this.isHeadOfSales(userId);
  }

  /**
   * Verify user can manage leads
   */
  static async canManageLeads(userId) {
    return await this.isSalesRole(userId);
  }

  /**
   * Format currency
   */
  static formatCurrency(amount, currency = 'INR') {
    const formatter = new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: currency,
      minimumFractionDigits: 0,
      maximumFractionDigits: 0
    });
    return formatter.format(amount);
  }

  /**
   * Calculate conversion rate
   */
  static calculateConversionRate(converted, total) {
    if (total === 0) return 0;
    return Math.round((converted / total) * 100);
  }

  /**
   * Get stage color for UI
   */
  static getStageColor(stage) {
    const colors = {
      'lead': '#9CA3AF',
      'qualified': '#3B82F6',
      'proposal': '#F59E0B',
      'negotiation': '#8B5CF6',
      'closedWon': '#10B981',
      'closedLost': '#EF4444'
    };
    return colors[stage] || '#6B7280';
  }

  /**
   * Get stage label
   */
  static getStageLabel(stage) {
    const labels = {
      'lead': 'Lead',
      'qualified': 'Qualified',
      'proposal': 'Proposal',
      'negotiation': 'Negotiation',
      'closedWon': 'Closed Won',
      'closedLost': 'Closed Lost'
    };
    return labels[stage] || stage;
  }

  /**
   * Calculate days until deadline
   */
  static daysUntilDeadline(deadline) {
    const today = new Date();
    const deadlineDate = new Date(deadline);
    const diffTime = deadlineDate - today;
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    return diffDays;
  }

  /**
   * Check if deadline is approaching (within 3 days)
   */
  static isDeadlineApproaching(deadline) {
    const days = this.daysUntilDeadline(deadline);
    return days >= 0 && days <= 3;
  }

  /**
   * Check if deadline has passed
   */
  static isOverdue(deadline) {
    return this.daysUntilDeadline(deadline) < 0;
  }

  /**
   * Get priority level number for sorting
   */
  static getPriorityLevel(priority) {
    const levels = {
      'urgent': 4,
      'high': 3,
      'medium': 2,
      'low': 1
    };
    return levels[priority] || 0;
  }

  /**
   * Validate email format
   */
  static isValidEmail(email) {
    const emailRegex = /^\w+([.-]?\w+)*@\w+([.-]?\w+)*(\.\w{2,3})+$/;
    return emailRegex.test(email);
  }

  /**
   * Validate URL format
   */
  static isValidURL(url) {
    try {
      new URL(url);
      return true;
    } catch (error) {
      return false;
    }
  }

  /**
   * Generate activity description
   */
  static generateActivityDescription(action, details = {}) {
    const descriptions = {
      'created': `Created by ${details.userName || 'system'}`,
      'updated': `Updated by ${details.userName || 'user'}`,
      'approved': `Approved by ${details.userName || 'HOS'}`,
      'rejected': `Rejected by ${details.userName || 'HOS'}`,
      'stage_changed': `Stage changed from ${details.from} to ${details.to}`,
      'assigned': `Assigned to ${details.assigneeName || 'team member'}`,
      'completed': `Completed by ${details.userName || 'user'}`
    };
    return descriptions[action] || action;
  }

  /**
   * Calculate expected revenue (potential value × probability)
   */
  static calculateExpectedRevenue(potentialValue, probability) {
    return Math.round((potentialValue * probability) / 100);
  }

  /**
   * Get date range for period
   */
  static getDateRangeForPeriod(period) {
    const today = new Date();
    const startDate = new Date(today);
    const endDate = new Date(today);

    switch (period) {
      case 'this-week':
        startDate.setDate(today.getDate() - today.getDay());
        endDate.setDate(startDate.getDate() + 6);
        break;
      case 'this-month':
        startDate.setDate(1);
        endDate.setMonth(endDate.getMonth() + 1, 0);
        break;
      case 'this-quarter':
        const quarter = Math.floor(today.getMonth() / 3);
        startDate.setMonth(quarter * 3, 1);
        endDate.setMonth(quarter * 3 + 3, 0);
        break;
      case 'this-year':
        startDate.setMonth(0, 1);
        endDate.setMonth(11, 31);
        break;
      default:
        return { startDate: today, endDate: today };
    }

    return { startDate, endDate };
  }

  /**
   * Format date range for display
   */
  static formatDateRange(startDate, endDate) {
    const options = { year: 'numeric', month: 'short', day: 'numeric' };
    return `${startDate.toLocaleDateString('en-US', options)} - ${endDate.toLocaleDateString('en-US', options)}`;
  }
}

module.exports = SalesHelpers;
