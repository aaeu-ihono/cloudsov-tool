"""
CloudSov — FastAPI backend
Step 1: serves framework + pre-loaded provider data + stateless scoring
"""

from pathlib import Path
from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel

from sov_data import SOV_OBJECTIVES, SEAL_DESCRIPTIONS, compute_results
from sov_loader import load_survey
from readiness_data import READINESS_CATEGORIES, CHART_DIMENSIONS
from readiness_loader import load_readiness

# ---------------------------------------------------------------------------
# Paths
# ---------------------------------------------------------------------------
BASE_DIR = Path(__file__).parent.parent          # /cloudsov
SURVEY_DIR = BASE_DIR / "sovscore"
READINESS_DIR = BASE_DIR / "readiness"


# ---------------------------------------------------------------------------
# Load survey data once at startup
# ---------------------------------------------------------------------------
_SURVEY: dict[str, dict] = load_survey(SURVEY_DIR)

# Pre-compute initial scores for all loaded providers
_DEFAULT_MIN_SEALS = {k: v["default_min_seal"] for k, v in SOV_OBJECTIVES.items()}
_READINESS: dict[str, dict] = load_readiness(READINESS_DIR)
_INITIAL_ANSWERS = {name: data["answers"] for name, data in _SURVEY.items()}
_INITIAL_SCORES = compute_results(_INITIAL_ANSWERS, _DEFAULT_MIN_SEALS)

# ---------------------------------------------------------------------------
# App
# ---------------------------------------------------------------------------
app = FastAPI(title="CloudSov API", version="0.1.0")

# Allow Vite dev server (localhost:5173) during development
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:5173", "http://localhost:3000"],
    allow_methods=["*"],
    allow_headers=["*"],
)

# ---------------------------------------------------------------------------
# Models
# ---------------------------------------------------------------------------


class ScoreRequest(BaseModel):
    answers: dict[str, dict[str, str]]   # { provider: { qid: Y|P|N } }
    min_seals: dict[str, int]             # { sov_id: int }

# ---------------------------------------------------------------------------
# Routes
# ---------------------------------------------------------------------------


@app.get("/api/framework")
def get_framework():
    """
    Returns the full SOV framework: objectives, questions, weights, seal descriptions.
    Static — does not change at runtime.
    """
    return {
        "objectives": SOV_OBJECTIVES,
        "seal_descriptions": SEAL_DESCRIPTIONS,
        "default_min_seals": _DEFAULT_MIN_SEALS,
    }


@app.get("/api/providers")
def get_providers():
    """
    Returns all providers loaded from sov_*.json files with:
    - pre-filled answers (from JSON)
    - evidence (note + source per question)
    - summary_note
    - initial computed scores (using default min_seals)
    """
    payload = {}
    for name, data in _SURVEY.items():
        payload[name] = {
            "answers": data["answers"],
            "evidence": data["evidence"],
            "summary_note": data["summary_note"],
            "scores": _INITIAL_SCORES.get(name, {}),
            "from_json": True,
        }
    return payload


@app.get("/api/readiness")
def get_readiness():
    """
    Returns pre-computed readiness data for all providers.
    chart_data: list of { dimension, provider: score } — ready for Recharts LineChart.
    """
    providers = list(_READINESS.keys())

    chart_data = []
    for dim in CHART_DIMENSIONS:
        row: dict = {"dimension": dim}
        for pname, pdata in _READINESS.items():
            row[pname] = pdata["scores"].get(dim, 0)
        chart_data.append(row)

    return {
        "providers": providers,
        "dimensions": CHART_DIMENSIONS,
        "chart_data": chart_data,
        "details": {
            pname: {"meta": pdata["meta"], **pdata["details"]}
            for pname, pdata in _READINESS.items()
        },
        "categories": READINESS_CATEGORIES,
    }


@app.post("/api/score")
def score(req: ScoreRequest):
    """
    Stateless: accepts any answer map + min_seals, returns computed results.
    Does NOT write to disk.
    """
    if not req.answers:
        raise HTTPException(status_code=400, detail="answers must not be empty")
    results = compute_results(req.answers, req.min_seals)
    return results
