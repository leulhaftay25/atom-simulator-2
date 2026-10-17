import React from 'react';
import { Atom } from '../types/simulation';
import { sound } from '../utils/audio';
import { X, Zap, Shield, Trash2, Radio } from 'lucide-react';

interface AtomInspectorProps {
  atom: Atom | null;
  onClose: () => void;
  onDelete: (id: number) => void;
  onDecay: (atom: Atom) => void;
  onNeutralize: (atom: Atom) => void;
}

export const AtomInspector: React.FC<AtomInspectorProps> = ({
  atom,
  onClose,
  onDelete,
  onDecay,
  onNeutralize
}) => {
  if (!atom) return null;

  const speed = Math.hypot(atom.vx, atom.vy).toFixed(2);
  const kineticEnergy = (0.5 * atom.mass * Math.pow(Math.hypot(atom.vx, atom.vy), 2)).toFixed(1);

  return (
    <div className="absolute top-3 right-3 z-20 w-64 sm:w-72 max-h-[88vh] overflow-y-auto bg-[#12131cd8] backdrop-blur-md border border-[#272a3d] rounded-2xl p-3 sm:p-4 shadow-2xl text-slate-200 animate-in fade-in slide-in-from-right-4 duration-150">
      <div className="flex items-start justify-between pb-3 border-b border-[#25283a]">
        <div className="flex items-center gap-2.5">
          <div 
            className="w-10 h-10 rounded-xl flex items-center justify-center font-bold text-base shadow-inner border border-white/20"
            style={{ 
              backgroundColor: atom.color,
              color: atom.isRadioactive || atom.z === 6 ? '#ffffff' : '#000000'
            }}
          >
            {atom.symbol}
          </div>
          <div>
            <h4 className="text-sm font-bold text-white tracking-tight flex items-center gap-1.5">
              {atom.name}
              {atom.isRadioactive && (
                <span className="text-xs text-purple-400 font-mono" title="Radioactive Isotope">☢</span>
              )}
            </h4>
            <div className="text-[11px] text-slate-400 flex items-center gap-1.5">
              <span>Z = {atom.z}</span>
              <span>·</span>
              <span>Mass {atom.mass}u</span>
            </div>
          </div>
        </div>

        <button 
          onClick={() => { sound.playClick(); onClose(); }}
          className="text-slate-400 hover:text-white p-1 rounded-lg hover:bg-[#202336] transition-colors"
          title="Close Inspector"
        >
          <X className="w-4 h-4" />
        </button>
      </div>

      <div className="py-3 space-y-2 text-xs">
        <div className="flex justify-between items-center py-1 border-b border-[#1c1f2e]">
          <span className="text-slate-400">Classification</span>
          <span className="font-medium capitalize text-slate-200">{atom.category}</span>
        </div>

        <div className="flex justify-between items-center py-1 border-b border-[#1c1f2e]">
          <span className="text-slate-400">Valence Electrons</span>
          <span className="font-mono font-semibold text-cyan-400">
            {Math.max(0, atom.valence - atom.charge)} e⁻
          </span>
        </div>

        <div className="flex justify-between items-center py-1 border-b border-[#1c1f2e]">
          <span className="text-slate-400">Net Formal Charge</span>
          <span className={`font-mono font-bold ${
            atom.charge > 0 ? 'text-red-400' : atom.charge < 0 ? 'text-cyan-400' : 'text-slate-300'
          }`}>
            {atom.charge > 0 ? `+${atom.charge}` : atom.charge < 0 ? `${atom.charge}` : '0 (Neutral)'}
          </span>
        </div>

        <div className="flex justify-between items-center py-1 border-b border-[#1c1f2e]">
          <span className="text-slate-400">Max Covalent Bonds</span>
          <span className="font-mono text-slate-300">
            {atom.isMetal ? 'None (Metallic)' : `${atom.maxBonds} max`}
          </span>
        </div>

        <div className="flex justify-between items-center py-1">
          <span className="text-slate-400">Velocity & Energy</span>
          <span className="font-mono text-slate-300 tabular-nums">
            {speed} px/t · {kineticEnergy} J
          </span>
        </div>
      </div>

      <div className="pt-2 border-t border-[#25283a] grid grid-cols-3 gap-1.5">
        {atom.charge !== 0 && (
          <button
            onClick={() => { sound.playClick(); onNeutralize(atom); }}
            className="py-1.5 px-2 bg-[#1f2233] hover:bg-[#2b2f47] text-slate-300 rounded-lg text-[11px] font-medium flex items-center justify-center gap-1 transition-colors"
            title="Neutralize Charge"
          >
            <Shield className="w-3.5 h-3.5 text-cyan-400" />
            Zero
          </button>
        )}

        {atom.isRadioactive && (
          <button
            onClick={() => { sound.playClick(); onDecay(atom); }}
            className="py-1.5 px-2 bg-purple-500/15 hover:bg-purple-500/25 border border-purple-500/30 text-purple-300 rounded-lg text-[11px] font-medium flex items-center justify-center gap-1 transition-colors"
            title="Force Nuclear Decay"
          >
            <Radio className="w-3.5 h-3.5 text-purple-400" />
            Decay
          </button>
        )}

        <button
          onClick={() => { sound.playClick(); onDelete(atom.id); }}
          className="py-1.5 px-2 bg-red-500/10 hover:bg-red-500/20 border border-red-500/30 text-red-300 rounded-lg text-[11px] font-medium flex items-center justify-center gap-1 transition-colors ml-auto col-span-1"
          title="Delete Atom"
        >
          <Trash2 className="w-3.5 h-3.5" />
          Remove
        </button>
      </div>
    </div>
  );
};
