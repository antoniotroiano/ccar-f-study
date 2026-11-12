# Changelog

Every release gets a version number and a GitHub release. Raise the number with `node tools/bump-version.js patch|minor|major`, then add an entry here.
While the version starts with `0.`, the app is in its early phase: `minor` for new features, `patch` for fixes and new questions. `1.0.0` is for the first version you consider stable, ideally after other people have tried it. After that: `major` for changes that break saved data, `minor` for new features, `patch` for fixes and new questions.

## Unreleased

Fixes from the code review (`docs/review-code.md`: K1, K2, K3, W1, W3, W4, W5, W6, part of W7, W8, S1). No change to the storage format.

- Backup restore rebuilds every record from known fields and checks ids. Text and attribute values are fully escaped.
- A failed write (storage full or blocked) is shown. An exam stays saved until its result is stored. A backup merge is all or nothing and counts only what was really added.
- The exam pass check uses the exact share: 44 of 60 passes, 43 does not.
- Rounds from the domain catalogs now appear in the statistics of the core catalog.
- Damaged or outdated paused rounds and exams no longer break the home screen. They are discarded only when you try to resume them.
- Service worker: only a good start page is cached, only its own caches are deleted, background updates finish before the worker stops.
- Backup download link stays valid for 30 seconds.
- New switch "Check before answering": tapping an answer only selects it, "Check answer" confirms (off by default).
- Keyboard and screen reader: focus stays on the control you used or moves to the feedback, "Correct" / "Not quite" is announced, the window title follows the screen, answered options stay reachable, and the letter and digit shortcuts can be turned off.
- Content Security Policy in `index.html` (scripts only from the app itself plus the theme snippet) as a second layer against injected code.
- The app asks for a new version when you return to it, and the service worker script is no longer cached by the browser. The maskable icon is cached for offline use.
- Texts now say what the code does: "Practice my mistakes" holds questions answered wrong or guessed; statistics say "Stored answers" (at most 1000), not "All time".
- Deleting a catalog or progress points to the backup when none was exported yet. External links also get `noreferrer`. Question and scenario ids named like `constructor` work. Duplicate scenario ids in an import are reported.
- Statistics compare exact values with the thresholds (69.6 % no longer counts as 70 %). An imported catalog that fails the check on load is reported instead of disappearing. Imported questions can carry an optional `taskStatement` (for example "1.2"). The start page falls back to the cached copy after 4 seconds without a network answer.
- Smaller accessibility fixes: the theme button and the switches are read out once (no double state), the progress bar has a text alternative, and notices and messages are announced.
- Borders of buttons and answer options have enough contrast; the top bar buttons and the update button are 44 px high.

## 0.1.0 (2026-11-12)

First published version.

- Learning rounds of 5, 10, 15 or 20 questions with instant explanations and sources, five boxes (Leitner system), pause and resume, round overview, optional repeat of wrong questions (up to 3 times).
- Ratings after a right answer: Guessed, Hard, Good, Easy. A guessed answer does not count as right in the statistics.
- Practice my mistakes, and Practice weak domains (a round only from the domains below 70 %).
- Rounds by domain or by scenario (S1 to S6). The scenario texts are the full text of the Exam Guide.
- Exam simulation: 60 questions in 120 minutes, weighted by domain, marking, overview, pause, discard, automatic submit. The scenario exam works like the real one: 4 of the 6 scenarios at random.
- Statistics: rate for the last 100 and for all answers, per domain, per task statement (30, from the Exam Guide), weak areas, coverage, recent rounds and exams, ready indicator.
- Core catalog (179 questions), one catalog per domain, the 12 sample questions of the Exam Guide, and your own catalogs by JSON import with a Help page, template and AI prompt.
- Export and restore (merge) of your progress, light and dark theme, installable app that works offline, update bar for new versions.
