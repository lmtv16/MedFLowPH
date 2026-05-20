import { useCallback, useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { listRuns, type RunRecord } from '../../api/workbench'
import { THESIS_FINAL_RUN_ID } from '../../data/artifacts'
import { WorkbenchLayout } from './WorkbenchLayout'

export function WorkbenchCompare() {
  const [runs, setRuns] = useState<RunRecord[]>([])
  const [loading, setLoading] = useState(true)

  const load = useCallback(async () => {
    setLoading(true)
    try {
      const all = await listRuns()
      setRuns(all.filter((r) => r.id !== THESIS_FINAL_RUN_ID || all.length === 1))
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    void load()
  }, [load])

  return (
    <WorkbenchLayout
      title="Compare experiments"
      subtitle="Weka Experimenter–style table across K-selection runs (silhouette and chosen K)."
      actions={
        <Link
          to="/workbench"
          className="rounded-full border border-border px-4 py-2 text-sm font-medium hover:bg-muted"
        >
          Back to workbench
        </Link>
      }
    >
      <section className="overflow-hidden rounded-xl border border-border bg-card shadow-sm">
        <table className="w-full text-left text-sm">
          <thead className="border-b border-border bg-muted/50 text-mf-caption uppercase tracking-wide text-muted-foreground">
            <tr>
              <th className="px-4 py-3 font-semibold">Run</th>
              <th className="px-4 py-3 font-semibold">K</th>
              <th className="px-4 py-3 font-semibold">Silhouette</th>
              <th className="px-4 py-3 font-semibold">Noise %</th>
              <th className="px-4 py-3 font-semibold">K range</th>
              <th className="px-4 py-3 font-semibold">Status</th>
            </tr>
          </thead>
          <tbody>
            {loading && (
              <tr>
                <td colSpan={6} className="px-4 py-8 text-center text-muted-foreground">
                  Loading…
                </td>
              </tr>
            )}
            {!loading &&
              runs.map((run) => {
                const params = run.params as Record<string, number> | undefined
                return (
                  <tr key={run.id} className="border-b border-border last:border-0">
                    <td className="px-4 py-3">
                      <Link
                        to={`/workbench/runs/${run.id}`}
                        className="font-medium text-primary hover:underline"
                      >
                        {run.label || run.id}
                      </Link>
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
                    <td className="px-4 py-3 tabular-nums text-muted-foreground">
                      {params?.k_min != null && params?.k_max != null
                        ? `${params.k_min}–${params.k_max}`
                        : '—'}
                    </td>
                    <td className="px-4 py-3 capitalize">{run.status}</td>
                  </tr>
                )
              })}
          </tbody>
        </table>
      </section>
    </WorkbenchLayout>
  )
}
