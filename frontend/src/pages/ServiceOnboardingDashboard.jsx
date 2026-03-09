import React, { useState, useEffect, useCallback } from 'react';
import { useAuth } from '../context/AuthContext';
import {
  TrendingUp,
  Target,
  ClipboardCheck,
  Users,
  BarChart3,
  Building2
} from 'lucide-react';
import DashboardLayout from '../components/DashboardLayout';
import AttendancePunch from '../components/AttendancePunch';
import DashboardOverview from '../components/sales/views/DashboardOverview';
import LeadsPipelineView from '../components/sales/views/LeadsPipelineView';
import MyLeadsView from '../components/sales/views/MyLeadsView';
import CompaniesView from '../components/sales/views/CompaniesView';
import MyTargetsView from '../components/sales/views/MyTargetsView';
import { useLeads } from '../hooks/useLeads';
import { useCompanies } from '../hooks/useCompanies';
import { useTargets } from '../hooks/useTargets';

const ServiceOnboardingDashboard = () => {
  const { user } = useAuth();
  
  // Persist current view in localStorage
  const [currentView, setCurrentView] = useState(() => {
    const savedView = localStorage.getItem('serviceOnboardingDashboardView');
    return savedView || 'dashboard';
  });

  // Save view to localStorage whenever it changes
  useEffect(() => {
    localStorage.setItem('serviceOnboardingDashboardView', currentView);
  }, [currentView]);
  
  // Callback to refresh targets when data changes
  const handleDataChange = useCallback(() => {
    fetchTargets();
    fetchTargetAnalytics();
  }, []);
  
  // Use custom hooks for data management
  const { 
    myLeads, 
    stats, 
    isLoading: leadsLoading,
    fetchLeads,
    addFollowUp,
    submitEvidence,
    updateLeadStage,
    updateLeadStatus,
    createLead
  } = useLeads(handleDataChange);
  
  const { 
    myCompanies, 
    isLoading: companiesLoading,
    fetchCompanies,
    submitCompany,
    deleteCompany
  } = useCompanies(handleDataChange);
  
  const { 
    myTargets, 
    targetAnalytics,
    isLoading: targetsLoading,
    fetchTargets,
    fetchTargetAnalytics
  } = useTargets();

  // Sidebar navigation actions
  const sidebarActions = [
    {
      label: 'Dashboard',
      icon: BarChart3,
      onClick: () => setCurrentView('dashboard'),
      active: currentView === 'dashboard'
    },
    {
      label: 'My Leads',
      icon: Users,
      onClick: () => setCurrentView('my-leads'),
      active: currentView === 'my-leads'
    },
    {
      label: 'Leads Pipeline',
      icon: TrendingUp,
      onClick: () => setCurrentView('leads-pipeline'),
      active: currentView === 'leads-pipeline'
    },
    {
      label: 'Companies',
      icon: Building2,
      onClick: () => setCurrentView('companies'),
      active: currentView === 'companies'
    },
    {
      label: 'My Targets',
      icon: Target,
      onClick: () => setCurrentView('my-targets'),
      active: currentView === 'my-targets'
    },
    {
      label: 'My Attendance',
      icon: ClipboardCheck,
      onClick: () => setCurrentView('my-attendance'),
      active: currentView === 'my-attendance'
    }
  ];

  // Fetch all data on component mount
  useEffect(() => {
    const fetchAllData = async () => {
      await Promise.all([
        fetchLeads(),
        fetchCompanies(),
        fetchTargets()
      ]);
    };
    
    fetchAllData();
  }, [fetchLeads, fetchCompanies, fetchTargets]);

  // Render attendance view
  if (currentView === 'my-attendance') {
    return (
      <DashboardLayout sidebarActions={sidebarActions}>
        <AttendancePunch />
      </DashboardLayout>
    );
  }

  // Render leads pipeline view
  if (currentView === 'leads-pipeline') {
    return (
      <DashboardLayout sidebarActions={sidebarActions}>
        <LeadsPipelineView
          myLeads={myLeads}
          myCompanies={myCompanies}
          onCreateLead={createLead}
          onUpdateLeadStage={updateLeadStage}
        />
      </DashboardLayout>
    );
  }

  // Render companies view
  if (currentView === 'companies') {
    return (
      <DashboardLayout sidebarActions={sidebarActions}>
        <CompaniesView
          myCompanies={myCompanies}
          onSubmitCompany={submitCompany}
          onCreateLead={createLead}
          onDeleteCompany={deleteCompany}
        />
      </DashboardLayout>
    );
  }

  // Render targets view
  if (currentView === 'my-targets') {
    return (
      <DashboardLayout sidebarActions={sidebarActions}>
        <MyTargetsView 
          myTargets={myTargets} 
          onFetchAnalytics={fetchTargetAnalytics}
        />
      </DashboardLayout>
    );
  }

  // Render my leads view
  if (currentView === 'my-leads') {
    return (
      <DashboardLayout sidebarActions={sidebarActions}>
        <MyLeadsView
          myLeads={myLeads}
          onUpdateStage={updateLeadStage}
          onUpdateStatus={updateLeadStatus}
          onAddFollowUp={addFollowUp}
          onSubmitEvidence={submitEvidence}
        />
      </DashboardLayout>
    );
  }

  // Main Dashboard View
  return (
    <DashboardLayout sidebarActions={sidebarActions}>
      <DashboardOverview
        user={user}
        stats={stats}
        myLeads={myLeads}
        myCompanies={myCompanies}
        myTargets={myTargets}
        onNavigate={setCurrentView}
      />
    </DashboardLayout>
  );
};

export default ServiceOnboardingDashboard;
