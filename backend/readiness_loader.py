"""
readiness_loader.py
Loads all readiness_*.json files from /readiness directory.
Computes per-category coverage scores (0-100) for each provider.
"""

import json
from pathlib import Path
from readiness_data import READINESS_CATEGORIES, COVERAGE_POINTS


def _category_score(provider_data: dict, category: str) -> int:
    services = READINESS_CATEGORIES.get(category, [])
    if not services:
        return 0
    cat = provider_data.get(category, {})
    max_pts = len(services) * 2
    earned = sum(
        COVERAGE_POINTS.get(cat.get(svc, {}).get("coverage", "N"), 0)
        for svc in services
    )
    return round((earned / max_pts) * 100) if max_pts else 0


def _parse_provider(raw: dict) -> dict:
    name = next(iter(raw))
    data = raw[name]
    meta = data.get("meta", {})

    scores: dict[str, int] = {
        "Scalability": int(meta.get("scalability_score", 0)),
        "Performance": int(meta.get("performance_score", 0)),
    }
    for cat in READINESS_CATEGORIES:
        scores[cat] = _category_score(data, cat)

    details: dict[str, dict] = {
        cat: data.get(cat, {}) for cat in READINESS_CATEGORIES
    }

    return {"name": name, "scores": scores, "details": details, "meta": meta}


def load_readiness(readiness_dir: str | Path) -> dict[str, dict]:
    """
    Load all readiness_*.json files from readiness_dir.
    Returns { provider_name: { scores, details, meta } }
    """
    path = Path(readiness_dir)
    loaded: dict[str, dict] = {}

    if not path.exists():
        print(f"[readiness_loader] WARNING: directory not found: {path}")
        return loaded

    for f in sorted(path.glob("readiness_*.json")):
        try:
            with open(f, encoding="utf-8-sig") as fp:
                raw = json.load(fp)
            parsed = _parse_provider(raw)
            loaded[parsed["name"]] = parsed
            print(f"[readiness_loader] Loaded: {parsed['name']} from {f.name}")
        except Exception as e:
            print(f"[readiness_loader] ERROR {f.name}: {e}")

    return loaded
