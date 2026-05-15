import { ChevronLeft, ChevronRight } from 'lucide-react'
import { ChartReveal } from './ChartReveal'
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
    <ChartReveal className="min-w-0 rounded-2xl border border-border bg-card p-4 shadow-sm md:p-6">
      <div className="overflow-hidden rounded-xl border border-border">
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
            className="inline-flex h-10 w-10 items-center justify-center rounded-full border border-border bg-card text-foreground shadow-sm transition-colors hover:bg-muted disabled:pointer-events-none disabled:opacity-40"
          >
            <ChevronLeft className="h-5 w-5" aria-hidden />
          </button>
          <span className="min-w-[4.5rem] text-center text-mf-caption font-medium tabular-nums text-muted-foreground">
            {activeIndex + 1} / {n}
          </span>
          <button
            type="button"
            aria-label={ariaNextLabel}
            disabled={activeIndex >= n - 1}
            onClick={() => onActiveIndexChange(Math.min(n - 1, activeIndex + 1))}
            className="inline-flex h-10 w-10 items-center justify-center rounded-full border border-border bg-card text-foreground shadow-sm transition-colors hover:bg-muted disabled:pointer-events-none disabled:opacity-40"
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
                  : 'h-2.5 w-2.5 rounded-full bg-muted-foreground/35 transition hover:bg-muted-foreground/55'
              }
            />
          ))}
        </div>
      </div>

      <div
        className="mt-6 rounded-xl border border-dashed border-border bg-muted/30 p-5 md:p-7"
        aria-live="polite"
      >
        <p className="text-mf-card-title font-semibold uppercase tracking-wide text-muted-foreground">
          {heading}
        </p>
        <p className="mt-3 text-mf-body leading-relaxed whitespace-pre-line text-foreground">
          {slide?.explanation ?? fallbackExplanation}
        </p>
      </div>
    </ChartReveal>
  )
}
