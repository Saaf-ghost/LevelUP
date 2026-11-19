import React, { useState, useRef, useEffect, useMemo } from 'react';
import { PieChart, Pie, Cell } from 'recharts';
import { LogOut, ChevronDown, FolderOpen, Zap } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { useSprint } from '../../context/SprintContext';

const Header: React.FC = () => {
  const { sprint, currentProject, setCurrentProject } = useSprint();
  const healthScore = sprint ? sprint.healthScore : 100;
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [isProfileOpen, setIsProfileOpen] = useState(false);
  const profileRef = useRef<HTMLDivElement>(null);

  // Close profile dropdown on outside click
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
    navigate('/login', { replace: true });
  };

  // ---------- Sprint Timer Calculations ----------
  const { daysLeft, totalDays, timePercent, timeColor } = useMemo(() => {
    if (!sprint) {
      return { daysLeft: 0, totalDays: 1, timePercent: 0, timeColor: '#94a3b8' };
    }
    const now = Date.now();
    const start = new Date(sprint.startDate).getTime();
    const end   = new Date(sprint.endDate).getTime();
    const total = Math.max(1, Math.ceil((end - start) / 86400000));
    const left  = Math.max(0, Math.ceil((end - now) / 86400000));
    const pct   = Math.min(100, ((total - left) / total) * 100);

    let color = '#10b981'; // green
    if (left <= 2)      color = '#ef4444'; // red
    else if (left <= 5) color = '#f97316'; // orange

    return { daysLeft: left, totalDays: total, timePercent: pct, timeColor: color };
  }, [sprint]);

  const timeData = [
    { name: 'Elapsed',   value: timePercent },
    { name: 'Remaining', value: 100 - timePercent },
  ];

  // ---------- Health Score Data ----------
  const healthData = [
    { name: 'Score',     value: healthScore },
    { name: 'Remaining', value: 100 - healthScore },
  ];
  let healthColor = '#10b981';
  if (healthScore < 50)      healthColor = '#ef4444';
  else if (healthScore < 80) healthColor = '#f97316';

  return (
    <header className="h-16 bg-white border-b border-slate-200 flex items-center justify-between px-6 z-10 sticky top-0 shadow-sm backdrop-blur-md">
      {/* Brand logo & workspace details */}
      <div className="flex items-center gap-4 min-w-0">
        <div 
          onClick={() => setCurrentProject(null)}
          className="flex items-center gap-2.5 cursor-pointer group"
        >
          <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-orange-500 to-amber-500 flex items-center justify-center shadow-md shadow-orange-500/20 group-hover:scale-105 transition-all">
            <span className="text-white text-sm font-black tracking-tight">B</span>
          </div>
          <span className="text-sm font-black uppercase tracking-widest text-slate-900 group-hover:text-orange-600 transition-colors hidden sm:inline-block">
            Boost<span className="text-orange-600">UP</span>
          </span>
        </div>

        {currentProject && (
          <div className="flex items-center gap-2 border-l border-slate-200 pl-4 min-w-0">
            <span className="text-xs font-bold text-slate-800 truncate max-w-[120px] md:max-w-[200px]">
              {currentProject.name}
            </span>
            {sprint && (
              <span className="hidden md:inline-flex items-center gap-1 text-[10px] bg-emerald-50 text-emerald-700 border border-emerald-200 px-2 py-0.5 rounded-full font-semibold truncate max-w-[120px]">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse"></span>
                {sprint.name}
              </span>
            )}
          </div>
        )}
      </div>

      <div className="flex items-center gap-3.5 shrink-0">
        {/* Dynamic Sprint details inside header only when currentProject is active */}
        {currentProject && sprint && (
          <>
            {/* Sprint Timer */}
            <div className="hidden md:flex items-center gap-2.5 bg-slate-50 px-3 py-1.5 rounded-xl border border-slate-200/80 shadow-xs">
              <div className="relative w-8 h-8 flex items-center justify-center">
                <PieChart width={36} height={36}>
                  <Pie data={timeData} cx={14} cy={14} innerRadius={10} outerRadius={14} startAngle={90} endAngle={-270} dataKey="value" stroke="none">
                    <Cell fill={timeColor} />
                    <Cell fill="#e2e8f0" />
                  </Pie>
                </PieChart>
                <span className="absolute inset-0 flex items-center justify-center text-[9px] font-bold" style={{ color: timeColor }}>
                  {daysLeft}d
                </span>
              </div>
              <div className="flex flex-col">
                <span className="text-[10px] font-bold text-slate-700 leading-tight">Sprint Timer</span>
                <span className="text-[9px] text-slate-500 font-medium leading-tight">{daysLeft} of {totalDays} days</span>
              </div>
            </div>

            {/* Health Score */}
            <div className="hidden md:flex items-center gap-2.5 bg-slate-50 px-3 py-1.5 rounded-xl border border-slate-200/80 shadow-xs">
              <div className="relative w-8 h-8 flex items-center justify-center">
                <PieChart width={36} height={36}>
                  <Pie data={healthData} cx={14} cy={14} innerRadius={10} outerRadius={14} startAngle={90} endAngle={-270} dataKey="value" stroke="none">
                    <Cell fill={healthColor} />
                    <Cell fill="#e2e8f0" />
                  </Pie>
                </PieChart>
                <span className="absolute inset-0 flex items-center justify-center text-[9px] font-bold" style={{ color: healthColor }}>
                  {healthScore}
                </span>
              </div>
              <div className="flex flex-col">
                <span className="text-[10px] font-bold text-slate-700 leading-tight">Sprint Health</span>
                <span className="text-[9px] text-slate-500 font-medium leading-tight">Score Rating</span>
              </div>
            </div>
          </>
        )}

        {/* Profile Dropdown */}
        <div className="relative" ref={profileRef}>
          <button
            onClick={() => setIsProfileOpen(v => !v)}
            className="flex items-center gap-2 bg-slate-50 hover:bg-slate-100 px-2.5 py-1.5 rounded-xl border border-slate-200 transition-colors focus:outline-none cursor-pointer shadow-xs"
          >
            <div className="w-6 h-6 rounded-full bg-gradient-to-tr from-orange-500 to-amber-400 flex items-center justify-center text-[10px] font-bold text-white uppercase shrink-0 shadow-xs">
              {user?.fullName.charAt(0)}
            </div>
            <span className="text-xs text-slate-700 font-bold hidden md:inline truncate max-w-[100px]">
              {user?.fullName.split(' ')[0]}
            </span>
            <ChevronDown size={13} className="text-slate-400" />
          </button>

          {isProfileOpen && (
            <div className="absolute right-0 mt-2 w-52 bg-white border border-slate-200 rounded-xl shadow-xl overflow-hidden z-50">
              <div className="px-4 py-3 border-b border-slate-100 bg-slate-50/80">
                <p className="text-xs font-bold text-slate-900 truncate">{user?.fullName}</p>
                <p className="text-[10px] text-slate-500 truncate mt-0.5">{user?.email}</p>
              </div>
              <div className="py-1">
                <button
                  onClick={() => {
                    setIsProfileOpen(false);
                    setCurrentProject(null);
                  }}
                  className="w-full flex items-center gap-2 px-4 py-2 text-xs font-medium text-slate-700 hover:bg-orange-50 hover:text-orange-600 transition-colors"
                >
                  <FolderOpen size={14} className="text-orange-500" />
                  Workspace Dashboard
                </button>
              </div>
              <div className="border-t border-slate-100 py-1">
                <button
                  onClick={handleLogout}
                  className="w-full flex items-center gap-2 px-4 py-2 text-xs font-medium text-rose-600 hover:bg-rose-50 transition-colors"
                >
                  <LogOut size={14} />
                  Sign out
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </header>
  );
};

export default Header;
