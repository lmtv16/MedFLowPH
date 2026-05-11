import { useEffect, useMemo, useState } from 'react'
import { Outlet, useLocation } from 'react-router-dom'
import { Sidebar } from './Sidebar'
import { Topbar } from './Topbar'

function useMinMd() {
  const [isMd, setIsMd] = useState(() =>
    typeof window !== 'undefined' ? window.matchMedia('(min-width: 768px)').matches : false,
  )
  useEffect(() => {
    const mq = window.matchMedia('(min-width: 768px)')
    const sync = () => setIsMd(mq.matches)
    sync()
    mq.addEventListener('change', sync)
    return () => mq.removeEventListener('change', sync)
  }, [])
  return isMd
}

const ROUTE_META: Record<
  string,
  {
    title: string
    crumbs: string[]
  }
> = {
  '/': { title: 'MedFlow PH — Overview', crumbs: ['Home', 'Overview'] },
  '/eda': { title: 'Exploratory Data Analysis', crumbs: ['Home', 'Data Cleaning'] },
  '/preprocessing': {
    title: 'Preprocessing Pipeline',
    crumbs: ['Home', 'Preprocessing'],
  },
  '/clustering': { title: 'Clustering Workflow', crumbs: ['Home', 'Clustering'] },
  '/evaluation': {
    title: 'Model Evaluation',
    crumbs: ['Home', 'Evaluation'],
  },
  '/interpretation': {
    title: 'Cluster Interpretation',
    crumbs: ['Home', 'Interpretation'],
  },
  '/comparison': {
    title: 'K‑Means vs DBSCAN — Model Comparison',
    crumbs: ['Home', 'Comparison'],
  },
}

export function Layout() {
  const location = useLocation()
  const isMd = useMinMd()
  const [mobileNavOpen, setMobileNavOpen] = useState(false)
  const [sidebarExpanded, setSidebarExpanded] = useState(() => {
    if (typeof window === 'undefined') return true
    return localStorage.getItem('medflow-sidebar-expanded') !== 'false'
  })
  const [scrollPct, setScrollPct] = useState(0)

  const meta = useMemo(() => ROUTE_META[location.pathname], [location.pathname])

  useEffect(() => {
    localStorage.setItem('medflow-sidebar-expanded', String(sidebarExpanded))
  }, [sidebarExpanded])

  const sidebarVisualOpen = isMd ? sidebarExpanded : mobileNavOpen

  function toggleAppSidebar() {
    if (isMd) setSidebarExpanded((e) => !e)
    else setMobileNavOpen((o) => !o)
  }

  useEffect(() => {
    if (isMd) setMobileNavOpen(false)
  }, [isMd])

  useEffect(() => {
    const update = () => {
      const el = document.documentElement
      const scrollTop = el.scrollTop || document.body.scrollTop
      const denom = el.scrollHeight - el.clientHeight
      setScrollPct(denom > 0 ? (scrollTop / denom) * 100 : 0)
    }
    update()
    window.addEventListener('scroll', update, { passive: true })
    window.addEventListener('resize', update, { passive: true })
    return () => {
      window.removeEventListener('scroll', update)
      window.removeEventListener('resize', update)
    }
  }, [location.pathname])

  return (
    <div className="min-h-screen bg-mf-bg text-mf-ink dark:bg-background dark:text-foreground">
      <div
        className={`medflow-scroll-progress pointer-events-none fixed left-0 top-0 z-50 h-[3px] bg-[#1D4ED8] transition-[width] duration-100 ease-out ${
          sidebarExpanded ? 'md:left-60' : 'md:left-0'
        }`}
        style={{ width: `${scrollPct}%` }}
        aria-hidden
      />
      <Sidebar
        expanded={sidebarExpanded}
        mobileOpen={mobileNavOpen}
        onClose={() => setMobileNavOpen(false)}
      />
      <Topbar
        title={meta?.title ?? 'MedFlow PH'}
        breadcrumb={meta?.crumbs ?? ['Home']}
        appNavVisible={sidebarVisualOpen}
        sidebarDockExpanded={sidebarExpanded}
        onSidebarToggle={toggleAppSidebar}
      />
      <main
        className={`medflow-main ml-0 min-h-screen max-w-none px-4 py-6 pt-[4.75rem] md:px-8 md:py-6 md:pt-[4.5rem] ${
          sidebarExpanded ? 'md:ml-60' : 'md:ml-0'
        }`}
      >
        <Outlet />
      </main>
    </div>
  )
}
