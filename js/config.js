/* Tunable values: change them here, nothing else needs to be touched */
const CONFIG = {
  ROUND_LENGTHS: [5, 10, 15, 20],
  DEFAULT_ROUND_LENGTH: 10,
  REPEAT_WRONG_DEFAULT: false, // default of the per-catalog switch "repeat wrong questions at the end of the round"
  MAX_REPEATS: 3,            // a wrong question comes back at most this many times in one round
  NEW_QUESTION_SHARE: 0.5,   // share of a round filled with new questions (when enough exist)
  MAX_BOX: 5,

  WEAK_THRESHOLD: 70,        // a domain below this rate (percent) is a weak area ...
  MIN_ANSWERS: 5,            // ... once at least this many answers exist

  LAST_ANSWERS_WINDOW: 100,  // "last N answers" for rates and the ready indicator
  READY_TARGET: 70,          // every domain needs this rate (percent) for a green light
  READY_COVERAGE: 80,        // share of the catalog (percent) that must have been answered once
  AMBER_MARGIN: 15,          // amber light: within this many points below the target

  HISTORY_LIMIT: 1000,       // stored answers
  ROUNDS_LIMIT: 200,         // stored rounds
  ROUNDS_SHOWN: 10           // rounds listed in the statistics
};

const DOMAINS = ["D1", "D2", "D3", "D4", "D5"];
const RATINGS = ["again", "hard", "good", "easy"];

/* Exam simulation */
const EXAM = {
  QUESTIONS: 60,
  MINUTES: 120,
  // Exam Guide v1.0 (July 2026), section 4 "Exam Content Outline"
  DOMAIN_WEIGHTS: { D1: 27, D2: 18, D3: 20, D4: 20, D5: 15 },
  PASS_PERCENT: 72,          // approximation of 720 of 1000 points, the real conversion is unknown
  READY_EXAM_COUNT: 2,       // this many latest exams must reach the pass threshold for a green indicator
  WARN_MINUTES: 10,          // timer turns to a warning below this
  RESULTS_LIMIT: 100         // stored exam results
};
