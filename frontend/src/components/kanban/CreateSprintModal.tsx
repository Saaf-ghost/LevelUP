import React, { useState } from 'react';
import { X, Plus, Trash2 } from 'lucide-react';
import { useSprint } from '../../context/SprintContext';

interface ModalSubtask {
  id: string;
  title: string;
  storyPoints: number;
  assigneeId: string;
}

interface ModalRequirement {
  id: string;
  title: string;
  subtasks: ModalSubtask[];
}

interface Props {
  onClose: () => void;
}

const CreateSprintModal: React.FC<Props> = ({ onClose }) => {
  const { createNewSprint, members } = useSprint();
  const [title, setTitle] = useState('');
  const [objectives, setObjectives] = useState('');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [requirements, setRequirements] = useState<ModalRequirement[]>([
    {
      id: '1',
      title: '',
      subtasks: [{ id: '1-1', title: '', storyPoints: 0, assigneeId: '' }],
    },
  ]);

  const addRequirement = () => {
    setRequirements(prev => [
      ...prev,
      { id: Date.now().toString(), title: '', subtasks: [] },
    ]);
  };

  const removeRequirement = (idx: number) => {
    setRequirements(prev => prev.filter((_, i) => i !== idx));
  };

  const addSubtask = (reqIdx: number) => {
    setRequirements(prev => {
      const next = [...prev];
      next[reqIdx] = {
        ...next[reqIdx],
        subtasks: [
          ...next[reqIdx].subtasks,
          { id: Date.now().toString(), title: '', storyPoints: 0, assigneeId: '' },
        ],
      };
      return next;
    });
  };

  const updateReqTitle = (reqIdx: number, value: string) => {
    setRequirements(prev => {
      const next = [...prev];
      next[reqIdx] = { ...next[reqIdx], title: value };
      return next;
    });
  };

  const updateSubtask = (reqIdx: number, subIdx: number, field: keyof ModalSubtask, value: string | number) => {
    setRequirements(prev => {
      const next = [...prev];
      const sub = { ...next[reqIdx].subtasks[subIdx], [field]: value };
      next[reqIdx] = {
        ...next[reqIdx],
        subtasks: next[reqIdx].subtasks.map((s, i) => (i === subIdx ? sub : s)),
      };
      return next;
    });
  };

  const totalPoints = requirements.reduce(
    (sum, r) => sum + r.subtasks.reduce((s, sub) => s + sub.storyPoints, 0),
    0,
  );

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    // Map requirements input
    const requirementsInput = requirements.map(req => ({
      title: req.title,
      subtasks: req.subtasks.map(sub => ({
        title: sub.title,
        storyPoints: sub.storyPoints,
        assigneeId: sub.assigneeId
      }))
    }));

    createNewSprint(title, objectives, startDate, endDate, totalPoints, requirementsInput);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
      <div className="bg-slate-900 border border-slate-700 rounded-xl shadow-2xl w-full max-w-4xl max-h-[90vh] overflow-hidden flex flex-col">
        {/* Header */}
        <div className="flex justify-between items-center px-5 py-3 border-b border-slate-700 bg-slate-800/40">
          <div>
            <h2 className="text-base font-bold text-slate-100">Create New Sprint</h2>
            <p className="text-[10px] text-slate-500 mt-0.5">
              {requirements.length} requirement{requirements.length !== 1 ? 's' : ''} · {totalPoints} SP total
            </p>
          </div>
          <button onClick={onClose} className="text-slate-400 hover:text-slate-100 transition-colors p-1">
            <X size={20} />
          </button>
        </div>

        {/* Body */}
        <div className="p-5 overflow-y-auto flex-1">
          <form id="sprint-form" onSubmit={handleSubmit} className="space-y-6">
            {/* Meta */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <InputField label="Sprint Title" required value={title} onChange={setTitle} placeholder="e.g. Sprint 43: Payments" />
              <InputField label="Main Objectives" required value={objectives} onChange={setObjectives} placeholder="e.g. Stripe + PayPal" />
              <InputField label="Start Date" type="date" required value={startDate} onChange={setStartDate} />
              <InputField label="End Date" type="date" required value={endDate} onChange={setEndDate} />
            </div>

            {/* Requirements */}
            <div className="space-y-4">
              <div className="flex justify-between items-center">
                <h3 className="text-sm font-semibold text-slate-200">Requirements (Epics)</h3>
                <button
                  type="button"
                  onClick={addRequirement}
                  className="text-xs font-medium text-indigo-400 hover:text-indigo-300 flex items-center gap-1"
                >
                  <Plus size={14} /> Add Requirement
                </button>
              </div>

              {requirements.map((req, rIdx) => (
                <div key={req.id} className="bg-slate-800/40 border border-slate-700/40 rounded-lg p-4 space-y-3">
                  <div className="flex items-center gap-3">
                    <input
                      type="text"
                      required
                      value={req.title}
                      onChange={e => updateReqTitle(rIdx, e.target.value)}
                      className="flex-1 bg-slate-900 border border-slate-600 text-slate-100 text-xs rounded-lg p-2 outline-none focus:border-indigo-500 transition-colors"
                      placeholder="Requirement title"
                    />
                    {requirements.length > 1 && (
                      <button type="button" onClick={() => removeRequirement(rIdx)} className="text-slate-500 hover:text-red-400 transition-colors">
                        <Trash2 size={14} />
                      </button>
                    )}
                  </div>

                  {/* Subtasks */}
                  <div className="pl-4 border-l-2 border-indigo-500/20 space-y-2">
                    <div className="flex justify-between items-center">
                      <span className="text-[11px] font-medium text-slate-400">Subtasks</span>
                      <button
                        type="button"
                        onClick={() => addSubtask(rIdx)}
                        className="text-[10px] font-medium text-emerald-400 hover:text-emerald-300 flex items-center gap-0.5"
                      >
                        <Plus size={12} /> Add
                      </button>
                    </div>

                    {req.subtasks.map((sub, sIdx) => (
                      <div key={sub.id} className="grid grid-cols-[1fr_80px_1fr] gap-2 items-center bg-slate-800/60 p-2 rounded border border-slate-700/30">
                        <input
                          type="text"
                          required
                          value={sub.title}
                          onChange={e => updateSubtask(rIdx, sIdx, 'title', e.target.value)}
                          className="bg-slate-900 border border-slate-600 text-slate-100 text-[11px] rounded p-1.5 outline-none focus:border-indigo-500"
                          placeholder="Subtask title"
                        />
                        <input
                          type="number"
                          min={0}
                          value={sub.storyPoints}
                          onChange={e => updateSubtask(rIdx, sIdx, 'storyPoints', parseInt(e.target.value) || 0)}
                          className="bg-slate-900 border border-slate-600 text-slate-100 text-[11px] rounded p-1.5 outline-none focus:border-indigo-500 text-center"
                          placeholder="SP"
                        />
                        <select
                          value={sub.assigneeId}
                          onChange={e => updateSubtask(rIdx, sIdx, 'assigneeId', e.target.value)}
                          className="bg-slate-900 border border-slate-600 text-slate-100 text-[11px] rounded p-1.5 outline-none focus:border-indigo-500 cursor-pointer"
                        >
                          <option value="">Assign to…</option>
                          {members.map(m => (
                            <option key={m.id} value={m.id}>
                              {m.name} — {m.skills.join(', ')}
                            </option>
                          ))}
                        </select>
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </form>
        </div>

        {/* Footer */}
        <div className="px-5 py-3 border-t border-slate-700 bg-slate-800/40 flex justify-end gap-3">
          <button
            onClick={onClose}
            className="px-4 py-2 rounded-lg text-slate-300 hover:bg-slate-700 transition-colors text-sm font-medium"
          >
            Cancel
          </button>
          <button
            type="submit"
            form="sprint-form"
            className="px-4 py-2 rounded-lg bg-indigo-600 hover:bg-indigo-500 text-white text-sm font-medium transition-colors shadow-lg shadow-indigo-500/25"
          >
            Create Sprint
          </button>
        </div>
      </div>
    </div>
  );
};

// ---------- Tiny reusable input ----------
function InputField({
  label, value, onChange, placeholder, required, type = 'text',
}: {
  label: string; value: string; onChange: (v: string) => void;
  placeholder?: string; required?: boolean; type?: string;
}) {
  return (
    <div className="space-y-1">
      <label className="text-xs font-medium text-slate-300">{label}</label>
      <input
        type={type}
        required={required}
        value={value}
        onChange={e => onChange(e.target.value)}
        className="w-full bg-slate-900 border border-slate-700 text-slate-100 text-xs rounded-lg p-2 outline-none focus:border-indigo-500 transition-colors"
        placeholder={placeholder}
      />
    </div>
  );
}

export default CreateSprintModal;
