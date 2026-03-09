import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
    Briefcase,
    Users,
    TrendingUp,
    AlertTriangle,
    CheckCircle,
    Clock,
    ArrowUpRight,
    ArrowDownRight,
    ChevronRight,
    Star,
    Zap,
    MessageSquare,
    Calendar,
    Target,
    Activity,
    ThumbsUp,
    AlertCircle,
    FileText,
    MoreHorizontal,
    Filter,
    Search,
    DollarSign,
    TrendingDown,
    Sparkles,
    Plus,
    X,
    Globe,
    MapPin,
    Building2,
    Edit,
    Trash2,
    Bot
} from 'lucide-react';
import api from '../utils/api';
import { useAuth } from '../context/AuthContext';
import { showToast as toast } from '../utils/toast';

// ═══════════════════════════════════════════════════════════════════════════════
// ADD CLIENT MODAL COMPONENT (EXPANDED)
// ═══════════════════════════════════════════════════════════════════════════════
const AddClientModal = ({ isOpen, onClose, onAdd, isSubmitting }) => {
    const [formData, setFormData] = useState({
        companyName: '',
        industry: '',
        website: '',
        priority: 'medium',
        
        // Client Login Credentials
        email: '',
        password: '',

        // Extended Details
        overview: '',
        employeeCount: 'unknown',
        revenue: 'unknown',
        potentialValue: '',

        // Location
        city: '',
        state: '',
        country: 'India',
        address: '',

        // Research
        currentTechStack: '',
        currentPainPoints: ''
    });

    // Lock body scroll when modal is open
    useEffect(() => {
        if (isOpen) {
            const scrollbarWidth = window.innerWidth - document.documentElement.clientWidth;
            document.body.style.paddingRight = `${scrollbarWidth}px`;
            document.body.style.overflow = 'hidden';
        } else {
            document.body.style.overflow = '';
            document.body.style.paddingRight = '';
        }
        return () => {
            document.body.style.overflow = '';
            document.body.style.paddingRight = '';
        };
    }, [isOpen]);

    if (!isOpen) return null;

    const handleSubmit = (e) => {
        e.preventDefault();
        onAdd(formData);
    };

    return (
        <div className="fixed inset-0 z-50 flex items-start justify-center bg-black/90 backdrop-blur-md p-4 pt-20 overflow-y-auto">
            <motion.div
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.95 }}
                className="bg-zinc-900 border border-white/10 rounded-3xl w-full max-w-4xl relative shadow-2xl"
            >
                {/* Header */}
                <div className="sticky top-0 z-10 p-6 border-b border-white/10 flex items-center justify-between bg-zinc-900/95 backdrop-blur-xl rounded-t-3xl">
                    <h2 className="text-2xl font-black text-white flex items-center gap-3">
                        <div className="w-10 h-10 rounded-xl bg-emerald-500/20 flex items-center justify-center">
                            <Plus className="text-emerald-400" size={24} />
                        </div>
                        Add New Client Profile
                    </h2>
                    <button onClick={onClose} className="p-2 hover:bg-white/10 rounded-full transition-colors text-zinc-400 hover:text-white">
                        <X size={24} />
                    </button>
                </div>

                {/* Form */}
                <form onSubmit={handleSubmit} className="p-8 space-y-8 max-h-[80vh] overflow-y-auto custom-scrollbar">

                    {/* Section 1: Core Company Info */}
                    <div className="space-y-4">
                        <h3 className="text-sm font-bold text-emerald-400 uppercase tracking-wider flex items-center gap-2">
                            <Building2 size={16} /> Company Essentials
                        </h3>
                        <div className="grid grid-cols-2 gap-6">
                            <div className="space-y-2 col-span-2">
                                <label className="text-xs font-bold text-zinc-400">Company Name *</label>
                                <input
                                    required
                                    type="text"
                                    placeholder="e.g. Acme Corp"
                                    value={formData.companyName}
                                    onChange={e => setFormData({ ...formData, companyName: e.target.value })}
                                    className="w-full bg-black/40 border border-white/10 rounded-xl py-3 px-4 text-white focus:border-emerald-500/50 focus:outline-none transition-all"
                                />
                            </div>
                            <div className="space-y-2">
                                <label className="text-xs font-bold text-zinc-400">Industry</label>
                                <input
                                    type="text"
                                    placeholder="e.g. SaaS, Healthcare"
                                    value={formData.industry}
                                    onChange={e => setFormData({ ...formData, industry: e.target.value })}
                                    className="w-full bg-black/40 border border-white/10 rounded-xl py-3 px-4 text-white focus:border-emerald-500/50 focus:outline-none transition-all"
                                />
                            </div>
                            <div className="space-y-2">
                                <label className="text-xs font-bold text-zinc-400">Website</label>
                                <div className="relative">
                                    <Globe className="absolute left-4 top-1/2 -translate-y-1/2 text-zinc-600" size={16} />
                                    <input
                                        type="text"
                                        placeholder="acme.com"
                                        value={formData.website}
                                        onChange={e => setFormData({ ...formData, website: e.target.value })}
                                        className="w-full bg-black/40 border border-white/10 rounded-xl py-3 pl-11 pr-4 text-white focus:border-emerald-500/50 focus:outline-none transition-all"
                                    />
                                </div>
                            </div>
                            <div className="space-y-2">
                                <label className="text-xs font-bold text-zinc-400">Client Email *</label>
                                <input
                                    required
                                    type="email"
                                    placeholder="client@company.com"
                                    value={formData.email}
                                    onChange={e => setFormData({ ...formData, email: e.target.value })}
                                    autoComplete="off"
                                    className="w-full bg-black/40 border border-white/10 rounded-xl py-3 px-4 text-white focus:border-emerald-500/50 focus:outline-none transition-all"
                                />
                            </div>
                            <div className="space-y-2">
                                <label className="text-xs font-bold text-zinc-400">Client Password *</label>
                                <input
                                    required
                                    type="password"
                                    placeholder="Enter secure password"
                                    value={formData.password}
                                    onChange={e => setFormData({ ...formData, password: e.target.value })}
                                    autoComplete="new-password"
                                    className="w-full bg-black/40 border border-white/10 rounded-xl py-3 px-4 text-white focus:border-emerald-500/50 focus:outline-none transition-all"
                                />
                            </div>
                        </div>
                        <div className="space-y-2">
                            <label className="text-xs font-bold text-zinc-400">Company Overview</label>
                            <textarea
                                rows={3}
                                placeholder="Brief description of what the company does..."
                                value={formData.overview}
                                onChange={e => setFormData({ ...formData, overview: e.target.value })}
                                className="w-full bg-black/40 border border-white/10 rounded-xl py-3 px-4 text-white focus:border-emerald-500/50 focus:outline-none transition-all resize-none"
                            />
                        </div>
                    </div>

                    <div className="h-px bg-white/5 w-full" />

                    {/* Section 2: Validations & Metrics */}
                    <div className="space-y-4">
                        <h3 className="text-sm font-bold text-amber-400 uppercase tracking-wider flex items-center gap-2">
                            <Activity size={16} /> Key Metrics
                        </h3>
                        <div className="grid grid-cols-3 gap-6">
                            <div className="space-y-2">
                                <label className="text-xs font-bold text-zinc-400">Employee Count</label>
                                <select
                                    value={formData.employeeCount}
                                    onChange={e => setFormData({ ...formData, employeeCount: e.target.value })}
                                    className="w-full bg-black/40 border border-white/10 rounded-xl py-3 px-4 text-white focus:border-amber-500/50 focus:outline-none transition-all appearance-none"
                                >
                                    {['unknown', '1-10', '11-50', '51-200', '201-500', '501-1000', '1000+'].map(opt => (
                                        <option key={opt} value={opt} className="bg-zinc-900">{opt}</option>
                                    ))}
                                </select>
                            </div>
                            <div className="space-y-2">
                                <label className="text-xs font-bold text-zinc-400">Annual Revenue</label>
                                <select
                                    value={formData.revenue}
                                    onChange={e => setFormData({ ...formData, revenue: e.target.value })}
                                    className="w-full bg-black/40 border border-white/10 rounded-xl py-3 px-4 text-white focus:border-amber-500/50 focus:outline-none transition-all appearance-none"
                                >
                                    {['unknown', '<1Cr', '1-5Cr', '5-10Cr', '10-50Cr', '50-100Cr', '100Cr+'].map(opt => (
                                        <option key={opt} value={opt} className="bg-zinc-900">{opt}</option>
                                    ))}
                                </select>
                            </div>
                            <div className="space-y-2">
                                <label className="text-xs font-bold text-zinc-400">Potential Value (₹)</label>
                                <input
                                    type="number"
                                    placeholder="e.g. 500000"
                                    value={formData.potentialValue}
                                    onChange={e => setFormData({ ...formData, potentialValue: e.target.value })}
                                    className="w-full bg-black/40 border border-white/10 rounded-xl py-3 px-4 text-white focus:border-amber-500/50 focus:outline-none transition-all"
                                />
                            </div>
                        </div>
                    </div>

                    <div className="h-px bg-white/5 w-full" />

                    {/* Section 3: Location */}
                    <div className="space-y-4">
                        <h3 className="text-sm font-bold text-cyan-400 uppercase tracking-wider flex items-center gap-2">
                            <MapPin size={16} /> Location Details
                        </h3>
                        <div className="grid grid-cols-3 gap-6">
                            <div className="space-y-2">
                                <label className="text-xs font-bold text-zinc-400">City</label>
                                <input
                                    type="text"
                                    value={formData.city}
                                    onChange={e => setFormData({ ...formData, city: e.target.value })}
                                    className="w-full bg-black/40 border border-white/10 rounded-xl py-3 px-4 text-white focus:border-cyan-500/50 focus:outline-none transition-all"
                                />
                            </div>
                            <div className="space-y-2">
                                <label className="text-xs font-bold text-zinc-400">State</label>
                                <input
                                    type="text"
                                    value={formData.state}
                                    onChange={e => setFormData({ ...formData, state: e.target.value })}
                                    className="w-full bg-black/40 border border-white/10 rounded-xl py-3 px-4 text-white focus:border-cyan-500/50 focus:outline-none transition-all"
                                />
                            </div>
                            <div className="space-y-2">
                                <label className="text-xs font-bold text-zinc-400">Country</label>
                                <input
                                    type="text"
                                    value={formData.country}
                                    onChange={e => setFormData({ ...formData, country: e.target.value })}
                                    className="w-full bg-black/40 border border-white/10 rounded-xl py-3 px-4 text-white focus:border-cyan-500/50 focus:outline-none transition-all"
                                />
                            </div>
                        </div>
                    </div>

                </form>

                {/* Footer */}
                <div className="p-6 border-t border-white/10 flex justify-end gap-4 bg-zinc-900 rounded-b-3xl">
                    <button
                        onClick={onClose}
                        className="px-6 py-3 rounded-xl font-bold text-zinc-400 hover:text-white hover:bg-white/5 transition-all"
                    >
                        Cancel
                    </button>
                    <button
                        onClick={handleSubmit}
                        disabled={isSubmitting}
                        className={`
                            px-8 py-3 rounded-xl font-bold text-black text-lg transition-all
                            flex items-center gap-2 shadow-[0_0_20px_rgba(255,255,255,0.2)]
                            ${isSubmitting ? 'bg-zinc-700 cursor-not-allowed' : 'bg-white hover:bg-zinc-200 hover:scale-105'}
                        `}
                    >
                        {isSubmitting ? 'Processing...' : 'Create Full Profile'} <ArrowUpRight size={20} />
                    </button>
                </div>
            </motion.div>
        </div>
    );
};

// ═══════════════════════════════════════════════════════════════════════════════
// EDIT CLIENT MODAL COMPONENT
// ═══════════════════════════════════════════════════════════════════════════════
const EditClientModal = ({ isOpen, onClose, onUpdate, client, isSubmitting }) => {
    const [formData, setFormData] = useState({
        companyName: '',
        industry: '',
        website: '',
        status: 'identified',
        overview: '',
        employeeCount: 'unknown',
        revenue: 'unknown',
        potentialValue: '',
        city: '',
        state: '',
        country: 'India',
        address: '',
        currentTechStack: '',
        currentPainPoints: ''
    });

    useEffect(() => {
        if (client) {
            setFormData({
                companyName: client.name || '',
                industry: client.industry || '',
                website: client.website || '',
                status: client.highlights?.find(h => h.title === 'Client Status')?.value || 'identified',
                overview: client.overview || '',
                employeeCount: client.employeeCount || 'unknown',
                revenue: client.revenue || 'unknown',
                potentialValue: client.potentialValue || '',
                city: client.fullLocation?.city || client.location || '',
                state: client.fullLocation?.state || '',
                country: client.fullLocation?.country || 'India',
                address: client.fullLocation?.address || '',
                currentTechStack: client.currentTechStack || '',
                currentPainPoints: client.currentPainPoints || ''
            });
        }
    }, [client, isOpen]);

    // Lock body scroll when modal is open
    // Lock body scroll when modal is open
    useEffect(() => {
        if (isOpen) {
            const scrollbarWidth = window.innerWidth - document.documentElement.clientWidth;
            document.body.style.paddingRight = `${scrollbarWidth}px`;
            document.body.style.overflow = 'hidden';
        } else {
            document.body.style.overflow = '';
            document.body.style.paddingRight = '';
        }
        return () => {
            document.body.style.overflow = '';
            document.body.style.paddingRight = '';
        };
    }, [isOpen]);

    if (!isOpen) return null;

    const handleSubmit = (e) => {
        e.preventDefault();
        onUpdate(client.id, formData);
    };

    return (
        <div className="fixed inset-0 z-50 flex items-start justify-center bg-black/90 backdrop-blur-md p-4 pt-20 overflow-y-auto">
            <motion.div
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.95 }}
                className="bg-zinc-900 border border-white/10 rounded-3xl w-full max-w-4xl relative shadow-2xl"
            >
                {/* Header */}
                <div className="sticky top-0 z-10 p-6 border-b border-white/10 flex items-center justify-between bg-zinc-900/95 backdrop-blur-xl rounded-t-3xl">
                    <h2 className="text-2xl font-black text-white flex items-center gap-3">
                        <div className="w-10 h-10 rounded-xl bg-zinc-500/20 flex items-center justify-center">
                            <Edit className="text-white" size={24} />
                        </div>
                        Edit Client Details
                    </h2>
                    <button onClick={onClose} className="p-2 hover:bg-white/10 rounded-full transition-colors text-zinc-400 hover:text-white">
                        <X size={24} />
                    </button>
                </div>

                {/* Form */}
                <form onSubmit={handleSubmit} className="p-8 space-y-8 max-h-[80vh] overflow-y-auto custom-scrollbar">
                    {/* Section 1: Core Company Info */}
                    <div className="space-y-4">
                        <h3 className="text-sm font-bold text-emerald-400 uppercase tracking-wider flex items-center gap-2">
                            <Building2 size={16} /> Company Essentials
                        </h3>
                        <div className="grid grid-cols-2 gap-6">
                            <div className="space-y-2 col-span-2">
                                <label className="text-xs font-bold text-zinc-400">Company Name *</label>
                                <input
                                    required
                                    type="text"
                                    value={formData.companyName}
                                    onChange={e => setFormData({ ...formData, companyName: e.target.value })}
                                    className="w-full bg-black/40 border border-white/10 rounded-xl py-3 px-4 text-white focus:border-emerald-500/50 focus:outline-none transition-all"
                                />
                            </div>
                            <div className="space-y-2">
                                <label className="text-xs font-bold text-zinc-400">Industry</label>
                                <input
                                    type="text"
                                    value={formData.industry}
                                    onChange={e => setFormData({ ...formData, industry: e.target.value })}
                                    className="w-full bg-black/40 border border-white/10 rounded-xl py-3 px-4 text-white focus:border-emerald-500/50 focus:outline-none transition-all"
                                />
                            </div>
                            <div className="space-y-2">
                                <label className="text-xs font-bold text-zinc-400">Website</label>
                                <div className="relative">
                                    <Globe className="absolute left-4 top-1/2 -translate-y-1/2 text-zinc-600" size={16} />
                                    <input
                                        type="text"
                                        value={formData.website}
                                        onChange={e => setFormData({ ...formData, website: e.target.value })}
                                        className="w-full bg-black/40 border border-white/10 rounded-xl py-3 pl-11 pr-4 text-white focus:border-emerald-500/50 focus:outline-none transition-all"
                                    />
                                </div>
                            </div>
                        </div>
                        <div className="space-y-2">
                            <label className="text-xs font-bold text-zinc-400">Company Overview</label>
                            <textarea
                                rows={3}
                                value={formData.overview}
                                onChange={e => setFormData({ ...formData, overview: e.target.value })}
                                className="w-full bg-black/40 border border-white/10 rounded-xl py-3 px-4 text-white focus:border-emerald-500/50 focus:outline-none transition-all resize-none"
                            />
                        </div>
                    </div>

                    <div className="h-px bg-white/5 w-full" />

                    {/* Section 2: Key Metrics */}
                    <div className="space-y-4">
                        <h3 className="text-sm font-bold text-amber-400 uppercase tracking-wider flex items-center gap-2">
                            <Activity size={16} /> Key Metrics
                        </h3>
                        <div className="grid grid-cols-3 gap-6">
                            <div className="space-y-2">
                                <label className="text-xs font-bold text-zinc-400">Employee Count</label>
                                <select
                                    value={formData.employeeCount}
                                    onChange={e => setFormData({ ...formData, employeeCount: e.target.value })}
                                    className="w-full bg-black/40 border border-white/10 rounded-xl py-3 px-4 text-white focus:border-amber-500/50 focus:outline-none transition-all appearance-none"
                                >
                                    {['unknown', '1-10', '11-50', '51-200', '201-500', '501-1000', '1000+'].map(opt => (
                                        <option key={opt} value={opt} className="bg-zinc-900">{opt}</option>
                                    ))}
                                </select>
                            </div>
                            <div className="space-y-2">
                                <label className="text-xs font-bold text-zinc-400">Annual Revenue</label>
                                <select
                                    value={formData.revenue}
                                    onChange={e => setFormData({ ...formData, revenue: e.target.value })}
                                    className="w-full bg-black/40 border border-white/10 rounded-xl py-3 px-4 text-white focus:border-amber-500/50 focus:outline-none transition-all appearance-none"
                                >
                                    {['unknown', '<1Cr', '1-5Cr', '5-10Cr', '10-50Cr', '50-100Cr', '100Cr+'].map(opt => (
                                        <option key={opt} value={opt} className="bg-zinc-900">{opt}</option>
                                    ))}
                                </select>
                            </div>
                            <div className="space-y-2">
                                <label className="text-xs font-bold text-zinc-400">Potential Value (₹)</label>
                                <input
                                    type="number"
                                    value={formData.potentialValue}
                                    onChange={e => setFormData({ ...formData, potentialValue: e.target.value })}
                                    className="w-full bg-black/40 border border-white/10 rounded-xl py-3 px-4 text-white focus:border-amber-500/50 focus:outline-none transition-all"
                                />
                            </div>
                        </div>
                    </div>

                    <div className="h-px bg-white/5 w-full" />

                    {/* Section 3: Location */}
                    <div className="space-y-4">
                        <h3 className="text-sm font-bold text-cyan-400 uppercase tracking-wider flex items-center gap-2">
                            <MapPin size={16} /> Location Details
                        </h3>
                        <div className="grid grid-cols-3 gap-6">
                            <div className="space-y-2">
                                <label className="text-xs font-bold text-zinc-400">City</label>
                                <input
                                    type="text"
                                    value={formData.city}
                                    onChange={e => setFormData({ ...formData, city: e.target.value })}
                                    className="w-full bg-black/40 border border-white/10 rounded-xl py-3 px-4 text-white focus:border-cyan-500/50 focus:outline-none transition-all"
                                />
                            </div>
                            <div className="space-y-2">
                                <label className="text-xs font-bold text-zinc-400">State</label>
                                <input
                                    type="text"
                                    value={formData.state}
                                    onChange={e => setFormData({ ...formData, state: e.target.value })}
                                    className="w-full bg-black/40 border border-white/10 rounded-xl py-3 px-4 text-white focus:border-cyan-500/50 focus:outline-none transition-all"
                                />
                            </div>
                            <div className="space-y-2">
                                <label className="text-xs font-bold text-zinc-400">Country</label>
                                <input
                                    type="text"
                                    value={formData.country}
                                    onChange={e => setFormData({ ...formData, country: e.target.value })}
                                    className="w-full bg-black/40 border border-white/10 rounded-xl py-3 px-4 text-white focus:border-cyan-500/50 focus:outline-none transition-all"
                                />
                            </div>
                        </div>
                    </div>

                    <div className="h-px bg-white/5 w-full" />

                    {/* Section 4: Status */}
                    <div className="space-y-4">
                        <h3 className="text-sm font-bold text-purple-400 uppercase tracking-wider flex items-center gap-2">
                            <Target size={16} /> Status & Priority
                        </h3>
                        <div className="space-y-2">
                            <label className="text-xs font-bold text-zinc-400">Client Status</label>
                            <select
                                value={formData.status}
                                onChange={e => setFormData({ ...formData, status: e.target.value })}
                                className="w-full bg-black/40 border border-white/10 rounded-xl py-3 px-4 text-white focus:border-purple-500/50 focus:outline-none transition-all appearance-none"
                            >
                                {['identified', 'researching', 'approved', 'in-contact', 'rejected', 'on-hold'].map(opt => (
                                    <option key={opt} value={opt} className="bg-zinc-900 capitalize">{opt}</option>
                                ))}
                            </select>
                        </div>
                    </div>
                </form>

                {/* Footer */}
                <div className="p-6 border-t border-white/10 flex justify-end gap-4 bg-zinc-900 rounded-b-3xl">
                    <button
                        onClick={onClose}
                        className="px-6 py-3 rounded-xl font-bold text-zinc-400 hover:text-white hover:bg-white/5 transition-all"
                    >
                        Cancel
                    </button>
                    <button
                        onClick={handleSubmit}
                        disabled={isSubmitting}
                        className={`
                            px-8 py-3 rounded-xl font-bold text-black text-lg transition-all
                            flex items-center gap-2 shadow-[0_0_20px_rgba(255,255,255,0.2)]
                            ${isSubmitting ? 'bg-zinc-700 cursor-not-allowed' : 'bg-white hover:bg-zinc-200 hover:scale-105'}
                        `}
                    >
                        {isSubmitting ? 'Updating...' : 'Save Changes'} <ArrowUpRight size={20} />
                    </button>
                </div>
            </motion.div>
        </div>
    );
};


// ═══════════════════════════════════════════════════════════════════════════════
// PREMIUM REUSABLE COMPONENTS - White Neon Theme
// ═══════════════════════════════════════════════════════════════════════════════

// Smart Card Component with white neon glow
const SmartCard = ({ children, className = '', glow = false }) => {
    return (
        <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className={`
                relative bg-gradient-to-b from-zinc-900 to-zinc-950 
                border border-white/10 rounded-3xl 
                shadow-[0_8px_32px_rgba(0,0,0,0.4)]
                hover:border-white/20 hover:shadow-[0_12px_40px_rgba(255,255,255,0.05)]
                transition-all duration-300
                ${glow ? 'shadow-[0_0_40px_rgba(255,255,255,0.1)]' : ''}
                ${className}
            `}
        >
            {children}
        </motion.div>
    );
};

// Progress Ring Component with white neon
const ProgressRing = ({ progress, size = 120, strokeWidth = 8, showLabel = true }) => {
    const radius = (size - strokeWidth) / 2;
    const circumference = radius * 2 * Math.PI;
    const strokeDashoffset = circumference - (progress / 100) * circumference;

    return (
        <div className="relative flex items-center justify-center" style={{ width: size + 40, height: size + 40 }}>
            {/* Circular glow container */}
            <div
                className="absolute inset-0 rounded-full"
                style={{
                    background: 'radial-gradient(circle, rgba(255,255,255,0.15) 0%, rgba(255,255,255,0.05) 40%, transparent 70%)',
                    filter: 'blur(15px)',
                }}
            />

            {/* SVG Ring */}
            <svg
                className="transform -rotate-90 relative z-10"
                width={size}
                height={size}
                style={{
                    filter: 'drop-shadow(0 0 20px rgba(255,255,255,0.6)) drop-shadow(0 0 40px rgba(255,255,255,0.3))'
                }}
            >

                {/* Background ring */}
                <circle
                    cx={size / 2}
                    cy={size / 2}
                    r={radius}
                    stroke="rgba(255,255,255,0.05)"
                    strokeWidth={strokeWidth}
                    fill="none"
                />
                {/* Progress ring */}
                <circle
                    cx={size / 2}
                    cy={size / 2}
                    r={radius}
                    stroke="white"
                    strokeWidth={strokeWidth}
                    fill="none"
                    strokeLinecap="round"
                    strokeDasharray={circumference}
                    strokeDashoffset={strokeDashoffset}
                    style={{
                        transition: 'stroke-dashoffset 1s ease-out'
                    }}
                />
            </svg>

            {showLabel && (
                <div className="absolute inset-0 flex items-center justify-center z-20">
                    <span className="text-2xl font-black text-white" style={{ textShadow: '0 0 20px rgba(255,255,255,0.5)' }}>
                        {progress}%
                    </span>
                </div>
            )}
        </div>
    );
};

// Health Badge with white neon
const HealthBadge = ({ status }) => {
    const config = {
        good: { label: 'Healthy', icon: CheckCircle, glow: 'shadow-[0_0_20px_rgba(255,255,255,0.3)]' },
        warning: { label: 'At Risk', icon: AlertCircle, glow: 'shadow-[0_0_20px_rgba(251,191,36,0.3)]' },
        critical: { label: 'Critical', icon: AlertTriangle, glow: 'shadow-[0_0_20px_rgba(239,68,68,0.3)]' }
    };

    const { label, icon: Icon, glow } = config[status] || config.good;

    return (
        <div className={`
            inline-flex items-center gap-2 px-4 py-2 rounded-xl
            bg-white/5 border border-white/10 ${glow}
        `}>
            <Icon size={16} className="text-white" />
            <span className="text-sm font-bold uppercase tracking-wider text-white">
                {label}
            </span>
        </div>
    );
};

// Stat Card Component
const StatCard = ({ icon: Icon, label, value, trend, trendValue }) => {
    return (
        <div className="bg-white/5 border border-white/10 rounded-2xl p-4 hover:bg-white/10 transition-all group">
            <div className="flex items-start justify-between mb-3">
                <div className="p-2 bg-white/10 rounded-xl group-hover:shadow-[0_0_20px_rgba(255,255,255,0.2)] transition-all">
                    <Icon size={20} className="text-white" />
                </div>
                {trend && (
                    <div className={`flex items-center gap-1 text-xs font-bold ${trend === 'up' ? 'text-emerald-400' : 'text-rose-400'}`}>
                        {trend === 'up' ? <ArrowUpRight size={14} /> : <ArrowDownRight size={14} />}
                        {trendValue}
                    </div>
                )}
            </div>
            <p className="text-2xl font-black text-white mb-1" style={{ textShadow: '0 0 20px rgba(255,255,255,0.3)' }}>
                {value}
            </p>
            <p className="text-xs text-zinc-500 uppercase tracking-wider font-bold">{label}</p>
        </div>
    );
};

// Budget Progress Bar
const BudgetBar = ({ spent, total }) => {
    const percentage = total > 0 ? (spent / total) * 100 : 0;
    const isWarning = percentage > 75;

    return (
        <div className="space-y-2">
            <div className="flex items-center justify-between text-sm">
                <span className="text-zinc-400">Budget Utilization</span>
                <span className={`font-bold ${isWarning ? 'text-amber-400' : 'text-white'}`}>
                    {percentage.toFixed(0)}%
                </span>
            </div>
            <div className="h-3 bg-zinc-800 rounded-full overflow-hidden">
                <motion.div
                    initial={{ width: 0 }}
                    animate={{ width: `${percentage}%` }}
                    transition={{ duration: 1, ease: 'easeOut' }}
                    className={`h-full rounded-full ${isWarning ? 'bg-amber-500' : 'bg-white'}`}
                    style={{
                        boxShadow: isWarning
                            ? '0 0 20px rgba(251,191,36,0.6)'
                            : '0 0 20px rgba(255,255,255,0.6)'
                    }}
                />
            </div>
            <div className="flex items-center justify-between text-xs text-zinc-500">
                <span>Spent: {spent}</span>
                <span>Total: {total}</span>
            </div>
        </div>
    );
};

// Timeline Item
const TimelineItem = ({ title, date, status, isLast }) => {
    const statusConfig = {
        completed: { color: 'bg-white', glow: 'shadow-[0_0_15px_rgba(255,255,255,0.6)]' },
        current: { color: 'bg-cyan-400', glow: 'shadow-[0_0_15px_rgba(34,211,238,0.6)]' },
        upcoming: { color: 'bg-zinc-700', glow: '' }
    };

    const config = statusConfig[status] || statusConfig.upcoming;

    return (
        <div className="flex gap-4">
            <div className="flex flex-col items-center">
                <div className={`w-3 h-3 rounded-full ${config.color} ${config.glow}`} />
                {!isLast && <div className="w-0.5 h-full bg-white/10 mt-2" />}
            </div>
            <div className="pb-6">
                <p className="text-sm font-semibold text-white">{title}</p>
                <p className="text-xs text-zinc-500 mt-1">{date}</p>
            </div>
        </div>
    );
};

// ═══════════════════════════════════════════════════════════════════════════════
// MAIN COMPONENT
// ═══════════════════════════════════════════════════════════════════════════════

const ClientManagementDashboard = () => {
    const [viewLevel, setViewLevel] = useState('companies'); // 'companies', 'projects', 'details'
    const [selectedCompany, setSelectedCompany] = useState(null);
    const [selectedProject, setSelectedProject] = useState(null);

    const [loading, setLoading] = useState(true);
    const [clients, setClients] = useState([]); // This will now act as 'Companies'
    const [searchQuery, setSearchQuery] = useState('');
    const [isAddModalOpen, setIsAddModalOpen] = useState(false);
    const [isEditModalOpen, setIsEditModalOpen] = useState(false);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [isDeleting, setIsDeleting] = useState(false);

    // Create Project States (Same as Manager Dashboard)
    const { user } = useAuth();
    const [showCreateProjectModal, setShowCreateProjectModal] = useState(false);
    const [newProject, setNewProject] = useState({
        name: '',
        description: '',
        deadline: '',
        documentation: ''
    });
    const [srsFile, setSrsFile] = useState(null);
    const [srsFileName, setSrsFileName] = useState('');

    // Edit Project States
    const [isEditProjectModalOpen, setIsEditProjectModalOpen] = useState(false);
    const [editingProject, setEditingProject] = useState(null);

    // Lock body scroll when any modal is open
    useEffect(() => {
        if (isAddModalOpen || isEditModalOpen || showCreateProjectModal || isEditProjectModalOpen) {
            document.body.style.overflow = 'hidden';
        } else {
            document.body.style.overflow = 'unset';
        }
        return () => {
            document.body.style.overflow = 'unset';
        };
    }, [isAddModalOpen, isEditModalOpen, showCreateProjectModal, isEditProjectModalOpen]);

    const handleUpdateClient = async (id, formData) => {
        setIsSubmitting(true);
        try {
            const updateData = {
                companyName: formData.companyName,
                industry: formData.industry,
                website: formData.website,
                status: formData.status,
                overview: formData.overview,
                employeeCount: formData.employeeCount,
                revenue: formData.revenue,
                potentialValue: formData.potentialValue,
                location: {
                    city: formData.city,
                    state: formData.state,
                    country: formData.country,
                    address: formData.address
                },
                research: {
                    currentTechStack: formData.currentTechStack,
                    painPoints: formData.currentPainPoints
                }
            };
            await api.put(`/companies/${id}`, updateData);
            toast.success('Client details updated successfully!');
            const response = await fetchDashboardData();
            // Re-select the updated company to show fresh data
            if (response && response.length > 0) {
                const updated = response.find(c => c.id === id);
                if (updated) setSelectedCompany(updated);
            }
            setIsEditModalOpen(false);
        } catch (error) {
            console.error('Failed to update client:', error);
            toast.error(error.response?.data?.message || 'Failed to update client details');
        } finally {
            setIsSubmitting(false);
        }
    };

    const handleDeleteClient = async (id) => {
        if (!window.confirm('Are you sure you want to delete this client? This will also delete all associated leads.')) {
            return;
        }

        setIsDeleting(true);
        try {
            await api.delete(`/companies/${id}`);
            await fetchDashboardData();
            setSelectedCompany(null);
            setViewLevel('companies');
        } catch (error) {
            console.error('Failed to delete client:', error);
            alert('Failed to delete client');
        } finally {
            setIsDeleting(false);
        }
    };

    // Create Project Handlers (Same as Manager Dashboard)
    const handleProjectInputChange = (e) => {
        const { name, value } = e.target;
        setNewProject({ ...newProject, [name]: value });
    };

    const handleSrsFileChange = (e) => {
        const file = e.target.files[0];
        if (file) {
            if (file.type !== 'application/pdf') {
                toast.error('Please upload a PDF file only');
                e.target.value = '';
                return;
            }
            if (file.size > 10 * 1024 * 1024) {
                toast.error('File size must be less than 10MB');
                e.target.value = '';
                return;
            }
            setSrsFile(file);
            setSrsFileName(file.name);
        }
    };

    const handleCreateProject = async (e) => {
        e.preventDefault();
        setIsSubmitting(true);

        try {
            const formData = new FormData();
            // Prefix the project name with company name if not already there, 
            // since fetchDashboardData filters by companyName.
            const projectName = newProject.name.toLowerCase().includes(selectedCompany.name.toLowerCase())
                ? newProject.name
                : `${selectedCompany.name} - ${newProject.name}`;

            formData.append('name', projectName);
            formData.append('description', newProject.description);
            formData.append('deadline', newProject.deadline);
            formData.append('documentation', newProject.documentation);
            formData.append('assignedManagerId', user.id);

            if (srsFile) {
                formData.append('srsDocument', srsFile);
            }

            // Step 1: Create the project
            const res = await api.post('/projects', formData, {
                headers: { 'Content-Type': 'multipart/form-data' }
            });
            const createdProject = res.data.data;

            toast.success('Project created successfully! Generating AI tasks...');

            // Step 2: Call LLM to generate tasks
            try {
                await api.post('/projects/automate-llm', {
                    projectId: createdProject._id
                });
                toast.success('✨ AI tasks generated successfully!');
            } catch (llmError) {
                console.warn('LLM task generation failed:', llmError);
                toast.warning('Project created, but AI task generation failed.');
            }

            // Refresh data and close
            await fetchDashboardData();
            setShowCreateProjectModal(false);
            setNewProject({ name: '', description: '', deadline: '', documentation: '' });
            setSrsFile(null);
            setSrsFileName('');
        } catch (err) {
            console.error('Error creating project:', err);
            toast.error(err.response?.data?.message || 'Failed to create project');
        } finally {
            setIsSubmitting(false);
        }
    };

    const handleUpdateProject = async (e) => {
        e.preventDefault();
        setIsSubmitting(true);

        try {
            const updateData = {
                name: newProject.name,
                description: newProject.description,
                deadline: newProject.deadline,
                documentation: newProject.documentation
            };

            await api.put(`/projects/${editingProject.id}`, updateData);
            toast.success('Project updated successfully!');
            await fetchDashboardData();
            setIsEditProjectModalOpen(false);
            setEditingProject(null);
            setNewProject({ name: '', description: '', deadline: '', documentation: '' });
        } catch (err) {
            console.error('Error updating project:', err);
            toast.error(err.response?.data?.message || 'Failed to update project');
        } finally {
            setIsSubmitting(false);
        }
    };

    const handleDeleteProject = async (projectId) => {
        if (!window.confirm('Are you sure you want to delete this project? All associated tasks will be removed.')) {
            return;
        }

        try {
            await api.delete(`/projects/${projectId}`);
            toast.success('Project deleted successfully');
            await fetchDashboardData();
        } catch (err) {
            console.error('Error deleting project:', err);
            toast.error('Failed to delete project');
        }
    };

    const fetchDashboardData = async () => {
        try {
            // Fetch both old companies and new clients
            const [ceoDashboardResponse, clientsResponse] = await Promise.all([
                api.get('/ceo/dashboard'),
                api.get('/clients')
            ]);

            const { business } = ceoDashboardResponse.data.data;
            const availableProjects = business.projects || [];
            
            // Get old companies from CEO dashboard
            const oldCompanies = business.clients || [];
            
            // Get new clients from /clients endpoint
            const newClients = clientsResponse.data.data || [];

            // Combine both sources
            const allCompanies = [...oldCompanies, ...newClients.map(client => ({
                _id: client._id,
                companyName: client.companyName,
                industry: client.industry,
                location: client.fullLocation,
                website: client.website,
                overview: client.overview,
                employeeCount: client.employeeCount,
                revenue: client.revenue,
                currentTechStack: client.currentTechStack,
                currentPainPoints: client.currentPainPoints,
                status: client.status || 'active',
                priority: 'medium',
                potentialValue: client.potentialValue,
                updatedAt: client.updatedAt,
                createdAt: client.createdAt,
                email: client.email // Include email for display
            }))];

            // Map real CLIENTS (Companies) to dashboard format
            const realClients = allCompanies.map((company, index) => {
                // Find ALL projects matching this company name
                let matchingProjects = availableProjects.filter(p =>
                    p.name.toLowerCase().includes(company.companyName.toLowerCase()) ||
                    (p.description && p.description.toLowerCase().includes(company.companyName.toLowerCase()))
                );

                // Map each project to a rich format
                const mappedProjects = matchingProjects.map(project => {
                    const deadlineDate = new Date(project.deadline);
                    const now = new Date();
                    const daysLeft = Math.ceil((deadlineDate - now) / (1000 * 60 * 60 * 24));

                    let health = 'good';
                    if (daysLeft < 7 && project.progress < 90) health = 'critical';
                    else if (daysLeft < 14 && project.progress < 70) health = 'warning';

                    const timeline = [
                        { title: 'Engagement Signed', date: new Date(company.createdAt).toLocaleDateString(), status: 'completed' },
                        { title: 'Project Kickoff', date: new Date(project.createdAt).toLocaleDateString(), status: project.status !== 'not-started' ? 'completed' : 'current' },
                        { title: 'Development', date: 'Ongoing', status: project.status === 'in-progress' ? 'current' : 'upcoming' },
                        { title: 'Target Delivery', date: new Date(project.deadline).toLocaleDateString(), status: 'upcoming' }
                    ];

                    const totalBudget = (project.totalPoints || 100) * 5000;
                    const amountReceived = totalBudget * 0.75; // 75% upfront as default logic for now

                    return {
                        id: project._id,
                        name: project.name,
                        description: project.description,
                        status: project.status,
                        health: health,
                        progress: project.progress || 0,
                        satisfaction: 85,
                        manager: project.assignedManager ? `${project.assignedManager.firstName} ${project.assignedManager.lastName}` : (company.assignedTo?.firstName || 'Unassigned'),
                        startDate: project.createdAt,
                        deadline: project.deadline,
                        deliveryDate: deadlineDate.toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' }),
                        daysLeft: daysLeft,
                        budget: totalBudget,
                        spent: (project.completedPoints || 0) * 5000,
                        receivedAmount: amountReceived,
                        receivedDate: new Date(project.createdAt).toLocaleDateString('en-IN', { day: '2-digit', month: 'short' }),
                        phase: project.status,
                        timeline: timeline,
                        keyUpdates: [`State: ${project.status}`, `Health: ${health}`],
                        alerts: health === 'critical' ? [{ id: 1, title: 'Critical Deadline', severity: 'critical' }] : [],

                        // Additional raw data for editing
                        rawDeadline: project.deadline ? new Date(project.deadline).toISOString().split('T')[0] : '',
                        documentation: project.documentation || ''
                    };
                });

                return {
                    id: company._id,
                    name: company.companyName,
                    industry: company.industry,
                    location: company.location?.city || 'Remote',
                    fullLocation: company.location || {},
                    website: company.website,
                    overview: company.overview,
                    employeeCount: company.employeeCount,
                    revenue: company.revenue,
                    currentTechStack: company.currentTechStack,
                    currentPainPoints: company.currentPainPoints,
                    projects: mappedProjects,
                    status: company.status,
                    priority: company.priority,
                    potentialValue: company.potentialValue,
                    updatedAt: company.updatedAt,
                    highlights: [
                        { id: 1, title: 'Client Status', type: 'info', value: company.status },
                        { id: 2, title: 'Engagement', type: 'success', value: company.priority }
                    ]
                };
            });

            setClients(realClients);
            setLoading(false);
            return realClients;
        } catch (error) {
            console.error('Error fetching dashboard data:', error);
            setLoading(false);
            setClients([]);
            setSelectedCompany(null);
            setSelectedProject(null);
        }
    };

    useEffect(() => {
        fetchDashboardData();
    }, []);

    const handleAddClient = async (formData) => {
        setIsSubmitting(true);
        try {
            // Send client data with credentials to backend
            const payload = {
                companyName: formData.companyName,
                email: formData.email,
                password: formData.password,
                industry: formData.industry,
                website: formData.website || '',
                overview: formData.overview,
                employeeCount: formData.employeeCount,
                revenue: formData.revenue,
                potentialValue: formData.potentialValue || 0,
                currentTechStack: formData.currentTechStack,
                currentPainPoints: formData.currentPainPoints,
                fullLocation: {
                    city: formData.city,
                    state: formData.state,
                    country: formData.country,
                    address: formData.address
                }
            };

            await api.post('/clients', payload);

            // Refresh dashboard
            await fetchDashboardData();
            setIsAddModalOpen(false);
            toast.success('Client account created successfully!');
            setSearchQuery(formData.companyName); // Filter to new client
        } catch (error) {
            console.error('Failed to add client:', error);
            toast.error(error.response?.data?.message || 'Failed to create client account');
        } finally {
            setIsSubmitting(false);
        }
    };

    const filteredClients = clients.filter(client => {
        const query = searchQuery.toLowerCase();
        const matchesName = client.name?.toLowerCase().includes(query);
        const matchesProject = client.projects?.some(p => p.name?.toLowerCase().includes(query));
        return matchesName || matchesProject;
    });

    // Format currency
    const formatCurrency = (amount) => {
        return `₹${(amount / 100000).toFixed(2)}L`;
    };

    if (loading) {
        return (
            <div className="min-h-screen bg-black flex items-center justify-center">
                <div className="flex flex-col items-center gap-4">
                    <div className="w-16 h-16 border-4 border-white/10 border-t-white rounded-full animate-spin"
                        style={{ boxShadow: '0 0 30px rgba(255,255,255,0.3)' }} />
                    <p className="text-zinc-500 text-sm font-bold">Loading Client Intelligence...</p>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-black p-6 space-y-6">
            <AddClientModal
                isOpen={isAddModalOpen}
                onClose={() => setIsAddModalOpen(false)}
                onAdd={handleAddClient}
                isSubmitting={isSubmitting}
            />

            <EditClientModal
                isOpen={isEditModalOpen}
                onClose={() => setIsEditModalOpen(false)}
                onUpdate={handleUpdateClient}
                client={selectedCompany}
                isSubmitting={isSubmitting}
            />

            {/* HEADER SECTION */}
            <motion.div
                initial={{ opacity: 0, y: -20 }}
                animate={{ opacity: 1, y: 0 }}
                className="flex items-center justify-between"
            >
                <div className="flex items-center gap-6">
                    {viewLevel !== 'companies' && (
                        <button
                            onClick={() => {
                                if (viewLevel === 'details') {
                                    setViewLevel('projects');
                                    setSelectedProject(null);
                                } else {
                                    setViewLevel('companies');
                                    setSelectedCompany(null);
                                }
                            }}
                            className="w-12 h-12 rounded-2xl bg-white/5 border border-white/10 flex items-center justify-center text-white hover:bg-white/10 transition-all group"
                        >
                            <X size={20} className="group-hover:rotate-90 transition-transform" />
                        </button>
                    )}
                    <div>
                        <div className="flex items-center gap-3">
                            <Sparkles size={32} className="text-white" style={{ filter: 'drop-shadow(0 0 10px rgba(255,255,255,0.5))' }} />
                            <div className="flex items-center gap-2">
                                <h1 className="text-4xl font-black text-white tracking-tight cursor-pointer hover:opacity-80 transition-opacity"
                                    onClick={() => { setViewLevel('companies'); setSelectedCompany(null); setSelectedProject(null); }}
                                    style={{ textShadow: '0 0 30px rgba(255,255,255,0.3)' }}>
                                    Intelligence
                                </h1>
                                {selectedCompany && (
                                    <>
                                        <ChevronRight size={24} className="text-zinc-700" />
                                        <h2 className="text-3xl font-black text-zinc-400">{selectedCompany.name}</h2>
                                    </>
                                )}
                                {selectedProject && (
                                    <>
                                        <ChevronRight size={24} className="text-zinc-700" />
                                        <h2 className="text-3xl font-black text-white/60">{selectedProject.name}</h2>
                                    </>
                                )}
                            </div>
                        </div>
                    </div>
                </div>

                <div className="flex items-center gap-3">
                    <div className="relative">
                        <Search size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-zinc-500" />
                        <input
                            type="text"
                            placeholder="Search intelligence..."
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            className="w-80 pl-12 pr-4 py-3 bg-zinc-900/80 border border-white/10 rounded-2xl text-white text-sm placeholder:text-zinc-600 focus:outline-none focus:border-white/30 transition-all"
                        />
                    </div>

                    {viewLevel === 'companies' && (
                        <button
                            onClick={() => setIsAddModalOpen(true)}
                            className="flex items-center gap-2 px-6 py-3 bg-white text-black rounded-2xl font-bold hover:bg-zinc-200 transition-all shadow-[0_0_20px_rgba(255,255,255,0.2)]"
                        >
                            <Plus size={20} />
                            Add Client
                        </button>
                    )}

                    {viewLevel === 'projects' && (
                        <button
                            onClick={() => setShowCreateProjectModal(true)}
                            className="flex items-center gap-2 px-6 py-3 bg-white text-black rounded-2xl font-bold hover:bg-zinc-200 transition-all shadow-[0_0_20px_rgba(255,255,255,0.2)]"
                        >
                            <Plus size={20} />
                            Add Project
                        </button>
                    )}
                </div>
            </motion.div>

            {/* EMPTY STATE */}
            {!loading && clients.length === 0 && (
                <div className="flex flex-col items-center justify-center h-96 border border-zinc-800 rounded-3xl bg-zinc-900/50">
                    <div className="p-6 bg-zinc-800/50 rounded-full mb-6 relative">
                        <Users size={48} className="text-zinc-600" />
                    </div>
                    <h3 className="text-2xl font-black text-white mb-2">No Active Clients Found</h3>
                    <p className="text-zinc-500 text-sm max-w-sm text-center mb-6">
                        The Client Database is strictly connected to live data.
                    </p>
                    <button
                        onClick={() => setIsAddModalOpen(true)}
                        className="flex items-center gap-2 px-8 py-4 bg-white text-black rounded-2xl font-bold hover:bg-zinc-200 transition-all hover:scale-105"
                    >
                        <Plus size={20} />
                        Add First Client
                    </button>
                </div>
            )}

            <AnimatePresence mode="wait">
                {/* STAGE 1: COMPANIES GRID */}
                {viewLevel === 'companies' && (
                    <motion.div
                        key="companies-grid"
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -20 }}
                        className="grid grid-cols-3 gap-6 pt-4"
                    >
                        {filteredClients.map((company, idx) => (
                            <motion.button
                                key={company.id}
                                whileHover={{ scale: 1.02, y: -5 }}
                                whileTap={{ scale: 0.98 }}
                                onClick={() => {
                                    setSelectedCompany(company);
                                    setViewLevel('projects');
                                    setSearchQuery('');
                                }}
                                className="group relative bg-zinc-900/50 border border-white/5 rounded-3xl p-6 text-left hover:border-white/20 hover:bg-zinc-900/80 transition-all overflow-hidden"
                            >
                                {/* Background glow on hover */}
                                <div className="absolute inset-0 bg-gradient-to-br from-white/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />

                                <div className="relative z-10 space-y-4">
                                    <div className="flex items-center justify-between">
                                        <div className="w-14 h-14 rounded-2xl bg-white/5 border border-white/10 flex items-center justify-center group-hover:bg-white/10 group-hover:border-white/20 transition-all shadow-xl">
                                            <Building2 size={28} className="text-zinc-400 group-hover:text-white transition-colors" />
                                        </div>
                                        <div className="flex flex-col items-end gap-2">
                                            <div className="flex items-center gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                                                <button
                                                    onClick={(e) => {
                                                        e.stopPropagation();
                                                        setSelectedCompany(company);
                                                        setIsEditModalOpen(true);
                                                    }}
                                                    className="p-2 bg-white/5 border border-white/10 rounded-xl text-zinc-400 hover:text-white hover:border-white/30 transition-all"
                                                    title="Edit Client"
                                                >
                                                    <Edit size={16} />
                                                </button>
                                                <button
                                                    onClick={(e) => {
                                                        e.stopPropagation();
                                                        handleDeleteClient(company.id);
                                                    }}
                                                    disabled={isDeleting}
                                                    className="p-2 bg-rose-500/10 border border-rose-500/20 rounded-xl text-rose-500 hover:bg-rose-500/20 transition-all"
                                                    title="Delete Client"
                                                >
                                                    <Trash2 size={16} />
                                                </button>
                                            </div>
                                            <div className="text-right">
                                                <p className="text-2xl font-black text-white">{company.projects.length}</p>
                                                <p className="text-[10px] text-zinc-500 uppercase font-bold tracking-widest">Projects</p>
                                            </div>
                                        </div>
                                    </div>

                                    <div>
                                        <h3 className="text-2xl font-black text-white mb-1 group-hover:text-white transition-colors">{company.name}</h3>
                                        <p className="text-sm text-zinc-500 group-hover:text-zinc-400 transition-colors uppercase tracking-wider font-bold">
                                            {company.industry} • {company.location}
                                        </p>
                                    </div>

                                    <div className="flex items-center gap-2 pt-2">
                                        {company.highlights.map(h => (
                                            <span key={h.id} className="px-3 py-1 bg-white/5 border border-white/5 rounded-lg text-[10px] font-bold text-zinc-400 uppercase">
                                                {h.value}
                                            </span>
                                        ))}
                                    </div>
                                </div>
                            </motion.button>
                        ))}
                    </motion.div>
                )}

                {/* STAGE 2: PROJECTS LIST */}
                {viewLevel === 'projects' && selectedCompany && (
                    <motion.div
                        key="projects-list"
                        initial={{ opacity: 0, x: 20 }}
                        animate={{ opacity: 1, x: 0 }}
                        exit={{ opacity: 0, x: -20 }}
                        className="space-y-4"
                    >
                        <div className="flex items-center justify-between px-2">
                            <h3 className="text-xl font-black text-white/50 uppercase tracking-widest">Available Projects</h3>
                            <p className="text-sm text-zinc-500">
                                {selectedCompany.projects.length === 0 ? 'No active engagements found' : 'Pick a project to view deep intelligence'}
                            </p>
                        </div>

                        <div className="grid grid-cols-1 gap-4">
                            {selectedCompany.projects.length > 0 ? (
                                selectedCompany.projects.map((project, idx) => (
                                    <motion.button
                                        key={project.id}
                                        initial={{ opacity: 0, x: -20 }}
                                        animate={{ opacity: 1, x: 0 }}
                                        transition={{ delay: idx * 0.1 }}
                                        onClick={() => {
                                            setSelectedProject(project);
                                            setViewLevel('details');
                                        }}
                                        className="group flex items-center gap-6 p-6 bg-zinc-900/50 border border-white/5 rounded-3xl hover:border-white/20 hover:bg-zinc-900 transition-all text-left"
                                    >
                                        <div className="w-16 h-16 rounded-2xl bg-white/5 flex items-center justify-center border border-white/10 group-hover:border-white/30 transition-all">
                                            <Briefcase size={32} className="text-zinc-500 group-hover:text-white transition-colors" />
                                        </div>

                                        <div className="flex-1">
                                            <div className="flex items-center gap-3 mb-1">
                                                <h4 className="text-2xl font-black text-white">{project.name}</h4>
                                                <HealthBadge status={project.health} />
                                            </div>
                                            <p className="text-zinc-500 text-sm line-clamp-1">{project.description}</p>
                                        </div>

                                        <div className="px-8 border-x border-white/5 text-center min-w-[150px]">
                                            <p className="text-3xl font-black text-white" style={{ textShadow: '0 0 20px rgba(255,255,255,0.3)' }}>
                                                {project.progress}%
                                            </p>
                                            <p className="text-[10px] text-zinc-500 uppercase font-black tracking-widest">Progress</p>
                                        </div>

                                        <div className="px-8 border-x border-white/5 text-center min-w-[180px]">
                                            <p className="text-2xl font-black text-emerald-400" style={{ textShadow: '0 0 20px rgba(52,211,153,0.3)' }}>
                                                {formatCurrency(project.budget)}
                                            </p>
                                            <p className="text-[10px] text-zinc-500 uppercase font-black tracking-widest">Total Budget</p>
                                        </div>

                                        <div className="text-right min-w-[200px] space-y-1">
                                            <p className="text-sm font-bold text-white uppercase tracking-wider">{project.manager}</p>
                                            <p className="text-xs text-zinc-500">Manager Assigned</p>
                                            <div className="flex items-center justify-end gap-2 mt-2">
                                                <div className="w-2 h-2 rounded-full bg-white shadow-[0_0_8px_white]" />
                                                <span className="text-[10px] text-zinc-400 font-bold uppercase">{project.phase}</span>
                                            </div>
                                        </div>

                                        <div className="flex flex-col gap-2 opacity-0 group-hover:opacity-100 transition-all ml-4">
                                            <button
                                                onClick={(e) => {
                                                    e.stopPropagation();
                                                    setEditingProject(project);
                                                    setNewProject({
                                                        name: project.name,
                                                        description: project.description,
                                                        deadline: project.rawDeadline,
                                                        documentation: project.documentation
                                                    });
                                                    setIsEditProjectModalOpen(true);
                                                }}
                                                className="p-2 bg-white/5 border border-white/10 rounded-xl text-zinc-400 hover:text-white hover:border-white/30 transition-all"
                                                title="Edit Project"
                                            >
                                                <Edit size={16} />
                                            </button>
                                            <button
                                                onClick={(e) => {
                                                    e.stopPropagation();
                                                    handleDeleteProject(project.id);
                                                }}
                                                className="p-2 bg-rose-500/10 border border-rose-500/20 rounded-xl text-rose-500 hover:bg-rose-500/20 transition-all"
                                                title="Delete Project"
                                            >
                                                <Trash2 size={16} />
                                            </button>
                                        </div>

                                        <ChevronRight className="text-zinc-700 group-hover:text-white group-hover:translate-x-1 transition-all" size={24} />
                                    </motion.button>
                                ))
                            ) : (
                                <div className="flex flex-col items-center justify-center py-20 bg-zinc-900/30 border border-dashed border-white/5 rounded-3xl">
                                    <div className="p-4 bg-white/5 rounded-2xl mb-4">
                                        <Briefcase size={32} className="text-zinc-700" />
                                    </div>
                                    <h4 className="text-lg font-bold text-white mb-1">No Active Projects</h4>
                                </div>
                            )}
                        </div>
                    </motion.div>
                )}

                {/* STAGE 3: PROJECT DETAILS (RE-USING PREVIOUS VIEW) */}
                {viewLevel === 'details' && selectedProject && (
                    <motion.div
                        key="project-details"
                        initial={{ opacity: 0, scale: 0.98 }}
                        animate={{ opacity: 1, scale: 1 }}
                        exit={{ opacity: 0, scale: 1.02 }}
                        className="space-y-6"
                    >
                        {/* OVERVIEW STATS GRID */}
                        <div className="grid grid-cols-4 gap-4">
                            <StatCard
                                icon={Target}
                                label="Completion"
                                value={`${selectedProject.progress}%`}
                                trend="up"
                                trendValue="+5%"
                            />
                            <StatCard
                                icon={DollarSign}
                                label="Amount Received"
                                value={formatCurrency(selectedProject.receivedAmount)}
                                trend="up"
                                trendValue={`On ${selectedProject.receivedDate}`}
                            />
                            <StatCard
                                icon={DollarSign}
                                label="Budget Spent"
                                value={formatCurrency(selectedProject.spent)}
                                trend="up"
                                trendValue={`${selectedProject.budget > 0 ? ((selectedProject.spent / selectedProject.budget) * 100).toFixed(0) : 0}%`}
                            />
                            <StatCard
                                icon={Calendar}
                                label="Delivery Date"
                                value={selectedProject.deliveryDate}
                                trend={selectedProject.daysLeft > 0 ? 'up' : 'down'}
                                trendValue={selectedProject.daysLeft > 0 ? `${selectedProject.daysLeft} days left` : 'Overdue'}
                            />
                        </div>

                        {/* MAIN CONTENT GRID */}
                        <div className="grid grid-cols-12 gap-6">
                            {/* LEFT COLUMN */}
                            <div className="col-span-8 space-y-6">
                                <SmartCard className="p-8" glow>
                                    <div className="flex items-center justify-between mb-8">
                                        <div>
                                            <h3 className="text-3xl font-black text-white mb-2">Technical Delivery</h3>
                                            <div className="flex items-center gap-4">
                                                <p className="text-zinc-500 font-medium">Stage: <span className="text-white font-bold px-2 py-1 bg-white/10 rounded-lg">{selectedProject.phase}</span></p>
                                                <div className="w-px h-4 bg-white/10" />
                                                <p className="text-zinc-500 font-medium">Manager: <span className="text-white font-bold">{selectedProject.manager}</span></p>
                                            </div>
                                        </div>
                                        <div className="p-4">
                                            <ProgressRing progress={selectedProject.progress} size={100} strokeWidth={10} />
                                        </div>
                                    </div>
                                    <BudgetBar spent={selectedProject.spent} total={selectedProject.budget} />
                                </SmartCard>

                                <div className="grid grid-cols-2 gap-6">
                                    <SmartCard className="p-6">
                                        <div className="flex items-center gap-3 mb-6">
                                            <Calendar className="text-zinc-400" size={20} />
                                            <h3 className="text-lg font-black text-white uppercase tracking-widest">Timeline</h3>
                                        </div>
                                        <div className="space-y-1">
                                            {selectedProject.timeline.map((item, idx) => (
                                                <TimelineItem
                                                    key={idx}
                                                    {...item}
                                                    isLast={idx === selectedProject.timeline.length - 1}
                                                />
                                            ))}
                                        </div>
                                    </SmartCard>

                                    <SmartCard className="p-6">
                                        <div className="flex items-center gap-3 mb-6">
                                            <Zap className="text-zinc-400" size={20} />
                                            <h3 className="text-lg font-black text-white uppercase tracking-widest">Key Updates</h3>
                                        </div>
                                        <div className="space-y-3">
                                            {selectedProject.keyUpdates.map((update, idx) => (
                                                <div key={idx} className="flex items-start gap-3 p-3 bg-white/5 rounded-xl border border-white/5">
                                                    <CheckCircle size={16} className="text-white mt-0.5" />
                                                    <span className="text-sm text-zinc-400">{update}</span>
                                                </div>
                                            ))}
                                        </div>
                                    </SmartCard>
                                </div>
                            </div>

                            {/* RIGHT COLUMN */}
                            <div className="col-span-4 space-y-6">
                                <SmartCard className="p-6">
                                    <div className="flex items-center gap-2 mb-6">
                                        <AlertTriangle size={20} className="text-amber-400" />
                                        <h3 className="text-lg font-black text-zinc-300 uppercase tracking-widest">Attention Required</h3>
                                    </div>
                                    {selectedProject.alerts.length > 0 ? (
                                        <div className="space-y-3">
                                            {selectedProject.alerts.map(alert => (
                                                <div key={alert.id} className="p-4 bg-rose-500/10 border border-rose-500/20 rounded-2xl">
                                                    <p className="text-rose-400 font-black text-sm mb-1">{alert.title}</p>
                                                    <p className="text-xs text-zinc-500">Immediate action advised by project AI lead.</p>
                                                </div>
                                            ))}
                                        </div>
                                    ) : (
                                        <div className="py-8 text-center bg-white/5 rounded-2xl border border-dashed border-white/10">
                                            <p className="text-sm font-bold text-zinc-500">No Critical Alerts</p>
                                        </div>
                                    )}
                                </SmartCard>

                                <SmartCard className="p-6">
                                    <div className="flex items-center gap-3 mb-6">
                                        <Globe className="text-zinc-500" size={20} />
                                        <h3 className="text-lg font-black text-white uppercase tracking-widest">Client Context</h3>
                                    </div>
                                    <div className="space-y-4">
                                        <div>
                                            <p className="text-[10px] text-zinc-500 font-black uppercase tracking-widest mb-1">HQ Location</p>
                                            <p className="text-sm font-bold text-white">{selectedCompany.location}</p>
                                        </div>
                                        <div>
                                            <p className="text-[10px] text-zinc-500 font-black uppercase tracking-widest mb-1">Industry Vertical</p>
                                            <p className="text-sm font-bold text-white">{selectedCompany.industry}</p>
                                        </div>
                                        <div>
                                            <p className="text-[10px] text-zinc-500 font-black uppercase tracking-widest mb-1">Primary Website</p>
                                            <p className="text-sm font-bold text-white underline decoration-white/20 truncate">{selectedCompany.website || 'N/A'}</p>
                                        </div>
                                    </div>
                                </SmartCard>
                            </div>
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>

            {/* CREATE PROJECT MODAL */}
            {showCreateProjectModal && (
                <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/80 backdrop-blur-sm overflow-y-auto p-4">
                    <motion.div
                        initial={{ opacity: 0, scale: 0.95 }}
                        animate={{ opacity: 1, scale: 1 }}
                        className="bg-zinc-900 border border-white/10 rounded-3xl shadow-2xl w-full max-w-2xl max-h-[90vh] overflow-y-auto"
                    >
                        <div className="flex justify-between items-center p-8 border-b border-white/5 sticky top-0 bg-zinc-900 z-10">
                            <div className="flex items-center gap-3">
                                <div className="p-3 rounded-2xl bg-white/5 border border-white/10">
                                    <Bot className="w-6 h-6 text-white" />
                                </div>
                                <div>
                                    <h3 className="text-2xl font-black text-white">Create New Project</h3>
                                    <p className="text-xs text-zinc-500 font-bold uppercase tracking-widest">AI-powered task generation enabled</p>
                                </div>
                            </div>
                            <button
                                onClick={() => {
                                    setShowCreateProjectModal(false);
                                    setNewProject({ name: '', description: '', deadline: '', documentation: '' });
                                    setSrsFile(null);
                                    setSrsFileName('');
                                }}
                                className="w-10 h-10 rounded-xl bg-white/5 flex items-center justify-center text-zinc-500 hover:text-white"
                            >
                                <X size={20} />
                            </button>
                        </div>

                        <form onSubmit={handleCreateProject}>
                            <div className="p-8 space-y-6">
                                <div className="bg-gradient-to-r from-white/10 via-white/5 to-transparent border border-white/10 rounded-2xl p-6">
                                    <div className="flex items-start gap-4">
                                        <Sparkles className="w-6 h-6 text-white mt-0.5" />
                                        <div className="text-sm">
                                            <p className="font-black text-white mb-1 uppercase tracking-wider">AI Automation Active</p>
                                            <p className="text-zinc-400 font-medium leading-relaxed">Tasks will be intelligently generated for the team.</p>
                                        </div>
                                    </div>
                                </div>

                                <div className="space-y-2">
                                    <label className="text-xs font-black text-zinc-500 uppercase tracking-widest ml-1">Project Name *</label>
                                    <input
                                        type="text"
                                        name="name"
                                        required
                                        value={newProject.name}
                                        onChange={handleProjectInputChange}
                                        className="w-full bg-black/50 border border-white/10 rounded-2xl p-4 text-white focus:outline-none"
                                    />
                                </div>

                                <div className="space-y-2">
                                    <label className="text-xs font-black text-zinc-500 uppercase tracking-widest ml-1">Description *</label>
                                    <textarea
                                        name="description"
                                        required
                                        value={newProject.description}
                                        onChange={handleProjectInputChange}
                                        rows={4}
                                        className="w-full bg-black/50 border border-white/10 rounded-2xl p-4 text-white focus:outline-none resize-none"
                                    />
                                </div>

                                <div className="grid grid-cols-2 gap-6">
                                    <div className="space-y-2">
                                        <label className="text-xs font-black text-zinc-500 uppercase tracking-widest ml-1">Deadline *</label>
                                        <input
                                            type="date"
                                            name="deadline"
                                            required
                                            value={newProject.deadline}
                                            onChange={handleProjectInputChange}
                                            className="w-full bg-black/50 border border-white/10 rounded-2xl p-4 text-white focus:outline-none [color-scheme:dark]"
                                        />
                                    </div>
                                    <div className="space-y-2">
                                        <label className="text-xs font-black text-zinc-500 uppercase tracking-widest ml-1">SRS Document</label>
                                        <input type="file" accept=".pdf" onChange={handleSrsFileChange} className="hidden" id="srs-upload" />
                                        <label htmlFor="srs-upload" className="flex items-center gap-2 p-4 bg-black/50 border border-dashed border-white/10 rounded-2xl text-zinc-500 cursor-pointer overflow-hidden truncate">
                                            <Plus size={16} /> {srsFileName || "Upload PDF"}
                                        </label>
                                    </div>
                                </div>
                            </div>

                            <div className="p-8 border-t border-white/5 bg-black/20 flex justify-end gap-3">
                                <button
                                    type="button"
                                    onClick={() => setShowCreateProjectModal(false)}
                                    className="px-8 py-3 rounded-2xl font-bold text-zinc-500 hover:text-white"
                                >
                                    Cancel
                                </button>
                                <button
                                    type="submit"
                                    disabled={isSubmitting}
                                    className="px-10 py-3 bg-white text-black rounded-2xl font-black flex items-center gap-2"
                                >
                                    {isSubmitting ? <div className="w-5 h-5 border-2 border-black/20 border-t-black rounded-full animate-spin" /> : <><Zap size={16} /> Generate</>}
                                </button>
                            </div>
                        </form>
                    </motion.div>
                </div>
            )}

            {/* EDIT PROJECT MODAL */}
            {isEditProjectModalOpen && editingProject && (
                <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/80 backdrop-blur-sm overflow-y-auto p-4">
                    <motion.div
                        initial={{ opacity: 0, scale: 0.95 }}
                        animate={{ opacity: 1, scale: 1 }}
                        className="bg-zinc-900 border border-white/10 rounded-3xl shadow-2xl w-full max-w-2xl max-h-[90vh] overflow-y-auto"
                    >
                        <div className="flex justify-between items-center p-8 border-b border-white/5 sticky top-0 bg-zinc-900 z-10">
                            <div className="flex items-center gap-3">
                                <div className="p-3 rounded-2xl bg-white/5 border border-white/10">
                                    <Edit size={24} className="text-white" />
                                </div>
                                <div>
                                    <h3 className="text-2xl font-black text-white">Edit Project</h3>
                                    <p className="text-xs text-zinc-500 font-bold uppercase tracking-widest">Update project details</p>
                                </div>
                            </div>
                            <button
                                onClick={() => setIsEditProjectModalOpen(false)}
                                className="w-10 h-10 rounded-xl bg-white/5 flex items-center justify-center text-zinc-500 hover:text-white"
                            >
                                <X size={20} />
                            </button>
                        </div>

                        <form onSubmit={handleUpdateProject}>
                            <div className="p-8 space-y-6">
                                <div className="space-y-2">
                                    <label className="text-xs font-black text-zinc-500 uppercase tracking-widest ml-1">Project Name *</label>
                                    <input
                                        type="text"
                                        name="name"
                                        required
                                        value={newProject.name}
                                        onChange={handleProjectInputChange}
                                        className="w-full bg-black/50 border border-white/10 rounded-2xl p-4 text-white focus:outline-none"
                                    />
                                </div>

                                <div className="space-y-2">
                                    <label className="text-xs font-black text-zinc-500 uppercase tracking-widest ml-1">Description *</label>
                                    <textarea
                                        name="description"
                                        required
                                        value={newProject.description}
                                        onChange={handleProjectInputChange}
                                        rows={4}
                                        className="w-full bg-black/50 border border-white/10 rounded-2xl p-4 text-white focus:outline-none resize-none"
                                    />
                                </div>

                                <div className="space-y-2">
                                    <label className="text-xs font-black text-zinc-500 uppercase tracking-widest ml-1">Deadline *</label>
                                    <input
                                        type="date"
                                        name="deadline"
                                        required
                                        value={newProject.deadline}
                                        onChange={handleProjectInputChange}
                                        className="w-full bg-black/50 border border-white/10 rounded-2xl p-4 text-white focus:outline-none [color-scheme:dark]"
                                    />
                                </div>

                                <div className="space-y-2">
                                    <label className="text-xs font-black text-zinc-500 uppercase tracking-widest ml-1">Documentation Links</label>
                                    <textarea
                                        name="documentation"
                                        value={newProject.documentation}
                                        onChange={handleProjectInputChange}
                                        rows={2}
                                        className="w-full bg-black/50 border border-white/10 rounded-2xl p-4 text-white focus:outline-none resize-none"
                                    />
                                </div>
                            </div>

                            <div className="p-8 border-t border-white/5 bg-black/20 flex justify-end gap-3">
                                <button
                                    type="button"
                                    onClick={() => setIsEditProjectModalOpen(false)}
                                    className="px-8 py-3 rounded-2xl font-bold text-zinc-500 hover:text-white"
                                >
                                    Cancel
                                </button>
                                <button
                                    type="submit"
                                    disabled={isSubmitting}
                                    className="px-10 py-3 bg-white text-black rounded-2xl font-black flex items-center gap-2"
                                >
                                    {isSubmitting ? <div className="w-5 h-5 border-2 border-black/20 border-t-black rounded-full animate-spin" /> : <><Edit size={20} /> Update</>}
                                </button>
                            </div>
                        </form>
                    </motion.div>
                </div>
            )}
        </div>
    );
};

export default ClientManagementDashboard;
