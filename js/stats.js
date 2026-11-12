/* Statistics for one catalog, all calculated from the stored answers */
function tally(entries) {
  const correct = entries.filter(function (entry) { return entry.correct; }).length;
  // rate is rounded for display; exact is for comparisons with thresholds (69.6 % must not count as 70 %)
  return { correct: correct, total: entries.length, rate: entries.length ? percent(correct, entries.length) : null,
    exact: entries.length ? (correct / entries.length) * 100 : null };
}

function lastAnswers(entries) {
  return entries.slice(-CONFIG.LAST_ANSWERS_WINDOW);
}

// light: green, amber, red, or none (not enough data)
function domainLight(windowTally) {
  if (windowTally.total < CONFIG.MIN_ANSWERS) return "none";
  if (windowTally.exact >= CONFIG.READY_TARGET) return "green";
  if (windowTally.exact >= CONFIG.READY_TARGET - CONFIG.AMBER_MARGIN) return "amber";
  return "red";
}

// The catalog's own id plus the ids of catalogs that share its progress
function allCatalogIds(catalog) {
  return (window.CATALOGS || []).filter(function (item) {
    return item.id === catalog.id || item.progressId === catalog.id;
  }).map(function (item) { return item.id; }).concat(catalog.id);
}

function computeStats(catalog) {
  const questionIds = new Set(catalog.questions.map(function (question) { return question.id; }));

  // answers of questions that left the catalog are ignored
  const history = loadHistory().filter(function (entry) {
    return entry.catalogId === dataId(catalog) && questionIds.has(entry.questionId);
  });
  const progress = loadProgress();

  const domainsInCatalog = DOMAINS.filter(function (domain) {
    return catalog.questions.some(function (question) { return question.domain === domain; });
  });

  const domains = domainsInCatalog.map(function (domain) {
    const entries = history.filter(function (entry) { return entry.domain === domain; });
    const recent = tally(lastAnswers(entries));
    return {
      domain: domain,
      recent: recent,
      allTime: tally(entries),
      light: domainLight(recent),
      isWeak: recent.total >= CONFIG.MIN_ANSWERS && recent.exact < CONFIG.WEAK_THRESHOLD
    };
  });

  // per task statement (30 in the Exam Guide); questions without one in their source label are left out
  const statementOf = {};
  catalog.questions.forEach(function (question) {
    // the field taskStatement wins; the label text "Task Statement 1.2" is the fallback (core catalog)
    const match = question.taskStatement ? [null, question.taskStatement] : (question.source && /Task Statement (\d\.\d+)/.exec(question.source.label || ""));
    if (match && window.TASK_STATEMENTS && window.TASK_STATEMENTS[match[1]]) statementOf[question.id] = match[1];
  });
  const statements = Object.keys(window.TASK_STATEMENTS || {}).filter(function (id) {
    return Object.keys(statementOf).some(function (questionId) { return statementOf[questionId] === id; });
  }).map(function (id) {
    const entries = history.filter(function (entry) { return statementOf[entry.questionId] === id; });
    const all = tally(entries);
    return {
      id: id,
      title: window.TASK_STATEMENTS[id],
      questions: Object.keys(statementOf).filter(function (questionId) { return statementOf[questionId] === id; }).length,
      allTime: all,
      hasData: all.total >= TASK_MIN_ANSWERS
    };
  });

  const seen = catalog.questions.filter(function (question) {
    const entry = progressEntry(progress, dataId(catalog), question.id);
    return entry.right + entry.wrong > 0;
  }).length;
  const coveragePercent = percent(seen, catalog.questions.length);

  // rounds of a catalog made from this one (for example one domain) belong here too
  const ownIds = allCatalogIds(catalog);
  const isOwn = function (entry) { return ownIds.indexOf(entry.catalogId) !== -1; };

  const exams = loadExamResults().filter(isOwn);
  const latestExams = exams.slice(-EXAM.READY_EXAM_COUNT);
  const examsOk = latestExams.length >= EXAM.READY_EXAM_COUNT && latestExams.every(function (entry) {
    return isExamPassed(entry.correct, entry.total);
  });

  const allGreen = domains.length > 0 && domains.every(function (item) { return item.light === "green"; });
  const coverageOk = coveragePercent >= CONFIG.READY_COVERAGE;

  const rounds = loadRounds()
    .filter(isOwn)
    .slice(-CONFIG.ROUNDS_SHOWN)
    .reverse();

  return {
    overall: { recent: tally(lastAnswers(history)), allTime: tally(history) },
    domains: domains,
    statements: statements,
    weakDomains: domains.filter(function (item) { return item.isWeak; }),
    coverage: { seen: seen, total: catalog.questions.length, percent: coveragePercent },
    ready: { isReady: allGreen && coverageOk && examsOk, allGreen: allGreen, coverageOk: coverageOk, examsOk: examsOk },
    rounds: rounds,
    exams: exams.slice(-CONFIG.ROUNDS_SHOWN).reverse()
  };
}
