function parseIntLoose(s: string): number | null {
  const normalized = s.replace(/,/g, '')
  const n = Number.parseInt(normalized, 10)
  return Number.isFinite(n) ? n : null
}

export type ParsedCleaningSummary = {
  generatedLine: string | null
  inputRows: number | null
  medicalFilterOutputRows: number | null
  afterCrossFileDedup: number | null
  featureRows: number | null
  featureColumns: number | null
}

/** Pulls key counts from `philgeps_cleaning_summary.txt` produced by the pipeline. */
export function parsePhilgepsCleaningSummary(raw: string | null): ParsedCleaningSummary {
  const empty: ParsedCleaningSummary = {
    generatedLine: null,
    inputRows: null,
    medicalFilterOutputRows: null,
    afterCrossFileDedup: null,
    featureRows: null,
    featureColumns: null,
  }

  if (!raw) return empty

  const gen = raw.match(/^Generated:\s*(.+)$/m)
  const input = raw.match(/^\s*input_rows:\s*([\d,]+)\s*$/m)
  const medOut = raw.match(/^\s*output_rows:\s*([\d,]+)\s*$/m)
  const dedup = raw.match(/After concat \+ cross-file drop_duplicates:\s*([\d,]+)\s*$/m)
  const shape = raw.match(/Shape:\s*([\d,]+)\s*rows\s*[×x]\s*([\d,]+)\s*columns/im)

  return {
    generatedLine: gen?.[1]?.trim() ?? null,
    inputRows: input?.[1] ? parseIntLoose(input[1]) : null,
    medicalFilterOutputRows: medOut?.[1] ? parseIntLoose(medOut[1]) : null,
    afterCrossFileDedup: dedup?.[1] ? parseIntLoose(dedup[1]) : null,
    featureRows: shape?.[1] ? parseIntLoose(shape[1]) : null,
    featureColumns: shape?.[2] ? parseIntLoose(shape[2]) : null,
  }
}

export function formatIntPh(n: number | null | undefined, fallback = '…'): string {
  if (n == null || !Number.isFinite(n)) return fallback
  return Intl.NumberFormat('en-PH').format(n)
}
