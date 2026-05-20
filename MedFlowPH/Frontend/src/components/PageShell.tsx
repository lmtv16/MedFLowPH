import gsap from 'gsap'
import type { ReactNode } from 'react'
import { useLayoutEffect, useRef } from 'react'
import { usePrefersReducedMotion } from '../hooks/usePrefersReducedMotion'

/** Strip inline animation props after tween so theme/CSS colors are never stranded. */
const SHELL_CLEAR = 'all' as const

export function PageShell({ children }: { children: ReactNode }) {
  const ref = useRef<HTMLDivElement>(null)
  const reduced = usePrefersReducedMotion()

  useLayoutEffect(() => {
    const el = ref.current
    if (!el) return
    if (reduced) {
      gsap.set(el, { clearProps: SHELL_CLEAR })
      return
    }

    const ctx = gsap.context(() => {
      gsap.fromTo(
        el,
        { opacity: 0, y: 12 },
        {
          opacity: 1,
          y: 0,
          duration: 0.25,
          ease: 'power2.out',
          onComplete: () => {
            gsap.set(el, { clearProps: SHELL_CLEAR })
          },
        },
      )
    }, el)

    return () => {
      ctx.revert()
      gsap.killTweensOf(el)
      gsap.set(el, { clearProps: SHELL_CLEAR })
    }
  }, [reduced])

  return (
    <div ref={ref} className="w-full min-w-0 px-0 py-6">
      {children}
    </div>
  )
}
