import React from 'react';
import DashboardLayout from '../components/DashboardLayout';
import AnalyticsDashboard from '../components/AnalyticsDashboard';
import { useNavigate } from 'react-router-dom';
import { 
  BarChart2, 
  ArrowLeft,
  Briefcase,
  DollarSign,
  ClipboardCheck,
  Calendar
} from 'lucide-react';

const AnalyticsPage = () => {
  const navigate = useNavigate();

  const sidebarActions = [
    {
      label: 'Back to Dashboard',
      icon: ArrowLeft,
      onClick: () => navigate('/dashboard')
    },
    {
      label: 'Analytics',
      icon: BarChart2,
      onClick: () => navigate('/analytics'),
      active: true
    },
    {
      label: 'Dashboard',
      icon: Briefcase,
      onClick: () => navigate('/dashboard')
    },
    {
      label: 'Revenue & Sales',
      icon: DollarSign,
      onClick: () => navigate('/dashboard') // Will need to implement state passing
    },
    {
      label: 'Attendance',
      icon: ClipboardCheck,
      onClick: () => navigate('/dashboard')
    },
    {
      label: 'Leave Management',
      icon: Calendar,
      onClick: () => navigate('/dashboard')
    }
  ];

  return (
    <DashboardLayout sidebarActions={sidebarActions}>
      <AnalyticsDashboard />
    </DashboardLayout>
  );
};

export default AnalyticsPage;
