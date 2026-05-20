import { ChevronDown } from 'lucide-react'
import { useEffect, useId, useRef, useState } from 'react'

type QuarterFilterDropdownProps = {
  years: readonly number[]
  quarterKeySet: ReadonlySet<string>
  quarterKey: string | null
  quarterPresets: readonly string[]
  onQuarterKeyChange: (key: string | null) => void
}

function formatQuarterLabel(key: string): string {
  return key.replace('-', ' ')
}

export function QuarterFilterDropdown({
  years,
  quarterKeySet,
  quarterKey,
  quarterPresets,
  onQuarterKeyChange,
}: QuarterFilterDropdownProps) {
  const [open, setOpen] = useState(false)
  const rootRef = useRef<HTMLDivElement>(null)
  const triggerRef = useRef<HTMLButtonElement>(null)
  const menuId = useId()

  const quarterlyViewOn = quarterKey !== null

  useEffect(() => {
    if (!quarterlyViewOn) setOpen(false)
  }, [quarterlyViewOn])

  useEffect(() => {
    if (!open) return
    function onDocMouseDown(e: MouseEvent) {
      if (!rootRef.current?.contains(e.target as Node)) setOpen(false)
    }
    function onKeyDown(e: KeyboardEvent) {
      if (e.key === 'Escape') {
        setOpen(false)
        triggerRef.current?.focus()
      }
    }
    document.addEventListener('mousedown', onDocMouseDown)
    document.addEventListener('keydown', onKeyDown)
    return () => {
      document.removeEventListener('mousedown', onDocMouseDown)
      document.removeEventListener('keydown', onKeyDown)
    }
  }, [open])

  function selectQuarter(key: string) {
    onQuarterKeyChange(key)
    setOpen(false)
  }

  return (
    <div className="rounded-2xl border border-border bg-card p-4 shadow-sm transition-shadow duration-200 hover:shadow-md">
      <div className="flex flex-wrap items-center justify-between gap-x-4 gap-y-2">
        <div className="min-w-0 flex-1">
          <p className="text-sm font-medium text-muted-foreground">Quarter filter</p>
          <p className="mt-0.5 text-xs leading-snug text-muted-foreground">
            Grouped by year — open the menu to pick a quarter, or turn quarterly view off.
          </p>
        </div>
        <button
          type="button"
          role="switch"
          aria-checked={quarterlyViewOn}
          aria-label={
            quarterlyViewOn ? 'Quarterly view on; click to turn off' : 'Quarterly view off; click to turn on'
          }
          className="flex shrink-0 cursor-pointer items-center gap-2 rounded-lg border border-primary/25 bg-primary/5 px-2 py-1 shadow-sm transition-colors hover:border-primary/40 hover:bg-primary/10 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-1 focus-visible:ring-offset-background dark:border-primary/35 dark:bg-primary/10 dark:hover:bg-primary/15"
          onClick={() =>
            onQuarterKeyChange(quarterlyViewOn ? null : (quarterPresets[0] ?? null))
          }
        >
          <span className="text-[11px] font-medium text-foreground">Quarterly view</span>
          <span
            className={`relative inline-flex h-5 w-9 shrink-0 rounded-full border border-transparent transition-colors ${
              quarterlyViewOn ? 'bg-primary' : 'bg-muted-foreground/35'
            }`}
            aria-hidden
          >
            <span
              className={`absolute top-0.5 h-3.5 w-3.5 rounded-full bg-card shadow-sm transition-[left] duration-200 ease-out ${
                quarterlyViewOn ? 'left-[calc(100%-1.125rem)]' : 'left-0.5'
              }`}
            />
          </span>
          <span
            className={`min-w-[1.25rem] text-[10px] font-semibold tabular-nums ${
              quarterlyViewOn ? 'text-primary' : 'text-muted-foreground'
            }`}
          >
            {quarterlyViewOn ? 'On' : 'Off'}
          </span>
        </button>
      </div>

      <div ref={rootRef} className="relative mt-3">
        <button
          ref={triggerRef}
          type="button"
          aria-haspopup="listbox"
          aria-expanded={open}
          aria-controls={menuId}
          disabled={!quarterlyViewOn}
          onClick={() => quarterlyViewOn && setOpen((v) => !v)}
          className={`flex w-full items-center justify-between gap-3 rounded-lg border px-3 py-2.5 text-left text-sm font-semibold transition-all duration-200 ${
            quarterlyViewOn
              ? 'border-border bg-muted/30 text-foreground hover:border-primary/40 hover:bg-muted/50 hover:shadow-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring'
              : 'cursor-not-allowed border-border/60 bg-muted/20 text-muted-foreground opacity-70'
          }`}
        >
          <span className="truncate">
            {quarterKey ? formatQuarterLabel(quarterKey) : 'Select quarter…'}
          </span>
          <ChevronDown
            className={`h-4 w-4 shrink-0 text-muted-foreground ${open ? 'rotate-180 text-primary' : ''}`}
            aria-hidden
          />
        </button>

        {open ? (
        <div
          id={menuId}
          role="listbox"
          aria-label="Quarter by year"
          className="absolute left-0 right-0 z-40 mt-2 overflow-hidden rounded-xl border border-[color:var(--dropdown-border)] bg-[color:var(--dropdown-bg)] shadow-[var(--dropdown-shadow)] ring-1 ring-[color:var(--dropdown-ring)] backdrop-blur-md"
        >
          <div className="max-h-[min(50vh,20rem)] overflow-y-auto p-3">
            <div className="grid grid-cols-1 gap-2 sm:grid-cols-2 lg:grid-cols-3">
              {years.map((year) => (
                <div
                  key={year}
                  className="flex min-w-0 items-center gap-2 rounded-lg border border-border/60 bg-muted/20 px-2.5 py-1.5 transition-all duration-200 hover:border-primary/35 hover:bg-muted/45 hover:shadow-sm"
                >
                  <span className="w-9 shrink-0 text-xs font-bold tabular-nums text-foreground">{year}</span>
                  <div className="flex min-w-0 flex-1 flex-wrap items-center gap-x-1 gap-y-0.5">
                    {[1, 2, 3, 4].map((q) => {
                      const key = `${year}-Q${q}`
                      const exists = quarterKeySet.has(key)
                      const active = quarterKey === key
                      return (
                        <span
                          key={key}
                          className={`inline-flex items-center gap-px ${exists ? '' : 'opacity-40'}`}
                        >
                          <span className="select-none text-[10px] text-muted-foreground" aria-hidden>
                            [
                          </span>
                          <button
                            type="button"
                            role="option"
                            aria-selected={active}
                            disabled={!exists}
                            className={`min-w-[1.5rem] rounded-sm px-1 py-px text-center text-[11px] font-bold tabular-nums leading-tight transition-all duration-150 ${
                              !exists
                                ? 'cursor-not-allowed text-muted-foreground/50'
                                : active
                                  ? 'bg-mf-secondary text-primary-foreground shadow-sm'
                                  : 'text-foreground hover:scale-105 hover:bg-primary/15 hover:text-primary'
                            }`}
                            onClick={() => exists && selectQuarter(key)}
                          >
                            Q{q}
                          </button>
                          <span className="select-none text-[10px] text-muted-foreground" aria-hidden>
                            ]
                          </span>
                        </span>
                      )
                    })}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
        ) : null}
      </div>
    </div>
  )
}
