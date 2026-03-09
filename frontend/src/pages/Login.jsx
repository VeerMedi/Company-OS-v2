import React, { useState } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { Eye, EyeOff, Mail, Lock, AlertCircle, ArrowRight } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { validateEmail } from '../utils/helpers';
import { motion, AnimatePresence } from 'framer-motion';
import toast from 'react-hot-toast';

const Login = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { login, isLoading } = useAuth();
  const [showPassword, setShowPassword] = useState(false);

  const {
    register,
    handleSubmit,
    formState: { errors },
    setError,
  } = useForm();

  const onSubmit = async (data) => {
    const result = await login(data.email, data.password);

    if (result.success) {
      if (result.requirePasswordChange) {
        navigate('/change-password', {
          state: {
            isFirstLogin: true,
            message: 'For security, please change your password before continuing.'
          }
        });
      } else {
        // Redirect to previous page if it exists, otherwise go to dashboard
        const from = location.state?.from?.pathname || '/dashboard';
        navigate(from, { replace: true });
      }
    } else {
      if (result.errors) {
        result.errors.forEach(error => {
          setError(error.param, { message: error.msg });
        });
      }
    }
  };

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.5 }}
        className="min-h-screen flex items-center justify-center bg-zinc-950 relative overflow-hidden px-4 sm:px-6 lg:px-8"
      >
        {/* Animated Background Elements */}
        <div className="absolute inset-0 w-full h-full overflow-hidden bg-zinc-950">

          {/* Modern Grid Pattern */}
          <div className="absolute inset-0 bg-[linear-gradient(to_right,#80808012_1px,transparent_1px),linear-gradient(to_bottom,#80808012_1px,transparent_1px)] bg-[size:24px_24px]"></div>

          {/* Floating Colorful Shapes - High Visibility */}
          {[...Array(15)].map((_, i) => (
            <motion.div
              key={i}
              className={`absolute ${i % 3 === 0 ? 'rounded-full' : 'rounded-2xl rotate-45'} backdrop-blur-3xl`}
              initial={{
                x: Math.random() * 100 + "%",
                y: Math.random() * 100 + "%",
                scale: Math.random() * 0.5 + 0.5,
                opacity: 0,
              }}
              animate={{
                y: [null, Math.random() * -100 + "%"],
                x: [null, Math.random() * 50 - 25 + "%"],
                rotate: [0, Math.random() * 360],
                opacity: [0, 0.6, 0],
              }}
              transition={{
                duration: Math.random() * 20 + 15,
                repeat: Infinity,
                ease: "linear",
                delay: Math.random() * 5,
              }}
              style={{
                width: Math.random() * 100 + 50 + "px",
                height: Math.random() * 100 + 50 + "px",
                backgroundColor: i % 3 === 0 ? 'rgba(59, 130, 246, 0.15)' : i % 3 === 1 ? 'rgba(168, 85, 247, 0.15)' : 'rgba(16, 185, 129, 0.15)',
                boxShadow: "0 8px 32px 0 rgba(31, 38, 135, 0.15)"
              }}
            />
          ))}

          {/* Strong Ambient Gradients */}
          <motion.div
            animate={{
              scale: [1, 1.2, 1],
              opacity: [0.3, 0.5, 0.3],
            }}
            transition={{
              duration: 10,
              repeat: Infinity,
              ease: "easeInOut"
            }}
            className="absolute -top-[20%] -left-[10%] w-[800px] h-[800px] bg-blue-600/30 rounded-full blur-[100px]"
          />
          <motion.div
            animate={{
              scale: [1, 1.1, 1],
              opacity: [0.3, 0.5, 0.3],
            }}
            transition={{
              duration: 12,
              repeat: Infinity,
              ease: "easeInOut",
              delay: 1
            }}
            className="absolute -bottom-[20%] -right-[10%] w-[800px] h-[800px] bg-purple-600/30 rounded-full blur-[100px]"
          />

          {/* Radial Gradient Overlay */}
          <div className="absolute inset-0 bg-zinc-950/30 bg-[radial-gradient(circle_at_center,transparent_0%,rgba(9,9,11,0.8)_100%)]"></div>
        </div>

        <motion.div
          initial={{ opacity: 0, y: 20, scale: 0.95 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          transition={{ duration: 0.6, ease: "easeOut" }}
          className="max-w-md w-full relative z-10"
        >
          <div className="bg-gradient-to-b from-zinc-900/80 via-zinc-900/60 to-zinc-950/90 backdrop-blur-2xl border border-white/10 rounded-3xl shadow-[0_0_50px_-12px_rgba(0,0,0,0.7)] p-10 overflow-hidden relative ring-1 ring-white/5 transition-all duration-500">

            {/* Decorative Inner Glows */}
            <div className="absolute -top-24 -right-24 w-48 h-48 bg-blue-500/20 rounded-full blur-3xl pointer-events-none"></div>
            <div className="absolute -bottom-24 -left-24 w-48 h-48 bg-purple-500/20 rounded-full blur-3xl pointer-events-none"></div>

            {/* Top Highlight Line */}
            <div className="absolute top-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-white/20 to-transparent"></div>

            <div className="text-center mb-10 relative">
              <motion.div
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                transition={{ type: "spring", stiffness: 200, damping: 15, delay: 0.2 }}
                className="mx-auto h-16 w-16 flex items-center justify-center rounded-2xl bg-gradient-to-br from-blue-600 to-indigo-600 shadow-lg shadow-blue-500/30 mb-6"
              >
                <span className="text-white font-bold text-xl">HS</span>
              </motion.div>
              <motion.h2
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.3 }}
                className="text-3xl font-bold text-white tracking-tight"
              >
                Welcome Back
              </motion.h2>
              <motion.p
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.4 }}
                className="mt-3 text-base text-zinc-400"
              >
                Sign in to manage your <span className="text-blue-400 font-medium">Hustle System</span>
              </motion.p>
            </div>

            <form className="space-y-6 relative" onSubmit={handleSubmit(onSubmit)}>
              <div className="space-y-5">
                {/* Email Field */}
                <motion.div
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: 0.5 }}
                >
                  <label htmlFor="email" className="block text-sm font-medium text-zinc-300 mb-1.5 ml-1">
                    Email address
                  </label>
                  <div className="relative group">
                    <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none">
                      <Mail className="h-5 w-5 text-zinc-500 group-focus-within:text-blue-400 transition-colors" />
                    </div>
                    <input
                      {...register('email', {
                        required: 'Email is required',
                        validate: value => validateEmail(value) || 'Invalid email address',
                      })}
                      type="email"
                      autoComplete="email"
                      className={`block w-full pl-11 pr-3 py-3.5 bg-zinc-900/50 border ${errors.email ? 'border-red-500/50 focus:border-red-500 focus:ring-red-500/20' : 'border-zinc-700/50 focus:border-blue-500 focus:ring-blue-500/20'
                        } rounded-xl text-white placeholder-zinc-500 focus:outline-none focus:ring-4 transition-all duration-200 sm:text-sm`}
                      placeholder="Enter your email"
                    />
                  </div>
                  {errors.email && (
                    <motion.div
                      initial={{ opacity: 0, height: 0 }}
                      animate={{ opacity: 1, height: 'auto' }}
                      className="mt-1.5 flex items-center text-xs text-red-400 ml-1"
                    >
                      <AlertCircle className="h-3 w-3 mr-1" />
                      {errors.email.message}
                    </motion.div>
                  )}
                </motion.div>

                {/* Password Field */}
                <motion.div
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: 0.6 }}
                >
                  <label htmlFor="password" className="block text-sm font-medium text-zinc-300 mb-1.5 ml-1">
                    Password
                  </label>
                  <div className="relative group">
                    <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none">
                      <Lock className="h-5 w-5 text-zinc-500 group-focus-within:text-blue-400 transition-colors" />
                    </div>
                    <input
                      {...register('password', {
                        required: 'Password is required',
                      })}
                      type={showPassword ? 'text' : 'password'}
                      autoComplete="current-password"
                      className={`block w-full pl-11 pr-11 py-3.5 bg-zinc-900/50 border ${errors.password ? 'border-red-500/50 focus:border-red-500 focus:ring-red-500/20' : 'border-zinc-700/50 focus:border-blue-500 focus:ring-blue-500/20'
                        } rounded-xl text-white placeholder-zinc-500 focus:outline-none focus:ring-4 transition-all duration-200 sm:text-sm`}
                      placeholder="Enter your password"
                    />
                    <button
                      type="button"
                      className="absolute inset-y-0 right-0 pr-3.5 flex items-center"
                      onClick={() => setShowPassword(!showPassword)}
                    >
                      {showPassword ? (
                        <EyeOff className="h-5 w-5 text-zinc-500 hover:text-white transition-colors" />
                      ) : (
                        <Eye className="h-5 w-5 text-zinc-500 hover:text-white transition-colors" />
                      )}
                    </button>
                  </div>
                  {errors.password && (
                    <motion.div
                      initial={{ opacity: 0, height: 0 }}
                      animate={{ opacity: 1, height: 'auto' }}
                      className="mt-1.5 flex items-center text-xs text-red-400 ml-1"
                    >
                      <AlertCircle className="h-3 w-3 mr-1" />
                      {errors.password.message}
                    </motion.div>
                  )}
                </motion.div>
              </div>

              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.7 }}
                className="flex items-center justify-between"
              >
                <div className="flex items-center">
                  <input
                    id="remember-me"
                    name="remember-me"
                    type="checkbox"
                    className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-zinc-700 rounded bg-zinc-800/50 transition-colors"
                  />
                  <label htmlFor="remember-me" className="ml-2 block text-sm text-zinc-400 hover:text-zinc-300 cursor-pointer transition-colors">
                    Remember me
                  </label>
                </div>

                <div className="text-sm">
                  <Link
                    to="/forgot-password"
                    className="font-medium text-blue-400 hover:text-blue-300 transition-colors"
                  >
                    Forgot password?
                  </Link>
                </div>
              </motion.div>

              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.8 }}
              >
                <button
                  type="submit"
                  disabled={isLoading}
                  className="group relative w-full flex justify-center items-center py-3.5 px-4 border border-transparent text-sm font-semibold rounded-xl text-white bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-zinc-900 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200 shadow-lg shadow-blue-500/25 hover:shadow-blue-500/40"
                >
                  {isLoading ? (
                    <svg className="animate-spin -ml-1 mr-2 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                    </svg>
                  ) : (
                    <>
                      Sign in
                      <ArrowRight className="ml-2 h-4 w-4 group-hover:translate-x-1 transition-transform" />
                    </>
                  )}
                </button>
              </motion.div>

              <div className="text-center mt-6">
                <span className="text-xs text-zinc-500">
                  Need help? Contact system administrator
                </span>
              </div>
            </form>
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
};

export default Login;