import { AnimatePresence, motion } from 'framer-motion'
import { useEffect, useRef, useState } from 'react'
import { ChevronDown, Moon, Sparkles, Sun } from 'lucide-react'
import { NavLink, useLocation, useNavigate } from 'react-router-dom'
import {
  TOC_CLUSTERING_NAV,
  TOC_COMPARISON,
  TOC_EDA,
  TOC_EVALUATION_NAV,
  TOC_INTERPRETATION,
  TOC_LANDING,
  TOC_PREPROCESSING,
  type PageTOCSection,
} from './PageTOC'

const TOPBAR_NAV: {
  path: string
  label: string
  /** Shorter label for the compact mobile nav strip (first four items). */
  compactLabel?: string
  sections: readonly PageTOCSection[]
  highlight?: boolean
}[] = [
  { path: '/', label: 'Home', sections: TOC_LANDING },
  {
    path: '/eda',
    label: 'Data Understanding',
    sections: TOC_EDA,
  },
  { path: '/preprocessing', label: 'Preprocessing', sections: TOC_PREPROCESSING },
  { path: '/clustering', label: 'Clustering', sections: TOC_CLUSTERING_NAV },
  { path: '/evaluation', label: 'Evaluation', sections: TOC_EVALUATION_NAV },
  { path: '/interpretation', label: 'Interpretation', sections: TOC_INTERPRETATION },
  { path: '/comparison', label: 'Comparison', sections: TOC_COMPARISON, highlight: true },
]

const MOBILE_MORE_NAV = TOPBAR_NAV.slice(4)

type TopbarProps = {
  title: string
  breadcrumb: string[]
}

function scrollToId(id: string) {
  document.getElementById(id)?.scrollIntoView({ behavior: 'smooth', block: 'start' })
}

/** Segment inside split nav control (no rounding; parent clips with rounded-lg). */
function navSegmentClass(isActive: boolean) {
  return `inline-flex items-center gap-1 whitespace-nowrap text-sm transition-colors ${
    isActive
      ? 'bg-primary/10 font-semibold text-mf-primary dark:text-primary'
      : 'text-mf-muted hover:bg-slate-100 hover:text-mf-ink dark:text-muted-foreground dark:hover:bg-muted dark:hover:text-foreground'
  }`
}

function NavPageDropdown({
  path,
  label,
  compactLabel,
  sections,
  highlight,
  isOpen,
  onOpenChange,
  compact,
  setRootEl,
}: {
  path: string
  label: string
  compactLabel?: string
  sections: readonly PageTOCSection[]
  highlight?: boolean
  isOpen: boolean
  onOpenChange: (open: boolean) => void
  compact?: boolean
  setRootEl?: (el: HTMLDivElement | null) => void
}) {
  const navigate = useNavigate()
  const location = useLocation()
  const isActive = path === '/' ? location.pathname === '/' : location.pathname === path

  const navLinkLabel = compact && compactLabel ? compactLabel : label

  function goToSection(s: PageTOCSection) {
    onOpenChange(false)
    if (s.linkTo) {
      const [pathname, h] = s.linkTo.split('#')
      navigate({ pathname: pathname || '/', hash: h ? `#${h}` : undefined })
      return
    }
    if (location.pathname === path) {
      scrollToId(s.id)
    } else {
      navigate({ pathname: path, hash: `#${s.id}` })
    }
  }

  const linkPad = compact ? 'pl-2 pr-1.5 py-1.5 text-xs' : 'pl-2.5 pr-2 py-1.5 text-sm'
  const tocTriggerPad = compact ? 'px-1.5 py-1.5' : 'px-2 py-1.5'
  const bordered = Boolean(highlight)

  return (
    <div className="relative shrink-0" ref={setRootEl} data-nav-dropdown-root>
      <div
        className={`inline-flex items-stretch overflow-hidden rounded-lg ${
          bordered ? 'ring-1 ring-sky-400/40' : ''
        }`}
      >
        <NavLink
          to={path}
          end={path === '/'}
          title={navLinkLabel !== label ? label : undefined}
          className={`${navSegmentClass(isActive)} ${linkPad} ${
            bordered ? 'border-r border-slate-200 dark:border-border' : ''
          }`}
          onClick={(e) => {
            onOpenChange(false)
            if (location.pathname === path) {
              e.preventDefault()
              window.scrollTo({ top: 0, behavior: 'smooth' })
            }
          }}
        >
          {navLinkLabel}
          {highlight ? <Sparkles className="h-3.5 w-3.5 shrink-0 text-sky-500" aria-hidden /> : null}
        </NavLink>
        <button
          type="button"
          onClick={() => onOpenChange(!isOpen)}
          className={`${navSegmentClass(isActive)} ${tocTriggerPad} min-w-[1.75rem] justify-center ${
            bordered ? '-ml-px border-l border-slate-200 dark:border-border' : ''
          }`}
          aria-expanded={isOpen}
          aria-haspopup="menu"
          aria-label={`${label}: open table of contents for this page`}
        >
          <ChevronDown
            className={`h-3.5 w-3.5 shrink-0 transition-transform ${isOpen ? 'rotate-180' : ''}`}
            aria-hidden
          />
        </button>
      </div>
      <AnimatePresence>
        {isOpen ? (
          <motion.div
            initial={{ opacity: 0, y: -6 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -6 }}
            transition={{ duration: 0.18 }}
            className="absolute right-0 top-full z-50 mt-1 max-h-[min(70vh,22rem)] min-w-[12.5rem] overflow-y-auto rounded-xl border border-slate-200 bg-white py-1 shadow-lg dark:border-border dark:bg-card"
            role="menu"
            aria-label={`${label} — page contents`}
          >
            <p className="px-3 py-2 text-[10px] font-bold uppercase tracking-wider text-muted-foreground">Contents</p>
            {sections.map((s) => (
              <button
                key={s.id}
                type="button"
                role="menuitem"
                onClick={() => goToSection(s)}
                className="flex w-full px-3 py-2 text-left text-sm text-mf-ink hover:bg-slate-50 dark:text-foreground dark:hover:bg-muted"
              >
                {s.label}
              </button>
            ))}
          </motion.div>
        ) : null}
      </AnimatePresence>
    </div>
  )
}

export function Topbar({ title, breadcrumb }: TopbarProps) {
  const location = useLocation()
  const [moreOpen, setMoreOpen] = useState(false)
  const moreRef = useRef<HTMLDivElement>(null)
  const [openNavKey, setOpenNavKey] = useState<string | null>(null)
  const navRootByPath = useRef<Record<string, HTMLDivElement | null>>({})

  const [dark, setDark] = useState(() => localStorage.getItem('theme') === 'dark')

  useEffect(() => {
    if (dark) document.documentElement.classList.add('dark')
    else document.documentElement.classList.remove('dark')
    localStorage.setItem('theme', dark ? 'dark' : 'light')
  }, [dark])

  useEffect(() => {
    setMoreOpen(false)
    setOpenNavKey(null)
  }, [location.pathname])

  useEffect(() => {
    if (!moreOpen) return
    const onDoc = (e: MouseEvent) => {
      if (moreRef.current && !moreRef.current.contains(e.target as Node)) setMoreOpen(false)
    }
    document.addEventListener('mousedown', onDoc)
    return () => document.removeEventListener('mousedown', onDoc)
  }, [moreOpen])

  useEffect(() => {
    if (!openNavKey) return
    const onDoc = (e: MouseEvent) => {
      const t = e.target as Node
      if (Object.values(navRootByPath.current).some((el) => el?.contains(t))) return
      setOpenNavKey(null)
    }
    document.addEventListener('mousedown', onDoc)
    return () => document.removeEventListener('mousedown', onDoc)
  }, [openNavKey])

  function setNavOpen(path: string, open: boolean) {
    if (open) {
      setMoreOpen(false)
      setOpenNavKey(path)
    } else {
      setOpenNavKey((k) => (k === path ? null : k))
    }
  }

  return (
    <header className="medflow-topbar fixed left-0 right-0 top-[3px] z-40 flex min-h-16 items-center gap-2 border-b border-slate-200 bg-white/95 px-2 py-2 backdrop-blur dark:border-border dark:bg-card/95 md:gap-3 md:px-4 md:py-2 lg:px-6">
      <div className="flex min-w-0 flex-1 flex-col">
        <nav className="hidden text-xs text-mf-muted dark:text-muted-foreground sm:block">
          {breadcrumb.map((crumb, i) => (
            <span key={`${crumb}-${i}`}>
              {i > 0 ? <span className="mx-1 text-slate-300 dark:text-border">/</span> : null}
              <span>{crumb}</span>
            </span>
          ))}
        </nav>
        <h1
          className={
            location.pathname === '/'
              ? 'font-heading max-w-full min-w-0 text-balance break-words text-xl font-bold leading-tight text-mf-ink dark:text-foreground md:text-2xl lg:text-3xl'
              : 'max-w-full min-w-0 text-balance break-words text-base font-semibold leading-snug text-mf-ink dark:text-foreground md:text-lg'
          }
        >
          {location.pathname === '/' ? (
            <>
              MedFlow <span className="text-mf-primary dark:text-primary">PH</span>
            </>
          ) : (
            title
          )}
        </h1>
      </div>

      {/* Desktop */}
      <nav
        className="medflow-no-print hidden min-w-0 max-w-[min(100vw-14rem,52rem)] shrink flex-nowrap items-center gap-0.5 overflow-x-auto overscroll-x-contain py-0.5 lg:flex xl:max-w-none [&::-webkit-scrollbar]:h-1.5 [&::-webkit-scrollbar-thumb]:rounded-full [&::-webkit-scrollbar-thumb]:bg-slate-300 dark:[&::-webkit-scrollbar-thumb]:bg-slate-600"
        aria-label="Section navigation"
      >
        {TOPBAR_NAV.map((item) => (
          <NavPageDropdown
            key={item.path}
            path={item.path}
            label={item.label}
            compactLabel={item.compactLabel}
            sections={item.sections}
            highlight={item.highlight}
            isOpen={openNavKey === item.path}
            onOpenChange={(open) => setNavOpen(item.path, open)}
            setRootEl={(el) => {
              navRootByPath.current[item.path] = el
            }}
          />
        ))}
      </nav>

      {/* Mobile */}
      <div className="medflow-no-print flex shrink-0 flex-wrap items-center gap-0.5 lg:hidden">
        {TOPBAR_NAV.slice(0, 4).map((item) => (
          <NavPageDropdown
            key={`m-${item.path}`}
            path={item.path}
            label={item.label}
            compactLabel={item.compactLabel}
            sections={item.sections}
            highlight={item.highlight}
            isOpen={openNavKey === item.path}
            onOpenChange={(open) => setNavOpen(item.path, open)}
            compact
            setRootEl={(el) => {
              navRootByPath.current[`${item.path}:m`] = el
            }}
          />
        ))}
        <div className="relative" ref={moreRef}>
          <button
            type="button"
            onClick={() => {
              setOpenNavKey(null)
              setMoreOpen((o) => !o)
            }}
            className="inline-flex items-center gap-0.5 rounded-lg px-2 py-1.5 text-sm text-mf-muted hover:bg-slate-100 hover:text-mf-ink dark:text-muted-foreground dark:hover:bg-muted dark:hover:text-foreground"
            aria-expanded={moreOpen}
            aria-haspopup="menu"
          >
            More
            <ChevronDown className={`h-3.5 w-3.5 transition-transform ${moreOpen ? 'rotate-180' : ''}`} />
          </button>
          <AnimatePresence>
            {moreOpen ? (
              <motion.div
                initial={{ opacity: 0, y: -6 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -6 }}
                transition={{ duration: 0.18 }}
                className="absolute right-0 z-50 mt-1 min-w-[11rem] rounded-xl border border-slate-200 bg-white py-1 shadow-lg dark:border-border dark:bg-card"
                role="menu"
              >
                {MOBILE_MORE_NAV.map((r) => (
                  <NavLink
                    key={r.path}
                    to={r.path}
                    role="menuitem"
                    className={({ isActive }) =>
                      `flex items-center gap-2 px-3 py-2 text-sm ${
                        isActive
                          ? 'bg-primary/10 font-semibold text-mf-primary dark:text-primary'
                          : 'text-mf-ink hover:bg-slate-50 dark:text-foreground dark:hover:bg-muted'
                      } ${r.highlight ? 'ring-1 ring-inset ring-sky-400/40' : ''}`
                    }
                    onClick={() => setMoreOpen(false)}
                  >
                    {r.label}
                    {r.highlight ? <Sparkles className="ml-auto h-3.5 w-3.5 shrink-0 text-sky-500" aria-hidden /> : null}
                  </NavLink>
                ))}
              </motion.div>
            ) : null}
          </AnimatePresence>
        </div>
      </div>

      <div className="medflow-no-print flex shrink-0 items-center gap-1">
        <button
          type="button"
          onClick={() => setDark((d) => !d)}
          className="inline-flex h-9 w-9 items-center justify-center rounded-lg text-mf-muted transition-colors hover:bg-slate-100 hover:text-mf-ink dark:text-muted-foreground dark:hover:bg-muted dark:hover:text-foreground"
          aria-label={dark ? 'Switch to light mode' : 'Switch to dark mode'}
        >
          {dark ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />}
        </button>
      </div>
    </header>
  )
}
