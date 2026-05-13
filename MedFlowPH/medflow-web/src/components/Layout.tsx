import { useEffect, useMemo, useState } from 'react'
import { Outlet, useLocation } from 'react-router-dom'
import { ImageZoomLightboxProvider } from './ImageZoomLightboxContext'
import { ScrollAdjacentPageNavigator } from './ScrollAdjacentPageNavigator'
import { Topbar } from './Topbar'

const ROUTE_META: Record<
  string,
  {
    title: string
    crumbs: string[]
  }
> = {
  '/': { title: 'MedFlow PH', crumbs: ['Home'] },
  '/eda': { title: 'Data Understanding', crumbs: ['Home', 'Data Understanding'] },
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
  const [scrollPct, setScrollPct] = useState(0)

  const meta = useMemo(() => ROUTE_META[location.pathname], [location.pathname])

  useEffect(() => {
    const raw = location.hash.replace(/^#/, '')
    if (!raw) return
    const t = window.setTimeout(() => {
      document.getElementById(raw)?.scrollIntoView({ behavior: 'smooth', block: 'start' })
    }, 120)
    return () => window.clearTimeout(t)
  }, [location.pathname, location.hash])

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
        className="medflow-scroll-progress pointer-events-none fixed left-0 top-0 z-50 h-[3px] bg-[#1D4ED8] transition-[width] duration-100 ease-out"
        style={{ width: `${scrollPct}%` }}
        aria-hidden
      />
      <Topbar title={meta?.title ?? 'MedFlow PH'} breadcrumb={meta?.crumbs ?? ['Home']} />
      <ScrollAdjacentPageNavigator />
      <main className="medflow-main ml-0 min-h-screen max-w-none px-4 py-6 pt-24 md:px-8 md:py-6 md:pt-24">
        <ImageZoomLightboxProvider>
          <Outlet />
        </ImageZoomLightboxProvider>
      </main>
    </div>
  )
}
