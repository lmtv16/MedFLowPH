/**
 * Suppresses scroll-adjacent page navigation while the app performs
 * programmatic smooth scrolling (hash restore, TOC jumps) so wheel/edge
 * logic does not fire during those animations.
 */
let programmaticAdjacentNavLockUntil = 0

const ADJ_SCROLL_TOP_PATH_KEY = 'medflow-adjacent-nav-scroll-top-path'

function normalizePathname(p: string) {
  let x = p
  if (x.length > 1 && x.endsWith('/')) x = x.slice(0, -1)
  return x
}

export function lockAdjacentPageNavForProgrammaticScroll(ms = 1200) {
  programmaticAdjacentNavLockUntil = Date.now() + ms
}

export function isAdjacentPageNavLocked() {
  return Date.now() < programmaticAdjacentNavLockUntil
}

/** Call immediately before `navigate()` from scroll-adjacent page chaining. */
export function markAdjacentNavScrollToTop(expectedPathname: string) {
  try {
    sessionStorage.setItem(ADJ_SCROLL_TOP_PATH_KEY, normalizePathname(expectedPathname))
  } catch {
    /* private mode / quota */
  }
}

/**
 * If the stored pathname matches the current route, clears storage and returns true.
 * Used so Layout can scroll to top once without affecting hash or normal navigations.
 */
export function consumeAdjacentNavScrollToTop(currentPathname: string): boolean {
  try {
    const cur = normalizePathname(currentPathname)
    const v = sessionStorage.getItem(ADJ_SCROLL_TOP_PATH_KEY)
    if (!v || normalizePathname(v) !== cur) return false
    sessionStorage.removeItem(ADJ_SCROLL_TOP_PATH_KEY)
    return true
  } catch {
    return false
  }
}

/** Drop stale adjacent scroll-top marker without scrolling (e.g. hash navigation). */
export function clearAdjacentNavScrollToTopMarker() {
  try {
    sessionStorage.removeItem(ADJ_SCROLL_TOP_PATH_KEY)
  } catch {
    /* ignore */
  }
}
