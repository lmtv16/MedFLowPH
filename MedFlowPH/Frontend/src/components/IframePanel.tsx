import { useState } from 'react'
import { Loader2 } from 'lucide-react'

export type IframePanelProps = {
  src: string
  title: string
  height?: number
  /** Optional anchor id for in-page TOC / deep links */
  id?: string
  onIframeLoad?: (e: React.SyntheticEvent<HTMLIFrameElement>) => void
}

export function IframePanel({ src, title, height = 600, id, onIframeLoad }: IframePanelProps) {
  const [loaded, setLoaded] = useState(false)

  return (
    <section id={id} className="rounded-2xl border border-border bg-card p-5 shadow-sm">
      <div className="mb-3 flex min-w-0 items-center justify-between gap-2">
        <h3 className="min-w-0 text-mf-card-title font-semibold text-foreground">{title}</h3>
      </div>
      <div className="relative w-full min-w-0 max-w-full overflow-hidden rounded-xl border border-border bg-muted/30">
        {!loaded ? (
          <div className="absolute inset-0 z-10 flex items-center justify-center bg-mf-card/85">
            <Loader2 className="h-8 w-8 animate-spin text-mf-primary" aria-hidden />
            <span className="sr-only">Loading interactive view</span>
          </div>
        ) : null}
        <iframe
          title={title}
          src={src}
          className="w-full max-w-full border-0 bg-muted/25"
          style={{ height, maxHeight: 'min(85vh, 900px)' }}
          loading="lazy"
          sandbox="allow-scripts allow-same-origin"
          onLoad={(e) => {
            setLoaded(true)
            onIframeLoad?.(e)
          }}
        />
      </div>
    </section>
  )
}
