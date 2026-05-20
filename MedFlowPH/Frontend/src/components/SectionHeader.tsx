import type { LucideIcon } from 'lucide-react'

type SectionHeaderProps = {
  title: string
  subtitle?: string
  icon?: LucideIcon
}

export function SectionHeader({ title, subtitle, icon: Icon }: SectionHeaderProps) {
  return (
    <header className="mb-6 border-l-4 border-primary pl-4">
      <div className="flex items-center gap-2">
        {Icon ? <Icon className="h-5 w-5 shrink-0 text-primary" aria-hidden /> : null}
        <h2 className="font-heading text-mf-section font-semibold text-foreground">{title}</h2>
      </div>
      {subtitle ? (
        <p className="mt-1.5 text-mf-caption text-muted-foreground">{subtitle}</p>
      ) : null}
    </header>
  )
}
