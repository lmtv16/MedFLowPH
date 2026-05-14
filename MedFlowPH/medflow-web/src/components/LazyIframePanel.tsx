import { lazy, Suspense } from 'react'
import type { IframePanelProps } from './IframePanel'

const IframePanelInner = lazy(() => import('./IframePanel').then((m) => ({ default: m.IframePanel })))

function IframePanelFallback({ height = 600 }: Pick<IframePanelProps, 'height'>) {
  return (
    <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm dark:border-border dark:bg-card" aria-busy="true">
      <span className="sr-only">Loading interactive view</span>
      <div className="mb-3 h-6 w-2/3 max-w-md rounded-md bg-slate-100 motion-safe:animate-pulse dark:bg-muted/60" />
      <div
        className="flex w-full items-center justify-center rounded-xl border border-slate-100 bg-slate-50 text-mf-caption text-mf-muted motion-safe:animate-pulse dark:border-border dark:bg-muted/30 dark:text-muted-foreground"
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
