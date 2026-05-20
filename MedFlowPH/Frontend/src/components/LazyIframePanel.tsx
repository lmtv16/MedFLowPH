import { lazy, Suspense } from 'react'
import type { IframePanelProps } from './IframePanel'

const IframePanelInner = lazy(() => import('./IframePanel').then((m) => ({ default: m.IframePanel })))

function IframePanelFallback({ height = 600 }: Pick<IframePanelProps, 'height'>) {
  return (
    <section className="rounded-2xl border border-border bg-card p-5 shadow-sm" aria-busy="true">
      <span className="sr-only">Loading interactive view</span>
      <div className="mb-3 h-6 w-2/3 max-w-md rounded-md bg-muted/60 motion-safe:animate-pulse" />
      <div
        className="flex w-full items-center justify-center rounded-xl border border-border bg-muted/30 text-mf-caption text-muted-foreground motion-safe:animate-pulse"
        style={{ height, maxHeight: 'min(85vh, 900px)' }}
        aria-hidden
      >
        Loading interactive view…
      </div>
    </section>
  )
}

/** Code-splits iframe panel JS until this block is rendered on the page. */
export function LazyIframePanel(props: IframePanelProps) {
  const h = props.height ?? 600
  return (
    <Suspense fallback={<IframePanelFallback height={h} />}>
      <IframePanelInner {...props} />
    </Suspense>
  )
}
