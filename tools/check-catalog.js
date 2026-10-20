/* Catalog check: structure of every question, and every source.quote must appear verbatim in the Exam Guide text.
   Usage: node tools/check-catalog.js <catalog file or folder> … [--guide docs/official/CCAR-F-Exam-Guide.txt]
   A folder is loaded like index.html loads it: catalog.js first, then the other .js files in name order. */
const fs = require("fs");
const path = require("path");
const vm = require("vm");

const args = process.argv.slice(2);
const guideFlag = args.indexOf("--guide");
const guidePath = guideFlag === -1 ? "docs/official/CCAR-F-Exam-Guide.txt" : args.splice(guideFlag, 2)[1];
if (args.length === 0) {
  console.error("Usage: node tools/check-catalog.js <catalog file or folder> … [--guide guide.txt]");
  process.exit(2);
}

function filesToLoad(target) {
  if (!fs.statSync(target).isDirectory()) return [target];
  const names = fs.readdirSync(target).filter(function (name) { return name.endsWith(".js"); }).sort();
  const ordered = names.filter(function (name) { return name === "catalog.js"; })
    .concat(names.filter(function (name) { return name !== "catalog.js"; }));
  return ordered.map(function (name) { return path.join(target, name); });
}

/* Text normalization: PDF ligatures, page markers, line breaks and hyphenated line ends */
function normalize(text) {
  return text
    .replace(/ﬀ/g, "ff").replace(/ﬁ/g, "fi").replace(/ﬂ/g, "fl")
    .replace(/ﬃ/g, "ffi").replace(/ﬄ/g, "ffl")
    .replace(/[“”]/g, "\"").replace(/[‘’]/g, "'")
    .replace(/Claude Certification Program Exam guide/g, " ")
    .replace(/===== PAGE \d+ =====/g, " ")
    .replace(/-\s*\n\s*/g, "-")
    .replace(/\s+/g, " ")
    .trim();
}

/* Loading the catalog the same way the browser does */
const sandbox = { window: {} };
vm.createContext(sandbox);
args.forEach(function (target) {
  filesToLoad(target).forEach(function (file) { vm.runInContext(fs.readFileSync(file, "utf8"), sandbox, { filename: file }); });
});
const catalogs = sandbox.window.CATALOGS || [];
const guide = normalize(fs.readFileSync(guidePath, "utf8"));

/* Options of the guide's 12 sample questions (section 9), for the copy check */
function sampleContentWords(text) {
  return Array.from(new Set(normalize(text).toLowerCase().split(/[^a-z0-9_]+/).filter(function (word) { return word.length >= 5; })));
}
const rawGuide = fs.readFileSync(guidePath, "utf8");
const sampleSection = rawGuide.slice(rawGuide.indexOf("9. Sample Questions"), rawGuide.indexOf("10. How the Exam Is Scored"));
const sampleOptions = [];
sampleSection.split(/\n(?=[A-D]\.)|Correct Answer:/).forEach(function (chunk) {
  const match = /^([A-D])\.([\s\S]*)/.exec(chunk.trim());
  if (!match) return;
  const text = normalize(match[2].split(/\n(?=Question \d|Scenario:)/)[0]);
  sampleOptions.push({ text: text, words: new Set(sampleContentWords(text)) });
});

/* Cached product docs (docs/official/docs-cache), for verbatim checks of docs quotes */
const docsCacheDir = path.join(path.dirname(guidePath), "docs-cache");
const docsIndex = fs.existsSync(path.join(docsCacheDir, "index.json"))
  ? JSON.parse(fs.readFileSync(path.join(docsCacheDir, "index.json"), "utf8")) : {};
const docsText = {};
function normalizeMarkdown(text) {
  return normalize(text
    .replace(/\[([^\]]*)\]\([^)]*\)/g, "$1")  // [text](link) -> text
    .replace(/[`*]/g, "")                      // code ticks and emphasis
    .replace(/^\s*>\s?/gm, "")                // block quotes
    .replace(/^\s*[-+]\s+/gm, ""));            // list bullets
}
function cachedDoc(url) {
  if (!docsIndex[url]) return null;
  if (!docsText[url]) docsText[url] = normalizeMarkdown(fs.readFileSync(path.join(docsCacheDir, docsIndex[url].file), "utf8"));
  return docsText[url];
}

const MIN_PER_TOPIC = 4; // target: every task statement and objective has at least this many questions
const problems = [];
const warnings = [];
const seenIds = {};
const perDomain = {};
let questionCount = 0;
let shortQuestions = 0;
let withDocs = 0;

catalogs.forEach(function (catalog) {
  const scenarioIds = (catalog.scenarios || []).map(function (scenario) { return scenario.id; });

  catalog.questions.forEach(function (question) {
    questionCount++;
    const where = catalog.id + "/" + question.id;
    const fail = function (message) { problems.push(where + ": " + message); };

    if (seenIds[question.id]) fail("duplicate id");
    seenIds[question.id] = true;
    if (!/^D[1-5]$/.test(question.domain)) fail("domain must be D1–D5");
    perDomain[question.domain] = (perDomain[question.domain] || 0) + 1;
    if (question.scenario && scenarioIds.indexOf(question.scenario) === -1) fail("unknown scenario " + question.scenario);

    const optionCount = question.options.length;
    if (question.correct.length === 1 && optionCount !== 4) fail("single choice needs 4 options, has " + optionCount);
    if (question.correct.length > 1 && !/\(Select \d\)/.test(question.question)) fail("multiple response question must say (Select N)");
    if (question.optionExplanations.length !== optionCount) fail("one explanation per option needed");
    question.correct.forEach(function (index) {
      if (!Number.isInteger(index) || index < 0 || index >= optionCount) fail("correct index out of range: " + index);
    });
    // The app labels answers itself, so explanations must not repeat "Correct:" or "Wrong:".
    question.optionExplanations.forEach(function (explanation, index) {
      if (/^(Correct|Wrong)\b/.test(explanation)) fail("explanation " + index + " should not start with Correct/Wrong");
    });

    // Exam length: the guide's sample questions average about 54 words per question and 18 per option.
    const words = function (text) { return text.trim().split(/\s+/).length; };
    const stemWords = words(question.question);
    const optionWords = question.options.map(words);
    const averageOptionWords = optionWords.reduce(function (sum, value) { return sum + value; }, 0) / optionWords.length;
    // Short items (like sample Q4) are allowed, but only as a minority of the catalog.
    const isShort = stemWords < 40;
    if (isShort) shortQuestions++;
    if (!isShort && averageOptionWords < 12) warnings.push(where + ": options average " + averageOptionWords.toFixed(1) + " words (exam style: about 15–25)");

    // "Why X is correct": one explanation per question, between the sample answers' length and a one-liner
    if (typeof question.explanation !== "string" || !question.explanation.trim()) {
      fail("explanation (why the correct answer is right) is required");
    } else {
      // A trailing "Note: …" about differences to the current docs is intentional and not counted
      const mainPart = question.explanation.split(/ Note: /)[0];
      if (words(mainPart) < 40 || words(mainPart) > 100) {
        warnings.push(where + ": explanation has " + words(mainPart) + " words (target 40–100)");
      }
    }

    // Rule 8: the correct option should be phrased in scenario terms, not echo the guide's wording.
    if (question.source && question.source.quote) {
      const contentWords = function (text) {
        return normalize(text).toLowerCase().split(/[^a-z0-9_]+/).filter(function (word) { return word.length >= 5; });
      };
      const quoteWords = Array.from(new Set(contentWords(question.source.quote)));
      question.correct.forEach(function (index) {
        const optionWords = new Set(contentWords(question.options[index]));
        const shared = quoteWords.filter(function (word) { return optionWords.has(word); });
        if (quoteWords.length >= 4 && shared.length / quoteWords.length > 0.34) {
          warnings.push(where + ": correct option echoes the guide quote (" + shared.join(", ") + ")");
        }
      });
    }

    // Do not copy options from the guide's sample questions (section 9).
    question.options.forEach(function (option, index) {
      const words = sampleContentWords(option);
      if (words.length < 5) return;
      sampleOptions.forEach(function (sample) {
        const shared = words.filter(function (word) { return sample.words.has(word); });
        if (shared.length / words.length > 0.5) {
          warnings.push(where + ": option " + index + " resembles a sample-question option (\"" + sample.text.slice(0, 60) + "…\")");
        }
      });
    });

    // Surface cue: the correct option should not stand out as clearly the longest.
    if (question.correct.length === 1) {
      const lengths = question.options.map(function (option) { return option.length; });
      const correctLength = lengths[question.correct[0]];
      const longestOther = Math.max.apply(null, lengths.filter(function (_, index) { return index !== question.correct[0]; }));
      if (correctLength > longestOther * 1.25) warnings.push(where + ": correct option is clearly the longest");
    }

    // Supporting product docs: optional, but every quote must be verbatim in the cached page
    (question.docs || []).forEach(function (doc, index) {
      if (!doc || !doc.url || !doc.label || !doc.quote) {
        fail("docs entry " + index + " needs label, url and quote");
        return;
      }
      const text = cachedDoc(doc.url);
      if (text === null) fail("docs entry " + index + ": page not in docs-cache/index.json: " + doc.url);
      else if (text.indexOf(normalizeMarkdown(doc.quote)) === -1) fail("docs entry " + index + ": quote not found verbatim in " + doc.url + ": \"" + doc.quote + "\"");
    });
    if ((question.docs || []).length) withDocs++;

    if (!question.source || !question.source.url || !question.source.label) {
      fail("source with label and url is required");
    } else if (!question.source.quote) {
      fail("source.quote is required");
    } else if (guide.indexOf(normalize(question.source.quote)) === -1) {
      fail("quote not found verbatim in the Exam Guide: \"" + question.source.quote + "\"");
    }
  });
});

// Coverage of the score-report objectives (docs/exam-objectives.json), if questions are tagged
const objectivesPath = path.join(path.dirname(guidePath), "..", "exam-objectives.json");
if (fs.existsSync(objectivesPath)) {
  const objectives = JSON.parse(fs.readFileSync(objectivesPath, "utf8")).objectives;
  const counts = {};
  catalogs.forEach(function (catalog) {
    catalog.questions.forEach(function (question) {
      (question.objectives || []).forEach(function (id) {
        if (!objectives.some(function (objective) { return objective.id === id; })) problems.push(catalog.id + "/" + question.id + ": unknown objective " + id);
        counts[id] = (counts[id] || 0) + 1;
      });
    });
  });
  console.log("Questions per objective: " + objectives.map(function (objective) {
    return objective.id + ":" + (counts[objective.id] || 0);
  }).join(" "));
  const thinObjectives = objectives.filter(function (objective) { return (counts[objective.id] || 0) < MIN_PER_TOPIC; });
  console.log("Objectives below " + MIN_PER_TOPIC + " questions (" + thinObjectives.length + "): " +
    thinObjectives.map(function (objective) { return objective.id; }).join(" "));
}

// Coverage of the Exam Guide task statements (from each question's source label)
const statements = (guide.match(/Task Statement \d\.\d+/g) || []).map(function (match) { return match.replace("Task Statement ", ""); })
  .filter(function (value, index, list) { return list.indexOf(value) === index; });
const perStatement = {};
catalogs.forEach(function (catalog) {
  catalog.questions.forEach(function (question) {
    const match = question.source && /Task Statement (\d\.\d+)/.exec(question.source.label);
    if (match) perStatement[match[1]] = (perStatement[match[1]] || 0) + 1;
  });
});
const thinStatements = statements.filter(function (id) { return (perStatement[id] || 0) < MIN_PER_TOPIC; });
console.log("Task statements below " + MIN_PER_TOPIC + " questions (" + thinStatements.length + " of " + statements.length + "): " +
  thinStatements.map(function (id) { return id + ":" + (perStatement[id] || 0); }).join(" "));

const shortShare = questionCount ? shortQuestions / questionCount : 0;
if (shortShare > 0.2) warnings.push("catalog: " + shortQuestions + " short questions (" + Math.round(shortShare * 100) + "%), target at most about 20%");
console.log(questionCount + " questions checked. Per domain: " + JSON.stringify(perDomain) + ". Short questions: " + shortQuestions + ". With docs sources: " + withDocs + ".");
warnings.forEach(function (warning) { console.log("  warning: " + warning); });
if (problems.length) {
  console.log(problems.length + " problem(s):");
  problems.forEach(function (problem) { console.log("  - " + problem); });
  process.exit(1);
}
console.log("All checks passed.");
