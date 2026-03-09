import React, { useState } from 'react';
import { motion } from 'framer-motion';
import {
    LayoutDashboard,
    Calendar,
    FileText,
    MessageSquare,
    DollarSign,
    LogOut,
    User,
    Menu,
    X
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useNavigate } from 'react-router-dom';

// Import dashboard pages (we'll create these)
import ClientDashboardHome from './client/ClientDashboardHome';
import ClientTimeline from './client/ClientTimeline';
import ClientDocuments from './client/ClientDocuments';
import ClientChat from './client/ClientChat';
import ClientFinancials from './client/ClientFinancials';

const ClientDashboard = () => {
    const { user, logout } = useAuth();
    const navigate = useNavigate();
    const [activePage, setActivePage] = useState('dashboard');
    const [sidebarOpen, setSidebarOpen] = useState(true);

    const menuItems = [
        { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard },
        { id: 'timeline', label: 'Timeline', icon: Calendar },
        { id: 'documents', label: 'Documents', icon: FileText },
        { id: 'chat', label: 'Team Chat', icon: MessageSquare },
        { id: 'financials', label: 'Billing', icon: DollarSign },
    ];

    const handleLogout = () => {
        logout();
        navigate('/');
    };

    const renderPage = () => {
        switch (activePage) {
            case 'dashboard':
                return <ClientDashboardHome />;
            case 'timeline':
                return <ClientTimeline />;
            case 'documents':
                return <ClientDocuments />;
            case 'chat':
                return <ClientChat />;
            case 'financials':
                return <ClientFinancials />;
            default:
                return <ClientDashboardHome />;
        }
    };

    return (
        <div className="min-h-screen bg-black flex">
            {/* Sidebar */}
            <motion.div
                initial={{ x: -300 }}
                animate={{ x: sidebarOpen ? 0 : -280 }}
                className="w-72 bg-zinc-900 border-r border-white/10 flex flex-col fixed h-full z-50"
            >
                {/* Logo */}
                <div className="p-6 border-b border-white/10">
                    <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-xl bg-emerald-500 flex items-center justify-center text-white font-black">
                            {user?.companyName?.charAt(0) || 'C'}
                        </div>
                        <div>
                            <h2 className="text-white font-bold">{user?.companyName}</h2>
                            <p className="text-xs text-zinc-400">Client Portal</p>
                        </div>
                    </div>
                </div>

                {/* Navigation */}
                <nav className="flex-1 p-4 space-y-2 overflow-y-auto">
                    {menuItems.map((item) => {
                        const Icon = item.icon;
                        const isActive = activePage === item.id;
                        return (
                            <button
                                key={item.id}
                                onClick={() => setActivePage(item.id)}
                                className={`
                                    w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-all
                                    ${isActive
                                        ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30'
                                        : 'text-zinc-400 hover:bg-white/5 hover:text-white'
                                    }
                                `}
                            >
                                <Icon size={20} />
                                <span className="font-bold">{item.label}</span>
                            </button>
                        );
                    })}
                </nav>

                {/* User Section */}
                <div className="p-4 border-t border-white/10 space-y-2">
                    <button className="w-full flex items-center gap-3 px-4 py-3 rounded-xl text-zinc-400 hover:bg-white/5 hover:text-white transition-all">
                        <User size={20} />
                        <span className="font-bold">Profile</span>
                    </button>
                    <button
                        onClick={handleLogout}
                        className="w-full flex items-center gap-3 px-4 py-3 rounded-xl text-red-400 hover:bg-red-500/10 transition-all"
                    >
                        <LogOut size={20} />
                        <span className="font-bold">Logout</span>
                    </button>
                </div>
            </motion.div>

            {/* Main Content */}
            <div className={`flex-1 transition-all ${sidebarOpen ? 'ml-72' : 'ml-0'}`}>
                {/* Top Bar */}
                <div className="sticky top-0 z-40 bg-black/80 backdrop-blur-xl border-b border-white/10 px-6 py-4 flex items-center justify-between">
                    <button
                        onClick={() => setSidebarOpen(!sidebarOpen)}
                        className="w-10 h-10 rounded-xl bg-white/5 border border-white/10 flex items-center justify-center text-white hover:bg-white/10 transition-all"
                    >
                        {sidebarOpen ? <X size={20} /> : <Menu size={20} />}
                    </button>
                    <div className="flex items-center gap-4">
                        <div className="text-right">
                            <p className="text-white font-bold">{user?.companyName}</p>
                            <p className="text-xs text-zinc-400">{user?.email}</p>
                        </div>
                        <div className="w-10 h-10 rounded-full bg-emerald-500 flex items-center justify-center text-white font-black">
                            {user?.companyName?.charAt(0) || 'C'}
                        </div>
                    </div>
                </div>

                {/* Page Content */}
                <motion.div
                    key={activePage}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.3 }}
                    className="p-6"
                >
                    {renderPage()}
                </motion.div>
            </div>
        </div>
    );
};

export default ClientDashboard;
