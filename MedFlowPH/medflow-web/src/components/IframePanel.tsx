import { useState } from 'react'
import { Loader2 } from 'lucide-react'

type IframePanelProps = {
  src: string
  title: string
  height?: number
  /** Optional anchor id for in-page TOC / deep links */
  id?: string
}

export function IframePanel({ src, title, height = 600, id }: IframePanelProps) {
  const [loaded, setLoaded] = useState(false)

  return (
    <section id={id} className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
      <div className="mb-3 flex items-center justify-between gap-2">
        <h3 className="text-sm font-semibold text-mf-ink">{title}</h3>
      </div>
      <div className="relative overflow-hidden rounded-xl border border-slate-100 bg-slate-50">
        {!loaded ? (
          <div className="absolute inset-0 z-10 flex items-center justify-center bg-white/70 backdrop-blur-sm">
            <Loader2 className="h-8 w-8 animate-spin text-mf-primary" aria-hidden />
            <span className="sr-only">Loading interactive view</span>
          </div>
        ) : null}
        <iframe
          title={title}
          src={src}
          height={height}
          className="w-full"
          loading="lazy"
          sandbox="allow-scripts allow-same-origin"
          onLoad={() => setLoaded(true)}
        />
      </div>
    </section>
  )
}
