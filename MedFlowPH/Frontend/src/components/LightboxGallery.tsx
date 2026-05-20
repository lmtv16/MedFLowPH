import Lightbox from 'yet-another-react-lightbox'
import 'yet-another-react-lightbox/styles.css'
import { MEDFLOW_LIGHTBOX_PLUGINS, MEDFLOW_LIGHTBOX_ZOOM } from './medflowLightboxZoom'

export type GalleryImage = { src: string; title: string }

type LightboxGalleryProps = {
  images: GalleryImage[]
  index: number
  open: boolean
  onClose: () => void
}

export function LightboxGallery({ images, index, open, onClose }: LightboxGalleryProps) {
  return (
    <Lightbox
      open={open}
      close={onClose}
      index={index}
      slides={images.map((img) => ({ src: img.src, title: img.title }))}
      plugins={MEDFLOW_LIGHTBOX_PLUGINS}
      zoom={{ ...MEDFLOW_LIGHTBOX_ZOOM }}
    />
  )
}
