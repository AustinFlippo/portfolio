# Labs 3 and 4: what changed and how to submit

Course instructions: [Lab 3](https://dsc106.com/labs/lab03/) and [Lab 4](https://dsc106.com/labs/lab04/).

## Understand the changes

**Lab 3 makes the portfolio interactive.** `global.js` creates the same navigation on all four portfolio pages. It compares each link with the current URL to highlight the right page. The theme selector sets CSS `color-scheme`; `localStorage` remembers your selection after refreshes and navigation. Automatic follows your operating system's theme.

The small extra is the optional contact improvement: JavaScript builds a properly encoded `mailto:` URL, so spaces, ampersands, and newlines reach your email draft correctly. The form opens your email app; you review and send the message there.

**Lab 4 separates data from presentation.** `lib/projects.json` holds 12 entries with numeric years spanning 2025 and 2026. `fetchJSON()` loads the data, and `renderProjects()` builds the cards. The Projects page displays every entry and calculates the count. The home page uses the same function with the first three entries; keep the newest projects first in the JSON file. Its GitHub statistics come from the public API for AustinFlippo.

`index.js` handles the home page; `projects/projects.js` handles the Projects page. `type="module"` lets these files import shared functions. Errors display a readable message, and a GitHub outage does not stop the project cards from loading.

The standalone Project 2 report keeps its own design and scripts.

## Preview

Use VS Code Live Server, or run this from the portfolio folder:

```sh
python3 -m http.server 8000
```

Open http://localhost:8000. JavaScript modules and data loading require a server; do not double-click the HTML files.

## Finish the submissions

After you commit and push, check the deployed site. Submit these links for each lab:

- Repository: https://github.com/AustinFlippo/portfolio
- Website: https://austinflippo.github.io/portfolio/

Record a separate narrated screen recording for each lab, exported as **MP4, no longer than 60 seconds**. Aim for 45–55 seconds. The recordings must include spoken explanations.

**Lab 3 recording:** Show the home page and navigate to another page. Select Light, Dark, and Automatic; select Dark again and refresh to demonstrate persistence. Show the contact improvement if time permits. Explain one interesting thing you learned, for example: “Changing the CSS color scheme updates the page and form controls, while localStorage remembers my choice across pages and refreshes.”

**Lab 4 recording:** Show the first three home-page cards and live GitHub stats, then the Projects page with its count and full list. Briefly show `lib/projects.json` and explain that one data source powers both pages. Mention the varied years. Answer one lab question aloud, for example: “Why clear the container before rendering? Otherwise, each render would append another copy of the cards.” Add your own most interesting learning, such as reusing a renderer on two pages with different heading levels.

Lab 4 also asks you to exchange GitHub follows with classmates, aiming for at least three followers and three following. Do that yourself; the displayed counts are real API values.

The code covers the published implementation steps. Your recordings, deployed links, and submission still determine the final grade.

## Commit all lab changes once

These commands include only the lab files, leaving unrelated existing changes out:

```sh
git add index.html index.js global.js style.css projects/index.html projects/projects.js contact/index.html resume/index.html lib/projects.json images/project-placeholder.svg LABS.md
git commit -m "Complete labs 3 and 4"
```
