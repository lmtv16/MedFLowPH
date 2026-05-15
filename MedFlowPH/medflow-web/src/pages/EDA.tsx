import { BarChart3 } from 'lucide-react'
import { useEffect, useMemo, useState } from 'react'
import { PageTOC, TOC_EDA } from '../components/PageTOC'
import { SectionHeader } from '../components/SectionHeader'
import { ImageCard } from '../components/ImageCard'
import type { GalleryImage } from '../components/LightboxGallery'
import { LightboxGallery } from '../components/LightboxGallery'
import { MetricCard } from '../components/MetricCard'
import { PhilgepsRawSummaryView } from '../components/PhilgepsRawSummaryView'
import { PageShell } from '../components/PageShell'
import { SectionWrapper } from '../components/SectionWrapper'
import { filenameToTitle, IMAGES } from '../data/fileManifest'

// Raw Understanding
const RAW_SCHEMA = '/results/00/Raw Dataset Schema/philgeps_raw_schema_table.png'
const RAW_SCHEMA_TABLE = '/results/00/Raw Dataset Schema/philgeps_raw_schema_table.txt'
const RAW_SUMMARY = '/results/00/Summaries/philgeps_understanding_summary.txt'


const heroMetrics = [
  { label: 'Raw Records', value: '8,414,861' },
  { label: 'Final Cleaned Medical Records', value: '487,605' },
  { label: 'Raw Schema Columns', value: '46' },
  { label: 'Cleaned Dataset Columns', value: '61' },
  { label: 'Processed Quarter Segments', value: '20' },
  { label: 'Duplicate Rows Detected', value: '1,546,639' },
]

const quarterPresets = Object.keys(IMAGES.eda.byQuarter).sort()

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

            <SectionWrapper id="du-raw" title="00 - Raw Dataset Understanding">
              <p className="mb-6 text-mf-body leading-relaxed text-muted-foreground">
                The raw PhilGEPS extract spans tens of millions of procurement rows with dozens of administrative fields.
                Before modeling, we documented column roles, key identifiers, and obvious quality risks directly from the
                raw schema summary.
              </p>
              <RawSchemaPngFigure src={RAW_SCHEMA} title="Raw dataset schema (tabular overview)" />
              <div className="mt-4 rounded-xl border border-border bg-muted/40 p-4">
                <p className="mb-3 text-mf-caption font-semibold tracking-wide text-muted-foreground">
                  Schema table (text export — <code className="text-mf-caption font-mono">philgeps_raw_schema_table.txt</code>)
                </p>
                {rawSchemaTable.text ? (
                  <pre className="max-h-[min(55vh,36rem)] overflow-auto rounded-lg border border-border bg-card p-3 font-mono text-mf-caption leading-snug text-foreground whitespace-pre">
                    {rawSchemaTable.text}
                  </pre>
                ) : rawSchemaTable.failed ? (
                  <p className="text-mf-caption text-muted-foreground">Schema table file could not be loaded.</p>
                ) : (
                  <p className="text-mf-caption text-muted-foreground">Loading schema table…</p>
                )}
              </div>
              <p className="mt-4 text-mf-body leading-relaxed text-muted-foreground">
                The schema table anchors terminology for later cleaning rules—especially procurement modes, dates,
                budgets, and agency identifiers—so every downstream transformation can be traced back to an explicit raw
                column definition.
              </p>
              <div className="mt-6 rounded-xl border border-border bg-muted/40 p-4">
                <p className="mb-3 text-mf-caption font-semibold tracking-wide text-muted-foreground">
                  Raw summary
                </p>
                {rawSummary.text ? (
                  <div className="max-h-[min(70vh,44rem)] overflow-auto rounded-lg border border-border bg-card p-3">
                    <PhilgepsRawSummaryView text={rawSummary.text} />
                  </div>
                ) : rawSummary.failed ? (
                  <p className="text-mf-caption text-muted-foreground">Summary file could not be loaded.</p>
                ) : (
                  <p className="text-mf-caption text-muted-foreground">Loading summary…</p>
                )}
              </div>
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

            <div className="border-t border-border pt-12" />

            <div className="space-y-10">
              <SectionWrapper id="eda-overview" title="Interactive chart gallery">
                <SectionHeader
                  title="Merged quarterly panels"
                  subtitle="Quarterly explorers highlight slice evolution; merged boards synthesize longitudinal behavior."
                  icon={BarChart3}
                />
                <p className="mt-4 text-mf-body text-muted-foreground">
                  This gallery supports the data cleaning narrative: read consolidated boards for the full study window, then
                  optionally filter to a single quarter to narrate procurement seasonality before moving downstream to
                  preprocessing and modeling.
                </p>
              </SectionWrapper>

              <SectionWrapper id="eda-quarter" title="By quarter">
                <div className="rounded-2xl border border-border bg-card p-5 shadow-sm">
                  <p className="text-sm font-medium text-muted-foreground">Quarter filter</p>
                  <div className="mt-3 flex flex-wrap gap-2">
                    <button
                      type="button"
                      className={`rounded-full px-4 py-1.5 text-xs font-semibold ${
                        quarterKey === null
                          ? 'bg-primary text-primary-foreground'
                          : 'bg-muted text-muted-foreground hover:bg-muted/80'
                      }`}
                      onClick={() => setQuarterKey(null)}
                    >
                      Quarterly view off
                    </button>
                    {quarterPresets.map((qk) => (
                      <button
                        key={qk}
                        type="button"
                        className={`rounded-full px-3 py-1.5 text-xs font-semibold ${
                          quarterKey === qk
                            ? 'bg-mf-secondary text-primary-foreground'
                            : 'bg-muted text-muted-foreground hover:bg-muted/80'
                        }`}
                        onClick={() => setQuarterKey(qk)}
                      >
                        {qk.replace('-', ' ')}
                      </button>
                    ))}
                  </div>
                </div>

                {quarterKey ? (
                  <section className="mt-10">
                    <h3 className="text-lg font-semibold text-foreground">
                      Quarterly exploratory figures — <span className="text-mf-primary">{quarterKey}</span>
                    </h3>
                    <div className="mt-6 grid gap-6 sm:grid-cols-2 xl:grid-cols-3">
                      {quarterlyImages.map((item, idx) => (
                        <ImageCard
                          key={item.src}
                          src={item.src}
                          title={item.title}
                          onClick={() => openQuarterly(idx)}
                          caption={filenameToTitle(item.src.split('/').pop() ?? '')}
                          figure={`Figure ${idx + 1}: Quarterly ${item.title}`}
                        />
                      ))}
                    </div>
                  </section>
                ) : null}
              </SectionWrapper>
            </div>

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
