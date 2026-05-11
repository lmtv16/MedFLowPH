import { AnimatePresence, motion } from 'framer-motion'
import { useEffect, useRef, useState } from 'react'
import { ChevronDown, Moon, PanelLeft, PanelLeftClose, Sun } from 'lucide-react'
import { NavLink, useLocation } from 'react-router-dom'

const NAV_ROUTES = [
  { to: '/', label: 'Home' },
  { to: '/eda', label: 'EDA' },
  { to: '/preprocessing', label: 'Preprocessing' },
  { to: '/clustering', label: 'Clustering' },
  { to: '/evaluation', label: 'Evaluation' },
  { to: '/interpretation', label: 'Interpretation' },
  { to: '/comparison', label: 'Comparison' },
] as const

const LANDING_SCROLL_IDS = [
  { id: 'background', label: 'Background' },
  { id: 'objectives', label: 'Objectives' },
  { id: 'data-collection', label: 'Data' },
] as const

const MOBILE_MORE_ROUTES = NAV_ROUTES.slice(4)

type TopbarProps = {
  title: string
  breadcrumb: string[]
  /** Whether the app sidebar is currently visible (overlay on mobile, rail on desktop). */
  appNavVisible: boolean
  /** Desktop: whether layout reserves space for the 240px sidebar rail. */
  sidebarDockExpanded: boolean
  onSidebarToggle: () => void
}

function scrollToId(id: string) {
  document.getElementById(id)?.scrollIntoView({ behavior: 'smooth', block: 'start' })
}

function navLinkClass(isActive: boolean) {
  return `whitespace-nowrap rounded-lg px-2.5 py-1.5 text-sm transition-colors ${
    isActive
      ? 'bg-primary/10 font-semibold text-mf-primary dark:text-primary'
      : 'text-mf-muted hover:bg-slate-100 hover:text-mf-ink dark:text-muted-foreground dark:hover:bg-muted dark:hover:text-foreground'
  }`
}

export function Topbar({
  title,
  breadcrumb,
  appNavVisible,
  sidebarDockExpanded,
  onSidebarToggle,
}: TopbarProps) {
  const location = useLocation()
  const [moreOpen, setMoreOpen] = useState(false)
  const moreRef = useRef<HTMLDivElement>(null)

  const [dark, setDark] = useState(() => localStorage.getItem('theme') === 'dark')

  useEffect(() => {
    if (dark) document.documentElement.classList.add('dark')
    else document.documentElement.classList.remove('dark')
    localStorage.setItem('theme', dark ? 'dark' : 'light')
  }, [dark])

  useEffect(() => {
    setMoreOpen(false)
  }, [location.pathname])

  useEffect(() => {
    if (!moreOpen) return
    const onDoc = (e: MouseEvent) => {
      if (moreRef.current && !moreRef.current.contains(e.target as Node)) setMoreOpen(false)
    }
    document.addEventListener('mousedown', onDoc)
    return () => document.removeEventListener('mousedown', onDoc)
  }, [moreOpen])

  return (
    <header
      className={`medflow-topbar fixed top-[3px] left-0 right-0 z-40 flex h-16 items-center gap-2 border-b border-slate-200 bg-white/95 px-2 backdrop-blur dark:border-border dark:bg-card/95 md:gap-3 md:px-4 lg:px-6 ${
        sidebarDockExpanded ? 'md:left-60' : 'md:left-0'
      }`}
    >
      <div className="flex min-w-0 flex-1 flex-col">
        <nav className="hidden text-xs text-mf-muted dark:text-muted-foreground sm:block">
          {breadcrumb.map((crumb, i) => (
            <span key={`${crumb}-${i}`}>
              {i > 0 ? <span className="mx-1 text-slate-300 dark:text-border">/</span> : null}
              <span>{crumb}</span>
            </span>
          ))}
        </nav>
        <h1 className="truncate text-base font-semibold text-mf-ink dark:text-foreground md:text-lg">
          {title}
        </h1>
      </div>

      {/* Desktop: all routes */}
      <nav
        className="medflow-no-print hidden shrink-0 items-center gap-0.5 lg:flex"
        aria-label="Section navigation"
      >
        {NAV_ROUTES.map((r) => (
          <NavLink key={r.to} to={r.to} end={r.to === '/'} className={({ isActive }) => navLinkClass(isActive)}>
            {r.label}
          </NavLink>
        ))}
        {location.pathname === '/' ? (
          <>
            <span
              className="mx-1 hidden h-5 w-px shrink-0 bg-slate-200 dark:bg-border sm:block"
              aria-hidden
            />
            <div className="flex items-center gap-0.5">
              {LANDING_SCROLL_IDS.map((s) => (
                <button
                  key={s.id}
                  type="button"
                  onClick={() => scrollToId(s.id)}
                  className="whitespace-nowrap rounded-lg px-2 py-1 text-xs text-muted-foreground transition-colors hover:bg-muted hover:text-foreground dark:text-muted-foreground"
                >
                  {s.label}
                </button>
              ))}
            </div>
          </>
        ) : null}
      </nav>

      {/* Small screens: first 4 + More */}
      <div className="medflow-no-print flex shrink-0 items-center gap-0.5 lg:hidden">
        {NAV_ROUTES.slice(0, 4).map((r) => (
          <NavLink key={r.to} to={r.to} end={r.to === '/'} className={({ isActive }) => navLinkClass(isActive)}>
            {r.label}
          </NavLink>
        ))}
        <div className="relative" ref={moreRef}>
          <button
            type="button"
            onClick={() => setMoreOpen((o) => !o)}
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
                {MOBILE_MORE_ROUTES.map((r) => (
                  <NavLink
                    key={r.to}
                    to={r.to}
                    role="menuitem"
                    className={({ isActive }) =>
                      `block px-3 py-2 text-sm ${
                        isActive
                          ? 'bg-primary/10 font-semibold text-mf-primary dark:text-primary'
                          : 'text-mf-ink hover:bg-slate-50 dark:text-foreground dark:hover:bg-muted'
                      }`
                    }
                    onClick={() => setMoreOpen(false)}
                  >
                    {r.label}
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
          onClick={onSidebarToggle}
          className="inline-flex h-9 w-9 items-center justify-center rounded-lg text-mf-muted transition-colors hover:bg-slate-100 hover:text-mf-ink dark:text-muted-foreground dark:hover:bg-muted dark:hover:text-foreground"
          aria-label={appNavVisible ? 'Hide app navigation' : 'Show app navigation'}
          aria-pressed={appNavVisible}
        >
          {appNavVisible ? <PanelLeftClose className="h-4 w-4" /> : <PanelLeft className="h-4 w-4" />}
        </button>

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
