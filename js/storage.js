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
const KEY_PRACTICE = "ccarf.practice.v1";  // ticked practice exercises of the study notes: id -> time
const KEY_DIAGNOSTIC = "ccarf.diagnostic.v1"; // last diagnostic result per catalog id: { t, total, perDomain: { D1: { correct, wrong } } }
const KEY_FLAGS = "ccarf.flags.v1";        // questions reported as possibly wrong, with a note
const KEY_DEVICE = "ccarf.device.v1";      // random id of this browser, for counting answers per device (not part of the backup)

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

// Raw copy of some keys, so a multi-key write can be undone when one of the writes fails.
function snapshotKeys(keys) {
  const snapshot = {};
  keys.forEach(function (key) {
    try { snapshot[key] = localStorage.getItem(key); } catch (error) { snapshot[key] = null; }
  });
  return snapshot;
}

function restoreKeys(snapshot) {
  Object.keys(snapshot).forEach(function (key) {
    try {
      if (snapshot[key] === null) localStorage.removeItem(key); else localStorage.setItem(key, snapshot[key]);
    } catch (error) { /* nothing more to do */ }
  });
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

/* Counters per device: every browser counts only its own answers in byDevice[<device id>], and right/wrong are the
   sum over all devices. A backup import takes the larger value per device, so repeating an import or moving a backup
   back and forth never counts an answer twice. Counters without a device (older data) sit in the bucket "legacy". */
const LEGACY_DEVICE = "legacy";
let cachedDeviceId = null;

function isDeviceId(value) {
  return typeof value === "string" && (value === LEGACY_DEVICE || /^[a-z0-9]{8,32}$/.test(value));
}

function newDeviceId() {
  let id = "";
  while (id.length < 16) id += Math.floor(Math.random() * 36).toString(36);
  return id;
}

// Created once per browser. When storage is blocked, the id lives only until the page is closed.
function deviceId() {
  if (cachedDeviceId) return cachedDeviceId;
  let stored = null;
  try { stored = localStorage.getItem(KEY_DEVICE); } catch (error) { /* use a new one */ }
  if (isDeviceId(stored) && stored !== LEGACY_DEVICE) {
    cachedDeviceId = stored;
  } else {
    cachedDeviceId = newDeviceId();
    try { localStorage.setItem(KEY_DEVICE, cachedDeviceId); } catch (error) { /* stays in memory */ }
  }
  return cachedDeviceId;
}

function sumDevices(byDevice) {
  let right = 0;
  let wrong = 0;
  Object.keys(byDevice).forEach(function (id) {
    right += byDevice[id].right;
    wrong += byDevice[id].wrong;
  });
  return { right: right, wrong: wrong };
}

// Counts one answer for this device and updates the totals.
function countAnswer(entry, isCorrect) {
  const id = deviceId();
  const own = entry.byDevice[id] || { right: 0, wrong: 0 };
  if (isCorrect) own.right++; else own.wrong++;
  entry.byDevice[id] = own;
  const sum = sumDevices(entry.byDevice);
  entry.right = sum.right;
  entry.wrong = sum.wrong;
}

// Always returns a clean entry, even if the stored one is damaged.
function progressEntry(progress, catalogId, questionId) {
  return cleanProgressEntry(progress[progressKey(catalogId, questionId)]);
}

function cleanProgressEntry(raw) {
  const entry = isPlainObject(raw) ? raw : {};
  const count = function (value) { return Number.isInteger(value) && value > 0 ? value : 0; };
  const byDevice = {};
  if (isPlainObject(entry.byDevice)) {
    Object.keys(entry.byDevice).forEach(function (id) {
      const item = entry.byDevice[id];
      if (isDeviceId(id) && isPlainObject(item)) byDevice[id] = { right: count(item.right), wrong: count(item.wrong) };
    });
  } else if (count(entry.right) + count(entry.wrong) > 0) {
    byDevice[LEGACY_DEVICE] = { right: count(entry.right), wrong: count(entry.wrong) };
  }
  const sum = sumDevices(byDevice);
  return {
    box: Math.min(count(entry.box), CONFIG.MAX_BOX),
    right: sum.right,
    wrong: sum.wrong,
    last: count(entry.last),
    byDevice: byDevice
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
    Number.isFinite(entry.length) && Number.isFinite(entry.correct) && Number.isFinite(entry.percent);
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
    Number.isFinite(entry.total) && Number.isFinite(entry.correct) && Number.isFinite(entry.percent) && isPlainObject(entry.perDomain);
}

function loadExamResults() {
  return readJson(KEY_EXAM_RESULTS, Array.isArray, []).filter(isValidExamResult);
}

function saveExamResults(results) {
  return writeJson(KEY_EXAM_RESULTS, results.slice(-EXAM.RESULTS_LIMIT));
}

/* Last diagnostic result per catalog id. Only the latest is kept, so it can be looked at again.
   cleanDiagnostic returns a rebuilt entry from known fields, or null (also used when a backup is read). */
function cleanDiagnostic(entry) {
  if (!isPlainObject(entry) || !Number.isFinite(entry.t) || entry.t <= 0 || !isPlainObject(entry.perDomain)) return null;
  const perDomain = {};
  DOMAINS.forEach(function (domain) {
    const item = entry.perDomain[domain];
    if (isPlainObject(item) && Number.isInteger(item.correct) && Number.isInteger(item.wrong) && item.correct >= 0 && item.wrong >= 0 &&
        item.correct + item.wrong <= 1000) {
      perDomain[domain] = { correct: item.correct, wrong: item.wrong };
    }
  });
  if (Object.keys(perDomain).length === 0) return null;
  return { t: entry.t, perDomain: perDomain };
}

function loadDiagnostics() {
  const stored = readJson(KEY_DIAGNOSTIC, isPlainObject, {});
  const clean = {};
  Object.keys(stored).forEach(function (id) {
    const entry = cleanDiagnostic(stored[id]);
    if (isImportId(id) && entry) clean[id] = entry;
  });
  return clean;
}

function saveDiagnostics(diagnostics) {
  return writeJson(KEY_DIAGNOSTIC, diagnostics);
}

/* Practice checklist of the study notes: { exerciseId: timeTicked }. Only well-formed entries are kept. */
function loadPractice() {
  const stored = readJson(KEY_PRACTICE, isPlainObject, {});
  const clean = {};
  Object.keys(stored).forEach(function (id) {
    if (/^[a-z0-9-]{1,40}$/.test(id) && Number.isFinite(stored[id])) clean[id] = stored[id];
  });
  return clean;
}

function setPracticeDone(id, isDone) {
  const practice = loadPractice();
  if (isDone) practice[id] = Date.now(); else delete practice[id];
  return writeJson(KEY_PRACTICE, practice);
}

/* Reported questions: kept separately from progress, so "Reset progress" does not remove them */
function isValidFlag(flag) {
  return isPlainObject(flag) && typeof flag.catalogId === "string" && typeof flag.questionId === "string" && Number.isFinite(flag.t);
}

function loadFlags() {
  const stored = readJson(KEY_FLAGS, isPlainObject, {});
  const flags = {};
  Object.keys(stored).forEach(function (key) {
    if (isValidFlag(stored[key])) flags[key] = stored[key];
  });
  return flags;
}

function flagFor(catalogId, questionId) {
  const flag = loadFlags()[progressKey(catalogId, questionId)];
  return isValidFlag(flag) ? flag : null;
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
    checkFirst: settings.checkFirst === true,   // single choice: tap selects, "Check answer" confirms
    examMode: EXAM.MODES.indexOf(settings.examMode) !== -1 ? settings.examMode : "timed", // chosen exam mode
    shortcuts: settings.shortcuts !== false,    // single-key shortcuts (A-F, 1-4) on question screens
    repeat: isPlainObject(settings.repeat) ? settings.repeat : {}, // per catalog: repeat wrong questions at the end of the round
    examDate: isValidDateString(settings.examDate) ? settings.examDate : null // planned exam day, "YYYY-MM-DD", local calendar day
  };
}

// "YYYY-MM-DD" that is a real calendar day (no 2026-02-31)
function isValidDateString(value) {
  const match = typeof value === "string" ? /^(\d{4})-(\d{2})-(\d{2})$/.exec(value) : null;
  if (!match) return false;
  const date = new Date(Number(match[1]), Number(match[2]) - 1, Number(match[3]));
  return date.getFullYear() === Number(match[1]) && date.getMonth() === Number(match[2]) - 1 && date.getDate() === Number(match[3]);
}

function localDateString(time) {
  const date = new Date(time);
  return date.getFullYear() + "-" + String(date.getMonth() + 1).padStart(2, "0") + "-" + String(date.getDate()).padStart(2, "0");
}

// Whole calendar days from today to the exam day (negative when it has passed), or null without a valid date.
// Compares local calendar days, so a clock change does not shift the count.
function daysToExam(examDate, now) {
  if (!isValidDateString(examDate)) return null;
  const parts = examDate.split("-").map(Number);
  const today = new Date(now);
  const utcExam = Date.UTC(parts[0], parts[1] - 1, parts[2]);
  const utcToday = Date.UTC(today.getFullYear(), today.getMonth(), today.getDate());
  return Math.round((utcExam - utcToday) / 86400000);
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
  const questionIds = new Set(catalog.questions.map(function (question) { return question.id; }));

  // Resetting a source catalog also resets the catalogs made from it. Resetting a derived one only touches its own questions.
  const affectedIds = isDerived ? [catalog.id] : (window.CATALOGS || []).filter(function (item) {
    return dataId(item) === dataKey;
  }).map(function (item) { return item.id; });
  const isAffected = function (id) { return affectedIds.indexOf(id) !== -1; };

  const progress = loadProgress();
  Object.keys(progress).forEach(function (key) {
    const belongs = isDerived
      ? catalog.questions.some(function (question) { return key === progressKey(dataKey, question.id); })
      : key.indexOf(dataKey + "::") === 0;
    if (belongs) delete progress[key];
  });
  saveProgress(progress);
  saveHistory(loadHistory().filter(function (entry) {
    return !(entry.catalogId === dataKey && (!isDerived || questionIds.has(entry.questionId)));
  }));
  saveRounds(loadRounds().filter(function (entry) { return !isAffected(entry.catalogId); }));
  saveExamResults(loadExamResults().filter(function (entry) { return !isAffected(entry.catalogId); }));
  const diagnostics = loadDiagnostics();
  affectedIds.forEach(function (id) {
    clearRun(id);
    clearExam(id);
    delete diagnostics[id];
  });
  saveDiagnostics(diagnostics);
}

/* Imported catalogs. They are checked again on every load, so damaged or edited data never reaches the app. */
function loadImportedCatalogs(takenIds) {
  const stored = readJson(KEY_IMPORTED, isPlainObject, {});
  const catalogs = [];
  loadImportedCatalogs.skipped = []; // ids of stored catalogs that failed the check (the data stays in storage)
  Object.keys(stored).forEach(function (id) {
    const result = validateCatalogJson(stored[id], takenIds);
    if (result.catalog && result.catalog.id === id) {
      result.catalog.imported = true;
      catalogs.push(result.catalog);
    } else {
      loadImportedCatalogs.skipped.push(id);
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
