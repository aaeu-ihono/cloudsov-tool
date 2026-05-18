"""
sov_loader.py
Reads all sov_*.json files from the /survey directory.
Maps question text strings (JSON keys) → question IDs (SOV1-Q1 etc.)
Returns structured provider data ready for the frontend.
"""

import json
import os
from pathlib import Path
from sov_data import SOV_OBJECTIVES

# Build a reverse lookup: question text (lowercase stripped) → question ID
# This handles any minor whitespace inconsistencies between JSON files and sov_data.py
_TEXT_TO_ID: dict[str, str] = {}
for sov_id, sov in SOV_OBJECTIVES.items():
    for q in sov["questions"]:
        key = q["text"].strip().lower()
        _TEXT_TO_ID[key] = q["id"]


def _parse_provider_json(data: dict) -> dict:
    """
    Parse one provider's JSON blob.
    Returns:
    {
        "name": str,
        "answers": { qid: "Y"|"P"|"N" },
        "evidence": { qid: { "note": str, "source": str } },
        "summary_note": str | None
    }
    """
    # Top-level key is the provider name
    provider_name = next(iter(data))
    pillars = data[provider_name]

    answers: dict[str, str] = {}
    evidence: dict[str, dict] = {}
    summary_note: str | None = pillars.get("summary_note")

    for pillar_key, questions in pillars.items():
        if pillar_key == "summary_note":
            continue
        if not isinstance(questions, dict):
            continue

        for q_text, q_data in questions.items():
            if not isinstance(q_data, dict):
                continue

            qid = _TEXT_TO_ID.get(q_text.strip().lower())
            if qid is None:
                # Log unmatched questions so we can catch schema drift
                print(f"[sov_loader] WARNING: unmatched question in '{provider_name}': {q_text!r}")
                continue

            verdict = q_data.get("verdict", "").upper()
            if verdict not in ("Y", "P", "N"):
                verdict = ""

            answers[qid] = verdict
            evidence[qid] = {
                "note": q_data.get("note", ""),
                "source": q_data.get("source", ""),
            }

    return {
        "name": provider_name,
        "answers": answers,
        "evidence": evidence,
        "summary_note": summary_note,
    }


def load_survey(survey_dir: str | Path) -> dict[str, dict]:
    """
    Load all sov_*.json files from survey_dir.
    Returns: { provider_name: { answers, evidence, summary_note } }
    """
    survey_path = Path(survey_dir)
    loaded: dict[str, dict] = {}

    if not survey_path.exists():
        print(f"[sov_loader] WARNING: survey directory not found: {survey_path}")
        return loaded

    for json_file in sorted(survey_path.glob("sov_*.json")):
        try:
            with open(json_file, encoding="utf-8") as f:
                data = json.load(f)
            parsed = _parse_provider_json(data)
            loaded[parsed["name"]] = {
                "answers": parsed["answers"],
                "evidence": parsed["evidence"],
                "summary_note": parsed["summary_note"],
            }
            print(f"[sov_loader] Loaded: {parsed['name']} ({len(parsed['answers'])} answers) from {json_file.name}")
        except Exception as e:
            print(f"[sov_loader] ERROR reading {json_file.name}: {e}")

    return loaded
