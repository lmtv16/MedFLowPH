import { useEffect, useLayoutEffect, useMemo, useState } from 'react'
import { Outlet, useLocation } from 'react-router-dom'
import {
  clearAdjacentNavScrollToTopMarker,
  consumeAdjacentNavScrollToTop,
  lockAdjacentPageNavForProgrammaticScroll,
} from '../utils/scrollNavGuards'
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
  '/eda': { title: 'Data Preparation', crumbs: ['Home', 'Data Preparation'] },
  '/cleaning': { title: 'Data Cleaning', crumbs: ['Home', 'Cleaning'] },
  '/preprocessing': {
    title: 'Preprocessing Pipeline',
    crumbs: ['Home', 'Preprocessing'],
  },
  '/pca': { title: 'Principal Component Analysis', crumbs: ['Home', 'PCA'] },
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

  /**
   * After scroll-adjacent `navigate()`, the browser/RR can restore the previous
   * scroll depth so the new page opens at the bottom. Consume a one-shot marker
   * and jump to top (hash URLs skip this so hash scrolling still runs).
   */
  useLayoutEffect(() => {
    const rawHash = location.hash.replace(/^#/, '')
    if (rawHash) {
      clearAdjacentNavScrollToTopMarker()
      return
    }
    if (!consumeAdjacentNavScrollToTop(location.pathname)) return
    lockAdjacentPageNavForProgrammaticScroll(400)
    window.scrollTo({ top: 0, left: 0, behavior: 'auto' })
    requestAnimationFrame(() => {
      window.scrollTo({ top: 0, left: 0, behavior: 'auto' })
    })
  }, [location.pathname, location.search, location.hash])

  useEffect(() => {
    const raw = location.hash.replace(/^#/, '')
    if (!raw) return
    lockAdjacentPageNavForProgrammaticScroll()
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
    <div className="min-h-screen w-full min-w-0 bg-mf-bg text-mf-ink">
      <div
        className="medflow-scroll-progress pointer-events-none fixed left-0 top-0 z-[1001] h-[3px] bg-primary transition-[width] duration-100 ease-out"
        style={{ width: `${scrollPct}%` }}
        aria-hidden
      />
      <Topbar title={meta?.title ?? 'MedFlow PH'} breadcrumb={meta?.crumbs ?? ['Home']} />
      <ScrollAdjacentPageNavigator />
      <main className="medflow-main ml-0 min-h-screen max-w-none min-w-0 px-3 py-6 pt-24 sm:px-4 md:px-8 md:py-6 md:pt-24">
        <ImageZoomLightboxProvider>
          <Outlet />
        </ImageZoomLightboxProvider>
      </main>
    </div>
  )
}
