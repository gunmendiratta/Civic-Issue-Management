import base64

import pytest
from fastapi.testclient import TestClient

from app.main import app

client = TestClient(app)


def test_health_reports_baseline_without_claiming_image_model():
    response = client.get("/health")
    assert response.status_code == 200
    assert response.json()["imageModelLoaded"] is False


def test_predict_returns_structured_baseline():
    response = client.post("/predict", json={"title": "Deep pothole", "description": "Large pothole blocking traffic", "category": "Pothole"})
    body = response.json()
    assert response.status_code == 200
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