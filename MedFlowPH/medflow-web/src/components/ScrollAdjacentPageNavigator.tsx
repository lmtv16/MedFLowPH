import type { ReactNode } from 'react'
import { useEffect, useRef, useState } from 'react'
import { useLocation, useNavigate } from 'react-router-dom'
import { isAdjacentPageNavLocked, markAdjacentNavScrollToTop } from '../utils/scrollNavGuards'

const PAGE_ORDER = [
  '/',
  '/data-understanding',
  '/cleaning',
  '/preprocessing',
  '/pca',
  '/clustering',
  '/evaluation',
  '/interpretation',
  '/comparison',
] as const

type OrderedPath = (typeof PAGE_ORDER)[number]

const PAGE_NAMES: Record<OrderedPath, string> = {
  '/': 'Home',
  '/data-understanding': 'Data Understanding',
  '/cleaning': 'Cleaning',
  '/preprocessing': 'Preprocessing',
  '/pca': 'PCA',
  '/clustering': 'Clustering',
  '/evaluation': 'Evaluation',
  '/interpretation': 'Interpretation',
  '/comparison': 'Comparison',
}

/** Pixels from max scroll to treat as “at document bottom” for overscroll intent. */
const EDGE_BUFFER_PX = 2
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

function maxScrollY(): number {
  const h = scrollDocumentHeight()
  const innerH = window.innerHeight
  return Math.max(0, h - innerH)
}

function isAtDocumentBottom(): boolean {
  const y = window.scrollY || window.pageYOffset
  return y >= maxScrollY() - EDGE_BUFFER_PX
}

/** Browser pathname after navigation (SPA redirects `/data-understanding` → `/eda`). */
function orderedPathToBrowserPath(p: OrderedPath): string {
  return p === '/data-understanding' ? '/eda' : p
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
  const pendingPlacementRef = useRef<'top' | 'bottom' | null>(null)

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
      pendingPlacementRef.current = placement
      cooldownUntilRef.current = Date.now() + COOLDOWN_MS
      setToast({ placement, label })
      navTimerRef.current = window.setTimeout(() => {
        const browserPath = orderedPathToBrowserPath(targetPath)
        markAdjacentNavScrollToTop(browserPath)
        navigate(browserPath)
        setToast(null)
        pendingNavRef.current = false
        pendingPlacementRef.current = null
        navTimerRef.current = null
      }, TOAST_MS)
    }

    /**
     * Next page only when the user tries to scroll *past* the document end
     * (wheel down while already at the bottom). Relying on scroll position
     * alone caused premature navigations while scrolling through long pages.
     */
    function maybeAdvanceFromBottomWheel(ev: WheelEvent) {
      if (isAdjacentPageNavLocked()) return
      if (ev.deltaY <= 0) return
      if (!isAtDocumentBottom()) return

      const canon = normalizeToOrderedPath(location.pathname)
      if (!canon) return

      const idx = PAGE_ORDER.indexOf(canon)
      if (idx < 0 || idx >= PAGE_ORDER.length - 1) return

      const next = PAGE_ORDER[idx + 1]!
      queueNavigation(
        next,
        'bottom',
        <>Next: {PAGE_NAMES[next]} →</>,
      )
    }

    function maybeRetreatFromTopWheel(ev: WheelEvent) {
      if (isAdjacentPageNavLocked()) return
      if (ev.deltaY >= 0) return
      const y = window.scrollY || window.pageYOffset
      if (y > 1) return

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

    /** Cancel a queued edge navigation if the user scrolls away from that edge. */
    function onScrollOrResize() {
      if (!pendingNavRef.current || navTimerRef.current == null) return
      const placement = pendingPlacementRef.current
      if (placement === 'bottom' && !isAtDocumentBottom()) {
        clearNavTimer()
        pendingNavRef.current = false
        pendingPlacementRef.current = null
        setToast(null)
        return
      }
      if (placement === 'top' && (window.scrollY || window.pageYOffset) > 8) {
        clearNavTimer()
        pendingNavRef.current = false
        pendingPlacementRef.current = null
        setToast(null)
      }
    }

    const onWheel = (ev: WheelEvent) => {
      maybeRetreatFromTopWheel(ev)
      maybeAdvanceFromBottomWheel(ev)
    }

    window.addEventListener('scroll', onScrollOrResize, { passive: true })
    window.addEventListener('wheel', onWheel, { passive: true })
    window.addEventListener('resize', onScrollOrResize, { passive: true })

    return () => {
      window.removeEventListener('scroll', onScrollOrResize)
      window.removeEventListener('wheel', onWheel)
      window.removeEventListener('resize', onScrollOrResize)
      clearNavTimer()
      pendingNavRef.current = false
      pendingPlacementRef.current = null
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
      className={`medflow-scroll-adjacent-toast pointer-events-none fixed left-1/2 z-[160] max-w-[min(90vw,20rem)] -translate-x-1/2 rounded-lg border border-slate-200 bg-white px-4 py-2 text-center font-sans text-mf-nav font-medium leading-snug text-mf-ink shadow-lg transition-opacity duration-300 ease-out dark:border-border dark:bg-card dark:text-foreground ${positionClass}`}
    >
      {toast.label}
    </div>
  )
}
