#!/usr/bin/env python3
"""
Poverty proxy for Vietnam provinces -- REGIONAL, not province-level.

No open province-level poverty dataset was found (GSO/NSO, who would
publish one, are unreachable from this environment). What exists instead
is the UNDP/MOLISA "Multidimensional Poverty in Viet Nam" report (2018/19,
calculated from VHLSS survey data), which only breaks the 2016 MDP
(multidimensional poverty) rate down to Vietnam's 6 standard
socio-economic regions -- not all 63 provinces.

This script assigns every province its REGION's rate as a stand-in, using
the standard, fixed GSO 6-region grouping. It is a coarse proxy: every
province in a region gets the exact same number, so it says nothing about
variation within a region (eg. it can't distinguish a poor and a well-off
province that are both in the North Central Coast).

Swap-in design: if/when real per-province poverty data turns up, replace
just this script's REGION_RATE table + PROVINCE_REGION lookup with a
per-province CSV read, but keep writing the same output columns
(province, poverty_rate, poverty_data_level, source). build_map_data.py's
join and index.html's display code read those column names generically
and don't need to change -- only poverty_data_level flips from "region"
to "province" and the caveat badge disappears on its own.

Output: data/poverty_region_proxy.csv
"""
import csv
from pathlib import Path

HERE = Path(__file__).resolve().parent
DATA = HERE.parent / "data"

SOURCE = "UNDP/MOLISA Multidimensional Poverty in Viet Nam (2016 MDP rate, VHLSS)"

# 2016 multidimensional poverty rate (%) by region, Figure 1.1.22 of the report.
REGION_RATE = {
    "Red River Delta": 1.7,
    "Northern Midlands and Mountains": 18.5,
    "North Central and Central Coast": 8.2,
    "Central Highlands": 26.4,
    "South East": 5.6,
    "Mekong River Delta": 19.2,
}

# Standard, fixed GSO 6-region grouping of Vietnam's 63 (pre-2025) provinces.
# Names match disaster_province_index.csv / EM-DAT spelling so build_map_data.py
# can join both files with the same normalize() function.
PROVINCE_REGION = {
    # Red River Delta (11)
    "Ha Noi City": "Red River Delta", "Hai Phong City": "Red River Delta",
    "Vinh Phuc": "Red River Delta", "Bac Ninh": "Red River Delta",
    "Quang Ninh": "Red River Delta", "Hai Duong": "Red River Delta",
    "Hung Yen": "Red River Delta", "Thai Binh": "Red River Delta",
    "Ha Nam": "Red River Delta", "Nam Dinh": "Red River Delta",
    "Ninh Binh": "Red River Delta",
    # Northern Midlands and Mountains (14)
    "Ha Giang": "Northern Midlands and Mountains", "Cao Bang": "Northern Midlands and Mountains",
    "Bac Kan": "Northern Midlands and Mountains", "Tuyen Quang": "Northern Midlands and Mountains",
    "Lao Cai": "Northern Midlands and Mountains", "Yen Bai": "Northern Midlands and Mountains",
    "Thai Nguyen": "Northern Midlands and Mountains", "Lang Son": "Northern Midlands and Mountains",
    "Bac Giang": "Northern Midlands and Mountains", "Phu Tho": "Northern Midlands and Mountains",
    "Dien Bien": "Northern Midlands and Mountains", "Lai Chau": "Northern Midlands and Mountains",
    "Son La": "Northern Midlands and Mountains", "Hoa Binh": "Northern Midlands and Mountains",
    # North Central and Central Coast (14)
    "Thanh Hoa": "North Central and Central Coast", "Nghe An": "North Central and Central Coast",
    "Ha Tinh": "North Central and Central Coast", "Quang Binh": "North Central and Central Coast",
    "Quang Tri": "North Central and Central Coast", "Thua Thien - Hue": "North Central and Central Coast",
    "Da Nang City": "North Central and Central Coast", "Quang Nam": "North Central and Central Coast",
    "Quang Ngai": "North Central and Central Coast", "Binh Dinh": "North Central and Central Coast",
    "Phu Yen": "North Central and Central Coast", "Khanh Hoa": "North Central and Central Coast",
    "Ninh Thuan": "North Central and Central Coast", "Binh Thuan": "North Central and Central Coast",
    # Central Highlands (5)
    "Kon Tum": "Central Highlands", "Gia Lai": "Central Highlands",
    "Dak Lak": "Central Highlands", "Dak Nong": "Central Highlands",
    "Lam Dong": "Central Highlands",
    # South East (6)
    "Ho Chi Minh City": "South East", "Ba Ria-Vung Tau": "South East",
    "Binh Duong": "South East", "Binh Phuoc": "South East",
    "Dong Nai": "South East", "Tay Ninh": "South East",
    # Mekong River Delta (13)
    "Can Tho city": "Mekong River Delta", "Long An": "Mekong River Delta",
    "Tien Giang": "Mekong River Delta", "Ben Tre": "Mekong River Delta",
    "Tra Vinh": "Mekong River Delta", "Vinh Long": "Mekong River Delta",
    "Dong Thap": "Mekong River Delta", "An Giang": "Mekong River Delta",
    "Kien Giang": "Mekong River Delta", "Hau Giang": "Mekong River Delta",
    "Soc Trang": "Mekong River Delta", "Bac Lieu": "Mekong River Delta",
    "Ca Mau": "Mekong River Delta",
}


def main() -> None:
    assert len(PROVINCE_REGION) == 63, f"expected 63 provinces, got {len(PROVINCE_REGION)}"

    rows = [
        {
            "province": province,
            "region": region,
            "poverty_rate": REGION_RATE[region],
            "poverty_data_level": "region",
            "source": SOURCE,
        }
        for province, region in PROVINCE_REGION.items()
    ]
    rows.sort(key=lambda r: r["poverty_rate"], reverse=True)

    out_path = DATA / "poverty_region_proxy.csv"
    with open(out_path, "w", newline="") as fh:
        w = csv.DictWriter(fh, fieldnames=["province", "region", "poverty_rate", "poverty_data_level", "source"])
        w.writeheader()
        w.writerows(rows)

    print(f"{len(rows)} provinces assigned a regional poverty proxy -> {out_path}")
    print("(This is a REGION-level number repeated per province -- see module docstring.)")


if __name__ == "__main__":
    main()
