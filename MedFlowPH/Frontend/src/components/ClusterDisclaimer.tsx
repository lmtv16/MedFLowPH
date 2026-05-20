import { AlertCircle } from 'lucide-react'

/** Shared decision-support disclaimer for workbench and interpretation flows. */
export function ClusterDisclaimer({ className = '' }: { className?: string }) {
  return (
    <aside
      className={`flex gap-3 rounded-xl border border-amber-200/80 bg-amber-50/90 px-4 py-3 text-sm text-amber-950 dark:border-amber-900/50 dark:bg-amber-950/30 dark:text-amber-100 ${className}`}
      role="note"
    >
      <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" aria-hidden />
      <p>
        Cluster labels and theme scores are <strong>decision-support signals</strong> from unsupervised
        learning. They do not by themselves prove medicine shortages, oversupply, or procurement failure.
        Use them together with domain review and local context.
      </p>
    </aside>
  )
}
