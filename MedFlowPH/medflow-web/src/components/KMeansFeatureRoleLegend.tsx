import { ChevronDown } from 'lucide-react'
import { useCallback, useEffect, useId, useRef, useState } from 'react'
import { KMEANS_FEATURE_ROLES } from '../data/kmeansFeatureRoles'

type KMeansFeatureRoleLegendProps = {
  /** Role key from the schema table `concept` column; highlights the matching card. */
  highlightedRole?: string | null
  className?: string
}

const HOVER_REVEAL_MS = 320

export function KMeansFeatureRoleLegend({
  highlightedRole = null,
  className = '',
}: KMeansFeatureRoleLegendProps) {
  const panelId = useId()
  const [pinned, setPinned] = useState(false)
  const [hoverRevealed, setHoverRevealed] = useState(false)
  const [hoverRevealBlocked, setHoverRevealBlocked] = useState(false)
  const hoverTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  const roleCardRefs = useRef<Map<string, HTMLElement>>(new Map())
  const expanded =
    pinned ||
    Boolean(highlightedRole) ||
    (hoverRevealed && !hoverRevealBlocked)

  const clearHoverTimer = useCallback(() => {
    if (hoverTimerRef.current) {
      clearTimeout(hoverTimerRef.current)
      hoverTimerRef.current = null
    }
  }, [])

  const scheduleHoverReveal = useCallback(() => {
    if (hoverRevealBlocked || pinned) return
    clearHoverTimer()
    hoverTimerRef.current = setTimeout(() => setHoverRevealed(true), HOVER_REVEAL_MS)
  }, [clearHoverTimer, hoverRevealBlocked, pinned])

  const cancelHoverReveal = useCallback(() => {
    clearHoverTimer()
    setHoverRevealed(false)
  }, [clearHoverTimer])

  const togglePinned = useCallback(() => {
    setPinned((wasPinned) => {
      if (wasPinned) {
        setHoverRevealBlocked(true)
        setHoverRevealed(false)
        clearHoverTimer()
        return false
      }
      setHoverRevealBlocked(false)
      return true
    })
  }, [clearHoverTimer])

  useEffect(() => {
    if (!highlightedRole || !expanded) return
    const el = roleCardRefs.current.get(highlightedRole)
    el?.scrollIntoView({ block: 'nearest', behavior: 'smooth' })
  }, [expanded, highlightedRole])

  return (
    <div className={`mt-3 ${className}`.trim()} aria-label="Concept legend">
      <div
        className={[
          'group rounded-xl border border-border/80 bg-card/85 shadow-sm backdrop-blur-md',
          'transition-[border-color,box-shadow] duration-200',
          'supports-[backdrop-filter]:bg-card/75',
          'hover:border-primary/40 hover:shadow-md',
          'dark:bg-card/80 dark:supports-[backdrop-filter]:bg-card/70',
        ].join(' ')}
        onMouseEnter={scheduleHoverReveal}
        onMouseLeave={() => {
          setHoverRevealBlocked(false)
          cancelHoverReveal()
        }}
        onBlur={(e) => {
          if (!e.currentTarget.contains(e.relatedTarget as Node | null)) {
            setHoverRevealBlocked(false)
            cancelHoverReveal()
          }
        }}
      >
        <button
          type="button"
          className={[
            'flex w-full cursor-pointer select-none items-center gap-2 px-3 py-2 text-left sm:px-4',
            'transition-colors hover:bg-muted/60',
            'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background',
            expanded ? 'border-b border-border/50' : '',
          ].join(' ')}
          aria-expanded={expanded}
          aria-controls={panelId}
          onClick={togglePinned}
        >
          <ChevronDown
            className={`h-4 w-4 shrink-0 text-muted-foreground transition-transform duration-200 ease-out ${
              expanded ? 'rotate-180' : ''
            }`}
            aria-hidden
          />
          <div className="min-w-0 flex-1">
            <p className="text-mf-caption font-semibold leading-snug text-foreground">
              Concept Legend
            </p>
            <p className="hidden text-[11px] leading-snug text-muted-foreground sm:block">
              Hover a role in the schema table to highlight its definition
            </p>
          </div>
          <span className="sr-only">
            {expanded ? 'Collapse concept legend' : 'Expand concept legend'}
          </span>
        </button>

        <div
          className={`grid min-h-0 transition-[grid-template-rows] duration-200 ease-out ${
            expanded ? 'grid-rows-[1fr]' : 'grid-rows-[0fr]'
          }`}
        >
          <div className="min-h-0 overflow-hidden">
            <div
              id={panelId}
              aria-hidden={!expanded}
              className="px-3 pb-3 pt-2 sm:px-4 sm:pb-4"
            >
              <p className="mb-2 text-[11px] leading-snug text-muted-foreground sm:hidden">
                Tap a role in the table, or expand to read definitions
              </p>
              <ul className="grid grid-cols-1 gap-2 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
                {KMEANS_FEATURE_ROLES.map(({ role, meaning, accentClass }) => {
                  const active = highlightedRole === role
                  return (
                    <li key={role}>
                      <article
                        ref={(node) => {
                          if (node) roleCardRefs.current.set(role, node)
                          else roleCardRefs.current.delete(role)
                        }}
                        data-role={role}
                        className={[
                          'rounded-lg border border-l-[3px] bg-muted/25 px-2.5 py-2 transition-[opacity,border-color,background-color] duration-200',
                          accentClass,
                          active
                            ? 'border-border/90 bg-muted/50 opacity-100 ring-1 ring-primary/25'
                            : 'border-border/50 opacity-90 hover:opacity-100',
                        ].join(' ')}
                      >
                        <p className="font-mono text-[11px] font-semibold leading-tight text-foreground">
                          {role}
                        </p>
                        <p className="mt-1 font-sans text-[11px] leading-snug text-muted-foreground">
                          {meaning}
                        </p>
                      </article>
                    </li>
                  )
                })}
              </ul>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
