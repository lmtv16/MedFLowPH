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

type ResearchTeamMember = {
  name: string
  role?: string
}

const RESEARCH_TEAM_RESEARCHERS: readonly ResearchTeamMember[] = [
  { name: 'Cyrrhus L. Jesalva' },
  { name: 'Wesly P. Lopera' },
  { name: 'Louis Mathew T. Vergara' },
]

const RESEARCH_TEAM_ADVISERS: readonly ResearchTeamMember[] = [
  { name: 'Davie B. Balmadrid, D.Eng', role: 'Content Adviser' },
  { name: 'Aris J. Ordonez, DIT', role: 'Programming Adviser' },
]

function ResearchTeamCard() {
  return (
    <div className="rounded-xl border border-border bg-card p-6 shadow-sm">
      <Users className="h-8 w-8 text-primary" aria-hidden />
      <h3 className="font-heading mt-4 text-mf-card-title font-semibold text-foreground">Research Team</h3>

      <div className="mt-3 space-y-4">
        <section aria-labelledby="research-team-researchers">
          <p
            id="research-team-researchers"
            className="text-mf-caption font-semibold uppercase tracking-wide text-muted-foreground"
          >
            Researchers
          </p>
          <ul className="mt-3 list-none space-y-2 p-0 text-mf-body leading-relaxed text-muted-foreground">
            {RESEARCH_TEAM_RESEARCHERS.map((member) => (
              <li key={member.name}>
                <span className="text-foreground">{member.name}</span>
              </li>
            ))}
          </ul>
        </section>

        <section aria-labelledby="research-team-advisers" className="border-t border-border pt-4">
          <p
            id="research-team-advisers"
            className="text-mf-caption font-semibold uppercase tracking-wide text-muted-foreground"
          >
            Advisers
          </p>
          <ul className="mt-3 list-none space-y-2.5 p-0 text-mf-body leading-relaxed text-muted-foreground">
            {RESEARCH_TEAM_ADVISERS.map((member) => (
              <li
                key={member.name}
                className="grid grid-cols-[minmax(0,1fr)_auto] items-baseline gap-x-3"
              >
                <span className="text-foreground">{member.name}</span>
                <span className="shrink-0 text-right">{member.role}</span>
              </li>
            ))}
          </ul>
        </section>
      </div>
    </div>
  )
}

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
                    onClick={() => void navigate('/eda')}
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
                  The study uses K-means and DBSCAN clustering to analyze aggregated medical-related procurement and distribution
                  data, revealing patterns such as understocking, overstocking, high-value concentration, and delayed procurement
                  across Philippine public health facilities.
                </p>
                <p>
                  By converting raw procurement records into interpretable clusters and visual insights, it provides actionable
                  guidance for policymakers and health administrators to monitor supply risks, improve resource allocation, and
                  enhance equitable access to essential medical resources.
                </p>
              </div>
            </SectionWrapper>

            <SectionWrapper id="objectives" title="Objectives of the Study">
              <div className="space-y-8 text-mf-body leading-relaxed text-muted-foreground">
                <div>
                  <h3 className="font-heading text-mf-card-title font-semibold text-foreground">General Objective</h3>
                  <p className="mt-3">
                    The objective of this study is to analyze aggregated and non-personal medical-related procurement records from
                    Philippine public health procurement data using unsupervised clustering techniques in order to identify
                    procurement behavior patterns and possible systemic procurement risk indicators related to resource allocation,
                    procurement concentration, delays, and supply-related inefficiencies.
                  </p>
                </div>
                <div>
                  <h3 className="font-heading text-mf-card-title font-semibold text-foreground">Specific Objectives</h3>
                  <ol className="mt-3 list-decimal space-y-3 pl-5 marker:font-semibold marker:text-primary">
                    <li>
                      To analyze aggregated medical-related procurement and distribution data from Philippine public health
                      facilities to identify overall procurement and distribution patterns.
                    </li>
                    <li>
                      To apply unsupervised clustering algorithms, specifically K-means and DBSCAN, to group medical-related
                      procurement records based on similarities and variations in procurement behavior.
                    </li>
                    <li>
                      To develop a web-based results dashboard that presents clustering results through cluster summaries,
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
                  <p className="text-mf-body leading-relaxed text-muted-foreground">
                    MedFlow PH is built using publicly available procurement data from the Philippine Government Electronic
                    Procurement System (PhilGEPS). The study used award notice records from 2020 to 2025, covering both
                    pandemic-related emergency procurement and regular medical procurement activities during this period.
                  </p>
                  <div className="inline-flex flex-col rounded-xl border border-primary/30 bg-primary/10 px-5 py-4">
                    <p className="text-mf-metric font-bold tabular-nums text-primary">6 Years</p>
                    <p className="text-mf-caption font-medium text-primary">of Data Processed (2020–2025)</p>
                  </div>
                </div>
                <div className="rounded-xl border border-border bg-card p-5 shadow-sm">
                  <h3 className="font-heading text-mf-card-title font-semibold text-foreground">Medical Filtering Strategy</h3>
                  <p className="mt-3 text-mf-body leading-relaxed text-muted-foreground">
                    To focus on public health procurement, the PhilGEPS dataset was filtered using a set of domain-specific
                    keywords, such as &ldquo;medical,&rdquo; &ldquo;hospital,&rdquo; &ldquo;medicine,&rdquo; &ldquo;laboratory,&rdquo;
                    and &ldquo;vaccine.&rdquo; This ensured that only medical-related procurement records were retained for analysis,
                    allowing the study to examine healthcare supply patterns and systemic risks effectively.
                  </p>
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
                  Number of records kept after filtering medical-related procurement data from different years, reducing millions of
                  general procurement records into a smaller set of relevant medical procurement records.
                </figcaption>
              </figure>
            </SectionWrapper>

            <SectionWrapper id="data-description" title="Data Description">
              <p className="text-mf-body leading-relaxed text-muted-foreground">
                The PhilGEPS dataset contains information on government procurement transactions. Each row represents one awarded
                contract or item and includes details about the buyer, cost, dates, and other relevant transaction information.
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

            <SectionWrapper id="recommendations" title="Recommendations">
              <p className="text-mf-body text-muted-foreground">
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
                  <div key={title} className="rounded-xl border border-border bg-card p-6">
                    <Icon className="h-8 w-8 text-primary" aria-hidden />
                    <h3 className="font-heading mt-4 text-mf-card-title font-semibold text-foreground">{title}</h3>
                    <p className="mt-3 text-mf-body leading-relaxed text-muted-foreground">{text}</p>
                  </div>
                ))}
              </div>
            </SectionWrapper>

            <SectionWrapper id="references" title="References & Team">
              <div className="grid gap-6 md:grid-cols-3">
                <div className="rounded-xl border border-border bg-card p-6 shadow-sm">
                  <Database className="h-8 w-8 text-primary" aria-hidden />
                  <h3 className="font-heading mt-4 text-mf-card-title font-semibold text-foreground">Data Source</h3>
                  <p className="mt-3 text-mf-body leading-relaxed text-muted-foreground">
                    Philippine Government Electronic Procurement System (PhilGEPS) — public procurement award notices, 2020–2025.
                    Filtered to medical-related procurement entries using the MedFlow PH keyword pipeline.
                  </p>
                  <p className="mt-3 text-mf-body leading-relaxed text-muted-foreground">
                    Source code pipeline: Steps 00–07 (Data Understanding, Cleaning, Preprocessing, PCA, K-Means, DBSCAN, Model
                    Comparison)
                  </p>
                  <a
                    href="https://www.philgeps.gov.ph"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="mt-4 inline-block text-mf-body font-medium text-primary hover:underline"
                  >
                    https://www.philgeps.gov.ph
                  </a>
                </div>
                <ResearchTeamCard />
                <div className="rounded-xl border border-border bg-card p-6 shadow-sm">
                  <MapPin className="h-8 w-8 text-primary" aria-hidden />
                  <h3 className="font-heading mt-4 text-mf-card-title font-semibold text-foreground">Institution</h3>
                  <p className="mt-3 text-mf-body leading-relaxed text-muted-foreground">
                    Bicol University College of Science
                  </p>
                  <p className="mt-2 text-mf-body text-muted-foreground">
                    Rizal Street, Legazpi City, 4500 Albay, Bicol, Philippines
                  </p>
                  <div className="group relative mt-4 overflow-hidden rounded-lg border border-border">
                    <iframe
                      title="Map preview: Bicol University College of Science, Legazpi City"
                      src={INSTITUTION_MAP_EMBED_URL}
                      className="pointer-events-none h-52 w-full border-0 bg-muted/50"
                      loading="lazy"
                      allowFullScreen
                      referrerPolicy="no-referrer-when-downgrade"
                      tabIndex={-1}
                    />
                    <a
                      href={INSTITUTION_MAP_OPEN_URL}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="absolute inset-0 z-10 flex items-end justify-center pb-3 outline-none transition-colors hover:bg-foreground/5 focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-primary"
                      aria-label="Open this location in Google Maps in a new tab"
                    >
                      <span className="pointer-events-none rounded-md bg-card/95 px-2.5 py-1 text-mf-caption font-semibold text-foreground shadow-sm ring-1 ring-border">
                        Tap to open in Google Maps
                      </span>
                    </a>
                  </div>
                  <a
                    href={INSTITUTION_MAP_OPEN_URL}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="mt-3 inline-flex items-center gap-1.5 text-mf-body font-medium text-primary hover:underline"
                  >
                    Open exact location in Google Maps
                    <ExternalLink className="h-3.5 w-3.5 shrink-0 opacity-80" aria-hidden />
                  </a>
                </div>
              </div>
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
