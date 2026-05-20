import { lazy, Suspense, useEffect, useState } from 'react'
import { Link, useParams } from 'react-router-dom'
import { getRun, getRunStatus, type RunRecord } from '../../api/workbench'
import { ClusterDisclaimer } from '../../components/ClusterDisclaimer'
import { PageRouteFallback } from '../../components/PageRouteFallback'
import { RunProvider } from '../../context/RunContext'
import { DATA_PATHS } from '../../data/fileManifest'
import { useJsonData } from '../../hooks/useCsvData'
import { WorkbenchLayout } from './WorkbenchLayout'

const Evaluation = lazy(() => import('../Evaluation').then((m) => ({ default: m.Evaluation })))
const Interpretation = lazy(() =>
  import('../Interpretation').then((m) => ({ default: m.Interpretation })),
)
const Comparison = lazy(() => import('../Comparison').then((m) => ({ default: m.Comparison })))

type TabId = 'snapshot' | 'evaluation' | 'interpretation' | 'comparison'

type KSelectionSummary = {
  chosen_k?: number
  metrics_per_k?: Array<{ k: number; silhouette?: number }>
}

function RunSnapshot({
  run,
  runId,
  logTail,
}: {
  run: RunRecord | null
  runId: string
  logTail: string
}) {
  const { data: kSummary, loading: kLoading } = useJsonData<KSelectionSummary>(
    DATA_PATHS.kSelectionSummary,
    runId,
  )

  return (
    <section className="space-y-6">
      <ClusterDisclaimer />
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <article className="rounded-xl border border-border bg-card p-4 shadow-sm">
          <p className="text-mf-caption text-muted-foreground">Chosen K</p>
          <p className="mt-1 text-2xl font-bold tabular-nums">
            {kSummary?.chosen_k ?? run?.summary?.chosen_k ?? '—'}
          </p>
        </article>
        <article className="rounded-xl border border-border bg-card p-4 shadow-sm">
          <p className="text-mf-caption text-muted-foreground">Silhouette</p>
          <p className="mt-1 text-2xl font-bold tabular-nums">
            {run?.summary?.silhouette != null ? run.summary.silhouette.toFixed(4) : '—'}
          </p>
        </article>
        <article className="rounded-xl border border-border bg-card p-4 shadow-sm">
          <p className="text-mf-caption text-muted-foreground">DBSCAN noise share</p>
          <p className="mt-1 text-2xl font-bold tabular-nums">
            {run?.summary?.dbscan_noise_share != null
              ? `${(run.summary.dbscan_noise_share * 100).toFixed(1)}%`
              : '—'}
          </p>
        </article>
        <article className="rounded-xl border border-border bg-card p-4 shadow-sm">
          <p className="text-mf-caption text-muted-foreground">Status</p>
          <p className="mt-1 text-lg font-semibold capitalize">{run?.status ?? '—'}</p>
        </article>
      </div>

      <section className="rounded-xl border border-border bg-card p-6 shadow-sm">
        <h2 className="text-lg font-semibold">K-selection summary</h2>
        {kLoading && <p className="mt-2 text-sm text-muted-foreground">Loading…</p>}
        {!kLoading && kSummary && (
          <pre className="mt-3 max-h-64 overflow-auto rounded-lg bg-muted/50 p-4 text-xs">
            {JSON.stringify(kSummary, null, 2)}
          </pre>
        )}
      </section>

      {logTail && (
        <section className="rounded-xl border border-border bg-card p-6 shadow-sm">
          <h2 className="text-lg font-semibold">Pipeline log</h2>
          <pre className="mt-3 max-h-48 overflow-auto rounded-lg bg-muted/50 p-4 text-xs whitespace-pre-wrap">
            {logTail}
          </pre>
        </section>
      )}
    </section>
  )
}

export function WorkbenchRunDetail() {
  const { runId = '' } = useParams()
  const [tab, setTab] = useState<TabId>('snapshot')
  const [run, setRun] = useState<RunRecord | null>(null)
  const [logTail, setLogTail] = useState('')
  const [pollError, setPollError] = useState<string | null>(null)

  useEffect(() => {
    if (!runId) return
    let cancelled = false

    async function poll() {
      try {
        const [r, st] = await Promise.all([getRun(runId), getRunStatus(runId)])
        if (cancelled) return
        setRun(r)
        setLogTail(st.log_tail ?? '')
        setPollError(null)
        if (st.status === 'running' || st.status === 'queued') {
          window.setTimeout(() => void poll(), 2500)
        }
      } catch (e) {
        if (!cancelled) setPollError(e instanceof Error ? e.message : String(e))
      }
    }

    void poll()
    return () => {
      cancelled = true
    }
  }, [runId])

  const tabs: { id: TabId; label: string }[] = [
    { id: 'snapshot', label: 'Snapshot' },
    { id: 'evaluation', label: 'Evaluation' },
    { id: 'interpretation', label: 'Interpretation' },
    { id: 'comparison', label: 'Comparison' },
  ]

  return (
    <RunProvider runId={runId}>
      <WorkbenchLayout
        title={run?.label || runId}
        subtitle={`Run ${runId} — ${run?.status ?? '…'}${run?.current_step ? ` · ${run.current_step}` : ''}`}
        actions={
          <Link
            to="/workbench"
            className="rounded-full border border-border px-4 py-2 text-sm font-medium hover:bg-muted"
          >
            All experiments
          </Link>
        }
      >
        {pollError && (
          <p className="rounded-lg border border-destructive/30 bg-destructive/10 px-4 py-3 text-sm text-destructive">
            {pollError}
          </p>
        )}
        {run?.error_message && (
          <p className="rounded-lg border border-destructive/30 bg-destructive/10 px-4 py-3 text-sm text-destructive">
            {run.error_message}
          </p>
        )}

        <nav className="flex flex-wrap gap-2 border-b border-border pb-2">
          {tabs.map((t) => (
            <button
              key={t.id}
              type="button"
              onClick={() => setTab(t.id)}
              className={[
                'rounded-full px-4 py-1.5 text-sm font-medium',
                tab === t.id
                  ? 'bg-primary text-primary-foreground'
                  : 'text-muted-foreground hover:bg-muted',
              ].join(' ')}
            >
              {t.label}
            </button>
          ))}
        </nav>

        {tab === 'snapshot' && <RunSnapshot run={run} runId={runId} logTail={logTail} />}

        {tab !== 'snapshot' && run?.status !== 'completed' && (
          <p className="text-sm text-muted-foreground">
            Results tabs unlock when the run completes. Current status: {run?.status ?? 'unknown'}.
          </p>
        )}

        {tab === 'evaluation' && run?.status === 'completed' && (
          <Suspense fallback={<PageRouteFallback />}>
            <Evaluation />
          </Suspense>
        )}
        {tab === 'interpretation' && run?.status === 'completed' && (
          <Suspense fallback={<PageRouteFallback />}>
            <Interpretation />
          </Suspense>
        )}
        {tab === 'comparison' && run?.status === 'completed' && (
          <Suspense fallback={<PageRouteFallback />}>
            <Comparison />
          </Suspense>
        )}
      </WorkbenchLayout>
    </RunProvider>
  )
}
