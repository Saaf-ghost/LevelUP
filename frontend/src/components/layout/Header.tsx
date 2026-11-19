import React, { useState, useRef, useEffect, useMemo } from 'react';
import { PieChart, Pie, Cell } from 'recharts';
import { LogOut, ChevronDown, LayoutGrid, ShieldCheck } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { useSprint } from '../../context/SprintContext';
import { useTheme } from '../../context/ThemeContext';
import ThemeToggle from './ThemeToggle';

const Header: React.FC = () => {
  const { sprint, currentProject, setCurrentProject } = useSprint();
  const { user, logout, isAdministrator } = useAuth();
  const { isDark } = useTheme();
  const navigate = useNavigate();
  const [isProfileOpen, setIsProfileOpen] = useState(false);
  const profileRef = useRef<HTMLDivElement>(null);

  const trackColor = isDark ? '#3a332a' : '#ebe2d5';

  useEffect(() => {
    const handler = (event: MouseEvent) => {
      if (profileRef.current && !profileRef.current.contains(event.target as Node)) {
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

  const { daysLeft, totalDays, timePercent, timeColor } = useMemo(() => {
    if (!sprint) return { daysLeft: 0, totalDays: 1, timePercent: 0, timeColor: '#8b8275' };
    const now = Date.now();
    const start = new Date(sprint.startDate).getTime();
    const end = new Date(sprint.endDate).getTime();
    const total = Math.max(1, Math.ceil((end - start) / 86400000));
    const left = Math.max(0, Math.ceil((end - now) / 86400000));
    const percent = Math.min(100, Math.max(0, ((total - left) / total) * 100));

    let color = '#4f7c12';
    if (left <= 2) color = '#b3261e';
    else if (left <= 5) color = '#e2560e';

    return { daysLeft: left, totalDays: total, timePercent: percent, timeColor: color };
  }, [sprint]);

  const healthScore = sprint?.healthScore ?? null;

  let healthColor = '#4f7c12';
  if (healthScore !== null && healthScore < 50) healthColor = '#b3261e';
  else if (healthScore !== null && healthScore < 80) healthColor = '#e2560e';

  const timeData = [
    { name: 'Elapsed', value: timePercent },
    { name: 'Remaining', value: Math.max(0, 100 - timePercent) },
  ];
  const healthData =
    healthScore === null
      ? [{ name: 'Empty', value: 1 }]
      : [
          { name: 'Score', value: healthScore },
          { name: 'Remaining', value: Math.max(0, 100 - healthScore) },
        ];

  return (
    <header className="z-40 flex h-16 shrink-0 items-center justify-between gap-4 border-b border-line bg-surface/95 px-4 backdrop-blur sm:px-6">
      <div className="flex min-w-0 items-center gap-4">
        <button
          type="button"
          onClick={() => setCurrentProject(null)}
          className="group flex items-center gap-2.5"
          aria-label="BoostUP home"
        >
          <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-brand text-sm font-black text-white shadow-sm transition group-hover:scale-105 dark:text-[#1a130b]">
            B
          </span>
          <span className="hidden font-display text-lg font-semibold tracking-tight text-ink sm:inline">
            Boost<span className="text-brand">UP</span>
          </span>
        </button>

        {currentProject && (
          <div className="flex min-w-0 items-center gap-2 border-l border-line pl-4">
            <span className="max-w-[110px] truncate text-xs font-semibold text-ink md:max-w-[200px]">
              {currentProject.name}
            </span>
            {sprint && (
              <span className="hidden items-center gap-1.5 truncate rounded-full border border-leaf/30 bg-leaf-soft px-2 py-0.5 text-[10px] font-semibold text-leaf md:inline-flex">
                <span className="h-1.5 w-1.5 rounded-full bg-leaf" />
                {sprint.name}
              </span>
            )}
          </div>
        )}
      </div>

      <div className="flex shrink-0 items-center gap-2.5">
        {currentProject && sprint && (
          <>
            <div className="hidden items-center gap-2.5 rounded-lg border border-line bg-surface-2 px-2.5 py-1 md:flex">
              <div className="relative flex h-8 w-8 items-center justify-center">
                <PieChart width={32} height={32}>
                  <Pie data={timeData} cx={15} cy={15} innerRadius={10} outerRadius={14} startAngle={90} endAngle={-270} dataKey="value" stroke="none" isAnimationActive={false}>
                    <Cell fill={timeColor} />
                    <Cell fill={trackColor} />
                  </Pie>
                </PieChart>
                <span className="absolute inset-0 flex items-center justify-center text-[9px] font-bold tnum" style={{ color: timeColor }}>
                  {daysLeft}d
                </span>
              </div>
              <div className="flex flex-col leading-tight">
                <span className="text-[10px] font-semibold text-ink">Sprint timer</span>
                <span className="text-[9px] text-ink-faint tnum">{daysLeft} of {totalDays} days left</span>
              </div>
            </div>

            <div className="hidden items-center gap-2.5 rounded-lg border border-line bg-surface-2 px-2.5 py-1 md:flex">
              <div className="relative flex h-8 w-8 items-center justify-center">
                <PieChart width={32} height={32}>
                  <Pie data={healthData} cx={15} cy={15} innerRadius={10} outerRadius={14} startAngle={90} endAngle={-270} dataKey="value" stroke="none" isAnimationActive={false}>
                    <Cell fill={healthScore === null ? trackColor : healthColor} />
                    <Cell fill={trackColor} />
                  </Pie>
                </PieChart>
                <span className="absolute inset-0 flex items-center justify-center text-[9px] font-bold tnum" style={{ color: healthScore === null ? '#8b8275' : healthColor }}>
                  {healthScore === null ? '—' : healthScore}
                </span>
              </div>
              <div className="flex flex-col leading-tight">
                <span className="text-[10px] font-semibold text-ink">Sprint health</span>
                <span className="text-[9px] text-ink-faint">
                  {healthScore === null ? 'Not scored yet' : healthScore >= 80 ? 'Healthy' : healthScore >= 50 ? 'At risk' : 'Critical'}
                </span>
              </div>
            </div>
          </>
        )}

        <ThemeToggle />

        <div className="relative" ref={profileRef}>
          <button
            type="button"
            onClick={() => setIsProfileOpen(open => !open)}
            className="flex items-center gap-2 rounded-lg border border-line bg-surface px-2 py-1.5 transition hover:border-line-strong"
            aria-haspopup="menu"
            aria-expanded={isProfileOpen}
          >
            <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-brand to-[#f6b544] text-[10px] font-bold uppercase text-white">
              {user?.fullName.charAt(0)}
            </span>
            <span className="hidden max-w-[100px] truncate text-xs font-semibold text-ink md:inline">
              {user?.fullName.split(' ')[0]}
            </span>
            <ChevronDown size={13} className="text-ink-faint" />
          </button>

          {isProfileOpen && (
            <div className="absolute right-0 top-full z-50 mt-2 w-56 overflow-hidden rounded-xl border border-line bg-surface shadow-2xl">
              <div className="border-b border-line bg-surface-2 px-4 py-3">
                <p className="truncate text-xs font-bold text-ink">{user?.fullName}</p>
                <p className="mt-0.5 truncate text-[10px] text-ink-faint">{user?.email}</p>
              </div>
              <div className="py-1">
                <button
                  type="button"
                  onClick={() => {
                    setIsProfileOpen(false);
                    setCurrentProject(null);
                    navigate('/dashboard');
                  }}
                  className="flex w-full items-center gap-2 px-4 py-2 text-xs font-medium text-ink-soft transition hover:bg-brand-soft hover:text-brand"
                >
                  <LayoutGrid size={14} className="text-brand" />
                  Workspace dashboard
                </button>
                {isAdministrator && (
                  <button
                    type="button"
                    onClick={() => {
                      setIsProfileOpen(false);
                      navigate('/dashboard/admin');
                    }}
                    className="flex w-full items-center gap-2 px-4 py-2 text-xs font-medium text-ink-soft transition hover:bg-brand-soft hover:text-brand"
                  >
                    <ShieldCheck size={14} className="text-brand" />
                    Platform administration
                  </button>
                )}
              </div>
              <div className="border-t border-line py-1">
                <button
                  type="button"
                  onClick={handleLogout}
                  className="flex w-full items-center gap-2 px-4 py-2 text-xs font-medium text-danger transition hover:bg-danger-soft"
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
