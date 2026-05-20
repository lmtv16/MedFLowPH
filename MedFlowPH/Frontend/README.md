# Frontend

React + TypeScript + Vite SPA: thesis pages and `/workbench`.

## Contents (this folder only)

| Item | Purpose |
|------|---------|
| `src/` | React components, pages, API client |
| `public/` | Static thesis assets (`data/`, `results/`, `output_source/`) |
| `index.html`, `vite.config.ts` | Vite app shell and dev proxy to `:8000` |
| `package.json` | Node dependencies |

## Run locally

```bash
cd MedFlow/MedFlowPH/Frontend
npm install
npm run dev
```

Open http://localhost:5173/workbench (requires Backend on port 8000).

## Build

```bash
npm run build
```

Output: `Frontend/dist/`. For split deploy, set `VITE_API_BASE_URL` (see `.env.example`).
