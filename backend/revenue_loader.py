"""
revenue_loader.py
Loads financial/fin_*.json - the per-provider revenue history compiled from
primary company filings (2015-2026).

Each file carries, per year, the parent company's revenue and the cloud arm's
revenue, plus a status word saying why a figure is absent when it is. The
loader keeps those status words intact so the chart can show an absence as an
absence rather than as a zero.
"""

import json
from pathlib import Path

# Statuses that mean "a number was published"
_HAS_VALUE = {"reported", "rounded", "approximate"}


def _load_fx(financial_dir) -> dict:
    """
    ECB annual average EUR/USD reference rates, one per year. A single rate
    applied across the whole window moves the euro heights by up to eight per
    cent in some years for reasons that have nothing to do with the company.
    """
    f = Path(financial_dir) / "fx_eur_usd.json"
    if not f.exists():
        print(f"[revenue_loader] WARNING: no FX file at {f}")
        return {}
    with open(f, encoding="utf-8-sig") as fp:
        doc = json.load(fp)
    return {int(y): r["eur_per_usd"] for y, r in doc.get("rates", {}).items()}


def _to_eur(value, currency, year, fx, fallback):
    """Convert with the year's own rate; fall back only if that year has none."""
    if value is None:
        return None
    if currency != "USD":
        return round(value, 1)
    return round(value * fx.get(year, fallback), 1)


def load_revenue(financial_dir, usd_to_eur: float) -> dict:
    """
    Returns {
      "providers": [ { key, entity, parent_name, currency, fiscal_year_end,
                       fiscal_year_note, notes, sources } ],
      "rows":      [ { year, <key>_parent, <key>_cloud, <key>_parent_ex_cloud,
                       <key>_cloud_status, ... } ],
      "cells":     { key: { year: {...full record...} } }
    }
    Values in rows are EUR millions; the original figures stay in "cells".
    """
    path = Path(financial_dir)
    fx = _load_fx(financial_dir)
    europe_raw: dict[str, dict] = {}
    providers: list[dict] = []
    cells: dict[str, dict] = {}
    years: set[int] = set()

    if not path.exists():
        print(f"[revenue_loader] WARNING: directory not found: {path}")
        return {"providers": [], "rows": [], "cells": {}}

    for f in sorted(path.glob("fin_*.json")):
        try:
            with open(f, encoding="utf-8-sig") as fp:
                doc = json.load(fp)
        except Exception as e:
            print(f"[revenue_loader] ERROR {f.name}: {e}")
            continue

        key = doc["key"]
        currency = doc.get("currency", "EUR")
        providers.append({
            "key":               key,
            "entity":            doc.get("entity"),
            "entity_note":       doc.get("entity_note"),
            "parent_name":       doc.get("parent", {}).get("name"),
            "parent_relation":   doc.get("parent", {}).get("relationship"),
            "currency":          currency,
            "unit":              doc.get("unit"),
            "fiscal_year_end":   doc.get("fiscal_year_end"),
            "fiscal_year_note":  doc.get("fiscal_year_note"),
            "notes":             doc.get("notes", []),
            "sources":           doc.get("sources", []),
            # The nearest disclosed figure where the cloud arm itself is not
            # published. Each file declares its own, including whether the
            # figure is a ceiling on the cloud arm or a floor under it.
            "proxy":             doc.get("proxy"),
        })
        europe_raw[key]   = doc.get("europe") or {}
        proxy_field       = (doc.get("proxy") or {}).get("field")
        proxy_basis_field = (doc.get("proxy") or {}).get("basis_field")

        by_year: dict[int, dict] = {}
        for row in doc.get("series", []):
            yr = row["year"]
            years.add(yr)

            p_ok = row.get("parent_status") in _HAS_VALUE
            c_ok = row.get("cloud_status") in _HAS_VALUE
            parent = _to_eur(row.get("parent"), currency, yr, fx, usd_to_eur) if p_ok else None
            cloud  = _to_eur(row.get("cloud"),  currency, yr, fx, usd_to_eur) if c_ok else None

            # The stack is [parent excluding cloud] + [cloud], so the two
            # segments add up to the parent's own reported revenue and nothing
            # is counted twice.
            ex_cloud = None
            if parent is not None:
                ex_cloud = round(parent - cloud, 1) if cloud is not None else parent

            # How much of the group the cloud arm is. This is the one measure
            # that puts all six on a single axis: the groups themselves span
            # three orders of magnitude and a euro axis cannot hold them.
            share = None
            if parent and cloud is not None:
                share = round(cloud / parent * 100, 1)

            # Years where the cloud figure is not on the same basis as the one
            # before it, so a share line must not be read as a real movement.
            basis_note = None
            if row.get("cloud_basis"):
                basis_note = row["cloud_basis"]
            elif row.get("cloud_restated") is not None:
                basis_note = "restated in a later report"

            by_year[yr] = {
                "year":           yr,
                "parent":         parent,
                "parent_status":  row.get("parent_status"),
                "parent_source":  row.get("parent_source"),
                "cloud":          cloud,
                "cloud_status":   row.get("cloud_status"),
                "cloud_source":   row.get("cloud_source"),
                "parent_ex_cloud": ex_cloud,
                "share_pct":       share,
                "basis_note":      basis_note,
                "proxy":           row.get(proxy_field) if proxy_field else None,
                "proxy_basis":     row.get(proxy_basis_field) if proxy_basis_field else None,
                "proxy_share_pct": (
                    round(row[proxy_field] / parent * 100, 1)
                    if proxy_field and row.get(proxy_field) is not None and parent
                    else None
                ),
                # Figures kept alongside the main two but deliberately not
                # charted as cloud revenue: a predecessor segment, a division,
                # a statutory single-entity filing, a restated figure.
                "context": {
                    k: v for k, v in row.items()
                    if k not in ("year", "parent", "parent_status", "parent_source",
                                 "cloud", "cloud_status", "cloud_source")
                },
                "original_currency": currency,
                "fx_eur_per_usd":    fx.get(yr) if currency == "USD" else None,
                "original_parent":   row.get("parent"),
                "original_cloud":    row.get("cloud"),
            }
        cells[key] = by_year
        print(f"[revenue_loader] Loaded: {key} ({len(by_year)} years) from {f.name}")

    rows = []
    for yr in sorted(years):
        row: dict = {"year": yr}
        for key, by_year in cells.items():
            c = by_year.get(yr)
            if not c:
                continue
            row[f"{key}__parent"]       = c["parent"]
            row[f"{key}__cloud"]        = c["cloud"]
            row[f"{key}__parent_ex"]    = c["parent_ex_cloud"]
            row[f"{key}__cloud_status"] = c["cloud_status"]
            row[f"{key}__share"]        = c["share_pct"]
            row[f"{key}__proxy"]        = c["proxy"]
            row[f"{key}__proxy_share"]  = c["proxy_share_pct"]
        rows.append(row)

    # How many times larger AWS's cloud arm is than each European one, in the
    # same year and the same currency. Where the cloud arm is undisclosed the
    # ratio is taken against the proxy and inherits its direction: against a
    # ceiling the ratio is a floor, against a floor it is a ceiling.
    aws = cells.get("AWS", {})
    for row in rows:
        yr = row["year"]
        base = (aws.get(yr) or {}).get("cloud")
        if not base:
            continue
        for p in providers:
            key = p["key"]
            if key == "AWS":
                continue
            c = cells[key].get(yr) or {}
            val, kind = c.get("cloud"), "reported"
            if val is None and c.get("proxy"):
                val, kind = c["proxy"], (p.get("proxy") or {}).get("bound")
            if val:
                row[f"{key}__vs_aws"] = round(base / val, 1)
                row[f"{key}__vs_aws_kind"] = kind

    # Compound annual growth, cloud arm against the group that owns it. A cloud
    # arm outgrowing its parent is one the parent has reason to keep funding.
    def _cagr(series):
        yrs = sorted(series)
        if len(yrs) < 2:
            return None
        a, b, n = series[yrs[0]], series[yrs[-1]], yrs[-1] - yrs[0]
        if not a or not b or n <= 0:
            return None
        return {"pct": round(((b / a) ** (1 / n) - 1) * 100, 1),
                "from": yrs[0], "to": yrs[-1], "years": n}

    def _consistent_basis_run(by_year):
        """
        Proxy values restricted to the most recent stretch of years that share
        one basis. Where a file declares no basis the whole series is returned.
        """
        vals = {y: c["proxy"] for y, c in by_year.items() if c["proxy"] is not None}
        bases = {y: by_year[y]["proxy_basis"] for y in vals}
        if not vals or not any(bases.values()):
            return vals
        latest = bases[max(vals)]
        return {y: v for y, v in vals.items() if bases[y] == latest}

    # Share of revenue earned inside Europe. Only the parent groups disclose
    # geography, and they disclose it differently: an exact region table, a
    # country list that happens to be entirely European, a domestic split that
    # only sets a lower limit, or nothing at all. The kind travels with the
    # numbers so the chart can draw each one for what it is.
    europe = {
        "rows": [],
        "providers": [],
    }
    for p in providers:
        key = p["key"]
        blk = europe_raw.get(key) or {}
        europe["providers"].append({
            "key":     key,
            "kind":    blk.get("kind", "not disclosed"),
            "measure": blk.get("measure"),
            "note":    blk.get("note"),
            "sources": blk.get("sources", []),
            "years":   sorted(int(y) for y in (blk.get("series") or {})),
        })
    eur_years = sorted({y for ep in europe["providers"] for y in ep["years"]})
    for yr in eur_years:
        row = {"year": yr}
        for p in providers:
            blk = europe_raw.get(p["key"], {})
            rec = (blk.get("series") or {}).get(str(yr))
            if rec:
                row[f"{p['key']}__eu"]      = rec.get("pct")
                row[f"{p['key']}__eu_kind"] = rec.get("kind")
                if rec.get("countries"):
                    row[f"{p['key']}__eu_countries"] = rec["countries"]
        europe["rows"].append(row)

    growth = []
    for p in providers:
        key = p["key"]
        by = cells[key]
        growth.append({
            "key":    key,
            "parent": _cagr({y: c["parent"] for y, c in by.items() if c["parent"] is not None}),
            "cloud":  _cagr({y: c["cloud"] for y, c in by.items() if c["cloud"] is not None}),
            # Growth of a proxy whose definition changed mid-window is taken
            # within its latest consistent basis only. Measured across a
            # redefinition it reports a collapse that never happened.
            "proxy":  _cagr(_consistent_basis_run(by)),
            "proxy_label": (p.get("proxy") or {}).get("short_label"),
            "proxy_bound": (p.get("proxy") or {}).get("bound"),
        })

    # Which providers can carry a share line at all, and why the rest cannot.
    # The frontend prints this rather than leaving three providers silently
    # absent from the combined chart.
    share_coverage = []
    for p in providers:
        key = p["key"]
        yrs = [y for y, c in cells[key].items() if c["share_pct"] is not None]
        reasons = {
            c["cloud_status"] for c in cells[key].values()
            if c["share_pct"] is None and c["cloud_status"] != "not_yet_reported"
        }
        share_coverage.append({
            "key":        key,
            "years":      sorted(yrs),
            "first_year": min(yrs) if yrs else None,
            "reasons":    sorted(reasons),
        })

    return {
        "fx":             {"eur_per_usd": fx,
                           "source": "ECB euro reference exchange rate, annual average (EXR.A.USD.EUR.SP00.A)"},
        "providers":      providers,
        "rows":           rows,
        "cells":          cells,
        "share_coverage": share_coverage,
        "growth":         growth,
        "europe":         europe,
    }
