const IncentiveMatrix = require('../models/IncentiveMatrix');
const DeveloperPerformance = require('../models/DeveloperPerformance');

/**
 * IncentiveCalculator Service
 * Calculates performance-based incentives for employees based on productivity score and total points
 */
class IncentiveCalculator {
  /**
   * Calculate incentive for an employee for a specific month
   * @param {String} employeeId - Employee ID
   * @param {String} salaryMonth - Salary month in YYYY-MM format
   * @param {Number} basicSalary - Basic salary (default 10000)
   * @returns {Object} Incentive details
   */
  async calculateMonthlyIncentive(employeeId, salaryMonth, basicSalary = 10000) {
    try {
      // Fetch employee's performance data for the month
      const performance = await DeveloperPerformance.findOne({ developer: employeeId });
      
      if (!performance) {
        return {
          tier: null,
          productivityScore: 0,
          totalPoints: 0,
          incentiveAmount: 0,
          message: 'No performance data found for this employee'
        };
      }
      
      // Get productivity score and points from monthly stats
      const productivityScore = performance.metrics.productivityScore || 0;
      const totalPoints = performance.monthlyStats.pointsEarned || 0;
      
      // Find matching tier
      const matchingTier = await IncentiveMatrix.findMatchingTier(productivityScore, totalPoints);
      
      if (!matchingTier) {
        return {
          tier: null,
          productivityScore: Math.round(productivityScore),
          totalPoints,
          incentiveAmount: 0,
          message: 'No incentive tier matched for current performance'
        };
      }
      
      // Calculate incentive amount
      const incentiveAmount = matchingTier.calculateIncentive(basicSalary);
      
      return {
        tier: matchingTier.tier,
        tierEmoji: matchingTier.emoji,
        tierDisplayName: matchingTier.displayName,
        productivityScore: Math.round(productivityScore),
        totalPoints,
        incentiveAmount,
        incentiveType: matchingTier.incentiveType,
        criteriaUsed: this._getCriteriaUsed(productivityScore, totalPoints, matchingTier),
        matchedBy: this._getMatchReason(productivityScore, totalPoints, matchingTier),
        calculatedAt: new Date()
      };
    } catch (error) {
      console.error('Error calculating incentive:', error);
      throw new Error(`Failed to calculate incentive: ${error.message}`);
    }
  }
  
  /**
   * Preview incentive for an employee based on current performance
   * @param {String} employeeId - Employee ID
   * @param {Number} basicSalary - Basic salary
   * @returns {Object} Incentive preview with all tiers
   */
  async previewIncentive(employeeId, basicSalary = 10000) {
    try {
      const performance = await DeveloperPerformance.findOne({ developer: employeeId });
      
      if (!performance) {
        return {
          currentPerformance: {
            productivityScore: 0,
            totalPoints: 0
          },
          currentTier: null,
          allTiers: await IncentiveMatrix.getActiveTiers(),
          message: 'No performance data available'
        };
      }
      
      const productivityScore = performance.metrics.productivityScore || 0;
      const totalPoints = performance.monthlyStats.pointsEarned || 0;
      
      const matchingTier = await IncentiveMatrix.findMatchingTier(productivityScore, totalPoints);
      const allTiers = await IncentiveMatrix.getActiveTiers();
      
      // Calculate how many points/score needed for next tier
      const nextTierInfo = this._getNextTierInfo(productivityScore, totalPoints, allTiers);
      
      return {
        currentPerformance: {
          productivityScore: Math.round(productivityScore),
          totalPoints
        },
        currentTier: matchingTier ? {
          ...matchingTier.toObject(),
          incentiveAmount: matchingTier.calculateIncentive(basicSalary)
        } : null,
        nextTier: nextTierInfo,
        allTiers: allTiers.map(tier => ({
          ...tier.toObject(),
          incentiveAmount: tier.calculateIncentive(basicSalary)
        }))
      };
    } catch (error) {
      console.error('Error previewing incentive:', error);
      throw new Error(`Failed to preview incentive: ${error.message}`);
    }
  }
  
  /**
   * Calculate incentive for multiple employees
   * @param {Array} employeeIds - Array of employee IDs
   * @param {String} salaryMonth - Salary month
   * @param {Number} basicSalary - Basic salary
   * @returns {Array} Array of incentive calculations
   */
  async calculateBulkIncentives(employeeIds, salaryMonth, basicSalary = 10000) {
    const results = [];
    
    for (const employeeId of employeeIds) {
      try {
        const incentive = await this.calculateMonthlyIncentive(employeeId, salaryMonth, basicSalary);
        results.push({
          employeeId,
          success: true,
          ...incentive
        });
      } catch (error) {
        results.push({
          employeeId,
          success: false,
          error: error.message
        });
      }
    }
    
    return results;
  }
  
  /**
   * Get statistics about incentive distribution
   * @param {String} salaryMonth - Salary month
   * @returns {Object} Distribution statistics
   */
  async getIncentiveDistribution(salaryMonth) {
    try {
      // This would typically query actual payroll records
      // For now, we'll return tier distribution from all developers
      const allPerformances = await DeveloperPerformance.find({});
      const tiers = await IncentiveMatrix.getActiveTiers();
      
      const distribution = {
        totalEmployees: allPerformances.length,
        tierDistribution: {},
        totalIncentiveAmount: 0
      };
      
      for (const tier of tiers) {
        distribution.tierDistribution[tier.tier] = {
          count: 0,
          totalAmount: 0,
          emoji: tier.emoji
        };
      }
      
      distribution.tierDistribution['No Tier'] = {
        count: 0,
        totalAmount: 0,
        emoji: '❌'
      };
      
      for (const performance of allPerformances) {
        const score = performance.metrics.productivityScore || 0;
        const points = performance.monthlyStats.pointsEarned || 0;
        
        const matchingTier = await IncentiveMatrix.findMatchingTier(score, points);
        
        if (matchingTier) {
          const amount = matchingTier.calculateIncentive(10000);
          distribution.tierDistribution[matchingTier.tier].count++;
          distribution.tierDistribution[matchingTier.tier].totalAmount += amount;
          distribution.totalIncentiveAmount += amount;
        } else {
          distribution.tierDistribution['No Tier'].count++;
        }
      }
      
      return distribution;
    } catch (error) {
      console.error('Error getting incentive distribution:', error);
      throw new Error(`Failed to get distribution: ${error.message}`);
    }
  }
  
  /**
   * Helper: Determine which criteria was used for matching
   * @private
   */
  _getCriteriaUsed(score, points, tier) {
    const scoreMatch = score >= tier.minProductivityScore && score <= tier.maxProductivityScore;
    const pointsMatch = points >= tier.minPoints && (!tier.maxPoints || points <= tier.maxPoints);
    
    if (scoreMatch && pointsMatch) return 'both';
    if (scoreMatch) return 'score';
    if (pointsMatch) return 'points';
    return 'none';
  }
  
  /**
   * Helper: Get human-readable match reason
   * @private
   */
  _getMatchReason(score, points, tier) {
    const scoreMatch = score >= tier.minProductivityScore && score <= tier.maxProductivityScore;
    const pointsMatch = points >= tier.minPoints && (!tier.maxPoints || points <= tier.maxPoints);
    
    if (scoreMatch && pointsMatch) {
      return `Qualified by both productivity score (${Math.round(score)}%) and total points (${points})`;
    }
    if (scoreMatch) {
      return `Qualified by productivity score (${Math.round(score)}%)`;
    }
    if (pointsMatch) {
      return `Qualified by total points (${points})`;
    }
    return 'Not qualified';
  }
  
  /**
   * Helper: Calculate next tier information
   * @private
   */
  _getNextTierInfo(currentScore, currentPoints, allTiers) {
    // Find all tiers with higher incentive than current
    const sortedTiers = allTiers.sort((a, b) => a.displayOrder - b.displayOrder);
    
    const currentTier = sortedTiers.find(t => 
      (currentScore >= t.minProductivityScore && currentScore <= t.maxProductivityScore) ||
      (currentPoints >= t.minPoints && (!t.maxPoints || currentPoints <= t.maxPoints))
    );
    
    if (!currentTier) {
      // Not in any tier, get the lowest tier
      const lowestTier = sortedTiers[0];
      return {
        tier: lowestTier.tier,
        emoji: lowestTier.emoji,
        scoreNeeded: Math.max(0, lowestTier.minProductivityScore - currentScore),
        pointsNeeded: Math.max(0, lowestTier.minPoints - currentPoints),
        incentiveAmount: lowestTier.incentiveAmount
      };
    }
    
    // Find next higher tier
    const currentIndex = sortedTiers.findIndex(t => t._id.equals(currentTier._id));
    if (currentIndex < sortedTiers.length - 1) {
      const nextTier = sortedTiers[currentIndex + 1];
      return {
        tier: nextTier.tier,
        emoji: nextTier.emoji,
        scoreNeeded: Math.max(0, nextTier.minProductivityScore - currentScore),
        pointsNeeded: Math.max(0, nextTier.minPoints - currentPoints),
        incentiveAmount: nextTier.incentiveAmount
      };
    }
    
    return null; // Already at highest tier
  }
}

module.exports = new IncentiveCalculator();
