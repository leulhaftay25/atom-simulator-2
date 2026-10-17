import React from 'react';
import { X, Sparkles, Flame, Zap, Shield, ChevronRight } from 'lucide-react';
import { PRESETS } from '../utils/presets';
import { sound } from '../utils/audio';

interface PresetsModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSelectPreset: (presetId: string) => void;
}

export const PresetsModal: React.FC<PresetsModalProps> = ({
  isOpen,
  onClose,
  onSelectPreset
}) => {
  if (!isOpen) return null;

  const getIcon = (cat: string) => {
    if (cat.includes('Covalent') || cat.includes('Double')) return <Sparkles className="w-5 h-5 text-cyan-400" />;
    if (cat.includes('Ionic')) return <Zap className="w-5 h-5 text-fuchsia-400" />;
    if (cat.includes('Metallic')) return <Shield className="w-5 h-5 text-amber-400" />;
    return <Flame className="w-5 h-5 text-purple-400" />;
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-2 sm:p-4 bg-black/75 backdrop-blur-sm animate-in fade-in duration-200">
      <div 
        className="w-full max-w-lg max-h-[92vh] bg-[#12131b] border border-[#272a3c] rounded-2xl shadow-2xl overflow-hidden flex flex-col"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between px-4 sm:px-6 py-2.5 sm:py-3.5 border-b border-[#222533] bg-[#161722] shrink-0">
          <div>
            <h3 className="text-sm sm:text-base font-bold text-white flex items-center gap-2">
              <Sparkles className="w-4 h-4 sm:w-5 sm:h-5 text-emerald-400" />
              Reaction Presets & Physics Labs
            </h3>
            <p className="text-[11px] sm:text-xs text-slate-400 mt-0.5">
              Instantly spawn textbook molecular and nuclear reactions.
            </p>
          </div>
          <button 
            onClick={() => { sound.playClick(); onClose(); }}
            className="p-1.5 text-slate-400 hover:text-white rounded-lg hover:bg-[#202336] transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        <div className="p-3 sm:p-4 space-y-2 overflow-y-auto max-h-[65vh]">
          {PRESETS.map((preset) => (
            <div
              key={preset.id}
              onClick={() => {
                sound.playClick();
                onSelectPreset(preset.id);
                onClose();
              }}
              className="p-3.5 bg-[#171924] hover:bg-[#1d2030] border border-[#272a3c] hover:border-slate-500 rounded-xl cursor-pointer transition-all flex items-start gap-3 group"
            >
              <div className="p-2.5 rounded-lg bg-[#202336] border border-[#2d324b] shrink-0 group-hover:scale-105 transition-transform">
                {getIcon(preset.category)}
              </div>

              <div className="flex-1 min-w-0">
                <div className="flex items-center justify-between gap-2">
                  <h4 className="text-sm font-semibold text-white truncate">
                    {preset.title}
                  </h4>
                  <span 
                    className="text-[11px] font-mono px-2 py-0.5 rounded border border-current text-opacity-90 font-bold shrink-0"
                    style={{ color: preset.color }}
                  >
                    {preset.formula}
                  </span>
                </div>

                <p className="text-xs text-slate-400 mt-1 leading-snug">
                  {preset.description}
                </p>
              </div>

              <div className="self-center text-slate-500 group-hover:text-emerald-400 transition-colors">
                <ChevronRight className="w-4 h-4" />
              </div>
            </div>
          ))}
        </div>

        <div className="p-4 border-t border-[#222533] bg-[#161722] text-center">
          <p className="text-xs text-slate-500">
            Presets clear existing atoms and spawn the configured setup centered on canvas.
          </p>
        </div>
      </div>
    </div>
  );
};
