"""
Reads all provider JSON files from benchmarking/data/ and returns a
structured dict the /api/benchmarks endpoint can serve directly.
"""

import json
from pathlib import Path

BENCH_DIR = Path(__file__).parent.parent / "benchmarking" / "data"

_DISPLAY_NAME = {
    "ovhcloud": "OVHcloud",
    "scaleway":  "Scaleway",
    "ionos":     "IONOS",
    "stackit":   "STACKIT",
    "tcloud":    "T-Cloud Public",
    "aws":       "AWS",
}


def _find(profiles: list, name: str) -> dict:
    for p in profiles:
        if p["profile"] == name:
            return p
    raise KeyError(f"Profile '{name}' not found in provider data")


def _stat_key(profile: dict, key: str) -> dict:
    """Stats for a nested operation key (e.g. TRIAD in stream, upload in iperf3)."""
    return {
        "avg": profile["avg"][key],
        "min": profile["min"][key],
        "max": profile["max"][key],
        "n":   len(profile["runs"][key]),
    }


def _stat_flat(profile: dict) -> dict:
    """Stats for a flat (non-nested) profile like postmark, apache, boot_time."""
    return {
        "avg": profile["avg"],
        "min": profile["min"],
        "max": profile["max"],
        "n":   len(profile["runs"]),
    }


def load_benchmarks() -> dict:
    result = {}
    for path in sorted(BENCH_DIR.glob("*.json")):
        raw = json.loads(path.read_text(encoding="utf-8"))
        pid  = raw["provider"]
        name = _DISPLAY_NAME.get(pid, pid)
        profs = raw["profiles"]

        stream  = _find(profs, "pts/stream")
        hint    = _find(profs, "pts/hint")
        comp    = _find(profs, "pts/compress-7zip")
        pm      = _find(profs, "pts/postmark")
        apache  = _find(profs, "pts/apache")
        iperf   = _find(profs, "iperf3")
        boot    = _find(profs, "boot_time")
        setup   = _find(profs, "setup_time")

        result[name] = {
            "price_eur_per_hr": raw["price_eur_per_hr"],
            "instance":         raw["instance"],
            "storage":          raw.get("storage", ""),
            "vcpu":             raw.get("vcpu", 2),
            "ram_gb":           raw.get("ram_gb", 8),
            # Memory IO — TRIAD used for heatmap
            "stream": {
                "COPY":  _stat_key(stream, "COPY"),
                "SCALE": _stat_key(stream, "SCALE"),
                "ADD":   _stat_key(stream, "ADD"),
                "TRIAD": _stat_key(stream, "TRIAD"),
            },
            # CPU single — raw MIPS / 1e6 → M MIPS for display
            "hint": {
                "avg": hint["avg"] / 1_000_000,
                "min": hint["min"] / 1_000_000,
                "max": hint["max"] / 1_000_000,
                "n":   len(hint["runs"]),
            },
            # CPU multi — compression MIPS used for heatmap
            "compress": {
                "comp":   _stat_key(comp, "compression"),
                "decomp": _stat_key(comp, "decompression"),
            },
            "postmark":  _stat_flat(pm),
            "apache":    _stat_flat(apache),
            # Network — upload used for heatmap
            "iperf": {
                "upload":   _stat_key(iperf, "upload"),
                "download": _stat_key(iperf, "download"),
            },
            "boot_time":  _stat_flat(boot),
            "setup_time": _stat_flat(setup),
        }

    return result
