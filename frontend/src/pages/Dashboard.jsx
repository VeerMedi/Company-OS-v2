import React from 'react';
import { useAuth } from '../context/AuthContext';
import CEODashboard from './CEODashboard';
import CoFounderDashboard from './CoFounderDashboard';
import HRDashboard from './HRDashboard';
import ManagerDashboard from './ManagerDashboard';
import ServiceDeliveryDashboard from './ServiceDeliveryDashboard';
import ServiceOnboardingDashboard from './ServiceOnboardingDashboard';
import HeadOfSalesDashboard from './HeadOfSalesDashboard';
import IndividualDeveloperDashboard from './IndividualDeveloperDashboard';
import TeamLeadDashboard from './TeamLeadDashboard';
import DeveloperDashboard from './DeveloperDashboard';
import InternDashboard from './InternDashboard';
import { ROLES } from '../utils/helpers';

const Dashboard = () => {
  const { user } = useAuth();

  if (!user) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600"></div>
      </div>
    );
  }

  // Route to appropriate dashboard based on user role
  // Add logic for service categories
  if (user.role === ROLES.SERVICE_DELIVERY) {
    return <ServiceDeliveryDashboard />;
  }
  if (user.role === ROLES.SERVICE_ONBOARDING) {
    return <ServiceOnboardingDashboard />;
  }
  if (user.role === 'head-of-sales') {
    return <HeadOfSalesDashboard />;
  }

  // Individual developers get their own dashboard
  if (user.role === 'individual' && user.jobCategory === 'developer') {
    return <IndividualDeveloperDashboard />;
  }

  // New hierarchical roles
  if (user.role === 'team-lead') {
    return <TeamLeadDashboard />;
  }
  if (user.role === 'developer') {
    return <DeveloperDashboard />;
  }
  if (user.role === 'intern' || user.role === 'developer' || user.role === 'team-lead') {
    return <DeveloperDashboard />;
  }

  switch (user.role) {
    case ROLES.CEO:
      return <CEODashboard />;
    case ROLES.CO_FOUNDER:
      return <CoFounderDashboard />;
    case ROLES.HR:
      return <HRDashboard />;
    case ROLES.MANAGER:
      return <ManagerDashboard />;
    default:
      return <ServiceDeliveryDashboard />;
  }
};

export default Dashboard;