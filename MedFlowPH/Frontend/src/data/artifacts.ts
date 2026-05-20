/** Run-aware artifact URLs: static public files vs workbench API. */

import { apiUrl } from '../api/baseUrl'

export type RunId = string

export const THESIS_FINAL_RUN_ID = 'thesis-final'

export function isThesisFinal(runId: RunId): boolean {
  return runId === THESIS_FINAL_RUN_ID
}

/**
 * Resolve a manifest path (e.g. `/data/05/...` or `/results/06/...`) for a run.
 * thesis-final keeps existing static `public/` URLs; other runs use the FastAPI artifact route.
 */
export function getArtifactUrl(runId: RunId, manifestPath: string): string {
  if (isThesisFinal(runId)) {
    return manifestPath.startsWith('/') ? manifestPath : `/${manifestPath}`
  }

  let rel = manifestPath.startsWith('/') ? manifestPath.slice(1) : manifestPath
  for (const prefix of ['data/', 'results/', 'output_source/']) {
    if (rel.startsWith(prefix)) {
      rel = rel.slice(prefix.length)
      break
    }
  }
  return apiUrl(`/api/runs/${encodeURIComponent(runId)}/artifacts/${rel}`)
}

/** Resolve manifest image or interactive HTML paths for the active run. */
export function getManifestAssetUrl(runId: RunId, manifestSrc: string): string {
  return getArtifactUrl(runId, manifestSrc)
}
