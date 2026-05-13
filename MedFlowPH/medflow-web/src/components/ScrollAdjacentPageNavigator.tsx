import type { ReactNode } from 'react'
import { useEffect, useRef, useState } from 'react'
import { useLocation, useNavigate } from 'react-router-dom'

const PAGE_ORDER = [
  '/',
  '/data-understanding',
  '/preprocessing',
  '/clustering',
  '/evaluation',
  '/interpretation',
  '/comparison',
] as const

type OrderedPath = (typeof PAGE_ORDER)[number]

const PAGE_NAMES: Record<OrderedPath, string> = {
  '/': 'Home',
  '/data-understanding': 'Data Understanding',
  '/preprocessing': 'Preprocessing',
  '/clustering': 'Clustering',
  '/evaluation': 'Evaluation',
  '/interpretation': 'Interpretation',
  '/comparison': 'Comparison',
}

const EDGE_BUFFER_PX = 5
/** Cooldown between scroll-chain navigations (ms). */
const COOLDOWN_MS = 800
/** Toast visible before navigating (ms). */
const TOAST_MS = 600

function normalizeToOrderedPath(pathname: string): OrderedPath | null {
  let p = pathname
  if (p.length > 1 && p.endsWith('/')) p = p.slice(0, -1)
  if (p === '/eda') return '/data-understanding'
  return (PAGE_ORDER as readonly string[]).includes(p) ? (p as OrderedPath) : null
}

function scrollDocumentHeight(): number {
  return Math.max(document.documentElement.scrollHeight, document.body.scrollHeight)
}

export function ScrollAdjacentPageNavigator() {
  const navigate = useNavigate()
  const location = useLocation()
  const [toast, setToast] = useState<{
    placement: 'top' | 'bottom'
    label: ReactNode
  } | null>(null)

  const cooldownUntilRef = useRef(0)
  const pendingNavRef = useRef(false)
  const navTimerRef = useRef<number | null>(null)
  const wasAtBottomRef = useRef(false)

  const routeSig = `${location.pathname}${location.search}`

  useEffect(() => {
    function clearNavTimer() {
      if (navTimerRef.current != null) {
        window.clearTimeout(navTimerRef.current)
        navTimerRef.current = null
      }
    }

    function canTrigger() {
      if (pendingNavRef.current) return false
      if (Date.now() < cooldownUntilRef.current) return false
      return true
    }

    function queueNavigation(targetPath: OrderedPath, placement: 'top' | 'bottom', label: ReactNode) {
      if (!canTrigger()) return
      pendingNavRef.current = true
      cooldownUntilRef.current = Date.now() + COOLDOWN_MS
      setToast({ placement, label })
      navTimerRef.current = window.setTimeout(() => {
        navigate(targetPath)
        setToast(null)
        pendingNavRef.current = false
        navTimerRef.current = null
      }, TOAST_MS)
    }

    function syncWasAtBottomFromViewport() {
      const y = window.scrollY || window.pageYOffset
      const innerH = window.innerHeight
      const h = scrollDocumentHeight()
      wasAtBottomRef.current = innerH + y >= h - EDGE_BUFFER_PX
    }

    function maybeAdvanceFromBottom() {
      const canon = normalizeToOrderedPath(location.pathname)
      if (!canon) return

      const idx = PAGE_ORDER.indexOf(canon)
      if (idx < 0 || idx >= PAGE_ORDER.length - 1) return

      const y = window.scrollY || window.pageYOffset
      const innerH = window.innerHeight
      const h = scrollDocumentHeight()
      const atBottom = innerH + y >= h - EDGE_BUFFER_PX

      if (atBottom && !wasAtBottomRef.current) {
        const next = PAGE_ORDER[idx + 1]!
        queueNavigation(
          next,
          'bottom',
          <>Next: {PAGE_NAMES[next]} →</>,
        )
      }
      wasAtBottomRef.current = atBottom
    }

    function maybeRetreatFromTopWheel(ev: WheelEvent) {
      if (ev.deltaY >= 0) return
      if (window.scrollY !== 0) return

      const canon = normalizeToOrderedPath(location.pathname)
      if (!canon) return

      const idx = PAGE_ORDER.indexOf(canon)
      if (idx <= 0) return

      const prev = PAGE_ORDER[idx - 1]!
      queueNavigation(
        prev,
        'top',
        <>← Back: {PAGE_NAMES[prev]}</>,
      )
    }

    syncWasAtBottomFromViewport()

    const onScroll = () => {
      maybeAdvanceFromBottom()
    }

    const onWheel = (ev: WheelEvent) => maybeRetreatFromTopWheel(ev)

    window.addEventListener('scroll', onScroll, { passive: true })
    window.addEventListener('wheel', onWheel, { passive: true })
    window.addEventListener('resize', onScroll, { passive: true })

    return () => {
      window.removeEventListener('scroll', onScroll)
      window.removeEventListener('wheel', onWheel)
      window.removeEventListener('resize', onScroll)
      clearNavTimer()
      pendingNavRef.current = false
      setToast(null)
    }
  }, [navigate, routeSig])

  if (!toast) return null

  const positionClass = toast.placement === 'bottom' ? 'bottom-8' : 'top-28'

  return (
    <div
      role="status"
      aria-live="polite"
      aria-atomic="true"
      className={`medflow-scroll-adjacent-toast pointer-events-none fixed left-1/2 z-[160] max-w-[min(90vw,20rem)] -translate-x-1/2 rounded-lg border border-slate-200 bg-white px-4 py-2 text-center font-sans text-sm font-medium leading-snug text-mf-ink shadow-lg transition-opacity duration-300 ease-out dark:border-border dark:bg-card dark:text-foreground ${positionClass}`}
    >
      {toast.label}
    </div>
  )
}
