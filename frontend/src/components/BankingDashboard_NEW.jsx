import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import StatCard from './StatCard';
import {
    DollarSign,
    TrendingUp,
    Building2,
    Users,
    Target,
    Briefcase,
    Edit2,
    Save,
    X,
    AlertCircle
} from 'lucide-react';
import api from '../utils/api';

const BankingDashboard = () => {
    const { user } = useAuth();
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [data, setData] = useState(null);

    // Generate Sparkline Data
    const generateSparkline = (trend = 'neutral', points = 15) => {
        const data = [];
        let current = 50;
        for (let i = 0; i < points; i++) {
            let change = (Math.random() - 0.5) * 10;
            if (trend === 'up') change += 2;
            if (trend === 'down') change -= 2;
            current = Math.max(10, current + change);
            data.push({ value: current });
        }
        return data;
    };

    useEffect(() => {
        const fetchBankingData = async () => {
            try {
                setLoading(true);
                setError(null);
                
                console.log('🏦 Fetching banking data from CEO dashboard...');
                console.log('User:', user);
                console.log('User Role:', user?.role);
                console.log('Token exists:', !!localStorage.getItem('token'));

                // Use CEO dashboard endpoint which has real financial data
                const response = await api.get('/ceo/dashboard');
                
                console.log('✅ Banking data response:', response.data);

                if (response.data.success) {
                    setData(response.data.data);
                } else {
                    throw new Error(response.data.message || 'Failed to fetch banking data');
                }
            } catch (err) {
                console.error('❌ Error fetching banking data:', err);
                console.error('Error response:', err.response?.data);
                console.error('Error status:', err.response?.status);
                
                if (err.response?.status === 401) {
                    setError('Unauthorized: Please log in again');
                } else if (err.response?.status === 403) {
                    setError('Access Denied: This section is only available for CEO roles');
                } else {
                    setError(err.response?.data?.message || 'Failed to load banking details. Please try again.');
                }
            } finally {
                setLoading(false);
            }
        };

        if (user) {
            fetchBankingData();
        } else {
            setError('User not authenticated');
            setLoading(false);
        }
    }, [user]);

    if (loading) {
        return (
            <div className="flex items-center justify-center h-full min-h-[400px]">
                <div className="text-center">
                    <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
                    <p className="text-muted-foreground">Loading banking details...</p>
                </div>
            </div>
        );
    }

    if (error) {
        return (
            <div className="flex items-center justify-center h-full min-h-[400px]">
                <div className="dashboard-card max-w-md w-full">
                    <div className="flex items-center gap-3 text-destructive mb-4">
                        <AlertCircle size={24} />
                        <h3 className="text-lg font-semibold">Error Loading Data</h3>
                    </div>
                    <p className="text-muted-foreground mb-4">{error}</p>
                    <button 
                        onClick={() => window.location.reload()} 
                        className="btn-primary w-full"
                    >
                        Retry
                    </button>
                </div>
            </div>
        );
    }

    if (!data) {
        return (
            <div className="flex items-center justify-center h-full min-h-[400px]">
                <div className="dashboard-card max-w-md w-full text-center">
                    <AlertCircle className="mx-auto h-12 w-12 text-muted mb-4" />
                    <p className="text-muted-foreground">No banking data available</p>
                </div>
            </div>
        );
    }

    // Extract and format data from CEO dashboard response
    const formatCurrency = (value) => `₹${(value || 0).toLocaleString('en-IN')}`;

    const financials = data?.financials || {};
    const business = data?.business || {};
    const sales = data?.sales || {};
    const team = data?.team || {};

    // Map CEO dashboard data to banking dashboard
    const currentFunds = financials?.currentFunds?.value || 0;
    const totalRevenue = financials?.monthlyRevenue?.value || 0;
    const targetRevenue = financials?.ytdRevenue?.value || 0;
    const monthlyExpenses = financials?.monthlyExpenses?.value || 0;
    const monthlyProfit = financials?.monthlyProfit?.value || 0;
    const profitMargin = financials?.monthlyProfit?.margin || 0;
    const revenueGrowth = financials?.monthlyRevenue?.growth || 0;
    
    // Business metrics
    const activeClients = business?.activeClients?.value || 0;
    const totalClients = business?.activeClients?.total || 0;
    const activeProjects = business?.activeProjects?.value || 0;
    const pipelineValue = business?.pipelineValue?.value || 0;
    
    // Sales & leads
    const activeLeads = sales?.activeLeads?.value || 0;
    const conversionRate = sales?.conversionRate?.value || 0;
    const leadFlow = sales?.leadFlow || {};
    
    // Team data
    const totalEmployees = team?.totalEmployees || 0;
    const attendanceRate = team?.attendanceRate?.value || 0;

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="dashboard-card flex justify-between items-center">
                <div>
                    <h1 className="text-2xl font-bold text-foreground flex items-center gap-2">
                        <Briefcase className="text-primary" />
                        Banking & Financial Overview
                    </h1>
                    <p className="text-muted-foreground mt-1">
                        Real-time financial insights and business metrics
                    </p>
                </div>
            </div>

            {/* Stats Overview */}
            <div className="space-y-6">
                {/* Financials - Large Cards */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <StatCard
                        title="Available Balance"
                        value={formatCurrency(currentFunds)}
                        icon={DollarSign}
                        color="success"
                        trend="Current Funds in Bank"
                        chartData={generateSparkline('up')}
                    />

                    <StatCard
                        title={
                            <div className="flex items-center gap-2">
                                <span>Monthly Revenue</span>
                                <span className="text-xs opacity-60">{revenueGrowth > 0 ? '+' : ''}{revenueGrowth}% growth</span>
                            </div>
                        }
                        value={formatCurrency(totalRevenue)}
                        icon={DollarSign}
                        color="primary"
                        trend={`YTD: ${formatCurrency(targetRevenue)}`}
                        chartData={generateSparkline(revenueGrowth > 0 ? 'up' : 'down')}
                    />
                </div>

                {/* Operational Stats - 4 Columns */}
                <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
                    <StatCard
                        title="Monthly Profit"
                        value={formatCurrency(monthlyProfit)}
                        icon={TrendingUp}
                        color="success"
                        trend={`${profitMargin}% margin`}
                        chartData={generateSparkline('up')}
                    />

                    <StatCard
                        title="Monthly Expenses"
                        value={formatCurrency(monthlyExpenses)}
                        icon={DollarSign}
                        color="danger"
                        trend="Operating costs"
                        chartData={generateSparkline('neutral')}
                    />

                    <StatCard
                        title="Active Clients"
                        value={activeClients}
                        icon={Building2}
                        color="purple"
                        trend={`${totalClients} total clients`}
                        chartData={generateSparkline('neutral')}
                    />

                    <StatCard
                        title="Active Projects"
                        value={activeProjects}
                        icon={Briefcase}
                        color="info"
                        trend={`Pipeline: ${formatCurrency(pipelineValue)}`}
                        chartData={generateSparkline('neutral')}
                    />
                </div>

                {/* Additional Business Metrics - 3 Columns */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    <StatCard
                        title="Active Leads"
                        value={activeLeads}
                        icon={Users}
                        color="warning"
                        trend={`${conversionRate}% conversion rate`}
                        chartData={generateSparkline('neutral')}
                    />

                    <StatCard
                        title="Team Size"
                        value={totalEmployees}
                        icon={Users}
                        color="info"
                        trend={`${attendanceRate}% attendance today`}
                        chartData={generateSparkline('neutral')}
                    />

                    <StatCard
                        title="Pipeline Value"
                        value={formatCurrency(pipelineValue)}
                        icon={Target}
                        color="primary"
                        trend={`${leadFlow?.month || 0} leads this month`}
                        chartData={generateSparkline('up')}
                    />
                </div>

                {/* Financial Summary Cards */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="dashboard-card">
                        <div className="mb-4">
                            <h2 className="text-lg font-bold text-foreground flex items-center gap-2">
                                <DollarSign className="text-emerald-500" size={20} />
                                Revenue Breakdown
                            </h2>
                        </div>
                        <div className="space-y-4">
                            <div className="flex justify-between items-center p-3 bg-emerald-500/10 rounded-lg border border-emerald-500/20">
                                <span className="text-sm text-muted-foreground">Current Funds</span>
                                <span className="text-lg font-bold text-emerald-500">{formatCurrency(currentFunds)}</span>
                            </div>
                            <div className="flex justify-between items-center p-3 bg-primary/10 rounded-lg border border-primary/20">
                                <span className="text-sm text-muted-foreground">Monthly Revenue</span>
                                <span className="text-lg font-bold text-primary">{formatCurrency(totalRevenue)}</span>
                            </div>
                            <div className="flex justify-between items-center p-3 bg-blue-500/10 rounded-lg border border-blue-500/20">
                                <span className="text-sm text-muted-foreground">YTD Revenue</span>
                                <span className="text-lg font-bold text-blue-500">{formatCurrency(targetRevenue)}</span>
                            </div>
                            <div className="flex justify-between items-center p-3 bg-purple-500/10 rounded-lg border border-purple-500/20">
                                <span className="text-sm text-muted-foreground">Monthly Profit</span>
                                <span className="text-lg font-bold text-purple-500">{formatCurrency(monthlyProfit)}</span>
                            </div>
                        </div>
                    </div>

                    <div className="dashboard-card">
                        <div className="mb-4">
                            <h2 className="text-lg font-bold text-foreground flex items-center gap-2">
                                <Target className="text-primary" size={20} />
                                Business Metrics
                            </h2>
                        </div>
                        <div className="space-y-4">
                            <div className="flex justify-between items-center p-3 bg-purple-500/10 rounded-lg border border-purple-500/20">
                                <span className="text-sm text-muted-foreground">Active Clients</span>
                                <span className="text-lg font-bold text-purple-500">{activeClients} / {totalClients}</span>
                            </div>
                            <div className="flex justify-between items-center p-3 bg-blue-500/10 rounded-lg border border-blue-500/20">
                                <span className="text-sm text-muted-foreground">Active Projects</span>
                                <span className="text-lg font-bold text-blue-500">{activeProjects}</span>
                            </div>
                            <div className="flex justify-between items-center p-3 bg-orange-500/10 rounded-lg border border-orange-500/20">
                                <span className="text-sm text-muted-foreground">Active Leads</span>
                                <span className="text-lg font-bold text-orange-500">{activeLeads}</span>
                            </div>
                            <div className="flex justify-between items-center p-3 bg-emerald-500/10 rounded-lg border border-emerald-500/20">
                                <span className="text-sm text-muted-foreground">Conversion Rate</span>
                                <span className="text-lg font-bold text-emerald-500">{conversionRate}%</span>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default BankingDashboard;
