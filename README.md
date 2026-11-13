# CCAR-F Study

A practice app for the **Claude Certified Architect – Foundations (CCAR-F)** exam. Short learning rounds, an explanation after every answer, and the app remembers which questions you find hard. Runs in the browser on phone and desktop, needs no server and no account.

> **Unofficial.** A community learning aid, not affiliated with, endorsed by or sponsored by Anthropic. The questions were drafted by AI and can contain mistakes: check anything you doubt against the official Exam Guide and documentation. The ready indicator and the pass line are only guides, not a promise for the real exam.

## Use it

Open **https://antoniotroiano.github.io/ccar-f-study/** in a browser. To install it like an app:

- **iPhone (Safari):** Share, then Add to Home Screen.
- **Android (Chrome):** menu, then Install app.
- **Computer (Chrome or Edge):** install icon in the address bar.

An installed app on the iPhone has its own storage, separate from Safari. Use **Export progress** and **Restore from backup** to move your progress into it.

## Run it locally

Clone or download the repository, then double-click `index.html`. That is all: no build step, no server, no installation. Opened from a file, the app works but cannot be installed and has no offline mode (those need the web address above or `localhost`).

## What it does

- **Learning rounds** of 5 to 20 questions with the reason why an answer is right or wrong. You rate each right answer Guessed, Unsure or Sure, and five boxes (Leitner system) bring weak questions back.
- **Practice my mistakes, weak domains, one scenario or one task statement.**
- **Diagnostic:** 20 questions that show which domains to practise first.
- **Exam simulation:** 60 questions in 120 minutes, or without a time limit, or with an explanation after each answer. A scenario exam picks 4 of the 6 scenarios like the real one.
- **Study notes** for all 30 task statements, with exam traps and links to the docs (written by AI, not independently reviewed), and a **search** over notes and explanations.
- **Statistics** per domain and task statement, weak areas and a ready indicator.
- **Your own catalogs** from a JSON file (template and AI prompt on the Help page), **backup** of your progress to a file, light and dark theme, works offline once installed.

The full description is on the Help page inside the app.

## Your data

Everything stays in your browser. Nothing is sent to a server. Progress is separate on every device and browser, so use **Export progress** (bottom of the start page) and **Restore from backup** to move it or keep a copy. A restore merges and deletes nothing. A new version of the app never deletes your progress. Clearing the browser data, a private window or a different web address starts with empty data.

## Content and rights

- The core catalog was drafted by AI. It quotes short passages of the official Exam Guide as sources and is not a copy of real exam questions. A script checks the quotes, the questions are not independently reviewed.
- `data/exam-guide-samples.js` contains the twelve sample questions printed in the Exam Guide. Their rights belong to Anthropic. To leave them out, delete the file and its script tag in `index.html`.
- The official Exam Guide, cached documentation pages and personal score reports are not part of this repository.
- Keep your own catalogs free of real, confidential exam content. The exam rules forbid sharing it.

## License

No license has been chosen yet. Until one is added, all rights are reserved by the author.
