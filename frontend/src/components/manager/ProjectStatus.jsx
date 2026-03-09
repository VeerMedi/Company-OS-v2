import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
    Target,
    Users,
    Calendar,
    TrendingUp,
    TrendingDown,
    AlertTriangle,
    CheckCircle,
    Clock,
    BarChart3,
    Activity,
    ChevronDown,
    ChevronUp,
    Plus,
    Trash2,
    Sparkles,
    Package
} from 'lucide-react';
import api from '../../utils/api';
import { showToast as toast } from '../../utils/toast';
import { formatDate } from '../../utils/helpers';

const ProjectStatus = ({ onViewBunches }) => {
    const navigate = useNavigate();
    const [projects, setProjects] = useState([]);
    const [loading, setLoading] = useState(true);
    const [expandedProject, setExpandedProject] = useState(null);
    const [deleteConfirm, setDeleteConfirm] = useState(null);

    useEffect(() => {
        fetchProjects();
    }, []);

    const fetchProjects = async () => {
        try {
            setLoading(true);
            const response = await api.get('/projects');

            if (response.data.success) {
                setProjects(response.data.data);
            }
        } catch (error) {
            console.error('Error fetching projects:', error);
            toast.error('Failed to load projects');
        } finally {
            setLoading(false);
        }
    };

    const handleDeleteProject = async (projectId) => {
        try {
            const response = await api.delete(`/projects/${projectId}`);
            if (response.data.success) {
                toast.success('Project deleted successfully');
                setProjects(projects.filter(p => p._id !== projectId));
                setDeleteConfirm(null);
            }
        } catch (error) {
            console.error('Error deleting project:', error);
            toast.error(error.response?.data?.message || 'Failed to delete project');
        }
    };

    const getStatusColor = (status) => {
        const colors = {
            'not-started': 'bg-gray-100 text-gray-800',
            'in-progress': 'bg-blue-100 text-blue-800',
            'completed': 'bg-green-100 text-green-800',
            'on-hold': 'bg-yellow-100 text-yellow-800',
            'cancelled': 'bg-red-100 text-red-800'
        };
        return colors[status] || colors['not-started'];
    };

    const getHealthScore = (project) => {
        // Calculate health score based on progress, deadline proximity, and status
        let score = 100;

        const deadline = new Date(project.deadline);
        const today = new Date();
        const daysRemaining = Math.ceil((deadline - today) / (1000 * 60 * 60 * 24));

        // Reduce score if behind schedule
        if (project.progress < 50 && daysRemaining < 30) score -= 20;
        if (project.progress < 25 && daysRemaining < 15) score -= 30;

        // Reduce score if overdue
        if (daysRemaining < 0) score -= 40;

        // Status penalties
        if (project.status === 'on-hold') score -= 25;
        if (project.status === 'cancelled') score = 0;

        return Math.max(0, Math.min(100, score));
    };

    const getHealthColor = (score) => {
        if (score >= 80) return 'text-green-600';
        if (score >= 60) return 'text-yellow-600';
        if (score >= 40) return 'text-orange-600';
        return 'text-red-600';
    };

    const getHealthLabel = (score) => {
        if (score >= 80) return 'Excellent';
        if (score >= 60) return 'Good';
        if (score >= 40) return 'At Risk';
        return 'Critical';
    };

    const toggleExpanded = (projectId) => {
        setExpandedProject(expandedProject === projectId ? null : projectId);
    };

    return (
        <div className="space-y-6">
            {/* Header */}
            <div>
                <h1 className="text-3xl font-bold text-foreground">Project Status & Insights</h1>
                <p className="text-muted-foreground mt-1">Monitor project health, progress, and performance metrics</p>
            </div>

            {loading ? (
                <div className="flex items-center justify-center py-12">
                    <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
                </div>
            ) : projects.length === 0 ? (
                <div className="dashboard-card p-12 text-center">
                    <Target className="h-16 w-16 text-muted-foreground mx-auto mb-4" />
                    <h3 className="text-lg font-medium text-foreground mb-2">No projects found</h3>
                    <p className="text-muted-foreground">Projects will appear here once assigned</p>
                </div>
            ) : (
                <div className="space-y-4">
                    {projects.map((project) => {
                        const healthScore = getHealthScore(project);
                        const isExpanded = expandedProject === project._id;

                        return (
                            <div
                                key={project._id}
                                className="dashboard-card overflow-hidden"
                            >
                                {/* Project Header */}
                                <div
                                    className="p-6 cursor-pointer hover:bg-muted/50 transition-colors"
                                    onClick={() => toggleExpanded(project._id)}
                                >
                                    <div className="flex items-start justify-between">
                                        <div className="flex-1">
                                            <div className="flex items-center gap-3 mb-2 flex-wrap">
                                                <h3 className="text-lg font-semibold text-foreground">{project.name}</h3>
                                                <span className={`px-3 py-1 rounded-full text-xs font-medium ${getStatusColor(project.status)}`}>
                                                    {project.status.replace('-', ' ').toUpperCase()}
                                                </span>
                                                {project.isAutomated && (
                                                    <span className="px-3 py-1 rounded-full text-xs font-medium bg-primary/10 text-primary flex items-center gap-1">
                                                        <Sparkles className="h-3 w-3" />
                                                        AI Generated
                                                    </span>
                                                )}
                                            </div>
                                            <p className="text-sm text-muted-foreground mb-4">{project.description}</p>

                                            {/* Project Metrics Row */}
                                            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                                                <div className="flex items-center gap-2">
                                                    <div className="h-10 w-10 bg-primary/10 rounded-lg flex items-center justify-center">
                                                        <Activity className="h-5 w-5 text-primary" />
                                                    </div>
                                                    <div>
                                                        <p className="text-xs text-muted-foreground">Progress</p>
                                                        <p className="text-sm font-semibold text-foreground">{project.progress}%</p>
                                                    </div>
                                                </div>

                                                <div className="flex items-center gap-2">
                                                    <div className={`h-10 w-10 rounded-lg flex items-center justify-center ${healthScore >= 60 ? 'bg-green-500/10' : 'bg-orange-500/10'
                                                        }`}>
                                                        <BarChart3 className={`h-5 w-5 ${healthScore >= 60 ? 'text-green-500' : 'text-orange-500'
                                                            }`} />
                                                    </div>
                                                    <div>
                                                        <p className="text-xs text-muted-foreground">Health</p>
                                                        <p className={`text-sm font-semibold ${getHealthColor(healthScore)}`}>
                                                            {getHealthLabel(healthScore)}
                                                        </p>
                                                    </div>
                                                </div>

                                                <div className="flex items-center gap-2">
                                                    <div className="h-10 w-10 bg-purple-500/10 rounded-lg flex items-center justify-center">
                                                        <Calendar className="h-5 w-5 text-purple-500" />
                                                    </div>
                                                    <div>
                                                        <p className="text-xs text-muted-foreground">Deadline</p>
                                                        <p className="text-sm font-semibold text-foreground">
                                                            {formatDate(project.deadline)}
                                                        </p>
                                                    </div>
                                                </div>

                                                <div className="flex items-center gap-2">
                                                    <div className="h-10 w-10 bg-orange-500/10 rounded-lg flex items-center justify-center">
                                                        <Users className="h-5 w-5 text-orange-500" />
                                                    </div>
                                                    <div>
                                                        <p className="text-xs text-muted-foreground">Team</p>
                                                        <p className="text-sm font-semibold text-foreground">
                                                            {project.team?.length || 0} members
                                                        </p>
                                                    </div>
                                                </div>
                                            </div>
                                        </div>

                                        <button className="ml-4 p-2 hover:bg-muted rounded-lg transition-colors">
                                            {isExpanded ? (
                                                <ChevronUp className="h-5 w-5 text-muted-foreground" />
                                            ) : (
                                                <ChevronDown className="h-5 w-5 text-muted-foreground" />
                                            )}
                                        </button>
                                    </div>

                                    {/* Progress Bar */}
                                    <div className="mt-4">
                                        <div className="flex items-center justify-between text-xs text-muted-foreground mb-1">
                                            <span>Overall Progress</span>
                                            <span>{project.progress}%</span>
                                        </div>
                                        <div className="w-full bg-muted rounded-full h-2">
                                            <div
                                                className={`h-2 rounded-full transition-all ${project.progress >= 75 ? 'bg-green-500' :
                                                    project.progress >= 50 ? 'bg-primary' :
                                                        project.progress >= 25 ? 'bg-yellow-500' : 'bg-red-500'
                                                    }`}
                                                style={{ width: `${project.progress}%` }}
                                            />
                                        </div>
                                    </div>
                                </div>

                                {/* Expanded Details */}
                                {isExpanded && (
                                    <div className="px-6 pb-6 pt-0 border-t border-border bg-muted/30">
                                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-6">
                                            {/* Project Details */}
                                            <div>
                                                <h4 className="text-sm font-semibold text-foreground mb-3">Project Details</h4>
                                                <div className="space-y-2">
                                                    <div className="flex justify-between text-sm">
                                                        <span className="text-muted-foreground">Created By:</span>
                                                        <span className="text-foreground font-medium">
                                                            {project.createdBy?.firstName} {project.createdBy?.lastName}
                                                        </span>
                                                    </div>
                                                    <div className="flex justify-between text-sm">
                                                        <span className="text-muted-foreground">Created On:</span>
                                                        <span className="text-foreground font-medium">
                                                            {formatDate(project.createdAt)}
                                                        </span>
                                                    </div>
                                                    <div className="flex justify-between text-sm">
                                                        <span className="text-muted-foreground">Last Updated:</span>
                                                        <span className="text-foreground font-medium">
                                                            {formatDate(project.updatedAt)}
                                                        </span>
                                                    </div>
                                                </div>
                                            </div>

                                            {/* Quick Stats */}
                                            <div>
                                                <h4 className="text-sm font-semibold text-foreground mb-3">Quick Stats</h4>
                                                <div className="grid grid-cols-2 gap-3">
                                                    <div className="bg-card p-3 rounded-lg border border-border">
                                                        <p className="text-xs text-muted-foreground mb-1">Health Score</p>
                                                        <p className={`text-2xl font-bold ${getHealthColor(healthScore)}`}>
                                                            {healthScore}
                                                        </p>
                                                    </div>
                                                    <div className="bg-card p-3 rounded-lg border border-border">
                                                        <p className="text-xs text-muted-foreground mb-1">Completion</p>
                                                        <p className="text-2xl font-bold text-primary">{project.progress}%</p>
                                                    </div>
                                                </div>
                                            </div>
                                        </div>

                                        {/* Action Buttons */}
                                        <div className="flex gap-3 mt-6 pt-6 border-t border-border">
                                            <button
                                                onClick={(e) => {
                                                    e.stopPropagation();
                                                    if (onViewBunches) {
                                                        onViewBunches(project._id);
                                                    } else {
                                                        navigate(`/project/${project._id}`);
                                                    }
                                                }}
                                                className="px-4 py-2 bg-primary text-white rounded-lg hover:bg-primary/90 transition-colors text-sm font-medium"
                                            >
                                                View Details
                                            </button>
                                            {project.isAutomated && onViewBunches && (
                                                <button
                                                    onClick={(e) => {
                                                        e.stopPropagation();
                                                        onViewBunches(project._id);
                                                    }}
                                                    className="px-4 py-2 bg-purple-500/10 text-purple-600 rounded-lg hover:bg-purple-500/20 transition-colors text-sm font-medium flex items-center gap-2"
                                                >
                                                    <Package className="h-4 w-4" />
                                                    View Bunches
                                                </button>
                                            )}
                                            <button
                                                onClick={(e) => {
                                                    e.stopPropagation();
                                                    // Add task creation logic
                                                }}
                                                className="px-4 py-2 bg-muted text-foreground rounded-lg hover:bg-muted/80 transition-colors text-sm font-medium flex items-center gap-2"
                                            >
                                                <Plus className="h-4 w-4" />
                                                Add Task
                                            </button>
                                            <button
                                                onClick={(e) => {
                                                    e.stopPropagation();
                                                    setDeleteConfirm(project._id);
                                                }}
                                                className="px-4 py-2 bg-destructive/10 text-destructive rounded-lg hover:bg-destructive/20 transition-colors text-sm font-medium flex items-center gap-2"
                                            >
                                                <Trash2 className="h-4 w-4" />
                                                Delete
                                            </button>
                                        </div>
                                    </div>
                                )}
                            </div>
                        );
                    })}
                </div>
            )}

            {/* Delete Confirmation Modal */}
            {deleteConfirm && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm">
                    <div className="bg-card rounded-xl shadow-2xl border border-border w-full max-w-md mx-4">
                        <div className="p-6">
                            <div className="flex items-center gap-3 mb-4">
                                <div className="p-2 rounded-lg bg-destructive/10">
                                    <AlertTriangle className="w-6 h-6 text-destructive" />
                                </div>
                                <div>
                                    <h3 className="text-lg font-semibold text-foreground">Delete Project</h3>
                                    <p className="text-sm text-muted-foreground">This action cannot be undone</p>
                                </div>
                            </div>
                            <p className="text-sm text-muted-foreground mb-6">
                                Are you sure you want to delete this project? All associated tasks and data will be permanently removed.
                            </p>
                            <div className="flex gap-3">
                                <button
                                    onClick={() => setDeleteConfirm(null)}
                                    className="flex-1 px-4 py-2 text-sm font-medium text-foreground bg-muted rounded-lg hover:bg-muted/80 transition-colors"
                                >
                                    Cancel
                                </button>
                                <button
                                    onClick={() => handleDeleteProject(deleteConfirm)}
                                    className="flex-1 px-4 py-2 text-sm font-medium text-white bg-destructive rounded-lg hover:bg-destructive/90 transition-colors"
                                >
                                    Delete Project
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default ProjectStatus;
