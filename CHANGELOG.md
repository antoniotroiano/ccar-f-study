# Changelog

Every release gets a version number and a GitHub release. Raise the number with `node tools/bump-version.js patch|minor|major`, then add an entry here.
While the version starts with `0.`, the app is in its early phase: `minor` for new features, `patch` for fixes and new questions. `1.0.0` is for the first version you consider stable, ideally after other people have tried it. After that: `major` for changes that break saved data, `minor` for new features, `patch` for fixes and new questions.

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
