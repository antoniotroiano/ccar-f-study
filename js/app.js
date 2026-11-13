/* State */
const appElement = document.getElementById("app");
let currentRound = null;
let pendingSelection = []; // options toggled on a multiple-response question before "Check answer"
let isEditingFlag = false;  // the "report a problem" note is open on the current question
let currentExam = null;
let examTimerId = null;
let activeCatalog = null;
let setup = loadSettings();

function allCatalogs() {
  return window.CATALOGS || [];
}

function catalogFromButton(target) {
  return allCatalogs()[Number(target.dataset.catalogIndex)];
}

// Every screen change goes through here, so the exam timer never keeps running on another screen.
const BASE_TITLE = document.title;

// CSS selector for the control that has focus (by its data- attributes), so focus can return to it after a re-render
function selectorOfFocus() {
  const element = document.activeElement;
  if (!element || !appElement.contains(element)) return null;
  const parts = Array.from(element.attributes).filter(function (attribute) {
    return attribute.name.indexOf("data-") === 0;
  }).map(function (attribute) { return "[" + attribute.name + '="' + attribute.value.replace(/["\\]/g, "") + '"]'; });
  return parts.length ? element.tagName.toLowerCase() + parts.join("") : null;
}

function show(html, keepScroll) {
  stopExamTimer();
  const selector = keepScroll ? selectorOfFocus() : null;
  appElement.innerHTML = html;
  if (!keepScroll) window.scrollTo(0, 0);

  // A re-render destroys the focused element. Keep keyboard and screen reader users where they were,
  // or on the heading of a new screen. The window title follows the screen.
  const heading = appElement.querySelector("h1, h2");
  document.title = heading ? heading.textContent + " · " + BASE_TITLE : BASE_TITLE;
  let target = selector ? appElement.querySelector(selector) : null;
  if (!target && !keepScroll && heading) {
    heading.tabIndex = -1;
    target = heading;
  }
  if (target) target.focus({ preventScroll: true });

  // role="status" inside freshly inserted HTML is often not read out; announce it through the fixed live region
  const status = appElement.querySelector('[role="status"]');
  if (status && !keepScroll) announce(status.textContent);
}

function announce(text) {
  document.getElementById("announcer").textContent = text;
}

/* Browser history: one entry per screen, so Back and Forward step through the app.
   Questions inside a round or exam share one "run" entry. Leaving a run by Back asks first and pauses it.
   Addresses are hash only (#catalog), which also works when index.html is opened from a file. */
let runActive = false;     // a round or exam is on screen
let restoring = false;     // a popstate is being applied: do not add entries
let historyOn = true;      // switched off when the browser refuses pushState

function track(route) {
  runActive = route.s === "run";
  if (restoring || !historyOn) return;
  try {
    const previous = history.state;
    const sameScreen = previous && JSON.stringify(previous) === JSON.stringify(route);
    // a finished or left run replaces its own entry; topic switches inside the study notes do not pile up
    const replace = sameScreen || (previous && (previous.s === "run" || (previous.s === "learn" && route.s === "learn")));
    if (replace) history.replaceState(route, "", "#" + route.s);
    else history.pushState(route, "", "#" + route.s);
  } catch (error) {
    historyOn = false;
  }
}

// Shows the screen of a history entry. Entries of runs and results cannot be rebuilt: they lead home.
function restoreRoute(route) {
  const name = route ? route.s : "home";
  const catalog = route && route.c ? allCatalogs().find(function (item) { return item.id === route.c; }) : null;
  if (name === "catalog" && catalog) openCatalog(catalog);
  else if (name === "learn") showLearn(route.d || "D1", route.t || undefined);
  else if (name === "diagnostic") showDiagnostic();
  else if (name === "search") showSearch();
  else if (name === "stats") showStats();
  else if (name === "help") showHelp();
  else showCatalogList();
}

// Back out of a round or exam: save it and pause it. Returns the message to show afterwards.
function pauseRunForBack() {
  let message = "Round paused. Your progress is saved.";
  if (currentExam) {
    const timed = isTimedExam(currentExam);
    pauseExam(currentExam, Date.now());
    saveExam(currentExam);
    currentExam = null;
    message = timed ? "Exam paused. The timer is stopped until you resume." : "Exam saved. Resume it from the start page.";
  } else if (currentRound) {
    if (!saveRun(currentRound)) message = "Could not save: this browser blocks local storage.";
  }
  currentRound = null;
  isEditingFlag = false;
  pendingSelection = [];
  return message;
}

window.addEventListener("popstate", function (event) {
  const route = event.state;
  let message = "";
  if (runActive) {
    if (route && route.s === "run") return;
    const what = currentExam ? "exam" : "round";
    if (!window.confirm("Leave the " + what + "? It is saved and paused. Resume it from the start page.")) {
      // stay: put the run entry back on top
      try { history.pushState({ s: "run" }, "", "#run"); } catch (error) { historyOn = false; }
      return;
    }
    message = pauseRunForBack();
  }
  restoring = true;
  try {
    restoreRoute(route);
  } finally {
    restoring = false;
  }
  // an entry that could not be rebuilt (run, results) now shows the start page: make the address say so
  if (!route || route.s === "run" || route.s === "end") {
    try { history.replaceState({ s: "home" }, "", "#home"); } catch (error) { historyOn = false; }
  }
  if (message) showToast(message);
});

try { history.scrollRestoration = "manual"; } catch (error) { /* not supported */ }

/* Paused round and running exam of a catalog, or null when there is none or it no longer fits the catalog.
   These only read: unusable data is removed when the learner tries to resume it (see resumeRound, resumeExam). */
function restorePausedRound(catalog) {
  const saved = loadRun(catalog.id);
  if (!saved) return null;
  try {
    return restoreRound(catalog, saved);
  } catch (error) {
    return null;
  }
}

function restoreRunningExam(catalog) {
  const saved = loadExam(catalog.id);
  if (!saved) return null;
  try {
    return restoreExam(catalog, saved);
  } catch (error) {
    return null;
  }
}

/* Home */
function showCatalogList(notice, report) {
  isEditingFlag = false;
  currentRound = null;
  currentExam = null;
  activeCatalog = null;
  track({ s: "home" });
  const entries = allCatalogs().map(function (catalog) {
    const paused = restorePausedRound(catalog);
    const exam = restoreRunningExam(catalog);
    return {
      catalog: catalog,
      stats: computeStats(catalog),
      pausedAnswered: paused ? { done: countCompleted(paused), total: paused.questions.length } : null,
      examRemainingMs: exam ? Math.max(0, examRemainingMs(exam, Date.now())) : null,
      examPaused: exam ? exam.pausedAt !== null : false
    };
  });
  show(renderCatalogList(entries, notice, report, loadBackupInfo(), { date: setup.examDate, days: daysToExam(setup.examDate, Date.now()), today: localDateString(Date.now()) }));
}

/* Catalog screen */
function showCatalogScreen(keepScroll) {
  const catalog = activeCatalog;
  if (!keepScroll) track({ s: "catalog", c: catalog.id });
  const stats = computeStats(catalog);
  if (setup.domain !== "all" && !stats.domains.some(function (item) { return item.domain === setup.domain; }) &&
      !scenariosInCatalog(catalog).some(function (item) { return SCENARIO_PREFIX + item.id === setup.domain; })) {
    setup.domain = "all";
  }
  const exam = restoreRunningExam(catalog);
  show(renderCatalogScreen(
    catalog, setup, availableQuestionCount(catalog, setup.domain), stats, Boolean(restorePausedRound(catalog)),
    examAvailability(catalog), exam ? Math.max(0, examRemainingMs(exam, Date.now())) : null, exam ? exam.pausedAt !== null : false,
    countMistakes(catalog, catalog.fixedRound ? "all" : setup.domain, loadProgress())
  ), keepScroll);
}

function openCatalog(catalog) {
  activeCatalog = catalog;
  showCatalogScreen(false);
}

function changeSetup(change) {
  Object.assign(setup, change);
  saveSettings(setup);
  showCatalogScreen(true);
}

/* Statistics */
function reportedQuestions() {
  const flags = loadFlags();
  return Object.keys(flags).map(function (key) {
    const flag = flags[key];
    const catalog = allCatalogs().find(function (item) { return item.id === flag.catalogId; });
    const question = catalog ? catalog.questions.find(function (item) { return item.id === flag.questionId; }) : null;
    return { flag: flag, question: question || null };
  }).sort(function (a, b) { return b.flag.t - a.flag.t; });
}

// The catalog with the most questions of a task statement (the core catalog), or null
function catalogForTask(id) {
  let best = null;
  let bestCount = 0;
  allCatalogs().filter(function (catalog) { return !catalog.imported && !catalog.progressId; }).forEach(function (catalog) {
    const count = catalog.questions.filter(function (question) { return taskStatementOf(question) === id; }).length;
    if (count > bestCount) { best = catalog; bestCount = count; }
  });
  return best ? { catalog: best, count: bestCount } : null;
}

function showLearn(domain, topicId) {
  track({ s: "learn", d: domain, t: topicId || null });
  const counts = {};
  Object.keys(window.TASK_STATEMENTS || {}).forEach(function (id) {
    const found = catalogForTask(id);
    if (found) counts[id] = found.count;
  });
  show(renderLearn(domain, loadPractice(), counts, topicId));
  // coming from a link: bring the opened topic into view
  const topic = topicId && document.getElementById("topic-" + topicId);
  if (topic) topic.scrollIntoView({ block: "start" });
}

// Diagnostic page: the saved last result per catalog, or the offer to take it
function showDiagnostic() {
  track({ s: "diagnostic" });
  const saved = loadDiagnostics();
  const entries = [];
  allCatalogs().forEach(function (catalog, index) {
    if (catalog.progressId || catalog.fixedRound || computeStats(catalog).domains.length < 2) return;
    entries.push({ catalog: catalog, index: index, result: saved[catalog.id] });
  });
  show(renderDiagnosticScreen(entries));
}

function showSearch() {
  track({ s: "search" });
  // The search shows answers, so a running exam is paused first (same as the help page)
  let notice = "";
  if (currentExam) {
    pauseExam(currentExam, Date.now());
    saveExam(currentExam);
    currentExam = null;
    notice = "Your exam is paused while you search. Resume it from the start page.";
  }
  show(renderSearch(notice));
  document.getElementById("search-input").focus();
}

// Only the result list is redrawn, so the text field keeps focus while typing
appElement.addEventListener("input", function (event) {
  if (event.target.id !== "search-input") return;
  document.getElementById("search-results").innerHTML = renderSearchResults(searchContent(event.target.value));
});

// Exam date field on the start page. A day in the past is refused, the field then shows the saved value again.
appElement.addEventListener("change", function (event) {
  if (event.target.id !== "exam-date-input") return;
  const value = event.target.value;
  if (value === "") {
    setup.examDate = null;
  } else if (isValidDateString(value) && daysToExam(value, Date.now()) >= 0) {
    setup.examDate = value;
  } else {
    showCatalogList("Pick today or a later day as your exam date.");
    return;
  }
  saveSettings(setup);
  updateExamDateInPlace();
});

// The start page is not drawn again: on a phone that closed the date picker and scrolled to the top.
function updateExamDateInPlace() {
  const html = renderExamCounter({ date: setup.examDate, days: daysToExam(setup.examDate, Date.now()), today: localDateString(Date.now()) });
  const counter = appElement.querySelector(".exam-counter");
  const subtitle = appElement.querySelector(".home-subtitle");
  if (counter && html) counter.outerHTML = html;
  else if (counter) counter.remove();
  else if (html && subtitle) subtitle.insertAdjacentHTML("afterend", html);
  const box = appElement.querySelector(".exam-date");
  const remove = box && box.querySelector('[data-action="clear-exam-date"]');
  if (box && setup.examDate && !remove) box.insertAdjacentHTML("beforeend", '<button class="button ghost" data-action="clear-exam-date">Remove</button>');
  if (remove && !setup.examDate) remove.remove();
}

function showStats(keepScroll) {
  if (!keepScroll) track({ s: "stats" });
  // Catalogs made from another one share its statistics, so only the source catalogs are listed
  const entries = allCatalogs().filter(function (catalog) { return !catalog.progressId; }).map(function (catalog) {
    return { catalog: catalog, stats: computeStats(catalog) };
  });
  show(renderStats(entries, reportedQuestions()), keepScroll);
}

// A JSON file the learner can share, with enough context to re-check each reported question.
function downloadReportedQuestions() {
  const list = reportedQuestions().map(function (item) {
    return {
      catalogId: item.flag.catalogId,
      questionId: item.flag.questionId,
      reportedAt: new Date(item.flag.t).toISOString(),
      note: item.flag.note,
      question: item.question ? item.question.question : null
    };
  });
  downloadText("reported-questions-" + new Date().toISOString().slice(0, 10) + ".json", JSON.stringify(list, null, 2));
}

/* Learning round flow */
function startRound(catalog, domainFilter, length, mode) {
  const progress = loadProgress();
  const selected = mode === "mistakes"
    ? selectMistakeQuestions(catalog, domainFilter, length, progress)
    : mode === "weak"
      ? selectWeakQuestions(catalog, length, progress)
      : mode === "diagnostic"
        ? selectDiagnosticQuestions(catalog, progress)
        : selectRoundQuestions(catalog, domainFilter, length, progress);
  if (selected.length === 0) {
    showCatalogList(mode === "mistakes" ? "No mistakes left to practise. Well done!"
      : mode === "weak" ? "No weak areas right now. Well done!"
      : "No questions available for this selection.");
    return;
  }
  currentRound = createRound(catalog, selected, domainFilter, length, repeatWrongEnabled(setup, catalog), mode);
  pendingSelection = [];
  activeCatalog = catalog;
  saveRun(currentRound);
  track({ s: "run" });
  showQuestion();
}

function resumeRound(catalog) {
  const restored = restorePausedRound(catalog);
  if (!restored) {
    clearRun(catalog.id);
    showCatalogList("The paused round no longer matches the catalog and was discarded.");
    return;
  }
  currentRound = restored;
  pendingSelection = [];
  activeCatalog = catalog;
  track({ s: "run" });
  showQuestion();
}

function currentFlagInfo() {
  const question = currentRound.questions[currentRound.currentIndex];
  return { flag: flagFor(dataId(currentRound.catalog), question.id), isEditing: isEditingFlag, checkFirst: setup.checkFirst };
}

/* Brings the verdict ("Correct" / "Not quite") into view just under the fixed bars, so the explanation below it
   reads from the top. Does nothing when the verdict is already fully visible (short questions). */
function scrollVerdictIntoView(feedback) {
  const verdict = feedback.querySelector(".verdict") || feedback;
  const topbar = document.querySelector(".topbar");
  const siteBar = document.querySelector(".site-bar");
  const actionBar = document.querySelector(".action-bar");
  const top = Math.max(topbar ? topbar.getBoundingClientRect().bottom : 0, siteBar ? siteBar.getBoundingClientRect().bottom : 0);
  const bottom = actionBar ? actionBar.getBoundingClientRect().top : window.innerHeight;
  const rect = verdict.getBoundingClientRect();
  if (rect.top >= top && rect.bottom <= bottom) return;
  window.scrollTo(0, window.scrollY + rect.top - top - 16);
}

// isFresh: an answer was just given (scroll to the verdict, announce it).
// afterRating: the rating was just chosen. The screen is drawn again in place, without a jump or a second announcement.
function showQuestion(isFresh, afterRating) {
  show(renderQuestion(currentRound, Boolean(isFresh), pendingSelection, currentFlagInfo()), isFresh || afterRating);
  if (isFresh) {
    const feedback = document.getElementById("feedback");
    scrollVerdictIntoView(feedback);
    feedback.focus({ preventScroll: true });
    const answer = currentRound.answers[currentRound.currentIndex];
    announce(answer.isCorrect ? "Correct." : "Not quite.");
  }
}

// Re-render the current question in place, for example after editing a report
function refreshQuestion() {
  show(renderQuestion(currentRound, false, pendingSelection, currentFlagInfo()), true);
}

function showRoundOverview() {
  show(renderRoundOverview(currentRound));
}

function goToQuestion(index) {
  currentRound.currentIndex = index;
  pendingSelection = [];
  isEditingFlag = false;
  saveRun(currentRound);
  showQuestion();
}

// Single choice answers on click. Multiple response toggles options until "Check answer".
function handleOptionClick(optionIndex) {
  const index = currentRound.currentIndex;
  if (isAnswered(currentRound, index)) return;
  const question = currentRound.questions[index];
  if (!isMultipleResponse(question) && !setup.checkFirst) {
    handleAnswer([optionIndex]);
    return;
  }
  pendingSelection = toggleSelection(question, pendingSelection, optionIndex);
  show(renderQuestion(currentRound, false, pendingSelection, currentFlagInfo()), true);
}

function handleAnswer(selected) {
  const index = currentRound.currentIndex;
  if (isAnswered(currentRound, index)) return;
  if (selected.length !== requiredSelections(currentRound.questions[index])) return;
  submitAnswer(currentRound, index, selected);
  pendingSelection = [];

  // wrong: rated automatically, recorded now, and (with the switch on) the question comes back at the end
  let stored = true;
  if (!currentRound.answers[index].isCorrect) {
    stored = applyCompletion(currentRound, index);
    if (shouldRepeat(currentRound, index)) addRepeat(currentRound, index);
  }
  stored = saveRun(currentRound) && stored;
  showQuestion(true);
  if (!stored) showSaveError();
}

function handleRating(rating) {
  const index = currentRound.currentIndex;
  if (!needsRating(currentRound, index)) return;
  rateAnswer(currentRound, index, rating);
  const stored = applyCompletion(currentRound, index) && saveRun(currentRound);
  showQuestion(false, true);
  if (!stored) showSaveError();
}

// Added to confirmations of deletions: points to the backup when there is none yet
function backupTip() {
  return loadBackupInfo().lastExportAt ? "" : "\n\nTip: you have not exported a backup yet. Cancel and use Backup on the home screen first.";
}

function showSaveError() {
  showToast("Could not save. This answer is not stored. Export a backup and free up space (remove an imported catalog).");
}

function pauseRound() {
  const saved = saveRun(currentRound);
  showCatalogList(saved ? "Round paused. Your progress is saved." : "Could not save: this browser blocks local storage.");
}

function showResults() {
  const round = currentRound;
  const results = calculateResults(round);
  if (!recordFinishedRound(round, results)) showSaveError();
  if (round.mode === "diagnostic" && !saveDiagnosticResult(round.catalog.id, results)) showSaveError();
  clearRun(round.catalog.id);
  track({ s: "end" });
  show(renderResults(round, results, boxDistribution(dataId(round.catalog), results.questionIds), computeStats(round.catalog)));
}

/* Exam flow. The end time is stored, so the timer survives reloads and tab switches. */
// Throws away a running or paused exam. Its answers were not recorded yet (that happens on submit), so statistics stay as they are.
function discardExam(catalog, stayOnCatalogPage) {
  if (!window.confirm("Discard the exam in progress? Its answers are not counted and the time is gone.")) return;
  clearExam(catalog.id);
  if (stayOnCatalogPage) {
    showCatalogScreen(true);
  } else {
    showCatalogList("Exam discarded.");
  }
}

function startExam(catalog, byScenario) {
  currentExam = createExam(catalog, Date.now(), byScenario, setup.examMode);
  activeCatalog = catalog;
  saveExam(currentExam);
  track({ s: "run" });
  showExamQuestion(false);
}

function resumeExam(catalog) {
  const restored = restoreRunningExam(catalog);
  if (!restored) {
    clearExam(catalog.id);
    showCatalogList("The running exam no longer matches the catalog and was discarded.");
    return;
  }
  currentExam = restored;
  activeCatalog = catalog;
  resumePausedExam(currentExam, Date.now());
  saveExam(currentExam);
  if (examRemainingMs(currentExam, Date.now()) <= 0) {
    finishExam(true);
  } else {
    track({ s: "run" });
    showExamQuestion(false);
  }
}

function showExamQuestion(keepScroll) {
  if (currentExam.visitStart === null) currentExam.visitStart = Date.now(); // pace: time on this question
  show(renderExamQuestion(currentExam, examRemainingMs(currentExam, Date.now())), keepScroll);
  startExamTimer();
}

function showExamOverview() {
  noteExamLeave(currentExam, Date.now());
  show(renderExamOverview(currentExam, examRemainingMs(currentExam, Date.now())));
  startExamTimer();
}

function goToExamQuestion(index) {
  noteExamLeave(currentExam, Date.now());
  currentExam.currentIndex = index;
  saveExam(currentExam);
  showExamQuestion(false);
}

function startExamTimer() {
  if (!isTimedExam(currentExam)) return; // no clock to update
  examTimerId = setInterval(function () {
    if (!currentExam) return;
    const remaining = examRemainingMs(currentExam, Date.now());
    if (remaining <= 0) {
      finishExam(true);
      return;
    }
    const timer = document.getElementById("exam-timer");
    if (timer) {
      timer.textContent = formatDuration(remaining / 1000);
      timer.classList.toggle("warning", remaining <= EXAM.WARN_MINUTES * 60000);
    }
  }, 1000);
}

function stopExamTimer() {
  if (examTimerId !== null) clearInterval(examTimerId);
  examTimerId = null;
}

function finishExam(timedOut) {
  const exam = currentExam;
  if (!exam) return;
  currentExam = null;
  stopExamTimer();

  const now = Date.now();
  noteExamLeave(exam, now);
  const score = scoreExam(exam, timedOut, now);
  // All or nothing: when storing fails, the exam stays saved and can be submitted again
  const snapshot = snapshotKeys([KEY_PROGRESS, KEY_HISTORY, KEY_EXAM_RESULTS]);
  if (!(applyExamTracking(exam, now) && recordExamResult(exam, score, now))) {
    restoreKeys(snapshot);
    saveExam(exam);
    showCatalogList("Could not save the exam result. The exam is kept: free up space (export a backup, remove an imported catalog) and submit it again.");
    return;
  }
  clearExam(exam.catalog.id);
  track({ s: "end" });
  show(renderExamResults(exam, score));
}

function handleExamAnswer(optionIndex) {
  if (examRemainingMs(currentExam, Date.now()) <= 0) {
    finishExam(true);
    return;
  }
  if (currentExam.checked[currentExam.currentIndex]) return;
  selectExamOption(currentExam, optionIndex);
  saveExam(currentExam);
  showExamQuestion(true);
}

/* Click handling: one listener, buttons carry a data-action */
appElement.addEventListener("click", function (event) {
  const target = event.target.closest("[data-action]");
  if (!target || target.disabled || target.getAttribute("aria-disabled") === "true") return;

  switch (target.dataset.action) {
    case "open-catalog":
      openCatalog(catalogFromButton(target));
      break;
    case "set-length":
      changeSetup({ length: Number(target.dataset.value) });
      break;
    case "export-progress":
      exportProgress();
      break;
    case "restore-progress":
      document.getElementById("backup-file").click();
      break;
    case "import-catalog":
      document.getElementById("catalog-file").click();
      break;
    case "remove-imported": {
      const catalog = catalogFromButton(target);
      if (window.confirm("Remove \"" + catalog.title + "\"? Your progress and statistics for it are deleted too." + backupTip())) {
        resetCatalogProgress(catalog);
        removeImportedCatalog(catalog.id);
        window.CATALOGS.splice(allCatalogs().indexOf(catalog), 1);
        showCatalogList("Catalog removed.");
      }
      break;
    }
    case "download-template":
      downloadTemplate();
      break;
    case "copy-prompt":
      copyText(catalogPromptText(), "Prompt copied.");
      break;
    case "toggle-repeat":
      changeSetup({ repeat: Object.assign({}, setup.repeat, { [activeCatalog.id]: !repeatWrongEnabled(setup, activeCatalog) }) });
      break;
    case "toggle-check-first":
      changeSetup({ checkFirst: !setup.checkFirst });
      break;
    case "toggle-shortcuts": {
      setup.shortcuts = !setup.shortcuts;
      saveSettings(setup);
      const hint = target.closest(".kbd-hint");
      hint.outerHTML = renderKeyboardHint(hint.dataset.rating === "1");
      const again = document.querySelector('[data-action="toggle-shortcuts"]');
      if (again) again.focus();
      break;
    }
    case "set-domain":
      changeSetup({ domain: target.dataset.value });
      break;
    case "start-round":
      if (!restorePausedRound(activeCatalog) || window.confirm("Starting a new round replaces your paused round. Continue?")) {
        if (activeCatalog.fixedRound) {
          startRound(activeCatalog, "all", activeCatalog.questions.length);
        } else {
          startRound(activeCatalog, setup.domain, setup.length);
        }
      }
      break;
    case "start-mistakes":
      if (!restorePausedRound(activeCatalog) || window.confirm("Starting a new round replaces your paused round. Continue?")) {
        startRound(activeCatalog, activeCatalog.fixedRound ? "all" : setup.domain, activeCatalog.fixedRound ? activeCatalog.questions.length : setup.length, "mistakes");
      }
      break;
    case "clear-exam-date":
      setup.examDate = null;
      saveSettings(setup);
      showCatalogList();
      break;
    case "diagnostic":
      showDiagnostic();
      break;
    case "start-diagnostic": {
      // from the Diagnostic page the catalog comes from the button, from the results screen it is the active one
      if (target.dataset.catalogIndex !== undefined) activeCatalog = catalogFromButton(target);
      if (!restorePausedRound(activeCatalog) || window.confirm("Starting a new round replaces your paused round. Continue?")) {
        startRound(activeCatalog, "all", CONFIG.DIAGNOSTIC_QUESTIONS, "diagnostic");
      }
      break;
    }
    case "start-domain":
      if (target.dataset.catalogIndex !== undefined) activeCatalog = catalogFromButton(target);
      startRound(activeCatalog, target.dataset.value, setup.length);
      break;
    case "start-task":
      if (!restorePausedRound(activeCatalog) || window.confirm("Starting a new round replaces your paused round. Continue?")) {
        startRound(activeCatalog, TASK_PREFIX + target.dataset.value, setup.length);
      }
      break;
    case "start-weak":
      if (!restorePausedRound(activeCatalog) || window.confirm("Starting a new round replaces your paused round. Continue?")) {
        startRound(activeCatalog, "all", setup.length, "weak");
      }
      break;
    case "resume":
      resumeRound(catalogFromButton(target));
      break;
    case "discard-run":
      if (window.confirm("Discard the paused round? Answers already given stay in your statistics.")) {
        clearRun(catalogFromButton(target).id);
        showCatalogList();
      }
      break;
    case "reset-progress":
      if (window.confirm("Reset all progress, statistics, exam results and paused work for \"" + activeCatalog.title + "\"? This cannot be undone." + backupTip())) {
        resetCatalogProgress(activeCatalog);
        showCatalogList("Progress reset.");
      }
      break;
    case "stats":
      showStats();
      break;
    case "learn":
      showLearn("D1");
      break;
    case "learn-practice": {
      const found = catalogForTask(target.dataset.value);
      if (!found) break;
      if (!restorePausedRound(found.catalog) || window.confirm("Starting a new round replaces your paused round. Continue?")) {
        startRound(found.catalog, TASK_PREFIX + target.dataset.value, setup.length);
      }
      break;
    }
    case "learn-topic":
      showLearn(noteDomainOf(target.dataset.value) || "D1", target.dataset.value);
      break;
    case "learn-domain":
      showLearn(target.dataset.value);
      break;
    case "toggle-practice": {
      // no re-render: the page keeps its scroll position and the checkbox its state
      if (!setPracticeDone(target.dataset.id, target.checked)) {
        target.checked = !target.checked;
        window.alert("Could not save. This browser has no storage space left.");
        break;
      }
      const counter = document.getElementById("practice-count");
      if (counter) counter.textContent = document.querySelectorAll('[data-action="toggle-practice"]:checked').length + " of " + document.querySelectorAll('[data-action="toggle-practice"]').length + " done";
      break;
    }
    case "flag-open":
      isEditingFlag = true;
      refreshQuestion();
      document.getElementById("flag-note").focus();
      break;
    case "flag-cancel":
      isEditingFlag = false;
      refreshQuestion();
      break;
    case "flag-save": {
      const question = currentRound.questions[currentRound.currentIndex];
      saveFlag(dataId(currentRound.catalog), question.id, document.getElementById("flag-note").value.trim());
      isEditingFlag = false;
      refreshQuestion();
      break;
    }
    case "flag-remove":
      if (target.dataset.questionId) {
        removeFlag(target.dataset.catalogId, target.dataset.questionId);
        showStats(true);
      } else {
        removeFlag(dataId(currentRound.catalog), currentRound.questions[currentRound.currentIndex].id);
        refreshQuestion();
      }
      break;
    case "flags-download":
      downloadReportedQuestions();
      break;
    case "answer":
      handleOptionClick(Number(target.dataset.optionIndex));
      break;
    case "check-answer":
      handleAnswer(pendingSelection);
      break;
    case "rate":
      handleRating(target.dataset.rating);
      break;
    case "prev":
      goToQuestion(currentRound.currentIndex - 1);
      break;
    case "next":
      if (currentRound.currentIndex === currentRound.questions.length - 1) {
        showResults();
      } else {
        goToQuestion(currentRound.currentIndex + 1);
      }
      break;
    case "pause":
      pauseRound();
      break;
    case "restart":
      startRound(currentRound.catalog, currentRound.domainFilter, currentRound.requestedLength, currentRound.mode);
      break;
    case "home":
      showCatalogList();
      break;

    case "start-exam":
      if (!restoreRunningExam(activeCatalog) || window.confirm("Starting a new exam discards the exam in progress. Continue?")) {
        startExam(activeCatalog);
      }
      break;
    case "start-exam-scenarios":
      if (!restoreRunningExam(activeCatalog) || window.confirm("Starting a new exam discards the exam in progress. Continue?")) {
        startExam(activeCatalog, true);
      }
      break;
    case "discard-exam":
      discardExam(catalogFromButton(target), false);
      break;
    case "discard-exam-here":
      discardExam(activeCatalog, true);
      break;
    case "resume-exam":
      resumeExam(catalogFromButton(target));
      break;
    case "resume-exam-here":
      resumeExam(activeCatalog);
      break;
    case "exam-answer":
      handleExamAnswer(Number(target.dataset.optionIndex));
      break;
    case "exam-mark":
      currentExam.marked[currentExam.currentIndex] = !currentExam.marked[currentExam.currentIndex];
      saveExam(currentExam);
      showExamQuestion(true);
      break;
    case "exam-prev":
      goToExamQuestion(currentExam.currentIndex - 1);
      break;
    case "exam-next":
      if (!isExamAnswered(currentExam, currentExam.currentIndex)) break; // no skipping
      if (currentExam.mode === "review" && !currentExam.checked[currentExam.currentIndex]) break;
      goToExamQuestion(currentExam.currentIndex + 1);
      break;
    case "overview":
      showRoundOverview();
      break;
    case "overview-goto":
      goToQuestion(Number(target.dataset.index));
      break;
    case "overview-back":
      showQuestion();
      break;
    case "exam-pause": {
      const timed = isTimedExam(currentExam);
      pauseExam(currentExam, Date.now());
      saveExam(currentExam);
      showCatalogList(timed ? "Exam paused. The timer is stopped until you resume." : "Exam saved. Resume it from the start page.");
      break;
    }
    case "set-exam-mode":
      changeSetup({ examMode: target.dataset.value });
      break;
    case "exam-check":
      if (!isExamAnswered(currentExam, currentExam.currentIndex)) break;
      currentExam.checked[currentExam.currentIndex] = true;
      saveExam(currentExam);
      showExamQuestion(true);
      break;
    case "exam-overview":
      showExamOverview();
      break;
    case "exam-goto":
      if (Number(target.dataset.index) > firstUnansweredIndex(currentExam)) break; // no skipping
      goToExamQuestion(Number(target.dataset.index));
      break;
    case "exam-back":
      showExamQuestion(false);
      break;
    case "exam-submit": {
      const unanswered = currentExam.questions.length - countExamAnswered(currentExam);
      const message = unanswered > 0
        ? unanswered + " question(s) are not answered and will count as wrong. Submit the exam now?"
        : "Submit the exam now?";
      if (window.confirm(message)) finishExam(false);
      break;
    }
  }
});

/* Keyboard shortcuts on question screens: A-D choose, 1-3 rate, Enter checks or continues (never rates: a rating changes the boxes), arrows navigate */
function clickEnabled(selector) {
  const button = document.querySelector(selector);
  if (!button || button.disabled || button.getAttribute("aria-disabled") === "true") return false;
  button.click();
  return true;
}

document.addEventListener("keydown", function (event) {
  if (event.ctrlKey || event.metaKey || event.altKey) return;
  if (!document.querySelector(".action-bar")) return;
  const tag = event.target.tagName;
  if (tag === "INPUT" || tag === "TEXTAREA" || tag === "SELECT") return;

  const key = event.key.toLowerCase();
  let handled = false;

  const isSingleKey = /^[a-f1-4]$/.test(key);
  if (isSingleKey && !setup.shortcuts) return;

  if (/^[a-f]$/.test(key)) {
    const index = key.charCodeAt(0) - 97;
    handled = clickEnabled('[data-action="answer"][data-option-index="' + index + '"]') ||
      clickEnabled('[data-action="exam-answer"][data-option-index="' + index + '"]');
  } else if (key === "1" || key === "2" || key === "3") {
    handled = clickEnabled('[data-action="rate"][data-rating="' + ["guessed", "unsure", "sure"][Number(key) - 1] + '"]');
  } else if (key === "arrowleft") {
    handled = clickEnabled('[data-action="prev"]') || clickEnabled('[data-action="exam-prev"]');
  } else if (key === "arrowright") {
    handled = clickEnabled('[data-action="next"]') || clickEnabled('[data-action="exam-next"]');
  } else if (key === "enter" && tag !== "BUTTON" && tag !== "SUMMARY" && tag !== "A") {
    handled = clickEnabled('.action-bar [data-action="check-answer"]') || clickEnabled('.action-bar [data-action="next"]') ||
      clickEnabled('.action-bar [data-action="exam-check"]') || clickEnabled('.action-bar [data-action="exam-next"]') || clickEnabled('.action-bar [data-action="exam-overview"]');
  }
  if (handled) event.preventDefault();
});

/* Importing and removing catalogs */
function importReport(title, errors, warnings) {
  return { title: title, errors: errors || [], warnings: warnings || [] };
}

function importCatalogFile(file) {
  if (file.size > IMPORT_LIMITS.MAX_FILE_BYTES) {
    showCatalogList("", importReport("\"" + file.name + "\" is too large", ["The file is larger than " + Math.round(IMPORT_LIMITS.MAX_FILE_BYTES / 1048576) + " MB."]));
    return;
  }
  file.text().then(function (text) {
    let data;
    try {
      data = JSON.parse(text);
    } catch (error) {
      showCatalogList("", importReport("\"" + file.name + "\" could not be read", ["This is not valid JSON (" + error.message + ")."]));
      return;
    }
    const builtInIds = allCatalogs().filter(function (catalog) { return !catalog.imported; }).map(function (catalog) { return catalog.id; });
    const result = validateCatalogJson(data, builtInIds);
    if (!result.catalog) {
      showCatalogList("", importReport("\"" + file.name + "\" has problems", result.errors, result.warnings));
      return;
    }

    const existing = allCatalogs().findIndex(function (catalog) { return catalog.id === result.catalog.id; });
    if (existing !== -1 && !window.confirm("A catalog with the id \"" + result.catalog.id + "\" is already imported. Replace it? Your progress for questions with the same ids stays.")) return;
    if (!saveImportedCatalog(result.catalog)) {
      showCatalogList("", importReport("\"" + file.name + "\" could not be saved", ["This browser has no storage space left. Remove an imported catalog or free up browser data."]));
      return;
    }

    result.catalog.imported = true;
    if (existing !== -1) window.CATALOGS.splice(existing, 1, result.catalog); else window.CATALOGS.push(result.catalog);
    showCatalogList("", importReport("Imported \"" + result.catalog.title + "\" (" + result.catalog.questions.length + " questions)", [], result.warnings));
  }).catch(function () {
    showCatalogList("", importReport("\"" + file.name + "\" could not be read", ["The browser could not open the file."]));
  });
}

document.getElementById("catalog-file").addEventListener("change", function (event) {
  const file = event.target.files[0];
  event.target.value = ""; // allows choosing the same file again
  if (file) importCatalogFile(file);
});

/* Help page. An exam that is running is paused first, because its timer would otherwise keep running. */
let helpNotice = "";

function showHelp() {
  track({ s: "help" });
  helpNotice = "";
  if (currentExam) {
    pauseExam(currentExam, Date.now());
    saveExam(currentExam);
    currentExam = null;
    helpNotice = "Your exam is paused while you read the help. Resume it from the start page.";
  }
  show(renderHelp(helpNotice));
}

document.getElementById("help-link").addEventListener("click", showHelp);
document.getElementById("search-link").addEventListener("click", showSearch);

// The title in the top bar leads to the start page. A running round or exam is paused first, after a question.
document.getElementById("brand-link").addEventListener("click", function () {
  if (runActive) {
    const what = currentExam ? "exam" : "round";
    if (!window.confirm("Leave the " + what + "? It is saved and paused. Resume it from the start page.")) return;
    showCatalogList(pauseRunForBack());
    return;
  }
  showCatalogList();
});

// Clipboard API first. If the browser refuses (for example on a page opened from a file), fall back to a temporary text field.
function copyWithTextField(text) {
  const field = document.createElement("textarea");
  field.value = text;
  field.setAttribute("readonly", "");
  field.style.position = "fixed";
  field.style.opacity = "0";
  document.body.appendChild(field);
  field.select();
  let copied = false;
  try {
    copied = document.execCommand("copy");
  } catch (error) {
    copied = false;
  }
  document.body.removeChild(field);
  return copied;
}

function copyText(text, doneMessage) {
  const fallback = function () {
    showToast(copyWithTextField(text) ? doneMessage : "Copying is blocked here. Select the text in the box and copy it by hand.");
  };
  if (navigator.clipboard && navigator.clipboard.writeText) {
    navigator.clipboard.writeText(text).then(function () { showToast(doneMessage); }, fallback);
  } else {
    fallback();
  }
}

function showToast(message) {
  const toast = document.getElementById("toast");
  toast.textContent = message;
  toast.hidden = false;
  announce(message);
  clearTimeout(showToast.timer);
  showToast.timer = setTimeout(function () { toast.hidden = true; }, 3500);
}

/* The one place that saves a text file. The link sits in the page while it is clicked, and the address is
   revoked only after 30 seconds: revoking at once can cancel the download in some browsers. */
function downloadText(fileName, text) {
  const url = URL.createObjectURL(new Blob([text], { type: "application/json" }));
  const link = document.createElement("a");
  link.href = url;
  link.download = fileName;
  document.body.appendChild(link);
  link.click();
  link.remove();
  setTimeout(function () { URL.revokeObjectURL(url); }, 30000);
}

function downloadTemplate() {
  downloadText("catalog-template.json", catalogTemplateText());
}

/* Backup: export the progress to a file, restore it from a file */
function exportProgress() {
  const now = Date.now();
  const backup = buildBackup(now);
  downloadText("ccarf-backup-" + new Date(now).toISOString().slice(0, 10) + ".json", JSON.stringify(backup, null, 2));
  saveBackupInfo({ lastExportAt: new Date(now).toISOString() });
  showCatalogList("Backup file created. Check that it appeared in your downloads: if not, try again in the browser instead of the home screen app. Keep it somewhere safe, for example in your cloud folder.");
}

function restoreProgressFile(file) {
  if (file.size > BACKUP_MAX_BYTES) {
    showCatalogList("", importReport("\"" + file.name + "\" is too large", ["A backup file is at most " + Math.round(BACKUP_MAX_BYTES / 1048576) + " MB."]));
    return;
  }
  file.text().then(function (text) {
    const parsed = parseBackup(text);
    if (parsed.error) {
      showCatalogList("", importReport("\"" + file.name + "\" could not be restored", [parsed.error]));
      return;
    }
    const counts = summarizeBackup(parsed.backup);
    const when = parsed.backup.exportedAt ? new Date(parsed.backup.exportedAt).toLocaleString() : "unknown date";
    const question = "Backup from " + when + ":\n" + counts.answers + " answers, " + counts.questions + " questions with progress, " +
      counts.rounds + " rounds, " + counts.exams + " exams, " + counts.reports + " reports, " + counts.catalogs + " imported catalogs.\n\n" +
      "Merge it into this browser? For a question that exists in both, the box of the newer answer is kept and the answers counted on each device are added up. Nothing is deleted: " +
      "reports and progress you removed here come back if they are in the file, and an imported catalog you already have is not replaced.";
    if (!window.confirm(question)) return;

    const builtInIds = allCatalogs().filter(function (catalog) { return !catalog.imported; }).map(function (catalog) { return catalog.id; });
    const result = mergeBackup(parsed.backup, builtInIds, allCatalogs().map(function (catalog) { return catalog.id; }));
    if (result.failed) {
      showCatalogList("", importReport("Backup not restored", ["The browser has no room left to store it. Nothing was changed. Remove an imported catalog or other data and try again."]));
      return;
    }
    result.catalogsAdded.forEach(function (catalog) { window.CATALOGS.push(catalog); });
    showCatalogList("", importReport(
      "Backup restored",
      [],
      [result.questionsUpdated + " questions updated, " + result.answersAdded + " answers, " + result.roundsAdded + " rounds, " +
        result.examsAdded + " exams and " + result.reportsAdded + " reports added" +
        (result.catalogsAdded.length ? ", " + result.catalogsAdded.length + " catalog(s) added." : ".")]
    ));
  }).catch(function () {
    showCatalogList("", importReport("\"" + file.name + "\" could not be read", ["The browser could not open the file."]));
  });
}

document.getElementById("backup-file").addEventListener("change", function (event) {
  const file = event.target.files[0];
  event.target.value = "";
  if (file) restoreProgressFile(file);
});

/* Theme toggle (the button lives in index.html, so it is visible on every screen) */
function applyTheme(theme) {
  document.documentElement.dataset.theme = theme;
  document.querySelector('meta[name="theme-color"]').setAttribute("content", theme === "dark" ? "#1b2126" : "#ffffff");
  const toggle = document.getElementById("theme-toggle");
  const label = theme === "dark" ? "Light mode" : "Dark mode";
  toggle.setAttribute("aria-label", "Switch to " + label.toLowerCase());
  toggle.querySelector(".theme-label").textContent = label;
}

document.getElementById("theme-toggle").addEventListener("click", function () {
  const next = document.documentElement.dataset.theme === "dark" ? "light" : "dark";
  saveTheme(next);
  applyTheme(next);
});

applyTheme(loadTheme());

/* Start: an exam whose time ran out while the page was closed is submitted right away */
function startApp() {
  const skipped = loadImportedCatalogs.skipped || [];
  const skippedNotice = skipped.length ? "Could not load imported catalog(s): " + skipped.join(", ") + ". The data is still stored. Import the file again or remove it." : "";
  const expired = allCatalogs().find(function (catalog) {
    const exam = restoreRunningExam(catalog);
    return exam && examRemainingMs(exam, Date.now()) <= 0;
  });
  if (expired) {
    currentExam = restoreRunningExam(expired);
    finishExam(true);
  } else {
    showCatalogList(skippedNotice);
  }
}

// Offline use and installation: needs https or localhost, so it is skipped when the page is opened from a file
if ("serviceWorker" in navigator && /^https?:$/.test(location.protocol)) {
  navigator.serviceWorker.register("sw.js", { updateViaCache: "none" }).then(function (registration) {
    // An installed app that returns from the background does not reload, so ask for a new version then
    document.addEventListener("visibilitychange", function () {
      if (document.visibilityState === "visible") registration.update().catch(function () { /* offline */ });
    });
  }).catch(function () { /* the app works without it */ });

  // A new service worker takes over after a deploy. The open page still runs the old files, so offer a reload.
  let hadController = Boolean(navigator.serviceWorker.controller);
  navigator.serviceWorker.addEventListener("controllerchange", function () {
    if (hadController) document.getElementById("update-bar").hidden = false;
    hadController = true;
  });
  document.getElementById("update-reload").addEventListener("click", function () { location.reload(); });
}

// The first entry is the start page (a reload always starts there)
try { history.replaceState({ s: "home" }, "", "#home"); } catch (error) { historyOn = false; }

// Imported catalogs join the built-in ones before the first screen
loadImportedCatalogs(allCatalogs().map(function (catalog) { return catalog.id; })).forEach(function (catalog) {
  window.CATALOGS.push(catalog);
});

startApp();
