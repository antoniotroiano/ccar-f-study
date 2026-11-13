# CCAR-F Study: notes for Claude

Personal static learning app for the Claude Certified Architect – Foundations exam (exam code CCAR-F). Plain HTML, CSS and vanilla JavaScript. No build step, no dependencies, no server. It must keep working when `index.html` is opened by double-click. Read `README.md` first, then `docs/feature-ideas.md` (local only) for open ideas.

## Rules that matter
- **Only the user commits and pushes.** Never commit, push or change git settings, and do not ask or offer to do it (no "shall I commit?" in questions or wrap-ups). The user will say when they want help, for example with a commit message.
- **Never commit, push or change git settings unless asked.** The repo has a local git author (private identity). The global git identity on this machine is a work identity: never commit with it.
- **`docs/` is local only and ignored by git** (official Exam Guide, cached docs, score report, ideas list). Never copy its content into published files. The four `cca-f-study-app-*.md` planning files are also ignored.
- Never put secrets, tokens or personal data in any file.
- The Exam Guide samples (`data/exam-guide-samples.js`) and the scenario texts come from the Exam Guide. Rights are not cleared for a public repo. Do not add more Exam Guide text without asking.
- UI text is English only. No German UI.
- Match the surrounding code: plain functions, `const`/`let`, short comments that say why, no framework, no new dependency.

## Structure
- `index.html` loads everything with script tags (order matters, globals, no modules). Catalogs register in `window.CATALOGS`.
- `js/`: `config.js` (all numbers), `quiz.js` (rounds, answers), `learning.js` (boxes, round selection), `exam.js`, `stats.js`, `storage.js` (all localStorage access), `backup.js`, `catalog-import.js` (JSON import and validation), `help.js`, `search.js` (search over study notes and questions), `render.js` (HTML strings), `app.js` (state, click handling).
- `data/core/` (179 questions, written with another Claude session), `data/core-domains.js` (one catalog per domain, same question objects, shares progress via `progressId`), `data/exam-guide-samples.js`, `data/task-statements.js`, `data/learn.js` and `learn-d2.js` to `learn-d5.js` (study notes, one object per domain).
- `sw.js` (service worker, cache name `ccarf-<APP_VERSION>`), `manifest.webmanifest`, `icons/`.
- `tools/`: `check-catalog.js` (needs `docs/official/`), `validate-catalog.js`, `bump-version.js`, `release-notes.js`.

## How the app works (short)
- Boxes 1 to 5 (Leitner). Wrong or "Guessed" answers go to box 1. Guessed counts as not correct in all statistics.
- A round focus is one string: `all`, a domain (`D1`) or a scenario (`scenario:s3`). Modes: `mixed`, `mistakes`, `weak`.
- Exam: 60 questions, 120 minutes, end-time based timer, answers are recorded only on submit. The scenario exam picks 4 of 6 scenarios.
- Progress is stored per `dataId(catalog)::questionId`. Never change question ids of published questions: progress would be lost.
- localStorage keys all start with `ccarf.` (runs, progress, history, rounds, settings, exams, examresults, imported, theme, backup, flags, practice, diagnostic). A change in their format needs a new key version and a migration or a note in the changelog.

## Testing
No test framework. Check syntax with `node --check js/*.js`, the catalog with `node tools/check-catalog.js data/core`. Logic can be tested with Node `vm` (load the script files into one context with a fake `localStorage`). For the UI use a local server (`python3 -m http.server 8765`) and the browser preview. After editing, the browser may show old files: reload twice, or clear the service worker and caches.

## Release
Version in `js/version.js`, raised with `node tools/bump-version.js minor|patch`. Version `0.x` means early phase. Add a `CHANGELOG.md` entry, then the user commits and creates the GitHub release by hand (`node tools/release-notes.js` prints the text). Do not raise the version on your own while a release is still unpublished: collect changes in the open changelog entry.
