import React, { useState, useEffect } from 'react';
import {
    Award,
    Star,
    FileText,
    Calendar,
    User,
    TrendingUp,
    CheckCircle,
    Clock,
    MessageSquare,
    Plus,
    Filter
} from 'lucide-react';
import api from '../../utils/api';
import toast from 'react-hot-toast';

const TeamReviews = () => {
    const [reviews, setReviews] = useState([]);
    const [employees, setEmployees] = useState([]);
    const [loading, setLoading] = useState(true);
    const [filterStatus, setFilterStatus] = useState('all'); // all, pending, completed
    const [showCreateModal, setShowCreateModal] = useState(false);

    useEffect(() => {
        fetchReviewsAndEmployees();

        // Auto-refresh every 60 seconds
        const refreshInterval = setInterval(fetchReviewsAndEmployees, 60000);
        return () => clearInterval(refreshInterval);
    }, []);

    const fetchReviewsAndEmployees = async () => {
        try {
            // For now, using mock data since reviews endpoint doesn't exist yet
            const employeesResponse = await api.get('/users/individuals');
            if (employeesResponse.data.success) {
                setEmployees(employeesResponse.data.data);
            }

            // Mock review data - using real employee objects if available
            const emps = employeesResponse.data.data;
            if (emps && emps.length > 0) {
                setReviews([
                    {
                        _id: '1',
                        employee: emps[0],
                        reviewType: 'Quarterly Review',
                        dueDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
                        status: 'pending'
                    },
                    {
                        _id: '2',
                        employee: emps.length > 1 ? emps[1] : emps[0],
                        reviewType: 'Annual Review',
                        dueDate: new Date(Date.now() + 14 * 24 * 60 * 60 * 1000),
                        status: 'pending'
                    }
                ]);
            } else {
                setReviews([]);
            }

        } catch (error) {
            console.error('Error fetching data:', error);
            if (reviews.length === 0) {
                // Be silent on initial load error if it's just mock setup failing
            }
        } finally {
            setLoading(false);
        }
    };

    const getStats = () => {
        const pending = reviews.filter(r => r.status === 'pending').length;
        const completed = reviews.filter(r => r.status === 'completed').length;
        const overdue = reviews.filter(r => {
            return r.status === 'pending' && new Date(r.dueDate) < new Date();
        }).length;

        return {
            total: reviews.length,
            pending,
            completed,
            overdue
        };
    };

    const stats = getStats();

    const filteredReviews = reviews.filter(review => {
        if (filterStatus === 'all') return true;
        return review.status === filterStatus;
    });

    const formatDate = (dateString) => {
        if (!dateString) return 'N/A';
        return new Date(dateString).toLocaleDateString('en-US', {
            year: 'numeric',
            month: 'short',
            day: 'numeric'
        });
    };

    const getDaysUntilDue = (dueDate) => {
        const now = new Date();
        const due = new Date(dueDate);
        const days = Math.ceil((due - now) / (1000 * 60 * 60 * 24));
        return days;
    };

    const getUrgencyColor = (dueDate, status) => {
        if (status === 'completed') return 'text-emerald-400';

        const days = getDaysUntilDue(dueDate);
        if (days < 0) return 'text-red-400';
        if (days < 3) return 'text-orange-400';
        if (days < 7) return 'text-amber-400';
        return 'text-blue-400';
    };

    return (
        <div className="min-h-screen bg-black p-6 space-y-6">
            {/* Header */}
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-3xl font-bold text-white flex items-center gap-3 tracking-tight">
                        <Award className="h-8 w-8 text-blue-500" />
                        Team Reviews
                    </h1>
                    <p className="text-zinc-400 mt-1">Manage performance reviews and employee feedback</p>
                </div>
                <button
                    onClick={() => setShowCreateModal(true)}
                    className="flex items-center gap-2 px-4 py-2.5 bg-zinc-100 text-zinc-900 rounded-xl hover:bg-white transition-all font-medium shadow-lg"
                >
                    <Plus className="h-5 w-5" />
                    Schedule Review
                </button>
            </div>

            {loading ? (
                <div className="flex items-center justify-center py-12">
                    <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500"></div>
                </div>
            ) : (
                <>
                    {/* Statistics - Dark Premium Style */}
                    <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
                        {/* Total Reviews */}
                        <div className="bg-gradient-to-b from-zinc-900 to-zinc-950 rounded-2xl p-6 border border-white/5 shadow-xl relative overflow-hidden group">
                            <div className="absolute inset-0 bg-gradient-to-tr from-blue-600/5 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
                            <div className="relative z-10 flex items-center justify-between">
                                <div>
                                    <p className="text-zinc-400 text-sm font-medium tracking-wide">Total Reviews</p>
                                    <p className="text-3xl font-bold text-white mt-2 tracking-tight">{stats.total}</p>
                                </div>
                                <div className="h-12 w-12 bg-blue-500/10 border border-blue-500/20 rounded-xl flex items-center justify-center">
                                    <FileText className="h-6 w-6 text-blue-400" />
                                </div>
                            </div>
                        </div>

                        {/* Pending */}
                        <div className="bg-gradient-to-b from-zinc-900 to-zinc-950 rounded-2xl p-6 border border-white/5 shadow-xl relative overflow-hidden group">
                            <div className="absolute inset-0 bg-gradient-to-tr from-amber-600/5 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
                            <div className="relative z-10 flex items-center justify-between">
                                <div>
                                    <p className="text-zinc-400 text-sm font-medium tracking-wide">Pending</p>
                                    <p className="text-3xl font-bold text-white mt-2 tracking-tight">{stats.pending}</p>
                                </div>
                                <div className="h-12 w-12 bg-amber-500/10 border border-amber-500/20 rounded-xl flex items-center justify-center">
                                    <Clock className="h-6 w-6 text-amber-400" />
                                </div>
                            </div>
                        </div>

                        {/* Completed */}
                        <div className="bg-gradient-to-b from-zinc-900 to-zinc-950 rounded-2xl p-6 border border-white/5 shadow-xl relative overflow-hidden group">
                            <div className="absolute inset-0 bg-gradient-to-tr from-emerald-600/5 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
                            <div className="relative z-10 flex items-center justify-between">
                                <div>
                                    <p className="text-zinc-400 text-sm font-medium tracking-wide">Completed</p>
                                    <p className="text-3xl font-bold text-white mt-2 tracking-tight">{stats.completed}</p>
                                </div>
                                <div className="h-12 w-12 bg-emerald-500/10 border border-emerald-500/20 rounded-xl flex items-center justify-center">
                                    <CheckCircle className="h-6 w-6 text-emerald-400" />
                                </div>
                            </div>
                        </div>

                        {/* Overdue */}
                        <div className="bg-gradient-to-b from-zinc-900 to-zinc-950 rounded-2xl p-6 border border-white/5 shadow-xl relative overflow-hidden group">
                            <div className="absolute inset-0 bg-gradient-to-tr from-red-600/5 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
                            <div className="relative z-10 flex items-center justify-between">
                                <div>
                                    <p className="text-zinc-400 text-sm font-medium tracking-wide">Overdue</p>
                                    <p className="text-3xl font-bold text-white mt-2 tracking-tight">{stats.overdue}</p>
                                </div>
                                <div className="h-12 w-12 bg-red-500/10 border border-red-500/20 rounded-xl flex items-center justify-center">
                                    <Calendar className="h-6 w-6 text-red-400" />
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Filters */}
                    <div className="bg-zinc-900/50 backdrop-blur-md rounded-2xl p-4 border border-white/5 shadow-lg">
                        <div className="flex items-center gap-2">
                            <Filter className="h-5 w-5 text-zinc-400" />
                            <span className="text-sm font-medium text-zinc-300 mr-2">Filter:</span>
                            <div className="flex gap-2">
                                <button
                                    onClick={() => setFilterStatus('all')}
                                    className={`px-4 py-1.5 rounded-xl text-sm font-medium transition-all ${filterStatus === 'all'
                                        ? 'bg-blue-600 text-white shadow-lg shadow-blue-500/20'
                                        : 'bg-zinc-800 text-zinc-400 hover:bg-zinc-700 hover:text-white border border-white/5'
                                        }`}
                                >
                                    All
                                </button>
                                <button
                                    onClick={() => setFilterStatus('pending')}
                                    className={`px-4 py-1.5 rounded-xl text-sm font-medium transition-all ${filterStatus === 'pending'
                                        ? 'bg-amber-600 text-white shadow-lg shadow-amber-500/20'
                                        : 'bg-zinc-800 text-zinc-400 hover:bg-zinc-700 hover:text-white border border-white/5'
                                        }`}
                                >
                                    Pending
                                </button>
                                <button
                                    onClick={() => setFilterStatus('completed')}
                                    className={`px-4 py-1.5 rounded-xl text-sm font-medium transition-all ${filterStatus === 'completed'
                                        ? 'bg-emerald-600 text-white shadow-lg shadow-emerald-500/20'
                                        : 'bg-zinc-800 text-zinc-400 hover:bg-zinc-700 hover:text-white border border-white/5'
                                        }`}
                                >
                                    Completed
                                </button>
                            </div>
                        </div>
                    </div>

                    {/* Review Cards */}
                    {filteredReviews.length === 0 ? (
                        <div className="bg-zinc-900/30 backdrop-blur-md rounded-2xl p-12 text-center border border-white/5">
                            <Award className="h-16 w-16 text-zinc-800 mx-auto mb-4" />
                            <h3 className="text-lg font-medium text-white mb-2">No reviews found</h3>
                            <p className="text-zinc-500">
                                {filterStatus === 'all' ? 'Schedule a review to get started' : `No ${filterStatus} reviews`}
                            </p>
                        </div>
                    ) : (
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                            {filteredReviews.map((review) => {
                                const daysUntilDue = getDaysUntilDue(review.dueDate);
                                const urgencyColor = getUrgencyColor(review.dueDate, review.status);

                                return (
                                    <div key={review._id} className="bg-zinc-900/30 backdrop-blur-md rounded-2xl p-6 border border-white/5 hover:border-blue-500/30 transition-all group">
                                        <div className="flex items-start justify-between mb-4">
                                            <div className="flex items-center gap-3">
                                                <div className="h-12 w-12 rounded-full bg-zinc-800 flex items-center justify-center text-white font-bold shadow-lg border border-white/5">
                                                    {review.employee?.firstName?.charAt(0)}{review.employee?.lastName?.charAt(0)}
                                                </div>
                                                <div>
                                                    <h4 className="font-semibold text-white group-hover:text-blue-400 transition-colors">
                                                        {review.employee?.firstName} {review.employee?.lastName}
                                                    </h4>
                                                    <p className="text-xs text-zinc-400 capitalize">
                                                        {review.employee?.role?.replace('-', ' ') || 'Unknown Role'}
                                                    </p>
                                                </div>
                                            </div>
                                            <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${review.status === 'completed'
                                                ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20'
                                                : 'bg-amber-500/10 text-amber-400 border border-amber-500/20'
                                                }`}>
                                                {review.status === 'completed' ? <CheckCircle className="h-3 w-3 mr-1" /> : <Clock className="h-3 w-3 mr-1" />}
                                                {review.status}
                                            </span>
                                        </div>

                                        <div className="space-y-3">
                                            <div>
                                                <p className="text-sm text-zinc-500">Review Type</p>
                                                <p className="text-white font-medium">{review.reviewType}</p>
                                            </div>

                                            <div>
                                                <p className="text-sm text-zinc-500">Due Date</p>
                                                <div className="flex items-center justify-between">
                                                    <p className="text-white font-medium">{formatDate(review.dueDate)}</p>
                                                    {review.status !== 'completed' && (
                                                        <span className={`text-xs font-medium ${urgencyColor}`}>
                                                            {daysUntilDue < 0 ? 'Overdue' : daysUntilDue === 0 ? 'Today' : `${daysUntilDue}d left`}
                                                        </span>
                                                    )}
                                                </div>
                                            </div>
                                        </div>

                                        <div className="flex gap-2 mt-4 pt-4 border-t border-zinc-800">
                                            <button className="flex-1 px-3 py-2 bg-blue-500/10 text-blue-400 rounded-lg hover:bg-blue-500/20 transition-colors text-sm font-medium border border-blue-500/20">
                                                {review.status === 'completed' ? 'View Review' : 'Start Review'}
                                            </button>
                                            {review.status === 'pending' && (
                                                <button className="px-3 py-2 bg-zinc-800 text-zinc-300 rounded-lg hover:bg-zinc-700 hover:text-white transition-colors border border-zinc-700">
                                                    <MessageSquare className="h-4 w-4" />
                                                </button>
                                            )}
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                    )}
                </>
            )}

            {/* Create Review Modal Placeholder */}
            {showCreateModal && (
                <div className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center z-50 p-4">
                    <div className="bg-zinc-950 rounded-2xl max-w-md w-full p-6 border border-white/10 shadow-2xl">
                        <h3 className="text-lg font-semibold text-white mb-4">Schedule New Review</h3>
                        <p className="text-zinc-400 mb-6">Review scheduling form will be implemented here</p>
                        <button
                            onClick={() => setShowCreateModal(false)}
                            className="w-full px-4 py-2.5 bg-zinc-100 text-zinc-900 rounded-xl hover:bg-white transition-all font-semibold"
                        >
                            Close
                        </button>
                    </div>
                </div>
            )}
        </div>
    );
};

export default TeamReviews;
