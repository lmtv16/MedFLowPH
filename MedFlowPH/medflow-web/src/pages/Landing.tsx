import {
  Award,
  Building2,
  Calendar,
  Database,
  DollarSign,
  ExternalLink,
  FileText,
  Filter,
  Hash,
  LayoutDashboard,
  MapPin,
  Package,
  Tag,
  UserCheck,
  Users,
} from 'lucide-react'
import { useMemo } from 'react'
import { useNavigate } from 'react-router-dom'
import { MetricCard } from '../components/MetricCard'
import { PageShell } from '../components/PageShell'
import { PageTOC, TOC_LANDING } from '../components/PageTOC'
import { SectionWrapper } from '../components/SectionWrapper'
import { parsePhilgepsCleaningSummary, formatIntPh } from '../data/parsePhilgepsCleaningSummary'
import { DATA_PATHS, IMAGES } from '../data/fileManifest'
import { useJsonData, useTextData } from '../hooks/useCsvData'

/** Main-campus / Rizal St. location used for map search (College of Science, Legazpi). */
const INSTITUTION_MAP_QUERY =
  'Bicol University College of Science, Rizal Street, Legazpi City, 4500 Albay, Philippines'

const INSTITUTION_MAP_EMBED_URL = `https://maps.google.com/maps?q=${encodeURIComponent(
  INSTITUTION_MAP_QUERY,
)}&z=16&output=embed`

const INSTITUTION_MAP_OPEN_URL = `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(
  INSTITUTION_MAP_QUERY,
)}`

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
  'medical',
  'health',
  'hospital',
  'clinic',
  'medicine',
  'pharmaceutical',
  'surgical',
  'dental',
  'laboratory',
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
              <div className="rounded-3xl border border-slate-200 bg-gradient-to-br from-white via-blue-50/70 to-teal-50/60 p-4 shadow-sm dark:border-border dark:from-card dark:via-card dark:to-card sm:p-6 md:p-8 lg:p-12">
                <div className="flex flex-wrap gap-2">
                  <span className="rounded-full border border-blue-200 bg-blue-50 px-3 py-1 text-sm text-blue-700 dark:border-blue-800 dark:bg-blue-950/50 dark:text-blue-300">
                    Data Science Portfolio
                  </span>
                  <span className="rounded-full border border-blue-200 bg-blue-50 px-3 py-1 text-sm text-blue-700 dark:border-blue-800 dark:bg-blue-950/50 dark:text-blue-300">
                    Machine Learning
                  </span>
                </div>
                <h1 className="font-heading mt-4 text-3xl font-bold leading-tight text-mf-ink dark:text-foreground sm:text-4xl md:text-5xl">
                  MedFlow <span className="text-mf-primary dark:text-primary">PH</span>
                </h1>
                <p className="mt-4 max-w-3xl text-base font-medium leading-snug tracking-wide text-mf-ink dark:text-foreground sm:text-lg">
                  MEDFLOW PH: AN UNSUPERVISED CLUSTERING ANALYSIS OF
                  <br className="hidden sm:block" />
                  MEDICAL - RELATED PROCUREMENT AND DISTRIBUTION DATA IN
                  <br className="hidden sm:block" />
                  PHILIPPINE PUBLIC HEALTH FACILITIES
                </p>
                <p className="mt-4 max-w-3xl text-base text-mf-muted dark:text-muted-foreground">
                  An exploratory study applying PCA, K-Means, and DBSCAN to 6 years of PhilGEPS public procurement records,
                  uncovering underlying patterns in how public health resources are acquired and distributed.
                </p>

                <div className="mt-8 flex flex-wrap gap-4">
                  <button
                    type="button"
                    onClick={() => void navigate('/eda')}
                    className="inline-flex items-center justify-center rounded-xl bg-mf-primary px-5 py-2.5 text-sm font-semibold text-white shadow hover:bg-blue-700 dark:bg-primary dark:text-primary-foreground dark:hover:bg-primary/90"
                  >
                    Explore Dashboard
                  </button>
                  <button
                    type="button"
                    onClick={() => void navigate('/clustering')}
                    className="inline-flex items-center justify-center rounded-xl border border-slate-200 bg-white px-5 py-2.5 text-sm font-semibold text-mf-primary shadow-sm hover:bg-slate-50 dark:border-border dark:bg-card dark:text-primary dark:hover:bg-muted"
                  >
                    View Clustering
                  </button>
                </div>
              </div>
            </SectionWrapper>

            <SectionWrapper id="background" title="Background">
              <div className="space-y-4 text-sm leading-relaxed text-mf-muted dark:text-muted-foreground">
                <p>
                  MedFlow PH represents a comprehensive attempt to demystify the complex web of public health procurement in the
                  Philippines. By analyzing data from the Philippine Government Electronic Procurement System (PhilGEPS), this study
                  aims to identify non-obvious groupings and patterns in how medical supplies and equipment are sourced across
                  different regions and facility types.
                </p>
                <p>
                  The analytical pipeline encompasses a rigorous end-to-end data science methodology: starting with deep data
                  understanding of fragmented government records, proceeding through extensive cleaning and normalization, applying
                  robust preprocessing techniques, reducing dimensionality via Principal Component Analysis (PCA), and ultimately
                  comparing K-Means and DBSCAN clustering models to extract meaningful procurement behaviors.
                </p>
              </div>
            </SectionWrapper>

            <SectionWrapper id="objectives" title="Objectives of the Study">
              <div className="space-y-8 text-sm leading-relaxed text-mf-muted dark:text-muted-foreground">
                <div>
                  <h3 className="font-heading text-base font-semibold text-mf-ink dark:text-foreground">General Objective</h3>
                  <p className="mt-3">
                    The objective of this study is to analyze aggregated and non-personal medical-related procurement and
                    distribution data from public health facilities in the Philippines using unsupervised machine learning
                    techniques, specifically clustering analysis, in order to identify distribution patterns and potential
                    systemic risks related to medicine availability, such as shortages, uneven distribution, or inefficiencies in
                    supply allocation.
                  </p>
                </div>
                <div>
                  <h3 className="font-heading text-base font-semibold text-mf-ink dark:text-foreground">Specific Objectives</h3>
                  <ol className="mt-3 list-decimal space-y-3 pl-5 marker:font-semibold marker:text-mf-primary dark:marker:text-primary">
                    <li>
                      To analyze aggregated medical-related procurement and distribution data from Philippine public health
                      facilities to identify overall procurement and distribution patterns.
                    </li>
                    <li>
                      To apply unsupervised clustering algorithms, specifically K-means and DBSCAN, to group public health
                      facilities based on similarities and variations in medicine procurement and distribution behavior.
                    </li>
                    <li>
                      To develop a web-based analytical platform that presents clustering results through cluster summaries,
                      visualizations, and comparative profiles.
                    </li>
                    <li>
                      To evaluate and compare the clustering results of K-means and DBSCAN using appropriate validation metrics,
                      such as silhouette score, cluster cohesion, and cluster separation.
                    </li>
                  </ol>
                </div>
              </div>
            </SectionWrapper>

            <SectionWrapper id="data-collection" title="Data Collection">
              <div className="grid gap-8 md:grid-cols-2">
                <div className="space-y-4">
                  <p className="text-sm leading-relaxed text-mf-muted dark:text-muted-foreground">
                    The foundation of MedFlow PH is built on open data from the Philippine Government Electronic Procurement System
                    (PhilGEPS). We sourced award notices spanning from 2020 to 2025, capturing a critical period that includes
                    pandemic-era emergency purchases and standard operations.
                  </p>
                  <div className="inline-flex flex-col rounded-xl border border-blue-200 bg-blue-50 px-5 py-4 dark:border-blue-900 dark:bg-blue-950/40">
                    <p className="text-2xl font-bold tabular-nums text-mf-primary dark:text-primary">6 Years</p>
                    <p className="text-sm font-medium text-blue-900 dark:text-blue-200">of Data Processed (2020–2025)</p>
                  </div>
                </div>
                <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm dark:border-border dark:bg-card">
                  <h3 className="font-heading text-sm font-semibold text-mf-ink dark:text-foreground">Medical Filtering Strategy</h3>
                  <p className="mt-3 text-sm text-mf-muted dark:text-muted-foreground">
                    Since PhilGEPS contains all government procurement, we applied strict regex-based filtering to isolate public
                    health records using specific domain keywords:
                  </p>
                  <div className="mt-4 flex flex-wrap gap-2">
                    {MEDICAL_KEYWORD_PILLS.map((kw) => (
                      <span
                        key={kw}
                        className="rounded-full border border-slate-200 bg-slate-50 px-2.5 py-0.5 text-xs font-medium text-mf-ink dark:border-border dark:bg-muted dark:text-foreground"
                      >
                        {kw}
                      </span>
                    ))}
                  </div>
                </div>
              </div>
              <figure className="mt-8 overflow-hidden rounded-xl border border-slate-200 bg-slate-50 dark:border-border dark:bg-muted/30">
                <img src={RAW_VS_CLEANED_FIG.src} alt={RAW_VS_CLEANED_FIG.title} className="h-auto w-full object-contain" />
                <figcaption className="border-t border-slate-100 bg-white px-4 py-3 text-center text-sm text-mf-muted dark:border-border dark:bg-card dark:text-muted-foreground">
                  Records retained after medical filtering across different years, showing the dramatic reduction from millions of
                  general records to thousands of highly relevant medical procurements.
                </figcaption>
              </figure>
            </SectionWrapper>

            <SectionWrapper id="data-description" title="Data Description">
              <p className="text-sm leading-relaxed text-mf-muted dark:text-muted-foreground">
                The PhilGEPS dataset presents a high-dimensional view of each transaction. Each row represents a single awarded
                contract or item, encompassing administrative, financial, and temporal details.
              </p>
              <div className="mt-6 rounded-xl border border-slate-200 bg-white p-6 shadow-sm dark:border-border dark:bg-card">
                <h3 className="font-heading text-sm font-semibold text-mf-ink dark:text-foreground">Key Field Categories</h3>
                <div className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                  {DATA_FIELD_CATEGORIES.map(({ label, icon: Icon }) => (
                    <div
                      key={label}
                      className="flex items-center gap-3 rounded-lg border border-slate-100 bg-slate-50/80 p-3 dark:border-border dark:bg-muted/30"
                    >
                      <Icon className="h-5 w-5 shrink-0 text-mf-primary dark:text-primary" aria-hidden />
                      <span className="text-sm font-medium text-mf-ink dark:text-foreground">{label}</span>
                    </div>
                  ))}
                </div>
              </div>
            </SectionWrapper>

            <SectionWrapper id="dataset-snapshot" title="Dataset Snapshot">
              <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm dark:border-border dark:bg-card">
                <div className="border-b border-slate-100 px-6 py-4 dark:border-border">
                  <h3 className="font-heading text-base font-semibold text-mf-ink dark:text-foreground">Data pipeline</h3>
                  <p className="mt-1 text-sm text-mf-muted dark:text-muted-foreground">
                    Rebuilt from <code className="text-xs">philgeps_cleaning_summary.txt</code> in results step 01.
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
                  <figure className="overflow-hidden rounded-xl border border-slate-100 bg-slate-50 dark:border-border dark:bg-muted/30">
                    <img src={RAW_VS_CLEANED_FIG.src} alt={RAW_VS_CLEANED_FIG.title} className="h-auto w-full object-contain" />
                    <figcaption className="border-t border-slate-100 px-3 py-2 text-center text-xs text-mf-muted dark:border-border dark:text-muted-foreground">
                      {RAW_VS_CLEANED_FIG.title}
                    </figcaption>
                  </figure>
                </div>
              </div>

              <div className="mt-10">
                <h3 className="font-heading text-lg font-semibold text-mf-ink dark:text-foreground">Clustering &amp; models</h3>
                <p className="mt-2 text-sm text-mf-muted dark:text-muted-foreground">
                  Values from K‑selection JSON, K‑Means cluster counts, and DBSCAN summary in{' '}
                  <code className="text-xs">/public/results/04</code> and <code className="text-xs">04B</code>.
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

            <SectionWrapper id="recommendations" title="Recommendations">
              <p className="text-sm text-mf-muted dark:text-muted-foreground">
                Future work on MedFlow PH may extend the analysis in three key directions — richer data, better interactivity,
                and expert-validated cluster interpretation.
              </p>
              <div className="mt-6 grid gap-6 md:grid-cols-3">
                {[
                  {
                    icon: Filter,
                    title: 'Enrich With External Health Facility Data',
                    text: 'Future improvements may include adding facility type, service capacity, population served, or regional health demand indicators. These additional variables could make the clusters more meaningful for health planning and policy discussion.',
                  },
                  {
                    icon: LayoutDashboard,
                    title: 'Build Interactive Dashboard Features',
                    text: 'Users may benefit from filters by year, region, procurement mode, agency, or cluster. Interactive dashboards can help users explore how procurement behavior changes across time and location.',
                  },
                  {
                    icon: UserCheck,
                    title: 'Validate Clusters With Domain Experts',
                    text: 'Since clustering is unsupervised, expert review is important to confirm whether the discovered procurement groups are meaningful in real-world public health practice.',
                  },
                ].map(({ icon: Icon, title, text }) => (
                  <div key={title} className="rounded-xl border border-slate-200 bg-white p-6 dark:border-border dark:bg-card">
                    <Icon className="h-8 w-8 text-mf-primary dark:text-primary" aria-hidden />
                    <h3 className="font-heading mt-4 font-semibold text-mf-ink dark:text-foreground">{title}</h3>
                    <p className="mt-3 text-sm leading-relaxed text-mf-muted dark:text-muted-foreground">{text}</p>
                  </div>
                ))}
              </div>
            </SectionWrapper>

            <SectionWrapper id="references" title="References & Team">
              <div className="grid gap-6 md:grid-cols-3">
                <div className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm dark:border-border dark:bg-card">
                  <Database className="h-8 w-8 text-mf-primary dark:text-primary" aria-hidden />
                  <h3 className="font-heading mt-4 text-sm font-semibold text-mf-ink dark:text-foreground">Data Source</h3>
                  <p className="mt-3 text-sm leading-relaxed text-mf-muted dark:text-muted-foreground">
                    Philippine Government Electronic Procurement System (PhilGEPS) — public procurement award notices, 2020–2025.
                    Filtered to medicine-related procurement entries using the MedFlow PH keyword pipeline.
                  </p>
                  <p className="mt-3 text-sm leading-relaxed text-mf-muted dark:text-muted-foreground">
                    Source code pipeline: Steps 00–07 (Data Understanding, Cleaning, Preprocessing, PCA, K-Means, DBSCAN, Model
                    Comparison)
                  </p>
                  <a
                    href="https://www.philgeps.gov.ph"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="mt-4 inline-block text-sm font-medium text-mf-primary hover:underline dark:text-primary"
                  >
                    https://www.philgeps.gov.ph
                  </a>
                </div>
                <div className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm dark:border-border dark:bg-card">
                  <Users className="h-8 w-8 text-mf-primary dark:text-primary" aria-hidden />
                  <h3 className="font-heading mt-4 text-sm font-semibold text-mf-ink dark:text-foreground">Research Team</h3>
                  <ul className="mt-4 space-y-2 text-sm text-mf-muted dark:text-muted-foreground">
                    <li>Cyrrhus L. Jesalva — Researcher</li>
                    <li>Wesly P. Lopera — Researcher</li>
                    <li>Louis Mathew T. Vergara — Researcher</li>
                  </ul>
                  <p className="mt-4 text-sm text-mf-muted dark:text-muted-foreground">
                    Annotated by: Cedric Conol (Data Analyst)
                  </p>
                </div>
                <div className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm dark:border-border dark:bg-card">
                  <MapPin className="h-8 w-8 text-mf-primary dark:text-primary" aria-hidden />
                  <h3 className="font-heading mt-4 text-sm font-semibold text-mf-ink dark:text-foreground">Institution</h3>
                  <p className="mt-3 text-sm leading-relaxed text-mf-muted dark:text-muted-foreground">
                    Bicol University College of Science
                  </p>
                  <p className="mt-2 text-sm text-mf-muted dark:text-muted-foreground">
                    Rizal Street, Legazpi City, 4500 Albay, Bicol, Philippines
                  </p>
                  <div className="group relative mt-4 overflow-hidden rounded-lg border border-slate-200 dark:border-border">
                    <iframe
                      title="Map preview: Bicol University College of Science, Legazpi City"
                      src={INSTITUTION_MAP_EMBED_URL}
                      className="pointer-events-none h-52 w-full border-0 bg-slate-100 dark:bg-muted/40"
                      loading="lazy"
                      allowFullScreen
                      referrerPolicy="no-referrer-when-downgrade"
                      tabIndex={-1}
                    />
                    <a
                      href={INSTITUTION_MAP_OPEN_URL}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="absolute inset-0 z-10 flex items-end justify-center pb-3 outline-none transition-colors hover:bg-black/[0.04] focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-mf-primary dark:hover:bg-white/[0.04] dark:focus-visible:ring-primary"
                      aria-label="Open this location in Google Maps in a new tab"
                    >
                      <span className="pointer-events-none rounded-md bg-white/95 px-2.5 py-1 text-xs font-semibold text-mf-ink shadow-sm ring-1 ring-slate-200/80 dark:bg-card dark:text-foreground dark:ring-border">
                        Tap to open in Google Maps
                      </span>
                    </a>
                  </div>
                  <a
                    href={INSTITUTION_MAP_OPEN_URL}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="mt-3 inline-flex items-center gap-1.5 text-sm font-medium text-mf-primary hover:underline dark:text-primary"
                  >
                    Open exact location in Google Maps
                    <ExternalLink className="h-3.5 w-3.5 shrink-0 opacity-80" aria-hidden />
                  </a>
                </div>
              </div>
            </SectionWrapper>

            <footer className="flex flex-col gap-3 rounded-2xl border border-dashed border-slate-300 bg-white/80 p-6 text-sm text-mf-muted dark:border-border dark:bg-card/80 dark:text-muted-foreground md:flex-row md:items-center md:justify-between">
              <p className="text-mf-ink dark:text-foreground">
                MedFlow PH — Bicol University College of Science — Legazpi City, Albay, Philippines
              </p>
              <p>Data Science Portfolio · PhilGEPS Procurement Analysis 2020–2025</p>
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
