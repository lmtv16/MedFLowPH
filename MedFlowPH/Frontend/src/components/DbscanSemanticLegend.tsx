import { ChevronDown } from 'lucide-react'
import { useMemo } from 'react'
import type { DbscanSemanticLegendEntry } from '../data/dbscanSemanticLegend'
import { DBSCAN_SEMANTIC_LEGEND_ENTRIES } from '../data/dbscanSemanticLegend'
import { DATA_PATHS } from '../data/fileManifest'
import { useTextData } from '../hooks/useCsvData'
import {
  buildDbscanPlotLegendGroups,
  parseDbscanSemanticLegendTable,
  type DbscanPlotLegendGroup,
} from '../utils/parseDbscanSemanticLegendTable'

function LegendSwatch({ color, marker }: Pick<DbscanSemanticLegendEntry, 'color' | 'marker'>) {
  if (marker === 'x') {
    return (
      <span
        className="inline-flex h-4 w-4 shrink-0 items-center justify-center text-[13px] font-bold leading-none"
        style={{ color }}
        aria-hidden
      >
        ×
      </span>
    )
  }
  if (marker === 'dot') {
    return (
      <span
        className="inline-block h-1.5 w-1.5 shrink-0 rounded-full"
        style={{ backgroundColor: color }}
        aria-hidden
      />
    )
  }
  return (
    <span
      className="inline-block h-3 w-3 shrink-0 rounded-full"
      style={{ backgroundColor: color }}
      aria-hidden
    />
  )
}

function formatCount(n: number): string {
  return n.toLocaleString('en-US')
}

type DbscanSemanticLegendProps = {
  entries?: DbscanSemanticLegendEntry[]
  className?: string
}

/** Legend for the semantic DBSCAN PCA plot — loaded from `results/04Bdev/PCA_Cluster/dbscan_semantic_legend_table.txt`. */
export function DbscanSemanticLegend({ entries, className = '' }: DbscanSemanticLegendProps) {
  const { text, loading, error } = useTextData(DATA_PATHS.dbscanSemanticLegendTable)

  const resolvedEntries = useMemo((): DbscanPlotLegendGroup[] | DbscanSemanticLegendEntry[] | null => {
    if (entries) return entries
    if (!text) return null
    const rows = parseDbscanSemanticLegendTable(text)
    if (!rows.length) return DBSCAN_SEMANTIC_LEGEND_ENTRIES
    return buildDbscanPlotLegendGroups(rows)
  }, [entries, text])

  const showStats =
    resolvedEntries !== null &&
    resolvedEntries.length > 0 &&
    'count' in resolvedEntries[0]

  return (
    <details
      className={`group rounded-xl border border-border bg-card/80 shadow-sm ${className}`.trim()}
      aria-label="DBSCAN semantic plot legend"
    >
      <summary className="flex cursor-pointer list-none items-center gap-2 px-3 py-3 outline-none marker:content-none sm:px-4 [&::-webkit-details-marker]:hidden">
        <ChevronDown
          className="h-3.5 w-3.5 shrink-0 text-muted-foreground transition-transform group-open:rotate-180"
          aria-hidden
        />
        <span className="text-mf-caption font-semibold text-foreground">Plot legend</span>
      </summary>
      <div className="space-y-2 px-3 pb-3 sm:px-4">
      {error ? (
        <p className="text-[11px] text-destructive">Could not load DBSCAN legend table.</p>
      ) : null}
      {resolvedEntries ? (
        <ul className="grid grid-cols-1 gap-2 sm:grid-cols-2 lg:grid-cols-3">
          {resolvedEntries.map((entry) => (
            <li key={entry.label} className="flex min-w-0 items-start gap-2">
              <span className="mt-0.5 shrink-0">
                <LegendSwatch color={entry.color} marker={entry.marker} />
              </span>
              <span className="min-w-0 flex-1 text-[11px] leading-snug text-muted-foreground">
                <span className="block text-foreground/90">{entry.label}</span>
                {showStats && 'count' in entry ? (
                  <span className="mt-0.5 block tabular-nums text-[10px] text-muted-foreground/90">
                    {formatCount(entry.count)} records ({entry.sharePct.toFixed(3)}%)
                  </span>
                ) : null}
              </span>
            </li>
          ))}
        </ul>
      ) : loading ? (
        <p className="text-[11px] text-muted-foreground">Loading plot legend…</p>
      ) : null}
      </div>
    </details>
  )
}

