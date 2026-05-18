# EC DG DIGIT Cloud Sovereignty Framework v1.2.1 – Oct. 2025
# https://commission.europa.eu/document/download/09579818-64a6-4dd5-9577-446ab6219113_en

SOV_OBJECTIVES = {
    "SOV-1": {
        "name": "Strategic Sovereignty",
        "weight": 0.15,
        "default_min_seal": 3,
        "questions": [
            {"id": "SOV1-Q1", "text": "Are all bodies with decisive authority over this provider located within EU jurisdiction?"},
            {"id": "SOV1-Q2", "text": "Does the provider have structural or contractual assurances against non-EU change of control?"},
            {"id": "SOV1-Q3", "text": "Does the provider rely primarily on financing sourced from EU institutions or EU-based investors?"},
            {"id": "SOV1-Q4", "text": "Does the provider demonstrate significant investment, job creation, and value generation within the EU?"},
            {"id": "SOV1-Q5", "text": "Is the provider actively involved in EU sovereignty initiatives (e.g. GAIA-X) and consistent with EU digital sovereignty objectives?"},
            {"id": "SOV1-Q6", "text": "Can the provider sustain secure operations if a non-EU authority requests suspension or vendor support is withdrawn?"},
        ]
    },
    "SOV-2": {
        "name": "Legal & Jurisdictional",
        "weight": 0.10,
        "default_min_seal": 4,
        "questions": [
            {"id": "SOV2-Q1", "text": "Is the provider governed exclusively by an EU member state legal system?"},
            {"id": "SOV2-Q2", "text": "Is the provider free from non-EU laws with extraterritorial reach (e.g. US CLOUD Act, Chinese Cybersecurity Law)?"},
            {"id": "SOV2-Q3", "text": "Are there no legal, contractual, or technical channels through which non-EU authorities could compel access to customer data?"},
            {"id": "SOV2-Q4", "text": "Is the provider free from international export control regimes restricting data usage or transfer?"},
            {"id": "SOV2-Q5", "text": "Is the provider's intellectual property created, registered, and developed exclusively within the EU?"},
        ]
    },
    "SOV-3": {
        "name": "Data & AI Sovereignty",
        "weight": 0.10,
        "default_min_seal": 3,
        "questions": [
            {"id": "SOV3-Q1", "text": "Does the customer retain exclusive cryptographic control over their data (customer-managed encryption keys)?"},
            {"id": "SOV3-Q2", "text": "Does the provider offer full auditability of when, where, and by whom data is accessed, including AI model usage?"},
            {"id": "SOV3-Q3", "text": "Does the provider guarantee irreversible data removal with verifiable evidence?"},
            {"id": "SOV3-Q4", "text": "Is all data storage and processing strictly confined to EU jurisdictions with no third-country fallback?"},
            {"id": "SOV3-Q5", "text": "Are AI models and data pipelines developed, trained, and governed exclusively under EU control?"},
        ]
    },
    "SOV-4": {
        "name": "Operational Sovereignty",
        "weight": 0.15,
        "default_min_seal": 2,
        "questions": [
            {"id": "SOV4-Q1", "text": "Can workloads be migrated to alternative EU-controlled solutions without vendor lock-in?"},
            {"id": "SOV4-Q2", "text": "Can EU operators fully manage and maintain the service without non-EU vendor involvement?"},
            {"id": "SOV4-Q3", "text": "Does an EU-based talent pool exist to operate and sustain the service independently?"},
            {"id": "SOV4-Q4", "text": "Is all operational support delivered exclusively from within the EU?"},
            {"id": "SOV4-Q5", "text": "Is full technical documentation and source code available for long-term autonomy?"},
            {"id": "SOV4-Q6", "text": "Are all critical suppliers and subcontractors located within and governed by EU jurisdiction?"},
        ]
    },
    "SOV-5": {
        "name": "Supply Chain",
        "weight": 0.20,
        "default_min_seal": 2,
        "questions": [
            {"id": "SOV5-Q1", "text": "Is key hardware manufactured or assembled within the EU or trusted jurisdictions?"},
            {"id": "SOV5-Q2", "text": "Is firmware and embedded code controlling hardware of EU origin?"},
            {"id": "SOV5-Q3", "text": "Is the software stack architected, packaged, and updated from within the EU?"},
            {"id": "SOV5-Q4", "text": "Is the provider free from significant reliance on non-EU vendors or proprietary technologies?"},
            {"id": "SOV5-Q5", "text": "Does the provider offer full transparency and audit rights across its entire supply chain?"},
        ]
    },
    "SOV-6": {
        "name": "Technology",
        "weight": 0.15,
        "default_min_seal": 2,
        "questions": [
            {"id": "SOV6-Q1", "text": "Does the provider use well-documented, non-proprietary APIs and open standards?"},
            {"id": "SOV6-Q2", "text": "Is the software stack available under open-source licences with audit and modification rights?"},
            {"id": "SOV6-Q3", "text": "Does the provider offer full architectural transparency including data flows and dependencies?"},
            {"id": "SOV6-Q4", "text": "Is the provider free from dependency on non-EU high-performance computing (processors, accelerators)?"},
        ]
    },
    "SOV-7": {
        "name": "Security & Compliance",
        "weight": 0.10,
        "default_min_seal": 3,
        "questions": [
            {"id": "SOV7-Q1", "text": "Does the provider hold recognised EU certifications (e.g. ISO 27001, BSI C5, ENISA EUCS)?"},
            {"id": "SOV7-Q2", "text": "Is the provider fully compliant with GDPR, NIS2, and DORA?"},
            {"id": "SOV7-Q3", "text": "Are all Security Operations Centres operating exclusively under EU jurisdiction?"},
            {"id": "SOV7-Q4", "text": "Does the provider give customers direct oversight of security monitoring and logging?"},
            {"id": "SOV7-Q5", "text": "Does the provider follow EU-compliant breach reporting with independent patch management?"},
            {"id": "SOV7-Q6", "text": "Can EU entities perform independent security audits with full system access?"},
        ]
    },
    "SOV-8": {
        "name": "Environmental",
        "weight": 0.05,
        "default_min_seal": 1,
        "questions": [
            {"id": "SOV8-Q1", "text": "Does the provider operate energy-efficient infrastructure (low PUE) with published targets?"},
            {"id": "SOV8-Q2", "text": "Does the provider apply circular economy practices for hardware lifecycle?"},
            {"id": "SOV8-Q3", "text": "Does the provider publish transparent carbon and water usage disclosures?"},
            {"id": "SOV8-Q4", "text": "Does the provider source renewable or low-carbon energy for its operations?"},
        ]
    },
}

SEAL_DESCRIPTIONS = {
    0: "No Sovereignty — Service under exclusive control of non-EU third parties, governed entirely in non-EU jurisdictions.",
    1: "Jurisdictional Sovereignty — EU law formally applies with limited practical enforceability; service under non-EU control.",
    2: "Data Sovereignty — EU law applicable and enforceable, with material non-EU dependencies remaining.",
    3: "Digital Resilience — EU law enforceable, EU actors exercising meaningful but not full influence; marginal non-EU control.",
    4: "Full Digital Sovereignty — Technology and operations under complete EU control, subject only to EU law, no critical non-EU dependencies.",
}


DEFAULT_PROVIDERS = [
    "OVHcloud / Gridscale",
    "Hetzner",
    "Scaleway",
    "STACKIT (Schwarz Group)",
    "IONOS",
    "UpCloud",
    "Exoscale",
    "Elastx",
    "Arvato Systems",
    "T-Systems Open Telekom Cloud",
    "Deutsche Telekom / Detecon",
    "Plusserver",
    "Noris Network",
    "Cleura",
    "Infomaniak",
    "Nine",
    "Fuga Cloud / Cyso Cloud",
    "local-hosting",
]

ANSWER_SCORES = {"Y": 2, "P": 1, "N": 0}


def score_to_seal(score, max_score):
    if max_score == 0:
        return 0
    pct = score / max_score
    if pct <= 0.20:
        return 0
    if pct <= 0.40:
        return 1
    if pct <= 0.60:
        return 2
    if pct <= 0.80:
        return 3
    return 4


def compute_results(answers, min_seals):
    """
    answers: { provider: { qid: 'Y'|'P'|'N' } }
    min_seals: { sov_id: int }
    returns: { provider: { sov_id: { seal, min_seal, pass, score, max }, score } }
    """
    results = {}
    for provider, pans in answers.items():
        results[provider] = {}
        sov_seals = {}
        for sov_id, sov in SOV_OBJECTIVES.items():
            qs = sov["questions"]
            max_s = len(qs) * 2
            score = sum(ANSWER_SCORES.get(pans.get(q["id"], ""), 0) for q in qs)
            seal = score_to_seal(score, max_s)
            min_seal = min_seals.get(sov_id, sov["default_min_seal"])
            results[provider][sov_id] = {
                "seal": seal,
                "min_seal": min_seal,
                "pass": seal >= min_seal,
                "score": score,
                "max": max_s,
            }
            sov_seals[sov_id] = seal
        # Sovereignty score
        total = sum((sov_seals[s] / 4) * SOV_OBJECTIVES[s]["weight"] for s in SOV_OBJECTIVES)
        results[provider]["_score"] = round(total * 100, 1)
        results[provider]["_pass"] = all(results[provider][s]["pass"] for s in SOV_OBJECTIVES)
    return results
