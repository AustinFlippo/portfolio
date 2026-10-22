"""Add all fully observed years for the existing 49-country sample.

Usage: python3 prepare_timeline.py /path/to/urban-development.csv
"""
import csv
import hashlib
import json
import sys
from pathlib import Path

HERE = Path(__file__).resolve().parent
source = Path(sys.argv[1])
endpoint_data = json.loads((HERE / "housing.json").read_text())
assert hashlib.sha256(source.read_bytes()).hexdigest() == endpoint_data["source_sha256"]
codes = {country["code"] for country in endpoint_data["countries"]}
years = {}
with source.open(encoding="utf-8-sig", newline="") as stream:
    for row in csv.DictReader(stream):
        year = row["Year"]
        if row["Country Code"] not in codes or not 2000 <= int(year) <= 2018:
            continue
        share = row["average_value_Population living in slums (% of urban population)"]
        population = row["average_value_Urban population"]
        if not share.strip() or not population.strip():
            continue
        record = {"code": row["Country Code"], "name": row["Country Name"],
                  "share": float(share), "urban_population": int(float(population))}
        record["estimated_residents"] = record["share"] * record["urban_population"] / 100
        observations = years.setdefault(year, {})
        assert record["code"] not in observations
        observations[record["code"]] = record

totals, omitted = {}, {}
for year, records in sorted(years.items()):
    if set(records) != codes:
        omitted[year] = {"countries_present": len(records), "missing_countries": sorted(codes - set(records))}
        continue
    population = sum(r["urban_population"] for r in records.values())
    count = sum(r["estimated_residents"] for r in records.values())
    totals[year] = {"urban_population": population, "estimated_residents": count, "share": 100 * count / population}

assert list(totals) == ["2000", "2005", "2014", "2018"]
result = {"revision": endpoint_data["revision"], "source_sha256": endpoint_data["source_sha256"],
          "country_count": len(codes), "country_codes": sorted(codes), "totals": totals,
          "omitted_observation_years": omitted,
          "selection": "All years from 2000 through 2018 with both indicators for every country in the original sample. No interpolation."}
(HERE / "housing-timeline.json").write_text(json.dumps(result, indent=2) + "\n")
with (HERE / "housing-timeline.csv").open("w", newline="") as stream:
    writer = csv.writer(stream)
    writer.writerow(["country_code", "country", "year", "urban_population", "share_in_slum_conditions_percent", "estimated_residents_in_slum_conditions"])
    for year in totals:
        for r in sorted(years[year].values(), key=lambda r: r["name"]):
            writer.writerow([r["code"], r["name"], year, r["urban_population"], r["share"], r["estimated_residents"]])
print(json.dumps({"totals": totals, "omitted": omitted}, indent=2))
