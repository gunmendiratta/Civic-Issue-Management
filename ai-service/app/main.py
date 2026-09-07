"""CivicConnect AI inference boundary; replace the transparent baseline with trained models."""
from fastapi import FastAPI
from pydantic import BaseModel, Field
from typing import Optional

app = FastAPI(title="CivicConnect AI Service", version="0.1.0")
class IssueInput(BaseModel):
    title: str = Field(min_length=3, max_length=120)
    description: str = Field(min_length=3, max_length=3000)
    category: Optional[str] = None
    latitude: Optional[float] = None
    longitude: Optional[float] = None
ROUTES = {"pothole":"Roads & Transport","road":"Roads & Transport","garbage":"Sanitation","waste":"Sanitation","dump":"Sanitation","streetlight":"Electrical","light":"Electrical","leak":"Water Supply","drain":"Water Supply","tree":"Parks & Public Spaces","traffic":"Traffic Management"}
CATEGORY = {"pothole":"Pothole","garbage":"Garbage / Waste","waste":"Garbage / Waste","streetlight":"Broken Streetlight","leak":"Water Leakage","drain":"Drainage Issue","tree":"Fallen Tree","traffic":"Traffic Signal Damage"}
@app.get("/health")
def health(): return {"ok": True, "model": "transparent-keyword-baseline"}
@app.post("/analyze/issue")
def analyze(issue: IssueInput):
    text = f"{issue.title} {issue.description}".lower(); keyword = next((word for word in ROUTES if word in text), None); category = CATEGORY.get(keyword, issue.category or "Other")
    severity = "Critical" if any(w in text for w in ["fire", "flood", "accident", "danger", "exposed wire"]) else "High" if any(w in text for w in ["large", "deep", "overflow", "blocking"]) else "Medium"; score = {"Medium": .55, "High": .78, "Critical": .94}[severity]
    return {"category":category,"category_confidence":.78 if keyword else .50,"severity":severity.lower(),"severity_score":score,"department":ROUTES.get(keyword,"Public Works"),"possible_duplicates":[],"explanation":"Transparent baseline based on report language; replace with a trained model for production."}
