// Example of how to use active tab highlighting in your dashboards

import React, { useState } from 'react';
import DashboardLayout from '../components/DashboardLayout';
import { Home, Users, BarChart, Settings } from 'lucide-react';

const ExampleDashboard = () => {
    const [currentView, setCurrentView] = useState('dashboard');

    // Define sidebar actions with active state
    const sidebarActions = [
        {
            label: 'Dashboard',
            icon: Home,
            onClick: () => setCurrentView('dashboard'),
            active: currentView === 'dashboard' // This makes it highlighted!
        },
        {
            label: 'Team',
            icon: Users,
            onClick: () => setCurrentView('team'),
            active: currentView === 'team'
        },
        {
            label: 'Analytics',
            icon: BarChart,
            onClick: () => setCurrentView('analytics'),
            active: currentView === 'analytics'
        },
        {
            label: 'Settings',
            icon: Settings,
            onClick: () => setCurrentView('settings'),
            active: currentView === 'settings'
        }
    ];

    return (
        <DashboardLayout sidebarActions={sidebarActions}>
            {/* Your dashboard content here */}
            {currentView === 'dashboard' && <div>Dashboard View</div>}
            {currentView === 'team' && <div>Team View</div>}
            {currentView === 'analytics' && <div>Analytics View</div>}
            {currentView === 'settings' && <div>Settings View</div>}
        </DashboardLayout>
    );
};

export default ExampleDashboard;

/*
 * HOW IT WORKS:
 * 
 * 1. Create a state variable for current view: useState('dashboard')
 * 
 * 2. In sidebarActions, set active: currentView === 'viewName'
 * 
 * 3. When active is true:
 *    - Button gets gradient-primary background
 *    - Text becomes white
 *    - Shadow and scale effect applied
 *    - Icon turns white
 * 
 * 4. When active is false:
 *    - Button is transparent with gray text
 *    - Hover shows white/50 background
 *    - Icon is gray, turns purple on hover
 * 
 * RESULT: Current tab is beautifully highlighted with gradient!
 */
