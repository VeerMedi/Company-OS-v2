const express = require('express');
const rateLimit = require('express-rate-limit');
const router = express.Router();

const {
  login,
  getMe,
  updateProfile,
  changePassword,
  logout
} = require('../controllers/authController');

const { authenticateToken } = require('../middleware/auth');
const {
  validateLogin,
  validateProfileUpdate,
  validatePasswordChange
} = require('../middleware/validation');

// Rate limiting for auth endpoints (relaxed for development)
const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 1000, // limit each IP to 1000 requests per windowMs (increased for dev)
  message: {
    success: false,
    message: 'Too many requests from this IP, please try again later.'
  },
  standardHeaders: true,
  legacyHeaders: false,
});

// Stricter rate limiting for login (relaxed for development)
const loginLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 500, // limit each IP to 500 login requests per windowMs (increased for dev)
  message: {
    success: false,
    message: 'Too many login attempts from this IP, please try again later.'
  },
  standardHeaders: true,
  legacyHeaders: false,
});

// Very permissive rate limiting for /me endpoint (user data fetching)
const meLimiter = rateLimit({
  windowMs: 1 * 60 * 1000, // 1 minute
  max: 200, // limit each IP to 200 requests per minute for /me endpoint (increased for dev)
  message: {
    success: false,
    message: 'Too many requests for user data, please try again later.'
  },
  standardHeaders: true,
  legacyHeaders: false,
});

// @route   POST /api/auth/login
// @desc    Login user
// @access  Public
router.post('/login', loginLimiter, validateLogin, login);

// @route   GET /api/auth/me
// @desc    Get current logged in user
// @access  Private
router.get('/me', meLimiter, authenticateToken, getMe);

// @route   PUT /api/auth/profile
// @desc    Update user profile
// @access  Private
router.put('/profile', authLimiter, authenticateToken, validateProfileUpdate, updateProfile);

// @route   PUT /api/auth/change-password
// @desc    Change user password
// @access  Private
router.put('/change-password', authLimiter, authenticateToken, validatePasswordChange, changePassword);

// @route   POST /api/auth/logout
// @desc    Logout user
// @access  Private
router.post('/logout', authLimiter, authenticateToken, logout);

module.exports = router;