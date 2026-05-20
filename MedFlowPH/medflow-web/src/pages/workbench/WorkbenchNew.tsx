import { ChevronLeft, ChevronRight } from 'lucide-react'
import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { createRunWithUpload } from '../../api/workbench'
import { ClusterDisclaimer } from '../../components/ClusterDisclaimer'
import { WorkbenchLayout } from './WorkbenchLayout'

const STEPS = ['Dataset', 'Preprocessing', 'Methods', 'Hyperparameters', 'Run'] as const

export function WorkbenchNew() {
  const navigate = useNavigate()
  const [step, setStep] = useState(0)

  const [label, setLabel] = useState('')
  const [useBundled, setUseBundled] = useState(true)
  const [uploadFile, setUploadFile] = useState<File | null>(null)

  const [enablePca, setEnablePca] = useState(true)
  const [enableKmeans, setEnableKmeans] = useState(true)
  const [enableDbscan, setEnableDbscan] = useState(false)
  const [pipelineMode, setPipelineMode] = useState<'full' | 'quick'>('quick')

  const [kMin, setKMin] = useState(2)
  const [kMax, setKMax] = useState(7)
  const [metricsSubsample, setMetricsSubsample] = useState(80_000)
  const [pcaMatrix, setPcaMatrix] = useState<'base' | 'theme' | 'scaled'>('base')
  const [dbscanEps, setDbscanEps] = useState('')
  const [dbscanMinSamples, setDbscanMinSamples] = useState('')

  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)

  async function handleRun() {
    setSubmitting(true)
    setError(null)
    try {
      const run = await createRunWithUpload(
        {
          label: label.trim() || undefined,
          use_bundled_dataset: useBundled,
          pipeline_mode: pipelineMode,
          enable_pca: enablePca,
          enable_kmeans: enableKmeans,
          enable_dbscan: enableDbscan,
          enable_comparison: enableDbscan && enableKmeans,
          k_min: kMin,
          k_max: kMax,
          metrics_subsample: metricsSubsample,
          pca_matrix: pcaMatrix,
          dbscan_eps: dbscanEps ? Number(dbscanEps) : undefined,
          dbscan_min_samples: dbscanMinSamples ? Number(dbscanMinSamples) : undefined,
          random_state: 42,
        },
        useBundled ? null : uploadFile,
      )
      navigate(`/workbench/runs/${run.id}`)
    } catch (err) {
      setError(err instanceof Error ? err.message : String(err))
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <WorkbenchLayout
      title="New experiment"
      subtitle="Upload → cleaning → feature extraction → PCA & clustering → visualization"
    >
      <nav className="flex flex-wrap gap-2" aria-label="Wizard steps">
        {STEPS.map((name, i) => (
          <button
            key={name}
            type="button"
            onClick={() => setStep(i)}
            className={[
              'rounded-full px-3 py-1 text-xs font-semibold transition-colors',
              i === step
                ? 'bg-primary text-primary-foreground'
                : i < step
                  ? 'bg-primary/15 text-primary'
                  : 'bg-muted text-muted-foreground',
            ].join(' ')}
          >
            {i + 1}. {name}
          </button>
        ))}
      </nav>

      <ClusterDisclaimer />

      {step === 0 && (
        <fieldset className="space-y-4 rounded-xl border border-border bg-card p-6 shadow-sm">
          <legend className="text-sm font-semibold">1. Dataset</legend>
          <label className="flex items-start gap-3 text-sm">
            <input
              type="radio"
              name="dataset"
              checked={useBundled}
              onChange={() => setUseBundled(true)}
            />
            <span>
              <strong>Use bundled PhilGEPS medical dataset</strong> (487,605 rows after cleaning).
              Copies baseline cleaned features when raw files are not present locally.
            </span>
          </label>
          <label className="flex items-start gap-3 text-sm">
            <input
              type="radio"
              name="dataset"
              checked={!useBundled}
              onChange={() => setUseBundled(false)}
            />
            <span>
              <strong>Upload CSV or ZIP</strong> — stored under this run&apos;s raw folder (full
              cleaning when raw PhilGEPS tree is included in the archive).
            </span>
          </label>
          {!useBundled && (
            <input
              type="file"
              accept=".csv,.zip"
              onChange={(e) => setUploadFile(e.target.files?.[0] ?? null)}
              className="block w-full text-sm"
            />
          )}
          <label className="flex items-center gap-2 text-sm">
            <input
              type="checkbox"
              checked={pipelineMode === 'quick'}
              onChange={(e) => setPipelineMode(e.target.checked ? 'quick' : 'full')}
            />
            Quick mode: K-selection only (seeds steps 01–03 from baseline)
          </label>
          {pipelineMode === 'full' && enableKmeans && (
            <p className="rounded-lg border border-border bg-muted/40 px-3 py-2 text-xs text-muted-foreground">
              Full pipeline with K-means needs baseline PCA artifacts (
              <code className="text-[11px]">results/03/Clustering</code>) or a PCA re-run.
              Without local raw PhilGEPS data, the API seeds cleaned outputs from the thesis baseline.
            </p>
          )}
        </fieldset>
      )}

      {step === 1 && (
        <fieldset className="space-y-3 rounded-xl border border-border bg-card p-6 text-sm shadow-sm">
          <legend className="font-semibold">2. Preprocessing (steps 01–02)</legend>
          <p className="text-muted-foreground">
            <strong>Step 01 — Cleaning:</strong> medical keyword filter on PhilGEPS records, dtype
            normalization, deduplication, imputation, yearly EDA summaries.
          </p>
          <p className="text-muted-foreground">
            <strong>Step 02 — Feature extraction:</strong> feature selection, min–max scaling, one-hot
            encoding of categorical fields, policy theme scores for clustering-ready numerics.
          </p>
          {useBundled && pipelineMode === 'full' && (
            <p className="rounded-lg bg-muted/50 px-3 py-2 text-muted-foreground">
              When bundled raw PhilGEPS years exist under the repo, Full mode runs cleaning →
              preprocessing → PCA. Otherwise it seeds steps 01–03 (including{' '}
              <code className="text-xs">results/03</code>) from the thesis baseline, then runs your
              selected modeling steps.
            </p>
          )}
        </fieldset>
      )}

      {step === 2 && (
        <fieldset className="space-y-3 rounded-xl border border-border bg-card p-6 shadow-sm">
          <legend className="text-sm font-semibold">3. Methods</legend>
          <label className="flex items-center gap-2 text-sm">
            <input
              type="checkbox"
              checked={enablePca}
              onChange={(e) => setEnablePca(e.target.checked)}
              disabled={pipelineMode === 'quick'}
            />
            PCA (step 03)
          </label>
          <label className="flex items-center gap-2 text-sm">
            <input
              type="checkbox"
              checked={enableKmeans}
              onChange={(e) => setEnableKmeans(e.target.checked)}
            />
            K-means (steps 05 → 04)
          </label>
          <label className="flex items-center gap-2 text-sm">
            <input
              type="checkbox"
              checked={enableDbscan}
              onChange={(e) => setEnableDbscan(e.target.checked)}
            />
            DBSCAN companion (steps 05B → 04B → 07 comparison)
          </label>
        </fieldset>
      )}

      {step === 3 && (
        <fieldset className="space-y-4 rounded-xl border border-border bg-card p-6 shadow-sm">
          <legend className="text-sm font-semibold">4. Hyperparameters</legend>
          <label className="block text-sm">
            <span className="mb-1 block text-muted-foreground">Experiment label</span>
            <input
              type="text"
              value={label}
              onChange={(e) => setLabel(e.target.value)}
              className="w-full rounded-lg border border-border bg-background px-3 py-2"
            />
          </label>
          <div className="grid gap-4 sm:grid-cols-2">
            <label className="block text-sm">
              <span className="mb-1 block text-muted-foreground">K min</span>
              <input
                type="number"
                min={2}
                value={kMin}
                onChange={(e) => setKMin(Number(e.target.value))}
                className="w-full rounded-lg border border-border bg-background px-3 py-2"
              />
            </label>
            <label className="block text-sm">
              <span className="mb-1 block text-muted-foreground">K max</span>
              <input
                type="number"
                min={kMin}
                value={kMax}
                onChange={(e) => setKMax(Number(e.target.value))}
                className="w-full rounded-lg border border-border bg-background px-3 py-2"
              />
            </label>
          </div>
          <label className="block text-sm">
            <span className="mb-1 block text-muted-foreground">Metrics subsample</span>
            <input
              type="number"
              value={metricsSubsample}
              onChange={(e) => setMetricsSubsample(Number(e.target.value))}
              className="w-full rounded-lg border border-border bg-background px-3 py-2"
            />
          </label>
          <label className="block text-sm">
            <span className="mb-1 block text-muted-foreground">PCA matrix</span>
            <select
              value={pcaMatrix}
              onChange={(e) => setPcaMatrix(e.target.value as 'base' | 'theme' | 'scaled')}
              className="w-full rounded-lg border border-border bg-background px-3 py-2"
            >
              <option value="base">base</option>
              <option value="theme">theme</option>
              <option value="scaled">scaled</option>
            </select>
          </label>
          {enableDbscan && (
            <div className="grid gap-4 sm:grid-cols-2">
              <label className="block text-sm">
                <span className="mb-1 block text-muted-foreground">DBSCAN eps (optional)</span>
                <input
                  type="text"
                  value={dbscanEps}
                  onChange={(e) => setDbscanEps(e.target.value)}
                  placeholder="default grid"
                  className="w-full rounded-lg border border-border bg-background px-3 py-2"
                />
              </label>
              <label className="block text-sm">
                <span className="mb-1 block text-muted-foreground">min_samples (optional)</span>
                <input
                  type="text"
                  value={dbscanMinSamples}
                  onChange={(e) => setDbscanMinSamples(e.target.value)}
                  placeholder="default grid"
                  className="w-full rounded-lg border border-border bg-background px-3 py-2"
                />
              </label>
            </div>
          )}
        </fieldset>
      )}

      {step === 4 && (
        <fieldset className="space-y-3 rounded-xl border border-border bg-card p-6 text-sm shadow-sm">
          <legend className="font-semibold">5. Run</legend>
          <p>
            Pipeline:{' '}
            {pipelineMode === 'quick'
              ? 'seed baseline → K-selection'
              : 'seed or clean → preprocess → PCA → K-selection → K-means fit'}
            {enableDbscan ? ' → DBSCAN grid → DBSCAN fit → comparison' : ''}
          </p>
          <p className="text-muted-foreground">
            Default order when running full analysis: 01 → 02 → 03 → 05 → 04
            {enableDbscan ? ' → 05B → 04B → 07' : ''}. Random state = 42; K-means n_init = 10.
          </p>
        </fieldset>
      )}

      {error && (
        <p className="rounded-lg border border-destructive/30 bg-destructive/10 px-4 py-3 text-sm text-destructive">
          {error}
        </p>
      )}

      <section className="flex flex-wrap justify-between gap-3">
        <button
          type="button"
          disabled={step === 0}
          onClick={() => setStep((s) => Math.max(0, s - 1))}
          className="inline-flex items-center gap-1 rounded-full border border-border px-4 py-2 text-sm disabled:opacity-40"
        >
          <ChevronLeft className="h-4 w-4" aria-hidden />
          Back
        </button>
        {step < STEPS.length - 1 ? (
          <button
            type="button"
            onClick={() => setStep((s) => Math.min(STEPS.length - 1, s + 1))}
            className="inline-flex items-center gap-1 rounded-full bg-primary px-5 py-2 text-sm font-semibold text-primary-foreground"
          >
            Next
            <ChevronRight className="h-4 w-4" aria-hidden />
          </button>
        ) : (
          <button
            type="button"
            disabled={submitting || (!useBundled && !uploadFile)}
            onClick={() => void handleRun()}
            className="rounded-full bg-primary px-5 py-2.5 text-sm font-semibold text-primary-foreground disabled:opacity-60"
          >
            {submitting ? 'Starting…' : 'Run pipeline'}
          </button>
        )}
        <Link
          to="/workbench"
          className="rounded-full border border-border px-4 py-2 text-sm font-medium hover:bg-muted"
        >
          Cancel
        </Link>
      </section>
    </WorkbenchLayout>
  )
}
