import { motion } from 'framer-motion'
import { ImageCard } from '../components/ImageCard'
import { PageShell } from '../components/PageShell'
import { PageTOC, TOC_CLEANING } from '../components/PageTOC'
import { SectionWrapper } from '../components/SectionWrapper'

const CLEANED_SCHEMA = '/results/01/Data Schema/philgeps_cleaned_schema_table.png'
const MISSINGNESS = '/results/01/Exploratory Data Analysis/merged/01_overview_missingness_pct.png'
const CLEANING_SUMMARY = '/results/01/Summaries/philgeps_cleaning_summary_table.png'

export function Cleaning() {
  return (
    <PageShell>
      <div className="flex gap-8">
        <main className="min-w-0 flex-1 space-y-12 pb-16">
          <motion.div className="space-y-12">
            <SectionWrapper id="cleaning-overview">
              <h1 className="mb-2 font-heading text-3xl font-bold text-slate-800 dark:text-foreground">
                01 - Data Cleaning
              </h1>
              <p className="mb-3 text-lg font-medium text-blue-700 dark:text-blue-400">
                Aligning schemas, removing duplicates, and surfacing missingness before feature work.
              </p>
              <p className="max-w-3xl leading-relaxed text-slate-600 dark:text-muted-foreground">
                Cleaning aligned schemas, removed duplicates, standardized medical filtering, and surfaced missingness so
                analysts could trust row counts before feature work began.
              </p>
            </SectionWrapper>

            <SectionWrapper id="cleaning-schema" title="Cleaned Dataset Schema">
              <div className="grid grid-cols-1 gap-6">
                <div>
                  <ImageCard src={CLEANED_SCHEMA} title="Cleaned dataset schema" />
                  <p className="mt-3 text-sm leading-relaxed text-slate-500 dark:text-muted-foreground">
                    Post-cleaning columns include engineered signals (log budgets, lags, procurement flags) layered on top
                    of the surviving PhilGEPS identifiers.
                  </p>
                </div>
              </div>
            </SectionWrapper>

            <SectionWrapper id="cleaning-missingness" title="Missingness Overview">
              <div className="grid grid-cols-1 gap-6">
                <div>
                  <ImageCard src={MISSINGNESS} title="Missingness overview (%)" />
                  <p className="mt-3 text-sm leading-relaxed text-slate-500 dark:text-muted-foreground">
                    Missingness plots guard against silent NA propagation—any spike here triggers explicit imputation or
                    drop rules prior to correlation analysis.
                  </p>
                </div>
              </div>
            </SectionWrapper>

            <SectionWrapper id="cleaning-summary" title="Cleaning Summary">
              <div className="grid grid-cols-1 gap-6">
                <div>
                  <ImageCard src={CLEANING_SUMMARY} title="Cleaning summary table" />
                  <p className="mt-3 text-sm leading-relaxed text-slate-500 dark:text-muted-foreground">
                    The summary table consolidates deduplication totals, medical keyword retention, and quarter-level row
                    reconciliation against the raw feeds.
                  </p>
                </div>
              </div>
            </SectionWrapper>
          </motion.div>
        </main>

        <aside className="medflow-no-print hidden w-48 shrink-0 xl:block">
          <PageTOC sections={TOC_CLEANING} />
        </aside>
      </div>
    </PageShell>
  )
}
