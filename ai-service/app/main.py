"""CivicConnect AI service with a transparent baseline prediction pipeline."""
import base64
import binascii
import math
import re
from io import BytesIO
from typing import Optional

from fastapi import FastAPI, HTTPException
from pydantic import BaseModel, Field, field_validator

MODEL_NAME = "rules-based-baseline"
MODEL_VERSION = "baseline-v1"
MAX_IMAGE_BYTES = 5 * 1024 * 1024
app = FastAPI(title="CivicConnect AI Service", version="0.2.0")


class IssueInput(BaseModel):
    title: str = Field(min_length=3, max_length=120)
    description: str = Field(min_length=3, max_length=3000)
    category: Optional[str] = None
    latitude: Optional[float] = Field(default=None, ge=-90, le=90)
    longitude: Optional[float] = Field(default=None, ge=-180, le=180)
    image_base64: Optional[str] = None

    @field_validator("image_base64")
    @classmethod
    def image_size(cls, value: Optional[str]) -> Optional[str]:
        if value and len(value) > MAX_IMAGE_BYTES * 2:
            raise ValueError("image is too large")
        return value


class Prediction(BaseModel):
    value: str
    confidence: Optional[float] = Field(default=None, ge=0, le=1)
    source: str


class DuplicateRecommendation(BaseModel):
    isPotentialDuplicate: bool
    similarityScore: float = Field(ge=0, le=1)
    matchedIssueId: Optional[str] = None


class PredictionResponse(BaseModel):
    status: str
    category: Prediction
    severity: Prediction
    priorityScore: int = Field(ge=0, le=100)
    department: Prediction
    duplicate: DuplicateRecommendation
    modelName: str
    modelVersion: str
    explanation: str


class DuplicateCandidate(BaseModel):
    id: str
    title: str = ""
    description: str = ""
    latitude: Optional[float] = Field(default=None, ge=-90, le=90)
    longitude: Optional[float] = Field(default=None, ge=-180, le=180)


class DuplicateInput(BaseModel):
    title: str = Field(min_length=3, max_length=120)
    description: str = Field(min_length=3, max_length=3000)
    latitude: Optional[float] = Field(default=None, ge=-90, le=90)
    longitude: Optional[float] = Field(default=None, ge=-180, le=180)
    candidates: list[DuplicateCandidate] = Field(default_factory=list, max_length=100)


KEYWORDS = {
    "pothole": ("Pothole", "Roads & Transport"), "crater": ("Pothole", "Roads & Transport"),
    "road damage": ("Road Damage", "Roads & Transport"), "cracked road": ("Road Damage", "Roads & Transport"),
    "garbage": ("Garbage / Waste", "Sanitation"), "waste": ("Garbage / Waste", "Sanitation"),
    "trash": ("Garbage / Waste", "Sanitation"), "illegal dumping": ("Illegal Dumping", "Sanitation"),
    "streetlight": ("Broken Streetlight", "Electrical"), "street light": ("Broken Streetlight", "Electrical"),
    "lamp": ("Broken Streetlight", "Electrical"), "water leak": ("Water Leakage", "Water Supply"),
    "leak": ("Water Leakage", "Water Supply"), "drain": ("Drainage Issue", "Water Supply"),
    "sewage": ("Drainage Issue", "Water Supply"), "fallen tree": ("Fallen Tree", "Parks & Public Spaces"),
    "tree branch": ("Fallen Tree", "Parks & Public Spaces"), "traffic signal": ("Traffic Signal Damage", "Traffic Management"),
    "traffic light": ("Traffic Signal Damage", "Traffic Management"),
}


def validate_image(image_base64: Optional[str]) -> str:
    if not image_base64:
        return "no_image"
    try:
        raw = base64.b64decode(image_base64, validate=True)
    except (binascii.Error, ValueError) as error:
        raise HTTPException(status_code=422, detail="image_base64 is not valid base64") from error
    if len(raw) > MAX_IMAGE_BYTES:
        raise HTTPException(status_code=413, detail="image is larger than 5 MB")
    try:
        from PIL import Image
        with Image.open(BytesIO(raw)) as image:
            image.verify()
    except Exception as error:
        raise HTTPException(status_code=422, detail="image is missing, corrupted, or unsupported") from error
    return "validated_image_no_trained_model"


def text_category(text: str, requested: Optional[str]) -> tuple[str, Optional[float], str]:
    for keyword, (category, department) in KEYWORDS.items():
        if keyword in text:
            return category, 0.78, department
    return requested or "Other", 0.50 if requested else None, "Public Works"


def haversine(first: DuplicateInput, candidate: DuplicateCandidate) -> Optional[float]:
    if first.latitude is None or first.longitude is None or candidate.latitude is None or candidate.longitude is None:
        return None
    lat1, lat2 = math.radians(first.latitude), math.radians(candidate.latitude)
    delta_lat = lat2 - lat1
    delta_lon = math.radians(candidate.longitude - first.longitude)
    value = math.sin(delta_lat / 2) ** 2 + math.cos(lat1) * math.cos(lat2) * math.sin(delta_lon / 2) ** 2
    return 6371000 * 2 * math.asin(math.sqrt(value))


def duplicate_result(payload: DuplicateInput) -> DuplicateRecommendation:
    text = f"{payload.title} {payload.description}"
    first_words = {word for word in re.findall(r"[a-z0-9]+", text.lower()) if len(word) > 4}
    matches = []
    for candidate in payload.candidates:
        words = set(re.findall(r"[a-z0-9]+", f"{candidate.title} {candidate.description}".lower()))
        shared = len(first_words & words) / max(len(first_words), 1)
        nearby = haversine(payload, candidate)
        score = min(1, round(shared * 0.65 + (0.35 if nearby is not None and nearby <= 500 else 0), 3))
        matches.append((score, candidate.id))
    score, issue_id = max(matches, default=(0, None))
    return DuplicateRecommendation(isPotentialDuplicate=score >= 0.65, similarityScore=score, matchedIssueId=issue_id if score >= 0.65 else None)


def build_prediction(issue: IssueInput) -> PredictionResponse:
    image_status = validate_image(issue.image_base64)
    category, confidence, department = text_category(f"{issue.title} {issue.description}".lower(), issue.category)
    text = f"{issue.title} {issue.description}".lower()
    critical = any(word in text for word in ("fire", "flood", "accident", "danger", "exposed wire", "collapsed"))
    high = any(word in text for word in ("large", "deep", "overflow", "blocking", "urgent"))
    severity = "Critical" if critical else "High" if high else "Medium"
    severity_score = {"Medium": 0.55, "High": 0.78, "Critical": 0.94}[severity]
    return PredictionResponse(
        status="baseline", category=Prediction(value=category, confidence=confidence, source="rules"),
        severity=Prediction(value=severity, confidence=severity_score, source="rules"), priorityScore=round(severity_score * 100),
        department=Prediction(value=department, confidence=None, source="category-routing-rule"),
        duplicate=DuplicateRecommendation(isPotentialDuplicate=False, similarityScore=0), modelName=MODEL_NAME, modelVersion=MODEL_VERSION,
        explanation=f"Rules-based baseline. Image status: {image_status}. Severity uses transparent keyword rules; category uses report text and the citizen category when no keyword matches.",
    )


@app.get("/health")
def health():
    return {"ok": True, "model": MODEL_NAME, "modelVersion": MODEL_VERSION, "imageModelLoaded": False}


@app.post("/predict", response_model=PredictionResponse)
def predict(issue: IssueInput):
    return build_prediction(issue)


@app.post("/classify", response_model=Prediction)
def classify(issue: IssueInput):
    return build_prediction(issue).category


@app.post("/duplicate-check", response_model=DuplicateRecommendation)
def duplicate_check(payload: DuplicateInput):
    return duplicate_result(payload)


@app.post("/analyze/issue", response_model=PredictionResponse)
def analyze_compatibility(issue: IssueInput):
    return build_prediction(issue)
