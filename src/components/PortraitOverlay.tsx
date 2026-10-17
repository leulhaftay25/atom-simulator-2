import React from 'react';
import { Smartphone, RotateCw, Sparkles, ArrowRight } from 'lucide-react';
import { sound } from '../utils/audio';

interface PortraitOverlayProps {
  onDismiss: () => void;
  isDismissed: boolean;
}

export const PortraitOverlay: React.FC<PortraitOverlayProps> = ({
  onDismiss,
  isDismissed
}) => {
  if (isDismissed) return null;

  return (
    <div 
      className="portrait-only-overlay fixed inset-0 z-[99999] bg-[#07080df5] backdrop-blur-md hidden flex-col items-center justify-center p-6 text-center select-none"
      style={{ touchAction: 'none' }}
    >
      <div className="max-w-xs w-full bg-[#12141e] border border-[#262a3d] p-6 rounded-3xl shadow-2xl flex flex-col items-center space-y-5 animate-in fade-in duration-300">
        {/* Animated Phone Graphic */}
        <div className="relative w-24 h-24 flex items-center justify-center">
          <div className="absolute inset-0 bg-emerald-500/10 rounded-full animate-ping opacity-30" />
          <div className="relative w-14 h-22 border-2 border-emerald-400/80 rounded-2xl flex flex-col items-center justify-between p-1.5 shadow-[0_0_20px_rgba(52,211,153,0.3)] animate-phone-rotate">
            <div className="w-4 h-1 bg-emerald-400/50 rounded-full" />
            <div className="w-8 h-8 rounded-full border border-dashed border-emerald-400/40 flex items-center justify-center">
              <Sparkles className="w-4 h-4 text-emerald-400 animate-spin" style={{ animationDuration: '8s' }} />
            </div>
            <div className="w-2.5 h-2.5 rounded-full border border-emerald-400/50" />
          </div>
        </div>

        {/* Text Instructions */}
        <div className="space-y-2">
          <h2 className="text-base font-bold text-white tracking-tight flex items-center justify-center gap-1.5">
            <RotateCw className="w-4 h-4 text-emerald-400" />
            Please Rotate to Landscape
          </h2>
          <p className="text-xs text-slate-400 leading-relaxed">
            Atom Simulator requires horizontal space for the 118-element periodic grid, molecular VSEPR angles, and physics canvas.
          </p>
        </div>

        {/* Action Button */}
        <div className="w-full space-y-2 pt-1">
          <div className="py-2.5 px-4 bg-emerald-500/15 border border-emerald-500/30 rounded-xl text-emerald-300 font-semibold text-xs flex items-center justify-center gap-2">
            <Smartphone className="w-4 h-4 rotate-90" />
            Rotate Device Sideways
          </div>

          <button
            onClick={() => {
              sound.playClick();
              onDismiss();
            }}
            className="w-full py-2 text-[11px] text-slate-500 hover:text-slate-300 transition-colors flex items-center justify-center gap-1 cursor-pointer"
          >
            <span>Continue in portrait anyway</span>
            <ArrowRight className="w-3 h-3" />
          </button>
        </div>
      </div>
    </div>
  );
};
