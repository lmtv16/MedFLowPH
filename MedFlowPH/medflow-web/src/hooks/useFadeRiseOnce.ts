import gsap from 'gsap'
import { useLayoutEffect, useRef } from 'react'
import { usePrefersReducedMotion } from './usePrefersReducedMotion'

/**
 * Fade + slight rise when the element first intersects the viewport; runs once.
 * Uses IntersectionObserver (no ScrollTrigger) and gsap.context for safe cleanup.
 */
export function useFadeRiseOnce() {
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
      gsap.set(el, { opacity: 0, y: 16 })
    }, el)

    const obs = new IntersectionObserver(
      (entries) => {
        if (playedRef.current) return
        if (!entries.some((e) => e.isIntersecting)) return
        playedRef.current = true
        obs.disconnect()
        gsap.to(el, {
          opacity: 1,
          y: 0,
          duration: 0.68,
          ease: 'power2.out',
        })
      },
      { root: null, rootMargin: '0px 0px -12% 0px', threshold: 0.02 },
    )

    obs.observe(el)

    return () => {
      obs.disconnect()
      ctx.revert()
      gsap.killTweensOf(el)
    }
  }, [reduced])

  return rootRef
}
