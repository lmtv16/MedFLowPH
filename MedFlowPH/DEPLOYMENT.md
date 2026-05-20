# MedFlow PH — Production deployment

Serve the thesis SPA from `Frontend/dist` and the workbench API on the same origin (recommended), or split frontend and API hosts.

## Prerequisites

- Ubuntu 22.04+ (or similar) VM with **≥ 4 GB RAM** and persistent disk for `Backend/runs/`
- Python **3.11+**, Node **20+**, **nginx**, **Certbot** (TLS)
- Full tree: `Backend/` (scripts + baseline `output_source/` / `results/`), `Frontend/public/`

## Install

```bash
cd /opt/medflow/MedFlowPH   # example path
python3.11 -m venv .venv
source .venv/bin/activate
pip install -r Backend/requirements.txt

cd Frontend
npm ci
npm run build    # same-origin: no VITE_API_BASE_URL
```

Build output: `Frontend/dist/`. Static thesis assets remain in `Frontend/public/` (copied into `dist` at build time).

## Run API (development / smoke test)

```bash
cd Backend
uvicorn main:app --host 127.0.0.1 --port 8000
```

## systemd (production)

Copy and edit `deploy/medflow-api.service` (set `WorkingDirectory`, `User`, venv path), then:

```bash
sudo cp deploy/medflow-api.service /etc/systemd/system/
sudo systemctl daemon-reload
sudo systemctl enable --now medflow-api
```

Environment (optional) in the unit file or `/etc/medflow/api.env`:

| Variable | Purpose |
|----------|---------|
| `MEDFLOW_CORS_ORIGINS` | Comma-separated extra SPA origins for split deploy (merged with localhost dev defaults) |
| `MEDFLOW_DISABLE_UPLOAD` | `true` to reject multipart uploads on public demos |

**Concurrency:** Use a single uvicorn worker (`WEB_CONCURRENCY=1` or default). The pipeline uses SQLite plus an in-process background thread; only one heavy run at a time is safe unless you accept races on `Backend/runs/workbench.db`.

## nginx (same-origin, recommended)

Copy `deploy/nginx.conf.sample`, set `server_name` and paths, enable the site, then TLS:

```bash
sudo certbot --nginx -d your.domain.example
```

Verify:

- `https://your.domain.example/` — Landing and thesis routes load from static `dist`
- `https://your.domain.example/health` — `{"status":"ok"}`
- `https://your.domain.example/api/runs` — JSON list (not nginx 404)
- `https://your.domain.example/workbench` — SPA; Quick + bundled run completes

## Split frontend + API (alternative)

1. Deploy API on host B (e.g. Railway/VPS) with uvicorn bound to the platform port.
2. Set on the API host: `MEDFLOW_CORS_ORIGINS=https://your-spa.example.com`
3. Build SPA on host A:

```bash
VITE_API_BASE_URL=https://api.your.domain.example npm run build
```

4. Host `dist/` on Vercel/static CDN. `vercel.json` rewrites SPA routes only; **API is not on Vercel**.

Artifact and REST URLs become absolute to the API host. Thesis-static paths for `thesis-final` stay relative to the SPA origin (`/data/...`, `/results/...`).

## Manual acceptance checklist

- [ ] `npm run build` succeeds
- [ ] `/`, `/evaluation`, etc. work without API (thesis-final static assets)
- [ ] `/workbench` lists runs; Quick + bundled → `completed`; K summary JSON loads
- [ ] Same-origin: `/health` and `/api/runs` proxied correctly
- [ ] Split deploy (if used): CORS preflight succeeds; artifact images/CSV load from API host

## Docker

Not included by default (large ML stack + multi-GB `public/` assets). Use bare-metal/VM + nginx + systemd above.
