import type { Plugin } from 'yet-another-react-lightbox'
import Zoom from 'yet-another-react-lightbox/plugins/zoom'

/** Shared zoom-capable plugins for {@link Lightbox} / {@link LightboxGallery}. */
export const MEDFLOW_LIGHTBOX_PLUGINS: Plugin[] = [Zoom]

/** Zoom: scroll wheel / trackpad pinch-style scroll, plus double‑click stops. */
export const MEDFLOW_LIGHTBOX_ZOOM = {
  scrollToZoom: true,
  doubleClickMaxStops: 4,
  maxZoomPixelRatio: 2,
} as const
