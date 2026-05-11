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
        'flex h-full min-h-[7.5rem] flex-col rounded-2xl border bg-white p-5 shadow-sm',
        highlight ? 'border-mf-primary ring-2 ring-blue-100' : 'border-slate-200',
        className,
      ].join(' ')}
    >
      <p className="text-xs font-medium uppercase leading-snug tracking-wide text-mf-muted">{label}</p>
      <div className="mt-auto pt-3">
        <p className="text-3xl font-semibold tabular-nums text-mf-ink">
          {value}
          {unit ? <span className="text-lg font-medium text-mf-muted"> {unit}</span> : null}
        </p>
        {delta ? <p className="mt-1 text-xs text-mf-secondary">{delta}</p> : null}
      </div>
    </div>
  )
}
