import { useNavigate } from 'react-router-dom'
import { handleInteractiveRouting } from '../config/interactiveUrl'
import { PageShell } from '../components/PageShell'
import { PageTOC, TOC_LANDING } from '../components/PageTOC'
import { SectionWrapper } from '../components/SectionWrapper'

export function Landing() {
  const navigate = useNavigate()

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
                  <a
                    href="https://www.google.com"
                    className="btn btn-primary"
                    target="_blank"
                    rel="noopener noreferrer"
                  >
                    Visit Clustering Workbench
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
