import React, { useState } from 'react';
import { useForm } from 'react-hook-form';
import { Eye, EyeOff, AlertCircle, Lock, ArrowLeft, Check, Shield } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useLocation, useNavigate } from 'react-router-dom';
import api from '../utils/api';
import toast from 'react-hot-toast';
import { motion } from 'framer-motion';

const ChangePassword = ({ onBack }) => {
  const { user } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();
  const [showCurrentPassword, setShowCurrentPassword] = useState(false);
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [loading, setLoading] = useState(false);

  // Check if this is a first login scenario
  const isFirstLogin = location.state?.isFirstLogin || false;
  const message = location.state?.message || '';

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
      const response = await api.post('/users/change-password', {
        currentPassword: data.currentPassword,
        newPassword: data.newPassword
      });

      if (response.data.success) {
        toast.success('Password changed successfully!');
        reset();

        if (isFirstLogin) {
          navigate('/dashboard');
        } else if (onBack) {
          onBack();
        } else {
          navigate('/dashboard');
        }
      }
    } catch (error) {
      const message = error.response?.data?.message || 'Failed to change password';
      toast.error(message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-zinc-950 relative overflow-hidden px-4 sm:px-6 lg:px-8">
      {/* Animated Background Elements */}
      <div className="absolute inset-0 w-full h-full overflow-hidden pointer-events-none">
        <motion.div
          animate={{
            scale: [1, 1.2, 1],
            opacity: [0.2, 0.4, 0.2],
            x: [0, -30, 0],
            y: [0, 40, 0],
          }}
          transition={{
            duration: 12,
            repeat: Infinity,
            ease: "easeInOut"
          }}
          className="absolute top-0 right-0 w-[700px] h-[700px] bg-emerald-600/10 rounded-full blur-[120px]"
        />
        <motion.div
          animate={{
            scale: [1, 1.1, 1],
            opacity: [0.2, 0.4, 0.2],
            x: [0, 40, 0],
            y: [0, -30, 0],
          }}
          transition={{
            duration: 10,
            repeat: Infinity,
            ease: "easeInOut",
            delay: 1
          }}
          className="absolute bottom-0 left-0 w-[600px] h-[600px] bg-blue-600/10 rounded-full blur-[100px]"
        />
        <div className="absolute inset-0 bg-[url('https://grainy-gradients.vercel.app/noise.svg')] opacity-20 brightness-100 contrast-150 mix-blend-overlay"></div>
      </div>

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6, ease: "easeOut" }}
        className="max-w-md w-full relative z-10"
      >
        <div className="bg-zinc-900/40 backdrop-blur-xl border border-white/10 rounded-2xl shadow-2xl p-8 overflow-hidden relative">

          <div className="text-center mb-8">
            <motion.div
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              transition={{ type: "spring", stiffness: 200, damping: 15, delay: 0.2 }}
              className="mx-auto h-16 w-16 flex items-center justify-center rounded-2xl bg-gradient-to-br from-emerald-500 to-teal-600 shadow-lg shadow-emerald-500/20 mb-4"
            >
              <Shield className="h-8 w-8 text-white" />
            </motion.div>
            <h2 className="text-2xl font-bold text-white tracking-tight">
              {isFirstLogin ? 'Set New Password' : 'Change Password'}
            </h2>
            <p className="mt-2 text-sm text-zinc-400">
              {isFirstLogin
                ? message || 'Secure your account with a new password'
                : 'Update your password to keep your account safe'
              }
            </p>

            {isFirstLogin && (
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.4 }}
                className="mt-4 bg-amber-500/10 border border-amber-500/20 rounded-xl p-3"
              >
                <p className="text-xs text-amber-400 font-medium flex items-center justify-center">
                  <Lock className="w-3 h-3 mr-1.5" />
                  Security requirement for new accounts
                </p>
              </motion.div>
            )}
          </div>

          <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
            {/* Current Password */}
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-zinc-300 mb-1.5 ml-1">
                  Current Password
                </label>
                <div className="relative group">
                  <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none">
                    <Lock className="h-5 w-5 text-zinc-500 group-focus-within:text-emerald-400 transition-colors" />
                  </div>
                  <input
                    {...register('currentPassword', {
                      required: 'Current password is required'
                    })}
                    type={showCurrentPassword ? 'text' : 'password'}
                    className={`block w-full pl-11 pr-11 py-3 bg-zinc-900/50 border ${errors.currentPassword ? 'border-red-500/50' : 'border-zinc-700/50'} rounded-xl text-white placeholder-zinc-500 focus:outline-none focus:ring-4 focus:ring-emerald-500/20 focus:border-emerald-500 transition-all sm:text-sm`}
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
                    <Key className="h-5 w-5 text-zinc-500 group-focus-within:text-emerald-400 transition-colors" />
                  </div>
                  <input
                    {...register('newPassword', {
                      required: 'New password is required',
                      minLength: {
                        value: 8,
                        message: 'At least 8 characters'
                      },
                      pattern: {
                        value: /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]/,
                        message: 'Missing requirements (Upper, Lower, Number, Special)'
                      }
                    })}
                    type={showNewPassword ? 'text' : 'password'}
                    className={`block w-full pl-11 pr-11 py-3 bg-zinc-900/50 border ${errors.newPassword ? 'border-red-500/50' : 'border-zinc-700/50'} rounded-xl text-white placeholder-zinc-500 focus:outline-none focus:ring-4 focus:ring-emerald-500/20 focus:border-emerald-500 transition-all sm:text-sm`}
                    placeholder="Create new password"
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

              {/* Confirm New Password */}
              <div>
                <label className="block text-sm font-medium text-zinc-300 mb-1.5 ml-1">
                  Confirm Password
                </label>
                <div className="relative group">
                  <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none">
                    <Check className="h-5 w-5 text-zinc-500 group-focus-within:text-emerald-400 transition-colors" />
                  </div>
                  <input
                    {...register('confirmPassword', {
                      required: 'Please confirm password',
                      validate: value =>
                        value === newPassword || 'Passwords do not match'
                    })}
                    type={showConfirmPassword ? 'text' : 'password'}
                    className={`block w-full pl-11 pr-11 py-3 bg-zinc-900/50 border ${errors.confirmPassword ? 'border-red-500/50' : 'border-zinc-700/50'} rounded-xl text-white placeholder-zinc-500 focus:outline-none focus:ring-4 focus:ring-emerald-500/20 focus:border-emerald-500 transition-all sm:text-sm`}
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
              <p className="text-xs font-medium text-zinc-400 mb-2">Password Standards:</p>
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

            <div className="pt-2 flex items-center space-x-4">
              {onBack && !isFirstLogin && (
                <button
                  onClick={onBack}
                  type="button"
                  className="flex items-center justify-center px-4 py-3.5 border border-zinc-700 rounded-xl text-zinc-300 hover:text-white hover:bg-zinc-800 transition-colors w-1/3 text-sm font-medium"
                >
                  <ArrowLeft className="h-4 w-4 mr-2" />
                  Back
                </button>
              )}

              <button
                type="submit"
                disabled={loading}
                className={`flex-1 flex justify-center items-center py-3.5 px-4 rounded-xl text-white bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 transition-all font-semibold shadow-lg shadow-emerald-500/25 disabled:opacity-50 disabled:cursor-not-allowed text-sm ${!onBack && 'w-full'}`}
              >
                {loading ? (
                  <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
                ) : (
                  'Change Password'
                )}
              </button>
            </div>

            {!onBack && !isFirstLogin && (
              <div className="text-center">
                <button
                  type="button"
                  onClick={() => navigate(-1)}
                  className="text-xs text-zinc-500 hover:text-zinc-300 transition-colors flex items-center justify-center mx-auto"
                >
                  <ArrowLeft className="h-3 w-3 mr-1" />
                  Go Back
                </button>
              </div>
            )}
          </form>
        </div>
      </motion.div>
    </div>
  );
};

export default ChangePassword;