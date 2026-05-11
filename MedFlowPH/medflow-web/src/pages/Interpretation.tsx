import {
  Bar,
  BarChart,
  CartesianGrid,
  Legend,
  PolarAngleAxis,
  PolarGrid,
  Radar,
  RadarChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts'
import { useMemo, useState } from 'react'
import { ClipboardList } from 'lucide-react'
import { ImageCard } from '../components/ImageCard'
import type { GalleryImage } from '../components/LightboxGallery'
import { LightboxGallery } from '../components/LightboxGallery'
import { PageShell } from '../components/PageShell'
import { SectionHeader } from '../components/SectionHeader'
import { DATA_PATHS, IMAGES } from '../data/fileManifest'
import { useCsvData } from '../hooks/useCsvData'

const PALETTE = ['#1D4ED8', '#0F766E', '#F97316', '#A855F7', '#EC4899', '#0EA5E9', '#16A34A', '#CA8A04']

function themeScoreColumns(header: string[]) {
  return header.filter(
    (col) =>
      col.startsWith('z__') &&
      !col.includes('log1p') &&
      !col.includes('award_decision') &&
      !col.includes('Quantity') &&
      !col.includes('Budget') &&
      !col.includes('Amount'),
  )
}

function prettyTheme(col: string) {
  return col
    .replace(/^z__/, '')
    .split('_')
    .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
    .join(' ')
}

export function Interpretation() {
  const { data: kProfiles } = useCsvData(DATA_PATHS.clusterThemeProfiles)
  const { data: kSemantic } = useCsvData(DATA_PATHS.clusterSemanticMap)
  const { data: dProfiles } = useCsvData(DATA_PATHS.dbscanThemeProfiles)
  const { data: dSemantic } = useCsvData(DATA_PATHS.dbscanSemanticMap)

  const [gallery, setGallery] = useState<{ imgs: GalleryImage[]; idx: number }>({
    imgs: [],
    idx: 0,
  })

  const kmeansGallery: GalleryImage[] = IMAGES.interpretation.kmeans.map((item) => ({
    src: item.src,
    title: item.title,
  }))

  const kRadar = useMemo(() => {
    if (!kProfiles.length) return { data: [] as Record<string, string | number>[], keys: [] as string[] }
    const cols = themeScoreColumns(Object.keys(kProfiles[0]))
    const clusters = kProfiles
      .filter((row) => row.cluster_id !== undefined)
      .map((row) => ({
        id: row.cluster_id,
        row,
      }))
    const data = cols.map((col) => {
      const entry: Record<string, string | number> = { theme: prettyTheme(col) }
      clusters.forEach((c) => {
        entry[`Cluster ${c.id}`] = Number(c.row[col])
      })
      return entry
    })
    const keys = clusters.map((c) => `Cluster ${c.id}`)
    return { data, keys }
  }, [kProfiles])

  const kBar = useMemo(() => {
    if (!kProfiles.length) return []
    const cols = themeScoreColumns(Object.keys(kProfiles[0]))
    return kProfiles.map((row) => {
      const entry: Record<string, string | number> = { cluster: `Cluster ${row.cluster_id}` }
      cols.forEach((col) => {
        entry[prettyTheme(col)] = Number(row[col])
      })
      return entry
    })
  }, [kProfiles])

  const kBarKeys = useMemo(() => {
    if (!kProfiles.length) return []
    return themeScoreColumns(Object.keys(kProfiles[0])).map(prettyTheme)
  }, [kProfiles])

  const dbRadar = useMemo(() => {
    if (!dProfiles.length) return { data: [] as Record<string, string | number>[], keys: [] as string[] }
    const header = Object.keys(dProfiles[0])
    const cols = themeScoreColumns(header)
    const dense = dProfiles
      .filter((row) => row.is_noise !== 'True' && row.cluster_id !== '-1')
      .sort((a, b) => Number(b.count ?? 0) - Number(a.count ?? 0))
      .slice(0, 8)
    const data = cols.map((col) => {
      const entry: Record<string, string | number> = { theme: prettyTheme(col) }
      dense.forEach((row) => {
        entry[`C${row.cluster_id}`] = Number(row[col])
      })
      return entry
    })
    const keys = dense.map((row) => `C${row.cluster_id}`)
    return { data, keys }
  }, [dProfiles])

  const dbBar = useMemo(() => {
    if (!dProfiles.length) return { rows: [], keys: [] as string[] }
    const cols = themeScoreColumns(Object.keys(dProfiles[0]))
    const dense = dProfiles
      .filter((row) => row.is_noise !== 'True' && row.cluster_id !== '-1')
      .sort((a, b) => Number(b.count ?? 0) - Number(a.count ?? 0))
      .slice(0, 8)
    const rows = dense.map((row) => {
      const entry: Record<string, string | number> = { cluster: `Cluster ${row.cluster_id}` }
      cols.forEach((col) => {
        entry[prettyTheme(col)] = Number(row[col])
      })
      return entry
    })
    const keys = cols.map(prettyTheme)
    return { rows, keys }
  }, [dProfiles])

  return (
    <PageShell>
      <div className="space-y-12">
        <SectionHeader
          title="K‑Means cluster interpretation"
          subtitle="Thermal narratives of cluster means / z‑scores anchored to thesis theme ontology."
          icon={ClipboardList}
        />

        <div className="grid gap-6 md:grid-cols-2">
          {IMAGES.interpretation.kmeans.map((img, idx) => (
            <ImageCard
              key={img.src}
              src={img.src}
              title={img.title}
              figure={`Figure KI${idx + 1}: ${img.title}`}
              onClick={() => setGallery({ imgs: kmeansGallery, idx })}
            />
          ))}
        </div>

        <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
          <h3 className="text-sm font-semibold text-mf-ink">Figure KI‑R1: Theme radar — K‑Means clusters</h3>
          <p className="mt-2 text-xs text-mf-muted">
            Source: `/data/06/Interpretation/cluster_theme_profiles.csv` (z‑standardized theme signals).
          </p>
          <div className="mt-6 h-[420px]">
            <ResponsiveContainer width="100%" height="100%">
              <RadarChart data={kRadar.data}>
                <PolarGrid />
                <PolarAngleAxis dataKey="theme" tick={{ fontSize: 10 }} />
                <Tooltip />
                <Legend />
                {kRadar.keys.map((key, idx) => (
                  <Radar
                    key={key}
                    name={key}
                    dataKey={key}
                    stroke={PALETTE[idx % PALETTE.length]}
                    fill={PALETTE[idx % PALETTE.length]}
                    fillOpacity={0.15}
                  />
                ))}
              </RadarChart>
            </ResponsiveContainer>
          </div>
        </section>

        <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
          <h3 className="text-sm font-semibold text-mf-ink">Figure KI‑B1: Grouped theme comparison — K‑Means</h3>
          <div className="mt-6 h-[420px]">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={kBar}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="cluster" tick={{ fontSize: 10 }} />
                <YAxis tick={{ fontSize: 11 }} />
                <Tooltip />
                <Legend />
                {kBarKeys.map((key, idx) => (
                  <Bar key={key} dataKey={key} fill={PALETTE[idx % PALETTE.length]} />
                ))}
              </BarChart>
            </ResponsiveContainer>
          </div>
        </section>

        <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
          <h3 className="text-lg font-semibold text-mf-ink">Semantic map — K‑Means</h3>
          <div className="mt-4 max-h-[320px] overflow-auto rounded-xl border border-slate-100">
            <table className="min-w-full divide-y divide-slate-100 text-left text-sm">
              <thead className="sticky top-0 bg-slate-50 text-xs uppercase tracking-wide text-mf-muted">
                <tr>
                  <th className="px-3 py-2">Cluster</th>
                  <th className="px-3 py-2">Label</th>
                  <th className="px-3 py-2">Rationale</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {kSemantic.map((row) => (
                  <tr key={`${row.cluster_id}-${row.cluster_label}`} className="text-xs">
                    <td className="px-3 py-2 font-semibold">{row.cluster_id}</td>
                    <td className="px-3 py-2 text-mf-ink">{row.cluster_label}</td>
                    <td className="px-3 py-2 text-mf-muted">{row.rationale_short}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        <SectionHeader
          title="DBSCAN cluster interpretation (segment priors)"
          subtitle="Top dense micro‑clusters by population; noise rows omitted for clarity."
        />

        <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
          <h3 className="text-sm font-semibold text-mf-ink">Figure DBI‑R1: Theme radar — DBSCAN (top clusters)</h3>
          <p className="mt-2 text-xs text-mf-muted">
            Source: `/data/06B/Interpretation/dbscan_cluster_theme_profiles.csv`.
          </p>
          <div className="mt-6 h-[420px]">
            <ResponsiveContainer width="100%" height="100%">
              <RadarChart data={dbRadar.data}>
                <PolarGrid />
                <PolarAngleAxis dataKey="theme" tick={{ fontSize: 9 }} />
                <Tooltip />
                <Legend />
                {dbRadar.keys.map((key, idx) => (
                  <Radar
                    key={key}
                    name={key}
                    dataKey={key}
                    stroke={PALETTE[idx % PALETTE.length]}
                    fill={PALETTE[idx % PALETTE.length]}
                    fillOpacity={0.12}
                  />
                ))}
              </RadarChart>
            </ResponsiveContainer>
          </div>
        </section>

        <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
          <h3 className="text-sm font-semibold text-mf-ink">Figure DBI‑B1: Grouped theme comparison — DBSCAN</h3>
          <div className="mt-6 h-[420px]">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={dbBar.rows}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="cluster" tick={{ fontSize: 9 }} />
                <YAxis tick={{ fontSize: 11 }} />
                <Tooltip />
                <Legend />
                {dbBar.keys.map((key, idx) => (
                  <Bar key={key} dataKey={key} fill={PALETTE[idx % PALETTE.length]} />
                ))}
              </BarChart>
            </ResponsiveContainer>
          </div>
        </section>

        <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
          <h3 className="text-lg font-semibold text-mf-ink">Semantic map — DBSCAN</h3>
          <div className="mt-4 max-h-[360px] overflow-auto rounded-xl border border-slate-100">
            <table className="min-w-full divide-y divide-slate-100 text-left text-sm">
              <thead className="sticky top-0 bg-slate-50 text-xs uppercase tracking-wide text-mf-muted">
                <tr>
                  <th className="px-3 py-2">Cluster</th>
                  <th className="px-3 py-2">Label</th>
                  <th className="px-3 py-2">Rationale</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {dSemantic.slice(0, 120).map((row) => (
                  <tr key={`${row.cluster_id}-${row.cluster_label}`} className="text-xs">
                    <td className="px-3 py-2 font-semibold">{row.cluster_id}</td>
                    <td className="px-3 py-2 text-mf-ink">{row.cluster_label}</td>
                    <td className="px-3 py-2 text-mf-muted">{row.rationale_short}</td>
                  </tr>
                ))}
              </tbody>
            </table>
            {dSemantic.length > 120 ? (
              <p className="mt-2 text-xs text-mf-muted">Showing first 120 narrative rows for browser performance.</p>
            ) : null}
          </div>
        </div>
      </div>

      <LightboxGallery
        images={gallery.imgs}
        index={gallery.idx}
        open={gallery.imgs.length > 0}
        onClose={() => setGallery({ imgs: [], idx: 0 })}
      />
    </PageShell>
  )
}
