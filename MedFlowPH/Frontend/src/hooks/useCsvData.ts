import { useEffect, useState } from 'react'
import Papa from 'papaparse'
import { getArtifactUrl, THESIS_FINAL_RUN_ID, type RunId } from '../data/artifacts'

/**
 * Fetches a CSV from `/public/data/` (or any path starting with `/`) and returns parsed rows.
 * Pass `runId` to load artifacts from a workbench experiment (default: frozen thesis baseline).
 */
export function useCsvData(filename: string, runId: RunId = THESIS_FINAL_RUN_ID) {
  const [data, setData] = useState<Record<string, string>[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<Error | null>(null)

  useEffect(() => {
    let cancelled = false
    const url = getArtifactUrl(
      runId,
      filename.startsWith('/') ? filename : `/data/${filename}`,
    )

    setLoading(true)
    setError(null)

    fetch(url)
      .then((res) => {
        if (!res.ok) throw new Error(`Failed to load ${url}`)
        return res.text()
      })
      .then((text) => {
        if (cancelled) return
        const parsed = Papa.parse<Record<string, string>>(text, {
          header: true,
          skipEmptyLines: true,
        })
        setData(parsed.data)
      })
      .catch((e: unknown) => {
        if (!cancelled) setError(e instanceof Error ? e : new Error(String(e)))
      })
      .finally(() => {
        if (!cancelled) setLoading(false)
      })

    return () => {
      cancelled = true
    }
  }, [filename, runId])

  return { data, loading, error }
}

export function useTextData(url: string, runId: RunId = THESIS_FINAL_RUN_ID) {
  const [text, setText] = useState<string | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<Error | null>(null)

  useEffect(() => {
    let cancelled = false
    const resolved = getArtifactUrl(runId, url.startsWith('/') ? url : `/data/${url}`)

    setLoading(true)
    setError(null)

    fetch(resolved)
      .then((res) => {
        if (!res.ok) throw new Error(`Failed to load ${resolved}`)
        return res.text()
      })
      .then((body) => {
        if (!cancelled) setText(body)
      })
      .catch((e: unknown) => {
        if (!cancelled) setError(e instanceof Error ? e : new Error(String(e)))
      })
      .finally(() => {
        if (!cancelled) setLoading(false)
      })

    return () => {
      cancelled = true
    }
  }, [url, runId])

  return { text, loading, error }
}

export function useJsonData<T>(url: string, runId: RunId = THESIS_FINAL_RUN_ID) {
  const [data, setData] = useState<T | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<Error | null>(null)

  useEffect(() => {
    let cancelled = false
    const resolved = getArtifactUrl(runId, url.startsWith('/') ? url : url)
    setLoading(true)
    setError(null)

    fetch(resolved)
      .then((res) => {
        if (!res.ok) throw new Error(`Failed to load ${resolved}`)
        return res.json() as Promise<T>
      })
      .then((json) => {
        if (!cancelled) setData(json)
      })
      .catch((e: unknown) => {
        if (!cancelled) setError(e instanceof Error ? e : new Error(String(e)))
      })
      .finally(() => {
        if (!cancelled) setLoading(false)
      })

    return () => {
      cancelled = true
    }
  }, [url, runId])

  return { data, loading, error }
}
