#!/usr/bin/env python3
"""Join disaster_province_index.csv to Vietnam province GeoJSON for the map.

Boundaries (data/vn_provinces.geojson) are GADM v4.1 ADM1 -- the pre-2025
63-province layout, chosen deliberately because EM-DAT's Admin Units field
(source: disaster_index.py) uses the same pre-merger province names. A
current (post Decree 19/2025) HDX boundary file has only 34 provinces and
would silently fail to match half these names.

GADM names are diacritic-stripped and unspaced ("BàRịa-VũngTàu" ->
"bariavungtau"); EM-DAT names are ASCII with spaces and an occasional
"City" suffix ("Ba Ria-Vung Tau", "Da Nang City"). normalize() folds both
to the same bare-alnum-lowercase key so they join.

"Ha Tay" (EM-DAT) was merged into Hanoi in 2008 and has no GADM polygon of
its own; its disaster stats are folded into "Ha Noi City" rather than
dropped.

Also joins poverty_region_proxy.csv (src/poverty_proxy.py) the same way --
see that module's docstring for why it's a region-level proxy, not real
province data, and how to swap in real data later without touching this
join logic.

priority_score combines hazard (disaster_score) with need (poverty_rate,
min-max normalized across provinces) 50/50 -- a basic Risk = Hazard x
Vulnerability framing. It reorders things a raw disaster count misses:
eg. the Central Highlands (Dak Lak, Kon Tum, Gia Lai, Lam Dong) has only
moderate storm/flood history but the country's highest poverty rate, so it
jumps into the top of priority_score despite ranking well outside the top
10 on disaster_score alone. A province with no tagged disaster events
contributes hazard=0 to its priority_score rather than being excluded, so
it can still surface on poverty alone.

coverage_gap_score = priority_score * (1 - coverage), where coverage comes
from coverage_gap.py's spatial join of OSM facility points into these same
polygons. This is the organization-facing metric: it answers "where is
need highest AND existing donation infrastructure thinnest", which is a
different question from priority_score alone (a province can be high-need
but already well-served, or vice versa).

Output: data/vn_map_data.js -> window.VN_MAP_DATA (GeoJSON, disaster_score
and friends added to each province's properties).
"""
import csv
import json
import unicodedata
from pathlib import Path

HERE = Path(__file__).resolve().parent
DATA = HERE.parent / "data"

MERGE_INTO = {"ha tay": "ha noi city"}

W_HAZARD = 0.5
W_NEED = 0.5


def normalize(name: str) -> str:
    # Vietnamese D-with-stroke (d/D) is a distinct letter, not base+combining
    # mark, so NFKD alone won't strip it -- fold it to plain "d" first.
    name = name.replace("đ", "d").replace("Đ", "D")
    name = unicodedata.normalize("NFKD", name)
    name = "".join(c for c in name if not unicodedata.combining(c))
    name = name.lower().replace("city", "").replace("-", "").replace(" ", "")
    return name.strip()


def main() -> None:
    lookup = {}
    with open(DATA / "disaster_province_index.csv") as fh:
        for r in csv.DictReader(fh):
            key = r["province"].strip().lower()
            key = MERGE_INTO.get(key, key)
            norm_key = normalize(key)
            d = {
                "event_count": int(r["event_count"]),
                "events_since_2000": int(r["events_since_2000"]),
                "last_event_year": int(r["last_event_year"]),
                "total_deaths": int(r["total_deaths"]),
                "total_damage_000usd": float(r["total_damage_000usd"]),
                "disaster_types": r["disaster_types"],
                "disaster_score": float(r["disaster_score"]),
                "year_counts": json.loads(r["year_counts"]) if r["year_counts"] else {},
            }
            if norm_key in lookup:
                # Ha Tay folded into Ha Noi City: combine rather than overwrite
                existing = lookup[norm_key]
                existing["event_count"] += d["event_count"]
                existing["events_since_2000"] += d["events_since_2000"]
                existing["last_event_year"] = max(existing["last_event_year"], d["last_event_year"])
                existing["total_deaths"] += d["total_deaths"]
                existing["total_damage_000usd"] += d["total_damage_000usd"]
                existing["disaster_types"] = "; ".join(sorted(set(
                    existing["disaster_types"].split("; ") + d["disaster_types"].split("; "))))
                existing["disaster_score"] = max(existing["disaster_score"], d["disaster_score"])
                for year, count in d["year_counts"].items():
                    existing["year_counts"][year] = existing["year_counts"].get(year, 0) + count
            else:
                lookup[norm_key] = d

    poverty_lookup = {}
    with open(DATA / "poverty_region_proxy.csv") as fh:
        for r in csv.DictReader(fh):
            poverty_lookup[normalize(r["province"])] = {
                "poverty_rate": float(r["poverty_rate"]),
                "poverty_region": r["region"],
                "poverty_data_level": r["poverty_data_level"],
                "poverty_source": r["source"],
            }

    geo = json.load(open(DATA / "vn_provinces.geojson"))

    hits = 0
    poverty_hits = 0
    matched_keys = set()
    for f in geo["features"]:
        p = f["properties"]
        name = p["NAME_1"]
        norm_key = normalize(name)
        vals = lookup.get(norm_key)
        if vals is not None:
            hits += 1
            matched_keys.add(norm_key)
        p.clear()
        p["province"] = name
        p.update(vals or {"event_count": 0, "events_since_2000": 0, "last_event_year": None,
                           "total_deaths": 0, "total_damage_000usd": 0.0,
                           "disaster_types": "", "disaster_score": None, "year_counts": {}})
        pov = poverty_lookup.get(norm_key)
        if pov is not None:
            poverty_hits += 1
        p.update(pov or {"poverty_rate": None, "poverty_region": None,
                          "poverty_data_level": None, "poverty_source": None})

    poverty_vals = [f["properties"]["poverty_rate"] for f in geo["features"]
                    if f["properties"]["poverty_rate"] is not None]
    p_lo, p_hi = min(poverty_vals), max(poverty_vals)
    for f in geo["features"]:
        p = f["properties"]
        if p["poverty_rate"] is None:
            p["priority_score"] = None
            continue
        poverty_norm = (p["poverty_rate"] - p_lo) / (p_hi - p_lo) if p_hi > p_lo else 0.0
        hazard = p["disaster_score"] if p["disaster_score"] is not None else 0.0
        p["priority_score"] = round(W_HAZARD * hazard + W_NEED * poverty_norm, 4)

    coverage_lookup = {}
    with open(DATA / "coverage_gap.csv") as fh:
        for r in csv.DictReader(fh):
            coverage_lookup[r["province"]] = {"facility_count": int(r["facility_count"]), "coverage": float(r["coverage"])}

    for f in geo["features"]:
        p = f["properties"]
        cov = coverage_lookup.get(p["province"])
        p["facility_count"] = cov["facility_count"] if cov else None
        p["coverage"] = cov["coverage"] if cov else None
        p["coverage_gap_score"] = (round(p["priority_score"] * (1 - p["coverage"]), 4)
                                    if cov and p["priority_score"] is not None else None)

    def rnd(c):
        return [rnd(x) for x in c] if isinstance(c[0], list) else [round(c[0], 5), round(c[1], 5)]

    for f in geo["features"]:
        f["geometry"]["coordinates"] = rnd(f["geometry"]["coordinates"])

    print(f"joined {hits}/{len(geo['features'])} provinces (disaster), {poverty_hits}/{len(geo['features'])} (poverty proxy)")
    unmatched = set(lookup.keys()) - matched_keys
    if unmatched:
        print(f"WARNING: {len(unmatched)} disaster-index provinces did not match a polygon: {sorted(unmatched)}")

    with open(DATA / "vn_map_data.js", "w") as fh:
        fh.write("window.VN_MAP_DATA = ")
        json.dump(geo, fh, separators=(",", ":"))
        fh.write(";")
    print("wrote data/vn_map_data.js")


if __name__ == "__main__":
    main()
