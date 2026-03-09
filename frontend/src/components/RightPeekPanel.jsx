import React, { useState, useEffect } from 'react';
import api from '../utils/api';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import {
    Bell,
    TrendingUp,
    ChevronLeft,
    ChevronRight,
    ChevronLeft as ChevronLeftIcon,
    CheckCircle2,
    Clock,
    Target,
    DollarSign,
    Users,
    Calendar as CalendarIcon,
    StickyNote,
    BookOpen,
    MessageSquare,
    Mail
} from 'lucide-react';
import CenteredNotesModal from './CenteredNotesModal';
import CenteredHandbookModal from './CenteredHandbookModal';
import CenteredMeetingModal from './CenteredMeetingModal';
import CenteredScrumMasterModal from './CenteredScrumMasterModal';
import AppleCardIcon from './AppleCardIcon';

const RightPeekPanel = () => {
    const navigate = useNavigate();
    const [isHovered, setIsHovered] = useState(false);
    const [currentMonth, setCurrentMonth] = useState(new Date());
    const [showNotes, setShowNotes] = useState(false);
    const [showHandbook, setShowHandbook] = useState(false);
    const [showMeetings, setShowMeetings] = useState(false);
    const [showScrum, setShowScrum] = useState(false);
    const [meetingDates, setMeetingDates] = useState(new Set());

    // Fetch meeting dates to highlight in calendar AND fetch real notifications
    useEffect(() => {
        const fetchMeetingDates = async () => {
            try {
                // We want to highlight dates that have meetings
                // Assuming /meetings/my-meetings returns all relevant meetings
                const response = await api.get('/meetings/my-meetings');
                if (response.data?.data?.upcoming) {
                    const dates = new Set(
                        response.data.data.upcoming.map(m => {
                            const d = new Date(m.startTime);
                            return `${d.getFullYear()}-${d.getMonth()}-${d.getDate()}`;
                        })
                    );
                    setMeetingDates(dates);
                }
            } catch (error) {
                console.error('Failed to fetch meeting dates:', error);
            }
        };

        const fetchRealNotifications = async () => {
            try {
                const response = await api.get('/notifications?limit=8');
                if (response.data?.success && response.data?.data?.notifications) {
                    // Map backend notifications to our display format
                    const mappedNotifications = response.data.data.notifications.map(notif => ({
                        id: notif._id,
                        type: getNotificationType(notif.type),
                        title: notif.title,
                        message: notif.message,
                        time: notif.timeAgo || formatTimeAgo(notif.createdAt),
                        icon: getNotificationIconComponent(notif.type),
                        isRead: notif.isRead,
                        actionUrl: notif.actionUrl
                    }));
                    setNotifications(mappedNotifications);
                }
            } catch (error) {
                console.error('Failed to fetch notifications:', error);
                // Keep mock data if API fails
            }
        };

        if (isHovered) {
            fetchMeetingDates();
            fetchRealNotifications();
        }
    }, [isHovered]);

    // Auto-refresh notifications every 30 seconds
    useEffect(() => {
        const fetchRealNotifications = async () => {
            try {
                const response = await api.get('/notifications?limit=8');
                if (response.data?.success && response.data?.data?.notifications) {
                    const mappedNotifications = response.data.data.notifications.map(notif => ({
                        id: notif._id,
                        type: getNotificationType(notif.type),
                        title: notif.title,
                        message: notif.message,
                        time: notif.timeAgo || formatTimeAgo(notif.createdAt),
                        icon: getNotificationIconComponent(notif.type),
                        isRead: notif.isRead,
                        actionUrl: notif.actionUrl
                    }));
                    setNotifications(mappedNotifications);
                }
            } catch (error) {
                console.error('Failed to fetch notifications:', error);
            }
        };

        // Initial fetch
        fetchRealNotifications();

        // Set up interval for auto-refresh
        const interval = setInterval(fetchRealNotifications, 30000); // 30 seconds

        return () => clearInterval(interval);
    }, []);

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

    // Mock notifications with more data
    const [notifications, setNotifications] = useState([
        {
            id: 1,
            type: 'success',
            title: 'Payment Received',
            message: 'Invoice #1234 paid - ₹50,000',
            time: '10m ago',
            icon: DollarSign
        },
        {
            id: 2,
            type: 'info',
            title: 'New Team Member',
            message: 'John Doe joined the Engineering team',
            time: '2h ago',
            icon: Users
        },
        {
            id: 3,
            type: 'warning',
            title: 'Event Tomorrow',
            message: 'Client presentation at 10 AM',
            time: '3h ago',
            icon: CalendarIcon
        },
        {
            id: 4,
            type: 'info',
            title: 'New Message',
            message: 'Sarah Wilson sent you a message',
            time: '5h ago',
            icon: MessageSquare
        },
        {
            id: 5,
            type: 'success',
            title: 'Task Completed',
            message: 'Q4 Report finalized and approved',
            time: '6h ago',
            icon: CheckCircle2
        },
        {
            id: 6,
            type: 'warning',
            title: 'Deadline Reminder',
            message: 'Project Alpha due in 2 days',
            time: '8h ago',
            icon: Clock
        },
        {
            id: 7,
            type: 'info',
            title: 'Email Received',
            message: '5 new emails in your inbox',
            time: '12h ago',
            icon: Mail
        },
        {
            id: 8,
            type: 'success',
            title: 'Revenue Target Met',
            message: 'Monthly target achieved!',
            time: '1d ago',
            icon: Target
        },
    ]);

    const panelVariants = {
        collapsed: {
            x: '92%',
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

    // Helper function to map backend notification type to UI type
    const getNotificationType = (backendType) => {
        if (!backendType) return 'info';
        if (backendType.includes('approved') || backendType.includes('completed') || backendType.includes('success')) return 'success';
        if (backendType.includes('rejected') || backendType.includes('deadline') || backendType.includes('warning')) return 'warning';
        return 'info';
    };

    // Helper function to map notification type to icon component
    const getNotificationIconComponent = (type) => {
        if (!type) return Bell;
        if (type.includes('payment') || type.includes('invoice')) return DollarSign;
        if (type.includes('team') || type.includes('user')) return Users;
        if (type.includes('meeting') || type.includes('event') || type.includes('calendar')) return CalendarIcon;
        if (type.includes('message') || type.includes('chat')) return MessageSquare;
        if (type.includes('task') || type.includes('completed')) return CheckCircle2;
        if (type.includes('deadline') || type.includes('reminder')) return Clock;
        if (type.includes('target') || type.includes('goal')) return Target;
        if (type.includes('email') || type.includes('mail')) return Mail;
        return Bell;
    };

    // Helper function to format time ago
    const formatTimeAgo = (dateString) => {
        if (!dateString) return 'Just now';
        const date = new Date(dateString);
        const now = new Date();
        const seconds = Math.floor((now - date) / 1000);

        if (seconds < 60) return 'Just now';
        const minutes = Math.floor(seconds / 60);
        if (minutes < 60) return `${minutes}m ago`;
        const hours = Math.floor(minutes / 60);
        if (hours < 24) return `${hours}h ago`;
        const days = Math.floor(hours / 24);
        return `${days}d ago`;
    };

    const getNotificationColor = (type) => {
        switch (type) {
            case 'success': return 'text-emerald-400 bg-emerald-500/10 border-emerald-500/20';
            case 'warning': return 'text-amber-400 bg-amber-500/10 border-amber-500/20';
            case 'info': return 'text-blue-400 bg-blue-500/10 border-blue-500/20';
            default: return 'text-gray-400 bg-gray-500/10 border-gray-500/20';
        }
    };

    const handleDismissNotification = (id) => {
        setNotifications(notifications.filter(notif => notif.id !== id));
    };

    // Handle notification click - mark as read and navigate
    const handleNotificationClick = async (notif) => {
        // If notification is unread, mark it as read
        if (!notif.isRead) {
            try {
                await api.put(`/notifications/${notif.id}/read`);
                // Update local state
                setNotifications(prev => prev.map(n =>
                    n.id === notif.id ? { ...n, isRead: true } : n
                ));
            } catch (error) {
                console.error('Error marking notification as read:', error);
            }
        }

        // Navigate to action URL if available
        if (notif.actionUrl) {
            navigate(notif.actionUrl);
        }
    };

    // Calendar logic
    const getDaysInMonth = (date) => {
        return new Date(date.getFullYear(), date.getMonth() + 1, 0).getDate();
    };

    const getFirstDayOfMonth = (date) => {
        return new Date(date.getFullYear(), date.getMonth(), 1).getDay();
    };

    const monthNames = ["January", "February", "March", "April", "May", "June",
        "July", "August", "September", "October", "November", "December"];

    const daysInMonth = getDaysInMonth(currentMonth);
    const firstDay = getFirstDayOfMonth(currentMonth);
    const today = new Date();
    const isCurrentMonth = currentMonth.getMonth() === today.getMonth() &&
        currentMonth.getFullYear() === today.getFullYear();

    const previousMonth = () => {
        setCurrentMonth(new Date(currentMonth.getFullYear(), currentMonth.getMonth() - 1));
    };

    const nextMonth = () => {
        setCurrentMonth(new Date(currentMonth.getFullYear(), currentMonth.getMonth() + 1));
    };

    const renderCalendar = () => {
        const days = [];
        const weekDays = ['S', 'M', 'T', 'W', 'T', 'F', 'S'];

        // Week day headers
        days.push(
            <div key="headers" className="grid grid-cols-7 gap-1 mb-2">
                {weekDays.map((day, i) => (
                    <div key={i} className="text-center text-[10px] text-gray-500 font-medium">
                        {day}
                    </div>
                ))}
            </div>
        );

        // Calendar days
        const calendarDays = [];
        // Empty cells for days before month starts
        for (let i = 0; i < firstDay; i++) {
            calendarDays.push(
                <div key={`empty-${i}`} className="aspect-square"></div>
            );
        }

        // Days of the month
        for (let day = 1; day <= daysInMonth; day++) {
            const checkDate = new Date(currentMonth.getFullYear(), currentMonth.getMonth(), day);
            const dateKey = `${checkDate.getFullYear()}-${checkDate.getMonth()}-${checkDate.getDate()}`;
            const hasMeeting = meetingDates.has(dateKey);
            const isToday = isCurrentMonth && day === today.getDate();

            calendarDays.push(
                <motion.button
                    key={day}
                    whileHover={{ scale: 1.1 }}
                    className={`
                        aspect-square flex items-center justify-center rounded-lg text-xs font-medium
                        transition-colors relative
                        ${isToday
                            ? 'bg-blue-500 text-white shadow-lg'
                            : hasMeeting
                                ? 'bg-purple-600 text-white shadow-lg shadow-purple-500/40 border border-purple-400/50'
                                : 'text-gray-300 hover:bg-white/5'
                        }
                    `}
                >
                    {day}
                    {hasMeeting && !isToday && (
                        <span className="absolute bottom-1 w-1 h-1 bg-white rounded-full opacity-70"></span>
                    )}
                </motion.button>
            );
        }

        days.push(
            <div key="days" className="grid grid-cols-7 gap-1">
                {calendarDays}
            </div>
        );

        return days;
    };

    return (
        <>
            <motion.div
                className="fixed right-0 top-[15%] z-50 flex items-start"
                initial="collapsed"
                animate={isHovered ? "expanded" : "collapsed"}
                variants={panelVariants}
                onMouseEnter={() => setIsHovered(true)}
                onMouseLeave={() => setIsHovered(false)}
                style={{ width: '320px' }}
            >
                {/* Handle / Peek Edge */}
                <div
                    className={`
                        absolute left-0 top-1/2 -translate-y-1/2 -translate-x-1/2
                        w-1.5 h-16 
                        bg-white/20 hover:bg-white/40
                        backdrop-blur-md
                        rounded-full 
                        transition-all duration-300
                        cursor-pointer
                        ${isHovered ? 'opacity-0 scale-y-0' : 'opacity-100 scale-y-100'}
                    `}
                />

                {/* Main Panel Content */}
                <div
                    className="
                        h-auto max-h-[70vh] w-full
                        bg-gray-900/50 backdrop-blur-2xl
                        border-y border-l border-white/10
                        rounded-l-2xl shadow-2xl
                        flex flex-col
                        overflow-hidden
                    "
                >
                    {/* Header */}
                    <div className="p-4 border-b border-white/5 flex items-center justify-between min-w-[320px] rounded-tl-2xl flex-shrink-0">
                        <div className="flex items-center gap-3">
                            <div className="p-2 bg-purple-500/10 rounded-lg text-purple-400">
                                <Bell size={20} />
                            </div>
                            <h2 className="text-white font-semibold text-lg">Quick Access</h2>
                        </div>
                        <motion.div
                            className="p-1 text-gray-400"
                            animate={{ x: isHovered ? 0 : -5, opacity: isHovered ? 1 : 0.5 }}
                        >
                            <ChevronLeft size={18} />
                        </motion.div>
                    </div>

                    {/* Scrollable Content Area */}
                    <div className="overlay-content flex-1 overflow-y-auto custom-scrollbar overscroll-contain">
                        <div className="p-4 border-b border-white/5">
                            <p className="text-xs text-gray-500 uppercase tracking-wider font-medium mb-3">Tools</p>

                            {/* Main Tools - 2 Column Grid */}
                            <div className="grid grid-cols-2 gap-3 mb-3">
                                <AppleCardIcon
                                    title="Notes"
                                    subtitle="Personal"
                                    count={0}
                                    type="notes"
                                    onClick={() => setShowNotes(true)}
                                    gradientFrom="from-blue-400"
                                    gradientTo="to-indigo-600"
                                />

                                <AppleCardIcon
                                    title="Handbook"
                                    subtitle="Company Wiki"
                                    count={0}
                                    type="handbook"
                                    icon={BookOpen}
                                    onClick={() => setShowHandbook(true)}
                                    gradientFrom="from-cyan-400"
                                    gradientTo="to-blue-500"
                                />
                            </div>

                            {/* Secondary Tools - Premium Cards */}
                            <div className="grid grid-cols-2 gap-3">
                                <AppleCardIcon
                                    title="Meetings"
                                    subtitle="Schedule"
                                    count={0}
                                    type="meetings"
                                    icon={CalendarIcon}
                                    onClick={() => setShowMeetings(true)}
                                    gradientFrom="from-indigo-400"
                                    gradientTo="to-purple-500"
                                />

                                <AppleCardIcon
                                    title="Scrum Log"
                                    subtitle="Team Updates"
                                    count={0}
                                    type="scrum"
                                    icon={Users}
                                    onClick={() => setShowScrum(true)}
                                    gradientFrom="from-purple-400"
                                    gradientTo="to-pink-500"
                                />
                            </div>
                        </div>

                        {/* Calendar Section */}
                        <div className="p-4 border-b border-white/5">
                            <div className="flex items-center justify-between mb-4">
                                <h3 className="text-sm font-semibold text-white">
                                    {monthNames[currentMonth.getMonth()]} {currentMonth.getFullYear()}
                                </h3>
                                <div className="flex gap-1">
                                    <button
                                        onClick={previousMonth}
                                        className="p-1 rounded-lg hover:bg-white/5 text-gray-400 hover:text-white transition-colors"
                                    >
                                        <ChevronLeftIcon size={16} />
                                    </button>
                                    <button
                                        onClick={nextMonth}
                                        className="p-1 rounded-lg hover:bg-white/5 text-gray-400 hover:text-white transition-colors"
                                    >
                                        <ChevronRight size={16} />
                                    </button>
                                </div>
                            </div>
                            {renderCalendar()}
                        </div>

                        {/* Recent Activity with Notifications */}
                        <div className="p-4">
                            <div className="flex items-center justify-between mb-3">
                                <div className="flex items-center gap-2">
                                    <p className="text-xs text-gray-500 uppercase tracking-wider font-medium">
                                        Notifications
                                    </p>
                                    {notifications.filter(n => !n.isRead).length > 0 && (
                                        <span className="px-2 py-0.5 text-[10px] font-semibold bg-blue-500 text-white rounded-full">
                                            {notifications.filter(n => !n.isRead).length}
                                        </span>
                                    )}
                                </div>
                                <span className="text-[10px] text-gray-600">{notifications.length} total</span>
                            </div>
                            <div className="space-y-2">
                                <AnimatePresence>
                                    {notifications.length > 0 ? (
                                        notifications.map((notif, i) => (
                                            <motion.div
                                                key={notif.id}
                                                initial={{ opacity: 0, x: 20 }}
                                                animate={{ opacity: 1, x: 0 }}
                                                exit={{ opacity: 0, x: -100, transition: { duration: 0.2 } }}
                                                transition={{ delay: isHovered ? i * 0.05 : 0 }}
                                                drag="x"
                                                dragConstraints={{ left: -50, right: 50 }}
                                                dragElastic={0.1}
                                                onDragEnd={(e, { offset, velocity }) => {
                                                    if (Math.abs(offset.x) > 50) {
                                                        handleDismissNotification(notif.id);
                                                    }
                                                }}
                                                onClick={() => handleNotificationClick(notif)}
                                                className={`
                                                    p-3 rounded-xl border cursor-pointer relative
                                                    ${getNotificationColor(notif.type)} 
                                                    ${!notif.isRead ? 'ring-2 ring-blue-500/30 bg-blue-500/5' : ''}
                                                    hover:bg-white/10 transition-all
                                                `}
                                            >
                                                {!notif.isRead && (
                                                    <span className="absolute top-2 right-2 h-2 w-2 bg-blue-500 rounded-full animate-pulse"></span>
                                                )}
                                                <div className="flex items-start gap-3">
                                                    <div className="flex-shrink-0 mt-0.5">
                                                        <notif.icon size={16} />
                                                    </div>
                                                    <div className="flex-1 min-w-0">
                                                        <h4 className={`text-sm font-medium text-gray-200 truncate ${!notif.isRead ? 'font-semibold' : ''}`}>
                                                            {notif.title}
                                                        </h4>
                                                        <p className="text-xs text-gray-500 truncate">
                                                            {notif.message}
                                                        </p>
                                                    </div>
                                                    <span className="text-[10px] text-gray-600 flex-shrink-0">
                                                        {notif.time}
                                                    </span>
                                                </div>
                                            </motion.div>
                                        ))
                                    ) : (
                                        <motion.div
                                            initial={{ opacity: 0 }}
                                            animate={{ opacity: 1 }}
                                            className="p-4 rounded-xl bg-white/5 border border-white/10"
                                        >
                                            <p className="text-xs text-gray-400 text-center">
                                                No notifications
                                            </p>
                                        </motion.div>
                                    )}
                                </AnimatePresence>
                            </div>
                            {notifications.length > 0 && (
                                <p className="text-[10px] text-gray-600 text-center mt-2">
                                    ← Swipe to dismiss →
                                </p>
                            )}
                        </div>

                        {/* Insights Widget */}
                        <div className="p-4 border-t border-white/5">
                            <div className="p-4 bg-gradient-to-br from-purple-500/10 to-blue-500/10 rounded-xl border border-purple-500/20">
                                <div className="flex items-center gap-2 mb-2">
                                    <TrendingUp size={16} className="text-purple-400" />
                                    <span className="text-xs font-medium text-purple-400">Daily Insight</span>
                                </div>
                                <p className="text-sm text-gray-300">
                                    Revenue up <span className="text-emerald-400 font-semibold">12.5%</span> compared to last week
                                </p>
                            </div>
                        </div>
                    </div>
                </div>
            </motion.div>

            {/* Render Centered Notes Modal */}
            <CenteredNotesModal
                isOpen={showNotes}
                onClose={() => setShowNotes(false)}
            />

            {/* Render Centered Handbook Modal */}
            <CenteredHandbookModal
                isOpen={showHandbook}
                onClose={() => setShowHandbook(false)}
            />

            {/* Render Centered Meeting Modal */}
            <CenteredMeetingModal
                isOpen={showMeetings}
                onClose={() => setShowMeetings(false)}
            />

            {/* Render Scrum Master Modal */}
            <CenteredScrumMasterModal
                isOpen={showScrum}
                onClose={() => setShowScrum(false)}
            />
        </>
    );
};

export default RightPeekPanel;
