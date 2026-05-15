import { ChevronDown, FlaskConical } from 'lucide-react'
import { useEffect, useMemo, useState } from 'react'
import { NavLink, useLocation, useNavigate } from 'react-router-dom'
import { lockAdjacentPageNavForProgrammaticScroll } from '../utils/scrollNavGuards'

const TOC_PREVIEW_CHARS = 360

/** Pull a short teaser from an in-page anchor (subtitle, iframe title h3, or truncated body). */
export function tocPreviewFromElement(el: HTMLElement | null): string {
  if (!el) return ''
  const fromHintAttr = el.getAttribute('data-toc-preview')?.trim()
  if (fromHintAttr) return truncatePreviewText(fromHintAttr, TOC_PREVIEW_CHARS)
  const subtitle = el.querySelector('header > p')
  const subTxt = subtitle?.textContent?.replace(/\s+/g, ' ').trim()
  if (subTxt) return truncatePreviewText(subTxt, TOC_PREVIEW_CHARS)
  const iframeHeading = el.querySelector(':scope > div.mb-3 h3')
  const hTxt = iframeHeading?.textContent?.replace(/\s+/g, ' ').trim()
  if (hTxt) return truncatePreviewText(hTxt, TOC_PREVIEW_CHARS)
  const body = el.innerText?.replace(/\s+/g, ' ').trim() ?? ''
  if (!body) return ''
  return truncatePreviewText(body, TOC_PREVIEW_CHARS)
}

function truncatePreviewText(s: string, maxLen: number) {
  if (s.length <= maxLen) return s
  return `${s.slice(0, Math.max(0, maxLen - 1)).trim()}…`
}

export type PageTOCSection = {
  id: string
  label: string
  /** If set, navigates to this path (and optional `#hash`) instead of scrolling to `id` on the current page. */
  linkTo?: string
  /** Primary jump for Interpretation methodology blocks (K‑Means vs DBSCAN). */
  sectionJump?: boolean
  /** Indented TOC row — sub-anchors beneath a methodology block. */
  nested?: boolean
  /**
   * When set, this row is rendered inside the dropdown for `interpretation-section-kmeans` /
   * `interpretation-section-dbscan` (matched by parent `id`) instead of as a top-level item.
   * Keeps `TOC_*` array in document order for scroll-spy while grouping the link in the nav.
   */
  tocParentId?: string
  /** Hover preview when excerpt is insufficient (external links, etc.). */
  hint?: string
}

type TocRow =
  | { kind: 'item'; section: PageTOCSection }
  | { kind: 'dropdown'; parent: PageTOCSection; children: PageTOCSection[] }

/** Collapse consecutive `nested` entries under each `sectionJump` into one dropdown-style panel. */
function buildInterpretationDropdownRows(sections: PageTOCSection[]): TocRow[] {
  if (!sections.some((s) => s.sectionJump)) {
    return sections.filter((s) => !s.tocParentId).map((section) => ({ kind: 'item' as const, section }))
  }
  const injectedForParent = (parentId: string): PageTOCSection[] =>
    sections.filter((sec) => sec.tocParentId === parentId)

  const out: TocRow[] = []
  let i = 0
  while (i < sections.length) {
    const s = sections[i]!
    if (s.tocParentId) {
      i++
      continue
    }
    if (s.sectionJump) {
      const children: PageTOCSection[] = []
      let j = i + 1
      while (j < sections.length && sections[j]?.nested && !sections[j]?.tocParentId) {
        children.push(sections[j]!)
        j++
      }
      const merged = [...children, ...injectedForParent(s.id)]
      if (merged.length === 0) {
        out.push({ kind: 'item', section: s })
      } else {
        out.push({ kind: 'dropdown', parent: s, children: merged })
      }
      i = j
    } else {
      out.push({ kind: 'item', section: s })
      i++
    }
  }
  return out
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
  { id: 'eda-quarter', label: 'By quarter' },
  { id: 'du-conclusion', label: 'Conclusion' },
]

/** Pipeline walkthrough anchors only (through Conclusion; before interactive EDA chart sections). */
export const DU_PIPELINE_SECTIONS: PageTOCSection[] = TOC_EDA.slice(0, 3)

/** Data Cleaning page — schema, merged EDA figures, and cleaning summary anchors. */
export const TOC_CLEANING: PageTOCSection[] = [
  { id: 'cleaning-overview', label: 'Overview' },
  { id: 'cleaning-schema', label: 'Cleaned Dataset Schema' },
  { id: 'cleaning-merged', label: 'Exploratory Data Analysis (EDA)' },
  { id: 'cleaning-summary', label: 'Summary' },
]

export const TOC_PREPROCESSING: PageTOCSection[] = [
  { id: 'preprocessing-overview', label: 'Overview' },
  { id: 'cleaned-dataset-exploration', label: 'Cleaned Dataset Exploration' },
  { id: 'data-cleaning', label: 'Data Cleaning' },
  { id: 'feature-engineering', label: 'Feature Engineering' },
]

/** Principal Component Analysis page — loadings, 3D projections, and interactive view. */
export const TOC_PCA: PageTOCSection[] = [
  { id: 'pca-overview', label: 'Overview' },
  { id: 'pca-loadings', label: 'Loadings & Variance' },
  { id: 'pca-3d', label: '3D Projections' },
  { id: 'pca-interactive', label: 'Interactive PCA' },
]

/** Clustering workflow page — scroll anchors for K-means, DBSCAN, and approach comparison. */
export const TOC_CLUSTERING_NAV: PageTOCSection[] = [
  { id: 'du-kmeans', label: 'K-means Clustering' },
  { id: 'du-dbscan', label: 'DBSCAN Clustering' },
  { id: 'clustering-approach-comparison', label: 'Approach comparison' },
]

export const TOC_EVALUATION_NAV: PageTOCSection[] = [
  { id: 'evaluation-kmeans-context', label: 'Evaluation context' },
  { id: 'du-eval-kmeans', label: 'K-Means Eval', nested: true },
  { id: 'du-eval-dbscan', label: 'DBSCAN Eval', nested: true },
]

export const TOC_INTERPRETATION: PageTOCSection[] = [
  { id: 'interpretation-overview', label: 'Overview' },
  { id: 'interpretation-section-kmeans', label: 'K‑Means', sectionJump: true },
  {
    id: 'interpretation-kmeans-3d',
    label: '3D K‑Means PCA',
    nested: true,
  },
  { id: 'interpretation-labels', label: 'Cluster Insights & Interpretation (K‑Means)', nested: true },
  {
    id: 'interpretation-cluster-summary',
    label: 'Overall cluster summary (K‑Means)',
    nested: true,
  },
  {
    id: 'interpretation-overall-conclusion',
    label: 'Overall conclusion (K‑Means)',
    nested: true,
  },

  {
    id: 'interpretation-policy',
    label: 'Evidence (K‑Means)',
    tocParentId: 'interpretation-section-kmeans',
  },

  { id: 'interpretation-section-dbscan', label: 'DBSCAN', sectionJump: true },
  {
    id: 'interpretation-dbscan-3d',
    label: '3D DBSCAN PCA',
    nested: true,
  },
  { id: 'interpretation-dbscan-insights', label: 'Cluster Insights & Interpretation (DBSCAN)', nested: true },
  {
    id: 'interpretation-dbscan-cluster-summary',
    label: 'Overall cluster summary (DBSCAN)',
    nested: true,
  },
  {
    id: 'interpretation-dbscan-overall-conclusion',
    label: 'Overall conclusion (DBSCAN)',
    nested: true,
  },

  {
    id: 'interpretation-policy-dbscan',
    label: 'DBSCAN evidences',
    tocParentId: 'interpretation-section-dbscan',
  },
]

export const TOC_COMPARISON: PageTOCSection[] = [
  { id: 'comparison-aspects', label: 'Aspects' },
  { id: 'comparison-verdict', label: 'Verdict' },
  { id: 'comparison-findings', label: 'Findings' },
  { id: 'comparison-summary', label: 'Summary Metrics' },
  { id: 'comparison-gallery', label: 'Visual Gallery' },
  { id: 'comparison-conclusion', label: 'Conclusion' },
  { id: 'comparison-recommendation', label: 'Recommendation' },
]

const routeLinks = [
  { path: '/eda', label: 'Data Preparation' },
  { path: '/clustering', label: 'Modeling' },
  { path: '/interpretation', label: 'Results' },
  { path: '/comparison', label: 'Model Comparison' },
] as const

const PAGES_NAV_PANEL_ID = 'page-toc-route-links'

/** Matches main content top padding (~pt-24) + sticky toolbar so the spy line aligns with visible content. */
export const SCROLL_SPY_VIEWPORT_TOP = 118

/**
 * Given section ids in document order (TOC order), returns the active id for scroll-spy:
 * the last heading whose block has crossed the inset from the viewport top.
 */
export function computeActiveTocSectionId(sectionIdsOrdered: string[], insetPx = SCROLL_SPY_VIEWPORT_TOP) {
  let candidate = sectionIdsOrdered[0] ?? ''
  for (const id of sectionIdsOrdered) {
    const el = document.getElementById(id)
    if (!el) continue
    if (el.getBoundingClientRect().top <= insetPx) candidate = id
  }
  return candidate || sectionIdsOrdered[0] || ''
}

export function PageTOC({ sections, showRouteLinks = true }: PageTOCProps) {
  const navigate = useNavigate()
  const location = useLocation()
  const [active, setActive] = useState(sections[0]?.id ?? '')
  const [hoverPreview, setHoverPreview] = useState<{ id: string; text: string } | null>(null)
  const [openDropdownId, setOpenDropdownId] = useState<string | null>(null)
  const [pagesNavOpen, setPagesNavOpen] = useState(false)

  const pagesGroupActive = useMemo(
    () => routeLinks.some((r) => location.pathname === r.path),
    [location.pathname],
  )

  const tocScrollIds = useMemo(
    () => sections.filter(({ linkTo }) => !linkTo).map(({ id }) => id),
    [sections],
  )

  /** Single scroll spy: TOC order doubles as nominal document flow for these pages. */
  useEffect(() => {
    if (tocScrollIds.length === 0) return

    let scheduled = false
    const flush = () => {
      scheduled = false
      const next = computeActiveTocSectionId(tocScrollIds)
      if (next) setActive(next)
    }

    const onScrollResize = () => {
      if (scheduled) return
      scheduled = true
      requestAnimationFrame(flush)
    }

    flush()
    window.addEventListener('scroll', onScrollResize, { passive: true })
    window.addEventListener('resize', onScrollResize)
    return () => {
      window.removeEventListener('scroll', onScrollResize)
      window.removeEventListener('resize', onScrollResize)
    }
  }, [tocScrollIds])

  const goToSection = (s: PageTOCSection) => {
    if (s.linkTo) {
      const [pathname, h] = s.linkTo.split('#')
      const targetPath = pathname || '/'
      const hash = h ? `#${h}` : undefined
      if (targetPath === location.pathname && hash) {
        navigate({ pathname: targetPath, search: location.search, hash }, { replace: true })
        return
      }
      navigate({ pathname: targetPath, hash })
      return
    }
    lockAdjacentPageNavForProgrammaticScroll()
    document.getElementById(s.id)?.scrollIntoView({ behavior: 'smooth', block: 'start' })
  }

  const resolveHoverPreview = (s: PageTOCSection) => {
    if (s.linkTo && s.hint) return s.hint
    if (s.linkTo) return `${s.label} — opens linked page`
    const el = document.getElementById(s.id)
    let text = tocPreviewFromElement(el)
    if (!text && s.hint) text = s.hint
    return text || s.label
  }

  const tocRows = useMemo(() => buildInterpretationDropdownRows(sections), [sections])

  /** Keep methodology dropdown open whenever scroll-spy picks that block or any child anchor. */
  useEffect(() => {
    for (const row of tocRows) {
      if (row.kind !== 'dropdown') continue
      if (
        active === row.parent.id ||
        row.children.some((c) => c.id === active)
      ) {
        setOpenDropdownId(row.parent.id)
        return
      }
    }
    setOpenDropdownId(null)
  }, [active, tocRows])

  /** Keep Pages dropdown open while viewing any linked route. */
  useEffect(() => {
    if (pagesGroupActive) setPagesNavOpen(true)
  }, [pagesGroupActive])

  if (sections.length === 0) return null

  const rowClassLeaf = (s: PageTOCSection) => {
    const relaxed = active === s.id
    let rowClass: string
    const motionSafe = 'motion-reduce:transition-none'
    if (s.sectionJump) {
      rowClass = `mx-2 mb-1 mt-3 rounded-lg border py-2.5 px-3 text-left text-mf-toc font-semibold tracking-wide transition-all duration-[280ms] ease-out ${motionSafe} hover:brightness-[1.02] dark:hover:brightness-[1.05] ${
        relaxed
          ? `border-primary bg-primary/15 text-primary ${motionSafe}`
          : 'border-border bg-muted/50 text-foreground hover:border-primary/40 hover:bg-muted'
      }`
    } else if (s.nested) {
      rowClass = `rounded-lg px-3 py-1 pl-6 text-left text-mf-toc transition-colors duration-[280ms] ease-out ${motionSafe} hover:text-foreground hover:brightness-[1.02] dark:hover:brightness-[1.05] ${
        relaxed
          ? `border-l-2 border-primary bg-primary/10 pl-[1.375rem] font-semibold text-primary ${motionSafe}`
          : 'border-l-2 border-transparent text-muted-foreground hover:bg-muted/50 hover:text-foreground'
      }`
    } else {
      rowClass = `rounded-lg px-3 py-1.5 text-left text-mf-toc transition-colors duration-[280ms] ease-out ${motionSafe} hover:text-foreground hover:brightness-[1.02] dark:hover:brightness-[1.05] ${
        relaxed
          ? `border-l-2 border-primary bg-primary/10 pl-2.5 font-semibold text-primary ${motionSafe}`
          : 'border-l-2 border-transparent text-muted-foreground hover:bg-muted/50 hover:text-foreground'
      }`
    }
    return rowClass
  }

  return (
    <nav
      className="sticky top-24 z-[30] flex w-full max-w-[12rem] flex-col gap-0.5 self-start overflow-visible rounded-xl ring-1 ring-border/80 shadow-sm"
      aria-label="Page contents"
    >
      <div className="mb-3 flex items-center gap-1.5 px-3">
        <FlaskConical className="h-3.5 w-3.5 text-primary" aria-hidden />
        <span
          className="text-mf-caption font-bold uppercase tracking-widest text-muted-foreground/70"
          style={{ fontFamily: "'Plus Jakarta Sans', sans-serif" }}
        >
          Contents
        </span>
      </div>

      {tocRows.map((row) => {
        if (row.kind === 'item') {
          const s = row.section
          const rowClass = rowClassLeaf(s)
          const tipId = `${s.id}-toc-hover-preview`
          const previewText = hoverPreview?.id === s.id ? hoverPreview.text : ''
          return (
            <div
              key={s.id}
              className="relative"
              onPointerEnter={() =>
                setHoverPreview({ id: s.id, text: resolveHoverPreview(s) })
              }
              onPointerLeave={() =>
                setHoverPreview((prev) => (prev?.id === s.id ? null : prev))
              }
            >
              <button
                type="button"
                data-toc-anchor={s.id}
                onClick={() => goToSection(s)}
                className={rowClass}
                aria-current={active === s.id ? 'location' : undefined}
                aria-describedby={previewText ? tipId : undefined}
              >
                {s.label}
              </button>
              {previewText ? (
                <div
                  role="tooltip"
                  id={tipId}
                  className="pointer-events-none absolute top-1/2 right-[calc(100%+0.625rem)] z-[60] hidden max-h-[min(42vh,18rem)] w-[15.5rem] -translate-y-1/2 overflow-y-auto rounded-xl border border-border bg-popover p-3 text-left text-mf-caption leading-relaxed text-popover-foreground shadow-lg xl:block"
                >
                  {previewText}
                </div>
              ) : null}
            </div>
          )
        }

        const { parent, children } = row
        const panelId = `${parent.id}-toc-submenu`
        const open = openDropdownId === parent.id
        const groupActive =
          active === parent.id || children.some((c) => c.id === active)
        const barClass =
          `flex overflow-hidden rounded-lg border text-mf-toc font-semibold tracking-wide transition-all duration-[280ms] ease-out motion-reduce:transition-none hover:brightness-[1.02] dark:hover:brightness-[1.05] ` +
          (groupActive
            ? 'border-primary bg-primary/15 text-primary'
            : 'border-border bg-muted/50 text-foreground hover:border-primary/40 hover:bg-muted')

        const parentTipId = `${parent.id}-toc-hover-preview`
        const parentPreview =
          hoverPreview?.id === parent.id ? hoverPreview.text : ''

        const barNode = (
          <div className={barClass}>
            <button
              type="button"
              data-toc-anchor={parent.id}
              aria-current={active === parent.id ? 'location' : undefined}
              className={`min-w-0 flex-1 truncate py-2.5 pl-3 pr-1 text-left transition-colors duration-[280ms] ease-out motion-reduce:transition-none ${
                groupActive ? 'text-primary' : 'text-foreground'
              }`}
              onClick={() => goToSection(parent)}
            >
              {parent.label}
            </button>
            <button
              type="button"
              className={`shrink-0 border-l border-border/80 px-2 transition-colors duration-[280ms] ease-out hover:bg-muted/70 motion-reduce:transition-none focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/40`}
              aria-expanded={open}
              aria-controls={panelId}
              aria-label={`${open ? 'Hide' : 'Show'} ${parent.label} subsections`}
              onClick={(e) => {
                e.stopPropagation()
                setOpenDropdownId((prev) => (prev === parent.id ? null : parent.id))
              }}
            >
              <ChevronDown
                aria-hidden
                className={`h-4 w-4 transition-transform ${open ? 'rotate-180' : ''}`}
              />
            </button>
          </div>
        )

        return (
          <div key={parent.id} className="mb-1 flex flex-col">
            <div
              className="relative mx-2 mb-0 mt-3"
              onPointerEnter={() =>
                setHoverPreview({
                  id: parent.id,
                  text: resolveHoverPreview(parent),
                })
              }
              onPointerLeave={() =>
                setHoverPreview((prev) =>
                  prev?.id === parent.id ? null : prev,
                )
              }
            >
              {barNode}
              {parentPreview ? (
                <div
                  role="tooltip"
                  id={parentTipId}
                  className="pointer-events-none absolute bottom-full right-0 z-[61] mb-2 hidden max-h-[min(42vh,18rem)] w-[15.5rem] overflow-y-auto rounded-xl border border-border bg-popover p-3 text-left text-mf-caption leading-relaxed text-popover-foreground shadow-lg xl:block"
                >
                  {parentPreview}
                </div>
              ) : null}
            </div>
            {open ? (
              <div
                id={panelId}
                role="group"
                aria-label={`${parent.label} subsections`}
                className="mx-3 mb-1 ml-5 mt-1 space-y-0.5 border-l border-border py-1 pl-2"
              >
                {children.map((c) => {
                  const relaxed = active === c.id
                  const subClass = `w-full rounded-md px-2 py-1.5 text-left text-mf-toc transition-colors duration-[280ms] ease-out motion-reduce:transition-none ${
                    relaxed
                      ? `bg-primary/15 font-semibold text-primary medflow-scroll-active-indicator`
                      : 'text-muted-foreground hover:bg-muted/70 hover:text-foreground hover:brightness-[1.03] dark:hover:brightness-[1.05]'
                  }`
                  const previewText = hoverPreview?.id === c.id ? hoverPreview.text : ''
                  const ctId = `${c.id}-toc-hover-preview`
                  return (
                    <div
                      key={c.id}
                      className="relative"
                      onPointerEnter={() =>
                        setHoverPreview({ id: c.id, text: resolveHoverPreview(c) })
                      }
                      onPointerLeave={() =>
                        setHoverPreview((prev) =>
                          prev?.id === c.id ? null : prev,
                        )
                      }
                    >
                      <button
                        type="button"
                        data-toc-anchor={c.id}
                        aria-current={active === c.id ? 'location' : undefined}
                        className={subClass}
                        onClick={() => goToSection(c)}
                        aria-describedby={previewText ? ctId : undefined}
                      >
                        {c.label}
                      </button>
                      {previewText ? (
                        <div
                          role="tooltip"
                          id={ctId}
                          className="pointer-events-none absolute top-0 right-[calc(100%+0.625rem)] z-[60] hidden max-h-[min(42vh,18rem)] w-[15.5rem] overflow-y-auto rounded-xl border border-border bg-popover p-3 text-left text-mf-caption leading-relaxed text-popover-foreground shadow-lg xl:block"
                        >
                          {previewText}
                        </div>
                      ) : null}
                    </div>
                  )
                })}
              </div>
            ) : null}
          </div>
        )
      })}

      {showRouteLinks ? (
        <>
          <div className="mx-3 my-3 h-px bg-border" />
          <div className="mb-1 flex flex-col">
            <button
              type="button"
              className={`flex w-full items-center justify-between gap-1 rounded-lg px-3 py-1.5 text-left text-mf-caption uppercase tracking-widest transition-colors duration-[280ms] ease-out motion-reduce:transition-none hover:bg-muted/50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/40 ${
                pagesGroupActive
                  ? 'font-semibold text-foreground'
                  : 'text-muted-foreground/60 hover:text-foreground'
              }`}
              aria-expanded={pagesNavOpen}
              aria-controls={PAGES_NAV_PANEL_ID}
              onClick={() => setPagesNavOpen((open) => !open)}
            >
              <span>Pages</span>
              <ChevronDown
                aria-hidden
                className={`h-3.5 w-3.5 shrink-0 transition-transform duration-[280ms] ease-out motion-reduce:transition-none ${
                  pagesNavOpen ? 'rotate-180' : ''
                }`}
              />
            </button>
            {pagesNavOpen ? (
              <div
                id={PAGES_NAV_PANEL_ID}
                role="group"
                aria-label="Site pages"
                className="ml-3 mt-0.5 flex flex-col gap-0.5 border-l border-border/80 py-1 pl-2"
              >
                {routeLinks.map((r) => (
                  <NavLink
                    key={r.path}
                    to={r.path}
                    className={({ isActive }) =>
                      `rounded-lg px-3 py-1.5 text-mf-toc transition-colors duration-[280ms] ease-out motion-reduce:transition-none ${
                        isActive
                          ? 'border-l-2 border-primary bg-primary/10 pl-2.5 font-semibold text-primary'
                          : 'border-l-2 border-transparent text-muted-foreground hover:bg-muted/50 hover:text-foreground'
                      }`
                    }
                  >
                    {r.label}
                  </NavLink>
                ))}
              </div>
            ) : null}
          </div>
        </>
      ) : null}
    </nav>
  )
}
