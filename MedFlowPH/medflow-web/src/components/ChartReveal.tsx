import gsap from 'gsap'
import { useLayoutEffect, useRef, type ReactNode } from 'react'
import { usePrefersReducedMotion } from '../hooks/usePrefersReducedMotion'

type ChartRevealProps = {
  children: ReactNode
  className?: string
}

/**
 * One-shot, viewport-triggered micro-reveal for chart / figure containers.
 * Starts nearly opaque and slightly scaled so charts stay readable.
 */
export function ChartReveal({ children, className = '' }: ChartRevealProps) {
  const rootRef = useRef<HTMLDivElement>(null)
  const reduced = usePrefersReducedMotion()
  const playedRef = useRef(false)

  useLayoutEffect(() => {
    const el = rootRef.current
    if (!el) return

    if (reduced) {
      gsap.set(el, { clearProps: 'opacity,transform' })
      return
    }

    const ctx = gsap.context(() => {
      gsap.set(el, {
        opacity: 0.9,
        scale: 0.988,
        transformOrigin: '50% 50%',
        force3D: true,
      })
    }, el)

    let tween: gsap.core.Tween | null = null

    const obs = new IntersectionObserver(
      (entries) => {
        if (playedRef.current) return
        if (!entries.some((e) => e.isIntersecting)) return
        playedRef.current = true
        obs.disconnect()
        tween = gsap.to(el, {
          opacity: 1,
          scale: 1,
          duration: 0.55,
          ease: 'power2.out',
          force3D: true,
          onComplete: () => {
            gsap.set(el, { clearProps: 'transform' })
          },
        })
      },
      { root: null, rootMargin: '0px 0px -8% 0px', threshold: 0.03 },
    )

    obs.observe(el)

    return () => {
      obs.disconnect()
      tween?.kill()
      ctx.revert()
    }
  }, [reduced])

  return (
    <div ref={rootRef} className={className}>
      {children}
    </div>
  )
}
