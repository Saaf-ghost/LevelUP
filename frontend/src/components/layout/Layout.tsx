import React from 'react';
import { Outlet } from 'react-router-dom';
import Header from './Header';

const Layout: React.FC = () => {
  return (
    <div className="flex flex-col h-screen bg-[#0A0E1A] text-slate-100 overflow-hidden">
      <Header />
      <main className="flex-1 overflow-x-auto overflow-y-auto p-6 relative">
        <Outlet />
      </main>
    </div>
  );
};

export default Layout;
