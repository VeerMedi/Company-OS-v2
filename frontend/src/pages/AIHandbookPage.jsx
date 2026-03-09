import React from 'react';
import { Bot } from 'lucide-react';
import DashboardLayout from '../components/DashboardLayout';
import DeveloperHandbookChat from '../components/DeveloperHandbookChat';
import { useNavigate } from 'react-router-dom';

const AIHandbookPage = () => {
    const navigate = useNavigate();

    const sidebarActions = [
        {
            label: 'Back to Dashboard',
            icon: Bot,
            onClick: () => navigate('/individual-developer'),
            active: false
        }
    ];

    return (
        <DashboardLayout sidebarActions={sidebarActions} showBackButtonOverride={true}>
            <div className="h-[calc(100vh-10rem)]">
                <DeveloperHandbookChat />
            </div>
        </DashboardLayout>
    );
};

export default AIHandbookPage;
