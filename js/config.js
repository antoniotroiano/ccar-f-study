/* Tunable values: change them here, nothing else needs to be touched */
const CONFIG = {
  ROUND_LENGTHS: [5, 10, 15, 20],
  DEFAULT_ROUND_LENGTH: 10,
  REPEAT_WRONG_DEFAULT: false, // default of the per-catalog switch "repeat wrong questions at the end of the round"
  MAX_REPEATS: 3,            // a wrong question comes back at most this many times in one round
  NEW_QUESTION_SHARE: 0.5,   // share of a round filled with new questions (when enough exist)
  MAX_BOX: 5,
  SAFE_BOX: 4,               // a question in this box or higher counts as safe (about three Sure in a row since the last mistake)
  DIAGNOSTIC_QUESTIONS: 20,  // length of the diagnostic round (split by the exam domain weights)
  DIAGNOSTIC_MIN_PER_DOMAIN: 2, // a domain needs at least this many diagnostic answers to be named in the recommendation

  WEAK_THRESHOLD: 70,        // a domain below this rate (percent) is a weak area ...
  MIN_ANSWERS: 10,           // ... once at least this many answers exist

  LAST_ANSWERS_WINDOW: 100,  // "last N answers" for rates and the ready indicator
  READY_TARGET: 70,          // every domain needs this rate (percent) for a green light
  READY_COVERAGE: 80,        // share of the catalog (percent) that must have been answered once
  AMBER_MARGIN: 15,          // amber light: within this many points below the target

  HISTORY_LIMIT: 1000,       // stored answers
  ROUNDS_LIMIT: 200,         // stored rounds
  ROUNDS_SHOWN: 10           // rounds listed in the statistics
};

const DOMAINS = ["D1", "D2", "D3", "D4", "D5"];
// Names as in the Exam Guide v1.0, section 4 (also in data/core-domains.js)
const DOMAIN_NAMES = {
  D1: "Agentic Architecture & Orchestration",
  D2: "Tool Design & MCP Integration",
  D3: "Claude Code Configuration & Workflows",
  D4: "Prompt Engineering & Structured Output",
  D5: "Context Management & Reliability"
};
// Task statements have few questions each, so they need fewer answers than a domain before they show a rate
const TASK_MIN_ANSWERS = 3;

// again: wrong answer (automatic). After a right answer: guessed (luck, counts as wrong), unsure (right, box stays), sure (right, one box up)
const RATINGS = ["again", "guessed", "unsure", "sure"];
// Older saved rounds used hard, good and easy
const LEGACY_RATINGS = { hard: "unsure", good: "sure", easy: "sure" };

/* Exam simulation */
const EXAM = {
  QUESTIONS: 60,
  MINUTES: 120,
  // Exam Guide v1.0 (July 2026), section 4 "Exam Content Outline"
  DOMAIN_WEIGHTS: { D1: 27, D2: 18, D3: 20, D4: 20, D5: 15 },
  PASS_PERCENT: 72,          // approximation of 720 of 1000 points, the real conversion is unknown
  READY_EXAM_COUNT: 2,       // this many latest exams must reach the pass threshold for a green indicator
  MODES: ["timed", "untimed", "review"], // timed: 120 minutes, no feedback. untimed: no clock, no feedback. review: no clock, answer checked after each question
  PACE_SLOWEST: 3,           // slowest questions listed in the pace summary
  WARN_MINUTES: 10,          // timer turns to a warning below this
  RESULTS_LIMIT: 100         // stored exam results
};
