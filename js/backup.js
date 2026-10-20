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
      progress[key] = progressEntry(data.progress, key.slice(0, at), key.slice(at + 2));
    });
  }

  const flags = {};
  if (isPlainObject(data.flags)) {
    Object.keys(data.flags).forEach(function (key) {
      const flag = data.flags[key];
      if (isPlainObject(flag) && typeof flag.catalogId === "string" && typeof flag.questionId === "string" && isFiniteTime(flag.t)) {
        flags[key] = { catalogId: flag.catalogId, questionId: flag.questionId, note: typeof flag.note === "string" ? flag.note.slice(0, 1000) : "", t: flag.t };
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
      history: (Array.isArray(data.history) ? data.history : []).filter(function (entry) { return isValidHistoryEntry(entry) && isFiniteTime(entry.t); }),
      rounds: (Array.isArray(data.rounds) ? data.rounds : []).filter(function (entry) { return isValidRoundRecord(entry) && isFiniteTime(entry.t); }),
      examResults: (Array.isArray(data.examResults) ? data.examResults : []).filter(function (entry) { return isValidExamResult(entry) && isFiniteTime(entry.t); }),
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
  const seen = {};
  const merged = [];
  local.concat(incoming).forEach(function (record) {
    const key = keyOf(record);
    if (seen[key]) return;
    seen[key] = true;
    merged.push(record);
  });
  merged.sort(function (a, b) { return a.t - b.t; });
  return merged;
}

/* Merges a parsed backup into this browser. For a question that exists on both sides, the newer answer wins.
   History, rounds, exams and reports are combined without duplicates.
   builtInIds: catalog ids that an imported catalog must not take over. Returns what changed. */
function mergeBackup(backup, builtInIds, existingCatalogIds) {
  const result = { questionsUpdated: 0, answersAdded: 0, roundsAdded: 0, examsAdded: 0, reportsAdded: 0, catalogsAdded: [] };

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
  saveProgress(progress);

  const history = loadHistory();
  const mergedHistory = mergeRecords(history, backup.history, function (entry) { return entry.t + "|" + entry.catalogId + "|" + entry.questionId; });
  result.answersAdded = mergedHistory.length - history.length;
  saveHistory(mergedHistory);

  const rounds = loadRounds();
  const mergedRounds = mergeRecords(rounds, backup.rounds, function (entry) { return entry.t + "|" + entry.catalogId; });
  result.roundsAdded = mergedRounds.length - rounds.length;
  saveRounds(mergedRounds);

  const exams = loadExamResults();
  const mergedExams = mergeRecords(exams, backup.examResults, function (entry) { return entry.t + "|" + entry.catalogId; });
  result.examsAdded = mergedExams.length - exams.length;
  saveExamResults(mergedExams);

  const flags = loadFlags();
  Object.keys(backup.flags).forEach(function (key) {
    if (!isPlainObject(flags[key]) || backup.flags[key].t > flags[key].t) {
      if (!isPlainObject(flags[key])) result.reportsAdded++;
      flags[key] = backup.flags[key];
    }
  });
  saveFlags(flags);

  Object.keys(backup.importedCatalogs).forEach(function (id) {
    if (builtInIds.indexOf(id) !== -1 || existingCatalogIds.indexOf(id) !== -1) return;
    if (saveImportedCatalog(backup.importedCatalogs[id])) {
      const catalog = backup.importedCatalogs[id];
      catalog.imported = true;
      result.catalogsAdded.push(catalog);
    }
  });

  return result;
}
