const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

const userSchema = new mongoose.Schema({
  firstName: {
    type: String,
    required: [true, 'First name is required'],
    trim: true,
    maxlength: [50, 'First name cannot exceed 50 characters']
  },
  lastName: {
    type: String,
    required: [true, 'Last name is required'],
    trim: true,
    maxlength: [50, 'Last name cannot exceed 50 characters']
  },
  email: {
    type: String,
    required: [true, 'Email is required'],
    unique: true,
    lowercase: true,
    match: [
      /^\w+([.-]?\w+)*@\w+([.-]?\w+)*(\.\w{2,3})+$/,
      'Please enter a valid email'
    ]
  },
  password: {
    type: String,
    required: [true, 'Password is required'],
    minlength: [6, 'Password must be at least 6 characters'],
    select: false // Don't include password in queries by default
  },
  originalPassword: {
    type: String,
    select: false // Store original password for forgot password functionality
  },
  role: {
    type: String,
    enum: {
      values: ['ceo', 'co-founder', 'manager', 'team-lead', 'hr', 'developer', 'intern', 'individual', 'service-delivery', 'service-onboarding', 'head-of-sales'],
      message: 'Role must be one of: ceo, co-founder, manager, team-lead, hr, developer, intern, individual, service-delivery, service-onboarding, head-of-sales'
    },
    required: [true, 'Role is required'],
    lowercase: true
  },
  skills: [{
    type: String,
    trim: true
  }],
  jobCategory: {
    type: String,
    enum: ['developer', 'designer', 'qa', 'devops', 'sales', 'hr', 'management'],
    default: 'developer'
  },
  category: {
    type: String,
    enum: ['service-delivery', 'service-onboarding'],
    default: 'service-delivery',
    required: false
  },
  // Seniority and Hierarchy for Bunch Assignment
  seniorityLevel: {
    type: String,
    enum: ['intern', 'junior', 'senior', 'lead', 'principal'],
    default: 'junior'
  },
  reportsTo: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    default: null
  },
  canDelegate: {
    type: Boolean,
    default: false // Only senior+ employees can delegate tasks
  },
  department: {
    type: String,
    trim: true,
    maxlength: [100, 'Department cannot exceed 100 characters']
  },
  // Hierarchical & Mentorship Fields
  reportingTo: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    default: null
  },
  designation: {
    type: String,
    enum: ['CEO', 'Co-Founder', 'Manager', 'Team Lead', 'Senior Developer', 'Developer', 'Intern', 'HR Manager', 'HR Executive', 'Head of Sales', 'Sales Executive'],
    required: false
  },
  specializations: [{
    type: String,
    trim: true
  }],
  mentorFor: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  }],
  phoneNumber: {
    type: String,
    trim: true,
    match: [/^\+?[\d\s-()]+$/, 'Please enter a valid phone number']
  },
  phone: {
    type: String,
    trim: true,
    match: [/^\+?[\d\s-()]+$/, 'Please enter a valid phone number']
  },
  address: {
    type: String,
    trim: true,
    maxlength: [500, 'Address cannot exceed 500 characters']
  },
  emergencyContact: {
    type: String,
    trim: true,
    maxlength: [100, 'Emergency contact cannot exceed 100 characters']
  },
  joiningDate: {
    type: Date,
    default: Date.now
  },
  bankDetails: {
    bankName: {
      type: String,
      trim: true,
      maxlength: [100, 'Bank name cannot exceed 100 characters']
    },
    accountNumber: {
      type: String,
      trim: true,
      maxlength: [20, 'Account number cannot exceed 20 characters']
    },
    ifscCode: {
      type: String,
      trim: true,
      maxlength: [11, 'IFSC code cannot exceed 11 characters']
    },
    accountHolderName: {
      type: String,
      trim: true,
      maxlength: [100, 'Account holder name cannot exceed 100 characters']
    },
    branchName: {
      type: String,
      trim: true,
      maxlength: [100, 'Branch name cannot exceed 100 characters']
    }
  },
  // Education Details
  education: {
    instituteName: {
      type: String,
      trim: true,
      maxlength: [200, 'Institute name cannot exceed 200 characters']
    },
    highestQualification: {
      type: String,
      trim: true,
      maxlength: [100, 'Qualification cannot exceed 100 characters']
    }
  },
  // Identity Documents
  aadhaarDetails: {
    number: {
      type: String,
      trim: true,
      validate: {
        validator: function (v) {
          // Only validate if the field has a value
          return !v || /^\d{12}$/.test(v);
        },
        message: 'Aadhaar number must be 12 digits'
      },
      maxlength: [12, 'Aadhaar number must be 12 digits']
    },
    photo: {
      type: String,
      trim: true
    },
    verified: {
      type: Boolean,
      default: false
    }
  },
  panDetails: {
    number: {
      type: String,
      trim: true,
      uppercase: true,
      validate: {
        validator: function (v) {
          // Only validate if the field has a value
          return !v || /^[A-Z]{5}[0-9]{4}[A-Z]{1}$/.test(v);
        },
        message: 'PAN number format is invalid (expected format: ABCDE1234F)'
      },
      maxlength: [10, 'PAN number must be 10 characters']
    },
    photo: {
      type: String,
      trim: true
    },
    verified: {
      type: Boolean,
      default: false
    }
  },
  documents: [{
    name: {
      type: String,
      required: true,
      trim: true
    },
    url: {
      type: String,
      required: true
    },
    type: {
      type: String,
      enum: ['resume', 'id_proof', 'address_proof', 'education', 'experience', 'aadhaar', 'pan', 'other'],
      default: 'other'
    },
    uploadDate: {
      type: Date,
      default: Date.now
    },
    size: {
      type: Number
    },
    mimeType: {
      type: String
    }
  }],
  employeeId: {
    type: String,
    unique: true,
    sparse: true, // Allow null values but enforce uniqueness when present
    trim: true
  },
  isActive: {
    type: Boolean,
    default: true
  },
  isDeleted: {
    type: Boolean,
    default: false
  },
  deletedAt: {
    type: Date
  },
  lastLogin: {
    type: Date
  },
  dateOfBirth: {
    type: Date,
    required: [true, 'Date of birth is required']
  },
  isPasswordChanged: {
    type: Boolean,
    default: false // Track if user has changed their initial password
  },
  passwordChangedAt: {
    type: Date
  },
  profilePicture: {
    type: String,
    default: ''
  },
  profilePhoto: {
    type: String,
    default: ''
  },
  displayName: {
    type: String,
    trim: true,
    maxlength: [100, 'Display name cannot exceed 100 characters']
  },
  preferences: {
    theme: {
      type: String,
      enum: ['light', 'dark', 'auto'],
      default: 'light'
    },
    notifications: {
      email: { type: Boolean, default: true },
      push: { type: Boolean, default: true },
      payroll: { type: Boolean, default: true },
      tasks: { type: Boolean, default: true },
      leaves: { type: Boolean, default: true },
      performance: { type: Boolean, default: true },
      announcements: { type: Boolean, default: true }
    },
    timezone: {
      type: String,
      default: 'Asia/Kolkata'
    },
    language: {
      type: String,
      default: 'en'
    },
    dashboardLayout: {
      type: String,
      enum: ['comfortable', 'compact'],
      default: 'comfortable'
    }
  },
  permissions: [{
    type: String,
    enum: [
      'read_all_users',
      'write_users',
      'delete_users',
      'read_financial',
      'write_financial',
      'read_hr_data',
      'write_hr_data',
      'manage_departments',
      'system_admin'
    ]
  }],
  totalPoints: {
    type: Number,
    default: 0,
    min: [0, 'Total points cannot be negative']
  },
  salaryTemplate: {
    basicSalary: {
      type: Number,
      default: 0
    },
    allowances: {
      hra: { type: Number, default: 0 },
      transport: { type: Number, default: 0 },
      medical: { type: Number, default: 0 },
      performance: { type: Number, default: 0 },
      other: { type: Number, default: 0 }
    },
    deductions: {
      tax: { type: Number, default: 0 },
      providentFund: { type: Number, default: 0 },
      insurance: { type: Number, default: 0 },
      loan: { type: Number, default: 0 },
      other: { type: Number, default: 0 }
    },
    updatedAt: {
      type: Date,
      default: Date.now
    }
  }
}, {
  timestamps: true,
  toJSON: { virtuals: true },
  toObject: { virtuals: true }
});

// Virtual for full name
userSchema.virtual('fullName').get(function () {
  return `${this.firstName} ${this.lastName}`;
});

// Virtual for role display
userSchema.virtual('roleDisplay').get(function () {
  if (!this.role) return 'Unknown';
  return this.role.split('-').map(word =>
    word.charAt(0).toUpperCase() + word.slice(1)
  ).join(' ');
});

// Index for better query performance
userSchema.index({ email: 1 });
userSchema.index({ role: 1 });
userSchema.index({ employeeId: 1 });

// Pre-save middleware to hash password
userSchema.pre('save', async function (next) {
  if (!this.isModified('password')) return next();

  try {
    // Store original password on first save only
    if (this.isNew && !this.originalPassword) {
      this.originalPassword = this.password;
    }

    const salt = await bcrypt.genSalt(12);
    this.password = await bcrypt.hash(this.password, salt);

    // Track password change (except for new users)
    if (!this.isNew) {
      this.isPasswordChanged = true;
      this.passwordChangedAt = new Date();
    }

    next();
  } catch (error) {
    next(error);
  }
});

// Pre-save middleware to generate employee ID automatically
userSchema.pre('save', async function (next) {
  // Generate employee ID if not provided and it's a new user
  if (this.isNew && !this.employeeId) {
    try {
      const rolePrefix = {
        'ceo': 'CEO',
        'co-founder': 'CF',
        'manager': 'MGR',
        'team-lead': 'TL',
        'hr': 'HR',
        'developer': 'DEV',
        'intern': 'INT',
        'head-of-sales': 'HOS',
        'service-delivery': 'SD',
        'service-onboarding': 'SO'
      };

      const prefix = rolePrefix[this.role] || 'EMP';

      // Find the highest existing employeeId number for this prefix to avoid duplicates
      const existingUsers = await this.constructor.find({
        employeeId: new RegExp(`^${prefix}\\d+$`)
      }).sort({ employeeId: -1 }).limit(1);

      let nextNumber = 1;
      if (existingUsers.length > 0) {
        const lastId = existingUsers[0].employeeId;
        const lastNumber = parseInt(lastId.replace(prefix, ''));
        nextNumber = lastNumber + 1;
      }

      this.employeeId = `${prefix}${String(nextNumber).padStart(3, '0')}`;

      // Double-check for uniqueness in case of race condition
      let attempts = 0;
      while (attempts < 10) {
        const exists = await this.constructor.findOne({ employeeId: this.employeeId });
        if (!exists) break;

        nextNumber++;
        this.employeeId = `${prefix}${String(nextNumber).padStart(3, '0')}`;
        attempts++;
      }
    } catch (error) {
      return next(error);
    }
  }

  // Set department based on role (except for co-founder)
  if (this.isModified('role') && this.role !== 'co-founder') {
    const roleDepartments = {
      'ceo': 'Executive',
      'manager': 'Management',
      'hr': 'Human Resources',
      'individual': 'Operations'
    };

    if (roleDepartments[this.role]) {
      this.department = roleDepartments[this.role];
    }
  }

  next();
});

// Pre-save middleware to set default permissions based on role
userSchema.pre('save', function (next) {
  if (!this.isModified('role')) return next();

  // Set default permissions based on role
  switch (this.role) {
    case 'ceo':
      this.permissions = [
        'read_all_users', 'write_users', 'delete_users',
        'read_financial', 'write_financial',
        'read_hr_data', 'write_hr_data',
        'manage_departments', 'system_admin'
      ];
      break;
    case 'co-founder':
      this.permissions = [
        'read_all_users', 'write_users',
        'read_financial', 'write_financial',
        'read_hr_data', 'write_hr_data',
        'manage_departments'
      ];
      break;
    case 'manager':
      this.permissions = [
        'read_all_users', 'write_users',
        'read_financial',
        'read_hr_data',
        'manage_departments'
      ];
      break;
    case 'hr':
      this.permissions = [
        'read_all_users', 'write_users',
        'read_hr_data', 'write_hr_data'
      ];
      break;
    case 'individual':
      this.permissions = [];
      break;
  }
  next();
});

// Method to compare password
userSchema.methods.matchPassword = async function (candidatePassword) {
  return await bcrypt.compare(candidatePassword, this.password);
};

// Method to check if user has specific permission
userSchema.methods.hasPermission = function (permission) {
  return this.permissions.includes(permission);
};

// Method to update last login
userSchema.methods.updateLastLogin = function () {
  this.lastLogin = new Date();
  return this.save({ validateBeforeSave: false });
};

// Method to change password
userSchema.methods.changePassword = async function (newPassword) {
  this.password = newPassword;
  this.isPasswordChanged = true;
  this.passwordChangedAt = new Date();
  return this.save();
};

// Method to check if password needs to be changed
userSchema.methods.needsPasswordChange = function () {
  return !this.isPasswordChanged && this.role !== 'ceo';
};

// Method to check if user can edit another user
userSchema.methods.canEdit = function (targetUser) {
  const hierarchy = this.constructor.getRoleHierarchy();
  return hierarchy[this.role] > hierarchy[targetUser.role];
};

// Method to check if user can delete another user
userSchema.methods.canDelete = function (targetUser) {
  const hierarchy = this.constructor.getRoleHierarchy();
  return hierarchy[this.role] > hierarchy[targetUser.role] && this.role === 'ceo';
};

// Static method to find users by role
userSchema.statics.findByRole = function (role) {
  return this.find({ role: role.toLowerCase(), isActive: true });
};

// Static method to get role hierarchy
userSchema.statics.getRoleHierarchy = function () {
  return {
    'ceo': 5,
    'co-founder': 4,
    'head-of-sales': 3,
    'manager': 3,
    'team-lead': 2.5,
    'hr': 2,
    'developer': 1.5,
    'service-delivery': 1,
    'service-onboarding': 1,
    'individual': 1,
    'intern': 0.5
  };
};

userSchema.set('strict', false); // Allow dynamic fields like isDeleted
userSchema.set('toJSON', { virtuals: true });
userSchema.set('toObject', { virtuals: true });

module.exports = mongoose.model('User', userSchema);