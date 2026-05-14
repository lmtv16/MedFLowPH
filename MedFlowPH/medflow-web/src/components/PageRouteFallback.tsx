/**
 * Route transition placeholder: matches card-based page chrome (borders, radii,
 * typography scale) without mimicking real page content.
 */
export function PageRouteFallback() {
  return (
    <div className="w-full min-w-0 px-0 py-6" aria-busy="true" aria-live="polite" aria-label="Loading page">
      <div className="min-h-[min(52vh,28rem)] rounded-2xl border border-slate-200 bg-white/95 p-5 shadow-sm motion-reduce:animate-none dark:border-border dark:bg-card/95 md:p-7">
        <div className="h-4 w-40 max-w-[55%] rounded-md bg-slate-200/90 motion-safe:animate-pulse dark:bg-muted" />
        <div className="mt-5 space-y-2.5">
          <div className="h-3 w-full rounded bg-slate-100 motion-safe:animate-pulse dark:bg-muted/50" />
          <div className="h-3 w-[96%] rounded bg-slate-100 motion-safe:animate-pulse dark:bg-muted/50" />
          <div className="h-3 w-[88%] rounded bg-slate-100 motion-safe:animate-pulse dark:bg-muted/50" />
        </div>
        <div className="mt-8 aspect-video w-full max-w-3xl rounded-xl border border-slate-100 bg-slate-50/90 motion-safe:animate-pulse dark:border-border dark:bg-muted/30" />
      </div>
    </div>
  )
}
