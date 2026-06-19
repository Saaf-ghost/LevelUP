import React from 'react';
import { AlertTriangle, Lightbulb, Zap, ArrowRight } from 'lucide-react';
import { mockSprint } from '../../mockData';
import { useAuth } from '../../context/AuthContext';

interface AiInsightsPanelProps {
  isOpen: boolean;
}

const AiInsightsPanel: React.FC<AiInsightsPanelProps> = ({ isOpen }) => {
  const { role } = useAuth();
  
  // Example of role-adaptive behavior
  const canApplyAction = role === 'OWNER' || role === 'MEMBER';

  return (
    <aside className={`${isOpen ? 'w-80 translate-x-0 border-l border-slate-800 opacity-100' : 'w-0 translate-x-full border-transparent opacity-0'} transition-all duration-300 ease-in-out bg-slate-850 flex flex-col h-full shadow-2xl shrink-0 overflow-hidden`}>
      <div className="w-80 h-full flex flex-col">
        <div className="h-20 flex items-center px-6 border-b border-slate-800 bg-gradient-to-r from-slate-850 to-indigo-900/10 shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center shadow-lg shadow-indigo-500/20">
              <Zap className="text-white" size={20} />
            </div>
            <div>
              <h2 className="text-base font-bold text-slate-100">AI Insights</h2>
              <span className="text-xs text-indigo-400 font-medium">Gemini Intelligence</span>
            </div>
          </div>
        </div>

        <div className="flex-1 overflow-y-auto p-5 space-y-6">
          {mockSprint.insights.map(insight => (
            <div key={insight.id} className="flex flex-col gap-3">
              {/* Header */}
              <div className="flex items-center gap-2">
                {insight.type === 'RISK_WARNING' ? (
                  <div className="p-1.5 rounded-lg bg-red-500/10 text-red-400 border border-red-500/20">
                    <AlertTriangle size={16} />
                  </div>
                ) : (
                  <div className="p-1.5 rounded-lg bg-amber-500/10 text-amber-400 border border-amber-500/20">
                    <Lightbulb size={16} />
                  </div>
                )}
                <h3 className="text-sm font-semibold text-slate-200">{insight.title}</h3>
              </div>

              {/* Content Card */}
              <div className={`p-4 rounded-xl border ${
                insight.type === 'RISK_WARNING' 
                  ? 'bg-gradient-to-br from-red-500/5 to-slate-800 border-red-500/10' 
                  : 'bg-gradient-to-br from-amber-500/5 to-slate-800 border-amber-500/10'
              }`}>
                <p className="text-sm text-slate-300 mb-3 leading-relaxed">
                  {insight.description}
                </p>
                
                {insight.rationale && (
                  <div className="mb-4 bg-slate-900/50 p-3 rounded-lg border border-slate-700/50">
                    <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider block mb-1">Rationale</span>
                    <p className="text-xs text-slate-300">{insight.rationale}</p>
                  </div>
                )}

                {insight.suggestedAction && canApplyAction && (
                  <button className="w-full flex items-center justify-center gap-2 py-2 px-4 rounded-lg bg-indigo-600 hover:bg-indigo-500 text-white text-sm font-medium transition-colors shadow-lg shadow-indigo-500/20">
                    {insight.suggestedAction}
                    <ArrowRight size={16} />
                  </button>
                )}
                {insight.suggestedAction && !canApplyAction && (
                  <div className="w-full text-center py-2 px-4 rounded-lg bg-slate-800 text-slate-500 text-xs font-medium border border-slate-700">
                    Action restricted (View Only)
                  </div>
                )}

                {insight.impact && (
                  <div className="mt-3 flex items-center justify-center text-xs font-medium text-emerald-400 bg-emerald-400/10 py-1 rounded-md">
                    Predicted Impact: {insight.impact}
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
      </div>
    </aside>
  );
};

export default AiInsightsPanel;
