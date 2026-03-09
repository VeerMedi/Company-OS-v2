import React, { useState } from 'react';
import { useForm } from 'react-hook-form';
import { Eye, EyeOff, Lock, AlertCircle, Shield, Check, LogOut } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { validatePassword } from '../utils/helpers';
import api from '../utils/api';
import toast from 'react-hot-toast';
import { motion, AnimatePresence } from 'framer-motion';

const FirstLoginPasswordModal = ({ isOpen, onPasswordChanged }) => {
  const { user, logout } = useAuth();
  const [showCurrentPassword, setShowCurrentPassword] = useState(false);
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [loading, setLoading] = useState(false);

  const {
    register,
    handleSubmit,
    formState: { errors },
    watch,
    reset
  } = useForm();

  const newPassword = watch('newPassword');

  const onSubmit = async (data) => {
    setLoading(true);
    try {
      const response = await api.put('/auth/change-password', {
        currentPassword: data.currentPassword,
        newPassword: data.newPassword,
        confirmPassword: data.confirmPassword
      });

      if (response.data.success) {
        toast.success('Password changed successfully! You can now access the system.');
        reset();
        onPasswordChanged(); // Notify parent component
      }
    } catch (error) {
      const message = error.response?.data?.message || 'Failed to change password';
      toast.error(message);
    } finally {
      setLoading(false);
    }
  };

  const handleLogout = () => {
    logout();
  };

  if (!isOpen) return null;

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
        {/* Backdrop */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="absolute inset-0 bg-black/80 backdrop-blur-sm"
        />

        {/* Modal */}
        <motion.div
          initial={{ scale: 0.95, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          exit={{ scale: 0.95, opacity: 0 }}
          transition={{ duration: 0.3 }}
          className="relative w-full max-w-md bg-zinc-900 border border-white/10 rounded-2xl shadow-2xl overflow-hidden"
        >
          {/* Header */}
          <div className="relative p-6 px-8 text-center border-b border-white/5 bg-zinc-800/30">
            <div className="mx-auto h-14 w-14 flex items-center justify-center rounded-2xl bg-amber-500/10 border border-amber-500/20 mb-4 shadow-lg shadow-amber-500/10">
              <Shield className="h-7 w-7 text-amber-500" />
            </div>
            <h2 className="text-xl font-bold text-white mb-2">
              Security Update Required
            </h2>
            <p className="text-sm text-zinc-400 leading-relaxed">
              To ensure the security of your account, please update your password before proceeding.
            </p>
          </div>

          {/* Form */}
          <div className="p-8">
            <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
              {/* Current Password */}
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-zinc-300 mb-1.5 ml-1">
                    Current Password
                  </label>
                  <div className="relative group">
                    <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none">
                      <Lock className="h-5 w-5 text-zinc-500 group-focus-within:text-amber-500 transition-colors" />
                    </div>
                    <input
                      {...register('currentPassword', {
                        required: 'Current password is required'
                      })}
                      type={showCurrentPassword ? 'text' : 'password'}
                      className={`block w-full pl-11 pr-11 py-3 bg-zinc-950/50 border ${errors.currentPassword ? 'border-red-500/50' : 'border-zinc-700/50'} rounded-xl text-white placeholder-zinc-600 focus:outline-none focus:ring-4 focus:ring-amber-500/20 focus:border-amber-500 transition-all sm:text-sm`}
                      placeholder="Enter current password"
                    />
                    <button
                      type="button"
                      className="absolute inset-y-0 right-0 pr-3.5 flex items-center"
                      onClick={() => setShowCurrentPassword(!showCurrentPassword)}
                    >
                      {showCurrentPassword ? (
                        <EyeOff className="h-5 w-5 text-zinc-500 hover:text-white transition-colors" />
                      ) : (
                        <Eye className="h-5 w-5 text-zinc-500 hover:text-white transition-colors" />
                      )}
                    </button>
                  </div>
                  {errors.currentPassword && (
                    <p className="mt-1.5 text-xs text-red-400 flex items-center ml-1">
                      <AlertCircle className="h-3 w-3 mr-1" />
                      {errors.currentPassword.message}
                    </p>
                  )}
                </div>

                {/* New Password */}
                <div>
                  <label className="block text-sm font-medium text-zinc-300 mb-1.5 ml-1">
                    New Password
                  </label>
                  <div className="relative group">
                    <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none">
                      <Lock className="h-5 w-5 text-zinc-500 group-focus-within:text-amber-500 transition-colors" />
                    </div>
                    <input
                      {...register('newPassword', {
                        required: 'New password is required',
                        validate: value => validatePassword(value).isValid || 'Password requirement not met'
                      })}
                      type={showNewPassword ? 'text' : 'password'}
                      className={`block w-full pl-11 pr-11 py-3 bg-zinc-950/50 border ${errors.newPassword ? 'border-red-500/50' : 'border-zinc-700/50'} rounded-xl text-white placeholder-zinc-600 focus:outline-none focus:ring-4 focus:ring-amber-500/20 focus:border-amber-500 transition-all sm:text-sm`}
                      placeholder="Create safe password"
                    />
                    <button
                      type="button"
                      className="absolute inset-y-0 right-0 pr-3.5 flex items-center"
                      onClick={() => setShowNewPassword(!showNewPassword)}
                    >
                      {showNewPassword ? (
                        <EyeOff className="h-5 w-5 text-zinc-500 hover:text-white transition-colors" />
                      ) : (
                        <Eye className="h-5 w-5 text-zinc-500 hover:text-white transition-colors" />
                      )}
                    </button>
                  </div>
                  {errors.newPassword && (
                    <p className="mt-1.5 text-xs text-red-400 flex items-center ml-1">
                      <AlertCircle className="h-3 w-3 mr-1" />
                      {errors.newPassword.message}
                    </p>
                  )}
                </div>

                {/* Confirm Password */}
                <div>
                  <label className="block text-sm font-medium text-zinc-300 mb-1.5 ml-1">
                    Confirm Password
                  </label>
                  <div className="relative group">
                    <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none">
                      <Check className="h-5 w-5 text-zinc-500 group-focus-within:text-amber-500 transition-colors" />
                    </div>
                    <input
                      {...register('confirmPassword', {
                        required: 'Please confirm password',
                        validate: value => value === newPassword || 'Passwords do not match'
                      })}
                      type={showConfirmPassword ? 'text' : 'password'}
                      className={`block w-full pl-11 pr-11 py-3 bg-zinc-950/50 border ${errors.confirmPassword ? 'border-red-500/50' : 'border-zinc-700/50'} rounded-xl text-white placeholder-zinc-600 focus:outline-none focus:ring-4 focus:ring-amber-500/20 focus:border-amber-500 transition-all sm:text-sm`}
                      placeholder="Repeat new password"
                    />
                    <button
                      type="button"
                      className="absolute inset-y-0 right-0 pr-3.5 flex items-center"
                      onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                    >
                      {showConfirmPassword ? (
                        <EyeOff className="h-5 w-5 text-zinc-500 hover:text-white transition-colors" />
                      ) : (
                        <Eye className="h-5 w-5 text-zinc-500 hover:text-white transition-colors" />
                      )}
                    </button>
                  </div>
                  {errors.confirmPassword && (
                    <p className="mt-1.5 text-xs text-red-400 flex items-center ml-1">
                      <AlertCircle className="h-3 w-3 mr-1" />
                      {errors.confirmPassword.message}
                    </p>
                  )}
                </div>
              </div>

              {/* Password Requirements */}
              <div className="bg-zinc-800/50 rounded-xl p-4 border border-zinc-700/50">
                <p className="text-xs font-medium text-zinc-400 mb-2">Password Must Contain:</p>
                <div className="grid grid-cols-2 gap-2">
                  <div className={`flex items-center text-xs ${newPassword?.length >= 8 ? 'text-emerald-400' : 'text-zinc-500'}`}>
                    <div className={`w-1.5 h-1.5 rounded-full mr-2 ${newPassword?.length >= 8 ? 'bg-emerald-400' : 'bg-zinc-600'}`} />
                    8+ Characters
                  </div>
                  <div className={`flex items-center text-xs ${/[A-Z]/.test(newPassword || '') ? 'text-emerald-400' : 'text-zinc-500'}`}>
                    <div className={`w-1.5 h-1.5 rounded-full mr-2 ${/[A-Z]/.test(newPassword || '') ? 'bg-emerald-400' : 'bg-zinc-600'}`} />
                    Uppercase
                  </div>
                  <div className={`flex items-center text-xs ${/\d/.test(newPassword || '') ? 'text-emerald-400' : 'text-zinc-500'}`}>
                    <div className={`w-1.5 h-1.5 rounded-full mr-2 ${/\d/.test(newPassword || '') ? 'bg-emerald-400' : 'bg-zinc-600'}`} />
                    Number
                  </div>
                  <div className={`flex items-center text-xs ${/[@$!%*?&]/.test(newPassword || '') ? 'text-emerald-400' : 'text-zinc-500'}`}>
                    <div className={`w-1.5 h-1.5 rounded-full mr-2 ${/[@$!%*?&]/.test(newPassword || '') ? 'bg-emerald-400' : 'bg-zinc-600'}`} />
                    Special Char
                  </div>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex space-x-3 pt-2">
                <button
                  type="button"
                  onClick={handleLogout}
                  className="flex-1 px-4 py-3 border border-zinc-700 rounded-xl text-zinc-300 hover:text-white hover:bg-zinc-800 transition-colors text-sm font-medium flex items-center justify-center"
                  disabled={loading}
                >
                  <LogOut className="w-4 h-4 mr-2" />
                  Logout
                </button>
                <button
                  type="submit"
                  disabled={loading}
                  className="flex-[2] flex justify-center items-center py-3 px-4 rounded-xl text-white bg-gradient-to-r from-amber-600 to-orange-600 hover:from-amber-500 hover:to-orange-500 transition-all font-semibold shadow-lg shadow-amber-500/25 disabled:opacity-50 disabled:cursor-not-allowed text-sm"
                >
                  {loading ? (
                    <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
                  ) : (
                    'Set New Password'
                  )}
                </button>
              </div>
            </form>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
};

export default FirstLoginPasswordModal;