import {
  Bar,
  BarChart,
  CartesianGrid,
  Legend,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts'
import { Cpu } from 'lucide-react'
import { useMemo, useState } from 'react'
import { IframePanel } from '../components/IframePanel'
import { ImageCard } from '../components/ImageCard'
import type { GalleryImage } from '../components/LightboxGallery'
import { LightboxGallery } from '../components/LightboxGallery'
import { PageShell } from '../components/PageShell'
import { SectionHeader } from '../components/SectionHeader'
import { SectionWrapper } from '../components/SectionWrapper'
import { DATA_PATHS, IMAGES, INTERACTIVE } from '../data/fileManifest'
import { useJsonData } from '../hooks/useCsvData'

type ClusterCountFile = {
  cluster_counts: Record<string, number>
}

type DbscanCountFile = Pick<ClusterCountFile, 'cluster_counts'>

export function ClusteringPage() {
  const { data: kmeans } = useJsonData<ClusterCountFile>(DATA_PATHS.clusterCountsKmeans)
  const { data: dbscan } = useJsonData<DbscanCountFile>(DATA_PATHS.clusterCountsDbscan)
  const [gallery, setGallery] = useState<{ imgs: GalleryImage[]; idx: number }>({
    imgs: [],
    idx: 0,
  })

  const kmeansBars = useMemo(() => {
    if (!kmeans?.cluster_counts) return []
    return Object.entries(kmeans.cluster_counts).map(([cid, count]) => ({
      cluster: `C${cid}`,
      count,
    }))
  }, [kmeans])

  const dbscanBars = useMemo(() => {
    if (!dbscan?.cluster_counts) return []
    return Object.entries(dbscan.cluster_counts)
      .filter(([label]) => Number(label) >= 0 || label === '-1')
      .map(([cid, count]) => ({
        cluster: cid === '-1' ? 'Noise' : `C${cid}`,
        count,
      }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 60)
  }, [dbscan])

  function open(images: GalleryImage[], idx: number) {
    setGallery({ imgs: images, idx })
  }

  return (
    <PageShell>
      <div className="space-y-12">
        <SectionHeader title="Principal component analysis" subtitle="Variance capture, loadings, and interactive PC space." icon={Cpu} />

        <div className="grid gap-6 md:grid-cols-3">
          {IMAGES.clustering.pca.map((img, idx) => (
            <ImageCard
              key={img.src}
              src={img.src}
              title={img.title}
              figure={`Figure ${idx + 1}: ${img.title}`}
              onClick={() =>
                open(
                  IMAGES.clustering.pca.map((item) => ({ src: item.src, title: item.title })),
                  idx,
                )
              }
            />
          ))}
        </div>

        <IframePanel
          src={INTERACTIVE.pca3d}
          title="Interactive 3D PCA space (pre‑clustering)"
          height={600}
        />

        <SectionHeader title="K‑Means clustering in PCA space" subtitle="Numeric and semantic overlays on PC1–PC3." />
        <div className="grid gap-6 md:grid-cols-2">
          {IMAGES.clustering.kmeans.map((img, idx) => (
            <ImageCard
              key={img.src}
              src={img.src}
              title={img.title}
              figure={`Figure ${idx + 1}: ${img.title}`}
              onClick={() =>
                open(
                  IMAGES.clustering.kmeans.map((item) => ({ src: item.src, title: item.title })),
                  idx,
                )
              }
            />
          ))}
        </div>
        <IframePanel
          src={INTERACTIVE.kmeans3d}
          title="Interactive 3D K‑Means PCA space"
          height={600}
        />

        <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
          <h3 className="text-sm font-semibold text-mf-ink">Figure K3: K‑Means cluster population mix</h3>
          <div className="mt-4 h-80">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={kmeansBars}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="cluster" tick={{ fontSize: 11 }} />
                <YAxis tick={{ fontSize: 11 }} />
                <Tooltip />
                <Legend />
                <Bar dataKey="count" fill="#1D4ED8" name="Observations" radius={[6, 6, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
          <p className="mt-2 text-xs text-slate-500">
            Source: `/results/04/Summaries/cluster_counts.json` rendered for presentation (full cluster catalog in JSON).
          </p>
        </section>

        <SectionHeader title="DBSCAN density clustering" subtitle="Highlighting micro‑segments and noise share (top 60 bars for legibility)." />

        <SectionWrapper id="clustering-approach-comparison">
          <h3 className="font-heading text-base font-semibold text-mf-ink dark:text-foreground">
            K-Means vs DBSCAN: Approach Comparison
          </h3>
          <div className="mt-6 grid gap-6 md:grid-cols-2">
            <div className="rounded-xl border-2 border-mf-primary bg-blue-50/40 p-6 dark:border-primary dark:bg-blue-950/20">
              <h4 className="font-heading text-sm font-semibold uppercase tracking-wide text-mf-primary dark:text-primary">
                K-Means Approach
              </h4>
              <ul className="mt-4 list-disc space-y-2 pl-5 text-sm text-mf-muted dark:text-muted-foreground">
                <li>Requires a fixed number of clusters (K)</li>
                <li>Assigns every record to a cluster</li>
                <li>Works well for compact, spherical groups</li>
                <li>Complete record coverage</li>
              </ul>
            </div>
            <div className="rounded-xl border border-slate-300 bg-slate-50 p-6 dark:border-border dark:bg-muted/40">
              <h4 className="font-heading text-sm font-semibold uppercase tracking-wide text-mf-muted dark:text-foreground">
                DBSCAN Approach
              </h4>
              <ul className="mt-4 list-disc space-y-2 pl-5 text-sm text-mf-muted dark:text-muted-foreground">
                <li>No fixed number of clusters needed</li>
                <li>Marks low-density records as noise</li>
                <li>Discovers arbitrarily shaped clusters</li>
                <li>Useful for outlier detection</li>
              </ul>
            </div>
          </div>
        </SectionWrapper>

        <div className="grid gap-6 md:grid-cols-2">
          {IMAGES.clustering.dbscan.map((img, idx) => (
            <ImageCard
              key={img.src}
              src={img.src}
              title={img.title}
              figure={`Figure ${idx + 1}: ${img.title}`}
              onClick={() =>
                open(
                  IMAGES.clustering.dbscan.map((item) => ({ src: item.src, title: item.title })),
                  idx,
                )
              }
            />
          ))}
        </div>
        <IframePanel
          src={INTERACTIVE.dbscan3d}
          title="Interactive 3D DBSCAN PCA space"
          height={600}
        />

        <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
          <h3 className="text-sm font-semibold text-mf-ink">Figure DB3: DBSCAN cluster cardinalities (presentation slice)</h3>
          <div className="mt-4 h-[420px]">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={dbscanBars}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="cluster" tick={{ fontSize: 9 }} interval={0} angle={-55} textAnchor="end" height={110} />
                <YAxis tick={{ fontSize: 11 }} />
                <Tooltip />
                <Legend />
                <Bar dataKey="count" fill="#0F766E" name="Observations" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
          <p className="mt-2 text-xs text-slate-500">
            Truncated sorted view to keep axis legible; noise bucket appears when present in source JSON.
          </p>
        </section>

        <LightboxGallery
          images={gallery.imgs}
          index={gallery.idx}
          open={gallery.imgs.length > 0}
          onClose={() => setGallery({ imgs: [], idx: 0 })}
        />
      </div>
    </PageShell>
  )
}
