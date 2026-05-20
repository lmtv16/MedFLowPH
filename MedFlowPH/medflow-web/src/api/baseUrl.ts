/** Optional API origin for split deploy (`VITE_API_BASE_URL`). Empty = same-origin `/api`. */

const raw = import.meta.env.VITE_API_BASE_URL ?? ''

export const apiBaseUrl = raw.replace(/\/$/, '')

export function apiUrl(path: string): string {
  const normalized = path.startsWith('/') ? path : `/${path}`
  return apiBaseUrl ? `${apiBaseUrl}${normalized}` : normalized
}
