import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { CheckCircle, Circle, Clock } from 'lucide-react';
import api from '../../utils/api';

const ClientTimeline = () => {
    const [milestones, setMilestones] = useState([
        { id: 1, title: 'Project Kickoff', date: 'Jan 15, 2026', status: 'completed', description: 'Initial meeting and requirement gathering' },
        { id: 2, title: 'Design Phase', date: 'Jan 22, 2026', status: 'completed', description: 'UI/UX design and mockups' },
        { id: 3, title: 'Development Sprint 1', date: 'Feb 5, 2026', status: 'in-progress', description: 'Core feature development' },
        { id: 4, title: 'Testing & QA', date: 'Feb 20, 2026', status: 'upcoming', description: 'Quality assurance and bug fixes' },
        { id: 5, title: 'Final Delivery', date: 'Mar 1, 2026', status: 'upcoming', description: 'Project handover and deployment' },
    ]);

    const getStatusIcon = (status) => {
        switch (status) {
            case 'completed':
                return <CheckCircle className="text-emerald-500" size={24} />;
            case 'in-progress':
                return <Circle className="text-blue-500 fill-blue-500" size={24} />;
            case 'upcoming':
                return <Circle className="text-zinc-600" size={24} />;
            default:
                return <Clock className="text-zinc-600" size={24} />;
        }
    };

    const getStatusColor = (status) => {
        switch (status) {
            case 'completed':
                return 'border-emerald-500/30 bg-emerald-500/10';
            case 'in-progress':
                return 'border-blue-500/30 bg-blue-500/10';
            case 'upcoming':
                return 'border-zinc-600/30 bg-zinc-900';
            default:
                return 'border-zinc-600/30 bg-zinc-900';
        }
    };

    return (
        <div className="max-w-4xl mx-auto">
            <motion.h1
                initial={{ opacity: 0, y: -20 }}
                animate={{ opacity: 1, y: 0 }}
                className="text-3xl font-black text-white mb-8"
            >
                Project Timeline
            </motion.h1>

            <div className="relative">
                {/* Vertical Line */}
                <div className="absolute left-6 top-8 bottom-8 w-0.5 bg-white/10" />

                {/* Milestones */}
                <div className="space-y-8">
                    {milestones.map((milestone, index) => (
                        <motion.div
                            key={milestone.id}
                            initial={{ opacity: 0, x: -50 }}
                            animate={{ opacity: 1, x: 0 }}
                            transition={{ delay: index * 0.1 }}
                            className="relative flex items-start gap-6"
                        >
                            {/* Icon */}
                            <div className="relative z-10 w-12 h-12 rounded-full bg-zinc-900 border-2 border-white/10 flex items-center justify-center">
                                {getStatusIcon(milestone.status)}
                            </div>

                            {/* Content */}
                            <div className={`flex-1 p-6 rounded-2xl border ${getStatusColor(milestone.status)}`}>
                                <div className="flex items-start justify-between">
                                    <div>
                                        <h3 className="text-xl font-black text-white">{milestone.title}</h3>
                                        <p className="text-zinc-400 text-sm mt-1">{milestone.description}</p>
                                    </div>
                                    <span className="text-sm font-bold text-zinc-500">{milestone.date}</span>
                                </div>
                                {milestone.status === 'completed' && (
                                    <div className="mt-4 flex items-center gap-2 text-emerald-400 text-sm font-bold">
                                        <CheckCircle size={16} />
                                        Completed
                                    </div>
                                )}
                                {milestone.status === 'in-progress' && (
                                    <div className="mt-4 flex items-center gap-2 text-blue-400 text-sm font-bold">
                                        <Clock size={16} />
                                        In Progress
                                    </div>
                                )}
                            </div>
                        </motion.div>
                    ))}
                </div>
            </div>
        </div>
    );
};

export default ClientTimeline;