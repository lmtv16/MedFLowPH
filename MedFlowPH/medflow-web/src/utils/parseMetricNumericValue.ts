export type ParsedMetricNumber = {
  target: number
  decimals: number
  /** True when the original numeric token used grouping commas (en-PH style). */
  useGrouping: boolean
  /** Trailing literal after the numeric token (e.g. " %" or "%"). */
  suffix: string
}

/** Parse a single display number (and optional suffix) from MetricCard `value` strings. */
export function parseMetricNumericValue(raw: string): ParsedMetricNumber | null {
  const s = raw.trim()
  if (!s) return null
  if (s === '…' || s === '...' || s === '—' || s === '-') return null

  const m = s.match(/^([\d,]+(?:\.\d+)?)(.*)$/)
  if (!m?.[1]) return null

  const token = m[1]
  const suffixRaw = m[2] ?? ''
  const suffixTrim = suffixRaw.trim()
  if (suffixTrim.length > 0 && suffixTrim !== '%') {
    return null
  }
  const suffix = suffixRaw

  const normalized = token.replace(/,/g, '')
  const target = Number(normalized)
  if (!Number.isFinite(target)) return null

  const decMatch = token.match(/\.(\d+)$/)
  const decimals = decMatch ? decMatch[1].length : 0
  const useGrouping = token.includes(',')

  return { target, decimals, useGrouping, suffix }
}

export function formatMetricDisplay(n: number, p: ParsedMetricNumber): string {
  if (p.decimals > 0) {
    return n.toFixed(p.decimals) + p.suffix
  }
  if (p.useGrouping) {
    return Intl.NumberFormat('en-PH').format(Math.round(n)) + p.suffix
  }
  return String(Math.round(n)) + p.suffix
}
