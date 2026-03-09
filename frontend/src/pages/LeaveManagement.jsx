import React, { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
    Calendar,
    Clock,
    CheckCircle,
    XCircle,
    AlertCircle,
    Download,
    Search,
    Plus,
    Filter,
    ArrowUpRight,
    MoreVertical,
    Zap
} from 'lucide-react';
import api from '../utils/api';
import { showToast } from '../utils/toast';

const LeaveManagement = () => {
    const [leaveRequests, setLeaveRequests] = useState([]);
    const [isLoading, setIsLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');
    const [filterStatus, setFilterStatus] = useState('all');

    // Fetch logic (Mock + Real)
    const fetchLeaveRequests = useCallback(async () => {
        try {
            setIsLoading(true);
            const response = await api.get('/leaves');
            if (response.data?.success) setLeaveRequests(response.data.data || []);
        } catch (error) {
            console.error('Error fetching:', error);
            // Mock data matches previous steps
            setLeaveRequests([
                {
                    _id: '1', employeeName: 'Rahul Kumar', employeeEmail: 'rahul@example.com',
                    leaveType: 'Sick Leave', startDate: '2026-01-15', endDate: '2026-01-17',
                    days: 3, reason: 'Medical checkup and recovery', status: 'pending', appliedOn: '2026-01-10'
                },
                {
                    _id: '2', employeeName: 'Priya Sharma', employeeEmail: 'priya@example.com',
                    leaveType: 'Casual Leave', startDate: '2026-01-20', endDate: '2026-01-22',
                    days: 3, reason: 'Family function', status: 'approved', appliedOn: '2026-01-08'
                },
                {
                    _id: '3', employeeName: 'Amit Patel', employeeEmail: 'amit@example.com',
                    leaveType: 'Earned Leave', startDate: '2026-02-01', endDate: '2026-02-05',
                    days: 5, reason: 'Vacation trip', status: 'pending', appliedOn: '2026-01-12'
                },
                {
                    _id: '4', employeeName: 'Sneha Gupta', employeeEmail: 'sneha@example.com',
                    leaveType: 'Sick Leave', startDate: '2026-01-05', endDate: '2026-01-06',
                    days: 1, reason: 'Fever', status: 'rejected', appliedOn: '2026-01-02'
                }
            ]);
        } finally {
            setIsLoading(false);
        }
    }, []);

    useEffect(() => { fetchLeaveRequests(); }, [fetchLeaveRequests]);

    // Derived State
    const stats = {
        pending: leaveRequests.filter(r => r.status === 'pending').length,
        approved: leaveRequests.filter(r => r.status === 'approved').length,
        rejected: leaveRequests.filter(r => r.status === 'rejected').length,
        totalDays: leaveRequests.filter(r => r.status === 'approved').reduce((sum, r) => sum + (r.days || 0), 0)
    };

    const filteredRequests = leaveRequests.filter(req => {
        const matchesSearch = req.employeeName?.toLowerCase().includes(searchTerm.toLowerCase());
        const matchesStatus = filterStatus === 'all' || req.status === filterStatus;
        return matchesSearch && matchesStatus;
    });

    const handleApprove = async (id) => {
        try {
            await api.put(`/leaves/${id}/approve`);
            showToast.success('Approved');
            fetchLeaveRequests();
        } catch (e) { showToast.error('Failed'); }
    };

    const handleReject = async (id) => {
        try {
            await api.put(`/leaves/${id}/reject`);
            showToast.error('Rejected');
            fetchLeaveRequests();
        } catch (e) { showToast.error('Failed'); }
    };

    if (isLoading) return <div className="flex justify-center items-center h-96"><div className="animate-spin rounded-full h-12 w-12 border-b-2 border-cyan-500"></div></div>;

    return (
        <div className="min-h-screen text-white p-2">
            <div className="flex flex-col lg:flex-row gap-8">

                {/* LEFT PANEL: Control Center (Sticky) */}
                <motion.div
                    initial={{ x: -50, opacity: 0 }}
                    animate={{ x: 0, opacity: 1 }}
                    className="w-full lg:w-1/3 lg:sticky lg:top-6 h-fit space-y-8"
                >
                    {/* Brand & Title */}
                    <div>
                        <h1 className="text-5xl font-black text-transparent bg-clip-text bg-gradient-to-r from-cyan-400 via-teal-300 to-emerald-400 tracking-tighter leading-tight drop-shadow-sm">
                            LEAVE<br />CONTROL
                        </h1>
                        <p className="text-zinc-500 font-medium tracking-wide mt-2 flex items-center gap-2">
                            <span className="w-1.5 h-1.5 rounded-full bg-cyan-500 animate-pulse" />
                            SYSTEM STATUS: ONLINE
                        </p>
                    </div>

                    {/* Stats HUD */}
                    <div className="grid grid-cols-2 gap-4">
                        <div className="col-span-2 bg-[#0A0A0A] border border-white/5 rounded-3xl p-6 relative overflow-hidden group">
                            <div className="absolute top-0 right-0 p-4 opacity-50"><Clock size={40} className="text-amber-500/20 group-hover:text-amber-500/40 transition-colors" /></div>
                            <h3 className="text-zinc-500 text-xs font-bold uppercase tracking-[0.2em] mb-1">Pending Actions</h3>
                            <div className="text-6xl font-black text-white flex items-baseline gap-2">
                                {stats.pending}
                                <span className="text-lg font-medium text-amber-500">requests</span>
                            </div>
                            <div className="w-full bg-zinc-800/50 h-1 mt-4 rounded-full overflow-hidden">
                                <motion.div
                                    initial={{ width: 0 }} animate={{ width: `${(stats.pending / leaveRequests.length) * 100}%` }}
                                    className="h-full bg-gradient-to-r from-amber-500 to-orange-500"
                                />
                            </div>
                        </div>

                        <div className="bg-[#0A0A0A] border border-white/5 rounded-3xl p-6 relative group hover:border-emerald-500/30 transition-colors">
                            <h3 className="text-zinc-500 text-xs font-bold uppercase tracking-wider mb-2">Approved</h3>
                            <div className="text-4xl font-black text-emerald-400">{stats.approved}</div>
                        </div>
                        <div className="bg-[#0A0A0A] border border-white/5 rounded-3xl p-6 relative group hover:border-red-500/30 transition-colors">
                            <h3 className="text-zinc-500 text-xs font-bold uppercase tracking-wider mb-2">Rejected</h3>
                            <div className="text-4xl font-black text-red-400">{stats.rejected}</div>
                        </div>
                    </div>

                    {/* Primary Action */}
                    <button className="w-full group relative overflow-hidden rounded-2xl bg-gradient-to-r from-cyan-600 to-teal-600 p-1 shadow-lg shadow-cyan-500/20 active:scale-95 transition-all">
                        <div className="absolute inset-0 bg-white/20 translate-y-full group-hover:translate-y-0 transition-transform duration-300 ease-out" />
                        <div className="relative bg-[#050505] rounded-xl px-6 py-5 flex items-center justify-between group-hover:bg-transparent transition-colors">
                            <span className="text-lg font-bold text-white tracking-wide group-hover:text-white">APPLY NEW LEAVE</span>
                            <div className="w-10 h-10 rounded-full bg-white/10 flex items-center justify-center group-hover:bg-white/20 transition-colors">
                                <Plus size={24} className="text-cyan-400 group-hover:text-white" />
                            </div>
                        </div>
                    </button>

                    {/* Export Button (Neutral) */}
                    <button className="w-full flex items-center justify-center gap-2 px-6 py-4 bg-zinc-900 border border-zinc-800 text-zinc-400 rounded-2xl hover:bg-zinc-800 hover:text-white transition-all text-sm font-bold uppercase tracking-wider">
                        <Download size={16} />
                        Export Data
                    </button>

                </motion.div>

                {/* RIGHT PANEL: The Feed */}
                <div className="w-full lg:w-2/3 space-y-6">
                    {/* Filters Bar */}
                    <div className="sticky top-0 z-20 bg-black/50 backdrop-blur-xl border-b border-white/5 pb-4 pt-2">
                        <div className="flex items-center gap-4 overflow-x-auto no-scrollbar">
                            {['all', 'pending', 'approved', 'rejected'].map(status => (
                                <button
                                    key={status}
                                    onClick={() => setFilterStatus(status)}
                                    className={`px-5 py-2.5 rounded-full text-xs font-bold uppercase tracking-wider transition-all border ${filterStatus === status
                                            ? 'bg-white text-black border-white shadow-[0_0_20px_rgba(255,255,255,0.3)]'
                                            : 'bg-zinc-900 text-zinc-500 border-zinc-800 hover:border-zinc-700 hover:text-zinc-300'
                                        }`}
                                >
                                    {status}
                                </button>
                            ))}
                            <div className="flex-1" />
                            <div className="relative">
                                <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-zinc-500" size={14} />
                                <input
                                    type="text"
                                    placeholder="Search..."
                                    value={searchTerm}
                                    onChange={e => setSearchTerm(e.target.value)}
                                    className="bg-zinc-900 border border-zinc-800 rounded-full pl-9 pr-4 py-2.5 text-xs text-white focus:outline-none focus:border-cyan-500/50 w-40 focus:w-64 transition-all"
                                />
                            </div>
                        </div>
                    </div>

                    {/* Request Stream */}
                    <div className="space-y-4 pb-20">
                        <AnimatePresence>
                            {filteredRequests.map((req, i) => (
                                <motion.div
                                    key={req._id}
                                    initial={{ opacity: 0, y: 20 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    exit={{ opacity: 0, scale: 0.95 }}
                                    transition={{ delay: i * 0.05 }}
                                    className="group relative"
                                >
                                    {/* Glass Ticket */}
                                    <div className="relative bg-[#0A0A0A] border border-white/5 rounded-3xl p-1 shadow-2xl overflow-hidden hover:border-white/10 transition-colors">
                                        <div className="absolute top-0 right-0 w-32 h-32 bg-gradient-to-br from-cyan-500/10 to-transparent blur-3xl opacity-0 group-hover:opacity-100 transition-opacity" />

                                        <div className="bg-zinc-900/40 rounded-[20px] p-6 backdrop-blur-sm">
                                            <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">

                                                {/* Left: User Info */}
                                                <div className="flex items-center gap-4">
                                                    <div className="relative">
                                                        <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-zinc-800 to-zinc-900 border border-white/5 flex items-center justify-center text-xl font-black text-zinc-500 group-hover:text-cyan-400 transition-colors shadow-inner">
                                                            {req.employeeName[0]}
                                                        </div>
                                                        {req.leaveType === 'Sick Leave' && <div className="absolute -bottom-1 -right-1 w-5 h-5 bg-red-500 rounded-full border-2 border-[#0A0A0A] flex items-center justify-center"><AlertCircle size={10} className="text-white" /></div>}
                                                    </div>
                                                    <div>
                                                        <h4 className="text-lg font-bold text-white tracking-tight">{req.employeeName}</h4>
                                                        <div className="flex items-center gap-2 mt-1">
                                                            <span className="px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider bg-white/5 text-zinc-400 border border-white/5">
                                                                {req.leaveType}
                                                            </span>
                                                            <span className="text-xs text-zinc-600">•</span>
                                                            <span className="text-xs text-zinc-500">{new Date(req.appliedOn).toLocaleDateString()}</span>
                                                        </div>
                                                    </div>
                                                </div>

                                                {/* Center: Timeline Visual */}
                                                <div className="flex-1 flex flex-col items-center justify-center px-4">
                                                    <div className="flex items-center gap-3 w-full max-w-xs">
                                                        <div className="text-right">
                                                            <div className="text-xs font-bold text-white">{new Date(req.startDate).getDate()}</div>
                                                            <div className="text-[10px] text-zinc-500 uppercase">{new Date(req.startDate).toLocaleString('default', { month: 'short' })}</div>
                                                        </div>
                                                        <div className="flex-1 h-1.5 bg-zinc-800 rounded-full relative">
                                                            <div className="absolute inset-0 bg-gradient-to-r from-zinc-700 to-zinc-600 rounded-full opacity-50" />
                                                            {/* Active duration bar */}
                                                            <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 bg-zinc-900 border border-white/10 px-2 py-0.5 rounded-full z-10">
                                                                <span className="text-[9px] font-black text-cyan-400 whitespace-nowrap">{req.days} DAYS</span>
                                                            </div>
                                                        </div>
                                                        <div>
                                                            <div className="text-xs font-bold text-white">{new Date(req.endDate).getDate()}</div>
                                                            <div className="text-[10px] text-zinc-500 uppercase">{new Date(req.endDate).toLocaleString('default', { month: 'short' })}</div>
                                                        </div>
                                                    </div>
                                                    <p className="mt-3 text-xs text-zinc-400 italic text-center max-w-xs line-clamp-1">"{req.reason}"</p>
                                                </div>

                                                {/* Right: Actions */}
                                                <div className="flex items-center gap-3">
                                                    {req.status === 'pending' ? (
                                                        <>
                                                            <button
                                                                onClick={() => handleApprove(req._id)}
                                                                className="w-10 h-10 rounded-xl bg-emerald-500/10 hover:bg-emerald-500 text-emerald-500 hover:text-white border border-emerald-500/20 hover:border-emerald-500 flex items-center justify-center transition-all shadow-[0_0_15px_rgba(16,185,129,0.1)] hover:shadow-[0_0_20px_rgba(16,185,129,0.4)]"
                                                                title="Approve"
                                                            >
                                                                <CheckCircle size={18} />
                                                            </button>
                                                            <button
                                                                onClick={() => handleReject(req._id)}
                                                                className="w-10 h-10 rounded-xl bg-red-500/10 hover:bg-red-500 text-red-500 hover:text-white border border-red-500/20 hover:border-red-500 flex items-center justify-center transition-all shadow-[0_0_15px_rgba(239,68,68,0.1)] hover:shadow-[0_0_20px_rgba(239,68,68,0.4)]"
                                                                title="Reject"
                                                            >
                                                                <XCircle size={18} />
                                                            </button>
                                                        </>
                                                    ) : (
                                                        <div className={`px-4 py-2 rounded-xl text-xs font-black uppercase tracking-wider border flex items-center gap-2 ${req.status === 'approved'
                                                                ? 'bg-emerald-500/5 text-emerald-400 border-emerald-500/20'
                                                                : 'bg-red-500/5 text-red-400 border-red-500/20'
                                                            }`}>
                                                            {req.status === 'approved' ? <CheckCircle size={14} /> : <XCircle size={14} />}
                                                            {req.status}
                                                        </div>
                                                    )}
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                </motion.div>
                            ))}
                        </AnimatePresence>

                        {filteredRequests.length === 0 && (
                            <div className="text-center py-20 opacity-50">
                                <Zap size={48} className="mx-auto text-zinc-700 mb-4" />
                                <p className="text-zinc-500 font-medium">All caught up! No requests found.</p>
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
};

export default LeaveManagement;
