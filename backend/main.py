"""
CloudSov — FastAPI backend
Step 1: serves framework + pre-loaded provider data + stateless scoring
"""

import math
from pathlib import Path
from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel

from sov_data import SOV_OBJECTIVES, SEAL_DESCRIPTIONS, compute_results
from sov_loader import load_survey
from readiness_data import READINESS_CATEGORIES, CHART_DIMENSIONS
from readiness_loader import load_readiness
from financial_data import FINANCIAL_PROVIDERS, USD_TO_EUR


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


@app.get("/api/financial")
def get_financial():
    """
    Returns readiness gap-closure projection data (2006–2050).
    Historical: linear growth from 0 at launch to current score at 2026.
    Projected: same velocity forward until score reaches 100 (AWS parity).
    """
    CURRENT_YEAR = 2026
    START_YEAR   = 2006
    END_YEAR     = 2050

    # Map financial provider keys to readiness loader keys
    READINESS_KEY_MAP = {
        "OVHcloud":       "OVHcloud",
        "Scaleway":       "Scaleway",
        "STACKIT":        "STACKIT",
        "IONOS":          "IONOS",
        "T-Cloud Public": "T-Systems (OTC / T-Cloud Public)",
    }

    # Compute average readiness score per provider from loaded data
    def avg_readiness(rkey):
        pdata = _READINESS.get(rkey)
        if not pdata:
            return 0.0
        scores = pdata["scores"]
        return round(sum(scores.values()) / len(scores), 1) if scores else 0.0

    providers = []
    for fin_key, r_key in READINESS_KEY_MAP.items():
        fin    = FINANCIAL_PROVIDERS.get(fin_key, {})
        launch = fin.get("cloud_launch_year", CURRENT_YEAR)
        score  = avg_readiness(r_key)
        age    = CURRENT_YEAR - launch
        vel    = round(score / age, 4) if age > 0 else 0.0
        gap    = round(100.0 - score, 1)
        parity = round(CURRENT_YEAR + gap / vel, 1) if vel > 0 else None
        # first integer year at or after parity — line terminates here
        parity_ceil = math.ceil(parity) if parity else END_YEAR
        providers.append({
            "key":          fin_key,
            "launch_year":  launch,
            "score_now":    score,
            "velocity":     vel,
            "gap":          gap,
            "parity_year":  parity,
            "parity_ceil":  parity_ceil,
        })

    # Build year-by-year chart rows
    chart_data = []
    for yr in range(START_YEAR, END_YEAR + 1):
        row = {"year": yr}
        for p in providers:
            name = p["key"]
            if yr < p["launch_year"]:
                row[name]           = None
                row[name + "_proj"] = None
            elif yr <= CURRENT_YEAR:
                row[name]           = round(p["velocity"] * (yr - p["launch_year"]), 1)
                row[name + "_proj"] = p["score_now"] if yr == CURRENT_YEAR else None
            else:
                row[name] = None
                if yr <= p["parity_ceil"]:
                    proj = p["score_now"] + p["velocity"] * (yr - CURRENT_YEAR)
                    row[name + "_proj"] = round(min(100.0, proj), 1)
                else:
                    # line terminates at parity — null beyond
                    row[name + "_proj"] = None

        chart_data.append(row)

    # Revenue comparison (2019–2024)
    REV_KEYS = ["AWS", "OVHcloud", "IONOS", "T-Cloud Public", "Scaleway", "STACKIT"]
    revenue_chart_data = []
    for yr in range(2019, 2025):
        row = {"year": yr}
        for pk in REV_KEYS:
            fin = FINANCIAL_PROVIDERS.get(pk, {})
            val = fin.get("revenue_series", {}).get(yr)
            if val is not None and fin.get("currency") == "USD":
                val = round(val * USD_TO_EUR)
            row[pk] = val
        revenue_chart_data.append(row)

    revenue_summary = []
    for pk in REV_KEYS:
        fin    = FINANCIAL_PROVIDERS.get(pk, {})
        series = fin.get("revenue_series", {})
        latest = series.get(max(series)) if series else None
        if latest is not None and fin.get("currency") == "USD":
            latest = round(latest * USD_TO_EUR)
        revenue_summary.append({
            "key":              pk,
            "revenue_latest_m": latest,
            "cagr_5yr":         fin.get("cagr_5yr"),
        })

    # Investment milestones — flattened with provider key attached
    milestones = []
    for pk, pdata in FINANCIAL_PROVIDERS.items():
        for m in pdata.get("investment_milestones", []):
            milestones.append({**m, "provider": pk})

    return {
        "providers":          providers,
        "chart_data":         chart_data,
        "revenue_chart_data": revenue_chart_data,
        "revenue_summary":    revenue_summary,
        "milestones":         milestones,
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
