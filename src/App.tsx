import React, { useEffect, useRef, useState, useCallback } from 'react';
import { 
  Atom as AtomType, 
  CovalentBond, 
  RadiationParticle, 
  VFXSpark, 
  VFXShockwave, 
  FloatingReactionText 
} from './types/simulation';
import { getElementData, SYMBOLS, ELEMENT_NAMES } from './utils/elementData';
import { sound } from './utils/audio';
import { PRESETS } from './utils/presets';
import { TutorialModal } from './components/TutorialModal';
import { PresetsModal } from './components/PresetsModal';
import { AtomInspector } from './components/AtomInspector';
import { PortraitOverlay } from './components/PortraitOverlay';
import { SplashScreen } from './components/SplashScreen';
import { TasksModal } from './components/TasksModal';
import { SIMULATION_TASKS, evaluateTaskCompletion } from './utils/tasks';
import { 
  Play, 
  Pause, 
  RotateCcw, 
  Zap, 
  Volume2, 
  VolumeX, 
  BookOpen, 
  Sparkles, 
  Search, 
  Move, 
  PlusCircle,
  HelpCircle,
  Flame,
  Shield,
  Activity,
  Atom as AtomIcon,
  ChevronLeft,
  ChevronRight,
  Menu,
  Trophy
} from 'lucide-react';

export default function App() {
  // Canvas refs
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const containerRef = useRef<HTMLDivElement | null>(null);

  // Simulation State Refs (for high-performance 60fps loop without React re-render lag)
  const atomsRef = useRef<AtomType[]>([]);
  const bondsRef = useRef<CovalentBond[]>([]);
  const particlesRef = useRef<RadiationParticle[]>([]);
  const sparksRef = useRef<VFXSpark[]>([]);
  const shockwavesRef = useRef<VFXShockwave[]>([]);
  const floatingTextsRef = useRef<FloatingReactionText[]>([]);

  // Camera Trauma / Screen Shake
  const shakeIntensityRef = useRef<number>(0);

  // Interaction State Refs
  const isMouseDownRef = useRef<boolean>(false);
  const lastSpawnTimeRef = useRef<number>(0);
  const mousePosRef = useRef<{ x: number; y: number }>({ x: 0, y: 0 });
  const draggedAtomRef = useRef<AtomType | null>(null);
  const dragOffsetRef = useRef<{ x: number; y: number }>({ x: 0, y: 0 });
  const dragVelocityRef = useRef<{ vx: number; vy: number }>({ vx: 0, vy: 0 });
  const hoveredAtomRef = useRef<AtomType | null>(null);

  // Reactive UI State
  const [selectedZ, setSelectedZ] = useState<number>(11); // Sodium by default
  const [heat, setHeat] = useState<number>(60);
  const [decayRate, setDecayRate] = useState<number>(20);
  const [showValence, setShowValence] = useState<boolean>(true);
  const [vfxEnabled, setVfxEnabled] = useState<boolean>(true);
  const [isPaused, setIsPaused] = useState<boolean>(false);
  const [simSpeed, setSimSpeed] = useState<number>(1.0);
  const [isMuted, setIsMuted] = useState<boolean>(false);
  const [interactionMode, setInteractionMode] = useState<'spawn' | 'drag'>('spawn');

  // Modals & Panels
  const [isTutorialOpen, setIsTutorialOpen] = useState<boolean>(false);
  const [isPresetsOpen, setIsPresetsOpen] = useState<boolean>(false);
  const [isTasksOpen, setIsTasksOpen] = useState<boolean>(false);
  const [inspectedAtom, setInspectedAtom] = useState<AtomType | null>(null);
  const [isPortraitDismissed, setIsPortraitDismissed] = useState<boolean>(false);
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState<boolean>(false);
  const [showSplash, setShowSplash] = useState<boolean>(true);

  // Completed Tasks Persistence
  const [completedTasks, setCompletedTasks] = useState<Set<string>>(() => {
    try {
      const saved = localStorage.getItem('atom_sim_completed_tasks');
      return saved ? new Set(JSON.parse(saved)) : new Set();
    } catch {
      return new Set();
    }
  });
  const fissionOccurredRef = useRef<boolean>(false);
  const pulseTriggeredRef = useRef<boolean>(false);
  const [latestUnlockedTask, setLatestUnlockedTask] = useState<string | null>(null);

  useEffect(() => {
    try {
      localStorage.setItem('atom_sim_completed_tasks', JSON.stringify(Array.from(completedTasks)));
    } catch {
      // ignore
    }
  }, [completedTasks]);

  // Element Grid Filter / Search
  const [elementSearch, setElementSearch] = useState<string>('');
  const [elementFilter, setElementFilter] = useState<'all' | 'metal' | 'nonmetal' | 'metalloid' | 'radioactive'>('all');

  // Stats Counters
  const [atomCount, setAtomCount] = useState<number>(0);
  const [bondCount, setBondCount] = useState<number>(0);

  // Sync refs for the loop
  const heatRef = useRef(heat);
  heatRef.current = heat;
  const decayRateRef = useRef(decayRate);
  decayRateRef.current = decayRate;
  const showValenceRef = useRef(showValence);
  showValenceRef.current = showValence;
  const vfxEnabledRef = useRef(vfxEnabled);
  vfxEnabledRef.current = vfxEnabled;
  const isPausedRef = useRef(isPaused);
  isPausedRef.current = isPaused;
  const simSpeedRef = useRef(simSpeed);
  simSpeedRef.current = simSpeed;
  const selectedZRef = useRef(selectedZ);
  selectedZRef.current = selectedZ;
  const interactionModeRef = useRef(interactionMode);
  interactionModeRef.current = interactionMode;

  // Add Screen Shake
  const addScreenShake = useCallback((amount: number) => {
    shakeIntensityRef.current = Math.min(18, shakeIntensityRef.current + amount);
  }, []);

  // Add VFX Sparks
  const addSparks = useCallback((x: number, y: number, color: string, count = 8, speedScale = 1) => {
    if (!vfxEnabledRef.current) return;
    if (sparksRef.current.length > 130) {
      sparksRef.current.splice(0, sparksRef.current.length - 100);
    }
    for (let i = 0; i < count; i++) {
      const angle = Math.random() * Math.PI * 2;
      const speed = (1 + Math.random() * 4) * speedScale;
      sparksRef.current.push({
        x,
        y,
        vx: Math.cos(angle) * speed,
        vy: Math.sin(angle) * speed,
        color,
        size: 1 + Math.random() * 2.5,
        alpha: 1.0,
        decay: 0.03 + Math.random() * 0.03
      });
    }
  }, []);

  // Add Shockwave
  const addShockwave = useCallback((x: number, y: number, color: string, maxRadius = 45) => {
    if (!vfxEnabledRef.current) return;
    if (shockwavesRef.current.length > 20) {
      shockwavesRef.current.splice(0, shockwavesRef.current.length - 14);
    }
    shockwavesRef.current.push({
      x,
      y,
      radius: 4,
      maxRadius,
      color,
      lineWidth: 2.5,
      alpha: 1.0,
      decay: 0.045
    });
  }, []);

  // Add Floating Text
  const addFloatingText = useCallback((x: number, y: number, text: string, color: string) => {
    if (!vfxEnabledRef.current) return;
    if (floatingTextsRef.current.length > 15) {
      floatingTextsRef.current.splice(0, floatingTextsRef.current.length - 10);
    }
    floatingTextsRef.current.push({
      id: Math.random(),
      x,
      y,
      text,
      color,
      alpha: 1.0,
      vy: -1.2,
      scale: 1.0
    });
  }, []);

  // Periodic background task evaluation & stats synchronization (prevents micro-stutters during 60fps loop)
  useEffect(() => {
    const interval = setInterval(() => {
      setAtomCount(atomsRef.current.length);
      setBondCount(bondsRef.current.length);

      const ctx = {
        atoms: atomsRef.current,
        bonds: bondsRef.current,
        particles: particlesRef.current,
        heat: heatRef.current,
        fissionOccurred: fissionOccurredRef.current,
        pulseTriggered: pulseTriggeredRef.current
      };

      let newlyDoneTitle: string | null = null;
      setCompletedTasks(prev => {
        let updated = false;
        const next = new Set(prev);
        for (const task of SIMULATION_TASKS) {
          if (!next.has(task.id)) {
            if (evaluateTaskCompletion(task.id, ctx)) {
              next.add(task.id);
              updated = true;
              newlyDoneTitle = task.title;
            }
          }
        }
        return updated ? next : prev;
      });

      if (newlyDoneTitle) {
        sound.playTaskSuccess();
        addScreenShake(3);
        setLatestUnlockedTask(newlyDoneTitle);
        setTimeout(() => {
          setLatestUnlockedTask(null);
        }, 4500);
        addFloatingText(
          window.innerWidth / 2,
          window.innerHeight / 2 - 40,
          `🏆 MISSION COMPLETE: ${newlyDoneTitle}!`,
          '#fcd34d'
        );
      }
    }, 350);

    return () => clearInterval(interval);
  }, [addScreenShake, addFloatingText]);

  // Spawn particle helper
  const emitParticle = useCallback((sourceAtom: AtomType, type: 'alpha' | 'beta' | 'gamma' | 'neutron') => {
    const angle = Math.random() * Math.PI * 2;
    let pSpeed = 8;
    let pRadius = 3;
    let pColor = '#ffffff';
    let pMass = 1;
    let pLife = 180;

    if (type === 'alpha') {
      pSpeed = 6;
      pRadius = 4;
      pColor = '#ff3300';
      pMass = 4;
      pLife = 180;
    } else if (type === 'beta') {
      pSpeed = 13;
      pRadius = 2.5;
      pColor = '#00ffff';
      pMass = 0.1;
      pLife = 100;
    } else if (type === 'gamma') {
      pSpeed = 18;
      pRadius = 2;
      pColor = '#ff00ff';
      pMass = 0.01;
      pLife = 70;
    } else if (type === 'neutron') {
      pSpeed = 8;
      pRadius = 3.5;
      pColor = '#ffffff';
      pMass = 1;
      pLife = 200;
    }

    const p: RadiationParticle = {
      type,
      x: sourceAtom.x + Math.cos(angle) * (sourceAtom.radius + pRadius + 4),
      y: sourceAtom.y + Math.sin(angle) * (sourceAtom.radius + pRadius + 4),
      vx: Math.cos(angle) * pSpeed,
      vy: Math.sin(angle) * pSpeed,
      radius: pRadius,
      color: pColor,
      life: pLife,
      age: 0,
      sourceId: sourceAtom.id,
      trail: []
    };

    // Recoil
    sourceAtom.vx -= (p.vx * pMass) / sourceAtom.mass;
    sourceAtom.vy -= (p.vy * pMass) / sourceAtom.mass;

    if (particlesRef.current.length > 75) {
      particlesRef.current.splice(0, particlesRef.current.length - 60);
    }
    particlesRef.current.push(p);

    // Audio & VFX
    sound.playDecay(type);
    addSparks(p.x, p.y, pColor, 4, 0.6);
  }, [addSparks]);

  // Change Element
  const changeElement = useCallback((atom: AtomType, newZ: number) => {
    newZ = Math.max(1, Math.min(118, newZ));
    const data = getElementData(newZ);
    Object.assign(atom, data);
    atom.charge = 0;
    atom.flashTimer = 15;
    // Break any covalent bonds that now exceed limit or involving metals
    bondsRef.current = bondsRef.current.filter(b => b.a1.id !== atom.id && b.a2.id !== atom.id);
  }, []);

  // Fission Trigger
  const triggerFission = useCallback((atom: AtomType) => {
    const z1 = Math.floor(atom.z * 0.4) + Math.floor(Math.random() * 8);
    const z2 = atom.z - z1;

    changeElement(atom, z1);
    atom.vx = (Math.random() - 0.5) * 12;
    atom.vy = (Math.random() - 0.5) * 12;

    const frag2: AtomType = {
      id: Math.random(),
      ...getElementData(z2),
      x: atom.x + (Math.random() - 0.5) * 20,
      y: atom.y + (Math.random() - 0.5) * 20,
      vx: (Math.random() - 0.5) * 12,
      vy: (Math.random() - 0.5) * 12,
      charge: 0,
      orbitAngle: 0,
      flashTimer: 20
    };
    atomsRef.current.push(frag2);

    for (let i = 0; i < 3; i++) {
      emitParticle(atom, 'neutron');
    }
    emitParticle(atom, 'gamma');
    fissionOccurredRef.current = true;

    // Super juicy feedback
    sound.playFission();
    addScreenShake(12);
    addShockwave(atom.x, atom.y, '#ffffff', 80);
    addShockwave(atom.x, atom.y, '#a855f7', 120);
    addSparks(atom.x, atom.y, '#f59e0b', 24, 2);
    addSparks(atom.x, atom.y, '#a855f7', 18, 1.5);
    addFloatingText(atom.x, atom.y - 20, `💥 FISSION! (${atom.symbol} + ${frag2.symbol})`, '#fcd34d');
  }, [changeElement, emitParticle, addScreenShake, addShockwave, addSparks, addFloatingText]);

  // Helper for bond count
  const getAtomBondCount = useCallback((atomId: number) => {
    let count = 0;
    bondsRef.current.forEach(b => {
      if (b.a1.id === atomId || b.a2.id === atomId) count += b.order;
    });
    return count;
  }, []);

  // Spawn Atom at Position
  const spawnAtomAt = useCallback((x: number, y: number) => {
    const el = getElementData(selectedZRef.current);
    let spawnX = x;
    let spawnY = y;

    // Overlap prevention iterations
    for (let iter = 0; iter < 12; iter++) {
      let resolved = true;
      for (const a of atomsRef.current) {
        const dx = spawnX - a.x;
        const dy = spawnY - a.y;
        const dist = Math.hypot(dx, dy);
        const minDist = a.radius + el.radius;

        if (dist < minDist) {
          resolved = false;
          const angle = dist === 0 ? Math.random() * Math.PI * 2 : Math.atan2(dy, dx);
          spawnX = a.x + Math.cos(angle) * minDist;
          spawnY = a.y + Math.sin(angle) * minDist;
        }
      }
      if (resolved) break;
    }

    const newAtom: AtomType = {
      id: Math.random(),
      ...el,
      x: spawnX,
      y: spawnY,
      vx: (Math.random() - 0.5) * 0.4,
      vy: (Math.random() - 0.5) * 0.4,
      charge: 0,
      orbitAngle: Math.random() * Math.PI * 2,
      flashTimer: 10,
      creationTime: Date.now()
    };

    atomsRef.current.push(newAtom);

    // Audio & VFX Juice
    sound.playSpawn(newAtom.mass, newAtom.z);
    addSparks(spawnX, spawnY, el.color, 6, 0.8);
    addShockwave(spawnX, spawnY, el.color, 24);
  }, [addSparks, addShockwave]);

  // Pulse Rad Button
  const handlePulseRad = useCallback(() => {
    let triggeredCount = 0;
    atomsRef.current.forEach(a => {
      if (a.isRadioactive) {
        triggeredCount++;
        emitParticle(a, 'alpha');
        emitParticle(a, 'beta');
        emitParticle(a, 'gamma');
        emitParticle(a, 'neutron');
        addShockwave(a.x, a.y, '#a855f7', 40);
        addSparks(a.x, a.y, '#39ff14', 10, 1.2);
      }
    });

    if (triggeredCount > 0) {
      pulseTriggeredRef.current = true;
      sound.playPulse();
      addScreenShake(6);
      addFloatingText(window.innerWidth / 2, window.innerHeight / 2, `⚡ RADIATION PULSE!`, '#39ff14');
    }
  }, [emitParticle, addShockwave, addSparks, addScreenShake, addFloatingText]);

  // Reset Ions / Neutralize
  const handleNeutralize = useCallback(() => {
    let hadCharge = false;
    atomsRef.current.forEach(a => {
      if (a.charge !== 0) {
        hadCharge = true;
        a.charge = 0;
        addSparks(a.x, a.y, '#00ffff', 6, 0.7);
      }
    });
    sound.playClick();
    if (hadCharge) {
      addFloatingText(window.innerWidth / 2, window.innerHeight / 2, `🛡 ALL CHARGES NEUTRALIZED`, '#38bdf8');
    }
  }, [addSparks, addFloatingText]);

  // Clear Canvas
  const handleClear = useCallback(() => {
    atomsRef.current = [];
    bondsRef.current = [];
    particlesRef.current = [];
    sparksRef.current = [];
    shockwavesRef.current = [];
    floatingTextsRef.current = [];
    setInspectedAtom(null);
    sound.playClick();
  }, []);

  // Load Preset
  const handleLoadPreset = useCallback((presetId: string) => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const found = PRESETS.find(p => p.id === presetId);
    if (!found) return;

    handleClear();

    const result = found.create(canvas.width, canvas.height);
    atomsRef.current = result.atoms;
    bondsRef.current = result.bonds;
    particlesRef.current = result.particles;

    sound.playCovalentBond(2);
    addScreenShake(4);
    addFloatingText(canvas.width / 2, canvas.height / 2 - 40, `✨ Preset: ${result.name}`, '#34d399');

    result.atoms.forEach(a => {
      addShockwave(a.x, a.y, a.color, 35);
      addSparks(a.x, a.y, a.color, 8, 1);
    });
  }, [handleClear, addScreenShake, addFloatingText, addShockwave, addSparks]);

  // Toggle Sound Mute
  const handleToggleSound = useCallback(() => {
    const nextMuted = !isMuted;
    setIsMuted(nextMuted);
    sound.setMuted(nextMuted);
    if (!nextMuted) sound.playClick();
  }, [isMuted]);

  // Filter Elements in periodic table grid
  const filteredElements = React.useMemo(() => {
    return Array.from({ length: 118 }, (_, idx) => {
      const z = idx + 1;
      return getElementData(z);
    }).filter(el => {
      // Category filter
      if (elementFilter === 'metal' && !el.isMetal) return false;
      if (elementFilter === 'nonmetal' && (el.isMetal || el.isMetalloid)) return false;
      if (elementFilter === 'metalloid' && !el.isMetalloid) return false;
      if (elementFilter === 'radioactive' && !el.isRadioactive) return false;

      // Search query
      if (elementSearch.trim()) {
        const query = elementSearch.toLowerCase().trim();
        const matchesSymbol = el.symbol.toLowerCase().includes(query);
        const matchesName = el.name.toLowerCase().includes(query);
        const matchesZ = el.z.toString() === query;
        return matchesSymbol || matchesName || matchesZ;
      }
      return true;
    });
  }, [elementFilter, elementSearch]);

  // Find Atom at screen coordinates
  const findAtomAt = useCallback((x: number, y: number) => {
    for (let i = atomsRef.current.length - 1; i >= 0; i--) {
      const a = atomsRef.current[i];
      if (Math.hypot(x - a.x, y - a.y) <= a.radius + 6) {
        return a;
      }
    }
    return null;
  }, []);

  // Keyboard shortcut listener (Space = Pause, P = Pulse, C = Clear)
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement) return;

      if (e.code === 'Space') {
        e.preventDefault();
        setIsPaused(prev => !prev);
        sound.playClick();
      } else if (e.key === 'p' || e.key === 'P') {
        handlePulseRad();
      } else if (e.key === 'm' || e.key === 'M') {
        handleToggleSound();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [handlePulseRad, handleToggleSound]);

  // Main Canvas Setup & Animation Loop
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let animId: number;

    const handleResize = () => {
      if (!canvas || !canvas.parentElement) return;
      canvas.width = canvas.parentElement.clientWidth;
      canvas.height = canvas.parentElement.clientHeight;
    };

    window.addEventListener('resize', handleResize);
    handleResize();

    let lastTime = performance.now();

    // High-performance Delta-Time (dt) Physics Simulation Loop
    const loop = (currentTime: number) => {
      const width = canvas.width;
      const height = canvas.height;

      // Real Delta-Time calculation normalized to 60fps (16.67ms = 1.0)
      const now = currentTime || performance.now();
      const elapsed = Math.min(64, Math.max(4, now - lastTime));
      lastTime = now;
      // Clamp dt between 0.1 and 2.0 to prevent simulation tunneling or explosion
      const dt = Math.min(2.0, Math.max(0.1, elapsed / 16.6667));
      const speedMult = simSpeedRef.current;
      const step = dt * speedMult;

      // Camera Shake application
      ctx.save();
      if (shakeIntensityRef.current > 0.05) {
        const sx = (Math.random() - 0.5) * shakeIntensityRef.current;
        const sy = (Math.random() - 0.5) * shakeIntensityRef.current;
        ctx.translate(sx, sy);
        shakeIntensityRef.current *= Math.pow(0.88, dt);
      } else {
        shakeIntensityRef.current = 0;
      }

      // Clear Canvas with sleek deep space gradient
      ctx.fillStyle = '#08090e';
      ctx.fillRect(0, 0, width, height);

      // Subtle background quantum grid dots
      ctx.fillStyle = 'rgba(255, 255, 255, 0.025)';
      const gridStep = 40;
      for (let gx = 20; gx < width; gx += gridStep) {
        for (let gy = 20; gy < height; gy += gridStep) {
          ctx.beginPath();
          ctx.arc(gx, gy, 1, 0, Math.PI * 2);
          ctx.fill();
        }
      }

      const paused = isPausedRef.current;
      const currentHeat = heatRef.current;
      const currentDecayProb = (decayRateRef.current / 100) * 0.03;
      const showValenceElectrons = showValenceRef.current;

      const atoms = atomsRef.current;
      let covalentBonds = bondsRef.current;
      const particles = particlesRef.current;

      if (!paused) {
        // 1. Atom Motion, Brownian Heat Jitter & Radioactive Decay (Scaled by step)
        atoms.forEach(a => {
          a.orbitAngle += 0.04 * step;
          if (a.flashTimer && a.flashTimer > 0) a.flashTimer -= step;

          // Dragging physics override
          if (draggedAtomRef.current && draggedAtomRef.current.id === a.id) {
            a.x = mousePosRef.current.x - dragOffsetRef.current.x;
            a.y = mousePosRef.current.y - dragOffsetRef.current.y;
            a.vx = dragVelocityRef.current.vx;
            a.vy = dragVelocityRef.current.vy;
          } else {
            if (currentHeat > 0) {
              const jitter = ((currentHeat / 180) / Math.sqrt(a.mass)) * Math.sqrt(step);
              a.vx += (Math.random() - 0.5) * jitter;
              a.vy += (Math.random() - 0.5) * jitter;
            }

            // Radioactive Decay (Scaled with step)
            if (a.isRadioactive && Math.random() < currentDecayProb * step) {
              const r = Math.random();
              if (a.z >= 90 && r < 0.05) {
                triggerFission(a);
              } else if (r < 0.40) {
                emitParticle(a, 'alpha');
                changeElement(a, a.z - 2);
                addFloatingText(a.x, a.y - 12, `α Decay (-2)`, '#ff3300');
              } else if (r < 0.75) {
                emitParticle(a, 'beta');
                changeElement(a, a.z + 1);
                addFloatingText(a.x, a.y - 12, `β⁻ Decay (+1)`, '#00ffff');
              } else {
                const isGamma = Math.random() < 0.5;
                emitParticle(a, isGamma ? 'gamma' : 'neutron');
                addFloatingText(a.x, a.y - 12, isGamma ? `γ Ray` : `Neutron (n)`, isGamma ? '#ff00ff' : '#ffffff');
              }
            }

            a.x += a.vx * step;
            a.y += a.vy * step;
            a.vx *= Math.pow(0.96, step);
            a.vy *= Math.pow(0.96, step);

            // Wall Collisions
            if (a.x < a.radius) {
              a.x = a.radius;
              a.vx *= -0.8;
              if (Math.abs(a.vx) > 1.5) addSparks(a.x, a.y, a.color, 3, 0.4);
            }
            if (a.x > width - a.radius) {
              a.x = width - a.radius;
              a.vx *= -0.8;
              if (Math.abs(a.vx) > 1.5) addSparks(a.x, a.y, a.color, 3, 0.4);
            }
            if (a.y < a.radius) {
              a.y = a.radius;
              a.vy *= -0.8;
              if (Math.abs(a.vy) > 1.5) addSparks(a.x, a.y, a.color, 3, 0.4);
            }
            if (a.y > height - a.radius) {
              a.y = height - a.radius;
              a.vy *= -0.8;
              if (Math.abs(a.vy) > 1.5) addSparks(a.x, a.y, a.color, 3, 0.4);
            }
          }
        });

        // 2. Collisions, Ionic Attraction & Progressive Covalent Bonding
        for (let i = 0; i < atoms.length; i++) {
          for (let j = i + 1; j < atoms.length; j++) {
            const a1 = atoms[i];
            const a2 = atoms[j];
            const dx = a2.x - a1.x;
            const dy = a2.y - a1.y;
            const minDist = a1.radius + a2.radius;
            const hasCharge = a1.charge !== 0 || a2.charge !== 0;
            const maxInteractionDist = hasCharge ? 200 : minDist * 2.8;

            // Performance: fast bounding-box early exit check without sqrt/multiplication
            if (Math.abs(dx) > maxInteractionDist || Math.abs(dy) > maxInteractionDist) {
              continue;
            }

            const distSq = dx * dx + dy * dy;
            if (distSq > maxInteractionDist * maxInteractionDist) {
              continue;
            }

            const dist = Math.max(Math.sqrt(distSq), 0.1);

            if (dist < minDist) {
              const overlap = minDist - dist;
              const nx = dx / dist;
              const ny = dy / dist;
              const totalMass = a1.mass + a2.mass;

              a1.x -= nx * overlap * (a2.mass / totalMass);
              a1.y -= ny * overlap * (a1.mass / totalMass);
              a2.x += nx * overlap * (a1.mass / totalMass);
              a2.y += ny * overlap * (a1.mass / totalMass);

              const kx = a1.vx - a2.vx;
              const ky = a1.vy - a2.vy;
              const approachSpeed = nx * kx + ny * ky;

              if (approachSpeed < 0) {
                const p = (2 * approachSpeed) / totalMass;
                a1.vx -= p * a2.mass * nx * 0.8;
                a1.vy -= p * a2.mass * ny * 0.8;
                a2.vx += p * a1.mass * nx * 0.8;
                a2.vy += p * a1.mass * nx * 0.8;

                if (Math.abs(approachSpeed) > 1.5) {
                  sound.playCollision(Math.abs(approachSpeed));
                  addSparks((a1.x + a2.x) / 2, (a1.y + a2.y) / 2, '#94a3b8', 4, 0.7);
                }
              }

              // Electron Transfer (Metal + Nonmetal)
              // USER RULE: If an element is already full (e.g. Oxygen reached 2 bonds), it cannot bond ionically with elements like Fe!
              // But if it hasn't reached its bonds (needs to bond), it can bond ionically.
              if (a1.isMetal !== a2.isMetal) {
                const metal = a1.isMetal ? a1 : a2;
                const nonmetal = a1.isMetal ? a2 : a1;

                const nonmetalBonds = getAtomBondCount(nonmetal.id);
                // Check if nonmetal is full or satisfied:
                // e.g. Oxygen reached 2 bonds, or noble gas (0 maxBonds), or total bonds + negative charge reaches maxBonds
                const isNonmetalFull = nonmetal.maxBonds === 0 || 
                  nonmetalBonds >= nonmetal.maxBonds || 
                  (nonmetalBonds + Math.abs(nonmetal.charge) >= nonmetal.maxBonds);

                const metalCanDonate = metal.charge < metal.maxPosCharge;
                const nonmetalCanAccept = !isNonmetalFull && (nonmetal.charge > -nonmetal.maxNegCharge);

                if (nonmetalCanAccept && metalCanDonate) {
                  metal.charge++;
                  nonmetal.charge--;
                  sound.playIonicBond();
                  addShockwave((a1.x + a2.x) / 2, (a1.y + a2.y) / 2, '#ff00ff', 35);
                  addSparks((a1.x + a2.x) / 2, (a1.y + a2.y) / 2, '#ff00ff', 10, 1.1);
                  addFloatingText(
                    (a1.x + a2.x) / 2, 
                    (a1.y + a2.y) / 2 - 15, 
                    `⚡ Ionized: ${metal.symbol}⁺ + ${nonmetal.symbol}⁻`, 
                    '#ff00ff'
                  );
                }
              }
            }

            // Electrostatic Attraction & Force (Scaled with step)
            if (a1.charge !== 0 && a2.charge !== 0) {
              let force = (a1.charge * a2.charge * 120) / (dist * dist);
              force = Math.max(-2, Math.min(2, force)) * step;
              a1.vx -= (dx / dist) * force / a1.mass;
              a1.vy -= (dy / dist) * force / a1.mass;
              a2.vx += (dx / dist) * force / a2.mass;
              a2.vy += (dy / dist) * force / a2.mass;

              // Electric Attraction Line visual
              if (a1.charge * a2.charge < 0 && dist < minDist * 2.8) {
                ctx.save();
                ctx.strokeStyle = '#ff00ff';
                ctx.lineWidth = 1.8;
                ctx.setLineDash([5, 4]);
                ctx.lineDashOffset = -Date.now() * 0.02;
                ctx.shadowBlur = 4;
                ctx.shadowColor = '#ff00ff';
                ctx.beginPath();
                ctx.moveTo(a1.x, a1.y);
                ctx.lineTo(a2.x, a2.y);
                ctx.stroke();
                ctx.restore();
              }
            }

            // Progressive Covalent Bonding
            if (!a1.isMetal && !a2.isMetal && a1.charge === 0 && a2.charge === 0) {
              const existing = covalentBonds.find(
                b => (b.a1.id === a1.id && b.a2.id === a2.id) || (b.a1.id === a2.id && b.a2.id === a1.id)
              );

              if (dist < minDist * 1.35) {
                if (!existing) {
                  const a1Bonds = getAtomBondCount(a1.id);
                  const a2Bonds = getAtomBondCount(a2.id);
                  if (a1Bonds < a1.maxBonds && a2Bonds < a2.maxBonds) {
                    const newBond: CovalentBond = { a1, a2, order: 1, timer: 0, formationFlash: 12 };
                    covalentBonds.push(newBond);
                    sound.playCovalentBond(1);
                    addShockwave((a1.x + a2.x) / 2, (a1.y + a2.y) / 2, '#00ffff', 30);
                    addSparks((a1.x + a2.x) / 2, (a1.y + a2.y) / 2, '#00ffff', 8, 1);
                    addFloatingText((a1.x + a2.x) / 2, (a1.y + a2.y) / 2 - 12, `+ Covalent Bond (${a1.symbol}-${a2.symbol})`, '#00ffff');
                  }
                } else if (existing.order < 3) {
                  existing.timer += 1 * step;
                  const a1Available = a1.maxBonds - (getAtomBondCount(a1.id) - existing.order);
                  const a2Available = a2.maxBonds - (getAtomBondCount(a2.id) - existing.order);
                  const maxAllowedOrder = Math.min(3, a1Available, a2Available);

                  if (existing.timer > 90 && existing.order < maxAllowedOrder) {
                    existing.order++;
                    existing.timer = 0;
                    existing.formationFlash = 12;
                    sound.playCovalentBond(existing.order);
                    addShockwave((a1.x + a2.x) / 2, (a1.y + a2.y) / 2, '#00ffff', 40);
                    addSparks((a1.x + a2.x) / 2, (a1.y + a2.y) / 2, '#38bdf8', 12, 1.2);
                    const orderName = existing.order === 2 ? 'Double Bond (=)' : 'Triple Bond (≡)';
                    addFloatingText((a1.x + a2.x) / 2, (a1.y + a2.y) / 2 - 16, `⚡ ${orderName}!`, '#38bdf8');
                  }
                }
              } else if (existing) {
                existing.timer = Math.max(0, existing.timer - 0.5 * step);
              }
            }
          }
        }

        // 3. Metallic Bonding & Delocalized Electron Sea
        const candidateMetals = atoms.filter(a => a.isMetal && a.charge !== a.maxPosCharge);
        const visitedMetals = new Set<number>();
        const bondedMetals = new Set<number>();

        candidateMetals.forEach(a => {
          if (!visitedMetals.has(a.id)) {
            const cluster: AtomType[] = [];
            const queue: AtomType[] = [a];
            visitedMetals.add(a.id);

            while (queue.length > 0) {
              const curr = queue.shift()!;
              cluster.push(curr);

              candidateMetals.forEach(other => {
                if (!visitedMetals.has(other.id)) {
                  const d = Math.hypot(curr.x - other.x, curr.y - other.y);
                  if (d < (curr.radius + other.radius) * 1.55) {
                    visitedMetals.add(other.id);
                    queue.push(other);
                  }
                }
              });
            }

            if (cluster.length >= 2) {
              cluster.forEach(m => bondedMetals.add(m.id));

              // Draw Lattice Struts
              ctx.save();
              ctx.strokeStyle = 'rgba(230, 126, 34, 0.45)';
              ctx.lineWidth = 2.5;

              for (let i = 0; i < cluster.length; i++) {
                for (let j = i + 1; j < cluster.length; j++) {
                  const m1 = cluster[i];
                  const m2 = cluster[j];
                  const dx = m2.x - m1.x;
                  const dy = m2.y - m1.y;
                  const dist = Math.hypot(dx, dy);
                  const targetDist = m1.radius + m2.radius + 1.5;

                  if (dist < targetDist * 1.35) {
                    const force = (dist - targetDist) * 0.12 * step;
                    const nx = dx / dist;
                    const ny = dy / dist;

                    m1.vx += (nx * force / m1.mass);
                    m1.vy += (ny * force / m1.mass);
                    m2.vx -= (nx * force / m2.mass);
                    m2.vy -= (ny * force / m2.mass);

                    const rvx = m2.vx - m1.vx;
                    const rvy = m2.vy - m1.vy;
                    const damping = 0.12 * step;
                    m1.vx += rvx * damping;
                    m1.vy += rvy * damping;
                    m2.vx -= rvx * damping;
                    m2.vy -= rvy * damping;

                    ctx.beginPath();
                    ctx.moveTo(m1.x, m1.y);
                    ctx.lineTo(m2.x, m2.y);
                    ctx.stroke();
                  }
                }
              }
              ctx.restore();

              // Delocalized electron sea glowing particles
              const electronCount = cluster.length * 3;
              for (let e = 0; e < electronCount; e++) {
                const parent1 = cluster[e % cluster.length];
                const parent2 = cluster[(e + 1) % cluster.length];
                const t = ((Date.now() * 0.0025 + e * 1.1) % 1);
                const ex = parent1.x + (parent2.x - parent1.x) * t + Math.sin(t * Math.PI * 2 + e) * 5;
                const ey = parent1.y + (parent2.y - parent1.y) * t + Math.cos(t * Math.PI * 2 + e) * 5;

                ctx.save();
                ctx.beginPath();
                ctx.arc(ex, ey, 2.2, 0, Math.PI * 2);
                ctx.fillStyle = '#22d3ee';
                ctx.shadowBlur = 6;
                ctx.shadowColor = '#22d3ee';
                ctx.fill();
                ctx.restore();
              }
            }
          }
        });

        // 4. Progressive Covalent Bonds Physics & Multi-line Rendering
        for (let i = covalentBonds.length - 1; i >= 0; i--) {
          const b = covalentBonds[i];
          const dx = b.a2.x - b.a1.x;
          const dy = b.a2.y - b.a1.y;
          const dist = Math.max(Math.hypot(dx, dy), 0.1);
          const restLen = b.a1.radius + b.a2.radius + 2;

          if (dist > restLen * 2.2 || b.a1.isMetal || b.a2.isMetal) {
            covalentBonds.splice(i, 1);
            addSparks((b.a1.x + b.a2.x) / 2, (b.a1.y + b.a2.y) / 2, '#38bdf8', 6, 0.8);
            continue;
          }

          const strength = 0.18 * b.order * step;
          const force = (dist - restLen) * strength;
          b.a1.vx += (dx / dist) * force / b.a1.mass;
          b.a1.vy += (dy / dist) * force / b.a1.mass;
          b.a2.vx -= (dx / dist) * force / b.a2.mass;
          b.a2.vy -= (dy / dist) * force / b.a2.mass;

          ctx.save();
          ctx.strokeStyle = '#22d3ee';
          ctx.shadowBlur = 6;
          ctx.shadowColor = '#06b6d4';
          ctx.lineWidth = 2;
          const nx = -dy / dist;
          const ny = dx / dist;

          if (b.order === 1) {
            ctx.beginPath();
            ctx.moveTo(b.a1.x, b.a1.y);
            ctx.lineTo(b.a2.x, b.a2.y);
            ctx.stroke();
          } else if (b.order === 2) {
            const offset = 3.5;
            ctx.beginPath();
            ctx.moveTo(b.a1.x + nx * offset, b.a1.y + ny * offset);
            ctx.lineTo(b.a2.x + nx * offset, b.a2.y + ny * offset);
            ctx.moveTo(b.a1.x - nx * offset, b.a1.y - ny * offset);
            ctx.lineTo(b.a2.x - nx * offset, b.a2.y - ny * offset);
            ctx.stroke();
          } else if (b.order === 3) {
            const offset = 5;
            ctx.beginPath();
            ctx.moveTo(b.a1.x, b.a1.y);
            ctx.lineTo(b.a2.x, b.a2.y);
            ctx.moveTo(b.a1.x + nx * offset, b.a1.y + ny * offset);
            ctx.lineTo(b.a2.x + nx * offset, b.a2.y + ny * offset);
            ctx.moveTo(b.a1.x - nx * offset, b.a1.y - ny * offset);
            ctx.lineTo(b.a2.x - nx * offset, b.a2.y - ny * offset);
            ctx.stroke();
          }
          ctx.restore();
        }

        // 5. 2D VSEPR / Angular Repulsion Property (Molecular Bending)
        atoms.forEach(centralAtom => {
          if (centralAtom.isMetal) return;

          const bondedNeighbors: AtomType[] = [];
          covalentBonds.forEach(b => {
            if (b.a1.id === centralAtom.id) bondedNeighbors.push(b.a2);
            if (b.a2.id === centralAtom.id) bondedNeighbors.push(b.a1);
          });

          if (bondedNeighbors.length > 1) {
            const currentBonds = getAtomBondCount(centralAtom.id);
            const loneElectronPairs = Math.floor(Math.max(0, centralAtom.valence - centralAtom.charge - currentBonds) / 2);

            // Bond-Bond Repulsion
            for (let i = 0; i < bondedNeighbors.length; i++) {
              for (let j = i + 1; j < bondedNeighbors.length; j++) {
                const n1 = bondedNeighbors[i];
                const n2 = bondedNeighbors[j];
                const dx = n2.x - n1.x;
                const dy = n2.y - n1.y;
                const dist = Math.max(Math.hypot(dx, dy), 0.1);
                const force = (120 / (dist * dist)) * step;

                n1.vx -= (dx / dist) * force / n1.mass;
                n1.vy -= (dy / dist) * force / n1.mass;
                n2.vx += (dx / dist) * force / n2.mass;
                n2.vy += (dy / dist) * force / n2.mass;
              }
            }

            // Lone Pair Repulsion (VSEPR Bending Force)
            if (loneElectronPairs > 0 && bondedNeighbors.length >= 2) {
              let midX = 0;
              let midY = 0;
              bondedNeighbors.forEach(n => {
                midX += n.x;
                midY += n.y;
              });
              midX /= bondedNeighbors.length;
              midY /= bondedNeighbors.length;

              const pushDx = centralAtom.x - midX;
              const pushDy = centralAtom.y - midY;
              const pushDist = Math.max(Math.hypot(pushDx, pushDy), 0.1);
              const bendForce = 0.2 * loneElectronPairs * step;

              centralAtom.vx += (pushDx / pushDist) * (bendForce / centralAtom.mass);
              centralAtom.vy += (pushDy / pushDist) * (bendForce / centralAtom.mass);

              bondedNeighbors.forEach(n => {
                n.vx -= (pushDx / pushDist) * (bendForce / bondedNeighbors.length / n.mass);
                n.vy -= (pushDy / pushDist) * (bendForce / bondedNeighbors.length / n.mass);
              });
            }
          }
        });
      } // end if (!paused)

      // ==========================================
      // RENDER ATOMS & ELECTRON ORBITALS
      // ==========================================
      atoms.forEach(a => {
        const isHovered = hoveredAtomRef.current && hoveredAtomRef.current.id === a.id;
        const isInspected = inspectedAtom && inspectedAtom.id === a.id;

        // Atom Glow Aura
        ctx.save();
        if (a.isRadioactive) {
          ctx.shadowBlur = 14;
          ctx.shadowColor = '#39ff14';
        } else if (isHovered || isInspected) {
          ctx.shadowBlur = 18;
          ctx.shadowColor = '#38bdf8';
        } else {
          ctx.shadowBlur = 6;
          ctx.shadowColor = a.color;
        }

        // Base Circle
        ctx.beginPath();
        ctx.arc(a.x, a.y, a.radius, 0, Math.PI * 2);
        ctx.fillStyle = a.color;
        ctx.fill();

        // Flash feedback
        if (a.flashTimer && a.flashTimer > 0) {
          ctx.fillStyle = `rgba(255, 255, 255, ${a.flashTimer / 15})`;
          ctx.fill();
        }
        ctx.restore();

        // Charge Ring Stroke
        ctx.save();
        if (a.charge > 0) {
          ctx.strokeStyle = '#ff3300';
          ctx.lineWidth = 3;
          ctx.stroke();
        } else if (a.charge < 0) {
          ctx.strokeStyle = '#00ffff';
          ctx.lineWidth = 3;
          ctx.stroke();
        } else {
          ctx.strokeStyle = a.isRadioactive ? '#39ff14' : 'rgba(0, 0, 0, 0.6)';
          ctx.lineWidth = 2;
          ctx.stroke();
        }

        // Selection / Hover reticle ring
        if (isHovered || isInspected) {
          ctx.strokeStyle = '#38bdf8';
          ctx.lineWidth = 1.5;
          ctx.setLineDash([4, 3]);
          ctx.beginPath();
          ctx.arc(a.x, a.y, a.radius + 5, 0, Math.PI * 2);
          ctx.stroke();
          ctx.setLineDash([]);
        }
        ctx.restore();

        // Element Symbol Text
        ctx.save();
        ctx.fillStyle = (a.isRadioactive || a.z === 6) ? '#ffffff' : '#000000';
        ctx.font = 'bold 11px system-ui, sans-serif';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        const label = a.symbol + (a.charge > 0 ? `⁺${a.charge > 1 ? a.charge : ''}` : (a.charge < 0 ? `⁻${Math.abs(a.charge) > 1 ? Math.abs(a.charge) : ''}` : ''));
        ctx.fillText(label, a.x, a.y);
        ctx.restore();

        // Valence Electron Orbitals
        if (showValenceElectrons) {
          const currentValenceCount = Math.max(0, a.valence - a.charge);
          if (currentValenceCount > 0) {
            const orbitRadius = a.radius + 7;

            // Faint Orbit Path
            ctx.save();
            ctx.beginPath();
            ctx.arc(a.x, a.y, orbitRadius, 0, Math.PI * 2);
            ctx.strokeStyle = 'rgba(255, 255, 255, 0.1)';
            ctx.lineWidth = 1;
            ctx.stroke();

            // Orbiting Electron Dots
            for (let v = 0; v < currentValenceCount; v++) {
              const angle = a.orbitAngle + (v * (Math.PI * 2 / currentValenceCount));
              const ex = a.x + Math.cos(angle) * orbitRadius;
              const ey = a.y + Math.sin(angle) * orbitRadius;

              ctx.beginPath();
              ctx.arc(ex, ey, 2.2, 0, Math.PI * 2);
              ctx.fillStyle = '#ffffff';
              ctx.shadowBlur = 5;
              ctx.shadowColor = '#38bdf8';
              ctx.fill();
            }
            ctx.restore();
          }
        }
      });

      // ==========================================
      // RENDER RADIATION PARTICLES & COLLISIONS
      // ==========================================
      for (let i = particles.length - 1; i >= 0; i--) {
        const p = particles[i];
        p.trail.push({ x: p.x, y: p.y });
        if (p.trail.length > 7) p.trail.shift();

        if (!paused) {
          p.x += p.vx * step;
          p.y += p.vy * step;
          p.life -= step;
          p.age += step;
        }

        // Additive trail
        ctx.save();
        ctx.beginPath();
        for (let t = 0; t < p.trail.length; t++) {
          const pt = p.trail[t];
          if (t === 0) ctx.moveTo(pt.x, pt.y);
          else ctx.lineTo(pt.x, pt.y);
        }
        ctx.strokeStyle = p.color;
        ctx.lineWidth = p.radius * 0.9;
        ctx.globalAlpha = 0.45;
        ctx.stroke();
        ctx.restore();

        let hit = false;
        if (!paused && p.age > 4) {
          for (let j = 0; j < atoms.length; j++) {
            const a = atoms[j];
            if (a.id === p.sourceId) continue;

            if (Math.hypot(p.x - a.x, p.y - a.y) < a.radius + p.radius) {
              hit = true;
              addSparks(p.x, p.y, p.color, 8, 1);
              sound.playCollision(2);

              if (p.type === 'alpha') {
                a.vx += p.vx * 0.4;
                a.vy += p.vy * 0.4;
                if (a.charge < a.maxPosCharge) a.charge++;
                addFloatingText(a.x, a.y - 10, `α Hit (+ Charge)`, '#ff3300');
              } else if (p.type === 'beta') {
                a.vx += p.vx * 0.1;
                a.vy += p.vy * 0.1;
                if (a.charge > -a.maxNegCharge) a.charge--;
                addFloatingText(a.x, a.y - 10, `β⁻ Hit (- Charge)`, '#00ffff');
              } else if (p.type === 'gamma') {
                a.vx += p.vx * 0.15;
                a.vy += p.vy * 0.15;
                addFloatingText(a.x, a.y - 10, `γ Flash`, '#ff00ff');
              } else if (p.type === 'neutron') {
                if (a.z >= 90) {
                  triggerFission(a);
                } else {
                  if (Math.random() < 0.35) {
                    changeElement(a, a.z + 1);
                    addFloatingText(a.x, a.y - 10, `n Transmutation (${a.symbol})`, '#ffffff');
                  }
                  a.vx += p.vx * 0.25;
                  a.vy += p.vy * 0.25;
                }
              }
              break;
            }
          }
        }

        // Particle Head Glow
        ctx.save();
        ctx.shadowBlur = 8;
        ctx.shadowColor = p.color;
        ctx.beginPath();
        ctx.arc(p.x, p.y, p.radius, 0, Math.PI * 2);
        ctx.fillStyle = p.color;
        ctx.fill();
        ctx.restore();

        if (hit || p.life <= 0 || p.x < 0 || p.x > width || p.y < 0 || p.y > height) {
          particles.splice(i, 1);
        }
      }

      // ==========================================
      // RENDER SHOCKWAVES & PARTICLES VFX
      // ==========================================
      const shockwaves = shockwavesRef.current;
      for (let i = shockwaves.length - 1; i >= 0; i--) {
        const sw = shockwaves[i];
        if (!paused) {
          sw.radius += (sw.maxRadius - sw.radius) * (1 - Math.pow(0.82, step));
          sw.alpha -= sw.decay * step;
        }

        if (sw.alpha <= 0 || sw.radius >= sw.maxRadius) {
          shockwaves.splice(i, 1);
          continue;
        }

        ctx.save();
        ctx.beginPath();
        ctx.arc(sw.x, sw.y, sw.radius, 0, Math.PI * 2);
        ctx.strokeStyle = sw.color;
        ctx.globalAlpha = Math.max(0, sw.alpha);
        ctx.lineWidth = sw.lineWidth;
        ctx.shadowBlur = 8;
        ctx.shadowColor = sw.color;
        ctx.stroke();
        ctx.restore();
      }

      // VFX Sparks
      const sparks = sparksRef.current;
      for (let i = sparks.length - 1; i >= 0; i--) {
        const s = sparks[i];
        if (!paused) {
          s.x += s.vx * step;
          s.y += s.vy * step;
          s.vx *= Math.pow(0.94, step);
          s.vy *= Math.pow(0.94, step);
          s.alpha -= s.decay * step;
        }

        if (s.alpha <= 0) {
          sparks.splice(i, 1);
          continue;
        }

        ctx.save();
        ctx.beginPath();
        ctx.arc(s.x, s.y, s.size, 0, Math.PI * 2);
        ctx.fillStyle = s.color;
        ctx.globalAlpha = Math.max(0, s.alpha);
        ctx.shadowBlur = 4;
        ctx.shadowColor = s.color;
        ctx.fill();
        ctx.restore();
      }

      // Floating Reaction Text
      const floatingTexts = floatingTextsRef.current;
      for (let i = floatingTexts.length - 1; i >= 0; i--) {
        const ft = floatingTexts[i];
        if (!paused) {
          ft.y += ft.vy * step;
          ft.alpha -= 0.02 * step;
          ft.scale = Math.min(1.2, ft.scale + 0.01 * step);
        }

        if (ft.alpha <= 0) {
          floatingTexts.splice(i, 1);
          continue;
        }

        ctx.save();
        ctx.font = 'bold 12px "JetBrains Mono", monospace';
        ctx.fillStyle = ft.color;
        ctx.globalAlpha = Math.max(0, ft.alpha);
        ctx.textAlign = 'center';
        ctx.shadowBlur = 6;
        ctx.shadowColor = ft.color;
        ctx.fillText(ft.text, ft.x, ft.y);
        ctx.restore();
      }

      // ==========================================
      // CURSOR PLACEMENT RETICLE & PREVIEW
      // ==========================================
      if (mousePosRef.current && mousePosRef.current.x > 0) {
        const mx = mousePosRef.current.x;
        const my = mousePosRef.current.y;
        const activeEl = getElementData(selectedZRef.current);

        ctx.save();
        ctx.beginPath();
        ctx.arc(mx, my, activeEl.radius, 0, Math.PI * 2);
        ctx.strokeStyle = activeEl.color;
        ctx.lineWidth = 1.5;
        ctx.setLineDash([3, 3]);
        ctx.globalAlpha = 0.55;
        ctx.stroke();

        ctx.font = '9px "JetBrains Mono", monospace';
        ctx.fillStyle = activeEl.color;
        ctx.textAlign = 'center';
        ctx.fillText(`${activeEl.symbol} (${activeEl.z})`, mx, my - activeEl.radius - 6);
        ctx.restore();
      }

      ctx.restore(); // Restore camera shake

      animId = requestAnimationFrame(loop);
    };

    animId = requestAnimationFrame(loop);
    return () => {
      cancelAnimationFrame(animId);
      window.removeEventListener('resize', handleResize);
    };
  }, [
    changeElement, 
    emitParticle, 
    getAtomBondCount, 
    triggerFission, 
    addSparks, 
    addShockwave, 
    addFloatingText
  ]);

  // Pointer Handlers for Canvas
  const handlePointerDown = (e: React.PointerEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const rect = canvas.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;

    isMouseDownRef.current = true;
    mousePosRef.current = { x, y };

    const clickedAtom = findAtomAt(x, y);

    if (clickedAtom) {
      // Pick up atom for dragging/tossing
      draggedAtomRef.current = clickedAtom;
      dragOffsetRef.current = { x: x - clickedAtom.x, y: y - clickedAtom.y };
      dragVelocityRef.current = { vx: 0, vy: 0 };
      setInspectedAtom(clickedAtom);
      sound.playClick();
    } else {
      // Spawn new atom
      spawnAtomAt(x, y);
      lastSpawnTimeRef.current = Date.now();
    }
  };

  const handlePointerMove = (e: React.PointerEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const rect = canvas.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;

    const prevX = mousePosRef.current.x;
    const prevY = mousePosRef.current.y;
    mousePosRef.current = { x, y };

    // Update hovered atom
    const hovered = findAtomAt(x, y);
    hoveredAtomRef.current = hovered;

    // Handle dragging atom
    if (draggedAtomRef.current) {
      dragVelocityRef.current = {
        vx: (x - prevX) * 0.8,
        vy: (y - prevY) * 0.8
      };
      return;
    }

    // Handle continuous spawning
    if (isMouseDownRef.current && Date.now() - lastSpawnTimeRef.current > 110) {
      spawnAtomAt(x, y);
      lastSpawnTimeRef.current = Date.now();
    }
  };

  const handlePointerUp = () => {
    isMouseDownRef.current = false;
    if (draggedAtomRef.current) {
      // Release with fling momentum
      draggedAtomRef.current.vx = Math.max(-15, Math.min(15, dragVelocityRef.current.vx));
      draggedAtomRef.current.vy = Math.max(-15, Math.min(15, dragVelocityRef.current.vy));
      if (Math.hypot(draggedAtomRef.current.vx, draggedAtomRef.current.vy) > 3) {
        sound.playCollision(Math.hypot(draggedAtomRef.current.vx, draggedAtomRef.current.vy));
        addSparks(draggedAtomRef.current.x, draggedAtomRef.current.y, draggedAtomRef.current.color, 8, 1);
      }
      draggedAtomRef.current = null;
    }
  };

  return (
    <div className="flex h-screen w-screen overflow-hidden bg-[#08090e] text-slate-100 select-none relative">
      {/* Animated Splash Screen */}
      {showSplash && (
        <SplashScreen onDismiss={() => setShowSplash(false)} />
      )}

      {/* Mobile Portrait Orientation Prompt Overlay */}
      <PortraitOverlay
        isDismissed={isPortraitDismissed}
        onDismiss={() => setIsPortraitDismissed(true)}
      />

      {/* ======================================================== */}
      {/* SIDEBAR: Controls & 118 Periodic Table Element Selector   */}
      {/* ======================================================== */}
      <aside 
        className={`sidebar-container transition-all duration-300 ease-in-out shrink-0 bg-[#0f1118] border-r border-[#1e2230] flex flex-col justify-between p-3.5 z-30 shadow-2xl relative ${
          isSidebarCollapsed 
            ? 'w-0 !p-0 border-r-0 overflow-hidden opacity-0 -translate-x-full md:w-0' 
            : 'w-[320px] opacity-100 translate-x-0'
        }`}
      >
        {/* Toggle Collapse Button on Edge */}
        <button
          onClick={() => { sound.playClick(); setIsSidebarCollapsed(true); }}
          className="absolute -right-7 top-14 z-30 w-7 h-11 bg-[#171a26] border border-[#2b3147] border-l-0 rounded-r-xl flex items-center justify-center text-slate-400 hover:text-white cursor-pointer shadow-lg transition-colors md:hidden"
          title="Collapse Panel"
          aria-label="Collapse Panel"
        >
          <ChevronLeft className="w-4 h-4" />
        </button>

        {/* Header Branding & Quick Actions */}
        <div className="space-y-2.5">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="w-7 h-7 rounded-lg bg-emerald-500/10 border border-emerald-500/30 flex items-center justify-center shrink-0">
                <AtomIcon className="w-4 h-4 text-emerald-400 animate-spin" style={{ animationDuration: '16s' }} />
              </div>
              <div>
                <h1 className="text-xs font-bold text-white tracking-wide leading-tight">
                  Atom Simulator
                </h1>
                <p className="text-[10px] text-slate-400 sidebar-hide-landscape leading-none">
                  Physics, VSEPR & Nuclear Lab
                </p>
              </div>
            </div>

            {/* Quick Tasks, Tutorial & Presets Buttons */}
            <div className="flex items-center gap-1">
              <button
                onClick={() => { sound.playClick(); setIsTasksOpen(true); }}
                className="p-1.5 text-amber-400 hover:text-amber-300 bg-amber-500/10 hover:bg-amber-500/20 rounded-lg transition-colors border border-amber-500/20 relative"
                title="Optional Research Missions"
              >
                <Trophy className="w-3.5 h-3.5" />
                {completedTasks.size > 0 && (
                  <span className="absolute -top-1 -right-1 w-2 h-2 bg-emerald-400 rounded-full animate-pulse" />
                )}
              </button>
              <button
                onClick={() => { sound.playClick(); setIsTutorialOpen(true); }}
                className="p-1.5 text-emerald-400 hover:text-emerald-300 bg-emerald-500/10 hover:bg-emerald-500/20 rounded-lg transition-colors border border-emerald-500/20"
                title="Open Academy Tutorial"
              >
                <BookOpen className="w-3.5 h-3.5" />
              </button>
              <button
                onClick={() => { sound.playClick(); setIsPresetsOpen(true); }}
                className="p-1.5 text-cyan-400 hover:text-cyan-300 bg-cyan-500/10 hover:bg-cyan-500/20 rounded-lg transition-colors border border-cyan-500/20"
                title="Open Reaction Presets"
              >
                <Sparkles className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>

          {/* Legend Strip */}
          <div className="sidebar-legend bg-[#151824] border border-[#23283a] rounded-xl p-2 text-[10px] grid grid-cols-2 gap-1.5 text-slate-300">
            <div className="flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full bg-[#e67e22] shadow-[0_0_6px_#e67e22]" />
              <span className="truncate">Metal Lattice</span>
            </div>
            <div className="flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full bg-[#00ffff] shadow-[0_0_6px_#00ffff]" />
              <span className="truncate">Covalent VSEPR</span>
            </div>
            <div className="flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full bg-[#ff00ff] shadow-[0_0_6px_#ff00ff]" />
              <span className="truncate">Ionic Charges</span>
            </div>
            <div className="flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full bg-[#a855f7] shadow-[0_0_6px_#a855f7]" />
              <span className="truncate">Nuclear ☢</span>
            </div>
          </div>

          {/* Thermodynamics & Decay Control Sliders */}
          <div className="sidebar-control-group bg-[#151824] border border-[#23283a] rounded-xl p-2.5 space-y-2">
            <div>
              <div className="flex justify-between items-center text-xs mb-0.5">
                <span className="text-slate-300 font-medium flex items-center gap-1.5">
                  <Flame className="w-3.5 h-3.5 text-amber-400" />
                  System Heat
                </span>
                <span className="font-mono text-cyan-400 font-bold tabular-nums">{heat} K</span>
              </div>
              <input
                type="range"
                min="0"
                max="500"
                value={heat}
                onChange={(e) => setHeat(parseInt(e.target.value))}
                className="w-full accent-emerald-400 cursor-pointer h-1.5 bg-[#252a3d] rounded-lg"
              />
            </div>

            <div>
              <div className="flex justify-between items-center text-xs mb-0.5">
                <span className="text-slate-300 font-medium flex items-center gap-1.5">
                  <Activity className="w-3.5 h-3.5 text-purple-400" />
                  Decay Rate
                </span>
                <span className="font-mono text-purple-400 font-bold tabular-nums">{decayRate}%</span>
              </div>
              <input
                type="range"
                min="0"
                max="100"
                value={decayRate}
                onChange={(e) => setDecayRate(parseInt(e.target.value))}
                className="w-full accent-purple-400 cursor-pointer h-1.5 bg-[#252a3d] rounded-lg"
              />
            </div>

            <div className="flex items-center justify-between pt-1 border-t border-[#23283a]">
              <label className="text-xs text-slate-300 flex items-center gap-1.5 cursor-pointer">
                <input
                  type="checkbox"
                  checked={showValence}
                  onChange={(e) => setShowValence(e.target.checked)}
                  className="w-3.5 h-3.5 rounded accent-emerald-400 cursor-pointer"
                />
                Valence Orbitals
              </label>

              <button
                onClick={handleToggleSound}
                className={`p-1.5 rounded-lg border text-xs flex items-center gap-1 transition-colors ${
                  isMuted 
                    ? 'bg-red-500/10 border-red-500/30 text-red-400' 
                    : 'bg-emerald-500/10 border-emerald-500/30 text-emerald-400'
                }`}
                title={isMuted ? 'Unmute Audio' : 'Mute Audio'}
              >
                {isMuted ? <VolumeX className="w-3.5 h-3.5" /> : <Volume2 className="w-3.5 h-3.5" />}
              </button>
            </div>
          </div>

          {/* Action Buttons: Pulse Rad, Neutralize, Clear */}
          <div className="grid grid-cols-3 gap-1.5">
            <button
              onClick={handlePulseRad}
              className="sidebar-action-btn py-1.5 px-1 bg-emerald-500/20 hover:bg-emerald-500/30 border border-emerald-500/40 text-emerald-300 font-semibold text-xs rounded-xl flex items-center justify-center gap-1 transition-all active:scale-95"
              title="Force All Radioactive Atoms to Decay"
            >
              <Zap className="w-3.5 h-3.5 text-emerald-400" />
              Pulse Rad
            </button>

            <button
              onClick={handleNeutralize}
              className="sidebar-action-btn py-1.5 px-1 bg-cyan-500/20 hover:bg-cyan-500/30 border border-cyan-500/40 text-cyan-300 font-semibold text-xs rounded-xl flex items-center justify-center gap-1 transition-all active:scale-95"
              title="Neutralize All Ionic Charges to 0"
            >
              <Shield className="w-3.5 h-3.5 text-cyan-400" />
              Neutralize
            </button>

            <button
              onClick={handleClear}
              className="sidebar-action-btn py-1.5 px-1 bg-red-500/15 hover:bg-red-500/25 border border-red-500/30 text-red-300 font-semibold text-xs rounded-xl flex items-center justify-center gap-1 transition-all active:scale-95"
              title="Clear Canvas"
            >
              <RotateCcw className="w-3.5 h-3.5" />
              Clear
            </button>
          </div>
        </div>

        {/* 118 Elements Section with Search and Category Filter */}
        <div className="flex-1 flex flex-col min-h-0 mt-2.5 pt-2 border-t border-[#1e2230]">
          <div className="space-y-1.5 mb-1.5">
            <div className="relative">
              <Search className="w-3 h-3 absolute left-2.5 top-1/2 -translate-y-1/2 text-slate-500" />
              <input
                type="text"
                placeholder="Search element (e.g. Fe, Au, 92)..."
                value={elementSearch}
                onChange={(e) => setElementSearch(e.target.value)}
                className="element-search-bar w-full bg-[#151824] border border-[#23283a] rounded-lg pl-7 pr-2 py-1 text-xs text-slate-200 placeholder-slate-500 focus:outline-none focus:border-emerald-400"
              />
            </div>

            {/* Category Filter Chips */}
            <div className="flex items-center gap-1 overflow-x-auto pb-1 text-[10px]">
              {(['all', 'metal', 'nonmetal', 'metalloid', 'radioactive'] as const).map((filter) => (
                <button
                  key={filter}
                  onClick={() => { sound.playClick(); setElementFilter(filter); }}
                  className={`element-filter-chip px-2 py-0.5 rounded-md whitespace-nowrap transition-colors capitalize shrink-0 ${
                    elementFilter === filter
                      ? 'bg-emerald-400 text-black font-bold'
                      : 'bg-[#1a1d2b] text-slate-400 hover:text-white'
                  }`}
                >
                  {filter}
                </button>
              ))}
            </div>
          </div>

          {/* Periodic Elements Grid (1-118) - Fully Scaled for Mobile Landscape */}
          <div 
            className="element-grid-container flex-1 overflow-y-auto pr-1 grid grid-cols-4 gap-1.5 bg-[#12141e] p-2 rounded-xl border border-[#1e2230]"
            style={{ touchAction: 'pan-y' }}
          >
            {filteredElements.map((el) => {
              const isSelected = el.z === selectedZ;
              return (
                <button
                  key={el.z}
                  onClick={() => {
                    sound.playSpawn(el.mass, el.z);
                    setSelectedZ(el.z);
                  }}
                  className={`element-btn p-1.5 rounded-lg text-center flex flex-col items-center justify-center transition-all relative group cursor-pointer ${
                    isSelected
                      ? 'bg-emerald-400 text-black shadow-[0_0_12px_#34d399]'
                      : 'bg-[#191c29] text-white hover:bg-[#23273a] border border-[#282d42]'
                  }`}
                  style={{
                    borderBottomColor: el.isMetal 
                      ? '#e67e22' 
                      : el.isMetalloid 
                      ? '#16a085' 
                      : '#3498db',
                    borderBottomWidth: '2px'
                  }}
                  title={`${el.name} (Z=${el.z}, Mass=${el.mass}u)`}
                >
                  <span className={`el-z text-[9px] font-mono leading-none ${isSelected ? 'text-black/80' : 'text-slate-400'}`}>
                    {el.z}
                  </span>
                  <span className="el-symbol text-xs font-bold font-mono tracking-tight">
                    {el.symbol}
                  </span>

                  {el.isRadioactive && (
                    <span className="el-rad absolute top-0.5 right-1 text-[8px] text-purple-400 font-mono">
                      ☢
                    </span>
                  )}
                </button>
              );
            })}
          </div>
        </div>

        {/* Selected Element Quick Strip */}
        <div className="mt-2 pt-1.5 border-t border-[#1e2230] flex items-center justify-between text-xs">
          <div className="flex items-center gap-1.5">
            <div 
              className="w-6 h-6 rounded-md flex items-center justify-center font-bold text-xs shadow-inner shrink-0"
              style={{
                backgroundColor: getElementData(selectedZ).color,
                color: getElementData(selectedZ).isRadioactive || selectedZ === 6 ? '#ffffff' : '#000000'
              }}
            >
              {getElementData(selectedZ).symbol}
            </div>
            <div className="min-w-0">
              <div className="font-semibold text-white leading-none truncate text-[11px]">
                {getElementData(selectedZ).name}
              </div>
              <div className="text-[9.5px] text-slate-400 mt-0.5 truncate">
                Z={selectedZ} · {getElementData(selectedZ).valence}e⁻
              </div>
            </div>
          </div>

          <div className="text-[10px] font-mono text-emerald-400 font-bold shrink-0">
            Selected
          </div>
        </div>
      </aside>

      {/* Floating Expand Sidebar Button when Collapsed */}
      {isSidebarCollapsed && (
        <button
          onClick={() => { sound.playClick(); setIsSidebarCollapsed(false); }}
          className="absolute left-3 top-4 z-30 py-1.5 px-3 bg-[#131622] border border-[#2b3147] rounded-xl flex items-center gap-1.5 text-xs text-emerald-400 font-semibold hover:bg-[#1a1e2f] shadow-2xl transition-all"
          title="Open Elements & Controls"
        >
          <Menu className="w-4 h-4" />
          <span>Elements</span>
        </button>
      )}

      {/* ======================================================== */}
      {/* MAIN VIEWPORT: Interactive Canvas & HUD                   */}
      {/* ======================================================== */}
      <main ref={containerRef} className="flex-1 relative h-full w-full overflow-hidden">
        <canvas
          ref={canvasRef}
          onPointerDown={handlePointerDown}
          onPointerMove={handlePointerMove}
          onPointerUp={handlePointerUp}
          onPointerCancel={handlePointerUp}
          style={{ touchAction: 'none' }}
          className="w-full h-full cursor-crosshair block"
        />

        {/* Top HUD Floating Bar - Responsive across desktop and mobile landscape */}
        <div className="hud-container absolute top-3 left-3 z-20 flex items-center gap-1.5 bg-[#10121bd0] backdrop-blur-md border border-[#23273a] py-1 px-2.5 rounded-2xl shadow-xl text-xs text-slate-200">
          {/* Pause / Play */}
          <button
            onClick={() => { sound.playClick(); setIsPaused(!isPaused); }}
            className={`p-1.5 rounded-lg flex items-center gap-1 font-medium transition-colors ${
              isPaused 
                ? 'bg-amber-500/20 text-amber-300 border border-amber-500/40' 
                : 'hover:bg-[#1f2336] text-slate-300'
            }`}
            title="Space to Pause/Resume"
          >
            {isPaused ? <Play className="w-3.5 h-3.5 fill-current" /> : <Pause className="w-3.5 h-3.5" />}
            <span className="hud-hide-mobile text-[11px]">{isPaused ? 'Paused' : 'Playing'}</span>
          </button>

          <span className="text-slate-600 hud-hide-mobile">|</span>

          {/* Speed Presets */}
          <div className="flex items-center gap-0.5 font-mono text-[10px]">
            {[0.5, 1.0, 2.0].map((s) => (
              <button
                key={s}
                onClick={() => { sound.playClick(); setSimSpeed(s); }}
                className={`px-1.5 py-0.5 rounded-md transition-colors ${
                  simSpeed === s 
                    ? 'bg-emerald-400 text-black font-bold' 
                    : 'text-slate-400 hover:text-white hover:bg-[#1a1e2f]'
                }`}
              >
                {s}x
              </button>
            ))}
          </div>

          <span className="text-slate-600">|</span>

          {/* Counts */}
          <div className="flex items-center gap-2 font-mono text-[10.5px] text-slate-400">
            <span>Atoms: <strong className="text-white tabular-nums">{atomCount}</strong></span>
            <span className="hud-hide-mobile">Bonds: <strong className="text-cyan-400 tabular-nums">{bondCount}</strong></span>
          </div>

          <span className="text-slate-600">|</span>

          {/* Missions / Tasks Quick Button */}
          <button
            onClick={() => { sound.playClick(); setIsTasksOpen(true); }}
            className="flex items-center gap-1.5 py-1 px-2.5 rounded-lg bg-amber-500/10 hover:bg-amber-500/20 border border-amber-500/30 text-amber-300 font-semibold text-xs transition-colors shrink-0"
            title="Optional Research Missions"
          >
            <Trophy className="w-3.5 h-3.5" />
            <span className="hud-hide-mobile">Missions</span>
            <span className="px-1.5 py-0.2 bg-amber-500/20 text-amber-300 rounded-full font-mono text-[10px]">
              {completedTasks.size}/{SIMULATION_TASKS.length}
            </span>
          </button>

          <span className="text-slate-600">|</span>

          {/* Presets Quick Button */}
          <button
            onClick={() => { sound.playClick(); setIsPresetsOpen(true); }}
            className="flex items-center gap-1 py-1 px-2 rounded-lg bg-emerald-500/10 hover:bg-emerald-500/20 border border-emerald-500/30 text-emerald-300 font-semibold text-xs transition-colors shrink-0"
            title="Reaction Labs & Presets"
          >
            <Sparkles className="w-3.5 h-3.5" />
            <span className="hud-hide-mobile">Presets</span>
          </button>

          {/* Academy Tutorial Button */}
          <button
            onClick={() => { sound.playClick(); setIsTutorialOpen(true); }}
            className="flex items-center gap-1 py-1 px-2 rounded-lg bg-cyan-500/10 hover:bg-cyan-500/20 border border-cyan-500/30 text-cyan-300 font-semibold text-xs transition-colors shrink-0"
            title="Interactive Tutorial"
          >
            <HelpCircle className="w-3.5 h-3.5" />
            <span className="hud-hide-mobile">Tutorial</span>
          </button>
        </div>

        {/* Bottom Floating Hint */}
        <div className="bottom-hint absolute bottom-3 left-1/2 -translate-x-1/2 z-10 pointer-events-none">
          <div className="bg-[#10121bd0] backdrop-blur-md border border-[#23273a] py-1 px-3 rounded-full text-[10px] text-slate-400 flex items-center gap-2 shadow-lg whitespace-nowrap">
            <span>💡 <strong>Tap / Drag</strong> to spawn atoms</span>
            <span className="hud-hide-mobile">·</span>
            <span className="hud-hide-mobile"><strong>Tap atom</strong> to inspect & fling</span>
          </div>
        </div>

        {/* Atom Inspector Modal / Tooltip */}
        <AtomInspector
          atom={inspectedAtom}
          onClose={() => setInspectedAtom(null)}
          onDelete={(id) => {
            atomsRef.current = atomsRef.current.filter(a => a.id !== id);
            bondsRef.current = bondsRef.current.filter(b => b.a1.id !== id && b.a2.id !== id);
            setInspectedAtom(null);
            sound.playClick();
          }}
          onDecay={(atom) => {
            if (atom.isRadioactive) {
              emitParticle(atom, 'alpha');
              changeElement(atom, atom.z - 2);
              sound.playPulse();
            }
          }}
          onNeutralize={(atom) => {
            atom.charge = 0;
            setInspectedAtom({ ...atom });
            sound.playClick();
          }}
        />

        {/* Interactive Tutorial Modal */}
        <TutorialModal
          isOpen={isTutorialOpen}
          onClose={() => setIsTutorialOpen(false)}
          onSelectElement={(z) => setSelectedZ(z)}
          onLoadPreset={(presetId) => handleLoadPreset(presetId)}
        />

        {/* Reaction Presets Modal */}
        <PresetsModal
          isOpen={isPresetsOpen}
          onClose={() => setIsPresetsOpen(false)}
          onSelectPreset={(presetId) => handleLoadPreset(presetId)}
        />

        {/* Research Missions & Objectives Modal */}
        <TasksModal
          isOpen={isTasksOpen}
          onClose={() => setIsTasksOpen(false)}
          completedTasks={completedTasks}
          onSelectElement={(z) => setSelectedZ(z)}
          onLoadPreset={(presetId) => handleLoadPreset(presetId)}
          onResetTasks={() => setCompletedTasks(new Set())}
        />

        {/* Celebratory Mission Complete Toast */}
        {latestUnlockedTask && (
          <div 
            onClick={() => { sound.playClick(); setIsTasksOpen(true); }}
            className="fixed top-14 right-4 z-40 bg-gradient-to-r from-amber-500/25 via-[#181a26]/95 to-[#12141f]/95 border border-amber-500/50 p-3 rounded-2xl shadow-2xl flex items-center gap-3 text-xs cursor-pointer animate-in fade-in slide-in-from-top-4 duration-300 backdrop-blur-md hover:scale-[1.02] transition-transform"
          >
            <div className="w-8 h-8 rounded-xl bg-amber-500/20 border border-amber-500/40 flex items-center justify-center text-amber-400 shrink-0">
              <Trophy className="w-4 h-4 animate-bounce" />
            </div>
            <div>
              <div className="font-bold text-amber-300 flex items-center gap-1.5 text-[11px]">
                <span>MISSION ACCOMPLISHED</span>
                <span className="text-[9px] px-1.5 py-0.2 rounded bg-amber-500/20 text-amber-200 font-mono">NEW</span>
              </div>
              <div className="text-white font-semibold text-xs mt-0.5">
                {latestUnlockedTask}
              </div>
              <div className="text-[10px] text-slate-400">Click to view Research Objectives</div>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}
