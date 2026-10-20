/* Boxes (Leitner): each question sits in box 1 to 5. A question never answered has no box yet. */
function nextBox(box, rating) {
  const current = box >= 1 ? box : 1;
  switch (rating) {
    case "again": return 1;
    case "hard": return current;
    case "good": return Math.min(current + 1, CONFIG.MAX_BOX);
    case "easy": return Math.min(current + 2, CONFIG.MAX_BOX);
  }
  return current;
}

/* Choosing the questions of a round.
   Priority: low boxes first, random inside a box. About half of the round is new questions
   when enough exist. If one group is too small, the other fills the gap. */
function selectRoundQuestions(catalog, domainFilter, length, progress) {
  const pool = catalog.questions.filter(function (question) {
    return domainFilter === "all" || question.domain === domainFilter;
  });
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

/* Practice my mistakes: the questions that sit in box 1, which means answered wrong or rated Hard.
   A question leaves box 1 when it is answered right and rated Good or Easy. */
function mistakePool(catalog, domainFilter, progress) {
  return catalog.questions.filter(function (question) {
    return (domainFilter === "all" || question.domain === domainFilter) &&
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
    return domainFilter === "all" || question.domain === domainFilter;
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

  if (!question.isRepeat) {
    if (answer.isCorrect) entry.right++; else entry.wrong++;
    const history = loadHistory();
    history.push({
      t: Date.now(),
      catalogId: catalogId,
      questionId: question.id,
      domain: question.domain,
      correct: answer.isCorrect,
      mode: "learn"
    });
    saveHistory(history);
  }

  progress[progressKey(catalogId, question.id)] = entry;
  saveProgress(progress);
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
  saveRounds(rounds);
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
