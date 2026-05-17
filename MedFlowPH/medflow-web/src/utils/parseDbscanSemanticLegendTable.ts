import type { DbscanLegendMarker, DbscanSemanticLegendEntry } from '../data/dbscanSemanticLegend'

export type DbscanLegendTableRow = {
  displayGroup: string
  clusterId: number
  semanticLabel: string
  rationale: string
  count: number
  sharePct: number
}

export type DbscanPlotLegendGroup = DbscanSemanticLegendEntry & {
  count: number
  sharePct: number
}

/** Plot trace colors — aligned with `repair_dbscan_interactive_from_rows.py` TRACE_SPECS. */
const PLOT_STYLE_BY_DISPLAY_PREFIX: { prefix: string; color: string; marker: DbscanLegendMarker }[] = [
  { prefix: 'Noise / outliers', color: 'rgb(199, 199, 199)', marker: 'x' },
  { prefix: 'C25:', color: 'rgb(152, 223, 138)', marker: 'circle' },
  { prefix: 'C0:', color: 'rgb(31, 119, 180)', marker: 'circle' },
  { prefix: 'C26:', color: 'rgb(214, 39, 40)', marker: 'circle' },
  { prefix: 'C119:', color: 'rgb(158, 218, 229)', marker: 'circle' },
  { prefix: 'C27:', color: 'rgb(255, 152, 150)', marker: 'circle' },
  { prefix: 'Other DBSCAN', color: 'rgb(140, 173, 209)', marker: 'dot' },
]

function plotStyleForDisplayGroup(displayGroup: string): Pick<DbscanSemanticLegendEntry, 'color' | 'marker'> {
  const match = PLOT_STYLE_BY_DISPLAY_PREFIX.find(({ prefix }) => displayGroup.startsWith(prefix))
  if (match) return { color: match.color, marker: match.marker }
  return { color: 'rgb(140, 173, 209)', marker: 'circle' }
}

function parseCount(raw: string): number {
  const n = Number.parseInt(raw.replace(/,/g, ''), 10)
  return Number.isFinite(n) ? n : 0
}

function parseSharePct(raw: string): number {
  const n = Number.parseFloat(raw.replace('%', '').trim())
  return Number.isFinite(n) ? n : 0
}

/** Parse `dbscan_semantic_legend_table.txt` (UTF-8 TSV from step 04B / 06b). */
export function parseDbscanSemanticLegendTable(text: string): DbscanLegendTableRow[] {
  const lines = text.split(/\r?\n/).map((l) => l.trim()).filter(Boolean)
  const headerIdx = lines.findIndex((l) => l.startsWith('Display group\t'))
  if (headerIdx < 0) return []

  const rows: DbscanLegendTableRow[] = []
  for (let i = headerIdx + 1; i < lines.length; i++) {
    const parts = lines[i].split('\t')
    if (parts.length < 6) continue
    const clusterId = Number.parseInt(parts[1], 10)
    if (!Number.isFinite(clusterId)) continue
    rows.push({
      displayGroup: parts[0],
      clusterId,
      semanticLabel: parts[2],
      rationale: parts[3],
      count: parseCount(parts[4]),
      sharePct: parseSharePct(parts[5]),
    })
  }
  return rows
}

/** Collapse table rows into grouped plot legend buckets (noise, top 5, other). */
export function buildDbscanPlotLegendGroups(rows: DbscanLegendTableRow[]): DbscanPlotLegendGroup[] {
  const order: string[] = []
  const byGroup = new Map<string, { count: number; sharePct: number }>()

  for (const row of rows) {
    if (!byGroup.has(row.displayGroup)) {
      order.push(row.displayGroup)
      byGroup.set(row.displayGroup, { count: 0, sharePct: 0 })
    }
    const agg = byGroup.get(row.displayGroup)!
    agg.count += row.count
    agg.sharePct += row.sharePct
  }

  return order.map((displayGroup) => {
    const agg = byGroup.get(displayGroup)!
    const style = plotStyleForDisplayGroup(displayGroup)
    return {
      label: displayGroup,
      color: style.color,
      marker: style.marker,
      count: agg.count,
      sharePct: agg.sharePct,
    }
  })
}
