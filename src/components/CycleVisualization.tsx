import { useTranslation } from 'react-i18next'
import {
  ArrowLeft,
  Play,
  Zap,
  RefreshCw,
  Gem,
  Shield,
  ArrowRight,
  GitMerge,
  ArrowLeftRight,
  Scissors,
} from 'lucide-react'
import type { DiscoveredCycle, CycleReaction } from '../types'

interface CycleVisualizationProps {
  cycle: DiscoveredCycle
  onRunSimulation: (cycle: DiscoveredCycle) => void
  onBack: () => void
}

function NuclideBadge({
  nuclide,
  highlight,
}: {
  nuclide: { E: string; Z: number; A: number }
  highlight?: boolean
}) {
  return (
    <span
      className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-semibold mr-1 ${
        highlight
          ? 'bg-amber-100 dark:bg-amber-900/40 text-amber-800 dark:text-amber-200 ring-1 ring-amber-300 dark:ring-amber-700'
          : 'bg-primary-100 dark:bg-primary-900/40 text-primary-800 dark:text-primary-200'
      }`}
    >
      <sup className="text-[10px] mr-0.5">{nuclide.A}</sup>
      {nuclide.E}
    </span>
  )
}

function MetricCard({
  icon,
  label,
  value,
  unit,
  color,
}: {
  icon: React.ReactNode
  label: string
  value: string
  unit?: string
  color: string
}) {
  return (
    <div className={`card p-4 ${color}`}>
      <div className="flex items-center gap-2 mb-1">
        {icon}
        <span className="text-xs font-medium text-gray-600 dark:text-gray-400 uppercase tracking-wide">
          {label}
        </span>
      </div>
      <div className="flex items-baseline gap-1">
        <span className="text-2xl font-bold text-gray-900 dark:text-white">
          {value}
        </span>
        {unit && (
          <span className="text-sm text-gray-500 dark:text-gray-400">
            {unit}
          </span>
        )}
      </div>
    </div>
  )
}

function ReactionTypeBadge({ type }: { type: CycleReaction['type'] }) {
  const colors = {
    fusion:
      'bg-blue-100 dark:bg-blue-900/40 text-blue-800 dark:text-blue-200',
    twotwo:
      'bg-purple-100 dark:bg-purple-900/40 text-purple-800 dark:text-purple-200',
    fission:
      'bg-red-100 dark:bg-red-900/40 text-red-800 dark:text-red-200',
  }

  const icons = {
    fusion: <GitMerge className="w-3 h-3" />,
    twotwo: <ArrowLeftRight className="w-3 h-3" />,
    fission: <Scissors className="w-3 h-3" />,
  }

  const labels = {
    fusion: 'FUSION',
    twotwo: 'TWO-TO-TWO',
    fission: 'FISSION',
  }

  return (
    <span
      className={`inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider ${colors[type]}`}
    >
      {icons[type]}
      {labels[type]}
    </span>
  )
}

export default function CycleVisualization({
  cycle,
  onRunSimulation,
  onBack,
}: CycleVisualizationProps) {
  const { t } = useTranslation()

  // Collect all fuel nuclide keys for highlighting
  const fuelKeys = new Set(
    cycle.fuelNuclides.map((n) => `${n.E}-${n.A}`)
  )

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="card p-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-3 mb-2">
              <button
                onClick={onBack}
                className="p-1.5 rounded-md hover:bg-gray-100 dark:hover:bg-gray-700 text-gray-600 dark:text-gray-400 transition-colors"
                title={t('common.back')}
              >
                <ArrowLeft className="w-5 h-5" />
              </button>
              <h2 className="text-xl font-semibold text-gray-900 dark:text-white">
                {t('cycleDiscovery.cycleDetail')}
              </h2>
            </div>
            <div className="flex flex-wrap items-center gap-1 ml-10">
              <span className="text-sm text-gray-500 dark:text-gray-400 mr-1">
                {t('cycleDiscovery.fuelLabel')}:
              </span>
              {cycle.fuelNuclides.map((n, i) => (
                <NuclideBadge key={i} nuclide={n} highlight />
              ))}
            </div>
          </div>
          <button
            onClick={() => onRunSimulation(cycle)}
            className="btn btn-primary px-5 py-2.5"
          >
            <Play className="w-4 h-4 mr-2 inline" />
            {t('cycleDiscovery.runFullCascade')}
          </button>
        </div>
      </div>

      {/* Metric cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <MetricCard
          icon={<Zap className="w-4 h-4 text-green-600 dark:text-green-400" />}
          label={t('cycleDiscovery.metricEnergy')}
          value={cycle.totalEnergy.toFixed(2)}
          unit="MeV"
          color=""
        />
        <MetricCard
          icon={
            <RefreshCw className="w-4 h-4 text-amber-600 dark:text-amber-400" />
          }
          label={t('cycleDiscovery.metricFeedback')}
          value={cycle.feedbackRatio.toFixed(0)}
          unit="%"
          color=""
        />
        <MetricCard
          icon={
            <Gem className="w-4 h-4 text-blue-600 dark:text-blue-400" />
          }
          label={t('cycleDiscovery.metricAbundance')}
          value={cycle.abundanceScore.toFixed(0)}
          unit="/100"
          color=""
        />
        <MetricCard
          icon={
            <Shield className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
          }
          label={t('cycleDiscovery.metricStability')}
          value={cycle.stabilityScore.toFixed(0)}
          unit="/100"
          color=""
        />
      </div>

      {/* Reaction steps */}
      <div className="card overflow-hidden">
        <div className="px-6 py-4 border-b border-gray-200 dark:border-gray-700">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
            {t('cycleDiscovery.reactionSteps')} ({cycle.reactions.length})
          </h3>
        </div>

        <div className="divide-y divide-gray-200 dark:divide-gray-700">
          {cycle.reactions.map((reaction, index) => (
            <div
              key={index}
              className={`px-6 py-4 ${
                reaction.isFeedback
                  ? 'bg-amber-50/50 dark:bg-amber-900/10'
                  : ''
              }`}
            >
              <div className="flex items-start gap-4">
                {/* Step number */}
                <div className="flex-shrink-0 w-8 h-8 rounded-full bg-gray-100 dark:bg-gray-700 flex items-center justify-center">
                  <span className="text-sm font-bold text-gray-600 dark:text-gray-300">
                    {index + 1}
                  </span>
                </div>

                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-2">
                    <ReactionTypeBadge type={reaction.type} />
                    {reaction.isFeedback && (
                      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider bg-amber-100 dark:bg-amber-900/40 text-amber-700 dark:text-amber-300">
                        <RefreshCw className="w-3 h-3" />
                        {t('cycleDiscovery.feedbackLabel')}
                      </span>
                    )}
                  </div>

                  {/* Reaction equation */}
                  <div className="flex flex-wrap items-center gap-1.5">
                    {reaction.inputs.map((n, i) => (
                      <span key={`in-${i}`} className="flex items-center gap-1">
                        {i > 0 && (
                          <span className="text-gray-400 dark:text-gray-500 text-sm">
                            +
                          </span>
                        )}
                        <NuclideBadge
                          nuclide={n}
                          highlight={fuelKeys.has(`${n.E}-${n.A}`)}
                        />
                      </span>
                    ))}

                    <ArrowRight className="w-4 h-4 text-gray-400 dark:text-gray-500 mx-1" />

                    {reaction.outputs.map((n, i) => (
                      <span key={`out-${i}`} className="flex items-center gap-1">
                        {i > 0 && (
                          <span className="text-gray-400 dark:text-gray-500 text-sm">
                            +
                          </span>
                        )}
                        <NuclideBadge
                          nuclide={n}
                          highlight={fuelKeys.has(`${n.E}-${n.A}`)}
                        />
                      </span>
                    ))}

                    <span className="ml-2 text-sm font-mono font-medium text-green-700 dark:text-green-400">
                      {reaction.MeV >= 0 ? '+' : ''}
                      {reaction.MeV.toFixed(2)} MeV
                    </span>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Flow diagram */}
      <div className="card p-6">
        <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
          {t('cycleDiscovery.transformationChain')}
        </h3>
        <div className="flex flex-wrap items-center gap-2">
          {cycle.reactions.map((reaction, index) => (
            <div key={index} className="flex items-center gap-2">
              {index === 0 && (
                <>
                  {reaction.inputs.map((n, i) => (
                    <span key={`start-${i}`} className="flex items-center gap-1">
                      {i > 0 && (
                        <span className="text-gray-400 text-xs">+</span>
                      )}
                      <NuclideBadge
                        nuclide={n}
                        highlight={fuelKeys.has(`${n.E}-${n.A}`)}
                      />
                    </span>
                  ))}
                  <ArrowRight className="w-4 h-4 text-gray-400 flex-shrink-0" />
                </>
              )}
              {reaction.outputs.map((n, i) => (
                <span key={`out-${index}-${i}`} className="flex items-center gap-1">
                  {i > 0 && (
                    <span className="text-gray-400 text-xs">+</span>
                  )}
                  <NuclideBadge
                    nuclide={n}
                    highlight={fuelKeys.has(`${n.E}-${n.A}`)}
                  />
                </span>
              ))}
              {index < cycle.reactions.length - 1 && (
                <ArrowRight className="w-4 h-4 text-gray-400 flex-shrink-0" />
              )}
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
