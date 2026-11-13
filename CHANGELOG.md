# Changelog

Every release gets a version number and a GitHub release. Raise the number with `node tools/bump-version.js patch|minor|major`, then add an entry here.
While the version starts with `0.`, the app is in its early phase: `minor` for new features, `patch` for fixes and new questions. `1.0.0` is for the first version you consider stable, ideally after other people have tried it. After that: `major` for changes that break saved data, `minor` for new features, `patch` for fixes and new questions.

## 0.2.0 (2026-11-13)

New learning aids, a simpler rating and many fixes. The first version with study notes.

**New**
- **Study notes:** short notes for all 30 task statements of the Exam Guide, with exam traps, links to the docs, "which one when" tables, a "build it once" checklist (47 exercises) and a Practice button for each task statement. Written by AI from the docs of 20 Oct 2026 and not independently reviewed.
- **Search** in the top bar: finds words in the study notes and in the explanations of the questions.
- **Diagnostic:** a 20-question round across the domains. It names the weakest domains with a Practice button each. The last result is saved on its own page.
- **Three exam modes:** 120 minutes as before, no time limit, or review mode with an explanation after each answer. A pace hint and a time summary help in the timed exam.
- **Exam date:** set it under "More" and the start page shows how many days are left.
- **Browser Back button and swipe gesture** now go one screen back. Back from a round or exam asks first and pauses it.
- **Practice by task statement**, and links between wrong answers, statistics and the matching study note.
- **Check before answering:** a switch so that tapping an answer only selects it. Useful on a phone.

**Changed**
- **Rating after a right answer:** Guessed, Unsure or Sure (before: Guessed, Hard, Good, Easy). Guessed counts as wrong and sends the question to box 1. Unsure keeps its box. Sure moves it up one box. Keys 1, 2 and 3 rate. Enter never rates. Paused rounds with the old names still resume.
- **"Practice my mistakes"** holds the questions in box 1: answered wrong, guessed, or right but rated Unsure on the first try.
- **Statistics** count all your answers without a limit, also with imported catalogs. "By task statement" shows how many questions are safe (box 4 or higher).
- **Backup with two devices:** answers counted on each device are added up, so phone and laptop both count.
- **Start page:** the "Practice by domain" cards are gone (the domain choice in the round setup does the same). Import and the exam date moved to "More". The main button of a catalog is now "Practice". The Help page covers all functions.
- **Ready indicator:** it says it is orientation only. A domain needs 10 answers before it counts as weak.
- **Honest wording:** the core catalog is described as drafted by AI with source quotes checked by script, not independently reviewed.

**Fixed and improved**
- Backup restore checks every record and escapes all values. A failed save is reported. A merge is all or nothing.
- The exam pass check is exact: 44 of 60 passes, 43 does not.
- Damaged paused rounds or exams no longer break the start page. The update check, offline cache and security settings are more robust.
- Better contrast for button borders, larger tap areas for switches and small buttons, keyboard and screen reader improvements, and no sideways scrolling in the task statement list on a phone.
- Backup, template and report downloads use one safer download routine.
- After an answer the page scrolls to "Correct" / "Not quite" instead of landing in the middle of the explanation, and rating the answer no longer makes it jump.
- The title in the top bar leads to the start page (a running round or exam is paused after a question).
- The diagnostic result no longer offers "Next round"; pick a domain or go back to the catalogs.
- Exam screen on a phone: the question counter and pace hint stay readable, the buttons sit on their own line.
- Setting the exam date on a phone no longer closes the date picker or scrolls the page.

**Saved data**
- New keys in this browser: `ccarf.device.v1` (device id, not in the backup), `ccarf.diagnostic.v1` (last diagnostic result) and `ccarf.practice.v1` (ticked exercises).
- Progress entries get an optional `byDevice` counter, and settings, exams and results get optional mode fields. Backups stay version 1. Old backups and saved data still load. Counters from before this version are kept as before (the larger value wins).

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
