# Housing data provenance

Both visualizations use a fixed panel of 49 economies with nonmissing slum-condition shares and urban populations in both 2000 and 2018. World, regional, and income aggregates are excluded using the source country metadata's nonblank Region field. No interpolation or outcome-based country selection is used.

Source: [World Bank Data by Indicators — urban development](https://github.com/light-and-salt/World-Bank-Data-by-Indicators/tree/f6bc0432af81a31164cbc090d939d2114170c9dc/urban-development), revision `f6bc0432af81a31164cbc090d939d2114170c9dc`. Original export updated September 15, 2021.

- `EN.POP.SLUM.UR.ZS`: population living in slums, percentage of urban population; UN-HABITAT source.
- `SP.URB.TOTL`: urban population; World Bank estimates based on UN World Urbanization Prospects 2018 Revision.

Country-year estimated residents = urban population × share / 100. Panel share = sum of country estimated residents / sum of country urban populations × 100. Counts are estimates, not individual-level observations. No uncertainty interval is supplied by the snapshot. The source definition describes households lacking one or more housing conditions (water, sanitation, living space, durability, tenure) and discusses the successor SDG definition. Urban definitions vary by country. The panel is not a global total, and the endpoints do not identify the same people or establish policy effects.

`housing.csv` contains the 98 country-year input/derived records. `housing.json` also contains full-precision totals, source-file hashes, and descriptive country tallies. Run `python3 prepare_data.py /path/to/source-repository` to reproduce both from the pinned source. Run `python3 ../render_figures.py` to regenerate the SVG marks. Display rounding is applied only in the report.

The local four-year review charts use every year between 2000 and 2018 with both indicators present for all members of the original 49-country sample. These are 2000, 2005, 2014, and 2018. In 2010, Burkina Faso, Comoros, Guinea, Mexico, Mongolia, Nicaragua, and Peru are missing. In 2016, China is missing. Other years in this interval have no paired observations in the sample. Missing years are not interpolated, and the sample does not change between bars. The share rises between 2014 and 2018 even though it is lower than in 2000. The estimated count rises at all four shown time points.

Run `python3 prepare_timeline.py /path/to/urban-development.csv` to reproduce `housing-timeline.json` and `housing-timeline.csv` from the exact source file, checked against its saved SHA-256 hash. The CSV contains 196 country-year records. The JSON records the totals, selected country codes, and missing-country coverage. Each count bar starts at zero, with a brown section for the 2000 count and red for the increase above that count. Bar lengths use unrounded values. The original SVG assets remain available for comparing with the published endpoint design.
