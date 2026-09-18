#!/usr/bin/env python3
"""
Coverage-gap score per province: combines priority_score (hazard + poverty
need, from build_map_data.py) with how much existing donation-reachable
infrastructure already sits in that province -- the organization-facing
counterpart to the donor-facing priority_score.

  facility_count(p)   = OSM points from fetch_osm_facilities.py that fall
                         inside province p's polygon (both the specialised
                         social_facility/charity orgs AND the much larger
                         community_centre/ward-office set, since the latter
                         are legitimate donation drop/handover points per
                         proposed idea.docx, not just background noise).
  coverage(p)          = norm(facility_count(p))  -- 0..1, more points = more
                         reachable infrastructure already in place.
  coverage_gap_score(p) = priority_score(p) * (1 - coverage(p))

This is the same Risk*(1-Coverage) shape as Singapore's gap_score in
coverage_layer.py. Caveat carried through to the output and the org UI:
facility_count is a raw count, NOT adjusted for population or land area --
no per-province population figure exists in this dataset (unlike
Singapore's census data), so a big, dense province and a big, empty one
with the same count would show the same "coverage". Good enough to rank
"where is infrastructure thinnest relative to need", not to compare
per-capita access.

Point-in-polygon uses a plain ray-casting test (no geo library dependency)
against data/vn_provinces.geojson -- the same GADM boundaries build_map_data.py
joins disaster/poverty data onto, so results line up with the same 63 provinces.

This script only does the spatial join (facility_count, coverage) -- it
deliberately does NOT compute coverage_gap_score itself, to avoid one script
depending on another script's output (priority_score lives in
build_map_data.py, computed from disaster + poverty). build_map_data.py
reads this file's output and does the final `priority_score * (1-coverage)`
multiplication itself, the same way it already derives priority_score.

Output: data/coverage_gap.csv (province, facility_count, coverage).
"""
import csv
import json
from pathlib import Path

HERE = Path(__file__).resolve().parent
DATA = HERE.parent / "data"


def point_in_ring(x: float, y: float, ring: list) -> bool:
    """Ray-casting test: is (x,y) inside this single linear ring."""
    inside = False
    n = len(ring)
    x1, y1 = ring[0]
    for i in range(1, n + 1):
        x2, y2 = ring[i % n]
        if ((y1 > y) != (y2 > y)) and (x < (x2 - x1) * (y - y1) / (y2 - y1) + x1):
            inside = not inside
        x1, y1 = x2, y2
    return inside


def point_in_polygon(lon: float, lat: float, geometry: dict) -> bool:
    polys = [geometry["coordinates"]] if geometry["type"] == "Polygon" else geometry["coordinates"]
    for rings in polys:
        # exterior ring must contain the point; holes (rings[1:]) subtract
        if point_in_ring(lon, lat, rings[0]):
            if not any(point_in_ring(lon, lat, hole) for hole in rings[1:]):
                return True
    return False


def minmax(vals: list) -> list:
    mn, mx = min(vals), max(vals)
    if mx == mn:
        return [0.0] * len(vals)
    return [(v - mn) / (mx - mn) for v in vals]


def main() -> None:
    geo = json.load(open(DATA / "vn_provinces.geojson"))
    facilities = json.load(open(DATA / "donation_facilities_osm.json"))
    # Note: donation_facilities_osm.json holds only the 89 social_facility/
    # charity orgs (see fetch_osm_facilities.py); read the full CSV for
    # community_centre points too, since those count as reachable
    # infrastructure for this coverage metric even though they're a
    # different role (handover point, not a receiving org).
    with open(DATA / "donation_facilities_osm.csv") as fh:
        all_points = list(csv.DictReader(fh))

    counts = {f["properties"]["NAME_1"]: 0 for f in geo["features"]}
    unmatched = 0
    for pt in all_points:
        lon, lat = float(pt["lon"]), float(pt["lat"])
        found = False
        for f in geo["features"]:
            if point_in_polygon(lon, lat, f["geometry"]):
                counts[f["properties"]["NAME_1"]] += 1
                found = True
                break
        if not found:
            unmatched += 1

    print(f"{len(all_points)} points spatially joined, {unmatched} fell outside all province polygons")

    rows = [{"province": name, "facility_count": count} for name, count in counts.items()]
    norm_counts = minmax([r["facility_count"] for r in rows])
    for r, cov in zip(rows, norm_counts):
        r["coverage"] = round(cov, 4)
    rows.sort(key=lambda r: r["facility_count"])

    out_path = DATA / "coverage_gap.csv"
    with open(out_path, "w", newline="") as fh:
        w = csv.DictWriter(fh, fieldnames=["province", "facility_count", "coverage"])
        w.writeheader()
        w.writerows(rows)

    print(f"wrote {out_path}")
    print("\nLowest facility coverage:")
    for r in rows[:10]:
        print(f"{r['province']:<20} facilities={r['facility_count']:<4} coverage={r['coverage']:.3f}")


if __name__ == "__main__":
    main()
