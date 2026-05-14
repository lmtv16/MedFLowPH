import { ChevronLeft, ChevronRight } from 'lucide-react'
import { ImageCard } from './ImageCard'
import type { ImageManifestItem } from '../data/fileManifest'

export type FigureCarouselProps = {
  items: readonly ImageManifestItem[]
  activeIndex: number
  onActiveIndexChange: (index: number) => void
  getFigureLabel: (index: number, item: ImageManifestItem) => string | undefined
  onSlideImageClick?: (index: number) => void
  interpretationTitle?: string
  fallbackExplanation?: string
  ariaPrevLabel?: string
  ariaNextLabel?: string
}

export function FigureCarousel({
  items,
  activeIndex,
  onActiveIndexChange,
  getFigureLabel,
  onSlideImageClick,
  interpretationTitle = 'Interpretation',
  fallbackExplanation = 'Add an explanation for this figure: what it shows and why it matters for this study.',
  ariaPrevLabel = 'Previous figure',
  ariaNextLabel = 'Next figure',
}: FigureCarouselProps) {
  const n = items.length
  if (n === 0) return null

  const slide = items[Math.min(activeIndex, n - 1)]

  const heading = slide?.interpretationHeading ?? interpretationTitle

  return (
    <div className="min-w-0 rounded-2xl border border-slate-200 bg-white p-4 shadow-sm dark:border-border dark:bg-card md:p-6">
      <div className="overflow-hidden rounded-xl border border-slate-100 dark:border-border">
        <div
          className="flex transition-transform duration-300 ease-out motion-reduce:transition-none"
          style={{
            width: `${n * 100}%`,
            transform: `translateX(-${(100 / n) * activeIndex}%)`,
          }}
        >
          {items.map((item, idx) => (
            <div key={item.src} className="min-w-0 shrink-0" style={{ width: `${100 / n}%` }}>
              <ImageCard
                src={item.src}
                title={item.title}
                onClick={onSlideImageClick ? () => onSlideImageClick(idx) : undefined}
                figure={getFigureLabel(idx, item)}
                imageLoading={idx === activeIndex ? 'eager' : 'lazy'}
              />
            </div>
          ))}
        </div>
      </div>

      <div className="mt-5 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-center justify-center gap-1 sm:justify-start">
          <button
            type="button"
            aria-label={ariaPrevLabel}
            disabled={activeIndex <= 0}
            onClick={() => onActiveIndexChange(Math.max(0, activeIndex - 1))}
            className="inline-flex h-10 w-10 items-center justify-center rounded-full border border-slate-200 bg-white text-slate-700 shadow-sm transition-colors hover:bg-slate-50 disabled:pointer-events-none disabled:opacity-40 dark:border-border dark:bg-card dark:text-foreground dark:hover:bg-muted"
          >
            <ChevronLeft className="h-5 w-5" aria-hidden />
          </button>
          <span className="min-w-[4.5rem] text-center text-mf-caption font-medium tabular-nums text-mf-muted dark:text-muted-foreground">
            {activeIndex + 1} / {n}
          </span>
          <button
            type="button"
            aria-label={ariaNextLabel}
            disabled={activeIndex >= n - 1}
            onClick={() => onActiveIndexChange(Math.min(n - 1, activeIndex + 1))}
            className="inline-flex h-10 w-10 items-center justify-center rounded-full border border-slate-200 bg-white text-slate-700 shadow-sm transition-colors hover:bg-slate-50 disabled:pointer-events-none disabled:opacity-40 dark:border-border dark:bg-card dark:text-foreground dark:hover:bg-muted"
          >
            <ChevronRight className="h-5 w-5" aria-hidden />
          </button>
        </div>
        <div className="flex flex-wrap justify-center gap-2 sm:justify-end">
          {items.map((item, i) => (
            <button
              key={item.src}
              type="button"
              aria-label={`Show figure: ${item.title}`}
              aria-current={i === activeIndex ? 'true' : undefined}
              onClick={() => onActiveIndexChange(i)}
              className={
                i === activeIndex
                  ? 'h-2.5 w-2.5 rounded-full bg-mf-primary ring-2 ring-mf-primary/30 dark:ring-primary/40'
                  : 'h-2.5 w-2.5 rounded-full bg-slate-300 transition hover:bg-slate-400 dark:bg-muted-foreground/40 dark:hover:bg-muted-foreground/60'
              }
            />
          ))}
        </div>
      </div>

      <div
        className="mt-6 rounded-xl border border-dashed border-slate-300 bg-slate-50/90 p-5 md:p-7 dark:border-slate-600 dark:bg-muted/25"
        aria-live="polite"
      >
        <p className="text-mf-card-title font-semibold uppercase tracking-wide text-slate-600 dark:text-muted-foreground">
          {heading}
        </p>
        <p className="mt-3 text-mf-body leading-relaxed whitespace-pre-line text-slate-700 dark:text-foreground">
          {slide?.explanation ?? fallbackExplanation}
        </p>
      </div>
    </div>
  )
}
