# MedFlow PH — Revision Workbench

## Project layout

```
MedFlowPH/
├── Backend/              # API + pipeline + runs + baseline data
│   ├── source_code/
│   ├── runs/
│   ├── output_source/
│   ├── results/
│   ├── raw_datasets/     # optional
│   └── requirements.txt
└── Frontend/             # React + Vite SPA
```

Use **`Frontend/`** only (`medflow-web/` was retired). If an empty `medflow-web/` remains, delete it or run `.\restructure-finalize.ps1`.

## Architecture

```
User → React Workbench (/workbench)
         ↓ REST (Vite proxy /api → :8000)
       FastAPI (Backend/main.py, SQLite in Backend/runs/workbench.db)
         ↓ subprocess + MEDFLOW_ROOT=Backend/runs/{runId}
       PhilGEPS scripts 01→02→03→05→04 …
         ↓
       Backend/runs/{runId}/output_source/ + results/
```

Frozen baseline **`thesis-final`** keeps serving `Frontend/public/data` and `public/results` so all existing routes work without the API.

## Quick start

### 1. Python API

```bash
cd MedFlow/MedFlowPH
python -m venv .venv
.venv\Scripts\activate
pip install -r Backend/requirements.txt
cd Backend
uvicorn main:app --reload --port 8000
```

### 2. Frontend

```bash
cd MedFlow/MedFlowPH/Frontend
npm install
npm run dev
```

Open http://localhost:5173/workbench

## Production deployment

**Recommended:** single origin — nginx serves `Frontend/dist`, proxies `/api/*` and `/health` to uvicorn. See **[DEPLOYMENT.md](./DEPLOYMENT.md)** (`deploy/nginx.conf.sample`, `deploy/medflow-api.service`).

**Split SPA + API:** build with an explicit API host:

```bash
VITE_API_BASE_URL=https://api.example.com npm run build
```

Set `MEDFLOW_CORS_ORIGINS=https://spa.example.com` on the API. Do not use `allow_origins=["*"]` with credentials.

**Public demo (optional):** `MEDFLOW_DISABLE_UPLOAD=true` blocks ZIP/CSV uploads; Quick + bundled dataset still work.

### 3. Proof experiments

**Quick (default)** — K-selection only:

1. Workbench → **New experiment** (Quick mode is the default)
2. Bundled dataset on → **Run pipeline**
3. Expect `completed`, K summary loads, silhouette ≈ **0.386**, chosen **K = 6**

**Full + bundled, no local raw** — seed 01–03 + K-means:

1. New experiment → uncheck Quick (Full mode), enable K-means
2. Bundled on, no `raw_datasets/PhilGEPS/` years on disk
3. Expect `completed` with:
   - `Backend/runs/{id}/output_source/05/KSelection/k_selection_summary.json`
   - `Backend/runs/{id}/output_source/04/KMeans/philgeps_kmeans_assignments.csv`
   - `Backend/runs/{id}/results/03/Clustering/pca_theme_clustering.json`
4. Re-open run → Evaluation tab loads core artifacts (no 404)

**Full + bundled + raw** — end-to-end cleaning:

1. When `Backend/raw_datasets/PhilGEPS/{2020..2025}/` exists, Full mode runs
   `01 → 02 → 03 → 05 → 04` (API sets `seed_from_baseline=false` automatically)
2. ZIP uploads: API normalizes `PhilGEPS(YYYY)` / `raw_data/` layouts to `PhilGEPS/YYYY/`

## Phases

| Phase | Status |
|-------|--------|
| 0 — thesis-final baseline | Done |
| 1 — API + workbench wizard + result tabs | Done |
| 1b — Full raw upload → step 01 cleaning (needs `raw_datasets/`) | Partial |
| 2 — Filters (year, cluster) | Planned |
| 3 — Experimenter compare (multi-metric) | Partial (`/workbench/compare`) |

## Acceptance checklist

- [x] List experiments including immutable `thesis-final`
- [x] Start K-selection run from UI (background thread)
- [x] Poll status + view K summary per run
- [x] Compare table for silhouette / K
- [x] Existing static pages unchanged (default `runId = thesis-final`)
- [x] Quick bundled path → completed (seeds `output_source` + `results/03`)
- [x] Full bundled without raw → seed baseline + K-means (`pca_theme_clustering.json` copied)
- [x] Full bundled with raw → cleaning pipeline (API derives `seed_from_baseline`)
- [x] ZIP layout normalizer (`PhilGEPS(YYYY)`, `raw_data/`)
- [ ] Full upload → cleaning on machine without bundled raw (needs ZIP or copied raw tree)
- [x] Interpretation / Evaluation pages accept per-run `runId` when status is `completed`

## Thesis numbers (baseline)

- Raw ~8.4M → medical cleaned **487,605**
- Chosen **K = 6**, silhouette **≈ 0.386**
- K-means primary; DBSCAN companion
