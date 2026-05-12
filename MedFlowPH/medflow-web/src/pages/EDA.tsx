import { motion } from 'framer-motion'
import { AlertTriangle, BarChart3 } from 'lucide-react'
import { useEffect, useMemo, useState } from 'react'
import { PageTOC, TOC_EDA } from '../components/PageTOC'
import { SectionHeader } from '../components/SectionHeader'
import { ImageCard } from '../components/ImageCard'
import { IframePanel } from '../components/IframePanel'
import type { GalleryImage } from '../components/LightboxGallery'
import { LightboxGallery } from '../components/LightboxGallery'
import { MetricCard } from '../components/MetricCard'
import { PhilgepsRawSummaryView } from '../components/PhilgepsRawSummaryView'
import { PageShell } from '../components/PageShell'
import { SectionWrapper } from '../components/SectionWrapper'
import { filenameToTitle, IMAGES } from '../data/fileManifest'

// Raw Understanding
const RAW_SCHEMA = '/results/00/Raw Dataset Schema/philgeps_raw_schema_table.png'
const RAW_SUMMARY = '/results/00/Summaries/philgeps_understanding_summary.txt'

// Cleaning
const CLEANED_SCHEMA = '/results/01/Data Schema/philgeps_cleaned_schema_table.png'
const MISSINGNESS = '/results/01/Exploratory Data Analysis/merged/01_overview_missingness_pct.png'
const CLEANING_SUMMARY = '/results/01/Summaries/philgeps_cleaning_summary_table.png'

// Exploration (merged EDA)
const NUMERIC_CORR = '/results/01/Exploratory Data Analysis/merged/04_correlation_numeric.png'
const CAT_CORR = '/results/01/Exploratory Data Analysis/merged/05_correlation_categorical_cramers_v.png'
const DTYPE_COUNTS = '/results/01/Exploratory Data Analysis/merged/02_overview_dtype_counts.png'
const ROWS_BY_YEAR = '/results/01/Exploratory Data Analysis/merged/06_rows_by_year_cleaned_medical.png'
const RAW_VS_CLEANED = '/results/01/Exploratory Data Analysis/merged/07_raw_vs_cleaned_rows_by_year_grouped.png'
const STACKED = '/results/01/Exploratory Data Analysis/merged/08_raw_vs_cleaned_stacked_by_year.png'

// Preprocessing
const NUMERIC_CORR_02 = '/results/02/Feature Selection/04_numeric_correlation.png'
const TOPK_GRID = '/results/02/Feature Selection/07_topk_grid.png'
const POST_SCALE = '/results/02/Min-Max Scaling/03_post_scale_summary.png'
const POST_SCALE_CORR = '/results/02/Min-Max Scaling/04_post_scale_correlation.png'
const DUMMY_COUNT = '/results/02/One-Hot Encoding/01_dummy_count_per_source.png'
const TOP_DUMMIES = '/results/02/One-Hot Encoding/04_top_dummies_by_rate.png'

// PCA
const PCA_LOADINGS = '/results/03/Clustering/pca_loadings_pc123.png'
const PCA_VARIANCE = '/results/03/Clustering/cumulative_variance_pca.png'
const PCA_3D = '/results/03/Clustering/pca_space_pc123_3d.png'
const PCA_3D_SOLID = '/results/03/Clustering/pca_space_pc123_3d_solid.png'
const PCA_INTERACTIVE = '/results/03/Clustering/pca_space_pc123_3d_interactive.html'

// K-Means
const KMEANS_NUMERIC = '/results/04/PCA_Cluster/pca_space_pc123_3d_kmeans_numeric.png'
const KMEANS_SEMANTIC = '/results/04/PCA_Cluster/pca_space_pc123_3d_kmeans_semantic.png'
const KMEANS_INTERACTIVE = '/results/04/PCA_Cluster/pca_space_pc123_3d_kmeans_interactive.html'

// DBSCAN
const DBSCAN_NUMERIC = '/results/04B/PCA_Cluster/pca_space_pc123_3d_dbscan_numeric.png'
const DBSCAN_SEMANTIC = '/results/04B/PCA_Cluster/pca_space_pc123_3d_dbscan_semantic.png'
const DBSCAN_INTERACTIVE = '/results/04B/PCA_Cluster/pca_space_pc123_3d_dbscan_interactive.html'
const DBSCAN_LEGEND = '/results/04B/PCA_Cluster/dbscan_semantic_legend_table.txt'

// K-Means Evaluation
const METRIC_RANK = '/results/05/EDA/metric_rank_heatmap.png'
const SILHOUETTE_K = '/results/05/KSelection/silhouette_vs_k.png'
const DB_K = '/results/05/KSelection/davies_bouldin_vs_k.png'
const CH_K = '/results/05/KSelection/calinski_harabasz_vs_k.png'
const COMPOSITE_K = '/results/05/KSelection/composite_vs_k.png'
const COMBINED_K = '/results/05/KSelection/combined_silhouette_db_ch_composite_vs_k.png'

// DBSCAN Evaluation
const DBSCAN_METRIC_RANK = '/results/05B/EDA/metric_rank_heatmap.png'
const DBSCAN_SIZES = '/results/05B/EDA/dbscan_cluster_sizes_best_params.png'
const DBSCAN_NOISE_HM = '/results/05B/DBSCAN_Evaluation/dbscan_noise_share_heatmap.png'
const DBSCAN_SIL_HM = '/results/05B/DBSCAN_Evaluation/dbscan_silhouette_heatmap.png'
const DBSCAN_DB_HM = '/results/05B/DBSCAN_Evaluation/dbscan_davies_bouldin_heatmap.png'
const DBSCAN_N_HM = '/results/05B/DBSCAN_Evaluation/dbscan_n_clusters_heatmap.png'
const DBSCAN_COMP_HM = '/results/05B/DBSCAN_Evaluation/dbscan_composite_heatmap.png'

// Interpretation
const CLUSTER_SIZE_BAR = '/results/06/Cluster_Interpretation/EDA/cluster_size_bar.png'
const BASE_MEANS = '/results/06/Cluster_Interpretation/EDA/base_means_heatmap.png'
const THEME_MEANS = '/results/06/Cluster_Interpretation/EDA/theme_means_heatmap.png'
const THEME_Z = '/results/06/Cluster_Interpretation/EDA/theme_z_heatmap.png'

// Comparison
const COMPARISON_CLUSTER_COUNT = '/results/07/Model_Comparison/kmeans_vs_dbscan_cluster_count.png'
const COMPARISON_INTERP = '/results/07/Model_Comparison/kmeans_vs_dbscan_interpretability_score.png'
const COMPARISON_METRICS = '/results/07/Model_Comparison/kmeans_vs_dbscan_metric_comparison.png'
const COMPARISON_NOISE = '/results/07/Model_Comparison/kmeans_vs_dbscan_noise_share.png'
const COMPARISON_SIDE = '/results/07/Model_Comparison/kmeans_vs_dbscan_side_by_side.png'

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

export function EDA() {
  const [quarterKey, setQuarterKey] = useState<string | null>(null)
  const [gallery, setGallery] = useState<{ images: GalleryImage[]; idx: number }>({
    images: [],
    idx: 0,
  })

  const rawSummary = useFetchedText(RAW_SUMMARY)
  const dbscanLegend = useFetchedText(DBSCAN_LEGEND)

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
        <main className="min-w-0 flex-1 space-y-12 pb-16">
          <motion.div className="space-y-12">
            <SectionWrapper id="du-hero">
              <h1 className="mb-2 font-heading text-3xl font-bold text-slate-800 dark:text-foreground">
                Data Understanding
              </h1>
              <p className="mb-3 text-lg font-medium text-blue-700 dark:text-blue-400">
                Exploring and preparing PhilGEPS medical procurement data before clustering.
              </p>
              <p className="mb-6 max-w-3xl leading-relaxed text-slate-600 dark:text-muted-foreground">
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
              <p className="text-xs italic text-slate-400 dark:text-muted-foreground">
                These numbers describe the dataset preparation stage and are not yet the final clustering result.
              </p>
            </SectionWrapper>

            <SectionWrapper id="du-raw" title="00 - Raw Dataset Understanding">
              <p className="mb-6 leading-relaxed text-slate-600 dark:text-muted-foreground">
                The raw PhilGEPS extract spans tens of millions of procurement rows with dozens of administrative fields.
                Before modeling, we documented column roles, key identifiers, and obvious quality risks directly from the
                raw schema summary.
              </p>
              <ImageCard src={RAW_SCHEMA} title="Raw dataset schema (tabular overview)" />
              <p className="mt-4 text-sm leading-relaxed text-slate-500 dark:text-muted-foreground">
                The schema table anchors terminology for later cleaning rules—especially procurement modes, dates,
                budgets, and agency identifiers—so every downstream transformation can be traced back to an explicit raw
                column definition.
              </p>
              <div className="mt-6 rounded-xl border border-slate-200 bg-slate-50 p-4 dark:border-border dark:bg-muted/40">
                <p className="mb-3 text-xs font-semibold tracking-wide text-slate-600 dark:text-muted-foreground">
                  Raw summary
                </p>
                {rawSummary.text ? (
                  <div className="max-h-[min(70vh,44rem)] overflow-auto rounded-lg border border-slate-200 bg-white p-3 dark:border-border dark:bg-card">
                    <PhilgepsRawSummaryView text={rawSummary.text} />
                  </div>
                ) : rawSummary.failed ? (
                  <p className="text-xs text-slate-400">Summary file could not be loaded.</p>
                ) : (
                  <p className="text-xs text-slate-400">Loading summary…</p>
                )}
              </div>
            </SectionWrapper>

            <SectionWrapper id="du-cleaning" title="01 - Data Cleaning">
              <p className="mb-6 leading-relaxed text-slate-600 dark:text-muted-foreground">
                Cleaning aligned schemas, removed duplicates, standardized medical filtering, and surfaced missingness so
                analysts could trust row counts before feature work began.
              </p>
              <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
                <div>
                  <ImageCard src={CLEANED_SCHEMA} title="Cleaned dataset schema" />
                  <p className="mt-3 text-sm leading-relaxed text-slate-500 dark:text-muted-foreground">
                    Post-cleaning columns include engineered signals (log budgets, lags, procurement flags) layered on top
                    of the surviving PhilGEPS identifiers.
                  </p>
                </div>
                <div>
                  <ImageCard src={MISSINGNESS} title="Missingness overview (%)" />
                  <p className="mt-3 text-sm leading-relaxed text-slate-500 dark:text-muted-foreground">
                    Missingness plots guard against silent NA propagation—any spike here triggers explicit imputation or
                    drop rules prior to correlation analysis.
                  </p>
                </div>
                <div className="md:col-span-2">
                  <ImageCard src={CLEANING_SUMMARY} title="Cleaning summary table" />
                  <p className="mt-3 text-sm leading-relaxed text-slate-500 dark:text-muted-foreground">
                    The summary table consolidates deduplication totals, medical keyword retention, and quarter-level row
                    reconciliation against the raw feeds.
                  </p>
                </div>
              </div>
            </SectionWrapper>

            <SectionWrapper id="du-exploration" title="Cleaned Dataset Exploration">
              <p className="mb-6 leading-relaxed text-slate-600 dark:text-muted-foreground">
                Exploratory visuals validate relationships among numeric cadence features, categorical procurement codes,
                volume by year, and the impact of cleaning on longitudinal coverage.
              </p>
              <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3">
                <ImageCard
                  src={NUMERIC_CORR}
                  title="Numeric feature correlation"
                  caption="Pairwise Spearman-style overview for continuous procurement signals."
                />
                <ImageCard
                  src={CAT_CORR}
                  title="Categorical association heatmap"
                  caption="Cramér's V highlights dependencies among high-cardinality procurement categories."
                />
                <ImageCard
                  src={DTYPE_COUNTS}
                  title="dtype counts"
                  caption="Confirms the balance of numeric, categorical, and ID-like columns entering preprocessing."
                />
                <ImageCard
                  src={ROWS_BY_YEAR}
                  title="Rows by year (cleaned medical slice)"
                  caption="Shows temporal density after medical filtering."
                />
                <ImageCard
                  src={RAW_VS_CLEANED}
                  title="Raw vs cleaned rows by year"
                  caption="Grouped bars quantify how aggressive filtering reshapes each fiscal year."
                />
                <ImageCard
                  src={STACKED}
                  title="Stacked raw vs cleaned composition"
                  caption="Stacked view emphasizes proportional retention rather than absolute totals alone."
                />
              </div>
              <p className="mt-6 text-sm leading-relaxed text-slate-500 dark:text-muted-foreground">
                Together these boards demonstrate that medical procurement signals remain structured enough for PCA while
                also exposing heavy-tailed budgets and categorical leakage risks that motivate regularization in later
                steps.
              </p>
            </SectionWrapper>

            <SectionWrapper id="du-preprocessing" title="02 - Data Preprocessing">
              <p className="mb-6 leading-relaxed text-slate-600 dark:text-muted-foreground">
                Feature selection reduced collinearity, min-max scaling harmonized magnitudes, and one-hot encoding
                captured categorical structure without collapsing rare procurement modes.
              </p>

              <h3 className="mb-3 font-heading text-lg font-semibold text-mf-ink dark:text-foreground">
                Feature selection
              </h3>
              <div className="mb-6 grid grid-cols-1 gap-6 md:grid-cols-2">
                <ImageCard src={NUMERIC_CORR_02} title="Numeric correlation (step 02)" />
                <ImageCard src={TOPK_GRID} title="Top‑K feature grid" />
              </div>

              <div className="mb-10 rounded-r-xl border-l-4 border-amber-400 bg-amber-50 p-5 dark:border-amber-500 dark:bg-amber-950/40">
                <div className="flex gap-3">
                  <AlertTriangle className="mt-0.5 h-5 w-5 shrink-0 text-amber-600 dark:text-amber-400" aria-hidden />
                  <div>
                    <p className="font-semibold text-amber-900 dark:text-amber-100">
                      Important Note About Policy Theme Scores
                    </p>
                    <p className="mt-2 text-sm leading-relaxed text-amber-950/90 dark:text-amber-50/90">
                      Cluster IDs from later k-means runs are{' '}
                      <strong className="font-semibold">not</strong> substitutes for these engineered themes: k-means
                      partitions PCA space, while the theme scores are standalone proxies attached before scaling.
                      Columns include{' '}
                      <code className="rounded bg-amber-100/80 px-1 text-xs dark:bg-amber-900/60">
                        high_risk_shortage
                      </code>
                      ,{' '}
                      <code className="rounded bg-amber-100/80 px-1 text-xs dark:bg-amber-900/60">
                        low_risk_shortage
                      </code>
                      ,{' '}
                      <code className="rounded bg-amber-100/80 px-1 text-xs dark:bg-amber-900/60">overstocking</code>,{' '}
                      <code className="rounded bg-amber-100/80 px-1 text-xs dark:bg-amber-900/60">understocking</code>,{' '}
                      <code className="rounded bg-amber-100/80 px-1 text-xs dark:bg-amber-900/60">normal_inventory</code>
                      ,{' '}
                      <code className="rounded bg-amber-100/80 px-1 text-xs dark:bg-amber-900/60">
                        unequal_supply_regions
                      </code>
                      , and{' '}
                      <code className="rounded bg-amber-100/80 px-1 text-xs dark:bg-amber-900/60">
                        equal_supply_regions
                      </code>{' '}
                      — each constrained to [0, 1] and interpreted as procurement-process proxies rather than confirmed
                      inventory ground truth.
                    </p>
                  </div>
                </div>
              </div>

              <h3 className="mb-3 font-heading text-lg font-semibold text-mf-ink dark:text-foreground">
                Min‑Max scaling
              </h3>
              <div className="mb-10 grid grid-cols-1 gap-6 md:grid-cols-2">
                <ImageCard src={POST_SCALE} title="Post‑scaling summary" />
                <ImageCard src={POST_SCALE_CORR} title="Post‑scaling correlation" />
              </div>

              <h3 className="mb-3 font-heading text-lg font-semibold text-mf-ink dark:text-foreground">
                One‑hot encoding
              </h3>
              <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
                <ImageCard src={DUMMY_COUNT} title="Dummy column counts by source" />
                <ImageCard src={TOP_DUMMIES} title="Top dummy levels by prevalence" />
              </div>
            </SectionWrapper>

            <SectionWrapper id="du-pca" title="03 - Principal Component Analysis">
              <p className="mb-6 leading-relaxed text-slate-600 dark:text-muted-foreground">
                PCA compresses the scaled feature block into orthogonal axes that preserve bulk variance while enabling 3D
                visualization prior to clustering overlays.
              </p>
              <div className="mb-6 grid grid-cols-1 gap-6 md:grid-cols-2">
                <ImageCard src={PCA_LOADINGS} title="PCA loadings (PC1–PC3)" />
                <ImageCard src={PCA_VARIANCE} title="Cumulative explained variance" />
              </div>
              <div className="mb-6 grid grid-cols-1 gap-6 md:grid-cols-2">
                <ImageCard src={PCA_3D} title="PCA space — translucent view" />
                <ImageCard src={PCA_3D_SOLID} title="PCA space — solid view" />
              </div>
              <IframePanel src={PCA_INTERACTIVE} title="Interactive PCA View" height={600} />
            </SectionWrapper>

            <SectionWrapper id="du-kmeans" title="04A - K-Means Clustering">
              <p className="mb-4 leading-relaxed text-slate-600 dark:text-muted-foreground">
                K-means partitions the PCA embedding into six balanced segments that remain straightforward to narrate for
                procurement stakeholders.
              </p>
              <div className="mb-6 flex flex-wrap gap-3">
                <span className="rounded-lg border border-blue-200 bg-blue-50 px-4 py-2 text-xs font-medium text-blue-900 dark:border-blue-800 dark:bg-blue-950/50 dark:text-blue-100">
                  Total records: 487,605
                </span>
                <span className="rounded-lg border border-blue-200 bg-blue-50 px-4 py-2 text-xs font-medium text-blue-900 dark:border-blue-800 dark:bg-blue-950/50 dark:text-blue-100">
                  Selected K: 6
                </span>
                <span className="rounded-lg border border-blue-200 bg-blue-50 px-4 py-2 text-xs font-medium text-blue-900 dark:border-blue-800 dark:bg-blue-950/50 dark:text-blue-100">
                  Largest cluster: Cluster 3 — 163,091 records
                </span>
                <span className="rounded-lg border border-blue-200 bg-blue-50 px-4 py-2 text-xs font-medium text-blue-900 dark:border-blue-800 dark:bg-blue-950/50 dark:text-blue-100">
                  Smallest cluster: Cluster 2 — 38,657 records
                </span>
              </div>
              <div className="mb-6 grid grid-cols-1 gap-6 md:grid-cols-2">
                <ImageCard src={KMEANS_NUMERIC} title="K‑Means clusters — numeric coloring" />
                <ImageCard src={KMEANS_SEMANTIC} title="K‑Means clusters — semantic coloring" />
              </div>
              <IframePanel src={KMEANS_INTERACTIVE} title="Interactive K-Means PCA View" height={600} />
            </SectionWrapper>

            <SectionWrapper id="du-dbscan" title="04B - DBSCAN Clustering">
              <p className="mb-4 leading-relaxed text-slate-600 dark:text-muted-foreground">
                DBSCAN emphasizes dense procurement neighborhoods while labeling sparse regions as noise—yielding many
                micro-clusters alongside a dominant noise tail.
              </p>
              <div className="mb-6 flex flex-wrap gap-3">
                <span className="rounded-lg border border-amber-200 bg-amber-50 px-4 py-2 text-xs font-medium text-amber-950 dark:border-amber-800 dark:bg-amber-950/40 dark:text-amber-100">
                  Non-noise clusters: 386
                </span>
                <span className="rounded-lg border border-amber-200 bg-amber-50 px-4 py-2 text-xs font-medium text-amber-950 dark:border-amber-800 dark:bg-amber-950/40 dark:text-amber-100">
                  Noise records: 357,290
                </span>
                <span className="rounded-lg border border-amber-200 bg-amber-50 px-4 py-2 text-xs font-medium text-amber-950 dark:border-amber-800 dark:bg-amber-950/40 dark:text-amber-100">
                  Noise share: 73.27%
                </span>
                <span className="rounded-lg border border-amber-200 bg-amber-50 px-4 py-2 text-xs font-medium text-amber-950 dark:border-amber-800 dark:bg-amber-950/40 dark:text-amber-100">
                  Largest cluster: Cluster 25 — 94,311 records
                </span>
              </div>
              <div className="mb-6 grid grid-cols-1 gap-6 md:grid-cols-2">
                <ImageCard src={DBSCAN_NUMERIC} title="DBSCAN clusters — numeric coloring" />
                <ImageCard src={DBSCAN_SEMANTIC} title="DBSCAN clusters — semantic coloring" />
              </div>
              <IframePanel src={DBSCAN_INTERACTIVE} title="Interactive DBSCAN PCA View" height={600} />

              <div className="mt-6 rounded-xl border border-blue-200 bg-blue-50 p-5 dark:border-blue-900 dark:bg-blue-950/40">
                <p className="text-sm leading-relaxed text-blue-950 dark:text-blue-50">
                  Because DBSCAN produced 386 clusters, the visualization shows only the top five largest non-noise clusters
                  separately. Smaller clusters are grouped as &quot;Other DBSCAN clusters,&quot; while noise records are
                  shown separately.
                </p>
              </div>

              <div className="mt-6 rounded-xl border border-slate-200 bg-white p-4 dark:border-border dark:bg-card">
                <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-slate-500 dark:text-muted-foreground">
                  Semantic legend (text)
                </p>
                {dbscanLegend.text ? (
                  <pre className="max-h-64 overflow-auto whitespace-pre-wrap text-xs text-slate-700 dark:text-foreground">
                    {dbscanLegend.text}
                  </pre>
                ) : dbscanLegend.failed ? (
                  <p className="text-xs text-slate-400">Legend file could not be loaded.</p>
                ) : (
                  <p className="text-xs text-slate-400">Loading legend…</p>
                )}
              </div>
            </SectionWrapper>

            <SectionWrapper id="du-eval-kmeans" title="05A - Evaluating K-Means">
              <p className="mb-6 leading-relaxed text-slate-600 dark:text-muted-foreground">
                Hyperparameter sweeps contrast internal clustering indices to justify the reported k-means configuration.
              </p>
              <div className="mb-8 grid grid-cols-1 gap-4 md:grid-cols-2">
                <div className="rounded-xl border border-slate-200 bg-white p-4 dark:border-border dark:bg-card">
                  <p className="font-semibold text-mf-ink dark:text-foreground">Silhouette score</p>
                  <p className="mt-2 text-sm text-slate-600 dark:text-muted-foreground">
                    Higher is better — captures how tightly points match their own cluster versus neighboring clusters.
                  </p>
                </div>
                <div className="rounded-xl border border-slate-200 bg-white p-4 dark:border-border dark:bg-card">
                  <p className="font-semibold text-mf-ink dark:text-foreground">Davies–Bouldin index</p>
                  <p className="mt-2 text-sm text-slate-600 dark:text-muted-foreground">
                    Lower is better — summarizes within-cluster scatter relative to between-cluster separation.
                  </p>
                </div>
                <div className="rounded-xl border border-slate-200 bg-white p-4 dark:border-border dark:bg-card">
                  <p className="font-semibold text-mf-ink dark:text-foreground">Calinski–Harabasz score</p>
                  <p className="mt-2 text-sm text-slate-600 dark:text-muted-foreground">
                    Higher is better — rewards dense, well-separated partitions for a chosen k.
                  </p>
                </div>
                <div className="rounded-xl border border-slate-200 bg-white p-4 dark:border-border dark:bg-card">
                  <p className="font-semibold text-mf-ink dark:text-foreground">Composite score</p>
                  <p className="mt-2 text-sm text-slate-600 dark:text-muted-foreground">
                    Higher is better — aggregates normalized silhouette, Davies–Bouldin, and Calinski–Harabasz traces into a
                    single ranking-friendly curve.
                  </p>
                </div>
              </div>

              <div className="mb-6">
                <ImageCard src={METRIC_RANK} title="Metric rank heatmap (k-means search)" />
              </div>
              <div className="mb-6 grid grid-cols-1 gap-6 md:grid-cols-2">
                <ImageCard src={SILHOUETTE_K} title="Silhouette vs k" />
                <ImageCard src={DB_K} title="Davies–Bouldin vs k" />
                <ImageCard src={CH_K} title="Calinski–Harabasz vs k" />
                <ImageCard src={COMPOSITE_K} title="Composite score vs k" />
              </div>
              <ImageCard src={COMBINED_K} title="Combined silhouette, DB, CH, and composite vs k" />
            </SectionWrapper>

            <SectionWrapper id="du-eval-dbscan" title="05B - Evaluating DBSCAN">
              <p className="mb-6 leading-relaxed text-slate-600 dark:text-muted-foreground">
                DBSCAN grids explore stability of noise share, silhouette substitutes, and composite rankings across
                epsilon/minPts combinations.
              </p>
              <div className="mb-6 grid grid-cols-1 gap-6 md:grid-cols-2">
                <ImageCard src={DBSCAN_METRIC_RANK} title="DBSCAN metric rank heatmap" />
                <ImageCard src={DBSCAN_SIZES} title="Cluster sizes at best parameters" />
              </div>
              <div className="mb-6 grid grid-cols-1 gap-6 md:grid-cols-2">
                <ImageCard src={DBSCAN_NOISE_HM} title="Noise share heatmap" />
                <ImageCard src={DBSCAN_SIL_HM} title="Silhouette heatmap" />
                <ImageCard src={DBSCAN_DB_HM} title="Davies–Bouldin heatmap" />
                <ImageCard src={DBSCAN_N_HM} title="Cluster-count heatmap" />
              </div>
              <ImageCard src={DBSCAN_COMP_HM} title="Composite DBSCAN heatmap" />
            </SectionWrapper>

            <SectionWrapper id="du-interp-kmeans" title="06A - K-Means Cluster Interpretation Preview">
              <div className="mb-6 rounded-xl border border-blue-200 bg-blue-50 p-5 dark:border-blue-900 dark:bg-blue-950/40">
                <p className="text-sm leading-relaxed text-blue-950 dark:text-blue-50">
                  The semantic labels are explanation guides only. They were not used to form the clusters.
                </p>
              </div>
              <div className="mb-6">
                <ImageCard src={CLUSTER_SIZE_BAR} title="Cluster size distribution" />
              </div>
              <div className="mb-6 grid grid-cols-1 gap-6 md:grid-cols-2">
                <ImageCard src={BASE_MEANS} title="Base feature means by cluster" />
                <ImageCard src={THEME_MEANS} title="Theme score means by cluster" />
              </div>
              <ImageCard src={THEME_Z} title="Theme z-scores by cluster" />
            </SectionWrapper>

            <SectionWrapper id="du-interp-dbscan" title="06B - DBSCAN Interpretation Preview">
              <p className="mb-4 leading-relaxed text-slate-600 dark:text-muted-foreground">
                Dense pockets of procurement behavior surface as medium-sized DBSCAN clusters, but hundreds of micro-clusters
                mean centroid narratives quickly become unwieldy without additional hierarchical merging.
              </p>
              <p className="mb-4 leading-relaxed text-slate-600 dark:text-muted-foreground">
                Noise dominance (73.27% of rows) highlights procurement transactions that do not sit near any stable local
                mode—often thin agencies, rare items, or fragmented spend traces—so analysts should treat DBSCAN partitions
                as exploratory overlays rather than polished stakeholder segments.
              </p>
              <p className="mb-6 leading-relaxed text-slate-600 dark:text-muted-foreground">
                Where semantic coloring is shown, it inherits the same disclaimer as k-means: labels summarize thematic
                contrasts post hoc and never steer the density estimator itself.
              </p>
              <div className="rounded-xl border border-blue-200 bg-blue-50 p-5 dark:border-blue-900 dark:bg-blue-950/40">
                <p className="text-sm leading-relaxed text-blue-950 dark:text-blue-50">
                  DBSCAN is useful for exploring dense procurement groups and noise records, while K-means remains easier to
                  use for broad final cluster reporting.
                </p>
              </div>
            </SectionWrapper>

            <SectionWrapper id="du-comparison" title="07 - Model Comparison">
              <p className="mb-6 leading-relaxed text-slate-600 dark:text-muted-foreground">
                Side-by-side charts quantify interpretability, stability, noise tolerance, and centroid separation contrasts
                between the six-cluster k-means solution and the high-partition DBSCAN run.
              </p>
              <div className="mb-6 grid grid-cols-1 gap-6 md:grid-cols-2">
                <ImageCard src={COMPARISON_CLUSTER_COUNT} title="Cluster count comparison" />
                <ImageCard src={COMPARISON_INTERP} title="Interpretability score comparison" />
                <ImageCard src={COMPARISON_METRICS} title="Metric comparison" />
                <ImageCard src={COMPARISON_NOISE} title="Noise share comparison" />
              </div>
              <ImageCard src={COMPARISON_SIDE} title="Side-by-side procurement portraits" />
            </SectionWrapper>

            <SectionWrapper id="du-conclusion" title="Data Understanding Summary">
              <div className="rounded-2xl bg-slate-800 p-8 text-white dark:bg-slate-900">
                <p className="leading-relaxed">
                  This walkthrough traced PhilGEPS medical procurement data from raw chaos—millions of heterogeneous rows
                  and forty-six administrative columns—through disciplined cleaning, exploratory validation, and structured
                  preprocessing that prepares a{' '}
                  <span className="font-semibold text-blue-300">487,605</span>-row tensor ready for PCA-backed clustering.
                </p>
                <p className="mt-4 leading-relaxed">
                  <span className="font-semibold text-blue-300">K-means</span> delivers a compact six-cluster story that
                  pairs cleanly with policy-theme overlays, whereas{' '}
                  <span className="font-semibold text-teal-300">DBSCAN</span> exposes dense procurement islands alongside a
                  substantial noise reservoir—choose <span className="font-semibold text-blue-300">K-means</span> when
                  executives need stable cohort labels and leverage{' '}
                  <span className="font-semibold text-teal-300">DBSCAN</span> when investigators must audit outliers or hunt
                  for micro-patterns before collapsing segments downstream.
                </p>
              </div>
            </SectionWrapper>

            <div className="border-t border-slate-200 pt-12 dark:border-border" />

            <div className="space-y-10">
              <SectionWrapper id="eda-overview" title="Interactive chart gallery">
                <SectionHeader
                  title="Merged quarterly panels"
                  subtitle="Quarterly explorers highlight slice evolution; merged boards synthesize longitudinal behavior."
                  icon={BarChart3}
                />
                <p className="mt-4 text-sm text-mf-muted dark:text-muted-foreground">
                  This gallery supports the data cleaning narrative: read consolidated boards for the full study window, then
                  optionally filter to a single quarter to narrate procurement seasonality before moving downstream to
                  preprocessing and modeling.
                </p>
              </SectionWrapper>

              <SectionWrapper id="eda-merged" title="Merged charts">
                <p className="mb-4 text-sm text-mf-muted dark:text-muted-foreground">
                  Consolidated figures (merged board) aggregate every quarter in the PhilGEPS medical slice.
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
            </div>

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
