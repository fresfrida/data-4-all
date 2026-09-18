#!/usr/bin/env python3
"""
Province-level disaster exposure index for Vietnam (EM-DAT, 1900-2024).

Input (data/):
  - disaster-in-vietnam_1900-to-2024.xlsx  ("Data" sheet, EM-DAT public table)

Only 162/335 events carry an "Admin Units" tag (adm1-level province name);
the rest are national/unlocated and are excluded from the province rollup
(counted separately as "untagged" in the summary print).

An event listing N provinces is credited to ALL N provinces equally for
event_count (it happened there), but deaths/damage are NOT split by N --
EM-DAT reports those totals at the event level, not per-province, so
splitting would fabricate precision the source data doesn't have. Instead
each listed province gets the event's full totals, and a `province_count`
column is kept so multi-province events (eg. a typhoon hitting 7 provinces)
are visible and can be down-weighted downstream if needed.

Method (transparent by design -- weights adjustable):
  freq(p)  = norm(event_count)
  death(p) = norm(total_deaths)
  dmg(p)   = norm(total_damage_usd)
  disaster_score(p) = w1*freq(p) + w2*death(p) + w3*dmg(p)

Recency: also reports last_event_year and events_since_2000 so a
downstream "need" layer can distinguish chronic vs. historical-only risk.

year_counts is a JSON string {year: event_count} per province, kept for
the map's per-province year-by-year breakdown on click.

Writes data/disaster_province_index.csv sorted by disaster_score.
"""
import json
from pathlib import Path

import openpyxl

HERE = Path(__file__).resolve().parent
DATA = HERE.parent / "data"

XLSX = DATA / "disaster-in-vietnam_1900-to-2024.xlsx"

W_FREQ = 1 / 3
W_DEATH = 1 / 3
W_DAMAGE = 1 / 3


def to_num(val) -> float:
    if val is None or val == "":
        return 0.0
    return float(val)


def minmax(vals: list[float]) -> list[float]:
    mn, mx = min(vals), max(vals)
    if mx == mn:
        return [0.0] * len(vals)
    return [(x - mn) / (mx - mn) for x in vals]


def load_events() -> list[dict]:
    wb = openpyxl.load_workbook(XLSX, read_only=True, data_only=True)
    ws = wb["Data"]
    rows = list(ws.iter_rows(values_only=True))
    header = rows[0]
    idx = {h: i for i, h in enumerate(header)}

    events = []
    for r in rows[1:]:
        admin_raw = r[idx["Admin Units"]]
        provinces = []
        if admin_raw:
            try:
                for unit in json.loads(admin_raw):
                    name = unit.get("adm1_name")
                    if name:
                        provinces.append(name.strip())
            except (json.JSONDecodeError, AttributeError):
                pass
        events.append({
            "provinces": sorted(set(provinces)),
            "disaster_type": r[idx["Disaster Type"]],
            "start_year": r[idx["Start Year"]],
            "deaths": to_num(r[idx["Total Deaths"]]),
            "damage_000usd": to_num(r[idx["Total Damage ('000 US$)"]]),
        })
    return events


def main() -> None:
    events = load_events()
    tagged = [e for e in events if e["provinces"]]
    print(f"{len(tagged)}/{len(events)} events carry a province tag")

    by_province: dict[str, dict] = {}
    for e in tagged:
        for p in e["provinces"]:
            rec = by_province.setdefault(p, {
                "province": p, "event_count": 0, "total_deaths": 0.0,
                "total_damage_000usd": 0.0, "last_event_year": 0,
                "events_since_2000": 0, "disaster_types": set(),
                "max_provinces_per_event": 0, "year_counts": {},
            })
            rec["event_count"] += 1
            rec["total_deaths"] += e["deaths"]
            rec["total_damage_000usd"] += e["damage_000usd"]
            year = e["start_year"] or 0
            rec["last_event_year"] = max(rec["last_event_year"], year)
            if year >= 2000:
                rec["events_since_2000"] += 1
            if year:
                rec["year_counts"][year] = rec["year_counts"].get(year, 0) + 1
            rec["disaster_types"].add(e["disaster_type"])
            rec["max_provinces_per_event"] = max(rec["max_provinces_per_event"], len(e["provinces"]))

    provinces = list(by_province.values())
    norm_freq = minmax([p["event_count"] for p in provinces])
    norm_death = minmax([p["total_deaths"] for p in provinces])
    norm_dmg = minmax([p["total_damage_000usd"] for p in provinces])

    for i, p in enumerate(provinces):
        p["disaster_score"] = round(
            W_FREQ * norm_freq[i] + W_DEATH * norm_death[i] + W_DAMAGE * norm_dmg[i], 4)
        p["disaster_types"] = "; ".join(sorted(p["disaster_types"]))
        p["total_deaths"] = int(p["total_deaths"])
        p["total_damage_000usd"] = round(p["total_damage_000usd"], 1)
        p["year_counts"] = json.dumps(dict(sorted(p["year_counts"].items())))

    provinces.sort(key=lambda p: p["disaster_score"], reverse=True)

    cols = ["province", "event_count", "events_since_2000", "last_event_year",
            "total_deaths", "total_damage_000usd", "disaster_types",
            "max_provinces_per_event", "year_counts", "disaster_score"]

    import csv
    out_path = DATA / "disaster_province_index.csv"
    with open(out_path, "w", newline="") as fh:
        w = csv.DictWriter(fh, fieldnames=cols)
        w.writeheader()
        w.writerows(provinces)

    print(f"{len(provinces)} provinces scored -> {out_path}")
    print("\nTop 10 Disaster Score:")
    for p in provinces[:10]:
        print(f"{p['province']:<20} events={p['event_count']:<3} deaths={p['total_deaths']:<6} "
              f"damage(k$)={p['total_damage_000usd']:<12} score={p['disaster_score']:.4f}")


if __name__ == "__main__":
    main()
