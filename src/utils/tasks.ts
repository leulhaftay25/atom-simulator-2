import { Atom, CovalentBond, RadiationParticle, SimulationTask } from '../types/simulation';

export const SIMULATION_TASKS: SimulationTask[] = [
  {
    id: 'first_spark',
    title: 'First Sparks of Matter',
    category: 'foundations',
    description: 'Spawn at least 3 atoms of any element into the cosmic vacuum.',
    hint: 'Click or drag anywhere on the canvas to deposit elements.',
    badge: 'Novice',
    recommendedZ: 1
  },
  {
    id: 'covalent_bond',
    title: 'Sharing Electrons',
    category: 'covalent',
    description: 'Bring two nonmetals close together to form your first single covalent bond.',
    hint: 'Select Hydrogen (H) or Carbon (C) and place them side by side.',
    badge: 'Chemist',
    recommendedZ: 1
  },
  {
    id: 'water_synthesis',
    title: 'The Elixir of Life (H₂O)',
    category: 'covalent',
    description: 'Synthesize a water molecule: 1 Oxygen atom bonded covalently to 2 Hydrogen atoms.',
    hint: 'Spawn Oxygen (O, Z=8) and place two Hydrogens (H, Z=1) near it, or use the Water preset.',
    badge: 'Molecular Architect',
    recommendedZ: 8,
    presetShortcut: 'water'
  },
  {
    id: 'double_bond',
    title: 'Resonance & Double Bonds',
    category: 'covalent',
    description: 'Strengthen a covalent bond to Order 2 (=) by keeping nonmetals in close proximity for 90 frames.',
    hint: 'Place two Oxygen (O) or Carbon (C) atoms close together and wait for the second bond line to form.',
    badge: 'Bond Master',
    recommendedZ: 8,
    presetShortcut: 'co2'
  },
  {
    id: 'ionic_salt',
    title: 'Electrostatic Ionization',
    category: 'ionic',
    description: 'Collide an alkali metal with a halogen to transfer an electron and produce oppositely charged ions.',
    hint: 'Collide Sodium (Na, Z=11) with Chlorine (Cl, Z=17) or load the Table Salt preset.',
    badge: 'Coulomb Pioneer',
    recommendedZ: 11,
    presetShortcut: 'salt'
  },
  {
    id: 'metal_lattice',
    title: 'The Electron Sea',
    category: 'metallic',
    description: 'Form a metallic lattice containing 4 or more connected metal atoms sharing a delocalized electron cloud.',
    hint: 'Spawn multiple Iron (Fe, Z=26) or Copper (Cu, Z=29) atoms clustered together.',
    badge: 'Solid State',
    recommendedZ: 26,
    presetShortcut: 'iron'
  },
  {
    id: 'noble_sanctuary',
    title: 'Inert Noble Chamber',
    category: 'foundations',
    description: 'Have at least 3 Noble Gas atoms (He, Ne, Ar, Kr, Xe) bouncing elastically without bonding.',
    hint: 'Select Helium (Z=2), Neon (Z=10), or Argon (Z=18) and place 3 of them.',
    badge: 'Noble',
    recommendedZ: 10
  },
  {
    id: 'absolute_zero',
    title: 'Absolute Zero (0 K)',
    category: 'extreme',
    description: 'Lower System Heat to exactly 0 Kelvin to freeze all Brownian thermal jitter.',
    hint: 'Drag the System Heat slider down to 0 K in the control panel.',
    badge: 'Cryogenics'
  },
  {
    id: 'thermal_flare',
    title: 'Thermodynamic Flare',
    category: 'extreme',
    description: 'Crank System Heat to 350+ Kelvin to watch high-velocity kinetic molecular collisions.',
    hint: 'Push the System Heat slider past 350 K.',
    badge: 'Plasma Physicist'
  },
  {
    id: 'radiation_pulse',
    title: 'Radiation Pulse',
    category: 'nuclear',
    description: 'Spawn a radioactive isotope (Z > 82 or 43, 61) and press "⚡ Pulse Rad" to trigger radiation emissions.',
    hint: 'Select Polonium (Po), Radium (Ra), or Uranium (U) and hit Pulse Rad.',
    badge: 'Radioactive',
    recommendedZ: 92
  },
  {
    id: 'nuclear_fission',
    title: 'The Atomic Split',
    category: 'nuclear',
    description: 'Induce nuclear fission by bombarding an actinide nucleus (Z ≥ 90) with high-energy neutrons.',
    hint: 'Load the Uranium Chain Reaction preset or hit Uranium with neutrons.',
    badge: 'Manhattan Project',
    recommendedZ: 92,
    presetShortcut: 'nuclear'
  },
  {
    id: 'superheavy_explorer',
    title: 'Transuranic Explorer',
    category: 'extreme',
    description: 'Spawn or transmute any superheavy element with atomic number Z ≥ 100 (e.g. Fermium, Mendelevium, Oganesson).',
    hint: 'Search for "100", "118", "Fm", or "Og" in the element search bar.',
    badge: 'Cosmic Alchemist',
    recommendedZ: 118
  }
];

export interface TaskEvaluationContext {
  atoms: Atom[];
  bonds: CovalentBond[];
  particles: RadiationParticle[];
  heat: number;
  fissionOccurred: boolean;
  pulseTriggered: boolean;
}

export function evaluateTaskCompletion(taskId: string, ctx: TaskEvaluationContext): boolean {
  const { atoms, bonds, heat, fissionOccurred, pulseTriggered } = ctx;

  switch (taskId) {
    case 'first_spark':
      return atoms.length >= 3;

    case 'covalent_bond':
      return bonds.some(b => b.order >= 1);

    case 'water_synthesis': {
      // Find an Oxygen (Z=8) that is bonded to at least 2 Hydrogens (Z=1)
      const oxygen = atoms.find(a => a.z === 8);
      if (!oxygen) return false;
      let bondedHydrogens = 0;
      bonds.forEach(b => {
        if (b.a1.id === oxygen.id && b.a2.z === 1) bondedHydrogens++;
        if (b.a2.id === oxygen.id && b.a1.z === 1) bondedHydrogens++;
      });
      return bondedHydrogens >= 2;
    }

    case 'double_bond':
      return bonds.some(b => b.order >= 2);

    case 'ionic_salt': {
      // Must have at least 1 positively charged metal and 1 negatively charged nonmetal
      const hasPosMetal = atoms.some(a => a.isMetal && a.charge > 0);
      const hasNegNonmetal = atoms.some(a => !a.isMetal && a.charge < 0);
      return hasPosMetal && hasNegNonmetal;
    }

    case 'metal_lattice': {
      // Find a cluster of 4 or more connected metal atoms
      const metals = atoms.filter(a => a.isMetal);
      if (metals.length < 4) return false;
      const visited = new Set<number>();
      for (const m of metals) {
        if (!visited.has(m.id)) {
          let count = 0;
          const queue = [m];
          visited.add(m.id);
          while (queue.length > 0) {
            const curr = queue.shift()!;
            count++;
            metals.forEach(other => {
              if (!visited.has(other.id)) {
                const dist = Math.hypot(curr.x - other.x, curr.y - other.y);
                if (dist < (curr.radius + other.radius) * 1.55) {
                  visited.add(other.id);
                  queue.push(other);
                }
              }
            });
          }
          if (count >= 4) return true;
        }
      }
      return false;
    }

    case 'noble_sanctuary': {
      const nobleGases = atoms.filter(a => [2, 10, 18, 36, 54, 86, 118].includes(a.z));
      return nobleGases.length >= 3;
    }

    case 'absolute_zero':
      return heat === 0;

    case 'thermal_flare':
      return heat >= 350;

    case 'radiation_pulse':
      return pulseTriggered;

    case 'nuclear_fission':
      return fissionOccurred;

    case 'superheavy_explorer':
      return atoms.some(a => a.z >= 100);

    default:
      return false;
  }
}
