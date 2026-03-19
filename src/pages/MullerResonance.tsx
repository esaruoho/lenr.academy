import { useState, useEffect, useMemo, useCallback } from 'react'
import { useTranslation } from 'react-i18next'
import { useDatabase } from '../contexts/DatabaseContext'
import { getAllElements } from '../services/queryService'
import DatabaseLoadingCard from '../components/DatabaseLoadingCard'
import PeriodicTable from '../components/PeriodicTable'
import type { Element } from '../types'
import {
  findResonantPartners,
  queryResonantReactions,
  formatWavelength,
  getResonanceQuality,
  computeMullerMismatch,
  type MullerResonancePair,
  type ReactionOverlap,
} from '../services/mullerResonanceService'

const THRESHOLD_OPTIONS = [0.1, 0.5, 1.0, 2.0, 5.0, 10.0]

export default function MullerResonance() {
  const { t } = useTranslation()
  const { db, isLoading: dbLoading, downloadProgress } = useDatabase()
  const [elements, setElements] = useState<Element[]>([])
  const [selectedElement, setSelectedElement] = useState<string | null>(null)
  const [threshold, setThreshold] = useState(5.0)
  const [pairs, setPairs] = useState<MullerResonancePair[]>([])
  const [overlaps, setOverlaps] = useState<ReactionOverlap[]>([])
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    if (!db) return
    const allElements = getAllElements(db)
    setElements(allElements)
  }, [db])

  const handleElementClick = useCallback((symbol: string) => {
    setSelectedElement(prev => prev === symbol ? null : symbol)
  }, [])

  // Compute resonant partners when element or threshold changes
  useEffect(() => {
    if (!db || !selectedElement) {
      setPairs([])
      setOverlaps([])
      return
    }

    setLoading(true)
    try {
      const el = elements.find(e => e.E === selectedElement)
      if (!el) return

      const result = findResonantPartners(
        el.Z,
        el.E,
        elements.map(e => ({ Z: e.Z, E: e.E })),
        threshold
      )
      setPairs(result.pairs)

      // Query reactions for resonant pairs
      const rxOverlaps = queryResonantReactions(db, result.pairs)
      setOverlaps(rxOverlaps)
    } finally {
      setLoading(false)
    }
  }, [db, selectedElement, threshold, elements])

  // Build heatmap data for periodic table highlighting
  const heatmapData = useMemo(() => {
    const map = new Map<string, number>()
    if (!selectedElement) return map

    const selectedEl = elements.find(e => e.E === selectedElement)
    if (!selectedEl) return map

    for (const el of elements) {
      if (el.E === selectedElement) continue
      const result = computeMullerMismatch(selectedEl.Z, el.Z)
      if (result && result.mismatch < threshold) {
        // Invert: lower mismatch = higher value for heatmap
        const intensity = Math.max(0, 1 - result.mismatch / threshold)
        map.set(el.E, intensity)
      }
    }
    return map
  }, [selectedElement, elements, threshold])

  // Stats
  const stats = useMemo(() => {
    const exact = pairs.filter(p => p.mismatch < 0.01).length
    const strong = pairs.filter(p => p.mismatch < 0.5).length
    const withReactions = overlaps.filter(o => o.twoToTwoCount > 0 || o.fusionCount > 0).length
    const totalReactions = overlaps.reduce((s, o) => s + o.twoToTwoCount + o.fusionCount, 0)
    return { exact, strong, withReactions, totalReactions }
  }, [pairs, overlaps])

  if (dbLoading || !db) {
    return (
      <div className="max-w-7xl mx-auto">
        <DatabaseLoadingCard downloadProgress={downloadProgress} />
      </div>
    )
  }

  return (
    <div className="max-w-7xl mx-auto">
      {/* Header */}
      <div className="card p-6 mb-6">
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">
          {t('mullerResonance.title')}
        </h1>
        <p className="text-gray-600 dark:text-gray-400 mb-4">
          {t('mullerResonance.description')}
        </p>
        <div className="p-4 rounded-lg bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700">
          <p className="font-mono text-lg text-center text-gray-900 dark:text-white mb-2">
            L = Z &times; C<sub>e</sub> &times; 2<sup>N</sup>
          </p>
          <p className="text-sm text-gray-500 dark:text-gray-400 text-center">
            {t('mullerResonance.equationExplanation')}
          </p>
        </div>
      </div>

      {/* Threshold selector */}
      <div className="card p-4 mb-6">
        <div className="flex flex-wrap items-center gap-3">
          <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
            {t('mullerResonance.threshold')}:
          </span>
          {THRESHOLD_OPTIONS.map(t_val => (
            <button
              key={t_val}
              onClick={() => setThreshold(t_val)}
              className={`px-3 py-1 rounded text-sm font-medium transition-colors ${
                threshold === t_val
                  ? 'bg-primary-600 text-white'
                  : 'bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600'
              }`}
            >
              &lt; {t_val}%
            </button>
          ))}
        </div>
      </div>

      {/* Periodic Table */}
      <div className="card p-4 mb-6">
        <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-3">
          {t('mullerResonance.selectElement')}
        </h2>
        <PeriodicTable
          availableElements={elements}
          selectedElement={selectedElement}
          onElementClick={handleElementClick}
          heatmapData={heatmapData}
          showHeatmap={!!selectedElement}
          hideLegend
          hideCardContainer
        />
        {selectedElement && (
          <div className="mt-3 flex flex-wrap gap-4 text-sm">
            <span className="text-gray-600 dark:text-gray-400">
              {t('mullerResonance.resonantPartners')}: <strong className="text-gray-900 dark:text-white">{pairs.length}</strong>
            </span>
            {stats.exact > 0 && (
              <span className="text-emerald-600 dark:text-emerald-400">
                {t('mullerResonance.exactMatches')}: <strong>{stats.exact}</strong>
              </span>
            )}
            <span className="text-gray-600 dark:text-gray-400">
              {t('mullerResonance.withReactions')}: <strong className="text-gray-900 dark:text-white">{stats.withReactions}</strong>
            </span>
            <span className="text-gray-600 dark:text-gray-400">
              {t('mullerResonance.totalReactions')}: <strong className="text-gray-900 dark:text-white">{stats.totalReactions.toLocaleString()}</strong>
            </span>
          </div>
        )}
      </div>

      {/* Results table */}
      {selectedElement && (
        <div className="card p-4 mb-6">
          <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-3">
            {t('mullerResonance.resonancePairs')}
          </h2>

          {loading ? (
            <p className="text-gray-500 dark:text-gray-400">{t('common.loading')}</p>
          ) : pairs.length === 0 ? (
            <p className="text-gray-500 dark:text-gray-400">{t('mullerResonance.noResonantPairs')}</p>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-gray-200 dark:border-gray-700">
                    <th className="text-left py-2 px-3 text-gray-700 dark:text-gray-300">{t('mullerResonance.partner')}</th>
                    <th className="text-right py-2 px-3 text-gray-700 dark:text-gray-300">{t('mullerResonance.mismatchHeader')}</th>
                    <th className="text-center py-2 px-3 text-gray-700 dark:text-gray-300">{t('mullerResonance.quality')}</th>
                    <th className="text-right py-2 px-3 text-gray-700 dark:text-gray-300">{t('mullerResonance.wavelength')}</th>
                    <th className="text-center py-2 px-3 text-gray-700 dark:text-gray-300">{t('mullerResonance.octaves')}</th>
                    <th className="text-right py-2 px-3 text-gray-700 dark:text-gray-300">{t('mullerResonance.twoToTwo')}</th>
                    <th className="text-right py-2 px-3 text-gray-700 dark:text-gray-300">{t('mullerResonance.fusion')}</th>
                    <th className="text-right py-2 px-3 text-gray-700 dark:text-gray-300">{t('mullerResonance.avgMeV')}</th>
                  </tr>
                </thead>
                <tbody>
                  {overlaps.map((overlap, i) => {
                    const pair = pairs[i]
                    if (!pair) return null
                    const quality = getResonanceQuality(pair.mismatch)
                    const qualityColors: Record<string, string> = {
                      exact: 'bg-emerald-100 text-emerald-800 dark:bg-emerald-900 dark:text-emerald-200',
                      strong: 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200',
                      moderate: 'bg-amber-100 text-amber-800 dark:bg-amber-900 dark:text-amber-200',
                      weak: 'bg-gray-100 text-gray-600 dark:bg-gray-800 dark:text-gray-400',
                    }

                    return (
                      <tr
                        key={`${pair.Z1}-${pair.Z2}`}
                        className="border-b border-gray-100 dark:border-gray-800 hover:bg-gray-50 dark:hover:bg-gray-800/50"
                      >
                        <td className="py-2 px-3 font-medium text-gray-900 dark:text-white">
                          {pair.E2} <span className="text-gray-400 dark:text-gray-500">(Z={pair.Z2})</span>
                        </td>
                        <td className="py-2 px-3 text-right font-mono text-gray-700 dark:text-gray-300">
                          {pair.mismatch < 0.01 ? pair.mismatch.toFixed(4) : pair.mismatch.toFixed(2)}%
                        </td>
                        <td className="py-2 px-3 text-center">
                          <span className={`px-2 py-0.5 rounded text-xs font-medium ${qualityColors[quality]}`}>
                            {t(`mullerResonance.qualityLabels.${quality}`)}
                          </span>
                        </td>
                        <td className="py-2 px-3 text-right font-mono text-gray-700 dark:text-gray-300">
                          {formatWavelength(pair.wavelength)}
                        </td>
                        <td className="py-2 px-3 text-center text-gray-500 dark:text-gray-400 font-mono text-xs">
                          <span title={t('mullerResonance.electronOctave')}>e:{pair.electronOctave}</span>
                          {' / '}
                          <span title={t('mullerResonance.protonOctave')}>p:{pair.protonOctave}</span>
                        </td>
                        <td className="py-2 px-3 text-right text-gray-700 dark:text-gray-300">
                          {overlap.twoToTwoCount > 0 ? overlap.twoToTwoCount.toLocaleString() : (
                            <span className="text-gray-400 dark:text-gray-600">-</span>
                          )}
                        </td>
                        <td className="py-2 px-3 text-right text-gray-700 dark:text-gray-300">
                          {overlap.fusionCount > 0 ? overlap.fusionCount : (
                            <span className="text-gray-400 dark:text-gray-600">-</span>
                          )}
                        </td>
                        <td className="py-2 px-3 text-right font-mono text-gray-700 dark:text-gray-300">
                          {overlap.avgMeV > 0 ? overlap.avgMeV.toFixed(1) : (
                            <span className="text-gray-400 dark:text-gray-600">-</span>
                          )}
                        </td>
                      </tr>
                    )
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {/* Explanation card */}
      <div className="card p-6 mb-6">
        <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-3">
          {t('mullerResonance.aboutTitle')}
        </h2>
        <div className="space-y-3 text-sm text-gray-600 dark:text-gray-400">
          <p>{t('mullerResonance.about1')}</p>
          <p>{t('mullerResonance.about2')}</p>
          <p>{t('mullerResonance.about3')}</p>
          <div className="p-3 rounded bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800">
            <p className="text-amber-800 dark:text-amber-300 text-xs">
              {t('mullerResonance.disclaimer')}
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}
