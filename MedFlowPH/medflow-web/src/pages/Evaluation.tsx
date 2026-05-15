import {
  CartesianGrid,
  Legend,
  ResponsiveContainer,
  Scatter,
  ScatterChart,
  Tooltip,
  XAxis,
  YAxis,
  ZAxis,
} from 'recharts'
import { useMemo, useState } from 'react'
import { LineChart as LineIcon } from 'lucide-react'
import { ChartReveal } from '../components/ChartReveal'
import { LazyFigureCarousel } from '../components/LazyFigureCarousel'
import { PageTOC, TOC_EVALUATION_NAV } from '../components/PageTOC'
import { SectionHeader } from '../components/SectionHeader'
import { SectionWrapper } from '../components/SectionWrapper'
import { ImageCard } from '../components/ImageCard'
import type { GalleryImage } from '../components/LightboxGallery'
import { LightboxGallery } from '../components/LightboxGallery'
import { PageShell } from '../components/PageShell'
import { DATA_PATHS, IMAGES } from '../data/fileManifest'
import { useCsvData } from '../hooks/useCsvData'

const kmeansEvalSlides = IMAGES.eda.kmeansEvaluationCarousel
const dbscanEvalSlides = IMAGES.eda.dbscanEvaluationCarousel

const SCATTER_PALETTE = ['#1D4ED8', '#0F766E', '#9333EA', '#DB2777', '#CA8A04', '#0369A1']

const kMeansGallery: GalleryImage[] = IMAGES.evaluation.kmeans.map((item) => ({
  src: item.src,
  title: item.title,
}))

const dbscanGallery: GalleryImage[] = IMAGES.evaluation.dbscan.map((item) => ({
  src: item.src,
  title: item.title,
}))

export function Evaluation() {
  const { data: dbRows } = useCsvData(DATA_PATHS.dbscanMetricsGrid)
  const [kmeansEvalSlideIdx, setKmeansEvalSlideIdx] = useState(0)
  const [dbscanEvalSlideIdx, setDbscanEvalSlideIdx] = useState(0)
  const [gallery, setGallery] = useState<{ imgs: GalleryImage[]; idx: number }>({
    imgs: [],
    idx: 0,
  })

  const dbscanScatter = useMemo(() => {
    const dots = dbRows.map((row) => ({
      x: Number(row.eps),
      y: Number(row.silhouette),
      min_samples: Number(row.min_samples),
    }))
    const uniqueSamples = Array.from(new Set(dots.map((d) => d.min_samples))).sort((a, b) => a - b)
    return {
      dots: dots.filter((d) => Number.isFinite(d.x) && Number.isFinite(d.y)),
      uniqueSamples,
    }
  }, [dbRows])

  function openKmeansEvalCarousel(i: number) {
    setGallery({
      imgs: kmeansEvalSlides.map((item) => ({ src: item.src, title: item.title })),
      idx: i,
    })
  }

  function openDbscanEvalCarousel(i: number) {
    setGallery({
      imgs: dbscanEvalSlides.map((item) => ({ src: item.src, title: item.title })),
      idx: i,
    })
  }

  return (
    <PageShell>
      <div className="flex gap-8">
        <div className="min-w-0 flex-1 space-y-12 overflow-x-hidden pb-16">
          <SectionWrapper id="evaluation-kmeans-context" title="K‑Means evaluation context">
          <div className="space-y-4 text-mf-body leading-relaxed text-muted-foreground">
            <p>
              K-Means was used as the main clustering model because it creates clear and complete group assignments. Every
              procurement record is assigned to one cluster, making the results easier to summarize, count, compare, and
              explain. K-Means works by assigning records to the nearest centroid — the center of a procurement group in PCA
              space.
            </p>
            <div>
              <h3 className="font-heading mb-2 text-mf-card-title font-semibold text-foreground">
                Choosing the Number of Clusters (K)
              </h3>
              <p>
                Before finalizing the K-Means result, Step 05 evaluated different values of K. The script tested a range of
                cluster counts and calculated five internal clustering metrics. Silhouette score was used as the primary
                selection criterion.
              </p>
            </div>
          </div>

          <div className="mt-8 overflow-x-auto rounded-xl border border-border bg-card">
            <table className="w-full min-w-[36rem] text-left text-mf-body">
              <thead className="border-b border-border bg-muted/50">
                <tr>
                  <th className="px-4 py-3 font-semibold text-foreground">Metric</th>
                  <th className="px-4 py-3 font-semibold text-foreground">Range / interpretation</th>
                  <th className="px-4 py-3 font-semibold text-foreground">Description</th>
                </tr>
              </thead>
              <tbody>
                {[
                  {
                    m: 'Silhouette Score',
                    r: '-1 to 1 (higher = better)',
                    d: 'Measures how similar a record is to its own cluster vs. other clusters. Primary selection criterion.',
                  },
                  {
                    m: 'Davies-Bouldin Score',
                    r: '0+ (lower = better)',
                    d: 'Ratio of within-cluster scatter to between-cluster separation. Lower is more compact and separated.',
                  },
                  {
                    m: 'Calinski-Harabasz Score',
                    r: 'Higher = better',
                    d: 'Ratio of between-cluster to within-cluster dispersion. Higher indicates more dense, well-separated clusters.',
                  },
                  {
                    m: 'Inertia',
                    r: 'Lower = better',
                    d: 'Sum of squared distances from each record to its assigned centroid. The elbow method uses this.',
                  },
                  {
                    m: 'Composite Metric',
                    r: 'Derived score',
                    d: 'A normalized combination of the above scores used to holistically rank candidate K values.',
                  },
                ].map((row, i) => (
                  <tr
                    key={row.m}
                    className={`border-b border-border ${i % 2 === 1 ? 'bg-muted/25' : ''}`}
                  >
                    <td className="px-4 py-3 font-semibold text-foreground">{row.m}</td>
                    <td className="px-4 py-3">
                      <span className="inline-block rounded-md bg-blue-50 px-2 py-0.5 text-mf-caption font-medium text-blue-800 dark:bg-blue-950/50 dark:text-blue-200">
                        {row.r}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-muted-foreground">{row.d}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </SectionWrapper>

        <SectionWrapper id="du-eval-kmeans" title="05A - Evaluating K-Means">
          <p className="mb-6 leading-relaxed text-muted-foreground">
            Hyperparameter sweeps contrast internal clustering indices to justify the reported k-means configuration.
          </p>
          <div className="mb-8 grid grid-cols-1 gap-4 md:grid-cols-2">
            <div className="rounded-xl border border-border bg-card p-4">
              <p className="font-semibold text-foreground">Silhouette score</p>
              <p className="mt-2 text-mf-body text-muted-foreground">
                Higher is better — captures how tightly points match their own cluster versus neighboring clusters.
              </p>
            </div>
            <div className="rounded-xl border border-border bg-card p-4">
              <p className="font-semibold text-foreground">Davies–Bouldin index</p>
              <p className="mt-2 text-mf-body text-muted-foreground">
                Lower is better — summarizes within-cluster scatter relative to between-cluster separation.
              </p>
            </div>
            <div className="rounded-xl border border-border bg-card p-4">
              <p className="font-semibold text-foreground">Calinski–Harabasz score</p>
              <p className="mt-2 text-mf-body text-muted-foreground">
                Higher is better — rewards dense, well-separated partitions for a chosen k.
              </p>
            </div>
            <div className="rounded-xl border border-border bg-card p-4">
              <p className="font-semibold text-foreground">Composite score</p>
              <p className="mt-2 text-mf-body text-muted-foreground">
                Higher is better — aggregates normalized silhouette, Davies–Bouldin, and Calinski–Harabasz traces into a
                single ranking-friendly curve.
              </p>
            </div>
          </div>

          <p className="mb-4 text-mf-body text-muted-foreground">
            Step through k-selection diagnostics one at a time. Click a figure to open the full gallery; replace
            placeholders in the manifest with your own interpretations.
          </p>
          <LazyFigureCarousel
            items={kmeansEvalSlides}
            activeIndex={kmeansEvalSlideIdx}
            onActiveIndexChange={setKmeansEvalSlideIdx}
            getFigureLabel={(idx, item) => `Figure KM-DU${idx + 1}: ${item.title}`}
            onSlideImageClick={openKmeansEvalCarousel}
            ariaPrevLabel="Previous K-means evaluation figure"
            ariaNextLabel="Next K-means evaluation figure"
          />
        </SectionWrapper>

        <SectionWrapper id="du-eval-dbscan" title="05B - Evaluating DBSCAN">
          <p className="mb-6 leading-relaxed text-muted-foreground">
            DBSCAN grids explore stability of noise share, silhouette substitutes, and composite rankings across
            epsilon/minPts combinations.
          </p>
          <p className="mb-4 text-mf-body text-muted-foreground">
            Step through DBSCAN evaluation heatmaps one at a time. Click a figure for the gallery view; replace
            placeholders on each entry in <span className="font-mono text-mf-caption">IMAGES.eda.dbscanEvaluationCarousel</span>.
          </p>
          <LazyFigureCarousel
            items={dbscanEvalSlides}
            activeIndex={dbscanEvalSlideIdx}
            onActiveIndexChange={setDbscanEvalSlideIdx}
            getFigureLabel={(idx, item) => `Figure DB-DU${idx + 1}: ${item.title}`}
            onSlideImageClick={openDbscanEvalCarousel}
            ariaPrevLabel="Previous DBSCAN evaluation figure"
            ariaNextLabel="Next DBSCAN evaluation figure"
          />
        </SectionWrapper>

        <SectionHeader
          title="K‑Means selection diagnostics"
          subtitle="Metric overlays across evaluated k‑grid."
          icon={LineIcon}
        />

        <div className="grid gap-6 md:grid-cols-2 xl:grid-cols-3">
          {IMAGES.evaluation.kmeans.map((img, idx) => (
            <ImageCard
              key={img.src}
              src={img.src}
              title={img.title}
              figure={`Figure KM${idx + 1}: ${img.title}`}
              onClick={() => setGallery({ imgs: kMeansGallery, idx })}
            />
          ))}
        </div>

        <SectionHeader
          title="Density‑based (DBSCAN) evaluation"
          subtitle="Heatmaps documenting grid sweeps followed by planar metric exploration."
        />

        <div className="grid gap-6 md:grid-cols-2 xl:grid-cols-4">
          {IMAGES.evaluation.dbscan.map((img, idx) => (
            <ImageCard
              key={img.src}
              src={img.src}
              title={img.title}
              figure={`Figure DB‑EV${idx + 1}: ${img.title}`}
              onClick={() => setGallery({ imgs: dbscanGallery, idx })}
            />
          ))}
        </div>

        <section className="rounded-2xl border border-border bg-card p-5 shadow-sm">
          <h3 className="text-mf-card-title font-semibold text-mf-ink">
            Figure DB‑Sweep: silhouette vs epsilon (hue = min_samples)
          </h3>
          <p className="mt-2 text-mf-caption text-mf-muted">
            Source: `/data/05B/DBSCAN_Evaluation/dbscan_metrics_grid.csv`.
          </p>
          <div className="mt-6 w-full min-w-0 overflow-x-auto">
            <ChartReveal className="medflow-recharts-container mx-auto min-w-[17rem]">
            <ResponsiveContainer width="100%" height="100%">
              <ScatterChart margin={{ top: 12, right: 12, left: 4, bottom: 48 }}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis
                  type="number"
                  dataKey="x"
                  name="epsilon"
                  tick={{ fontSize: 11 }}
                  label={{ value: 'ε (epsilon)', position: 'bottom', dy: 10 }}
                />
                <YAxis
                  type="number"
                  dataKey="y"
                  name="silhouette"
                  tick={{ fontSize: 11 }}
                  label={{ angle: -90, value: 'Silhouette score', position: 'insideLeft' }}
                />
                <ZAxis range={[48, 48]} />
                <Tooltip cursor={{ strokeDasharray: '3 3' }} />
                <Legend />
                {dbscanScatter.uniqueSamples.map((ms, idx) => (
                  <Scatter
                    key={ms}
                    name={`min_samples ${ms}`}
                    data={dbscanScatter.dots.filter((d) => d.min_samples === ms)}
                    fill={SCATTER_PALETTE[idx % SCATTER_PALETTE.length]}
                  />
                ))}
              </ScatterChart>
            </ResponsiveContainer>
            </ChartReveal>
          </div>
        </section>
        </div>

        <aside className="medflow-no-print hidden w-48 shrink-0 xl:block">
          <PageTOC sections={TOC_EVALUATION_NAV} />
        </aside>
      </div>

      <LightboxGallery
        images={gallery.imgs}
        index={gallery.idx}
        open={gallery.imgs.length > 0}
        onClose={() => setGallery({ imgs: [], idx: 0 })}
      />
    </PageShell>
  )
}
