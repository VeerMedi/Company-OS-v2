import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import api from '../utils/api';
import {
  Users,
  Shield,
  TrendingUp,
  DollarSign,
  UserCheck,
  Calendar,
  BarChart3,
  Settings,
  FileText,
  Target,
  ClipboardCheck,
  Award,
  Building,
  CheckCircle,
  Clock,
  Briefcase,
  CreditCard
} from 'lucide-react';
import {
  LineChart,
  Line,
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer
} from 'recharts';
import DashboardLayout from '../components/DashboardLayout';
import StatCard from '../components/StatCard';
import PayrollReminderPopup from '../components/PayrollReminderPopup';
import BankingDashboard from '../components/BankingDashboard';
import ProfitRenewDashboard from '../components/ProfitRenewDashboard';
import ExpensesDashboard from '../components/ExpensesDashboard';
import ClientsProjectsDashboard from '../components/ClientsProjectsDashboard';
import ManagementDashboard from '../components/ManagementDashboard';
import CEOSummaryWidgets from '../components/CEOSummaryWidgets';
import ClientManagementDashboard from '../components/ClientManagementDashboard';


const CEODashboard = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  
  // Persist current view in localStorage to maintain state across page reloads
  const [currentView, setCurrentView] = useState(() => {
    const savedView = localStorage.getItem('ceoDashboardView');
    return savedView || 'dashboard';
  });

  // Save view to localStorage whenever it changes
  useEffect(() => {
    localStorage.setItem('ceoDashboardView', currentView);
  }, [currentView]);

  // Dashboard data state
  const [dashboardData, setDashboardData] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchDashboardData = async () => {
      try {
        const [ceoResponse, revenueResponse] = await Promise.all([
          api.get('/ceo/dashboard'),
          api.get('/revenue/dashboard/hos')
        ]);

        if (ceoResponse.data.success) {
          const revenueData = revenueResponse.data.success ? revenueResponse.data.data : null;

          setDashboardData({
            ...ceoResponse.data.data,
            revenueData // Attach dedicated revenue data
          });
        }
      } catch (error) {
        console.error('Error fetching dashboard data:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchDashboardData();
  }, []);
  const formatCurrency = (value) => `₹${(value / 100000).toFixed(2)}L`;

  const stats = [
    { name: 'Total Employees', value: '247', change: '+12%', icon: Users },
    { name: 'Revenue (YTD)', value: '$2.4M', change: '+18%', icon: DollarSign },
    { name: 'Active Projects', value: '18', change: '+3', icon: Target },
    { name: 'Performance Score', value: '94%', change: '+2%', icon: TrendingUp },
  ];

  const quickActions = [
    { name: 'Company Analytics', icon: BarChart3, href: '/analytics' },
    { name: 'Executive Reports', icon: FileText, href: '/reports' },
    { name: 'Strategic Planning', icon: Target, href: '/planning' },
    { name: 'System Settings', icon: Settings, href: '/admin/settings' },
  ];

  const sidebarActions = [
    {
      label: 'Dashboard',
      icon: BarChart3,
      onClick: () => setCurrentView('dashboard'),
      active: currentView === 'dashboard',
      viewId: 'dashboard',
      themeColor: '34, 197, 94', // Emerald green
      previewData: {
        currentFunds: dashboardData ? formatCurrency(dashboardData.financials.currentFunds.value) : '₹24,50,000',
        activeProjects: dashboardData?.business?.activeProjects?.value || 5,
        revenue: dashboardData ? formatCurrency(dashboardData.financials.monthlyRevenue?.value || 1500000) : '₹15,00,000',
        expenses: dashboardData ? formatCurrency(dashboardData.financials.monthlyExpenses?.value || 850000) : '₹8,50,000',
        profitMargin: dashboardData?.financials?.profitMargin || 43
      }
    },
    {
      label: 'Banking',
      icon: Briefcase,
      onClick: () => setCurrentView('banking'),
      active: currentView === 'banking',
      viewId: 'banking',
      themeColor: '16, 185, 129', // Emerald
      previewData: { balance: dashboardData ? formatCurrency(dashboardData.financials.currentFunds.value) : '₹18,50,000' }
    },
    {
      label: 'Profit and Renew',
      icon: TrendingUp,
      onClick: () => setCurrentView('profit-renew'),
      active: currentView === 'profit-renew',
      viewId: 'profit-renew',
      themeColor: '34, 197, 94', // Emerald
      previewData: { profitMargin: dashboardData?.financials?.monthlyProfit?.margin || 43 }
    },
    {
      label: 'Expenses',
      icon: CreditCard,
      onClick: () => setCurrentView('expenses'),
      active: currentView === 'expenses',
      viewId: 'expenses',
      themeColor: '239, 68, 68', // Red
      previewData: { total: dashboardData ? formatCurrency(dashboardData.financials.monthlyExpenses.value) : '₹8,50,000' }
    },
    {
      label: 'Projects',
      icon: Briefcase,
      onClick: () => setCurrentView('clients-projects'),
      active: currentView === 'clients-projects',
      viewId: 'clients-projects',
      themeColor: '59, 130, 246', // Blue
      previewData: {
        clients: dashboardData?.business?.activeClients?.value || 12,
        projects: dashboardData?.business?.activeProjects?.value || 8
      }
    },
    {
      label: 'Management',
      icon: Users,
      onClick: () => setCurrentView('management'),
      active: currentView === 'management',
      viewId: 'management',
      themeColor: '139, 92, 246', // Violet
      previewData: { employees: dashboardData?.team?.totalEmployees || 25 }
    },
    {
      label: 'Client CMS',
      icon: Target,
      onClick: () => setCurrentView('client-management'),
      active: currentView === 'client-management',
      viewId: 'client-management',
      themeColor: '34, 211, 238', // Cyan
      previewData: { clients: dashboardData?.business?.activeClients?.value || 12 }
    },
  ];

  /* Sub View Rendering Logic */
  if (currentView === 'banking') return <DashboardLayout sidebarActions={sidebarActions}><BankingDashboard /></DashboardLayout>;
  if (currentView === 'profit-renew') return <DashboardLayout sidebarActions={sidebarActions}><ProfitRenewDashboard /></DashboardLayout>;
  if (currentView === 'expenses') return <DashboardLayout sidebarActions={sidebarActions}><ExpensesDashboard /></DashboardLayout>;
  if (currentView === 'clients-projects') return <DashboardLayout sidebarActions={sidebarActions}><ClientsProjectsDashboard /></DashboardLayout>;
  if (currentView === 'management') return <DashboardLayout sidebarActions={sidebarActions}><ManagementDashboard /></DashboardLayout>;
  if (currentView === 'client-management') return <DashboardLayout sidebarActions={sidebarActions}><ClientManagementDashboard /></DashboardLayout>;

  return (
    <>
      <PayrollReminderPopup userRole={user?.role} />
      <DashboardLayout sidebarActions={sidebarActions}>
        <div className="space-y-6">
          {/* Premium Widget Dashboard */}
          <CEOSummaryWidgets dashboardData={dashboardData} />



          {/* Quick Actions */}
          <div className="dashboard-card">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">Executive Actions</h2>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              {quickActions.map((action) => {
                const IconComponent = action.icon;
                return (
                  <a
                    key={action.name}
                    href={action.href}
                    className="flex flex-col items-center p-4 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors"
                  >
                    <IconComponent className="h-8 w-8 text-primary-600 mb-2" />
                    <span className="text-sm font-medium text-gray-900 text-center">
                      {action.name}
                    </span>
                  </a>
                );
              })}
            </div>
          </div>

          {/* Recent Activity & Insights */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Recent Activity */}
            <div className="dashboard-card">
              <h2 className="text-lg font-semibold text-gray-900 mb-4">Recent Executive Activity</h2>
              <div className="space-y-4">
                <div className="flex items-start space-x-3">
                  <div className="flex-shrink-0 w-2 h-2 bg-green-500 rounded-full mt-2"></div>
                  <div className="flex-1">
                    <p className="text-sm text-gray-900">Q4 Board Meeting scheduled</p>
                    <p className="text-xs text-gray-500">2 hours ago</p>
                  </div>
                </div>
                <div className="flex items-start space-x-3">
                  <div className="flex-shrink-0 w-2 h-2 bg-blue-500 rounded-full mt-2"></div>
                  <div className="flex-1">
                    <p className="text-sm text-gray-900">New department head approved</p>
                    <p className="text-xs text-gray-500">4 hours ago</p>
                  </div>
                </div>
                <div className="flex items-start space-x-3">
                  <div className="flex-shrink-0 w-2 h-2 bg-yellow-500 rounded-full mt-2"></div>
                  <div className="flex-1">
                    <p className="text-sm text-gray-900">Strategic plan review completed</p>
                    <p className="text-xs text-gray-500">1 day ago</p>
                  </div>
                </div>
              </div>
            </div>

            {/* Key Insights */}
            <div className="dashboard-card">
              <h2 className="text-lg font-semibold text-gray-900 mb-4">Key Business Insights</h2>
              <div className="space-y-4">
                <div className="p-4 bg-green-50 rounded-lg">
                  <div className="flex items-center">
                    <TrendingUp className="h-5 w-5 text-green-600 mr-2" />
                    <span className="text-sm font-medium text-green-800">Revenue Growth</span>
                  </div>
                  <p className="text-sm text-green-700 mt-1">
                    18% increase in quarterly revenue, exceeding targets
                  </p>
                </div>
                <div className="p-4 bg-blue-50 rounded-lg">
                  <div className="flex items-center">
                    <UserCheck className="h-5 w-5 text-blue-600 mr-2" />
                    <span className="text-sm font-medium text-blue-800">Team Performance</span>
                  </div>
                  <p className="text-sm text-blue-700 mt-1">
                    94% employee satisfaction, up from 89% last quarter
                  </p>
                </div>
                <div className="p-4 bg-purple-50 rounded-lg">
                  <div className="flex items-center">
                    <Target className="h-5 w-5 text-purple-600 mr-2" />
                    <span className="text-sm font-medium text-purple-800">Goal Achievement</span>
                  </div>
                  <p className="text-sm text-purple-700 mt-1">
                    15 out of 18 strategic objectives on track for completion
                  </p>
                </div>
              </div>
            </div>

            {/* Quick Actions */}
            <div className="dashboard-card">
              <h2 className="text-lg font-semibold text-white mb-4">Executive Actions</h2>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                {quickActions.map((action) => (
                  <a key={action.name} href={action.href} className="flex flex-col items-center p-4 bg-gray-800/50 border border-gray-700/50 rounded-xl hover:bg-gray-800 hover:border-primary-500/30 transition-all group">
                    <action.icon className="h-8 w-8 text-gray-400 group-hover:text-primary-400 mb-2 transition-colors" />
                    <span className="text-sm font-medium text-gray-300 text-center group-hover:text-white transition-colors">{action.name}</span>
                  </a>
                ))}
              </div>
            </div>
          </div>
        </div>
      </DashboardLayout>
    </>
  );
};

export default CEODashboard;