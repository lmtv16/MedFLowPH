import { useState } from 'react'
import { AlertTriangle, Clock, DollarSign, Hash, Layers } from 'lucide-react'
import { FigureCarousel } from '../components/FigureCarousel'
import { ImageCard } from '../components/ImageCard'
import type { GalleryImage } from '../components/LightboxGallery'
import { LightboxGallery } from '../components/LightboxGallery'
import { PageShell } from '../components/PageShell'
import { SectionHeader } from '../components/SectionHeader'
import { SectionWrapper } from '../components/SectionWrapper'
import { DATA_PATHS, IMAGES } from '../data/fileManifest'
import { useCsvData } from '../hooks/useCsvData'

// Cleaned Dataset Exploration (merged EDA)
const NUMERIC_CORR = '/results/01/Exploratory Data Analysis/merged/04_correlation_numeric.png'
const CAT_CORR = '/results/01/Exploratory Data Analysis/merged/05_correlation_categorical_cramers_v.png'
const DTYPE_COUNTS = '/results/01/Exploratory Data Analysis/merged/02_overview_dtype_counts.png'
const ROWS_BY_YEAR = '/results/01/Exploratory Data Analysis/merged/06_rows_by_year_cleaned_medical.png'
const RAW_VS_CLEANED = '/results/01/Exploratory Data Analysis/merged/07_raw_vs_cleaned_rows_by_year_grouped.png'
const STACKED = '/results/01/Exploratory Data Analysis/merged/08_raw_vs_cleaned_stacked_by_year.png'

const DATA_CLEANING_INTRO =
  'The analytical pipeline encompasses a rigorous end-to-end data science methodology: starting with deep data understanding of fragmented government records, proceeding through extensive cleaning and normalization, applying robust preprocessing techniques, reducing dimensionality via Principal Component Analysis (PCA), and ultimately comparing K-Means and DBSCAN clustering models to extract meaningful procurement behaviors.'

const DATA_CLEANING_STEPS: {
  n: string
  title: string
  body: string
  muted?: boolean
}[] = [
  {
    n: '01',
    title: 'Load PhilGEPS Files',
    body: 'Load raw CSV and Excel files for years 2020–2025, one file or quarter at a time.',
  },
  {
    n: '02',
    title: 'Normalize Data Types',
    body: 'Standardize column formats, parse dates, and align year-specific schema differences.',
    muted: true,
  },
  {
    n: '03',
    title: 'Apply Medical Filter',
    body: 'Apply regex filtering matching medical keywords across PhilGEPS Description, Item Name, and Item Description.',
    muted: true,
  },
  {
    n: '04',
    title: 'Merge Annual Datasets',
    body: 'Merge all filtered annual datasets into a single consolidated medical procurement dataset.',
  },
  {
    n: '05',
    title: 'Remove Duplicates (Cross-file)',
    body: 'Perform a second deduplication pass across the combined multi-year dataset.',
  },
  {
    n: '06',
    title: 'Handle Missing Values',
    body: 'Address null values in critical fields through imputation or row removal strategies.',
  },
  {
    n: '08',
    title: 'Output Cleaned Dataset',
    body: 'Write the final cleaned dataset for use by preprocessing, PCA, and clustering steps.',
  },
]

export function Preprocessing() {
  const { data: featureRows } = useCsvData(DATA_PATHS.featureSelected)
  const { data: scaledRows } = useCsvData(DATA_PATHS.minMaxScaled)
  const [gallery, setGallery] = useState<{ imgs: GalleryImage[]; idx: number }>({
    imgs: [],
    idx: 0,
  })
  const [preprocessingSlideIdx, setPreprocessingSlideIdx] = useState(0)

  function openGallery(imgs: GalleryImage[], idx: number) {
    setGallery({ imgs, idx })
  }

  const preprocessingSlides = IMAGES.eda.preprocessingCarousel

  function openPreprocessing(i: number) {
    const images = preprocessingSlides.map((item) => ({ src: item.src, title: item.title }))
    setGallery({ imgs: images, idx: i })
  }

  const scaledPreviewKeys = scaledRows.length ? Object.keys(scaledRows[0] ?? {}) : []
  const featureCols = featureRows.length ? Object.keys(featureRows[0] ?? {}) : []
  const scaledPreview = scaledRows.slice(0, 10)

  return (
    <PageShell>
      <div className="space-y-12">
        <SectionWrapper id="preprocessing-overview" title="02 - Data Preprocessing">
          <p className="mb-6 leading-relaxed text-slate-600 dark:text-muted-foreground">
            Feature selection reduced collinearity, min-max scaling harmonized magnitudes, and one-hot encoding
            captured categorical structure without collapsing rare procurement modes.
          </p>
          <p className="mb-4 text-sm text-mf-muted dark:text-muted-foreground">
            Slides follow the §02 pipeline: feature selection, then min–max scaling diagnostics, then one-hot encoding
            summaries. Open the lightbox from any slide; edit copy under{' '}
            <span className="font-mono text-xs">IMAGES.eda.preprocessingCarousel</span>.
          </p>
          <FigureCarousel
            items={preprocessingSlides}
            activeIndex={preprocessingSlideIdx}
            onActiveIndexChange={setPreprocessingSlideIdx}
            getFigureLabel={(idx, item) => `Figure PP-DU${idx + 1}: ${item.title}`}
            onSlideImageClick={openPreprocessing}
            ariaPrevLabel="Previous preprocessing figure"
            ariaNextLabel="Next preprocessing figure"
          />

          <div className="mt-10 rounded-r-xl border-l-4 border-amber-400 bg-amber-50 p-5 dark:border-amber-500 dark:bg-amber-950/40">
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
        </SectionWrapper>

        <SectionWrapper id="cleaned-dataset-exploration" title="Cleaned Dataset Exploration">
          <p className="mb-6 leading-relaxed text-slate-600 dark:text-muted-foreground">
            Exploratory visuals validate relationships among numeric cadence features, categorical procurement codes,
            volume by year, and the impact of cleaning on longitudinal coverage.
          </p>
          <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3">
            <ImageCard
              src={NUMERIC_CORR}
              title="Numeric feature correlation"
              caption={`This heatmap shows how the cleaned numeric fields relate to each other. The strongest relationship is between Item Budget and Contract Amount with a correlation of 0.91, meaning higher planned item budgets usually correspond to higher awarded contract amounts.

Most other numeric fields have weak relationships, so additional feature engineering, scaling, and PCA were needed before clustering.`}
            />
            <ImageCard
              src={CAT_CORR}
              title="Categorical association heatmap"
              caption={`This heatmap shows how selected categorical fields are related using Cramér's V. The strongest relationship is between organization type and grouped organization type, which is expected because they describe similar information.

Most other categorical fields show weak to moderate association, meaning they provide different procurement context. This helped guide which categorical variables could be encoded during preprocessing.`}
            />
            <ImageCard
              src={DTYPE_COUNTS}
              title="dtype counts"
              caption={`Most columns in the cleaned PhilGEPS dataset are text or categorical fields. This is expected because procurement records include descriptions, locations, agencies, statuses, and supplier details.

Since clustering requires numeric inputs, the next step converts selected categorical, date, and numeric fields into machine-learning-ready features.`}
            />
            <ImageCard
              src={ROWS_BY_YEAR}
              title="Rows by year (cleaned medical slice)"
              caption={`This chart shows how many cleaned medical procurement records were available per year. The highest counts appear in 2023 and 2024, while 2020 and 2021 have fewer records.

The lower count in 2025 should be interpreted carefully because the available 2025 data may not cover the full year.`}
            />
            <ImageCard
              src={RAW_VS_CLEANED}
              title="Raw vs cleaned rows by year"
              caption={
                <>
                  This chart compares all loaded PhilGEPS records with the final cleaned medical procurement records.
                  The cleaned dataset is smaller because the process filtered out non-medical procurement records.
                  {'\n\n'}
                  After Step 01, the dataset was reduced to{' '}
                  <strong className="font-bold text-slate-700 dark:text-foreground">
                    487,605 medical-related records
                  </strong>
                  , making it focused and ready for preprocessing and clustering.
                </>
              }
            />
            <ImageCard
              src={STACKED}
              title="Stacked raw vs cleaned composition"
              caption={`This chart shows how the raw PhilGEPS records were reduced into the final cleaned medical dataset. The blue section shows records kept for analysis, while the gray section shows records removed because they were non-medical, duplicated, or not included in the final output.

The final dataset is smaller, but more focused on medical procurement records needed for clustering.`}
            />
          </div>
          <p className="mt-6 text-sm leading-relaxed text-slate-500 dark:text-muted-foreground">
            Together these boards demonstrate that medical procurement signals remain structured enough for PCA while
            also exposing heavy-tailed budgets and categorical leakage risks that motivate regularization in later
            steps.
          </p>
        </SectionWrapper>

        <SectionWrapper id="data-cleaning" title="Data Cleaning">
          <p className="text-sm leading-relaxed text-mf-muted dark:text-muted-foreground">{DATA_CLEANING_INTRO}</p>

          <div className="relative mt-8 border-l-2 border-slate-200 pl-8 dark:border-border">
            {DATA_CLEANING_STEPS.map((step) => (
              <div
                key={step.n}
                className={`relative pb-10 last:pb-0 ${step.muted ? 'opacity-60' : ''}`}
              >
                <div className="absolute -left-[1.54rem] top-0 flex h-9 w-9 items-center justify-center rounded-full border-2 border-mf-primary bg-white text-xs font-bold text-mf-primary dark:border-primary dark:bg-card dark:text-primary">
                  {step.n}
                </div>
                <h3 className="font-heading text-base font-semibold text-mf-ink dark:text-foreground">{step.title}</h3>
                <p className="mt-2 text-sm text-mf-muted dark:text-muted-foreground">{step.body}</p>
              </div>
            ))}
          </div>

          <div className="mt-8 rounded-r-lg border-l-4 border-amber-400 bg-amber-50 p-4 dark:bg-amber-950/30">
            <p className="text-sm font-semibold text-amber-900 dark:text-amber-200">Note on 2022 data</p>
            <p className="mt-2 text-sm leading-relaxed text-amber-900/90 dark:text-amber-100/90">
              The 2022 raw exports were treated as headerless files and read using a fixed 46-column PhilGEPS schema so
              that key fields would remain aligned across years.
            </p>
          </div>
        </SectionWrapper>

        <SectionWrapper id="feature-engineering" title="Feature Engineering">
          <p className="text-sm leading-relaxed text-mf-muted dark:text-muted-foreground">
            Several procurement fields were transformed into numerical features before clustering. Monetary columns were
            converted to numeric values, clipped at zero, and transformed using log1p. This reduced the effect of
            extremely large procurement values while preserving meaningful differences between small and large purchases.
          </p>
          <div className="mt-6 grid gap-4 md:grid-cols-3">
            {[
              {
                icon: Clock,
                name: 'award_decision_lag_days',
                text: 'Time between the closing date and the award date — captures how long procurement decisions took.',
              },
              {
                icon: Hash,
                name: 'log1p_Quantity',
                text: 'Log-transformed quantity of procured items — reduces skew from extreme bulk orders.',
              },
              {
                icon: DollarSign,
                name: 'log1p_Approved_Budget_of_the_Contract',
                text: 'Log-transformed approved budget — the planned expenditure ceiling for the procurement.',
              },
            ].map(({ icon: Icon, name, text }) => (
              <div key={name} className="rounded-xl border border-slate-200 bg-white p-4 dark:border-border dark:bg-card">
                <Icon className="h-6 w-6 text-mf-primary dark:text-primary" aria-hidden />
                <p className="mt-3 font-mono text-sm font-semibold text-mf-primary dark:text-primary">{name}</p>
                <p className="mt-2 text-sm text-mf-muted dark:text-muted-foreground">{text}</p>
              </div>
            ))}
          </div>
        </SectionWrapper>

        <SectionHeader
          title="Feature Selection"
          subtitle="Correlation diagnostics feeding rank‑truncated subsets before scaling and encoding."
          icon={Layers}
        />
        <div className="grid gap-6 md:grid-cols-2">
          {IMAGES.preprocessing.featureSelection.map((img, idx) => (
            <ImageCard
              key={img.src}
              src={img.src}
              title={img.title}
              figure={`Figure ${idx + 1}: ${img.title}`}
              onClick={() =>
                openGallery(
                  IMAGES.preprocessing.featureSelection.map((item) => ({
                    src: item.src,
                    title: item.title,
                  })),
                  idx,
                )
              }
            />
          ))}
        </div>
        <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
          <h3 className="text-lg font-semibold text-mf-ink">Selected feature manifest</h3>
          <p className="text-xs text-mf-muted mt-2">
            Source:{' '}
            <code>{DATA_PATHS.featureSelected}</code>
          </p>
          <div className="mt-4 max-h-[420px] overflow-auto rounded-xl border border-slate-100 text-xs">
            <table className="min-w-full divide-y divide-slate-100 text-left text-sm">
              <thead className="bg-slate-50 text-[11px] uppercase tracking-wide text-mf-muted">
                <tr>
                  {featureCols.map((col) => (
                    <th key={col} className="sticky top-0 z-10 whitespace-nowrap bg-slate-50 px-3 py-2">
                      {col}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 bg-white">
                {featureRows.slice(0, 200).map((row, rIdx) => (
                  <tr key={rIdx} className={rIdx % 2 === 0 ? 'bg-white' : 'bg-slate-50/60'}>
                    {featureCols.map((col) => (
                      <td key={col + rIdx} className="px-3 py-2 text-[11px] text-mf-muted whitespace-nowrap">
                        {row[col]}
                      </td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        <SectionHeader title="Min–Max scaling diagnostics" subtitle="Post‑scaling marginals and correlations." />
        <div className="grid gap-6 md:grid-cols-2">
          {IMAGES.preprocessing.scaling.map((img, idx) => (
            <ImageCard
              key={img.src}
              src={img.src}
              title={img.title}
              figure={`Figure ${idx + 1}: ${img.title}`}
              onClick={() =>
                openGallery(
                  IMAGES.preprocessing.scaling.map((item) => ({ src: item.src, title: item.title })),
                  idx,
                )
              }
            />
          ))}
        </div>

        <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
          <h3 className="text-lg font-semibold text-mf-ink">Scaled matrix preview</h3>
          <p className="mt-2 text-xs text-mf-muted">First ten rows retained for readability.</p>
          <div className="mt-4 max-h-96 overflow-auto rounded-xl border border-slate-50 text-[11px]">
            <table className="min-w-full divide-y divide-slate-100 text-left">
              <thead className="sticky top-0 z-10 bg-slate-50 text-[11px] uppercase tracking-wide text-mf-muted">
                <tr>
                  {scaledPreviewKeys.map((col) => (
                    <th key={col} className="whitespace-nowrap px-3 py-2 bg-slate-50">
                      {col}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 bg-white">
                {scaledPreview.map((row, rIdx) => (
                  <tr key={rIdx}>
                    {scaledPreviewKeys.map((col) => (
                      <td key={col + rIdx} className="px-3 py-2 text-[11px] text-mf-muted whitespace-nowrap">
                        {row[col]}
                      </td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        <SectionHeader title="One‑Hot encoding footprints" subtitle="Dummy proliferation by source cohort." />
        <div className="grid gap-6 md:grid-cols-2">
          {IMAGES.preprocessing.oneHot.map((img, idx) => (
            <ImageCard
              key={img.src}
              src={img.src}
              title={img.title}
              figure={`Figure ${idx + 1}: ${img.title}`}
              onClick={() =>
                openGallery(
                  IMAGES.preprocessing.oneHot.map((item) => ({ src: item.src, title: item.title })),
                  idx,
                )
              }
            />
          ))}
        </div>
      </div>

      <LightboxGallery images={gallery.imgs} index={gallery.idx} open={gallery.imgs.length > 0} onClose={() => setGallery({ imgs: [], idx: 0 })} />
    </PageShell>
  )
}
