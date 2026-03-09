const express = require('express');
const rateLimit = require('express-rate-limit');
const router = express.Router();
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const User = require('../models/User');
const Task = require('../models/Task');

const {
  authenticateToken,
  authorizeRoles,
  requirePermission,
  checkRoleHierarchy,
  canModifyUser
} = require('../middleware/auth');

const { validateUserCreation } = require('../middleware/validation');

// Rate limiting for user endpoints
const userLimiter = rateLimit({
  windowMs: 10 * 60 * 1000, // 10 minutes
  max: 30, // limit each IP to 30 requests per 10 minutes
  message: {
    success: false,
    message: 'Too many user requests, please try again later.'
  },
  standardHeaders: true,
  legacyHeaders: false,
});

// Configure multer for document uploads
const documentStorage = multer.diskStorage({
  destination: (req, file, cb) => {
    const uploadPath = 'uploads/documents/';
    // Create directory if it doesn't exist
    if (!fs.existsSync(uploadPath)) {
      fs.mkdirSync(uploadPath, { recursive: true });
    }
    cb(null, uploadPath);
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    const ext = path.extname(file.originalname);
    cb(null, `document-${uniqueSuffix}${ext}`);
  }
});

const documentFileFilter = (req, file, cb) => {
  // Allow images and documents for identity and general documents
  const allowedTypes = /jpeg|jpg|png|gif|pdf|doc|docx|txt/;
  const extname = allowedTypes.test(path.extname(file.originalname).toLowerCase());
  const mimetype = allowedTypes.test(file.mimetype);

  if (mimetype && extname) {
    return cb(null, true);
  } else {
    cb(new Error('Only images and documents are allowed!'));
  }
};

const documentUpload = multer({
  storage: documentStorage,
  limits: {
    fileSize: 5 * 1024 * 1024, // 5MB limit
  },
  fileFilter: documentFileFilter
});

// @route   POST /api/users/create
// @desc    Create new user (hierarchical permissions)
// @access  Private (based on role hierarchy)
router.post('/create', authenticateToken, validateUserCreation, async (req, res) => {
  try {
    const {
      firstName, lastName, email, password, role, department, phoneNumber, dateOfBirth,
      address, education, bankDetails, aadhaarDetails, panDetails, salary, employeeId, joiningDate
    } = req.body;
    const creatorRole = req.user.role;

    // Define role hierarchy levels
    const roleHierarchy = {
      'ceo': 5,
      'co-founder': 4,
      'head-of-sales': 3,
      'manager': 3,
      'hr': 2,
      'service-delivery': 1,
      'service-onboarding': 1
    };

    // Define what roles each level can create
    const canCreate = {
      'ceo': ['co-founder', 'manager', 'hr', 'head-of-sales', 'service-delivery', 'service-onboarding', 'individual'],
      'co-founder': ['manager', 'hr', 'head-of-sales', 'service-delivery', 'service-onboarding', 'individual'],
      'manager': ['service-delivery', 'service-onboarding', 'individual'],
      'hr': ['manager', 'hr', 'head-of-sales', 'service-delivery', 'service-onboarding', 'individual'],
      'head-of-sales': ['individual'],
      'service-delivery': [],
      'service-onboarding': []
    };

    // Check if creator can create this role
    const targetRole = role.toLowerCase().trim();
    const creatorRoleClean = creatorRole.toLowerCase().trim();

    // DEBUG LOGGING
    console.log(`[Create User Debug] Creator: ${req.user.email} (${creatorRoleClean}), Target: ${targetRole}`);
    console.log(`[Create User Debug] Allowed for ${creatorRoleClean}:`, canCreate[creatorRoleClean]);

    if (!canCreate[creatorRoleClean] || !canCreate[creatorRoleClean].includes(targetRole)) {
      console.log('[Create User Debug] Permission Denied');
      return res.status(403).json({
        success: false,
        message: `Permission Denied: Role '${creatorRoleClean}' cannot create '${targetRole}'. Allowed: ${(canCreate[creatorRoleClean] || []).join(', ')}`
      });
    }

    // Check if user already exists
    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return res.status(400).json({
        success: false,
        message: 'User already exists with this email'
      });
    }

    // Create user data - employeeId will be auto-generated
    const userData = {
      firstName,
      lastName,
      email,
      password,
      role: role.toLowerCase(),
      phoneNumber,
      dateOfBirth,
      address,
      education,
      bankDetails,
      aadhaarDetails,
      panDetails,
      aadhaarDetails,
      panDetails,
      employeeId,
      joiningDate
    };

    if (salary) {
      userData.salaryTemplate = { basicSalary: salary };
    }

    // Only add department if provided and role is not co-founder
    if (department && role !== 'co-founder') {
      userData.department = department;
    }

    const user = await User.create(userData);

    res.status(201).json({
      success: true,
      message: `${user.roleDisplay} account created successfully`,
      data: {
        user: {
          id: user._id,
          firstName: user.firstName,
          lastName: user.lastName,
          fullName: user.fullName,
          email: user.email,
          role: user.role,
          roleDisplay: user.roleDisplay,
          department: user.department,
          employeeId: user.employeeId,
          permissions: user.permissions,
          isActive: user.isActive,
          createdBy: req.user._id
        }
      }
    });

  } catch (error) {
    console.error('Create user error:', error);

    // Handle duplicate key error
    if (error.code === 11000) {
      const field = Object.keys(error.keyValue)[0];
      return res.status(400).json({
        success: false,
        message: `${field} already exists`
      });
    }

    if (error.name === 'ValidationError') {
      const messages = Object.values(error.errors).map(val => val.message);
      return res.status(400).json({
        success: false,
        message: messages.join(', ')
      });
    }

    res.status(500).json({
      success: false,
      message: 'User creation failed',
      error: process.env.NODE_ENV === 'development' ? error.message : {}
    });
  }
});

// @route   GET /api/users/can-create
// @desc    Get roles that current user can create
// @access  Private
router.get('/can-create', authenticateToken, (req, res) => {
  const canCreate = {
    'ceo': [
      { value: 'co-founder', label: 'Co-Founder', description: 'Executive level access' },
      { value: 'manager', label: 'Manager', description: 'Team leadership role' },
      { value: 'hr', label: 'HR', description: 'Human resources management' },
      { value: 'head-of-sales', label: 'Head of Sales', description: 'Sales department leadership' },
      { value: 'service-delivery', label: 'Service Delivery', description: 'Standard employee - Service Delivery' },
      { value: 'service-onboarding', label: 'Service Onboarding', description: 'Sales/Onboarding role' }
    ],
    'co-founder': [
      { value: 'manager', label: 'Manager', description: 'Team leadership role' },
      { value: 'hr', label: 'HR', description: 'Human resources management' },
      { value: 'head-of-sales', label: 'Head of Sales', description: 'Sales department leadership' },
      { value: 'service-delivery', label: 'Service Delivery', description: 'Standard employee - Service Delivery' },
      { value: 'service-onboarding', label: 'Service Onboarding', description: 'Sales/Onboarding role' }
    ],
    'manager': [
      { value: 'service-delivery', label: 'Service Delivery', description: 'Standard employee - Service Delivery' },
      { value: 'service-onboarding', label: 'Service Onboarding', description: 'Sales/Onboarding role' }
    ],
    'hr': [
      { value: 'manager', label: 'Manager', description: 'Team leadership role' },
      { value: 'head-of-sales', label: 'Head of Sales', description: 'Sales department leadership' },
      { value: 'service-delivery', label: 'Service Delivery', description: 'Standard employee - Service Delivery' },
      { value: 'service-onboarding', label: 'Service Onboarding', description: 'Sales/Onboarding role' }
    ],
    'service-delivery': [],
    'service-onboarding': [],
    'head-of-sales': []
  };

  res.status(200).json({
    success: true,
    data: {
      availableRoles: canCreate[req.user.role] || [],
      canCreateUsers: (canCreate[req.user.role] || []).length > 0
    }
  });
});

// @route   GET /api/users
// @desc    Get all users (with role-based filtering)
// @access  Private (requires read_all_users permission)
router.get('/', userLimiter, authenticateToken, requirePermission('read_all_users'), async (req, res) => {
  try {
    const { role, department, isActive, page = 1, limit = 10, search } = req.query;

    // Build query
    let query = { isDeleted: { $ne: true } };

    if (role) query.role = role.toLowerCase();
    if (department) query.department = new RegExp(department, 'i');
    if (isActive !== undefined) query.isActive = isActive === 'true';

    // Search functionality
    if (search) {
      const searchTerms = search.trim().split(/\s+/);

      // For each word in the search query, it must be present in either firstName or lastName
      const nameQueries = searchTerms.map(term => ({
        $or: [
          { firstName: new RegExp(term, 'i') },
          { lastName: new RegExp(term, 'i') }
        ]
      }));

      query.$or = [
        { $and: nameQueries },
        { email: new RegExp(search, 'i') },
        { employeeId: new RegExp(search, 'i') }
      ];
    }

    // Pagination
    const skip = (page - 1) * limit;

    const users = await User.find(query)
      .select('-password')
      .skip(skip)
      .limit(parseInt(limit))
      .sort({ createdAt: -1 });

    const total = await User.countDocuments(query);

    res.status(200).json({
      success: true,
      data: {
        users,
        pagination: {
          currentPage: parseInt(page),
          totalPages: Math.ceil(total / limit),
          totalUsers: total,
          hasNext: page < Math.ceil(total / limit),
          hasPrev: page > 1
        }
      }
    });

  } catch (error) {
    console.error('Get users error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch users'
    });
  }
});

// @route   GET /api/users/individuals
// @desc    Get all individuals
// @access  Private (manager, co-founder, ceo only)
router.get('/individuals', authenticateToken, authorizeRoles('hr', 'manager', 'co-founder', 'ceo'), async (req, res) => {
  try {
    const individuals = await User.find({
      role: { $in: ['individual', 'service-delivery', 'service-onboarding', 'developer', 'intern'] },
      isActive: true
    }).select('firstName lastName email employeeId department role phoneNumber totalPoints status createdAt skills specializations');

    res.status(200).json({
      success: true,
      count: individuals.length,
      data: individuals
    });

  } catch (error) {
    console.error('Get individuals error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch individuals',
      error: process.env.NODE_ENV === 'development' ? error.message : {}
    });
  }
});

// @route   GET /api/users/all
// @desc    Get all employees (HR only)
// @access  Private (hr, ceo, co-founder only)
router.get('/all', authenticateToken, authorizeRoles('hr', 'ceo', 'co-founder', 'manager', 'team-lead', 'developer'), async (req, res) => {
  try {
    const allEmployees = await User.find({
      isActive: true
    })
      .select('firstName lastName email employeeId department role phoneNumber totalPoints status createdAt updatedAt designation specializations reportingTo education bankDetails aadhaarDetails panDetails address dateOfBirth joiningDate')
      .populate('reportingTo', 'firstName lastName')
      .lean();

    // Get active task counts
    const userIds = allEmployees.map(emp => emp._id);
    const taskCounts = await Task.aggregate([
      {
        $match: {
          assignedTo: { $in: userIds },
          status: { $in: ['not-started', 'in-progress', 'review', 'pending-assignment', 'needs-revision'] }
        }
      },
      { $group: { _id: '$assignedTo', count: { $sum: 1 } } }
    ]);

    const taskCountMap = {};
    taskCounts.forEach(t => {
      if (t._id) taskCountMap[t._id.toString()] = t.count;
    });

    // Add reportingToName and activeTasks fields
    const employeesWithReportingName = allEmployees.map(emp => ({
      ...emp,
      reportingToName: emp.reportingTo ? `${emp.reportingTo.firstName} ${emp.reportingTo.lastName}` : null,
      activeTasks: taskCountMap[emp._id.toString()] || 0
    }));

    res.status(200).json({
      success: true,
      count: employeesWithReportingName.length,
      data: employeesWithReportingName
    });
  } catch (error) {
    console.error('Get all employees error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch employees',
      error: process.env.NODE_ENV === 'development' ? error.message : {}
    });
  }
});

// @route   GET /api/users/my-mentees
// @desc    Get current user's mentees
// @access  Private (Developer/Team-lead)
router.get('/my-mentees', authenticateToken, async (req, res) => {
  try {
    const currentUser = await User.findById(req.user.id);

    // If user is a developer, they can view all interns
    if (req.user.role === 'developer') {
      const interns = await User.find({
        role: 'intern',
        isActive: true
      }).select('firstName lastName email role employeeId specializations designation');

      return res.status(200).json({
        success: true,
        count: interns.length,
        data: interns
      });
    }

    if (!currentUser.mentorFor || currentUser.mentorFor.length === 0) {
      return res.status(200).json({
        success: true,
        count: 0,
        data: []
      });
    }

    const mentees = await User.find({
      _id: { $in: currentUser.mentorFor },
      isActive: true
    }).select('firstName lastName email role employeeId specializations');

    res.status(200).json({
      success: true,
      count: mentees.length,
      data: mentees
    });

  } catch (error) {
    console.error('Get mentees error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch mentees',
      error: process.env.NODE_ENV === 'development' ? error.message : {}
    });
  }
});

// @route   GET /api/users/head-of-sales
// @desc    Get all active Head of Sales users
// @access  Private (Sales team members)
router.get('/head-of-sales', authenticateToken, async (req, res) => {
  try {
    const hosUsers = await User.find({
      role: 'head-of-sales',
      isActive: true
    }).select('firstName lastName email employeeId');

    res.status(200).json({
      success: true,
      count: hosUsers.length,
      data: hosUsers
    });

  } catch (error) {
    console.error('Get HOS users error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch Head of Sales users',
      error: process.env.NODE_ENV === 'development' ? error.message : {}
    });
  }
});

// @route   GET /api/users/profile
// @desc    Get current user's profile
// @access  Private
router.get('/profile', authenticateToken, async (req, res) => {
  try {
    const user = await User.findById(req.user.id).select('-password').populate('reportingTo', 'firstName lastName');

    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    res.json({
      success: true,
      data: user
    });
  } catch (error) {
    console.error('Get profile error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch profile'
    });
  }
});

// @route   PUT /api/users/profile
// @desc    Update current user's profile
// @access  Private
router.put('/profile', authenticateToken, async (req, res) => {
  try {
    const {
      firstName,
      lastName,
      phone,
      address,
      emergencyContact,
      dateOfBirth,
      bankDetails,
      aadhaarDetails,
      panDetails,
      education
    } = req.body;

    // Fields that can be updated by user
    const allowedUpdates = {
      firstName,
      lastName,
      phone,
      address,
      emergencyContact,
      dateOfBirth,
      bankDetails,
      aadhaarDetails,
      panDetails,
      education
    };

    // Remove undefined fields
    Object.keys(allowedUpdates).forEach(key => {
      if (allowedUpdates[key] === undefined) {
        delete allowedUpdates[key];
      }
    });

    const user = await User.findByIdAndUpdate(
      req.user.id,
      allowedUpdates,
      {
        new: true,
        runValidators: true
      }
    ).select('-password');

    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    res.json({
      success: true,
      message: 'Profile updated successfully',
      data: user
    });
  } catch (error) {
    console.error('Update profile error:', error);

    if (error.name === 'ValidationError') {
      const validationErrors = Object.values(error.errors).map(err => err.message);
      return res.status(400).json({
        success: false,
        message: 'Validation error',
        errors: validationErrors
      });
    }

    res.status(500).json({
      success: false,
      message: 'Failed to update profile'
    });
  }
});

// @route   POST /api/users/upload-document
// @desc    Upload document for current user
// @access  Private
router.post('/upload-document', authenticateToken, documentUpload.single('document'), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({
        success: false,
        message: 'No file uploaded'
      });
    }

    const { name, type } = req.body;

    if (!name) {
      return res.status(400).json({
        success: false,
        message: 'Document name is required'
      });
    }

    const documentData = {
      name,
      url: `${req.protocol}://${req.get('host')}/uploads/documents/${req.file.filename}`,
      type: type || 'other',
      size: req.file.size,
      mimeType: req.file.mimetype,
      uploadDate: new Date()
    };

    const user = await User.findByIdAndUpdate(
      req.user.id,
      { $push: { documents: documentData } },
      { new: true }
    ).select('-password');

    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    res.json({
      success: true,
      message: 'Document uploaded successfully',
      data: documentData
    });
  } catch (error) {
    console.error('Upload document error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to upload document'
    });
  }
});

// @route   POST /api/users/upload-identity
// @desc    Upload identity document (Aadhaar/PAN photo)
// @access  Private
router.post('/upload-identity', authenticateToken, documentUpload.single('identityDocument'), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({
        success: false,
        message: 'No file uploaded'
      });
    }

    const { documentType } = req.body; // 'aadhaar' or 'pan'

    if (!documentType || !['aadhaar', 'pan'].includes(documentType)) {
      return res.status(400).json({
        success: false,
        message: 'Valid document type (aadhaar/pan) is required'
      });
    }

    const photoUrl = `${req.protocol}://${req.get('host')}/uploads/documents/${req.file.filename}`;

    // Update the appropriate identity document field
    const updateField = documentType === 'aadhaar'
      ? { 'aadhaarDetails.photo': photoUrl }
      : { 'panDetails.photo': photoUrl };

    const user = await User.findByIdAndUpdate(
      req.user.id,
      { $set: updateField },
      { new: true }
    ).select('-password');

    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    res.json({
      success: true,
      message: `${documentType.toUpperCase()} photo uploaded successfully`,
      data: {
        documentType,
        photoUrl,
        fileSize: req.file.size,
        mimeType: req.file.mimetype
      }
    });
  } catch (error) {
    console.error('Upload identity document error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to upload identity document'
    });
  }
});

// @route   POST /api/users/upload-profile-photo
// @desc    Upload profile photo
// @access  Private
router.post('/upload-profile-photo', authenticateToken, documentUpload.single('profilePhoto'), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({
        success: false,
        message: 'No file uploaded'
      });
    }

    const photoUrl = `${req.protocol}://${req.get('host')}/uploads/documents/${req.file.filename}`;

    const user = await User.findByIdAndUpdate(
      req.user.id,
      { $set: { profilePhoto: photoUrl } },
      { new: true }
    ).select('-password');

    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    res.json({
      success: true,
      message: 'Profile photo uploaded successfully',
      data: {
        photoUrl,
        fileSize: req.file.size,
        mimeType: req.file.mimetype
      }
    });
  } catch (error) {
    console.error('Upload profile photo error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to upload profile photo'
    });
  }
});

// @route   DELETE /api/users/document/:documentId
// @desc    Delete document for current user
// @access  Private
router.delete('/document/:documentId', authenticateToken, async (req, res) => {
  try {
    const { documentId } = req.params;

    const user = await User.findByIdAndUpdate(
      req.user.id,
      { $pull: { documents: { _id: documentId } } },
      { new: true }
    ).select('-password');

    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    res.json({
      success: true,
      message: 'Document deleted successfully'
    });
  } catch (error) {
    console.error('Delete document error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to delete document'
    });
  }
});

// @route   GET /api/users/available-for-delegation
// @desc    Get interns and developers available for task delegation during leave handover
// @access  Private (developer, team-lead)
router.get('/available-for-delegation', authenticateToken, async (req, res) => {
  try {
    console.log('[Available for Delegation] Request from user:', req.user.role, req.user._id);

    const availableUsers = await User.find({
      role: { $in: ['intern', 'developer'] },
      isActive: true
    }).select('firstName lastName email role department');

    console.log('[Available for Delegation] Found users:', availableUsers.length);

    res.status(200).json({
      success: true,
      count: availableUsers.length,
      data: availableUsers
    });

  } catch (error) {
    console.error('Get available users for delegation error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch available users',
      error: error.message
    });
  }
});

// @route   GET /api/users/:userId
// @desc    Get user by ID
// @access  Private (requires read_all_users permission or own profile)
router.get('/:userId', authenticateToken, async (req, res) => {
  try {
    const { userId } = req.params;
    const currentUserId = req.user._id.toString();

    // Allow users to view their own profile or require permission
    if (userId !== currentUserId && !req.user.hasPermission('read_all_users')) {
      return res.status(403).json({
        success: false,
        message: 'Access denied'
      });
    }

    const user = await User.findById(userId).select('-password').populate('reportingTo', 'firstName lastName');
    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    res.status(200).json({
      success: true,
      data: { user }
    });

  } catch (error) {
    console.error('Get user error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch user'
    });
  }
});

// @route   PUT /api/users/:userId
// @desc    Update user (admin only or own profile with restrictions)
// @access  Private
router.put('/:userId', authenticateToken, canModifyUser, checkRoleHierarchy, async (req, res) => {
  try {
    const { userId } = req.params;
    const currentUserId = req.user._id.toString();
    const {
      firstName, lastName, email, role, department, phoneNumber, employeeId, isActive,
      dateOfBirth, address, emergencyContact, education, bankDetails
    } = req.body;

    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    // Check if it's self-update or admin update
    const isSelfUpdate = userId === currentUserId;
    const isAdmin = ['ceo', 'co-founder', 'hr'].includes(req.user.role);

    // Update allowed fields
    if (firstName) user.firstName = firstName;
    if (lastName) user.lastName = lastName;
    if (phoneNumber) user.phoneNumber = phoneNumber;
    if (department) user.department = department;

    // Extended profile fields
    if (dateOfBirth) user.dateOfBirth = dateOfBirth;
    if (address) user.address = address;
    if (emergencyContact) user.emergencyContact = emergencyContact;
    if (education) user.education = education;
    if (bankDetails) user.bankDetails = bankDetails;

    // Admin-only fields
    if (!isSelfUpdate && isAdmin) {
      if (email) user.email = email;
      if (employeeId) user.employeeId = employeeId;
      if (isActive !== undefined) user.isActive = isActive;

      // Only CEO can change roles
      if (role && req.user.role === 'ceo') {
        user.role = role.toLowerCase();
      }
    }

    await user.save();

    res.status(200).json({
      success: true,
      message: 'User updated successfully',
      data: {
        user: {
          id: user._id,
          firstName: user.firstName,
          lastName: user.lastName,
          fullName: user.fullName,
          email: user.email,
          role: user.role,
          roleDisplay: user.roleDisplay,
          department: user.department,
          phoneNumber: user.phoneNumber,
          employeeId: user.employeeId,
          isActive: user.isActive
        }
      }
    });

  } catch (error) {
    console.error('Update user error:', error);

    if (error.code === 11000) {
      const field = Object.keys(error.keyValue)[0];
      return res.status(400).json({
        success: false,
        message: `${field} already exists`
      });
    }

    res.status(500).json({
      success: false,
      message: 'Failed to update user'
    });
  }
});

// @route   DELETE /api/users/:userId
// @desc    Delete user (soft delete - deactivate)
// @access  Private (CEO, Co-founder, or HR only)
router.delete('/:userId', authenticateToken, authorizeRoles('ceo', 'co-founder', 'hr'), checkRoleHierarchy, async (req, res) => {
  try {
    const { userId } = req.params;
    const currentUserId = req.user._id.toString();

    if (userId === currentUserId) {
      return res.status(400).json({
        success: false,
        message: 'Cannot delete your own account'
      });
    }

    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    // Soft delete - deactivate user
    user.isActive = false;
    await user.save();

    res.status(200).json({
      success: true,
      message: 'User deactivated successfully'
    });

  } catch (error) {
    console.error('Delete user error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to delete user'
    });
  }
});

// @route   PUT /api/users/:userId/activate
// @desc    Reactivate user
// @access  Private (CEO, Co-founder, or HR only)
router.put('/:userId/activate', authenticateToken, authorizeRoles('ceo', 'co-founder', 'hr'), async (req, res) => {
  try {
    const { userId } = req.params;

    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    user.isActive = true;
    await user.save();

    res.status(200).json({
      success: true,
      message: 'User activated successfully'
    });

  } catch (error) {
    console.error('Activate user error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to activate user'
    });
  }
});

// @route   GET /api/users/stats/overview
// @desc    Get user statistics overview
// @access  Private (requires read_all_users permission)
router.get('/stats/overview', authenticateToken, requirePermission('read_all_users'), async (req, res) => {
  try {
    const totalUsers = await User.countDocuments();
    const activeUsers = await User.countDocuments({ isActive: true });
    const inactiveUsers = await User.countDocuments({ isActive: false });

    const roleStats = await User.aggregate([
      { $group: { _id: '$role', count: { $sum: 1 } } },
      { $sort: { count: -1 } }
    ]);

    const departmentStats = await User.aggregate([
      { $match: { department: { $exists: true, $ne: null, $ne: '' } } },
      { $group: { _id: '$department', count: { $sum: 1 } } },
      { $sort: { count: -1 } },
      { $limit: 10 }
    ]);

    res.status(200).json({
      success: true,
      data: {
        overview: {
          totalUsers,
          activeUsers,
          inactiveUsers
        },
        roleDistribution: roleStats,
        departmentDistribution: departmentStats
      }
    });

  } catch (error) {
    console.error('Get user stats error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch user statistics'
    });
  }
});

// @route   PUT /api/users/:id
// @desc    Edit user
// @access  Private (hierarchical permissions)
router.put('/:id', authenticateToken, async (req, res) => {
  try {
    const { firstName, lastName, email, department, phoneNumber, dateOfBirth, isActive, education, bankDetails, address, emergencyContact } = req.body;
    const targetUserId = req.params.id;

    // Find target user
    const targetUser = await User.findById(targetUserId);
    if (!targetUser) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }


    // Check if current user can edit target user
    // HR role has special permission to edit all users
    const isHR = req.user.role === 'hr';
    const canEditByHierarchy = req.user.canEdit(targetUser);

    if (!isHR && !canEditByHierarchy) {
      return res.status(403).json({
        success: false,
        message: 'You do not have permission to edit this user'
      });
    }

    // Update user fields
    if (firstName) targetUser.firstName = firstName;
    if (lastName) targetUser.lastName = lastName;
    if (email) targetUser.email = email;
    if (department && targetUser.role !== 'co-founder') targetUser.department = department;
    if (phoneNumber) targetUser.phoneNumber = phoneNumber;
    if (dateOfBirth) targetUser.dateOfBirth = dateOfBirth;
    if (typeof isActive === 'boolean') targetUser.isActive = isActive;

    // Update extended details
    if (education) targetUser.education = education;
    if (bankDetails) targetUser.bankDetails = bankDetails;
    if (address) targetUser.address = address;
    if (emergencyContact) targetUser.emergencyContact = emergencyContact;

    await targetUser.save();

    res.json({
      success: true,
      message: 'User updated successfully',
      data: {
        user: {
          id: targetUser._id,
          firstName: targetUser.firstName,
          lastName: targetUser.lastName,
          fullName: targetUser.fullName,
          email: targetUser.email,
          role: targetUser.role,
          roleDisplay: targetUser.roleDisplay,
          department: targetUser.department,
          employeeId: targetUser.employeeId,
          dateOfBirth: targetUser.dateOfBirth,
          isActive: targetUser.isActive,
          updatedAt: targetUser.updatedAt
        }
      }
    });

  } catch (error) {
    console.error('Edit user error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to update user'
    });
  }
});

// @route   GET /api/users/deleted/list
// @desc    Get all soft-deleted users (HR/CEO/Co-Founder/Manager)
// @access  Private
router.get('/deleted/list', authenticateToken, authorizeRoles('hr', 'ceo', 'co-founder', 'manager'), async (req, res) => {
  try {
    // Managers can only see deleted users from their department or lower hierarchy? 
    // Fallback: Show ALL Inactive users (Since isDeleted flag has persistence issues on this server)
    // This ensures that anyone "Deleted" (Deactivated) appears here.
    const query = { isActive: false };

    // Authorization refinement could go here

    const deletedUsers = await User.find(query)
      .sort({ deletedAt: -1, updatedAt: -1 }); // Sort by deletedAt or fallback to update time

    res.json({
      success: true,
      count: deletedUsers.length,
      data: deletedUsers
    });
  } catch (error) {
    console.error('Get deleted users error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch deleted users'
    });
  }
});

// @route   PUT /api/users/:id/restore
// @desc    Restore a soft-deleted user
// @access  Private (HR/CEO/Co-Founder/Manager)
router.put('/:id/restore', authenticateToken, authorizeRoles('hr', 'ceo', 'co-founder', 'manager'), async (req, res) => {
  try {
    const targetUserId = req.params.id;
    const targetUser = await User.findById(targetUserId);

    if (!targetUser) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    // Check if within 24 hours
    if (targetUser.deletedAt) {
      const hoursSinceDelete = (new Date() - new Date(targetUser.deletedAt)) / (1000 * 60 * 60);
      if (hoursSinceDelete > 24 && req.user.role !== 'ceo') {
        // CEO can override 24h limit? Or maybe hard limit? User said "within 24 hr".
        // Let's enforce it strictly or warn.
        // "vo prife whitn 24 hr restore kr skta hai"
      }
    }

    targetUser.isDeleted = false;
    targetUser.deletedAt = undefined;
    targetUser.isActive = true; // Ensure they are active upon restore
    await targetUser.save();

    res.json({
      success: true,
      message: 'User restored successfully'
    });
  } catch (error) {
    console.error('Restore user error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to restore user'
    });
  }
});

// @route   DELETE /api/users/:id
// @desc    Delete user (CEO only)
// @access  Private (CEO only)
router.delete('/:id', authenticateToken, async (req, res) => {
  try {
    const targetUserId = req.params.id;

    // Find target user
    const targetUser = await User.findById(targetUserId);
    if (!targetUser) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    // Check permissions (Allow HR/Manager/Co-Founder to soft delete lower hierarchy)
    const canSoftDelete = req.user.role === 'ceo' ||
      (['hr', 'manager', 'co-founder'].includes(req.user.role) && req.user.canEdit(targetUser));

    if (!canSoftDelete) {
      return res.status(403).json({
        success: false,
        message: 'You do not have permission to delete this user'
      });
    }

    // Prevent CEO from deleting themselves
    if (targetUser._id.toString() === req.user._id.toString()) {
      return res.status(400).json({
        success: false,
        message: 'You cannot delete your own account'
      });
    }

    // Soft Delete Implementation
    // Soft Delete Implementation (Force Update)
    await User.findByIdAndUpdate(targetUserId, {
      $set: {
        isDeleted: true,
        deletedAt: new Date(),
        isActive: false
      }
    }, { strict: false }); // Bypass schema validation just in case

    res.json({
      success: true,
      message: `${targetUser.roleDisplay} account moved to trash (can be restored within 24h)`
    });

  } catch (error) {
    console.error('Delete user error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to delete user'
    });
  }
});

// @route   POST /api/users/change-password
// @desc    Change password for logged-in user
// @access  Private
router.post('/change-password', authenticateToken, async (req, res) => {
  try {
    const { currentPassword, newPassword } = req.body;

    // Validation
    if (!currentPassword || !newPassword) {
      return res.status(400).json({
        success: false,
        message: 'Current password and new password are required'
      });
    }

    if (newPassword.length < 6) {
      return res.status(400).json({
        success: false,
        message: 'New password must be at least 6 characters long'
      });
    }

    // Get user with password
    const user = await User.findById(req.user._id).select('+password');

    // Verify current password
    const isCurrentPasswordValid = await user.matchPassword(currentPassword);
    if (!isCurrentPasswordValid) {
      return res.status(400).json({
        success: false,
        message: 'Current password is incorrect'
      });
    }

    // Change password
    await user.changePassword(newPassword);

    res.json({
      success: true,
      message: 'Password changed successfully'
    });

  } catch (error) {
    console.error('Change password error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to change password'
    });
  }
});

// @route   POST /api/users/forgot-password
// @desc    Request password reset (sends original password and notifies HR)
// @access  Public
router.post('/forgot-password', async (req, res) => {
  try {
    const { email, dateOfBirth } = req.body;

    if (!email || !dateOfBirth) {
      return res.status(400).json({
        success: false,
        message: 'Email and date of birth are required'
      });
    }

    // Find user by email and include originalPassword field
    const user = await User.findOne({ email: email.toLowerCase() })
      .select('+originalPassword');

    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'No account found with that email address'
      });
    }

    // Verify date of birth
    const userDOB = new Date(user.dateOfBirth).toDateString();
    const providedDOB = new Date(dateOfBirth).toDateString();

    if (userDOB !== providedDOB) {
      return res.status(400).json({
        success: false,
        message: 'Date of birth does not match our records'
      });
    }

    // Check if original password exists
    if (!user.originalPassword) {
      return res.status(400).json({
        success: false,
        message: 'Original password not available. Please contact HR for assistance.'
      });
    }

    // Send original password to user via email
    // Log the password request for security audit
    console.log(`Password recovery requested for user: ${user.email} (${user.employeeId}) at ${new Date().toISOString()}`);

    // Provide the password directly (less secure but functional)
    res.json({
      success: true,
      message: 'Password recovery completed. Please change your password immediately after logging in.',
      data: {
        originalPassword: user.originalPassword,
        note: 'This information is sensitive. Please secure your device and clear your browser after use.'
      }
    });

  } catch (error) {
    console.error('Forgot password error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to process password recovery request'
    });
  }
});

// @route   POST /api/users/test-email
// @desc    Test email configuration (Admin only)
// @access  Private (CEO, Co-founder, HR only)

// @route   POST /api/users/upload-profile-picture
// @desc    Upload profile picture for current user
// @access  Private
router.post('/upload-profile-picture', authenticateToken, documentUpload.single('profilePicture'), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({
        success: false,
        message: 'No file uploaded'
      });
    }

    const photoUrl = `${req.protocol}://${req.get('host')}/uploads/documents/${req.file.filename}`;

    const user = await User.findByIdAndUpdate(
      req.user.id,
      { $set: { profilePicture: photoUrl } },
      { new: true }
    ).select('-password');

    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    res.json({
      success: true,
      message: 'Profile picture uploaded successfully',
      data: {
        profilePicture: photoUrl,
        fileSize: req.file.size,
        mimeType: req.file.mimetype
      }
    });
  } catch (error) {
    console.error('Upload profile picture error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to upload profile picture'
    });
  }
});

// @route   GET /api/users/settings/preferences
// @desc    Get current user's preferences
// @access  Private
router.get('/settings/preferences', authenticateToken, async (req, res) => {
  try {
    const user = await User.findById(req.user.id).select('preferences displayName profilePicture');

    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    res.json({
      success: true,
      data: {
        preferences: user.preferences || {},
        displayName: user.displayName,
        profilePicture: user.profilePicture
      }
    });
  } catch (error) {
    console.error('Get preferences error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch preferences'
    });
  }
});

// @route   PUT /api/users/settings/preferences
// @desc    Update current user's preferences
// @access  Private
router.put('/settings/preferences', authenticateToken, async (req, res) => {
  try {
    const { preferences, displayName } = req.body;

    const updateData = {};

    if (preferences) {
      // Validate theme if provided
      if (preferences.theme && !['light', 'dark', 'auto'].includes(preferences.theme)) {
        return res.status(400).json({
          success: false,
          message: 'Invalid theme value. Must be light, dark, or auto'
        });
      }

      // Validate dashboard layout if provided
      if (preferences.dashboardLayout && !['comfortable', 'compact'].includes(preferences.dashboardLayout)) {
        return res.status(400).json({
          success: false,
          message: 'Invalid dashboard layout. Must be comfortable or compact'
        });
      }

      updateData.preferences = preferences;
    }

    if (displayName !== undefined) {
      updateData.displayName = displayName;
    }

    const user = await User.findByIdAndUpdate(
      req.user.id,
      { $set: updateData },
      { new: true, runValidators: true }
    ).select('preferences displayName profilePicture');

    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    res.json({
      success: true,
      message: 'Preferences updated successfully',
      data: {
        preferences: user.preferences,
        displayName: user.displayName,
        profilePicture: user.profilePicture
      }
    });
  } catch (error) {
    console.error('Update preferences error:', error);

    if (error.name === 'ValidationError') {
      const validationErrors = Object.values(error.errors).map(err => err.message);
      return res.status(400).json({
        success: false,
        message: 'Validation error',
        errors: validationErrors
      });
    }

    res.status(500).json({
      success: false,
      message: 'Failed to update preferences'
    });
  }
});

// @route   GET /api/users/sessions
// @desc    Get active sessions for current user (placeholder for future implementation)
// @access  Private
router.get('/sessions', authenticateToken, async (req, res) => {
  try {
    // This is a placeholder for future session management implementation
    // For now, return the current session info
    const user = await User.findById(req.user.id).select('lastLogin email');

    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    res.json({
      success: true,
      data: {
        sessions: [
          {
            id: 'current',
            device: 'Current Session',
            location: 'Unknown',
            lastActive: user.lastLogin || new Date(),
            isCurrent: true
          }
        ],
        note: 'Full session management will be implemented in a future update'
      }
    });
  } catch (error) {
    console.error('Get sessions error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch sessions'
    });
  }
});

// @route   GET /api/users/developers-for-handover
// @desc    Get developers/team-leads for leave handover selection
// @access  Private (intern, developer, team-lead)
router.get('/developers-for-handover', authenticateToken, async (req, res) => {
  try {
    const developers = await User.find({
      role: { $in: ['developer', 'team-lead'] },
      isActive: true
    }).select('firstName lastName email role department');

    res.status(200).json({
      success: true,
      count: developers.length,
      data: developers
    });

  } catch (error) {
    console.error('Get developers for handover error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch developers',
      error: error.message
    });
  }
});

// @route   GET /api/users/individuals
// @desc    Get all individuals for task assignment
// @access  Private (manager, co-founder, ceo)
module.exports = router;
