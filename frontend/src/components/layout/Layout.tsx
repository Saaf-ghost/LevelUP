import React from 'react';
import { Outlet } from 'react-router-dom';
import Header from './Header';

const Layout: React.FC = () => {
  return (
    <div className="flex flex-col h-screen bg-[#F8FAFC] text-slate-900 overflow-hidden">
      <Header />
      <main className="flex-1 overflow-x-auto overflow-y-auto p-6 relative bg-gradient-to-br from-slate-50 via-white to-orange-50/30">
        <Outlet />
      </main>
    </div>
  );
};

export default Layout;
