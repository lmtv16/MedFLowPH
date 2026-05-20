# Backend

MedFlow PH backend: FastAPI workbench API, PhilGEPS pipeline scripts, run data, and baseline artifacts.

## Layout

```
Backend/
├── main.py, config.py, …     # Workbench API (uvicorn)
├── requirements.txt          # ML stack + API deps
├── source_code/PhilGEPS/     # Pipeline scripts (01 → 07)
├── runs/                     # Per-experiment outputs + workbench.db
├── output_source/            # Baseline pipeline CSV/JSON exports
├── results/                  # Baseline EDA / summaries
├── raw_datasets/             # Optional PhilGEPS raw years (2020–2025)
└── logs/                     # Pipeline activity / terminal logs
```

Sibling at repo level: **`../Frontend/`** (React SPA; static thesis assets in `Frontend/public/`).

## Run locally

```bash
cd MedFlow/MedFlowPH
python -m venv .venv
.venv\Scripts\activate   # or: source .venv/bin/activate
pip install -r Backend/requirements.txt
cd Backend
uvicorn main:app --reload --port 8000
```
