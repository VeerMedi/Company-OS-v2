import React, { useState, useEffect } from 'react';
import {
    Edit2,
    Trash2,
    Plus,
    Save,
    X,
    TrendingUp,
    Award,
    AlertCircle,
    Info,
    DollarSign,
    Target,
    Zap
} from 'lucide-react';
import api from '../utils/api';
import { showToast } from '../utils/toast';

const IncentiveMatrixManager = () => {
    const [tiers, setTiers] = useState([]);
    const [isLoading, setIsLoading] = useState(true);
    const [editingTier, setEditingTier] = useState(null);
    const [isCreating, setIsCreating] = useState(false);
    const [distribution, setDistribution] = useState(null);

    const [formData, setFormData] = useState({
        tier: '',
        displayOrder: 1,
        emoji: '🏆',
        minProductivityScore: 0,
        maxProductivityScore: 100,
        minPoints: 0,
        maxPoints: '',
        incentiveAmount: 0,
        incentiveType: 'fixed',
        description: ''
    });

    const tierOptions = ['Bronze', 'Silver', 'Gold', 'Platinum', 'Diamond'];
    const emojiOptions = ['🥉', '🥈', '🥇', '💎', '🌟', '🏆', '⭐', '✨'];

    useEffect(() => {
        fetchTiers();
        fetchDistribution();
    }, []);

    const fetchTiers = async () => {
        try {
            setIsLoading(true);
            const response = await api.get('/incentive-matrix');
            if (response.data.success) {
                setTiers(response.data.data);
            }
        } catch (error) {
            console.error('Error fetching tiers:', error);
            showToast.error('Failed to fetch incentive tiers');
        } finally {
            setIsLoading(false);
        }
    };

    const fetchDistribution = async () => {
        try {
            const response = await api.get('/incentive-matrix/distribution');
            if (response.data.success) {
                setDistribution(response.data.data);
            }
        } catch (error) {
            console.error('Error fetching distribution:', error);
        }
    };

    const handleInputChange = (e) => {
        const { name, value } = e.target;
        setFormData(prev => ({
            ...prev,
            [name]: value
        }));
    };

    const resetForm = () => {
        setFormData({
            tier: '',
            displayOrder: 1,
            emoji: '🏆',
            minProductivityScore: 0,
            maxProductivityScore: 100,
            minPoints: 0,
            maxPoints: '',
            incentiveAmount: 0,
            incentiveType: 'fixed',
            description: ''
        });
        setEditingTier(null);
        setIsCreating(false);
    };

    const handleCreate = async (e) => {
        e.preventDefault();

        try {
            const submitData = {
                ...formData,
                maxPoints: formData.maxPoints === '' ? null : parseInt(formData.maxPoints)
            };

            const response = await api.post('/incentive-matrix', submitData);

            if (response.data.success) {
                showToast.success('Incentive tier created successfully');
                resetForm();
                fetchTiers();
                fetchDistribution();
            }
        } catch (error) {
            showToast.error(error.response?.data?.message || 'Failed to create tier');
        }
    };

    const handleUpdate = async (e) => {
        e.preventDefault();

        try {
            const submitData = {
                ...formData,
                maxPoints: formData.maxPoints === '' ? null : parseInt(formData.maxPoints)
            };

            const response = await api.put(`/incentive-matrix/${editingTier._id}`, submitData);

            if (response.data.success) {
                showToast.success('Incentive tier updated successfully');
                resetForm();
                fetchTiers();
                fetchDistribution();
            }
        } catch (error) {
            showToast.error(error.response?.data?.message || 'Failed to update tier');
        }
    };

    const handleEdit = (tier) => {
        setFormData({
            tier: tier.tier,
            displayOrder: tier.displayOrder,
            emoji: tier.emoji,
            minProductivityScore: tier.minProductivityScore,
            maxProductivityScore: tier.maxProductivityScore,
            minPoints: tier.minPoints,
            maxPoints: tier.maxPoints || '',
            incentiveAmount: tier.incentiveAmount,
            incentiveType: tier.incentiveType,
            description: tier.description || ''
        });
        setEditingTier(tier);
        setIsCreating(false);
    };

    const handleDelete = async (tierId) => {
        if (!window.confirm('Are you sure you want to delete this tier? This action cannot be undone.')) {
            return;
        }

        try {
            const response = await api.delete(`/incentive-matrix/${tierId}`);

            if (response.data.success) {
                showToast.success('Tier deleted successfully');
                fetchTiers();
                fetchDistribution();
            }
        } catch (error) {
            showToast.error('Failed to delete tier');
        }
    };

    const formatCurrency = (amount) => {
        return new Intl.NumberFormat('en-IN', {
            style: 'currency',
            currency: 'INR',
            minimumFractionDigits: 0
        }).format(amount || 0);
    };

    return (
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-6">
            {/* Header */}
            <div className="bg-gradient-to-r from-purple-600 to-indigo-600 rounded-xl shadow-lg p-8">
                <div className="flex justify-between items-center">
                    <div>
                        <h1 className="text-3xl font-bold text-white flex items-center">
                            <Award className="h-8 w-8 mr-3" />
                            Incentive Matrix Manager
                        </h1>
                        <p className="mt-2 text-purple-100">
                            Configure performance-based incentive tiers for employee payroll
                        </p>
                    </div>
                    {!isCreating && !editingTier && (
                        <button
                            onClick={() => setIsCreating(true)}
                            className="bg-white text-purple-600 px-6 py-3 rounded-lg flex items-center space-x-2 hover:bg-purple-50 shadow-lg hover:shadow-xl transition-all duration-200 font-bold"
                        >
                            <Plus className="w-5 h-5" />
                            <span>Add New Tier</span>
                        </button>
                    )}
                </div>
            </div>

            {/* Distribution Statistics */}
            {distribution && (
                <div className="bg-white rounded-xl shadow-lg p-6 border-2 border-purple-200">
                    <h3 className="text-lg font-bold text-gray-900 mb-4 flex items-center">
                        <TrendingUp className="h-5 w-5 mr-2 text-purple-600" />
                        Current Distribution
                    </h3>
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                        <div className="text-center p-4 bg-gradient-to-br from-blue-50 to-cyan-50 rounded-lg">
                            <p className="text-sm text-gray-600 mb-1">Total Employees</p>
                            <p className="text-2xl font-bold text-gray-900">{distribution.totalEmployees}</p>
                        </div>
                        <div className="text-center p-4 bg-gradient-to-br from-green-50 to-emerald-50 rounded-lg">
                            <p className="text-sm text-gray-600 mb-1">Total Incentives</p>
                            <p className="text-2xl font-bold text-gray-900">{formatCurrency(distribution.totalIncentiveAmount)}</p>
                        </div>
                        {Object.entries(distribution.tierDistribution || {}).map(([tierName, data]) => {
                            if (data.count > 0) {
                                return (
                                    <div key={tierName} className="text-center p-4 bg-gradient-to-br from-purple-50 to-pink-50 rounded-lg">
                                        <p className="text-sm text-gray-600 mb-1">{data.emoji} {tierName}</p>
                                        <p className="text-xl font-bold text-gray-900">{data.count} employees</p>
                                        <p className="text-xs text-gray-500">{formatCurrency(data.totalAmount)}</p>
                                    </div>
                                );
                            }
                            return null;
                        })}
                    </div>
                </div>
            )}

            {/* Info Alert */}
            <div className="bg-blue-50 border-l-4 border-blue-500 p-4 rounded">
                <div className="flex items-start">
                    <Info className="h-5 w-5 text-blue-500 mt-0.5 mr-3" />
                    <div className="flex-1">
                        <h4 className="text-sm font-bold text-blue-900 mb-1">How Incentive Matching Works</h4>
                        <p className="text-sm text-blue-800">
                            Employees qualify for a tier if they meet <strong>EITHER</strong> the productivity score range <strong>OR</strong> the points range.
                            The system automatically selects the highest tier they qualify for. Incentives are added to the performance allowance in payroll.
                        </p>
                    </div>
                </div>
            </div>

            {/* Create/Edit Form */}
            {(isCreating || editingTier) && (
                <div className="bg-white rounded-xl shadow-lg p-6 border-2 border-purple-200">
                    <div className="flex justify-between items-center mb-6">
                        <h3 className="text-lg font-bold text-gray-900">
                            {editingTier ? `Edit ${formData.emoji} ${formData.tier} Tier` : 'Create New Tier'}
                        </h3>
                        <button
                            onClick={resetForm}
                            className="text-gray-500 hover:text-gray-700"
                        >
                            <X className="h-5 w-5" />
                        </button>
                    </div>

                    <form onSubmit={editingTier ? handleUpdate : handleCreate} className="space-y-6">
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                            {/* Tier Name */}
                            <div>
                                <label className="block text-sm font-bold text-gray-700 mb-2">
                                    Tier Name *
                                </label>
                                <select
                                    name="tier"
                                    value={formData.tier}
                                    onChange={handleInputChange}
                                    required
                                    className="w-full border-2 border-purple-200 rounded-md px-3 py-2 focus:ring-2 focus:ring-purple-500"
                                >
                                    <option value="">Select Tier</option>
                                    {tierOptions.map(tier => (
                                        <option key={tier} value={tier}>{tier}</option>
                                    ))}
                                </select>
                            </div>

                            {/* Emoji */}
                            <div>
                                <label className="block text-sm font-bold text-gray-700 mb-2">
                                    Emoji
                                </label>
                                <select
                                    name="emoji"
                                    value={formData.emoji}
                                    onChange={handleInputChange}
                                    className="w-full border-2 border-purple-200 rounded-md px-3 py-2 focus:ring-2 focus:ring-purple-500"
                                >
                                    {emojiOptions.map(emoji => (
                                        <option key={emoji} value={emoji}>{emoji} {emoji}</option>
                                    ))}
                                </select>
                            </div>

                            {/* Display Order */}
                            <div>
                                <label className="block text-sm font-bold text-gray-700 mb-2">
                                    Display Order *
                                </label>
                                <input
                                    type="number"
                                    name="displayOrder"
                                    value={formData.displayOrder}
                                    onChange={handleInputChange}
                                    min="1"
                                    max="5"
                                    required
                                    className="w-full border-2 border-purple-200 rounded-md px-3 py-2 focus:ring-2 focus:ring-purple-500"
                                />
                            </div>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            {/* Productivity Score Range */}
                            <div className="border-2 border-blue-200 rounded-lg p-4">
                                <h4 className="font-bold text-blue-900 mb-3 flex items-center">
                                    <Target className="h-4 w-4 mr-2" />
                                    Productivity Score Range (%)
                                </h4>
                                <div className="grid grid-cols-2 gap-4">
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-1">Min *</label>
                                        <input
                                            type="number"
                                            name="minProductivityScore"
                                            value={formData.minProductivityScore}
                                            onChange={handleInputChange}
                                            min="0"
                                            max="100"
                                            required
                                            className="w-full border border-gray-300 rounded-md px-3 py-2"
                                        />
                                    </div>
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-1">Max *</label>
                                        <input
                                            type="number"
                                            name="maxProductivityScore"
                                            value={formData.maxProductivityScore}
                                            onChange={handleInputChange}
                                            min="0"
                                            max="100"
                                            required
                                            className="w-full border border-gray-300 rounded-md px-3 py-2"
                                        />
                                    </div>
                                </div>
                            </div>

                            {/* Points Range */}
                            <div className="border-2 border-green-200 rounded-lg p-4">
                                <h4 className="font-bold text-green-900 mb-3 flex items-center">
                                    <Zap className="h-4 w-4 mr-2" />
                                    Points Range
                                </h4>
                                <div className="grid grid-cols-2 gap-4">
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-1">Min *</label>
                                        <input
                                            type="number"
                                            name="minPoints"
                                            value={formData.minPoints}
                                            onChange={handleInputChange}
                                            min="0"
                                            required
                                            className="w-full border border-gray-300 rounded-md px-3 py-2"
                                        />
                                    </div>
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-1">
                                            Max <span className="text-xs text-gray-500">(empty = unlimited)</span>
                                        </label>
                                        <input
                                            type="number"
                                            name="maxPoints"
                                            value={formData.maxPoints}
                                            onChange={handleInputChange}
                                            min="0"
                                            className="w-full border border-gray-300 rounded-md px-3 py-2"
                                            placeholder="Unlimited"
                                        />
                                    </div>
                                </div>
                            </div>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            {/* Incentive Amount */}
                            <div>
                                <label className="block text-sm font-bold text-gray-700 mb-2 flex items-center">
                                    <DollarSign className="h-4 w-4 mr-1" />
                                    Incentive Amount (₹) *
                                </label>
                                <input
                                    type="number"
                                    name="incentiveAmount"
                                    value={formData.incentiveAmount}
                                    onChange={handleInputChange}
                                    min="0"
                                    required
                                    className="w-full border-2 border-purple-200 rounded-md px-3 py-2 focus:ring-2 focus:ring-purple-500"
                                />
                            </div>

                            {/* Incentive Type */}
                            <div>
                                <label className="block text-sm font-bold text-gray-700 mb-2">
                                    Incentive Type
                                </label>
                                <select
                                    name="incentiveType"
                                    value={formData.incentiveType}
                                    onChange={handleInputChange}
                                    className="w-full border-2 border-purple-200 rounded-md px-3 py-2 focus:ring-2 focus:ring-purple-500"
                                >
                                    <option value="fixed">Fixed Amount</option>
                                    <option value="percentage">Percentage of Basic Salary</option>
                                </select>
                            </div>
                        </div>

                        {/* Description */}
                        <div>
                            <label className="block text-sm font-bold text-gray-700 mb-2">
                                Description
                            </label>
                            <textarea
                                name="description"
                                value={formData.description}
                                onChange={handleInputChange}
                                rows="2"
                                maxLength="200"
                                className="w-full border-2 border-purple-200 rounded-md px-3 py-2 focus:ring-2 focus:ring-purple-500"
                                placeholder="Brief description of this tier..."
                            />
                            <p className="text-xs text-gray-500 mt-1">{formData.description.length}/200 characters</p>
                        </div>

                        {/* Action Buttons */}
                        <div className="flex justify-end space-x-3">
                            <button
                                type="button"
                                onClick={resetForm}
                                className="px-6 py-2 border-2 border-gray-300 rounded-lg text-gray-700 font-bold hover:bg-gray-50"
                            >
                                Cancel
                            </button>
                            <button
                                type="submit"
                                className="bg-gradient-to-r from-purple-600 to-indigo-600 text-white px-6 py-2 rounded-lg font-bold hover:from-purple-700 hover:to-indigo-700 flex items-center space-x-2"
                            >
                                <Save className="h-4 w-4" />
                                <span>{editingTier ? 'Update Tier' : 'Create Tier'}</span>
                            </button>
                        </div>
                    </form>
                </div>
            )}

            {/* Tiers Table */}
            <div className="bg-white rounded-xl shadow-lg border-2 border-purple-100 overflow-hidden">
                <div className="px-6 py-4 bg-gradient-to-r from-purple-50 to-indigo-50 border-b-2 border-purple-200">
                    <h3 className="text-lg font-bold text-gray-900">Active Incentive Tiers</h3>
                </div>

                <div className="overflow-x-auto">
                    <table className="min-w-full divide-y divide-gray-200">
                        <thead className="bg-gray-50">
                            <tr>
                                <th className="px-6 py-3 text-left text-xs font-bold text-gray-700 uppercase">Order</th>
                                <th className="px-6 py-3 text-left text-xs font-bold text-gray-700 uppercase">Tier</th>
                                <th className="px-6 py-3 text-left text-xs font-bold text-gray-700 uppercase">Score Range</th>
                                <th className="px-6 py-3 text-left text-xs font-bold text-gray-700 uppercase">Points Range</th>
                                <th className="px-6 py-3 text-left text-xs font-bold text-gray-700 uppercase">Incentive</th>
                                <th className="px-6 py-3 text-left text-xs font-bold text-gray-700 uppercase">Actions</th>
                            </tr>
                        </thead>
                        <tbody className="bg-white divide-y divide-gray-200">
                            {isLoading ? (
                                <tr>
                                    <td colSpan="6" className="px-6 py-4 text-center">
                                        <div className="flex justify-center">
                                            <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-purple-600"></div>
                                        </div>
                                    </td>
                                </tr>
                            ) : tiers.length === 0 ? (
                                <tr>
                                    <td colSpan="6" className="px-6 py-4 text-center text-gray-500">
                                        No incentive tiers configured. Click "Add New Tier" to get started.
                                    </td>
                                </tr>
                            ) : (
                                tiers.map((tier, index) => (
                                    <tr key={tier._id} className={`${index % 2 === 0 ? 'bg-white' : 'bg-purple-50/30'} hover:bg-purple-100/40 transition-colors`}>
                                        <td className="px-6 py-4 whitespace-nowrap">
                                            <span className="px-3 py-1 bg-gray-100 text-gray-800 rounded-full text-sm font-bold">
                                                #{tier.displayOrder}
                                            </span>
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap">
                                            <span className="text-2xl mr-2">{tier.emoji}</span>
                                            <span className="font-bold text-gray-900">{tier.tier}</span>
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap">
                                            <span className="px-3 py-1 bg-blue-100 text-blue-800 rounded-full text-sm font-bold">
                                                {tier.minProductivityScore}-{tier.maxProductivityScore}%
                                            </span>
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap">
                                            <span className="px-3 py-1 bg-green-100 text-green-800 rounded-full text-sm font-bold">
                                                {tier.minPoints}{tier.maxPoints ? `-${tier.maxPoints}` : '+'}
                                            </span>
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap">
                                            <span className="text-lg font-bold text-purple-600">
                                                {formatCurrency(tier.incentiveAmount)}
                                            </span>
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap">
                                            <div className="flex space-x-2">
                                                <button
                                                    onClick={() => handleEdit(tier)}
                                                    className="text-blue-600 hover:text-blue-800 p-2 rounded hover:bg-blue-50"
                                                    title="Edit"
                                                >
                                                    <Edit2 className="h-4 w-4" />
                                                </button>
                                                <button
                                                    onClick={() => handleDelete(tier._id)}
                                                    className="text-red-600 hover:text-red-800 p-2 rounded hover:bg-red-50"
                                                    title="Delete"
                                                >
                                                    <Trash2 className="h-4 w-4" />
                                                </button>
                                            </div>
                                        </td>
                                    </tr>
                                ))
                            )}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    );
};

export default IncentiveMatrixManager;
