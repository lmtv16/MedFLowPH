import gsap from 'gsap'
import { useLayoutEffect, useRef } from 'react'
import { usePrefersReducedMotion } from './usePrefersReducedMotion'

/** Clear GSAP-applied inlines after reveal (opacity/transform only in tweens). */
const FADE_CLEAR = 'all' as const

/**
 * Fade + slight rise when the element first intersects the viewport; runs once.
 * Uses IntersectionObserver (no ScrollTrigger). The reveal tween is registered with
 * gsap.context via ctx.add() so revert/kill cannot strand opacity/transform inlines.
 */
export function useFadeRiseOnce() {
  const rootRef = useRef<HTMLDivElement>(null)
  const reduced = usePrefersReducedMotion()
  const playedRef = useRef(false)

  useLayoutEffect(() => {
    const el = rootRef.current
    if (!el) return

    if (reduced) {
      gsap.set(el, { clearProps: FADE_CLEAR })
      return
    }

    const ctx = gsap.context(() => {
      gsap.set(el, { opacity: 0, y: 16 })
    }, el)

    const obs = new IntersectionObserver(
      (entries) => {
        if (playedRef.current) return
        if (!entries.some((e) => e.isIntersecting)) return
        playedRef.current = true
        obs.disconnect()
        ctx.add(() =>
          gsap.to(el, {
            opacity: 1,
            y: 0,
            duration: 0.68,
            ease: 'power2.out',
            onComplete: () => {
              gsap.set(el, { clearProps: FADE_CLEAR })
            },
          }),
        )
      },
      { root: null, rootMargin: '0px 0px -12% 0px', threshold: 0.02 },
    )

    obs.observe(el)

    return () => {
      obs.disconnect()
      ctx.revert()
      gsap.killTweensOf(el)
      gsap.set(el, { clearProps: FADE_CLEAR })
    }
  }, [reduced])

  return rootRef
}
