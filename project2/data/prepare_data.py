"""Rebuild the fixed panel from the pinned source checkout, using only Python's stdlib.

Usage: python3 prepare_data.py /path/to/World-Bank-Data-by-Indicators
"""
import csv
import hashlib
import json
import sys
from pathlib import Path

ROOT = Path(sys.argv[1])
HERE = Path(__file__).resolve().parent
SOURCE = ROOT / "urban-development/urban-development.csv"
METADATA = next((ROOT / "urban-development").glob("Metadata_Country_*.csv"))
RATE = "average_value_Population living in slums (% of urban population)"
POPULATION = "average_value_Urban population"
REVISION = "f6bc0432af81a31164cbc090d939d2114170c9dc"

with METADATA.open(encoding="utf-8-sig", newline="") as stream:
    economies = {r["Country Code"] for r in csv.DictReader(stream) if r["Region"].strip()}
panel = {}
with SOURCE.open(encoding="utf-8-sig", newline="") as stream:
    for row in csv.DictReader(stream):
        if row["Country Code"] not in economies or row["Year"] not in ("2000", "2018"):
            continue
        if not row[RATE].strip() or not row[POPULATION].strip():
            continue
        country = panel.setdefault(row["Country Code"], {"code": row["Country Code"], "name": row["Country Name"]})
        year = row["Year"]
        assert year not in country, f"Duplicate country-year: {row['Country Code']} {year}"
        country[year] = {"share": float(row[RATE]), "urban_population": int(float(row[POPULATION]))}
        country[year]["estimated_residents"] = country[year]["share"] * country[year]["urban_population"] / 100
countries = sorted((r for r in panel.values() if "2000" in r and "2018" in r), key=lambda r: r["name"])
totals = {}
for year in ("2000", "2018"):
    population = sum(c[year]["urban_population"] for c in countries)
    residents = sum(c[year]["estimated_residents"] for c in countries)
    totals[year] = {"urban_population": population, "estimated_residents": residents, "share": residents / population * 100}
counts = {
    "share_fell": sum(c["2018"]["share"] < c["2000"]["share"] for c in countries),
    "residents_rose": sum(c["2018"]["estimated_residents"] > c["2000"]["estimated_residents"] for c in countries),
    "both": sum(c["2018"]["share"] < c["2000"]["share"] and c["2018"]["estimated_residents"] > c["2000"]["estimated_residents"] for c in countries),
}
assert len(countries) == 49 and counts == {"share_fell": 42, "residents_rose": 39, "both": 32}
result = {"revision": REVISION, "source_updated": "2021-09-15", "source_sha256": hashlib.sha256(SOURCE.read_bytes()).hexdigest(), "metadata_sha256": hashlib.sha256(METADATA.read_bytes()).hexdigest(), "totals": totals, "counts": counts, "countries": countries}
(HERE / "housing.json").write_text(json.dumps(result, indent=2) + "\n")
with (HERE / "housing.csv").open("w", newline="") as stream:
    writer = csv.writer(stream)
    writer.writerow(["country_code", "country", "year", "urban_population", "share_in_slum_conditions_percent", "estimated_residents_in_slum_conditions"])
    for c in countries:
        for year in ("2000", "2018"):
            row = c[year]
            writer.writerow([c["code"], c["name"], year, row["urban_population"], row["share"], row["estimated_residents"]])
print(json.dumps({"countries": len(countries), "totals": totals, "counts": counts}, indent=2))
