import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
    Book, Plus, Edit, History, CheckCircle, Clock,
    Archive, Eye, RefreshCw, AlertCircle, Trash2
} from 'lucide-react';
import DashboardLayout from '../components/DashboardLayout';
import { useAuth } from '../context/AuthContext';
import handbookService from '../services/handbookService';
import toast from 'react-hot-toast';

const HandbookManagement = () => {
    const { user } = useAuth();
    const navigate = useNavigate();

    const [handbooks, setHandbooks] = useState([]);
    const [loading, setLoading] = useState(true);
    const [filter, setFilter] = useState({
        department: 'all',
        status: 'all'
    });

    useEffect(() => {
        fetchHandbooks();
    }, [filter]);

    const fetchHandbooks = async () => {
        try {
            setLoading(true);
            const filters = {};
            if (filter.department !== 'all') filters.department = filter.department;
            if (filter.status !== 'all') filters.status = filter.status;

            const response = await handbookService.getAll(filters);
            setHandbooks(response.data || []);
        } catch (error) {
            console.error('Error fetching handbooks:', error);
            toast.error('Failed to load handbooks');
        } finally {
            setLoading(false);
        }
    };

    const handleCreateNew = () => {
        navigate('/handbooks/new');
    };

    const handleEdit = (id) => {
        navigate(`/handbooks/edit/${id}`);
    };

    const handleView = (id) => {
        navigate(`/handbooks/view/${id}`);
    };

    const handleVersionHistory = (id) => {
        navigate(`/handbooks/history/${id}`);
    };

    const handleSyncToRAG = async (id) => {
        try {
            await handbookService.syncToRAG(id);
            toast.success('Handbook synced to RAG successfully');
            fetchHandbooks();
        } catch (error) {
            toast.error('Failed to sync to RAG');
        }
    };

    const handleArchive = async (id) => {
        if (!confirm('Are you sure you want to archive this handbook?')) return;

        try {
            await handbookService.archive(id);
            toast.success('Handbook archived successfully');
            fetchHandbooks();
        } catch (error) {
            toast.error('Failed to archive handbook');
        }
    };

    const getStatusBadge = (status) => {
        const badges = {
            draft: 'bg-gray-100 text-gray-800',
            pending_approval: 'bg-yellow-100 text-yellow-800',
            approved: 'bg-green-100 text-green-800',
            published: 'bg-blue-100 text-blue-800',
            archived: 'bg-red-100 text-red-800'
        };

        return (
            <span className={`px-3 py-1 rounded-full text-xs font-semibold ${badges[status] || badges.draft}`}>
                {status.replace('_', ' ').toUpperCase()}
            </span>
        );
    };

    const getRAGSyncBadge = (syncStatus) => {
        const badges = {
            synced: { color: 'bg-green-100 text-green-800', icon: CheckCircle, text: 'Synced' },
            pending: { color: 'bg-yellow-100 text-yellow-800', icon: Clock, text: 'Pending' },
            failed: { color: 'bg-red-100 text-red-800', icon: AlertCircle, text: 'Failed' },
            not_required: { color: 'bg-gray-100 text-gray-800', icon: null, text: 'N/A' }
        };

        const badge = badges[syncStatus] || badges.not_required;
        const Icon = badge.icon;

        return (
            <span className={`px-2 py-1 rounded-full text-xs font-medium flex items-center gap-1 ${badge.color}`}>
                {Icon && <Icon className="h-3 w-3" />}
                {badge.text}
            </span>
        );
    };

    const sidebarActions = [
        {
            label: 'All Handbooks',
            icon: Book,
            onClick: () => navigate('/handbooks'),
            active: true
        },
        {
            label: 'Create New',
            icon: Plus,
            onClick: handleCreateNew,
            active: false
        }
    ];

    if (!['hr', 'ceo'].includes(user?.role)) {
        return (
            <DashboardLayout sidebarActions={sidebarActions}>
                <div className="p-6">
                    <div className="bg-yellow-50 border-l-4 border-yellow-400 p-4">
                        <div className="flex">
                            <AlertCircle className="h-5 w-5 text-yellow-400" />
                            <div className="ml-3">
                                <p className="text-sm text-yellow-700">
                                    You don't have permission to manage handbooks. This page is only accessible to HR and CEO.
                                </p>
                            </div>
                        </div>
                    </div>
                </div>
            </DashboardLayout>
        );
    }

    return (
        <DashboardLayout sidebarActions={sidebarActions}>
            <div className="p-6 space-y-6">
                {/* Header */}
                <div className="flex items-center justify-between">
                    <div>
                        <h1 className="text-3xl font-bold text-gray-900">Handbook Management</h1>
                        <p className="text-gray-600 mt-1">Manage company handbooks and documentation</p>
                    </div>
                    <button
                        onClick={handleCreateNew}
                        className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 flex items-center gap-2 transition-colors"
                    >
                        <Plus className="h-5 w-5" />
                        Create Handbook
                    </button>
                </div>

                {/* Filters */}
                <div className="bg-white rounded-lg shadow-sm p-4">
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">
                                Department
                            </label>
                            <select
                                value={filter.department}
                                onChange={(e) => setFilter({ ...filter, department: e.target.value })}
                                className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                            >
                                <option value="all">All Departments</option>
                                <option value="development">Development</option>
                                <option value="sales">Sales</option>
                                <option value="hr">HR</option>
                                <option value="operations">Operations</option>
                                <option value="general">General</option>
                            </select>
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">
                                Status
                            </label>
                            <select
                                value={filter.status}
                                onChange={(e) => setFilter({ ...filter, status: e.target.value })}
                                className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                            >
                                <option value="all">All Statuses</option>
                                <option value="draft">Draft</option>
                                <option value="pending_approval">Pending Approval</option>
                                <option value="approved">Approved</option>
                                <option value="published">Published</option>
                                <option value="archived">Archived</option>
                            </select>
                        </div>
                        <div className="flex items-end">
                            <button
                                onClick={fetchHandbooks}
                                className="bg-gray-100 text-gray-700 px-4 py-2 rounded-lg hover:bg-gray-200 flex items-center gap-2 transition-colors"
                            >
                                <RefreshCw className="h-4 w-4" />
                                Refresh
                            </button>
                        </div>
                    </div>
                </div>

                {/* Handbooks List */}
                {loading ? (
                    <div className="flex items-center justify-center py-12">
                        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
                    </div>
                ) : handbooks.length === 0 ? (
                    <div className="bg-white rounded-lg shadow-sm p-12 text-center">
                        <Book className="h-16 w-16 text-gray-400 mx-auto mb-4" />
                        <h3 className="text-lg font-medium text-gray-900 mb-2">No handbooks found</h3>
                        <p className="text-gray-600 mb-4">
                            Get started by creating your first handbook
                        </p>
                        <button
                            onClick={handleCreateNew}
                            className="bg-blue-600 text-white px-6 py-2 rounded-lg hover:bg-blue-700 inline-flex items-center gap-2"
                        >
                            <Plus className="h-5 w-5" />
                            Create Handbook
                        </button>
                    </div>
                ) : (
                    <div className="grid grid-cols-1 gap-4">
                        {handbooks.map((handbook) => (
                            <div
                                key={handbook._id}
                                className="bg-white rounded-lg shadow-sm hover:shadow-md transition-shadow p-6"
                            >
                                <div className="flex items-start justify-between">
                                    <div className="flex-1">
                                        <div className="flex items-center gap-3 mb-2">
                                            <h3 className="text-xl font-semibold text-gray-900">
                                                {handbook.title}
                                            </h3>
                                            {getStatusBadge(handbook.status)}
                                            {getRAGSyncBadge(handbook.ragSyncStatus)}
                                        </div>

                                        {handbook.subtitle && (
                                            <p className="text-gray-600 mb-3">{handbook.subtitle}</p>
                                        )}

                                        <div className="flex items-center gap-6 text-sm text-gray-500">
                                            <span className="capitalize">
                                                <strong>Department:</strong> {handbook.department}
                                            </span>
                                            <span>
                                                <strong>Sections:</strong> {handbook.sections?.length || 0}
                                            </span>
                                            <span>
                                                <strong>Version:</strong> {handbook.currentVersion}
                                            </span>
                                            {handbook.publishedAt && (
                                                <span>
                                                    <strong>Published:</strong> {new Date(handbook.publishedAt).toLocaleDateString()}
                                                </span>
                                            )}
                                        </div>
                                    </div>

                                    <div className="flex items-center gap-2 ml-4">
                                        <button
                                            onClick={() => handleView(handbook._id)}
                                            className="p-2 text-gray-600 hover:bg-gray-100 rounded-lg transition-colors"
                                            title="View"
                                        >
                                            <Eye className="h-5 w-5" />
                                        </button>
                                        <button
                                            onClick={() => handleEdit(handbook._id)}
                                            className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                                            title="Edit"
                                        >
                                            <Edit className="h-5 w-5" />
                                        </button>
                                        <button
                                            onClick={() => handleVersionHistory(handbook._id)}
                                            className="p-2 text-purple-600 hover:bg-purple-50 rounded-lg transition-colors"
                                            title="Version History"
                                        >
                                            <History className="h-5 w-5" />
                                        </button>
                                        {handbook.status === 'published' && (
                                            <button
                                                onClick={() => handleSyncToRAG(handbook._id)}
                                                className="p-2 text-green-600 hover:bg-green-50 rounded-lg transition-colors"
                                                title="Sync to RAG"
                                            >
                                                <RefreshCw className="h-5 w-5" />
                                            </button>
                                        )}
                                        {handbook.status !== 'archived' && (
                                            <button
                                                onClick={() => handleArchive(handbook._id)}
                                                className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                                                title="Archive"
                                            >
                                                <Archive className="h-5 w-5" />
                                            </button>
                                        )}
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </div>
        </DashboardLayout>
    );
};

export default HandbookManagement;
