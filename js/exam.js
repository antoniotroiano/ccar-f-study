/* Question distribution: largest-remainder rounding so the quotas always add up to EXAM.QUESTIONS */
function examQuotas() {
  const weightSum = DOMAINS.reduce(function (sum, domain) { return sum + (EXAM.DOMAIN_WEIGHTS[domain] || 0); }, 0);
  const quotas = {};
  const remainders = [];
  let assigned = 0;

  DOMAINS.forEach(function (domain) {
    const exact = ((EXAM.DOMAIN_WEIGHTS[domain] || 0) / weightSum) * EXAM.QUESTIONS;
    quotas[domain] = Math.floor(exact);
    assigned += quotas[domain];
    remainders.push({ domain: domain, fraction: exact - quotas[domain] });
  });

  remainders.sort(function (a, b) { return b.fraction - a.fraction; });
  for (let i = 0; assigned < EXAM.QUESTIONS; i++, assigned++) {
    quotas[remainders[i % remainders.length].domain]++;
  }
  return quotas;
}

// The exam can only start when every domain has at least its quota of questions.
function examAvailability(catalog) {
  const quotas = examQuotas();
  const shortages = DOMAINS.filter(function (domain) {
    return catalog.questions.filter(function (question) { return question.domain === domain; }).length < quotas[domain];
  }).map(function (domain) {
    const have = catalog.questions.filter(function (question) { return question.domain === domain; }).length;
    return domain + " needs " + quotas[domain] + ", has " + have;
  });
  return { isAvailable: shortages.length === 0, shortages: shortages, total: catalog.questions.length };
}

function selectExamQuestions(catalog) {
  const quotas = examQuotas();
  let chosen = [];
  DOMAINS.forEach(function (domain) {
    const inDomain = catalog.questions.filter(function (question) { return question.domain === domain; });
    chosen = chosen.concat(shuffle(inDomain).slice(0, quotas[domain]));
  });
  return groupByScenario(shuffle(chosen));
}

// Questions of the same scenario follow each other (order of scenarios stays random).
function groupByScenario(questions) {
  const order = [];
  questions.forEach(function (question) {
    const key = question.scenario || "";
    if (order.indexOf(key) === -1) order.push(key);
  });
  return questions.slice().sort(function (a, b) {
    return order.indexOf(a.scenario || "") - order.indexOf(b.scenario || "");
  });
}

function firstUnansweredIndex(exam) {
  const index = exam.questions.findIndex(function (_, questionIndex) { return !isExamAnswered(exam, questionIndex); });
  return index === -1 ? exam.questions.length : index;
}

/* Exam state. answers[i] is the list of chosen option indexes or null.
   A multiple-response question counts as answered only once all N options are selected. */
function createExam(catalog, now) {
  const questions = selectExamQuestions(catalog).map(function (question) {
    return buildQuestion(question, shuffledOrder(question), false);
  });
  return {
    catalog: catalog,
    questions: questions,
    answers: questions.map(function () { return null; }),
    marked: questions.map(function () { return false; }),
    currentIndex: 0,
    startedAt: now,
    endTime: now + EXAM.MINUTES * 60000,
    pausedAt: null // time when the exam was paused; the timer stands still while this is set
  };
}

function examRemainingMs(exam, now) {
  return exam.endTime - (exam.pausedAt === null ? now : exam.pausedAt);
}

// Pausing is a convenience of this app: the real exam cannot be paused.
function pauseExam(exam, now) {
  if (exam.pausedAt === null) exam.pausedAt = now;
}

// The paused time is shifted out of the start and end time, so the time left stays the same.
function resumePausedExam(exam, now) {
  if (exam.pausedAt === null) return;
  const pausedFor = now - exam.pausedAt;
  exam.startedAt += pausedFor;
  exam.endTime += pausedFor;
  exam.pausedAt = null;
}

function isExamAnswered(exam, index) {
  const answer = exam.answers[index];
  return answer !== null && answer.length === requiredSelections(exam.questions[index]);
}

function selectExamOption(exam, optionIndex) {
  const index = exam.currentIndex;
  const selected = toggleSelection(exam.questions[index], exam.answers[index] || [], optionIndex);
  exam.answers[index] = selected.length > 0 ? selected : null;
}

function countExamAnswered(exam) {
  return exam.questions.filter(function (_, index) { return isExamAnswered(exam, index); }).length;
}

function countExamMarked(exam) {
  return exam.marked.filter(Boolean).length;
}

/* Saving and restoring */
function serializeExam(exam) {
  return {
    catalogId: exam.catalog.id,
    startedAt: exam.startedAt,
    endTime: exam.endTime,
    pausedAt: exam.pausedAt,
    currentIndex: exam.currentIndex,
    questions: exam.questions.map(function (question, index) {
      return {
        id: question.id,
        optionOrder: question.options.map(function (option) { return option.originalIndex; }),
        answer: exam.answers[index],
        marked: exam.marked[index]
      };
    })
  };
}

// Returns null when the saved data does not match the catalog or is damaged.
function restoreExam(catalog, saved) {
  if (!saved || !Array.isArray(saved.questions) || saved.questions.length === 0) return null;
  if (!Number.isFinite(saved.endTime) || !Number.isFinite(saved.startedAt)) return null;

  const exam = {
    catalog: catalog,
    questions: [],
    answers: [],
    marked: [],
    currentIndex: 0,
    startedAt: saved.startedAt,
    endTime: saved.endTime,
    pausedAt: Number.isFinite(saved.pausedAt) ? saved.pausedAt : null
  };

  for (let index = 0; index < saved.questions.length; index++) {
    const entry = saved.questions[index];
    const source = catalog.questions.find(function (question) { return question.id === entry.id; });
    if (!source || !Array.isArray(entry.optionOrder) || entry.optionOrder.length !== source.options.length) return null;
    const sortedOrder = entry.optionOrder.slice().sort(function (a, b) { return a - b; });
    if (!sortedOrder.every(function (value, position) { return value === position; })) return null;
    const selected = readSavedSelection(entry.answer, source.options.length);
    if (selected === undefined) return null;

    const question = buildQuestion(source, entry.optionOrder, false);
    if (selected !== null && selected.length > requiredSelections(question)) return null;
    exam.questions.push(question);
    exam.answers.push(selected);
    exam.marked.push(entry.marked === true);
  }

  const index = Number.isInteger(saved.currentIndex) ? saved.currentIndex : 0;
  exam.currentIndex = Math.min(Math.max(index, 0), exam.questions.length - 1);
  return exam;
}

/* Scoring: unanswered (or incompletely answered) questions count as wrong */
function scoreExam(exam, timedOut, now) {
  const perDomain = {};
  const wrongQuestions = [];
  let correct = 0;
  let unanswered = 0;

  exam.questions.forEach(function (question, index) {
    const answer = exam.answers[index];
    if (!perDomain[question.domain]) perDomain[question.domain] = { correct: 0, total: 0 };
    perDomain[question.domain].total++;

    const isAnswered = isExamAnswered(exam, index);
    if (!isAnswered) unanswered++;
    if (isAnswered && isSelectionCorrect(question, answer)) {
      correct++;
      perDomain[question.domain].correct++;
    } else {
      wrongQuestions.push({ question: question, selected: answer });
    }
  });

  const total = exam.questions.length;
  const finishedAt = Math.min(now, exam.endTime);
  return {
    total: total,
    correct: correct,
    wrong: total - correct,
    unanswered: unanswered,
    percent: percent(correct, total),
    isAbovePass: percent(correct, total) >= EXAM.PASS_PERCENT,
    perDomain: perDomain,
    wrongQuestions: wrongQuestions,
    timedOut: timedOut,
    durationSeconds: Math.max(0, Math.round((finishedAt - exam.startedAt) / 1000))
  };
}

/* Tracking: a wrong answer puts the question into box 1, a right answer leaves the box as it is.
   Unanswered or incompletely answered questions are not tracked (no full answer was given). */
function applyExamTracking(exam, now) {
  const catalogId = dataId(exam.catalog);
  const progress = loadProgress();
  const history = loadHistory();

  exam.questions.forEach(function (question, index) {
    if (!isExamAnswered(exam, index)) return;
    const isCorrect = isSelectionCorrect(question, exam.answers[index]);
    const entry = progressEntry(progress, catalogId, question.id);

    if (isCorrect) {
      entry.right++;
    } else {
      entry.wrong++;
      entry.box = 1;
    }
    entry.last = now;
    progress[progressKey(catalogId, question.id)] = entry;
    history.push({ t: now, catalogId: catalogId, questionId: question.id, domain: question.domain, correct: isCorrect, mode: "exam" });
  });

  saveProgress(progress);
  saveHistory(history);
}

function recordExamResult(exam, score, now) {
  const perDomain = {};
  Object.keys(score.perDomain).forEach(function (domain) {
    perDomain[domain] = { correct: score.perDomain[domain].correct, total: score.perDomain[domain].total };
  });
  const results = loadExamResults();
  results.push({
    t: now,
    catalogId: exam.catalog.id,
    total: score.total,
    correct: score.correct,
    percent: score.percent,
    perDomain: perDomain,
    timedOut: score.timedOut,
    durationSeconds: score.durationSeconds
  });
  saveExamResults(results);
}
