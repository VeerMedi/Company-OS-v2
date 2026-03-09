const { Leave } = require('../models/Leave');
const Attendance = require('../models/Attendance');
const User = require('../models/User');
const mongoose = require('mongoose');

/**
 * PRODUCTION-GRADE ATTENDANCE-LEAVE SYNCHRONIZATION SERVICE
 * 
 * CORE PRINCIPLES:
 * 1. Leave → Attendance is source of truth
 * 2. Idempotent operations (safe to retry)
 * 3. Atomic transactions where possible
 * 4. Comprehensive logging
 * 5. Zero data corruption tolerance
 */

class AttendanceLeaveSync {
  
  /**
   * Check if date is weekend
   */
  isWeekend(date) {
    const day = new Date(date).getDay();
    return day === 0 || day === 6; // Sunday or Saturday
  }

  /**
   * Check if date is holiday (placeholder - integrate with holiday calendar)
   */
  async isHoliday(date) {
    // TODO: Integrate with holiday calendar
    return false;
  }

  /**
   * Check if date is working day
   */
  async isWorkingDay(date) {
    return !this.isWeekend(date) && !(await this.isHoliday(date));
  }

  /**
   * Get working days between two dates
   */
  async getWorkingDays(startDate, endDate) {
    const days = [];
    const current = new Date(startDate);
    current.setHours(0, 0, 0, 0);
    const end = new Date(endDate);
    end.setHours(0, 0, 0, 0);

    while (current <= end) {
      if (await this.isWorkingDay(current)) {
        days.push(new Date(current));
      }
      current.setDate(current.getDate() + 1);
    }

    return days;
  }

  /**
   * CORE FUNCTION: Auto-mark attendance for approved leave
   * 
   * RULES:
   * - Only create for working days (skip weekends/holidays)
   * - Idempotent (check for existing attendance)
   * - Override existing attendance if needed
   * - Mark as auto-generated
   * - Link bidirectionally
   * 
   * @param {String} leaveId - Leave ID
   * @param {Object} options - { forceOverride: boolean }
   * @returns {Object} - { created: [], overridden: [], skipped: [] }
   */
  async markAttendanceForLeave(leaveId, options = {}) {
    const { forceOverride = false } = options;
    
    try {
      console.log(`\n🔄 [ATTENDANCE-LEAVE SYNC] Starting attendance marking for leave ${leaveId}`);
      
      // Fetch leave with employee details
      const leave = await Leave.findById(leaveId).populate('employee');
      
      if (!leave) {
        throw new Error(`Leave ${leaveId} not found`);
      }

      if (leave.status !== 'approved') {
        console.log(`⚠️  Leave ${leaveId} is not approved (status: ${leave.status}). Skipping.`);
        return { created: [], overridden: [], skipped: [], error: 'Leave not approved' };
      }

      // IDEMPOTENCY CHECK
      if (leave.attendanceMarked && !forceOverride) {
        console.log(`✅ Attendance already marked for leave ${leaveId}. Skipping (idempotent).`);
        return { 
          created: [], 
          overridden: [], 
          skipped: leave.attendanceRecords || [],
          alreadyMarked: true 
        };
      }

      // Get working days in leave period
      const workingDays = await this.getWorkingDays(leave.startDate, leave.endDate);
      console.log(`📅 Found ${workingDays.length} working days in leave period`);

      const results = {
        created: [],
        overridden: [],
        skipped: []
      };

      // Process each working day
      for (const date of workingDays) {
        try {
          const result = await this._markAttendanceForDate(
            leave.employee._id,
            leave.employee.employeeId || leave.employee.email,
            date,
            leave._id,
            leave.leaveType,
            leave.isHalfDay,
            forceOverride
          );

          if (result.action === 'created') results.created.push(result.attendanceId);
          else if (result.action === 'overridden') results.overridden.push(result.attendanceId);
          else if (result.action === 'skipped') results.skipped.push(result.attendanceId);

        } catch (error) {
          console.error(`❌ Error marking attendance for ${date.toDateString()}:`, error);
          // Continue with other dates
        }
      }

      // Update leave record atomically
      const updateResult = await Leave.findByIdAndUpdate(
        leaveId,
        {
          $set: {
            attendanceMarked: true,
            attendanceRecords: [...results.created, ...results.overridden]
          }
        },
        { new: true }
      );

      console.log(`✅ [ATTENDANCE-LEAVE SYNC] Completed for leave ${leaveId}`);
      console.log(`   Created: ${results.created.length}`);
      console.log(`   Overridden: ${results.overridden.length}`);
      console.log(`   Skipped: ${results.skipped.length}\n`);

      return results;

    } catch (error) {
      console.error(`❌ [ATTENDANCE-LEAVE SYNC] Fatal error for leave ${leaveId}:`, error);
      throw error;
    }
  }

  /**
   * Mark attendance for a single date
   * @private
   */
  async _markAttendanceForDate(employeeId, employeeCode, date, leaveId, leaveType, halfDay, forceOverride) {
    const targetDate = new Date(date);
    targetDate.setHours(0, 0, 0, 0);

    // Check for existing attendance
    const existing = await Attendance.findOne({
      employeeId,
      date: targetDate,
      isActive: true
    });

    const status = halfDay ? 'half-leave' : 'on-leave';
    const notes = `On ${leaveType} leave${halfDay ? ' (half-day)' : ''}`;

    if (existing) {
      // OVERRIDE LOGIC
      if (existing.isAutoGenerated || forceOverride) {
        // Preserve previous status for audit
        const previousStatus = existing.status;
        
        existing.status = status;
        existing.leaveId = leaveId;
        existing.isAutoGenerated = true;
        existing.notes = notes;
        existing.previousStatus = previousStatus;
        
        await existing.save();
        
        console.log(`🔄 Overridden attendance for ${targetDate.toDateString()} (was: ${previousStatus})`);
        return { action: 'overridden', attendanceId: existing._id };
      } else {
        // Manual attendance exists - skip
        console.log(`⏭️  Skipping ${targetDate.toDateString()} - manual attendance exists`);
        return { action: 'skipped', attendanceId: existing._id };
      }
    }

    // CREATE NEW ATTENDANCE
    const attendance = await Attendance.create({
      employeeId,
      employeeCode,
      date: targetDate,
      status,
      leaveId,
      isAutoGenerated: true,
      notes,
      isActive: true,
      punchIn: { time: null },
      punchOut: { time: null },
      totalWorkingHours: 0
    });

    console.log(`✅ Created attendance for ${targetDate.toDateString()} (status: ${status})`);
    return { action: 'created', attendanceId: attendance._id };
  }

  /**
   * CORE FUNCTION: Handle leave cancellation/rejection
   * 
   * RULES:
   * - Delete ONLY auto-generated attendance
   * - Restore previous status if available
   * - Reset leave.attendanceMarked
   * - Clear leave.attendanceRecords
   * 
   * @param {String} leaveId - Leave ID
   * @returns {Object} - { deleted: number, restored: number }
   */
  async handleLeaveCancellation(leaveId) {
    try {
      console.log(`\n🗑️  [LEAVE CANCELLATION] Starting cleanup for leave ${leaveId}`);

      const leave = await Leave.findById(leaveId);
      if (!leave) {
        throw new Error(`Leave ${leaveId} not found`);
      }

      // Find all linked attendance
      const linkedAttendance = await Attendance.find({
        leaveId: leave._id,
        isActive: true
      });

      console.log(`📋 Found ${linkedAttendance.length} linked attendance records`);

      let deleted = 0;
      let restored = 0;

      for (const attendance of linkedAttendance) {
        if (attendance.isAutoGenerated) {
          // Check if there was a previous status to restore
          if (attendance.previousStatus) {
            attendance.status = attendance.previousStatus;
            attendance.leaveId = null;
            attendance.isAutoGenerated = false;
            attendance.notes = `Restored after leave cancellation`;
            delete attendance.previousStatus;
            await attendance.save();
            restored++;
            console.log(`🔄 Restored attendance for ${attendance.date.toDateString()}`);
          } else {
            // Delete auto-generated attendance
            await Attendance.findByIdAndDelete(attendance._id);
            deleted++;
            console.log(`🗑️  Deleted auto-generated attendance for ${attendance.date.toDateString()}`);
          }
        } else {
          console.log(`⏭️  Skipping manual attendance for ${attendance.date.toDateString()}`);
        }
      }

      // Reset leave record
      await Leave.findByIdAndUpdate(leaveId, {
        $set: {
          attendanceMarked: false,
          attendanceRecords: []
        }
      });

      console.log(`✅ [LEAVE CANCELLATION] Completed for leave ${leaveId}`);
      console.log(`   Deleted: ${deleted}`);
      console.log(`   Restored: ${restored}\n`);

      return { deleted, restored };

    } catch (error) {
      console.error(`❌ [LEAVE CANCELLATION] Error for leave ${leaveId}:`, error);
      throw error;
    }
  }

  /**
   * CORE FUNCTION: Validate punch against approved leave
   * 
   * RULES:
   * - Full-day leave → block all punches
   * - Half-day leave → block specific punches (morning/afternoon)
   * - Return structured error with context
   * 
   * @param {String} employeeId - Employee ID
   * @param {Date} date - Date to check
   * @param {String} punchType - 'in' or 'out'
   * @returns {Object} - { allowed: boolean, reason: string, leave: object }
   */
  async validatePunchAgainstLeave(employeeId, date, punchType = 'in') {
    try {
      const targetDate = new Date(date);
      targetDate.setHours(0, 0, 0, 0);

      const approvedLeave = await Leave.findOne({
        employee: employeeId,
        status: 'approved',
        startDate: { $lte: targetDate },
        endDate: { $gte: targetDate }
      });

      if (!approvedLeave) {
        return {
          allowed: true,
          onLeave: false
        };
      }

      // FULL-DAY LEAVE
      if (!approvedLeave.isHalfDay) {
        return {
          allowed: false,
          onLeave: true,
          leaveType: approvedLeave.leaveType,
          leaveId: approvedLeave._id,
          message: `You are on ${approvedLeave.leaveType} leave today`,
          reason: 'full_day_leave'
        };
      }

      // HALF-DAY LEAVE
      const currentHour = new Date().getHours();
      const isMorning = currentHour < 13; // Before 1 PM

      if (approvedLeave.halfDayPeriod === 'morning' && isMorning && punchType === 'in') {
        return {
          allowed: false,
          onLeave: true,
          leaveType: approvedLeave.leaveType,
          leaveId: approvedLeave._id,
          message: `You are on ${approvedLeave.leaveType} leave (morning half)`,
          reason: 'half_day_morning_leave'
        };
      }

      if (approvedLeave.halfDayPeriod === 'afternoon' && !isMorning && punchType === 'in') {
        return {
          allowed: false,
          onLeave: true,
          leaveType: approvedLeave.leaveType,
          leaveId: approvedLeave._id,
          message: `You are on ${approvedLeave.leaveType} leave (afternoon half)`,
          reason: 'half_day_afternoon_leave'
        };
      }

      return {
        allowed: true,
        onLeave: true,
        leaveType: approvedLeave.leaveType,
        halfDay: true,
        message: `You have half-day leave today (${approvedLeave.halfDayPeriod})`
      };

    } catch (error) {
      console.error('Error validating punch against leave:', error);
      throw error;
    }
  }

  /**
   * CORE FUNCTION: Get unified employee status
   * 
   * Returns complete status including:
   * - Attendance state
   * - Leave state
   * - Punch permission
   * - UI messages
   * 
   * @param {String} employeeId - Employee ID
   * @param {Date} date - Date to check
   * @returns {Object} - Complete status object
   */
  async getEmployeeStatus(employeeId, date) {
    try {
      const targetDate = new Date(date);
      targetDate.setHours(0, 0, 0, 0);

      // Check for approved leave
      const leave = await Leave.findOne({
        employee: employeeId,
        status: 'approved',
        startDate: { $lte: targetDate },
        endDate: { $gte: targetDate }
      });

      // Check attendance
      const attendance = await Attendance.findOne({
        employeeId,
        date: targetDate
      });

      // PRIORITY: on-leave > present > absent
      if (leave) {
        const punchValidation = await this.validatePunchAgainstLeave(employeeId, date);
        
        return {
          status: leave.halfDay ? 'half-leave' : 'on-leave',
          leaveType: leave.leaveType,
          leaveId: leave._id,
          halfDay: leave.isHalfDay,
          halfDayPeriod: leave.halfDayPeriod,
          attendance: attendance,
          canPunchIn: punchValidation.allowed,
          canPunchOut: punchValidation.allowed,
          message: punchValidation.message || `On ${leave.leaveType} leave`,
          uiMessage: this._getUIMessage(leave, attendance)
        };
      }

      if (attendance) {
        return {
          status: attendance.status,
          attendance: attendance,
          canPunchIn: !attendance.punchIn?.time,
          canPunchOut: attendance.punchIn?.time && !attendance.punchOut?.time,
          message: `Attendance: ${attendance.status}`,
          uiMessage: `Your attendance is marked as ${attendance.status}`
        };
      }

      return {
        status: 'no-record',
        canPunchIn: true,
        canPunchOut: false,
        message: 'No attendance or leave record',
        uiMessage: 'Please punch in to mark your attendance'
      };

    } catch (error) {
      console.error('Error getting employee status:', error);
      throw error;
    }
  }

  /**
   * Generate UI-friendly message
   * @private
   */
  _getUIMessage(leave, attendance) {
    if (!leave) return 'No leave today';
    
    if (leave.isHalfDay) {
      return `You have ${leave.halfDayPeriod} half-day ${leave.leaveType} leave. ${
        leave.halfDayPeriod === 'morning' ? 'You can work in the afternoon.' : 'You worked in the morning.'
      }`;
    }

    return `You are on ${leave.leaveType} leave today. Attendance has been automatically marked. Enjoy your time off!`;
  }

  /**
   * Validate leave against existing attendance
   * 
   * @param {String} employeeId - Employee ID
   * @param {Array} dates - Array of dates
   * @returns {Object} - { hasConflicts: boolean, conflicts: [] }
   */
  async validateLeaveAgainstAttendance(employeeId, dates) {
    try {
      const conflicts = await Attendance.find({
        employeeId,
        date: { $in: dates },
        status: { $in: ['present', 'half-day', 'late', 'early-departure'] },
        isActive: true,
        isAutoGenerated: false // Only check manual attendance
      }).select('date status');

      return {
        hasConflicts: conflicts.length > 0,
        conflicts: conflicts.map(c => ({
          date: c.date,
          status: c.status
        }))
      };
    } catch (error) {
      console.error('Error validating leave against attendance:', error);
      throw error;
    }
  }
}

module.exports = new AttendanceLeaveSync();
