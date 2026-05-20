import type { ReactNode } from 'react'
import { ChartReveal } from './ChartReveal'

export type FigureCaptions = readonly ReactNode[]

/**
 * Numbered figure block with a header band, slot for the figure body, and a
 * caption footer. Used for PCA / clustering / DBSCAN results so figures keep a
 * consistent layout across pages.
 */
export function ClusterFigureLayout({
  figureNum,
  title,
  children,
  footerParagraphs,
}: {
  figureNum: number
  title: string
  children: ReactNode
  footerParagraphs: FigureCaptions
}) {
  return (
    <div className="flex flex-col gap-6">
      <header className="flex flex-col gap-5 border-b border-border pb-6">
        <p className="text-mf-caption font-semibold uppercase tracking-wide text-primary">
          Figure {figureNum}
        </p>
        <div className="rounded-xl border border-border bg-card px-4 py-3 shadow-sm">
          <h3 className="text-mf-card-title font-semibold leading-snug text-foreground">{title}</h3>
        </div>
      </header>
      <ChartReveal className="min-w-0">{children}</ChartReveal>
      <footer className="border-t border-border pt-4">
        <div className="flex flex-col gap-3">
          {footerParagraphs.map((para, pi) => (
            <p key={pi} className="text-mf-body leading-relaxed text-muted-foreground">
              {para}
            </p>
          ))}
        </div>
      </footer>
    </div>
  )
}
