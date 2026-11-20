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

## Lab 8: animation and scrollytelling

Course instructions: [Lab 8](https://dsc106.com/labs/lab08/). The required demo order is the scroll-driven scatter plot, the file unit visualization, then the most interesting thing learned. File scrollytelling is optional and is not needed for this submission.

The existing Meta page now has chronological commit descriptions beside a sticky scatter plot. Scrollama updates the time cutoff while scrolling in either direction. The slider controls the same cutoff. D3 reuses circles by commit ID, with CSS entry and position transitions; reduced-motion preferences disable transitions. Hover/focus details and brushing remain available. Changing the cutoff clears the old selection.

Below the narrative, one colored dot represents one surviving code line. Files are sorted by their filtered line counts, and the legend identifies CSS, HTML, and JavaScript. **Compare file sizes** jumps here, and **Show full history** restores every line in the snapshot.

`meta/loc.csv` includes the committed Lab 7 map: 2,038 lines, 16 files, and 12 contributing commits through November 14, 2026. It describes surviving lines attributed to earlier commits, not all historical edits or deleted code. The snapshot was generated before the uncommitted Lab 8 edits, so these new edits are intentionally absent. The previous 1,688 rows are unchanged; 350 Lab 7 rows were added.

### Preview and local verification

From the portfolio folder, start the server and open [the local Meta page](http://127.0.0.1:8000/meta/):

```sh
python3 -m http.server 8000 --bind 127.0.0.1
```

Use a desktop browser window wide enough for two columns when recording. Internet access is needed for the existing D3 import and the new Scrollama import. Stop the server with Control-C when finished.

Verified locally:

- Scrolling forward adds commits; scrolling backward removes them, with one SVG and one x-axis reused.
- The sticky chart remains visible alongside the narrative; slider endpoints display the earliest and latest data without invalid coordinates.
- Commit details are available by hover and keyboard focus. Dragging a brush selects visible commits and updates the language breakdown; Clear selection resets it.
- At the full cutoff, the unit visualization has exactly 2,038 dots across 16 files, sorted by descending line count with three technology colors.
- Desktop and narrow layouts render without horizontal overflow; browser console had no errors.
- JavaScript syntax, HTML IDs, CSV consistency, and Git whitespace checks pass.

### Recording script: target 55 seconds

Before recording, open the local Meta page, scroll until the first commit and chart are visible, and move the pointer off the chart. Start a laptop screen recording with microphone audio. Rehearse once with a timer; stop by 55 seconds, export as MP4, and check the actual file duration is **60 seconds or less** before uploading. These instructions supply the script; you still need to record and submit the MP4.

| Time | On-screen action | Say aloud |
| --- | --- | --- |
| 0–7 seconds | Show the first commit beside the scatter plot. | “This is my Lab 8 Meta page, showing how my portfolio evolved.” |
| 7–21 seconds | Scroll down past several commit descriptions, then briefly scroll up. Keep the changing chart visible. | “Scrolling through the commit descriptions updates the scatter plot. Each dot is a commit. Position shows date and time, and size shows surviving lines.” |
| 21–31 seconds | Drag the time slider left, then right. Hover over a dot without clicking it. | “I can also change the cutoff with this slider and hover over a commit for details.” |
| 31–45 seconds | Click Compare file sizes, click Show full history, then scroll slightly to show several files and the legend. | “Here, each small dot is one surviving line. Files are sorted by line count, and colors distinguish CSS, HTML, and JavaScript.” |
| 45–55 seconds | Leave the unit visualization visible. End with this learning, then stop recording. | “The most interesting thing I learned is that stable commit IDs let D3 animate existing dots while scrolling reveals new commits.” |

### Manual Git commands

No changes have been staged, committed, pushed, or deployed for Lab 8. Run these yourself after reviewing. Stage only these five files so unrelated local changes stay out of this commit:

```sh
cd /Users/austinflippo/Documents/GitHub/portfolio
git status --short
git diff -- meta/index.html meta/main.js meta/loc.csv style.css LABS.md
git add -- meta/index.html meta/main.js meta/loc.csv style.css LABS.md
git diff --cached --stat
git diff --cached
git commit -m "Complete DSC 106 Lab 8 scrollytelling"
git push origin main
```

After your manual push finishes publishing, check [the live Meta page](https://austinflippo.github.io/portfolio/meta/). Submit the repository/site links wherever requested, and attach the narrated MP4 in the video question. Recording, pushing, and submission remain manual.
