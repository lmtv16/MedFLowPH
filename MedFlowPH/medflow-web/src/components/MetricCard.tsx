type MetricCardProps = {
  label: string
  value: string
  unit?: string
  delta?: string
  highlight?: boolean
  className?: string
}

export function MetricCard({ label, value, unit, delta, highlight, className = '' }: MetricCardProps) {
  return (
    <div
      className={[
        'flex h-full min-h-[7.5rem] min-w-0 flex-col rounded-2xl border bg-white p-4 shadow-sm sm:p-5',
        highlight ? 'border-mf-primary ring-2 ring-blue-100 dark:ring-primary/30' : 'border-slate-200 dark:border-border',
        className,
      ].join(' ')}
    >
      <p className="text-[11px] font-medium uppercase leading-snug tracking-wide text-mf-muted sm:text-xs">{label}</p>
      <div className="mt-auto min-w-0 pt-3">
        <p className="break-words text-2xl font-semibold tabular-nums text-mf-ink sm:text-3xl">
          {value}
          {unit ? <span className="text-lg font-medium text-mf-muted"> {unit}</span> : null}
        </p>
        {delta ? <p className="mt-1 text-xs text-mf-secondary">{delta}</p> : null}
      </div>
    </div>
  )
}
