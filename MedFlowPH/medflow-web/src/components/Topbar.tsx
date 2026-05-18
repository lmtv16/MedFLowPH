import { AnimatePresence, motion } from 'framer-motion'
import { ChevronDown, FlaskConical, Menu, Moon, Sparkles, Sun, X } from 'lucide-react'
import { useEffect, useMemo, useRef, useState } from 'react'
import { NavLink, useLocation, useNavigate } from 'react-router-dom'

/**
 * Top-level navigation model.
 *
 * Groups (Data Preparation, Modeling, Results) are dropdowns containing page links.
 * Direct links (Home, Model Comparison) navigate immediately.
 *
 * Important: every existing route remains reachable; the structure is reorganized only.
 */
type NavLeaf = { path: string; label: string }
type NavGroupItem = {
  kind: 'group'
  key: string
  label: string
  matchPaths: readonly string[]
  children: readonly NavLeaf[]
}
type NavLinkItem = {
  kind: 'link'
  key: string
  path: string
  label: string
  highlight?: boolean
}
type NavItem = NavLinkItem | NavGroupItem

const NAV_ITEMS: readonly NavItem[] = [
  { kind: 'link', key: 'home', path: '/', label: 'Home' },
  {
    kind: 'group',
    key: 'data-prep',
    label: 'Data Preparation',
    matchPaths: ['/eda', '/data-understanding', '/cleaning', '/preprocessing'],
    children: [
      { path: '/eda', label: 'Data Understanding' },
      { path: '/cleaning', label: 'Cleaning' },
      { path: '/preprocessing', label: 'Preprocessing' },
    ],
  },
  {
    kind: 'group',
    key: 'modeling',
    label: 'Modeling',
    matchPaths: ['/pca', '/clustering', '/evaluation'],
    children: [
      { path: '/pca', label: 'PCA' },
      { path: '/clustering', label: 'Clustering' },
      { path: '/evaluation', label: 'Evaluation' },
    ],
  },
  {
    kind: 'group',
    key: 'results',
    label: 'Results',
    matchPaths: ['/interpretation'],
    children: [
      { path: '/interpretation', label: 'Interpretation' },
      // /clustering is also reachable under Modeling; surfaced here with its
      // sidebar-route label ("Cluster Segmentation") so the segmentation outputs
      // remain discoverable from the Results group.
      { path: '/clustering', label: 'Cluster Segmentation' },
      // In-page anchor on Home (preserves the existing #recommendations section).
      { path: '/#recommendations', label: 'Recommendations' },
    ],
  },
  {
    kind: 'link',
    key: 'comparison',
    path: '/comparison',
    label: 'Model Comparison',
    highlight: true,
  },
]

type TopbarProps = {
  title: string
  breadcrumb: string[]
}

/** Tailwind class set for the pill-shaped top-level nav items (desktop). */
function topNavPill(active: boolean) {
  return [
    'inline-flex shrink-0 items-center gap-1.5 whitespace-nowrap rounded-full px-3.5 py-1.5 text-mf-nav',
    'transition-[color,background-color,box-shadow] duration-200 ease-out motion-reduce:transition-none',
    'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/40 focus-visible:ring-offset-1 focus-visible:ring-offset-background',
    active
      ? 'bg-primary/10 font-semibold text-mf-primary shadow-sm ring-1 ring-primary/15 dark:bg-primary/20 dark:text-primary dark:ring-primary/30'
      : 'text-muted-foreground hover:bg-muted hover:text-foreground',
  ].join(' ')
}

/** Split a "/path#hash" string used by leaf links into pathname + hash parts. */
function splitPathHash(p: string): { pathname: string; hash?: string } {
  const [pathname, hash] = p.split('#')
  return { pathname: pathname || '/', hash: hash ? `#${hash}` : undefined }
}

/** Group is active when current pathname matches any of its registered paths. */
function isGroupActive(group: NavGroupItem, pathname: string) {
  return group.matchPaths.some((p) => pathname === p)
}

function isNavTargetActive(
  loc: { pathname: string; hash: string },
  targetPath: string,
): boolean {
  const { pathname, hash } = splitPathHash(targetPath)
  return loc.pathname === pathname && (!hash || loc.hash === hash)
}

const desktopMenuItemClass = (active: boolean) => {
  const base =
    'flex w-full items-center gap-2 rounded-md border-l-2 px-3 py-2 text-left text-mf-nav transition-[color,background-color,border-color] duration-200 ease-out motion-reduce:transition-none focus-visible:outline-none'
  return active
    ? `${base} border-primary bg-[color:var(--dropdown-item-active-bg)] font-semibold text-primary`
    : `${base} border-transparent text-[color:var(--dropdown-text)] hover:border-primary/40 hover:bg-[color:var(--dropdown-item-hover)] hover:text-primary focus-visible:border-primary/40 focus-visible:bg-[color:var(--dropdown-item-hover)] focus-visible:text-primary`
}

/**
 * Desktop dropdown for a nav group. Renders a button trigger followed by a
 * floating panel with the child page links. Closes on outside click, Escape,
 * route change, or selection.
 */
function DesktopGroupDropdown({
  item,
  isOpen,
  onOpenChange,
}: {
  item: NavGroupItem
  isOpen: boolean
  onOpenChange: (open: boolean) => void
}) {
  const navigate = useNavigate()
  const location = useLocation()
  const rootRef = useRef<HTMLDivElement>(null)
  const buttonRef = useRef<HTMLButtonElement>(null)

  const active = isGroupActive(item, location.pathname)

  useEffect(() => {
    if (!isOpen) return
    function onDocMouseDown(e: MouseEvent) {
      if (!rootRef.current?.contains(e.target as Node)) onOpenChange(false)
    }
    function onKeyDown(e: KeyboardEvent) {
      if (e.key === 'Escape') {
        onOpenChange(false)
        buttonRef.current?.focus()
      }
    }
    document.addEventListener('mousedown', onDocMouseDown)
    document.addEventListener('keydown', onKeyDown)
    return () => {
      document.removeEventListener('mousedown', onDocMouseDown)
      document.removeEventListener('keydown', onKeyDown)
    }
  }, [isOpen, onOpenChange])

  function go(target: { path: string }) {
    onOpenChange(false)
    const { pathname, hash } = splitPathHash(target.path)
    navigate({ pathname, hash })
  }

  /** Double-click the group pill → first page in the group (e.g. Data Preparation → /eda). */
  function goToGroupDefault() {
    const first = item.children[0]
    if (!first) return
    onOpenChange(false)
    const { pathname, hash } = splitPathHash(first.path)
    const hashNorm = hash ?? ''
    const locHash = location.hash || ''
    if (location.pathname === pathname && locHash === hashNorm) {
      window.scrollTo({ top: 0, behavior: 'smooth' })
      return
    }
    navigate({ pathname, hash })
  }

  const menuId = `topnav-${item.key}-menu`

  return (
    <div className="relative" ref={rootRef}>
      <button
        ref={buttonRef}
        type="button"
        onClick={(e) => {
          if (e.detail >= 2) return
          onOpenChange(!isOpen)
        }}
        onDoubleClick={(e) => {
          e.preventDefault()
          goToGroupDefault()
        }}
        className={topNavPill(active)}
        aria-haspopup="menu"
        aria-expanded={isOpen}
        aria-controls={menuId}
      >
        <span>{item.label}</span>
        <ChevronDown
          aria-hidden
          className={`h-3.5 w-3.5 shrink-0 transition-transform duration-200 ease-out motion-reduce:transition-none ${
            isOpen ? 'rotate-180' : ''
          }`}
        />
      </button>
      <AnimatePresence>
        {isOpen ? (
          <motion.div
            id={menuId}
            role="menu"
            aria-label={`${item.label} menu`}
            initial={{ opacity: 0, y: -6 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -6 }}
            transition={{ duration: 0.16 }}
            className="absolute left-0 top-full z-50 mt-2 max-w-[min(20rem,calc(100vw-1.5rem))] min-w-[13rem] rounded-xl border border-[color:var(--dropdown-border)] bg-[color:var(--dropdown-bg)] py-1.5 text-[color:var(--dropdown-text)] shadow-[var(--dropdown-shadow)] backdrop-blur-md ring-1 ring-[color:var(--dropdown-ring)]"
          >
            {item.children.map((leaf) => {
              const leafActive = isNavTargetActive(location, leaf.path)
              return (
                <button
                  key={`${leaf.path}-${leaf.label}`}
                  type="button"
                  role="menuitem"
                  onClick={() => go(leaf)}
                  className={desktopMenuItemClass(leafActive)}
                >
                  {leaf.label}
                </button>
              )
            })}
          </motion.div>
        ) : null}
      </AnimatePresence>
    </div>
  )
}

/** Always-visible compact brand wordmark. Clicking returns to Home. */
function BrandLogo() {
  return (
    <NavLink
      to="/"
      end
      className="group inline-flex shrink-0 items-center gap-2 rounded-lg px-1.5 py-1 text-foreground transition-colors duration-200 ease-out hover:text-primary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/40 motion-reduce:transition-none"
      aria-label="MedFlow PH — go to home"
    >
      <span className="inline-flex h-8 w-8 items-center justify-center rounded-lg bg-primary/10 text-primary shadow-sm ring-1 ring-primary/10 transition-[box-shadow,background-color] duration-200 ease-out group-hover:bg-primary/[0.14] group-hover:ring-primary/20">
        <FlaskConical className="h-4 w-4" aria-hidden />
      </span>
      <span
        className="whitespace-nowrap text-mf-card-title font-bold leading-none md:text-[1.125rem]"
        style={{ fontFamily: "'Plus Jakarta Sans', sans-serif" }}
      >
        MedFlow <span className="text-primary">PH</span>
      </span>
    </NavLink>
  )
}

/**
 * Slim, secondary row under the main navbar that surfaces the breadcrumb and
 * the current page title. Hidden on the home page where the title is the
 * brand name already shown in the logo.
 */
function PageContextBar({
  title,
  breadcrumb,
  isRoot,
}: {
  title: string
  breadcrumb: string[]
  isRoot: boolean
}) {
  if (isRoot) return null
  return (
    <div className="medflow-no-print border-t border-[color:var(--context-bar-border)] bg-[color:var(--context-bar-bg)] px-3 py-1.5 backdrop-blur-sm md:px-5">
      <div className="flex min-w-0 flex-wrap items-baseline gap-x-2 gap-y-0.5">
        <nav
          className="min-w-0 text-mf-caption text-muted-foreground"
          aria-label="Breadcrumb"
        >
          {breadcrumb.map((crumb, i) => (
            <span key={`${crumb}-${i}`}>
              {i > 0 ? (
                <span className="mx-1 text-muted-foreground/45">/</span>
              ) : null}
              <span>{crumb}</span>
            </span>
          ))}
        </nav>
        <h1 className="min-w-0 break-words text-mf-nav font-semibold text-foreground md:text-mf-card-title">
          {title}
        </h1>
      </div>
    </div>
  )
}

export function Topbar({ title, breadcrumb }: TopbarProps) {
  const location = useLocation()
  const isRoot = location.pathname === '/'

  const [openGroup, setOpenGroup] = useState<string | null>(null)
  const [mobileOpen, setMobileOpen] = useState(false)
  const [mobileExpanded, setMobileExpanded] = useState<string | null>(null)

  const [dark, setDark] = useState(() => {
    if (typeof window === 'undefined') return false
    try {
      if (localStorage.getItem('theme') === 'dark') return true
    } catch {
      /* private mode / blocked storage */
    }
    return document.documentElement.classList.contains('dark')
  })

  useEffect(() => {
    if (dark) document.documentElement.classList.add('dark')
    else document.documentElement.classList.remove('dark')
    localStorage.setItem('theme', dark ? 'dark' : 'light')
  }, [dark])

  /** Reset any open menus whenever the route changes (covers in-app links). */
  useEffect(() => {
    setOpenGroup(null)
    setMobileOpen(false)
    setMobileExpanded(null)
  }, [location.pathname, location.hash])

  /** Lock body scroll while the mobile drawer is open. */
  useEffect(() => {
    if (!mobileOpen) return
    const prev = document.body.style.overflow
    document.body.style.overflow = 'hidden'
    return () => {
      document.body.style.overflow = prev
    }
  }, [mobileOpen])

  /** Escape closes the mobile drawer at the top level. */
  useEffect(() => {
    if (!mobileOpen) return
    function onKey(e: KeyboardEvent) {
      if (e.key === 'Escape') setMobileOpen(false)
    }
    document.addEventListener('keydown', onKey)
    return () => document.removeEventListener('keydown', onKey)
  }, [mobileOpen])

  const navigate = useNavigate()

  const groupOpenState = useMemo(
    () => (key: string) => openGroup === key,
    [openGroup],
  )

  function setGroupOpen(key: string, open: boolean) {
    setOpenGroup((curr) => {
      if (open) return key
      return curr === key ? null : curr
    })
  }

  function handleMobileLeaf(target: { path: string }) {
    setMobileOpen(false)
    setMobileExpanded(null)
    const { pathname, hash } = splitPathHash(target.path)
    navigate({ pathname, hash })
  }

  return (
    <header className="medflow-topbar fixed left-0 right-0 top-[3px] z-[1000] isolate border-b border-[color:var(--nav-border)] bg-[color:var(--nav-bg)] shadow-[var(--nav-shadow)] backdrop-blur-md">
      {/* Primary navbar row */}
      <div className="relative flex h-14 min-w-0 items-center gap-2 px-3 md:gap-3 md:px-5">
        <BrandLogo />

        {/* Desktop nav */}
        <nav
          className="medflow-no-print ml-2 hidden flex-1 items-center justify-center gap-1 lg:flex xl:gap-2"
          aria-label="Main navigation"
        >
          {NAV_ITEMS.map((item) => {
            if (item.kind === 'link') {
              return (
                <NavLink
                  key={item.key}
                  to={item.path}
                  end={item.path === '/'}
                  className={({ isActive }) =>
                    `${topNavPill(isActive)} ${
                      item.highlight ? 'ring-1 ring-sky-400/35 shadow-sm' : ''
                    }`
                  }
                  onClick={(e) => {
                    if (location.pathname === item.path && !location.hash) {
                      e.preventDefault()
                      window.scrollTo({ top: 0, behavior: 'smooth' })
                    }
                  }}
                >
                  <span>{item.label}</span>
                  {item.highlight ? (
                    <Sparkles className="h-3.5 w-3.5 shrink-0 text-sky-500" aria-hidden />
                  ) : null}
                </NavLink>
              )
            }
            return (
              <DesktopGroupDropdown
                key={item.key}
                item={item}
                isOpen={groupOpenState(item.key)}
                onOpenChange={(open) => setGroupOpen(item.key, open)}
              />
            )
          })}
        </nav>

        {/* Right side controls */}
        <div className="medflow-no-print ml-auto flex shrink-0 items-center gap-1">
          <button
            type="button"
            onClick={() => setDark((d) => !d)}
            className="inline-flex h-9 w-9 items-center justify-center rounded-lg text-muted-foreground transition-[color,background-color] duration-200 ease-out hover:bg-muted hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/40 motion-reduce:transition-none"
            aria-label={dark ? 'Switch to light mode' : 'Switch to dark mode'}
          >
            {dark ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />}
          </button>

          <button
            type="button"
            onClick={() => setMobileOpen((o) => !o)}
            className="inline-flex h-10 w-10 items-center justify-center rounded-lg text-muted-foreground transition-[color,background-color] duration-200 ease-out hover:bg-muted hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/40 motion-reduce:transition-none lg:hidden"
            aria-label={mobileOpen ? 'Close menu' : 'Open menu'}
            aria-expanded={mobileOpen}
            aria-controls="medflow-mobile-menu"
          >
            {mobileOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
          </button>
        </div>
      </div>

      {/* Secondary breadcrumb / page title row (hidden on Home) */}
      <PageContextBar title={title} breadcrumb={breadcrumb} isRoot={isRoot} />

      {/* Mobile drawer (overlay + panel anchored to bottom of header) */}
      <AnimatePresence>
        {mobileOpen ? (
          <>
            <motion.div
              key="overlay"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.18 }}
              className="medflow-no-print absolute inset-x-0 top-full -z-10 min-h-[100vh] min-h-[100dvh] bg-[color:var(--mobile-overlay)] backdrop-blur-[2px] lg:hidden"
              onClick={() => setMobileOpen(false)}
              aria-hidden
            />
            <motion.div
              key="panel"
              id="medflow-mobile-menu"
              initial={{ opacity: 0, y: -8 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -8 }}
              transition={{ duration: 0.2 }}
              className="medflow-no-print pointer-events-auto absolute inset-x-0 top-full z-[45] max-h-[calc(100vh-3.5rem)] max-h-[calc(100dvh-3.5rem)] overflow-y-auto overscroll-contain border-b border-[color:var(--nav-border)] bg-[color:var(--dropdown-bg)] text-[color:var(--dropdown-text)] shadow-[var(--mobile-panel-shadow)] backdrop-blur-md [-webkit-overflow-scrolling:touch] lg:hidden"
              role="dialog"
              aria-modal="true"
              aria-label="Site navigation"
            >
              <nav className="flex flex-col gap-1 px-3 py-3.5" aria-label="Mobile navigation">
                {NAV_ITEMS.map((item) => {
                  if (item.kind === 'link') {
                    return (
                      <NavLink
                        key={`m-${item.key}`}
                        to={item.path}
                        end={item.path === '/'}
                        onClick={() => setMobileOpen(false)}
                        className={({ isActive }) =>
                          `flex min-h-[44px] items-center justify-between gap-2 rounded-lg px-3 py-2.5 text-base transition-[color,background-color,box-shadow] duration-200 ease-out motion-reduce:transition-none focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/40 ${
                            isActive
                              ? 'bg-primary/10 font-semibold text-mf-primary shadow-sm ring-1 ring-primary/12 dark:bg-primary/20 dark:text-primary dark:ring-primary/25'
                              : 'text-[color:var(--dropdown-text)] hover:bg-[color:var(--dropdown-item-hover)]'
                          } ${item.highlight ? 'ring-1 ring-sky-400/35' : ''}`
                        }
                      >
                        <span>{item.label}</span>
                        {item.highlight ? (
                          <Sparkles className="h-4 w-4 shrink-0 text-sky-500" aria-hidden />
                        ) : null}
                      </NavLink>
                    )
                  }

                  const expanded = mobileExpanded === item.key
                  const groupActive = isGroupActive(item, location.pathname)
                  const panelId = `m-group-${item.key}`
                  return (
                    <div key={`m-${item.key}`} className="flex flex-col">
                      <button
                        type="button"
                        onClick={(e) => {
                          if (e.detail >= 2) return
                          setMobileExpanded((curr) => (curr === item.key ? null : item.key))
                        }}
                        onDoubleClick={(e) => {
                          e.preventDefault()
                          const first = item.children[0]
                          if (first) handleMobileLeaf(first)
                        }}
                        className={`flex min-h-[44px] items-center justify-between gap-2 rounded-lg px-3 py-2.5 text-base transition-[color,background-color,box-shadow] duration-200 ease-out motion-reduce:transition-none focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/40 ${
                          groupActive
                            ? 'bg-primary/10 font-semibold text-mf-primary shadow-sm ring-1 ring-primary/12 dark:bg-primary/20 dark:text-primary dark:ring-primary/25'
                            : 'text-[color:var(--dropdown-text)] hover:bg-[color:var(--dropdown-item-hover)]'
                        }`}
                        aria-expanded={expanded}
                        aria-controls={panelId}
                      >
                        <span>{item.label}</span>
                        <ChevronDown
                          aria-hidden
                          className={`h-4 w-4 shrink-0 transition-transform duration-200 ease-out motion-reduce:transition-none ${
                            expanded ? 'rotate-180' : ''
                          }`}
                        />
                      </button>
                      <AnimatePresence initial={false}>
                        {expanded ? (
                          <motion.div
                            id={panelId}
                            key={panelId}
                            initial={{ height: 0, opacity: 0 }}
                            animate={{ height: 'auto', opacity: 1 }}
                            exit={{ height: 0, opacity: 0 }}
                            transition={{ duration: 0.2 }}
                            className="overflow-hidden"
                          >
                            <div
                              className="my-1 ml-3 flex flex-col gap-0.5 border-l border-[color:var(--dropdown-border)] pl-3"
                              role="group"
                              aria-label={`${item.label} pages`}
                            >
                              {item.children.map((leaf) => {
                                const leafActive = isNavTargetActive(location, leaf.path)
                                return (
                                  <button
                                    key={`m-${item.key}-${leaf.path}-${leaf.label}`}
                                    type="button"
                                    onClick={() => handleMobileLeaf(leaf)}
                                    className={`flex min-h-[44px] items-center rounded-lg px-3 py-2 text-left text-mf-nav transition-[color,background-color,box-shadow] duration-200 ease-out motion-reduce:transition-none focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/40 ${
                                      leafActive
                                        ? 'bg-primary/10 font-semibold text-mf-primary shadow-sm ring-1 ring-primary/10 dark:bg-primary/20 dark:text-primary dark:ring-primary/22'
                                        : 'text-[color:var(--dropdown-text)] hover:bg-[color:var(--dropdown-item-hover)]'
                                    }`}
                                  >
                                    {leaf.label}
                                  </button>
                                )
                              })}
                            </div>
                          </motion.div>
                        ) : null}
                      </AnimatePresence>
                    </div>
                  )
                })}
              </nav>
            </motion.div>
          </>
        ) : null}
      </AnimatePresence>
    </header>
  )
}
