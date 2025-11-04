import { useEffect, useRef, useState } from 'react'
import { RefreshCw, X, Sparkles, Loader2 } from 'lucide-react'
import { checkForUpdate } from '../services/versionCheck'
import { useRegisterSW } from 'virtual:pwa-register/react'

interface AppUpdateBannerProps {
  className?: string
  onVisibilityChange?: (visible: boolean) => void
  onViewChangelog?: (version: string | null) => void
}

const CURRENT_VERSION = (import.meta.env.VITE_APP_VERSION as string | undefined) ?? 'unknown'
const DISMISS_KEY = 'lenr-app-update-dismissed'
const SNOOZE_DURATION_MS = 6 * 60 * 60 * 1000 // 6 hours
const EXIT_ANIMATION_MS = 250

function hasDismissedUpdate(): boolean {
  if (typeof window === 'undefined') return false
  try {
    const storedValue = window.sessionStorage.getItem(DISMISS_KEY)
    if (!storedValue) return false

    const dismissedAt = Number(storedValue)
    if (!Number.isFinite(dismissedAt)) {
      window.sessionStorage.removeItem(DISMISS_KEY)
      return false
    }

    if (Date.now() - dismissedAt < SNOOZE_DURATION_MS) {
      return true
    }

    window.sessionStorage.removeItem(DISMISS_KEY)
    return false
  } catch {
    return false
  }
}

function markUpdateDismissed() {
  if (typeof window === 'undefined') return
  try {
    window.sessionStorage.setItem(DISMISS_KEY, String(Date.now()))
  } catch {
    // Ignore storage errors (e.g., quota exceeded, private mode)
  }
}

export default function AppUpdateBanner({ className = '', onVisibilityChange, onViewChangelog }: AppUpdateBannerProps) {
  const [availableVersion, setAvailableVersion] = useState<string | null>(null)
  const [buildTime, setBuildTime] = useState<string | null>(null)
  const [isRendered, setIsRendered] = useState(false)
  const [isActive, setIsActive] = useState(false)
  const [isUpdating, setIsUpdating] = useState(false)
  const exitTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  const hasFetchedVersion = useRef(false)

  // Use service worker as the single source of truth for update availability.
  // This eliminates race conditions between independent version polling and SW updates.
  const {
    needRefresh: [needRefresh],
    updateServiceWorker,
  } = useRegisterSW({
    onRegistered(registration?: ServiceWorkerRegistration) {
      // Check for updates every hour
      if (registration) {
        setInterval(() => {
          registration.update()
        }, 60 * 60 * 1000)
      }
    },
  })

  // When service worker detects an update, fetch version info for display
  useEffect(() => {
    if (!needRefresh || hasFetchedVersion.current || hasDismissedUpdate()) {
      return
    }

    hasFetchedVersion.current = true

    checkForUpdate({ currentVersion: CURRENT_VERSION })
      .then((result) => {
        if (result.hasUpdate) {
          setAvailableVersion(result.version)
          setBuildTime(result.buildTime)
        }
      })
      .catch((error) => {
        console.error('Failed to fetch version info:', error)
        // Still show banner even without version info
        setAvailableVersion('latest')
        setBuildTime(null)
      })
  }, [needRefresh])

  useEffect(() => {
    if (availableVersion) {
      if (exitTimerRef.current) {
        clearTimeout(exitTimerRef.current)
        exitTimerRef.current = null
      }
      setIsRendered(true)
      // Defer to next frame so transition runs
      requestAnimationFrame(() => setIsActive(true))
    } else if (isRendered) {
      setIsActive(false)
      exitTimerRef.current = setTimeout(() => {
        setIsRendered(false)
        exitTimerRef.current = null
      }, EXIT_ANIMATION_MS)
    }
  }, [availableVersion, isRendered])

  useEffect(() => {
    onVisibilityChange?.(Boolean(availableVersion))
  }, [availableVersion, onVisibilityChange])

  useEffect(() => {
    return () => {
      if (exitTimerRef.current) {
        clearTimeout(exitTimerRef.current)
        exitTimerRef.current = null
      }
    }
  }, [])

  if (!isRendered || !availableVersion) {
    return null
  }

  const handleDismiss = () => {
    markUpdateDismissed()
    setIsActive(false)
    exitTimerRef.current = setTimeout(() => {
      setAvailableVersion(null)
      setBuildTime(null)
      hasFetchedVersion.current = false
      exitTimerRef.current = null
    }, EXIT_ANIMATION_MS)
  }

  const handleRefresh = () => {
    setIsUpdating(true)
    // In prompt mode, the service worker has already downloaded the update
    // and is waiting. Calling updateServiceWorker(true) activates it and
    // reloads the page. This provides a single, coordinated reload.
    updateServiceWorker(true)
  }

  const formattedBuildTime = buildTime && !Number.isNaN(Date.parse(buildTime))
    ? new Date(buildTime).toLocaleString()
    : null

  return (
    <div
      className={`bg-amber-500 text-white shadow-lg border border-white/20 transition-all duration-300 transform ${
        isActive ? 'translate-y-0 opacity-100' : 'translate-y-4 opacity-0 pointer-events-none'
      } ${className}`}
      data-testid="app-update-banner"
    >
      <div className="max-w-7xl mx-auto px-4 py-3 sm:px-6 lg:px-8">
        <div className="flex items-start sm:items-center justify-between gap-4 flex-wrap">
          <div className="flex items-start sm:items-center gap-3">
            <Sparkles className="w-5 h-5 flex-shrink-0" aria-hidden="true" />
            <div>
              <p className="text-sm font-medium">
                App update available: {CURRENT_VERSION} → {availableVersion}
              </p>
              {formattedBuildTime && (
                <p className="text-xs text-amber-100 mt-1">
                  Deployed {formattedBuildTime}
                </p>
              )}
            </div>
          </div>
          <div className="flex items-center gap-3">
            {onViewChangelog && (
              <button
                onClick={() => onViewChangelog(availableVersion)}
                className="px-4 py-2 bg-amber-400/20 text-white border border-white/20 rounded-md text-sm font-medium hover:bg-amber-400/30 transition-colors"
              >
                View What&apos;s New
              </button>
            )}
            <button
              onClick={handleRefresh}
              disabled={isUpdating}
              className="px-4 py-2 bg-white text-amber-600 rounded-md text-sm font-medium hover:bg-amber-50 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isUpdating ? (
                <>
                  <Loader2 className="w-4 h-4 inline mr-1 animate-spin" aria-hidden="true" />
                  Updating...
                </>
              ) : (
                <>
                  <RefreshCw className="w-4 h-4 inline mr-1" aria-hidden="true" />
                  Refresh Now
                </>
              )}
            </button>
            <button
              onClick={handleDismiss}
              className="text-white hover:text-amber-100 transition-colors"
              aria-label="Dismiss app update notification"
            >
              <X className="w-5 h-5" aria-hidden="true" />
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}
