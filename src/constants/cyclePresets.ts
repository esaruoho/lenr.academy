import type { CycleDiscoveryParameters } from '../types'

export interface CyclePreset {
  id: string
  labelKey: string
  descriptionKey: string
  params: CycleDiscoveryParameters
}

export const CYCLE_PRESETS: CyclePreset[] = [
  {
    id: 'light-elements',
    labelKey: 'cycleDiscovery.presetLightElements',
    descriptionKey: 'cycleDiscovery.presetLightElementsDesc',
    params: {
      minFusionMeV: 0.5,
      minTwoToTwoMeV: 0.3,
      maxCycleDepth: 6,
      includeFission: false,
      maxCycles: 100,
      elementFilters: {
        allowedElements: ['H', 'D', 'T', 'He', 'Li', 'Be', 'B', 'C', 'N', 'O'],
      },
    },
  },
  {
    id: 'lenr-classics',
    labelKey: 'cycleDiscovery.presetLENRClassics',
    descriptionKey: 'cycleDiscovery.presetLENRClassicsDesc',
    params: {
      minFusionMeV: 1.0,
      minTwoToTwoMeV: 0.5,
      maxCycleDepth: 6,
      includeFission: false,
      maxCycles: 100,
      elementFilters: {
        allowedElements: ['H', 'D', 'Li', 'Ni', 'Pd', 'C', 'N', 'O'],
        abundantOnly: true,
      },
    },
  },
  {
    id: 'deep-search',
    labelKey: 'cycleDiscovery.presetDeepSearch',
    descriptionKey: 'cycleDiscovery.presetDeepSearchDesc',
    params: {
      minFusionMeV: 0.1,
      minTwoToTwoMeV: 0.1,
      maxCycleDepth: 8,
      includeFission: true,
      minFissionMeV: 0.5,
      maxCycles: 200,
    },
  },
  {
    id: 'hydrogen-only',
    labelKey: 'cycleDiscovery.presetHydrogenOnly',
    descriptionKey: 'cycleDiscovery.presetHydrogenOnlyDesc',
    params: {
      minFusionMeV: 0.5,
      minTwoToTwoMeV: 0.3,
      maxCycleDepth: 6,
      includeFission: false,
      maxCycles: 100,
      elementFilters: {
        allowedElements: ['H', 'D', 'T'],
      },
    },
  },
]
