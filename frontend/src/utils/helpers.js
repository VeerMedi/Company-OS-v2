// Service categories
export const SERVICE_CATEGORIES = {
  DELIVERY: 'service-delivery',
  ONBOARDING: 'service-onboarding',
};

export const CATEGORY_LABELS = {
  [SERVICE_CATEGORIES.DELIVERY]: 'Service Delivery',
  [SERVICE_CATEGORIES.ONBOARDING]: 'Service Onboarding',
};
// Role utilities
export const ROLES = {
  CEO: 'ceo',
  CO_FOUNDER: 'co-founder',
  MANAGER: 'manager',
  HR: 'hr',
  SERVICE_DELIVERY: 'service-delivery',
  SERVICE_ONBOARDING: 'service-onboarding',
};

export const ROLE_HIERARCHY = {
  [ROLES.CEO]: 5,
  [ROLES.CO_FOUNDER]: 4,
  [ROLES.MANAGER]: 3,
  [ROLES.HR]: 2,
  [ROLES.SERVICE_DELIVERY]: 1,
  [ROLES.SERVICE_ONBOARDING]: 1,
};

export const ROLE_LABELS = {
  [ROLES.CEO]: 'CEO',
  [ROLES.CO_FOUNDER]: 'Co-Founder',
  [ROLES.MANAGER]: 'Manager',
  [ROLES.HR]: 'HR',
  [ROLES.SERVICE_DELIVERY]: 'Service Delivery',
  [ROLES.SERVICE_ONBOARDING]: 'Service Onboarding',
};

export const PERMISSIONS = {
  READ_ALL_USERS: 'read_all_users',
  WRITE_USERS: 'write_users',
  DELETE_USERS: 'delete_users',
  READ_FINANCIAL: 'read_financial',
  WRITE_FINANCIAL: 'write_financial',
  READ_HR_DATA: 'read_hr_data',
  WRITE_HR_DATA: 'write_hr_data',
  MANAGE_DEPARTMENTS: 'manage_departments',
  SYSTEM_ADMIN: 'system_admin',
};

// Utility functions
export const getRoleLevel = (role) => {
  return ROLE_HIERARCHY[role] || 0;
};

export const getRoleLabel = (role) => {
  return ROLE_LABELS[role] || role;
};

export const canAccessRole = (userRole, targetRole) => {
  const userLevel = getRoleLevel(userRole);
  const targetLevel = getRoleLevel(targetRole);
  return userLevel >= targetLevel;
};

export const isHigherRole = (role1, role2) => {
  return getRoleLevel(role1) > getRoleLevel(role2);
};

export const getAllRoles = () => {
  return Object.values(ROLES);
};

export const getRolesForSelect = () => {
  return Object.entries(ROLE_LABELS).map(([value, label]) => ({
    value,
    label,
  }));
};

// Format utilities
export const formatRole = (role) => {
  return role
    .split('-')
    .map(word => word.charAt(0).toUpperCase() + word.slice(1))
    .join(' ');
};

export const formatName = (firstName, lastName) => {
  return `${firstName} ${lastName}`;
};

export const getInitials = (firstName, lastName) => {
  return `${firstName.charAt(0)}${lastName.charAt(0)}`.toUpperCase();
};

export const formatDate = (date) => {
  if (!date) return 'N/A';
  return new Date(date).toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  });
};

export const formatDateTime = (date) => {
  if (!date) return 'N/A';
  return new Date(date).toLocaleString('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
};

export const formatCurrency = (amount, currency = 'INR') => {
  const currencyConfig = {
    'INR': { locale: 'en-IN', currency: 'INR' },
    'USD': { locale: 'en-US', currency: 'USD' },
    'EUR': { locale: 'en-EU', currency: 'EUR' },
    'GBP': { locale: 'en-GB', currency: 'GBP' },
  };

  const config = currencyConfig[currency] || currencyConfig['INR'];

  return new Intl.NumberFormat(config.locale, {
    style: 'currency',
    currency: config.currency,
    minimumFractionDigits: 0
  }).format(amount || 0);
};

// Validation utilities
export const validateEmail = (email) => {
  const re = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return re.test(email);
};

export const validatePassword = (password) => {
  return {
    isValid: password.length >= 6 && /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/.test(password),
    errors: [
      ...(password.length < 6 ? ['Password must be at least 6 characters long'] : []),
      ...(/^(?=.*[a-z])/.test(password) ? [] : ['Password must contain at least one lowercase letter']),
      ...(/^(?=.*[A-Z])/.test(password) ? [] : ['Password must contain at least one uppercase letter']),
      ...(/^(?=.*\d)/.test(password) ? [] : ['Password must contain at least one number']),
    ],
  };
};

export const validatePhoneNumber = (phone) => {
  if (!phone) return true; // Optional field
  const re = /^\+?[\d\s-()]+$/;
  return re.test(phone);
};

// Local storage utilities
export const getFromLocalStorage = (key, defaultValue = null) => {
  try {
    const item = localStorage.getItem(key);
    return item ? JSON.parse(item) : defaultValue;
  } catch (error) {
    console.error(`Error reading ${key} from localStorage:`, error);
    return defaultValue;
  }
};

export const setToLocalStorage = (key, value) => {
  try {
    localStorage.setItem(key, JSON.stringify(value));
  } catch (error) {
    console.error(`Error setting ${key} to localStorage:`, error);
  }
};

export const removeFromLocalStorage = (key) => {
  try {
    localStorage.removeItem(key);
  } catch (error) {
    console.error(`Error removing ${key} from localStorage:`, error);
  }
};

// Array utilities
export const sortByRole = (users) => {
  return [...users].sort((a, b) => {
    const levelA = getRoleLevel(a.role);
    const levelB = getRoleLevel(b.role);
    return levelB - levelA; // Higher roles first
  });
};

export const groupByRole = (users) => {
  return users.reduce((groups, user) => {
    const role = user.role;
    if (!groups[role]) {
      groups[role] = [];
    }
    groups[role].push(user);
    return groups;
  }, {});
};

export const filterByRole = (users, roles) => {
  if (!roles || roles.length === 0) return users;
  return users.filter(user => roles.includes(user.role));
};

// Theme utilities
export const getRoleColor = (role) => {
  const colors = {
    [ROLES.CEO]: 'bg-purple-100 text-purple-800',
    [ROLES.CO_FOUNDER]: 'bg-indigo-100 text-indigo-800',
    [ROLES.MANAGER]: 'bg-blue-100 text-blue-800',
    [ROLES.HR]: 'bg-green-100 text-green-800',
    [ROLES.INDIVIDUAL]: 'bg-gray-100 text-gray-800',
  };
  return colors[role] || 'bg-gray-100 text-gray-800';
};

export const getStatusColor = (isActive) => {
  return isActive
    ? 'bg-green-100 text-green-800'
    : 'bg-red-100 text-red-800';
};