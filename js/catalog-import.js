/* Checking a catalog file (JSON) before it is imported.
   Pure functions without DOM access, so the same file also runs in Node (tools/validate-catalog.js).
   validateCatalogJson(data, takenIds) returns { catalog, errors, warnings }.
   catalog is a clean copy that contains only known fields, or null when there are errors. */
const IMPORT_LIMITS = {
  MAX_FILE_BYTES: 3 * 1024 * 1024,
  MAX_QUESTIONS: 1000,
  MAX_OPTIONS: 6,
  MAX_SELECT: 3,
  MAX_DOCS: 5,
  TITLE: 120,
  DESCRIPTION: 500,
  QUESTION: 3000,
  OPTION: 1000,
  EXPLANATION: 3000,
  LABEL: 200,
  QUOTE: 1000,
  URL: 500
};

const IMPORT_DOMAINS = ["D1", "D2", "D3", "D4", "D5"];

function isImportObject(value) {
  return value !== null && typeof value === "object" && !Array.isArray(value);
}

function isImportId(value) {
  return typeof value === "string" && /^[A-Za-z0-9][A-Za-z0-9_-]{0,63}$/.test(value);
}

function isHttpUrl(value) {
  return typeof value === "string" && value.length <= IMPORT_LIMITS.URL && /^https?:\/\/[^\s<>"']+$/i.test(value);
}

// Text field: returns the trimmed text, or null when it is missing; pushes an error when it has the wrong type or is too long.
function readText(value, label, maxLength, required, errors) {
  if (value === undefined || value === null || value === "") {
    if (required) errors.push(label + " is missing.");
    return null;
  }
  if (typeof value !== "string") {
    errors.push(label + " must be text.");
    return null;
  }
  const text = value.trim();
  if (text.length > maxLength) {
    errors.push(label + " is too long (" + text.length + " characters, at most " + maxLength + ").");
    return null;
  }
  if (required && text === "") errors.push(label + " is empty.");
  return text;
}

// A source or docs entry: { label, url?, quote? }
function readSourceEntry(value, label, errors, warnings) {
  if (!isImportObject(value)) {
    errors.push(label + " must be an object with label, url and quote.");
    return null;
  }
  const entry = { label: readText(value.label, label + ".label", IMPORT_LIMITS.LABEL, true, errors) };
  const quote = readText(value.quote, label + ".quote", IMPORT_LIMITS.QUOTE, false, errors);
  if (quote) entry.quote = quote;
  if (value.url !== undefined && value.url !== null && value.url !== "") {
    if (isHttpUrl(value.url)) {
      entry.url = value.url;
    } else {
      warnings.push(label + ".url was left out: only links starting with http:// or https:// are accepted.");
    }
  }
  return entry.label === null ? null : entry;
}

function readQuestion(raw, position, scenarioIds, errors, warnings) {
  const name = "Question " + (position + 1) + (isImportObject(raw) && typeof raw.id === "string" ? " (" + raw.id + ")" : "");
  const problems = [];
  const fail = function (message) { problems.push(name + ": " + message); };
  const sub = [];
  const sourceWarnings = [];

  if (!isImportObject(raw)) {
    errors.push(name + ": must be an object.");
    return null;
  }

  if (!isImportId(raw.id)) fail("id is missing or has characters other than letters, digits, - and _ (at most 64).");
  if (IMPORT_DOMAINS.indexOf(raw.domain) === -1) fail("domain must be one of " + IMPORT_DOMAINS.join(", ") + ".");
  const questionText = readText(raw.question, "question", IMPORT_LIMITS.QUESTION, true, sub);

  let options = null;
  if (!Array.isArray(raw.options) || raw.options.length < 2 || raw.options.length > IMPORT_LIMITS.MAX_OPTIONS) {
    fail("options must be a list of 2 to " + IMPORT_LIMITS.MAX_OPTIONS + " texts.");
  } else {
    options = raw.options.map(function (option, index) {
      return readText(option, "options[" + index + "]", IMPORT_LIMITS.OPTION, true, sub);
    });
    if (options.some(function (option) { return option === null || option === ""; })) options = null;
  }

  let correct = null;
  if (!Array.isArray(raw.correct) || raw.correct.length < 1 || raw.correct.length > IMPORT_LIMITS.MAX_SELECT) {
    fail("correct must be a list of 1 to " + IMPORT_LIMITS.MAX_SELECT + " option positions, counted from 0 (for example [2]).");
  } else if (options) {
    const valid = raw.correct.every(function (index, at) {
      return Number.isInteger(index) && index >= 0 && index < options.length && raw.correct.indexOf(index) === at;
    });
    if (!valid) {
      fail("correct contains a position that does not exist or appears twice (there are " + options.length + " options, positions 0 to " + (options.length - 1) + ").");
    } else if (raw.correct.length >= options.length) {
      fail("correct lists every option, so no wrong option is left.");
    } else {
      correct = raw.correct.slice();
    }
  }

  const explanation = readText(raw.explanation, "explanation", IMPORT_LIMITS.EXPLANATION, false, sub);

  // optionExplanations is optional, but when present it must match the options one to one
  let optionExplanations = null;
  if (raw.optionExplanations !== undefined && raw.optionExplanations !== null) {
    if (!Array.isArray(raw.optionExplanations) || (options && raw.optionExplanations.length !== options.length)) {
      fail("optionExplanations must have one text per option, in the same order.");
    } else {
      optionExplanations = raw.optionExplanations.map(function (text, index) {
        return readText(text, "optionExplanations[" + index + "]", IMPORT_LIMITS.EXPLANATION, false, sub) || "";
      });
    }
  }

  let source = null;
  if (raw.source !== undefined && raw.source !== null) source = readSourceEntry(raw.source, "source", sub, sourceWarnings);
  let docs = [];
  if (raw.docs !== undefined && raw.docs !== null) {
    if (!Array.isArray(raw.docs) || raw.docs.length > IMPORT_LIMITS.MAX_DOCS) {
      fail("docs must be a list of at most " + IMPORT_LIMITS.MAX_DOCS + " entries.");
    } else {
      docs = raw.docs.map(function (entry, index) {
        return readSourceEntry(entry, "docs[" + index + "]", sub, sourceWarnings);
      }).filter(Boolean);
    }
  }
  sourceWarnings.forEach(function (message) { warnings.push(name + ": " + message); });

  let scenario = null;
  if (raw.scenario !== undefined && raw.scenario !== null && raw.scenario !== "") {
    if (typeof raw.scenario === "string" && scenarioIds.indexOf(raw.scenario) !== -1) {
      scenario = raw.scenario;
    } else {
      warnings.push(name + ": scenario \"" + raw.scenario + "\" is not listed in the catalog's scenarios and was ignored.");
    }
  }

  sub.forEach(function (message) { problems.push(name + ": " + message); });
  if (problems.length) {
    problems.forEach(function (message) { errors.push(message); });
    return null;
  }

  const question = {
    id: raw.id,
    domain: raw.domain,
    question: questionText,
    options: options,
    correct: correct,
    optionExplanations: optionExplanations || options.map(function () { return ""; }),
    docs: docs
  };
  if (explanation) question.explanation = explanation;
  if (source) question.source = source;
  if (scenario) question.scenario = scenario;
  return question;
}

function validateCatalogJson(data, takenIds) {
  const errors = [];
  const warnings = [];
  const taken = takenIds || [];

  if (!isImportObject(data)) {
    return { catalog: null, errors: ["The file must contain one JSON object with id, title and questions."], warnings: warnings };
  }

  if (!isImportId(data.id)) {
    errors.push("id is missing or has characters other than letters, digits, - and _ (at most 64).");
  } else if (taken.indexOf(data.id) !== -1) {
    errors.push("id \"" + data.id + "\" is used by a built-in catalog. Choose another id.");
  }
  const title = readText(data.title, "title", IMPORT_LIMITS.TITLE, true, errors);
  const description = readText(data.description, "description", IMPORT_LIMITS.DESCRIPTION, false, errors);
  const basedOn = readText(data.basedOn, "basedOn", IMPORT_LIMITS.LABEL, false, errors);

  const catalog = { id: data.id, title: title, description: description || "", scenarios: [] };
  if (basedOn) catalog.basedOn = basedOn;
  ["createdAt", "sourcesCheckedAt"].forEach(function (field) {
    if (data[field] === undefined || data[field] === null) return;
    if (typeof data[field] === "string" && /^\d{4}-\d{2}-\d{2}$/.test(data[field])) {
      catalog[field] = data[field];
    } else {
      warnings.push(field + " was ignored: use a date like 2026-10-20.");
    }
  });

  if (data.scenarios !== undefined && data.scenarios !== null) {
    if (!Array.isArray(data.scenarios)) {
      errors.push("scenarios must be a list of { id, title, description }.");
    } else {
      data.scenarios.forEach(function (scenario, index) {
        const label = "scenarios[" + index + "]";
        if (!isImportObject(scenario) || !isImportId(scenario.id)) {
          errors.push(label + " needs an id (letters, digits, - and _).");
          return;
        }
        const scenarioTitle = readText(scenario.title, label + ".title", IMPORT_LIMITS.TITLE, true, errors);
        const scenarioText = readText(scenario.description, label + ".description", IMPORT_LIMITS.QUESTION, true, errors);
        catalog.scenarios.push({ id: scenario.id, title: scenarioTitle, description: scenarioText });
      });
    }
  }

  if (!Array.isArray(data.questions) || data.questions.length === 0) {
    errors.push("questions must be a list with at least one question.");
    return { catalog: null, errors: errors, warnings: warnings };
  }
  if (data.questions.length > IMPORT_LIMITS.MAX_QUESTIONS) {
    errors.push("The file has " + data.questions.length + " questions, at most " + IMPORT_LIMITS.MAX_QUESTIONS + " are allowed.");
    return { catalog: null, errors: errors, warnings: warnings };
  }

  const scenarioIds = catalog.scenarios.map(function (scenario) { return scenario.id; });
  const seen = {};
  catalog.questions = [];
  data.questions.forEach(function (raw, position) {
    const question = readQuestion(raw, position, scenarioIds, errors, warnings);
    if (!question) return;
    if (seen[question.id]) {
      errors.push("Question " + (position + 1) + " (" + question.id + "): this id is used twice. Every question needs its own id.");
      return;
    }
    seen[question.id] = true;
    catalog.questions.push(question);
  });

  return { catalog: errors.length ? null : catalog, errors: errors, warnings: warnings };
}
