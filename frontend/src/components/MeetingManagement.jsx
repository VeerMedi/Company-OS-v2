import React, { useState, useEffect } from 'react';
import { Calendar, Clock, Users, Plus, Video, X, Check, XCircle, AlertCircle, Edit2, Trash2 } from 'lucide-react';
import api from '../utils/api';
import toast from 'react-hot-toast';

const MeetingManagement = ({ isModal = false }) => {
    const [meetings, setMeetings] = useState({ upcoming: [], past: [] });
    const [loading, setLoading] = useState(true);
    const [showCreateModal, setShowCreateModal] = useState(false);
    const [formData, setFormData] = useState({
        title: '',
        description: '',
        startTime: '',
        endTime: '',
        invitedRoles: [],
        location: 'zoom',
        meetingLink: ''
    });

    const roleOptions = [
        { value: 'all', label: 'All Team Members', color: 'bg-purple-500' },
        { value: 'manager', label: 'All Managers', color: 'bg-blue-500' },
        { value: 'individual-developer', label: 'All Developers', color: 'bg-green-500' },
        { value: 'hr', label: 'HR Team', color: 'bg-yellow-500' },
        { value: 'head-of-sales', label: 'Sales Team', color: 'bg-red-500' },
        { value: 'ceo', label: 'CEO/Leadership', color: 'bg-indigo-500' }
    ];

    useEffect(() => {
        fetchMeetings();
    }, []);

    const fetchMeetings = async () => {
        try {
            setLoading(true);
            const response = await api.get('/meetings/my-meetings');
            setMeetings(response.data.data);
        } catch (error) {
            console.error('Failed to load meetings:', error);
            toast.error('Failed to load meetings');
        } finally {
            setLoading(false);
        }
    };

    const handleSyncCalendly = async () => {
        try {
            setLoading(true);
            toast.loading('Syncing with Calendly...');

            const response = await api.post('/meetings/calendly/sync');

            toast.dismiss();

            if (response.data.success) {
                const { summary, newMeetings } = response.data;

                // Show success message with details
                toast.success(
                    `✅ Sync Complete!\n📅 ${summary.newMeetings} new meetings\n📧 ${summary.notificationsSent} notifications sent`,
                    { duration: 5000 }
                );

                // Log details for debugging
                console.log('Sync Details:', newMeetings);

                // Refresh meetings list
                fetchMeetings();
            }
        } catch (error) {
            toast.dismiss();
            console.error('Calendly sync error:', error);
            if (error.response?.status === 400) {
                toast.error('Calendly API not configured. Please add API key to backend .env file');
            } else {
                toast.error(error.response?.data?.message || 'Failed to sync with Calendly');
            }
        } finally {
            setLoading(false);
        }
    };

    const handleCreateMeeting = async (e) => {
        e.preventDefault();

        if (!formData.title || !formData.startTime || !formData.endTime) {
            toast.error('Please fill in all required fields');
            return;
        }

        if (formData.invitedRoles.length === 0) {
            toast.error('Please select at least one team to invite');
            return;
        }

        try {
            const response = await api.post('/meetings', formData);
            toast.success(response.data.message || 'Meeting created successfully!');
            setShowCreateModal(false);
            fetchMeetings();
            setFormData({
                title: '',
                description: '',
                startTime: '',
                endTime: '',
                invitedRoles: [],
                location: 'zoom',
                meetingLink: ''
            });
        } catch (error) {
            console.error('Create meeting error:', error);
            toast.error(error.response?.data?.message || 'Failed to create meeting');
        }
    };

    const handleRoleToggle = (role) => {
        setFormData(prev => ({
            ...prev,
            invitedRoles: prev.invitedRoles.includes(role)
                ? prev.invitedRoles.filter(r => r !== role)
                : [...prev.invitedRoles, role]
        }));
    };

    const formatDate = (dateString) => {
        return new Date(dateString).toLocaleDateString('en-IN', {
            weekday: 'short',
            year: 'numeric',
            month: 'short',
            day: 'numeric'
        });
    };

    const formatTime = (dateString) => {
        return new Date(dateString).toLocaleTimeString('en-IN', {
            hour: '2-digit',
            minute: '2-digit'
        });
    };

    const getDuration = (start, end) => {
        const minutes = Math.round((new Date(end) - new Date(start)) / 60000);
        if (minutes >= 60) {
            const hours = Math.floor(minutes / 60);
            const mins = minutes % 60;
            return `${hours}h ${mins}m`;
        }
        return `${minutes}m`;
    };

    const MeetingCard = ({ meeting, isPast = false }) => (
        <div className={`dashboard-card hover:shadow-lg transition-all ${isPast ? 'opacity-75' : ''}`}>
            <div className="flex items-start justify-between gap-4">
                <div className="flex-1">
                    <div className="flex items-start gap-3">
                        <div className="p-2 bg-primary/10 rounded-lg">
                            <Calendar className="text-primary" size={24} />
                        </div>
                        <div className="flex-1">
                            <h3 className="text-lg font-semibold text-foreground mb-1">
                                {meeting.title}
                            </h3>
                            {meeting.description && (
                                <p className="text-sm text-muted-foreground mb-3">
                                    {meeting.description}
                                </p>
                            )}
                            <div className="flex flex-wrap items-center gap-4 text-sm">
                                <div className="flex items-center gap-1.5 text-muted-foreground">
                                    <Calendar size={16} />
                                    <span>{formatDate(meeting.startTime)}</span>
                                </div>
                                <div className="flex items-center gap-1.5 text-muted-foreground">
                                    <Clock size={16} />
                                    <span>
                                        {formatTime(meeting.startTime)} - {formatTime(meeting.endTime)}
                                    </span>
                                </div>
                                <div className="flex items-center gap-1.5 text-muted-foreground">
                                    <Users size={16} />
                                    <span>{getDuration(meeting.startTime, meeting.endTime)}</span>
                                </div>
                            </div>
                            <div className="mt-3 flex flex-wrap gap-2">
                                {meeting.invitedRoles?.map(role => {
                                    const roleInfo = roleOptions.find(r => r.value === role);
                                    return roleInfo ? (
                                        <span
                                            key={role}
                                            className={`text-xs px-2 py-1 rounded-full text-white ${roleInfo.color}`}
                                        >
                                            {roleInfo.label}
                                        </span>
                                    ) : null;
                                })}
                            </div>
                            <div className="mt-2 text-xs text-muted-foreground">
                                Organized by: {meeting.createdBy?.firstName} {meeting.createdBy?.lastName}
                            </div>
                        </div>
                    </div>
                </div>
                {!isPast && meeting.meetingLink && (
                    <a
                        href={meeting.meetingLink}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="btn-primary flex items-center gap-2 shrink-0"
                    >
                        <Video size={18} />
                        Join
                    </a>
                )}
            </div>
        </div>
    );

    if (loading) {
        return (
            <div className="flex items-center justify-center h-64">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
            </div>
        );
    }

    return (
        <div className="space-y-6">
            {/* Header */}
            {!isModal ? (
                <div className="dashboard-card">
                    <div className="flex justify-between items-center">
                        <div>
                            <h1 className="text-2xl font-bold text-foreground flex items-center gap-2">
                                <Calendar className="text-primary" />
                                Meetings from Calendly
                            </h1>
                            <p className="text-muted-foreground mt-1">
                                Sync your Calendly meetings and automatically notify your team
                            </p>
                        </div>
                        <button
                            onClick={handleSyncCalendly}
                            disabled={loading}
                            className="btn-primary flex items-center gap-2"
                        >
                            {loading ? (
                                <>
                                    <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
                                    Syncing...
                                </>
                            ) : (
                                <>
                                    <Calendar size={20} />
                                    Sync from Calendly
                                </>
                            )}
                        </button>
                    </div>
                </div>
            ) : (
                <div className="flex justify-end mb-2">
                    <button
                        onClick={handleSyncCalendly}
                        disabled={loading}
                        className="btn-primary flex items-center gap-2"
                    >
                        {loading ? (
                            <>
                                <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
                                Syncing...
                            </>
                        ) : (
                            <>
                                <Calendar size={20} />
                                Sync from Calendly
                            </>
                        )}
                    </button>
                </div>
            )}

            {/* Stats */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="dashboard-card">
                    <div className="flex items-center gap-3">
                        <div className="p-3 bg-blue-500/10 rounded-lg">
                            <Calendar className="text-blue-500" size={24} />
                        </div>
                        <div>
                            <p className="text-sm text-muted-foreground">Upcoming</p>
                            <p className="text-2xl font-bold text-foreground">
                                {meetings.upcoming?.length || 0}
                            </p>
                        </div>
                    </div>
                </div>
                <div className="dashboard-card">
                    <div className="flex items-center gap-3">
                        <div className="p-3 bg-green-500/10 rounded-lg">
                            <Check className="text-green-500" size={24} />
                        </div>
                        <div>
                            <p className="text-sm text-muted-foreground">Completed</p>
                            <p className="text-2xl font-bold text-foreground">
                                {meetings.past?.length || 0}
                            </p>
                        </div>
                    </div>
                </div>
                <div className="dashboard-card">
                    <div className="flex items-center gap-3">
                        <div className="p-3 bg-purple-500/10 rounded-lg">
                            <Users className="text-purple-500" size={24} />
                        </div>
                        <div>
                            <p className="text-sm text-muted-foreground">Total</p>
                            <p className="text-2xl font-bold text-foreground">
                                {(meetings.upcoming?.length || 0) + (meetings.past?.length || 0)}
                            </p>
                        </div>
                    </div>
                </div>
            </div>

            {/* Upcoming Meetings */}
            <div>
                <h2 className="text-xl font-semibold text-foreground mb-4 flex items-center gap-2">
                    <Clock className="text-primary" size={20} />
                    Upcoming Meetings
                </h2>
                <div className="grid gap-4">
                    {meetings.upcoming && meetings.upcoming.length > 0 ? (
                        meetings.upcoming.map(meeting => (
                            <MeetingCard key={meeting._id} meeting={meeting} />
                        ))
                    ) : (
                        <div className="dashboard-card text-center py-12">
                            <AlertCircle className="mx-auto text-muted-foreground mb-3" size={48} />
                            <p className="text-muted-foreground">No upcoming meetings</p>
                        </div>
                    )}
                </div>
            </div>

            {/* Past Meetings */}
            {meetings.past && meetings.past.length > 0 && (
                <div>
                    <h2 className="text-xl font-semibold text-foreground mb-4 flex items-center gap-2">
                        <Check className="text-muted-foreground" size={20} />
                        Past Meetings
                    </h2>
                    <div className="grid gap-4">
                        {meetings.past.slice(0, 5).map(meeting => (
                            <MeetingCard key={meeting._id} meeting={meeting} isPast={true} />
                        ))}
                    </div>
                </div>
            )}

            {/* Create Meeting Modal */}
            {showCreateModal && (
                <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
                    <div className="bg-card rounded-xl shadow-2xl max-w-2xl w-full mx-auto border border-border max-h-[90vh] overflow-y-auto">
                        <div className="sticky top-0 bg-card border-b border-border p-6 flex justify-between items-center">
                            <h2 className="text-xl font-bold text-foreground">Create New Meeting</h2>
                            <button
                                onClick={() => setShowCreateModal(false)}
                                className="text-muted-foreground hover:text-foreground transition-colors"
                            >
                                <X size={24} />
                            </button>
                        </div>

                        <form onSubmit={handleCreateMeeting} className="p-6 space-y-5">
                            <div>
                                <label className="block text-sm font-medium text-foreground mb-2">
                                    Meeting Title *
                                </label>
                                <input
                                    type="text"
                                    required
                                    className="input-modern w-full"
                                    placeholder="e.g., Sprint Planning, Team Standup"
                                    value={formData.title}
                                    onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                                />
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-foreground mb-2">
                                    Description
                                </label>
                                <textarea
                                    className="input-modern w-full"
                                    rows="3"
                                    placeholder="Describe the meeting agenda..."
                                    value={formData.description}
                                    onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                                />
                            </div>

                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-sm font-medium text-foreground mb-2">
                                        Start Time *
                                    </label>
                                    <input
                                        type="datetime-local"
                                        required
                                        className="input-modern w-full"
                                        value={formData.startTime}
                                        onChange={(e) => setFormData({ ...formData, startTime: e.target.value })}
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-foreground mb-2">
                                        End Time *
                                    </label>
                                    <input
                                        type="datetime-local"
                                        required
                                        className="input-modern w-full"
                                        value={formData.endTime}
                                        onChange={(e) => setFormData({ ...formData, endTime: e.target.value })}
                                    />
                                </div>
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-foreground mb-2">
                                    Meeting Link (Zoom/Meet)
                                </label>
                                <input
                                    type="url"
                                    className="input-modern w-full"
                                    placeholder="https://zoom.us/j/..."
                                    value={formData.meetingLink}
                                    onChange={(e) => setFormData({ ...formData, meetingLink: e.target.value })}
                                />
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-foreground mb-3">
                                    Invite Team Members * (Select roles to send notifications)
                                </label>
                                <div className="space-y-2">
                                    {roleOptions.map(role => (
                                        <label
                                            key={role.value}
                                            className="flex items-center gap-3 p-3 rounded-lg border border-border hover:bg-muted/50 cursor-pointer transition-colors"
                                        >
                                            <input
                                                type="checkbox"
                                                checked={formData.invitedRoles.includes(role.value)}
                                                onChange={() => handleRoleToggle(role.value)}
                                                className="w-4 h-4 rounded border-gray-300"
                                            />
                                            <span className={`w-3 h-3 rounded-full ${role.color}`}></span>
                                            <span className="text-sm font-medium text-foreground flex-1">
                                                {role.label}
                                            </span>
                                            {role.value === 'all' && (
                                                <span className="text-xs text-muted-foreground">
                                                    (Sends to everyone)
                                                </span>
                                            )}
                                        </label>
                                    ))}
                                </div>
                                {formData.invitedRoles.length > 0 && (
                                    <p className="mt-2 text-sm text-green-600">
                                        ✓ Notifications will be sent to selected teams
                                    </p>
                                )}
                            </div>

                            <div className="flex justify-end gap-3 pt-4 border-t border-border">
                                <button
                                    type="button"
                                    onClick={() => setShowCreateModal(false)}
                                    className="btn-secondary"
                                >
                                    Cancel
                                </button>
                                <button type="submit" className="btn-primary flex items-center gap-2">
                                    <Calendar size={18} />
                                    Create & Send Notifications
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
};

export default MeetingManagement;
