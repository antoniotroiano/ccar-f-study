/* Keys. Everything lives in localStorage, per browser and device.
   Broken or missing data never throws: every reader falls back to an empty value. */
const KEY_RUNS = "ccarf.runs.v2";          // paused rounds, one per catalog
const KEY_PROGRESS = "ccarf.progress.v1";  // per question: box, right, wrong, last answered
const KEY_HISTORY = "ccarf.history.v1";    // one entry per counted answer
const KEY_ROUNDS = "ccarf.rounds.v1";      // one entry per finished round
const KEY_SETTINGS = "ccarf.settings.v1";  // last chosen round length and domain
const KEY_EXAMS = "ccarf.exams.v1";        // running exam, one per catalog
const KEY_EXAM_RESULTS = "ccarf.examresults.v1"; // finished exams
const KEY_IMPORTED = "ccarf.imported.v1";  // catalogs imported from JSON files, by catalog id
const KEY_THEME = "ccarf.theme.v1";        // "dark" or "light" (also read by the script in index.html)
const KEY_BACKUP = "ccarf.backup.v1";      // when the progress was last exported
const KEY_FLAGS = "ccarf.flags.v1";        // questions reported as possibly wrong, with a note

function readJson(key, isValid, fallback) {
  try {
    const value = JSON.parse(localStorage.getItem(key));
    return isValid(value) ? value : fallback;
  } catch (error) {
    return fallback;
  }
}

// Returns false when the browser refuses to store (private mode, storage disabled).
function writeJson(key, value) {
  try {
    localStorage.setItem(key, JSON.stringify(value));
    return true;
  } catch (error) {
    return false;
  }
}

function isPlainObject(value) {
  return value !== null && typeof value === "object" && !Array.isArray(value);
}

/* Paused rounds */
function saveRun(round) {
  const runs = readJson(KEY_RUNS, isPlainObject, {});
  runs[round.catalog.id] = serializeRound(round);
  return writeJson(KEY_RUNS, runs);
}

function loadRun(catalogId) {
  return readJson(KEY_RUNS, isPlainObject, {})[catalogId] || null;
}

function clearRun(catalogId) {
  const runs = readJson(KEY_RUNS, isPlainObject, {});
  delete runs[catalogId];
  writeJson(KEY_RUNS, runs);
}

/* Progress per question, identified by catalog id plus question id */
// The id under which progress, answers and reports of a catalog are stored. A catalog made from another one
// (for example one domain of the core catalog) names its source in progressId and shares its progress.
function dataId(catalog) {
  return catalog.progressId || catalog.id;
}

function progressKey(catalogId, questionId) {
  return catalogId + "::" + questionId;
}

function loadProgress() {
  return readJson(KEY_PROGRESS, isPlainObject, {});
}

function saveProgress(progress) {
  return writeJson(KEY_PROGRESS, progress);
}

// Always returns a clean entry, even if the stored one is damaged.
function progressEntry(progress, catalogId, questionId) {
  const raw = progress[progressKey(catalogId, questionId)];
  const entry = isPlainObject(raw) ? raw : {};
  const count = function (value) { return Number.isInteger(value) && value > 0 ? value : 0; };
  return {
    box: Math.min(count(entry.box), CONFIG.MAX_BOX),
    right: count(entry.right),
    wrong: count(entry.wrong),
    last: count(entry.last)
  };
}

/* Answer history */
function isValidHistoryEntry(entry) {
  return isPlainObject(entry) && typeof entry.catalogId === "string" &&
    typeof entry.questionId === "string" && typeof entry.domain === "string" &&
    typeof entry.correct === "boolean";
}

function loadHistory() {
  return readJson(KEY_HISTORY, Array.isArray, []).filter(isValidHistoryEntry);
}

function saveHistory(history) {
  return writeJson(KEY_HISTORY, history.slice(-CONFIG.HISTORY_LIMIT));
}

/* Finished rounds */
function isValidRoundRecord(entry) {
  return isPlainObject(entry) && typeof entry.catalogId === "string" &&
    Number.isFinite(entry.length) && Number.isFinite(entry.percent);
}

function loadRounds() {
  return readJson(KEY_ROUNDS, Array.isArray, []).filter(isValidRoundRecord);
}

function saveRounds(rounds) {
  return writeJson(KEY_ROUNDS, rounds.slice(-CONFIG.ROUNDS_LIMIT));
}

/* Running exam: answers, marks and the end time, so a reload keeps the exam alive */
function saveExam(exam) {
  const exams = readJson(KEY_EXAMS, isPlainObject, {});
  exams[exam.catalog.id] = serializeExam(exam);
  return writeJson(KEY_EXAMS, exams);
}

function loadExam(catalogId) {
  return readJson(KEY_EXAMS, isPlainObject, {})[catalogId] || null;
}

function clearExam(catalogId) {
  const exams = readJson(KEY_EXAMS, isPlainObject, {});
  delete exams[catalogId];
  writeJson(KEY_EXAMS, exams);
}

/* Finished exams */
function isValidExamResult(entry) {
  return isPlainObject(entry) && typeof entry.catalogId === "string" &&
    Number.isFinite(entry.total) && Number.isFinite(entry.percent) && isPlainObject(entry.perDomain);
}

function loadExamResults() {
  return readJson(KEY_EXAM_RESULTS, Array.isArray, []).filter(isValidExamResult);
}

function saveExamResults(results) {
  return writeJson(KEY_EXAM_RESULTS, results.slice(-EXAM.RESULTS_LIMIT));
}

/* Reported questions: kept separately from progress, so "Reset progress" does not remove them */
function loadFlags() {
  return readJson(KEY_FLAGS, isPlainObject, {});
}

function flagFor(catalogId, questionId) {
  const flag = loadFlags()[progressKey(catalogId, questionId)];
  return isPlainObject(flag) ? flag : null;
}

function saveFlags(flags) {
  return writeJson(KEY_FLAGS, flags);
}

function saveFlag(catalogId, questionId, note) {
  const flags = loadFlags();
  flags[progressKey(catalogId, questionId)] = { catalogId: catalogId, questionId: questionId, note: note, t: Date.now() };
  return writeJson(KEY_FLAGS, flags);
}

function removeFlag(catalogId, questionId) {
  const flags = loadFlags();
  delete flags[progressKey(catalogId, questionId)];
  writeJson(KEY_FLAGS, flags);
}

/* Settings */
function loadSettings() {
  const settings = readJson(KEY_SETTINGS, isPlainObject, {});
  return {
    length: CONFIG.ROUND_LENGTHS.indexOf(settings.length) !== -1 ? settings.length : CONFIG.DEFAULT_ROUND_LENGTH,
    domain: typeof settings.domain === "string" ? settings.domain : "all",
    repeat: isPlainObject(settings.repeat) ? settings.repeat : {} // per catalog: repeat wrong questions at the end of the round
  };
}

function repeatWrongEnabled(settings, catalog) {
  const value = settings.repeat[catalog.id];
  return typeof value === "boolean" ? value : CONFIG.REPEAT_WRONG_DEFAULT;
}

function saveSettings(settings) {
  writeJson(KEY_SETTINGS, settings);
}

/* Reset: removes progress, history, rounds and the paused round of one catalog */
function resetCatalogProgress(catalog) {
  const dataKey = dataId(catalog);
  const isDerived = Boolean(catalog.progressId);
  const questionIds = {};
  catalog.questions.forEach(function (question) { questionIds[question.id] = true; });

  // Resetting a source catalog also resets the catalogs made from it. Resetting a derived one only touches its own questions.
  const affectedIds = isDerived ? [catalog.id] : (window.CATALOGS || []).filter(function (item) {
    return dataId(item) === dataKey;
  }).map(function (item) { return item.id; });
  const isAffected = function (id) { return affectedIds.indexOf(id) !== -1; };

  const progress = loadProgress();
  Object.keys(progress).forEach(function (key) {
    const belongs = isDerived
      ? Object.keys(questionIds).some(function (id) { return key === progressKey(dataKey, id); })
      : key.indexOf(dataKey + "::") === 0;
    if (belongs) delete progress[key];
  });
  saveProgress(progress);
  saveHistory(loadHistory().filter(function (entry) {
    return !(entry.catalogId === dataKey && (!isDerived || questionIds[entry.questionId]));
  }));
  saveRounds(loadRounds().filter(function (entry) { return !isAffected(entry.catalogId); }));
  saveExamResults(loadExamResults().filter(function (entry) { return !isAffected(entry.catalogId); }));
  affectedIds.forEach(function (id) {
    clearRun(id);
    clearExam(id);
  });
}

/* Imported catalogs. They are checked again on every load, so damaged or edited data never reaches the app. */
function loadImportedCatalogs(takenIds) {
  const stored = readJson(KEY_IMPORTED, isPlainObject, {});
  const catalogs = [];
  Object.keys(stored).forEach(function (id) {
    const result = validateCatalogJson(stored[id], takenIds);
    if (result.catalog && result.catalog.id === id) {
      result.catalog.imported = true;
      catalogs.push(result.catalog);
    }
  });
  return catalogs;
}

// Returns false when the browser has no room left (about 5 MB per site).
function saveImportedCatalog(catalog) {
  const stored = readJson(KEY_IMPORTED, isPlainObject, {});
  const copy = JSON.parse(JSON.stringify(catalog));
  delete copy.imported;
  stored[catalog.id] = copy;
  return writeJson(KEY_IMPORTED, stored);
}

function removeImportedCatalog(catalogId) {
  const stored = readJson(KEY_IMPORTED, isPlainObject, {});
  delete stored[catalogId];
  writeJson(KEY_IMPORTED, stored);
}

/* Backup info */
function loadBackupInfo() {
  const info = readJson(KEY_BACKUP, isPlainObject, {});
  return { lastExportAt: typeof info.lastExportAt === "string" ? info.lastExportAt : null };
}

function saveBackupInfo(info) {
  return writeJson(KEY_BACKUP, info);
}

/* Theme */
function loadTheme() {
  try {
    return localStorage.getItem(KEY_THEME) === "dark" ? "dark" : "light";
  } catch (error) {
    return "light";
  }
}

function saveTheme(theme) {
  try {
    localStorage.setItem(KEY_THEME, theme);
  } catch (error) {
    /* the theme still applies for this visit */
  }
}
