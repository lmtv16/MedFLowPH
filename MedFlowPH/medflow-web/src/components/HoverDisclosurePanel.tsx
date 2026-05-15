import { ChevronDown } from 'lucide-react'
import { useCallback, useRef, useState, type PointerEvent, type ReactNode } from 'react'

type RevealTrigger = 'hover' | 'hold'

type HoverDisclosurePanelProps = {
  label: string
  expandAria: string
  collapseAria: string
  children: ReactNode
  /** When true, panel starts expanded and stays open until collapsed. */
  defaultPinned?: boolean
  className?: string
  /** How the panel opens before pinning. Default: delayed hover. */
  revealTrigger?: RevealTrigger
  /** Ms pointer must stay down before hold-reveal opens (hold mode only). */
  holdDurationMs?: number
  /** Ms hover must persist before reveal (hover mode only). */
  hoverDelayMs?: number
}

export function HoverDisclosurePanel({
  label,
  expandAria,
  collapseAria,
  children,
  defaultPinned = false,
  className = '',
  revealTrigger = 'hover',
  holdDurationMs = 450,
  hoverDelayMs = 320,
}: HoverDisclosurePanelProps) {
  const [pinned, setPinned] = useState(defaultPinned)
  const [held, setHeld] = useState(false)
  const [hoverRevealed, setHoverRevealed] = useState(false)
  const [hoverRevealBlocked, setHoverRevealBlocked] = useState(false)

  const holdTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  const hoverTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  const expanded = pinned || held || (revealTrigger === 'hover' && hoverRevealed && !hoverRevealBlocked)

  const clearHoldTimer = useCallback(() => {
    if (holdTimerRef.current) {
      clearTimeout(holdTimerRef.current)
      holdTimerRef.current = null
    }
  }, [])

  const clearHoverTimer = useCallback(() => {
    if (hoverTimerRef.current) {
      clearTimeout(hoverTimerRef.current)
      hoverTimerRef.current = null
    }
  }, [])

  const scheduleHoverReveal = useCallback(() => {
    if (revealTrigger !== 'hover' || hoverRevealBlocked) return
    clearHoverTimer()
    hoverTimerRef.current = setTimeout(() => setHoverRevealed(true), hoverDelayMs)
  }, [clearHoverTimer, hoverDelayMs, hoverRevealBlocked, revealTrigger])

  const cancelHoverReveal = useCallback(() => {
    clearHoverTimer()
    setHoverRevealed(false)
  }, [clearHoverTimer])

  const onPointerDown = (e: PointerEvent<HTMLButtonElement>) => {
    if (revealTrigger !== 'hold') return
    clearHoldTimer()
    e.currentTarget.setPointerCapture(e.pointerId)
    holdTimerRef.current = setTimeout(() => setHeld(true), holdDurationMs)
  }

  const onPointerUp = (e: React.PointerEvent<HTMLButtonElement>) => {
    if (revealTrigger !== 'hold') return
    if (e.currentTarget.hasPointerCapture(e.pointerId)) {
      e.currentTarget.releasePointerCapture(e.pointerId)
    }
    clearHoldTimer()
    if (!pinned) setHeld(false)
  }

  const chevronRotated = expanded

  return (
    <div
      className={`group rounded-lg border border-border bg-card/90 shadow-sm transition-[border-color,box-shadow] duration-200 hover:border-primary/40 hover:shadow-md ${className}`.trim()}
      onMouseEnter={scheduleHoverReveal}
      onMouseLeave={() => {
        setHoverRevealBlocked(false)
        cancelHoverReveal()
      }}
      onBlur={(e) => {
        if (!e.currentTarget.contains(e.relatedTarget as Node | null)) {
          setHoverRevealBlocked(false)
          cancelHoverReveal()
        }
      }}
    >
      <button
        type="button"
        className="flex w-full cursor-pointer select-none items-center gap-2 px-2.5 py-2 text-left text-mf-caption font-bold text-muted-foreground transition-colors hover:bg-muted/60"
        aria-expanded={expanded}
        onPointerDown={onPointerDown}
        onPointerUp={onPointerUp}
        onPointerCancel={onPointerUp}
        onClick={() => {
          setPinned((wasPinned) => {
            if (wasPinned) {
              setHoverRevealBlocked(true)
              setHeld(false)
              clearHoldTimer()
              cancelHoverReveal()
              return false
            }
            setHoverRevealBlocked(false)
            return true
          })
        }}
        aria-label={pinned ? collapseAria : expandAria}
      >
        <span className="min-w-0 flex-1 truncate text-muted-foreground">{label}</span>
        <ChevronDown
          className={`h-3.5 w-3.5 shrink-0 text-muted-foreground transition-transform duration-200 ease-out ${
            chevronRotated ? 'rotate-180' : ''
          }`}
          aria-hidden
        />
      </button>
      <div
        className={`grid min-h-0 transition-[grid-template-rows] duration-200 ease-out ${
          expanded ? 'grid-rows-[1fr]' : 'grid-rows-[0fr]'
        }`}
      >
        <div className="min-h-0 overflow-hidden">
          <div className="border-t border-border px-2.5 pb-2.5 pt-1.5">{children}</div>
        </div>
      </div>
    </div>
  )
}
