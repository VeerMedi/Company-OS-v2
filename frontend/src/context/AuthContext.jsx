import React, { createContext, useContext, useReducer, useEffect, useRef, useCallback } from 'react';
import api from '../utils/api';
import toast from 'react-hot-toast';

// Initial state
const initialState = {
  user: null,
  token: localStorage.getItem('token'),
  isLoading: true,
  isAuthenticated: false,
  lastUserFetch: null,
};

// Action types
const ActionTypes = {
  LOGIN_START: 'LOGIN_START',
  LOGIN_SUCCESS: 'LOGIN_SUCCESS',
  LOGIN_FAILURE: 'LOGIN_FAILURE',
  LOGOUT: 'LOGOUT',
  LOAD_USER_START: 'LOAD_USER_START',
  LOAD_USER_SUCCESS: 'LOAD_USER_SUCCESS',
  LOAD_USER_FAILURE: 'LOAD_USER_FAILURE',
  UPDATE_USER: 'UPDATE_USER',
  CLEAR_ERRORS: 'CLEAR_ERRORS',
  SET_LAST_FETCH: 'SET_LAST_FETCH',
};

// Reducer
const authReducer = (state, action) => {
  switch (action.type) {
    case ActionTypes.LOGIN_START:
    case ActionTypes.LOAD_USER_START:
      return {
        ...state,
        isLoading: true,
      };

    case ActionTypes.LOGIN_SUCCESS:
      localStorage.setItem('token', action.payload.token);
      return {
        ...state,
        user: action.payload.user,
        token: action.payload.token,
        isLoading: false,
        isAuthenticated: true,
        lastUserFetch: Date.now(),
      };

    case ActionTypes.LOAD_USER_SUCCESS:
      return {
        ...state,
        user: action.payload.user,
        isLoading: false,
        isAuthenticated: true,
        lastUserFetch: Date.now(),
      };

    case ActionTypes.LOGIN_FAILURE:
    case ActionTypes.LOAD_USER_FAILURE:
      localStorage.removeItem('token');
      return {
        ...state,
        user: null,
        token: null,
        isLoading: false,
        isAuthenticated: false,
        lastUserFetch: null,
      };

    case ActionTypes.LOGOUT:
      localStorage.removeItem('token');
      return {
        ...state,
        user: null,
        token: null,
        isLoading: false,
        isAuthenticated: false,
        lastUserFetch: null,
      };

    case ActionTypes.UPDATE_USER:
      return {
        ...state,
        user: { ...state.user, ...action.payload },
        lastUserFetch: Date.now(),
      };

    case ActionTypes.SET_LAST_FETCH:
      return {
        ...state,
        lastUserFetch: action.payload,
      };

    default:
      return state;
  }
};

// Create context
const AuthContext = createContext();

// Custom hook to use auth context
export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

// Auth provider component
export const AuthProvider = ({ children }) => {
  const [state, dispatch] = useReducer(authReducer, initialState);
  const loadUserTimeoutRef = useRef(null);
  const isLoadingRef = useRef(false);

  // Cache settings
  const USER_CACHE_DURATION = 5 * 60 * 1000; // 5 minutes
  const DEBOUNCE_DELAY = 1000; // 1 second

  // Note: axios defaults are already set in api.js via interceptors
  // No need to set them here as api instance handles auth headers automatically

  // Load user on mount with proper caching
  useEffect(() => {
    if (state.token && !state.isAuthenticated) {
      loadUser();
    } else if (!state.token) {
      dispatch({ type: ActionTypes.LOAD_USER_FAILURE });
    }
  }, [state.token]); // Only depend on token, not state changes

  // Load user function with caching and debouncing
  const loadUser = useCallback(async (force = false) => {
    if (!state.token) {
      dispatch({ type: ActionTypes.LOAD_USER_FAILURE });
      return;
    }

    // Check if user data is fresh and we don't need to refetch
    const now = Date.now();
    const isCacheValid = state.lastUserFetch && (now - state.lastUserFetch < USER_CACHE_DURATION);

    if (!force && isCacheValid && state.isAuthenticated) {
      console.log('Using cached user data');
      return;
    }

    // Prevent multiple simultaneous requests
    if (isLoadingRef.current) {
      console.log('User load already in progress');
      return;
    }

    // Clear any existing timeout
    if (loadUserTimeoutRef.current) {
      clearTimeout(loadUserTimeoutRef.current);
    }

    // Debounce the request
    loadUserTimeoutRef.current = setTimeout(async () => {
      try {
        isLoadingRef.current = true;
        dispatch({ type: ActionTypes.LOAD_USER_START });

        const response = await api.get('/auth/me');

        if (response.data.success) {
          dispatch({
            type: ActionTypes.LOAD_USER_SUCCESS,
            payload: response.data.data,
          });
        } else {
          throw new Error('Failed to load user');
        }
      } catch (error) {
        console.error('Load user error:', error);
        dispatch({ type: ActionTypes.LOAD_USER_FAILURE });

        if (error.response?.status === 401) {
          toast.error('Session expired. Please login again.');
        }
      } finally {
        isLoadingRef.current = false;
      }
    }, DEBOUNCE_DELAY);
  }, [state.token, state.lastUserFetch, state.isAuthenticated]);

  // Refresh user function (silent reload) with caching
  const refreshUser = useCallback(async (force = false) => {
    if (!state.token) {
      return;
    }

    // Check cache validity
    const now = Date.now();
    const isCacheValid = state.lastUserFetch && (now - state.lastUserFetch < USER_CACHE_DURATION);

    if (!force && isCacheValid) {
      console.log('Skipping refresh - using cached user data');
      return;
    }

    // Prevent multiple simultaneous requests
    if (isLoadingRef.current) {
      return;
    }

    try {
      isLoadingRef.current = true;
      const response = await api.get('/auth/me');

      if (response.data.success) {
        dispatch({
          type: ActionTypes.LOAD_USER_SUCCESS,
          payload: response.data.data,
        });
      }
    } catch (error) {
      console.error('Refresh user error:', error);
      // Silently fail - don't logout user or show errors for refresh
    } finally {
      isLoadingRef.current = false;
    }
  }, [state.token, state.lastUserFetch]);

  // Login function
  const login = async (email, password) => {
    try {
      dispatch({ type: ActionTypes.LOGIN_START });

      const response = await api.post('/auth/login', {
        email,
        password,
      });

      if (response.data.success) {
        dispatch({
          type: ActionTypes.LOGIN_SUCCESS,
          payload: response.data.data,
        });

        toast.success(`Welcome back, ${response.data.data.user.firstName}!`);

        // Return both success status and password change requirement
        return {
          success: true,
          requirePasswordChange: response.data.requirePasswordChange || false
        };
      } else {
        throw new Error(response.data.message || 'Login failed');
      }
    } catch (error) {
      dispatch({ type: ActionTypes.LOGIN_FAILURE });

      const message = error.response?.data?.message || 'Login failed';
      toast.error(message);

      return {
        success: false,
        error: message
      };
    }
  };

  // Register function
  const register = async (userData) => {
    try {
      dispatch({ type: ActionTypes.LOGIN_START });

      const response = await api.post('/auth/register', userData);

      if (response.data.success) {
        dispatch({
          type: ActionTypes.LOGIN_SUCCESS,
          payload: response.data.data,
        });

        toast.success(`Welcome to The Hustle System, ${response.data.data.user.firstName}!`);
        return { success: true };
      } else {
        throw new Error(response.data.message || 'Registration failed');
      }
    } catch (error) {
      dispatch({ type: ActionTypes.LOGIN_FAILURE });

      const message = error.response?.data?.message || 'Registration failed';
      toast.error(message);

      return {
        success: false,
        error: message,
        errors: error.response?.data?.errors
      };
    }
  };

  // Logout function
  const logout = async () => {
    try {
      await api.post('/auth/logout');
    } catch (error) {
      console.error('Logout error:', error);
    } finally {
      dispatch({ type: ActionTypes.LOGOUT });
      toast.success('Logged out successfully');
    }
  };

  // Update profile function with cache invalidation
  const updateProfile = async (userData) => {
    try {
      const response = await api.put('/auth/profile', userData);

      if (response.data.success) {
        dispatch({
          type: ActionTypes.UPDATE_USER,
          payload: response.data.data.user,
        });

        toast.success('Profile updated successfully');
        return { success: true };
      } else {
        throw new Error(response.data.message || 'Update failed');
      }
    } catch (error) {
      const message = error.response?.data?.message || 'Update failed';
      toast.error(message);

      return {
        success: false,
        error: message
      };
    }
  };

  // Change password function with cache invalidation
  const changePassword = async (currentPassword, newPassword) => {
    try {
      const response = await api.put('/auth/change-password', {
        currentPassword,
        newPassword,
      });

      if (response.data.success) {
        // Invalidate cache and reload user to get updated isPasswordChanged status
        dispatch({ type: ActionTypes.SET_LAST_FETCH, payload: null });
        await loadUser(true); // Force reload

        toast.success('Password changed successfully');
        return { success: true };
      } else {
        throw new Error(response.data.message || 'Password change failed');
      }
    } catch (error) {
      const message = error.response?.data?.message || 'Password change failed';
      toast.error(message);

      return {
        success: false,
        error: message
      };
    }
  };

  // Helper functions
  const hasPermission = (permission) => {
    return state.user?.permissions?.includes(permission) || false;
  };

  const hasRole = (...roles) => {
    return state.user ? roles.includes(state.user.role) : false;
  };

  const isRoleLevel = (minLevel) => {
    if (!state.user) return false;

    const roleLevels = {
      'individual': 1,
      'hr': 2,
      'manager': 3,
      'co-founder': 4,
      'ceo': 5,
    };

    const userLevel = roleLevels[state.user.role] || 0;
    return userLevel >= minLevel;
  };

  // Cleanup timeouts on unmount
  useEffect(() => {
    return () => {
      if (loadUserTimeoutRef.current) {
        clearTimeout(loadUserTimeoutRef.current);
      }
    };
  }, []);

  const value = {
    // State
    user: state.user,
    token: state.token,
    isLoading: state.isLoading,
    isAuthenticated: state.isAuthenticated,

    // Actions
    login,
    register,
    logout,
    loadUser,
    refreshUser,
    updateProfile,
    changePassword,

    // Helper functions
    hasPermission,
    hasRole,
    isRoleLevel,
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};