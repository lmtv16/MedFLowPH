import { useState } from 'react'
import { Clock, DollarSign, Hash, Layers } from 'lucide-react'
import { ImageCard } from '../components/ImageCard'
import type { GalleryImage } from '../components/LightboxGallery'
import { LightboxGallery } from '../components/LightboxGallery'
import { PageShell } from '../components/PageShell'
import { SectionHeader } from '../components/SectionHeader'
import { SectionWrapper } from '../components/SectionWrapper'
import { DATA_PATHS, IMAGES } from '../data/fileManifest'
import { useCsvData } from '../hooks/useCsvData'

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

  function openGallery(imgs: GalleryImage[], idx: number) {
    setGallery({ imgs, idx })
  }

  const scaledPreviewKeys = scaledRows.length ? Object.keys(scaledRows[0] ?? {}) : []
  const featureCols = featureRows.length ? Object.keys(featureRows[0] ?? {}) : []
  const scaledPreview = scaledRows.slice(0, 10)

  return (
    <PageShell>
      <div className="space-y-12">
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
