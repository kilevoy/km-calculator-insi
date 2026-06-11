# KM Calculator INSI

Business calculator for KM/INSI metrics. The repository is organized as a small full-stack starter:

- `backend/` - FastAPI service with health and calculation endpoints.
- `frontend/` - React + Vite calculator UI that runs the migrated Excel workbook formulas through HyperFormula.
- `frontend/data/` - source workbook used to regenerate the formula snapshot.

## Quick Start

### Backend

```bash
cd backend
python -m venv .venv
.venv\Scripts\activate
pip install -r requirements.txt
uvicorn app.main:app --reload --port 8000
```

Open `http://localhost:8000/docs` for the API schema.

### Frontend

```bash
cd frontend
npm install
npm run dev
```

The Vite app runs on `http://localhost:5173`.

## Useful Commands

```bash
cd frontend
npm run extract   # rebuild src/domain/workbook.generated.ts from frontend/data/*.xlsx
npm test          # regenerate the workbook snapshot, typecheck, and run a smoke calculation
npm run build     # production frontend build
```

## Project Notes

The first calculator slice keeps workbook parity close to the source Excel file. User-facing inputs are mapped to workbook cells, HyperFormula recalculates formulas in the browser, and the UI reports project price, timing, area, constructives, and active variants.
