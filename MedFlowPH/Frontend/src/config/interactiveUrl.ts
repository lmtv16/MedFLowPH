/** External interactive app (`VITE_INTERACTIVE_URL`). Falls back to in-app routing when unset. */

const interactiveUrl = (import.meta.env.VITE_INTERACTIVE_URL ?? '').replace(/\/$/, '')

export function handleInteractiveRouting(fallback: () => void): void {
  if (interactiveUrl) {
    window.location.href = interactiveUrl
    return
  }
  fallback()
}
