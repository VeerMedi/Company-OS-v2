import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ChevronRight, Search, Sparkles, Users as UsersIcon, ArrowLeft, MessageSquare, Mic } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useTheme } from '../context/ThemeContext';
import { useNavigate, useLocation } from 'react-router-dom';
import api from '../utils/api';
import {
  Menu,
  X,
  User,
  Settings,
  LogOut,
  Bell,
  Home,
  Users,
  BarChart3,
  FileText,
  Shield,
  Sun,
  Moon,
  CheckCircle2
} from 'lucide-react';
import { getRoleColor, formatRole } from '../utils/helpers';
import DockNav from './DockNav';
import RightPeekPanel from './RightPeekPanel';
import ChatModal from './ChatModal';
import AIAnalyticsChat from './AIAnalyticsChat';
import QuickDetailsPanel from './QuickDetailsPanel';
import VoiceAgentModal from './voice/VoiceAgentModal';

const LeftPeekPanel = ({ onUserSelect, onAIAssistantSelect, onVoiceSelect }) => {
  const [isHovered, setIsHovered] = useState(false);
  const [panelView, setPanelView] = useState('main'); // 'main' | 'ai-options'

  const panelVariants = {
    collapsed: {
      x: '-92%',
      transition: {
        type: 'spring',
        stiffness: 400,
        damping: 30,
        duration: 0.25
      }
    },
    expanded: {
      x: '0%',
      transition: {
        type: 'spring',
        stiffness: 400,
        damping: 30,
        duration: 0.25
      }
    }
  };

  const users = [
    { id: 1, name: "Sarah Wilson", role: "Product Manager", color: "bg-gray-800 text-sky-500" },
    { id: 2, name: "Mike Chen", role: "Lead Developer", color: "bg-gray-800 text-sky-500" },
    { id: 3, name: "Jessica Stark", role: "Marketing Head", color: "bg-gray-800 text-sky-500" },
    { id: 4, name: "David Kim", role: "Sales Director", color: "bg-gray-800 text-sky-500" },
    { id: 5, name: "Emma Watson", role: "HR Manager", color: "bg-gray-800 text-sky-500" },
  ];

  // Reset to main view when panel closes
  useEffect(() => {
    if (!isHovered) {
      const timer = setTimeout(() => setPanelView('main'), 300);
      return () => clearTimeout(timer);
    }
  }, [isHovered]);

  // Prevent background scroll when panel is expanded
  useEffect(() => {
    if (isHovered) {
      document.body.classList.add('overlay-open');
    } else {
      document.body.classList.remove('overlay-open');
    }
    return () => {
      document.body.classList.remove('overlay-open');
    };
  }, [isHovered]);

  const handleAIChatClick = () => {
    setPanelView('ai-options');
  };

  const handleBackClick = () => {
    setPanelView('main');
  };

  const handleChatSelect = () => {
    onAIAssistantSelect && onAIAssistantSelect('ai-analytics');
    setPanelView('main');
  };

  const handleVoiceSelect = () => {
    onVoiceSelect && onVoiceSelect();
    setPanelView('main');
  };

  return (
    <motion.div
      className="fixed left-0 top-[25%] z-50 flex items-start"
      initial="collapsed"
      animate={isHovered ? "expanded" : "collapsed"}
      variants={panelVariants}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      style={{ width: '320px' }}
    >
      {/* Main Panel Content */}
      <div className="h-auto max-h-[70vh] w-full bg-gray-900/50 backdrop-blur-2xl border-y border-r border-white/10 rounded-r-2xl shadow-2xl flex flex-col overflow-hidden">
        {/* Toggle Buttons */}
        <div className="p-4 space-y-2">
          <AnimatePresence mode="wait">
            {panelView === 'main' ? (
              <motion.div
                key="main-view"
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                transition={{ duration: 0.15 }}
                className="grid grid-cols-2 gap-2"
              >
                {/* Team Chat Button */}
                <motion.button
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  className="w-full"
                >
                  <div className="p-3 rounded-xl flex items-center justify-center gap-2 transition-all bg-gradient-to-r from-blue-500 to-cyan-600 text-white shadow-lg">
                    <UsersIcon size={16} />
                    <span className="text-sm font-medium">Team</span>
                  </div>
                </motion.button>

                {/* AI Chat Button - Opens options */}
                <motion.button
                  onClick={handleAIChatClick}
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  className="w-full"
                >
                  <div className="p-3 rounded-xl flex items-center justify-center gap-2 transition-all bg-white/5 text-gray-400 hover:bg-gradient-to-r hover:from-purple-500 hover:to-blue-600 hover:text-white hover:shadow-lg">
                    <Sparkles size={16} />
                    <span className="text-sm font-medium">AI Chat</span>
                  </div>
                </motion.button>
              </motion.div>
            ) : (
              <motion.div
                key="ai-options-view"
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: 20 }}
                transition={{ duration: 0.15 }}
                className="space-y-3"
              >
                {/* Back Button */}
                <motion.button
                  onClick={handleBackClick}
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  className="flex items-center gap-2 text-gray-400 hover:text-white transition-colors text-sm"
                >
                  <ArrowLeft size={14} />
                  <span>Back</span>
                </motion.button>

                {/* AI Options Header */}
                <div className="flex items-center gap-2 px-1">
                  <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-purple-500 to-blue-600 flex items-center justify-center shadow-lg shadow-purple-500/30">
                    <Sparkles size={14} className="text-white" />
                  </div>
                  <div>
                    <h4 className="text-white text-sm font-semibold">AI Assistant</h4>
                    <p className="text-gray-500 text-xs">Choose interaction mode</p>
                  </div>
                </div>

                {/* Chat and Voice Options */}
                <div className="grid grid-cols-2 gap-2">
                  {/* Via Chat */}
                  <motion.button
                    onClick={handleChatSelect}
                    whileHover={{ scale: 1.03 }}
                    whileTap={{ scale: 0.97 }}
                    className="w-full"
                  >
                    <div className="p-4 rounded-xl flex flex-col items-center gap-2 transition-all bg-gradient-to-br from-blue-600/20 to-cyan-600/20 border border-blue-500/30 hover:border-blue-400/50 hover:bg-gradient-to-br hover:from-blue-600/30 hover:to-cyan-600/30 group">
                      <div className="w-10 h-10 rounded-full bg-gradient-to-br from-blue-500 to-cyan-500 flex items-center justify-center shadow-lg shadow-blue-500/30 group-hover:shadow-blue-500/50 transition-all">
                        <MessageSquare size={18} className="text-white" />
                      </div>
                      <span className="text-sm font-medium text-gray-200 group-hover:text-white">Via Chat</span>
                      <span className="text-[10px] text-gray-500 group-hover:text-gray-400">Type your queries</span>
                    </div>
                  </motion.button>

                  {/* Via Voice */}
                  <motion.button
                    onClick={handleVoiceSelect}
                    whileHover={{ scale: 1.03 }}
                    whileTap={{ scale: 0.97 }}
                    className="w-full"
                  >
                    <div className="p-4 rounded-xl flex flex-col items-center gap-2 transition-all bg-gradient-to-br from-purple-600/20 to-pink-600/20 border border-purple-500/30 hover:border-purple-400/50 hover:bg-gradient-to-br hover:from-purple-600/30 hover:to-pink-600/30 group">
                      <div className="w-10 h-10 rounded-full bg-gradient-to-br from-purple-500 to-pink-500 flex items-center justify-center shadow-lg shadow-purple-500/30 group-hover:shadow-purple-500/50 transition-all">
                        <Mic size={18} className="text-white" />
                      </div>
                      <span className="text-sm font-medium text-gray-200 group-hover:text-white">Via Voice</span>
                      <span className="text-[10px] text-gray-500 group-hover:text-gray-400">Speak to assistant</span>
                    </div>
                  </motion.button>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* Team Chat Content - Only shows in main view */}
        {panelView === 'main' && (
          <div className="flex-1 overflow-hidden flex flex-col">
            {/* Search Bar */}
            <div className="px-4 pb-2">
              <div className="relative">
                <Search className="absolute left-3 top-2.5 text-gray-500" size={14} />
                <input
                  type="text"
                  placeholder="Search people..."
                  className="w-full bg-white/5 border border-white/5 rounded-lg py-2 pl-9 pr-3 text-sm text-gray-300 focus:outline-none focus:border-blue-500/30 focus:bg-white/10 transition-all"
                />
              </div>
            </div>

            {/* User List */}
            <div className="overlay-content px-2 pb-2 space-y-1 overflow-y-auto">
              {users.map((user, i) => (
                <motion.button
                  key={user.id}
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: i * 0.05 }}
                  onClick={() => onUserSelect && onUserSelect(user)}
                  className="w-full flex items-center gap-3 p-3 rounded-xl hover:bg-white/5 transition-all group text-left"
                >
                  <div className="relative flex-shrink-0">
                    <div className={`w-10 h-10 rounded-full ${user.color} flex items-center justify-center font-bold shadow-lg ring-1 ring-white/10 group-hover:ring-white/20 transition-all`}>
                      {user.name.charAt(0)}
                    </div>
                    <div className="absolute bottom-0 right-0 w-3 h-3 bg-green-500 border-2 border-[#0f172a] rounded-full"></div>
                  </div>
                  <div className="flex-1 min-w-0">
                    <h4 className="text-gray-200 text-sm font-medium group-hover:text-white transition-colors truncate">{user.name}</h4>
                    <p className="text-xs text-gray-500 group-hover:text-gray-400 truncate">{user.role}</p>
                  </div>
                  <ChevronRight className="ml-auto text-gray-600 opacity-0 group-hover:opacity-100 transition-opacity flex-shrink-0" size={14} />
                </motion.button>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Handle / Peek Edge */}
      <div
        className={`
                    absolute right-0 top-1/2 -translate-y-1/2 translate-x-1/2
                    w-1.5 h-16 
                    bg-white/20 hover:bg-white/40
                    backdrop-blur-md
                    rounded-full 
                    transition-all duration-300
                    cursor-pointer
                    ${isHovered ? 'opacity-0 scale-y-0' : 'opacity-100 scale-y-100'}
                `}
      />
    </motion.div>
  );
};

const DashboardLayout = ({ children, sidebarActions = [], showBackButton = false, onBack, isFullPage = false }) => {
  const { user, logout, hasPermission } = useAuth();
  const { theme, toggleTheme, isDark } = useTheme();
  const navigate = useNavigate();
  const location = useLocation();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [profileDropdownOpen, setProfileDropdownOpen] = useState(false);
  const [selectedChatUser, setSelectedChatUser] = useState(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState([]);
  const [showSearchResults, setShowSearchResults] = useState(false);
  const [searchLoading, setSearchLoading] = useState(false);
  const [selectedDetailItem, setSelectedDetailItem] = useState(null);
  const [chatMode, setChatMode] = useState(null);
  const [showVoiceModal, setShowVoiceModal] = useState(false);

  // Debounced search effect
  useEffect(() => {
    const delayDebounceFn = setTimeout(() => {
      if (searchQuery.trim().length >= 2) {
        performSearch(searchQuery);
      } else {
        setSearchResults([]);
        setShowSearchResults(false);
      }
    }, 300); // 300ms debounce

    return () => clearTimeout(delayDebounceFn);
  }, [searchQuery]);

  // Perform search across multiple entities
  const performSearch = async (query) => {
    setSearchLoading(true);
    try {
      // Search across users, projects, tasks etc based on user permissions
      const results = [];

      // Search users if has permission
      if (hasPermission('read_all_users')) {
        try {
          const userRes = await api.get(`/users?search=${query}&limit=5`);
          if (userRes.data?.success && userRes.data?.data) {
            const users = Array.isArray(userRes.data.data) ? userRes.data.data : userRes.data.data.users || [];
            users.forEach(u => results.push({
              type: 'user',
              id: u._id,
              title: `${u.firstName} ${u.lastName}`,
              subtitle: u.email,
              route: `/users/${u._id}`,
              profilePhoto: u.profilePhoto || null,
              initials: `${u.firstName?.charAt(0) || ''}${u.lastName?.charAt(0) || ''}`
            }));
          }
        } catch (err) {
          console.log('User search error:', err);
        }
      }

      // Search projects if available
      try {
        const projectRes = await api.get(`/projects?search=${query}&limit=5`);
        if (projectRes.data?.success && projectRes.data?.data) {
          const projects = Array.isArray(projectRes.data.data) ? projectRes.data.data : projectRes.data.data.projects || [];
          projects.forEach(p => results.push({
            type: 'project',
            id: p._id,
            title: p.name,
            subtitle: p.description || 'Project',
            route: `/projects/${p._id}`
          }));
        }
      } catch (err) {
        console.log('Project search error:', err);
      }

      setSearchResults(results);
      setShowSearchResults(results.length > 0);
    } catch (error) {
      console.error('Search error:', error);
      setSearchResults([]);
    } finally {
      setSearchLoading(false);
    }
  };

  const handleSearchResultClick = (result) => {
    setSelectedDetailItem({ type: result.type, id: result.id });
    setSearchQuery('');
    setShowSearchResults(false);
    setSearchResults([]);
  };

  const getResultIcon = (type) => {
    switch (type) {
      case 'user': return User;
      case 'project': return FileText;
      case 'task': return CheckCircle2;
      default: return Search;
    }
  };

  const handleLogout = async () => {
    await logout();
    navigate('/login');
  };

  const handleAIAssistantSelect = (mode) => {
    setChatMode(mode);
    setSelectedChatUser(null);
  };

  const handleUserSelect = (user) => {
    setSelectedChatUser(user);
    setChatMode(null);
  };

  const handleVoiceSelect = () => {
    setShowVoiceModal(true);
    setChatMode(null);
  };

  const navigation = [
    { name: 'Dashboard', href: '/dashboard', icon: Home, current: true },
    ...(hasPermission('read_all_users') ? [
      { name: 'Users', href: '/users', icon: Users, current: false }
    ] : []),
    ...(hasPermission('read_financial') ? [
      { name: 'Analytics', href: '/analytics', icon: BarChart3, current: false }
    ] : []),
    { name: 'Reports', href: '/reports', icon: FileText, current: false },
    ...(hasPermission('system_admin') ? [
      { name: 'Admin', href: '/admin', icon: Shield, current: false }
    ] : []),
  ];

  return (
    <div className={`${isFullPage ? 'h-screen overflow-hidden' : 'min-h-screen pb-24'} bg-gray-950`}>
      {/* Mobile menu button - for accessing sidebar on mobile */}
      <div className="fixed top-0 left-0 z-30 md:hidden pl-1 pt-1 sm:pl-3 sm:pt-3 bg-gray-950/80 backdrop-blur-sm rounded-br-lg">
        <button
          type="button"
          className="h-12 w-12 inline-flex items-center justify-center rounded-lg text-gray-400 hover:text-gray-200 hover:bg-gray-800 focus:outline-none focus:ring-2 focus:ring-inset focus:ring-primary-500"
          onClick={() => setSidebarOpen(true)}
        >
          <Menu className="h-6 w-6" />
        </button>
      </div>

      {/* Mobile sidebar overlay */}
      <div className={`fixed inset-0 flex z-40 md:hidden ${sidebarOpen ? '' : 'pointer-events-none'}`}>
        <div
          className={`fixed inset-0 bg-black/60 backdrop-blur-sm transition-opacity ease-linear duration-300 ${sidebarOpen ? 'opacity-100' : 'opacity-0'}`}
          onClick={() => setSidebarOpen(false)}
        />

        <div className={`relative flex-1 flex flex-col max-w-xs w-full dark-sidebar transform transition ease-in-out duration-300 ${sidebarOpen ? 'translate-x-0' : '-translate-x-full'}`}>
          <div className="absolute top-0 right-0 -mr-12 pt-2">
            <button
              type="button"
              className="ml-1 flex items-center justify-center h-10 w-10 rounded-full focus:outline-none focus:ring-2 focus:ring-inset focus:ring-white"
              onClick={() => setSidebarOpen(false)}
            >
              <X className="h-6 w-6 text-white" />
            </button>
          </div>

          <div className="flex-1 h-0 pt-5 pb-4 overflow-y-auto">
            <div className="flex-shrink-0 flex items-center px-4">
              <div className="h-10 w-10 gradient-primary rounded-xl flex items-center justify-center shadow-glow">
                <span className="text-white font-bold text-lg">HS</span>
              </div>
              <span className="ml-3 text-xl font-bold text-white">The Hustle System</span>
            </div>
            <nav className="mt-6 px-3 space-y-1">
              {/* Sidebar Actions for mobile */}
              {sidebarActions.map((action, index) => {
                const IconComponent = action.icon;
                const isActive = action.active;
                return (
                  <button
                    key={`action-${index}`}
                    onClick={() => {
                      action.onClick();
                      setSidebarOpen(false);
                    }}
                    className={`sidebar-item w-full ${isActive ? 'active' : ''}`}
                  >
                    <IconComponent className={`mr-3 h-5 w-5 ${isActive ? 'text-primary-400' : ''}`} />
                    {action.label}
                  </button>
                );
              })}
            </nav>
          </div>
        </div>
      </div>

      {/* Main content area - full width now (no sidebar) */}
      <div className="flex flex-col flex-1 h-full">
        {/* Header */}
        <div className="dark-header sticky top-0 z-[100]">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="flex justify-between items-center py-4">
              {/* Left side - Logo and Search */}
              <div className="flex items-center space-x-4 flex-1">
                {/* Logo - visible on desktop - now clickable */}
                <button
                  onClick={() => navigate('/ceo-dashboard')}
                  className="hidden md:flex items-center flex-shrink-0 hover:opacity-80 transition-opacity group"
                >
                  <div className="h-10 w-10 gradient-primary rounded-xl flex items-center justify-center shadow-glow-sm group-hover:shadow-glow transition-shadow">
                    <span className="text-white font-bold text-lg">HS</span>
                  </div>
                  <div className="ml-3">
                    <span className="block text-lg font-bold text-white tracking-tight">THE HUSTLE</span>
                    <span className="block text-xs font-medium text-gray-500 -mt-0.5">System</span>
                  </div>
                </button>

                {/* Mobile spacer for menu button */}
                <div className="md:hidden w-12" />

                <div className="flex-1 max-w-lg">
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                      <Search className="h-5 w-5 text-gray-500" />
                    </div>
                    <input
                      type="text"
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      onFocus={() => searchResults.length > 0 && setShowSearchResults(true)}
                      className="w-full pl-11 pr-4 py-2.5 bg-gray-900 border border-gray-800 rounded-xl text-gray-200 placeholder-gray-500 focus:outline-none focus:border-primary-500 focus:ring-1 focus:ring-primary-500/20 transition-all"
                      placeholder="Search users, projects..."
                    />

                    {/* Search Results Dropdown */}
                    {showSearchResults && (
                      <>
                        {/* Backdrop */}
                        <div
                          className="fixed inset-0 z-10"
                          onClick={() => setShowSearchResults(false)}
                        />

                        {/* Results */}
                        <div className="absolute top-full mt-2 w-full bg-gray-900 border border-gray-800 rounded-xl shadow-2xl z-20 max-h-96 overflow-y-auto">
                          {searchLoading ? (
                            <div className="p-4 text-center">
                              <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-primary-500 mx-auto"></div>
                              <p className="text-sm text-gray-400 mt-2">Searching...</p>
                            </div>
                          ) : searchResults.length > 0 ? (
                            <div className="py-2">
                              {searchResults.map((result) => {
                                const Icon = getResultIcon(result.type);
                                return (
                                  <button
                                    key={`${result.type}-${result.id}`}
                                    onClick={() => handleSearchResultClick(result)}
                                    className="w-full px-4 py-3 flex items-center gap-3 hover:bg-gray-800 transition-colors text-left"
                                  >
                                    {result.type === 'user' ? (
                                      <div className="w-8 h-8 rounded-lg bg-primary-500/10 flex items-center justify-center overflow-hidden">
                                        {result.profilePhoto ? (
                                          <img
                                            src={result.profilePhoto.startsWith('http')
                                              ? result.profilePhoto
                                              : `http://localhost:5001${result.profilePhoto.startsWith('/') ? '' : '/'}${result.profilePhoto}`}
                                            alt={result.title}
                                            className="w-full h-full object-cover"
                                            onError={(e) => {
                                              e.target.style.display = 'none';
                                              e.target.nextSibling.style.display = 'flex';
                                            }}
                                          />
                                        ) : null}
                                        <span className={`text-primary-400 text-xs font-bold ${result.profilePhoto ? 'hidden' : ''}`}>
                                          {result.initials || <Icon className="h-4 w-4" />}
                                        </span>
                                      </div>
                                    ) : (
                                      <div className="p-2 bg-primary-500/10 rounded-lg text-primary-400">
                                        <Icon className="h-4 w-4" />
                                      </div>
                                    )}
                                    <div className="flex-1 min-w-0">
                                      <p className="text-sm font-medium text-gray-200 truncate">
                                        {result.title}
                                      </p>
                                      <p className="text-xs text-gray-500 truncate">
                                        {result.subtitle}
                                      </p>
                                    </div>
                                    <span className="text-xs text-gray-600 px-2 py-1 bg-gray-800 rounded capitalize">
                                      {result.type}
                                    </span>
                                  </button>
                                );
                              })}
                            </div>
                          ) : (
                            <div className="p-4 text-center text-gray-500 text-sm">
                              No results found
                            </div>
                          )}
                        </div>
                      </>
                    )}
                  </div>
                </div>
              </div>

              {/* Right side items */}
              <div className="flex items-center space-x-3">
                {/* Back Button - moved to right side */}
                {showBackButton && (
                  <button
                    onClick={onBack || (() => navigate(-1))}
                    className="flex items-center gap-2 px-3 py-2 bg-gray-900 hover:bg-gray-800 border border-gray-800 hover:border-gray-700 rounded-xl text-gray-300 hover:text-white transition-all group"
                  >
                    <ArrowLeft size={18} className="group-hover:-translate-x-0.5 transition-transform" />
                    <span className="text-sm font-medium hidden sm:inline">Back</span>
                  </button>
                )}

                {/* Theme Toggle */}
                <button
                  onClick={toggleTheme}
                  className="btn-icon"
                  title={isDark ? 'Switch to light mode' : 'Switch to dark mode'}
                >
                  {isDark ? (
                    <Sun className="h-5 w-5" />
                  ) : (
                    <Moon className="h-5 w-5" />
                  )}
                </button>

                {/* Profile dropdown */}
                <div className="relative">
                  <div>
                    <button
                      type="button"
                      className="flex items-center text-sm rounded-xl px-3 py-2 hover:bg-gray-800 transition-colors focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-gray-900 focus:ring-primary-500"
                      onClick={() => setProfileDropdownOpen(!profileDropdownOpen)}
                    >
                      <div className="h-8 w-8 rounded-lg gradient-primary flex items-center justify-center shadow-glow-sm overflow-hidden">
                        {user?.profilePhoto ? (
                          <img
                            src={user.profilePhoto.startsWith('http')
                              ? user.profilePhoto
                              : `http://localhost:5001${user.profilePhoto.startsWith('/') ? '' : '/'}${user.profilePhoto}`}
                            alt="Profile"
                            className="w-full h-full object-cover"
                            onError={(e) => {
                              // Fallback to initials on error
                              e.target.style.display = 'none';
                              e.target.nextSibling.style.display = 'flex';
                            }}
                          />
                        ) : null}
                        <span className={`text-white font-medium text-sm ${user?.profilePhoto ? 'hidden' : ''}`}>
                          {user?.firstName?.charAt(0)}{user?.lastName?.charAt(0)}
                        </span>
                      </div>
                      <div className="ml-3 text-left hidden sm:block">
                        <div className="text-sm font-medium text-gray-200">
                          {user?.firstName} {user?.lastName}
                        </div>
                        <div className="text-xs text-gray-500">
                          {formatRole(user?.role)}
                        </div>
                      </div>
                    </button>
                  </div>

                  {profileDropdownOpen && (
                    <>
                      {/* Backdrop to close dropdown */}
                      <div
                        className="fixed inset-0 z-10"
                        onClick={() => setProfileDropdownOpen(false)}
                      />
                      <div className="origin-top-right absolute right-0 mt-2 w-48 rounded-xl shadow-elevated py-1 bg-gray-900 border border-gray-800 ring-1 ring-black ring-opacity-5 focus:outline-none animate-fadeIn z-20">
                        <button
                          onClick={() => {
                            navigate('/profile');
                            setProfileDropdownOpen(false);
                          }}
                          className="flex items-center w-full px-4 py-2.5 text-sm text-gray-300 hover:bg-gray-800 hover:text-white transition-colors text-left"
                        >
                          <User className="mr-3 h-4 w-4" />
                          Your Profile
                        </button>
                        <button
                          onClick={() => {
                            navigate('/settings');
                            setProfileDropdownOpen(false);
                          }}
                          className="flex items-center w-full px-4 py-2.5 text-sm text-gray-300 hover:bg-gray-800 hover:text-white transition-colors text-left"
                        >
                          <Settings className="mr-3 h-4 w-4" />
                          Settings
                        </button>
                        <button
                          onClick={handleLogout}
                          className="flex items-center w-full px-4 py-2.5 text-sm text-gray-300 hover:bg-gray-800 hover:text-white transition-colors text-left"
                        >
                          <LogOut className="mr-3 h-4 w-4" />
                          Sign out
                        </button>
                      </div>
                    </>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Main content area */}
        <main className="flex-1 overflow-hidden">
          <div className={`${isFullPage ? 'h-full p-0' : 'max-w-7xl mx-auto py-6 px-4 sm:px-6 lg:px-8'}`}>
            {children}
          </div>
        </main>
      </div>

      {/* macOS-style Bottom Dock Navigation - Hide when Quick Details Panel is open */}
      {sidebarActions.length > 0 && !selectedDetailItem && (
        <DockNav items={sidebarActions} position="bottom" />
      )}

      {/* Notes are now controlled from RightPeekPanel */}

      {/* Left Side Peek Panel - Auto-hides */}
      <LeftPeekPanel
        onUserSelect={handleUserSelect}
        onAIAssistantSelect={handleAIAssistantSelect}
        onVoiceSelect={handleVoiceSelect}
      />

      {/* Right Side Peek Panel - Auto-hides */}
      <RightPeekPanel />

      {/* Chat Modal */}
      {selectedChatUser && (
        <ChatModal
          user={selectedChatUser}
          onClose={() => setSelectedChatUser(null)}
        />
      )}

      {/* AI Analytics Chat Modal */}
      {chatMode === 'ai-analytics' && (
        <AIAnalyticsChat
          onClose={() => setChatMode(null)}
        />
      )}

      {/* Quick Details Panel */}
      <QuickDetailsPanel
        item={selectedDetailItem}
        onClose={() => setSelectedDetailItem(null)}
      />

      {/* Voice Agent Modal - HTTP-based */}
      {showVoiceModal && (
        <VoiceAgentModal
          isOpen={showVoiceModal}
          onClose={() => setShowVoiceModal(false)}
          backendUrl="http://localhost:5002"
        />
      )}
    </div>
  );
};

export default DashboardLayout;