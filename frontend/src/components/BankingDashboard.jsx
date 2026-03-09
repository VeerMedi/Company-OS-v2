import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { AlertCircle } from 'lucide-react';
import api from '../utils/api';
import BankingFinancialWidgets from './BankingFinancialWidgets';

const BankingDashboard = () => {
    const { user } = useAuth();
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [data, setData] = useState(null);

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
                    setError('Access Denied: This section is only available for CEO/Co-founder roles');
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

    return <BankingFinancialWidgets data={data} />;
};

export default BankingDashboard;
