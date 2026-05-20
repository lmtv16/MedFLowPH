import type { ReactNode } from 'react'

type WorkbenchLayoutProps = {
  title: string
  subtitle: string
  children: ReactNode
  actions?: ReactNode
}

export function WorkbenchLayout({ title, subtitle, children, actions }: WorkbenchLayoutProps) {
  return (
    <section className="mx-auto max-w-5xl space-y-8 px-4 py-10 sm:px-6">
      <header className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <section>
          <p className="text-mf-caption font-semibold uppercase tracking-wider text-primary">
            Analytics Workbench
          </p>
          <h1 className="mt-1 text-3xl font-bold text-foreground">{title}</h1>
          <p className="mt-2 max-w-2xl text-mf-body text-muted-foreground">{subtitle}</p>
        </section>
        {actions ? <section className="flex flex-wrap gap-3">{actions}</section> : null}
      </header>
      {children}
    </section>
  )
}
