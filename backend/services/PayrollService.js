const Payroll = require('../models/Payroll');
const User = require('../models/User');
const Attendance = require('../models/Attendance');

class PayrollService {
  /**
   * Auto-generate payroll records for all eligible employees
   * @param {Date} salaryMonth - The month for which to generate payroll
   * @param {Object} createdBy - The user creating the payroll (system user)
   */
  static async generateMonthlyPayrolls(salaryMonth, createdBy) {
    try {
      // Get all eligible employees (exclude CEO and Co-founder)
      const eligibleEmployees = await User.find({
        role: { $nin: ['ceo', 'co-founder'] },
        isActive: true
      });

      const results = {
        created: [],
        skipped: [],
        errors: []
      };

      for (const employee of eligibleEmployees) {
        try {
          // Check if payroll already exists for this employee and month
          const existingPayroll = await Payroll.findOne({
            employeeId: employee._id,
            salaryMonth: salaryMonth,
            isActive: true
          });

          if (existingPayroll) {
            results.skipped.push({
              employeeId: employee._id,
              employeeName: `${employee.firstName} ${employee.lastName}`,
              reason: 'Payroll already exists'
            });
            continue;
          }

          // Get default salary structure based on role
          const defaultSalary = this.getDefaultSalaryByRole(employee.role);

          // Calculate attendance-based adjustments
          const attendanceData = await this.calculateAttendanceBasedPayroll(
            employee._id, 
            salaryMonth
          );

          // Create payroll record
          const payrollData = {
            employeeId: employee._id,
            employeeCode: employee.employeeId,
            salaryMonth: salaryMonth,
            basicSalary: defaultSalary.basicSalary,
            allowances: {
              ...defaultSalary.allowances,
              performance: attendanceData.performanceBonus
            },
            deductions: {
              ...defaultSalary.deductions,
              attendance: attendanceData.attendanceDeduction
            },
            bonus: attendanceData.bonus,
            overtime: attendanceData.overtime,
            workingDays: attendanceData.workingDays,
            paymentMethod: 'bank-transfer',
            remarks: `Auto-generated payroll record with attendance data`,
            createdBy: createdBy._id
          };

          const payroll = new Payroll(payrollData);
          await payroll.save();

          results.created.push({
            employeeId: employee._id,
            employeeName: `${employee.firstName} ${employee.lastName}`,
            payrollId: payroll._id,
            netSalary: payroll.netSalary
          });

        } catch (error) {
          results.errors.push({
            employeeId: employee._id,
            employeeName: `${employee.firstName} ${employee.lastName}`,
            error: error.message
          });
        }
      }

      return results;
    } catch (error) {
      throw new Error(`Failed to generate monthly payrolls: ${error.message}`);
    }
  }

  /**
   * Get default salary structure based on employee role
   * @param {string} role - Employee role
   * @returns {Object} Default salary structure
   */
  static getDefaultSalaryByRole(role) {
    const salaryTemplates = {
      hr: {
        basicSalary: 45000,
        allowances: {
          hra: 13500,
          transport: 3000,
          medical: 2000,
          performance: 0,
          other: 0
        },
        deductions: {
          tax: 4500,
          providentFund: 5400,
          insurance: 1000,
          loan: 0,
          other: 0
        }
      },
      manager: {
        basicSalary: 60000,
        allowances: {
          hra: 18000,
          transport: 4000,
          medical: 3000,
          performance: 0,
          other: 0
        },
        deductions: {
          tax: 7200,
          providentFund: 7200,
          insurance: 1500,
          loan: 0,
          other: 0
        }
      },
      individual: {
        basicSalary: 30000,
        allowances: {
          hra: 9000,
          transport: 2000,
          medical: 1500,
          performance: 0,
          other: 0
        },
        deductions: {
          tax: 2700,
          providentFund: 3600,
          insurance: 800,
          loan: 0,
          other: 0
        }
      }
    };

    return salaryTemplates[role] || salaryTemplates.individual;
  }

  /**
   * Check if it's time for monthly payroll generation
   * @returns {boolean} True if payroll should be generated
   */
  static shouldGeneratePayroll() {
    const now = new Date();
    const currentDate = now.getDate();
    const currentHour = now.getHours();
    
    // Generate on the 1st of each month at 9 AM
    return currentDate === 1 && currentHour === 9;
  }

  /**
   * Check if it's time for salary reminder
   * @returns {boolean} True if reminder should be shown
   */
  static shouldShowSalaryReminder() {
    const now = new Date();
    const currentDate = now.getDate();
    
    // Show reminder on 30th of each month
    return currentDate === 30;
  }

  /**
   * Get pending payroll summary for reminders
   * @returns {Object} Summary of pending payrolls
   */
  static async getPendingPayrollSummary() {
    try {
      const currentMonth = new Date();
      currentMonth.setDate(1); // First day of current month
      
      const pendingPayrolls = await Payroll.find({
        salaryMonth: { $gte: currentMonth },
        paymentStatus: { $in: ['pending', 'processing'] },
        isActive: true
      }).populate('employeeId', 'firstName lastName employeeId');

      const totalPending = pendingPayrolls.length;
      const totalAmount = pendingPayrolls.reduce((sum, payroll) => sum + payroll.netSalary, 0);

      return {
        totalPending,
        totalAmount,
        payrolls: pendingPayrolls
      };
    } catch (error) {
      throw new Error(`Failed to get pending payroll summary: ${error.message}`);
    }
  }

  /**
   * Generate payroll for current month
   * @param {Object} createdBy - User creating the payroll
   * @returns {Object} Generation results
   */
  static async generateCurrentMonthPayroll(createdBy) {
    const currentDate = new Date();
    const salaryMonth = new Date(currentDate.getFullYear(), currentDate.getMonth(), 1);
    
    return await this.generateMonthlyPayrolls(salaryMonth, createdBy);
  }

  /**
   * Check if current month payroll exists for all employees
   * @returns {Object} Status of current month payroll
   */
  static async getCurrentMonthPayrollStatus() {
    try {
      const currentDate = new Date();
      const salaryMonth = new Date(currentDate.getFullYear(), currentDate.getMonth(), 1);
      
      // Get eligible employees count
      const eligibleCount = await User.countDocuments({
        role: { $nin: ['ceo', 'co-founder'] },
        isActive: true
      });

      // Get existing payrolls count for current month
      const existingCount = await Payroll.countDocuments({
        salaryMonth: salaryMonth,
        isActive: true
      });

      const pendingCount = await Payroll.countDocuments({
        salaryMonth: salaryMonth,
        paymentStatus: { $in: ['pending', 'processing'] },
        isActive: true
      });

      return {
        eligibleEmployees: eligibleCount,
        generatedPayrolls: existingCount,
        pendingPayments: pendingCount,
        isComplete: eligibleCount === existingCount,
        needsGeneration: eligibleCount > existingCount,
        needsPaymentProcessing: pendingCount > 0
      };
    } catch (error) {
      throw new Error(`Failed to get payroll status: ${error.message}`);
    }
  }

  /**
   * Update employee salary template
   * @param {string} employeeId - Employee ID
   * @param {Object} salaryData - New salary structure
   * @returns {Object} Updated template
   */
  static async updateEmployeeSalaryTemplate(employeeId, salaryData) {
    try {
      const employee = await User.findById(employeeId);
      if (!employee) {
        throw new Error('Employee not found');
      }

      // Store salary template in user profile (you might want to create a separate SalaryTemplate model)
      employee.salaryTemplate = {
        basicSalary: salaryData.basicSalary,
        allowances: salaryData.allowances,
        deductions: salaryData.deductions,
        lastUpdated: new Date()
      };

      await employee.save();
      return employee.salaryTemplate;
    } catch (error) {
      throw new Error(`Failed to update salary template: ${error.message}`);
    }
  }

  /**
   * Calculate attendance-based payroll adjustments
   * @param {string} employeeId - Employee ID
   * @param {Date} salaryMonth - Month for which payroll is calculated
   * @returns {Object} Attendance-based payroll data
   */
  static async calculateAttendanceBasedPayroll(employeeId, salaryMonth) {
    try {
      // Get start and end dates for the month
      const startDate = new Date(salaryMonth.getFullYear(), salaryMonth.getMonth(), 1);
      const endDate = new Date(salaryMonth.getFullYear(), salaryMonth.getMonth() + 1, 0);

      // Get attendance summary for the month
      const attendanceSummary = await Attendance.getAttendanceSummary(
        employeeId,
        startDate,
        endDate
      );

      // Calculate working days (excluding weekends)
      const totalWorkingDays = this.calculateWorkingDays(startDate, endDate);
      
      // Attendance calculations
      const presentDays = attendanceSummary.presentDays || 0;
      const absentDays = attendanceSummary.absentDays || 0;
      const lateDays = attendanceSummary.lateDays || 0;
      const partialDays = attendanceSummary.partialDays || 0;
      const totalOvertimeHours = attendanceSummary.totalOvertimeHours || 0;

      // Calculate attendance percentage
      const attendancePercentage = totalWorkingDays > 0 ? 
        ((presentDays + (partialDays * 0.5)) / totalWorkingDays) * 100 : 100;

      // Calculate deductions
      let attendanceDeduction = 0;
      
      // Deduct for absent days (per day deduction = monthly salary / total working days)
      if (absentDays > 0) {
        const perDayAmount = 50000 / totalWorkingDays; // Using a base amount, should be calculated from actual salary
        attendanceDeduction += absentDays * perDayAmount;
      }

      // Additional deduction for late arrivals
      if (lateDays > 0) {
        attendanceDeduction += lateDays * 500; // 500 per late day
      }

      // Partial day deduction (half day deduction)
      if (partialDays > 0) {
        const perDayAmount = 50000 / totalWorkingDays;
        attendanceDeduction += partialDays * (perDayAmount * 0.5);
      }

      // Calculate overtime payment
      const overtimeRate = 200; // Rs. 200 per hour
      const overtimeAmount = totalOvertimeHours * overtimeRate;

      // Calculate performance bonus based on attendance
      let performanceBonus = 0;
      if (attendancePercentage >= 98) {
        performanceBonus = 5000; // Perfect attendance bonus
      } else if (attendancePercentage >= 95) {
        performanceBonus = 3000; // Good attendance bonus
      } else if (attendancePercentage >= 90) {
        performanceBonus = 1000; // Average attendance bonus
      }

      // Calculate total bonus (performance + overtime)
      const totalBonus = performanceBonus + (attendancePercentage >= 95 ? overtimeAmount * 0.1 : 0);

      return {
        workingDays: {
          total: totalWorkingDays,
          present: presentDays,
          absent: absentDays,
          late: lateDays,
          partial: partialDays,
          leave: 0 // This should come from leave management system
        },
        attendancePercentage: Math.round(attendancePercentage * 100) / 100,
        attendanceDeduction: Math.round(attendanceDeduction * 100) / 100,
        overtime: {
          hours: totalOvertimeHours,
          rate: overtimeRate,
          amount: Math.round(overtimeAmount * 100) / 100
        },
        performanceBonus: Math.round(performanceBonus * 100) / 100,
        bonus: Math.round(totalBonus * 100) / 100
      };

    } catch (error) {
      console.error('Error calculating attendance-based payroll:', error);
      // Return default values if calculation fails
      return {
        workingDays: { total: 22, present: 22, absent: 0, late: 0, partial: 0, leave: 0 },
        attendancePercentage: 100,
        attendanceDeduction: 0,
        overtime: { hours: 0, rate: 200, amount: 0 },
        performanceBonus: 0,
        bonus: 0
      };
    }
  }

  /**
   * Calculate working days in a month (excluding weekends)
   * @param {Date} startDate - Start date of the month
   * @param {Date} endDate - End date of the month
   * @returns {number} Number of working days
   */
  static calculateWorkingDays(startDate, endDate) {
    let workingDays = 0;
    const currentDate = new Date(startDate);

    while (currentDate <= endDate) {
      const dayOfWeek = currentDate.getDay();
      // Count Monday (1) to Friday (5) as working days
      if (dayOfWeek >= 1 && dayOfWeek <= 5) {
        workingDays++;
      }
      currentDate.setDate(currentDate.getDate() + 1);
    }

    return workingDays;
  }
}

module.exports = PayrollService;