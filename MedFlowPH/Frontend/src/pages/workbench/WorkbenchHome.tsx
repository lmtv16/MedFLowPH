import { FlaskConical, Plus, RefreshCw } from 'lucide-react'
import { useCallback, useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { listRuns, type RunRecord } from '../../api/workbench'
import { THESIS_FINAL_RUN_ID } from '../../data/artifacts'
import { WorkbenchLayout } from './WorkbenchLayout'

function statusBadge(status: string) {
  const base = 'inline-flex rounded-full px-2.5 py-0.5 text-xs font-medium'
  switch (status) {
    case 'completed':
      return `${base} bg-emerald-100 text-emerald-800 dark:bg-emerald-900/40 dark:text-emerald-200`
    case 'running':
      return `${base} bg-amber-100 text-amber-900 dark:bg-amber-900/40 dark:text-amber-100`
    case 'failed':
      return `${base} bg-red-100 text-red-800 dark:bg-red-900/40 dark:text-red-200`
    default:
      return `${base} bg-muted text-muted-foreground`
  }
}

export function WorkbenchHome() {
  const [runs, setRuns] = useState<RunRecord[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const load = useCallback(async () => {
    setLoading(true)
    setError(null)
    try {
      setRuns(await listRuns())
    } catch (e) {
      setError(e instanceof Error ? e.message : String(e))
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    void load()
  }, [load])

  return (
    <WorkbenchLayout
      title="MedFlow PH Analytics Workbench"
      subtitle="Run clustering experiments, compare hyperparameters, and explore artifacts per run."
      actions={
        <>
          <Link
            to="/workbench/new"
            className="inline-flex items-center gap-2 rounded-full bg-primary px-4 py-2 text-sm font-semibold text-primary-foreground shadow-sm hover:opacity-90"
          >
            <Plus className="h-4 w-4" aria-hidden />
            New experiment
          </Link>
          <Link
            to="/workbench/compare"
            className="inline-flex items-center gap-2 rounded-full border border-border px-4 py-2 text-sm font-medium hover:bg-muted"
          >
            Compare experiments
          </Link>
          <button
            type="button"
            onClick={() => void load()}
            className="inline-flex items-center gap-2 rounded-full border border-border px-4 py-2 text-sm font-medium hover:bg-muted"
          >
            <RefreshCw className="h-4 w-4" aria-hidden />
            Refresh
          </button>
        </>
      }
    >
      {error && (
        <p className="rounded-lg border border-destructive/30 bg-destructive/10 px-4 py-3 text-sm text-destructive">
          API unavailable: {error}. Start the backend with{' '}
          <code className="text-xs">uvicorn main:app --reload --port 8000</code> from{' '}
          <code className="text-xs">MedFlowPH/Backend</code>.
        </p>
      )}

      <section className="overflow-hidden rounded-xl border border-border bg-card shadow-sm">
        <table className="w-full text-left text-sm">
          <thead className="border-b border-border bg-muted/50 text-mf-caption uppercase tracking-wide text-muted-foreground">
            <tr>
              <th className="px-4 py-3 font-semibold">Run</th>
              <th className="px-4 py-3 font-semibold">Status</th>
              <th className="px-4 py-3 font-semibold">K</th>
              <th className="px-4 py-3 font-semibold">Silhouette</th>
              <th className="px-4 py-3 font-semibold">DBSCAN noise</th>
              <th className="px-4 py-3 font-semibold">Created</th>
            </tr>
          </thead>
          <tbody>
            {loading && (
              <tr>
                <td colSpan={6} className="px-4 py-8 text-center text-muted-foreground">
                  Loading runs…
                </td>
              </tr>
            )}
            {!loading &&
              runs.map((run) => (
                <tr key={run.id} className="border-b border-border last:border-0">
                  <td className="px-4 py-3">
                    <Link
                      to={`/workbench/runs/${run.id}`}
                      className="font-medium text-primary hover:underline"
                    >
                      {run.label || run.id}
                    </Link>
                    {run.id === THESIS_FINAL_RUN_ID && (
                      <span className="ml-2 text-xs text-muted-foreground">(baseline)</span>
                    )}
                  </td>
                  <td className="px-4 py-3">
                    <span className={statusBadge(run.status)}>{run.status}</span>
                  </td>
                  <td className="px-4 py-3 tabular-nums">{run.summary?.chosen_k ?? '—'}</td>
                  <td className="px-4 py-3 tabular-nums">
                    {run.summary?.silhouette != null
                      ? run.summary.silhouette.toFixed(4)
                      : '—'}
                  </td>
                  <td className="px-4 py-3 tabular-nums">
                    {run.summary?.dbscan_noise_share != null
                      ? `${(run.summary.dbscan_noise_share * 100).toFixed(1)}%`
                      : '—'}
                  </td>
                  <td className="px-4 py-3 text-muted-foreground">
                    {new Date(run.created_at).toLocaleString()}
                  </td>
                </tr>
              ))}
          </tbody>
        </table>
      </section>

      <p className="flex items-start gap-2 text-sm text-muted-foreground">
        <FlaskConical className="mt-0.5 h-4 w-4 shrink-0" aria-hidden />
        Clusters are decision-support patterns, not proof of medicine shortage. The frozen{' '}
        <strong>thesis-final</strong> run keeps all existing dashboard pages working without the API.
      </p>
    </WorkbenchLayout>
  )
}
