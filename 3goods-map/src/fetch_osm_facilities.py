#!/usr/bin/env python3
"""
Pull candidate donation-drop / receiving-point locations for Vietnam from
OpenStreetMap (Overpass API) -- the free, static-storable equivalent of
Singapore's gtp_locations.csv. Chosen over Google Places because Places'
ToS forbid permanently storing most returned fields (name, address, phone
-- only place_id indefinitely and lat/lon for 30 days), which breaks the
static-CSV pipeline this whole project uses. OSM data is ODbL-licensed:
free to keep permanently, with attribution.

Two OSM tag groups are pulled, corresponding to two different roles in
the "Li Xi Yeu Thuong" platform (see proposed idea.docx):

  - amenity=social_facility / office=charity: actual receiving
    organisations (nursing homes, group homes, shelters, day care,
    soup kitchens) -- these are the closest OSM equivalent to Singapore's
    AAC/FSC service points.
  - amenity=community_centre: mostly "Nha van hoa" (village/commune
    cultural houses) and "UBND" (commune people's committee) offices --
    these match the proposal doc's plan to route deliveries to local
    community centres/ward offices for secure handover rather than to
    individual addresses, so they're kept as a separate, much larger
    category rather than mixed in with real social-service providers.

Coverage caveat: OSM mapping density for small Vietnamese NGOs is
volunteer-driven and uneven -- treat this as a candidate list to verify,
not a complete registry.

Tries the official overpass-api.de endpoint first (per Overpass's usage
policy, which asks heavy users to prefer it) and falls back to community
mirrors if it's unreachable. Note: curl against overpass-api.de returned
HTTP 406 in this environment during testing, but plain urllib (used here)
worked fine -- a curl header/content-negotiation quirk, not a real block.

Output: data/donation_facilities_osm.csv
"""
import csv
import json
import time
import urllib.error
import urllib.request
from pathlib import Path

HERE = Path(__file__).resolve().parent
DATA = HERE.parent / "data"

ENDPOINTS = [
    "https://overpass-api.de/api/interpreter",
    "https://overpass.osm.ch/api/interpreter",
    "https://overpass.private.coffee/api/interpreter",
    "https://maps.mail.ru/osm/tools/overpass/api/interpreter",
]

QUERY = """
[out:json][timeout:100];
area["ISO3166-1"="VN"][admin_level=2]->.vn;
(
  node["amenity"="social_facility"](area.vn);
  way["amenity"="social_facility"](area.vn);
  node["office"="charity"](area.vn);
  way["office"="charity"](area.vn);
  node["amenity"="community_centre"](area.vn);
  way["amenity"="community_centre"](area.vn);
);
out center tags;
"""

CATEGORY_BY_TAG = {"social_facility": "social_facility", "charity": "charity", "community_centre": "community_centre"}


def fetch() -> dict:
    body = f"data={QUERY}".encode()
    last_err = None
    for url in ENDPOINTS:
        try:
            req = urllib.request.Request(url, data=body, headers={"User-Agent": "data4life-research/1.0"})
            with urllib.request.urlopen(req, timeout=120) as resp:
                print(f"fetched from {url}")
                return json.loads(resp.read())
        except (urllib.error.HTTPError, urllib.error.URLError, TimeoutError) as e:
            print(f"  {url} failed ({e}), trying next endpoint")
            last_err = e
            time.sleep(1)
    raise RuntimeError(f"all Overpass endpoints failed: {last_err}")


def main() -> None:
    data = fetch()
    elements = data["elements"]

    rows = []
    for e in elements:
        tags = e.get("tags", {})
        name = tags.get("name")
        if not name:
            continue
        lat = e.get("lat") or e.get("center", {}).get("lat")
        lon = e.get("lon") or e.get("center", {}).get("lon")
        if lat is None or lon is None:
            continue
        amenity_or_office = tags.get("amenity") or tags.get("office")
        rows.append({
            "name": name,
            "category": CATEGORY_BY_TAG.get(amenity_or_office, amenity_or_office),
            "subtype": tags.get("social_facility", ""),
            "lat": round(lat, 5),
            "lon": round(lon, 5),
            "addr_city": tags.get("addr:city", ""),
            "addr_province": tags.get("addr:province", tags.get("addr:state", "")),
            "addr_street": tags.get("addr:street", ""),
            "osm_type": e["type"],
            "osm_id": e["id"],
        })

    rows.sort(key=lambda r: (r["category"] != "social_facility", r["category"] != "charity", r["name"]))

    out_path = DATA / "donation_facilities_osm.csv"
    with open(out_path, "w", newline="") as fh:
        w = csv.DictWriter(fh, fieldnames=["name", "category", "subtype", "lat", "lon",
                                            "addr_city", "addr_province", "addr_street",
                                            "osm_type", "osm_id"])
        w.writeheader()
        w.writerows(rows)

    by_cat = {}
    for r in rows:
        by_cat[r["category"]] = by_cat.get(r["category"], 0) + 1
    print(f"{len(rows)} named facilities -> {out_path}")
    for cat, n in sorted(by_cat.items(), key=lambda x: -x[1]):
        print(f"  {cat:<20} {n}")

    # Separate, smaller JSON of just the real receiving orgs (not the ~1300
    # community_centre/ward-office points, which are a different category --
    # last-mile handover locations, not donation-receiving organisations --
    # and too numerous to plot as individual map markers). Map fetches this
    # directly; the full CSV above stays the complete reference dataset.
    orgs = [r for r in rows if r["category"] in ("social_facility", "charity")]
    json_path = DATA / "donation_facilities_osm.json"
    with open(json_path, "w") as fh:
        json.dump(orgs, fh, separators=(",", ":"))
    print(f"{len(orgs)} social_facility/charity orgs -> {json_path} (for the map layer)")


if __name__ == "__main__":
    main()
