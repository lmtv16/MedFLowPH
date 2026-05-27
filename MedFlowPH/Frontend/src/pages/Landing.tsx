import {
  Award,
  Building2,
  Calendar,
  Database,
  DollarSign,
  FileText,
  Filter,
  GitCompare,
  Hash,
  Layers,
  LayoutDashboard,
  MapPin,
  Package,
  Shield,
  Tag,
  TrendingUp,
  UserCheck,
  Users,
} from 'lucide-react'
import { useMemo } from 'react'
import { useNavigate } from 'react-router-dom'
import { handleInteractiveRouting } from '../config/interactiveUrl'
import { MetricCard } from '../components/MetricCard'
import { PageShell } from '../components/PageShell'
import { PageTOC, TOC_LANDING } from '../components/PageTOC'
import { SectionWrapper } from '../components/SectionWrapper'
import { parsePhilgepsCleaningSummary, formatIntPh } from '../data/parsePhilgepsCleaningSummary'
import { DATA_PATHS, IMAGES } from '../data/fileManifest'
import { useJsonData, useTextData } from '../hooks/useCsvData'

type KSelectionSummary = {
  chosen_k: number
  metrics_per_k: {
    silhouette: number
    davies_bouldin?: number
  }[]
}

type ClusterCountsFile = {
  k: number
  n_total: number
}

type DbscanClusterSummary = {
  n_total: number
  n_clusters_excluding_noise: number
  n_noise: number
  noise_share: number
}

const RAW_VS_CLEANED_FIG = IMAGES.eda.merged.find((i) =>
  i.src.includes('raw_vs_cleaned_rows_by_year_grouped'),
) ?? IMAGES.eda.merged[6]

const MEDICAL_KEYWORD_PILLS = [
  "medical", "medicine", "pharmaceutical", "drug", "vaccine",
    "hospital", "laboratory", "diagnostic", "surgical",
    "clinic", "health", "therapeutic", "antibiotic",
    "syringe", "test kit", "reagent", "biomedical",
] as const

const DATA_FIELD_CATEGORIES: { label: string; icon: typeof Building2 }[] = [
  { label: 'Procuring Entity', icon: Building2 },
  { label: 'Location', icon: MapPin },
  { label: 'Procurement Mode', icon: Tag },
  { label: 'Item Details', icon: Package },
  { label: 'Budget', icon: DollarSign },
  { label: 'Contract Amount', icon: FileText },
  { label: 'Quantity', icon: Hash },
  { label: 'Dates', icon: Calendar },
  { label: 'Award Details', icon: Award },
  { label: 'Supplier', icon: Users },
]

export function Landing() {
  const navigate = useNavigate()

  const { data: ks } = useJsonData<KSelectionSummary>(DATA_PATHS.kSelectionSummary)
  const { data: clusters } = useJsonData<ClusterCountsFile>(DATA_PATHS.clusterCountsKmeans)
  const { data: dbscan } = useJsonData<DbscanClusterSummary>(DATA_PATHS.clusterCountsDbscan)
  const { text: cleaningText } = useTextData(DATA_PATHS.philgepsCleaningSummary)

  const cleaning = useMemo(() => parsePhilgepsCleaningSummary(cleaningText), [cleaningText])

  const silhouetteBest = ks?.metrics_per_k?.reduce(
    (best, row) =>
      typeof row?.silhouette === 'number' && row.silhouette > best ? row.silhouette : best,
    Number.NEGATIVE_INFINITY,
  )
  const silhouetteStr =
    silhouetteBest != null && Number.isFinite(silhouetteBest) ? silhouetteBest.toFixed(3) : '…'

  const recordCount =
    cleaning.featureRows ?? cleaning.afterCrossFileDedup ?? clusters?.n_total ?? 487_605
  const clustersK = ks?.chosen_k ?? clusters?.k ?? '—'
  const noisePct =
    typeof dbscan?.noise_share === 'number' ? (dbscan.noise_share * 100).toFixed(1) + '%' : '…'

  return (
    <PageShell>
      <div className="flex gap-8">
        <main className="min-w-0 flex-1 overflow-x-hidden">
          <div className="space-y-14">
            <SectionWrapper id="hero">
              <div className="rounded-3xl border border-border bg-gradient-to-br from-card via-primary/10 to-mf-secondary/12 p-4 shadow-sm sm:p-6 md:p-8 lg:p-12">
                <div className="flex flex-wrap gap-2">
                  <span className="rounded-full border border-primary/25 bg-primary/10 px-3 py-1 text-mf-nav text-primary">
                    Data Science Portfolio
                  </span>
                  <span className="rounded-full border border-primary/25 bg-primary/10 px-3 py-1 text-mf-nav text-primary">
                    Machine Learning
                  </span>
                </div>
                <h1 className="font-heading mt-4 text-mf-hero font-bold text-foreground">
                  MedFlow <span className="text-primary">PH</span>
                </h1>
                <p className="mt-4 max-w-3xl text-mf-hero-subtitle font-medium tracking-wide text-foreground">
                  MEDFLOW PH: An Unsupervised Clustering Analysis of Medical-Related Procurement Data from PhilGEPS in
                  Philippine Public Health Facilities
                </p>
                <p className="mt-4 max-w-3xl text-mf-body text-muted-foreground">
                  An exploratory unsupervised learning study applying PCA, K-Means, and DBSCAN to medical-related PhilGEPS
                  procurement data to uncover underlying procurement patterns across Philippine public health facilities.
                </p>

                <div className="mt-8 flex flex-wrap gap-4">
                  <button
                    type="button"
                    onClick={() => handleInteractiveRouting(() => void navigate('/eda'))}
                    className="inline-flex items-center justify-center rounded-xl bg-primary px-5 py-2.5 text-mf-nav font-semibold text-primary-foreground shadow hover:bg-primary/90"
                  >
                    Explore Dashboard
                  </button>
                  <button
                    type="button"
                    onClick={() => void navigate('/clustering')}
                    className="inline-flex items-center justify-center rounded-xl border border-border bg-card px-5 py-2.5 text-mf-nav font-semibold text-primary shadow-sm hover:bg-muted"
                  >
                    View Clustering
                  </button>
                </div>
              </div>
            </SectionWrapper>

            <SectionWrapper id="background" title="Background">
              <div className="space-y-4 text-mf-body leading-relaxed text-muted-foreground">
                <p>
                The study uses K-means and DBSCAN clustering to analyze aggregated medical-related 
                procurement and distribution data, revealing patterns such as understocking, overstocking, 
                high-value concentration, and delayed procurement across Philippine public health facilities.

                </p>
                <p>
                By converting raw procurement records into interpretable clusters and visual insights, it provides
                actionable guidance for policymakers and health administrators to monitor supply risks, improve 
                resource allocation, and enhance equitable access to essential medical resources.

                </p>
              </div>
            </SectionWrapper>

            <SectionWrapper id="data-collection" title="Data Collection">
              <div className="grid gap-8 md:grid-cols-2">
                <div className="space-y-4">
                  <p className="text-mf-body leading-relaxed text-muted-foreground">
                  MedFlow PH is built using publicly available procurement data from the Philippine Government Electronic Procurement System (PhilGEPS).
                  The study used award notice records from 2020 to 2025, covering both pandemic-related emergency procurement and regular medical procurement 
                  activities during this period.

                  </p>
                  <div className="inline-flex flex-col rounded-xl border border-primary/30 bg-primary/10 px-5 py-4">
                    <p className="text-mf-metric font-bold tabular-nums text-primary">6 Years</p>
                    <p className="text-mf-caption font-medium text-primary">of Data Processed (2020–2025)</p>
                  </div>
                </div>
                <div className="rounded-xl border border-border bg-card p-5 shadow-sm">
                  <h3 className="font-heading text-mf-card-title font-semibold text-foreground">Medical Filtering Strategy</h3>
                  <p className="mt-3 text-mf-body text-muted-foreground">
                    Since PhilGEPS contains all government procurement, we applied strict regex-based filtering to isolate public
                    health records using specific domain keywords:
                  </p>
                  <div className="mt-4 flex flex-wrap gap-2">
                    {MEDICAL_KEYWORD_PILLS.map((kw) => (
                      <span
                        key={kw}
                        className="rounded-full border border-border bg-muted px-2.5 py-0.5 text-mf-caption font-medium text-foreground"
                      >
                        {kw}
                      </span>
                    ))}
                  </div>
                </div>
              </div>
              <figure className="mt-8 overflow-hidden rounded-xl border border-border bg-muted/30">
                <img
                  src={RAW_VS_CLEANED_FIG.src}
                  alt={RAW_VS_CLEANED_FIG.title}
                  className="h-auto w-full object-contain"
                  loading="lazy"
                  decoding="async"
                />
                <figcaption className="border-t border-border bg-card px-4 py-3 text-center text-mf-caption leading-relaxed text-muted-foreground">
                Number of records kept after filtering medical-related procurement data from different years, reducing millions of general
                procurement records into a smaller set of relevant medical procurement records. 
                </figcaption>
              </figure>
            </SectionWrapper>

            <SectionWrapper id="data-description" title="Data Description">
              <p className="text-mf-body leading-relaxed text-muted-foreground">
              The PhilGEPS dataset contains information on government procurement transactions. Each row represents 
              one awarded contract or item and includes details about the buyer, cost, dates, and other relevant transaction information. 

              </p>
              <div className="mt-6 rounded-xl border border-border bg-card p-6 shadow-sm">
                <h3 className="font-heading text-mf-card-title font-semibold text-foreground">Key Field Categories</h3>
                <div className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                  {DATA_FIELD_CATEGORIES.map(({ label, icon: Icon }) => (
                    <div
                      key={label}
                      className="flex items-center gap-3 rounded-lg border border-border bg-muted/50 p-3"
                    >
                      <Icon className="h-5 w-5 shrink-0 text-primary" aria-hidden />
                      <span className="text-mf-body font-medium text-foreground">{label}</span>
                    </div>
                  ))}
                </div>
              </div>
            </SectionWrapper>

            <SectionWrapper id="dataset-snapshot" title="Dataset Snapshot">
              <div className="overflow-hidden rounded-2xl border border-border bg-card shadow-sm">
                <div className="border-b border-border px-6 py-4">
                  <h3 className="font-heading text-mf-card-title font-semibold text-foreground">Data pipeline</h3>
                  <p className="mt-1 text-mf-body text-muted-foreground">
                    Rebuilt from <code className="text-mf-caption font-mono">philgeps_cleaning_summary.txt</code> in results step 01.
                  </p>
                </div>
                <div className="grid gap-6 p-6 lg:grid-cols-[1fr_minmax(0,420px)] lg:items-center">
                  <div className="grid gap-4 sm:grid-cols-2">
                    <MetricCard
                      label="Raw rows loaded (all PhilGEPS files)"
                      value={formatIntPh(cleaning.inputRows)}
                      delta="Before medical keyword filter."
                    />
                    <MetricCard
                      label="After medical filter (pre dedup)"
                      value={formatIntPh(cleaning.medicalFilterOutputRows)}
                      delta="Regex on item / UNSPSC text fields."
                    />
                    <MetricCard
                      label="Final analysis table"
                      value={formatIntPh(cleaning.featureRows ?? cleaning.afterCrossFileDedup)}
                      delta="After within-file and cross-file duplicate removal."
                    />
                    <MetricCard
                      label="Feature columns"
                      value={formatIntPh(cleaning.featureColumns)}
                      delta="Width of cleaned medical procurement schema."
                    />
                  </div>
                  <figure className="overflow-hidden rounded-xl border border-border bg-muted/30">
                    <img
                      src={RAW_VS_CLEANED_FIG.src}
                      alt={RAW_VS_CLEANED_FIG.title}
                      className="h-auto w-full object-contain"
                      loading="lazy"
                      decoding="async"
                    />
                    <figcaption className="border-t border-border px-3 py-2 text-center text-mf-caption text-muted-foreground">
                      {RAW_VS_CLEANED_FIG.title}
                    </figcaption>
                  </figure>
                </div>
              </div>

              <div className="mt-10">
                <h3 className="font-heading text-mf-section font-semibold text-foreground">Clustering &amp; models</h3>
                <p className="mt-2 text-mf-body text-muted-foreground">
                  Values from K‑selection JSON, K‑Means cluster counts, and DBSCAN summary in{' '}
                  <code className="text-mf-caption font-mono">/public/results/04</code> and <code className="text-mf-caption font-mono">04B</code>.
                </p>
                <div className="mt-6 grid gap-4 md:grid-cols-2 xl:grid-cols-3">
                  <MetricCard label="Rows in clustering frame" value={`${formatIntPh(recordCount)}`} />
                  <MetricCard label="Quarter window" value="2020 Q2 → 2025 Q3" />
                  <MetricCard
                    label="K‑Means clusters (chosen k)"
                    value={clustersK?.toString() ?? '…'}
                    delta="From k‑selection summary aligned with PCA pipeline."
                  />
                  <MetricCard label="Best silhouette (grid search)" value={silhouetteStr} />
                  <MetricCard
                    label="DBSCAN clusters (excl. noise)"
                    value={
                      dbscan?.n_clusters_excluding_noise != null ? String(dbscan.n_clusters_excluding_noise) : '…'
                    }
                  />
                  <MetricCard
                    label="DBSCAN noise share"
                    value={noisePct}
                    delta={
                      dbscan?.n_noise != null
                        ? `${formatIntPh(dbscan.n_noise)} rows labeled noise (−1).`
                        : 'From dbscan_cluster_counts.json.'
                    }
                  />
                </div>
              </div>
            </SectionWrapper>

            <SectionWrapper id="conclusion" title="Conclusion">
              <p className="text-mf-body text-muted-foreground">
              The study showed that cleaned PhilGEPS medical procurement data reveal meaningful procurement
              patterns. K-means produced six clear clusters, while DBSCAN highlighted density and outliers. The MedFlow
              PH dashboard effectively presents these results, confirming K-means as the primary, interpretable model.
              </p>
              <div className="mt-6 grid gap-6 sm:grid-cols-2 xl:grid-cols-4">
                {[
                  {
                    icon: Filter,
                    title: 'Objective 1: Analysis of Aggregated Medical-Related Procurement Records from PhilGEPS ',
                    text: 'The study found that cleaned PhilGEPS medical procurement records (487,605) show sufficient variation in quantities, budgets, contracts, timing, regions, and agencies to reveal meaningful procurement behavior patterns through clustering.',
                  },
                  {
                    icon: LayoutDashboard,
                    title: 'Objective 2: Application of K-means and DBSCAN Clustering Algorithms',
                    text: 'The study showed that K-means effectively grouped medical procurement records into six meaningful clusters, while DBSCAN offered supplementary insights on density and outliers, serving as a supporting model. ',
                  },
                  {
                    icon: UserCheck,
                    title: 'Objective 3: Development of the MedFlow PH Web-Based Results Dashboard',
                    text: 'The study concluded that the MedFlow PH dashboard clearly and effectively presented clustering results and analytics, making complex procurement patterns understandable for stakeholders.',
                  },
                  {
                    icon: Calendar,
                    title: 'Objective 4: Evaluation and Comparison of K-means and DBSCAN Results',
                    text: 'The study concluded that K-means was the most suitable primary clustering model for MedFlow PH, producing stable and interpretable clusters with K = 6 and a silhouette score of 0.386. DBSCAN was useful for identifying noise and density patterns but less effective for clear segment summaries, serving only as a supporting comparison.',
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

            <SectionWrapper id="recommendations" title="Recommendations">
              <p className="text-mf-body leading-relaxed text-muted-foreground">
                Based on the conclusions drawn from the study, the following recommendations are proposed.
              </p>
              <div className="mt-6 grid gap-6 sm:grid-cols-2 xl:grid-cols-4">
                {[
                  {
                    icon: Database,
                    title: 'Recommendation for Objective 1: Analysis of Aggregated Medical-Related Procurement Records from PhilGEPS',
                    text: 'Future studies should improve the quality and completeness of PhilGEPS medical procurement data, addressing missing values, duplicates, inconsistent formats, and schema differences through systematic cleaning and validation. Incorporating additional data sources—such as inventory, delivery, consumption, and demand records—would strengthen cluster interpretation and reduce reliance on procurement data alone. Using more detailed but privacy-safe datasets with contextual variables like facility type, regional demand, lead times, supplier performance, and delivery status could further enhance analysis.',
                  },
                  {
                    icon: Layers,
                    title: 'Recommendation for Objective 2: Application of K-means and DBSCAN Clustering Algorithms',
                    text: 'Future studies should explore additional clustering algorithms and feature sets, test wider K ranges for K-means, refine DBSCAN parameters or use HDBSCAN, and interpret clusters cautiously as analytical indicators rather than direct proof of procurement issues.',
                  },
                  {
                    icon: GitCompare,
                    title: 'Recommendation for Objective 3: Development of the MedFlow PH Web-Based Results Dashboard',
                    text: 'Future development of the MedFlow PH dashboard should focus on interactivity and user-friendliness, including dynamic filtering by year, region, agency, procurement category, cluster label, or amount. Enhancing explanatory notes, adding downloadable reports, interactive tables, and export options will improve usability for stakeholders. Maintaining a modular design will simplify updates and enable convenient online access to new results and visualizations.',
                  },
                  {
                    icon: LayoutDashboard,
                    title: 'Recommendation for Objective 4: Evaluation and Comparison of K-means and DBSCAN Results',
                    text: 'Future studies should evaluate clustering models using both numerical metrics (Silhouette Score, Davies-Bouldin Index, Calinski-Harabasz Index) and interpretability to ensure practical usefulness. Cluster labels should be validated against external indicators like stockouts, delivery delays, emergency procurement, supplier performance, and facility demand. Stakeholder review by public health administrators, procurement officers, and supply chain managers is recommended, along with additional model comparisons such as cluster stability, outlier detection, runtime, and sensitivity analysis.',
                  },
                ].map(({ icon: Icon, title, text }) => (
                  <div key={title} className="rounded-xl border border-border bg-card p-6">
                    <Icon className="h-8 w-8 text-primary" aria-hidden />
                    <h3 className="font-heading mt-4 text-mf-card-title font-semibold text-foreground">{title}</h3>
                    <p className="mt-3 text-mf-body leading-relaxed text-muted-foreground">{text}</p>
                  </div>
                ))}
              </div>

              <h3 className="font-heading mt-10 text-mf-section font-semibold text-foreground">
                Additional Recommendations
              </h3>
              <div className="mt-6 grid gap-6 md:grid-cols-3">
                {[
                  {
                    icon: FileText,
                    title: 'Data Governance and Documentation',
                    text: 'Establish clear documentation of data sources, cleaning rules, transformations, and model parameters to ensure transparency, reproducibility, and easier future improvements.',
                  },
                  {
                    icon: Shield,
                    title: 'Ethical and Privacy Considerations',
                    text: 'Maintain strict data privacy practices, including anonymization and access control, especially if more detailed datasets are introduced in future studies.',
                  },
                  {
                    icon: TrendingUp,
                    title: 'Future Research Expansion',
                    text: 'Expand analysis across regions, facilities, time periods, procurement types, and suppliers, and include time-series analysis to track changes over time.',
                  },
                ].map(({ icon: Icon, title, text }) => (
                  <div key={title} className="rounded-xl border border-border bg-card p-6">
                    <Icon className="h-8 w-8 text-primary" aria-hidden />
                    <h3 className="font-heading mt-4 text-mf-card-title font-semibold text-foreground">{title}</h3>
                    <p className="mt-3 text-mf-body leading-relaxed text-muted-foreground">{text}</p>
                  </div>
                ))}
              </div>

              <p className="mt-8 text-mf-body leading-relaxed text-muted-foreground">
                The study demonstrates that unsupervised learning can identify procurement patterns in PhilGEPS
                data, providing useful decision-support insights for public health procurement. While it does not
                confirm actual shortages or inefficiencies, the results can guide further investigation, monitoring,
                and resource planning, and serve as a foundation for more advanced procurement analytics.
              </p>
            </SectionWrapper>

            <footer className="flex flex-col gap-3 rounded-2xl border border-dashed border-border bg-card/80 p-6 text-mf-body text-muted-foreground md:flex-row md:items-center md:justify-between">
              <p className="text-foreground">
                MedFlow PH — Bicol University College of Science — Legazpi City, Albay, Philippines
              </p>
              <p className="text-muted-foreground">Data Science Portfolio · PhilGEPS Procurement Analysis 2020–2025</p>
            </footer>
          </div>
        </main>

        <aside className="medflow-no-print relative hidden w-48 shrink-0 xl:block">
          <PageTOC sections={TOC_LANDING} />
        </aside>
      </div>
    </PageShell>
  )
}
