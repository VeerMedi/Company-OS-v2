const jwt = require('jsonwebtoken');
const { validationResult } = require('express-validator');
const User = require('../models/User');
const Client = require('../models/Client');
const { invalidateUserCache } = require('../middleware/auth');

// Generate JWT Token
const generateToken = (id) => {
  return jwt.sign({ id }, process.env.JWT_SECRET, {
    expiresIn: process.env.JWT_EXPIRE || '7d',
  });
};

// @desc    Register new user
// @route   POST /api/auth/register
// @access  Public
const register = async (req, res) => {
  try {
    // Check for validation errors
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        message: 'Validation failed',
        errors: errors.array()
      });
    }

    const {
      firstName,
      lastName,
      email,
      password,
      role,
      department,
      phoneNumber,
      employeeId
    } = req.body;

    // Check if user already exists
    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return res.status(400).json({
        success: false,
        message: 'User already exists with this email'
      });
    }

    // Check if employeeId is already taken (if provided)
    if (employeeId) {
      const existingEmployee = await User.findOne({ employeeId });
      if (existingEmployee) {
        return res.status(400).json({
          success: false,
          message: 'Employee ID already exists'
        });
      }
    }

    // Create user
    const user = await User.create({
      firstName,
      lastName,
      email,
      password,
      role: role.toLowerCase(),
      department,
      phoneNumber,
      employeeId
    });

    // Generate token
    const token = generateToken(user._id);

    // Update last login
    await user.updateLastLogin();

    res.status(201).json({
      success: true,
      message: 'User registered successfully',
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
          jobCategory: user.jobCategory,
          permissions: user.permissions,
          isActive: user.isActive
        },
        token
      }
    });

  } catch (error) {
    console.error('Registration error:', error);

    // Handle duplicate key error
    if (error.code === 11000) {
      const field = Object.keys(error.keyValue)[0];
      return res.status(400).json({
        success: false,
        message: `${field} already exists`
      });
    }

    res.status(500).json({
      success: false,
      message: 'Registration failed',
      error: process.env.NODE_ENV === 'development' ? error.message : {}
    });
  }
};

// @desc    Login user
// @route   POST /api/auth/login
// @access  Public
const login = async (req, res) => {
  try {
    // Check for validation errors
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        message: 'Validation failed',
        errors: errors.array()
      });
    }

    const { email, password } = req.body;

    // First, try to find as User (Employee)
    let user = await User.findOne({ email }).select('+password');
    let isClient = false;
    
    // If not found in User, try Client
    if (!user) {
      user = await Client.findOne({ email }).select('+password');
      isClient = true;
    }

    // If still not found, invalid credentials
    if (!user) {
      return res.status(401).json({
        success: false,
        message: 'Invalid email or password'
      });
    }

    // Check if user is active (for both User and Client)
    if (!user.isActive && !isClient) {
      return res.status(401).json({
        success: false,
        message: 'Account is deactivated. Please contact administrator.'
      });
    }

    if (isClient && user.status !== 'active') {
      return res.status(401).json({
        success: false,
        message: 'Client account is not active. Please contact support.'
      });
    }

    // Check password
    const isPasswordMatch = isClient 
      ? await user.comparePassword(password)
      : await user.matchPassword(password);
      
    if (!isPasswordMatch) {
      return res.status(401).json({
        success: false,
        message: 'Invalid email or password'
      });
    }

    // Generate token
    const token = generateToken(user._id);

    // Update last login
    if (isClient) {
      user.lastLogin = new Date();
      await user.save();
    } else {
      await user.updateLastLogin();
    }

    // Return response based on user type
    if (isClient) {
      return res.status(200).json({
        success: true,
        message: 'Login successful',
        data: {
          user: {
            id: user._id,
            companyName: user.companyName,
            email: user.email,
            role: 'client',
            roleDisplay: 'Client',
            isClient: true,
            status: user.status,
            lastLogin: user.lastLogin,
            assignedProjects: user.assignedProjects,
            projectHealthScore: user.projectHealthScore
          },
          token,
          isClient: true
        }
      });
    }

    // Regular user response
    res.status(200).json({
      success: true,
      message: 'Login successful',
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
          jobCategory: user.jobCategory,
          isActive: user.isActive,
          lastLogin: user.lastLogin,
          profilePhoto: user.profilePhoto,
          isPasswordChanged: user.isPasswordChanged,
          needsPasswordChange: user.needsPasswordChange()
        },
        token,
        requirePasswordChange: user.needsPasswordChange(),
        isClient: false
      }
    });

  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({
      success: false,
      message: 'Login failed',
      error: process.env.NODE_ENV === 'development' ? error.message : {}
    });
  }
};

// @desc    Get current logged in user
// @route   GET /api/auth/me
// @access  Private
const getMe = async (req, res) => {
  try {
    const user = req.user;

    res.status(200).json({
      success: true,
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
          permissions: user.permissions,
          isActive: user.isActive,
          lastLogin: user.lastLogin,
          profilePicture: user.profilePicture,
          profilePhoto: user.profilePhoto,  // ✅ Added for uploaded photos
          createdAt: user.createdAt,
          isPasswordChanged: user.isPasswordChanged,
          jobCategory: user.jobCategory
        }
      }
    });
  } catch (error) {
    console.error('Get user error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch user data'
    });
  }
};

// @desc    Update user profile
// @route   PUT /api/auth/profile
// @access  Private
// @desc    Update user profile
// @route   PUT /api/auth/profile
// @access  Private
const updateProfile = async (req, res) => {
  try {
    const { firstName, lastName, phoneNumber, department, profilePicture } = req.body;

    const user = await User.findById(req.user._id);
    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    // Update allowed fields
    if (firstName) user.firstName = firstName;
    if (lastName) user.lastName = lastName;
    if (phoneNumber) user.phoneNumber = phoneNumber;
    if (department) user.department = department;
    if (profilePicture) user.profilePicture = profilePicture;

    await user.save();

    // Invalidate user cache after profile update
    invalidateUserCache(user._id);

    res.status(200).json({
      success: true,
      message: 'Profile updated successfully',
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
          permissions: user.permissions,
          jobCategory: user.jobCategory,
          profilePicture: user.profilePicture
        }
      }
    });

  } catch (error) {
    console.error('Update profile error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to update profile'
    });
  }
};

// @desc    Change password
// @route   PUT /api/auth/change-password
// @access  Private
const changePassword = async (req, res) => {
  try {
    const { currentPassword, newPassword } = req.body;

    if (!currentPassword || !newPassword) {
      return res.status(400).json({
        success: false,
        message: 'Current password and new password are required'
      });
    }

    const user = await User.findById(req.user._id).select('+password');
    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    // Check current password
    const isCurrentPasswordCorrect = await user.matchPassword(currentPassword);
    if (!isCurrentPasswordCorrect) {
      return res.status(400).json({
        success: false,
        message: 'Current password is incorrect'
      });
    }

    // Update password
    user.password = newPassword;
    user.isPasswordChanged = true;
    user.passwordChangedAt = new Date();
    await user.save();

    // Invalidate user cache after password change
    invalidateUserCache(user._id);

    res.status(200).json({
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
};

// @desc    Logout user (invalidate token - client-side)
// @route   POST /api/auth/logout
// @access  Private
const logout = async (req, res) => {
  res.status(200).json({
    success: true,
    message: 'Logout successful'
  });
};

module.exports = {
  register,
  login,
  getMe,
  updateProfile,
  changePassword,
  logout
};