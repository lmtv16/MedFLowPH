import { lazy, Suspense } from 'react'
import type { FigureCarouselProps } from './FigureCarousel'

const FigureCarouselInner = lazy(() =>
  import('./FigureCarousel').then((m) => ({ default: m.FigureCarousel })),
)

function FigureCarouselFallback() {
  return (
    <div
      className="min-h-[min(24rem,70vh)] min-w-0 rounded-2xl border border-slate-200 bg-white p-4 shadow-sm motion-reduce:animate-none dark:border-border dark:bg-card md:p-6"
      aria-hidden
    >
      <div className="aspect-video w-full rounded-xl border border-slate-100 bg-slate-50/90 motion-safe:animate-pulse dark:border-border dark:bg-muted/30" />
      <div className="mt-5 flex justify-center gap-2">
        <div className="h-10 w-10 rounded-full border border-slate-200 bg-slate-50 dark:border-border dark:bg-muted/40" />
        <div className="h-10 w-10 rounded-full border border-slate-200 bg-slate-50 dark:border-border dark:bg-muted/40" />
      </div>
    </div>
  )
}

/** Code-splits the carousel bundle until the host page renders this section. */
export function LazyFigureCarousel(props: FigureCarouselProps) {
  return (
    <Suspense fallback={<FigureCarouselFallback />}>
      <FigureCarouselInner {...props} />
    </Suspense>
  )
}
