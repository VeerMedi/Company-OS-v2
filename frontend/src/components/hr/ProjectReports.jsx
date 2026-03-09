import React, { useState, useEffect } from 'react';
import {
    FileText,
    BarChart3,
    Users,
    Calendar,
    CheckCircle,
    Clock,
    AlertCircle,
    ChevronDown,
    ChevronUp,
    Download,
    Filter,
    LayoutGrid,
    List,
    Search,
    Briefcase,
    Layers,
    Activity
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import api from '../../utils/api';
import toast from 'react-hot-toast';

const ProjectReports = () => {
    const [projects, setProjects] = useState([]);
    const [loading, setLoading] = useState(true);
    const [expandedProject, setExpandedProject] = useState(null);
    const [filterStatus, setFilterStatus] = useState('all');
    const [viewMode, setViewMode] = useState('list');
    const [searchQuery, setSearchQuery] = useState('');

    useEffect(() => {
        fetchProjects();
        const refreshInterval = setInterval(fetchProjects, 60000);
        return () => clearInterval(refreshInterval);
    }, []);

    const fetchProjects = async () => {
        try {
            const response = await api.get('/projects');
            if (response.data.success) {
                setProjects(response.data.data);
            }
        } catch (error) {
            console.error('Error fetching projects:', error);
        } finally {
            setLoading(false);
        }
    };

    const getProjectStats = () => {
        const total = projects.length;
        const active = projects.filter(p => p.status === 'In Progress' || p.status === 'Active').length;
        const completed = projects.filter(p => p.status === 'Completed').length;
        const overdue = projects.filter(p => {
            if (!p.deadline) return false;
            return new Date(p.deadline) < new Date() && p.status !== 'Completed';
        }).length;

        return { total, active, completed, overdue };
    };

    const stats = getProjectStats();

    const getStatusColor = (status) => {
        switch (status?.toLowerCase()) {
            case 'completed': return 'bg-emerald-500/10 text-emerald-500 border-emerald-500/20';
            case 'in progress':
            case 'active': return 'bg-blue-500/10 text-blue-500 border-blue-500/20';
            case 'on hold': return 'bg-amber-500/10 text-amber-500 border-amber-500/20';
            case 'not started': return 'bg-zinc-500/10 text-zinc-400 border-zinc-500/20';
            default: return 'bg-zinc-800 text-zinc-400 border-zinc-700';
        }
    };

    const filteredProjects = projects.filter(project => {
        const matchesStatus = filterStatus === 'all'
            ? true
            : filterStatus === 'overdue'
                ? (project.deadline && new Date(project.deadline) < new Date() && project.status !== 'Completed')
                : (filterStatus === 'active' ? (project.status === 'In Progress' || project.status === 'Active') : project.status.toLowerCase().replace(' ', '-') === filterStatus);

        const matchesSearch = project.name.toLowerCase().includes(searchQuery.toLowerCase());
        return matchesStatus && matchesSearch;
    });

    return (
        <div className="min-h-screen bg-[#09090b] text-white p-6 md:p-8 font-sans">
            {/* Header */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 mb-8">
                <div>
                    <h1 className="text-3xl font-bold tracking-tight text-white flex items-center gap-3">
                        <Briefcase className="text-blue-500 fill-blue-500/20" />
                        Project Reports
                    </h1>
                    <p className="text-zinc-400 mt-1 ml-9">Manage and track project lifecycles</p>
                </div>

                <div className="flex items-center gap-3">
                    <div className="relative group">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-zinc-500 group-focus-within:text-blue-400 transition-colors" size={18} />
                        <input
                            type="text"
                            placeholder="Search projects..."
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            className="bg-zinc-900 border border-zinc-800 rounded-xl pl-10 pr-4 py-2.5 text-sm w-64 focus:outline-none focus:border-blue-500/50 focus:ring-1 focus:ring-blue-500/50 transition-all placeholder:text-zinc-600"
                        />
                    </div>
                </div>
            </div>

            {loading ? (
                <div className="flex justify-center py-20">
                    <div className="w-8 h-8 border-2 border-blue-500 border-t-transparent rounded-full animate-spin" />
                </div>
            ) : (
                <div className="space-y-6">
                    {/* Stats Row */}
                    {/* Minimal Floating Stats */}
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-8 mb-10 px-2">
                        {[
                            { label: 'Total Projects', value: stats.total, color: 'text-white', dot: 'bg-white' },
                            { label: 'Active Status', value: stats.active, color: 'text-blue-400', dot: 'bg-blue-500' },
                            { label: 'Completed', value: stats.completed, color: 'text-emerald-400', dot: 'bg-emerald-500' },
                            { label: 'Critical Attention', value: stats.overdue, color: 'text-red-400', dot: 'bg-red-500' }
                        ].map((stat) => (
                            <div key={stat.label} className="flex flex-col relative pl-4 border-l border-white/10 hover:border-white/30 transition-colors">
                                <div className={`absolute left-[-1.5px] top-0 bottom-0 w-[3px] rounded-full opacity-0 scale-y-0 transition-all duration-300 group-hover:opacity-100 group-hover:scale-y-100 ${stat.dot}`} />
                                <span className="text-zinc-500 text-[10px] font-bold tracking-[0.2em] uppercase mb-1 flex items-center gap-2">
                                    <span className={`w-1.5 h-1.5 rounded-full ${stat.dot} shadow-[0_0_8px_currentColor]`} />
                                    {stat.label}
                                </span>
                                <span className={`text-5xl font-light tracking-tighter ${stat.color} drop-shadow-sm`}>
                                    {String(stat.value).padStart(2, '0')}
                                </span>
                            </div>
                        ))}
                    </div>

                    {/* Controls Bar */}
                    <div className="flex flex-col sm:flex-row items-center justify-between gap-4 bg-zinc-900/50 p-2 rounded-2xl border border-white/5">
                        <div className="flex bg-zinc-900 rounded-xl p-1 border border-zinc-800 w-full sm:w-auto overflow-x-auto">
                            {['all', 'active', 'completed', 'overdue'].map(status => (
                                <button
                                    key={status}
                                    onClick={() => setFilterStatus(status)}
                                    className={`px-6 py-2 rounded-lg text-xs font-bold uppercase tracking-wider transition-all whitespace-nowrap ${filterStatus === status
                                        ? 'bg-zinc-800 text-white shadow-lg border border-white/10'
                                        : 'text-zinc-500 hover:text-zinc-300 hover:bg-white/5'
                                        }`}
                                >
                                    {status}
                                </button>
                            ))}
                        </div>
                        <div className="flex bg-zinc-900 rounded-xl p-1 border border-zinc-800">
                            <button
                                onClick={() => setViewMode('grid')}
                                className={`p-2 rounded-lg transition-colors ${viewMode === 'grid' ? 'bg-zinc-800 text-white' : 'text-zinc-500 hover:text-zinc-300'}`}
                            >
                                <LayoutGrid size={18} />
                            </button>
                            <button
                                onClick={() => setViewMode('list')}
                                className={`p-2 rounded-lg transition-colors ${viewMode === 'list' ? 'bg-zinc-800 text-white' : 'text-zinc-500 hover:text-zinc-300'}`}
                            >
                                <List size={18} />
                            </button>
                        </div>
                    </div>

                    {/* Content Area */}
                    <AnimatePresence mode="popLayout">
                        <div className={viewMode === 'grid' ? "grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4" : "flex flex-col gap-3"}>
                            {filteredProjects.map((project, i) => (
                                <motion.div
                                    key={project._id}
                                    initial={{ opacity: 0, y: 10 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    exit={{ opacity: 0, scale: 0.95 }}
                                    transition={{ duration: 0.2, delay: i * 0.05 }}
                                    className={`
                                        group bg-zinc-900/40 border border-white/5 hover:border-white/10 transition-all cursor-pointer overflow-hidden
                                        ${viewMode === 'grid' ? 'rounded-3xl p-6 flex flex-col' : 'rounded-2xl'}
                                        ${expandedProject === project._id ? 'bg-zinc-900 border-blue-500/30 ring-1 ring-blue-500/20' : ''}
                                    `}
                                    onClick={() => setExpandedProject(expandedProject === project._id ? null : project._id)}
                                >
                                    {viewMode === 'grid' ? (
                                        // GRID VIEW CARD
                                        <>
                                            <div className="flex justify-between items-start mb-4">
                                                <div className="p-3 bg-zinc-800/50 rounded-xl border border-white/5">
                                                    <FileText size={20} className="text-blue-400" />
                                                </div>
                                                <span className={`px-3 py-1 text-[10px] uppercase font-bold tracking-wider border rounded-full ${getStatusColor(project.status)}`}>
                                                    {project.status}
                                                </span>
                                            </div>

                                            <h3 className="text-lg font-bold text-white mb-2 line-clamp-1 group-hover:text-blue-400 transition-colors">{project.name}</h3>
                                            <p className="text-zinc-500 text-sm line-clamp-2 mb-6 h-10 leading-relaxed">{project.description || 'No description available for this project.'}</p>

                                            <div className="mt-auto pt-4 border-t border-white/5 flex items-center justify-between text-xs text-zinc-400">
                                                <div className="flex items-center gap-2">
                                                    <Calendar size={14} className="text-zinc-600" />
                                                    {new Date(project.deadline).toLocaleDateString()}
                                                </div>
                                                <div className="flex items-center gap-2">
                                                    <Users size={14} className="text-zinc-600" />
                                                    {project.teamMembers?.length || 0} Members
                                                </div>
                                            </div>

                                            {/* Expanded Grid View */}
                                            <AnimatePresence>
                                                {expandedProject === project._id && (
                                                    <motion.div
                                                        initial={{ opacity: 0, height: 0 }}
                                                        animate={{ opacity: 1, height: "auto" }}
                                                        exit={{ opacity: 0, height: 0 }}
                                                        className="overflow-hidden"
                                                    >
                                                        <div className="pt-4 mt-4 border-t border-white/5 space-y-3">
                                                            <div className="grid grid-cols-2 gap-3">
                                                                <div className="bg-black/20 p-3 rounded-lg border border-white/5">
                                                                    <p className="text-[10px] uppercase font-bold text-zinc-600 mb-1">Lead</p>
                                                                    <p className="text-xs text-white truncate">{project.createdBy?.firstName} {project.createdBy?.lastName}</p>
                                                                </div>
                                                                <div className="bg-black/20 p-3 rounded-lg border border-white/5">
                                                                    <p className="text-[10px] uppercase font-bold text-zinc-600 mb-1">Status</p>
                                                                    <p className="text-xs text-white">{project.status}</p>
                                                                </div>
                                                            </div>

                                                            <div className="bg-black/20 p-3 rounded-lg border border-white/5">
                                                                <p className="text-[10px] uppercase font-bold text-zinc-600 mb-1">Progress</p>
                                                                <div className="flex items-center gap-2 text-xs text-zinc-400">
                                                                    <span>{new Date(project.createdAt).toLocaleDateString()}</span>
                                                                    <div className="flex-1 h-1 bg-zinc-700 rounded-full overflow-hidden">
                                                                        <div className="h-full bg-blue-500 w-1/2 rounded-full" />
                                                                    </div>
                                                                    <span>{new Date(project.deadline).toLocaleDateString()}</span>
                                                                </div>
                                                            </div>

                                                            <div className="bg-black/20 p-3 rounded-lg border border-white/5">
                                                                <p className="text-[10px] uppercase font-bold text-zinc-600 mb-1">Team</p>
                                                                <div className="flex -space-x-2">
                                                                    {[1, 2, 3].map(i => (
                                                                        <div key={i} className="w-6 h-6 rounded-full bg-zinc-800 border border-black flex items-center justify-center text-[10px] font-bold text-zinc-400">
                                                                            U
                                                                        </div>
                                                                    ))}
                                                                    <div className="w-6 h-6 rounded-full bg-zinc-900 border border-black flex items-center justify-center text-[10px] font-bold text-zinc-500">
                                                                        +{project.teamMembers?.length || 0}
                                                                    </div>
                                                                </div>
                                                            </div>
                                                        </div>
                                                    </motion.div>
                                                )}
                                            </AnimatePresence>
                                        </>
                                    ) : (
                                        // LIST VIEW CARD - Fixed Structure
                                        <div className="p-4">
                                            <div className="flex flex-col md:flex-row md:items-center gap-4 md:gap-6">
                                                {/* Icon & Name */}
                                                <div className="flex items-center gap-4 min-w-[30%]">
                                                    <div className="h-10 w-10 rounded-xl bg-zinc-800 flex items-center justify-center border border-white/5 shrink-0">
                                                        <FileText size={18} className="text-zinc-400" />
                                                    </div>
                                                    <div className="min-w-0">
                                                        <h3 className="font-bold text-white text-sm truncate group-hover:text-blue-400 transition-colors">{project.name}</h3>
                                                        <div className="flex items-center gap-2 mt-1 md:hidden">
                                                            <span className={`px-2 py-0.5 text-[10px] uppercase font-bold tracking-wider border rounded ${getStatusColor(project.status)}`}>
                                                                {project.status}
                                                            </span>
                                                        </div>
                                                    </div>
                                                </div>

                                                {/* Status Badge (Desktop) */}
                                                <div className="hidden md:flex items-center shrink-0">
                                                    <span className={`px-3 py-1 text-[10px] uppercase font-bold tracking-wider border rounded-lg ${getStatusColor(project.status)}`}>
                                                        {project.status}
                                                    </span>
                                                </div>

                                                {/* Meta Info */}
                                                <div className="flex flex-wrap items-center gap-x-8 gap-y-2 ml-auto text-xs text-zinc-400">
                                                    <div className="flex items-center gap-2 min-w-[100px]">
                                                        <Calendar size={14} className="text-zinc-600" />
                                                        <span>{new Date(project.deadline).toLocaleDateString()}</span>
                                                    </div>
                                                    <div className="flex items-center gap-2 min-w-[80px]">
                                                        <Users size={14} className="text-zinc-600" />
                                                        <span>{project.teamMembers?.length || 0} Team</span>
                                                    </div>
                                                    <div className="hidden lg:flex items-center gap-2">
                                                        <Briefcase size={14} className="text-zinc-600" />
                                                        <span className="truncate max-w-[100px]">{project.createdBy?.firstName || 'Admin'}</span>
                                                    </div>

                                                    <div className={`transition-transform duration-300 ${expandedProject === project._id ? 'rotate-180' : ''}`}>
                                                        <ChevronDown size={16} className="text-zinc-600 group-hover:text-white" />
                                                    </div>
                                                </div>
                                            </div>

                                            {/* Expanded View */}
                                            <AnimatePresence>
                                                {expandedProject === project._id && (
                                                    <motion.div
                                                        initial={{ height: 0, opacity: 0, marginTop: 0 }}
                                                        animate={{ height: "auto", opacity: 1, marginTop: 16 }}
                                                        exit={{ height: 0, opacity: 0, marginTop: 0 }}
                                                        className="overflow-hidden border-t border-white/5"
                                                    >
                                                        <div className="pt-4 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                                                            <div className="bg-black/20 rounded-xl p-4 border border-white/5">
                                                                <p className="text-[10px] uppercase font-bold text-zinc-600 mb-1">Project Lead</p>
                                                                <div className="flex items-center gap-2">
                                                                    <div className="w-6 h-6 rounded-full bg-blue-500/20 text-blue-500 flex items-center justify-center text-xs font-bold">
                                                                        {project.createdBy?.firstName?.[0] || 'A'}
                                                                    </div>
                                                                    <span className="text-sm font-medium text-zinc-300">
                                                                        {project.createdBy?.firstName} {project.createdBy?.lastName}
                                                                    </span>
                                                                </div>
                                                            </div>

                                                            <div className="bg-black/20 rounded-xl p-4 border border-white/5">
                                                                <p className="text-[10px] uppercase font-bold text-zinc-600 mb-1">Timeline</p>
                                                                <div className="flex items-center justify-between text-xs text-zinc-400">
                                                                    <span>Start: {new Date(project.createdAt).toLocaleDateString()}</span>
                                                                    <span>End: {new Date(project.deadline).toLocaleDateString()}</span>
                                                                </div>
                                                                <div className="w-full bg-zinc-800 h-1 mt-2 rounded-full overflow-hidden">
                                                                    <div className="bg-blue-500 h-full w-1/3 rounded-full" />
                                                                </div>
                                                            </div>

                                                            <div className="bg-black/20 rounded-xl p-4 border border-white/5">
                                                                <p className="text-[10px] uppercase font-bold text-zinc-600 mb-1">Progress</p>
                                                                <div className="flex items-center gap-2">
                                                                    <CheckCircle size={14} className="text-emerald-500" />
                                                                    <span className="text-sm font-medium text-white">{project.tasks?.length || 0} Active Tasks</span>
                                                                </div>
                                                            </div>

                                                            <div className="bg-black/20 rounded-xl p-4 border border-white/5">
                                                                <p className="text-[10px] uppercase font-bold text-zinc-600 mb-1">Description</p>
                                                                <p className="text-xs text-zinc-400 line-clamp-2 leading-relaxed">
                                                                    {project.description || 'No detailed description available.'}
                                                                </p>
                                                            </div>
                                                        </div>
                                                    </motion.div>
                                                )}
                                            </AnimatePresence>
                                        </div>
                                    )}
                                </motion.div>
                            ))}
                        </div>
                    </AnimatePresence>

                    {filteredProjects.length === 0 && (
                        <div className="flex flex-col items-center justify-center py-20 bg-zinc-900/20 border border-dashed border-zinc-800 rounded-3xl">
                            <Briefcase size={40} className="text-zinc-700 mb-4" />
                            <p className="text-zinc-500 font-medium">No projects found</p>
                            <p className="text-zinc-600 text-sm mt-1">Try adjusting filters or search query</p>
                        </div>
                    )}
                </div>
            )}
        </div>
    );
};

export default ProjectReports;
