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
      <p className="text-mf-caption font-medium uppercase leading-snug tracking-wide text-mf-muted dark:text-muted-foreground">
        {label}
      </p>
      <div className="mt-auto min-w-0 pt-3">
        <p className="break-words text-mf-metric font-semibold tabular-nums text-mf-ink dark:text-foreground">
          {value}
          {unit ? (
            <span className="text-mf-card-title font-medium text-mf-muted dark:text-muted-foreground"> {unit}</span>
          ) : null}
        </p>
        {delta ? (
          <p className="mt-1 text-mf-caption text-mf-secondary dark:text-secondary">{delta}</p>
        ) : null}
      </div>
    </div>
  )
}
