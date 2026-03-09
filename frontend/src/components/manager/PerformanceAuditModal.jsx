import React, { useState, useEffect } from 'react';
import { X, Clock, User } from 'lucide-react';
import api from '../../utils/api';
import toast from 'react-hot-toast';

const PerformanceAuditModal = ({ evaluationId, employeeName, onClose }) => {
    const [auditLog, setAuditLog] = useState([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        fetchAuditLog();
    }, [evaluationId]);

    const fetchAuditLog = async () => {
        setLoading(true);
        try {
            const response = await api.get(`/performance-evaluations/${evaluationId}/audit-log`);
            setAuditLog(response.data.data || []);
        } catch (error) {
            console.error('Error fetching audit log:', error);
            toast.error('Failed to load audit log');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-2xl max-w-4xl w-full max-h-[90vh] overflow-y-auto shadow-2xl">
                {/* Header */}
                <div className="sticky top-0 bg-gradient-to-r from-purple-600 to-pink-600 px-6 py-5 flex justify-between items-center rounded-t-2xl">
                    <div>
                        <h2 className="text-2xl font-bold text-white">Edit Audit Log</h2>
                        <p className="text-purple-100 text-sm mt-1">{employeeName}</p>
                    </div>
                    <button
                        onClick={onClose}
                        className="text-white hover:bg-white/20 rounded-full p-2 transition-colors"
                    >
                        <X className="h-6 w-6" />
                    </button>
                </div>

                {/* Content */}
                <div className="p-6">
                    {loading ? (
                        <div className="flex items-center justify-center py-12">
                            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-600"></div>
                        </div>
                    ) : auditLog.length === 0 ? (
                        <div className="text-center py-12">
                            <p className="text-gray-600">No edit history found for this evaluation.</p>
                        </div>
                    ) : (
                        <div className="space-y-4">
                            {auditLog.map((log, index) => (
                                <div key={log._id} className="border-2 border-gray-200 rounded-lg p-5 hover:border-purple-300 transition-colors">
                                    <div className="flex items-start justify-between mb-3">
                                        <div className="flex items-center gap-3">
                                            <div className="h-10 w-10 rounded-full bg-gradient-to-br from-purple-500 to-pink-500 flex items-center justify-center text-white font-bold">
                                                {log.editedBy?.firstName?.[0]}{log.editedBy?.lastName?.[0]}
                                            </div>
                                            <div>
                                                <p className="font-bold text-gray-900">
                                                    {log.editedBy?.firstName} {log.editedBy?.lastName}
                                                </p>
                                                <p className="text-xs text-gray-600">{log.editedBy?.role}</p>
                                            </div>
                                        </div>
                                        <div className="text-right">
                                            <div className="flex items-center gap-1 text-gray-600 text-sm">
                                                <Clock className="h-4 w-4" />
                                                {new Date(log.editedAt).toLocaleString()}
                                            </div>
                                        </div>
                                    </div>

                                    <div className="bg-gray-50 rounded-lg p-4 space-y-3">
                                        <div>
                                            <p className="text-xs font-medium text-gray-600 mb-1">Field Changed</p>
                                            <p className="text-sm font-bold text-gray-900">{log.fieldName.replace('metrics.', '').toUpperCase()}</p>
                                        </div>

                                        <div className="grid grid-cols-3 gap-4">
                                            <div>
                                                <p className="text-xs font-medium text-gray-600 mb-1">Old Value</p>
                                                <p className="text-lg font-bold text-red-600">
                                                    {typeof log.oldValue === 'object' ? log.oldValue.score : log.oldValue}
                                                </p>
                                            </div>
                                            <div className="flex items-center justify-center">
                                                <div className="text-gray-400 text-2xl">→</div>
                                            </div>
                                            <div>
                                                <p className="text-xs font-medium text-gray-600 mb-1">New Value</p>
                                                <p className="text-lg font-bold text-green-600">
                                                    {typeof log.newValue === 'object' ? log.newValue.score : log.newValue}
                                                </p>
                                            </div>
                                        </div>

                                        {log.changePercentage && (
                                            <div className={`px-3 py-2 rounded-lg ${Math.abs(log.changePercentage) > 20 ? 'bg-orange-100' : 'bg-blue-100'}`}>
                                                <p className="text-xs font-medium text-gray-700">
                                                    Change: <span className="font-bold">{log.changePercentage > 0 ? '+' : ''}{log.changePercentage}%</span>
                                                    {Math.abs(log.changePercentage) > 20 && ' ⚠️ Exceeded Threshold'}
                                                </p>
                                            </div>
                                        )}

                                        <div className="border-t border-gray-200 pt-3">
                                            <p className="text-xs font-medium text-gray-600 mb-2">Reason</p>
                                            <p className="text-sm text-gray-800 bg-white p-3 rounded border border-gray-200">
                                                {log.reason}
                                            </p>
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </div>

                {/* Footer */}
                <div className="border-t border-gray-200 px-6 py-4 bg-gray-50 rounded-b-2xl flex justify-end">
                    <button
                        onClick={onClose}
                        className="px-6 py-2.5 bg-gradient-to-r from-purple-600 to-pink-600 text-white rounded-lg font-bold hover:from-purple-700 hover:to-pink-700 transition-all shadow-md hover:shadow-lg"
                    >
                        Close
                    </button>
                </div>
            </div>
        </div>
    );
};

export default PerformanceAuditModal;
