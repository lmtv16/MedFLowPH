import { FlaskConical } from 'lucide-react'
import { useEffect, useState } from 'react'
import { NavLink, useNavigate } from 'react-router-dom'

export type PageTOCSection = {
  id: string
  label: string
  /** If set, navigates to this path (and optional `#hash`) instead of scrolling to `id` on the current page. */
  linkTo?: string
}

type PageTOCProps = {
  sections: PageTOCSection[]
  /** Show EDA / Clustering / Comparison shortcuts below the divider. */
  showRouteLinks?: boolean
}

export const TOC_LANDING: PageTOCSection[] = [
  { id: 'hero', label: 'Overview' },
  { id: 'background', label: 'Background' },
  { id: 'objectives', label: 'Objectives' },
  { id: 'data-collection', label: 'Data' },
  { id: 'data-description', label: 'Schema' },
  { id: 'dataset-snapshot', label: 'Snapshot' },
  { id: 'recommendations', label: 'Recommendations' },
  { id: 'references', label: 'References' },
]

export const TOC_EDA: PageTOCSection[] = [
  { id: 'du-hero', label: 'Overview' },
  { id: 'du-raw', label: 'Raw Dataset' },
  { id: 'du-cleaning', label: 'Cleaning' },
  { id: 'du-exploration', label: 'Exploration' },
  { id: 'du-preprocessing', label: 'Preprocessing' },
  { id: 'du-pca', label: 'PCA' },
  { id: 'du-kmeans', label: 'K-Means' },
  { id: 'du-dbscan', label: 'DBSCAN' },
  { id: 'du-eval-kmeans', label: 'K-Means Eval' },
  { id: 'du-eval-dbscan', label: 'DBSCAN Eval' },
  { id: 'du-interp-kmeans', label: 'K-Means Interp' },
  { id: 'du-interp-dbscan', label: 'DBSCAN Interp' },
  { id: 'du-comparison', label: 'Comparison' },
  { id: 'du-conclusion', label: 'Conclusion' },
  { id: 'eda-overview', label: 'Interactive charts' },
  { id: 'eda-merged', label: 'Merged charts' },
  { id: 'eda-quarter', label: 'By quarter' },
]

/** Pipeline walkthrough anchors only (first part of the unified Data Understanding page). */
export const DU_PIPELINE_SECTIONS: PageTOCSection[] = TOC_EDA.slice(0, 14)

export const TOC_PREPROCESSING: PageTOCSection[] = [
  { id: 'data-cleaning', label: 'Data Cleaning' },
  { id: 'feature-engineering', label: 'Feature Engineering' },
]

/** Clustering workflow page — scroll anchors for PCA, K‑Means, DBSCAN, and approach comparison. */
export const TOC_CLUSTERING_NAV: PageTOCSection[] = [
  { id: 'clustering-pca', label: 'Principal component analysis' },
  { id: 'clustering-kmeans', label: 'K‑Means clustering' },
  { id: 'clustering-dbscan', label: 'DBSCAN clustering' },
  {
    id: 'interpretation-dbscan-insights',
    label: 'DBSCAN Cluster Insights',
    linkTo: '/interpretation#interpretation-dbscan-insights',
  },
  { id: 'clustering-approach-comparison', label: 'Approach comparison' },
]

export const TOC_EVALUATION_NAV: PageTOCSection[] = [
  { id: 'evaluation-kmeans-context', label: 'Evaluation context' },
]

export const TOC_INTERPRETATION: PageTOCSection[] = [
  { id: 'interpretation-overview', label: 'Overview' },
  { id: 'interpretation-pca-3d', label: '3D PCA (pre‑clustering)' },
  { id: 'interpretation-kmeans-3d', label: '3D K‑Means PCA' },
  { id: 'interpretation-dbscan-3d', label: '3D DBSCAN PCA' },
  { id: 'interpretation-labels', label: 'K-Means cluster insights' },
  { id: 'interpretation-cluster-summary', label: 'K-Means summary & conclusion' },
  { id: 'interpretation-dbscan-insights', label: 'DBSCAN cluster insights' },
  { id: 'interpretation-dbscan-summary-conclusion', label: 'DBSCAN summary & conclusion' },
  { id: 'interpretation-policy', label: 'Evidences' },
]

export const TOC_COMPARISON: PageTOCSection[] = [
  { id: 'comparison-aspects', label: 'Aspects' },
  { id: 'comparison-verdict', label: 'Verdict' },
  { id: 'comparison-findings', label: 'Findings' },
  { id: 'comparison-summary', label: 'Summary Metrics' },
  { id: 'comparison-charts', label: 'Chart Comparison' },
  { id: 'comparison-gallery', label: 'Visual Gallery' },
  { id: 'comparison-conclusion', label: 'Conclusion' },
  { id: 'comparison-recommendation', label: 'Recommendation' },
]

const routeLinks = [
  { path: '/eda', label: 'Data Understanding' },
  { path: '/clustering', label: 'Cluster Segmentation' },
  { path: '/comparison', label: 'Model Comparison' },
]

export function PageTOC({ sections, showRouteLinks = true }: PageTOCProps) {
  const navigate = useNavigate()
  const [active, setActive] = useState(sections[0]?.id ?? '')

  useEffect(() => {
    if (sections.length === 0) return

    const observers: IntersectionObserver[] = []

    sections.forEach(({ id, linkTo }) => {
      if (linkTo) return
      const el = document.getElementById(id)
      if (!el) return
      const obs = new IntersectionObserver(
        ([entry]) => {
          if (entry.isIntersecting) setActive(id)
        },
        { rootMargin: '-30% 0px -60% 0px', threshold: 0 },
      )
      obs.observe(el)
      observers.push(obs)
    })

    return () => observers.forEach((o) => o.disconnect())
  }, [sections])

  const goToSection = (s: PageTOCSection) => {
    if (s.linkTo) {
      const [pathname, h] = s.linkTo.split('#')
      navigate({ pathname: pathname || '/', hash: h ? `#${h}` : undefined })
      return
    }
    document.getElementById(s.id)?.scrollIntoView({ behavior: 'smooth', block: 'start' })
  }

  if (sections.length === 0) return null

  return (
    <nav
      className="sticky top-24 z-20 flex w-full max-w-[12rem] flex-col gap-0.5 self-start"
      aria-label="Page contents"
    >
      <div className="mb-3 flex items-center gap-1.5 px-3">
        <FlaskConical className="h-3.5 w-3.5 text-primary" aria-hidden />
        <span
          className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground/70"
          style={{ fontFamily: "'Plus Jakarta Sans', sans-serif" }}
        >
          Contents
        </span>
      </div>

      {sections.map((s) => (
        <button
          key={s.id}
          type="button"
          onClick={() => goToSection(s)}
          className={`rounded-lg px-3 py-1.5 text-left text-xs transition-all duration-200 ${
            active === s.id
              ? 'border-l-2 border-primary bg-primary/10 pl-2.5 font-semibold text-primary'
              : 'text-muted-foreground hover:bg-muted/50 hover:text-foreground'
          }`}
        >
          {s.label}
        </button>
      ))}

      {showRouteLinks ? (
        <>
          <div className="mx-3 my-3 h-px bg-border" />
          <p className="mb-1 px-3 text-[10px] uppercase tracking-widest text-muted-foreground/60">Pages</p>
          {routeLinks.map((r) => (
            <NavLink
              key={r.path}
              to={r.path}
              className={({ isActive }) =>
                `rounded-lg px-3 py-1.5 text-xs transition-colors ${
                  isActive
                    ? 'bg-primary/10 font-semibold text-primary'
                    : 'text-muted-foreground hover:bg-muted/50 hover:text-foreground'
                }`
              }
            >
              {r.label}
            </NavLink>
          ))}
        </>
      ) : null}
    </nav>
  )
}
