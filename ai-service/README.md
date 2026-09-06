# CivicConnect AI Service

This FastAPI service owns the AI contract. It starts with a transparent deterministic baseline until a labelled image dataset is available.

```bash
python -m venv .venv
.venv/bin/pip install -r requirements.txt
.venv/bin/uvicorn app.main:app --reload --port 8000
```

Keep `POST /analyze/issue` stable when replacing this baseline with trained image/text inference.
