import { useMemo } from 'react'

function splitCells(line: string): string[] {
  return line
    .trim()
    .split(/\s{2,}/)
    .map((s) => s.trim())
    .filter(Boolean)
}

function parseSections(text: string) {
  const lines = text.split(/\r?\n/)
  const preamble: string[] = []
  let i = 0
  while (i < lines.length && !/^={10,}$/.test(lines[i].trim())) {
    preamble.push(lines[i])
    i++
  }

  const sections: { heading: string; body: string[] }[] = []
  while (i < lines.length) {
    if (/^={10,}$/.test(lines[i].trim())) {
      i++
      const heading = (lines[i] ?? '').trim()
      i++
      const body: string[] = []
      while (i < lines.length && !/^={10,}$/.test(lines[i].trim())) {
        body.push(lines[i])
        i++
      }
      sections.push({ heading, body })
    } else {
      i++
    }
  }
  return { preamble, sections }
}

function PreambleRows({ lines }: { lines: string[] }) {
  const rows = useMemo(() => {
    const out: { key: string; value: string }[] = []
    for (const line of lines) {
      const t = line.trimEnd()
      if (!t.trim()) continue
      const idx = t.indexOf(':')
      if (idx > 0 && idx < t.length - 1 && !t.startsWith('http')) {
        const key = t.slice(0, idx).trim()
        const value = t.slice(idx + 1).trim()
        out.push({ key, value })
      } else {
        out.push({ key: '', value: t.trim() })
      }
    }
    return out
  }, [lines])

  return (
    <div className="mb-4 overflow-x-auto rounded-lg border border-border">
      <table className="mb-0 w-full min-w-[16rem] border-collapse text-left text-mf-caption text-foreground">
      <tbody>
        {rows.map((r, idx) => (
          <tr key={idx} className="border-b border-border">
            {r.key ? (
              <>
                <th className="whitespace-nowrap px-2 py-2 align-top font-medium text-muted-foreground">
                  {r.key}
                </th>
                <td className="px-2 py-2">{r.value}</td>
              </>
            ) : (
              <td className="px-2 py-2 font-medium text-foreground" colSpan={2}>
                {r.value}
              </td>
            )}
          </tr>
        ))}
      </tbody>
    </table>
    </div>
  )
}

function GenericSectionTable({ heading, body }: { heading: string; body: string[] }) {
  const isSegmentDetail = /SEGMENT DETAIL/i.test(heading)
  const isKMeansRoles = /K-MEANS FEATURE ROLES/i.test(heading)

  const plainBody = body.join('\n')

  if (isSegmentDetail) {
    return (
      <details className="group rounded-lg border border-border bg-card">
        <summary className="cursor-pointer list-none px-3 py-2 text-sm font-medium text-foreground outline-none marker:content-none [&::-webkit-details-marker]:hidden">
          <span className="underline decoration-border underline-offset-2 group-open:no-underline">
            Full segment detail (compact){' '}
            <span className="font-normal text-muted-foreground">— expand</span>
          </span>
        </summary>
        <pre className="max-h-[28rem] overflow-auto border-t border-border p-3 font-mono text-[11px] leading-relaxed text-muted-foreground">
          {plainBody}
        </pre>
      </details>
    )
  }

  if (isKMeansRoles) {
    const rows: { type: 'group' | 'item'; text: string }[] = []
    for (const line of body) {
      const t = line.trimEnd()
      if (!t.trim()) continue
      const tr = t.trim()
      if (/^\[[^\]]+\]$/.test(tr)) {
        rows.push({ type: 'group', text: tr })
      } else if (/^-/.test(tr)) {
        rows.push({ type: 'item', text: tr.replace(/^-\s*/, '') })
      } else if (tr.length > 0) {
        rows.push({ type: 'item', text: tr })
      }
    }
    return (
      <table className="w-full border-collapse text-left text-xs">
        <tbody>
          {rows.map((r, idx) =>
            r.type === 'group' ? (
              <tr key={idx} className="bg-muted/60">
                <td className="px-2 py-2 font-semibold text-foreground" colSpan={2}>
                  {r.text}
                </td>
              </tr>
            ) : (
              <tr key={idx} className="border-b border-border">
                <td className="w-6 px-2 py-1.5 align-top text-muted-foreground">•</td>
                <td className="px-2 py-1.5 text-foreground">{r.text}</td>
              </tr>
            ),
          )}
        </tbody>
      </table>
    )
  }

  const dataLines = body.filter((l) => {
    const t = l.trim()
    return t.length > 0 && !/^-{10,}$/.test(t)
  })

  let headerCells: string[] | null = null
  let startIdx = 0
  if (dataLines.length > 0) {
    const firstCells = splitCells(dataLines[0])
    if (firstCells.length >= 3 && firstCells.every((c) => /^\d{4}_Q\d$/.test(c))) {
      headerCells = firstCells
      startIdx = 1
    }
  }

  return (
    <div className="overflow-x-auto rounded-lg border border-border">
      <table className="min-w-full border-collapse text-xs">
        {headerCells ? (
          <thead>
            <tr className="border-b border-border bg-muted/40">
              <th className="sticky left-0 z-10 whitespace-nowrap border-r border-border bg-muted/40 px-2 py-2 text-left font-semibold text-foreground">
                Field / segment
              </th>
              {headerCells.map((h, j) => (
                <th
                  key={j}
                  className="whitespace-nowrap px-2 py-2 text-right font-semibold tabular-nums text-muted-foreground"
                >
                  {h}
                </th>
              ))}
            </tr>
          </thead>
        ) : null}
        <tbody>
          {dataLines.slice(startIdx).map((line, i) => {
            const cells = splitCells(line)
            if (cells.length === 1) {
              return (
                <tr key={i} className="border-b border-border">
                  <td className="px-2 py-2 text-muted-foreground" colSpan={99}>
                    {cells[0]}
                  </td>
                </tr>
              )
            }
            const isNumericTail =
              cells.length >= 2 &&
              cells.slice(1).every((c) => /^[\d,]+$|^\d+\s+file\(s\)$|^drift=\w+$|^cols=\d+$/.test(c))
            return (
              <tr key={i} className="border-b border-border">
                <td className="sticky left-0 z-[1] whitespace-nowrap border-r border-border bg-muted/80 px-2 py-1.5 font-medium text-foreground backdrop-blur-sm">
                  {cells[0]}
                </td>
                {cells.slice(1).map((c, j) => (
                  <td
                    key={j}
                    className={`whitespace-nowrap px-2 py-1.5 text-foreground ${
                      isNumericTail ? 'text-right tabular-nums' : 'text-left'
                    }`}
                  >
                    {c}
                  </td>
                ))}
              </tr>
            )
          })}
        </tbody>
      </table>
    </div>
  )
}

type Props = {
  text: string
}

export function PhilgepsRawSummaryView({ text }: Props) {
  const { preamble, sections } = useMemo(() => parseSections(text), [text])

  return (
    <div className="space-y-6">
      {preamble.some((l) => l.trim()) ? <PreambleRows lines={preamble} /> : null}
      {sections.map((sec, idx) => (
        <section key={`${sec.heading}-${idx}`}>
          <h4 className="mb-2 border-l-4 border-primary pl-2 text-sm font-semibold text-foreground">
            {sec.heading}
          </h4>
          <GenericSectionTable heading={sec.heading} body={sec.body} />
        </section>
      ))}
    </div>
  )
}
