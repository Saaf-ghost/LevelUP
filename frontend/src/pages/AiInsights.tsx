import React, { useState, useEffect, useMemo } from 'react';
import { useSprint } from '../context/SprintContext';
import api from '../api/axios';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell
} from 'recharts';
import { Brain, TrendingUp, PieChart as PieIcon, Sparkles, RefreshCw } from 'lucide-react';

interface SprintInfo {
  sprintId: number;
  objective: string;
  startDate: string;
  endDate: string;
  sprintStatus: 'PLANNED' | 'ACTIVE' | 'DONE';
  pointsPlanned: number;
}

const COLORS = ['#3b82f6', '#f59e0b', '#10b981'];

const AiInsightsPage: React.FC = () => {
  const { sprint, currentProject, refreshData } = useSprint();
  const [sprints, setSprints] = useState<SprintInfo[]>([]);
  const [loading, setLoading] = useState(false);

  const loadSprints = async (projectId: number) => {
    setLoading(true);
    try {
      const res = await api.get<any[]>(`/sprints/project/${projectId}`);
      setSprints(res.data.map(s => ({
        sprintId: s.sprintId,
        objective: s.objective,
        startDate: s.startDate,
        endDate: s.endDate,
        sprintStatus: s.sprintStatus,
        pointsPlanned: s.pointsPlanned
      })));
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (currentProject) {
      loadSprints(currentProject.id);
    }
  }, [currentProject, sprint]);

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center h-full min-h-[400px] text-slate-400">
        <p className="text-xs animate-pulse">Loading analytics...</p>
      </div>
    );
  }

  // Compute Task Status Distribution for Pie Chart
  const pieData = useMemo(() => {
    if (!sprint || !sprint.subtasks) return [];
    const counts = { TODO: 0, IN_PROGRESS: 0, DONE: 0 };
    sprint.subtasks.forEach(t => {
      if (counts[t.status] !== undefined) {
        counts[t.status] += t.storyPoints || 1;
      }
    });
    return [
      { name: 'To Do', value: counts.TODO },
      { name: 'In Progress', value: counts.IN_PROGRESS },
      { name: 'Done', value: counts.DONE }
    ].filter(d => d.value > 0);
  }, [sprint]);

  // Compute Velocity Chart Data
  const velocityData = useMemo(() => {
    return sprints.map(s => {
      // If it is active, sum up DONE subtask story points
      let completedPoints = 0;
      if (s.sprintStatus === 'DONE') {
        completedPoints = s.pointsPlanned;
      } else if (s.sprintStatus === 'ACTIVE' && sprint) {
        completedPoints = sprint.subtasks
          .filter(t => t.status === 'DONE')
          .reduce((sum, t) => sum + t.storyPoints, 0);
      }
      return {
        name: s.objective.substring(0, 12) + (s.objective.length > 12 ? '...' : ''),
        Planned: s.pointsPlanned,
        Completed: completedPoints
      };
    }).reverse(); // chronological order
  }, [sprints, sprint]);

  return (
    <div className="max-w-6xl mx-auto py-6 px-4 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold text-slate-100 flex items-center gap-2">
            <Brain className="text-indigo-400" />
            AI Insights & Velocity Analytics
          </h1>
          <p className="text-xs text-slate-500">
            Intelligent sprint tracking, pattern analysis, and team performance metrics.
          </p>
        </div>
        <button
          onClick={refreshData}
          className="flex items-center gap-1.5 px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-lg text-xs font-medium transition-colors border border-slate-700"
        >
          <RefreshCw size={14} />
          Sync Data
        </button>
      </div>

      {currentProject ? (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Velocity Trend Analytics */}
          <div className="lg:col-span-2 bg-slate-800/40 border border-slate-700/40 p-5 rounded-xl space-y-4">
            <h2 className="text-sm font-bold text-slate-200 flex items-center gap-2">
              <TrendingUp size={16} className="text-indigo-400" />
              Velocity Trends (Planned vs. Completed SP)
            </h2>
            {velocityData.length === 0 ? (
              <div className="h-64 flex items-center justify-center text-xs text-slate-500 italic">
                No sprint history available to plot velocity.
              </div>
            ) : (
              <div className="h-72 w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={velocityData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#334155" opacity={0.3} />
                    <XAxis dataKey="name" stroke="#94a3b8" fontSize={10} tickLine={false} />
                    <YAxis stroke="#94a3b8" fontSize={10} tickLine={false} />
                    <Tooltip
                      contentStyle={{ backgroundColor: '#0f172a', borderColor: '#334155', borderRadius: '8px' }}
                      labelStyle={{ color: '#f8fafc', fontWeight: 'bold', fontSize: '11px' }}
                      itemStyle={{ fontSize: '11px' }}
                    />
                    <Legend wrapperStyle={{ fontSize: '11px' }} />
                    <Bar dataKey="Planned" fill="#3b82f6" radius={[4, 4, 0, 0]} />
                    <Bar dataKey="Completed" fill="#10b981" radius={[4, 4, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            )}
          </div>

          {/* Active Sprint Work Distribution */}
          <div className="bg-slate-800/40 border border-slate-700/40 p-5 rounded-xl space-y-4">
            <h2 className="text-sm font-bold text-slate-200 flex items-center gap-2">
              <PieIcon size={16} className="text-indigo-400" />
              Sprint Workload (SP)
            </h2>
            {!sprint ? (
              <div className="h-64 flex items-center justify-center text-xs text-slate-500 italic">
                No active sprint workload to display.
              </div>
            ) : pieData.length === 0 ? (
              <div className="h-64 flex items-center justify-center text-xs text-slate-500 italic">
                No subtask story points allocated yet.
              </div>
            ) : (
              <div className="h-72 flex flex-col items-center justify-center">
                <div className="h-48 w-full">
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie
                        data={pieData}
                        cx="50%"
                        cy="50%"
                        innerRadius={50}
                        outerRadius={70}
                        paddingAngle={5}
                        dataKey="value"
                      >
                        {pieData.map((_, index) => (
                          <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                        ))}
                      </Pie>
                      <Tooltip
                        contentStyle={{ backgroundColor: '#0f172a', borderColor: '#334155', borderRadius: '8px' }}
                        itemStyle={{ fontSize: '11px', color: '#f8fafc' }}
                      />
                    </PieChart>
                  </ResponsiveContainer>
                </div>
                <div className="flex justify-center gap-4 text-xs mt-2">
                  {pieData.map((d, index) => (
                    <div key={d.name} className="flex items-center gap-1.5">
                      <div className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: COLORS[index % COLORS.length] }} />
                      <span className="text-slate-400">{d.name}: {d.value} SP</span>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* AI Insights Recommendations */}
          <div className="lg:col-span-3 bg-slate-800/40 border border-slate-700/40 p-5 rounded-xl space-y-4">
            <div className="flex items-center justify-between">
              <h2 className="text-sm font-bold text-slate-200 flex items-center gap-2">
                <Sparkles size={16} className="text-indigo-400 animate-pulse" />
                Gemini AI Smart Recommendations
              </h2>
              {sprint && (
                <span className="text-[10px] bg-indigo-500/10 text-indigo-400 border border-indigo-500/20 px-2 py-0.5 rounded font-bold">
                  Health Score: {sprint.healthScore}/100
                </span>
              )}
            </div>

            {sprint && sprint.insights && sprint.insights.length > 0 ? (
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {sprint.insights.map((insight) => {
                  let badge = 'bg-slate-900 border-slate-800 text-slate-400';
                  if (insight.type === 'RISK_WARNING') {
                    badge = 'bg-red-500/10 border-red-500/20 text-red-400';
                  } else if (insight.type === 'REASSIGNMENT_SUGGESTION') {
                    badge = 'bg-amber-500/10 border-amber-500/20 text-amber-400';
                  } else if (insight.type === 'RETROSPECTIVE') {
                    badge = 'bg-indigo-500/10 border-indigo-500/20 text-indigo-400';
                  }

                  return (
                    <div
                      key={insight.id}
                      className="bg-slate-900/50 border border-slate-800 rounded-lg p-4 space-y-3 flex flex-col justify-between hover:border-slate-700 transition-colors"
                    >
                      <div className="space-y-2">
                        <div className="flex items-center justify-between gap-2">
                          <span className={`text-[9px] font-bold uppercase tracking-wider px-2 py-0.5 rounded border ${badge}`}>
                            {insight.type.replace('_', ' ')}
                          </span>
                          <span className="text-[10px] text-slate-500">Confidence: 94%</span>
                        </div>
                        <h3 className="text-xs font-bold text-slate-200">{insight.title}</h3>
                        <p className="text-[11px] text-slate-400 leading-relaxed">{insight.description}</p>
                      </div>

                      <div className="pt-2 border-t border-slate-800/80">
                        <p className="text-[9px] font-semibold text-indigo-400 uppercase tracking-wider">Suggested Action</p>
                        <p className="text-[10px] text-slate-400 mt-0.5">
                          {insight.type === 'RISK_WARNING' 
                            ? 'Adjust sprint load or reassign late tasks to avoid delivery failure.' 
                            : 'Swap tasks among developers based on skill and load balance.'}
                        </p>
                      </div>
                    </div>
                  );
                })}
              </div>
            ) : (
              <div className="p-8 text-center text-slate-500 border border-dashed border-slate-800 rounded-lg">
                <Brain className="mx-auto mb-2 text-slate-700 animate-pulse" size={24} />
                <p className="text-xs font-medium">No intelligence reports available for this sprint.</p>
                <p className="text-[10px] text-slate-600 mt-0.5">Insights will generate automatically on task mutations and state transitions.</p>
              </div>
            )}
          </div>
        </div>
      ) : (
        <div className="bg-slate-800/20 border border-slate-800 rounded-xl p-10 text-center text-slate-500 flex flex-col items-center justify-center min-h-[300px]">
          <TrendingUp size={36} className="text-slate-700 mb-2" />
          <p className="text-xs">No active project workspace selected.</p>
        </div>
      )}
    </div>
  );
};

export default AiInsightsPage;
