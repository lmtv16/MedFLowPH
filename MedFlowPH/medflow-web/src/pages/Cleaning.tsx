import { useEffect, useMemo, useState } from 'react'
import { LazyFigureCarousel } from '../components/LazyFigureCarousel'
import { ImageCard } from '../components/ImageCard'
import type { GalleryImage } from '../components/LightboxGallery'
import { LightboxGallery } from '../components/LightboxGallery'
import { PageShell } from '../components/PageShell'
import { PageTOC, TOC_CLEANING } from '../components/PageTOC'
import { SectionWrapper } from '../components/SectionWrapper'
import { IMAGES } from '../data/fileManifest'

const CLEANED_SCHEMA_CSV = '/results/01/Data Schema/philgeps_cleaned_schema_table.csv'
const CLEANING_SUMMARY = '/results/01/Summaries/philgeps_cleaning_summary_table.png'

/** Column omitted from the web table per study narrative (raw CSV still contains it). */
const SCHEMA_CSV_OMIT_COLUMN = 'in_canonical_46'

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

/** RFC4180-style fields are not used in this export; values are comma-safe. */
function parseCleanedSchemaTableCsv(raw: string): { headers: string[]; rows: string[][] } | null {
  const lines = raw
    .replace(/\r\n/g, '\n')
    .replace(/\r/g, '\n')
    .trim()
    .split('\n')
    .filter((l) => l.length > 0)
  if (lines.length < 2) return null

  const headers = lines[0]!.split(',').map((h) => h.trim())
  const omitIdx = headers.indexOf(SCHEMA_CSV_OMIT_COLUMN)
  const keepIdx = headers.map((_, i) => i).filter((i) => i !== omitIdx)
  const outHeaders = keepIdx.map((i) => headers[i]!)

  const rows: string[][] = []
  for (let r = 1; r < lines.length; r++) {
    const cells = lines[r]!.split(',').map((c) => c.trim())
    rows.push(keepIdx.map((i) => cells[i] ?? ''))
  }
  return { headers: outHeaders, rows }
}

export function Cleaning() {
  const cleanedSchemaCsv = useFetchedText(CLEANED_SCHEMA_CSV)
  const cleanedSchemaTable = useMemo(
    () => (cleanedSchemaCsv.text ? parseCleanedSchemaTableCsv(cleanedSchemaCsv.text) : null),
    [cleanedSchemaCsv.text],
  )

  const merged = IMAGES.eda.merged
  const [mergedSlideIdx, setMergedSlideIdx] = useState(0)
  const [gallery, setGallery] = useState<{ images: GalleryImage[]; idx: number }>({
    images: [],
    idx: 0,
  })

  useEffect(() => {
    setMergedSlideIdx((i) => Math.max(0, Math.min(merged.length - 1, i)))
  }, [merged.length])

  function openMerged(i: number) {
    const images = merged.map((item) => ({ src: item.src, title: item.title }))
    setGallery({ images, idx: i })
  }

  return (
    <PageShell>
      <div className="flex gap-8">
        <main className="min-w-0 flex-1 space-y-12 overflow-x-hidden pb-16">
          <div className="space-y-12">
            <SectionWrapper id="cleaning-overview">
              <h1 className="mb-2 font-heading text-mf-page-title font-bold text-foreground">
                Data Cleaning
              </h1>
              <p className="mb-3 text-mf-page-lead font-medium text-blue-700 dark:text-blue-400">
                Aligning schemas, removing duplicates, and surfacing missingness before feature work.
              </p>
              <p className="max-w-3xl text-mf-body leading-relaxed text-muted-foreground">
                Cleaning aligned schemas, removed duplicates, standardized medical filtering, and surfaced missingness so
                analysts could trust row counts before feature work began.
              </p>
            </SectionWrapper>

            <SectionWrapper id="cleaning-schema" title="Cleaned Dataset Schema">
              <div className="mb-4 space-y-4 text-mf-body leading-relaxed text-muted-foreground md:text-[1.0625rem] md:leading-relaxed">
                <p>
                  After data cleaning, the PhilGEPS medical procurement dataset contained 487,605 records and 61 columns.
                  All fields had 0 missing values, showing that the dataset was ready for preprocessing.
                </p>
                <p>
                  The cleaned schema retained important procurement, financial, date, location, and supplier fields.
                  Some text fields still had many unique values, so they were kept mainly for reference and interpretation
                  rather than direct clustering.
                </p>
              </div>
              <div className="rounded-xl border border-border bg-muted/40 p-4">
                <p className="mb-3 text-mf-caption font-semibold tracking-wide text-muted-foreground">
                  Cleaned schema (CSV)
                </p>
                {cleanedSchemaTable ? (
                  <div className="max-h-[min(55vh,36rem)] overflow-auto rounded-lg border border-border bg-card">
                    <table className="w-max min-w-full border-collapse text-left font-mono text-mf-caption leading-snug text-foreground">
                      <thead className="sticky top-0 z-10 border-b border-border bg-muted">
                        <tr>
                          {cleanedSchemaTable.headers.map((h, i) => (
                            <th
                              key={`${h}-${i}`}
                              className="whitespace-nowrap px-2 py-2 font-semibold text-foreground"
                            >
                              {h}
                            </th>
                          ))}
                        </tr>
                      </thead>
                      <tbody>
                        {cleanedSchemaTable.rows.map((row, ri) => (
                          <tr
                            key={ri}
                            className={ri % 2 === 1 ? 'bg-muted/30' : 'bg-card'}
                          >
                            {row.map((cell, ci) => (
                              <td key={ci} className="border-t border-border px-2 py-1.5">
                                {cell}
                              </td>
                            ))}
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                ) : cleanedSchemaCsv.failed ? (
                  <p className="text-xs text-muted-foreground">
                    Schema CSV could not be loaded.
                  </p>
                ) : (
                  <p className="text-xs text-muted-foreground">Loading schema table…</p>
                )}
              </div>
            </SectionWrapper>

            <SectionWrapper id="cleaning-merged" title="Exploratory Data Analysis (EDA)">
              <LazyFigureCarousel
                items={merged}
                activeIndex={mergedSlideIdx}
                onActiveIndexChange={setMergedSlideIdx}
                getFigureLabel={(idx, item) => `Figure ${idx + 1}: ${item.title}`}
                onSlideImageClick={(idx) => openMerged(idx)}
                ariaPrevLabel="Previous merged figure"
                ariaNextLabel="Next merged figure"
              />
            </SectionWrapper>

            <SectionWrapper id="cleaning-summary" title="Cleaning Summary">
              <div className="rounded-2xl border border-border bg-card p-5 shadow-sm md:p-6">
                <ImageCard src={CLEANING_SUMMARY} title="Cleaning summary table" />
                <div className="mt-5 border-t border-border pt-5">
                  <div className="space-y-4 text-base leading-relaxed text-muted-foreground md:text-lg md:leading-relaxed">
                    <p>
                      Step 01 started with 8,414,861 raw PhilGEPS records and filtered them into medical-related procurement
                      records. After medical filtering and duplicate removal, the final cleaned dataset contained 487,605
                      records and 61 columns.
                    </p>
                    <p>
                      The filter used UNSPSC Description, Item Name, and Item Description to recover medical-related
                      records even when some classification fields were incomplete. This created a focused dataset ready for
                      preprocessing and clustering.
                    </p>
                  </div>
                </div>
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
          <PageTOC sections={TOC_CLEANING} />
        </aside>
      </div>
    </PageShell>
  )
}
