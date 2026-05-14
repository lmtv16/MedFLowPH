import { ChevronDown, ZoomIn } from 'lucide-react'
import { useId, useState, type ReactNode } from 'react'
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

function HoverDisclosureRibbon({
  text,
  expandAria,
  collapseAria,
}: {
  text: string
  expandAria: string
  collapseAria: string
}) {
  const [pinned, setPinned] = useState(false)
  /** After collapsing while the pointer is still over the control, ignore hover so the panel actually closes. */
  const [hoverRevealBlocked, setHoverRevealBlocked] = useState(false)

  const allowHoverReveal = !hoverRevealBlocked

  const triggerBtn =
    'flex w-full cursor-pointer items-center gap-2 px-2.5 py-2 text-left text-mf-caption font-bold text-mf-muted transition-colors hover:bg-slate-50/90 dark:text-muted-foreground dark:hover:bg-muted/50'

  const triggerSpan = 'min-w-0 flex-1 truncate text-mf-muted dark:text-muted-foreground'

  const panelClass =
    'border-t border-slate-100 px-2.5 pb-2.5 pt-1.5 text-left text-mf-caption font-bold leading-relaxed text-mf-muted dark:border-border dark:text-muted-foreground'

  return (
    <div
      className="group rounded-lg border border-slate-200 bg-white/90 shadow-sm transition-[border-color,box-shadow] duration-200 hover:border-blue-300/60 hover:shadow-md dark:border-border dark:bg-muted/40 dark:hover:border-primary/50"
      onMouseLeave={() => setHoverRevealBlocked(false)}
      onBlur={(e) => {
        if (!e.currentTarget.contains(e.relatedTarget as Node | null)) {
          setHoverRevealBlocked(false)
        }
      }}
    >
      <button
        type="button"
        className={triggerBtn}
        aria-expanded={pinned}
        onClick={() => {
          setPinned((wasPinned) => {
            if (wasPinned) {
              setHoverRevealBlocked(true)
              return false
            }
            setHoverRevealBlocked(false)
            return true
          })
        }}
        aria-label={pinned ? collapseAria : expandAria}
      >
        <span className={triggerSpan}>{text}</span>
        <ChevronDown
          className={`h-3.5 w-3.5 shrink-0 text-slate-500 transition-transform duration-200 ease-out dark:text-muted-foreground ${
            pinned
              ? 'rotate-180'
              : hoverRevealBlocked
                ? ''
                : 'group-hover:rotate-180 group-focus-within:rotate-180'
          }`}
          aria-hidden
        />
      </button>
      <div
        className={`grid min-h-0 transition-[grid-template-rows] duration-200 ease-out ${
          pinned
            ? 'grid-rows-[1fr]'
            : allowHoverReveal
              ? 'grid-rows-[0fr] group-hover:grid-rows-[1fr] group-focus-within:grid-rows-[1fr]'
              : 'grid-rows-[0fr]'
        }`}
      >
        <div className="min-h-0 overflow-hidden">
          <p className={panelClass}>{text}</p>
        </div>
      </div>
    </div>
  )
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
        className={`group relative w-full overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm ${
          interactive
            ? 'transition-transform duration-200 hover:scale-[1.02]'
            : 'cursor-default opacity-90'
        }`}
      >
        <div className="relative aspect-video w-full bg-slate-50">
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
            className={`absolute inset-0 flex items-center justify-center bg-slate-100 ${
              imgError ? 'flex border-2 border-dashed border-slate-300' : 'hidden'
            }`}
          >
            <span className="px-4 text-center text-mf-caption text-slate-400">
              {title} — image not yet available
            </span>
          </div>
          {!imgError && interactive ? (
            <div className="pointer-events-none absolute inset-0 flex items-center justify-center bg-slate-900/40 opacity-0 transition-opacity duration-200 group-hover:opacity-100">
              <ZoomIn className="h-10 w-10 text-white" aria-hidden />
            </div>
          ) : null}
        </div>
        {showTitleInsideZoomButton ? (
          <figcaption className="border-t border-slate-100 bg-white px-3 py-2 text-left text-mf-caption font-bold text-mf-muted dark:border-border dark:bg-card dark:text-muted-foreground">
            {title}
          </figcaption>
        ) : null}
      </button>
      {titleDisclosure ? (
        <HoverDisclosureRibbon
          text={title}
          expandAria={`Expand image title: ${title}`}
          collapseAria={`Collapse image title: ${title}`}
        />
      ) : null}
      {figure ? (
        <p className="text-mf-caption text-slate-500 dark:text-muted-foreground">{figure}</p>
      ) : null}
      {caption ? (
        <div className="rounded-lg border border-slate-100 bg-slate-50/80 dark:border-border dark:bg-muted/30">
          <button
            type="button"
            className="flex w-full items-center gap-2 px-2.5 py-2 text-left text-mf-caption font-medium text-slate-600 transition-colors hover:bg-slate-100/90 dark:text-muted-foreground dark:hover:bg-muted/50"
            aria-expanded={captionOpen}
            aria-controls={captionPanelId}
            aria-label={captionOpen ? `Hide description for ${title}` : `Show description for ${title}`}
            onClick={() => setCaptionOpen((v) => !v)}
          >
            <ChevronDown
              className={`h-3.5 w-3.5 shrink-0 text-slate-500 transition-transform dark:text-muted-foreground ${
                captionOpen ? 'rotate-180' : ''
              }`}
              aria-hidden
            />
            Description
          </button>
          {captionOpen ? (
            <div
              id={captionPanelId}
              className="border-t border-slate-100 py-2 pb-2.5 pl-[calc(0.625rem+1ch)] pr-2.5 text-justify text-mf-body leading-relaxed text-slate-500 whitespace-pre-line dark:border-border dark:text-muted-foreground"
            >
              {caption}
            </div>
          ) : null}
        </div>
      ) : null}
    </figure>
  )
}
