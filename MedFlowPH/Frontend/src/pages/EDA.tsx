import { useEffect, useMemo, useState } from 'react'
import { PageTOC, TOC_EDA } from '../components/PageTOC'
import { ImageCard } from '../components/ImageCard'
import type { GalleryImage } from '../components/LightboxGallery'
import { LightboxGallery } from '../components/LightboxGallery'
import { MetricCard } from '../components/MetricCard'
import { HoverDisclosurePanel } from '../components/HoverDisclosurePanel'
import { KMeansFeatureRoleLegend } from '../components/KMeansFeatureRoleLegend'
import { PhilgepsRawSummaryView } from '../components/PhilgepsRawSummaryView'
import { KMEANS_FEATURE_ROLE_SET } from '../data/kmeansFeatureRoles'
import { PageShell } from '../components/PageShell'
import { SectionWrapper } from '../components/SectionWrapper'
import { IMAGES } from '../data/fileManifest'

// Raw Understanding
const RAW_SCHEMA = '/results/00/Raw Dataset Schema/philgeps_raw_schema_table.png'
const RAW_SCHEMA_TXT = '/results/00/Raw Dataset Schema/philgeps_raw_schema.txt'
const RAW_SUMMARY = '/results/00/Summaries/philgeps_understanding_summary.txt'

const RAW_SCHEMA_HEADERS: readonly string[] = [
  'canonical_position',
  'column_name',
  'in_canonical_46',
  'pandas_dtype',
  'row_count',
  'null_count',
  'null_pct',
  'non_null_count',
  'nunique_non_null',
  'nunique_how',
  'kmeans_feature_role',
]

const RAW_SCHEMA_HEADER_LABELS: Record<string, string> = {
  canonical_position: '#',
  column_name: 'Column',
  in_canonical_46: 'In canonical 46',
  pandas_dtype: 'dtype',
  row_count: 'Rows',
  null_count: 'Nulls',
  null_pct: 'Null %',
  non_null_count: 'Non-null',
  nunique_non_null: 'nunique (non-null)',
  nunique_how: 'nunique how',
  kmeans_feature_role: 'Concepts',
}

const KMEANS_ROLE_PATTERN = [...KMEANS_FEATURE_ROLE_SET].join('|')


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

/** Preamble + full schema table from philgeps_raw_schema.txt (whitespace export). */
function parsePhilgepsRawSchemaTxt(text: string): {
  preamble: string[]
  headers: string[]
  rows: string[][]
} | null {
  const lines = text.replace(/\r\n/g, '\n').replace(/\r/g, '\n').split('\n')
  let headerIdx = -1
  for (let i = 0; i < lines.length; i++) {
    if (/^\s*canonical_position\b/.test(lines[i])) {
      headerIdx = i
      break
    }
  }
  if (headerIdx < 0) return null

  const preamble = lines
    .slice(0, headerIdx)
    .map((l) => l.trimEnd())
    .filter((l) => l.trim())
  const rowRe = new RegExp(
    `^\\s*(\\d+)\\s+(.+?)\\s+(True|False)\\s+(float64|object)\\s+(\\d+)\\s+(\\d+)\\s+([\\d.]+)\\s+(\\d+)\\s+(.+?)\\s+(${KMEANS_ROLE_PATTERN})\\s*$`,
  )
  const rows: string[][] = []

  for (let i = headerIdx + 1; i < lines.length; i++) {
    const line = lines[i]
    if (!line.trim()) continue
    const m = line.match(rowRe)
    if (!m) continue
    const [, pos, colName, inCanon, dtype, rowCount, nullCount, nullPct, nonNull, nuniqueRest, role] =
      m
    const nuniqueParts = nuniqueRest.trim().split(/\s{2,}/).filter(Boolean)
    const nuniqueNonNull = nuniqueParts[0] ?? ''
    const nuniqueHow = nuniqueParts[1] ?? nuniqueNonNull
    rows.push([
      pos,
      colName.trim(),
      inCanon,
      dtype,
      rowCount,
      nullCount,
      nullPct,
      nonNull,
      nuniqueNonNull,
      nuniqueHow,
      role,
    ])
  }

  if (!rows.length) return null
  return { preamble, headers: [...RAW_SCHEMA_HEADERS], rows }
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
  const [highlightedFeatureRole, setHighlightedFeatureRole] = useState<string | null>(null)
  const [gallery, setGallery] = useState<{ images: GalleryImage[]; idx: number }>({
    images: [],
    idx: 0,
  })

  const rawSummary = useFetchedText(RAW_SUMMARY)
  const rawSchemaTxt = useFetchedText(RAW_SCHEMA_TXT)

  const rawSchemaTable = useMemo(
    () => (rawSchemaTxt.text ? parsePhilgepsRawSchemaTxt(rawSchemaTxt.text) : null),
    [rawSchemaTxt.text],
  )

  const rawSchemaBlock = useMemo(() => {
    const pending = !rawSchemaTxt.text && !rawSchemaTxt.failed
    if (pending) {
      return <p className="text-mf-caption text-muted-foreground">Loading schema table…</p>
    }
    if (rawSchemaTable) {
      const colNameIdx = rawSchemaTable.headers.indexOf('column_name')
      const roleIdx = rawSchemaTable.headers.indexOf('kmeans_feature_role')
      const nuniqueIdx = rawSchemaTable.headers.indexOf('nunique_non_null')
      const nuniqueHowIdx = rawSchemaTable.headers.indexOf('nunique_how')
      return (
        <>
          {rawSchemaTable.preamble.length > 0 && (
            <div className="mb-3 space-y-1 text-mf-caption leading-snug text-muted-foreground">
              {rawSchemaTable.preamble.map((line, i) => (
                <p key={i}>{line}</p>
              ))}
            </div>
          )}
          <div className="mf-table-scroll max-h-[min(55vh,36rem)] overflow-auto rounded-lg border border-border bg-card">
            <table className="w-max min-w-full border-collapse text-left font-mono text-mf-caption leading-snug text-foreground">
              <thead className="sticky top-0 z-10 border-b border-border bg-muted">
                <tr>
                  {rawSchemaTable.headers.map((h) => (
                    <th key={h} className="whitespace-nowrap px-2 py-2 font-semibold text-foreground">
                      {RAW_SCHEMA_HEADER_LABELS[h] ?? h}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {rawSchemaTable.rows.map((row, ri) => (
                  <tr key={ri} className={ri % 2 === 1 ? 'bg-muted/30' : 'bg-card'}>
                    {row.map((cell, ci) => {
                      const isRole =
                        ci === roleIdx && roleIdx >= 0 && KMEANS_FEATURE_ROLE_SET.has(cell)
                      const isWideText =
                        ci === colNameIdx || ci === nuniqueIdx || ci === nuniqueHowIdx
                      return (
                        <td
                          key={ci}
                          className={[
                            'border-t border-border px-2 py-1.5',
                            isWideText
                              ? 'max-w-[min(28rem,55vw)] whitespace-normal break-words'
                              : 'whitespace-nowrap',
                            isRole ? 'cursor-help transition-colors hover:bg-muted/50' : '',
                          ].join(' ')}
                          onMouseEnter={isRole ? () => setHighlightedFeatureRole(cell) : undefined}
                          onMouseLeave={isRole ? () => setHighlightedFeatureRole(null) : undefined}
                        >
                          {cell}
                        </td>
                      )
                    })}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <KMeansFeatureRoleLegend highlightedRole={highlightedFeatureRole} />
        </>
      )
    }
    if (rawSchemaTxt.text && !rawSchemaTable) {
      return (
        <p className="text-mf-caption text-muted-foreground">
          Schema file could not be parsed; try refreshing the page.
        </p>
      )
    }
    return <p className="text-mf-caption text-muted-foreground">Schema table file could not be loaded.</p>
  }, [highlightedFeatureRole, rawSchemaTable, rawSchemaTxt.failed, rawSchemaTxt.text])

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
              This phase reviews raw PhilGEPS medical-related procurement data to check for missing
              values, duplicates, and inconsistent formats. Key features examined include Contract Amount, 
              Item Budget, Approved Budget of the Contract, and Quantity. Patterns in these features, along 
              with regions and agencies, are explored to select relevant variables. The output guides data 
              cleaning and preparation for PCA, K-means, and DBSCAN clustering. 
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
                    <button
                      type="button"
                      role="switch"
                      aria-checked={quarterKey !== null}
                      aria-label={
                        quarterKey !== null
                          ? 'Quarterly view on; click to turn off'
                          : 'Quarterly view off; click to turn on'
                      }
                      className="flex shrink-0 cursor-pointer items-center gap-2 rounded-lg border border-primary/25 bg-primary/5 px-2 py-1 shadow-sm transition-colors hover:border-primary/40 hover:bg-primary/10 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-1 focus-visible:ring-offset-background dark:border-primary/35 dark:bg-primary/10 dark:hover:bg-primary/15"
                      onClick={() =>
                        setQuarterKey(quarterKey !== null ? null : (quarterPresets[0] ?? null))
                      }
                    >
                      <span className="text-[11px] font-medium text-foreground">Quarterly view</span>
                      <span
                        className={`relative inline-flex h-5 w-9 shrink-0 rounded-full border border-transparent transition-colors ${
                          quarterKey !== null ? 'bg-primary' : 'bg-muted-foreground/35'
                        }`}
                        aria-hidden
                      >
                        <span
                          className={`absolute top-0.5 h-3.5 w-3.5 rounded-full bg-card shadow-sm transition-[left] duration-200 ease-out ${
                            quarterKey !== null ? 'left-[calc(100%-1.125rem)]' : 'left-0.5'
                          }`}
                        />
                      </span>
                      <span
                        className={`min-w-[1.25rem] text-[10px] font-semibold tabular-nums ${
                          quarterKey !== null ? 'text-primary' : 'text-muted-foreground'
                        }`}
                      >
                        {quarterKey !== null ? 'On' : 'Off'}
                      </span>
                    </button>
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
                This phase reviews the raw PhilGEPS medical procurement data to identify issues like missing 
                values, duplicates, and inconsistent formats. Key features such as quantities, budgets, contract 
                amounts, dates, and regions are analyzed to guide variable selection. This provides a clear 
                dataset overview to prepare for cleaning, PCA, and clustering with K-means and DBSCAN. 
            
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
