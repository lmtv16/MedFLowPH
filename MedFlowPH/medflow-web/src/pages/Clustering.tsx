import { ImageCard } from '../components/ImageCard'
import { PageShell } from '../components/PageShell'
import { PageTOC, TOC_CLUSTERING_NAV } from '../components/PageTOC'
import { SectionWrapper } from '../components/SectionWrapper'

const KMEANS_NUMERIC = '/results/04/PCA_Cluster/pca_space_pc123_3d_kmeans_numeric.png'
const DBSCAN_NUMERIC = '/results/04B/PCA_Cluster/pca_space_pc123_3d_dbscan_numeric.png'

export function ClusteringPage() {
  return (
    <PageShell>
      <div className="flex gap-8">
        <div className="min-w-0 flex-1 space-y-12 overflow-x-hidden">
          <SectionWrapper id="du-kmeans" title="K-means Clustering">
            <div className="mb-4 space-y-3 text-mf-body leading-relaxed text-slate-600 dark:text-muted-foreground">
              <p>
                This plot shows the six K-means clusters in the 3D PCA space. Each point represents a medical procurement
                record, and each color represents one assigned cluster.
              </p>
              <p>
                The model used{' '}
                <strong className="font-semibold text-mf-ink dark:text-foreground">K = 6</strong> and assigned all{' '}
                <strong className="font-semibold text-mf-ink dark:text-foreground">487,605 records</strong> to a cluster.
                The chart displays a 30,000-point sample only to keep the visualization readable.
              </p>
            </div>
            <div className="mb-6 flex flex-wrap gap-3">
              <span className="rounded-lg border border-blue-200 bg-blue-50 px-4 py-2 text-mf-caption font-medium text-blue-900 dark:border-blue-800 dark:bg-blue-950/50 dark:text-blue-100">
                Total records: 487,605
              </span>
              <span className="rounded-lg border border-blue-200 bg-blue-50 px-4 py-2 text-mf-caption font-medium text-blue-900 dark:border-blue-800 dark:bg-blue-950/50 dark:text-blue-100">
                Selected K: 6
              </span>
              <span className="rounded-lg border border-blue-200 bg-blue-50 px-4 py-2 text-mf-caption font-medium text-blue-900 dark:border-blue-800 dark:bg-blue-950/50 dark:text-blue-100">
                Largest cluster: Cluster 3 — 163,091 records
              </span>
              <span className="rounded-lg border border-blue-200 bg-blue-50 px-4 py-2 text-mf-caption font-medium text-blue-900 dark:border-blue-800 dark:bg-blue-950/50 dark:text-blue-100">
                Smallest cluster: Cluster 2 — 38,657 records
              </span>
            </div>
            <div className="mb-6">
              <ImageCard src={KMEANS_NUMERIC} title="K-means PCA Cluster Plot" />
            </div>
          </SectionWrapper>

          <SectionWrapper id="du-dbscan" title="DBSCAN Clustering">
            <div className="mb-4 space-y-3 text-mf-body leading-relaxed text-slate-600 dark:text-muted-foreground">
              <p>
                This plot shows the DBSCAN clusters in 3D PCA space. Because DBSCAN produced{' '}
                <strong className="font-semibold text-mf-ink dark:text-foreground">386 clusters</strong>, only the top
                five largest clusters are shown separately, while smaller clusters are grouped as &quot;Other DBSCAN
                clusters.&quot;
              </p>
              <p>
                The grey points represent noise or outlier-like records. DBSCAN labeled about{' '}
                <strong className="font-semibold text-mf-ink dark:text-foreground">73.27%</strong> of records as noise,
                meaning most records were not part of a dense enough group under the selected settings.
              </p>
            </div>
            <div className="mb-6 flex flex-wrap gap-3">
              <span className="rounded-lg border border-amber-200 bg-amber-50 px-4 py-2 text-mf-caption font-medium text-amber-950 dark:border-amber-800 dark:bg-amber-950/40 dark:text-amber-100">
                Non-noise clusters: 386
              </span>
              <span className="rounded-lg border border-amber-200 bg-amber-50 px-4 py-2 text-mf-caption font-medium text-amber-950 dark:border-amber-800 dark:bg-amber-950/40 dark:text-amber-100">
                Noise records: 357,290
              </span>
              <span className="rounded-lg border border-amber-200 bg-amber-50 px-4 py-2 text-mf-caption font-medium text-amber-950 dark:border-amber-800 dark:bg-amber-950/40 dark:text-amber-100">
                Noise share: 73.27%
              </span>
              <span className="rounded-lg border border-amber-200 bg-amber-50 px-4 py-2 text-mf-caption font-medium text-amber-950 dark:border-amber-800 dark:bg-amber-950/40 dark:text-amber-100">
                Largest cluster: Cluster 25 — 94,311 records
              </span>
            </div>
            <div className="mb-6">
              <ImageCard src={DBSCAN_NUMERIC} title="DBSCAN clusters — numeric coloring" />
            </div>

            <div className="mt-6 rounded-xl border border-blue-200 bg-blue-50 p-5 dark:border-blue-900 dark:bg-blue-950/40">
              <p className="text-mf-body leading-relaxed text-blue-950 dark:text-blue-50">
                Because DBSCAN produced 386 clusters, the visualization shows only the top five largest non-noise clusters
                separately. Smaller clusters are grouped as &quot;Other DBSCAN clusters,&quot; while noise records are
                shown separately.
              </p>
            </div>
          </SectionWrapper>

          <SectionWrapper id="clustering-approach-comparison">
            <h3 className="font-heading text-mf-card-title font-semibold text-mf-ink dark:text-foreground">
              K-Means vs DBSCAN: Approach Comparison
            </h3>
            <div className="mt-6 grid gap-6 md:grid-cols-2">
              <div className="rounded-xl border-2 border-mf-primary bg-blue-50/40 p-6 dark:border-primary dark:bg-blue-950/20">
                <h4 className="font-heading text-mf-caption font-semibold uppercase tracking-wide text-mf-primary dark:text-primary">
                  K-Means Approach
                </h4>
                <ul className="mt-4 list-disc space-y-2 pl-5 text-mf-body text-mf-muted dark:text-muted-foreground">
                  <li>Requires a fixed number of clusters (K)</li>
                  <li>Assigns every record to a cluster</li>
                  <li>Works well for compact, spherical groups</li>
                  <li>Complete record coverage</li>
                </ul>
              </div>
              <div className="rounded-xl border border-slate-300 bg-slate-50 p-6 dark:border-border dark:bg-muted/40">
                <h4 className="font-heading text-mf-caption font-semibold uppercase tracking-wide text-mf-muted dark:text-foreground">
                  DBSCAN Approach
                </h4>
                <ul className="mt-4 list-disc space-y-2 pl-5 text-mf-body text-mf-muted dark:text-muted-foreground">
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
