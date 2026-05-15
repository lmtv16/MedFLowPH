import Papa from 'papaparse'
import { useEffect, useMemo, useState } from 'react'
import { PageTOC, TOC_EDA } from '../components/PageTOC'
import { ImageCard } from '../components/ImageCard'
import type { GalleryImage } from '../components/LightboxGallery'
import { LightboxGallery } from '../components/LightboxGallery'
import { MetricCard } from '../components/MetricCard'
import { HoverDisclosurePanel } from '../components/HoverDisclosurePanel'
import { PhilgepsRawSummaryView } from '../components/PhilgepsRawSummaryView'
import { PageShell } from '../components/PageShell'
import { SectionWrapper } from '../components/SectionWrapper'
import { IMAGES } from '../data/fileManifest'

// Raw Understanding
const RAW_SCHEMA = '/results/00/Raw Dataset Schema/philgeps_raw_schema_table.png'
const RAW_SCHEMA_TABLE = '/results/00/Raw Dataset Schema/philgeps_raw_schema_table.txt'
const RAW_SCHEMA_TABLE_CSV = '/results/00/Raw Dataset Schema/philgeps_raw_schema_table.csv'
const RAW_SUMMARY = '/results/00/Summaries/philgeps_understanding_summary.txt'

const RAW_SCHEMA_TABLE_CSV_COLUMNS: readonly string[] = [
  'canonical_position',
  'column_name',
  'pandas_dtype',
  'row_count',
  'null_count',
  'null_pct',
  'non_null_count',
  'kmeans_feature_role',
]

const RAW_SCHEMA_CSV_HEADER_LABELS: Record<string, string> = {
  canonical_position: '#',
  column_name: 'Column',
  pandas_dtype: 'dtype',
  row_count: 'Rows',
  null_count: 'Nulls',
  null_pct: 'Null %',
  non_null_count: 'Non-null',
  kmeans_feature_role: 'K-means role',
}


const heroMetrics = [
  { label: 'Raw Records', value: '8,414,861' },
  { label: 'Final Cleaned Medical Records', value: '487,605' },
  { label: 'Raw Schema Columns', value: '46' },
  { label: 'Cleaned Dataset Columns', value: '61' },
  { label: 'Processed Quarter Segments', value: '20' },
  { label: 'Duplicate Rows Detected', value: '1,546,639' },
]

const quarterPresets = Object.keys(IMAGES.eda.byQuarter).sort()

const QUARTER_KEY_SET = new Set(quarterPresets)

function sortedQuarterYears(keys: readonly string[]): number[] {
  const ys = new Set<number>()
  for (const k of keys) {
    const m = /^(\d+)-Q(\d+)$/.exec(k)
    if (m) ys.add(Number(m[1]))
  }
  return [...ys].sort((a, b) => a - b)
}

const QUARTER_YEARS = sortedQuarterYears(quarterPresets)

/** Preamble lines from the .txt export — everything before the fixed-width table. */
function rawSchemaTxtPreambleLines(text: string): string[] {
  const lines = text.replace(/\r\n/g, '\n').replace(/\r/g, '\n').split('\n')
  const out: string[] = []
  for (const line of lines) {
    if (/^\s*canonical_position\s+/.test(line)) break
    if (line.trim()) out.push(line.trimEnd())
  }
  return out
}

function parseRawSchemaTableCsv(raw: string): { headers: string[]; rows: string[][] } | null {
  const parsed = Papa.parse<Record<string, string>>(raw, {
    header: true,
    skipEmptyLines: 'greedy',
    transformHeader: (h) => h.trim(),
  })
  if (parsed.errors.length && !parsed.data.length) return null
  const fields = parsed.meta.fields?.filter(Boolean) ?? []
  if (!fields.length || !parsed.data.length) return null

  const headers = RAW_SCHEMA_TABLE_CSV_COLUMNS.filter((k) => fields.includes(k))
  if (!headers.length) return null

  const rows = parsed.data
    .map((rec) => headers.map((h) => (rec[h] ?? '').trim()))
    .filter((row) => row.some((c) => c.length > 0))
  if (!rows.length) return null

  return { headers, rows }
}

function useFetchedText(url: string) {
  const [text, setText] = useState<string | null>(null)
  const [failed, setFailed] = useState(false)

  useEffect(() => {
    let cancelled = false
    fetch(url)
      .then((r) => {
        if (!r.ok) throw new Error(String(r.status))
        return r.text()
      })
      .then((t) => {
        if (!cancelled) setText(t)
      })
      .catch(() => {
        if (!cancelled) setFailed(true)
      })
    return () => {
      cancelled = true
    }
  }, [url])

  return { text, failed }
}

function RawSchemaPngFigure({ src, title }: { src: string; title: string }) {
  const [missing, setMissing] = useState(false)

  if (missing) {
    return (
      <p className="mb-4 text-mf-caption text-muted-foreground">
        Raw dataset schema image is not available. The monospace export below lists the same columns.
      </p>
    )
  }

  return (
    <figure className="mb-4 min-w-0">
      <img
        src={src}
        alt={title}
        loading="lazy"
        decoding="async"
        className="max-h-[min(70vh,28rem)] w-full max-w-full rounded-xl border border-border bg-card object-contain object-left shadow-sm"
        onError={() => setMissing(true)}
      />
    </figure>
  )
}

export function EDA() {
  const [quarterKey, setQuarterKey] = useState<string | null>(null)
  const [gallery, setGallery] = useState<{ images: GalleryImage[]; idx: number }>({
    images: [],
    idx: 0,
  })

  const rawSummary = useFetchedText(RAW_SUMMARY)
  const rawSchemaTable = useFetchedText(RAW_SCHEMA_TABLE)
  const rawSchemaTableCsv = useFetchedText(RAW_SCHEMA_TABLE_CSV)

  const rawSchemaPreamble = useMemo(
    () => (rawSchemaTable.text ? rawSchemaTxtPreambleLines(rawSchemaTable.text) : []),
    [rawSchemaTable.text],
  )

  const rawSchemaCsvTable = useMemo(
    () => (rawSchemaTableCsv.text ? parseRawSchemaTableCsv(rawSchemaTableCsv.text) : null),
    [rawSchemaTableCsv.text],
  )

  const rawSchemaBlock = useMemo(() => {
    const csvPending = !rawSchemaTableCsv.text && !rawSchemaTableCsv.failed
    if (csvPending) {
      return <p className="text-mf-caption text-muted-foreground">Loading schema table…</p>
    }
    if (rawSchemaCsvTable) {
      const colNameIdx = rawSchemaCsvTable.headers.indexOf('column_name')
      return (
        <>
          {rawSchemaPreamble.length > 0 && (
            <div className="mb-3 space-y-1 text-mf-caption leading-snug text-muted-foreground">
              {rawSchemaPreamble.map((line, i) => (
                <p key={i}>{line}</p>
              ))}
            </div>
          )}
          <div className="max-h-[min(55vh,36rem)] overflow-auto rounded-lg border border-border bg-card">
            <table className="w-max min-w-full border-collapse text-left font-mono text-mf-caption leading-snug text-foreground">
              <thead className="sticky top-0 z-10 border-b border-border bg-muted">
                <tr>
                  {rawSchemaCsvTable.headers.map((h) => (
                    <th key={h} className="whitespace-nowrap px-2 py-2 font-semibold text-foreground">
                      {RAW_SCHEMA_CSV_HEADER_LABELS[h] ?? h}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {rawSchemaCsvTable.rows.map((row, ri) => (
                  <tr key={ri} className={ri % 2 === 1 ? 'bg-muted/30' : 'bg-card'}>
                    {row.map((cell, ci) => (
                      <td
                        key={ci}
                        className={`border-t border-border px-2 py-1.5 ${ci === colNameIdx && colNameIdx >= 0 ? 'max-w-[min(28rem,55vw)] whitespace-normal break-words' : 'whitespace-nowrap'}`}
                      >
                        {cell}
                      </td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </>
      )
    }
    if (rawSchemaTable.text) {
      return (
        <pre className="max-h-[min(55vh,36rem)] overflow-auto rounded-lg border border-border bg-card p-3 font-mono text-mf-caption leading-snug text-foreground whitespace-pre">
          {rawSchemaTable.text}
        </pre>
      )
    }
    const txtPending = !rawSchemaTable.text && !rawSchemaTable.failed
    if (txtPending) {
      return <p className="text-mf-caption text-muted-foreground">Loading schema table…</p>
    }
    if (rawSchemaTableCsv.text && !rawSchemaCsvTable) {
      return (
        <p className="text-mf-caption text-muted-foreground">Schema CSV could not be parsed; try refreshing the page.</p>
      )
    }
    return <p className="text-mf-caption text-muted-foreground">Schema table files could not be loaded.</p>
  }, [
    rawSchemaCsvTable,
    rawSchemaPreamble,
    rawSchemaTable.failed,
    rawSchemaTable.text,
    rawSchemaTableCsv.failed,
    rawSchemaTableCsv.text,
  ])

  const quarterlyImages = useMemo(
    () => (quarterKey ? IMAGES.eda.byQuarter[quarterKey] ?? [] : []),
    [quarterKey],
  )

  function openQuarterly(i: number) {
    const images = quarterlyImages.map((item) => ({ src: item.src, title: item.title }))
    setGallery({ images, idx: i })
  }

  return (
    <PageShell>
      <div className="flex gap-8">
        <main className="min-w-0 flex-1 space-y-12 overflow-x-hidden pb-16">
          <div className="space-y-12">
            <SectionWrapper id="du-hero">
              <h1 className="mb-2 font-heading text-mf-page-title font-bold text-foreground">
                Data Understanding
              </h1>
              <p className="mb-3 text-mf-page-lead font-medium text-primary">
                Exploring and preparing PhilGEPS medical procurement data before clustering.
              </p>
              <p className="mb-6 max-w-3xl text-mf-body leading-relaxed text-muted-foreground">
                This section explains how the raw PhilGEPS procurement records were examined, cleaned, transformed, and
                prepared for unsupervised clustering. The process started from millions of raw procurement records,
                filtered them into medical-related purchases, handled data quality issues, engineered useful features,
                and prepared the dataset for PCA, K-means, and DBSCAN analysis.
              </p>
              <div className="mb-4 grid grid-cols-2 gap-4 md:grid-cols-3 lg:grid-cols-6">
                {heroMetrics.map((m) => (
                  <MetricCard key={m.label} label={m.label} value={m.value} />
                ))}
              </div>
              <p className="text-mf-caption italic text-muted-foreground">
                These numbers describe the dataset preparation stage and are not yet the final clustering result.
              </p>
            </SectionWrapper>

            <SectionWrapper id="du-raw" title="Raw Dataset Understanding">
              <div className="mb-6 space-y-4 text-mf-body leading-relaxed text-muted-foreground">
                <p>
                  This table shows the original structure of the PhilGEPS procurement dataset before cleaning. The raw
                  data contained{' '}
                  <strong className="font-semibold text-foreground">8,414,861 records</strong> across the processed
                  quarter files and followed a 46-column procurement schema.
                </p>
                <p>
                  Each column was profiled based on data type, missing values, non-null values, and possible use in
                  clustering. Some fields were marked as numeric-ready, such as budget, quantity, item budget, and
                  contract amount. Some fields were marked as date-derivable, such as published date, closing date,
                  award date, and contract dates. Other fields were classified as categorical, high-cardinality text,
                  or identifiers.
                </p>
                <p>
                  The table shows that the raw dataset was large and useful, but not yet ready for clustering. Several
                  award and contract-related fields had high missing values, so the data needed cleaning and
                  preprocessing before analysis.
                </p>
              </div>
              <RawSchemaPngFigure src={RAW_SCHEMA} title="Raw dataset schema (tabular overview)" />
              <div className="mt-4 rounded-xl border border-border bg-muted/40 p-4">
                {rawSchemaBlock}
              </div>

              <SectionWrapper id="eda-quarter" title="By quarter">
                <div className="rounded-2xl border border-border bg-card p-5 shadow-sm">
                  <div className="flex flex-wrap items-center justify-between gap-x-4 gap-y-2">
                    <p className="text-sm font-medium text-muted-foreground">Quarter filter</p>
                    <div className="flex shrink-0 items-center gap-2 rounded-lg border border-primary/25 bg-primary/5 px-2 py-1 shadow-sm dark:border-primary/35 dark:bg-primary/10">
                      <span className="text-[11px] font-medium text-foreground">Quarterly view</span>
                      <button
                        type="button"
                        role="switch"
                        aria-checked={quarterKey !== null}
                        aria-label={
                          quarterKey !== null
                            ? 'Quarterly view on; click to turn off'
                            : 'Quarterly view off; click to turn on'
                        }
                        className={`relative inline-flex h-5 w-9 shrink-0 cursor-pointer rounded-full border border-transparent transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-1 focus-visible:ring-offset-background ${
                          quarterKey !== null ? 'bg-primary' : 'bg-muted-foreground/35'
                        }`}
                        onClick={() =>
                          setQuarterKey(quarterKey !== null ? null : (quarterPresets[0] ?? null))
                        }
                      >
                        <span
                          className={`pointer-events-none absolute top-0.5 h-3.5 w-3.5 rounded-full bg-card shadow-sm transition-[left] duration-200 ease-out ${
                            quarterKey !== null ? 'left-[calc(100%-1.125rem)]' : 'left-0.5'
                          }`}
                          aria-hidden
                        />
                      </button>
                      <span
                        className={`min-w-[1.25rem] text-[10px] font-semibold tabular-nums ${
                          quarterKey !== null ? 'text-primary' : 'text-muted-foreground'
                        }`}
                      >
                        {quarterKey !== null ? 'On' : 'Off'}
                      </span>
                    </div>
                  </div>

                  <div className="mt-3 grid grid-cols-1 gap-2 sm:grid-cols-2 lg:grid-cols-3">
                    {QUARTER_YEARS.map((year) => (
                      <div
                        key={year}
                        className="flex min-w-0 items-center gap-2 rounded-lg border border-border/60 bg-muted/25 px-2.5 py-1.5"
                      >
                        <span className="w-9 shrink-0 text-xs font-bold tabular-nums text-foreground">
                          {year}
                        </span>
                        <div className="flex min-w-0 flex-1 flex-wrap items-center gap-x-1 gap-y-0.5">
                          {[1, 2, 3, 4].map((q) => {
                            const key = `${year}-Q${q}`
                            const exists = QUARTER_KEY_SET.has(key)
                            const active = quarterKey === key
                            return (
                              <span
                                key={key}
                                className={`inline-flex items-center gap-px ${
                                  exists ? '' : 'opacity-40'
                                }`}
                              >
                                <span className="select-none text-[10px] text-muted-foreground" aria-hidden>
                                  [
                                </span>
                                <button
                                  type="button"
                                  disabled={!exists}
                                  className={`min-w-[2rem] px-1 py-px text-center text-[11px] font-bold tabular-nums transition-colors ${
                                    !exists
                                      ? 'cursor-not-allowed text-muted-foreground/50'
                                      : active
                                        ? 'rounded-sm bg-mf-secondary text-primary-foreground'
                                        : 'rounded-sm text-foreground underline decoration-muted-foreground/40 decoration-1 underline-offset-2 hover:bg-muted hover:decoration-transparent'
                                  }`}
                                  onClick={() => exists && setQuarterKey(key)}
                                >
                                  Q{q}
                                </button>
                                <span className="select-none text-[10px] text-muted-foreground" aria-hidden>
                                  ]
                                </span>
                              </span>
                            )
                          })}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                {quarterKey ? (
                  <section className="mt-10">
                    <h3 className="text-lg font-semibold text-foreground">
                      Quarterly exploratory figures — <span className="text-mf-primary">{quarterKey}</span>
                    </h3>
                    <div className="mt-6 grid grid-cols-1 gap-6 sm:grid-cols-2">
                      {quarterlyImages.map((item, i) => (
                        <ImageCard
                          key={item.src}
                          src={item.src}
                          title={item.title}
                          titleDisclosure
                          onClick={() => openQuarterly(i)}
                        />
                      ))}
                    </div>
                  </section>
                ) : null}
              </SectionWrapper>

              <HoverDisclosurePanel
                className="mt-6"
                label="Raw summary"
                revealTrigger="hold"
                holdDurationMs={400}
                expandAria="Press and hold to preview raw summary; click to pin open"
                collapseAria="Collapse raw summary"
              >
                {rawSummary.text ? (
                  <div className="max-h-[min(70vh,44rem)] overflow-auto rounded-lg border border-border bg-card p-3">
                    <PhilgepsRawSummaryView text={rawSummary.text} />
                  </div>
                ) : rawSummary.failed ? (
                  <p className="text-mf-caption text-muted-foreground">Summary file could not be loaded.</p>
                ) : (
                  <p className="text-mf-caption text-muted-foreground">Loading summary…</p>
                )}
              </HoverDisclosurePanel>
            </SectionWrapper>

            <SectionWrapper id="du-conclusion" title="Data Understanding Summary">
              <div className="rounded-2xl border border-border bg-muted/70 p-8 text-mf-body text-foreground">
                <p className="leading-relaxed">
                  This walkthrough traced PhilGEPS medical procurement data from raw chaos—millions of heterogeneous rows
                  and forty-six administrative columns—through disciplined cleaning, exploratory validation, and structured
                  preprocessing that prepares a{' '}
                  <span className="font-semibold text-primary">487,605</span>-row tensor ready for PCA-backed clustering.
                </p>
                <p className="mt-4 text-mf-body leading-relaxed">
                  <span className="font-semibold text-primary">K-means</span> delivers a compact six-cluster story that
                  pairs cleanly with policy-theme overlays, whereas{' '}
                  <span className="font-semibold text-mf-secondary">DBSCAN</span> exposes dense procurement islands alongside a
                  substantial noise reservoir—choose <span className="font-semibold text-primary">K-means</span> when
                  executives need stable cohort labels and leverage{' '}
                  <span className="font-semibold text-mf-secondary">DBSCAN</span> when investigators must audit outliers or hunt
                  for micro-patterns before collapsing segments downstream.
                </p>
              </div>
            </SectionWrapper>


            <LightboxGallery
              images={gallery.images}
              index={gallery.idx}
              open={gallery.images.length > 0}
              onClose={() => setGallery({ images: [], idx: 0 })}
            />
          </div>
        </main>

        <aside className="medflow-no-print hidden w-48 shrink-0 xl:block">
          <PageTOC sections={TOC_EDA} />
        </aside>
      </div>
    </PageShell>
  )
}
