import {
  CartesianGrid,
  Legend,
  Line,
  LineChart,
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
import { SectionHeader } from '../components/SectionHeader'
import { SectionWrapper } from '../components/SectionWrapper'
import { ImageCard } from '../components/ImageCard'
import type { GalleryImage } from '../components/LightboxGallery'
import { LightboxGallery } from '../components/LightboxGallery'
import { PageShell } from '../components/PageShell'
import { DATA_PATHS, IMAGES } from '../data/fileManifest'
import { useCsvData } from '../hooks/useCsvData'

const METRIC_LINES = [
  { key: 'silhouette', name: 'Silhouette', color: '#1D4ED8' },
  { key: 'davies_bouldin', name: 'Davies–Bouldin', color: '#EA580C' },
  { key: 'calinski_harabasz', name: 'Calinski–Harabasz', color: '#059669' },
  { key: 'composite', name: 'Composite', color: '#7C3AED' },
] as const

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
  const { data: kRows } = useCsvData(DATA_PATHS.kMetricsLong)
  const { data: dbRows } = useCsvData(DATA_PATHS.dbscanMetricsGrid)
  const [gallery, setGallery] = useState<{ imgs: GalleryImage[]; idx: number }>({
    imgs: [],
    idx: 0,
  })

  const kMeansSeries = useMemo(() => {
    return kRows
      .map((row) => ({
        k: Number(row.k),
        silhouette: Number(row.silhouette),
        davies_bouldin: Number(row.davies_bouldin),
        calinski_harabasz: Number(row.calinski_harabasz),
        composite: Number(row.composite),
      }))
      .filter((row) => Number.isFinite(row.k))
      .sort((a, b) => a.k - b.k)
  }, [kRows])

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

  return (
    <PageShell>
      <div className="space-y-12">
        <SectionWrapper id="evaluation-kmeans-context" title="K‑Means evaluation context">
          <div className="space-y-4 text-sm leading-relaxed text-mf-muted dark:text-muted-foreground">
            <p>
              K-Means was used as the main clustering model because it creates clear and complete group assignments. Every
              procurement record is assigned to one cluster, making the results easier to summarize, count, compare, and
              explain. K-Means works by assigning records to the nearest centroid — the center of a procurement group in PCA
              space.
            </p>
            <div>
              <h3 className="font-heading mb-2 text-base font-semibold text-mf-ink dark:text-foreground">
                Choosing the Number of Clusters (K)
              </h3>
              <p>
                Before finalizing the K-Means result, Step 05 evaluated different values of K. The script tested a range of
                cluster counts and calculated five internal clustering metrics. Silhouette score was used as the primary
                selection criterion.
              </p>
            </div>
          </div>

          <div className="mt-8 overflow-hidden rounded-xl border border-slate-200 bg-white dark:border-border dark:bg-card">
            <table className="w-full text-left text-sm">
              <thead className="border-b border-slate-200 bg-slate-50 dark:border-border dark:bg-muted/50">
                <tr>
                  <th className="px-4 py-3 font-semibold text-mf-ink dark:text-foreground">Metric</th>
                  <th className="px-4 py-3 font-semibold text-mf-ink dark:text-foreground">Range / interpretation</th>
                  <th className="px-4 py-3 font-semibold text-mf-ink dark:text-foreground">Description</th>
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
                    className={`border-b border-slate-100 dark:border-border ${i % 2 === 1 ? 'bg-slate-50/50 dark:bg-muted/20' : ''}`}
                  >
                    <td className="px-4 py-3 font-semibold text-mf-ink dark:text-foreground">{row.m}</td>
                    <td className="px-4 py-3">
                      <span className="inline-block rounded-md bg-blue-50 px-2 py-0.5 text-xs font-medium text-blue-800 dark:bg-blue-950/50 dark:text-blue-200">
                        {row.r}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-mf-muted dark:text-muted-foreground">{row.d}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
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

        <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
          <h3 className="text-sm font-semibold text-mf-ink">Figure KM‑Grid: Metric trajectories versus k</h3>
          <p className="mt-2 text-xs text-mf-muted">
            Source: `/data/05/KSelection/k_metrics_long.csv` via Papa Parse.
          </p>
          <div className="mt-6 h-[420px]">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={kMeansSeries}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis
                  dataKey="k"
                  tick={{ fontSize: 11 }}
                  label={{ value: 'k', position: 'insideBottom', dy: 10 }}
                />
                <YAxis tick={{ fontSize: 11 }} />
                <Tooltip />
                <Legend />
                {METRIC_LINES.map((line) => (
                  <Line
                    key={line.key}
                    type="monotone"
                    dot={false}
                    dataKey={line.key}
                    name={line.name}
                    stroke={line.color}
                    strokeWidth={2}
                  />
                ))}
              </LineChart>
            </ResponsiveContainer>
          </div>
        </section>

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

        <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
          <h3 className="text-sm font-semibold text-mf-ink">
            Figure DB‑Sweep: silhouette vs epsilon (hue = min_samples)
          </h3>
          <p className="mt-2 text-xs text-mf-muted">
            Source: `/data/05B/DBSCAN_Evaluation/dbscan_metrics_grid.csv`.
          </p>
          <div className="mt-6 h-[420px]">
            <ResponsiveContainer width="100%" height="100%">
              <ScatterChart margin={{ top: 20, bottom: 20 }}>
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
          </div>
        </section>
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
