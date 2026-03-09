import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
    DollarSign,
    TrendingUp,
    Users,
    Calendar,
    Clock,
    CheckCircle,
    AlertCircle,
    Briefcase,
    CreditCard,
    BarChart3
} from 'lucide-react';

/**
 * Dock Preview System
 * 
 * Shows floating preview cards on dock icon hover
 * Apple-style micro-interactions
 */

// Preview card animation variants
const previewVariants = {
    hidden: {
        opacity: 0,
        scale: 0.85,
        y: 10,
    },
    visible: {
        opacity: 1,
        scale: 1,
        y: 0,
        transition: {
            type: 'spring',
            damping: 25,
            stiffness: 300,
            mass: 0.5,
        }
    },
    expanding: {
        opacity: 0,
        scale: 3,
        y: -300,
        transition: {
            duration: 0.6, // Slower expansion
            ease: [0.4, 0, 0.2, 1],
        }
    },
    exit: {
        opacity: 0,
        scale: 0.9,
        y: 5,
        transition: {
            duration: 0.15,
            ease: 'easeOut'
        }
    }
};

// Preview content for different dashboard views
const PreviewContent = {
    dashboard: ({ data }) => (
        <div className="space-y-3">
            <div className="flex items-center gap-3">
                <DollarSign className="w-6 h-6 text-emerald-400" />
                <span className="text-sm font-semibold text-gray-300">Financial Overview</span>
            </div>
            <div className="space-y-2">
                <div>
                    <p className="text-xs text-gray-500">Current Funds</p>
                    <p className="text-2xl font-bold text-white">{data?.currentFunds || '₹24,50,000'}</p>
                </div>
                <div className="h-px bg-gray-700/50"></div>
                <div className="grid grid-cols-2 gap-3">
                    <div>
                        <p className="text-xs text-gray-500">Revenue</p>
                        <p className="text-base font-semibold text-emerald-400">{data?.revenue || '₹15L'}</p>
                    </div>
                    <div>
                        <p className="text-xs text-gray-500">Expenses</p>
                        <p className="text-base font-semibold text-red-400">{data?.expenses || '₹8.5L'}</p>
                    </div>
                </div>
                <div className="h-px bg-gray-700/50"></div>
                <div className="flex justify-between items-center">
                    <div>
                        <p className="text-xs text-gray-500">Projects</p>
                        <p className="text-base font-semibold text-blue-400">{data?.activeProjects || 5}</p>
                    </div>
                    <div>
                        <p className="text-xs text-gray-500">Profit %</p>
                        <p className="text-base font-semibold text-emerald-400">+{data?.profitMargin || 43}%</p>
                    </div>
                </div>
            </div>
        </div>
    ),

    attendance: ({ data }) => (
        <div className="space-y-3">
            <div className="flex items-center gap-3">
                <Clock className="w-6 h-6 text-blue-400" />
                <span className="text-sm font-semibold text-gray-300">My Attendance</span>
            </div>
            <div className="space-y-2">
                <div className="flex items-center gap-3">
                    {data?.punchedIn ? (
                        <>
                            <CheckCircle className="w-6 h-6 text-emerald-400" />
                            <div>
                                <p className="text-base font-semibold text-emerald-400">Punched In</p>
                                <p className="text-xs text-gray-500">Since {data?.time || '9:00 AM'}</p>
                            </div>
                        </>
                    ) : (
                        <>
                            <AlertCircle className="w-6 h-6 text-amber-400" />
                            <div>
                                <p className="text-base font-semibold text-amber-400">Not Punched</p>
                                <p className="text-xs text-gray-500">Please punch in</p>
                            </div>
                        </>
                    )}
                </div>
                <div className="h-px bg-gray-700/50"></div>
                <div>
                    <p className="text-xs text-gray-500">Working Hours Today</p>
                    <p className="text-base font-semibold text-white">7h 30m</p>
                </div>
            </div>
        </div>
    ),

    'team-attendance': ({ data }) => (
        <div className="space-y-3">
            <div className="flex items-center gap-3">
                <Users className="w-6 h-6 text-violet-400" />
                <span className="text-sm font-semibold text-gray-300">Team Status</span>
            </div>
            <div className="space-y-2">
                <div>
                    <p className="text-xs text-gray-500">Attendance Rate</p>
                    <p className="text-3xl font-bold text-white">{data?.rate || '85'}%</p>
                </div>
                <div className="h-px bg-gray-700/50"></div>
                <div className="flex justify-between">
                    <div>
                        <p className="text-xs text-gray-500">Present</p>
                        <p className="text-lg font-semibold text-emerald-400">{data?.present || 17}</p>
                    </div>
                    <div>
                        <p className="text-xs text-gray-500">Total</p>
                        <p className="text-lg font-semibold text-gray-300">{data?.total || 20}</p>
                    </div>
                </div>
            </div>
        </div>
    ),

    leave: ({ data }) => (
        <div className="space-y-3">
            <div className="flex items-center gap-3">
                <Calendar className="w-6 h-6 text-amber-400" />
                <span className="text-sm font-semibold text-gray-300">Leave Requests</span>
            </div>
            <div className="space-y-2">
                <div>
                    <p className="text-xs text-gray-500">Pending Approval</p>
                    <p className="text-3xl font-bold text-amber-400">{data?.pending || 3}</p>
                </div>
                <div className="h-px bg-gray-700/50"></div>
                <div className="flex justify-between">
                    <div>
                        <p className="text-xs text-gray-500">Approved</p>
                        <p className="text-base font-semibold text-emerald-400">{data?.approved || 12}</p>
                    </div>
                    <div>
                        <p className="text-xs text-gray-500">This Month</p>
                        <p className="text-base font-semibold text-gray-300">{data?.total || 15}</p>
                    </div>
                </div>
            </div>
        </div>
    ),

    banking: ({ data }) => (
        <div className="space-y-3">
            <div className="flex items-center gap-3">
                <Briefcase className="w-6 h-6 text-emerald-400" />
                <span className="text-sm font-semibold text-gray-300">Bank Account</span>
            </div>
            <div className="space-y-2">
                <div>
                    <p className="text-xs text-gray-500">Available Balance</p>
                    <p className="text-2xl font-bold text-white">{data?.balance || '₹18,50,000'}</p>
                </div>
                <div className="h-px bg-gray-700/50"></div>
                <div className="flex justify-between text-xs">
                    <span className="text-emerald-400">↑ ₹2.5L in</span>
                    <span className="text-red-400">↓ ₹1.8L out</span>
                </div>
            </div>
        </div>
    ),

    'profit-renew': ({ data }) => (
        <div className="space-y-3">
            <div className="flex items-center gap-3">
                <TrendingUp className="w-6 h-6 text-emerald-400" />
                <span className="text-sm font-semibold text-gray-300">Profit Analysis</span>
            </div>
            <div className="space-y-2">
                <div>
                    <p className="text-xs text-gray-500">Monthly Margin</p>
                    <p className="text-3xl font-bold text-emerald-400">+{data?.profitMargin || '43'}%</p>
                </div>
                <div className="h-px bg-gray-700/50"></div>
                <div className="grid grid-cols-2 gap-2">
                    <div>
                        <p className="text-xs text-gray-500">Q1 Growth</p>
                        <p className="text-sm font-semibold text-emerald-400">+8.3%</p>
                    </div>
                    <div>
                        <p className="text-xs text-gray-500">YTD</p>
                        <p className="text-sm font-semibold text-blue-400">+12.5%</p>
                    </div>
                </div>
            </div>
        </div>
    ),

    expenses: ({ data }) => (
        <div className="space-y-3">
            <div className="flex items-center gap-3">
                <CreditCard className="w-6 h-6 text-red-400" />
                <span className="text-sm font-semibold text-gray-300">Monthly Expenses</span>
            </div>
            <div className="space-y-2">
                <div>
                    <p className="text-xs text-gray-500">Total Spent</p>
                    <p className="text-2xl font-bold text-white">{data?.total || '₹8,50,000'}</p>
                </div>
                <div className="h-px bg-gray-700/50"></div>
                <div className="grid grid-cols-2 gap-2 text-xs">
                    <div>
                        <p className="text-gray-500">Payroll</p>
                        <p className="font-semibold text-white">₹5.2L</p>
                    </div>
                    <div>
                        <p className="text-gray-500">Operations</p>
                        <p className="font-semibold text-white">₹3.3L</p>
                    </div>
                </div>
            </div>
        </div>
    ),

    'clients-projects': ({ data }) => (
        <div className="space-y-3">
            <div className="flex items-center gap-3">
                <Briefcase className="w-6 h-6 text-blue-400" />
                <span className="text-sm font-semibold text-gray-300">Business Overview</span>
            </div>
            <div className="space-y-2">
                <div className="grid grid-cols-2 gap-4">
                    <div>
                        <p className="text-xs text-gray-500">Active Clients</p>
                        <p className="text-2xl font-bold text-blue-400">{data?.clients || 12}</p>
                    </div>
                    <div>
                        <p className="text-xs text-gray-500">Projects</p>
                        <p className="text-2xl font-bold text-emerald-400">{data?.projects || 8}</p>
                    </div>
                </div>
                <div className="h-px bg-gray-700/50"></div>
                <div className="text-xs text-gray-500">
                    3 new projects this month
                </div>
            </div>
        </div>
    ),

    management: ({ data }) => (
        <div className="space-y-3">
            <div className="flex items-center gap-3">
                <Users className="w-6 h-6 text-violet-400" />
                <span className="text-sm font-semibold text-gray-300">Team Management</span>
            </div>
            <div className="space-y-2">
                <div>
                    <p className="text-xs text-gray-500">Total Employees</p>
                    <p className="text-3xl font-bold text-white">{data?.employees || 25}</p>
                </div>
                <div className="h-px bg-gray-700/50"></div>
                <div className="grid grid-cols-2 gap-2 text-xs">
                    <div>
                        <p className="text-gray-500">Departments</p>
                        <p className="font-semibold text-white">5</p>
                    </div>
                    <div>
                        <p className="text-gray-500">Managers</p>
                        <p className="font-semibold text-white">8</p>
                    </div>
                </div>
            </div>
        </div>
    ),

    // Co-Founder Dashboard Previews
    'cofounder-dashboard': ({ data }) => (
        <div className="space-y-3">
            <div className="flex items-center gap-3">
                <Briefcase className="w-6 h-6 text-blue-400" />
                <span className="text-sm font-semibold text-gray-300">Dashboard Overview</span>
            </div>
            <div className="space-y-2">
                <div className="grid grid-cols-2 gap-3">
                    <div>
                        <p className="text-xs text-gray-500">Projects</p>
                        <p className="text-2xl font-bold text-blue-400">{data?.projects || 4}</p>
                    </div>
                    <div>
                        <p className="text-xs text-gray-500">Revenue</p>
                        <p className="text-2xl font-bold text-emerald-400">{data?.revenue || '₹124.5L'}</p>
                    </div>
                </div>
                <div className="h-px bg-gray-700/50"></div>
                <div className="grid grid-cols-2 gap-3">
                    <div>
                        <p className="text-xs text-gray-500">Attendance</p>
                        <p className="text-lg font-semibold text-white">92%</p>
                    </div>
                    <div>
                        <p className="text-xs text-gray-500">Leaves Pending</p>
                        <p className="text-lg font-semibold text-amber-400">6</p>
                    </div>
                </div>
            </div>
        </div>
    ),

    'cofounder-sales': ({ data }) => (
        <div className="space-y-3">
            <div className="flex items-center gap-3">
                <DollarSign className="w-6 h-6 text-emerald-400" />
                <span className="text-sm font-semibold text-gray-300">Revenue & Sales</span>
            </div>
            <div className="space-y-2">
                <div>
                    <p className="text-xs text-gray-500">Total Revenue</p>
                    <p className="text-2xl font-bold text-white">₹124.5L</p>
                </div>
                <div className="h-px bg-gray-700/50"></div>
                <div className="grid grid-cols-2 gap-3">
                    <div>
                        <p className="text-xs text-gray-500">Leads</p>
                        <p className="text-lg font-semibold text-blue-400">245</p>
                    </div>
                    <div>
                        <p className="text-xs text-gray-500">Companies</p>
                        <p className="text-lg font-semibold text-emerald-400">68</p>
                    </div>
                </div>
                <div className="h-px bg-gray-700/50"></div>
                <div>
                    <p className="text-xs text-gray-500">Target Achievement</p>
                    <p className="text-base font-semibold text-emerald-400">83% of target</p>
                </div>
            </div>
        </div>
    ),

    'cofounder-analytics': ({ data }) => (
        <div className="space-y-3">
            <div className="flex items-center gap-3">
                <BarChart3 className="w-6 h-6 text-violet-400" />
                <span className="text-sm font-semibold text-gray-300">Analytics Dashboard</span>
            </div>
            <div className="space-y-2">
                <div>
                    <p className="text-xs text-gray-500">Performance Analysis</p>
                    <p className="text-2xl font-bold text-white">Advanced</p>
                </div>
                <div className="h-px bg-gray-700/50"></div>
                <div className="grid grid-cols-2 gap-3 text-xs">
                    <div>
                        <p className="text-gray-500">Team Quality</p>
                        <p className="font-semibold text-white">85%</p>
                    </div>
                    <div>
                        <p className="text-gray-500">Efficiency</p>
                        <p className="font-semibold text-emerald-400">92%</p>
                    </div>
                </div>
            </div>
        </div>
    ),
};

// Main Preview Card Component
const DockPreview = ({
    isVisible,
    viewId,
    position,
    previewData,
    reducedMotion,
    isExpanding = false,
}) => {
    // Get the correct content component for this viewId, or show nothing if not found
    const Content = PreviewContent[viewId];

    // Don't show preview if viewId doesn't have a matching preview
    if (!Content) return null;

    // Determine animation state
    const animateState = isExpanding ? 'expanding' : 'visible';

    // Always center preview on icon - simple and predictable
    const safePosition = {
        left: position?.x || 0,
        transform: 'translateX(-50%)'
    };

    return (
        <AnimatePresence>
            {isVisible && (
                <div
                    className="fixed z-[60] pointer-events-none"
                    style={{
                        left: position?.x || 0,
                        bottom: position?.y || 80,
                        transform: 'translateX(-50%)',
                    }}
                >
                    <motion.div
                        variants={reducedMotion ? {} : previewVariants}
                        initial="hidden"
                        animate={animateState}
                        exit="exit"
                    >
                        {/* Preview Card - Bigger size with more details */}
                        <div
                            className="w-[300px] min-h-[280px] p-6 rounded-xl"
                            style={{
                                background: 'rgba(20, 20, 30, 0.9)',
                                backdropFilter: 'blur(20px)',
                                border: '1px solid rgba(255, 255, 255, 0.1)',
                                boxShadow: `
                0 20px 40px rgba(0, 0, 0, 0.4),
                0 0 0 1px rgba(255, 255, 255, 0.05),
                inset 0 1px 0 rgba(255, 255, 255, 0.1)
              `,
                            }}
                        >
                            <Content data={previewData} />
                        </div>

                        {/* Arrow pointing down to icon */}
                        <div
                            className="absolute left-1/2 -bottom-2 w-3 h-3 rotate-45 -translate-x-1/2"
                            style={{
                                background: 'rgba(20, 20, 30, 0.9)',
                                borderRight: '1px solid rgba(255, 255, 255, 0.1)',
                                borderBottom: '1px solid rgba(255, 255, 255, 0.1)',
                            }}
                        />
                    </motion.div>
                </div>
            )}
        </AnimatePresence>
    );
};

export default DockPreview;
export { PreviewContent };
