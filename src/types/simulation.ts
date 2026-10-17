export interface ElementData {
  z: number;
  symbol: string;
  name: string;
  mass: number;
  radius: number;
  valence: number;
  isMetal: boolean;
  isMetalloid: boolean;
  maxPosCharge: number;
  maxNegCharge: number;
  maxBonds: number;
  isRadioactive: boolean;
  color: string;
  category: 'metal' | 'metalloid' | 'nonmetal' | 'noble';
}

export interface Atom extends ElementData {
  id: number;
  x: number;
  y: number;
  vx: number;
  vy: number;
  charge: number;
  orbitAngle: number;
  flashTimer?: number;
  creationTime?: number;
}

export interface CovalentBond {
  a1: Atom;
  a2: Atom;
  order: number;
  timer: number;
  formationFlash?: number;
}

export interface RadiationParticle {
  type: 'alpha' | 'beta' | 'gamma' | 'neutron';
  x: number;
  y: number;
  vx: number;
  vy: number;
  radius: number;
  color: string;
  life: number;
  age: number;
  sourceId: number;
  trail: { x: number; y: number }[];
}

export interface VFXSpark {
  x: number;
  y: number;
  vx: number;
  vy: number;
  color: string;
  size: number;
  alpha: number;
  decay: number;
}

export interface VFXShockwave {
  x: number;
  y: number;
  radius: number;
  maxRadius: number;
  color: string;
  lineWidth: number;
  alpha: number;
  decay: number;
}

export interface FloatingReactionText {
  id: number;
  x: number;
  y: number;
  text: string;
  color: string;
  alpha: number;
  vy: number;
  scale: number;
}

export interface PresetRecipe {
  id: string;
  name: string;
  tagline: string;
  category: 'covalent' | 'ionic' | 'metallic' | 'nuclear';
  icon: string;
  description: string;
  spawnAction: (width: number, height: number) => { atoms: Atom[]; bonds?: { a1Index: number; a2Index: number; order: number }[] };
}

export interface SimulationTask {
  id: string;
  title: string;
  category: 'foundations' | 'covalent' | 'ionic' | 'metallic' | 'nuclear' | 'extreme';
  description: string;
  hint: string;
  badge: string;
  recommendedZ?: number;
  presetShortcut?: string;
}
