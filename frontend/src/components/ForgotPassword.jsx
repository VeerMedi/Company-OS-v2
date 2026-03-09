import React, { useState } from 'react';
import { useForm } from 'react-hook-form';
import { AlertCircle, Mail, Calendar, ArrowLeft, Key, ArrowRight } from 'lucide-react';
import { Link } from 'react-router-dom';
import api from '../utils/api';
import toast from 'react-hot-toast';
import { motion } from 'framer-motion';

const ForgotPassword = () => {
  const [loading, setLoading] = useState(false);
  const [resetSuccess, setResetSuccess] = useState(false);
  const [temporaryPassword, setTemporaryPassword] = useState('');

  const {
    register,
    handleSubmit,
    formState: { errors },
    reset
  } = useForm();

  const onSubmit = async (data) => {
    setLoading(true);
    try {
      const response = await api.post('/users/forgot-password', {
        email: data.email,
        dateOfBirth: data.dateOfBirth
      });

      if (response.data.success) {
        setResetSuccess(true);

        // Check if password was sent via email or provided directly
        if (response.data.data.emailSent) {
          toast.success('Your password has been sent to your email address!');
        } else if (response.data.data.originalPassword) {
          setTemporaryPassword(response.data.data.originalPassword);
          toast.success('Password recovered! Please check below and change it immediately after login.');
        }

        // Show HR notification status
        if (response.data.data.hrNotified) {
          toast.info('HR has been notified of your password request.');
        }
      }
    } catch (error) {
      const errorMessage = error.response?.data?.message || 'Password recovery failed';
      toast.error(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-zinc-950 relative overflow-hidden px-4 sm:px-6 lg:px-8">
      {/* Animated Background Elements */}
      <div className="absolute inset-0 w-full h-full overflow-hidden">
        <motion.div
          animate={{
            scale: [1, 1.2, 1],
            opacity: [0.3, 0.5, 0.3],
            x: [0, 50, 0],
            y: [0, -30, 0],
          }}
          transition={{
            duration: 10,
            repeat: Infinity,
            ease: "easeInOut"
          }}
          className="absolute -top-1/2 -left-1/4 w-[800px] h-[800px] bg-blue-600/20 rounded-full blur-[120px]"
        />
        <motion.div
          animate={{
            scale: [1, 1.1, 1],
            opacity: [0.3, 0.5, 0.3],
            x: [0, -30, 0],
            y: [0, 50, 0],
          }}
          transition={{
            duration: 8,
            repeat: Infinity,
            ease: "easeInOut",
            delay: 1
          }}
          className="absolute -bottom-1/4 -right-1/4 w-[600px] h-[600px] bg-indigo-600/20 rounded-full blur-[100px]"
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

          {resetSuccess ? (
            <div className="space-y-6">
              <div className="flex justify-center">
                <div className="flex items-center justify-center w-20 h-20 bg-emerald-500/20 rounded-full border border-emerald-500/30">
                  <Key className="h-10 w-10 text-emerald-400" />
                </div>
              </div>

              <div className="text-center">
                <h2 className="text-2xl font-bold text-white mb-2">Recovery Successful</h2>
                <p className="text-zinc-400 text-sm">
                  {temporaryPassword ?
                    'Your original password is displayed below. Keep it safe!' :
                    'Your original password has been sent to your email.'
                  }
                </p>
              </div>

              {temporaryPassword && (
                <div className="bg-amber-500/10 border border-amber-500/30 rounded-xl p-4">
                  <h3 className="text-xs font-semibold uppercase text-amber-500 mb-2 tracking-wider">
                    Original Password
                  </h3>
                  <div className="bg-zinc-900/50 p-3 rounded-lg border border-amber-500/20 flex justify-center">
                    <code className="text-lg font-mono text-white tracking-widest">
                      {temporaryPassword}
                    </code>
                  </div>
                  <p className="text-xs text-amber-400/80 mt-2 flex items-center">
                    <AlertCircle className="w-3 h-3 mr-1" />
                    Save this quickly. You must change it upon login.
                  </p>
                </div>
              )}

              <div className="bg-blue-500/10 border border-blue-500/20 rounded-xl p-4">
                <h4 className="text-sm font-medium text-blue-400 mb-1 flex items-center">
                  Security Notice
                </h4>
                <p className="text-xs text-blue-300/80">
                  HR has been notified of this recovery request.
                </p>
              </div>

              <div className="space-y-3 pt-2">
                <Link
                  to="/login"
                  className="w-full flex justify-center items-center py-3 px-4 rounded-xl text-white bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 transition-all font-medium shadow-lg shadow-blue-500/25"
                >
                  Go to Login
                  <ArrowRight className="ml-2 h-4 w-4" />
                </Link>

                <button
                  onClick={() => {
                    setResetSuccess(false);
                    setTemporaryPassword('');
                    reset();
                  }}
                  className="w-full text-center text-sm text-zinc-400 hover:text-white transition-colors py-2"
                >
                  Reset another password
                </button>
              </div>
            </div>
          ) : (
            <>
              <div className="text-center mb-8">
                <motion.div
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  transition={{ type: "spring", stiffness: 200, damping: 15, delay: 0.2 }}
                  className="mx-auto h-16 w-16 flex items-center justify-center rounded-2xl bg-gradient-to-br from-blue-600 to-indigo-600 shadow-lg shadow-blue-500/20 mb-4"
                >
                  <Key className="h-8 w-8 text-white" />
                </motion.div>
                <h2 className="text-2xl font-bold text-white tracking-tight">
                  Forgot Password?
                </h2>
                <p className="mt-2 text-sm text-zinc-400">
                  Enter your details to recover your account access
                </p>
              </div>

              <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
                <div className="space-y-4">
                  {/* Email */}
                  <div>
                    <label className="block text-sm font-medium text-zinc-300 mb-1.5 ml-1">
                      Email Address
                    </label>
                    <div className="relative group">
                      <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none">
                        <Mail className="h-5 w-5 text-zinc-500 group-focus-within:text-blue-400 transition-colors" />
                      </div>
                      <input
                        {...register('email', {
                          required: 'Email is required',
                          pattern: {
                            value: /^[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}$/i,
                            message: 'Invalid email address'
                          }
                        })}
                        type="email"
                        className={`block w-full pl-11 pr-3 py-3 bg-zinc-900/50 border ${errors.email ? 'border-red-500/50' : 'border-zinc-700/50'} rounded-xl text-white placeholder-zinc-500 focus:outline-none focus:ring-4 focus:ring-blue-500/20 focus:border-blue-500 transition-all sm:text-sm`}
                        placeholder="Enter your email address"
                      />
                    </div>
                    {errors.email && (
                      <p className="mt-1.5 text-xs text-red-400 flex items-center ml-1">
                        <AlertCircle className="h-3 w-3 mr-1" />
                        {errors.email.message}
                      </p>
                    )}
                  </div>

                  {/* Date of Birth */}
                  <div>
                    <label className="block text-sm font-medium text-zinc-300 mb-1.5 ml-1">
                      Date of Birth
                    </label>
                    <div className="relative group">
                      <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none">
                        <Calendar className="h-5 w-5 text-zinc-500 group-focus-within:text-blue-400 transition-colors" />
                      </div>
                      <input
                        {...register('dateOfBirth', {
                          required: 'Date of birth is required'
                        })}
                        type="date"
                        className={`block w-full pl-11 pr-3 py-3 bg-zinc-900/50 border ${errors.dateOfBirth ? 'border-red-500/50' : 'border-zinc-700/50'} rounded-xl text-white placeholder-zinc-500 focus:outline-none focus:ring-4 focus:ring-blue-500/20 focus:border-blue-500 transition-all sm:text-sm`}
                      />
                    </div>
                    {errors.dateOfBirth && (
                      <p className="mt-1.5 text-xs text-red-400 flex items-center ml-1">
                        <AlertCircle className="h-3 w-3 mr-1" />
                        {errors.dateOfBirth.message}
                      </p>
                    )}
                  </div>
                </div>

                <div className="bg-blue-500/10 border border-blue-500/20 rounded-xl p-3 flex items-start">
                  <AlertCircle className="w-5 h-5 text-blue-400 mr-2 shrink-0 mt-0.5" />
                  <p className="text-xs text-blue-300 leading-relaxed">
                    For security, we verify your identity using your recorded date of birth.
                  </p>
                </div>

                <div className="pt-2 space-y-4">
                  <button
                    type="submit"
                    disabled={loading}
                    className="w-full flex justify-center items-center py-3.5 px-4 rounded-xl text-white bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 transition-all font-semibold shadow-lg shadow-blue-500/25 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {loading ? (
                      <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
                    ) : (
                      'Reset Password'
                    )}
                  </button>

                  <Link
                    to="/login"
                    className="flex items-center justify-center text-sm text-zinc-400 hover:text-white transition-colors"
                  >
                    <ArrowLeft className="h-4 w-4 mr-1" />
                    Back to Login
                  </Link>
                </div>
              </form>
            </>
          )}
        </div>
      </motion.div>
    </div>
  );
};

export default ForgotPassword;