import { ChevronDown } from 'lucide-react'
import { useId, useState } from 'react'
import { KMEANS_FEATURE_ROLES } from '../data/kmeansFeatureRoles'
import { useMediaQuery } from '../hooks/useMediaQuery'

type KMeansFeatureRoleLegendProps = {
  /** Role key from the schema table `concept` column; highlights the matching card. */
  highlightedRole?: string | null
  className?: string
}

export function KMeansFeatureRoleLegend({
  highlightedRole = null,
  className = '',
}: KMeansFeatureRoleLegendProps) {
  const panelId = useId()
  const isDesktop = useMediaQuery('(min-width: 768px)')
  const [userExpanded, setUserExpanded] = useState<boolean | null>(null)
  const expanded = userExpanded ?? isDesktop

  return (
    <div
      className={`sticky bottom-0 z-[5] mt-3 border-t border-border/60 pt-3 ${className}`.trim()}
      aria-label="Concept legend"
    >
      <div
        className={[
          'rounded-xl border border-border/80 bg-card/85 shadow-sm backdrop-blur-md',
          'supports-[backdrop-filter]:bg-card/75',
          'dark:bg-card/80 dark:supports-[backdrop-filter]:bg-card/70',
        ].join(' ')}
      >
        <div className="flex items-center gap-2 border-b border-border/50 px-3 py-2 sm:px-4">
          <button
            type="button"
            className="flex min-h-9 min-w-9 shrink-0 items-center justify-center rounded-md text-muted-foreground transition-colors hover:bg-muted/60 hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background"
            aria-expanded={expanded}
            aria-controls={panelId}
            onClick={() => setUserExpanded(!expanded)}
          >
            <ChevronDown
              className={`h-4 w-4 transition-transform duration-200 ${expanded ? 'rotate-180' : ''}`}
              aria-hidden
            />
            <span className="sr-only">
              {expanded ? 'Collapse concept legend' : 'Expand concept legend'}
            </span>
          </button>
          <div className="min-w-0 flex-1">
            <p className="text-mf-caption font-semibold leading-snug text-foreground">
              Concept Legend
            </p>
            <p className="hidden text-[11px] leading-snug text-muted-foreground sm:block">
              Hover a role in the schema table to highlight its definition
            </p>
          </div>
        </div>

        <div
          id={panelId}
          hidden={!expanded}
          className={expanded ? 'px-3 pb-3 pt-2 sm:px-4 sm:pb-4' : 'hidden'}
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
  )
}
