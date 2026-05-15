import gsap from 'gsap'
import { useLayoutEffect, useRef } from 'react'
import { usePrefersReducedMotion } from '../hooks/usePrefersReducedMotion'
import { formatMetricDisplay, parseMetricNumericValue } from '../utils/parseMetricNumericValue'

type MetricCardProps = {
  label: string
  value: string
  unit?: string
  delta?: string
  highlight?: boolean
  className?: string
  /** When false, skip numeric count-up (e.g. non-stat labels). Default true. */
  countUp?: boolean
}

export function MetricCard({
  label,
  value,
  unit,
  delta,
  highlight,
  className = '',
  countUp = true,
}: MetricCardProps) {
  const rootRef = useRef<HTMLDivElement>(null)
  const valueRef = useRef<HTMLSpanElement>(null)
  const reduced = usePrefersReducedMotion()

  useLayoutEffect(() => {
    const card = rootRef.current
    const span = valueRef.current
    if (!card || !span) return

    const parsed = parseMetricNumericValue(value)
    if (!parsed || !countUp || reduced) {
      gsap.killTweensOf(span)
      span.textContent = value
      return
    }

    span.textContent = formatMetricDisplay(0, parsed)

    let countTween: gsap.core.Tween | null = null
    let cancelled = false
    const obs = new IntersectionObserver(
      (entries) => {
        if (!entries.some((e) => e.isIntersecting) || cancelled) return
        obs.disconnect()
        const obj = { n: 0 }
        countTween = gsap.to(obj, {
          n: parsed.target,
          duration: 0.72,
          ease: 'power2.out',
          onUpdate: () => {
            if (!cancelled) {
              span.textContent = formatMetricDisplay(obj.n, parsed)
            }
          },
        })
      },
      { root: null, rootMargin: '0px 0px -10% 0px', threshold: 0.05 },
    )

    obs.observe(card)

    return () => {
      cancelled = true
      obs.disconnect()
      countTween?.kill()
      gsap.killTweensOf(span)
    }
  }, [value, countUp, reduced])

  return (
    <div
      ref={rootRef}
      className={[
        'flex h-full min-h-[7.5rem] min-w-0 flex-col rounded-2xl border border-mf-border bg-mf-card p-4 shadow-sm sm:p-5',
        highlight ? 'border-mf-primary ring-2 ring-primary/25' : 'border-mf-border',
        className,
      ].join(' ')}
    >
      <p className="text-mf-caption font-medium uppercase leading-snug tracking-wide text-muted-foreground">
        {label}
      </p>
      <div className="mt-auto min-w-0 pt-3">
        <p className="break-words text-mf-metric font-semibold tabular-nums text-foreground">
          <span ref={valueRef} />
          {unit ? (
            <span className="text-mf-card-title font-medium text-muted-foreground"> {unit}</span>
          ) : null}
        </p>
        {delta ? (
          <p className="mt-1 text-mf-caption text-mf-secondary">{delta}</p>
        ) : null}
      </div>
    </div>
  )
}
