import { useMemo, useState } from 'react'
import { BarChart2, Search, Sparkles, Target } from 'lucide-react'
import { ImageCard } from '../components/ImageCard'
import type { GalleryImage } from '../components/LightboxGallery'
import { LightboxGallery } from '../components/LightboxGallery'
import { MetricCard } from '../components/MetricCard'
import { PageTOC, TOC_COMPARISON } from '../components/PageTOC'
import { PageShell } from '../components/PageShell'
import { SectionHeader } from '../components/SectionHeader'
import { SectionWrapper } from '../components/SectionWrapper'
import { DATA_PATHS, IMAGES } from '../data/fileManifest'
import { getManifestAssetUrl } from '../data/artifacts'
import { useRunId } from '../context/RunContext'
import { useCsvData, useJsonData } from '../hooks/useCsvData'

type ClusterMeta = { k: number }

type ParsedRow = {
  algorithm: string
  silhouette: number
  davies_bouldin: number
  calinski_harabasz: number
  noise_share: number
  cluster_count: number
  strengths: string
}

export function Comparison() {
  const runId = useRunId()
  const { data } = useCsvData(DATA_PATHS.modelComparisonSummary, runId)
  const { data: clusterMeta } = useJsonData<ClusterMeta>(DATA_PATHS.clusterCountsKmeans, runId)
  const [gallery, setGallery] = useState<{ imgs: GalleryImage[]; idx: number }>({
    imgs: [],
    idx: 0,
  })

  const parsed = useMemo(() => {
    const rows = data.map<ParsedRow | null>((row) => {
      const algo = row.algorithm ?? ''
      if (!algo) return null
      return {
        algorithm: algo,
        silhouette: Number(row.silhouette),
        davies_bouldin: Number(row.davies_bouldin),
        calinski_harabasz: Number(row.calinski_harabasz),
        noise_share: Number(row.noise_share),
        cluster_count: Number(row.n_clusters_excluding_noise),
        strengths: row.strengths ?? '',
      }
    })
    const clean = rows.filter((r): r is ParsedRow => Boolean(r))
    const kmeans = clean.find((r) => r.algorithm.includes('K-Means'))
    const dbscan = clean.find((r) => r.algorithm.includes('DBSCAN'))
    return { kmeans, dbscan }
  }, [data])

  const chosenK = clusterMeta?.k ?? 6

  const comparisonImages = useMemo(
    () =>
      IMAGES.comparison.map((item) => ({
        ...item,
        src: getManifestAssetUrl(runId, item.src),
      })),
    [runId],
  )
  const galleryImages = comparisonImages.map((item) => ({ src: item.src, title: item.title }))
  const sideBySideGalleryIdx = comparisonImages.findIndex((img) =>
    img.src.includes('kmeans_vs_DBSCAN'),
  )
  const sideBySideAsset =
    sideBySideGalleryIdx >= 0 ? comparisonImages[sideBySideGalleryIdx] : undefined

  return (
    <PageShell>
      <div className="flex gap-8">
        <main className="min-w-0 flex-1 overflow-x-hidden">
          <div className="space-y-10">
            <SectionWrapper id="comparison-aspects" title="K‑Means vs DBSCAN — qualitative comparison">
              <div className="space-y-6">
                {sideBySideAsset ? (
                  <ImageCard
                    src={sideBySideAsset.src}
                    title={sideBySideAsset.title}
                    figure={`Figure MC‑G${sideBySideGalleryIdx + 1}: ${sideBySideAsset.title}`}
                    onClick={() => setGallery({ imgs: galleryImages, idx: sideBySideGalleryIdx })}
                  />
                ) : null}
                <div className="overflow-x-auto rounded-xl border border-border bg-card">
                  <table className="w-full min-w-[20rem] text-left text-mf-body">
                    <thead className="border-b border-border bg-muted/50">
                      <tr>
                        <th className="px-4 py-3 font-semibold text-foreground">Aspect</th>
                        <th className="px-4 py-3 font-semibold text-foreground">K‑Means</th>
                        <th className="px-4 py-3 font-semibold text-foreground">DBSCAN</th>
                      </tr>
                    </thead>
                    <tbody>
                      {[
                      {
                        a: 'Cluster Assignment',
                        k: 'Every record assigned to exactly one cluster',
                        d: 'Records in sparse areas labeled as noise (–1)',
                        key: 'assign',
                      },
                      {
                        a: 'Number of Clusters',
                        k: 'Fixed K chosen via silhouette/elbow methods',
                        d: 'Determined automatically by density parameters',
                        key: 'num',
                      },
                      {
                        a: 'Noise Handling',
                        k: 'No noise concept — all records assigned',
                        d: 'Outlier records explicitly identified as noise',
                        key: 'noise',
                      },
                      {
                        a: 'Interpretability',
                        k: 'Cleaner profiles — easy to describe per cluster',
                        d: 'Harder when many micro-clusters or large noise group appears',
                        key: 'interp',
                      },
                      {
                        a: 'Visualization Readability',
                        k: 'Compact groups with visible centroids in PCA space',
                        d: 'Irregular shapes; noise points clutter the 3D plot',
                        key: 'viz',
                      },
                      {
                        a: 'Record Coverage',
                        k: '100% — no records excluded from analysis',
                        d: 'Partial — noise records excluded from cluster metrics',
                        key: 'coverage',
                        highlight: true,
                      },
                    ].map((row, i) => (
                      <tr
                        key={row.key}
                        className={`border-b border-border ${
                          row.highlight
                            ? 'border-l-2 border-l-primary bg-primary/10'
                            : i % 2 === 1
                              ? 'bg-muted/15'
                              : ''
                        }`}
                      >
                        <td className="px-4 py-3 font-semibold text-foreground">{row.a}</td>
                        <td className="px-4 py-3 text-muted-foreground">{row.k}</td>
                        <td className="px-4 py-3 text-muted-foreground">{row.d}</td>
                      </tr>
                    ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </SectionWrapper>

            <SectionWrapper id="comparison-verdict" title="Model roles">
              <div className="grid gap-6 md:grid-cols-2">
                <div className="relative rounded-xl border-2 border-primary bg-card p-6">
                  <span className="inline-block rounded-full bg-primary px-2.5 py-0.5 text-xs font-semibold uppercase tracking-wide text-primary-foreground">
                    Recommended
                  </span>
                  <h3 className="font-heading mt-4 text-mf-card-title font-semibold text-foreground">
                    K-Means: Main Model
                  </h3>
                  <p className="mt-3 text-mf-body leading-relaxed text-muted-foreground">
                    Assigns every procurement record to a cluster, producing a cleaner structure for reporting. Easier to
                    create tables, explain cluster sizes, and discuss procurement patterns.
                  </p>
                </div>
                <div className="rounded-xl border border-border bg-muted/30 p-6">
                  <span className="inline-block rounded-full border border-border bg-card px-2.5 py-0.5 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                    Companion
                  </span>
                  <h3 className="font-heading mt-4 text-mf-card-title font-semibold text-foreground">
                    DBSCAN: Companion Model
                  </h3>
                  <p className="mt-3 text-mf-body leading-relaxed text-muted-foreground">
                    Identifies records that behave like outliers in PCA space. Best used as a secondary analysis when many
                    small clusters appear.
                  </p>
                </div>
              </div>
            </SectionWrapper>

            <SectionWrapper id="comparison-findings" title="Key findings">
              <div className="grid gap-6 md:grid-cols-3">
                {[
                  {
                    icon: BarChart2,
                    title: 'Distinct Procurement Groupings Found',
                    text: 'Medicine procurement records can be grouped into distinct patterns based on timing, quantity, budget, item budget, and contract amount behavior. These groups are not visible in raw tabular data but emerge clearly in PCA space.',
                  },
                  {
                    icon: Target,
                    title: 'K-Means Provides the Clearest Results',
                    text: 'K-Means provided the more interpretable final clustering output because it produced full record coverage and clearer cluster labels. Every procurement record is assigned, making it straightforward to profile each group and explain its characteristics.',
                  },
                  {
                    icon: Search,
                    title: 'DBSCAN Adds Outlier Detection Value',
                    text: 'DBSCAN added value by identifying records that did not belong to dense groups. These outlier records may be useful for procurement review, but DBSCAN should not be the main model if the goal is to present a simple and understandable clustering result.',
                  },
                ].map(({ icon: Icon, title, text }) => (
                  <div key={title} className="rounded-xl border border-border bg-card p-6">
                    <Icon className="h-8 w-8 text-primary" aria-hidden />
                    <h3 className="font-heading mt-4 text-mf-card-title font-semibold text-foreground">{title}</h3>
                    <p className="mt-3 text-mf-body leading-relaxed text-muted-foreground">{text}</p>
                  </div>
                ))}
              </div>
            </SectionWrapper>

            <SectionHeader
              title="Executive comparison dashboard"
              subtitle="Committee‑facing synopsis of calibrated quality metrics contrasting partition vs density models."
              icon={Sparkles}
            />

            <SectionWrapper id="comparison-summary" title="Summary metrics">
              <div className="mx-auto max-w-5xl">
                <p className="mb-3 text-xs font-medium uppercase tracking-wide text-muted-foreground">
                  Metrics — K‑Means vs DBSCAN (paired columns)
                </p>
                <div className="grid grid-cols-1 items-stretch gap-4 sm:grid-cols-2">
                  {parsed.kmeans && parsed.dbscan ? (
                    <>
                      <MetricCard label="Silhouette — K‑Means" value={parsed.kmeans.silhouette.toFixed(3)} />
                      <MetricCard label="Silhouette — DBSCAN" value={parsed.dbscan.silhouette.toFixed(3)} />
                      <MetricCard
                        label="Davies–Bouldin — K‑Means"
                        value={parsed.kmeans.davies_bouldin.toFixed(3)}
                      />
                      <MetricCard
                        label="Davies–Bouldin — DBSCAN"
                        value={parsed.dbscan.davies_bouldin.toFixed(3)}
                      />
                      <MetricCard
                        label="Calinski–Harabasz — K‑Means"
                        value={parsed.kmeans.calinski_harabasz.toFixed(0)}
                      />
                      <MetricCard
                        label="Calinski–Harabasz — DBSCAN"
                        value={parsed.dbscan.calinski_harabasz.toFixed(0)}
                      />
                      <MetricCard
                        label="Noise share — K‑Means"
                        value={`${(parsed.kmeans.noise_share * 100).toFixed(2)} %`}
                      />
                      <MetricCard label="Noise share — DBSCAN" value={`${(parsed.dbscan.noise_share * 100).toFixed(2)} %`} />
                      <MetricCard
                        label="Clusters (excl. noise) — K‑Means"
                        value={parsed.kmeans.cluster_count.toString()}
                      />
                      <MetricCard
                        label="Clusters (excl. noise) — DBSCAN"
                        value={parsed.dbscan.cluster_count.toString()}
                      />
                    </>
                  ) : (
                    <p className="text-mf-body text-mf-muted sm:col-span-2 dark:text-muted-foreground">
                      Waiting for `{DATA_PATHS.modelComparisonSummary}` to load…
                    </p>
                  )}
                </div>
              </div>
            </SectionWrapper>

            <SectionWrapper id="comparison-gallery" title="Visual gallery">
              <div className="grid grid-cols-1 gap-6 sm:grid-cols-2">
                {comparisonImages
                  .map((img, manifestIdx) => ({ img, manifestIdx }))
                  .filter(({ img }) => !img.src.includes('side_by_side'))
                  .map(({ img, manifestIdx }) => (
                    <ImageCard
                      key={img.src}
                      src={img.src}
                      title={img.title}
                      titleDisclosure
                      onClick={() => setGallery({ imgs: galleryImages, idx: manifestIdx })}
                    />
                  ))}
              </div>
            </SectionWrapper>

            <SectionWrapper id="comparison-conclusion" title="Conclusion">
              <div className="space-y-4 rounded-xl bg-muted/30 p-6 italic">
                <p className="text-mf-body leading-relaxed text-muted-foreground">
                  MedFlow PH applies a complete unsupervised learning pipeline to medicine-related procurement data from
                  PhilGEPS. The project begins with raw data understanding, continues through cleaning and preprocessing,
                  reduces the feature space using PCA, applies K-Means and DBSCAN clustering, and compares the models based on
                  both metrics and interpretability.
                </p>
                <p className="text-mf-body leading-relaxed text-muted-foreground">
                  The final result shows that{' '}
                  <span className="font-semibold not-italic text-primary">
                    K-Means is the stronger model
                  </span>{' '}
                  for the website&apos;s main clustering presentation, while DBSCAN is best used as a companion method for
                  detecting dense regions and outlier-like procurement records. Together, both models provide a broader view
                  of procurement behavior in Philippine public health facilities.
                </p>
              </div>
            </SectionWrapper>

            <SectionWrapper id="comparison-recommendation" title="Recommendation">
              <div className="rounded-2xl border border-primary bg-gradient-to-r from-primary/10 via-muted/50 to-mf-secondary/15 p-8 shadow-inner">
                <p className="text-mf-caption uppercase tracking-[0.3em] text-muted-foreground">Recommendation</p>
                <h3 className="mt-3 text-mf-section font-semibold text-foreground">
                  Recommended model: K‑Means (K={chosenK})
                </h3>
                <p className="mt-4 text-mf-body leading-relaxed text-muted-foreground">
                  K‑means is recommended as the primary model for MedFlow PH: it produces stable, interpretable
                  procurement segments (K&nbsp;=&nbsp;{chosenK}; best silhouette 0.386). DBSCAN should remain a
                  supporting method for density patterns and outlier detection, not the main presentation layer.
                  Future work should explore additional algorithms and wider K ranges, refine DBSCAN parameters or
                  consider HDBSCAN, and evaluate models using Silhouette, Davies‑Bouldin, and Calinski‑Harabasz
                  scores together with interpretability—validating cluster labels against procurement indicators
                  and stakeholder review.
                </p>
              </div>
            </SectionWrapper>

            <LightboxGallery
              images={gallery.imgs}
              index={gallery.idx}
              open={gallery.imgs.length > 0}
              onClose={() => setGallery({ imgs: [], idx: 0 })}
            />
          </div>
        </main>

        <aside className="medflow-no-print hidden w-48 shrink-0 xl:block">
          <PageTOC sections={TOC_COMPARISON} />
        </aside>
      </div>
    </PageShell>
  )
}
