import React, { useState, useEffect } from 'react';
import { Bell } from 'lucide-react';
import api from '../utils/api';

const NotificationBell = () => {
    const [unreadCount, setUnreadCount] = useState(0);
    const [showDropdown, setShowDropdown] = useState(false);
    const [notifications, setNotifications] = useState([]);
    const [isLoading, setIsLoading] = useState(false);

    // Fetch unread count
    const fetchUnreadCount = async () => {
        try {
            const response = await api.get('/notifications/unread-count');
            if (response.data.success) {
                setUnreadCount(response.data?.data?.count || 0);
            }
        } catch (error) {
            console.error('Error fetching unread count:', error);
        }
    };

    // Fetch recent notifications
    const fetchNotifications = async () => {
        try {
            setIsLoading(true);
            const response = await api.get('/notifications?limit=10');
            if (response.data.success) {
                setNotifications(response.data.data.notifications);
            }
        } catch (error) {
            console.error('Error fetching notifications:', error);
        } finally {
            setIsLoading(false);
        }
    };

    // Mark as read
    const markAsRead = async (notificationId) => {
        try {
            await api.put(`/notifications/${notificationId}/read`);
            fetchUnreadCount();
            fetchNotifications();
        } catch (error) {
            console.error('Error marking as read:', error);
        }
    };

    // Mark all as read
    const markAllAsRead = async () => {
        try {
            await api.put('/notifications/mark-all-read');
            fetchUnreadCount();
            fetchNotifications();
        } catch (error) {
            console.error('Error marking all as read:', error);
        }
    };

    // Auto-refresh every 30 seconds
    useEffect(() => {
        fetchUnreadCount();
        const interval = setInterval(fetchUnreadCount, 60000);
        return () => clearInterval(interval);
    }, []);

    // Fetch notifications when dropdown opens
    useEffect(() => {
        if (showDropdown) {
            fetchNotifications();
        }
    }, [showDropdown]);

    const getNotificationIcon = (type) => {
        if (type.includes('approved')) return '✅';
        if (type.includes('rejected')) return '❌';
        if (type.includes('approval_needed')) return '📋';
        if (type.includes('task')) return '📝';
        if (type.includes('deadline')) return '⏰';
        return '🔔';
    };

    return (
        <div className="relative">
            {/* Bell Icon */}
            <button
                onClick={() => setShowDropdown(!showDropdown)}
                className="relative p-2 text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded-lg transition-colors"
            >
                <Bell className="h-6 w-6" />
                {unreadCount > 0 && (
                    <span className="absolute top-0 right-0 inline-flex items-center justify-center px-2 py-1 text-xs font-bold leading-none text-white transform translate-x-1/2 -translate-y-1/2 bg-red-600 rounded-full">
                        {unreadCount > 99 ? '99+' : unreadCount}
                    </span>
                )}
            </button>

            {/* Dropdown */}
            {showDropdown && (
                <>
                    {/* Backdrop */}
                    <div
                        className="fixed inset-0 z-10"
                        onClick={() => setShowDropdown(false)}
                    />

                    {/* Dropdown Panel */}
                    <div className="absolute right-0 mt-2 w-96 bg-white rounded-lg shadow-xl border border-gray-200 z-20 max-h-[600px] overflow-hidden flex flex-col">
                        {/* Header */}
                        <div className="p-4 border-b border-gray-200 flex justify-between items-center bg-gray-50">
                            <h3 className="text-lg font-semibold text-gray-900">Notifications</h3>
                            {unreadCount > 0 && (
                                <button
                                    onClick={markAllAsRead}
                                    className="text-sm text-blue-600 hover:text-blue-800 font-medium"
                                >
                                    Mark all read
                                </button>
                            )}
                        </div>

                        {/* Notifications List */}
                        <div className="overflow-y-auto flex-1">
                            {isLoading ? (
                                <div className="p-8 text-center">
                                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
                                    <p className="mt-2 text-gray-600">Loading...</p>
                                </div>
                            ) : notifications.length === 0 ? (
                                <div className="p-8 text-center text-gray-500">
                                    <Bell className="h-12 w-12 mx-auto mb-3 text-gray-300" />
                                    <p>No notifications yet</p>
                                </div>
                            ) : (
                                <div className="divide-y divide-gray-100">
                                    {notifications.map((notif) => (
                                        <div
                                            key={notif._id}
                                            onClick={() => {
                                                if (!notif.isRead) markAsRead(notif._id);
                                                if (notif.actionUrl) window.location.href = notif.actionUrl;
                                            }}
                                            className={`p-4 hover:bg-gray-50 cursor-pointer transition-colors ${!notif.isRead ? 'bg-blue-50' : ''
                                                }`}
                                        >
                                            <div className="flex items-start">
                                                <span className="text-2xl mr-3">{getNotificationIcon(notif.type)}</span>
                                                <div className="flex-1 min-w-0">
                                                    <p className={`text-sm font-medium text-gray-900 ${!notif.isRead ? 'font-semibold' : ''}`}>
                                                        {notif.title}
                                                    </p>
                                                    <p className="text-sm text-gray-600 mt-1">{notif.message}</p>
                                                    <p className="text-xs text-gray-400 mt-1">{notif.timeAgo}</p>
                                                </div>
                                                {!notif.isRead && (
                                                    <span className="ml-2 h-2 w-2 bg-blue-600 rounded-full flex-shrink-0"></span>
                                                )}
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            )}
                        </div>

                        {/* Footer */}
                        {notifications.length > 0 && (
                            <div className="p-3 border-t border-gray-200 bg-gray-50 text-center">
                                <a
                                    href="/notifications"
                                    className="text-sm text-blue-600 hover:text-blue-800 font-medium"
                                >
                                    View all notifications
                                </a>
                            </div>
                        )}
                    </div>
                </>
            )}
        </div>
    );
};

export default NotificationBell;
