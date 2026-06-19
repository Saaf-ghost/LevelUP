import React, { useState } from 'react';
import { NavLink } from 'react-router-dom';
import {
  LayoutDashboard,
  FolderKanban,
  Users,
  BrainCircuit,
  ClipboardList,
  ChevronLeft,
  ChevronRight,
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';

const Sidebar: React.FC = () => {
  const { role, user } = useAuth();
  const [isCollapsed, setIsCollapsed] = useState(false);

  const navItems = [
    { name: 'Board',       icon: <LayoutDashboard size={18} />, path: '/dashboard' },
    { name: 'Projects',    icon: <FolderKanban size={18} />,    path: '/dashboard/projects' },
    { name: 'Team',        icon: <Users size={18} />,           path: '/dashboard/team' },
    { name: 'AI Insights', icon: <BrainCircuit size={18} />,    path: '/dashboard/ai-insights' },
    { name: 'My Tasks',    icon: <ClipboardList size={18} />,   path: '/dashboard/my-tasks' },
  ];

  return (
    <aside
      className={`${
        isCollapsed ? 'w-[60px]' : 'w-56'
      } bg-slate-900 border-r border-slate-800/60 flex flex-col transition-all duration-300 relative shrink-0`}
    >
      {/* Collapse toggle */}
      <button
        onClick={() => setIsCollapsed(v => !v)}
        className="absolute -right-3 top-5 bg-slate-800 hover:bg-slate-700 text-slate-300 p-0.5 rounded-full border border-slate-600 z-10 transition-colors"
      >
        {isCollapsed ? <ChevronRight size={14} /> : <ChevronLeft size={14} />}
      </button>

      {/* Logo */}
      <div className="h-14 flex items-center px-4 border-b border-slate-800/60 overflow-hidden whitespace-nowrap">
        <NavLink
          to="/"
          className="flex items-center gap-2 text-lg font-bold bg-clip-text text-transparent bg-gradient-to-r from-blue-400 to-indigo-500 hover:opacity-80 transition-opacity"
        >
          <div className="w-7 h-7 rounded bg-indigo-500/20 flex items-center justify-center border border-indigo-500/30 shrink-0">
            <span className="text-indigo-400 text-sm">L</span>
          </div>
          {!isCollapsed && <span>LevelUP</span>}
        </NavLink>
      </div>

      {/* Navigation */}
      <div className="p-3 flex-1 overflow-y-auto overflow-x-hidden">
        {!isCollapsed && (
          <div className="text-[10px] font-semibold text-slate-500 uppercase tracking-wider mb-3 px-2">
            Navigation
          </div>
        )}
        <nav className="space-y-0.5">
          {navItems.map(item => (
            <NavLink
              key={item.name}
              to={item.path}
              end={item.path === '/dashboard'}
              className={({ isActive }) =>
                `flex items-center gap-2.5 px-2.5 py-2 rounded-lg transition-colors duration-150 text-[13px] ${
                  isActive
                    ? 'bg-indigo-500/10 text-indigo-400 font-medium'
                    : 'text-slate-400 hover:text-slate-100 hover:bg-slate-800/60'
                } ${isCollapsed ? 'justify-center' : ''}`
              }
              title={isCollapsed ? item.name : undefined}
            >
              <div className="shrink-0">{item.icon}</div>
              {!isCollapsed && <span className="whitespace-nowrap">{item.name}</span>}
            </NavLink>
          ))}
        </nav>
      </div>

      {/* User info (bottom) */}
      <div className="p-3 border-t border-slate-800/60 overflow-hidden">
        {!isCollapsed && (
          <div className="px-2 flex items-center gap-2">
            <div className="w-7 h-7 rounded-full bg-gradient-to-tr from-indigo-500 to-purple-500 flex items-center justify-center text-[10px] font-bold text-white shrink-0">
              {user?.firstName?.charAt(0)}{user?.lastName?.charAt(0)}
            </div>
            <div className="flex flex-col min-w-0">
              <span className="text-xs font-medium text-slate-200 truncate">
                {user?.firstName} {user?.lastName}
              </span>
              <span className="text-[10px] text-slate-500">{role}</span>
            </div>
          </div>
        )}
      </div>
    </aside>
  );
};

export default Sidebar;
