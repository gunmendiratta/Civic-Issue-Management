# CivicConnect AI Service

This FastAPI service owns the AI contract. It starts with a transparent deterministic baseline until a labelled image dataset is available. The Node.js API is the only service that should be called by the browser.

```bash
python -m venv .venv
.venv/bin/pip install -r requirements.txt
.venv/bin/uvicorn app.main:app --reload --port 8000
```

## Current endpoints

- `GET /health` reports the baseline model and whether an image model is loaded.
- `POST /predict` returns category, severity, priority, routing, duplicate recommendation, and model metadata.
- `POST /classify` returns the category prediction only.
- `POST /duplicate-check` compares a report with candidates supplied by the Node service.
- `POST /analyze/issue` remains as a compatibility alias for older clients.

The current category and severity values are rules-based recommendations. If an image is supplied, its format and integrity are validated with Pillow, but no image confidence is reported until a real trained checkpoint is installed. Malformed or oversized images return a useful `4xx` response instead of crashing the service.

## Dataset and model status

No dataset is bundled or fabricated in this repository. The required civic categories need to be validated against a public dataset's license, class coverage, image quality, and balance before training. Add any approved data under `data/raw`, `data/train`, `data/validation`, and `data/test`; these directories and generated checkpoints under `models/` must remain uncommitted.

The planned model is transfer learning with MobileNetV3 or EfficientNet-B0. Accuracy, precision, recall, F1, and confusion-matrix values will only be documented after an actual train/evaluate run.
