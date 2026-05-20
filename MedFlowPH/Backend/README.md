# Backend

FastAPI workbench API and pipeline orchestration.

## Contents (this folder only)

| Item | Purpose |
|------|---------|
| `main.py` | Uvicorn app entry (`uvicorn main:app`) |
| `config.py` | Paths to `runs/`, `source_code/`, `Frontend/public` |
| `database.py` | SQLite run registry (`runs/workbench.db`) |
| `pipeline_runner.py` | PhilGEPS subprocess orchestration |
| `artifacts.py` | Per-run and thesis-final artifact resolution |
| `models.py` | Pydantic request/response models |
| `requirements.txt` | API-specific Python deps (install with root `requirements.txt`) |

## Shared project paths (parent `MedFlowPH/`)

The backend reads/writes these at the repo root — they are **not** duplicated here:

- `source_code/PhilGEPS/` — pipeline scripts
- `runs/` — experiment outputs
- `output_source/`, `results/` — baseline artifacts

## Run locally

```bash
cd MedFlow/MedFlowPH
python -m venv .venv
.venv\Scripts\activate   # or: source .venv/bin/activate
pip install -r requirements.txt
pip install -r Backend/requirements.txt
cd Backend
uvicorn main:app --reload --port 8000
```
