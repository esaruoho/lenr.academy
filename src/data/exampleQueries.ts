import { QueryFilter } from '../types';

export interface ExampleQuery {
  name: string;
  description: string;
  queryType: 'fusion' | 'fission' | 'twotwo';
  filter: QueryFilter;
  element1List?: string[];
  element2List?: string[];
  outputElementList?: string[];
}

export const EXAMPLE_QUERIES: ExampleQuery[] = [
  // Fusion examples
  {
    name: 'Hydrogen-Lithium Fusion',
    description: 'Classic LENR reaction pathway. H + Li fusion produces beryllium and helium isotopes with significant energy release.',
    queryType: 'fusion',
    element1List: ['H'],
    element2List: ['Li'],
    filter: {},
  },
  {
    name: 'Deuterium-Deuterium Fusion',
    description: 'D + D reactions are central to fusion research. Produces He-3 or tritium depending on the pathway.',
    queryType: 'fusion',
    element1List: ['D'],
    element2List: ['D'],
    filter: {},
  },
  {
    name: 'Nickel-Hydrogen Fusion',
    description: 'Investigated in Rossi E-Cat and Parkhomov replication experiments. Ni + H reactions produce copper isotopes.',
    queryType: 'fusion',
    element1List: ['H'],
    element2List: ['Ni'],
    filter: {},
  },
  {
    name: 'High-Energy Fusion (>10 MeV)',
    description: 'Find fusion reactions releasing more than 10 MeV of energy. Shows the most energetic transmutation pathways.',
    queryType: 'fusion',
    filter: { minMeV: 10 },
  },

  // Fission examples
  {
    name: 'Uranium Fission Pathways',
    description: 'All fission pathways from uranium isotopes. Shows the diverse product spectrum of uranium splitting.',
    queryType: 'fission',
    filter: { elements: ['U'] },
  },
  {
    name: 'Iron Fission',
    description: 'Fission products of iron isotopes. Iron-56 has the highest binding energy per nucleon, making fission endothermic.',
    queryType: 'fission',
    filter: { elements: ['Fe'] },
  },
  {
    name: 'Palladium Fission',
    description: 'Pd fission pathways relevant to Fleischmann-Pons cold fusion experiments using palladium electrodes.',
    queryType: 'fission',
    filter: { elements: ['Pd'] },
  },

  // Two-to-Two examples
  {
    name: 'Deuterium-Nickel Reactions',
    description: 'D + Ni two-to-two reactions. The default query showing deuterium-based transmutations with nickel, lithium, aluminum, boron, and nitrogen.',
    queryType: 'twotwo',
    element1List: ['D'],
    element2List: ['Ni', 'Li', 'Al', 'B', 'N'],
    filter: {},
  },
  {
    name: 'Proton-Boron Reactions',
    description: 'H + B-11 produces three alpha particles in the aneutronic fusion reaction (p + B-11 → 3α), considered ideal for clean energy.',
    queryType: 'twotwo',
    element1List: ['H'],
    element2List: ['B'],
    filter: {},
  },
  {
    name: 'Lithium-Lithium Reactions',
    description: 'Li + Li two-to-two reactions. Lithium is a key element in LENR research due to its low atomic number and high reactivity.',
    queryType: 'twotwo',
    element1List: ['Li'],
    element2List: ['Li'],
    filter: {},
  },
];
