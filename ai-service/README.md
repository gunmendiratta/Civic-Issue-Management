# CivicConnect AI Service

This FastAPI service owns the AI contract. It starts with a transparent deterministic baseline until a labelled image dataset is available. The Node.js API is the only service that should be called by the browser.

```bash
python -m venv .venv
.venv/bin/pip install -r requirements.txt
.venv/bin/uvicorn app.main:app --reload --port 8000
```

## Render deployment

The repository includes `render.yaml` at the project root. It sets the Render service root directory to `ai-service`, uses the committed Python version in `runtime.txt` (`3.12.11`), installs `requirements.txt`, starts Uvicorn on Render's `$PORT`, and checks `/health`. If configuring Render manually, set **Root Directory** to `ai-service`, **Build Command** to `pip install -r requirements.txt`, and **Start Command** to `uvicorn app.main:app --host 0.0.0.0 --port $PORT`.

## Current endpoints

- `GET /health` reports the baseline model and whether an image model is loaded.
- `POST /predict` returns category, severity, priority, routing, duplicate recommendation, and model metadata.
- `POST /classify` returns the category prediction only.
- `POST /duplicate-check` compares a report with candidates supplied by the Node service.
- `POST /analyze/issue` remains as a compatibility alias for older clients.

The current category and severity values are rules-based recommendations. If an image is supplied, its format and integrity are validated with Pillow, but no image confidence is reported until a real trained checkpoint is installed. Malformed or oversized images return a useful `4xx` response instead of crashing the service.

When `GEMINI_API_KEY` is present in the AI service environment, `/predict` sends the structured complaint context and optional image to Gemini for multimodal analysis. Gemini output is constrained to the approved CivicConnect categories and departments, and the service falls back to the rules baseline when the key is missing, the provider times out, or the response is invalid. The key must remain server-side and must never be placed in `VITE_*` variables.

## Dataset and model status

No dataset is bundled or fabricated in this repository. The required civic categories need to be validated against a public dataset's license, class coverage, image quality, and balance before training. Add any approved data under `data/raw`, `data/train`, `data/validation`, and `data/test`; these directories and generated checkpoints under `models/` must remain uncommitted.

The planned model is transfer learning with MobileNetV3 or EfficientNet-B0. Accuracy, precision, recall, F1, and confusion-matrix values will only be documented after an actual train/evaluate run.
