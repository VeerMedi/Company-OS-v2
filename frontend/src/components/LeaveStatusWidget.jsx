import React, { useState, useEffect } from 'react';
import { Calendar, AlertCircle, Info } from 'lucide-react';
import api from '../utils/api';

const LeaveStatusWidget = () => {
    const [status, setStatus] = useState(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        fetchStatus();
    }, []);

    const fetchStatus = async () => {
        try {
            const res = await api.get('/attendance/leave-status');
            setStatus(res.data.data);
        } catch (error) {
            console.error('Error fetching leave status:', error);
        } finally {
            setLoading(false);
        }
    };

    const formatDate = (dateString) => {
        if (!dateString) return '';
        const date = new Date(dateString);
        return date.toLocaleDateString('en-US', {
            month: 'short',
            day: 'numeric',
            year: 'numeric'
        });
    };

    if (loading || !status || status.status !== 'on-leave') {
        return null;
    }

    return (
        <div className="bg-gradient-to-r from-amber-50 to-orange-50 border-l-4 border-amber-500 p-5 mb-6 rounded-r-lg shadow-sm">
            <div className="flex items-start">
                <div className="flex-shrink-0">
                    <Calendar className="h-6 w-6 text-amber-500 mt-0.5" />
                </div>
                <div className="ml-4 flex-1">
                    <div className="flex items-center justify-between">
                        <h3 className="text-base font-semibold text-amber-900">
                            You are on {status.leaveType || 'leave'} today
                        </h3>
                        <span className="px-3 py-1 bg-amber-100 text-amber-800 text-xs font-semibold rounded-full">
                            On Leave
                        </span>
                    </div>

                    {status.message && (
                        <p className="text-sm text-amber-700 mt-2">
                            {status.message}
                        </p>
                    )}

                    <div className="mt-3 flex items-center gap-2 text-xs text-amber-600">
                        <Info className="h-4 w-4" />
                        <span>
                            Attendance has been automatically marked. Enjoy your time off!
                        </span>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default LeaveStatusWidget;
