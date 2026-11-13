/* Boxes (Leitner): each question sits in box 1 to 5. A question never answered has no box yet. */
function nextBox(box, rating) {
  const current = box >= 1 ? box : 1;
  switch (rating) {
    case "again":
    case "guessed": return 1;
    case "unsure": return current;
    case "sure": return Math.min(current + 1, CONFIG.MAX_BOX);
  }
  return current;
}

/* The focus of a round is one string: "all", a domain ("D1"), a scenario ("scenario:s3") or a task statement ("task:1.2"). */
const SCENARIO_PREFIX = "scenario:";

const TASK_PREFIX = "task:";

// Task statement id ("1.2") of a question; the field taskStatement wins, the label "Task Statement 1.2" is the fallback (core catalog)
function taskStatementOf(question) {
  const match = question.taskStatement ? [null, question.taskStatement] : (question.source && /Task Statement (\d\.\d+)/.exec(question.source.label || ""));
  return match && window.TASK_STATEMENTS && window.TASK_STATEMENTS[match[1]] ? match[1] : null;
}

function matchesFilter(question, filter) {
  if (filter === "all") return true;
  if (filter.indexOf(TASK_PREFIX) === 0) return taskStatementOf(question) === filter.slice(TASK_PREFIX.length);
  if (filter.indexOf(SCENARIO_PREFIX) === 0) return question.scenario === filter.slice(SCENARIO_PREFIX.length);
  return question.domain === filter;
}

/* Choosing the questions of a round.
   Priority: low boxes first, random inside a box. About half of the round is new questions
   when enough exist. If one group is too small, the other fills the gap. */
function selectRoundQuestions(catalog, domainFilter, length, progress) {
  const pool = catalog.questions.filter(function (question) {
    return matchesFilter(question, domainFilter);
  });
  return pickFromPool(catalog, pool, length, progress);
}

function pickFromPool(catalog, pool, length, progress) {
  const target = Math.min(length, pool.length);

  const boxOf = function (question) { return progressEntry(progress, dataId(catalog), question.id).box; };
  const review = shuffle(pool.filter(function (question) { return boxOf(question) >= 1; }))
    .sort(function (a, b) { return boxOf(a) - boxOf(b); });
  const fresh = shuffle(pool.filter(function (question) { return boxOf(question) < 1; }));

  let freshCount = Math.min(fresh.length, Math.ceil(target * CONFIG.NEW_QUESTION_SHARE));
  const reviewCount = Math.min(review.length, target - freshCount);
  freshCount = Math.min(fresh.length, target - reviewCount);

  return review.slice(0, reviewCount).concat(fresh.slice(0, freshCount));
}

/* Diagnostic round: a few questions per domain by the exam weights, unseen questions first.
   It is a normal round for the statistics. The results screen turns it into a recommendation. */
function selectDiagnosticQuestions(catalog, progress) {
  const quotas = examQuotas(CONFIG.DIAGNOSTIC_QUESTIONS);
  const boxOf = function (question) { return progressEntry(progress, dataId(catalog), question.id).box; };
  let chosen = [];
  DOMAINS.forEach(function (domain) {
    const inDomain = catalog.questions.filter(function (question) { return question.domain === domain; });
    const fresh = shuffle(inDomain.filter(function (question) { return boxOf(question) < 1; }));
    const seen = shuffle(inDomain.filter(function (question) { return boxOf(question) >= 1; })).sort(function (a, b) { return boxOf(a) - boxOf(b); });
    chosen = chosen.concat(fresh.concat(seen).slice(0, quotas[domain]));
  });
  return chosen;
}

/* Recommendation after a diagnostic round: the weakest domains with enough answers, below 100 %. */
function diagnosticAdvice(perDomain) {
  const rated = DOMAINS.filter(function (domain) {
    const entry = perDomain[domain];
    return entry && entry.correct + entry.wrong >= CONFIG.DIAGNOSTIC_MIN_PER_DOMAIN;
  }).map(function (domain) {
    const entry = perDomain[domain];
    return { domain: domain, rate: percent(entry.correct, entry.correct + entry.wrong) };
  }).sort(function (a, b) { return a.rate - b.rate; });
  return { start: rated.filter(function (item) { return item.rate < 100; }).slice(0, 2), rated: rated };
}

/* Practice weak domains: a normal round (same choice of questions), but only from the domains
   the statistics mark as weak. The weak domains are worked out again whenever a round starts. */
function weakDomainsOf(catalog) {
  return computeStats(catalog).weakDomains.map(function (item) { return item.domain; });
}

function selectWeakQuestions(catalog, length, progress) {
  const weak = weakDomainsOf(catalog);
  const pool = catalog.questions.filter(function (question) { return weak.indexOf(question.domain) !== -1; });
  return pickFromPool(catalog, pool, length, progress);
}

/* Practice my mistakes: the questions that sit in box 1, which means answered wrong or guessed.
   A question leaves box 1 when it is answered right and rated Sure. */
function mistakePool(catalog, domainFilter, progress) {
  return catalog.questions.filter(function (question) {
    return (matchesFilter(question, domainFilter)) &&
      progressEntry(progress, dataId(catalog), question.id).box === 1;
  });
}

function countMistakes(catalog, domainFilter, progress) {
  return mistakePool(catalog, domainFilter, progress).length;
}

function selectMistakeQuestions(catalog, domainFilter, length, progress) {
  return shuffle(mistakePool(catalog, domainFilter, progress)).slice(0, length);
}

function availableQuestionCount(catalog, domainFilter) {
  return catalog.questions.filter(function (question) {
    return matchesFilter(question, domainFilter);
  }).length;
}

/* Recording a completed question (wrong answer, or correct answer after rating).
   A repeat only moves the box. It is not counted as an answer, so it cannot change any rate. */
function applyCompletion(round, index) {
  const question = round.questions[index];
  const answer = round.answers[index];
  const catalogId = dataId(round.catalog);

  const progress = loadProgress();
  const entry = progressEntry(progress, catalogId, question.id);
  entry.box = nextBox(entry.box, answer.rating);
  entry.last = Date.now();

  let historyToSave = null;
  if (!question.isRepeat) {
    // A guessed answer was right by luck: it counts as wrong in every statistic
    const counted = answer.isCorrect && answer.rating !== "guessed";
    countAnswer(entry, counted);
    const history = loadHistory();
    history.push({
      t: Date.now(),
      catalogId: catalogId,
      questionId: question.id,
      domain: question.domain,
      correct: counted,
      mode: "learn"
    });
    historyToSave = history;
  }

  progress[progressKey(catalogId, question.id)] = entry;
  // Returns false when the browser refused to store. Both keys are put back then, so box and statistics stay consistent.
  const snapshot = snapshotKeys([KEY_PROGRESS, KEY_HISTORY]);
  const ok = (historyToSave === null || saveHistory(historyToSave)) && saveProgress(progress);
  if (!ok) restoreKeys(snapshot);
  return ok;
}

function recordFinishedRound(round, results) {
  const rounds = loadRounds();
  rounds.push({
    t: Date.now(),
    catalogId: round.catalog.id,
    length: results.total,
    correct: results.correct,
    percent: results.percent
  });
  return saveRounds(rounds);
}

// Keeps the diagnostic result (latest only) so it can be looked at again on the Diagnostic page
function saveDiagnosticResult(catalogId, results) {
  const diagnostics = loadDiagnostics();
  const perDomain = {};
  DOMAINS.forEach(function (domain) {
    const entry = results.perDomain[domain];
    if (entry) perDomain[domain] = { correct: entry.correct, wrong: entry.wrong };
  });
  const entry = cleanDiagnostic({ t: Date.now(), perDomain: perDomain });
  if (!entry) return true; // nothing to keep
  diagnostics[catalogId] = entry;
  return saveDiagnostics(diagnostics);
}

// How many of the given questions now sit in each box
function boxDistribution(catalogId, questionIds) {
  const progress = loadProgress();
  const counts = {};
  for (let box = 1; box <= CONFIG.MAX_BOX; box++) counts[box] = 0;
  questionIds.forEach(function (id) {
    const box = progressEntry(progress, catalogId, id).box;
    if (box >= 1) counts[box]++;
  });
  return counts;
}
