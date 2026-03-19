/**
 * Muller Resonance Service
 *
 * Implements Frithjof Muller's equation: L = Z × C × 2^N
 * where L is the resonance wavelength, Z is atomic number,
 * C is the Compton wavelength (electron or proton), and N is the octave number.
 *
 * When an element's electron resonance wavelength matches another element's
 * proton resonance wavelength at exact integer octave numbers, they share
 * a cross-particle resonance. Only ~0.2% of all element pairs match
 * to < 0.01%.
 *
 * Example: Copper (Z=29) electrons at N=31 and Iron (Z=26) protons at N=42
 * both produce L = 151.1 mm — a match to 0.0008%.
 */

// Fundamental constants
const COMPTON_ELECTRON = 2.42631e-12 // meters
// Proton Compton wavelength used in the equation (referenced via ELECTRON_PROTON_MASS_RATIO)
// const COMPTON_PROTON = 1.32141e-15 // meters
const ELECTRON_PROTON_MASS_RATIO = 1836.15267

// Octave search range
const MIN_OCTAVE = 7
const MAX_OCTAVE = 15

export interface MullerResonancePair {
  Z1: number
  E1: string
  Z2: number
  E2: string
  mismatch: number // percentage
  wavelength: number // meters
  electronOctave: number
  protonOctave: number
  electronElement: 'Z1' | 'Z2'
}

export interface MullerResonanceResult {
  selectedZ: number
  selectedSymbol: string
  pairs: MullerResonancePair[]
}

export interface ReactionOverlap {
  Z1: number
  E1: string
  Z2: number
  E2: string
  mismatch: number
  twoToTwoCount: number
  fusionCount: number
  avgMeV: number
  maxMeV: number
}

/**
 * Compute the best electron-proton resonance mismatch between two elements.
 * Returns the mismatch percentage and octave numbers.
 */
export function computeMullerMismatch(
  Z1: number,
  Z2: number
): { mismatch: number; electronOctave: number; protonOctave: number; wavelength: number; electronIsZ1: boolean } | null {
  if (Z1 === 0 || Z2 === 0 || Z1 === Z2) return null

  let best = 999
  let bestElectronN = 0
  let bestProtonN = 0
  let bestWavelength = 0
  let bestElectronIsZ1 = true

  // Check Z1 electron vs Z2 proton
  for (let dN = MIN_OCTAVE; dN <= MAX_OCTAVE; dN++) {
    const idealRatio = Math.pow(2, dN) / ELECTRON_PROTON_MASS_RATIO
    const actualRatio = Z1 / Z2
    const mm = Math.abs(actualRatio - idealRatio) / idealRatio * 100
    if (mm < best) {
      best = mm
      // Find actual octave numbers that produce a reasonable wavelength
      for (let N1 = 20; N1 <= 40; N1++) {
        const L = Z1 * COMPTON_ELECTRON * Math.pow(2, N1)
        if (L > 1e-6 && L < 10) {
          bestElectronN = N1
          bestProtonN = N1 + dN
          bestWavelength = L
          bestElectronIsZ1 = true
          break
        }
      }
    }

    // Check Z2 electron vs Z1 proton
    const reverseRatio = Z2 / Z1
    const mmReverse = Math.abs(reverseRatio - idealRatio) / idealRatio * 100
    if (mmReverse < best) {
      best = mmReverse
      for (let N1 = 20; N1 <= 40; N1++) {
        const L = Z2 * COMPTON_ELECTRON * Math.pow(2, N1)
        if (L > 1e-6 && L < 10) {
          bestElectronN = N1
          bestProtonN = N1 + dN
          bestWavelength = L
          bestElectronIsZ1 = false
          break
        }
      }
    }
  }

  if (best > 100) return null

  return {
    mismatch: best,
    electronOctave: bestElectronN,
    protonOctave: bestProtonN,
    wavelength: bestWavelength,
    electronIsZ1: bestElectronIsZ1,
  }
}

/**
 * Find all Muller-resonant partners for a given element.
 */
export function findResonantPartners(
  selectedZ: number,
  selectedSymbol: string,
  elements: Array<{ Z: number; E: string }>,
  threshold: number = 5.0
): MullerResonanceResult {
  const pairs: MullerResonancePair[] = []

  for (const el of elements) {
    if (el.Z === selectedZ || el.Z === 0) continue

    const result = computeMullerMismatch(selectedZ, el.Z)
    if (!result || result.mismatch >= threshold) continue

    pairs.push({
      Z1: selectedZ,
      E1: selectedSymbol,
      Z2: el.Z,
      E2: el.E,
      mismatch: result.mismatch,
      wavelength: result.wavelength,
      electronOctave: result.electronOctave,
      protonOctave: result.protonOctave,
      electronElement: result.electronIsZ1 ? 'Z1' : 'Z2',
    })
  }

  pairs.sort((a, b) => a.mismatch - b.mismatch)

  return { selectedZ, selectedSymbol: selectedSymbol, pairs }
}

/**
 * Compute Muller mismatch for all element pairs (for the heatmap).
 * Returns a Map from "Z1-Z2" to mismatch percentage.
 */
export function computeAllPairMismatches(
  elements: Array<{ Z: number; E: string }>
): Map<string, number> {
  const map = new Map<string, number>()

  for (let i = 0; i < elements.length; i++) {
    for (let j = i + 1; j < elements.length; j++) {
      const z1 = elements[i].Z
      const z2 = elements[j].Z
      if (z1 === 0 || z2 === 0) continue

      const result = computeMullerMismatch(z1, z2)
      if (result) {
        const key = `${Math.min(z1, z2)}-${Math.max(z1, z2)}`
        map.set(key, result.mismatch)
      }
    }
  }

  return map
}

/**
 * Query the database for reaction counts between Muller-resonant pairs.
 */
export function queryResonantReactions(
  db: import('sql.js').Database,
  pairs: MullerResonancePair[]
): ReactionOverlap[] {
  const overlaps: ReactionOverlap[] = []

  for (const pair of pairs) {
    // Two-to-two reactions where this pair is input
    const tttResult = db.exec(
      `SELECT COUNT(*), COALESCE(AVG(MeV), 0), COALESCE(MAX(MeV), 0)
       FROM TwoToTwoAll
       WHERE (Z1=? AND Z2=?) OR (Z1=? AND Z2=?)`,
      [pair.Z2, pair.Z1, pair.Z1, pair.Z2]
    )

    // Fusion reactions
    const fusResult = db.exec(
      `SELECT COUNT(*)
       FROM FusionAll
       WHERE (Z1=? AND Z2=?) OR (Z1=? AND Z2=?)`,
      [pair.Z2, pair.Z1, pair.Z1, pair.Z2]
    )

    const tttRow = tttResult[0]?.values[0] || [0, 0, 0]
    const fusRow = fusResult[0]?.values[0] || [0]

    overlaps.push({
      Z1: pair.Z1,
      E1: pair.E1,
      Z2: pair.Z2,
      E2: pair.E2,
      mismatch: pair.mismatch,
      twoToTwoCount: Number(tttRow[0]),
      fusionCount: Number(fusRow[0]),
      avgMeV: Number(tttRow[1]),
      maxMeV: Number(tttRow[2]),
    })
  }

  return overlaps.sort((a, b) => a.mismatch - b.mismatch)
}

/**
 * Format wavelength for display.
 */
export function formatWavelength(meters: number): string {
  if (meters >= 1) return `${meters.toFixed(2)} m`
  if (meters >= 0.001) return `${(meters * 1000).toFixed(2)} mm`
  if (meters >= 1e-6) return `${(meters * 1e6).toFixed(2)} μm`
  return `${(meters * 1e9).toFixed(2)} nm`
}

/**
 * Get resonance quality label.
 */
export function getResonanceQuality(mismatch: number): 'exact' | 'strong' | 'moderate' | 'weak' {
  if (mismatch < 0.01) return 'exact'
  if (mismatch < 0.5) return 'strong'
  if (mismatch < 2.0) return 'moderate'
  return 'weak'
}
