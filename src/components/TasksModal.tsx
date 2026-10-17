import React, { useState } from 'react';
import { 
  X, 
  CheckCircle2, 
  Circle, 
  Trophy, 
  Sparkles, 
  Target, 
  RotateCcw,
  Zap,
  Atom as AtomIcon,
  ChevronRight
} from 'lucide-react';
import { SIMULATION_TASKS } from '../utils/tasks';
import { sound } from '../utils/audio';

interface TasksModalProps {
  isOpen: boolean;
  onClose: () => void;
  completedTasks: Set<string>;
  onSelectElement: (z: number) => void;
  onLoadPreset: (presetId: string) => void;
  onResetTasks: () => void;
}

export const TasksModal: React.FC<TasksModalProps> = ({
  isOpen,
  onClose,
  completedTasks,
  onSelectElement,
  onLoadPreset,
  onResetTasks
}) => {
  const [filter, setFilter] = useState<string>('all');

  if (!isOpen) return null;

  const total = SIMULATION_TASKS.length;
  const completedCount = completedTasks.size;
  const percent = Math.round((completedCount / total) * 100);

  // Determine Title based on achievements
  const getRank = (count: number) => {
    if (count >= 12) return 'Grand Chemist & Nuclear Master';
    if (count >= 9) return 'Subatomic Theorist';
    if (count >= 6) return 'Molecular Architect';
    if (count >= 3) return 'Apprentice Alchemist';
    return 'Novice Observer';
  };

  const filtered = SIMULATION_TASKS.filter(task => {
    if (filter === 'all') return true;
    if (filter === 'completed') return completedTasks.has(task.id);
    if (filter === 'incomplete') return !completedTasks.has(task.id);
    return task.category === filter;
  });

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-2 sm:p-4 bg-black/75 backdrop-blur-sm animate-in fade-in duration-200">
      <div 
        className="w-full max-w-xl max-h-[92vh] bg-[#12141e] border border-[#272b3d] rounded-2xl shadow-2xl overflow-hidden flex flex-col"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="p-4 sm:p-5 border-b border-[#222638] bg-[#161826] shrink-0">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2.5">
              <div className="p-2 rounded-xl bg-amber-500/10 border border-amber-500/30 text-amber-400">
                <Trophy className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-base font-bold text-white flex items-center gap-2">
                  Research Missions & Objectives
                </h3>
                <p className="text-xs text-slate-400">
                  Optional goals to explore chemical bonding, atomic forces, and nuclear physics.
                </p>
              </div>
            </div>
            <button
              onClick={() => { sound.playClick(); onClose(); }}
              className="p-1.5 text-slate-400 hover:text-white rounded-lg hover:bg-[#202438] transition-colors"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          {/* Progress Overview Bar */}
          <div className="mt-3.5 p-3 bg-[#191c2b] border border-[#292f44] rounded-xl space-y-2">
            <div className="flex items-center justify-between text-xs">
              <div className="flex items-center gap-1.5">
                <span className="text-slate-400 font-medium">Rank:</span>
                <span className="text-emerald-400 font-bold">{getRank(completedCount)}</span>
              </div>
              <div className="font-mono text-slate-300">
                <strong className="text-emerald-400">{completedCount}</strong> of {total} completed ({percent}%)
              </div>
            </div>

            <div className="h-2 w-full bg-[#0f111a] rounded-full overflow-hidden border border-[#23283c]">
              <div 
                className="h-full bg-gradient-to-r from-emerald-400 via-cyan-400 to-indigo-500 rounded-full transition-all duration-500 shadow-[0_0_12px_rgba(52,211,153,0.5)]"
                style={{ width: `${percent}%` }}
              />
            </div>
          </div>

          {/* Category Filter Tabs */}
          <div className="flex items-center gap-1.5 overflow-x-auto pt-3 text-[11px]">
            {[
              { id: 'all', label: 'All Tasks' },
              { id: 'incomplete', label: 'Incomplete' },
              { id: 'completed', label: 'Done' },
              { id: 'covalent', label: 'Covalent' },
              { id: 'ionic', label: 'Ionic' },
              { id: 'metallic', label: 'Metallic' },
              { id: 'nuclear', label: 'Nuclear' }
            ].map(tab => (
              <button
                key={tab.id}
                onClick={() => { sound.playClick(); setFilter(tab.id); }}
                className={`px-2.5 py-1 rounded-lg whitespace-nowrap transition-colors font-medium shrink-0 ${
                  filter === tab.id
                    ? 'bg-emerald-400 text-black font-bold'
                    : 'bg-[#1b1f2e] text-slate-400 hover:text-white'
                }`}
              >
                {tab.label}
              </button>
            ))}
          </div>
        </div>

        {/* Tasks List */}
        <div className="p-3 sm:p-4 space-y-2.5 overflow-y-auto flex-1">
          {filtered.length === 0 ? (
            <div className="py-8 text-center text-xs text-slate-500">
              No tasks match this filter.
            </div>
          ) : (
            filtered.map((task) => {
              const isDone = completedTasks.has(task.id);

              return (
                <div
                  key={task.id}
                  className={`p-3 rounded-xl border transition-all flex items-start gap-3 ${
                    isDone 
                      ? 'bg-emerald-500/5 border-emerald-500/25 text-slate-200' 
                      : 'bg-[#171a28] border-[#262c3f] text-slate-300'
                  }`}
                >
                  {/* Status Check Icon */}
                  <div className="pt-0.5 shrink-0">
                    {isDone ? (
                      <CheckCircle2 className="w-5 h-5 text-emerald-400 drop-shadow-[0_0_8px_rgba(52,211,153,0.6)]" />
                    ) : (
                      <Circle className="w-5 h-5 text-slate-600" />
                    )}
                  </div>

                  {/* Task Content */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between gap-2">
                      <h4 className={`text-xs sm:text-sm font-semibold truncate ${isDone ? 'text-emerald-300 line-through opacity-90' : 'text-white'}`}>
                        {task.title}
                      </h4>
                      <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-[#1e2334] text-slate-400 shrink-0">
                        {task.badge}
                      </span>
                    </div>

                    <p className="text-xs text-slate-400 mt-1 leading-snug">
                      {task.description}
                    </p>

                    <div className="mt-2 text-[11px] text-slate-500 flex items-center gap-1.5">
                      <span className="font-semibold text-slate-400">Hint:</span>
                      <span>{task.hint}</span>
                    </div>

                    {/* Quick Helper Action Buttons */}
                    <div className="mt-2.5 flex items-center gap-2">
                      {task.recommendedZ && (
                        <button
                          onClick={() => {
                            sound.playClick();
                            onSelectElement(task.recommendedZ!);
                            onClose();
                          }}
                          className="py-1 px-2.5 bg-[#212638] hover:bg-[#2b324b] text-slate-300 hover:text-white rounded-lg text-[10px] font-medium flex items-center gap-1 transition-colors"
                        >
                          <AtomIcon className="w-3 h-3 text-emerald-400" />
                          Select Element
                        </button>
                      )}

                      {task.presetShortcut && (
                        <button
                          onClick={() => {
                            sound.playClick();
                            onLoadPreset(task.presetShortcut!);
                            onClose();
                          }}
                          className="py-1 px-2.5 bg-emerald-500/15 hover:bg-emerald-500/25 border border-emerald-500/30 text-emerald-300 rounded-lg text-[10px] font-medium flex items-center gap-1 transition-colors"
                        >
                          <Sparkles className="w-3 h-3" />
                          Try Preset
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              );
            })
          )}
        </div>

        {/* Footer */}
        <div className="p-3 sm:p-4 border-t border-[#222638] bg-[#161826] flex items-center justify-between text-xs text-slate-500 shrink-0">
          <span>Tasks auto-complete as you experiment in the sandbox.</span>
          {completedCount > 0 && (
            <button
              onClick={() => {
                if (window.confirm("Reset your completed task progress?")) {
                  onResetTasks();
                }
              }}
              className="text-red-400 hover:text-red-300 flex items-center gap-1 text-[11px] transition-colors"
            >
              <RotateCcw className="w-3 h-3" />
              Reset All
            </button>
          )}
        </div>
      </div>
    </div>
  );
};
