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
function show(html, keepScroll) {
  stopExamTimer();
  appElement.innerHTML = html;
  if (!keepScroll) window.scrollTo(0, 0);
}

/* Paused round and running exam of a catalog, or null (data that no longer fits the catalog is dropped) */
function restorePausedRound(catalog) {
  const saved = loadRun(catalog.id);
  if (!saved) return null;
  const restored = restoreRound(catalog, saved);
  if (!restored) clearRun(catalog.id);
  return restored;
}

function restoreRunningExam(catalog) {
  const saved = loadExam(catalog.id);
  if (!saved) return null;
  const restored = restoreExam(catalog, saved);
  if (!restored) clearExam(catalog.id);
  return restored;
}

/* Home */
function showCatalogList(notice, report) {
  isEditingFlag = false;
  currentRound = null;
  currentExam = null;
  activeCatalog = null;
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
  show(renderCatalogList(entries, notice, report, loadBackupInfo()));
}

/* Catalog screen */
function showCatalogScreen(keepScroll) {
  const catalog = activeCatalog;
  const stats = computeStats(catalog);
  if (setup.domain !== "all" && !stats.domains.some(function (item) { return item.domain === setup.domain; })) {
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

function showStats(keepScroll) {
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
  const blob = new Blob([JSON.stringify(list, null, 2)], { type: "application/json" });
  const link = document.createElement("a");
  link.href = URL.createObjectURL(blob);
  link.download = "reported-questions-" + new Date().toISOString().slice(0, 10) + ".json";
  document.body.appendChild(link);
  link.click();
  link.remove();
  URL.revokeObjectURL(link.href);
}

/* Learning round flow */
function startRound(catalog, domainFilter, length, mode) {
  const progress = loadProgress();
  const selected = mode === "mistakes"
    ? selectMistakeQuestions(catalog, domainFilter, length, progress)
    : selectRoundQuestions(catalog, domainFilter, length, progress);
  if (selected.length === 0) {
    showCatalogList(mode === "mistakes" ? "No mistakes left to practise. Well done!" : "No questions available for this selection.");
    return;
  }
  currentRound = createRound(catalog, selected, domainFilter, length, repeatWrongEnabled(setup, catalog), mode);
  pendingSelection = [];
  activeCatalog = catalog;
  saveRun(currentRound);
  showQuestion();
}

function resumeRound(catalog) {
  const restored = restorePausedRound(catalog);
  if (!restored) {
    showCatalogList("The paused round could not be restored.");
    return;
  }
  currentRound = restored;
  pendingSelection = [];
  activeCatalog = catalog;
  showQuestion();
}

function currentFlagInfo() {
  const question = currentRound.questions[currentRound.currentIndex];
  return { flag: flagFor(dataId(currentRound.catalog), question.id), isEditing: isEditingFlag };
}

function showQuestion(isFresh) {
  show(renderQuestion(currentRound, Boolean(isFresh), pendingSelection, currentFlagInfo()), isFresh);
  if (isFresh) document.getElementById("feedback").scrollIntoView({ block: "nearest" });
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
  if (!isMultipleResponse(question)) {
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
  if (!currentRound.answers[index].isCorrect) {
    applyCompletion(currentRound, index);
    if (shouldRepeat(currentRound, index)) addRepeat(currentRound, index);
  }
  saveRun(currentRound);
  showQuestion(true);
}

function handleRating(rating) {
  const index = currentRound.currentIndex;
  if (!needsRating(currentRound, index)) return;
  rateAnswer(currentRound, index, rating);
  applyCompletion(currentRound, index);
  saveRun(currentRound);
  showQuestion(true);
}

function pauseRound() {
  const saved = saveRun(currentRound);
  showCatalogList(saved ? "Round paused. Your progress is saved." : "Could not save: this browser blocks local storage.");
}

function showResults() {
  const round = currentRound;
  const results = calculateResults(round);
  recordFinishedRound(round, results);
  clearRun(round.catalog.id);
  show(renderResults(round, results, boxDistribution(dataId(round.catalog), results.questionIds), computeStats(round.catalog)));
}

/* Exam flow. The end time is stored, so the timer survives reloads and tab switches. */
function startExam(catalog) {
  currentExam = createExam(catalog, Date.now());
  activeCatalog = catalog;
  saveExam(currentExam);
  showExamQuestion(false);
}

function resumeExam(catalog) {
  const restored = restoreRunningExam(catalog);
  if (!restored) {
    showCatalogList("The running exam could not be restored.");
    return;
  }
  currentExam = restored;
  activeCatalog = catalog;
  resumePausedExam(currentExam, Date.now());
  saveExam(currentExam);
  if (examRemainingMs(currentExam, Date.now()) <= 0) {
    finishExam(true);
  } else {
    showExamQuestion(false);
  }
}

function showExamQuestion(keepScroll) {
  show(renderExamQuestion(currentExam, examRemainingMs(currentExam, Date.now())), keepScroll);
  startExamTimer();
}

function showExamOverview() {
  show(renderExamOverview(currentExam, examRemainingMs(currentExam, Date.now())));
  startExamTimer();
}

function goToExamQuestion(index) {
  currentExam.currentIndex = index;
  saveExam(currentExam);
  showExamQuestion(false);
}

function startExamTimer() {
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
  const score = scoreExam(exam, timedOut, now);
  applyExamTracking(exam, now);
  recordExamResult(exam, score, now);
  clearExam(exam.catalog.id);
  show(renderExamResults(exam, score));
}

function handleExamAnswer(optionIndex) {
  if (examRemainingMs(currentExam, Date.now()) <= 0) {
    finishExam(true);
    return;
  }
  selectExamOption(currentExam, optionIndex);
  saveExam(currentExam);
  showExamQuestion(true);
}

/* Click handling: one listener, buttons carry a data-action */
appElement.addEventListener("click", function (event) {
  const target = event.target.closest("[data-action]");
  if (!target || target.disabled) return;

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
      if (window.confirm("Remove \"" + catalog.title + "\"? Your progress and statistics for it are deleted too.")) {
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
      if (window.confirm("Reset all progress, statistics, exam results and paused work for \"" + activeCatalog.title + "\"? This cannot be undone.")) {
        resetCatalogProgress(activeCatalog);
        showCatalogList("Progress reset.");
      }
      break;
    case "stats":
      showStats();
      break;
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
    case "exam-pause":
      pauseExam(currentExam, Date.now());
      saveExam(currentExam);
      showCatalogList("Exam paused. The timer is stopped until you resume.");
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

/* Keyboard shortcuts on question screens: A-D choose, 1-3 rate, Enter continue, arrows navigate */
function clickEnabled(selector) {
  const button = document.querySelector(selector);
  if (!button || button.disabled) return false;
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

  if (/^[a-f]$/.test(key)) {
    const index = key.charCodeAt(0) - 97;
    handled = clickEnabled('[data-action="answer"][data-option-index="' + index + '"]') ||
      clickEnabled('[data-action="exam-answer"][data-option-index="' + index + '"]');
  } else if (key === "1" || key === "2" || key === "3") {
    handled = clickEnabled('[data-action="rate"][data-rating="' + ["hard", "good", "easy"][Number(key) - 1] + '"]');
  } else if (key === "arrowleft") {
    handled = clickEnabled('[data-action="prev"]') || clickEnabled('[data-action="exam-prev"]');
  } else if (key === "arrowright") {
    handled = clickEnabled('[data-action="next"]') || clickEnabled('[data-action="exam-next"]');
  } else if (key === "enter" && tag !== "BUTTON" && tag !== "SUMMARY" && tag !== "A") {
    handled = clickEnabled('.action-bar [data-action="check-answer"]') || clickEnabled('.action-bar [data-action="next"]') ||
      clickEnabled('.action-bar [data-action="exam-next"]') || clickEnabled('.action-bar [data-action="exam-overview"]');
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
  clearTimeout(showToast.timer);
  showToast.timer = setTimeout(function () { toast.hidden = true; }, 3500);
}

function downloadTemplate() {
  const url = URL.createObjectURL(new Blob([catalogTemplateText()], { type: "application/json" }));
  const link = document.createElement("a");
  link.href = url;
  link.download = "catalog-template.json";
  link.click();
  URL.revokeObjectURL(url);
}

/* Backup: export the progress to a file, restore it from a file */
function exportProgress() {
  const now = Date.now();
  const backup = buildBackup(now);
  const url = URL.createObjectURL(new Blob([JSON.stringify(backup, null, 2)], { type: "application/json" }));
  const link = document.createElement("a");
  link.href = url;
  link.download = "ccarf-backup-" + new Date(now).toISOString().slice(0, 10) + ".json";
  document.body.appendChild(link);
  link.click();
  link.remove();
  URL.revokeObjectURL(url);
  saveBackupInfo({ lastExportAt: new Date(now).toISOString() });
  showCatalogList("Backup file created. Keep it somewhere safe, for example in your cloud folder.");
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
      "Merge it into this browser? For a question that exists in both, the newer answer wins. Nothing is deleted.";
    if (!window.confirm(question)) return;

    const builtInIds = allCatalogs().filter(function (catalog) { return !catalog.imported; }).map(function (catalog) { return catalog.id; });
    const result = mergeBackup(parsed.backup, builtInIds, allCatalogs().map(function (catalog) { return catalog.id; }));
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
  toggle.setAttribute("aria-pressed", String(theme === "dark"));
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
  const expired = allCatalogs().find(function (catalog) {
    const exam = restoreRunningExam(catalog);
    return exam && examRemainingMs(exam, Date.now()) <= 0;
  });
  if (expired) {
    currentExam = restoreRunningExam(expired);
    finishExam(true);
  } else {
    showCatalogList();
  }
}

// Offline use and installation: needs https or localhost, so it is skipped when the page is opened from a file
if ("serviceWorker" in navigator && /^https?:$/.test(location.protocol)) {
  navigator.serviceWorker.register("sw.js").catch(function () { /* the app works without it */ });

  // A new service worker takes over after a deploy. The open page still runs the old files, so offer a reload.
  let hadController = Boolean(navigator.serviceWorker.controller);
  navigator.serviceWorker.addEventListener("controllerchange", function () {
    if (hadController) document.getElementById("update-bar").hidden = false;
    hadController = true;
  });
  document.getElementById("update-reload").addEventListener("click", function () { location.reload(); });
}

// Imported catalogs join the built-in ones before the first screen
loadImportedCatalogs(allCatalogs().map(function (catalog) { return catalog.id; })).forEach(function (catalog) {
  window.CATALOGS.push(catalog);
});

startApp();
