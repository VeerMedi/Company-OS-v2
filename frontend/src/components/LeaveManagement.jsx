import React, { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Calendar,
  Clock,
  CheckCircle,
  XCircle,
  Download,
  Search,
  Users,
  UserCircle,
  Layout,
  Zap,
  Shield,
  Activity,
  Eye,
  FileText,
  ChevronRight,
  User
} from 'lucide-react';
import api from '../utils/api';
import { showToast } from '../utils/toast';
import { useAuth } from '../context/AuthContext';

// --- DATA ACCESS COMPONENTS ---

// 1. Details Modal (The "Eye" Action)
const DetailsModal = ({ request, onClose }) => {
  if (!request) return null;

  const sections = [
    { label: 'Reason', value: request.reason || 'No reason provided.' },
    {
      label: 'Handover Details',
      value: (
        <span>
          {request.handoverDetails || 'No specific details provided.'}
          {request.handoverTo && (
            <div className="mt-2 text-xs text-zinc-500 font-bold border-t border-white/5 pt-2 flex items-center gap-2">
              <User size={12} />
              Assigned to: <span className="text-cyan-500">
                {request.handoverTo.firstName
                  ? `${request.handoverTo.firstName} ${request.handoverTo.lastName}`
                  : 'Colleague'}
              </span>
            </div>
          )}
        </span>
      )
    }
  ];

  const ApprovalStep = ({ label, status, approver }) => (
    <div className={`flex items-center gap-3 p-3 rounded-xl border ${status === 'approved' ? 'bg-emerald-500/10 border-emerald-500/30' :
      status === 'rejected' ? 'bg-red-500/10 border-red-500/30' :
        'bg-zinc-900/50 border-white/5'
      }`}>
      <div className={`w-8 h-8 rounded-full flex items-center justify-center border ${status === 'approved' ? 'bg-emerald-500/20 border-emerald-500 text-emerald-500' :
        status === 'rejected' ? 'bg-red-500/20 border-red-500 text-red-500' :
          'bg-zinc-800 border-zinc-600 text-zinc-500'
        }`}>
        {status === 'approved' ? <CheckCircle size={14} /> : status === 'rejected' ? <XCircle size={14} /> : <Clock size={14} />}
      </div>
      <div>
        <div className="text-[10px] uppercase font-bold text-zinc-500 tracking-wider">{label}</div>
        <div className={`text-xs font-bold ${status === 'approved' ? 'text-emerald-400' :
          status === 'rejected' ? 'text-red-400' :
            'text-zinc-300'
          }`}>
          {status === 'approved' ? 'Approved' : status === 'rejected' ? 'Rejected' : 'Pending'}
        </div>
        {approver && <div className="text-[10px] text-zinc-500 mt-0.5">by {approver.firstName} {approver.lastName}</div>}
      </div>
    </div>
  );

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={onClose}
        className="absolute inset-0 bg-black/80 backdrop-blur-sm"
      />
      <motion.div initial={{ scale: 0.95, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.95, opacity: 0 }}
        className="relative bg-[#09090b] border border-white/10 rounded-3xl w-full max-w-lg overflow-hidden shadow-2xl shadow-cyan-500/10"
      >
        {/* Header */}
        <div className="bg-gradient-to-r from-zinc-900 to-black p-6 border-b border-white/5 flex justify-between items-start">
          <div>
            <h3 className="text-xl font-black text-white tracking-tight">Transmission Details</h3>
            <div className="text-xs text-zinc-500 mt-1 flex items-center gap-2">
              <span className="font-mono text-cyan-500">#{request._id.slice(-6).toUpperCase()}</span>
              <span>•</span>
              <span>{new Date(request.createdAt).toLocaleString()}</span>
            </div>
          </div>
          <button onClick={onClose} className="p-2 bg-white/5 hover:bg-white/10 rounded-full transition-colors"><XCircle size={20} className="text-zinc-400" /></button>
        </div>

        {/* Content */}
        <div className="p-6 space-y-6 max-h-[70vh] overflow-y-auto custom-scrollbar">
          {/* Employee Info */}
          <div className="flex items-center gap-4 bg-white/5 rounded-2xl p-4">
            <div className="w-12 h-12 rounded-xl bg-cyan-500/10 flex items-center justify-center text-cyan-400 font-black text-lg">
              {request.employee?.firstName?.[0]}
            </div>
            <div>
              <div className="text-lg font-bold text-white">{request.employee?.firstName} {request.employee?.lastName}</div>
              <div className="text-xs text-zinc-500 uppercase tracking-widest">{request.employee?.role} • {request.employee?.department}</div>
            </div>
          </div>

          {/* Quick Stats Grid */}
          <div className="grid grid-cols-2 gap-3">
            <div className="p-3 bg-zinc-900/50 rounded-xl border border-white/5">
              <div className="text-[10px] text-zinc-500 uppercase">Leave Type</div>
              <div className="text-sm font-bold text-white mt-1">{request.leaveType}</div>
            </div>
            <div className="p-3 bg-zinc-900/50 rounded-xl border border-white/5">
              <div className="text-[10px] text-zinc-500 uppercase">Duration</div>
              <div className="text-sm font-bold text-white mt-1">{request.totalDays || request.days} Days</div>
            </div>
          </div>

          {/* Description Sections */}
          <div className="space-y-3">
            {sections.map(section => (
              <div key={section.label}>
                <div className="text-[10px] font-bold text-zinc-600 uppercase tracking-widest mb-1 pl-1">{section.label}</div>
                <div className="bg-zinc-900/30 border border-white/5 rounded-xl p-3 text-sm text-zinc-300 leading-relaxed">
                  {section.value}
                </div>
              </div>
            ))}
          </div>

          {/* Chain of Command */}
          <div>
            <div className="text-[10px] font-bold text-zinc-600 uppercase tracking-widest mb-3 pl-1 flex items-center gap-2">
              <Shield size={10} /> Chain of Command
            </div>
            <div className="space-y-2">
              <ApprovalStep label="Manager Approval" status={request.managerApproval?.status} approver={request.managerApproval?.approvedBy} />
              <ApprovalStep label="HR Verification" status={request.hrApproval?.status} approver={request.hrApproval?.approvedBy} />
            </div>
          </div>
        </div>
      </motion.div>
    </div>
  );
};

// 2. Overview Feed (With Eye Action)
const OverviewView = ({ requests, handleApprove, handleReject, searchTerm, setSearchTerm, filterStatus, setFilterStatus, onViewDetails }) => {
  const filtered = requests.filter(req => {
    const name = req.employee?.firstName ? `${req.employee.firstName} ${req.employee.lastName}` : (req.employeeName || '');
    const matchesSearch = name.toLowerCase().includes(searchTerm.toLowerCase());

    let matchesStatus = filterStatus === 'all';
    if (!matchesStatus) {
      if (filterStatus === 'pending') {
        matchesStatus = ['pending', 'manager_approved', 'hr_approved'].includes(req.status.toLowerCase());
      } else {
        matchesStatus = req.status.toLowerCase() === filterStatus.toLowerCase();
      }
    }

    return matchesSearch && matchesStatus;
  });

  const getEmployeeName = (req) => req.employee?.firstName ? `${req.employee.firstName} ${req.employee.lastName}` : (req.employeeName || 'Unknown');
  const getEmployeeRole = (req) => req.employee?.role || 'Crew Member';

  return (
    <div className="space-y-6">
      {/* Filter Bar */}
      <div className="sticky top-0 z-20 bg-black/80 backdrop-blur-xl border-b border-white/5 pb-4 pt-2 -mx-2 px-2">
        <div className="flex items-center gap-4 overflow-x-auto no-scrollbar">
          {['All', 'Pending', 'Approved', 'Rejected'].map(status => (
            <button key={status} onClick={() => setFilterStatus(status.toLowerCase())}
              className={`px-5 py-2.5 rounded-full text-xs font-bold uppercase tracking-wider transition-all border ${filterStatus === status.toLowerCase()
                ? 'bg-white/10 text-white border-white/50 shadow-[0_0_20px_rgba(255,255,255,0.3)]'
                : 'bg-zinc-900 text-zinc-500 border-zinc-800 hover:border-white/30 hover:text-white hover:shadow-[0_0_15px_rgba(255,255,255,0.2)]'
                }`}
            >{status}</button>
          ))}
          <div className="flex-1" />
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-zinc-500" size={14} />
            <input type="text" placeholder="Search crew..." value={searchTerm} onChange={e => setSearchTerm(e.target.value)}
              className="bg-zinc-900 border border-zinc-800 rounded-full pl-9 pr-4 py-2.5 text-xs text-white focus:outline-none focus:border-white/50 focus:shadow-[0_0_15px_rgba(255,255,255,0.2)] w-40 focus:w-64 transition-all"
            />
          </div>
        </div>
      </div>

      <div className="space-y-4 pb-20">
        <AnimatePresence>
          {filtered.map((req, i) => (
            <motion.div key={req._id} initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.95 }} transition={{ delay: i * 0.05 }} className="group relative">
              {/* Holographic Ticket Card */}
              <div className="relative bg-zinc-900/40 border border-white/5 rounded-3xl p-1 overflow-hidden hover:border-white/30 transition-all duration-300 group-hover:shadow-[0_0_30px_rgba(255,255,255,0.15)]">
                <div className="absolute top-0 right-0 w-64 h-64 bg-gradient-to-br from-white/10 to-transparent blur-3xl opacity-0 group-hover:opacity-100 transition-opacity" />

                <div className="bg-[#09090b] rounded-[22px] p-6 relative z-10">
                  <div className="flex flex-col md:flex-row gap-6 items-center">
                    {/* Avatar Section */}
                    <div className="flex items-center gap-4 w-full md:w-auto">
                      <div className="w-16 h-16 rounded-2xl bg-zinc-800 border-2 border-zinc-700 flex items-center justify-center text-xl font-black text-zinc-500 group-hover:text-white group-hover:border-white/50 group-hover:shadow-[0_0_15px_rgba(255,255,255,0.2)] transition-all shadow-inner">
                        {getEmployeeName(req)[0]}
                      </div>
                      <div>
                        <h4 className="text-lg font-bold text-white tracking-tight">{getEmployeeName(req)}</h4>
                        <div className="flex items-center gap-2 mt-1">
                          <span className="text-[10px] uppercase font-bold text-zinc-500 tracking-widest">{getEmployeeRole(req)}</span>
                          <div className="w-1 h-1 rounded-full bg-zinc-600" />
                          <span className="text-[10px] text-white font-bold">{req.leaveType}</span>
                        </div>
                      </div>
                    </div>

                    {/* Timeline Graphic */}
                    <div className="flex-1 w-full flex items-center justify-center px-4">
                      <div className="flex items-center gap-4 w-full max-w-sm">
                        <div className="text-right">
                          <div className="text-sm font-bold text-white">{new Date(req.startDate).getDate()}</div>
                          <div className="text-[10px] text-zinc-500 uppercase font-bold">{new Date(req.startDate).toLocaleString('default', { month: 'short' })}</div>
                        </div>
                        <div className="flex-1 h-2 bg-zinc-800 rounded-full relative overflow-visible">
                          <div className="absolute inset-0 bg-gradient-to-r from-zinc-700 to-white/50 opacity-50 rounded-full" />
                          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 bg-black border border-white/50 px-3 py-1 rounded-full z-10 shadow-lg whitespace-nowrap shadow-white/20">
                            <span className="text-[9px] font-black text-white">
                              {req.totalDays || req.days} {(req.totalDays || req.days) === 1 ? 'DAY' : 'DAYS'}
                            </span>
                          </div>
                        </div>
                        <div>
                          <div className="text-sm font-bold text-white">{new Date(req.endDate).getDate()}</div>
                          <div className="text-[10px] text-zinc-500 uppercase font-bold">{new Date(req.endDate).toLocaleString('default', { month: 'short' })}</div>
                        </div>
                      </div>
                    </div>
                    {/* Actions */}
                    <div className="flex items-center gap-3">
                      {/* Details Button (The Eye) */}
                      <button onClick={() => onViewDetails(req)} className="w-10 h-10 rounded-xl bg-zinc-800 text-zinc-400 hover:text-white hover:bg-white/10 hover:border-white/30 hover:shadow-[0_0_15px_rgba(255,255,255,0.2)] transition-all flex items-center justify-center group/btn shadow-lg border border-transparent">
                        <Eye size={18} className="group-hover/btn:scale-110 transition-transform" />
                      </button>

                      {req.status === 'pending' ? (
                        <div className="flex gap-2 pl-3 border-l border-zinc-800">
                          <button onClick={() => handleApprove(req._id)} className="w-10 h-10 rounded-xl bg-white/5 hover:bg-white/20 text-white border border-white/20 hover:border-white/50 hover:shadow-[0_0_15px_rgba(255,255,255,0.3)] hover:scale-110 transition-all flex items-center justify-center">
                            <CheckCircle size={20} />
                          </button>
                          <button onClick={() => handleReject(req._id)} className="w-10 h-10 rounded-xl bg-red-500/10 hover:bg-red-500 text-red-400 hover:text-white border border-red-500/20 hover:border-red-500 hover:scale-110 transition-all flex items-center justify-center">
                            <XCircle size={20} />
                          </button>
                        </div>
                      ) : (
                        <div className={`ml-3 px-4 py-2 rounded-xl text-xs font-black uppercase tracking-wider border flex items-center gap-2 ${req.status === 'approved' ? 'bg-white/5 text-white border-white/30' :
                          req.status === 'rejected' ? 'bg-red-500/5 text-red-400 border-red-500/20' : 'bg-amber-500/5 text-amber-400 border-amber-500/20'
                          }`}>
                          {req.status}
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Footer Info */}
                  <div className="mt-4 pt-4 border-t border-white/5 flex justify-between items-center">
                    <div className="text-[10px] text-zinc-600 flex items-center gap-2">
                      <Clock size={12} /> Applied: {new Date(req.createdAt).toLocaleDateString()}
                    </div>
                    <div className="text-[10px] text-zinc-600 font-mono uppercase tracking-widest">
                      ID: {req._id.slice(-6)}
                    </div>
                  </div>
                </div>
              </div>
            </motion.div>
          ))}
          {filtered.length === 0 && (
            <div className="text-center py-20">
              <Zap size={48} className="mx-auto text-zinc-800 mb-4" />
              <p className="text-zinc-500 font-medium">No active transmissions found</p>
            </div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
};

// 3. Balances View (Futuristic Grid) - Same as before
const BalancesView = () => {
  const [balances, setBalances] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchBalances = async () => {
      try {
        const res = await api.get('/leave/balances');
        if (res.data?.success) setBalances(res.data.data);
      } catch (e) { console.error('Error loading balances', e); }
      finally { setLoading(false); }
    };
    fetchBalances();
  }, []);

  if (loading) return <div className="py-20 text-center text-zinc-500 animate-pulse">Syncing Employee Database...</div>;

  const CircularGauge = ({ value, total, label }) => {
    const radius = 20;
    const circumference = 2 * Math.PI * radius;
    const percent = Math.min(1, value / (total || 1));
    const offset = circumference - percent * circumference;

    return (
      <div className="flex flex-col items-center gap-2 group cursor-default">
        <div className="relative w-16 h-16 flex items-center justify-center">
          <svg className="w-full h-full transform -rotate-90">
            {/* Background Circle */}
            <circle cx="32" cy="32" r={radius} stroke="#27272a" strokeWidth="2.5" fill="none" />

            {/* Neon Glow Circle */}
            <circle cx="32" cy="32" r={radius} stroke="url(#neonGradient)" strokeWidth="2.5" fill="none"
              strokeDasharray={circumference} strokeDashoffset={offset} strokeLinecap="round"
              className="transition-all duration-1000 ease-out group-hover:drop-shadow-[0_0_8px_rgba(255,255,255,0.8)] group-hover:drop-shadow-[0_0_12px_rgba(255,255,255,0.6)]"
            />

            <defs>
              <linearGradient id="neonGradient" x1="0%" y1="0%" x2="100%" y2="100%">
                <stop offset="0%" stopColor="#ffffff" stopOpacity="1" />
                <stop offset="50%" stopColor="#e5e5e5" stopOpacity="0.95" />
                <stop offset="100%" stopColor="#d4d4d8" stopOpacity="0.9" />
              </linearGradient>
            </defs>
          </svg>
          <div className="absolute inset-0 flex flex-col items-center justify-center">
            <span className="text-sm font-black text-white group-hover:drop-shadow-[0_0_10px_rgba(255,255,255,0.5)] transition-all">{value}</span>
          </div>
        </div>
        <div className="text-[9px] uppercase font-bold text-zinc-500 tracking-wider group-hover:text-zinc-300 transition-colors">{label}</div>
      </div>
    );
  };

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
      {balances.map((b, i) => {
        const totalUsed = ((b.balances?.sick?.used || 0) +
          (b.balances?.casual?.used || 0) +
          (b.balances?.vacation?.used || 0) +
          (b.balances?.maternity?.used || 0) +
          (b.balances?.paternity?.used || 0));

        return (
          <motion.div key={b._id} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.05 }}
            className="bg-black/40 border border-white/5 rounded-2xl p-5 hover:bg-white/[0.02] transition-colors group relative overflow-hidden"
          >
            <div className="flex items-center gap-4 mb-3 relative z-10">
              <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-zinc-800 to-zinc-900 border border-white/5 flex items-center justify-center font-bold text-cyan-500 shadow-inner">
                {b.employee?.firstName?.[0]}
              </div>
              <div className="flex-1">
                <div className="font-bold text-white text-sm">{b.employee?.firstName} {b.employee?.lastName}</div>
                <div className="text-[10px] text-zinc-500 uppercase tracking-wider">{b.employee?.role || 'Employee'}</div>
              </div>
            </div>

            {/* Total Used Badge - Moved Below Name */}
            <div className="mb-4 flex justify-end">
              <div className="bg-zinc-900/60 border border-white/10 px-3 py-1.5 rounded-full backdrop-blur-sm">
                <span className="text-sm font-black text-white">{totalUsed}</span>
                <span className="text-[10px] uppercase font-bold text-zinc-500 ml-2">Days Used</span>
              </div>
            </div>

            <div className="flex justify-between items-center px-3 py-3 bg-white/[0.02] rounded-xl border border-white/5">
              <CircularGauge label="Sick" value={b.balances?.sick?.remaining} total={b.balances?.sick?.allocated} />
              <div className="w-px h-10 bg-zinc-800" />
              <CircularGauge label="Casual" value={b.balances?.casual?.remaining} total={b.balances?.casual?.allocated} />
              <div className="w-px h-10 bg-zinc-800" />
              <CircularGauge label="Vacation" value={b.balances?.vacation?.remaining} total={b.balances?.vacation?.allocated} />
            </div>
          </motion.div>
        );
      })}
    </div>
  );
};

// 4. My Leaves (Gauges + History)
const MyLeavesView = ({ requests, userEmail, onRefresh }) => {
  const [myBalance, setMyBalance] = useState(null);
  const [showRequestModal, setShowRequestModal] = useState(false);
  const [leaveRequest, setLeaveRequest] = useState({
    leaveType: 'casual',
    startDate: '',
    endDate: '',
    reason: '',
    emergencyContact: { name: '', phone: '', relationship: '' },
    handoverDetails: '',
    isHalfDay: false,
    halfDayPeriod: 'first-half'
  });

  useEffect(() => {
    const fetchMyBalance = async () => {
      try { const res = await api.get('/leave/my-balance'); if (res.data?.success) setMyBalance(res.data.data); } catch (e) { }
    };
    fetchMyBalance();
  }, []);

  const handleLeaveRequest = async (e) => {
    e.preventDefault();
    try {
      await api.post('/leave/request', leaveRequest);
      showToast.success('Leave request submitted successfully');
      setShowRequestModal(false);
      setLeaveRequest({
        leaveType: 'casual',
        startDate: '',
        endDate: '',
        reason: '',
        emergencyContact: { name: '', phone: '', relationship: '' },
        handoverDetails: '',
        isHalfDay: false,
        halfDayPeriod: 'first-half'
      });
      if (onRefresh) onRefresh();
    } catch (error) {
      console.error('Error submitting leave request:', error);
      showToast.error(error.response?.data?.message || 'Failed to submit leave request');
    }
  };

  const handleCancelLeave = async (leaveId) => {
    try {
      await api.put(`/leave/cancel/${leaveId}`);
      showToast.success('Leave request cancelled successfully');
      if (onRefresh) onRefresh();
    } catch (error) {
      console.error('Error cancelling leave:', error);
      showToast.error(error.response?.data?.message || 'Failed to cancel leave request');
    }
  };

  const myLeaves = requests.filter(r =>
    (r.employee?.email && userEmail && r.employee.email.toLowerCase() === userEmail.toLowerCase()) ||
    (r.employeeEmail && userEmail && r.employeeEmail.toLowerCase() === userEmail.toLowerCase())
  );

  const BigGauge = ({ label, remaining, allocated, color }) => (
    <div className="bg-zinc-900/50 border border-white/5 rounded-2xl p-6 relative overflow-hidden">
      <div className="absolute top-0 right-0 w-20 h-20 bg-gradient-to-bl from-white/5 to-transparent rounded-bl-3xl" />
      <div className="text-xs font-bold text-zinc-500 uppercase tracking-widest mb-2">{label}</div>
      <div className="flex items-end gap-2">
        <div className="text-4xl font-black text-white">{remaining}</div>
        <div className="text-sm font-bold text-zinc-600 mb-1">/ {allocated}</div>
      </div>
      <div className="w-full h-1 bg-zinc-800 rounded-full mt-4">
        <div className="h-full rounded-full" style={{ width: `${(remaining / allocated) * 100}%`, backgroundColor: color }} />
      </div>
    </div>
  );

  return (
    <div className="space-y-8">
      {/* Request Leave Button */}
      <div className="flex justify-end">
        <button
          onClick={() => setShowRequestModal(true)}
          className="group relative px-6 py-3 bg-gradient-to-r from-cyan-900/40 to-blue-900/40 border border-cyan-500/50 rounded-2xl overflow-hidden hover:shadow-[0_0_30px_rgba(6,182,212,0.3)] transition-all duration-300"
        >
          <div className="absolute inset-0 bg-gradient-to-r from-cyan-500/10 to-blue-500/10 opacity-0 group-hover:opacity-100 transition-opacity" />
          <div className="relative flex items-center gap-3">
            <Calendar size={18} className="text-cyan-400" />
            <span className="font-bold text-white tracking-wide">Request Leave</span>
          </div>
        </button>
      </div>

      {myBalance && (
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          <BigGauge label="Vacation" remaining={myBalance.vacation?.remaining} allocated={myBalance.vacation?.allocated} color="#10b981" />
          <BigGauge label="Sick" remaining={myBalance.sick?.remaining} allocated={myBalance.sick?.allocated} color="#ef4444" />
          <BigGauge label="Casual" remaining={myBalance.casual?.remaining} allocated={myBalance.casual?.allocated} color="#3b82f6" />
          <BigGauge label="Maternity" remaining={myBalance.maternity?.remaining} allocated={myBalance.maternity?.allocated} color="#8b5cf6" />
        </div>
      )}

      <div>
        <h3 className="text-lg font-bold text-white mb-4">Request History</h3>
        <div className="space-y-3">
          {myLeaves.map(leave => (
            <div key={leave._id} className="bg-black/40 border border-white/5 rounded-2xl p-4 flex items-center justify-between hover:bg-white/[0.02]">
              <div className="flex items-center gap-4">
                <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${leave.leaveType.toLowerCase().includes('sick') ? 'bg-red-500/10 text-red-500' : 'bg-cyan-500/10 text-cyan-500'}`}>
                  <Activity size={18} />
                </div>
                <div>
                  <div className="font-bold text-white text-sm">{leave.leaveType}</div>
                  <div className="text-xs text-zinc-500">{new Date(leave.startDate).toLocaleDateString()} - {new Date(leave.endDate).toLocaleDateString()}</div>
                </div>
              </div>
              <div className="flex items-center gap-3">
                <span className="text-xs font-bold text-white">{leave.totalDays || leave.days} Days</span>
                <span className={`px-3 py-1 rounded-lg text-[10px] font-black uppercase tracking-wider ${leave.status === 'approved' ? 'bg-emerald-500/10 text-emerald-500' :
                  leave.status === 'rejected' ? 'bg-red-500/10 text-red-500' :
                    leave.status === 'cancelled' ? 'bg-zinc-500/10 text-zinc-400' : 'bg-amber-500/10 text-amber-500'
                  }`}>{leave.status}</span>
                {['pending', 'manager_approved'].includes(leave.status) && (
                  <button
                    onClick={() => handleCancelLeave(leave._id)}
                    className="px-3 py-1 rounded-lg text-[10px] font-bold bg-red-500/10 hover:bg-red-500/20 text-red-400 border border-red-500/20 transition-colors"
                  >
                    Cancel
                  </button>
                )}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Leave Request Form Modal */}
      {showRequestModal && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center z-50 p-4" onClick={(e) => e.target === e.currentTarget && setShowRequestModal(false)}>
          <div className="bg-zinc-900 border border-cyan-500/20 rounded-3xl max-w-2xl w-full max-h-[90vh] overflow-y-auto shadow-2xl shadow-cyan-500/10">
            <form onSubmit={handleLeaveRequest}>
              <div className="p-6 border-b border-white/10 sticky top-0 bg-zinc-900/95 backdrop-blur z-10">
                <div className="flex justify-between items-center">
                  <h3 className="text-2xl font-black text-transparent bg-clip-text bg-gradient-to-r from-cyan-400 to-blue-500">Request Leave</h3>
                  <button type="button" onClick={() => setShowRequestModal(false)} className="text-zinc-400 hover:text-white transition-colors">
                    <XCircle className="h-6 w-6" />
                  </button>
                </div>
              </div>

              <div className="p-6 space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <label className="block text-sm font-bold text-zinc-400 mb-2 uppercase tracking-wider">Leave Type</label>
                    <select value={leaveRequest.leaveType} onChange={(e) => setLeaveRequest({ ...leaveRequest, leaveType: e.target.value })}
                      className="w-full bg-zinc-800 border border-white/10 rounded-xl px-4 py-3 text-white focus:outline-none focus:ring-2 focus:ring-cyan-500/50" required>
                      <option value="casual">Casual Leave</option>
                      <option value="sick">Sick Leave</option>
                      <option value="vacation">Vacation</option>
                      <option value="emergency">Emergency</option>
                      <option value="maternity">Maternity Leave</option>
                      <option value="paternity">Paternity Leave</option>
                      <option value="compensatory">Compensatory Leave</option>
                    </select>
                  </div>

                  <div>
                    <div className="flex items-center justify-between mb-2">
                      <label className="text-sm font-bold text-zinc-400 uppercase tracking-wider">Duration</label>
                      <label className="flex items-center text-sm text-cyan-400 cursor-pointer">
                        <input type="checkbox" checked={leaveRequest.isHalfDay}
                          onChange={(e) => {
                            const isHalfDay = e.target.checked;
                            setLeaveRequest({ ...leaveRequest, isHalfDay, endDate: isHalfDay ? leaveRequest.startDate : leaveRequest.endDate });
                          }}
                          className="mr-2 rounded border-zinc-700 bg-zinc-800 text-cyan-500 focus:ring-offset-0" />
                        Half Day
                      </label>
                    </div>
                    {leaveRequest.isHalfDay ? (
                      <select value={leaveRequest.halfDayPeriod} onChange={(e) => setLeaveRequest({ ...leaveRequest, halfDayPeriod: e.target.value })}
                        className="w-full bg-zinc-800 border border-white/10 rounded-xl px-4 py-3 text-white focus:outline-none focus:ring-2 focus:ring-cyan-500/50">
                        <option value="first-half">First Half</option>
                        <option value="second-half">Second Half</option>
                      </select>
                    ) : (
                      <div className="h-[46px] w-full bg-zinc-800/50 border border-white/5 rounded-xl flex items-center px-4 text-zinc-500 text-sm">Full Day Leave</div>
                    )}
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <label className="block text-sm font-bold text-zinc-400 mb-2 uppercase tracking-wider">Start Date</label>
                    <input type="date" value={leaveRequest.startDate}
                      onChange={(e) => {
                        const startDate = e.target.value;
                        setLeaveRequest({ ...leaveRequest, startDate, endDate: leaveRequest.isHalfDay ? startDate : leaveRequest.endDate });
                      }}
                      className="w-full bg-zinc-800 border border-white/10 rounded-xl px-4 py-3 text-white focus:outline-none focus:ring-2 focus:ring-cyan-500/50 [color-scheme:dark]" required />
                  </div>

                  <div>
                    <label className="block text-sm font-bold text-zinc-400 mb-2 uppercase tracking-wider">
                      {leaveRequest.isHalfDay ? 'End Date (Same as Start)' : 'End Date'}
                    </label>
                    <input type="date" value={leaveRequest.endDate} onChange={(e) => setLeaveRequest({ ...leaveRequest, endDate: e.target.value })}
                      className="w-full bg-zinc-800 border border-white/10 rounded-xl px-4 py-3 text-white focus:outline-none focus:ring-2 focus:ring-cyan-500/50 [color-scheme:dark]"
                      disabled={leaveRequest.isHalfDay} required />
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-bold text-zinc-400 mb-2 uppercase tracking-wider">Reason for Leave</label>
                  <textarea value={leaveRequest.reason} onChange={(e) => setLeaveRequest({ ...leaveRequest, reason: e.target.value })}
                    className="w-full bg-zinc-800 border border-white/10 rounded-xl px-4 py-3 text-white h-24 focus:outline-none focus:ring-2 focus:ring-cyan-500/50 resize-none"
                    placeholder="Please explain why you are requesting leave..." required />
                </div>

                <div>
                  <label className="block text-sm font-bold text-zinc-400 mb-2 uppercase tracking-wider">Handover Details (Optional)</label>
                  <textarea value={leaveRequest.handoverDetails} onChange={(e) => setLeaveRequest({ ...leaveRequest, handoverDetails: e.target.value })}
                    className="w-full bg-zinc-800 border border-white/10 rounded-xl px-4 py-3 text-white h-24 focus:outline-none focus:ring-2 focus:ring-cyan-500/50 resize-none"
                    placeholder="Describe any pending tasks or handover arrangements..." />
                </div>

                <div className="border-t border-white/10 pt-6">
                  <h4 className="text-sm font-bold text-white mb-4 flex items-center">
                    <span className="w-1.5 h-1.5 bg-red-500 rounded-full mr-2"></span>
                    Emergency Contact (Optional)
                  </h4>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <input type="text" placeholder="Name" value={leaveRequest.emergencyContact.name}
                      onChange={(e) => setLeaveRequest({ ...leaveRequest, emergencyContact: { ...leaveRequest.emergencyContact, name: e.target.value } })}
                      className="bg-zinc-800 border border-white/10 rounded-xl px-4 py-3 text-white focus:outline-none focus:ring-2 focus:ring-cyan-500/50" />
                    <input type="tel" placeholder="Phone" value={leaveRequest.emergencyContact.phone}
                      onChange={(e) => setLeaveRequest({ ...leaveRequest, emergencyContact: { ...leaveRequest.emergencyContact, phone: e.target.value } })}
                      className="bg-zinc-800 border border-white/10 rounded-xl px-4 py-3 text-white focus:outline-none focus:ring-2 focus:ring-cyan-500/50" />
                    <input type="text" placeholder="Relationship" value={leaveRequest.emergencyContact.relationship}
                      onChange={(e) => setLeaveRequest({ ...leaveRequest, emergencyContact: { ...leaveRequest.emergencyContact, relationship: e.target.value } })}
                      className="bg-zinc-800 border border-white/10 rounded-xl px-4 py-3 text-white focus:outline-none focus:ring-2 focus:ring-cyan-500/50" />
                  </div>
                </div>
              </div>

              <div className="p-6 border-t border-white/10 bg-zinc-900/95 backdrop-blur flex justify-end space-x-3 sticky bottom-0 z-10 rounded-b-3xl">
                <button type="button" onClick={() => setShowRequestModal(false)}
                  className="px-6 py-2.5 rounded-xl text-zinc-300 hover:text-white hover:bg-white/5 transition-colors font-medium">
                  Cancel
                </button>
                <button type="submit"
                  className="bg-gradient-to-r from-cyan-600 to-blue-600 text-white px-6 py-2.5 rounded-xl hover:from-cyan-700 hover:to-blue-700 transition-all font-bold shadow-lg shadow-cyan-500/20">
                  Submit Request
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

// --- MAIN COMPONENT ---

const LeaveManagement = () => {
  const { user } = useAuth();
  const [leaveRequests, setLeaveRequests] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterStatus, setFilterStatus] = useState('all');
  const [activeTab, setActiveTab] = useState('overview');
  const [selectedRequest, setSelectedRequest] = useState(null); // For Modal

  // Correct Data Fetching
  const fetchLeaveRequests = useCallback(async () => {
    try {
      setIsLoading(true);
      const response = await api.get('/leave/requests'); // Correct Endpoint
      if (response.data?.success) {
        const data = response.data.data.docs || response.data.data || [];
        setLeaveRequests(data);
      }
    } catch (error) {
      console.error('Error fetching:', error);
      showToast.error('Failed to load data');
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => { fetchLeaveRequests(); }, [fetchLeaveRequests]);

  const handleApprove = async (id) => {
    try {
      console.log('🟢 Approving leave:', id);
      const response = await api.put(`/leave/approve/${id}`, { action: 'approve' });
      console.log('✅ Approve response:', response.data);
      const message = response.data?.message || 'Leave request approved';
      showToast.success(message);

      // Close modal if open
      setSelectedRequest(null);

      // Update local state immediately for smoothness
      if (response.data?.data) {
        setLeaveRequests(prev => prev.map(req => req._id === id ? response.data.data : req));
      }

      // Fetch fresh data in background
      fetchLeaveRequests();
    }
    catch (e) {
      console.error('❌ Approve error:', e);
      showToast.error('Failed to approve');
    }
  };
  const handleReject = async (id) => {
    try {
      console.log('🔴 Rejecting leave:', id);
      const response = await api.put(`/leave/approve/${id}`, { action: 'reject' });
      console.log('✅ Reject response:', response.data);
      const message = response.data?.message || 'Leave request rejected';
      showToast.success(message);

      // Close modal if open
      setSelectedRequest(null);

      // Update local state immediately for smoothness
      if (response.data?.data) {
        setLeaveRequests(prev => prev.map(req => req._id === id ? response.data.data : req));
      }

      // Fetch fresh data in background
      fetchLeaveRequests();
    }
    catch (e) {
      console.error('❌ Reject error:', e);
      showToast.error('Failed to reject');
    }
  };

  if (isLoading) return <div className="flex justify-center items-center h-screen bg-[#050505]"><div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-cyan-500"></div></div>;

  const navItems = [
    { id: 'overview', label: 'Leave Control', icon: Layout },
    { id: 'balances', label: 'Crew Balances', icon: Users },
    { id: 'myleaves', label: 'My Status', icon: UserCircle },
  ];

  return (
    <div className="min-h-screen text-white p-4 lg:p-6 bg-[#050505]">
      <AnimatePresence>
        {selectedRequest && <DetailsModal request={selectedRequest} onClose={() => setSelectedRequest(null)} />}
      </AnimatePresence>

      <div className="flex flex-col lg:flex-row gap-8">

        {/* LEFT CONTROL PANEL (Sticky) */}
        <motion.div initial={{ x: -20, opacity: 0 }} animate={{ x: 0, opacity: 1 }} className="w-full lg:w-80 lg:sticky lg:top-8 h-fit space-y-8">
          {/* Header */}
          <div>
            <h1 className="text-5xl font-black text-transparent bg-clip-text bg-gradient-to-r from-white via-zinc-200 to-white tracking-tighter leading-[0.9] drop-shadow-[0_0_20px_rgba(255,255,255,0.3)]">
              LEAVE<br />MANAG
            </h1>
            <div className="flex items-center gap-2 mt-3 p-2 bg-white/5 rounded-lg w-fit border border-white/5">
              <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse shadow-[0_0_10px_#10b981]" />
              <span className="text-[10px] font-bold text-zinc-400 uppercase tracking-widest">System Online</span>
            </div>
          </div>

          {/* Navigation */}
          <div className="space-y-2">
            {navItems.map(item => (
              <button
                key={item.id}
                onClick={() => setActiveTab(item.id)}
                className={`w-full flex items-center justify-between px-6 py-4 rounded-2xl transition-all relative overflow-hidden group ${activeTab === item.id
                  ? 'bg-white/10 border border-white/50 shadow-[0_0_25px_rgba(255,255,255,0.2)] text-white'
                  : 'bg-zinc-900/40 border border-white/5 text-zinc-500 hover:bg-white/5 hover:text-zinc-300 hover:border-white/20'
                  }`}
              >
                <div className="flex items-center gap-4 relative z-10">
                  <item.icon size={20} className={activeTab === item.id ? 'text-white drop-shadow-[0_0_8px_rgba(255,255,255,0.5)]' : 'text-zinc-600'} />
                  <span className="font-bold text-sm tracking-wide">{item.label}</span>
                </div>
                {activeTab === item.id && <div className="absolute right-0 top-0 bottom-0 w-1 bg-white shadow-[0_0_10px_#ffffff]" />}
              </button>
            ))}
          </div>

          {/* Mini Stats Config */}
          <div className="grid grid-cols-2 gap-3">
            <div className="bg-zinc-900/50 border border-white/5 rounded-2xl p-4 flex flex-col items-center justify-center hover:border-amber-500/30 transition-colors">
              <Clock size={20} className="text-amber-500 mb-2" />
              <div className="text-2xl font-black text-white">
                {leaveRequests.filter(r => ['pending', 'manager_approved', 'hr_approved'].includes(r.status.toLowerCase())).length}
              </div>
              <div className="text-[9px] uppercase font-bold text-zinc-600 tracking-widest">Pending</div>
            </div>
            <div className="bg-zinc-900/50 border border-white/5 rounded-2xl p-4 flex flex-col items-center justify-center hover:border-emerald-500/30 transition-colors">
              <Shield size={20} className="text-emerald-500 mb-2" />
              <div className="text-2xl font-black text-white">{leaveRequests.filter(r => r.status === 'approved').length}</div>
              <div className="text-[9px] uppercase font-bold text-zinc-600 tracking-widest">Approved</div>
            </div>
          </div>
        </motion.div>

        {/* RIGHT VIEWPORT */}
        <div className="flex-1">
          <motion.div
            key={activeTab}
            initial={{ opacity: 0, scale: 0.98 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.3, ease: 'backOut' }}
          >
            {activeTab === 'overview' && (
              <OverviewView
                requests={leaveRequests}
                handleApprove={handleApprove}
                handleReject={handleReject}
                searchTerm={searchTerm}
                setSearchTerm={setSearchTerm}
                filterStatus={filterStatus}
                setFilterStatus={setFilterStatus}
                onViewDetails={setSelectedRequest}
              />
            )}
            {activeTab === 'balances' && <BalancesView />}
            {activeTab === 'myleaves' && <MyLeavesView requests={leaveRequests} userEmail={user?.email} onRefresh={fetchLeaveRequests} />}
          </motion.div>
        </div>
      </div>
    </div>
  );
};

export default LeaveManagement;