/**
 * Materials Catalog Constants
 *
 * Predefined material compositions for cascade simulations.
 * Includes natural isotopic abundances, alloys, compounds, and
 * historical LENR experiment fuel compositions.
 *
 * Issue #96: Weighted Fuel Proportions and Materials Catalog
 */

import type { Material, LENRExperiment } from '../types';

// ============================================================================
// Natural Isotopic Abundances
// ============================================================================

/**
 * Natural isotopic abundances for commonly used LENR elements.
 * These are loaded dynamically from the database using pcaNCrust field,
 * but we provide some common ones as quick-access presets.
 */
export const NATURAL_ABUNDANCES: Material[] = [
  {
    id: 'natural-lithium',
    name: 'Natural Lithium',
    category: 'natural-abundance',
    description: 'Natural lithium isotopic composition',
    composition: [
      { nuclideId: 'Li-7', proportion: 92.41 },
      { nuclideId: 'Li-6', proportion: 7.59 },
    ],
    source: 'IUPAC 2016 atomic weights',
    tags: ['lithium', 'natural', 'fuel'],
  },
  {
    id: 'natural-nickel',
    name: 'Natural Nickel',
    category: 'natural-abundance',
    description: 'Natural nickel isotopic composition',
    composition: [
      { nuclideId: 'Ni-58', proportion: 68.08 },
      { nuclideId: 'Ni-60', proportion: 26.22 },
      { nuclideId: 'Ni-61', proportion: 1.14 },
      { nuclideId: 'Ni-62', proportion: 3.63 },
      { nuclideId: 'Ni-64', proportion: 0.93 },
    ],
    source: 'IUPAC 2016 atomic weights',
    tags: ['nickel', 'natural', 'fuel', 'ni-h'],
  },
  {
    id: 'natural-hydrogen',
    name: 'Natural Hydrogen',
    category: 'natural-abundance',
    description: 'Natural hydrogen isotopic composition',
    composition: [
      { nuclideId: 'H-1', proportion: 99.99 },
      { nuclideId: 'D', proportion: 0.01 },
    ],
    source: 'IUPAC 2016 atomic weights',
    tags: ['hydrogen', 'natural', 'fuel'],
  },
  {
    id: 'natural-boron',
    name: 'Natural Boron',
    category: 'natural-abundance',
    description: 'Natural boron isotopic composition',
    composition: [
      { nuclideId: 'B-11', proportion: 80.1 },
      { nuclideId: 'B-10', proportion: 19.9 },
    ],
    source: 'IUPAC 2016 atomic weights',
    tags: ['boron', 'natural', 'fuel'],
  },
  {
    id: 'natural-iron',
    name: 'Natural Iron',
    category: 'natural-abundance',
    description: 'Natural iron isotopic composition',
    composition: [
      { nuclideId: 'Fe-56', proportion: 91.75 },
      { nuclideId: 'Fe-54', proportion: 5.85 },
      { nuclideId: 'Fe-57', proportion: 2.12 },
      { nuclideId: 'Fe-58', proportion: 0.28 },
    ],
    source: 'IUPAC 2016 atomic weights',
    tags: ['iron', 'natural', 'steel'],
  },
  {
    id: 'natural-copper',
    name: 'Natural Copper',
    category: 'natural-abundance',
    description: 'Natural copper isotopic composition',
    composition: [
      { nuclideId: 'Cu-63', proportion: 69.17 },
      { nuclideId: 'Cu-65', proportion: 30.83 },
    ],
    source: 'IUPAC 2016 atomic weights',
    tags: ['copper', 'natural', 'constantan'],
  },
  {
    id: 'natural-titanium',
    name: 'Natural Titanium',
    category: 'natural-abundance',
    description: 'Natural titanium isotopic composition',
    composition: [
      { nuclideId: 'Ti-48', proportion: 73.72 },
      { nuclideId: 'Ti-46', proportion: 8.25 },
      { nuclideId: 'Ti-47', proportion: 7.44 },
      { nuclideId: 'Ti-49', proportion: 5.41 },
      { nuclideId: 'Ti-50', proportion: 5.18 },
    ],
    source: 'IUPAC 2016 atomic weights',
    tags: ['titanium', 'natural', 'aerospace'],
  },
  {
    id: 'natural-chromium',
    name: 'Natural Chromium',
    category: 'natural-abundance',
    description: 'Natural chromium isotopic composition',
    composition: [
      { nuclideId: 'Cr-52', proportion: 83.79 },
      { nuclideId: 'Cr-53', proportion: 9.50 },
      { nuclideId: 'Cr-50', proportion: 4.35 },
      { nuclideId: 'Cr-54', proportion: 2.37 },
    ],
    source: 'IUPAC 2016 atomic weights',
    tags: ['chromium', 'natural', 'steel'],
  },
  {
    id: 'natural-aluminum',
    name: 'Natural Aluminum',
    category: 'natural-abundance',
    description: 'Aluminum has only one stable isotope',
    composition: [
      { nuclideId: 'Al-27', proportion: 100 },
    ],
    source: 'IUPAC 2016 atomic weights',
    tags: ['aluminum', 'natural', 'monoisotopic'],
  },
  {
    id: 'natural-air',
    name: 'Natural Air',
    category: 'natural-abundance',
    description: 'Dry atmospheric air composition (N₂ 78%, O₂ 21%, Ar 0.93%)',
    composition: [
      // Nitrogen (78.08% by volume, ~75.5% by mass)
      { nuclideId: 'N-14', proportion: 75.07 },
      { nuclideId: 'N-15', proportion: 0.27 },
      // Oxygen (20.95% by volume, ~23.1% by mass)
      { nuclideId: 'O-16', proportion: 23.01 },
      { nuclideId: 'O-18', proportion: 0.05 },
      { nuclideId: 'O-17', proportion: 0.01 },
      // Argon (0.93% by volume, ~1.3% by mass)
      { nuclideId: 'Ar-40', proportion: 1.29 },
      // Trace components below 0.01% omitted for simplicity
      // (Ar-36: 0.004%, Ar-38: 0.001%, CO2: 0.04%)
    ],
    source: 'CRC Handbook of Chemistry and Physics',
    tags: ['air', 'atmosphere', 'natural', 'nitrogen', 'oxygen', 'argon'],
  },
];

// ============================================================================
// Common Alloys
// ============================================================================

export const ALLOYS: Material[] = [
  {
    id: 'ss-304',
    name: 'Stainless Steel 304',
    category: 'alloy',
    description: 'Common austenitic stainless steel (18-8)',
    composition: [
      // Iron (~69.5% of alloy, natural isotopes)
      { nuclideId: 'Fe-56', proportion: 63.77 },
      { nuclideId: 'Fe-54', proportion: 4.06 },
      { nuclideId: 'Fe-57', proportion: 1.47 },
      { nuclideId: 'Fe-58', proportion: 0.20 },
      // Chromium (18.5% of alloy, natural isotopes)
      { nuclideId: 'Cr-52', proportion: 15.50 },
      { nuclideId: 'Cr-53', proportion: 1.76 },
      { nuclideId: 'Cr-50', proportion: 0.80 },
      { nuclideId: 'Cr-54', proportion: 0.44 },
      // Nickel (9.5% of alloy, natural isotopes)
      { nuclideId: 'Ni-58', proportion: 6.47 },
      { nuclideId: 'Ni-60', proportion: 2.49 },
      { nuclideId: 'Ni-61', proportion: 0.11 },
      { nuclideId: 'Ni-62', proportion: 0.35 },
      { nuclideId: 'Ni-64', proportion: 0.09 },
      // Manganese (2% of alloy, assume Mn-55 monoisotopic)
      { nuclideId: 'Mn-55', proportion: 2.00 },
      // Silicon (0.5% of alloy)
      { nuclideId: 'Si-28', proportion: 0.46 },
      { nuclideId: 'Si-29', proportion: 0.02 },
      { nuclideId: 'Si-30', proportion: 0.02 },
    ],
    source: 'ASTM A240 specification',
    tags: ['steel', 'stainless', '304', 'austenitic', 'reactor'],
  },
  {
    id: 'ss-316',
    name: 'Stainless Steel 316',
    category: 'alloy',
    description: 'Molybdenum-bearing stainless steel',
    composition: [
      // Iron (~65% of alloy, natural isotopes)
      { nuclideId: 'Fe-56', proportion: 59.64 },
      { nuclideId: 'Fe-54', proportion: 3.80 },
      { nuclideId: 'Fe-57', proportion: 1.38 },
      { nuclideId: 'Fe-58', proportion: 0.18 },
      // Chromium (17% of alloy)
      { nuclideId: 'Cr-52', proportion: 14.24 },
      { nuclideId: 'Cr-53', proportion: 1.62 },
      { nuclideId: 'Cr-50', proportion: 0.74 },
      { nuclideId: 'Cr-54', proportion: 0.40 },
      // Nickel (12% of alloy)
      { nuclideId: 'Ni-58', proportion: 8.17 },
      { nuclideId: 'Ni-60', proportion: 3.15 },
      { nuclideId: 'Ni-61', proportion: 0.14 },
      { nuclideId: 'Ni-62', proportion: 0.44 },
      { nuclideId: 'Ni-64', proportion: 0.11 },
      // Molybdenum (2.5% of alloy)
      { nuclideId: 'Mo-98', proportion: 0.60 },
      { nuclideId: 'Mo-96', proportion: 0.42 },
      { nuclideId: 'Mo-95', proportion: 0.40 },
      { nuclideId: 'Mo-92', proportion: 0.37 },
      { nuclideId: 'Mo-100', proportion: 0.24 },
      { nuclideId: 'Mo-97', proportion: 0.24 },
      { nuclideId: 'Mo-94', proportion: 0.23 },
      // Manganese (2% of alloy)
      { nuclideId: 'Mn-55', proportion: 2.00 },
    ],
    source: 'ASTM A240 specification',
    tags: ['steel', 'stainless', '316', 'austenitic', 'moly'],
  },
  {
    id: 'constantan',
    name: 'Constantan',
    category: 'alloy',
    description: 'Cu-Ni alloy used in Celani experiments (55% Cu, 45% Ni)',
    composition: [
      // Copper (55% of alloy, natural isotopes)
      { nuclideId: 'Cu-63', proportion: 38.04 },
      { nuclideId: 'Cu-65', proportion: 16.96 },
      // Nickel (45% of alloy, natural isotopes)
      { nuclideId: 'Ni-58', proportion: 30.63 },
      { nuclideId: 'Ni-60', proportion: 11.80 },
      { nuclideId: 'Ni-61', proportion: 0.51 },
      { nuclideId: 'Ni-62', proportion: 1.64 },
      { nuclideId: 'Ni-64', proportion: 0.42 },
    ],
    source: 'Standard constantan composition',
    tags: ['constantan', 'copper', 'nickel', 'celani', 'thermocouple'],
  },
  {
    id: 'ti-6al-4v',
    name: 'Ti-6Al-4V',
    category: 'alloy',
    description: 'Aerospace titanium alloy (Grade 5)',
    composition: [
      // Titanium (90% of alloy, natural isotopes)
      { nuclideId: 'Ti-48', proportion: 66.35 },
      { nuclideId: 'Ti-46', proportion: 7.43 },
      { nuclideId: 'Ti-47', proportion: 6.70 },
      { nuclideId: 'Ti-49', proportion: 4.87 },
      { nuclideId: 'Ti-50', proportion: 4.66 },
      // Aluminum (6% of alloy)
      { nuclideId: 'Al-27', proportion: 6.00 },
      // Vanadium (4% of alloy, natural isotopes)
      { nuclideId: 'V-51', proportion: 3.99 },
      { nuclideId: 'V-50', proportion: 0.01 },
    ],
    source: 'ASTM B348 Grade 5',
    tags: ['titanium', 'aerospace', 'grade5', 'ti64'],
  },
];

// ============================================================================
// Chemical Compounds
// ============================================================================

export const COMPOUNDS: Material[] = [
  {
    id: 'lialh4',
    name: 'LiAlH4 (Natural)',
    category: 'compound',
    description: 'Lithium aluminum hydride - common LENR fuel additive',
    composition: [
      // Aluminum (1 atom per formula unit, ~71.1% of mass)
      { nuclideId: 'Al-27', proportion: 71.10 },
      // Hydrogen (4 atoms per formula unit, ~10.6% of mass)
      { nuclideId: 'H-1', proportion: 10.59 },
      // Lithium (1 atom per formula unit, ~18.3% of mass)
      { nuclideId: 'Li-7', proportion: 16.93 },
      { nuclideId: 'Li-6', proportion: 1.38 },
    ],
    source: 'Stoichiometric calculation with natural isotopes',
    tags: ['hydride', 'lithium', 'aluminum', 'hydrogen', 'parkhomov', 'fuel'],
  },
  {
    id: 'nabh4',
    name: 'NaBH4 (Natural)',
    category: 'compound',
    description: 'Sodium borohydride',
    composition: [
      // Sodium (1 atom, ~60.8% of mass)
      { nuclideId: 'Na-23', proportion: 60.80 },
      // Boron (1 atom, ~28.6% of mass)
      { nuclideId: 'B-11', proportion: 22.91 },
      { nuclideId: 'B-10', proportion: 5.69 },
      // Hydrogen (4 atoms, ~10.6% of mass)
      { nuclideId: 'H-1', proportion: 10.60 },
    ],
    source: 'Stoichiometric calculation with natural isotopes',
    tags: ['hydride', 'sodium', 'boron', 'hydrogen', 'fuel'],
  },
  {
    id: 'mgh2',
    name: 'MgH2 (Natural)',
    category: 'compound',
    description: 'Magnesium hydride - hydrogen storage material',
    composition: [
      // Magnesium (1 atom, ~92.3% of mass)
      { nuclideId: 'Mg-24', proportion: 72.92 },
      { nuclideId: 'Mg-25', proportion: 9.23 },
      { nuclideId: 'Mg-26', proportion: 10.15 },
      // Hydrogen (2 atoms, ~7.7% of mass)
      { nuclideId: 'H-1', proportion: 7.70 },
    ],
    source: 'Stoichiometric calculation with natural isotopes',
    tags: ['hydride', 'magnesium', 'hydrogen', 'storage'],
  },
  {
    id: 'pd-d',
    name: 'Palladium Deuteride',
    category: 'compound',
    description: 'PdD (loaded palladium electrode)',
    composition: [
      // Palladium (natural isotopes)
      { nuclideId: 'Pd-106', proportion: 25.02 },
      { nuclideId: 'Pd-108', proportion: 24.30 },
      { nuclideId: 'Pd-105', proportion: 20.45 },
      { nuclideId: 'Pd-110', proportion: 10.76 },
      { nuclideId: 'Pd-104', proportion: 10.22 },
      { nuclideId: 'Pd-102', proportion: 0.94 },
      // Deuterium (typical 1:1 loading ratio, ~1.9% by mass)
      { nuclideId: 'D', proportion: 8.31 },
    ],
    source: 'Typical electrolysis experiment loading',
    tags: ['palladium', 'deuterium', 'fleischmann', 'pons', 'electrolysis'],
  },
];

// ============================================================================
// Historical LENR Experiments
// ============================================================================

export const LENR_EXPERIMENTS: LENRExperiment[] = [
  {
    id: 'parkhomov-2014',
    name: 'Parkhomov Ni-LiAlH4',
    category: 'lenr-experiment',
    description: 'Alexander Parkhomov\'s 2014 replication of Rossi reactor',
    researcher: 'Alexander Parkhomov',
    year: 2014,
    composition: [
      // Nickel powder (~90% of active fuel)
      { nuclideId: 'Ni-58', proportion: 61.27 },
      { nuclideId: 'Ni-60', proportion: 23.60 },
      { nuclideId: 'Ni-61', proportion: 1.03 },
      { nuclideId: 'Ni-62', proportion: 3.27 },
      { nuclideId: 'Ni-64', proportion: 0.83 },
      // LiAlH4 (~10% of active fuel)
      { nuclideId: 'Li-7', proportion: 0.79 },
      { nuclideId: 'Li-6', proportion: 0.07 },
      { nuclideId: 'Al-27', proportion: 7.11 },
      { nuclideId: 'H-1', proportion: 1.06 },
    ],
    citation: 'Parkhomov, A.G. (2015). "Investigation of high-temperature heat generator similar to the Rossi reactor"',
    experimentType: 'Ni-H',
    source: 'http://www.e-catworld.com/2015/01/07/parkhomov-reports-successful-replication-of-rossi-reactor/',
    tags: ['parkhomov', 'nickel', 'hydrogen', 'lialh4', 'replication'],
  },
  {
    id: 'piantelli-1990',
    name: 'Piantelli Ni-H System',
    category: 'lenr-experiment',
    description: 'Francesco Piantelli\'s nickel-hydrogen experiments (1990s)',
    researcher: 'Francesco Piantelli',
    year: 1990,
    composition: [
      // Natural nickel rod
      { nuclideId: 'Ni-58', proportion: 67.40 },
      { nuclideId: 'Ni-60', proportion: 25.97 },
      { nuclideId: 'Ni-61', proportion: 1.13 },
      { nuclideId: 'Ni-62', proportion: 3.60 },
      { nuclideId: 'Ni-64', proportion: 0.92 },
      // Hydrogen gas loading (~1% by mass)
      { nuclideId: 'H-1', proportion: 0.98 },
    ],
    citation: 'Focardi, S., et al. (1998). "Large excess heat production in Ni-H systems"',
    experimentType: 'Ni-H',
    source: 'Il Nuovo Cimento A, 111(11), 1233-1242',
    tags: ['piantelli', 'focardi', 'nickel', 'hydrogen', 'italy'],
  },
  {
    id: 'celani-2012',
    name: 'Celani Constantan Wire',
    category: 'lenr-experiment',
    description: 'Francesco Celani\'s hydrogen-loaded constantan wire experiments',
    researcher: 'Francesco Celani',
    year: 2012,
    composition: [
      // Constantan wire (55% Cu, 45% Ni)
      { nuclideId: 'Cu-63', proportion: 37.67 },
      { nuclideId: 'Cu-65', proportion: 16.79 },
      { nuclideId: 'Ni-58', proportion: 30.32 },
      { nuclideId: 'Ni-60', proportion: 11.68 },
      { nuclideId: 'Ni-61', proportion: 0.51 },
      { nuclideId: 'Ni-62', proportion: 1.62 },
      { nuclideId: 'Ni-64', proportion: 0.41 },
      // Hydrogen loading (~1% by mass)
      { nuclideId: 'H-1', proportion: 1.00 },
    ],
    citation: 'Celani, F., et al. (2012). ICCF-17 Proceedings',
    experimentType: 'Cu-Ni-H',
    source: 'https://www.lenr-canr.org/',
    tags: ['celani', 'constantan', 'copper', 'nickel', 'hydrogen', 'wire'],
  },
  {
    id: 'shoulders-evo',
    name: 'Shoulders EVO Titanium',
    category: 'lenr-experiment',
    description: 'Ken Shoulders\' Exotic Vacuum Objects experiments with titanium',
    researcher: 'Ken Shoulders',
    year: 1995,
    composition: [
      // Titanium substrate (natural isotopes)
      { nuclideId: 'Ti-48', proportion: 72.65 },
      { nuclideId: 'Ti-46', proportion: 8.13 },
      { nuclideId: 'Ti-47', proportion: 7.33 },
      { nuclideId: 'Ti-49', proportion: 5.33 },
      { nuclideId: 'Ti-50', proportion: 5.10 },
      // Deuterium loading
      { nuclideId: 'D', proportion: 1.46 },
    ],
    citation: 'Shoulders, K.R., & Shoulders, S. (1996). "Observations on the role of charge clusters in nuclear cluster reactions"',
    experimentType: 'EVO',
    source: 'Journal of New Energy, 1(3), 1996',
    tags: ['shoulders', 'evo', 'titanium', 'deuterium', 'charge-clusters'],
  },
  {
    id: 'urutskoev-2000',
    name: 'Urutskoev Ti Foil Explosion',
    category: 'lenr-experiment',
    description: 'L.I. Urutskoev\'s exploding titanium foil experiments',
    researcher: 'L.I. Urutskoev',
    year: 2000,
    composition: [
      // Titanium foil (natural isotopes)
      { nuclideId: 'Ti-48', proportion: 73.72 },
      { nuclideId: 'Ti-46', proportion: 8.25 },
      { nuclideId: 'Ti-47', proportion: 7.44 },
      { nuclideId: 'Ti-49', proportion: 5.41 },
      { nuclideId: 'Ti-50', proportion: 5.18 },
    ],
    citation: 'Urutskoev, L.I., et al. (2000). "Experimental detection of strange radiation..."',
    experimentType: 'Electrical discharge',
    source: 'Annales Fondation Louis de Broglie, 27, 701',
    tags: ['urutskoev', 'titanium', 'explosion', 'discharge', 'russia'],
  },
  {
    id: 'matsumoto-1992',
    name: 'Matsumoto Carbon Arc',
    category: 'lenr-experiment',
    description: 'Takaaki Matsumoto\'s carbon arc discharge experiments',
    researcher: 'Takaaki Matsumoto',
    year: 1992,
    composition: [
      // Carbon electrodes (natural isotopes)
      { nuclideId: 'C-12', proportion: 98.89 },
      { nuclideId: 'C-13', proportion: 1.11 },
    ],
    citation: 'Matsumoto, T. (1993). Fusion Technology, 24, 296',
    experimentType: 'Arc discharge',
    source: 'https://www.lenr-canr.org/',
    tags: ['matsumoto', 'carbon', 'arc', 'discharge', 'japan'],
  },
  {
    id: 'mizuno-pd-d',
    name: 'Mizuno Pd-D Electrolysis',
    category: 'lenr-experiment',
    description: 'Tadahiko Mizuno\'s palladium deuterium electrolysis experiments',
    researcher: 'Tadahiko Mizuno',
    year: 1996,
    composition: [
      // Palladium cathode (natural isotopes)
      { nuclideId: 'Pd-106', proportion: 25.02 },
      { nuclideId: 'Pd-108', proportion: 24.30 },
      { nuclideId: 'Pd-105', proportion: 20.45 },
      { nuclideId: 'Pd-110', proportion: 10.76 },
      { nuclideId: 'Pd-104', proportion: 10.22 },
      { nuclideId: 'Pd-102', proportion: 0.94 },
      // Deuterium from D2O electrolysis
      { nuclideId: 'D', proportion: 8.31 },
    ],
    citation: 'Mizuno, T. (1998). "Nuclear Transmutation: The Reality of Cold Fusion"',
    experimentType: 'Pd-D electrolysis',
    source: 'Infinite Energy Press, ISBN 978-1892925008',
    tags: ['mizuno', 'palladium', 'deuterium', 'electrolysis', 'japan'],
  },
];

// ============================================================================
// Export All Materials
// ============================================================================

/**
 * All built-in materials combined
 */
export const ALL_BUILTIN_MATERIALS: (Material | LENRExperiment)[] = [
  ...NATURAL_ABUNDANCES,
  ...ALLOYS,
  ...COMPOUNDS,
  ...LENR_EXPERIMENTS,
];

/**
 * Get materials by category
 */
export function getMaterialsByCategory(category: string): Material[] {
  return ALL_BUILTIN_MATERIALS.filter((m) => m.category === category);
}

/**
 * Get material by ID
 */
export function getMaterialById(id: string): Material | undefined {
  return ALL_BUILTIN_MATERIALS.find((m) => m.id === id);
}
