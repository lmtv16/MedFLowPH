/** Workbench REST client (Vite dev proxy or same-origin / split API base). */

import { apiUrl } from './baseUrl'

export type RunStatus = 'queued' | 'running' | 'completed' | 'failed'

export type RunSummaryMetrics = {
  chosen_k?: number
  silhouette?: number
  dbscan_noise_share?: number
  dbscan_eps?: number
  dbscan_min_samples?: number
}

export type RunRecord = {
  id: string
  status: RunStatus
  label?: string | null
  created_at: string
  updated_at: string
  current_step?: string | null
  error_message?: string | null
  summary?: RunSummaryMetrics | null
  params?: Record<string, unknown> | null
}

export type CreateRunPayload = {
  label?: string
  dataset_id?: string
  use_bundled_dataset?: boolean
  pipeline_mode?: 'full' | 'quick'
  steps?: string[]
  seed_from_baseline?: boolean
  k_min?: number
  k_max?: number
  metrics_subsample?: number
  pca_matrix?: 'base' | 'theme' | 'scaled'
  enable_pca?: boolean
  enable_kmeans?: boolean
  enable_dbscan?: boolean
  enable_comparison?: boolean
  dbscan_eps?: number
  dbscan_min_samples?: number
  random_state?: number
}

async function parseJson<T>(res: Response): Promise<T> {
  if (!res.ok) {
    const text = await res.text()
    throw new Error(text || `Request failed (${res.status})`)
  }
  return res.json() as Promise<T>
}

export async function fetchHealth(): Promise<{ status: string }> {
  return parseJson(await fetch('/health'))
}

export async function listRuns(): Promise<RunRecord[]> {
  return parseJson(await fetch('/api/runs'))
}

export async function getRun(runId: string): Promise<RunRecord> {
  return parseJson(await fetch(`/api/runs/${encodeURIComponent(runId)}`))
}

export async function createRun(payload: CreateRunPayload): Promise<RunRecord> {
  return parseJson(
    await fetch('/api/runs/json', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    }),
  )
}

/** Multipart run creation with optional CSV/ZIP upload. */
export async function createRunWithUpload(
  payload: CreateRunPayload,
  file?: File | null,
): Promise<RunRecord> {
  const form = new FormData()
  form.append('payload', JSON.stringify(payload))
  if (file) form.append('file', file)
  return parseJson(
    await fetch(apiUrl('/api/runs'), {
      method: 'POST',
      body: form,
    }),
  )
}

export type RunStatusResponse = {
  id: string
  status: RunStatus
  current_step?: string | null
  error_message?: string | null
  log_tail?: string
}

export async function getRunStatus(runId: string): Promise<RunStatusResponse> {
  return parseJson(await fetch(apiUrl(`/api/runs/${encodeURIComponent(runId)}/status`)))
}
