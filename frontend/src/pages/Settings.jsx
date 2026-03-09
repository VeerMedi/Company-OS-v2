import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import DashboardLayout from '../components/DashboardLayout';
import {
    User,
    Lock,
    Bell,
    Palette,
    Shield,
    Camera,
    Save,
    Eye,
    EyeOff,
    Monitor,
    Moon,
    Sun,
    Globe,
    Clock,
    Mail,
    CheckCircle,
    AlertCircle,
    Smartphone
} from 'lucide-react';
import toast from 'react-hot-toast';
import api from '../utils/api';

const Settings = () => {
    const { user, refreshUser } = useAuth();
    const [activeTab, setActiveTab] = useState('general');
    const [loading, setLoading] = useState(false);
    const [uploadingPicture, setUploadingPicture] = useState(false);

    // General Settings State
    const [displayName, setDisplayName] = useState('');
    const [profilePicture, setProfilePicture] = useState('');
    const [picturePreview, setPicturePreview] = useState(null);

    // Preferences State
    const [preferences, setPreferences] = useState({
        theme: 'light',
        notifications: {
            email: true,
            push: true,
            payroll: true,
            tasks: true,
            leaves: true,
            performance: true,
            announcements: true
        },
        timezone: 'Asia/Kolkata',
        language: 'en',
        dashboardLayout: 'comfortable'
    });

    // Security State
    const [passwordData, setPasswordData] = useState({
        currentPassword: '',
        newPassword: '',
        confirmPassword: ''
    });
    const [showPasswords, setShowPasswords] = useState({
        current: false,
        new: false,
        confirm: false
    });

    const tabs = [
        { id: 'general', label: 'General', icon: User },
        { id: 'security', label: 'Security', icon: Lock },
        { id: 'notifications', label: 'Notifications', icon: Bell },
        { id: 'appearance', label: 'Appearance', icon: Palette },
        { id: 'privacy', label: 'Privacy', icon: Shield }
    ];

    useEffect(() => {
        fetchPreferences();
    }, []);

    const fetchPreferences = async () => {
        try {
            const response = await api.get('/users/settings/preferences');
            if (response.data.success) {
                const data = response.data.data;
                setDisplayName(data.displayName || '');
                setProfilePicture(data.profilePicture || '');
                setPreferences(data.preferences || preferences);
            }
        } catch (error) {
            console.error('Error fetching preferences:', error);
            toast.error('Failed to load settings');
        }
    };

    const handleProfilePictureChange = async (e) => {
        const file = e.target.files[0];
        if (!file) return;

        // Validate file type
        if (!file.type.startsWith('image/')) {
            toast.error('Please select an image file');
            return;
        }

        // Validate file size (5MB)
        if (file.size > 5 * 1024 * 1024) {
            toast.error('Image size must be less than 5MB');
            return;
        }

        try {
            setUploadingPicture(true);

            // Show preview
            const reader = new FileReader();
            reader.onloadend = () => {
                setPicturePreview(reader.result);
            };
            reader.readAsDataURL(file);

            // Upload to server
            const formData = new FormData();
            formData.append('profilePicture', file);

            const response = await api.post('/users/upload-profile-picture', formData, {
                headers: {
                    'Content-Type': 'multipart/form-data',
                },
            });

            if (response.data.success) {
                setProfilePicture(response.data.data.profilePicture);
                toast.success('Profile picture updated successfully');
                await refreshUser();
            }
        } catch (error) {
            console.error('Error uploading profile picture:', error);
            toast.error(error.response?.data?.message || 'Failed to upload profile picture');
            setPicturePreview(null);
        } finally {
            setUploadingPicture(false);
            e.target.value = '';
        }
    };

    const handleSaveGeneral = async () => {
        try {
            setLoading(true);
            const response = await api.put('/users/settings/preferences', {
                displayName,
                preferences
            });

            if (response.data.success) {
                toast.success('Settings saved successfully');
                await refreshUser();
            }
        } catch (error) {
            console.error('Error saving settings:', error);
            toast.error(error.response?.data?.message || 'Failed to save settings');
        } finally {
            setLoading(false);
        }
    };

    const handleChangePassword = async (e) => {
        e.preventDefault();

        if (passwordData.newPassword !== passwordData.confirmPassword) {
            toast.error('New passwords do not match');
            return;
        }

        if (passwordData.newPassword.length < 6) {
            toast.error('Password must be at least 6 characters');
            return;
        }

        try {
            setLoading(true);
            const response = await api.post('/users/change-password', {
                currentPassword: passwordData.currentPassword,
                newPassword: passwordData.newPassword
            });

            if (response.data.success) {
                toast.success('Password changed successfully');
                setPasswordData({
                    currentPassword: '',
                    newPassword: '',
                    confirmPassword: ''
                });
            }
        } catch (error) {
            console.error('Error changing password:', error);
            toast.error(error.response?.data?.message || 'Failed to change password');
        } finally {
            setLoading(false);
        }
    };

    const handleNotificationToggle = (key) => {
        setPreferences(prev => ({
            ...prev,
            notifications: {
                ...prev.notifications,
                [key]: !prev.notifications[key]
            }
        }));
    };

    const handleThemeChange = (theme) => {
        setPreferences(prev => ({
            ...prev,
            theme
        }));
    };

    const handleLayoutChange = (layout) => {
        setPreferences(prev => ({
            ...prev,
            dashboardLayout: layout
        }));
    };

    const getPasswordStrength = (password) => {
        if (!password) return { strength: 0, label: '', color: '' };

        let strength = 0;
        if (password.length >= 6) strength++;
        if (password.length >= 10) strength++;
        if (/[a-z]/.test(password) && /[A-Z]/.test(password)) strength++;
        if (/\d/.test(password)) strength++;
        if (/[^a-zA-Z\d]/.test(password)) strength++;

        const labels = ['', 'Weak', 'Fair', 'Good', 'Strong', 'Very Strong'];
        const colors = ['', 'bg-red-500', 'bg-orange-500', 'bg-yellow-500', 'bg-green-500', 'bg-emerald-500'];

        return { strength, label: labels[strength], color: colors[strength] };
    };

    const passwordStrength = getPasswordStrength(passwordData.newPassword);

    const renderGeneral = () => (
        <div className="space-y-6">
            {/* Profile Picture */}
            <div className="dark-card p-6">
                <h3 className="text-lg font-semibold mb-4 flex items-center" style={{ color: 'var(--foreground)' }}>
                    <Camera className="h-5 w-5 mr-2" style={{ color: 'var(--primary)' }} />
                    Profile Picture
                </h3>
                <div className="flex items-center space-x-6">
                    <div className="relative">
                        <div className="h-24 w-24 rounded-full bg-gradient-to-br from-blue-500 to-purple-500 flex items-center justify-center overflow-hidden">
                            {picturePreview || profilePicture ? (
                                <img
                                    src={picturePreview || profilePicture}
                                    alt="Profile"
                                    className="h-full w-full object-cover"
                                />
                            ) : (
                                <span className="text-white font-bold text-3xl">
                                    {user?.firstName?.charAt(0)}{user?.lastName?.charAt(0)}
                                </span>
                            )}
                        </div>
                        {uploadingPicture && (
                            <div className="absolute inset-0 bg-black bg-opacity-50 rounded-full flex items-center justify-center">
                                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-white"></div>
                            </div>
                        )}
                    </div>
                    <div>
                        <label className="btn-primary cursor-pointer inline-block">
                            <Camera className="h-4 w-4 inline mr-2" />
                            Upload New Picture
                            <input
                                type="file"
                                accept="image/*"
                                onChange={handleProfilePictureChange}
                                className="hidden"
                                disabled={uploadingPicture}
                            />
                        </label>
                        <p className="text-sm mt-2" style={{ color: 'var(--muted-foreground)' }}>
                            JPG, PNG or GIF. Max size 5MB.
                        </p>
                    </div>
                </div>
            </div>

            {/* Display Name */}
            <div className="dark-card p-6">
                <h3 className="text-lg font-semibold mb-4 flex items-center" style={{ color: 'var(--foreground)' }}>
                    <User className="h-5 w-5 mr-2" style={{ color: 'var(--primary)' }} />
                    Display Name
                </h3>
                <div className="space-y-4">
                    <div>
                        <label className="block text-sm font-medium mb-2" style={{ color: 'var(--foreground)' }}>
                            Display Name (Optional)
                        </label>
                        <input
                            type="text"
                            value={displayName}
                            onChange={(e) => setDisplayName(e.target.value)}
                            className="input-modern"
                            placeholder="How you'd like to be called"
                        />
                        <p className="text-sm mt-1" style={{ color: 'var(--muted-foreground)' }}>
                            Leave empty to use your full name: {user?.firstName} {user?.lastName}
                        </p>
                    </div>
                </div>
            </div>

            {/* Account Information */}
            <div className="dark-card p-6">
                <h3 className="text-lg font-semibold mb-4 flex items-center" style={{ color: 'var(--foreground)' }}>
                    <Mail className="h-5 w-5 mr-2" style={{ color: 'var(--primary)' }} />
                    Account Information
                </h3>
                <div className="space-y-3">
                    <div className="flex justify-between items-center py-2 border-b" style={{ borderColor: 'var(--border)' }}>
                        <span className="text-sm" style={{ color: 'var(--muted-foreground)' }}>Email</span>
                        <span className="text-sm font-medium" style={{ color: 'var(--foreground)' }}>{user?.email}</span>
                    </div>
                    <div className="flex justify-between items-center py-2 border-b" style={{ borderColor: 'var(--border)' }}>
                        <span className="text-sm" style={{ color: 'var(--muted-foreground)' }}>Employee ID</span>
                        <span className="text-sm font-medium" style={{ color: 'var(--foreground)' }}>{user?.employeeId}</span>
                    </div>
                    <div className="flex justify-between items-center py-2 border-b" style={{ borderColor: 'var(--border)' }}>
                        <span className="text-sm" style={{ color: 'var(--muted-foreground)' }}>Role</span>
                        <span className="text-sm font-medium capitalize" style={{ color: 'var(--foreground)' }}>{user?.role?.replace('-', ' ')}</span>
                    </div>
                </div>
            </div>

            {/* Timezone */}
            <div className="dark-card p-6">
                <h3 className="text-lg font-semibold mb-4 flex items-center" style={{ color: 'var(--foreground)' }}>
                    <Clock className="h-5 w-5 mr-2" style={{ color: 'var(--primary)' }} />
                    Timezone
                </h3>
                <select
                    value={preferences.timezone}
                    onChange={(e) => setPreferences(prev => ({ ...prev, timezone: e.target.value }))}
                    className="input-modern"
                >
                    <option value="Asia/Kolkata">Asia/Kolkata (IST)</option>
                    <option value="America/New_York">America/New York (EST)</option>
                    <option value="Europe/London">Europe/London (GMT)</option>
                    <option value="Asia/Dubai">Asia/Dubai (GST)</option>
                    <option value="Asia/Singapore">Asia/Singapore (SGT)</option>
                </select>
            </div>

            <div className="flex justify-end">
                <button
                    onClick={handleSaveGeneral}
                    disabled={loading}
                    className="btn-primary"
                >
                    <Save className="h-4 w-4 mr-2" />
                    {loading ? 'Saving...' : 'Save Changes'}
                </button>
            </div>
        </div>
    );

    const renderSecurity = () => (
        <div className="space-y-6">
            {/* Change Password */}
            <div className="dark-card p-6">
                <h3 className="text-lg font-semibold mb-4 flex items-center" style={{ color: 'var(--foreground)' }}>
                    <Lock className="h-5 w-5 mr-2" style={{ color: 'var(--primary)' }} />
                    Change Password
                </h3>
                <form onSubmit={handleChangePassword} className="space-y-4">
                    <div>
                        <label className="block text-sm font-medium mb-2" style={{ color: 'var(--foreground)' }}>
                            Current Password
                        </label>
                        <div className="relative">
                            <input
                                type={showPasswords.current ? 'text' : 'password'}
                                value={passwordData.currentPassword}
                                onChange={(e) => setPasswordData(prev => ({ ...prev, currentPassword: e.target.value }))}
                                className="input-modern pr-10"
                                required
                            />
                            <button
                                type="button"
                                onClick={() => setShowPasswords(prev => ({ ...prev, current: !prev.current }))}
                                className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                            >
                                {showPasswords.current ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
                            </button>
                        </div>
                    </div>

                    <div>
                        <label className="block text-sm font-medium mb-2" style={{ color: 'var(--foreground)' }}>
                            New Password
                        </label>
                        <div className="relative">
                            <input
                                type={showPasswords.new ? 'text' : 'password'}
                                value={passwordData.newPassword}
                                onChange={(e) => setPasswordData(prev => ({ ...prev, newPassword: e.target.value }))}
                                className="input-modern pr-10"
                                required
                                minLength={6}
                            />
                            <button
                                type="button"
                                onClick={() => setShowPasswords(prev => ({ ...prev, new: !prev.new }))}
                                className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                            >
                                {showPasswords.new ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
                            </button>
                        </div>
                        {passwordData.newPassword && (
                            <div className="mt-2">
                                <div className="flex items-center justify-between mb-1">
                                    <span className="text-xs text-gray-600">Password Strength:</span>
                                    <span className={`text-xs font-medium ${passwordStrength.strength <= 1 ? 'text-red-600' :
                                        passwordStrength.strength <= 3 ? 'text-yellow-600' :
                                            'text-green-600'
                                        }`}>
                                        {passwordStrength.label}
                                    </span>
                                </div>
                                <div className="w-full bg-gray-200 rounded-full h-2">
                                    <div
                                        className={`h-2 rounded-full transition-all ${passwordStrength.color}`}
                                        style={{ width: `${(passwordStrength.strength / 5) * 100}%` }}
                                    ></div>
                                </div>
                            </div>
                        )}
                    </div>

                    <div>
                        <label className="block text-sm font-medium mb-2" style={{ color: 'var(--foreground)' }}>
                            Confirm New Password
                        </label>
                        <div className="relative">
                            <input
                                type={showPasswords.confirm ? 'text' : 'password'}
                                value={passwordData.confirmPassword}
                                onChange={(e) => setPasswordData(prev => ({ ...prev, confirmPassword: e.target.value }))}
                                className="input-modern pr-10"
                                required
                            />
                            <button
                                type="button"
                                onClick={() => setShowPasswords(prev => ({ ...prev, confirm: !prev.confirm }))}
                                className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                            >
                                {showPasswords.confirm ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
                            </button>
                        </div>
                    </div>

                    <button
                        type="submit"
                        disabled={loading}
                        className="btn-primary w-full"
                    >
                        {loading ? 'Changing Password...' : 'Change Password'}
                    </button>
                </form>
            </div>

            {/* Password Info */}
            <div className="dark-card p-6">
                <h3 className="text-lg font-semibold mb-4" style={{ color: 'var(--foreground)' }}>Password Information</h3>
                <div className="space-y-2">
                    <div className="flex items-center py-2">
                        <CheckCircle className="h-5 w-5 text-green-500 mr-2" />
                        <span className="text-sm" style={{ color: 'var(--muted-foreground)' }}>Last changed: {user?.passwordChangedAt ? new Date(user.passwordChangedAt).toLocaleDateString() : 'Never'}</span>
                    </div>
                    <div className="flex items-center py-2">
                        <AlertCircle className="h-5 w-5" style={{ color: 'var(--primary)' }} />
                        <span className="text-sm" style={{ color: 'var(--muted-foreground)' }}>Password must be at least 6 characters</span>
                    </div>
                </div>
            </div>
        </div>
    );

    const renderNotifications = () => (
        <div className="space-y-6">
            <div className="dark-card p-6">
                <h3 className="text-lg font-semibold mb-4 flex items-center" style={{ color: 'var(--foreground)' }}>
                    <Bell className="h-5 w-5 mr-2" style={{ color: 'var(--primary)' }} />
                    Notification Preferences
                </h3>
                <div className="space-y-4">
                    {/* Email Notifications */}
                    <div className="flex items-center justify-between py-3 border-b" style={{ borderColor: 'var(--border)' }}>
                        <div className="flex items-center">
                            <Mail className="h-5 w-5 mr-3" style={{ color: 'var(--muted-foreground)' }} />
                            <div>
                                <p className="text-sm font-medium" style={{ color: 'var(--foreground)' }}>Email Notifications</p>
                                <p className="text-xs" style={{ color: 'var(--muted-foreground)' }}>Receive notifications via email</p>
                            </div>
                        </div>
                        <label className="relative inline-flex items-center cursor-pointer">
                            <input
                                type="checkbox"
                                checked={preferences.notifications.email}
                                onChange={() => handleNotificationToggle('email')}
                                className="sr-only peer"
                            />
                            <div className="w-11 h-6 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border after:rounded-full after:h-5 after:w-5 after:transition-all" style={{ backgroundColor: 'var(--muted)', borderColor: 'var(--border)' }}></div>
                            <style>{`.peer:checked ~ div { background-color: var(--primary) !important; }`}</style>
                        </label>
                    </div>

                    {/* Push Notifications */}
                    <div className="flex items-center justify-between py-3 border-b" style={{ borderColor: 'var(--border)' }}>
                        <div className="flex items-center">
                            <Smartphone className="h-5 w-5 mr-3" style={{ color: 'var(--muted-foreground)' }} />
                            <div>
                                <p className="text-sm font-medium" style={{ color: 'var(--foreground)' }}>Push Notifications</p>
                                <p className="text-xs" style={{ color: 'var(--muted-foreground)' }}>Receive push notifications in browser</p>
                            </div>
                        </div>
                        <label className="relative inline-flex items-center cursor-pointer">
                            <input
                                type="checkbox"
                                checked={preferences.notifications.push}
                                onChange={() => handleNotificationToggle('push')}
                                className="sr-only peer"
                            />
                            <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
                        </label>
                    </div>

                    {/* Category-specific notifications */}
                    <div className="pt-4">
                        <h4 className="text-sm font-semibold mb-3" style={{ color: 'var(--foreground)' }}>Notification Categories</h4>

                        {[
                            { key: 'payroll', label: 'Payroll Updates', desc: 'Salary slips and payment notifications' },
                            { key: 'tasks', label: 'Task Assignments', desc: 'New tasks and updates' },
                            { key: 'leaves', label: 'Leave Management', desc: 'Leave approvals and updates' },
                            { key: 'performance', label: 'Performance Reviews', desc: 'Performance feedback and reviews' },
                            { key: 'announcements', label: 'Announcements', desc: 'Company-wide announcements' }
                        ].map(({ key, label, desc }) => (
                            <div key={key} className="flex items-center justify-between py-3 border-b" style={{ borderColor: 'var(--border)' }}>
                                <div>
                                    <p className="text-sm font-medium" style={{ color: 'var(--foreground)' }}>{label}</p>
                                    <p className="text-xs" style={{ color: 'var(--muted-foreground)' }}>{desc}</p>
                                </div>
                                <label className="relative inline-flex items-center cursor-pointer">
                                    <input
                                        type="checkbox"
                                        checked={preferences.notifications[key]}
                                        onChange={() => handleNotificationToggle(key)}
                                        className="sr-only peer"
                                    />
                                    <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
                                </label>
                            </div>
                        ))}
                    </div>
                </div>
            </div>

            <div className="flex justify-end">
                <button
                    onClick={handleSaveGeneral}
                    disabled={loading}
                    className="btn-primary"
                >
                    <Save className="h-4 w-4 mr-2" />
                    {loading ? 'Saving...' : 'Save Preferences'}
                </button>
            </div>
        </div>
    );

    const renderAppearance = () => (
        <div className="space-y-6">
            {/* Theme Selection */}
            <div className="dark-card p-6">
                <h3 className="text-lg font-semibold mb-4 flex items-center" style={{ color: 'var(--foreground)' }}>
                    <Palette className="h-5 w-5 mr-2" style={{ color: 'var(--primary)' }} />
                    Theme
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    {[
                        { value: 'light', label: 'Light', icon: Sun, desc: 'Classic light theme' },
                        { value: 'dark', label: 'Dark', icon: Moon, desc: 'Easy on the eyes' },
                        { value: 'auto', label: 'Auto', icon: Monitor, desc: 'Match system settings' }
                    ].map(({ value, label, icon: Icon, desc }) => (
                        <button
                            key={value}
                            onClick={() => handleThemeChange(value)}
                            className="p-4 rounded-lg border-2 transition-all"
                            style={{
                                borderColor: preferences.theme === value ? 'var(--primary)' : 'var(--border)',
                                backgroundColor: preferences.theme === value ? 'oklch(from var(--primary) l c h / 0.1)' : 'transparent'
                            }}
                        >
                            <Icon className="h-8 w-8 mx-auto mb-2" style={{ color: preferences.theme === value ? 'var(--primary)' : 'var(--muted-foreground)' }} />
                            <p className="font-medium" style={{ color: 'var(--foreground)' }}>{label}</p>
                            <p className="text-xs mt-1" style={{ color: 'var(--muted-foreground)' }}>{desc}</p>
                        </button>
                    ))}
                </div>
                <div className="mt-4 p-3 rounded-lg" style={{ backgroundColor: 'oklch(from var(--primary) l c h / 0.1)', border: '1px solid', borderColor: 'oklch(from var(--primary) l c h / 0.3)' }}>
                    <p className="text-sm" style={{ color: 'var(--primary)' }}>
                        <AlertCircle className="h-4 w-4 inline mr-1" />
                        Theme switching will be fully implemented in a future update
                    </p>
                </div>
            </div>

            {/* Dashboard Layout */}
            <div className="dark-card p-6">
                <h3 className="text-lg font-semibold mb-4 flex items-center" style={{ color: 'var(--foreground)' }}>
                    <Monitor className="h-5 w-5 mr-2" style={{ color: 'var(--primary)' }} />
                    Dashboard Layout
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {[
                        { value: 'comfortable', label: 'Comfortable', desc: 'More spacing, easier to read' },
                        { value: 'compact', label: 'Compact', desc: 'Denser layout, more content' }
                    ].map(({ value, label, desc }) => (
                        <button
                            key={value}
                            onClick={() => handleLayoutChange(value)}
                            className="p-4 rounded-lg border-2 transition-all text-left"
                            style={{
                                borderColor: preferences.dashboardLayout === value ? 'var(--primary)' : 'var(--border)',
                                backgroundColor: preferences.dashboardLayout === value ? 'oklch(from var(--primary) l c h / 0.1)' : 'transparent'
                            }}
                        >
                            <p className="font-medium" style={{ color: 'var(--foreground)' }}>{label}</p>
                            <p className="text-xs mt-1" style={{ color: 'var(--muted-foreground)' }}>{desc}</p>
                        </button>
                    ))}
                </div>
            </div>

            <div className="flex justify-end">
                <button
                    onClick={handleSaveGeneral}
                    disabled={loading}
                    className="btn-primary"
                >
                    <Save className="h-4 w-4 mr-2" />
                    {loading ? 'Saving...' : 'Save Preferences'}
                </button>
            </div>
        </div>
    );

    const renderPrivacy = () => (
        <div className="space-y-6">
            <div className="dark-card p-6">
                <h3 className="text-lg font-semibold mb-4 flex items-center" style={{ color: 'var(--foreground)' }}>
                    <Shield className="h-5 w-5 mr-2" style={{ color: 'var(--primary)' }} />
                    Privacy Settings
                </h3>
                <div className="space-y-4">
                    <div className="p-4 rounded-lg" style={{ backgroundColor: 'oklch(from var(--primary) l c h / 0.1)', border: '1px solid', borderColor: 'oklch(from var(--primary) l c h / 0.3)' }}>
                        <p className="text-sm" style={{ color: 'var(--primary)' }}>
                            <Globe className="h-4 w-4 inline mr-1" />
                            Privacy settings and data management features will be available in a future update.
                        </p>
                    </div>

                    <div className="space-y-3">
                        <h4 className="text-sm font-semibold" style={{ color: 'var(--foreground)' }}>Your Data</h4>
                        <p className="text-sm" style={{ color: 'var(--muted-foreground)' }}>
                            Your personal information is stored securely and is only accessible to authorized personnel.
                        </p>
                        <p className="text-sm" style={{ color: 'var(--muted-foreground)' }}>
                            For data privacy concerns or requests, please contact your HR department.
                        </p>
                    </div>
                </div>
            </div>
        </div>
    );

    return (
        <DashboardLayout>
            <div className="max-w-6xl mx-auto">
                {/* Header */}
                <div className="mb-6">
                    <h1 className="text-3xl font-bold" style={{ color: 'var(--foreground)' }}>Settings</h1>
                    <p className="mt-1" style={{ color: 'var(--muted-foreground)' }}>Manage your account settings and preferences</p>
                </div>

                {/* Tabs */}
                <div className="dark-card mb-6">
                    <div className="border-b" style={{ borderColor: 'var(--border)' }}>
                        <nav className="flex space-x-4 px-6" aria-label="Tabs">
                            {tabs.map((tab) => {
                                const Icon = tab.icon;
                                return (
                                    <button
                                        key={tab.id}
                                        onClick={() => setActiveTab(tab.id)}
                                        className="flex items-center px-4 py-4 text-sm font-medium border-b-2 transition-colors"
                                        style={{
                                            borderColor: activeTab === tab.id ? 'var(--primary)' : 'transparent',
                                            color: activeTab === tab.id ? 'var(--primary)' : 'var(--muted-foreground)'
                                        }}
                                    >
                                        <Icon className="h-5 w-5 mr-2" />
                                        {tab.label}
                                    </button>
                                );
                            })}
                        </nav>
                    </div>

                    {/* Tab Content */}
                    <div className="p-6">
                        {activeTab === 'general' && renderGeneral()}
                        {activeTab === 'security' && renderSecurity()}
                        {activeTab === 'notifications' && renderNotifications()}
                        {activeTab === 'appearance' && renderAppearance()}
                        {activeTab === 'privacy' && renderPrivacy()}
                    </div>
                </div>
            </div>
        </DashboardLayout>
    );
};

export default Settings;
