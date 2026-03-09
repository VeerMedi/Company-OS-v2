import React, { useState, useEffect } from 'react';
import { motion, LayoutGroup } from 'framer-motion';
import {
    Briefcase, Search, Calendar, X, Save, Activity, Zap, CheckCircle2
} from 'lucide-react';
import api from '../utils/api';

const ClientsProjectsDashboard = () => {
    const [projects, setProjects] = useState([]);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');

    const [isEditModalOpen, setIsEditModalOpen] = useState(false);
    const [editingProject, setEditingProject] = useState(null);
    const [formData, setFormData] = useState({
        name: '',
        status: 'Active',
        deadline: '',
        progress: 0
    });

    useEffect(() => {
        fetchProjects();
    }, []);

    const fetchProjects = async () => {
        try {
            setLoading(true);
            const response = await api.get('/projects');
            const projectData = response.data.data || [];
            if (projectData.length > 0) {
                setProjects(projectData);
            } else {
                setProjects(mockProjects);
            }
        } catch (err) {
            console.error('Error fetching projects:', err);
            setProjects(mockProjects);
        } finally {
            setLoading(false);
        }
    };

    const mockProjects = [
        { _id: '1', name: 'Krishi Bhumi', status: 'Ready-for-assignment', deadline: '2026-01-31', progress: 15, description: 'GIS mapped for Airen Group...', managerName: 'Manager' },
        { _id: '2', name: 'Skill-Based Testing Project', status: 'In-Progress', deadline: '2026-01-29', progress: 5, description: 'Project for testing skill-base...', managerName: 'Manager' },
        { _id: '3', name: 'Residential Modular Kitchen - Villa Heights', status: 'Not-Started', deadline: '2026-02-28', progress: 35, description: 'Premium modular kitchen with i...', managerName: 'Manager' },
        { _id: '4', name: 'Corporate Conference Room Setup', status: 'Completed', deadline: '2025-12-20', progress: 100, description: 'Executive conference room with...', managerName: 'Chief' },
        { _id: '5', name: 'Office Furniture Package - TechCorp', status: 'In-Progress', deadline: '2026-03-15', progress: 0, description: 'Complete office furniture setu...', managerName: 'Manager' }
    ];

    const handleEditClick = (project) => {
        setEditingProject(project);
        setFormData({
            name: project.name || '',
            status: project.status || 'Active',
            deadline: project.deadline ? new Date(project.deadline).toISOString().split('T')[0] : '',
            progress: project.progress || 0,
            description: project.description || '',
            managerName: project.managerName || project.manager?.firstName || ''
        });
        setIsEditModalOpen(true);
    };

    const handleInputChange = (e) => {
        const { name, value } = e.target;
        setFormData(prev => ({ ...prev, [name]: value }));
    };

    const handleSave = async () => {
        try {
            const response = await api.put(`/projects/${editingProject._id || editingProject.id}`, formData);
            if (response.data.success) {
                setProjects(prev => prev.map(p => (p._id === editingProject._id || p.id === editingProject.id) ? response.data.data : p));
                setIsEditModalOpen(false);
            }
        } catch (err) {
            console.error('Error updating project:', err);
            setProjects(prev => prev.map(p => (p._id === editingProject._id || p.id === editingProject.id) ? { ...p, ...formData } : p));
            setIsEditModalOpen(false);
        }
    };

    const filteredProjects = projects.filter(p =>
        p.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        (p.managerName || '').toLowerCase().includes(searchTerm.toLowerCase())
    );

    const getStatusColor = (status) => {
        switch (status?.toLowerCase()) {
            case 'completed': case 'approved': return 'bg-emerald-500/10 text-emerald-500 border-emerald-500/20';
            case 'in-progress': case 'active': return 'bg-blue-500/10 text-blue-500 border-blue-500/20';
            case 'pending': return 'bg-orange-500/10 text-orange-400 border-orange-500/20';
            case 'ready-for-assignment': return 'bg-zinc-500/10 text-zinc-400 border-zinc-500/20';
            case 'not-started': return 'bg-slate-500/10 text-slate-400 border-slate-500/20';
            case 'on-hold': return 'bg-zinc-500/20 text-zinc-400 border-zinc-500/30';
            case 'cancelled': case 'rejected': return 'bg-red-500/10 text-red-500 border-red-500/20';
            default: return 'bg-zinc-500/10 text-zinc-400 border-zinc-500/20';
        }
    };

    // Prevent body scroll when modal is open
    useEffect(() => {
        if (isEditModalOpen) {
            document.body.style.overflow = 'hidden';
        } else {
            document.body.style.overflow = 'unset';
        }
        return () => {
            document.body.style.overflow = 'unset';
        };
    }, [isEditModalOpen]);

    if (loading) return <div className="p-10 text-white flex items-center justify-center h-64"><Activity className="animate-spin mr-2" /> Loading Project Ledger...</div>;

    const formatCurrency = (value) => `₹${(value || 0).toLocaleString('en-IN')}`;

    return (
        <div className="w-full font-sans space-y-8 animate-in fade-in duration-700">
            {/* Page Header */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 ml-1">
                <div className="flex items-center gap-3">
                    <div className="w-12 h-12 rounded-2xl bg-white/5 border border-white/10 flex items-center justify-center text-white shadow-xl">
                        <Briefcase size={24} />
                    </div>
                    <div>
                        <h1 className="text-3xl font-bold text-white tracking-tight">Project Ledger</h1>
                        <p className="text-zinc-500 text-sm font-medium">Detailed tracking of all active deliverables and ownership</p>
                    </div>
                </div>

                <div className="flex items-center gap-3">
                    <div className="relative group overflow-hidden bg-white/5 border border-white/10 rounded-2xl p-4 min-w-[160px]">
                        <div className="relative z-10">
                            <div className="text-zinc-500 text-[9px] uppercase font-black tracking-widest mb-1">Total Active</div>
                            <div className="text-white text-2xl font-bold">{projects.length} Projects</div>
                        </div>
                        <Zap size={40} className="absolute -bottom-2 -right-2 text-white/5 transform rotate-12" />
                    </div>
                    <div className="relative group overflow-hidden bg-white/5 border border-white/10 rounded-2xl p-4 min-w-[160px]">
                        <div className="relative z-10">
                            <div className="text-zinc-500 text-[9px] uppercase font-black tracking-widest mb-1">Avg Progress</div>
                            <div className="text-white text-2xl font-bold">
                                {Math.round(projects.reduce((sum, p) => sum + (p.progress || 0), 0) / (projects.length || 1))}%
                            </div>
                        </div>
                        <Activity size={40} className="absolute -bottom-2 -right-2 text-white/5 transform -rotate-12" />
                    </div>
                </div>
            </div>

            {/* Main Content Area */}
            <div className="bg-[#18181b] border border-white/5 rounded-[32px] overflow-hidden shadow-2xl relative">
                <div className="absolute inset-0 bg-gradient-to-tr from-white/0 to-white/[0.02] pointer-events-none" />

                {/* Search & Toolbar */}
                <div className="p-8 border-b border-white/5 flex flex-col md:flex-row justify-between items-center gap-6">
                    <div className="relative flex-1 max-w-md w-full group">
                        <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-zinc-500 w-4 h-4 group-focus-within:text-white transition-colors" />
                        <input
                            type="text"
                            placeholder="Search by project name or manager..."
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            className="w-full bg-white/5 border border-white/10 rounded-2xl py-3 pl-12 pr-6 text-sm text-white placeholder:text-zinc-600 focus:border-white/20 focus:bg-white/10 outline-none transition-all shadow-inner"
                        />
                    </div>
                    <div className="flex items-center gap-4">
                        <span className="text-zinc-500 text-[10px] uppercase font-bold tracking-widest bg-white/5 px-3 py-1.5 rounded-full border border-white/5">
                            Last Sync: Just Now
                        </span>
                    </div>
                </div>

                {/* Table Component */}
                <div className="overflow-x-auto min-h-[500px] custom-scrollbar">
                    <table className="w-full text-left border-collapse">
                        <thead>
                            <tr className="border-b border-white/5 bg-[#0d0d0f]/50">
                                <th className="py-5 px-8 text-[10px] font-black text-zinc-500 uppercase tracking-[0.2em]">Project & Ownership</th>
                                <th className="py-5 px-4 text-[10px] font-black text-zinc-500 uppercase tracking-[0.2em]">Deadline</th>
                                <th className="py-5 px-4 text-[10px] font-black text-[10px] font-black text-zinc-500 uppercase tracking-[0.2em]">Progress</th>
                                <th className="py-5 px-4 text-[10px] font-black text-zinc-500 uppercase tracking-[0.2em] text-center">Status</th>
                                <th className="py-5 px-8 text-[10px] font-black text-zinc-500 uppercase tracking-[0.2em] text-right">Actions</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-white/[0.03]">
                            {filteredProjects.map((project) => (
                                <tr key={project._id || project.id} className="group hover:bg-white/[0.03] transition-all duration-300">
                                    <td className="py-6 px-8">
                                        <div className="flex items-center gap-4">
                                            <div className="w-10 h-10 rounded-xl bg-white/10 flex items-center justify-center text-white font-bold text-sm shadow-lg group-hover:scale-110 transition-transform">
                                                {project.name.charAt(0)}
                                            </div>
                                            <div>
                                                <div className="text-white font-bold text-base tracking-tight mb-0.5">{project.name}</div>
                                                <div className="text-zinc-600 text-[10px] font-medium mb-1 line-clamp-1">{project.description}</div>
                                                <div className="text-zinc-500 text-[10px] uppercase font-black tracking-widest flex items-center gap-1.5">
                                                    <Zap size={10} fill="currentColor" className="text-zinc-600" />
                                                    {project.managerName || 'Unassigned Leader'}
                                                </div>
                                            </div>
                                        </div>
                                    </td>
                                    <td className="py-6 px-4">
                                        <div className="flex items-center gap-2 text-zinc-400 text-xs font-semibold">
                                            <Calendar size={14} className="text-zinc-600" />
                                            {project.deadline ? new Date(project.deadline).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' }) : 'No Goal Set'}
                                        </div>
                                    </td>
                                    <td className="py-6 px-4">
                                        <div className="flex items-center gap-4">
                                            <div className="flex-1 min-w-[120px] h-1.5 bg-white/5 rounded-full overflow-hidden">
                                                <motion.div
                                                    initial={{ width: 0 }}
                                                    animate={{ width: `${project.progress || 0}%` }}
                                                    transition={{ duration: 1, ease: "easeOut" }}
                                                    className="h-full bg-gradient-to-r from-zinc-300 to-white shadow-[0_0_12px_rgba(255,255,255,0.3)]"
                                                />
                                            </div>
                                            <span className="text-white text-xs font-black min-w-[40px] text-right">{project.progress || 0}%</span>
                                        </div>
                                    </td>
                                    <td className="py-6 px-4 text-center">
                                        <span className={`px-3 py-1 rounded-lg text-[9px] uppercase font-black tracking-widest border ${getStatusColor(project.status)} shadow-sm`}>
                                            {project.status || 'Active'}
                                        </span>
                                    </td>
                                    <td className="py-6 px-8 text-right">
                                        <button
                                            onClick={() => handleEditClick(project)}
                                            className="px-5 py-2 bg-white/5 text-white/50 hover:text-white hover:bg-white/10 rounded-xl transition-all text-[10px] font-black uppercase tracking-widest border border-white/5 hover:border-white/20 active:scale-95 flex items-center justify-center gap-2 ml-auto"
                                        >
                                            Modify
                                        </button>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </div>

            {/* Refined Edit Modal */}
            {isEditModalOpen && (
                <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 overflow-y-auto">
                    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="fixed inset-0 bg-black/95 backdrop-blur-xl" onClick={() => setIsEditModalOpen(false)} />
                    <motion.div
                        initial={{ scale: 0.95, opacity: 0, y: 30 }}
                        animate={{ scale: 1, opacity: 1, y: 0 }}
                        className="relative bg-[#09090b] border border-white/10 rounded-[40px] w-full max-w-lg p-10 shadow-[0_0_50px_rgba(255,255,255,0.05)] overflow-y-auto custom-scrollbar max-h-[90vh]"
                    >
                        <div className="absolute top-0 right-0 w-32 h-32 bg-white/5 blur-[100px] -mr-16 -mt-16" />

                        <div className="flex justify-between items-center mb-10">
                            <div className="flex items-center gap-4">
                                <div className="w-12 h-12 rounded-2xl bg-white/10 flex items-center justify-center text-white">
                                    <Zap size={24} fill="currentColor" />
                                </div>
                                <div>
                                    <h3 className="text-2xl font-bold text-white tracking-tight">Project Config</h3>
                                    <p className="text-zinc-500 text-[9px] uppercase font-black tracking-widest">Update delivery parameters</p>
                                </div>
                            </div>
                            <button onClick={() => setIsEditModalOpen(false)} className="w-10 h-10 rounded-full bg-white/5 flex items-center justify-center text-zinc-500 hover:text-white transition-all">
                                <X size={20} />
                            </button>
                        </div>

                        <div className="space-y-8">
                            <div className="group">
                                <label className="block text-[10px] font-black text-zinc-600 uppercase tracking-[0.2em] mb-3 ml-1 group-focus-within:text-white transition-colors">Identifier</label>
                                <input name="name" value={formData.name} onChange={handleInputChange} className="w-full bg-white/5 border border-white/5 rounded-2xl py-4 px-6 text-sm text-white focus:border-white/20 focus:bg-white/10 outline-none transition-all placeholder:text-zinc-800 font-medium" placeholder="Target Project Name" />
                            </div>

                            <div className="group">
                                <label className="block text-[10px] font-black text-zinc-600 uppercase tracking-[0.2em] mb-3 ml-1 group-focus-within:text-white transition-colors">Description</label>
                                <textarea name="description" rows="3" value={formData.description} onChange={handleInputChange} className="w-full bg-white/5 border border-white/5 rounded-2xl py-4 px-6 text-sm text-white focus:border-white/20 focus:bg-white/10 outline-none transition-all placeholder:text-zinc-800 font-medium resize-none" placeholder="Project details and scope..." />
                            </div>

                            <div className="group">
                                <label className="block text-[10px] font-black text-zinc-600 uppercase tracking-[0.2em] mb-3 ml-1 group-focus-within:text-white transition-colors">Project Manager</label>
                                <input name="managerName" value={formData.managerName} onChange={handleInputChange} className="w-full bg-white/5 border border-white/5 rounded-2xl py-4 px-6 text-sm text-white focus:border-white/20 focus:bg-white/10 outline-none transition-all placeholder:text-zinc-800 font-medium" placeholder="Assigned Lead" />
                            </div>

                            <div className="grid grid-cols-2 gap-6">
                                <div>
                                    <label className="block text-[10px] font-black text-zinc-600 uppercase tracking-[0.2em] mb-3 ml-1">Deadline Goal</label>
                                    <input type="date" name="deadline" value={formData.deadline} onChange={handleInputChange} className="w-full bg-white/5 border border-white/5 rounded-2xl py-4 px-6 text-sm text-white focus:border-white/20 focus:bg-white/10 outline-none transition-all" />
                                </div>
                                <div className="relative group">
                                    <label className="block text-[10px] font-black text-zinc-600 uppercase tracking-[0.2em] mb-3 ml-1">Current Lifecycle</label>
                                    <div className="relative">
                                        <select
                                            name="status"
                                            value={formData.status}
                                            onChange={handleInputChange}
                                            className="w-full bg-white/5 border border-white/5 rounded-2xl py-4 px-6 text-sm text-white focus:border-white/20 focus:bg-white/10 outline-none transition-all cursor-pointer appearance-none pr-12"
                                        >
                                            <option value="Active" className="bg-[#18181b] text-white">Active</option>
                                            <option value="In-Progress" className="bg-[#18181b] text-white">In Progress</option>
                                            <option value="Ready-for-assignment" className="bg-[#18181b] text-white">Ready for assignment</option>
                                            <option value="Not-Started" className="bg-[#18181b] text-white">Not Started</option>
                                            <option value="Completed" className="bg-[#18181b] text-white">Completed</option>
                                            <option value="On-Hold" className="bg-[#18181b] text-white">On Hold</option>
                                            <option value="Cancelled" className="bg-[#18181b] text-white">Cancelled</option>
                                        </select>
                                        <div className="absolute right-6 top-1/2 -translate-y-1/2 pointer-events-none text-zinc-500">
                                            <Zap size={14} className="opacity-50" />
                                        </div>
                                    </div>
                                </div>
                            </div>

                            <div>
                                <div className="flex justify-between items-center mb-3 ml-1">
                                    <label className="text-[10px] font-black text-zinc-600 uppercase tracking-[0.2em]">Current Progress</label>
                                    <span className="text-white text-xs font-black bg-white/10 px-2 py-0.5 rounded-md">{formData.progress}%</span>
                                </div>
                                <input type="range" name="progress" min="0" max="100" value={formData.progress} onChange={handleInputChange} className="w-full h-2 bg-white/5 rounded-full appearance-none cursor-pointer accent-white" />
                            </div>
                        </div>

                        <div className="mt-12 flex gap-4">
                            <button onClick={() => setIsEditModalOpen(false)} className="flex-1 py-4 px-6 rounded-2xl text-zinc-600 text-xs font-black uppercase tracking-widest hover:text-white hover:bg-white/5 transition-all">Discard Changes</button>
                            <button onClick={handleSave} className="flex-1 py-4 px-6 bg-white text-black rounded-2xl text-xs font-black uppercase tracking-widest shadow-[0_0_30px_rgba(255,255,255,0.2)] hover:bg-zinc-200 transition-all flex items-center justify-center gap-2">
                                <CheckCircle2 size={18} /> Update Ledger
                            </button>
                        </div>
                    </motion.div>
                </div>
            )}
        </div>
    );
};

export default ClientsProjectsDashboard;
