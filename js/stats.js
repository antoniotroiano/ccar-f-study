/* Statistics for one catalog, all calculated from the stored answers */
function tally(entries) {
  const correct = entries.filter(function (entry) { return entry.correct; }).length;
  return { correct: correct, total: entries.length, rate: entries.length ? percent(correct, entries.length) : null };
}

function lastAnswers(entries) {
  return entries.slice(-CONFIG.LAST_ANSWERS_WINDOW);
}

// light: green, amber, red, or none (not enough data)
function domainLight(windowTally) {
  if (windowTally.total < CONFIG.MIN_ANSWERS) return "none";
  if (windowTally.rate >= CONFIG.READY_TARGET) return "green";
  if (windowTally.rate >= CONFIG.READY_TARGET - CONFIG.AMBER_MARGIN) return "amber";
  return "red";
}

function computeStats(catalog) {
  const questionIds = {};
  catalog.questions.forEach(function (question) { questionIds[question.id] = true; });

  // answers of questions that left the catalog are ignored
  const history = loadHistory().filter(function (entry) {
    return entry.catalogId === dataId(catalog) && questionIds[entry.questionId];
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
      isWeak: recent.total >= CONFIG.MIN_ANSWERS && recent.rate < CONFIG.WEAK_THRESHOLD
    };
  });

  const seen = catalog.questions.filter(function (question) {
    const entry = progressEntry(progress, dataId(catalog), question.id);
    return entry.right + entry.wrong > 0;
  }).length;
  const coveragePercent = percent(seen, catalog.questions.length);

  const exams = loadExamResults().filter(function (entry) { return entry.catalogId === catalog.id; });
  const latestExams = exams.slice(-EXAM.READY_EXAM_COUNT);
  const examsOk = latestExams.length >= EXAM.READY_EXAM_COUNT && latestExams.every(function (entry) {
    return entry.percent >= EXAM.PASS_PERCENT;
  });

  const allGreen = domains.length > 0 && domains.every(function (item) { return item.light === "green"; });
  const coverageOk = coveragePercent >= CONFIG.READY_COVERAGE;

  const rounds = loadRounds()
    .filter(function (entry) { return entry.catalogId === catalog.id; })
    .slice(-CONFIG.ROUNDS_SHOWN)
    .reverse();

  return {
    overall: { recent: tally(lastAnswers(history)), allTime: tally(history) },
    domains: domains,
    weakDomains: domains.filter(function (item) { return item.isWeak; }),
    coverage: { seen: seen, total: catalog.questions.length, percent: coveragePercent },
    ready: { isReady: allGreen && coverageOk && examsOk, allGreen: allGreen, coverageOk: coverageOk, examsOk: examsOk },
    rounds: rounds,
    exams: exams.slice(-CONFIG.ROUNDS_SHOWN).reverse()
  };
}
