import type { LucideIcon } from 'lucide-react'

type SectionHeaderProps = {
  title: string
  subtitle?: string
  icon?: LucideIcon
}

export function SectionHeader({ title, subtitle, icon: Icon }: SectionHeaderProps) {
  return (
    <header className="mb-6 border-l-4 border-mf-primary pl-4">
      <div className="flex items-center gap-2">
        {Icon ? <Icon className="h-5 w-5 text-mf-primary" aria-hidden /> : null}
        <h2 className="text-xl font-semibold text-mf-ink">{title}</h2>
      </div>
      {subtitle ? <p className="mt-1 text-sm text-mf-muted">{subtitle}</p> : null}
    </header>
  )
}
