import { ZoomIn } from 'lucide-react'
import { useState } from 'react'

type ImageCardProps = {
  src: string
  title: string
  onClick?: () => void
  caption?: string
  figure?: string
}

export function ImageCard({ src, title, onClick, caption, figure }: ImageCardProps) {
  const [imgError, setImgError] = useState(false)

  return (
    <figure className="flex flex-col gap-2">
      <button
        type="button"
        onClick={onClick}
        className="group relative w-full overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm transition-transform duration-200 hover:scale-[1.02]"
      >
        <div className="relative aspect-video w-full bg-slate-50">
          {!imgError ? (
            <img
              src={src}
              alt={title}
              className="h-full w-full object-contain"
              loading="lazy"
              onError={() => setImgError(true)}
            />
          ) : null}
          <div
            className={`absolute inset-0 flex items-center justify-center bg-slate-100 ${
              imgError ? 'flex border-2 border-dashed border-slate-300' : 'hidden'
            }`}
          >
            <span className="text-center px-4 text-xs text-slate-400">
              {title} — image not yet available
            </span>
          </div>
          {!imgError ? (
            <div className="pointer-events-none absolute inset-0 flex items-center justify-center bg-slate-900/40 opacity-0 transition-opacity duration-200 group-hover:opacity-100">
              <ZoomIn className="h-10 w-10 text-white" aria-hidden />
            </div>
          ) : null}
        </div>
        <figcaption className="border-t border-slate-100 bg-white px-3 py-2 text-left text-xs font-medium text-mf-muted">
          {title}
        </figcaption>
      </button>
      {figure ? (
        <p className="text-xs text-slate-500">{figure}</p>
      ) : null}
      {caption ? <p className="text-xs text-slate-400">{caption}</p> : null}
    </figure>
  )
}
