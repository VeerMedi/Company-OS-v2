import React, { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { 
  UserPlus, 
  Users, 
  Eye, 
  EyeOff, 
  AlertCircle, 
  Check,
  X,
  Edit,
  Trash2,
  Shield,
  ChevronDown,
  ArrowLeft,
  Calendar,
  Save,
  RefreshCw
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { validateEmail, validatePassword, getRoleColor, formatRole } from '../utils/helpers';
import api from '../utils/api';
import toast from 'react-hot-toast';

const UserManagement = () => {
  const { user, hasPermission } = useAuth();
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [editingUser, setEditingUser] = useState(null);
  const [showPassword, setShowPassword] = useState(false);
  const [availableRoles, setAvailableRoles] = useState([]);
  const [canCreateUsers, setCanCreateUsers] = useState(false);
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [createLoading, setCreateLoading] = useState(false);
  const [editLoading, setEditLoading] = useState(false);
  const [deleteLoading, setDeleteLoading] = useState(false);

  // Department options
  const departmentOptions = [
    { value: '', label: 'Select Department' },
    { value: 'Development', label: 'Development' },
    { value: 'Sales', label: 'Sales' },
    { value: 'Designing', label: 'Designing' },
    { value: 'Operations', label: 'Operations' }
  ];

  const {
    register,
    handleSubmit,
    formState: { errors },
    reset,
    watch,
    setValue
  } = useForm();

  const {
    register: editRegister,
    handleSubmit: editHandleSubmit,
    formState: { errors: editErrors },
    reset: editReset,
    setValue: editSetValue
  } = useForm();

  const watchedRole = watch('role');

  // Fetch available roles and users on component mount
  useEffect(() => {
    fetchAvailableRoles();
    fetchUsers();
  }, []);

  const fetchAvailableRoles = async () => {
    try {
      const response = await api.get('/users/can-create');
      if (response.data.success) {
        setAvailableRoles(response.data.data.availableRoles);
        setCanCreateUsers(response.data.data.canCreateUsers);
      }
    } catch (error) {
      console.error('Error fetching available roles:', error);
      toast.error('Failed to load user creation permissions');
    }
  };

  const fetchUsers = async () => {
    try {
      setLoading(true);
      const response = await api.get('/users');
      if (response.data.success) {
        setUsers(response.data.data.users);
      }
    } catch (error) {
      console.error('Error fetching users:', error);
      toast.error('Failed to load users');
    } finally {
      setLoading(false);
    }
  };

  const onSubmit = async (data) => {
    setCreateLoading(true);
    try {
      const response = await api.post('/users/create', data);
      
      if (response.data.success) {
        toast.success(response.data.message);
        setShowCreateModal(false);
        reset();
        fetchUsers(); // Refresh user list
      }
    } catch (error) {
      const message = error.response?.data?.message || 'Failed to create user';
      toast.error(message);
      
      // Handle validation errors
      if (error.response?.data?.errors) {
        error.response.data.errors.forEach(err => {
          toast.error(`${err.param}: ${err.msg}`);
        });
      }
    } finally {
      setCreateLoading(false);
    }
  };

  const generateRandomPassword = () => {
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789@$!%*?&';
    let password = '';
    
    // Ensure at least one of each required character type
    password += 'ABCDEFGHIJKLMNOPQRSTUVWXYZ'[Math.floor(Math.random() * 26)];
    password += 'abcdefghijklmnopqrstuvwxyz'[Math.floor(Math.random() * 26)];
    password += '0123456789'[Math.floor(Math.random() * 10)];
    password += '@$!%*?&'[Math.floor(Math.random() * 7)];
    
    // Fill the rest randomly
    for (let i = 4; i < 12; i++) {
      password += chars[Math.floor(Math.random() * chars.length)];
    }
    
    // Shuffle the password
    return password.split('').sort(() => 0.5 - Math.random()).join('');
  };

  const handleGeneratePassword = () => {
    const newPassword = generateRandomPassword();
    document.getElementById('password').value = newPassword;
    toast.success('Secure password generated');
  };

  // Edit user handlers
  const handleEditUser = (userData) => {
    setEditingUser(userData);
    
    // Pre-fill the edit form
    editSetValue('firstName', userData.firstName);
    editSetValue('lastName', userData.lastName);
    editSetValue('email', userData.email);
    editSetValue('department', userData.department || '');
    editSetValue('phoneNumber', userData.phoneNumber || '');
    editSetValue('dateOfBirth', userData.dateOfBirth ? userData.dateOfBirth.split('T')[0] : '');
    editSetValue('isActive', userData.isActive);
    
    setShowEditModal(true);
  };

  const onEditSubmit = async (data) => {
    setEditLoading(true);
    try {
      const response = await api.put(`/users/${editingUser._id}`, data);
      
      if (response.data.success) {
        toast.success('User updated successfully');
        setShowEditModal(false);
        editReset();
        setEditingUser(null);
        fetchUsers(); // Refresh user list
      }
    } catch (error) {
      const message = error.response?.data?.message || 'Failed to update user';
      toast.error(message);
    } finally {
      setEditLoading(false);
    }
  };

  // Delete user handlers
  const handleDeleteUser = async (userData) => {
    if (window.confirm(`Are you sure you want to delete ${userData.fullName}? This action cannot be undone.`)) {
      setDeleteLoading(true);
      try {
        const response = await api.delete(`/users/${userData._id}`);
        
        if (response.data.success) {
          toast.success('User deleted successfully');
          fetchUsers(); // Refresh user list
        }
      } catch (error) {
        const message = error.response?.data?.message || 'Failed to delete user';
        toast.error(message);
      } finally {
        setDeleteLoading(false);
      }
    }
  };

  // Check if current user can edit/delete target user
  const canEditUser = (targetUser) => {
    const roleHierarchy = {
      'ceo': 5,
      'co-founder': 4,
      'manager': 3,
      'hr': 2,
      'individual': 1
    };
    return roleHierarchy[user.role] > roleHierarchy[targetUser.role];
  };

  const canDeleteUser = (targetUser) => {
    return user.role === 'ceo' && targetUser._id !== user._id;
  };

  if (!hasPermission('read_all_users')) {
    return (
      <div className="text-center py-12">
        <Shield className="mx-auto h-12 w-12 text-gray-400 mb-4" />
        <h3 className="text-lg font-medium text-gray-900 mb-2">Access Denied</h3>
        <p className="text-gray-500">You don't have permission to manage users.</p>
      </div>
    );
  }

  return (
    <div className="space-y-6 pt-6">
      {/* Back Navigation */}
      <div className="flex items-center space-x-4 mb-6">
        <button
          onClick={() => window.history.back()}
          className="inline-flex items-center text-sm text-gray-500 hover:text-gray-700"
        >
          <ArrowLeft className="h-4 w-4 mr-1" />
          Back
        </button>
        <div className="h-4 border-l border-gray-300"></div>
        <nav className="text-sm text-gray-500">
          Dashboard / User Management
        </nav>
      </div>

      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">User Management</h1>
          <p className="text-gray-600 mt-1">Manage system users and permissions</p>
        </div>
        
        {canCreateUsers && (
          <button
            onClick={() => setShowCreateModal(true)}
            className="inline-flex items-center px-4 py-2 border border-transparent rounded-lg shadow-sm text-sm font-medium text-white bg-primary-600 hover:bg-primary-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500 transition-colors"
          >
            <UserPlus className="h-4 w-4 mr-2" />
            Create User
          </button>
        )}
      </div>

      {/* User Creation Permissions Info */}
      <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
        <div className="flex items-start">
          <div className="flex-shrink-0">
            <Shield className="h-5 w-5 text-blue-600 mt-0.5" />
          </div>
          <div className="ml-3">
            <h3 className="text-sm font-medium text-blue-800">Your Permissions</h3>
            <div className="mt-1 text-sm text-blue-700">
              {canCreateUsers ? (
                <div>
                  <p>You can create accounts for: </p>
                  <div className="flex flex-wrap gap-2 mt-2">
                    {availableRoles.map(role => (
                      <span key={role.value} className={`inline-flex px-2 py-1 rounded-full text-xs font-medium ${getRoleColor(role.value)}`}>
                        {role.label}
                      </span>
                    ))}
                  </div>
                </div>
              ) : (
                <p>You cannot create new user accounts. Contact your administrator.</p>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Users List */}
      <div className="bg-white shadow-sm rounded-lg border border-gray-200">
        <div className="px-6 py-4 border-b border-gray-200">
          <h2 className="text-lg font-medium text-gray-900 flex items-center">
            <Users className="h-5 w-5 mr-2" />
            System Users
          </h2>
        </div>
        
        {loading ? (
          <div className="p-6 text-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600 mx-auto"></div>
            <p className="text-gray-500 mt-2">Loading users...</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    User
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Role
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Department
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Status
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Last Login
                  </th>
                  <th className="relative px-6 py-3">
                    <span className="sr-only">Actions</span>
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {users.map((userData) => (
                  <tr key={userData._id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center">
                        <div className="h-10 w-10 rounded-full bg-primary-600 flex items-center justify-center">
                          <span className="text-white font-medium text-sm">
                            {userData.firstName?.charAt(0)}{userData.lastName?.charAt(0)}
                          </span>
                        </div>
                        <div className="ml-4">
                          <div className="text-sm font-medium text-gray-900">
                            {userData.firstName} {userData.lastName}
                          </div>
                          <div className="text-sm text-gray-500">{userData.email}</div>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`inline-flex px-2 py-1 rounded-full text-xs font-medium ${getRoleColor(userData.role)}`}>
                        {formatRole(userData.role)}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {userData.department || 'Not specified'}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`inline-flex px-2 py-1 rounded-full text-xs font-medium ${
                        userData.isActive ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
                      }`}>
                        {userData.isActive ? 'Active' : 'Inactive'}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {userData.lastLogin ? new Date(userData.lastLogin).toLocaleDateString() : 'Never'}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                      <div className="flex items-center space-x-2">
                        {canEditUser(userData) && (
                          <button 
                            onClick={() => handleEditUser(userData)}
                            className="text-primary-600 hover:text-primary-900"
                            title="Edit user"
                          >
                            <Edit className="h-4 w-4" />
                          </button>
                        )}
                        {canDeleteUser(userData) && (
                          <button 
                            onClick={() => handleDeleteUser(userData)}
                            className="text-red-600 hover:text-red-900"
                            title="Delete user"
                            disabled={deleteLoading}
                          >
                            <Trash2 className="h-4 w-4" />
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Create User Modal */}
      {showCreateModal && (
        <div className="fixed inset-0 bg-gray-600 bg-opacity-75 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg shadow-xl max-w-md w-full max-h-screen overflow-y-auto">
            <div className="px-6 py-4 border-b border-gray-200">
              <div className="flex items-center justify-between">
                <h3 className="text-lg font-medium text-gray-900">Create New User</h3>
                <button
                  onClick={() => setShowCreateModal(false)}
                  className="text-gray-400 hover:text-gray-600"
                >
                  <X className="h-6 w-6" />
                </button>
              </div>
            </div>
            
            <form onSubmit={handleSubmit(onSubmit)} className="px-6 py-4 space-y-4">
              {/* Name Fields */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700">First Name *</label>
                  <input
                    {...register('firstName', {
                      required: 'First name is required',
                      minLength: { value: 2, message: 'First name must be at least 2 characters' },
                      pattern: { value: /^[a-zA-Z\s]+$/, message: 'First name must contain only letters' }
                    })}
                    className="mt-1 input-field"
                    placeholder="John"
                  />
                  {errors.firstName && (
                    <p className="mt-1 text-sm text-red-600 flex items-center">
                      <AlertCircle className="h-4 w-4 mr-1" />
                      {errors.firstName.message}
                    </p>
                  )}
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700">Last Name *</label>
                  <input
                    {...register('lastName', {
                      required: 'Last name is required',
                      minLength: { value: 2, message: 'Last name must be at least 2 characters' },
                      pattern: { value: /^[a-zA-Z\s]+$/, message: 'Last name must contain only letters' }
                    })}
                    className="mt-1 input-field"
                    placeholder="Doe"
                  />
                  {errors.lastName && (
                    <p className="mt-1 text-sm text-red-600 flex items-center">
                      <AlertCircle className="h-4 w-4 mr-1" />
                      {errors.lastName.message}
                    </p>
                  )}
                </div>
              </div>

              {/* Email */}
              <div>
                <label className="block text-sm font-medium text-gray-700">Email Address *</label>
                <input
                  {...register('email', {
                    required: 'Email is required',
                    validate: value => validateEmail(value) || 'Invalid email address'
                  })}
                  type="email"
                  className="mt-1 input-field"
                  placeholder="john.doe@company.com"
                />
                {errors.email && (
                  <p className="mt-1 text-sm text-red-600 flex items-center">
                    <AlertCircle className="h-4 w-4 mr-1" />
                    {errors.email.message}
                  </p>
                )}
              </div>

              {/* Password */}
              <div>
                <label className="block text-sm font-medium text-gray-700">Password *</label>
                <div className="mt-1 relative">
                  <input
                    {...register('password', {
                      required: 'Password is required',
                      validate: value => {
                        const validation = validatePassword(value);
                        return validation.isValid || validation.errors[0];
                      }
                    })}
                    id="password"
                    type={showPassword ? 'text' : 'password'}
                    className="input-field pr-20"
                    placeholder="Strong password"
                  />
                  <div className="absolute inset-y-0 right-0 flex items-center space-x-1 pr-3">
                    <button
                      type="button"
                      onClick={handleGeneratePassword}
                      className="text-xs bg-primary-100 text-primary-600 px-2 py-1 rounded hover:bg-primary-200"
                    >
                      Generate
                    </button>
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="text-gray-400 hover:text-gray-600"
                    >
                      {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                    </button>
                  </div>
                </div>
                {errors.password && (
                  <p className="mt-1 text-sm text-red-600 flex items-center">
                    <AlertCircle className="h-4 w-4 mr-1" />
                    {errors.password.message}
                  </p>
                )}
              </div>


              {/* Role */}
              <div>
                <label className="block text-sm font-medium text-gray-700">Role *</label>
                <select
                  {...register('role', { required: 'Role is required' })}
                  className="mt-1 input-field"
                >
                  <option value="">Select role</option>
                  {availableRoles
                    .filter(role => role.value === 'service-delivery' || role.value === 'service-onboarding' || role.value === 'head-of-sales' || role.value === 'ceo' || role.value === 'co-founder' || role.value === 'manager' || role.value === 'hr')
                    .map(role => (
                      <option key={role.value} value={role.value}>
                        {role.label} - {role.description}
                      </option>
                    ))}
                </select>
                {errors.role && (
                  <p className="mt-1 text-sm text-red-600 flex items-center">
                    <AlertCircle className="h-4 w-4 mr-1" />
                    {errors.role.message}
                  </p>
                )}
              </div>


              {/* Department - Not shown for co-founder */}
              {watchedRole && watchedRole !== 'co-founder' && (
                <div>
                  <label className="block text-sm font-medium text-gray-700">Department</label>
                  <select
                    {...register('department')}
                    className="mt-1 input-field"
                  >
                    {departmentOptions.map(option => (
                      <option key={option.value} value={option.value}>
                        {option.label}
                      </option>
                    ))}
                  </select>
                </div>
              )}

              {/* Date of Birth */}
              <div>
                <label className="block text-sm font-medium text-gray-700">Date of Birth</label>
                <input
                  {...register('dateOfBirth', {
                    required: 'Date of birth is required',
                    validate: {
                      validAge: (value) => {
                        const today = new Date();
                        const dob = new Date(value);
                        const age = today.getFullYear() - dob.getFullYear();
                        if (age < 16 || age > 100) {
                          return 'Age must be between 16 and 100 years';
                        }
                        return true;
                      }
                    }
                  })}
                  type="date"
                  className="mt-1 input-field"
                />
                {errors.dateOfBirth && (
                  <p className="mt-1 text-sm text-red-600 flex items-center">
                    <AlertCircle className="h-4 w-4 mr-1" />
                    {errors.dateOfBirth.message}
                  </p>
                )}
              </div>

              {/* Phone Number */}
              <div>
                <label className="block text-sm font-medium text-gray-700">Phone Number</label>
                <input
                  {...register('phoneNumber', {
                    pattern: { value: /^\+?[\d\s-()]+$/, message: 'Invalid phone number' }
                  })}
                  type="tel"
                  className="mt-1 input-field"
                  placeholder="+1 (555) 123-4567"
                />
                {errors.phoneNumber && (
                  <p className="mt-1 text-sm text-red-600 flex items-center">
                    <AlertCircle className="h-4 w-4 mr-1" />
                    {errors.phoneNumber.message}
                  </p>
                )}
              </div>

              {/* Employee ID will be auto-generated by the backend */}

              {/* Submit Button */}
              <div className="flex justify-end space-x-3 pt-4">
                <button
                  type="button"
                  onClick={() => setShowCreateModal(false)}
                  className="px-4 py-2 border border-gray-300 rounded-lg text-sm font-medium text-gray-700 hover:bg-gray-50"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={createLoading}
                  className="px-4 py-2 border border-transparent rounded-lg shadow-sm text-sm font-medium text-white bg-primary-600 hover:bg-primary-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500 disabled:opacity-50"
                >
                  {createLoading ? (
                    <div className="flex items-center">
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                      Creating...
                    </div>
                  ) : (
                    <div className="flex items-center">
                      <Check className="h-4 w-4 mr-2" />
                      Create User
                    </div>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Edit User Modal */}
      {showEditModal && editingUser && (
        <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
          <div className="relative top-20 mx-auto p-5 border w-full max-w-md shadow-lg rounded-lg bg-white">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-medium text-gray-900">Edit User</h3>
              <button
                onClick={() => {
                  setShowEditModal(false);
                  setEditingUser(null);
                  editReset();
                }}
                className="text-gray-400 hover:text-gray-600"
              >
                <X className="h-6 w-6" />
              </button>
            </div>

            <form onSubmit={editHandleSubmit(onEditSubmit)} className="space-y-4">
              {/* First Name */}
              <div>
                <label className="block text-sm font-medium text-gray-700">First Name</label>
                <input
                  {...editRegister('firstName', {
                    required: 'First name is required',
                    minLength: { value: 2, message: 'First name must be at least 2 characters' }
                  })}
                  className="mt-1 input-field"
                  placeholder="John"
                />
                {editErrors.firstName && (
                  <p className="mt-1 text-sm text-red-600 flex items-center">
                    <AlertCircle className="h-4 w-4 mr-1" />
                    {editErrors.firstName.message}
                  </p>
                )}
              </div>

              {/* Last Name */}
              <div>
                <label className="block text-sm font-medium text-gray-700">Last Name</label>
                <input
                  {...editRegister('lastName', {
                    required: 'Last name is required',
                    minLength: { value: 2, message: 'Last name must be at least 2 characters' }
                  })}
                  className="mt-1 input-field"
                  placeholder="Doe"
                />
                {editErrors.lastName && (
                  <p className="mt-1 text-sm text-red-600 flex items-center">
                    <AlertCircle className="h-4 w-4 mr-1" />
                    {editErrors.lastName.message}
                  </p>
                )}
              </div>

              {/* Email */}
              <div>
                <label className="block text-sm font-medium text-gray-700">Email</label>
                <input
                  {...editRegister('email', {
                    required: 'Email is required',
                    pattern: { value: /^\S+@\S+$/i, message: 'Invalid email address' }
                  })}
                  type="email"
                  className="mt-1 input-field"
                  placeholder="john.doe@example.com"
                />
                {editErrors.email && (
                  <p className="mt-1 text-sm text-red-600 flex items-center">
                    <AlertCircle className="h-4 w-4 mr-1" />
                    {editErrors.email.message}
                  </p>
                )}
              </div>



              {/* Department - Not shown for co-founder */}
              {editingUser.role !== 'co-founder' && (
                <div>
                  <label className="block text-sm font-medium text-gray-700">Department</label>
                  <select
                    {...editRegister('department')}
                    className="mt-1 input-field"
                  >
                    {departmentOptions.map(option => (
                      <option key={option.value} value={option.value}>
                        {option.label}
                      </option>
                    ))}
                  </select>
                </div>
              )}

              {/* Date of Birth */}
              <div>
                <label className="block text-sm font-medium text-gray-700">Date of Birth</label>
                <input
                  {...editRegister('dateOfBirth', {
                    required: 'Date of birth is required'
                  })}
                  type="date"
                  className="mt-1 input-field"
                />
                {editErrors.dateOfBirth && (
                  <p className="mt-1 text-sm text-red-600 flex items-center">
                    <AlertCircle className="h-4 w-4 mr-1" />
                    {editErrors.dateOfBirth.message}
                  </p>
                )}
              </div>

              {/* Phone Number */}
              <div>
                <label className="block text-sm font-medium text-gray-700">Phone Number</label>
                <input
                  {...editRegister('phoneNumber', {
                    pattern: { value: /^\+?[\d\s-()]+$/, message: 'Invalid phone number' }
                  })}
                  type="tel"
                  className="mt-1 input-field"
                  placeholder="+1 (555) 123-4567"
                />
                {editErrors.phoneNumber && (
                  <p className="mt-1 text-sm text-red-600 flex items-center">
                    <AlertCircle className="h-4 w-4 mr-1" />
                    {editErrors.phoneNumber.message}
                  </p>
                )}
              </div>

              {/* Active Status */}
              <div className="flex items-center">
                <input
                  {...editRegister('isActive')}
                  type="checkbox"
                  className="h-4 w-4 text-primary-600 focus:ring-primary-500 border-gray-300 rounded"
                />
                <label className="ml-2 block text-sm text-gray-900">
                  Active User
                </label>
              </div>

              {/* Submit Button */}
              <div className="flex justify-end space-x-3 pt-4">
                <button
                  type="button"
                  onClick={() => {
                    setShowEditModal(false);
                    setEditingUser(null);
                    editReset();
                  }}
                  className="px-4 py-2 border border-gray-300 rounded-lg text-sm font-medium text-gray-700 hover:bg-gray-50"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={editLoading}
                  className="px-4 py-2 border border-transparent rounded-lg shadow-sm text-sm font-medium text-white bg-primary-600 hover:bg-primary-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500 disabled:opacity-50"
                >
                  {editLoading ? (
                    <div className="flex items-center">
                      <RefreshCw className="animate-spin h-4 w-4 mr-2" />
                      Updating...
                    </div>
                  ) : (
                    <div className="flex items-center">
                      <Save className="h-4 w-4 mr-2" />
                      Update User
                    </div>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default UserManagement;