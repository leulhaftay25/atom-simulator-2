import React, { useState } from 'react';
import { X, ChevronLeft, ChevronRight, Sparkles, Flame, Zap, Shield, Atom as AtomIcon, Play } from 'lucide-react';
import { sound } from '../utils/audio';

interface TutorialModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSelectElement: (z: number) => void;
  onLoadPreset: (presetId: string) => void;
}

interface TutorialStep {
  title: string;
  badge: string;
  icon: React.ReactNode;
  content: string[];
  keyConcept: string;
  quickAction?: {
    label: string;
    action: () => void;
  };
}

export const TutorialModal: React.FC<TutorialModalProps> = ({
  isOpen,
  onClose,
  onSelectElement,
  onLoadPreset
}) => {
  const [currentStep, setCurrentStep] = useState(0);

  if (!isOpen) return null;

  const steps: TutorialStep[] = [
    {
      title: "Welcome to Atom Simulator",
      badge: "Basics",
      icon: <AtomIcon className="w-5 h-5 text-emerald-400" />,
      content: [
        "In this sandbox, you simulate real subatomic and chemical physics in real-time.",
        "Select any element from the 118-element periodic table on the sidebar, then click or drag anywhere on the canvas to spawn atoms.",
        "Watch them move, collide, bond, ionize, and decay under realistic thermodynamic laws."
      ],
      keyConcept: "Every element has unique valence electrons, mass, collision radius, and radioactive traits.",
      quickAction: {
        label: "Select Hydrogen (H, Z=1)",
        action: () => {
          onSelectElement(1);
          sound.playClick();
          onClose();
        }
      }
    },
    {
      title: "Covalent Bonds & VSEPR Geometry",
      badge: "Chemistry",
      icon: <Sparkles className="w-5 h-5 text-cyan-400" />,
      content: [
        "Nonmetals share valence electrons when brought in close proximity.",
        "Over time, single bonds can strengthen into double (=) and triple (≡) bonds if valence allows.",
        "2D VSEPR Repulsion: Unbonded lone electron pairs push adjacent bonds away, naturally creating realistic bent angles (like water H-O-H)!"
      ],
      keyConcept: "Covalent bonds form cyan laser connections that preserve molecular structural stability.",
      quickAction: {
        label: "Load Water Molecule Preset (H₂O)",
        action: () => {
          onLoadPreset('water');
          sound.playClick();
          onClose();
        }
      }
    },
    {
      title: "Ionic Bonds & Electrostatics",
      badge: "Electrostatics",
      icon: <Zap className="w-5 h-5 text-fuchsia-400" />,
      content: [
        "When metals collide with nonmetals, electrons transfer! Metals gain a positive charge (cations), while nonmetals gain a negative charge (anions).",
        "Oppositely charged ions exert electrostatic Coulomb attraction, drawing them together with magenta electric field lines.",
        "Like charges repel, preventing clusters from collapsing."
      ],
      keyConcept: "Click 'Neutralize' at any time to clear ions and return charges to 0.",
      quickAction: {
        label: "Load Table Salt Preset (NaCl)",
        action: () => {
          onLoadPreset('salt');
          sound.playClick();
          onClose();
        }
      }
    },
    {
      title: "Metallic Lattices & Electron Sea",
      badge: "Solid State",
      icon: <Shield className="w-5 h-5 text-amber-400" />,
      content: [
        "Metals do not form rigid directional bonds. Instead, multiple metal atoms unite into a crystalline lattice.",
        "Their valence electrons delocalize into a shared 'electron sea', visualized as glowing cyan charges streaming fluidly across the metal matrix.",
        "Metallic bonds feature rotational damping, stabilizing the structure against chaotic jitter."
      ],
      keyConcept: "Delocalized electron seas give metals their unique conductivity and malleable rigidity.",
      quickAction: {
        label: "Load Iron Lattice Preset (Fe)",
        action: () => {
          onLoadPreset('iron');
          sound.playClick();
          onClose();
        }
      }
    },
    {
      title: "Radioactivity & Nuclear Fission",
      badge: "Nuclear",
      icon: <Flame className="w-5 h-5 text-purple-400" />,
      content: [
        "Elements with atomic number Z > 82 (and Technetium/Promethium) are radioactive isotopes marked with ☢.",
        "They decay spontaneously by shooting Alpha particles (α), Beta electrons (β⁻), Gamma rays (γ), or Neutrons (n).",
        "Neutrons hitting heavy actinide nuclei (like Uranium-235, Z=92) trigger explosive Nuclear Fission, splitting the atom and triggering chain reactions!"
      ],
      keyConcept: "Use '⚡ Pulse Rad' to immediately trigger particle emissions from all radioactive isotopes on screen.",
      quickAction: {
        label: "Load Nuclear Reactor Core (U)",
        action: () => {
          onLoadPreset('nuclear');
          sound.playClick();
          onClose();
        }
      }
    },
    {
      title: "Thermodynamics & Sandbox Juice",
      badge: "Sandbox",
      icon: <Play className="w-5 h-5 text-emerald-400" />,
      content: [
        "System Heat Slider: Adjust temperature in Kelvin (0 K to 500 K). Higher temperatures increase kinetic brownian motion and can shatter weak bonds.",
        "Decay Rate Slider: Speeds up radioactive half-life for dramatic decay cascades.",
        "Interactive Flinging: You can click and drag existing atoms across the canvas to throw them at each other!",
        "Audio Engine: Every collision, bond snap, and nuclear blast generates reactive procedural synthesizer soundscapes."
      ],
      keyConcept: "Press Space to Pause/Resume, or use the HUD Speed buttons to slow down fast nuclear reactions.",
      quickAction: {
        label: "Start Exploring Now!",
        action: () => {
          sound.playClick();
          onClose();
        }
      }
    }
  ];

  const current = steps[currentStep];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-2 sm:p-4 bg-black/75 backdrop-blur-sm animate-in fade-in duration-200">
      <div 
        className="w-full max-w-xl max-h-[92vh] bg-[#12131b] border border-[#272a3c] rounded-2xl shadow-2xl overflow-hidden flex flex-col"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Modal Header */}
        <div className="flex items-center justify-between px-4 sm:px-6 py-2.5 sm:py-3.5 border-b border-[#222533] bg-[#161722] shrink-0">
          <div className="flex items-center gap-2.5">
            <div className="p-1.5 sm:p-2 bg-[#202336] rounded-xl border border-[#2e334d]">
              {current.icon}
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-[10px] sm:text-xs font-semibold text-emerald-400 uppercase tracking-wider">
                  {current.badge}
                </span>
                <span className="text-xs text-slate-500">·</span>
                <span className="text-[10px] sm:text-xs text-slate-400">
                  Step {currentStep + 1} of {steps.length}
                </span>
              </div>
              <h3 className="text-xs sm:text-sm font-bold text-white">
                {current.title}
              </h3>
            </div>
          </div>
          <button 
            onClick={() => { sound.playClick(); onClose(); }}
            className="p-1.5 text-slate-400 hover:text-white rounded-lg hover:bg-[#202336] transition-colors"
            title="Close Tutorial"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-3.5 sm:p-5 space-y-3 flex-1 overflow-y-auto">
          <div className="space-y-2">
            {current.content.map((paragraph, idx) => (
              <p key={idx} className="text-xs sm:text-sm text-slate-300 leading-relaxed">
                {paragraph}
              </p>
            ))}
          </div>

          <div className="p-3 bg-[#1a1c29] border border-[#2b2f44] rounded-xl text-[11px] sm:text-xs text-emerald-300 flex items-start gap-2.5">
            <span className="font-bold text-emerald-400 shrink-0">KEY INSIGHT:</span>
            <span className="text-slate-300">{current.keyConcept}</span>
          </div>

          {current.quickAction && (
            <div className="pt-2">
              <button
                onClick={current.quickAction.action}
                className="w-full py-2.5 px-4 bg-emerald-500/15 hover:bg-emerald-500/25 border border-emerald-500/40 hover:border-emerald-500/70 text-emerald-300 hover:text-emerald-200 font-semibold text-xs rounded-xl flex items-center justify-center gap-2 transition-all"
              >
                <Sparkles className="w-4 h-4" />
                {current.quickAction.label}
              </button>
            </div>
          )}
        </div>

        {/* Modal Footer */}
        <div className="flex items-center justify-between px-6 py-4 border-t border-[#222533] bg-[#161722]">
          <div className="flex items-center gap-1.5">
            {steps.map((_, i) => (
              <button
                key={i}
                onClick={() => { sound.playClick(); setCurrentStep(i); }}
                className={`h-2 rounded-full transition-all ${
                  i === currentStep 
                    ? 'w-6 bg-emerald-400' 
                    : 'w-2 bg-slate-700 hover:bg-slate-500'
                }`}
                aria-label={`Go to step ${i + 1}`}
              />
            ))}
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => {
                if (currentStep > 0) {
                  sound.playClick();
                  setCurrentStep(currentStep - 1);
                }
              }}
              disabled={currentStep === 0}
              className={`px-3 py-1.5 text-xs font-medium rounded-lg flex items-center gap-1 transition-colors ${
                currentStep === 0 
                  ? 'text-slate-600 cursor-not-allowed' 
                  : 'text-slate-300 hover:text-white bg-[#222536] hover:bg-[#2c3046]'
              }`}
            >
              <ChevronLeft className="w-4 h-4" />
              Previous
            </button>

            {currentStep < steps.length - 1 ? (
              <button
                onClick={() => {
                  sound.playClick();
                  setCurrentStep(currentStep + 1);
                }}
                className="px-4 py-1.5 text-xs font-semibold rounded-lg text-black bg-emerald-400 hover:bg-emerald-300 flex items-center gap-1 shadow-sm transition-all"
              >
                Next
                <ChevronRight className="w-4 h-4" />
              </button>
            ) : (
              <button
                onClick={() => {
                  sound.playClick();
                  onClose();
                }}
                className="px-4 py-1.5 text-xs font-semibold rounded-lg text-black bg-emerald-400 hover:bg-emerald-300 flex items-center gap-1 shadow-sm transition-all"
              >
                Ready to Play!
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
