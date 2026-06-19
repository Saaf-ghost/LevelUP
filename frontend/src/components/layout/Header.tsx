import React, { useState, useRef, useEffect, useMemo } from 'react';
import { PieChart, Pie, Cell } from 'recharts';
import { Bell, Search, Sparkles, LogOut, Settings, User as UserIcon, ChevronDown } from 'lucide-react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { useSprint } from '../../context/SprintContext';

interface HeaderProps {
  toggleAiPanel: () => void;
  isAiPanelOpen: boolean;
}

const Header: React.FC<HeaderProps> = ({ toggleAiPanel, isAiPanelOpen }) => {
  const { sprint, projects, currentProject, setCurrentProject, members } = useSprint();
  const healthScore = sprint ? sprint.healthScore : 100;
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [isProfileOpen, setIsProfileOpen] = useState(false);
  const profileRef = useRef<HTMLDivElement>(null);

  // Close dropdown on outside click
  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (profileRef.current && !profileRef.current.contains(e.target as Node)) {
        setIsProfileOpen(false);
      }
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  const handleLogout = () => {
    setIsProfileOpen(false);
    logout();
    navigate('/', { replace: true });
  };

  // ---------- Sprint Timer — dynamic ----------
  const { daysLeft, totalDays, timePercent, timeColor } = useMemo(() => {
    if (!sprint) {
      return { daysLeft: 0, totalDays: 1, timePercent: 0, timeColor: '#475569' };
    }
    const now = Date.now();
    const start = new Date(sprint.startDate).getTime();
    const end   = new Date(sprint.endDate).getTime();
    const total = Math.max(1, Math.ceil((end - start) / 86400000));
    const left  = Math.max(0, Math.ceil((end - now) / 86400000));
    const pct   = Math.min(100, ((total - left) / total) * 100);

    let color = '#10b981'; // green
    if (left <= 2)      color = '#ef4444'; // red
    else if (left <= 5) color = '#f59e0b'; // amber

    return { daysLeft: left, totalDays: total, timePercent: pct, timeColor: color };
  }, [sprint]);

  const timeData = [
    { name: 'Elapsed',   value: timePercent },
    { name: 'Remaining', value: 100 - timePercent },
  ];

  // ---------- Health Score ----------
  const healthData = [
    { name: 'Score',     value: healthScore },
    { name: 'Remaining', value: 100 - healthScore },
  ];
  let healthColor = '#10b981';
  if (healthScore < 50)      healthColor = '#ef4444';
  else if (healthScore < 80) healthColor = '#f59e0b';

  return (
    <header className="h-16 bg-slate-900/80 backdrop-blur-md border-b border-slate-800/80 flex items-center justify-between px-5 z-10 sticky top-0">
      {/* Project Workspace Dropdown Switcher */}
      <div className="flex items-center gap-4">
        <div className="flex flex-col min-w-0">
          <span className="text-[10px] text-slate-500 font-semibold uppercase tracking-wider">Project Workspace</span>
          <div className="relative mt-0.5">
            <select
              value={currentProject?.id || ''}
              onChange={(e) => {
                const proj = projects.find(p => String(p.id) === e.target.value);
                setCurrentProject(proj || null);
              }}
              className="bg-slate-800/80 border border-slate-700/60 text-slate-200 text-xs font-semibold rounded-lg pl-3 pr-8 py-1 outline-none appearance-none cursor-pointer hover:border-indigo-500 hover:text-slate-100 transition-all"
            >
              {projects.map(p => (
                <option key={p.id} value={p.id}>{p.name}</option>
              ))}
              {projects.length === 0 && (
                <option value="">No projects found</option>
              )}
            </select>
            <div className="absolute inset-y-0 right-0 flex items-center pr-2.5 pointer-events-none text-slate-400">
              <ChevronDown size={12} />
            </div>
          </div>
        </div>

        {sprint && (
          <div className="hidden sm:flex flex-col border-l border-slate-800 pl-4 min-w-0">
            <h1 className="text-xs font-semibold text-slate-300 truncate">{sprint.name}</h1>
            <span className="text-[10px] text-slate-500 uppercase tracking-wider">Active Sprint</span>
          </div>
        )}
      </div>

      <div className="flex items-center gap-3">
        {/* Team Avatars */}
        <div className="hidden lg:flex items-center -space-x-2">
          {members.slice(0, 4).map(m => (
            <img
              key={m.id}
              src={m.avatar}
              alt={m.name}
              title={`${m.name} — ${m.skills.join(', ')}`}
              className="w-7 h-7 rounded-full border-2 border-slate-900 hover:border-indigo-500 transition-colors"
            />
          ))}
        </div>

        {/* Sprint Timer */}
        <div className="flex items-center gap-2 bg-slate-800/60 px-3 py-1 rounded-xl border border-slate-700/40">
          <div className="relative w-10 h-10 flex items-center justify-center">
            <PieChart width={44} height={44}>
              <Pie data={timeData} cx={18} cy={18} innerRadius={14} outerRadius={18} startAngle={90} endAngle={-270} dataKey="value" stroke="none">
                <Cell fill={timeColor} />
                <Cell fill="#1e293b" />
              </Pie>
            </PieChart>
            <span className="absolute inset-0 flex items-center justify-center text-[11px] font-bold" style={{ color: timeColor }}>
              {daysLeft}d
            </span>
          </div>
          <div className="hidden md:flex flex-col">
            <span className="text-[11px] font-semibold text-slate-300 leading-tight">Timer</span>
            <span className="text-[10px] text-slate-500 leading-tight">{daysLeft} of {totalDays} days</span>
          </div>
        </div>

        {/* Health Score */}
        <div className="flex items-center gap-2 bg-slate-800/60 px-3 py-1 rounded-xl border border-slate-700/40">
          <div className="relative w-10 h-10 flex items-center justify-center">
            <PieChart width={44} height={44}>
              <Pie data={healthData} cx={18} cy={18} innerRadius={14} outerRadius={18} startAngle={90} endAngle={-270} dataKey="value" stroke="none">
                <Cell fill={healthColor} />
                <Cell fill="#1e293b" />
              </Pie>
            </PieChart>
            <span className="absolute inset-0 flex items-center justify-center text-[11px] font-bold" style={{ color: healthColor }}>
              {healthScore}
            </span>
          </div>
          <div className="hidden md:flex flex-col">
            <span className="text-[11px] font-semibold text-slate-300 leading-tight">Health</span>
            <span className="text-[10px] text-slate-500 leading-tight">Score</span>
          </div>
        </div>

        {/* Toolbar */}
        <div className="flex items-center gap-1.5 border-l border-slate-800 pl-3 ml-1">
          <button className="p-1.5 text-slate-400 hover:text-slate-200 hover:bg-slate-800 rounded-lg transition-colors" title="Search">
            <Search size={18} />
          </button>
          <button className="p-1.5 text-slate-400 hover:text-slate-200 hover:bg-slate-800 rounded-lg transition-colors relative" title="Notifications">
            <Bell size={18} />
            <span className="absolute top-1 right-1 w-1.5 h-1.5 bg-red-500 rounded-full" />
          </button>
          <button
            onClick={toggleAiPanel}
            title="AI Insights"
            className={`p-1.5 rounded-lg transition-colors ${isAiPanelOpen ? 'bg-indigo-500/20 text-indigo-400' : 'text-slate-400 hover:text-indigo-400 hover:bg-indigo-500/10'}`}
          >
            <Sparkles size={18} />
          </button>

          {/* Profile Dropdown */}
          <div className="relative" ref={profileRef}>
            <button
              onClick={() => setIsProfileOpen(v => !v)}
              className="w-8 h-8 rounded-full border-2 border-slate-700 overflow-hidden hover:border-indigo-500 transition-colors focus:outline-none"
            >
              {user?.avatarUrl ? (
                <img src={user.avatarUrl} alt="Avatar" className="w-full h-full object-cover" />
              ) : (
                <div className="w-full h-full bg-gradient-to-tr from-indigo-500 to-purple-500 flex items-center justify-center text-[10px] font-bold text-white">
                  {user?.firstName?.charAt(0)}{user?.lastName?.charAt(0)}
                </div>
              )}
            </button>

            {isProfileOpen && (
              <div className="absolute right-0 mt-2 w-56 bg-slate-800 rounded-xl border border-slate-700 shadow-2xl overflow-hidden z-50 animate-in fade-in slide-in-from-top-2 duration-200">
                <div className="px-4 py-3 border-b border-slate-700 bg-slate-800/80">
                  <p className="text-sm font-medium text-slate-100 truncate">{user?.firstName} {user?.lastName}</p>
                  <p className="text-xs text-slate-400 truncate">{user?.email}</p>
                  {user?.organizationName && (
                    <p className="text-[10px] text-slate-500 mt-0.5 truncate">{user.organizationName}</p>
                  )}
                </div>
                <div className="py-1">
                  <Link
                    to="/dashboard/profile"
                    onClick={() => setIsProfileOpen(false)}
                    className="flex items-center gap-2.5 px-4 py-2 text-sm text-slate-300 hover:bg-slate-700/60 hover:text-slate-100 transition-colors"
                  >
                    <UserIcon size={15} />
                    Profile Settings
                  </Link>
                  <Link
                    to="/dashboard"
                    onClick={() => setIsProfileOpen(false)}
                    className="flex items-center gap-2.5 px-4 py-2 text-sm text-slate-300 hover:bg-slate-700/60 hover:text-slate-100 transition-colors"
                  >
                    <Settings size={15} />
                    Preferences
                  </Link>
                </div>
                <div className="border-t border-slate-700 py-1">
                  <button
                    onClick={handleLogout}
                    className="w-full flex items-center gap-2.5 px-4 py-2 text-sm text-red-400 hover:bg-red-500/10 transition-colors"
                  >
                    <LogOut size={15} />
                    Sign out
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </header>
  );
};

export default Header;
