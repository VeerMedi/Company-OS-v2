import React, { useState } from 'react';
import { X, AlertTriangle, Save } from 'lucide-react';
import api from '../../utils/api';
import toast from 'react-hot-toast';

const PerformanceEditModal = ({ evaluation, onClose, onSave }) => {
    const [metrics, setMetrics] = useState(evaluation.metrics);
    const [reason, setReason] = useState('');
    const [saving, setSaving] = useState(false);

    const handleMetricChange = (metricKey, field, value) => {
        setMetrics(prev => ({
            ...prev,
            [metricKey]: {
                ...prev[metricKey],
                [field]: Number(value)
            }
        }));
    };

    const calculateChangePercent = (oldValue, newValue) => {
        if (oldValue === 0) return 0;
        return Math.abs(((newValue - oldValue) / oldValue) * 100);
    };

    const hasThresholdWarning = (metricKey) => {
        const oldValue = evaluation.metrics[metricKey]?.score || 0;
        const newValue = metrics[metricKey]?.score || 0;
        const changePercent = calculateChangePercent(oldValue, newValue);
        return changePercent > 20;
    };

    const handleSave = async () => {
        if (!reason || reason.length < 10) {
            toast.error('Please provide a detailed reason (min 10 characters)');
            return;
        }

        setSaving(true);
        try {
            await api.put(`/performance-evaluations/${evaluation._id}/metrics`, {
                metrics,
                reason
            });
            toast.success('Metrics updated successfully!');
            onSave();
        } catch (error) {
            toast.error(error.response?.data?.message || 'Failed to update metrics');
        } finally {
            setSaving(false);
        }
    };

    const metricFields = [
        { key: 'taskCompletion', label: 'Task Completion', editable: true },
        { key: 'taskQuality', label: 'Task Quality', editable: true },
        { key: 'attendance', label: 'Attendance', editable: false, locked: true },
        { key: 'collaboration', label: 'Collaboration', editable: true },
        { key: 'initiative', label: 'Initiative', editable: true }
    ];

    return (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-2xl max-w-3xl w-full max-h-[90vh] overflow-y-auto shadow-2xl">
                {/* Header */}
                <div className="sticky top-0 bg-gradient-to-r from-blue-600 to-purple-600 px-6 py-5 flex justify-between items-center rounded-t-2xl">
                    <div>
                        <h2 className="text-2xl font-bold text-white">Edit Performance Metrics</h2>
                        <p className="text-blue-100 text-sm mt-1">
                            {evaluation.employee.firstName} {evaluation.employee.lastName}
                        </p>
                    </div>
                    <button
                        onClick={onClose}
                        className="text-white hover:bg-white/20 rounded-full p-2 transition-colors"
                    >
                        <X className="h-6 w-6" />
                    </button>
                </div>

                {/* Content */}
                <div className="p-6 space-y-6">
                    {/* Metrics Grid */}
                    <div className="space-y-4">
                        {metricFields.map((field) => {
                            const oldValue = evaluation.metrics[field.key]?.score || 0;
                            const newValue = metrics[field.key]?.score || 0;
                            const changePercent = calculateChangePercent(oldValue, newValue);
                            const hasWarning = hasThresholdWarning(field.key) && field.editable;

                            return (
                                <div key={field.key} className={`border-2 rounded-lg p-4 ${hasWarning ? 'border-orange-300 bg-orange-50' : 'border-gray-200 bg-gray-50'}`}>
                                    <div className="flex items-center justify-between mb-3">
                                        <label className="text-sm font-bold text-gray-900">{field.label}</label>
                                        {field.locked && (
                                            <span className="text-xs bg-gray-200 text-gray-700 px-2 py-1 rounded-full font-bold">
                                                🔒 Locked
                                            </span>
                                        )}
                                    </div>

                                    <div className="grid grid-cols-3 gap-4">
                                        <div>
                                            <p className="text-xs text-gray-600 mb-1">Original</p>
                                            <p className="text-2xl font-bold text-gray-900">{oldValue}</p>
                                        </div>

                                        <div>
                                            <p className="text-xs text-gray-600 mb-1">New Value</p>
                                            {field.editable ? (
                                                <input
                                                    type="number"
                                                    min="0"
                                                    max="100"
                                                    value={newValue}
                                                    onChange={(e) => handleMetricChange(field.key, 'score', e.target.value)}
                                                    className="w-full px-3 py-2 border-2 border-blue-300 rounded-lg text-lg font-bold focus:ring-2 focus:ring-blue-500"
                                                />
                                            ) : (
                                                <p className="text-2xl font-bold text-gray-400">{newValue}</p>
                                            )}
                                        </div>

                                        <div>
                                            <p className="text-xs text-gray-600 mb-1">Change</p>
                                            <p className={`text-lg font-bold ${changePercent > 0 ? 'text-blue-600' : 'text-gray-400'}`}>
                                                {changePercent > 0 ? `±${Math.round(changePercent)}%` : '—'}
                                            </p>
                                        </div>
                                    </div>

                                    {hasWarning && (
                                        <div className="mt-3 flex items-start gap-2 text-orange-700 bg-orange-100 p-3 rounded-lg">
                                            <AlertTriangle className="h-5 w-5 flex-shrink-0 mt-0.5" />
                                            <p className="text-sm font-medium">
                                                This edit exceeds the 20% threshold ({Math.round(changePercent)}% change).
                                                Please provide justification.
                                            </p>
                                        </div>
                                    )}
                                </div>
                            );
                        })}
                    </div>

                    {/* Reason Input */}
                    <div>
                        <label className="block text-sm font-bold text-gray-900 mb-2">
                            Reason for Changes <span className="text-red-600">*</span>
                        </label>
                        <textarea
                            value={reason}
                            onChange={(e) => setReason(e.target.value)}
                            rows={4}
                            placeholder="Provide a detailed explanation for these metric changes (minimum 10 characters)..."
                            className="w-full px-4 py-3 border-2 border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                        />
                        <p className="text-xs text-gray-600 mt-1">
                            {reason.length}/500 characters (minimum 10 required)
                        </p>
                    </div>
                </div>

                {/* Footer */}
                <div className="border-t border-gray-200 px-6 py-4 bg-gray-50 rounded-b-2xl flex justify-end gap-3">
                    <button
                        onClick={onClose}
                        className="px-6 py-2.5 border-2 border-gray-300 text-gray-700 rounded-lg font-bold hover:bg-gray-100 transition-colors"
                    >
                        Cancel
                    </button>
                    <button
                        onClick={handleSave}
                        disabled={saving || reason.length < 10}
                        className="px-6 py-2.5 bg-gradient-to-r from-blue-600 to-purple-600 text-white rounded-lg font-bold hover:from-blue-700 hover:to-purple-700 transition-all shadow-md hover:shadow-lg disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
                    >
                        <Save className="h-5 w-5" />
                        {saving ? 'Saving...' : 'Save Changes'}
                    </button>
                </div>
            </div>
        </div>
    );
};

export default PerformanceEditModal;
