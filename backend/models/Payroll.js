const mongoose = require('mongoose');

const payrollSchema = new mongoose.Schema({
  employeeId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: [true, 'Employee ID is required']
  },
  employeeCode: {
    type: String,
    required: [true, 'Employee code is required']
  },
  salaryMonth: {
    type: Date,
    required: [true, 'Salary month is required'],
    index: true
  },
  basicSalary: {
    type: Number,
    required: [true, 'Basic salary is required'],
    min: [0, 'Basic salary cannot be negative']
  },
  allowances: {
    hra: {
      type: Number,
      default: 0,
      min: [0, 'HRA cannot be negative']
    },
    transport: {
      type: Number,
      default: 0,
      min: [0, 'Transport allowance cannot be negative']
    },
    medical: {
      type: Number,
      default: 0,
      min: [0, 'Medical allowance cannot be negative']
    },
    performance: {
      type: Number,
      default: 0,
      min: [0, 'Performance allowance cannot be negative']
    },
    other: {
      type: Number,
      default: 0,
      min: [0, 'Other allowances cannot be negative']
    }
  },
  deductions: {
    tax: {
      type: Number,
      default: 0,
      min: [0, 'Tax cannot be negative']
    },
    providentFund: {
      type: Number,
      default: 0,
      min: [0, 'Provident fund cannot be negative']
    },
    insurance: {
      type: Number,
      default: 0,
      min: [0, 'Insurance cannot be negative']
    },
    loan: {
      type: Number,
      default: 0,
      min: [0, 'Loan deduction cannot be negative']
    },
    other: {
      type: Number,
      default: 0,
      min: [0, 'Other deductions cannot be negative']
    }
  },
  bonus: {
    type: Number,
    default: 0,
    min: [0, 'Bonus cannot be negative']
  },
  overtime: {
    hours: {
      type: Number,
      default: 0,
      min: [0, 'Overtime hours cannot be negative']
    },
    rate: {
      type: Number,
      default: 0,
      min: [0, 'Overtime rate cannot be negative']
    },
    amount: {
      type: Number,
      default: 0,
      min: [0, 'Overtime amount cannot be negative']
    }
  },
  workingDays: {
    total: {
      type: Number,
      default: 22,
      min: [1, 'Total working days must be at least 1']
    },
    present: {
      type: Number,
      default: 22,
      min: [0, 'Present days cannot be negative']
    },
    absent: {
      type: Number,
      default: 0,
      min: [0, 'Absent days cannot be negative']
    },
    leave: {
      type: Number,
      default: 0,
      min: [0, 'Leave days cannot be negative']
    }
  },
  grossSalary: {
    type: Number,
    default: 0
  },
  totalDeductions: {
    type: Number,
    default: 0
  },
  netSalary: {
    type: Number,
    default: 0
  },
  paymentStatus: {
    type: String,
    enum: ['pending', 'processing', 'paid', 'on-hold'],
    default: 'pending'
  },
  paymentDate: {
    type: Date
  },
  paymentMethod: {
    type: String,
    enum: ['bank-transfer', 'cash', 'cheque'],
    default: 'bank-transfer'
  },
  bankDetails: {
    accountNumber: String,
    ifscCode: String,
    bankName: String,
    transactionId: String
  },
  remarks: {
    type: String,
    maxlength: [500, 'Remarks cannot exceed 500 characters']
  },
  incentiveDetails: {
    tier: {
      type: String,
      enum: ['Bronze', 'Silver', 'Gold', 'Platinum', 'Diamond', null],
      default: null
    },
    tierEmoji: {
      type: String,
      default: null
    },
    productivityScore: {
      type: Number,
      min: [0, 'Productivity score cannot be negative'],
      max: [100, 'Productivity score cannot exceed 100'],
      default: 0
    },
    totalPoints: {
      type: Number,
      min: [0, 'Points cannot be negative'],
      default: 0
    },
    incentiveAmount: {
      type: Number,
      min: [0, 'Incentive amount cannot be negative'],
      default: 0
    },
    criteriaUsed: {
      type: String,
      enum: ['score', 'points', 'both', 'none'],
      default: 'none'
    },
    matchedBy: {
      type: String,
      default: ''
    },
    calculatedAt: {
      type: Date,
      default: null
    }
  },
  createdBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: [true, 'Created by is required']
  },
  updatedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  },
  isActive: {
    type: Boolean,
    default: true
  }
}, {
  timestamps: true,
  toJSON: { virtuals: true },
  toObject: { virtuals: true }
});

// Compound index to ensure one payroll record per employee per month
payrollSchema.index({ employeeId: 1, salaryMonth: 1 }, { unique: true });

// Index for better query performance
payrollSchema.index({ paymentStatus: 1 });
payrollSchema.index({ createdBy: 1 });
payrollSchema.index({ employeeCode: 1 });

// Virtual for month/year display
payrollSchema.virtual('salaryPeriod').get(function() {
  if (!this.salaryMonth) return '';
  const date = new Date(this.salaryMonth);
  const month = date.toLocaleString('default', { month: 'long' });
  const year = date.getFullYear();
  return `${month} ${year}`;
});

// Virtual for attendance percentage
payrollSchema.virtual('attendancePercentage').get(function() {
  if (!this.workingDays.total || this.workingDays.total === 0) return 0;
  return ((this.workingDays.present / this.workingDays.total) * 100).toFixed(2);
});

// Pre-save middleware to calculate totals
payrollSchema.pre('save', function(next) {
  // Calculate total allowances
  const totalAllowances = Object.values(this.allowances).reduce((sum, allowance) => sum + (allowance || 0), 0);
  
  // Calculate total deductions
  this.totalDeductions = Object.values(this.deductions).reduce((sum, deduction) => sum + (deduction || 0), 0);
  
  // Calculate overtime amount if not manually set
  if (this.overtime.hours && this.overtime.rate) {
    this.overtime.amount = this.overtime.hours * this.overtime.rate;
  }
  
  // Calculate gross salary
  this.grossSalary = this.basicSalary + totalAllowances + this.bonus + this.overtime.amount;
  
  // Calculate net salary (considering attendance)
  let adjustedGrossSalary = this.grossSalary;
  
  // Adjust for attendance if present days are less than total
  if (this.workingDays.present < this.workingDays.total) {
    const attendanceRatio = this.workingDays.present / this.workingDays.total;
    adjustedGrossSalary = this.grossSalary * attendanceRatio;
  }
  
  this.netSalary = Math.max(0, adjustedGrossSalary - this.totalDeductions);
  
  // Update absent days calculation
  this.workingDays.absent = this.workingDays.total - this.workingDays.present - this.workingDays.leave;
  
  next();
});

// Static method to get payroll summary for a specific month
payrollSchema.statics.getMonthlySummary = function(month, year) {
  const startDate = new Date(year, month - 1, 1);
  const endDate = new Date(year, month, 0);
  
  return this.aggregate([
    {
      $match: {
        salaryMonth: { $gte: startDate, $lte: endDate },
        isActive: true
      }
    },
    {
      $group: {
        _id: null,
        totalEmployees: { $sum: 1 },
        totalGrossSalary: { $sum: '$grossSalary' },
        totalNetSalary: { $sum: '$netSalary' },
        totalDeductions: { $sum: '$totalDeductions' },
        paidCount: {
          $sum: { $cond: [{ $eq: ['$paymentStatus', 'paid'] }, 1, 0] }
        },
        pendingCount: {
          $sum: { $cond: [{ $eq: ['$paymentStatus', 'pending'] }, 1, 0] }
        }
      }
    }
  ]);
};

// Static method to get employee payroll history
payrollSchema.statics.getEmployeeHistory = function(employeeId, limit = 12) {
  return this.find({ employeeId, isActive: true })
    .sort({ salaryMonth: -1 })
    .limit(limit)
    .populate('employeeId', 'firstName lastName employeeId email')
    .populate('createdBy', 'firstName lastName')
    .populate('updatedBy', 'firstName lastName');
};

// Method to mark as paid
payrollSchema.methods.markAsPaid = function(transactionId, paymentDate) {
  this.paymentStatus = 'paid';
  this.paymentDate = paymentDate || new Date();
  if (transactionId) {
    this.bankDetails.transactionId = transactionId;
  }
  return this.save();
};

// Method to calculate take-home pay breakdown
payrollSchema.methods.getPayBreakdown = function() {
  const totalAllowances = Object.values(this.allowances).reduce((sum, allowance) => sum + (allowance || 0), 0);
  
  return {
    basicSalary: this.basicSalary,
    allowances: {
      total: totalAllowances,
      breakdown: this.allowances
    },
    bonus: this.bonus,
    overtime: this.overtime.amount,
    grossSalary: this.grossSalary,
    deductions: {
      total: this.totalDeductions,
      breakdown: this.deductions
    },
    netSalary: this.netSalary,
    attendance: {
      percentage: this.attendancePercentage,
      details: this.workingDays
    }
  };
};

module.exports = mongoose.model('Payroll', payrollSchema);