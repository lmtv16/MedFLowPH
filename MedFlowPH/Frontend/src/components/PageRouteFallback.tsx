/**
 * Route transition placeholder: matches card-based page chrome (borders, radii,
 * typography scale) without mimicking real page content.
 */
export function PageRouteFallback() {
  return (
    <div className="w-full min-w-0 px-0 py-6" aria-busy="true" aria-live="polite" aria-label="Loading page">
      <div className="min-h-[min(52vh,28rem)] rounded-2xl border border-border bg-card/95 p-5 shadow-sm motion-reduce:animate-none md:p-7">
        <div className="h-4 w-40 max-w-[55%] rounded-md bg-muted motion-safe:animate-pulse" />
        <div className="mt-5 space-y-2.5">
          <div className="h-3 w-full rounded bg-muted/60 motion-safe:animate-pulse" />
          <div className="h-3 w-[96%] rounded bg-muted/60 motion-safe:animate-pulse" />
          <div className="h-3 w-[88%] rounded bg-muted/60 motion-safe:animate-pulse" />
        </div>
        <div className="mt-8 aspect-video w-full max-w-3xl rounded-xl border border-border bg-muted/30 motion-safe:animate-pulse" />
      </div>
    </div>
  )
}
