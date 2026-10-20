/* Shuffling */
function shuffle(items) {
  const copy = items.slice();
  for (let i = copy.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [copy[i], copy[j]] = [copy[j], copy[i]];
  }
  return copy;
}

/* Building a round.
   Each option keeps its explanation, correctness and original index, so mixing
   never breaks the mapping and a paused round can restore the exact order. */
// repeatNumber: 0 for a normal question, 1 to MAX_REPEATS for the repeats of a wrong question
function buildQuestion(question, optionOrder, repeatNumber) {
  const options = optionOrder.map(function (originalIndex) {
    return {
      originalIndex: originalIndex,
      text: question.options[originalIndex],
      explanation: question.optionExplanations[originalIndex],
      isCorrect: question.correct.indexOf(originalIndex) !== -1
    };
  });
  return {
    id: question.id,
    domain: question.domain,
    question: question.question,
    source: question.source,
    explanation: typeof question.explanation === "string" ? question.explanation : null,
    docs: Array.isArray(question.docs) ? question.docs : [],
    scenario: typeof question.scenario === "string" ? question.scenario : null,
    options: options,
    isRepeat: repeatNumber > 0,
    repeatNumber: repeatNumber > 0 ? repeatNumber : 0
  };
}

function shuffledOrder(question) {
  return shuffle(question.options.map(function (_, index) { return index; }));
}

// sourceQuestions: the catalog questions chosen for this round (see selectRoundQuestions)
// mode: "mixed" (the normal choice of questions) or "mistakes" (only questions from box 1)
function createRound(catalog, sourceQuestions, domainFilter, requestedLength, repeatWrong, mode) {
  return {
    catalog: catalog,
    questions: shuffle(sourceQuestions).map(function (question) {
      return buildQuestion(question, shuffledOrder(question), 0);
    }),
    answers: [],
    currentIndex: 0,
    domainFilter: domainFilter,
    requestedLength: requestedLength,
    repeatWrong: Boolean(repeatWrong),
    mode: mode === "mistakes" ? "mistakes" : "mixed"
  };
}

/* Selections. A question with more than one correct option is a multiple-response
   question ("Select N"). Scoring is all-or-nothing: the chosen set must equal the correct set
   (the Exam Guide does not say how these items are weighted, so no partial credit is given). */
function requiredSelections(question) {
  return question.options.filter(function (option) { return option.isCorrect; }).length;
}

function isMultipleResponse(question) {
  return requiredSelections(question) > 1;
}

function isSelectionCorrect(question, selected) {
  return selected.length === requiredSelections(question) && selected.every(function (index) {
    return question.options[index].isCorrect;
  });
}

// Adds or removes an option. A single-choice question replaces the selection,
// a multiple-response question ignores a new option once N are selected.
function toggleSelection(question, selected, optionIndex) {
  const required = requiredSelections(question);
  if (required <= 1) return [optionIndex];
  if (selected.indexOf(optionIndex) !== -1) {
    return selected.filter(function (index) { return index !== optionIndex; });
  }
  return selected.length < required ? selected.concat([optionIndex]) : selected;
}

// Saved selection: a list of option indexes (older saves stored one index).
// Returns null for "nothing chosen" and undefined when the data is damaged.
function readSavedSelection(value, optionCount) {
  if (value === null || value === undefined) return null;
  const list = Number.isInteger(value) ? [value] : value;
  if (!Array.isArray(list)) return undefined;
  const isValid = list.every(function (index, position) {
    return Number.isInteger(index) && index >= 0 && index < optionCount && list.indexOf(index) === position;
  });
  if (!isValid) return undefined;
  return list.length === 0 ? null : list.slice();
}

/* Answering, rating and navigation.
   A wrong answer is rated "again" automatically. A correct answer waits for the rating. */
function submitAnswer(round, questionIndex, selected) {
  const isCorrect = isSelectionCorrect(round.questions[questionIndex], selected);
  round.answers[questionIndex] = {
    selected: selected.slice(),
    isCorrect: isCorrect,
    rating: isCorrect ? null : "again"
  };
}

function rateAnswer(round, questionIndex, rating) {
  round.answers[questionIndex].rating = rating;
}

function isAnswered(round, questionIndex) {
  return round.answers[questionIndex] !== undefined;
}

function isCompleted(round, questionIndex) {
  return isAnswered(round, questionIndex) && Boolean(round.answers[questionIndex].rating);
}

function needsRating(round, questionIndex) {
  return isAnswered(round, questionIndex) && !round.answers[questionIndex].rating;
}

// The first question that is not finished yet: the furthest one the learner can open
function firstOpenIndex(round) {
  const index = round.questions.findIndex(function (_, position) { return !isCompleted(round, position); });
  return index === -1 ? round.questions.length - 1 : index;
}

function countCompleted(round) {
  return round.questions.filter(function (_, index) { return isCompleted(round, index); }).length;
}

function roundLength(round) {
  return round.questions.filter(function (question) { return !question.isRepeat; }).length;
}

// With the repeat switch on, a wrongly answered question comes back at the end of the round, up to MAX_REPEATS times.
function shouldRepeat(round, questionIndex) {
  return round.repeatWrong && round.questions[questionIndex].repeatNumber < CONFIG.MAX_REPEATS;
}

function addRepeat(round, questionIndex) {
  const id = round.questions[questionIndex].id;
  const source = round.catalog.questions.find(function (question) { return question.id === id; });
  round.questions.push(buildQuestion(source, shuffledOrder(source), round.questions[questionIndex].repeatNumber + 1));
}

/* Saving and restoring (plain data, safe for JSON) */
function serializeRound(round) {
  return {
    catalogId: round.catalog.id,
    currentIndex: round.currentIndex,
    domainFilter: round.domainFilter,
    requestedLength: round.requestedLength,
    repeatWrong: round.repeatWrong,
    mode: round.mode,
    questions: round.questions.map(function (question, index) {
      const answer = round.answers[index];
      return {
        id: question.id,
        repeat: question.repeatNumber,
        optionOrder: question.options.map(function (option) { return option.originalIndex; }),
        answer: answer ? answer.selected : null,
        rating: answer ? answer.rating : null
      };
    })
  };
}

// Returns null when the saved data does not match the catalog (for example after the catalog changed).
function restoreRound(catalog, saved) {
  if (!saved || !Array.isArray(saved.questions) || saved.questions.length === 0) return null;
  const round = {
    catalog: catalog,
    questions: [],
    answers: [],
    currentIndex: 0,
    domainFilter: typeof saved.domainFilter === "string" ? saved.domainFilter : "all",
    requestedLength: Number(saved.requestedLength) || saved.questions.length,
    repeatWrong: saved.repeatWrong === true,
    mode: saved.mode === "mistakes" ? "mistakes" : "mixed"
  };

  for (let index = 0; index < saved.questions.length; index++) {
    const entry = saved.questions[index];
    const source = catalog.questions.find(function (question) { return question.id === entry.id; });
    if (!source || !Array.isArray(entry.optionOrder) || entry.optionOrder.length !== source.options.length) {
      return null;
    }
    const sortedOrder = entry.optionOrder.slice().sort(function (a, b) { return a - b; });
    if (!sortedOrder.every(function (value, position) { return value === position; })) return null;

    // older saves stored isRepeat: true instead of a repeat number
    const repeatNumber = Number.isInteger(entry.repeat) ? entry.repeat : (entry.isRepeat ? 1 : 0);
    round.questions.push(buildQuestion(source, entry.optionOrder, repeatNumber));
    const selected = readSavedSelection(entry.answer, source.options.length);
    if (selected === undefined) return null;
    if (selected !== null) {
      if (selected.length !== requiredSelections(round.questions[index])) return null;
      submitAnswer(round, index, selected);
      if (entry.rating !== null && RATINGS.indexOf(entry.rating) === -1) return null;
      round.answers[index].rating = entry.rating;
    }
  }

  const index = Number.isInteger(saved.currentIndex) ? saved.currentIndex : 0;
  round.currentIndex = Math.min(Math.max(index, 0), round.questions.length - 1);
  return round;
}

/* Results (repeats are practice only and never count) */
function percent(correct, total) {
  return total === 0 ? 0 : Math.round((correct / total) * 100);
}

function calculateResults(round) {
  const perDomain = {};
  const wrongQuestions = [];
  const ratingCounts = { again: 0, hard: 0, good: 0, easy: 0 };
  const questionIds = [];
  let correctCount = 0;

  round.questions.forEach(function (question, index) {
    if (question.isRepeat) return;
    const answer = round.answers[index];
    questionIds.push(question.id);
    ratingCounts[answer.rating]++;
    if (!perDomain[question.domain]) perDomain[question.domain] = { correct: 0, wrong: 0 };

    if (answer.isCorrect) {
      correctCount++;
      perDomain[question.domain].correct++;
    } else {
      perDomain[question.domain].wrong++;
      wrongQuestions.push({ question: question, selected: answer.selected });
    }
  });

  const total = questionIds.length;
  return {
    total: total,
    correct: correctCount,
    wrong: total - correctCount,
    percent: percent(correctCount, total),
    perDomain: perDomain,
    wrongQuestions: wrongQuestions,
    ratingCounts: ratingCounts,
    questionIds: questionIds
  };
}
