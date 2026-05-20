import type { ReactNode } from 'react'
import { useFadeRiseOnce } from '../hooks/useFadeRiseOnce'

type SectionWrapperProps = {
  title?: string
  id?: string
  children: ReactNode
}

export function SectionWrapper({ title, id, children }: SectionWrapperProps) {
  const rootRef = useFadeRiseOnce()

  return (
    <div id={id}>
      <div ref={rootRef}>
        {title ? (
          <h2 className="mb-4 border-l-4 border-primary pl-3 font-heading text-mf-section font-semibold text-foreground">
            {title}
          </h2>
        ) : null}
        {children}
      </div>
    </div>
  )
}
