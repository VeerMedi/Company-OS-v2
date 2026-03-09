const jwt = require('jsonwebtoken');
const User = require('../models/User');
const Client = require('../models/Client');

// In-memory cache for user data
const userCache = new Map();
const CACHE_DURATION = 5 * 60 * 1000; // 5 minutes

// Helper function to get cached user or fetch from DB
const getCachedUser = async (userId, isClient = false) => {
  const cacheKey = `${isClient ? 'client' : 'user'}_${userId.toString()}`;
  const cached = userCache.get(cacheKey);

  if (cached && (Date.now() - cached.timestamp < CACHE_DURATION)) {
    return cached.user;
  }

  // Fetch from database
  const Model = isClient ? Client : User;
  const user = await Model.findById(userId).select('-password');

  if (user) {
    // Cache the user data
    userCache.set(cacheKey, {
      user: user,
      timestamp: Date.now()
    });

    // Clean up old cache entries periodically
    if (userCache.size > 1000) { // Prevent memory leak
      const cutoff = Date.now() - CACHE_DURATION;
      for (const [key, value] of userCache.entries()) {
        if (value.timestamp < cutoff) {
          userCache.delete(key);
        }
      }
    }
  }

  return user;
};

// Helper function to invalidate user cache
const invalidateUserCache = (userId) => {
  if (userId) {
    userCache.delete(userId.toString());
  }
};

// Middleware to verify JWT token with caching
const authenticateToken = async (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;
    const token = authHeader && authHeader.split(' ')[1]; // Bearer TOKEN

    if (!token) {
      return res.status(401).json({
        message: 'Access token required',
        success: false
      });
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET);

    // Try to find in User first
    let user = await getCachedUser(decoded.id, false);
    let isClient = false;

    // If not found in User, try Client
    if (!user) {
      user = await getCachedUser(decoded.id, true);
      isClient = true;
    }

    if (!user) {
      // Invalidate cache if user not found
      invalidateUserCache(decoded.id);
      return res.status(401).json({
        message: 'User not found',
        success: false
      });
    }

    // Check if active (different field for Client)
    if (isClient) {
      if (user.status !== 'active') {
        return res.status(401).json({
          message: 'Client account is not active',
          success: false
        });
      }
    } else {
      if (!user.isActive) {
        return res.status(401).json({
          message: 'User account is deactivated',
          success: false
        });
      }
    }

    req.user = user;
    req.isClient = isClient;
    next();
  } catch (error) {
    if (error.name === 'JsonWebTokenError') {
      return res.status(401).json({
        message: 'Invalid token',
        success: false
      });
    } else if (error.name === 'TokenExpiredError') {
      return res.status(401).json({
        message: 'Token expired',
        success: false
      });
    }

    console.error('Authentication error:', error);
    res.status(500).json({
      message: 'Authentication failed',
      success: false
    });
  }
};

// Middleware to check user roles
const authorizeRoles = (...roles) => {
  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({
        message: 'Authentication required',
        success: false
      });
    }

    if (!roles.includes(req.user.role)) {
      return res.status(403).json({
        message: `Access denied. Required roles: ${roles.join(', ')}`,
        success: false
      });
    }

    next();
  };
};

// Middleware to check specific permissions
const requirePermission = (permission) => {
  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({
        message: 'Authentication required',
        success: false
      });
    }

    if (!req.user.hasPermission(permission)) {
      return res.status(403).json({
        message: `Access denied. Required permission: ${permission}`,
        success: false
      });
    }

    next();
  };
};

// Middleware to check role hierarchy (user can only access equal or lower roles)
const checkRoleHierarchy = (req, res, next) => {
  const hierarchy = User.getRoleHierarchy();
  const userLevel = hierarchy[req.user.role];
  const targetUserId = req.params.userId || req.body.userId;

  if (targetUserId && targetUserId !== req.user._id.toString()) {
    // Find the target user to check their role level
    User.findById(targetUserId)
      .then(targetUser => {
        if (!targetUser) {
          return res.status(404).json({
            message: 'Target user not found',
            success: false
          });
        }

        const targetLevel = hierarchy[targetUser.role];

        // CEO and HR can modify any user regardless of hierarchy
        const canBypassHierarchy = ['ceo', 'hr'].includes(req.user.role);

        if (userLevel <= targetLevel && !canBypassHierarchy) {
          return res.status(403).json({
            message: 'Cannot access user with equal or higher role level',
            success: false
          });
        }

        req.targetUser = targetUser;
        next();
      })
      .catch(error => {
        console.error('Role hierarchy check error:', error);
        res.status(500).json({
          message: 'Role verification failed',
          success: false
        });
      });
  } else {
    next();
  }
};

// Middleware to check if user can modify their own data or has admin permissions
const canModifyUser = (req, res, next) => {
  const targetUserId = req.params.userId || req.body.userId;
  const currentUserId = req.user._id.toString();

  // Users can always modify their own data
  if (targetUserId === currentUserId) {
    return next();
  }

  // Check if user has admin permissions
  const adminRoles = ['ceo', 'co-founder', 'hr'];
  if (adminRoles.includes(req.user.role)) {
    return next();
  }

  // Managers can modify users in their department (if department logic is implemented)
  if (req.user.role === 'manager' && req.user.hasPermission('write_users')) {
    return next();
  }

  return res.status(403).json({
    message: 'Access denied. Cannot modify other users',
    success: false
  });
};

module.exports = {
  protect: authenticateToken, // Alias for common use
  authenticateToken,
  authorizeRoles,
  requirePermission,
  checkRoleHierarchy,
  canModifyUser,
  invalidateUserCache, // Export for use in other controllers
};