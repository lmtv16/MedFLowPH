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
import { useMemo, useState, type ReactNode } from 'react'
import { ImageCard } from '../components/ImageCard'
import type { GalleryImage } from '../components/LightboxGallery'
import { LightboxGallery } from '../components/LightboxGallery'
import { PageShell } from '../components/PageShell'
import { PageTOC, TOC_CLUSTERING_NAV } from '../components/PageTOC'
import { SectionHeader } from '../components/SectionHeader'
import { SectionWrapper } from '../components/SectionWrapper'
import { DATA_PATHS, IMAGES } from '../data/fileManifest'
import { useJsonData } from '../hooks/useCsvData'

type ClusterCountFile = {
  cluster_counts: Record<string, number>
}

type DbscanCountFile = Pick<ClusterCountFile, 'cluster_counts'>

type FigureCaptions = readonly ReactNode[]

function ClusterFigureLayout({
  figureNum,
  title,
  children,
  footerParagraphs,
}: {
  figureNum: number
  title: string
  children: ReactNode
  footerParagraphs: FigureCaptions
}) {
  return (
    <div className="flex flex-col gap-6">
      <header className="flex flex-col gap-5 border-b border-slate-200 pb-6 dark:border-border">
        <p className="text-xs font-semibold uppercase tracking-wide text-mf-primary">Figure {figureNum}</p>
        <div className="rounded-xl border border-slate-100 bg-white px-4 py-3 shadow-sm dark:border-border dark:bg-card">
          <h3 className="text-base font-semibold leading-snug text-mf-ink dark:text-foreground">{title}</h3>
        </div>
      </header>
      {children}
      <footer className="border-t border-slate-200 pt-4 dark:border-border">
        <div className="flex flex-col gap-3">
          {footerParagraphs.map((para, pi) => (
            <p key={pi} className="text-sm leading-relaxed text-mf-muted">
              {para}
            </p>
          ))}
        </div>
      </footer>
    </div>
  )
}

const PCA_DESCRIPTIONS: readonly FigureCaptions[] = [
  [
    'This heatmap shows which numeric features contribute most to each PCA dimension. PC1 is mainly driven by item budget and contract amount, PC2 is driven by quantity and approved budget, and PC3 is strongly driven by award decision lag.',
    'This means the PCA space summarizes procurement records into three main patterns: monetary size, volume or budget behavior, and decision delay. These PCA scores are then used for clustering.',
  ],
  [
    <>
      This chart shows how much information is retained after reducing the numeric features using PCA. The first three
      components explain{' '}
      <strong className="font-semibold text-mf-ink dark:text-foreground">80.05%</strong> of the total variance.
    </>,
    'This means PC1, PC2, and PC3 capture most of the important numeric patterns while making the data easier to visualize and cluster.',
  ],
  [
    <>
      This plot shows medical procurement records in a three-dimensional PCA space before clustering. PC1, PC2, and PC3
      together explain about{' '}
      <strong className="font-semibold text-mf-ink dark:text-foreground">80%</strong> of the variation in the selected
      numeric features.
    </>,
    'The visible dense regions and separated layers suggest that procurement records have meaningful structure. This PCA space is used as the input for K-means and DBSCAN clustering.',
  ],
]

const KMEANS_PCA_CAPTIONS: FigureCaptions = [
  'This plot shows the six K-means clusters in the 3D PCA space. Each point represents a medical procurement record, and each color represents one assigned cluster.',
  <>
    The model used{' '}
    <strong className="font-semibold text-mf-ink dark:text-foreground">K = 6</strong> and assigned all{' '}
    <strong className="font-semibold text-mf-ink dark:text-foreground">487,605 records</strong> to a cluster. The chart
    displays a 30,000-point sample only to keep the visualization readable.
  </>,
]

const DBSCAN_PCA_CAPTIONS: FigureCaptions = [
  <>
    This plot shows the DBSCAN clusters in 3D PCA space. Because DBSCAN produced{' '}
    <strong className="font-semibold text-mf-ink dark:text-foreground">386 clusters</strong>, only the top five largest
    clusters are shown separately, while smaller clusters are grouped as "Other DBSCAN clusters."
  </>,
  <>
    The grey points represent noise or outlier-like records. DBSCAN labeled about{' '}
    <strong className="font-semibold text-mf-ink dark:text-foreground">73.27%</strong> of records as noise, meaning most
    records were not part of a dense enough group under the selected settings.
  </>,
]

const DBSCAN_BARS_CAPTIONS: FigureCaptions = [
  'Top 60 clusters by size after sorting (noise appears when present in the extract). Hundreds of smaller DBSCAN components exist beyond what the axis can label legibly.',
  <>
    Source: <code className="rounded bg-slate-100 px-1 py-0.5 text-xs text-slate-700 dark:bg-muted dark:text-foreground">/results/04B/Summaries/dbscan_cluster_counts.json</code> — truncated here for presentation only.
  </>,
]

export function ClusteringPage() {
  const { data: dbscan } = useJsonData<DbscanCountFile>(DATA_PATHS.clusterCountsDbscan)
  const [gallery, setGallery] = useState<{ imgs: GalleryImage[]; idx: number }>({
    imgs: [],
    idx: 0,
  })

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
      <LightboxGallery
        images={gallery.imgs}
        index={gallery.idx}
        open={gallery.imgs.length > 0}
        onClose={() => setGallery({ imgs: [], idx: 0 })}
      />

      <div className="flex gap-8">
        <div className="min-w-0 flex-1 space-y-12">
          <SectionWrapper id="clustering-pca">
            <SectionHeader
              title="Principal component analysis"
              subtitle="Variance capture and loadings; interactive 3D PCA views live on Interpretation."
              icon={Cpu}
            />

            <div className="mx-auto flex w-full max-w-3xl flex-col gap-14">
              {IMAGES.clustering.pca.map((img, idx) => (
                <ClusterFigureLayout
                  key={img.src}
                  figureNum={idx + 1}
                  title={img.title}
                  footerParagraphs={PCA_DESCRIPTIONS[idx]}
                >
                  <ImageCard
                    src={img.src}
                    title={img.title}
                    hideInlineTitle
                    onClick={() =>
                      open(
                        IMAGES.clustering.pca.map((item) => ({ src: item.src, title: item.title })),
                        idx,
                      )
                    }
                  />
                </ClusterFigureLayout>
              ))}
            </div>
          </SectionWrapper>

          <SectionWrapper id="clustering-kmeans">
            <SectionHeader title="K-Means Clustering" subtitle="Numeric cluster overlay on PC1–PC3." />
            <div className="mx-auto flex w-full max-w-3xl flex-col gap-14">
              {IMAGES.clustering.kmeans.map((img, idx) => (
                <ClusterFigureLayout
                  key={img.src}
                  figureNum={4}
                  title={img.title}
                  footerParagraphs={KMEANS_PCA_CAPTIONS}
                >
                  <ImageCard
                    src={img.src}
                    title={img.title}
                    hideInlineTitle
                    onClick={() =>
                      open(
                        IMAGES.clustering.kmeans.map((item) => ({ src: item.src, title: item.title })),
                        idx,
                      )
                    }
                  />
                </ClusterFigureLayout>
              ))}
            </div>
          </SectionWrapper>

          <SectionWrapper id="clustering-dbscan">
            <SectionHeader
              title="DBSCAN Clustering"
              subtitle="Highlighting micro‑segments and noise share (top 60 bars for legibility)."
            />

            <div className="mx-auto flex w-full max-w-3xl flex-col gap-14">
              {IMAGES.clustering.dbscan.map((img, idx) => (
                <ClusterFigureLayout
                  key={img.src}
                  figureNum={5}
                  title={img.title}
                  footerParagraphs={DBSCAN_PCA_CAPTIONS}
                >
                  <ImageCard
                    src={img.src}
                    title={img.title}
                    hideInlineTitle
                    onClick={() =>
                      open(
                        IMAGES.clustering.dbscan.map((item) => ({ src: item.src, title: item.title })),
                        idx,
                      )
                    }
                  />
                </ClusterFigureLayout>
              ))}

              <ClusterFigureLayout
                figureNum={6}
                title="DBSCAN cluster cardinalities (presentation slice)"
                footerParagraphs={DBSCAN_BARS_CAPTIONS}
              >
                <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
                  <div className="h-[420px]">
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
                </div>
              </ClusterFigureLayout>
            </div>
          </SectionWrapper>

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
        </div>

        <aside className="medflow-no-print hidden w-48 shrink-0 xl:block">
          <PageTOC sections={TOC_CLUSTERING_NAV} />
        </aside>
      </div>
    </PageShell>
  )
}
