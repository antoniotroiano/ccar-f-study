/* Backup: export all progress to a file, and merge such a file back in.
   The file holds progress, answer history, finished rounds and exams, reports and imported catalogs.
   Paused rounds, a running exam, settings and the theme stay on the device on purpose. */
const BACKUP_FORMAT = "ccarf-backup";
const BACKUP_VERSION = 1;
const BACKUP_MAX_BYTES = 10 * 1024 * 1024;

function buildBackup(now) {
  return {
    format: BACKUP_FORMAT,
    version: BACKUP_VERSION,
    exportedAt: new Date(now).toISOString(),
    appVersion: APP_VERSION,
    data: {
      progress: loadProgress(),
      history: loadHistory(),
      rounds: loadRounds(),
      examResults: loadExamResults(),
      flags: loadFlags(),
      importedCatalogs: readJson(KEY_IMPORTED, isPlainObject, {})
    }
  };
}

function isFiniteTime(value) {
  return Number.isFinite(value) && value > 0;
}

function isCount(value) {
  return Number.isFinite(value) && value >= 0;
}

// Every record is rebuilt from the fields we know, so nothing else from the file can reach storage or the screen.
function cleanHistoryEntry(entry) {
  if (!isPlainObject(entry) || !isFiniteTime(entry.t) || !isImportId(entry.catalogId) || !isImportId(entry.questionId) ||
      IMPORT_DOMAINS.indexOf(entry.domain) === -1 || typeof entry.correct !== "boolean") return null;
  return { t: entry.t, catalogId: entry.catalogId, questionId: entry.questionId, domain: entry.domain, correct: entry.correct,
    mode: entry.mode === "exam" ? "exam" : "learn" };
}

function cleanRoundRecord(entry) {
  if (!isPlainObject(entry) || !isFiniteTime(entry.t) || !isImportId(entry.catalogId) ||
      !isCount(entry.length) || !isCount(entry.correct) || !Number.isFinite(entry.percent)) return null;
  return { t: entry.t, catalogId: entry.catalogId, length: entry.length, correct: entry.correct, percent: entry.percent };
}

function cleanExamResult(entry) {
  if (!isPlainObject(entry) || !isFiniteTime(entry.t) || !isImportId(entry.catalogId) ||
      !isCount(entry.total) || !isCount(entry.correct) || !Number.isFinite(entry.percent) || !isPlainObject(entry.perDomain)) return null;
  const perDomain = {};
  IMPORT_DOMAINS.forEach(function (domain) {
    const item = entry.perDomain[domain];
    if (isPlainObject(item) && isCount(item.correct) && isCount(item.total)) perDomain[domain] = { correct: item.correct, total: item.total };
  });
  return { t: entry.t, catalogId: entry.catalogId, total: entry.total, correct: entry.correct, percent: entry.percent, perDomain: perDomain,
    timedOut: entry.timedOut === true, durationSeconds: isCount(entry.durationSeconds) ? entry.durationSeconds : 0 };
}

function cleanList(list, clean) {
  return (Array.isArray(list) ? list : []).map(clean).filter(function (entry) { return entry !== null; });
}

// Reads backup text. Returns { backup } with cleaned data, or { error }. Broken parts are dropped, never trusted.
function parseBackup(text) {
  let raw;
  try {
    raw = JSON.parse(text);
  } catch (error) {
    return { error: "This is not valid JSON (" + error.message + ")." };
  }
  if (!isPlainObject(raw) || raw.format !== BACKUP_FORMAT || !isPlainObject(raw.data)) {
    return { error: "This is not a backup file from this app." };
  }
  if (!Number.isInteger(raw.version) || raw.version > BACKUP_VERSION) {
    return { error: "This backup comes from a newer version of the app. Update the app first." };
  }

  const data = raw.data;
  const progress = {};
  if (isPlainObject(data.progress)) {
    Object.keys(data.progress).forEach(function (key) {
      const at = key.indexOf("::");
      if (at < 1 || at === key.length - 2) return;
      const catalogId = key.slice(0, at);
      const questionId = key.slice(at + 2);
      if (!isImportId(catalogId) || !isImportId(questionId)) return;
      progress[progressKey(catalogId, questionId)] = progressEntry(data.progress, catalogId, questionId);
    });
  }

  // The key is built from the two ids, never taken from the file
  const flags = {};
  if (isPlainObject(data.flags)) {
    Object.keys(data.flags).forEach(function (key) {
      const flag = data.flags[key];
      if (isPlainObject(flag) && isImportId(flag.catalogId) && isImportId(flag.questionId) && isFiniteTime(flag.t)) {
        flags[progressKey(flag.catalogId, flag.questionId)] = { catalogId: flag.catalogId, questionId: flag.questionId,
          note: typeof flag.note === "string" ? flag.note.slice(0, 1000) : "", t: flag.t };
      }
    });
  }

  const importedCatalogs = {};
  if (isPlainObject(data.importedCatalogs)) {
    Object.keys(data.importedCatalogs).forEach(function (id) {
      const result = validateCatalogJson(data.importedCatalogs[id], []);
      if (result.catalog && result.catalog.id === id) importedCatalogs[id] = result.catalog;
    });
  }

  return {
    backup: {
      exportedAt: typeof raw.exportedAt === "string" ? raw.exportedAt : null,
      progress: progress,
      history: cleanList(data.history, cleanHistoryEntry),
      rounds: cleanList(data.rounds, cleanRoundRecord),
      examResults: cleanList(data.examResults, cleanExamResult),
      flags: flags,
      importedCatalogs: importedCatalogs
    }
  };
}

function summarizeBackup(backup) {
  return {
    answers: backup.history.length,
    questions: Object.keys(backup.progress).length,
    rounds: backup.rounds.length,
    exams: backup.examResults.length,
    reports: Object.keys(backup.flags).length,
    catalogs: Object.keys(backup.importedCatalogs).length
  };
}

// Union of two lists of records, without duplicates, oldest first
function mergeRecords(local, incoming, keyOf) {
  const seen = new Set();
  const merged = [];
  local.concat(incoming).forEach(function (record) {
    const key = keyOf(record);
    if (seen.has(key)) return;
    seen.add(key);
    merged.push(record);
  });
  merged.sort(function (a, b) { return a.t - b.t; });
  return merged;
}

// How many records of the final (possibly shortened) list were not there before
function countNew(local, finalList, keyOf) {
  const known = new Set(local.map(keyOf));
  return finalList.filter(function (record) { return !known.has(keyOf(record)); }).length;
}

/* Merges a parsed backup into this browser. For a question that exists on both sides, the newer answer wins.
   History, rounds, exams and reports are combined without duplicates. An imported catalog that already exists is kept as it is.
   Everything is computed first and then written. When one write fails, the old values are put back and result.failed is true.
   builtInIds: catalog ids that an imported catalog must not take over. Returns what changed. */
function mergeBackup(backup, builtInIds, existingCatalogIds) {
  const result = { questionsUpdated: 0, answersAdded: 0, roundsAdded: 0, examsAdded: 0, reportsAdded: 0, catalogsAdded: [], failed: false };

  const progress = loadProgress();
  Object.keys(backup.progress).forEach(function (key) {
    const at = key.indexOf("::");
    const local = progressEntry(progress, key.slice(0, at), key.slice(at + 2));
    const incoming = backup.progress[key];
    if (!progress[key] || incoming.last > local.last) {
      progress[key] = incoming;
      result.questionsUpdated++;
    }
  });

  const historyKey = function (entry) { return entry.t + "|" + entry.catalogId + "|" + entry.questionId; };
  const roundKey = function (entry) { return entry.t + "|" + entry.catalogId; };
  const history = loadHistory();
  const mergedHistory = mergeRecords(history, backup.history, historyKey).slice(-CONFIG.HISTORY_LIMIT);
  result.answersAdded = countNew(history, mergedHistory, historyKey);

  const rounds = loadRounds();
  const mergedRounds = mergeRecords(rounds, backup.rounds, roundKey).slice(-CONFIG.ROUNDS_LIMIT);
  result.roundsAdded = countNew(rounds, mergedRounds, roundKey);

  const exams = loadExamResults();
  const mergedExams = mergeRecords(exams, backup.examResults, roundKey).slice(-EXAM.RESULTS_LIMIT);
  result.examsAdded = countNew(exams, mergedExams, roundKey);

  const flags = loadFlags();
  Object.keys(backup.flags).forEach(function (key) {
    if (!isPlainObject(flags[key]) || backup.flags[key].t > flags[key].t) {
      if (!isPlainObject(flags[key])) result.reportsAdded++;
      flags[key] = backup.flags[key];
    }
  });

  const newCatalogs = Object.keys(backup.importedCatalogs).filter(function (id) {
    return builtInIds.indexOf(id) === -1 && existingCatalogIds.indexOf(id) === -1;
  }).map(function (id) { return backup.importedCatalogs[id]; });

  const snapshot = snapshotKeys([KEY_PROGRESS, KEY_HISTORY, KEY_ROUNDS, KEY_EXAM_RESULTS, KEY_FLAGS, KEY_IMPORTED]);
  const ok = saveProgress(progress) && saveHistory(mergedHistory) && saveRounds(mergedRounds) &&
    saveExamResults(mergedExams) && saveFlags(flags) && newCatalogs.every(saveImportedCatalog);
  if (!ok) {
    restoreKeys(snapshot);
    return { questionsUpdated: 0, answersAdded: 0, roundsAdded: 0, examsAdded: 0, reportsAdded: 0, catalogsAdded: [], failed: true };
  }
  newCatalogs.forEach(function (catalog) {
    catalog.imported = true;
    result.catalogsAdded.push(catalog);
  });
  return result;
}
