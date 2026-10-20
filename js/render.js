/* Helpers */
const OPTION_LETTERS = ["A", "B", "C", "D", "E", "F"];

function escapeHtml(text) {
  const div = document.createElement("div");
  div.textContent = text;
  return div.innerHTML;
}

function correctOptionsOf(question) {
  return question.options.filter(function (option) { return option.isCorrect; });
}

function chosenOptionsOf(question, selected) {
  return (selected || []).map(function (index) { return question.options[index]; });
}

// "Select 2 · 1 of 2 selected" above the options of a multiple-response question
function renderSelectHint(question, selectedCount, showCount) {
  if (!isMultipleResponse(question)) return "";
  const required = requiredSelections(question);
  return '<p class="select-hint"><strong>Select ' + required + "</strong>" +
    (showCount ? " · " + selectedCount + " of " + required + " selected" : "") + "</p>";
}

function formatRate(tallyValue, requireMinimum) {
  if (tallyValue.total === 0) return "–";
  if (requireMinimum && tallyValue.total < CONFIG.MIN_ANSWERS) return "not enough data";
  return tallyValue.rate + " %";
}

function formatDuration(totalSeconds) {
  const seconds = Math.max(0, Math.floor(totalSeconds));
  const hours = Math.floor(seconds / 3600);
  const minutes = Math.floor((seconds % 3600) / 60);
  const rest = seconds % 60;
  const two = function (value) { return String(value).padStart(2, "0"); };
  return hours > 0 ? hours + ":" + two(minutes) + ":" + two(rest) : minutes + ":" + two(rest);
}

function renderBar(percentValue) {
  return '<div class="bar"><div class="bar-fill" style="width:' + percentValue + '%"></div></div>';
}

/* Icons (inline SVG, drawn with currentColor) */
const ICON_PATHS = {
  pause: '<rect x="6" y="5" width="4" height="14" rx="1.2" fill="currentColor" stroke="none"/><rect x="14" y="5" width="4" height="14" rx="1.2" fill="currentColor" stroke="none"/>',
  back: '<path d="M15 5l-7 7 7 7"/>',
  next: '<path d="M9 5l7 7-7 7"/>',
  check: '<path d="M5 12.5l4.5 4.5L19 7.5"/>',
  cross: '<path d="M6 6l12 12M18 6L6 18"/>',
  warning: '<path d="M12 4l9 16H3z"/><path d="M12 10v4M12 17.2v.1"/>',
  flag: '<path d="M6 4v17M6 5h11l-2.5 4L17 13H6"/>',
  grid: '<rect x="4" y="4" width="6" height="6"/><rect x="14" y="4" width="6" height="6"/><rect x="4" y="14" width="6" height="6"/><rect x="14" y="14" width="6" height="6"/>'
};

function icon(name) {
  return '<svg class="icon" viewBox="0 0 24 24" aria-hidden="true" fill="none" stroke="currentColor" ' +
    'stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round">' + ICON_PATHS[name] + "</svg>";
}

function formatCheckedDate(isoDate) {
  const date = new Date(isoDate);
  return isNaN(date) ? "" : date.toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" });
}

// "Where this comes from": check date of the catalog, link and verbatim excerpt
function renderSourceEntry(source) {
  const label = escapeHtml(source.label);
  // Docs are checked against their markdown version (.md); readers get the normal web page.
  const href = source.url ? source.url.replace(/\.md$/, "") : "";
  const link = href
    ? '<a href="' + escapeHtml(href) + '" target="_blank" rel="noopener">' + label + "</a>"
    : label;
  return '<p class="source">' + link + "</p>" +
    (source.quote ? '<blockquote class="source-quote">“' + escapeHtml(source.quote) + "”</blockquote>" : "");
}

// "Where this comes from": check date of the catalog, the Exam Guide passage and supporting product docs
function renderSources(catalog, source, docs) {
  if (!source && !(docs && docs.length)) return "";
  const checked = catalog && catalog.sourcesCheckedAt ? formatCheckedDate(catalog.sourcesCheckedAt) : "";
  return '<div class="sources"><h4 class="why-title">Where this comes from</h4>' +
    (checked ? '<p class="sources-date">Sources checked ' + checked + "</p>" : "") +
    (source ? renderSourceEntry(source) : "") +
    (docs || []).map(renderSourceEntry).join("") + "</div>";
}

/* Answer explanation: why the correct option is right, why the chosen wrong ones are wrong,
   the remaining options on demand, and the source. Letters follow the order shown on screen. */
function letterOf(question, option) {
  return OPTION_LETTERS[question.options.indexOf(option)];
}

function joinLetters(letters) {
  return letters.length < 2 ? letters.join("") : letters.slice(0, -1).join(", ") + " and " + letters[letters.length - 1];
}

function renderWhy(title, body, optionText) {
  return '<div class="why"><h4 class="why-title">' + title + "</h4>" +
    (optionText ? '<p class="why-option">' + escapeHtml(optionText) + "</p>" : "") +
    "<p>" + (body ? escapeHtml(body) : '<span class="no-explanation">No explanation provided.</span>') + "</p></div>";
}

// showOptionText: repeat the option text where the options themselves are not on screen (result reviews)
function renderAnswerExplanation(catalog, question, selected, showOptionText) {
  const correct = correctOptionsOf(question);
  const chosenWrong = chosenOptionsOf(question, selected).filter(function (option) { return !option.isCorrect; });
  const others = question.options.filter(function (option) {
    return !option.isCorrect && chosenWrong.indexOf(option) === -1;
  });

  const correctLetters = correct.map(function (option) { return letterOf(question, option); });
  const correctText = correct.map(function (option) { return letterOf(question, option) + ": " + option.text; }).join(" · ");
  const correctBody = question.explanation || correct.map(function (option) { return option.explanation; }).join(" ");
  let html = renderWhy("Why " + joinLetters(correctLetters) + (correct.length > 1 ? " are" : " is") + " correct",
    correctBody, showOptionText ? correctText : "");

  chosenWrong.forEach(function (option) {
    html += renderWhy("Why " + letterOf(question, option) + " is wrong", option.explanation, showOptionText ? option.text : "");
  });

  if (others.length) {
    html += '<details class="why-others"><summary>Why the other options are wrong</summary><ul>' +
      others.map(function (option) {
        return "<li><strong>" + letterOf(question, option) + "</strong> " +
          (showOptionText ? '<span class="why-option">' + escapeHtml(option.text) + "</span>" : "") +
          (option.explanation ? escapeHtml(option.explanation) : '<span class="no-explanation">No explanation provided.</span>') + "</li>";
      }).join("") + "</ul></details>";
  }
  return html + renderSources(catalog, question.source, question.docs);
}

// Scenario context of a question (optional field). Unknown ids show nothing.
function renderScenario(catalog, question) {
  if (!question.scenario || !Array.isArray(catalog.scenarios)) return "";
  const scenario = catalog.scenarios.find(function (item) { return item.id === question.scenario; });
  if (!scenario) return "";
  return '<details class="scenario"><summary><span class="scenario-label">Scenario</span> ' + escapeHtml(scenario.title) + "</summary>" +
    "<p>" + escapeHtml(scenario.description) + "</p></details>";
}

function renderBackLink(label) {
  return '<button class="back-link" data-action="home">' + icon("back") + escapeHtml(label) + "</button>";
}

function renderWeakBadge() {
  return '<span class="badge-weak">' + icon("warning") + "Weak area</span>";
}

// Backup section at the bottom of the start page
function renderBackupSection(backupInfo) {
  const last = backupInfo && backupInfo.lastExportAt ? new Date(backupInfo.lastExportAt) : null;
  const lastText = last && !isNaN(last) ? last.toLocaleDateString() : "never";
  return '<h2 class="group-title">Your data</h2>' +
    '<p class="hint">Your progress is saved only in this browser on this device. Export it to keep a copy or to move it to another device, and restore it from the file there.</p>' +
    '<div class="button-row"><button class="button secondary" data-action="export-progress">Export progress</button>' +
    '<button class="button secondary" data-action="restore-progress">Restore from backup</button></div>' +
    '<p class="hint">Last backup: ' + lastText + "</p>";
}

// Result of an import: what went wrong, or what was imported and what was adjusted
function renderImportReport(report) {
  if (!report) return "";
  const list = function (items, limit) {
    const shown = items.slice(0, limit).map(function (item) { return "<li>" + escapeHtml(item) + "</li>"; }).join("");
    return "<ul>" + shown + (items.length > limit ? "<li>…and " + (items.length - limit) + " more.</li>" : "") + "</ul>";
  };
  let html = '<div class="import-report ' + (report.errors.length ? "failed" : "done") + '" role="status">' +
    "<strong>" + escapeHtml(report.title) + "</strong>";
  if (report.errors.length) html += "<p>Nothing was imported. Fix these problems and try again:</p>" + list(report.errors, 12);
  if (report.warnings.length) html += "<p>Details:</p>" + list(report.warnings, 6);
  return html + "</div>";
}

/* Catalog list (home).
   entries: [{ catalog, stats, pausedAnswered }]; pausedAnswered is null when no round is paused. */
function renderCatalogList(entries, notice, report, backupInfo) {
  const cardHtml = entries.map(function (entry, index) {
    const catalog = entry.catalog;
    const coverage = entry.stats.coverage;
    let paused = "";
    let actions = '<button class="button" data-action="open-catalog" data-catalog-index="' + index + '">Learn</button>';
    const removeButton = catalog.imported
      ? '<button class="button ghost" data-action="remove-imported" data-catalog-index="' + index + '">Remove</button>'
      : "";

    if (entry.pausedAnswered !== null) {
      paused = '<div class="paused-run"><div class="paused-label"><span>Paused round</span><span>' +
        entry.pausedAnswered.done + " of " + entry.pausedAnswered.total + " done</span></div>" +
        renderBar(percent(entry.pausedAnswered.done, entry.pausedAnswered.total)) + "</div>";
      actions = '<button class="button" data-action="resume" data-catalog-index="' + index + '">Resume</button>' +
        '<button class="button secondary" data-action="open-catalog" data-catalog-index="' + index + '">New round</button>' +
        '<button class="button ghost" data-action="discard-run" data-catalog-index="' + index + '">Discard</button>';
    }

    if (entry.examRemainingMs !== null) {
      paused += '<div class="paused-run exam-running"><div class="paused-label"><span>' + (entry.examPaused ? "Exam paused" : "Exam in progress") + '</span><span>' +
        formatDuration(entry.examRemainingMs / 1000) + " left</span></div></div>";
      actions += '<button class="button" data-action="resume-exam" data-catalog-index="' + index + '">Resume exam</button>';
    }

    return '<article class="catalog">' +
      "<h2>" + escapeHtml(catalog.title) + (catalog.imported ? ' <span class="tag-imported">Imported</span>' : "") + "</h2>" +
      "<p>" + escapeHtml(catalog.description) + "</p>" +
      '<p class="catalog-meta">' + catalog.questions.length + " questions · " +
      coverage.seen + " practiced" + (entry.stats.weakDomains.length ? " · " + entry.stats.weakDomains.length + " weak area(s)" : "") + "</p>" +
      paused + '<div class="button-row">' + actions + removeButton + "</div></article>";
  });

  // Catalogs made from another one (one per domain) are listed in their own group below the main ones
  const mainCards = cardHtml.filter(function (_, index) { return !entries[index].catalog.progressId; }).join("");
  const domainCards = cardHtml.filter(function (_, index) { return entries[index].catalog.progressId; }).join("");
  const cards = mainCards;

  return '<section class="screen">' +
    '<div class="home-head"><div><h1 class="home-title">CCAR-F Study</h1>' +
    '<p class="home-subtitle">Learn in short rounds. Your progress is saved in this browser.</p></div>' +
    '<div class="home-buttons"><button class="button secondary" data-action="import-catalog">Import catalog</button>' +
    '<button class="button secondary" data-action="stats">Statistics</button></div></div>' +
    renderImportReport(report) +
    (notice ? '<p class="notice" role="status">' + escapeHtml(notice) + "</p>" : "") +
    '<div class="catalog-list">' + (cards || "<p>No catalogs found.</p>") + "</div>" +
    (domainCards ? "<h2 class=\"group-title\">Practice by domain</h2>" + '<div class="catalog-list">' + domainCards + "</div>" : "") +
    renderBackupSection(backupInfo) +
    '<p class="app-version">CCAR-F Study · version ' + APP_VERSION + "</p>" +
    "</section>";
}

/* Catalog screen: round setup, domain status, reset */
function renderChoice(label, value, isSelected, action) {
  return '<button class="choice" data-action="' + action + '" data-value="' + value + '" aria-pressed="' + isSelected + '">' +
    escapeHtml(label) + "</button>";
}

function renderDomainStatus(domains) {
  if (!domains.length) return "";
  const rows = domains.map(function (item) {
    return '<li class="domain-row"><span class="domain-name">' + item.domain + "</span>" +
      (item.recent.total >= CONFIG.MIN_ANSWERS ? renderBar(item.recent.rate) : '<div class="bar"></div>') +
      '<span class="domain-score">' + formatRate(item.recent, true) + "</span>" +
      (item.isWeak ? "<span>" + renderWeakBadge() + "</span>" : "<span></span>") + "</li>";
  }).join("");
  return "<h2>Your domains</h2>" +
    '<p class="hint">Rate of your last ' + CONFIG.LAST_ANSWERS_WINDOW + " answers per domain. Weak area: below " +
    CONFIG.WEAK_THRESHOLD + " % with at least " + CONFIG.MIN_ANSWERS + " answers.</p>" +
    '<ul class="domain-list domain-list-wide">' + rows + "</ul>";
}

function renderExamSetup(availability, examRemainingMs, examPaused) {
  const quotas = examQuotas();
  const distribution = DOMAINS.filter(function (domain) { return quotas[domain] > 0; }).map(function (domain) {
    return domain + " " + quotas[domain];
  }).join(" · ");

  let body = '<p class="hint">' + EXAM.QUESTIONS + " questions · " + EXAM.MINUTES + " minutes · no feedback until you submit. " +
    "Answer each question before moving on. You can go back, change answers and mark questions to review them at the end. " +
    "When time runs out, the exam is submitted automatically. You can pause the exam and the timer stops (the real exam cannot be paused).</p>" +
    '<p class="hint">Questions per domain: ' + distribution +
    (isExamDistributionProvisional() ? " (provisional, equal split until the Exam Guide weights are set)" : "") + ".</p>";

  if (examRemainingMs !== null) {
    body += '<p class="round-summary">An exam is ' + (examPaused ? "paused" : "in progress") + ' · ' + formatDuration(examRemainingMs / 1000) + " left.</p>" +
      '<div class="button-row"><button class="button" data-action="resume-exam-here">Resume exam</button>' +
      '<button class="button secondary" data-action="start-exam">Start a new exam</button></div>';
  } else if (availability.isAvailable) {
    body += '<div class="button-row"><button class="button" data-action="start-exam">Start exam</button></div>';
  } else {
    body += '<p class="round-summary short">Not available yet: this catalog needs at least ' + EXAM.QUESTIONS +
      " questions with enough in every domain (" + escapeHtml(availability.shortages.join("; ")) + ").</p>" +
      '<div class="button-row"><button class="button" disabled>Start exam</button></div>';
  }
  return "<h2>Exam simulation</h2>" + body;
}

function isExamDistributionProvisional() {
  const weights = DOMAINS.map(function (domain) { return EXAM.DOMAIN_WEIGHTS[domain]; });
  return weights.every(function (weight) { return weight === weights[0]; });
}

// Small catalogs (catalog.fixedRound): no choices and no exam, every round uses all questions
// Switch: repeat wrong questions at the end of the round (per catalog)
function renderRepeatSwitch(isOn) {
  return '<div class="switch-row"><button class="switch" role="switch" aria-checked="' + isOn + '" data-action="toggle-repeat" aria-labelledby="repeat-label">' +
    '<span class="switch-knob"></span></button>' +
    '<div><p class="switch-label" id="repeat-label">Repeat wrong questions<span class="switch-state"> · ' + (isOn ? "on" : "off") + "</span></p>" +
    '<p class="hint">A wrong question comes back at the end of the round, up to ' + CONFIG.MAX_REPEATS +
    " times. If it is still wrong after that, it goes to box 1 and returns in a later round. Repeats do not count towards your score.</p></div></div>";
}

// Button for a round with only the questions in box 1
function renderMistakesButton(count) {
  return '<button class="button secondary" data-action="start-mistakes"' + (count === 0 ? " disabled" : "") + ">Practice my mistakes (" + count + ")</button>";
}

function renderMistakesHint(count) {
  return '<p class="hint">' + (count === 0 ? "No mistakes yet. " : "") +
    "Mistakes are the questions in box 1: answered wrong, or rated Hard. They leave it when you answer them right and rate them Good or Easy.</p>";
}

function renderFixedRoundScreen(catalog, stats, hasPausedRun, repeatWrong, mistakeCount) {
  const count = catalog.questions.length;
  return '<section class="screen">' + renderBackLink("Catalogs") +
    '<h1 class="page-title">' + escapeHtml(catalog.title) + "</h1>" +
    '<div class="two-col"><div>' +
    '<p class="round-summary">This catalog has ' + count + " questions. Every round uses all of them.</p>" +
    renderRepeatSwitch(repeatWrong) +
    (hasPausedRun ? '<p class="hint">Starting a new round replaces your paused round.</p>' : "") +
    '<div class="button-row"><button class="button" data-action="start-round">Start round</button>' + renderMistakesButton(mistakeCount) + "</div>" +
    renderMistakesHint(mistakeCount) +
    "</div><div>" + renderDomainStatus(stats.domains) + "</div></div>" +
    '<div class="button-row danger-zone"><button class="button ghost danger" data-action="reset-progress">Reset progress</button></div>' +
    "</section>";
}

function renderCatalogScreen(catalog, setup, availableCount, stats, hasPausedRun, availability, examRemainingMs, examPaused, mistakeCount) {
  const repeatWrong = repeatWrongEnabled(setup, catalog);
  if (catalog.fixedRound) return renderFixedRoundScreen(catalog, stats, hasPausedRun, repeatWrong, mistakeCount);
  const domainsInCatalog = stats.domains.map(function (item) { return item.domain; });
  const lengthChoices = CONFIG.ROUND_LENGTHS.map(function (length) {
    return renderChoice(String(length), length, setup.length === length, "set-length");
  }).join("");
  const domainChoices = renderChoice("All", "all", setup.domain === "all", "set-domain") +
    domainsInCatalog.map(function (domain) {
      return renderChoice(domain, domain, setup.domain === domain, "set-domain");
    }).join("");

  const roundSize = Math.min(setup.length, availableCount);
  const shorter = availableCount < setup.length;
  const summary = shorter
    ? "Only " + availableCount + " question" + (availableCount === 1 ? "" : "s") + " available here, so this round has " + roundSize + "."
    : "This round has " + roundSize + " questions.";

  return '<section class="screen">' + renderBackLink("Catalogs") +
    '<h1 class="page-title">' + escapeHtml(catalog.title) + "</h1>" +
    '<div class="two-col"><div>' +
    "<h2>Questions per round</h2>" +
    '<div class="choice-group" role="group" aria-label="Questions per round">' + lengthChoices + "</div>" +
    (domainsInCatalog.length > 1
      ? "<h2>Domain</h2>" + '<div class="choice-group" role="group" aria-label="Domain filter">' + domainChoices + "</div>"
      : "") +
    renderRepeatSwitch(repeatWrong) +
    '<p class="round-summary' + (shorter ? " short" : "") + '">' + summary + "</p>" +
    (hasPausedRun ? '<p class="hint">Starting a new round replaces your paused round.</p>' : "") +
    '<div class="button-row"><button class="button" data-action="start-round"' + (roundSize === 0 ? " disabled" : "") + ">Start round</button>" +
    renderMistakesButton(mistakeCount) + "</div>" +
    renderMistakesHint(mistakeCount) +
    "</div><div>" +
    (catalog.noExam ? "" : renderExamSetup(availability, examRemainingMs, examPaused)) +
    renderDomainStatus(stats.domains) + "</div></div>" +
    '<div class="button-row danger-zone"><button class="button ghost danger" data-action="reset-progress">Reset progress</button></div>' +
    "</section>";
}

/* Question screen: renders the answered state too, so going back shows the feedback again */
function renderProgress(round) {
  const total = round.questions.length;
  if (total > 60) return renderBar(percent(countCompleted(round), total));

  const segments = round.questions.map(function (_, index) {
    let state = "todo";
    if (isAnswered(round, index)) state = round.answers[index].isCorrect ? "right" : "wrong";
    return '<span class="segment ' + state + (index === round.currentIndex ? " current" : "") + '"></span>';
  }).join("");
  return '<div class="segments">' + segments + "</div>";
}

// pending: options toggled on an open multiple-response question (null for single choice)
function renderOption(option, index, answer, pending, required) {
  let state = "";
  let badge = OPTION_LETTERS[index];
  let note = "";
  let isDisabled = Boolean(answer);
  let pressed = "";

  if (answer) {
    const isChosen = answer.selected.indexOf(index) !== -1;
    // The letter stays in the badge, because the explanation below refers to it ("Why A is correct").
    if (option.isCorrect) {
      state = " correct";
      note = icon("check") + (isChosen && required > 1 ? "Your answer · correct" : "Correct answer");
    } else if (isChosen) {
      state = " wrong";
      note = icon("cross") + "Your answer";
    }
  } else if (pending) {
    const isSelected = pending.indexOf(index) !== -1;
    pressed = ' aria-pressed="' + isSelected + '"';
    if (isSelected) {
      state = " selected";
      badge = icon("check");
      note = "Selected";
    } else if (pending.length >= required) {
      state = " blocked";
      isDisabled = true; // N already selected: deselect one first
    }
  }

  return '<button class="option' + state + '" data-action="answer" data-option-index="' + index + '"' +
    pressed + (isDisabled ? " disabled" : "") + ">" +
    '<span class="badge">' + badge + "</span>" +
    '<span class="option-body"><span class="option-text">' + escapeHtml(option.text) + "</span>" +
    (note ? '<span class="option-note">' + note + "</span>" : "") + "</span></button>";
}

const RATING_LABELS = { again: "Again", hard: "Hard", good: "Good", easy: "Easy" };

// "Report a problem": lets the learner flag a question they doubt, with a short note
function renderFlagBox(flagInfo) {
  if (!flagInfo) return "";
  if (flagInfo.isEditing) {
    return '<div class="flag-box editing"><label class="why-title" for="flag-note">What seems wrong with this question?</label>' +
      '<textarea id="flag-note" rows="3" placeholder="For example: answer B also seems right, or the explanation contradicts the docs">' +
      escapeHtml(flagInfo.flag ? flagInfo.flag.note : "") + "</textarea>" +
      '<div class="button-row"><button class="button" data-action="flag-save">Save report</button>' +
      '<button class="button ghost" data-action="flag-cancel">Cancel</button></div></div>';
  }
  if (flagInfo.flag) {
    return '<div class="flag-box reported"><p>' + icon("flag") + "<span><strong>Reported</strong>" +
      (flagInfo.flag.note ? ": " + escapeHtml(flagInfo.flag.note) : "") + "</span></p>" +
      '<div class="button-row"><button class="button ghost" data-action="flag-open">Edit note</button>' +
      '<button class="button ghost" data-action="flag-remove">Remove report</button></div></div>';
  }
  return '<div class="flag-box"><button class="link-button" data-action="flag-open">' + icon("flag") +
    "Report a problem with this question</button></div>";
}

function renderFeedback(catalog, question, answer, isFresh, flagInfo, round) {
  let html = '<section class="feedback ' + (answer.isCorrect ? "correct" : "wrong") + (isFresh ? " fresh" : "") + '" id="feedback">' +
    '<h3 class="verdict">' + (answer.isCorrect ? icon("check") + "Correct" : icon("cross") + "Not quite") + "</h3>" +
    renderAnswerExplanation(catalog, question, answer.selected, false);

  if (answer.rating) {
    html += '<p class="rating-note">Rated: ' + RATING_LABELS[answer.rating] + (answer.isCorrect ? "" : " (automatic)") + "</p>";
  }
  if (question.isRepeat) {
    html += '<p class="rating-note">Repeat ' + question.repeatNumber + " of " + CONFIG.MAX_REPEATS + ": it does not count towards your score.</p>";
  }
  if (!answer.isCorrect) {
    const index = round.questions.indexOf(question);
    if (shouldRepeat(round, index)) {
      html += '<p class="rating-note">This question comes back at the end of the round (repeat ' + (question.repeatNumber + 1) + " of " + CONFIG.MAX_REPEATS + ").</p>";
    } else {
      html += '<p class="rating-note">It goes to box 1 and comes back in a later round.</p>';
    }
  }
  return html + renderFlagBox(flagInfo) + "</section>";
}

function renderRatingButton(rating, hint) {
  return '<button class="button rating ' + rating + '" data-action="rate" data-rating="' + rating + '">' +
    '<span>' + RATING_LABELS[rating] + '</span><span class="rating-hint">' + hint + "</span></button>";
}

function renderActionBar(round, pending) {
  const index = round.currentIndex;
  const isLast = index === round.questions.length - 1;
  const back = '<button class="button secondary' + (needsRating(round, index) ? " compact" : "") + '" data-action="prev" aria-label="Back"' +
    (index === 0 ? " disabled" : "") + ">" + icon("back") + (needsRating(round, index) ? "" : "Back") + "</button>";

  let main;
  if (needsRating(round, index)) {
    main = '<div class="rating-group"><p class="rating-prompt">How well did you know it?</p><div class="rating-buttons">' +
      renderRatingButton("hard", "same box") + renderRatingButton("good", "+1 box") + renderRatingButton("easy", "+2 boxes") +
      "</div></div>";
  } else if (!isAnswered(round, index) && isMultipleResponse(round.questions[index])) {
    main = '<button class="button" data-action="check-answer"' +
      (pending.length === requiredSelections(round.questions[index]) ? "" : " disabled") + ">Check answer</button>";
  } else {
    main = '<button class="button" data-action="next"' + (isCompleted(round, index) ? "" : " disabled") + ">" +
      (isLast ? "Show results" : "Next") + (isLast ? "" : icon("next")) + "</button>";
  }

  return '<nav class="action-bar" aria-label="Question navigation"><div class="action-bar-inner">' + back + main + "</div></nav>";
}

// Shown only with a mouse or keyboard (hidden on touch screens by CSS)
function renderKeyboardHint(isRating) {
  return '<p class="kbd-hint">Keyboard: ' + (isRating ? "1 Hard · 2 Good · 3 Easy" : "A–D choose") + " · Enter continue · ← → navigate</p>";
}

function renderQuestion(round, isFresh, pendingSelection, flagInfo) {
  const index = round.currentIndex;
  const question = round.questions[index];
  const answer = round.answers[index];
  const required = requiredSelections(question);
  const pending = required > 1 ? pendingSelection : null;

  const options = question.options.map(function (option, optionIndex) {
    return renderOption(option, optionIndex, answer, pending, required);
  }).join("");

  return '<section class="screen with-action-bar' + (needsRating(round, index) ? " tall-bar" : "") + '">' +
    '<div class="topbar">' +
    '<button class="pause-button" data-action="pause" aria-label="Pause and save progress">' + icon("pause") + "<span>Pause</span></button>" +
    renderProgress(round) +
    '<button class="counter-button" data-action="overview" aria-label="Open overview, question ' + (index + 1) + " of " + round.questions.length + '">' +
    icon("grid") + (index + 1) + "/" + round.questions.length + "</button></div>" +
    '<div class="q-layout"><div class="q-side">' +
    '<span class="chip">' + escapeHtml(question.domain) + "</span>" +
    (question.isRepeat ? '<span class="chip repeat">Repeat ' + question.repeatNumber + "/" + CONFIG.MAX_REPEATS + "</span>" : "") +
    renderScenario(round.catalog, question) +
    '<h2 class="question-text">' + escapeHtml(question.question) + "</h2>" +
    renderSelectHint(question, pending ? pending.length : 0, !answer) +
    renderKeyboardHint(needsRating(round, index)) + "</div>" +
    '<div class="q-main"><div class="options" role="group" aria-label="Answer options">' + options + "</div>" +
    (answer ? renderFeedback(round.catalog, question, answer, isFresh, flagInfo, round) : "") +
    "</div></div></section>" + renderActionBar(round, pendingSelection);
}

/* Results screen */
// selected: chosen option indexes, or null when nothing was chosen
function renderReviewItem(catalog, question, selected) {
  const chosen = chosenOptionsOf(question, selected);
  const isIncomplete = chosen.length > 0 && chosen.length < requiredSelections(question);
  let note = "";
  if (chosen.length === 0) note = '<p class="hint">You did not answer this question.</p>';
  else if (isIncomplete) note = '<p class="hint">Your answer was incomplete.</p>';
  return '<details class="review-item"><summary>' +
    '<span class="chip">' + escapeHtml(question.domain) + "</span>" +
    "<span>" + escapeHtml(question.question) + "</span></summary>" +
    '<div class="review-body">' + note + renderAnswerExplanation(catalog, question, selected, true) + "</div></details>";
}

function renderScoreRing(percentValue) {
  const circumference = 2 * Math.PI * 52;
  const filled = (percentValue / 100) * circumference;
  return '<div class="ring" role="img" aria-label="Score ' + percentValue + ' percent">' +
    '<svg viewBox="0 0 120 120" aria-hidden="true">' +
    '<circle class="ring-track" cx="60" cy="60" r="52"/>' +
    '<circle class="ring-fill" cx="60" cy="60" r="52" stroke-dasharray="' + filled.toFixed(1) + " " + circumference.toFixed(1) + '"/></svg>' +
    '<span class="ring-value">' + percentValue + " %</span></div>";
}

function renderResults(round, results, boxes, stats) {
  const domainRows = DOMAINS.filter(function (domain) {
    return results.perDomain[domain];
  }).map(function (domain) {
    const entry = results.perDomain[domain];
    const total = entry.correct + entry.wrong;
    const score = percent(entry.correct, total);
    return '<li class="domain-row"><span class="domain-name">' + domain + "</span>" + renderBar(score) +
      '<span class="domain-score">' + entry.correct + "/" + total + " · " + score + " %</span></li>";
  }).join("");

  const boxChips = Object.keys(boxes).map(function (box) {
    return '<li class="box-chip"><span class="box-name">Box ' + box + "</span><strong>" + boxes[box] + "</strong></li>";
  }).join("");
  const ratings = results.ratingCounts;

  const weak = stats.weakDomains.length
    ? '<ul class="weak-list">' + stats.weakDomains.map(function (item) {
        return "<li>" + renderWeakBadge() + " <strong>" + item.domain + "</strong> · " + item.recent.rate + " % over your last " + item.recent.total + " answers</li>";
      }).join("") + "</ul>"
    : '<p class="hint">No weak areas right now.</p>';

  const reviewItems = results.wrongQuestions.map(function (item) {
    return renderReviewItem(round.catalog, item.question, item.selected);
  }).join("");

  return '<section class="screen">' +
    '<div class="result-hero">' + renderScoreRing(results.percent) +
    "<div><h1>" + escapeHtml(round.catalog.title) + "</h1>" +
    "<p>" + results.correct + " correct, " + results.wrong + " wrong<br>" + results.total + " questions</p>" +
    '<div class="button-row">' +
    '<button class="button" data-action="restart">Next round</button>' +
    '<button class="button secondary" data-action="home">Back to catalogs</button></div></div></div>' +
    '<div class="two-col"><div>' +
    "<h2>By domain</h2>" +
    '<ul class="domain-list">' + domainRows + "</ul>" +
    "<h2>Where your questions are now</h2>" +
    '<ul class="box-list">' + boxChips + "</ul>" +
    '<p class="hint">Ratings this round: Again ' + ratings.again + " · Hard " + ratings.hard + " · Good " + ratings.good + " · Easy " + ratings.easy + "</p>" +
    "<h2>Weak areas</h2>" + weak +
    "</div><div>" +
    "<h2>Review wrong answers</h2>" +
    (reviewItems || '<p class="notice">No wrong answers. Well done!</p>') +
    "</div></div></section>";
}

/* Statistics screen */
const LIGHT_LABELS = { green: "On target", amber: "Close", red: "Below target", none: "Not enough data" };

function renderReady(stats) {
  const ready = stats.ready;
  const reasons = [];
  reasons.push((ready.allGreen ? "✓" : "✗") + " Every domain at " + CONFIG.READY_TARGET + " % or more over its last " + CONFIG.LAST_ANSWERS_WINDOW + " answers");
  reasons.push((ready.coverageOk ? "✓" : "✗") + " At least " + CONFIG.READY_COVERAGE + " % of the questions answered once (now " + stats.coverage.percent + " %)");
  reasons.push((ready.examsOk ? "✓" : "✗") + " Your last " + EXAM.READY_EXAM_COUNT + " exam simulations at " + EXAM.PASS_PERCENT + " % or more (approximate threshold)");
  return '<div class="ready ' + (ready.isReady ? "ready-yes" : "ready-no") + '">' +
    "<h3>Ready indicator: " + (ready.isReady ? "green" : "not yet") + "</h3>" +
    "<ul>" + reasons.map(function (reason) { return "<li>" + reason + "</li>"; }).join("") + "</ul>" +
    '<p class="hint">Indicator only, based on this app\'s questions. It is no guarantee for the real exam.</p></div>';
}

function renderStatsSection(catalog, stats) {
  const domainRows = stats.domains.map(function (item) {
    return '<tr><th scope="row">' + item.domain + "</th>" +
      "<td>" + formatRate(item.recent, true) + "</td>" +
      "<td>" + formatRate(item.allTime, true) + "</td>" +
      '<td><span class="light light-' + item.light + '"><span class="dot"></span>' + LIGHT_LABELS[item.light] + "</span>" +
      (item.isWeak ? " " + renderWeakBadge() : "") + "</td></tr>";
  }).join("");

  const rounds = stats.rounds.length
    ? '<ul class="round-list">' + stats.rounds.map(function (entry) {
        const date = new Date(entry.t);
        return '<li><span class="round-date">' + (isNaN(date) ? "" : date.toLocaleDateString()) + "</span>" +
          renderBar(entry.percent) + '<span class="round-score">' + entry.correct + "/" + entry.length + " · " + entry.percent + " %</span></li>";
      }).join("") + "</ul>"
    : '<p class="hint">No finished rounds yet.</p>';

  const exams = stats.exams.length
    ? '<ul class="round-list">' + stats.exams.map(function (entry) {
        const date = new Date(entry.t);
        const domainText = DOMAINS.filter(function (domain) { return entry.perDomain[domain]; }).map(function (domain) {
          return domain + " " + percent(entry.perDomain[domain].correct, entry.perDomain[domain].total) + " %";
        }).join(" · ");
        return "<li><span class=\"round-date\">" + (isNaN(date) ? "" : date.toLocaleDateString()) + "</span>" +
          renderBar(entry.percent) + '<span class="round-score">' + entry.correct + "/" + entry.total + " · " + entry.percent + " %</span>" +
          '<span class="exam-domains">' + domainText + (entry.percent >= EXAM.PASS_PERCENT ? " · above ≈" : " · below ≈") + EXAM.PASS_PERCENT + " %" +
          (entry.timedOut ? " · time ran out" : "") + "</span></li>";
      }).join("") + "</ul>"
    : '<p class="hint">No exam simulations yet.</p>';

  return '<article class="stats-section"><h2>' + escapeHtml(catalog.title) + "</h2>" +
    '<div class="stats-top"><div>' + renderReady(stats) + "</div><div>" +
    '<div class="stat-pair">' +
    '<div class="stat"><span class="stat-value">' + formatRate(stats.overall.recent, false) + '</span><span class="stat-label">Last ' + CONFIG.LAST_ANSWERS_WINDOW + " answers</span></div>" +
    '<div class="stat"><span class="stat-value">' + formatRate(stats.overall.allTime, false) + '</span><span class="stat-label">All time (' + stats.overall.allTime.total + " answers)</span></div></div>" +
    '<p class="coverage"><strong>Coverage:</strong> ' + stats.coverage.seen + " of " + stats.coverage.total + " questions answered at least once</p>" +
    renderBar(stats.coverage.percent) + "</div></div>" +
    '<div class="stats-blocks"><div class="stats-block"><h3>By domain</h3>' +
    '<table class="stats-table"><thead><tr><th>Domain</th><th>Last ' + CONFIG.LAST_ANSWERS_WINDOW + "</th><th>All time</th><th>Status</th></tr></thead><tbody>" +
    domainRows + "</tbody></table></div>" +
    '<div class="stats-block"><h3>Recent rounds</h3>' + rounds + "</div>" +
    '<div class="stats-block"><h3>Exam simulations</h3>' + exams + "</div></div></article>";
}

// reported: [{ flag, question }] where question may be null if it left the catalog
function renderReportedQuestions(reported) {
  if (!reported.length) {
    return "<h2>Reported questions</h2>" +
      '<p class="hint">None yet. After answering a question, use "Report a problem with this question" when something seems off.</p>';
  }
  const items = reported.map(function (item) {
    const date = new Date(item.flag.t);
    return '<li class="reported-item"><p class="reported-meta"><strong>' + escapeHtml(item.flag.questionId) + "</strong> · " +
      (isNaN(date) ? "" : date.toLocaleDateString()) + "</p>" +
      (item.question ? '<p class="reported-question">' + escapeHtml(item.question.question) + "</p>" : '<p class="hint">This question is no longer in the catalog.</p>') +
      (item.flag.note ? '<p class="reported-note">' + escapeHtml(item.flag.note) + "</p>" : "") +
      '<button class="button ghost" data-action="flag-remove" data-catalog-id="' + escapeHtml(item.flag.catalogId) +
      '" data-question-id="' + escapeHtml(item.flag.questionId) + '">Remove report</button></li>';
  }).join("");
  return "<h2>Reported questions</h2>" +
    '<p class="hint">Download the list and share it, so that these questions can be checked against the sources.</p>' +
    '<div class="button-row"><button class="button secondary" data-action="flags-download">Download list</button></div>' +
    '<ul class="reported-list">' + items + "</ul>";
}

function renderStats(entries, reported) {
  return '<section class="screen">' + renderBackLink("Catalogs") +
    '<h1 class="page-title">Statistics</h1>' +
    entries.map(function (entry) { return renderStatsSection(entry.catalog, entry.stats); }).join("") +
    renderReportedQuestions(reported) + "</section>";
}

/* Exam screens */
function renderTimer(remainingMs) {
  const isWarning = remainingMs <= EXAM.WARN_MINUTES * 60000;
  return '<span class="timer' + (isWarning ? " warning" : "") + '" id="exam-timer" role="timer">' +
    formatDuration(remainingMs / 1000) + "</span>";
}

function renderExamPauseButton() {
  return '<button class="pause-button" data-action="exam-pause" aria-label="Pause the exam and stop the timer">' + icon("pause") + "<span>Pause</span></button>";
}

function renderExamQuestion(exam, remainingMs) {
  const index = exam.currentIndex;
  const question = exam.questions[index];
  const chosen = exam.answers[index] || [];
  const required = requiredSelections(question);
  const isLast = index === exam.questions.length - 1;

  const options = question.options.map(function (option, optionIndex) {
    const isSelected = chosen.indexOf(optionIndex) !== -1;
    const isBlocked = !isSelected && required > 1 && chosen.length >= required; // deselect one first
    return '<button class="option' + (isSelected ? " selected" : "") + (isBlocked ? " blocked" : "") + '" data-action="exam-answer" data-option-index="' +
      optionIndex + '" aria-pressed="' + isSelected + '"' + (isBlocked ? " disabled" : "") + ">" +
      '<span class="badge">' + (isSelected ? icon("check") : OPTION_LETTERS[optionIndex]) + "</span>" +
      '<span class="option-body"><span class="option-text">' + escapeHtml(option.text) + "</span>" +
      (isSelected ? '<span class="option-note">Selected</span>' : "") + "</span></button>";
  }).join("");

  const isMarked = exam.marked[index];
  return '<section class="screen with-action-bar">' +
    '<div class="topbar">' + renderExamPauseButton() + renderTimer(remainingMs) +
    renderBar(percent(countExamAnswered(exam), exam.questions.length)) +
    '<span class="counter">' + (index + 1) + "/" + exam.questions.length + "</span></div>" +
    '<div class="q-layout"><div class="q-side">' +
    '<div class="exam-meta"><span class="hint">Question ' + (index + 1) + " of " + exam.questions.length + " · " +
    countExamAnswered(exam) + " answered</span>" +
    '<span class="meta-actions"><button class="mark-button" data-action="exam-overview">' + icon("grid") + "Overview</button>" +
    '<button class="mark-button' + (isMarked ? " on" : "") + '" data-action="exam-mark" aria-pressed="' + isMarked + '">' +
    icon("flag") + (isMarked ? "Marked" : "Mark") + "</button></span></div>" +
    renderScenario(exam.catalog, question) +
    '<h2 class="question-text">' + escapeHtml(question.question) + "</h2>" +
    renderSelectHint(question, chosen.length, true) +
    renderKeyboardHint(false) + "</div>" +
    '<div class="q-main"><div class="options" role="group" aria-label="Answer options">' + options + "</div></div></div></section>" +
    '<nav class="action-bar" aria-label="Question navigation"><div class="action-bar-inner">' +
    '<button class="button secondary" data-action="exam-prev"' + (index === 0 ? " disabled" : "") + ">" + icon("back") + "Back</button>" +
    '<button class="button" data-action="' + (isLast ? "exam-overview" : "exam-next") + '"' + (isExamAnswered(exam, index) ? "" : " disabled") + ">" +
    (isLast ? "Review and submit" : "Next" + icon("next")) + "</button></div></nav>";
}

// No skipping: only answered questions and the next open one can be opened.
function renderExamOverview(exam, remainingMs) {
  const reachable = firstUnansweredIndex(exam);
  const cells = exam.questions.map(function (_, index) {
    const answered = isExamAnswered(exam, index);
    const marked = exam.marked[index];
    const label = "Question " + (index + 1) + (answered ? ", answered" : ", not answered") + (marked ? ", marked" : "");
    return '<button class="qcell' + (answered ? " answered" : "") + (marked ? " marked" : "") +
      (index === exam.currentIndex ? " current" : "") + '" data-action="exam-goto" data-index="' + index + '" aria-label="' + label + '"' +
      (index > reachable ? " disabled" : "") + ">" + (index + 1) + (marked ? icon("flag") : "") + "</button>";
  }).join("");

  const markedItems = exam.questions.map(function (question, index) {
    if (!exam.marked[index]) return "";
    return '<li><button class="marked-item" data-action="exam-goto" data-index="' + index + '">' +
      '<span class="marked-number">' + (index + 1) + "</span><span>" + escapeHtml(question.question) + "</span></button></li>";
  }).join("");
  const markedSection = markedItems
    ? '<h2>Marked for review</h2><ul class="marked-list">' + markedItems + "</ul>"
    : "";

  const unanswered = exam.questions.length - countExamAnswered(exam);
  return '<section class="screen">' +
    '<div class="topbar">' + renderExamPauseButton() + renderTimer(remainingMs) + '<span class="hint exam-overview-title">Overview</span></div>' +
    '<p class="round-summary">' + countExamAnswered(exam) + " answered · " + unanswered + " not answered · " + countExamMarked(exam) + " marked</p>" +
    '<div class="qgrid">' + cells + "</div>" +
    '<p class="hint">Filled = answered. Outline = not answered yet. Flag = marked for review.</p>' +
    markedSection +
    '<div class="button-row"><button class="button secondary" data-action="exam-back">Back to question</button>' +
    '<button class="button" data-action="exam-submit">Submit exam</button></div></section>';
}

function renderExamResults(exam, score) {
  const domainRows = DOMAINS.filter(function (domain) {
    return score.perDomain[domain];
  }).map(function (domain) {
    const entry = score.perDomain[domain];
    const rate = percent(entry.correct, entry.total);
    return '<li class="domain-row"><span class="domain-name">' + domain + "</span>" + renderBar(rate) +
      '<span class="domain-score">' + entry.correct + "/" + entry.total + " · " + rate + " %</span></li>";
  }).join("");

  const reviewItems = score.wrongQuestions.map(function (item) {
    return renderReviewItem(exam.catalog, item.question, item.selected);
  }).join("");

  return '<section class="screen">' +
    (score.timedOut ? '<p class="notice" role="status">Time ran out, so the exam was submitted automatically.</p>' : "") +
    '<div class="result-hero">' + renderScoreRing(score.percent) +
    "<div><h1>Exam: " + escapeHtml(exam.catalog.title) + "</h1>" +
    "<p>" + score.correct + " of " + score.total + " correct<br>" + score.unanswered + " not answered · " +
    formatDuration(score.durationSeconds) + " used</p>" +
    '<div class="button-row"><button class="button" data-action="home">Back to catalogs</button></div></div></div>' +
    '<div class="ready ' + (score.isAbovePass ? "ready-yes" : "ready-no") + '">' +
    "<h3>" + (score.isAbovePass ? "Above" : "Below") + " the approximate pass threshold of " + EXAM.PASS_PERCENT + " %</h3>" +
    '<p class="hint">Approximation only. The real exam passes at 720 of 1000 points on a scaled score, and the conversion from correct answers is not known.</p></div>' +
    '<div class="two-col"><div>' +
    "<h2>By domain</h2>" + '<ul class="domain-list">' + domainRows + "</ul>" +
    '<p class="hint">Wrong answers are now in box 1 of your learning progress.</p></div><div>' +
    "<h2>Review wrong and unanswered questions</h2>" +
    (reviewItems || '<p class="notice">No wrong answers. Well done!</p>') +
    "</div></div></section>";
}

/* Round overview: every question of the round with its state. Only finished questions and the next open one can be opened. */
function renderRoundOverview(round) {
  const reachable = firstOpenIndex(round);
  let right = 0;
  let wrong = 0;
  const cells = round.questions.map(function (question, index) {
    const answer = round.answers[index];
    let state = "open";
    let word = "not answered yet";
    if (answer) {
      state = answer.isCorrect ? "right" : "wrong";
      word = answer.isCorrect ? "correct" : "wrong";
      if (answer.isCorrect) right++; else wrong++;
    }
    return '<button class="qcell ' + state + (index === round.currentIndex ? " current" : "") +
      '" data-action="overview-goto" data-index="' + index + '" aria-label="Question ' + (index + 1) + ", " + word + (question.isRepeat ? ", repeat" : "") + '"' +
      (index > reachable ? " disabled" : "") + ">" + (index + 1) + (question.isRepeat ? '<span class="qcell-tag">R</span>' : "") + "</button>";
  }).join("");

  return '<section class="screen">' +
    '<div class="topbar"><button class="pause-button" data-action="pause" aria-label="Pause and save progress">' + icon("pause") + "<span>Pause</span></button>" +
    '<span class="hint exam-overview-title">Overview</span></div>' +
    '<p class="round-summary">' + right + " correct · " + wrong + " wrong · " + (round.questions.length - right - wrong) + " open</p>" +
    '<div class="qgrid">' + cells + "</div>" +
    '<p class="hint">Green = correct. Red = wrong. Outline = open. R = repeat of a wrong question.</p>' +
    '<div class="button-row"><button class="button" data-action="overview-back">Back to question</button></div></section>';
}
