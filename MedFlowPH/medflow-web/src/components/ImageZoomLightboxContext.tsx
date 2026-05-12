import { createContext, useCallback, useContext, useMemo, useState, type ReactNode } from 'react'
import Lightbox from 'yet-another-react-lightbox'
import 'yet-another-react-lightbox/styles.css'
import type { GalleryImage } from './LightboxGallery'
import { MEDFLOW_LIGHTBOX_PLUGINS, MEDFLOW_LIGHTBOX_ZOOM } from './medflowLightboxZoom'

type OpenFn = (images: GalleryImage[], index?: number) => void

const ImageZoomContext = createContext<OpenFn | undefined>(undefined)

export function ImageZoomLightboxProvider({ children }: { children: ReactNode }) {
  const [open, setOpen] = useState(false)
  const [index, setIndex] = useState(0)
  const [slides, setSlides] = useState<Array<{ src: string; title?: string }>>([])

  const openImages = useCallback<OpenFn>((images, startIndex = 0) => {
    if (!images.length) return
    setSlides(images.map(({ src, title }) => ({ src, title })))
    const i = Number.isFinite(startIndex) ? Math.min(Math.max(0, startIndex), images.length - 1) : 0
    setIndex(i)
    setOpen(true)
  }, [])

  const close = useCallback(() => {
    setOpen(false)
  }, [])

  const value = useMemo(() => openImages, [openImages])

  return (
    <ImageZoomContext.Provider value={value}>
      {children}
      <Lightbox
        open={open}
        close={close}
        index={index}
        slides={slides}
        on={{ view: ({ index: next }) => setIndex(next) }}
        plugins={MEDFLOW_LIGHTBOX_PLUGINS}
        zoom={{ ...MEDFLOW_LIGHTBOX_ZOOM }}
      />
    </ImageZoomContext.Provider>
  )
}

/** When inside {@link ImageZoomLightboxProvider}, opens the global zoom lightbox. */
export function useOpenImageZoom(): OpenFn | undefined {
  return useContext(ImageZoomContext)
}
