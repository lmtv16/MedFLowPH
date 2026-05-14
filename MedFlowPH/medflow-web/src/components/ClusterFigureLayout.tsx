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
      <header className="flex flex-col gap-5 border-b border-slate-200 pb-6 dark:border-border">
        <p className="text-mf-caption font-semibold uppercase tracking-wide text-mf-primary dark:text-primary">
          Figure {figureNum}
        </p>
        <div className="rounded-xl border border-slate-100 bg-white px-4 py-3 shadow-sm dark:border-border dark:bg-card">
          <h3 className="text-mf-card-title font-semibold leading-snug text-mf-ink dark:text-foreground">{title}</h3>
        </div>
      </header>
      <ChartReveal className="min-w-0">{children}</ChartReveal>
      <footer className="border-t border-slate-200 pt-4 dark:border-border">
        <div className="flex flex-col gap-3">
          {footerParagraphs.map((para, pi) => (
            <p key={pi} className="text-mf-body leading-relaxed text-mf-muted dark:text-muted-foreground">
              {para}
            </p>
          ))}
        </div>
      </footer>
    </div>
  )
}
