import React, { useState, useEffect } from 'react';
import { Sparkles, ArrowRight } from 'lucide-react';
import { sound } from '../utils/audio';

interface SplashScreenProps {
  onDismiss: () => void;
}

export const SplashScreen: React.FC<SplashScreenProps> = ({ onDismiss }) => {
  const [isFading, setIsFading] = useState<boolean>(false);
  const [isVisible, setIsVisible] = useState<boolean>(true);

  const handleDismiss = () => {
    if (isFading) return;
    setIsFading(true);
    sound.playClick();
    setTimeout(() => {
      setIsVisible(false);
      onDismiss();
    }, 550);
  };

  useEffect(() => {
    // Auto-dismiss after 1.8 seconds if user doesn't click
    const timer = setTimeout(() => {
      handleDismiss();
    }, 1800);

    return () => clearTimeout(timer);
  }, []);

  if (!isVisible) return null;

  return (
    <div 
      onClick={handleDismiss}
      className={`fixed inset-0 z-[100000] bg-[#07080f] flex flex-col items-center justify-center p-6 select-none cursor-pointer transition-opacity duration-500 ease-out ${
        isFading ? 'opacity-0 pointer-events-none' : 'opacity-100'
      }`}
    >
      {/* Background Ambient Radial Glow */}
      <div className="absolute w-[500px] h-[500px] rounded-full bg-emerald-500/10 blur-[120px] pointer-events-none" />
      <div className="absolute w-[350px] h-[350px] rounded-full bg-cyan-500/10 blur-[90px] pointer-events-none" />

      <div className="relative flex flex-col items-center max-w-sm text-center space-y-7 z-10">
        {/* Animated Atomic Orbital Core */}
        <div className="relative w-28 h-28 flex items-center justify-center">
          {/* Outer Pulsing Aura */}
          <div className="absolute inset-0 rounded-full bg-emerald-400/20 blur-xl animate-pulse" />

          {/* Three Tilted Orbital Rings */}
          <div className="absolute w-24 h-24 rounded-full border border-emerald-400/50 animate-spin" style={{ animationDuration: '6s', transform: 'rotate(0deg)' }}>
            <div className="w-2.5 h-2.5 rounded-full bg-emerald-300 shadow-[0_0_8px_#34d399] absolute top-0 left-1/2 -translate-x-1/2 -translate-y-1/2" />
          </div>

          <div className="absolute w-24 h-24 rounded-full border border-cyan-400/50 animate-spin" style={{ animationDuration: '8s', animationDirection: 'reverse', transform: 'rotate(60deg)' }}>
            <div className="w-2.5 h-2.5 rounded-full bg-cyan-300 shadow-[0_0_8px_#22d3ee] absolute top-0 left-1/2 -translate-x-1/2 -translate-y-1/2" />
          </div>

          <div className="absolute w-24 h-24 rounded-full border border-indigo-400/50 animate-spin" style={{ animationDuration: '10s', transform: 'rotate(120deg)' }}>
            <div className="w-2.5 h-2.5 rounded-full bg-indigo-300 shadow-[0_0_8px_#818cf8] absolute top-0 left-1/2 -translate-x-1/2 -translate-y-1/2" />
          </div>

          {/* Central Heavy Nucleus */}
          <div className="w-10 h-10 rounded-full bg-gradient-to-tr from-emerald-500 to-cyan-400 flex items-center justify-center shadow-[0_0_24px_rgba(52,211,153,0.8)] z-10 border border-white/40">
            <Sparkles className="w-5 h-5 text-black animate-pulse" />
          </div>
        </div>

        {/* Titles */}
        <div className="space-y-2">
          <h1 className="text-2xl sm:text-3xl font-extrabold text-transparent bg-clip-text bg-gradient-to-r from-emerald-400 via-cyan-300 to-indigo-400 tracking-wider">
            ATOM SIMULATOR
          </h1>
          <p className="text-xs text-slate-400 tracking-wide font-medium">
            2D Molecular Physics, VSEPR & Nuclear Lab
          </p>
        </div>

        {/* Status indicator bar */}
        <div className="w-48 space-y-2">
          <div className="h-1 w-full bg-[#171a29] rounded-full overflow-hidden border border-[#23293f]">
            <div className="h-full bg-gradient-to-r from-emerald-400 via-cyan-400 to-indigo-500 rounded-full animate-[progress_1.8s_ease-in-out_infinite]" style={{ width: '100%' }} />
          </div>
          <div className="flex items-center justify-between text-[10px] text-slate-500 font-mono">
            <span>READY</span>
            <span>118 ELEMENTS</span>
          </div>
        </div>

        {/* Enter Button */}
        <button
          onClick={(e) => {
            e.stopPropagation();
            handleDismiss();
          }}
          className="py-2.5 px-6 rounded-xl bg-gradient-to-r from-emerald-500/20 to-cyan-500/20 hover:from-emerald-500/30 hover:to-cyan-500/30 border border-emerald-500/40 text-emerald-300 hover:text-white font-semibold text-xs flex items-center gap-2 shadow-lg transition-all cursor-pointer"
        >
          <span>Launch Sandbox</span>
          <ArrowRight className="w-3.5 h-3.5" />
        </button>
      </div>
    </div>
  );
};
