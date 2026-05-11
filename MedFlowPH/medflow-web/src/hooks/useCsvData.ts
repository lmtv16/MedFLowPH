import { useEffect, useState } from 'react'
import Papa from 'papaparse'

/**
 * Fetches a CSV from `/public/data/` (or any path starting with `/`) and returns parsed rows.
 */
export function useCsvData(filename: string) {
  const [data, setData] = useState<Record<string, string>[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<Error | null>(null)

  useEffect(() => {
    let cancelled = false
    const url = filename.startsWith('/') ? filename : `/data/${filename}`

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
  }, [filename])

  return { data, loading, error }
}

export function useTextData(url: string) {
  const [text, setText] = useState<string | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<Error | null>(null)

  useEffect(() => {
    let cancelled = false
    const resolved = url.startsWith('/') ? url : `/data/${url}`

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
  }, [url])

  return { text, loading, error }
}

export function useJsonData<T>(url: string) {
  const [data, setData] = useState<T | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<Error | null>(null)

  useEffect(() => {
    let cancelled = false
    setLoading(true)
    setError(null)

    fetch(url)
      .then((res) => {
        if (!res.ok) throw new Error(`Failed to load ${url}`)
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
  }, [url])

  return { data, loading, error }
}
