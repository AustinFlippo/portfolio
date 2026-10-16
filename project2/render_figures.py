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

    value = DATA["totals"][year]["estimated_residents"] / 5_000_000
    baseline = DATA["totals"]["2000"]["estimated_residents"] / 5_000_000
    squares = []
    for i in range(math.ceil(value)):
        x, y = 10 + (i % 13) * 29, 10 + (i // 13) * 29
        fraction = min(1, value - i)
        base_fraction = max(0, min(fraction, baseline - i))
        if base_fraction:
            squares.append(f'<rect x="{x}" y="{y}" width="{21*base_fraction}" height="21" fill="#867563"/>')
        if fraction > base_fraction:
            squares.append(f'<rect x="{x+21*base_fraction}" y="{y}" width="{21*(fraction-base_fraction)}" height="21" fill="#a34028"/>')
    count = DATA["totals"][year]["estimated_residents"] / 1_000_000
    (ASSETS / f"residents-{year}.svg").write_text(svg(385, 354, f"{year}: {count:.1f} million estimated residents in slum conditions", "Each square represents five million estimated residents; partial squares preserve exact areas. Both years use the same unit, spacing, columns and frame. Rust marks the arithmetic increase above the 2000 count, not a cohort of identifiable new residents.", "".join(squares)))

for name, n, fill, empty in (("share-tally", DATA["counts"]["share_fell"], "#46694f", "#e7e6dc"), ("residents-tally", DATA["counts"]["residents_rose"], "#a34028", "#e1d6c5")):
    marks = ''.join(f'<rect x="{(i%7)*13}" y="{(i//7)*13}" width="9" height="9" fill="{fill if i<n else empty}"/>' for i in range(49))
    (ASSETS / f"{name}.svg").write_text(svg(87, 87, f"{n} of 49 countries", "Each square represents one country. Dark marks indicate the highlighted direction of change; pale marks indicate the opposite direction.", marks))
print("Rendered 6 SVG figures from the fixed-panel data.")
