const User = require('../models/User');
const Attendance = require('../models/Attendance');
const { Leave } = require('../models/Leave');
const Payroll = require('../models/Payroll');
const incentiveCalculator = require('./IncentiveCalculator');

class AutomatedPayrollService {
  /**
   * Calculate automated payroll for an employee
   * @param {String} employeeId - Employee ID
   * @param {Date} salaryMonth - Salary month
   * @param {Number} basicSalary - Basic salary amount
   * @param {Object} allowances - Allowances object
   * @param {Object} deductions - Deductions object
   * @param {Number} bonusAmount - Bonus amount (optional)
   * @returns {Object} - Calculated payroll data
   */
  static async calculateAutomatedPayroll(employeeId, salaryMonth, basicSalary, allowances = {}, deductions = {}, bonusAmount = 0) {
    try {
      // Get employee details with bank information
      const employee = await User.findById(employeeId).select('+bankDetails');
      if (!employee) {
        throw new Error('Employee not found');
      }

      // Calculate working days for the month
      const workingDaysData = await this.calculateWorkingDays(employeeId, salaryMonth);
      
      // Calculate attendance-based salary adjustments
      const attendanceAdjustment = this.calculateAttendanceAdjustment(
        workingDaysData.present, 
        workingDaysData.total, 
        basicSalary
      );

      // Calculate overtime if any
      const overtimeData = await this.calculateOvertime(employeeId, salaryMonth);

      // Calculate performance-based incentive
      let incentiveData = {
        tier: null,
        tierEmoji: null,
        productivityScore: 0,
        totalPoints: 0,
        incentiveAmount: 0,
        criteriaUsed: 'none',
        matchedBy: '',
        calculatedAt: null
      };

      try {
        const incentiveResult = await incentiveCalculator.calculateMonthlyIncentive(
          employeeId,
          salaryMonth.toISOString().slice(0, 7), // YYYY-MM format
          basicSalary
        );
        
        if (incentiveResult && incentiveResult.tier) {
          incentiveData = incentiveResult;
          // Add incentive to performance allowance
          allowances.performance = (allowances.performance || 0) + incentiveResult.incentiveAmount;
        }
      } catch (incentiveError) {
        console.warn('Could not calculate incentive:', incentiveError.message);
        // Continue without incentive if calculation fails
      }

      // Calculate final amounts
      const calculatedAllowances = this.calculateAllowances(basicSalary, allowances);
      const calculatedDeductions = this.calculateDeductions(basicSalary, deductions);

      // Calculate gross salary
      const grossSalary = attendanceAdjustment.adjustedBasicSalary + 
                         calculatedAllowances.total + 
                         bonusAmount + 
                         overtimeData.amount;

      // Calculate net salary
      const netSalary = grossSalary - calculatedDeductions.total;

      // Get bank details from employee profile
      const bankDetails = {
        bankName: employee.bankDetails?.bankName || '',
        accountNumber: employee.bankDetails?.accountNumber || '',
        ifscCode: employee.bankDetails?.ifscCode || '',
        accountHolderName: employee.bankDetails?.accountHolderName || employee.fullName
      };

      // Create detailed breakdown
      const breakdown = {
        employee: {
          id: employee._id,
          name: employee.fullName,
          employeeId: employee.employeeId,
          email: employee.email
        },
        salaryCalculation: {
          basicSalary: {
            original: basicSalary,
            adjusted: attendanceAdjustment.adjustedBasicSalary,
            reason: attendanceAdjustment.reason
          },
          allowances: calculatedAllowances,
          deductions: calculatedDeductions,
          bonus: bonusAmount,
          overtime: overtimeData,
          incentive: incentiveData,
          grossSalary: grossSalary,
          netSalary: netSalary
        },
        attendance: {
          workingDays: workingDaysData,
          attendancePercentage: ((workingDaysData.present / workingDaysData.total) * 100).toFixed(2)
        },
        bankDetails: bankDetails
      };

      return {
        success: true,
        data: {
          employeeId: employee._id,
          employeeCode: employee.employeeId,
          salaryMonth: new Date(salaryMonth),
          basicSalary: attendanceAdjustment.adjustedBasicSalary,
          allowances: calculatedAllowances.breakdown,
          deductions: calculatedDeductions.breakdown,
          bonus: bonusAmount,
          overtime: {
            hours: overtimeData.hours,
            rate: overtimeData.rate,
            amount: overtimeData.amount
          },
          workingDays: workingDaysData,
          grossSalary: grossSalary,
          totalDeductions: calculatedDeductions.total,
          netSalary: netSalary,
          bankDetails: bankDetails,
          paymentMethod: 'bank-transfer',
          incentiveDetails: incentiveData
        },
        breakdown: breakdown
      };

    } catch (error) {
      console.error('Error in automated payroll calculation:', error);
      return {
        success: false,
        message: error.message,
        error: error
      };
    }
  }

  /**
   * Calculate working days, attendance, and leave for a specific month
   */
  static async calculateWorkingDays(employeeId, salaryMonth) {
    const startDate = new Date(salaryMonth.getFullYear(), salaryMonth.getMonth(), 1);
    const endDate = new Date(salaryMonth.getFullYear(), salaryMonth.getMonth() + 1, 0);
    
    // Get total working days in month (excluding weekends)
    const totalWorkingDays = this.getWorkingDaysInMonth(startDate, endDate);
    
    // Get attendance records for the month
    const attendanceRecords = await Attendance.find({
      employeeId: employeeId,
      date: {
        $gte: startDate,
        $lte: endDate
      }
    });

    // Get approved leave records for the month
    const leaveRecords = await Leave.find({
      employee: employeeId,
      status: { $in: ['approved', 'hr_approved'] },
      $or: [
        {
          startDate: { $gte: startDate, $lte: endDate }
        },
        {
          endDate: { $gte: startDate, $lte: endDate }
        },
        {
          startDate: { $lte: startDate },
          endDate: { $gte: endDate }
        }
      ]
    });

    // Calculate leave days in this month
    let totalLeaveDays = 0;
    leaveRecords.forEach(leave => {
      const leaveStart = new Date(Math.max(leave.startDate, startDate));
      const leaveEnd = new Date(Math.min(leave.endDate, endDate));
      
      // Count only working days in leave period
      totalLeaveDays += this.getWorkingDaysInMonth(leaveStart, leaveEnd);
    });

    // Calculate present days from attendance
    const presentDays = attendanceRecords.filter(record => 
      ['present', 'partial', 'late', 'early-departure'].includes(record.status)
    ).length;

    // Calculate absent days
    const absentDays = Math.max(0, totalWorkingDays - presentDays - totalLeaveDays);

    return {
      total: totalWorkingDays,
      present: presentDays,
      absent: absentDays,
      leave: totalLeaveDays
    };
  }

  /**
   * Calculate working days in a date range (excluding weekends)
   */
  static getWorkingDaysInMonth(startDate, endDate) {
    let workingDays = 0;
    const currentDate = new Date(startDate);

    while (currentDate <= endDate) {
      const dayOfWeek = currentDate.getDay();
      // Exclude weekends (0 = Sunday, 6 = Saturday)
      if (dayOfWeek !== 0 && dayOfWeek !== 6) {
        workingDays++;
      }
      currentDate.setDate(currentDate.getDate() + 1);
    }

    return workingDays;
  }

  /**
   * Calculate attendance-based salary adjustment
   */
  static calculateAttendanceAdjustment(presentDays, totalDays, basicSalary) {
    if (presentDays >= totalDays) {
      return {
        adjustedBasicSalary: basicSalary,
        reason: 'Full attendance'
      };
    }

    const attendanceRatio = presentDays / totalDays;
    const adjustedSalary = Math.round(basicSalary * attendanceRatio);

    return {
      adjustedBasicSalary: adjustedSalary,
      reason: `Adjusted for ${presentDays}/${totalDays} working days (${(attendanceRatio * 100).toFixed(1)}% attendance)`
    };
  }

  /**
   * Calculate overtime for the month
   */
  static async calculateOvertime(employeeId, salaryMonth) {
    const startDate = new Date(salaryMonth.getFullYear(), salaryMonth.getMonth(), 1);
    const endDate = new Date(salaryMonth.getFullYear(), salaryMonth.getMonth() + 1, 0);

    const attendanceRecords = await Attendance.find({
      employeeId: employeeId,
      date: {
        $gte: startDate,
        $lte: endDate
      },
      'overtime.approved': true
    });

    const totalOvertimeMinutes = attendanceRecords.reduce((total, record) => {
      return total + (record.overtime?.hours || 0);
    }, 0);

    const overtimeHours = Math.round((totalOvertimeMinutes / 60) * 100) / 100; // Round to 2 decimal places
    const overtimeRate = 200; // ₹200 per hour - can be made configurable
    const overtimeAmount = Math.round(overtimeHours * overtimeRate);

    return {
      hours: overtimeHours,
      rate: overtimeRate,
      amount: overtimeAmount
    };
  }

  /**
   * Calculate allowances with percentage-based calculations
   */
  static calculateAllowances(basicSalary, allowances) {
    const calculated = {
      hra: allowances.hra || Math.round(basicSalary * 0.30), // 30% of basic salary
      transport: allowances.transport || 2000, // Fixed transport allowance
      medical: allowances.medical || 1500, // Fixed medical allowance
      performance: allowances.performance || 0, // Performance-based
      other: allowances.other || 0 // Other allowances
    };

    const total = Object.values(calculated).reduce((sum, amount) => sum + amount, 0);

    return {
      breakdown: calculated,
      total: total
    };
  }

  /**
   * Calculate deductions including tax, PF, etc.
   */
  static calculateDeductions(basicSalary, deductions) {
    const calculated = {
      tax: deductions.tax || this.calculateTax(basicSalary), // Auto calculate tax
      providentFund: deductions.providentFund || Math.round(basicSalary * 0.12), // 12% PF
      insurance: deductions.insurance || 500, // Fixed insurance
      loan: deductions.loan || 0, // Loan deduction
      other: deductions.other || 0 // Other deductions
    };

    const total = Object.values(calculated).reduce((sum, amount) => sum + amount, 0);

    return {
      breakdown: calculated,
      total: total
    };
  }

  /**
   * Simple tax calculation (can be enhanced based on tax slabs)
   */
  static calculateTax(basicSalary) {
    const annualSalary = basicSalary * 12;
    
    if (annualSalary <= 250000) {
      return 0; // No tax for income up to 2.5 lakhs
    } else if (annualSalary <= 500000) {
      return Math.round((annualSalary - 250000) * 0.05 / 12); // 5% tax
    } else if (annualSalary <= 1000000) {
      return Math.round((12500 + (annualSalary - 500000) * 0.20) / 12); // 20% tax
    } else {
      return Math.round((112500 + (annualSalary - 1000000) * 0.30) / 12); // 30% tax
    }
  }

  /**
   * Get employee bank details for payroll
   */
  static async getEmployeeBankDetails(employeeId) {
    try {
      const employee = await User.findById(employeeId)
        .select('firstName lastName employeeId email bankDetails');
      
      if (!employee) {
        throw new Error('Employee not found');
      }

      return {
        success: true,
        data: {
          employee: {
            id: employee._id,
            name: `${employee.firstName} ${employee.lastName}`,
            employeeId: employee.employeeId,
            email: employee.email
          },
          bankDetails: {
            bankName: employee.bankDetails?.bankName || '',
            accountNumber: employee.bankDetails?.accountNumber || '',
            ifscCode: employee.bankDetails?.ifscCode || '',
            accountHolderName: employee.bankDetails?.accountHolderName || `${employee.firstName} ${employee.lastName}`
          }
        }
      };
    } catch (error) {
      return {
        success: false,
        message: error.message
      };
    }
  }

  /**
   * Generate payroll for multiple employees
   */
  static async generateBulkPayroll(employeeIds, salaryMonth, defaultSalaryData, createdBy) {
    const results = [];

    for (const employeeId of employeeIds) {
      try {
        const employee = await User.findById(employeeId);
        if (!employee) {
          results.push({
            employeeId,
            success: false,
            message: 'Employee not found'
          });
          continue;
        }

        // Use employee's salary template or default data
        const salaryData = employee.salaryTemplate || defaultSalaryData;
        
        const calculationResult = await this.calculateAutomatedPayroll(
          employeeId,
          new Date(salaryMonth),
          salaryData.basicSalary,
          salaryData.allowances,
          salaryData.deductions,
          salaryData.bonus || 0
        );

        if (calculationResult.success) {
          // Create payroll record
          const payrollData = {
            ...calculationResult.data,
            createdBy: createdBy
          };

          const payroll = new Payroll(payrollData);
          await payroll.save();

          results.push({
            employeeId,
            success: true,
            data: payroll,
            breakdown: calculationResult.breakdown
          });
        } else {
          results.push({
            employeeId,
            success: false,
            message: calculationResult.message
          });
        }
      } catch (error) {
        results.push({
          employeeId,
          success: false,
          message: error.message
        });
      }
    }

    return results;
  }
}

module.exports = AutomatedPayrollService;