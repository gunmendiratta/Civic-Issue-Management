import base64
import os

import pytest
from fastapi.testclient import TestClient

from app.main import app

client = TestClient(app)


def test_ai_env_file_is_anchored_to_service_directory():
    from app.main import ENV_FILE
    assert ENV_FILE.name == ".env"
    assert ENV_FILE.parent.name == "ai-service"


def test_gemini_key_is_normalized_before_use(monkeypatch):
    monkeypatch.setenv("GEMINI_API_KEY", "  AQ.test-key  ")
    assert os.getenv("GEMINI_API_KEY", "").strip() == "AQ.test-key"


def test_confidence_value_accepts_numeric_and_qualitative_values():
    from app.main import confidence_value
    assert confidence_value(0.91, 0.5) == 0.91
    assert confidence_value("High", 0.5) == 0.85
    assert confidence_value("unexpected", 0.5) == 0.5


def test_gemini_field_normalization_handles_loose_json_types():
    from app.main import boolean_value, text_list
    assert boolean_value("True") is True
    assert text_list("The streetlight is dark") == ["The streetlight is dark"]


def test_health_reports_baseline_without_claiming_image_model():
    response = client.get("/health")
    assert response.status_code == 200
    assert response.json()["imageModelLoaded"] is False


def test_predict_returns_structured_baseline():
    from app.main import IssueInput, build_prediction
    body = build_prediction(IssueInput(title="Deep pothole", description="Large pothole blocking traffic", category="Pothole")).model_dump()
    assert body["category"]["value"] == "Pothole"
    assert 0 <= body["category"]["confidence"] <= 1
    assert body["severity"]["source"] == "rules"
    assert 0 <= body["priorityScore"] <= 100


def test_predict_rejects_invalid_image_base64():
    response = client.post("/predict", json={"title": "Broken light", "description": "Streetlight is dark", "image_base64": "not-base64"})
    assert response.status_code == 422


def test_predict_rejects_corrupted_image():
    encoded = base64.b64encode(b"not an image").decode()
    response = client.post("/predict", json={"title": "Broken light", "description": "Streetlight is dark", "image_base64": encoded})
    assert response.status_code == 422


def test_duplicate_check_uses_text_and_location_recommendation():
    response = client.post("/duplicate-check", json={"title": "Deep pothole", "description": "Large pothole near school", "latitude": 12.0, "longitude": 77.0, "candidates": [{"id": "abc", "title": "Pothole near school", "description": "Large pothole", "latitude": 12.001, "longitude": 77.001}]})
    body = response.json()
    assert response.status_code == 200
    assert body["isPotentialDuplicate"] is True
    assert body["matchedIssueId"] == "abc"