import { ElementData } from '../types/simulation';

export const ELEMENT_NAMES: Record<number, string> = {
  1: "Hydrogen", 2: "Helium", 3: "Lithium", 4: "Beryllium", 5: "Boron", 6: "Carbon",
  7: "Nitrogen", 8: "Oxygen", 9: "Fluorine", 10: "Neon", 11: "Sodium", 12: "Magnesium",
  13: "Aluminum", 14: "Silicon", 15: "Phosphorus", 16: "Sulfur", 17: "Chlorine", 18: "Argon",
  19: "Potassium", 20: "Calcium", 21: "Scandium", 22: "Titanium", 23: "Vanadium", 24: "Chromium",
  25: "Manganese", 26: "Iron", 27: "Cobalt", 28: "Nickel", 29: "Copper", 30: "Zinc",
  31: "Gallium", 32: "Germanium", 33: "Arsenic", 34: "Selenium", 35: "Bromine", 36: "Krypton",
  37: "Rubidium", 38: "Strontium", 39: "Yttrium", 40: "Zirconium", 41: "Niobium", 42: "Molybdenum",
  43: "Technetium", 44: "Ruthenium", 45: "Rhodium", 46: "Palladium", 47: "Silver", 48: "Cadmium",
  49: "Indium", 50: "Tin", 51: "Antimony", 52: "Tellurium", 53: "Iodine", 54: "Xenon",
  55: "Cesium", 56: "Barium", 57: "Lanthanum", 58: "Cerium", 59: "Praseodymium", 60: "Neodymium",
  61: "Promethium", 62: "Samarium", 63: "Europium", 64: "Gadolinium", 65: "Terbium", 66: "Dysprosium",
  67: "Holmium", 68: "Erbium", 69: "Thulium", 70: "Ytterbium", 71: "Lutetium", 72: "Hafnium",
  73: "Tantalum", 74: "Tungsten", 75: "Rhenium", 76: "Osmium", 77: "Iridium", 78: "Platinum",
  79: "Gold", 80: "Mercury", 81: "Thallium", 82: "Lead", 83: "Bismuth", 84: "Polonium",
  85: "Astatine", 86: "Radon", 87: "Francium", 88: "Radium", 89: "Actinium", 90: "Thorium",
  91: "Protactinium", 92: "Uranium", 93: "Neptunium", 94: "Plutonium", 95: "Americium", 96: "Curium",
  97: "Berkelium", 98: "Californium", 99: "Einsteinium", 100: "Fermium", 101: "Mendelevium", 102: "Nobelium",
  103: "Lawrencium", 104: "Rutherfordium", 105: "Dubnium", 106: "Seaborgium", 107: "Bohrium", 108: "Hassium",
  109: "Meitnerium", 110: "Darmstadtium", 111: "Roentgenium", 112: "Copernicium", 113: "Nihonium", 114: "Flerovium",
  115: "Moscovium", 116: "Livermorium", 117: "Tennessine", 118: "Oganesson"
};

export const SYMBOLS = [
  "H","He","Li","Be","B","C","N","O","F","Ne","Na","Mg","Al","Si","P","S","Cl","Ar",
  "K","Ca","Sc","Ti","V","Cr","Mn","Fe","Co","Ni","Cu","Zn","Ga","Ge","As","Se","Br","Kr",
  "Rb","Sr","Y","Zr","Nb","Mo","Tc","Ru","Rh","Pd","Ag","Cd","In","Sn","Sb","Te","I","Xe",
  "Cs","Ba","La","Ce","Pr","Nd","Pm","Sm","Eu","Gd","Tb","Dy","Ho","Er","Tm","Yb","Lu",
  "Hf","Ta","W","Re","Os","Ir","Pt","Au","Hg","Tl","Pb","Bi","Po","At","Rn",
  "Fr","Ra","Ac","Th","Pa","U","Np","Pu","Am","Cm","Bk","Cf","Es","Fm","Md","No","Lr",
  "Rf","Db","Sg","Bh","Hs","Mt","Ds","Rg","Cn","Nh","Fl","Mc","Lv","Ts","Og"
];

export function getElementData(z: number): ElementData {
  const symbol = SYMBOLS[z - 1] || "X";
  const name = ELEMENT_NAMES[z] || `Element ${z}`;
  const mass = Math.max(1, Math.round(z * 2.15));
  const radius = Math.min(24, 10 + Math.sqrt(z) * 1.2);
  
  const isRadioactive = (z > 82 || z === 43 || z === 61);
  let isMetal = false;
  let isMetalloid = false;
  let valence = 1;
  let maxPosCharge = 0;
  let maxNegCharge = 0;
  let color = "#88aaff";
  let category: 'metal' | 'metalloid' | 'nonmetal' | 'noble' = 'nonmetal';

  if (z === 1) {
    category = 'nonmetal';
    valence = 1; maxPosCharge = 1; maxNegCharge = 1; color = "#ffffff";
  } else if (z === 2) {
    category = 'noble';
    valence = 2; maxPosCharge = 0; maxNegCharge = 0; color = "#d9ffff";
  } else if ([3, 11, 19, 37, 55, 87].includes(z)) {
    isMetal = true; category = 'metal';
    valence = 1; maxPosCharge = 1; maxNegCharge = 0; color = "#e67e22";
  } else if ([4, 12, 20, 38, 56, 88].includes(z)) {
    isMetal = true; category = 'metal';
    valence = 2; maxPosCharge = 2; maxNegCharge = 0; color = "#f39c12";
  } else if ((z >= 21 && z <= 30) || (z >= 39 && z <= 48) || (z >= 72 && z <= 80) || (z >= 104 && z <= 112)) {
    isMetal = true; category = 'metal';
    valence = [24, 29, 42, 47, 79].includes(z) ? 1 : 2;
    maxPosCharge = (z === 26 || z === 27 || z === 28) ? 3 : 2;
    maxNegCharge = 0; color = "#d35400";
  } else if ((z >= 57 && z <= 71) || (z >= 89 && z <= 103)) {
    isMetal = true; category = 'metal';
    valence = 2; maxPosCharge = 3; maxNegCharge = 0; color = "#9b59b6";
  } else if ([13, 31, 49, 50, 81, 82, 83, 113, 114, 115, 116].includes(z)) {
    isMetal = true; category = 'metal';
    if ([13, 31, 49, 81, 113].includes(z)) { valence = 3; maxPosCharge = 3; }
    else if ([50, 82, 114].includes(z)) { valence = 4; maxPosCharge = 4; }
    else { valence = 5; maxPosCharge = 3; }
    maxNegCharge = 0; color = "#e67e22";
  } else if ([5, 14, 32, 33, 51, 52, 84].includes(z)) {
    isMetalloid = true; category = 'metalloid';
    if (z === 5) { valence = 3; maxPosCharge = 3; maxNegCharge = 0; }
    else if (z === 14 || z === 32) { valence = 4; maxPosCharge = 4; maxNegCharge = 4; }
    else if (z === 33 || z === 51) { valence = 5; maxPosCharge = 3; maxNegCharge = 3; }
    else { valence = 6; maxPosCharge = 2; maxNegCharge = 2; }
    color = "#16a085";
  } else if ([6, 7, 8, 15, 16, 34].includes(z)) {
    category = 'nonmetal';
    if (z === 6) { valence = 4; maxPosCharge = 4; maxNegCharge = 4; color = "#7f8c8d"; }
    else if (z === 7 || z === 15) { valence = 5; maxPosCharge = 3; maxNegCharge = 3; color = "#2980b9"; }
    else { valence = 6; maxPosCharge = 2; maxNegCharge = 2; color = "#e74c3c"; }
  } else if ([9, 17, 35, 53, 85, 117].includes(z)) {
    category = 'nonmetal';
    valence = 7; maxPosCharge = 1; maxNegCharge = 1; color = "#2ecc71";
  } else if ([10, 18, 36, 54, 86, 118].includes(z)) {
    category = 'noble';
    valence = 8; maxPosCharge = 0; maxNegCharge = 0; color = "#aaffff";
  }

  if (isRadioactive) {
    color = "#a855f7";
  }

  let maxBonds = isMetal ? 0 : (8 - valence <= 4 ? 8 - valence : valence);
  if (z === 1) maxBonds = 1;

  return {
    z,
    symbol,
    name,
    mass,
    radius,
    valence,
    isMetal,
    isMetalloid,
    maxPosCharge,
    maxNegCharge,
    maxBonds,
    isRadioactive,
    color,
    category
  };
}
