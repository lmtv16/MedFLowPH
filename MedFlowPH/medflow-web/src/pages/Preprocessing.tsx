import { useState } from 'react'
import { Clock, DollarSign, FileCheck, Hash, Package } from 'lucide-react'
import { LazyFigureCarousel } from '../components/LazyFigureCarousel'
import { ImageCard } from '../components/ImageCard'
import type { GalleryImage } from '../components/LightboxGallery'
import { LightboxGallery } from '../components/LightboxGallery'
import { PageShell } from '../components/PageShell'
import { PageTOC, TOC_PREPROCESSING } from '../components/PageTOC'
import { SectionWrapper } from '../components/SectionWrapper'
import { IMAGES } from '../data/fileManifest'

// Cleaned Dataset Exploration (merged EDA)
const NUMERIC_CORR = '/results/01/Exploratory Data Analysis/merged/04_correlation_numeric.png'
const CAT_CORR = '/results/01/Exploratory Data Analysis/merged/05_correlation_categorical_cramers_v.png'
const DTYPE_COUNTS = '/results/01/Exploratory Data Analysis/merged/02_overview_dtype_counts.png'
const ROWS_BY_YEAR = '/results/01/Exploratory Data Analysis/merged/06_rows_by_year_cleaned_medical.png'
const RAW_VS_CLEANED = '/results/01/Exploratory Data Analysis/merged/07_raw_vs_cleaned_rows_by_year_grouped.png'
const STACKED = '/results/01/Exploratory Data Analysis/merged/08_raw_vs_cleaned_stacked_by_year.png'

const DATA_CLEANING_INTRO =
  'The dataset was cleaned by aligning schemas, removing duplicate records, applying consistent medical-related filters, and addressing missing values. This ensured the data was complete, accurate, and reliable before any further analysis or processing. '

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

  return (
    <PageShell>
      <div className="flex gap-8">
        <main className="min-w-0 flex-1 space-y-12 overflow-x-hidden pb-16">
          <div className="space-y-12">
            <SectionWrapper id="preprocessing-overview" title="Data Preprocessing">
          <p className="mb-6 text-mf-body leading-relaxed text-muted-foreground">
          During data preprocessing, important features were selected to avoid redundancy, 
          numerical values were scaled to a common range, and categorical information was converted 
          into a format that the analysis could use while keeping rare procurement types separate.
          </p>
          <LazyFigureCarousel
            items={preprocessingSlides}
            activeIndex={preprocessingSlideIdx}
            onActiveIndexChange={setPreprocessingSlideIdx}
            getFigureLabel={(idx, item) => `Figure PP-DU${idx + 1}: ${item.title}`}
            onSlideImageClick={openPreprocessing}
            ariaPrevLabel="Previous preprocessing figure"
            ariaNextLabel="Next preprocessing figure"
          />
        </SectionWrapper>

        <SectionWrapper id="cleaned-dataset-exploration" title="Cleaned Dataset Exploration">
          <p className="mb-6 text-mf-body leading-relaxed text-muted-foreground">
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
                  <strong className="font-bold text-foreground">
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
          <p className="mt-6 text-mf-body leading-relaxed text-muted-foreground">
            Together these boards demonstrate that medical procurement signals remain structured enough for PCA while
            also exposing heavy-tailed budgets and categorical leakage risks that motivate regularization in later
            steps.
          </p>
        </SectionWrapper>

        <SectionWrapper id="data-cleaning" title="Data Cleaning">
          <p className="mb-8 max-w-3xl text-mf-body leading-relaxed text-muted-foreground">
            {DATA_CLEANING_INTRO}
          </p>

          <ol className="mx-auto max-w-3xl list-none space-y-0 p-0">
            {DATA_CLEANING_STEPS.map((step, index) => {
              const isLast = index === DATA_CLEANING_STEPS.length - 1
              return (
                <li
                  key={step.n}
                  className={`grid grid-cols-[2.25rem_1fr] gap-x-5 ${step.muted ? 'opacity-70' : ''}`}
                >
                  <div className="relative flex justify-center">
                    <span className="relative z-10 inline-flex h-9 w-9 shrink-0 items-center justify-center rounded-full border-2 border-primary bg-background text-xs font-bold text-primary">
                      {step.n}
                    </span>
                    {!isLast && (
                      <span
                        aria-hidden
                        className="absolute left-1/2 top-9 bottom-0 w-px -translate-x-1/2 bg-border"
                      />
                    )}
                  </div>
                  <div className={`min-w-0 rounded-xl border border-border bg-card p-5 shadow-sm ${isLast ? '' : 'mb-8'}`}>
                    <h3 className="font-heading text-mf-card-title font-semibold text-foreground">{step.title}</h3>
                    <p className="mt-2 text-mf-body leading-relaxed text-muted-foreground">{step.body}</p>
                  </div>
                </li>
              )
            })}
          </ol>

          <div className="mt-8 rounded-r-lg border-l-4 border-amber-400 bg-amber-50 p-4 dark:border-amber-500 dark:bg-amber-950/40">
            <p className="text-mf-card-title font-semibold text-amber-900 dark:text-amber-200">Note on 2022 data</p>
            <p className="mt-2 text-mf-body leading-relaxed text-amber-900/90 dark:text-amber-100/90">
              The 2022 raw exports were treated as headerless files and read using a fixed 46-column PhilGEPS schema so
              that key fields would remain aligned across years.
            </p>
          </div>
        </SectionWrapper>

        <SectionWrapper id="feature-engineering" title="Feature Engineering">
          <p className="text-mf-body leading-relaxed text-muted-foreground">
          Procurement data was converted into numerical features for clustering. 
          Monetary values were standardized and transformed to reduce the impact of 
          extremely large amounts while keeping meaningful differences between smaller and larger transactions. 
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
              {
                icon: Package,
                name: 'log1p_Item_Budget',
                text: 'Log-transformed line-item budget — planned spend for the specific procured item, clipped at zero before log1p.',
              },
              {
                icon: FileCheck,
                name: 'log1p_Contract_Amount',
                text: 'Log-transformed contract amount — the awarded contract value used in PCA and clustering alongside other monetary features.',
              },
            ].map(({ icon: Icon, name, text }) => (
              <div key={name} className="rounded-xl border border-border bg-card p-4">
                <Icon className="h-6 w-6 text-primary" aria-hidden />
                <p className="mt-3 font-mono text-mf-body font-semibold text-primary">{name}</p>
                <p className="mt-2 text-mf-body text-muted-foreground">{text}</p>
              </div>
            ))}
          </div>
        </SectionWrapper>

            <SectionWrapper id="feature-selection" title="Feature Selection">
              <p className="mb-6 text-mf-body leading-relaxed text-muted-foreground">
                Correlation diagnostics feeding rank‑truncated subsets before scaling and encoding.
              </p>
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
            </SectionWrapper>

            <SectionWrapper id="min-max-scaling" title="Min–Max Scaling">
              <p className="mb-6 text-mf-body leading-relaxed text-muted-foreground">
                Post‑scaling marginals and correlations.
              </p>
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
            </SectionWrapper>

            <SectionWrapper id="one-hot-encoding" title="One‑Hot Encoding">
              <p className="mb-6 text-mf-body leading-relaxed text-muted-foreground">
                Dummy proliferation by source cohort.
              </p>
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
            </SectionWrapper>

            <LightboxGallery
              images={gallery.imgs}
              index={gallery.idx}
              open={gallery.imgs.length > 0}
              onClose={() => setGallery({ imgs: [], idx: 0 })}
            />
          </div>
        </main>

        <aside className="medflow-no-print hidden w-48 shrink-0 xl:block">
          <PageTOC sections={TOC_PREPROCESSING} />
        </aside>
      </div>
    </PageShell>
  )
}
