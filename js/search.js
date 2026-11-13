/* Search over the study notes and the question explanations. It only reads: nothing is answered or saved.
   All words of the search text must appear (in any order, any case) in the same note or question. */
const SEARCH_MIN_LENGTH = 2;
const SEARCH_MAX_QUESTIONS = 30;

// Domain of the study note for a task statement id ("3.2" -> "D3"), or null when there is no note
function noteDomainOf(taskId) {
  const domain = "D" + String(taskId).charAt(0);
  const notes = window.LEARN && window.LEARN[domain];
  return notes && notes.topics.some(function (topic) { return topic.id === taskId; }) ? domain : null;
}

function noteText(topic) {
  return [topic.title].concat(
    topic.points,
    topic.traps.map(function (trap) { return trap.wrong + " " + trap.why; }),
    topic.current || ""
  ).join(" ");
}

function questionText(question) {
  return [question.question, question.explanation || ""].concat(
    question.options.map(function (option) { return option.explanation || ""; })
  ).join(" ");
}

// Returns null while the text is too short, else { topics, questions, moreQuestions }
function searchContent(query) {
  const words = query.toLowerCase().split(/\s+/).filter(Boolean);
  if (query.trim().length < SEARCH_MIN_LENGTH) return null;
  const matches = function (text) {
    const lower = text.toLowerCase();
    return words.every(function (word) { return lower.indexOf(word) !== -1; });
  };

  const topics = [];
  DOMAINS.forEach(function (domain) {
    const notes = window.LEARN && window.LEARN[domain];
    if (!notes) return;
    notes.topics.forEach(function (topic) {
      if (matches(noteText(topic))) topics.push({ domain: domain, id: topic.id, title: topic.title });
    });
  });

  // catalogs made from another one hold the same question objects, so they are skipped
  const questions = [];
  allCatalogs().filter(function (catalog) { return !catalog.progressId; }).forEach(function (catalog) {
    catalog.questions.forEach(function (question) {
      if (matches(questionText(question))) questions.push({ catalog: catalog, question: question });
    });
  });
  return { topics: topics, questions: questions.slice(0, SEARCH_MAX_QUESTIONS), moreQuestions: Math.max(0, questions.length - SEARCH_MAX_QUESTIONS) };
}
