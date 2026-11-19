import React, { useState } from 'react';
import { X } from 'lucide-react';
import { useSprint } from '../../context/SprintContext';

interface Props {
  onClose: () => void;
}

const AddSubtaskModal: React.FC<Props> = ({ onClose }) => {
  const { sprint, addNewSubtask, members } = useSprint();
  const [requirementId, setRequirementId] = useState<number | ''>(sprint?.requirements[0]?.id || '');
  const [title, setTitle] = useState('');
  const [storyPoints, setStoryPoints] = useState(1);
  const [assigneeId, setAssigneeId] = useState<string>('');

  if (!sprint) return null;

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    if (requirementId === '' || !title.trim()) return;

    try {
      await addNewSubtask(requirementId, title.trim(), storyPoints, assigneeId ? Number(assigneeId) : null);
      onClose();
    } catch (err) {
      console.error(err);
    }
  };

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/50 p-4 backdrop-blur-sm">
      <div className="w-full max-w-md overflow-hidden rounded-2xl border border-line bg-surface shadow-2xl">
        <div className="flex items-center justify-between border-b border-line bg-surface-2 px-5 py-3.5">
          <h2 className="font-display text-lg font-semibold text-ink">Add subtask</h2>
          <button type="button" onClick={onClose} className="rounded-md p-1 text-ink-faint hover:text-ink" aria-label="Close">
            <X size={17} />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4 p-5">
          <div className="space-y-1.5">
            <label className="label-xs">Parent requirement</label>
            <select
              value={requirementId}
              onChange={event => setRequirementId(Number(event.target.value))}
              className="input cursor-pointer"
              required
            >
              <option value="" disabled>
                Select requirement
              </option>
              {sprint.requirements.map(requirement => (
                <option key={requirement.id} value={requirement.id}>
                  {requirement.title}
                </option>
              ))}
            </select>
          </div>

          <div className="space-y-1.5">
            <label className="label-xs">Subtask title</label>
            <input
              type="text"
              required
              value={title}
              onChange={event => setTitle(event.target.value)}
              className="input"
              placeholder="e.g. Build API endpoints"
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <label className="label-xs">Story points</label>
              <input
                type="number"
                min={0}
                required
                value={storyPoints}
                onChange={event => setStoryPoints(parseInt(event.target.value) || 0)}
                className="input text-center tnum"
              />
            </div>

            <div className="space-y-1.5">
              <label className="label-xs">Assignee</label>
              <select
                value={assigneeId}
                onChange={event => setAssigneeId(event.target.value)}
                className="input cursor-pointer"
              >
                <option value="">Unassigned</option>
                {members.map(member => (
                  <option key={member.id} value={member.id}>
                    {member.fullName}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div className="flex justify-end gap-2 border-t border-line pt-4">
            <button type="button" onClick={onClose} className="btn-quiet">
              Cancel
            </button>
            <button type="submit" className="btn-primary">
              Add subtask
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default AddSubtaskModal;
