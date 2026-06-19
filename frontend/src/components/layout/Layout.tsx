import React, { useState } from 'react';
import { Outlet } from 'react-router-dom';
import Sidebar from './Sidebar';
import Header from './Header';
import AiInsightsPanel from '../ai/AiInsightsPanel';

const Layout: React.FC = () => {
  const [isAiPanelOpen, setIsAiPanelOpen] = useState(false);

  return (
    <div className="flex h-screen bg-slate-900 text-slate-100 overflow-hidden">
      <Sidebar />
      <div className="flex flex-col flex-1 min-w-0 overflow-hidden">
        <Header 
          toggleAiPanel={() => setIsAiPanelOpen(!isAiPanelOpen)} 
          isAiPanelOpen={isAiPanelOpen} 
        />
        <main className="flex-1 overflow-x-auto overflow-y-auto p-6 relative">
          <Outlet />
        </main>
      </div>
      {/* Right Sidebar for AI Insights */}
      <AiInsightsPanel isOpen={isAiPanelOpen} />
    </div>
  );
};

export default Layout;
