import {
  Award,
  Building2,
  Calendar,
  ChevronDown,
  Database,
  DollarSign,
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
import { useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'
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

const OBJECTIVE_ITEMS = [
  {
    q: 'How can procurement records be segmented?',
    a: 'By applying K-Means clustering in PCA space, we identified 7 distinct procurement segments based on timing, quantity, and budget.',
  },
  {
    q: 'What inherent patterns exist in timing and budgets?',
    a: 'Analysis revealed consistent quarterly procurement cycles with volume peaks aligned to government budget release periods.',
  },
  {
    q: 'How do K-Means and DBSCAN compare in this domain?',
    a: 'K-Means produced cleaner, fully-assigned clusters suitable for reporting. DBSCAN added value by flagging outlier procurement records.',
  },
] as const

export function Landing() {
  const navigate = useNavigate()
  const [openObjective, setOpenObjective] = useState<number | null>(0)

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
        <main className="min-w-0 flex-1">
          <div className="space-y-14">
            <SectionWrapper id="hero">
              <div className="rounded-3xl border border-slate-200 bg-gradient-to-br from-white via-blue-50/70 to-teal-50/60 p-8 shadow-sm dark:border-border dark:from-card dark:via-card dark:to-card lg:p-12">
                <div className="flex flex-wrap gap-2">
                  <span className="rounded-full border border-blue-200 bg-blue-50 px-3 py-1 text-sm text-blue-700 dark:border-blue-800 dark:bg-blue-950/50 dark:text-blue-300">
                    Data Science Portfolio
                  </span>
                  <span className="rounded-full border border-blue-200 bg-blue-50 px-3 py-1 text-sm text-blue-700 dark:border-blue-800 dark:bg-blue-950/50 dark:text-blue-300">
                    Machine Learning
                  </span>
                </div>
                <h1 className="font-heading mt-4 text-4xl font-bold text-mf-ink dark:text-foreground md:text-5xl">
                  MedFlow <span className="text-mf-primary dark:text-primary">PH</span>
                </h1>
                <p className="mt-4 max-w-3xl text-lg font-medium text-mf-ink dark:text-foreground">
                  Unsupervised Clustering Analysis of Medicine Procurement and Distribution Data in Philippine Public
                  Health Facilities.
                </p>
                <p className="mt-4 max-w-3xl text-base text-mf-muted dark:text-muted-foreground">
                  An exploratory study applying PCA, K-Means, and DBSCAN to 6 years of PhilGEPS public procurement records,
                  uncovering underlying patterns in how public health resources are acquired and distributed.
                </p>

                <div className="mt-8 rounded-xl border border-slate-200 bg-white p-6 shadow-sm dark:border-border dark:bg-card">
                  <div className="grid gap-6 sm:grid-cols-3">
                    <div>
                      <a href="#references" className="text-sm font-semibold text-mf-primary hover:underline dark:text-primary">
                        Cyrrhus L. Jesalva
                      </a>
                      <p className="mt-1 text-xs text-mf-muted dark:text-muted-foreground">Researcher</p>
                    </div>
                    <div>
                      <a href="#references" className="text-sm font-semibold text-mf-primary hover:underline dark:text-primary">
                        Wesly P. Lopera
                      </a>
                      <p className="mt-1 text-xs text-mf-muted dark:text-muted-foreground">Researcher</p>
                    </div>
                    <div>
                      <a href="#references" className="text-sm font-semibold text-mf-primary hover:underline dark:text-primary">
                        Louis Mathew T. Vergara
                      </a>
                      <p className="mt-1 text-xs text-mf-muted dark:text-muted-foreground">Researcher</p>
                    </div>
                  </div>
                  <div className="mt-6 flex flex-col gap-4 border-t border-slate-100 pt-6 text-sm dark:border-border sm:flex-row sm:items-start sm:justify-between">
                    <div>
                      <p className="font-medium text-mf-ink dark:text-foreground">Institution: Bicol University College of Science</p>
                      <p className="mt-1 text-mf-muted dark:text-muted-foreground">Legazpi City, Albay, Bicol, Philippines</p>
                    </div>
                    <div className="text-mf-muted dark:text-muted-foreground">
                      <span className="font-medium text-mf-ink dark:text-foreground">Annotated by:</span> Cedric Conol (Data
                      Analyst)
                    </div>
                  </div>
                </div>

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

            <SectionWrapper id="objectives" title="Research Objectives">
              <p className="text-sm leading-relaxed text-mf-muted dark:text-muted-foreground">
                The primary objective of this study is to leverage unsupervised machine learning techniques to uncover latent
                structures within Philippine public health procurement data, providing data-driven insights into purchasing behaviors,
                inefficiencies, and standardized practices.
              </p>
              <div className="mt-6 space-y-3">
                {OBJECTIVE_ITEMS.map((item, idx) => {
                  const n = idx + 1
                  const open = openObjective === idx
                  return (
                    <div
                      key={item.q}
                      className="rounded-xl border border-slate-200 bg-white dark:border-border dark:bg-card"
                    >
                      <button
                        type="button"
                        onClick={() => setOpenObjective(open ? null : idx)}
                        className="flex w-full items-start gap-3 p-4 text-left"
                        aria-expanded={open}
                        aria-controls={`objective-panel-${n}`}
                        id={`objective-trigger-${n}`}
                      >
                        <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-mf-primary text-sm font-bold text-white dark:bg-primary dark:text-primary-foreground">
                          {n}
                        </span>
                        <span className="min-w-0 flex-1 text-sm font-medium text-mf-ink dark:text-foreground">{item.q}</span>
                        <ChevronDown
                          className={`mt-0.5 h-5 w-5 shrink-0 text-mf-muted transition-transform dark:text-muted-foreground ${
                            open ? 'rotate-180' : ''
                          }`}
                          aria-hidden
                        />
                      </button>
                      {open ? (
                        <div
                          id={`objective-panel-${n}`}
                          role="region"
                          aria-labelledby={`objective-trigger-${n}`}
                          className="border-t border-slate-100 px-4 pb-4 pl-[3.25rem] pt-2 text-sm leading-relaxed text-mf-muted dark:border-border dark:text-muted-foreground"
                        >
                          {item.a}
                        </div>
                      ) : null}
                    </div>
                  )
                })}
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
                  <p className="mt-2 text-sm text-mf-muted dark:text-muted-foreground">Legazpi City, Albay, Bicol, Philippines</p>
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
