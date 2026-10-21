# CCAR-F Study

A practice app for the **Claude Certified Architect – Foundations (CCAR-F)** exam. Learn in short rounds, see an explanation after every answer, and let the app remember which questions you find hard. It runs in the browser on phone and desktop, needs no server and no account, and can be installed like an app.

> **Unofficial.** This is a community learning aid. It is not affiliated with, endorsed by or sponsored by Anthropic. Questions can contain mistakes: check anything you doubt against the official Exam Guide and documentation. The ready indicator and the pass line are only guides, not a promise for the real exam.

## Features

- **Learning rounds** of 5, 10, 15 or 20 questions, with the reason why an answer is right or wrong and where the question comes from.
- **Five boxes** (Leitner system): rate every right answer Hard, Good or Easy. Wrong answers go back to box 1. Low boxes come first in the next round.
- **Practice my mistakes:** a round with only the questions you got wrong or rated Hard.
- **Repeat wrong questions** (optional switch per catalog): a wrong question comes back at the end of the round, up to 3 times.
- **Exam simulation:** 60 questions in 120 minutes, drawn by domain weight, no feedback until you submit. Mark questions, jump back, pause, automatic submit when time runs out.
- **Statistics:** rate for the last 100 answers and for all answers, rate per domain, weak areas, coverage, recent rounds and exams, and a ready indicator.
- **Select 2 questions**, scenarios, sources with quotes, and a "Report a problem" note on every question.
- **Your own catalogs:** import them from a JSON file. The Help page has a template and a prompt for an AI.
- **Backup:** export your progress to a file and merge it back in on another device.
- Light and dark theme, keyboard shortcuts on the desktop, installable, works offline.

## Use it

The app is a static website. Open the published address, or install it:

- **iPhone (Safari):** Share, then Add to Home Screen.
- **Android (Chrome):** menu, then Install app.
- **Computer (Chrome or Edge):** install icon in the address bar.

An installed app on the iPhone has its own storage, separate from Safari. Use **Export progress** and **Restore from backup** to move your progress into it.

Live address: `https://<your-user>.github.io/<repository>/` (fill in after the first deploy).

## Run it locally

No build step. Open `index.html` in a browser, or serve the folder:

```bash
python3 -m http.server 8000
# then open http://localhost:8000
```

Offline use and installation need `https` or `localhost`. Opened from a file, the app works but is not installable.

## Catalogs

| Catalog | What it is |
|---|---|
| Core catalog | Exam-style questions written by AI against the task statements of the official Exam Guide, then spot-checked by a person. Each question names its source with a verbatim quote. |
| One catalog per domain | The questions of the core catalog split by exam domain. They share progress with the core catalog. |
| Exam Guide sample questions | The twelve sample questions of section 9 of the Exam Guide, with the guide's explanations. See *Content and rights*. |
| Imported catalogs | Your own, from a JSON file. Stored in your browser only. |

### Write your own catalog

1. Open **Help** in the app. Download the template, or copy the prompt and give it to an AI together with your material.
2. Read the questions the AI wrote. It can make mistakes.
3. Save the result as `.json` and press **Import catalog** on the start page.

You can check a file before the import:

```bash
node tools/validate-catalog.js my-catalog.json
```

### Add a built-in catalog

Create a `.js` file in `data/` that pushes a catalog object onto `window.CATALOGS` (see `data/exam-guide-samples.js`), and add one script tag for it in `index.html`.

## Your data

Everything stays in your browser. Nothing is sent to a server. Progress, answers, rounds, exams and reports live in the browser's local storage, separately on every device and browser.

- A **new version of the app does not delete your progress.** The version only changes the app's files.
- Progress belongs to a question by its catalog id and question id. If an id changes, the progress for that question is lost. Never change ids of published questions.
- Clearing the browser data, using another address (for example after renaming the repository) or a private window starts with empty data.
- **Export progress** (bottom of the start page) saves a copy. **Restore from backup** merges it in: for a question that exists in both, the newer answer wins, and nothing is deleted.

## Project structure

```
index.html            start page and script tags
css/styles.css        design (light and dark theme)
js/                   the app, no framework
  version.js          the version number (one place)
  quiz.js learning.js exam.js stats.js    rounds, boxes, exam, statistics
  storage.js backup.js catalog-import.js  saved data, backup, catalog import
  render.js app.js help.js                screens, flow, help page
data/                 catalogs (core catalog, per-domain catalogs, sample questions)
tools/                check and release helpers (Node, no dependencies)
sw.js manifest.webmanifest icons/         offline use and installation
CHANGELOG.md          what changed in each version
```

## Development

No dependencies and no build step. The checks run with plain Node:

```bash
node tools/validate-catalog.js file.json        # check a catalog file
node tools/check-catalog.js data/core           # check the core catalog: structure and verbatim quotes
node tools/bump-version.js patch                # raise the version before a release
```

`check-catalog.js` compares quotes with the text of the Exam Guide and the cached documentation pages. These source files are not part of this repository, so the check needs them locally in `docs/official/`.

### Release

1. `node tools/bump-version.js patch` (or `minor`, `major`). This changes `js/version.js` and the `?v=` numbers in `index.html`.
2. Add an entry to `CHANGELOG.md`.
3. Commit and push.

Open pages show a **Reload** button when a new version is ready. Always raise the version before you publish changed files: the version in the file links is what makes browsers fetch the new files. If you test locally and still see an old state, reload the page twice (or once with Cmd/Ctrl + Shift + R). Rule of thumb: `patch` for fixes and new questions, `minor` for new features, `major` for changes that break saved data.

### Publish on GitHub Pages

In the repository: Settings, Pages, Source "Deploy from a branch", branch `main`, folder `/ (root)`. The address is `https://<user>.github.io/<repository>/`. All paths in the app are relative, so it also works in a sub folder. The file `.nojekyll` keeps GitHub from processing the files.

## Content and rights

- The questions of the core catalog were written with AI support. They quote short passages of the official Exam Guide as sources. They are not copies of real exam questions.
- `data/exam-guide-samples.js` contains the twelve sample questions that are printed in the Exam Guide. Their rights belong to Anthropic. If you do not want to ship them, delete the file and its script tag in `index.html`.
- The official Exam Guide, the cached documentation pages and personal score reports are not part of this repository.
- Keep your own catalogs free of real, confidential exam content. The exam rules forbid sharing it.

## License

No license has been chosen yet. Until one is added, all rights are reserved by the author.
