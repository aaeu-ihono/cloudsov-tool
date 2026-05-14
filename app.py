from flask import Flask, render_template, request, jsonify, session
import json
import os
from sov_data import SOV_OBJECTIVES, DEFAULT_PROVIDERS, SEAL_DESCRIPTIONS, compute_results
from pprint import pprint

app = Flask(__name__)
app.secret_key = "cloudsov-dev-key"


def get_state():
    if "providers" not in session:
        session["providers"] = list(DEFAULT_PROVIDERS)
    if "answers" not in session:
        session["answers"] = {}
    if "min_seals" not in session:
        session["min_seals"] = {k: v["default_min_seal"] for k, v in SOV_OBJECTIVES.items()}
    pprint(session)
    return session["providers"], session["answers"], session["min_seals"]


@app.route("/")
def sovscore():
    providers, answers, min_seals = get_state()
    results = compute_results(answers, min_seals) if providers else {}
    return render_template(
        "sovscore.html",
        sov_objectives=SOV_OBJECTIVES,
        providers=providers,
        answers=answers,
        min_seals=min_seals,
        results=results,
        seal_descriptions=SEAL_DESCRIPTIONS,
    )


@app.route("/api/answer", methods=["POST"])
def set_answer():
    data = request.json
    provider = data["provider"]
    qid = data["qid"]
    val = data["val"]
    providers, answers, min_seals = get_state()
    if provider not in answers:
        answers[provider] = {}
    answers[provider][qid] = val
    session["answers"] = answers
    session.modified = True
    results = compute_results(answers, min_seals)
    return jsonify(results)


@app.route("/api/add_provider", methods=["POST"])
def add_provider():
    name = request.json.get("name", "").strip()
    providers, answers, min_seals = get_state()
    if name and name not in providers:
        providers.append(name)
        session["providers"] = providers
        session.modified = True
        return jsonify({"ok": True, "providers": providers})
    return jsonify({"ok": False, "error": "Duplicate or empty name"})


@app.route("/api/remove_provider", methods=["POST"])
def remove_provider():
    name = request.json.get("name", "")
    providers, answers, min_seals = get_state()
    if name in providers:
        providers.remove(name)
        answers.pop(name, None)
        session["providers"] = providers
        session["answers"] = answers
        session.modified = True
    return jsonify({"ok": True})


@app.route("/api/min_seal", methods=["POST"])
def set_min_seal():
    data = request.json
    sov_id = data["sov_id"]
    val = int(data["val"])
    providers, answers, min_seals = get_state()
    min_seals[sov_id] = val
    session["min_seals"] = min_seals
    session.modified = True
    results = compute_results(answers, min_seals)
    return jsonify(results)


@app.route("/api/clear_provider", methods=["POST"])
def clear_provider():
    name = request.json.get("name", "")
    providers, answers, min_seals = get_state()
    if name in answers:
        answers[name] = {}
        session["answers"] = answers
        session.modified = True
    return jsonify({"ok": True})


@app.route("/api/reset", methods=["POST"])
def reset_all():
    session.clear()
    return jsonify({"ok": True})


@app.route("/cloudbench")
def cloudbench():
    return render_template("cloudbench.html")


if __name__ == "__main__":
    app.run(debug=True, port=5000)
