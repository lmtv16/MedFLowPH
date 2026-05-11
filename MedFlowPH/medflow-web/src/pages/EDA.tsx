import { motion } from 'framer-motion'
import { useMemo, useState } from 'react'
import { PageTOC, TOC_EDA } from '../components/PageTOC'
import { SectionHeader } from '../components/SectionHeader'
import { ImageCard } from '../components/ImageCard'
import type { GalleryImage } from '../components/LightboxGallery'
import { LightboxGallery } from '../components/LightboxGallery'
import { PageShell } from '../components/PageShell'
import { SectionWrapper } from '../components/SectionWrapper'
import { BarChart3 } from 'lucide-react'
import { filenameToTitle, IMAGES } from '../data/fileManifest'

const quarterPresets = Object.keys(IMAGES.eda.byQuarter).sort()

export function EDA() {
  const [quarterKey, setQuarterKey] = useState<string | null>(null)
  const [gallery, setGallery] = useState<{ images: GalleryImage[]; idx: number }>({
    images: [],
    idx: 0,
  })

  const quarterlyImages = useMemo(
    () => (quarterKey ? IMAGES.eda.byQuarter[quarterKey] ?? [] : []),
    [quarterKey],
  )

  const merged = IMAGES.eda.merged

  function openMerged(i: number) {
    const images = merged.map((item) => ({ src: item.src, title: item.title }))
    setGallery({ images, idx: i })
  }

  function openQuarterly(i: number) {
    const images = quarterlyImages.map((item) => ({ src: item.src, title: item.title }))
    setGallery({ images, idx: i })
  }

  function openQuarterlyMerged(i: number) {
    const base = [...quarterlyImages, ...merged]
    const images = base.map((item) => ({ src: item.src, title: item.title }))
    setGallery({ images, idx: i })
  }

  const figureOffset = quarterlyImages.length

  return (
    <PageShell>
      <div className="flex gap-8">
        <main className="min-w-0 flex-1">
          <motion.div className="space-y-10">
            <SectionWrapper id="eda-overview" title="Dataset overview">
              <SectionHeader
                title="Merged quarterly panels"
                subtitle="Quarterly explorers highlight slice evolution; merged boards synthesize longitudinal behavior."
                icon={BarChart3}
              />
              <p className="mt-4 text-sm text-mf-muted dark:text-muted-foreground">
                This gallery mirrors the thesis EDA chapter: read consolidated boards for the full study window, then
                optionally filter to a single quarter to narrate procurement seasonality before moving downstream to
                preprocessing and modeling.
              </p>
            </SectionWrapper>

            <SectionWrapper id="eda-merged" title="Merged EDA charts">
              <p className="mb-4 text-sm text-mf-muted dark:text-muted-foreground">
                Consolidated exploratory figures (merged EDA board) aggregate every quarter in the PhilGEPS medical
                slice.
              </p>
              <div className="grid gap-6 sm:grid-cols-2 xl:grid-cols-3">
                {merged.map((item, idx) => {
                  const figNo = idx + figureOffset + 1
                  return (
                    <ImageCard
                      key={item.src}
                      src={item.src}
                      title={item.title}
                      onClick={
                        quarterKey ? () => openQuarterlyMerged(figureOffset + idx) : () => openMerged(idx)
                      }
                      caption={filenameToTitle(item.src.split('/').pop() ?? '')}
                      figure={`Figure ${figNo}: ${item.title}`}
                    />
                  )
                })}
              </div>
            </SectionWrapper>

            <SectionWrapper id="eda-quarter" title="By quarter">
              <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm dark:border-border dark:bg-card">
                <p className="text-sm font-medium text-mf-muted dark:text-muted-foreground">Quarter filter</p>
                <div className="mt-3 flex flex-wrap gap-2">
                  <button
                    type="button"
                    className={`rounded-full px-4 py-1.5 text-xs font-semibold ${
                      quarterKey === null
                        ? 'bg-mf-primary text-white'
                        : 'bg-slate-100 text-mf-muted hover:bg-slate-200 dark:bg-muted dark:text-foreground dark:hover:bg-muted/80'
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
                          ? 'bg-mf-secondary text-white'
                          : 'bg-slate-100 text-mf-muted hover:bg-slate-200 dark:bg-muted dark:text-foreground dark:hover:bg-muted/80'
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
                  <h3 className="text-lg font-semibold text-mf-ink dark:text-foreground">
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

            <LightboxGallery
              images={gallery.images}
              index={gallery.idx}
              open={gallery.images.length > 0}
              onClose={() => setGallery({ images: [], idx: 0 })}
            />
          </motion.div>
        </main>

        <aside className="medflow-no-print hidden w-48 shrink-0 xl:block">
          <PageTOC sections={TOC_EDA} />
        </aside>
      </div>
    </PageShell>
  )
}
