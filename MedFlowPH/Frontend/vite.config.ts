import fs from 'node:fs'
import path from 'node:path'
import { defineConfig, type Plugin } from 'vite'
import react from '@vitejs/plugin-react'

/** Skip multi-hundred-MB preprocessing CSVs (keep in `public/` for dev only). */
const SKIP_PUBLIC_PREFIXES = ['data/02/', 'output_source/02/']

function shouldSkipPublicRel(rel: string): boolean {
  const norm = rel.replace(/\\/g, '/')
  return SKIP_PUBLIC_PREFIXES.some((p) => norm.startsWith(p) || norm.includes(`/${p}`))
}

function copyPublicFiltered(publicDir: string, outDir: string, rel = ''): void {
  const src = path.join(publicDir, rel)
  if (!fs.existsSync(src)) return
  const stat = fs.statSync(src)
  if (stat.isDirectory()) {
    if (shouldSkipPublicRel(rel)) return
    const dest = path.join(outDir, rel)
    fs.mkdirSync(dest, { recursive: true })
    for (const name of fs.readdirSync(src)) {
      copyPublicFiltered(publicDir, outDir, path.join(rel, name))
    }
    return
  }
  if (shouldSkipPublicRel(rel)) return
  const dest = path.join(outDir, rel)
  fs.mkdirSync(path.dirname(dest), { recursive: true })
  fs.copyFileSync(src, dest)
}

function copyPublicFilteredPlugin(): Plugin {
  return {
    name: 'copy-public-filtered',
    apply: 'build',
    closeBundle() {
      const publicDir = path.resolve(__dirname, 'public')
      const outDir = path.resolve(__dirname, 'dist')
      if (!fs.existsSync(publicDir)) return
      copyPublicFiltered(publicDir, outDir)
    },
  }
}

// https://vite.dev/config/
export default defineConfig({
  plugins: [react(), copyPublicFilteredPlugin()],
  build: {
    outDir: 'dist',
    /** Default copy includes huge `public/data/02/` CSVs and can fill the disk. */
    copyPublicDir: false,
  },
  server: {
    proxy: {
      '/api': 'http://127.0.0.1:8000',
      '/health': 'http://127.0.0.1:8000',
    },
  },
})
