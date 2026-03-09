const Attendance = require('../models/Attendance');
const User = require('../models/User');
const mongoose = require('mongoose');
const attendanceLeaveSync = require('../services/attendanceLeaveSync');

class AttendanceController {
  // Punch In function
  static async punchIn(req, res) {
    try {
      const userId = req.user._id; // Use MongoDB ObjectId
      const { location, notes } = req.body;
      
      // Get employee details
      const employee = await User.findById(userId);
      if (!employee) {
        return res.status(404).json({
          success: false,
          message: 'Employee not found'
        });
      }

      // Check if employee is on approved leave today
      const leaveCheck = await attendanceLeaveSync.validatePunchAgainstLeave(userId, new Date());
      if (leaveCheck.onLeave) {
        return res.status(400).json({
          success: false,
          message: leaveCheck.message,
          data: {
            onLeave: true,
            leaveType: leaveCheck.leaveType,
            leaveId: leaveCheck.leaveId
          }
        });
      }

      // Check if already punched in today
      const existingAttendance = await Attendance.getTodayAttendance(userId);
      
      if (existingAttendance && existingAttendance.punchIn.time) {
        return res.status(400).json({
          success: false,
          message: 'Already punched in today',
          data: {
            punchInTime: existingAttendance.punchIn.time,
            attendanceId: existingAttendance._id
          }
        });
      }

      const punchInData = {
        time: new Date(),
        location: location || 'Office',
        ipAddress: req.ip || req.connection.remoteAddress,
        deviceInfo: req.get('User-Agent') || 'Unknown'
      };

      let attendance;
      if (existingAttendance) {
        // Update existing record
        existingAttendance.punchIn = punchInData;
        if (notes) existingAttendance.notes = notes;
        attendance = await existingAttendance.save();
      } else {
        // Create new attendance record
        attendance = new Attendance({
          employeeId: userId, // Use MongoDB ObjectId
          employeeCode: employee.employeeId, // Use string employee code
          punchIn: punchInData,
          notes: notes || ''
        });
        await attendance.save();
      }

      res.status(200).json({
        success: true,
        message: 'Punched in successfully',
        data: attendance
      });

    } catch (error) {
      console.error('Punch in error:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to punch in',
        error: error.message
      });
    }
  }

  // Punch Out function
  static async punchOut(req, res) {
    try {
      const userId = req.user._id; // Use MongoDB ObjectId
      const { location, notes } = req.body;

      // Get today's attendance record
      const attendance = await Attendance.getTodayAttendance(userId);
      
      if (!attendance) {
        return res.status(404).json({
          success: false,
          message: 'No punch in record found for today. Please punch in first.'
        });
      }

      if (!attendance.punchIn.time) {
        return res.status(400).json({
          success: false,
          message: 'Please punch in first before punching out'
        });
      }

      if (attendance.punchOut.time) {
        return res.status(400).json({
          success: false,
          message: 'Already punched out today',
          data: {
            punchOutTime: attendance.punchOut.time,
            totalWorkingHours: attendance.formattedWorkingHours
          }
        });
      }

      // Update punch out details
      attendance.punchOut = {
        time: new Date(),
        location: location || 'Office',
        ipAddress: req.ip || req.connection.remoteAddress,
        deviceInfo: req.get('User-Agent') || 'Unknown'
      };

      if (notes) {
        attendance.notes = attendance.notes ? `${attendance.notes}\nPunch Out: ${notes}` : notes;
      }

      await attendance.save();

      res.status(200).json({
        success: true,
        message: 'Punched out successfully',
        data: {
          attendance,
          workingHours: attendance.formattedWorkingHours,
          totalMinutes: attendance.totalWorkingHours
        }
      });

    } catch (error) {
      console.error('Punch out error:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to punch out',
        error: error.message
      });
    }
  }

  // Get current punch status
  static async getPunchStatus(req, res) {
    try {
      const userId = req.user._id; // Use MongoDB ObjectId

      const attendance = await Attendance.getTodayAttendance(userId);

      if (!attendance) {
        return res.status(200).json({
          success: true,
          data: {
            status: 'not-punched',
            canPunchIn: true,
            canPunchOut: false,
            attendance: null
          }
        });
      }

      res.status(200).json({
        success: true,
        data: {
          status: attendance.punchOut.time ? 'punched-out' : 'punched-in',
          canPunchIn: !attendance.punchIn.time,
          canPunchOut: attendance.punchIn.time && !attendance.punchOut.time,
          attendance
        }
      });

    } catch (error) {
      console.error('Get punch status error:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to get punch status',
        error: error.message
      });
    }
  }

  // Get leave status for today
  static async getLeaveStatus(req, res) {
    try {
      const userId = req.user._id;
      const status = await attendanceLeaveSync.getEmployeeStatus(userId, new Date());
      
      res.status(200).json({
        success: true,
        data: status
      });
    } catch (error) {
      console.error('Get leave status error:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to get leave status',
        error: error.message
      });
    }
  }

  // Get attendance records for an employee
  static async getEmployeeAttendance(req, res) {
    try {
      const targetUserId = req.params.employeeId || req.user._id; // Use MongoDB ObjectId
      const { startDate, endDate, page = 1, limit = 30 } = req.query;

      const query = { 
        employeeId: targetUserId,
        isActive: true 
      };

      if (startDate || endDate) {
        query.date = {};
        if (startDate) query.date.$gte = new Date(startDate);
        if (endDate) query.date.$lte = new Date(endDate);
      }

      const skip = (parseInt(page) - 1) * parseInt(limit);
      const attendance = await Attendance.find(query)
        .populate({
          path: 'employeeId',
          select: 'firstName lastName employeeId department'
        })
        .sort({ date: -1 })
        .skip(skip)
        .limit(parseInt(limit));

      const total = await Attendance.countDocuments(query);
      const totalPages = Math.ceil(total / parseInt(limit));

      // Get attendance summary
      const summaryStartDate = startDate ? new Date(startDate) : new Date(new Date().getFullYear(), new Date().getMonth(), 1);
      const summaryEndDate = endDate ? new Date(endDate) : new Date();
      
      const summary = await Attendance.getAttendanceSummary(
        targetUserId,
        summaryStartDate,
        summaryEndDate
      );

      res.status(200).json({
        success: true,
        data: {
          attendance,
          pagination: {
            totalPages,
            currentPage: parseInt(page),
            totalRecords: total,
            hasNext: parseInt(page) < totalPages,
            hasPrev: parseInt(page) > 1
          },
          summary
        }
      });

    } catch (error) {
      console.error('Get employee attendance error:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to get attendance records',
        error: error.message
      });
    }
  }

  // Get all employees attendance (HR/Admin function)
  static async getAllEmployeesAttendance(req, res) {
    try {
      const { date, department, status, page = 1, limit = 50 } = req.query;

      // Build query
      const query = { isActive: true };
      
      if (date) {
        // Parse the date string as YYYY-MM-DD and create local date
        const [year, month, day] = date.split('-').map(Number);
        const targetDate = new Date(year, month - 1, day, 0, 0, 0, 0); // Local timezone
        const nextDay = new Date(targetDate);
        nextDay.setDate(nextDay.getDate() + 1);
        
        query.date = { $gte: targetDate, $lt: nextDay };
      } else {
        // Default to today in local timezone
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        const tomorrow = new Date(today);
        tomorrow.setDate(tomorrow.getDate() + 1);
        
        query.date = { $gte: today, $lt: tomorrow };
      }

      if (status) {
        query.status = status;
      }

      // Aggregate to include employee details and filter by department
      const pipeline = [
        { $match: query },
        {
          $lookup: {
            from: 'users',
            localField: 'employeeId',
            foreignField: '_id',
            as: 'employee'
          }
        },
        { $unwind: '$employee' },
        {
          $match: {
            'employee.isActive': true,
            ...(department && { 'employee.department': department })
          }
        },
        {
          $project: {
            employeeId: 1,
            employeeCode: 1,
            date: 1,
            punchIn: 1,
            punchOut: 1,
            totalWorkingHours: 1,
            formattedWorkingHours: 1,
            status: 1,
            overtime: 1,
            notes: 1,
            employee: {
              firstName: 1,
              lastName: 1,
              department: 1,
              role: 1,
              employeeId: 1
            }
          }
        },
        { $sort: { 'employee.firstName': 1, 'employee.lastName': 1 } }
      ];

      const attendance = await Attendance.aggregate(pipeline);

      // Get unique departments for filter
      const departments = await User.distinct('department', { 
        isActive: true,
        role: { $nin: ['ceo', 'co-founder'] }
      });

      // Calculate summary statistics
      const summary = {
        totalEmployees: attendance.length,
        present: attendance.filter(a => a.status === 'present').length,
        absent: attendance.filter(a => a.status === 'absent').length,
        late: attendance.filter(a => a.status === 'late').length,
        partial: attendance.filter(a => a.status === 'partial').length,
        onLeave: attendance.filter(a => a.status === 'leave').length
      };

      res.status(200).json({
        success: true,
        data: {
          attendance,
          summary,
          departments,
          date: query.date
        }
      });

    } catch (error) {
      console.error('Get all employees attendance error:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to get attendance records',
        error: error.message
      });
    }
  }

  // Manual attendance entry (HR/Admin function)
  static async createManualEntry(req, res) {
    try {
      const { 
        employeeId, 
        date, 
        punchInTime, 
        punchOutTime, 
        status, 
        notes, 
        location = 'Office' 
      } = req.body;

      // Validate employee
      const employee = await User.findById(employeeId);
      if (!employee) {
        return res.status(404).json({
          success: false,
          message: 'Employee not found'
        });
      }

      // Check if attendance already exists for this date
      const existingAttendance = await Attendance.findOne({
        employeeId,
        date: new Date(date),
        isActive: true
      });

      if (existingAttendance) {
        return res.status(400).json({
          success: false,
          message: 'Attendance record already exists for this date'
        });
      }

      // Create manual attendance entry
      const attendance = new Attendance({
        employeeId,
        employeeCode: employee.employeeId,
        date: new Date(date),
        punchIn: punchInTime ? {
          time: new Date(punchInTime),
          location,
          ipAddress: 'Manual Entry',
          deviceInfo: 'Manual Entry'
        } : undefined,
        punchOut: punchOutTime ? {
          time: new Date(punchOutTime),
          location,
          ipAddress: 'Manual Entry',
          deviceInfo: 'Manual Entry'
        } : undefined,
        status: status || 'absent',
        notes: notes || '',
        isManualEntry: true,
        manualEntryBy: req.user.employeeId
      });

      await attendance.save();

      res.status(201).json({
        success: true,
        message: 'Manual attendance entry created successfully',
        data: attendance
      });

    } catch (error) {
      console.error('Create manual entry error:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to create manual attendance entry',
        error: error.message
      });
    }
  }

  // Update attendance record (HR/Admin function)
  static async updateAttendance(req, res) {
    try {
      const { attendanceId } = req.params;
      const updates = req.body;

      const attendance = await Attendance.findById(attendanceId);
      if (!attendance) {
        return res.status(404).json({
          success: false,
          message: 'Attendance record not found'
        });
      }

      // Update allowed fields
      const allowedUpdates = [
        'punchIn', 'punchOut', 'status', 'notes', 'overtime'
      ];

      allowedUpdates.forEach(field => {
        if (updates[field] !== undefined) {
          attendance[field] = updates[field];
        }
      });

      await attendance.save();

      res.status(200).json({
        success: true,
        message: 'Attendance updated successfully',
        data: attendance
      });

    } catch (error) {
      console.error('Update attendance error:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to update attendance',
        error: error.message
      });
    }
  }

  // Get attendance dashboard data
  static async getDashboardData(req, res) {
    try {
      const { period = 'month' } = req.query;
      
      let startDate, endDate;
      const now = new Date();

      switch (period) {
        case 'week':
          startDate = new Date(now.getFullYear(), now.getMonth(), now.getDate() - now.getDay());
          endDate = new Date(now.getFullYear(), now.getMonth(), now.getDate() - now.getDay() + 6);
          break;
        case 'month':
        default:
          startDate = new Date(now.getFullYear(), now.getMonth(), 1);
          endDate = new Date(now.getFullYear(), now.getMonth() + 1, 0);
          break;
      }

      // Get attendance statistics
      const attendanceStats = await Attendance.aggregate([
        {
          $match: {
            date: { $gte: startDate, $lte: endDate },
            isActive: true
          }
        },
        {
          $group: {
            _id: '$status',
            count: { $sum: 1 },
            totalWorkingHours: { $sum: '$totalWorkingHours' }
          }
        }
      ]);

      // Get daily attendance trends
      const dailyTrends = await Attendance.aggregate([
        {
          $match: {
            date: { $gte: startDate, $lte: endDate },
            isActive: true
          }
        },
        {
          $group: {
            _id: { $dateToString: { format: '%Y-%m-%d', date: '$date' } },
            totalEmployees: { $addToSet: '$employeeId' },
            present: { $sum: { $cond: [{ $eq: ['$status', 'present'] }, 1, 0] } },
            absent: { $sum: { $cond: [{ $eq: ['$status', 'absent'] }, 1, 0] } },
            late: { $sum: { $cond: [{ $eq: ['$status', 'late'] }, 1, 0] } }
          }
        },
        {
          $addFields: {
            totalEmployees: { $size: '$totalEmployees' }
          }
        },
        { $sort: { _id: 1 } }
      ]);

      // Get top performers (highest attendance)
      const topPerformers = await Attendance.aggregate([
        {
          $match: {
            date: { $gte: startDate, $lte: endDate },
            isActive: true
          }
        },
        {
          $group: {
            _id: '$employeeId',
            totalDays: { $sum: 1 },
            presentDays: { $sum: { $cond: [{ $eq: ['$status', 'present'] }, 1, 0] } },
            totalWorkingHours: { $sum: '$totalWorkingHours' }
          }
        },
        {
          $addFields: {
            attendancePercentage: { $multiply: [{ $divide: ['$presentDays', '$totalDays'] }, 100] }
          }
        },
        { $sort: { attendancePercentage: -1 } },
        { $limit: 5 },
        {
          $lookup: {
            from: 'users',
            localField: '_id',
            foreignField: '_id',
            as: 'employee'
          }
        },
        { $unwind: '$employee' },
        {
          $project: {
            employeeName: { $concat: ['$employee.firstName', ' ', '$employee.lastName'] },
            department: '$employee.department',
            attendancePercentage: { $round: ['$attendancePercentage', 2] },
            totalWorkingHours: 1,
            presentDays: 1,
            totalDays: 1
          }
        }
      ]);

      res.status(200).json({
        success: true,
        data: {
          period,
          dateRange: { startDate, endDate },
          statistics: attendanceStats,
          dailyTrends,
          topPerformers
        }
      });

    } catch (error) {
      console.error('Get dashboard data error:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to get dashboard data',
        error: error.message
      });
    }
  }

  // Add break time
  static async addBreak(req, res) {
    try {
      const { breakType = 'lunch', notes } = req.body;
      const userId = req.user._id; // Use MongoDB ObjectId

      const attendance = await Attendance.getTodayAttendance(userId);
      if (!attendance) {
        return res.status(404).json({
          success: false,
          message: 'No attendance record found for today'
        });
      }

      // Check if there's an ongoing break
      const ongoingBreak = attendance.breaks.find(b => b.breakStart && !b.breakEnd);
      if (ongoingBreak) {
        return res.status(400).json({
          success: false,
          message: 'You already have an ongoing break. Please end it first.'
        });
      }

      // Add new break
      attendance.breaks.push({
        breakStart: new Date(),
        breakType,
        notes
      });

      await attendance.save();

      res.status(200).json({
        success: true,
        message: 'Break started successfully',
        data: attendance
      });

    } catch (error) {
      console.error('Add break error:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to start break',
        error: error.message
      });
    }
  }

  // End break time
  static async endBreak(req, res) {
    try {
      const userId = req.user._id; // Use MongoDB ObjectId

      const attendance = await Attendance.getTodayAttendance(userId);
      if (!attendance) {
        return res.status(404).json({
          success: false,
          message: 'No attendance record found for today'
        });
      }

      // Find ongoing break
      const ongoingBreak = attendance.breaks.find(b => b.breakStart && !b.breakEnd);
      if (!ongoingBreak) {
        return res.status(400).json({
          success: false,
          message: 'No ongoing break found'
        });
      }

      // End the break
      ongoingBreak.breakEnd = new Date();

      await attendance.save();

      res.status(200).json({
        success: true,
        message: 'Break ended successfully',
        data: attendance
      });

    } catch (error) {
      console.error('End break error:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to end break',
        error: error.message
      });
    }
  }

  // Import attendance data from CSV
  static async importAttendanceCSV(req, res) {
    try {
      const { records, officeTiming } = req.body; // Accept office timing

      if (!records || !Array.isArray(records) || records.length === 0) {
        return res.status(400).json({
          success: false,
          message: 'No valid records provided'
        });
      }

      // Set default office timing if not provided
      const timing = officeTiming || {
        startTime: '09:30',
        endTime: '18:00',
        shiftType: 'standard'
      };

      const results = {
        successful: 0,
        failed: 0,
        errors: []
      };

      for (const record of records) {
        try {
          // Validate required fields
          if (!record.employeeCode || !record.date) {
            results.failed++;
            results.errors.push(`Missing employee code or date for record`);
            continue;
          }

          // Find employee by employee code
          const employee = await User.findOne({ 
            employeeId: record.employeeCode,
            isActive: true 
          });

          if (!employee) {
            results.failed++;
            results.errors.push(`Employee with code ${record.employeeCode} not found`);
            continue;
          }

          // Parse date
          const attendanceDate = new Date(record.date);
          if (isNaN(attendanceDate.getTime())) {
            results.failed++;
            results.errors.push(`Invalid date format for employee ${record.employeeCode}: ${record.date}`);
            continue;
          }

          // Set date to start of day
          attendanceDate.setHours(0, 0, 0, 0);

          // Check if attendance already exists for this date
          const existingAttendance = await Attendance.findOne({
            employeeId: employee._id,
            date: attendanceDate
          });

          if (existingAttendance) {
            results.failed++;
            results.errors.push(`Attendance already exists for employee ${record.employeeCode} on ${record.date}`);
            continue;
          }

          // Parse punch times
          let punchInTime = null;
          let punchOutTime = null;

          if (record.punchIn && record.punchIn.trim() !== '' && record.punchIn !== '00:00') {
            const timeStr = record.punchIn.trim();
            const [hours, minutes] = timeStr.split(':');
            if (hours && minutes) {
              punchInTime = new Date(attendanceDate);
              punchInTime.setHours(parseInt(hours), parseInt(minutes), 0, 0);
              console.log(`✅ Parsed punch in: ${timeStr} -> ${punchInTime}`);
            }
          }

          if (record.punchOut && record.punchOut.trim() !== '' && record.punchOut !== '00:00') {
            const timeStr = record.punchOut.trim();
            const [hours, minutes] = timeStr.split(':');
            if (hours && minutes) {
              punchOutTime = new Date(attendanceDate);
              punchOutTime.setHours(parseInt(hours), parseInt(minutes), 0, 0);
              console.log(`✅ Parsed punch out: ${timeStr} -> ${punchOutTime}`);
            }
          }

          // Calculate working hours if both punch in and out are provided
          let totalWorkingHours = 0;
          if (punchInTime && punchOutTime) {
            totalWorkingHours = Math.max(0, (punchOutTime - punchInTime) / (1000 * 60)); // in minutes
            console.log(`⏰ Working hours: ${totalWorkingHours} minutes`);
          } else {
            console.log(`⚠️ Missing punch times for ${record.employeeCode} on ${record.date}: In=${punchInTime}, Out=${punchOutTime}`);
          }

          // Validate status (case-insensitive)
          const validStatuses = ['present', 'absent', 'partial', 'late', 'early-departure', 'holiday', 'leave'];
          const statusLower = record.status ? record.status.toLowerCase() : 'present';
          const status = validStatuses.includes(statusLower) ? statusLower : 'present';

          console.log(`📊 Creating attendance for ${record.employeeCode}: Status=${status}, Hours=${totalWorkingHours}`);

          // Create attendance record
          const attendanceData = {
            employeeId: employee._id,
            employeeCode: employee.employeeId,
            date: attendanceDate,
            status: status,
            totalWorkingHours: totalWorkingHours,
            notes: record.notes || '',
            officeTiming: timing, // Add office timing
            punchIn: {
              time: punchInTime,
              location: 'Imported',
              ipAddress: req.ip || 'N/A',
              deviceInfo: 'CSV Import'
            },
            punchOut: {
              time: punchOutTime,
              location: 'Imported',
              ipAddress: req.ip || 'N/A',
              deviceInfo: 'CSV Import'
            }
          };

          const attendance = new Attendance(attendanceData);
          await attendance.save();
          
          results.successful++;

        } catch (recordError) {
          results.failed++;
          results.errors.push(`Error processing record for employee ${record.employeeCode}: ${recordError.message}`);
        }
      }

      res.status(200).json({
        success: true,
        message: `Import completed. ${results.successful} successful, ${results.failed} failed.`,
        data: results
      });

    } catch (error) {
      console.error('CSV import error:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to import CSV data',
        error: error.message
      });
    }
  }

  // Validate CSV data before import (Preview)
  static async validateAttendanceCSV(req, res) {
    try {
      const { records } = req.body;

      if (!records || !Array.isArray(records) || records.length === 0) {
        return res.status(400).json({
          success: false,
          message: 'No valid records provided'
        });
      }

      const validationResults = {
        totalRecords: records.length,
        validRecords: [],
        invalidRecords: [],
        duplicateRecords: [],
        summary: {
          existingEmployees: 0,
          notFoundEmployees: 0,
          duplicateAttendance: 0,
          readyToImport: 0
        }
      };

      for (const record of records) {
        const validation = {
          employeeCode: record.employeeCode,
          date: record.date,
          status: 'pending',
          reason: null,
          employeeName: null
        };

        // Check required fields
        if (!record.employeeCode || !record.date) {
          validation.status = 'invalid';
          validation.reason = 'Missing employee code or date';
          validationResults.invalidRecords.push(validation);
          continue;
        }

        // Validate date format
        const attendanceDate = new Date(record.date);
        if (isNaN(attendanceDate.getTime())) {
          validation.status = 'invalid';
          validation.reason = `Invalid date format: ${record.date}`;
          validationResults.invalidRecords.push(validation);
          continue;
        }
        attendanceDate.setHours(0, 0, 0, 0);

        // Find employee
        const employee = await User.findOne({ 
          employeeId: record.employeeCode,
          isActive: true 
        });

        if (!employee) {
          validation.status = 'not_found';
          validation.reason = 'Employee not found in database';
          validationResults.invalidRecords.push(validation);
          validationResults.summary.notFoundEmployees++;
          continue;
        }

        validation.employeeName = `${employee.firstName} ${employee.lastName}`;

        // Check for duplicate attendance
        const existingAttendance = await Attendance.findOne({
          employeeId: employee._id,
          date: attendanceDate
        });

        if (existingAttendance) {
          validation.status = 'duplicate';
          validation.reason = 'Attendance already exists for this date';
          validationResults.duplicateRecords.push(validation);
          validationResults.summary.duplicateAttendance++;
          continue;
        }

        // Valid record
        validation.status = 'valid';
        validation.reason = 'Ready to import';
        validationResults.validRecords.push(validation);
        validationResults.summary.existingEmployees++;
        validationResults.summary.readyToImport++;
      }

      res.status(200).json({
        success: true,
        message: `Validation completed. ${validationResults.summary.readyToImport} records ready to import.`,
        data: validationResults
      });

    } catch (error) {
      console.error('CSV validation error:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to validate CSV data',
        error: error.message
      });
    }
  }

  // Get monthly attendance summary for profile page
  static async getMonthlyAttendance(req, res) {
    try {
      const userId = req.user._id;
      const { year, month } = req.query;
      
      // Default to current year and month if not provided
      const targetYear = year ? parseInt(year) : new Date().getFullYear();
      const targetMonth = month ? parseInt(month) - 1 : new Date().getMonth(); // Month is 0-indexed
      
      // Calculate start and end dates for the month
      const startDate = new Date(targetYear, targetMonth, 1);
      const endDate = new Date(targetYear, targetMonth + 1, 0); // Last day of the month
      
      // Get detailed attendance records for the month
      const attendanceRecords = await Attendance.find({
        employeeId: userId,
        date: { $gte: startDate, $lte: endDate },
        isActive: true
      })
      .populate({
        path: 'employeeId',
        select: 'firstName lastName employeeId'
      })
      .sort({ date: 1 });
      
      // Get attendance summary using the existing method
      const summary = await Attendance.getAttendanceSummary(userId, startDate, endDate);
      
      // Create a calendar view - array of all days in the month with attendance status
      const calendar = [];
      const daysInMonth = endDate.getDate();
      
      for (let day = 1; day <= daysInMonth; day++) {
        const currentDate = new Date(targetYear, targetMonth, day);
        const attendance = attendanceRecords.find(record => 
          record.date.getDate() === day && 
          record.date.getMonth() === targetMonth &&
          record.date.getFullYear() === targetYear
        );
        
        const dayOfWeek = currentDate.getDay();
        const isWeekend = dayOfWeek === 0 || dayOfWeek === 6; // Sunday or Saturday
        
        calendar.push({
          date: day,
          dayOfWeek,
          isWeekend,
          fullDate: currentDate,
          attendance: attendance ? {
            _id: attendance._id,
            status: attendance.status,
            punchIn: attendance.punchIn.time,
            punchOut: attendance.punchOut.time,
            totalWorkingHours: attendance.totalWorkingHours,
            formattedWorkingHours: attendance.formattedWorkingHours,
            overtime: attendance.overtime.hours,
            breaks: attendance.breaks,
            notes: attendance.notes
          } : null
        });
      }
      
      // Get attendance statistics for the last 6 months for trends
      const monthlyStats = [];
      for (let i = 5; i >= 0; i--) {
        const statMonth = new Date(targetYear, targetMonth - i, 1);
        const statEndMonth = new Date(targetYear, targetMonth - i + 1, 0);
        
        const monthSummary = await Attendance.getAttendanceSummary(userId, statMonth, statEndMonth);
        
        monthlyStats.push({
          month: statMonth.getMonth() + 1,
          year: statMonth.getFullYear(),
          monthName: statMonth.toLocaleDateString('en-US', { month: 'long' }),
          presentDays: monthSummary.presentDays,
          totalWorkingDays: monthSummary.workingDaysInPeriod,
          attendancePercentage: monthSummary.attendancePercentage,
          totalWorkingHours: Math.floor(monthSummary.totalWorkingMinutes / 60)
        });
      }
      
      res.status(200).json({
        success: true,
        data: {
          currentMonth: {
            month: targetMonth + 1,
            year: targetYear,
            monthName: startDate.toLocaleDateString('en-US', { month: 'long', year: 'numeric' })
          },
          summary,
          calendar,
          monthlyStats,
          records: attendanceRecords
        }
      });
      
    } catch (error) {
      console.error('Get monthly attendance error:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to get monthly attendance',
        error: error.message
      });
    }
  }

  // Recalculate attendance with new office timing
  static async recalculateAttendance(req, res) {
    try {
      const { startDate, endDate, officeTiming, employeeIds } = req.body;

      if (!startDate || !endDate || !officeTiming) {
        return res.status(400).json({
          success: false,
          message: 'Start date, end date, and office timing are required'
        });
      }

      // Validate office timing
      if (!officeTiming.startTime || !officeTiming.endTime) {
        return res.status(400).json({
          success: false,
          message: 'Office timing must include startTime and endTime'
        });
      }

      const start = new Date(startDate);
      start.setHours(0, 0, 0, 0);
      const end = new Date(endDate);
      end.setHours(23, 59, 59, 999);

      // Build query
      const query = {
        date: { $gte: start, $lte: end }
      };

      // If specific employees provided, filter by them
      if (employeeIds && Array.isArray(employeeIds) && employeeIds.length > 0) {
        query.employeeId = { $in: employeeIds };
      }

      // Find all attendance records in date range
      const attendanceRecords = await Attendance.find(query);

      if (attendanceRecords.length === 0) {
        return res.status(404).json({
          success: false,
          message: 'No attendance records found for the specified criteria'
        });
      }

      let updated = 0;
      let failed = 0;
      const errors = [];

      // Update each record with new office timing
      for (const record of attendanceRecords) {
        try {
          // Update office timing
          record.officeTiming = {
            startTime: officeTiming.startTime,
            endTime: officeTiming.endTime,
            shiftType: officeTiming.shiftType || 'custom'
          };

          // Save will trigger pre-save middleware which recalculates status
          await record.save();
          updated++;
        } catch (err) {
          failed++;
          errors.push(`Failed to update record for employee ${record.employeeCode} on ${record.date}: ${err.message}`);
        }
      }

      res.status(200).json({
        success: true,
        message: `Successfully recalculated ${updated} attendance records`,
        data: {
          totalRecords: attendanceRecords.length,
          updated,
          failed,
          errors: errors.length > 0 ? errors.slice(0, 10) : [] // Show max 10 errors
        }
      });

    } catch (error) {
      console.error('Recalculate attendance error:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to get monthly attendance data',
        error: error.message
      });
    }
  }

  // Get recent imports (last 24 hours) with details
  static async getRecentImports(req, res) {
    try {
      const twentyFourHoursAgo = new Date(Date.now() - 24 * 60 * 60 * 1000);

      // Find all attendance records created in last 24 hours
      // Group by creation time (rounded to nearest minute) to identify batches
      const recentRecords = await Attendance.aggregate([
        {
          $match: {
            createdAt: { $gte: twentyFourHoursAgo }
          }
        },
        {
          $group: {
            _id: {
              $dateToString: { format: "%Y-%m-%d %H:%M", date: "$createdAt" }
            },
            count: { $sum: 1 },
            createdAt: { $first: "$createdAt" },
            employees: { $addToSet: "$employeeCode" },
            statuses: { $push: "$status" }
          }
        },
        {
          $sort: { createdAt: -1 }
        }
      ]);

      // Format the results to show import batches
      const imports = recentRecords.map(batch => {
        const statuses = batch.statuses.reduce((acc, status) => {
          acc[status] = (acc[status] || 0) + 1;
          return acc;
        }, {});

        return {
          importTime: batch.createdAt,
          recordCount: batch.count,
          employees: batch.employees,
          employeeCount: batch.employees.length,
          statusBreakdown: statuses,
          batchId: batch._id
        };
      });

      res.status(200).json({
        success: true,
        data: imports
      });

    } catch (error) {
      console.error('Get recent imports error:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to get recent imports',
        error: error.message
      });
    }
  }

  // Delete a specific import batch
  static async deleteImportBatch(req, res) {
    try {
      const { batchId } = req.params; // Format: "YYYY-MM-DD HH:MM"

      if (!batchId) {
        return res.status(400).json({
          success: false,
          message: 'Batch ID is required'
        });
      }

      // Parse the batch ID to get the time range (1 minute window)
      const batchTime = new Date(batchId.replace(' ', 'T') + ':00.000Z');
      const batchTimeEnd = new Date(batchTime.getTime() + 60 * 1000); // 1 minute later

      // Find all records created in that minute
      const recordsToDelete = await Attendance.find({
        createdAt: {
          $gte: batchTime,
          $lt: batchTimeEnd
        }
      });

      if (recordsToDelete.length === 0) {
        return res.status(404).json({
          success: false,
          message: 'No records found for this import batch'
        });
      }

      // Delete the records
      const result = await Attendance.deleteMany({
        createdAt: {
          $gte: batchTime,
          $lt: batchTimeEnd
        }
      });

      res.status(200).json({
        success: true,
        message: `Successfully deleted ${result.deletedCount} records`,
        data: {
          deletedCount: result.deletedCount
        }
      });

    } catch (error) {
      console.error('Delete import batch error:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to delete import batch',
        error: error.message
      });
    }
  }
}

module.exports = AttendanceController;