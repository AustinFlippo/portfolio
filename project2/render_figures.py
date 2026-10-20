"""Render data-driven SVG marks; no plotting dependencies or network requests."""
import json
import math
from pathlib import Path

HERE = Path(__file__).resolve().parent
DATA = json.loads((HERE / "data/housing.json").read_text())
ASSETS = HERE / "figures"
ASSETS.mkdir(exist_ok=True)

def svg(width, height, title, description, content):
    return f'<svg xmlns="http://www.w3.org/2000/svg" width="{width}" height="{height}" viewBox="0 0 {width} {height}" role="img" aria-labelledby="title desc"><title id="title">{title}</title><desc id="desc">{description}</desc>{content}</svg>\n'

for year in ("2000", "2018"):
    share = DATA["totals"][year]["share"]
    marks = []
    for i in range(100):
        x, y, radius = 17 + (i % 10) * 25, 17 + (i // 10) * 25, 8.5
        fraction = max(0, min(1, share - i))
        marks.append(f'<circle cx="{x}" cy="{y}" r="{radius}" fill="#edece3"/>')
        if fraction == 1:
            marks.append(f'<circle cx="{x}" cy="{y}" r="{radius}" fill="#46694f"/>')
        elif fraction:
            angle = fraction * 2 * math.pi - math.pi / 2
            ex, ey = x + radius * math.cos(angle), y + radius * math.sin(angle)
            marks.append(f'<path d="M{x},{y} L{x},{y-radius} A{radius},{radius} 0 {int(fraction > .5)},1 {ex},{ey} Z" fill="#46694f"/>')
    (ASSETS / f"share-{year}.svg").write_text(svg(260, 260, f"{year}: {share:.1f}% of urban residents in slum conditions", "One hundred circles, each one percentage point. Filled area uses the unrounded share; the final filled circle is a proportional sector.", "".join(marks)))

baseline = DATA["totals"]["2000"]["estimated_residents"]
total = DATA["totals"]["2018"]["estimated_residents"]
baseline_width = 800 * baseline / total
increase_width = 800 - baseline_width
strip = f'<rect width="{baseline_width}" height="44" fill="#867563"/><rect x="{baseline_width}" width="{increase_width}" height="44" fill="#a34028"/>'
(ASSETS / "residents-ledger.svg").write_text(svg(800, 44, "617.9 million plus 156.6 million equals 774.5 million estimated residents", "A single proportional strip. The neutral segment represents the 2000 estimate; the rust segment represents the increase. Its geometry uses full-precision counts, not the rounded display labels. This is an arithmetic decomposition, not a tracked population cohort.", strip))
print("Rendered 3 SVG figures from the fixed-panel data.")
