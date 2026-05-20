import { ChevronDown, ZoomIn } from 'lucide-react'
import { useId, useState, type ReactNode } from 'react'
import { HoverDisclosurePanel } from './HoverDisclosurePanel'
import { useOpenImageZoom } from './ImageZoomLightboxContext'

type ImageCardProps = {
  src: string
  title: string
  onClick?: () => void
  caption?: ReactNode
  figure?: string
  /** Same interaction for the image title (moved out of the zoom button; gallery). */
  titleDisclosure?: boolean
  /** When an external heading already shows the title, hide the button footnote caption. */
  hideInlineTitle?: boolean
  /** Active carousel slides use eager so the visible figure loads promptly; others stay lazy. */
  imageLoading?: 'lazy' | 'eager'
}

export function ImageCard({
  src,
  title,
  onClick,
  caption,
  figure,
  titleDisclosure,
  hideInlineTitle,
  imageLoading = 'lazy',
}: ImageCardProps) {
  const [imgError, setImgError] = useState(false)
  const [captionOpen, setCaptionOpen] = useState(false)
  const captionPanelId = useId()
  const openImageZoom = useOpenImageZoom()

  const activate = () => {
    if (onClick) {
      onClick()
      return
    }
    if (openImageZoom && !imgError) {
      openImageZoom([{ src, title }], 0)
    }
  }

  const interactive = Boolean(onClick || (openImageZoom && !imgError))
  const showTitleInsideZoomButton = !hideInlineTitle && !titleDisclosure

  return (
    <figure className="flex max-w-full min-w-0 flex-col gap-2">
      <button
        type="button"
        onClick={interactive ? activate : undefined}
        disabled={!interactive}
        aria-label={interactive ? `${title}: open zoom view` : title}
        className={`group relative w-full overflow-hidden rounded-xl border border-border bg-card shadow-sm ${
          interactive
            ? 'transition-transform duration-200 hover:scale-[1.02]'
            : 'cursor-default opacity-90'
        }`}
      >
        <div className="relative aspect-video w-full bg-muted/40">
          {!imgError ? (
            <img
              src={src}
              alt={title}
              className="h-full w-full max-w-full object-contain"
              loading={imageLoading}
              decoding="async"
              onError={() => setImgError(true)}
            />
          ) : null}
          <div
            className={`absolute inset-0 flex items-center justify-center bg-muted ${
              imgError ? 'flex border-2 border-dashed border-border' : 'hidden'
            }`}
          >
            <span className="px-4 text-center text-mf-caption text-muted-foreground">
              {title} — image not yet available
            </span>
          </div>
          {!imgError && interactive ? (
            <div className="pointer-events-none absolute inset-0 flex items-center justify-center bg-foreground/40 opacity-0 transition-opacity duration-200 group-hover:opacity-100">
              <ZoomIn className="h-10 w-10 text-background" aria-hidden />
            </div>
          ) : null}
        </div>
        {showTitleInsideZoomButton ? (
          <figcaption className="border-t border-border bg-card px-3 py-2 text-left text-mf-caption font-bold text-muted-foreground">
            {title}
          </figcaption>
        ) : null}
      </button>
      {titleDisclosure ? (
        <HoverDisclosurePanel
          label={title}
          expandAria={`Expand image title: ${title}`}
          collapseAria={`Collapse image title: ${title}`}
        >
          <p className="text-left text-mf-caption font-bold leading-relaxed text-muted-foreground">{title}</p>
        </HoverDisclosurePanel>
      ) : null}
      {figure ? (
        <p className="text-mf-caption text-muted-foreground">{figure}</p>
      ) : null}
      {caption ? (
        <div className="rounded-lg border border-border bg-muted/30">
          <button
            type="button"
            className="flex w-full items-center gap-2 px-2.5 py-2 text-left text-mf-caption font-medium text-muted-foreground transition-colors hover:bg-muted/50"
            aria-expanded={captionOpen}
            aria-controls={captionPanelId}
            aria-label={captionOpen ? `Hide description for ${title}` : `Show description for ${title}`}
            onClick={() => setCaptionOpen((v) => !v)}
          >
            <ChevronDown
              className={`h-3.5 w-3.5 shrink-0 text-muted-foreground transition-transform ${
                captionOpen ? 'rotate-180' : ''
              }`}
              aria-hidden
            />
            Description
          </button>
          {captionOpen ? (
            <div
              id={captionPanelId}
              className="border-t border-border py-2 pb-2.5 pl-[calc(0.625rem+1ch)] pr-2.5 text-justify text-mf-body leading-relaxed text-muted-foreground whitespace-pre-line"
            >
              {caption}
            </div>
          ) : null}
        </div>
      ) : null}
    </figure>
  )
}
