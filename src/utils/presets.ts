import { Atom, CovalentBond, RadiationParticle } from '../types/simulation';
import { getElementData } from './elementData';

export interface PresetResult {
  atoms: Atom[];
  bonds: CovalentBond[];
  particles: RadiationParticle[];
  name: string;
}

export const PRESETS = [
  {
    id: 'water',
    title: 'Water Molecule (H₂O)',
    formula: 'H₂O',
    category: 'Covalent & VSEPR',
    color: '#00ffff',
    description: 'Forms 2 covalent single bonds. Unbonded lone pairs on Oxygen push Hydrogens into a realistic bent angle.',
    create: (width: number, height: number): PresetResult => {
      const cx = width / 2;
      const cy = height / 2;

      const oxygen: Atom = {
        id: Math.random(),
        ...getElementData(8), // O
        x: cx,
        y: cy,
        vx: 0,
        vy: 0,
        charge: 0,
        orbitAngle: 0
      };

      const h1: Atom = {
        id: Math.random(),
        ...getElementData(1), // H
        x: cx - 28,
        y: cy + 18,
        vx: 0,
        vy: 0,
        charge: 0,
        orbitAngle: 1
      };

      const h2: Atom = {
        id: Math.random(),
        ...getElementData(1), // H
        x: cx + 28,
        y: cy + 18,
        vx: 0,
        vy: 0,
        charge: 0,
        orbitAngle: 2
      };

      return {
        atoms: [oxygen, h1, h2],
        bonds: [],
        particles: [],
        name: 'Water Molecule (H₂O)'
      };
    }
  },
  {
    id: 'co2',
    title: 'Carbon Dioxide (CO₂)',
    formula: 'O=C=O',
    category: 'Double Bonds',
    color: '#7f8c8d',
    description: 'Carbon shares 4 valence electrons with 2 Oxygen atoms, forming double bonds and linear geometry.',
    create: (width: number, height: number): PresetResult => {
      const cx = width / 2;
      const cy = height / 2;

      const carbon: Atom = {
        id: Math.random(),
        ...getElementData(6), // C
        x: cx,
        y: cy,
        vx: 0,
        vy: 0,
        charge: 0,
        orbitAngle: 0
      };

      const o1: Atom = {
        id: Math.random(),
        ...getElementData(8), // O
        x: cx - 35,
        y: cy,
        vx: 0,
        vy: 0,
        charge: 0,
        orbitAngle: 1.5
      };

      const o2: Atom = {
        id: Math.random(),
        ...getElementData(8), // O
        x: cx + 35,
        y: cy,
        vx: 0,
        vy: 0,
        charge: 0,
        orbitAngle: 3.1
      };

      return {
        atoms: [carbon, o1, o2],
        bonds: [],
        particles: [],
        name: 'Carbon Dioxide (CO₂)'
      };
    }
  },
  {
    id: 'salt',
    title: 'Table Salt (NaCl)',
    formula: 'Na⁺ Cl⁻',
    category: 'Ionic Bonding',
    color: '#ff00ff',
    description: 'Sodium loses an electron (Na⁺), Chlorine gains an electron (Cl⁻). Opposites attract via Coulomb electrostatics.',
    create: (width: number, height: number): PresetResult => {
      const cx = width / 2;
      const cy = height / 2;
      const atoms: Atom[] = [];

      const gridCoords = [
        { z: 11, ox: -40, oy: -40 },
        { z: 17, ox: 40, oy: -40 },
        { z: 17, ox: -40, oy: 40 },
        { z: 11, ox: 40, oy: 40 }
      ];

      gridCoords.forEach(item => {
        atoms.push({
          id: Math.random(),
          ...getElementData(item.z),
          x: cx + item.ox,
          y: cy + item.oy,
          vx: (Math.random() - 0.5) * 0.5,
          vy: (Math.random() - 0.5) * 0.5,
          charge: 0,
          orbitAngle: Math.random() * Math.PI * 2
        });
      });

      return {
        atoms,
        bonds: [],
        particles: [],
        name: 'Table Salt (NaCl)'
      };
    }
  },
  {
    id: 'iron',
    title: 'Iron Lattice (Fe₉)',
    formula: 'Fe Metal',
    category: 'Metallic Bonding',
    color: '#e67e22',
    description: 'Metals form a cohesive crystal grid held together by an interconnected flowing sea of delocalized electrons.',
    create: (width: number, height: number): PresetResult => {
      const cx = width / 2;
      const cy = height / 2;
      const atoms: Atom[] = [];
      const spacing = 42;

      for (let r = -1; r <= 1; r++) {
        for (let c = -1; c <= 1; c++) {
          atoms.push({
            id: Math.random(),
            ...getElementData(26), // Fe
            x: cx + c * spacing,
            y: cy + r * spacing,
            vx: 0,
            vy: 0,
            charge: 0,
            orbitAngle: Math.random() * Math.PI * 2
          });
        }
      }

      return {
        atoms,
        bonds: [],
        particles: [],
        name: 'Iron Metal Lattice (Fe₉)'
      };
    }
  },
  {
    id: 'nuclear',
    title: 'Uranium Chain Reaction (²³⁵U)',
    formula: '²³⁵U + n → Fission',
    category: 'Nuclear Physics',
    color: '#a855f7',
    description: 'Enriched Uranium core bombarded by a high-energy thermal neutron, triggering fission and explosive chain reaction!',
    create: (width: number, height: number): PresetResult => {
      const cx = width / 2;
      const cy = height / 2;
      const atoms: Atom[] = [];
      const particles: RadiationParticle[] = [];

      // 4 Uranium atoms close to each other
      const offsets = [
        { dx: -25, dy: -25 },
        { dx: 25, dy: -25 },
        { dx: -25, dy: 25 },
        { dx: 25, dy: 25 }
      ];

      offsets.forEach(offset => {
        atoms.push({
          id: Math.random(),
          ...getElementData(92), // Uranium
          x: cx + offset.dx,
          y: cy + offset.dy,
          vx: 0,
          vy: 0,
          charge: 0,
          orbitAngle: Math.random() * Math.PI * 2
        });
      });

      // An incoming trigger neutron heading straight for the core
      particles.push({
        type: 'neutron',
        x: cx - 220,
        y: cy,
        vx: 8,
        vy: 0,
        radius: 3.5,
        color: '#ffffff',
        life: 250,
        age: 10,
        sourceId: -999,
        trail: []
      });

      return {
        atoms,
        bonds: [],
        particles,
        name: 'Uranium Chain Reaction (²³⁵U)'
      };
    }
  }
];
