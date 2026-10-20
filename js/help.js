/* Help page, the catalog template and the prompt for writing your own catalog */

/* Template: every field the app understands, with two example questions (single choice and "Select 2").
   It must pass validateCatalogJson without errors. */
const CATALOG_TEMPLATE = {
  id: "my-catalog",
  title: "My questions",
  description: "One or two sentences that appear on the start page.",
  createdAt: "2026-10-20",
  sourcesCheckedAt: "2026-10-20",
  basedOn: "Name of the material the questions are based on",
  scenarios: [
    {
      id: "s1",
      title: "Scenario title",
      description: "Optional background story that several questions share. It is shown as a collapsible box above the question."
    }
  ],
  questions: [
    {
      id: "my-catalog-001",
      domain: "D1",
      scenario: "s1",
      question: "Which option is correct?",
      options: [
        "A believable but wrong option.",
        "The correct option.",
        "Another believable but wrong option.",
        "A third wrong option that fails for a different reason."
      ],
      correct: [1],
      explanation: "Two to four sentences: why the correct option is right and what separates it from the most tempting wrong option.",
      optionExplanations: [
        "Why option A is wrong.",
        "Why option B is right.",
        "Why option C is wrong.",
        "Why option D is wrong."
      ],
      source: { label: "Name of the document, chapter 2", url: "https://example.com/chapter-2", quote: "A short verbatim excerpt that supports the answer." },
      docs: [
        { label: "Product documentation: topic", url: "https://example.com/docs/topic", quote: "A short verbatim excerpt from the documentation." }
      ]
    },
    {
      id: "my-catalog-002",
      domain: "D2",
      question: "Which two statements are correct? (Select 2)",
      options: [
        "Wrong option.",
        "Correct option.",
        "Wrong option.",
        "Correct option.",
        "Wrong option."
      ],
      correct: [1, 3],
      explanation: "Why both correct options are right.",
      optionExplanations: [
        "Why this option is wrong.",
        "Why this option is right.",
        "Why this option is wrong.",
        "Why this option is right.",
        "Why this option is wrong."
      ],
      source: { label: "Name of the document, chapter 4" }
    }
  ]
};

function catalogTemplateText() {
  return JSON.stringify(CATALOG_TEMPLATE, null, 2);
}

function catalogPromptText() {
  return [
    "You are helping me write a question catalog for a learning app. Reply with ONE valid JSON file and nothing else: no Markdown code fence, no commentary.",
    "",
    "SOURCE MATERIAL",
    "Write the questions only from the material at the end of this message. Do not add facts that are not in it. For every question, put a short verbatim quote from the material into source.quote.",
    "",
    "RULES",
    "- Language of the questions: [LANGUAGE].",
    "- Number of questions: [NUMBER].",
    "- The app groups its statistics by the domains D1 to D5. If the material has five areas, use them. If not, define five topic groups yourself and list them in the \"description\" field of the catalog.",
    "- Spread the questions evenly over D1 to D5.",
    "- Every question describes a concrete situation and asks for the best answer (\"most effective\", \"root cause\", \"best first step\").",
    "- Each question has 4 options and exactly one correct option. For about 15 % of the questions use \"Select 2\": end the question with \"(Select 2)\", give 5 options and exactly two correct ones.",
    "- Wrong options must be believable and fail for different reasons. The correct option must not be the longest one. Vary the position of the correct option.",
    "- \"correct\" is a list of option positions counted from 0, for example [2].",
    "- \"explanation\": two to four sentences on why the correct option is right.",
    "- \"optionExplanations\": one short sentence per option, in the same order as \"options\". For the correct option say why it is right, for the others why they are wrong.",
    "- \"source\": label, quote, and url only if the material gives a real link. Never invent a link. Leave the url out otherwise.",
    "- \"docs\" is optional: use it for a second source such as product documentation, with the same fields as \"source\".",
    "- Ids: the catalog id uses lowercase letters, digits and hyphens. Question ids look like \"<catalog id>-001\", \"<catalog id>-002\" and are unique.",
    "- Keep every optional field of the template (scenarios, docs, createdAt, sourcesCheckedAt, basedOn) whenever you have the information. Use today's date for createdAt and sourcesCheckedAt.",
    "- Use exactly the structure of this template:",
    "",
    catalogTemplateText(),
    "",
    "SOURCE MATERIAL:",
    "[PASTE YOUR MATERIAL HERE]"
  ].join("\n");
}

function renderHelp(notice) {
  const shortcuts = [
    ["A – D", "Choose an answer"],
    ["1 / 2 / 3", "Rate Hard, Good or Easy"],
    ["Enter", "Check the answer or continue"],
    ["← / →", "Previous or next question"]
  ].map(function (row) {
    return "<tr><th scope=\"row\">" + row[0] + "</th><td>" + row[1] + "</td></tr>";
  }).join("");

  const limits = IMPORT_LIMITS;
  return '<section class="screen help">' + renderBackLink("Catalogs") +
    '<h1 class="page-title">Help</h1>' +
    (notice ? '<p class="notice" role="status">' + escapeHtml(notice) + "</p>" : "") +

    "<h2>What this app does</h2>" +
    "<p>This app helps you prepare for the Claude Certified Architect – Foundations exam. You practise in short rounds, see the explanation after every answer, and the app remembers which questions you find hard.</p>" +
    '<p class="hint">It is an unofficial learning aid and not affiliated with Anthropic. The core catalog was drafted by AI from the official Exam Guide and spot-checked by a person, so a question can still contain a mistake. Use \"Report a problem\" on a question you doubt.</p>' +

    "<h2>Learning rounds</h2>" +
    "<ul>" +
    "<li>Choose a catalog and press Learn. Pick 5, 10, 15 or 20 questions and, if you like, one domain.</li>" +
    "<li>After each answer you see why it is right or wrong and where the question comes from.</li>" +
    "<li>A wrong answer counts as Again. After a right answer you rate it Hard, Good or Easy.</li>" +
    "<li>Every question sits in one of five boxes. Again puts it back in box 1, Hard keeps its box, Good moves it up by one and Easy by two. The next round takes questions from low boxes first and mixes in new ones.</li>" +
    "<li>Repeat wrong questions (switch on the catalog page, off by default): a wrong question comes back at the end of the round, up to " + CONFIG.MAX_REPEATS + " times. Repeats do not count towards your score.</li>" +
    "<li>Practice my mistakes (button on the catalog page) starts a round with only the questions in box 1, which means answered wrong or rated Hard. A question leaves box 1 when you answer it right and rate it Good or Easy.</li>" +
    "<li>Pause saves your round. You can resume it later, also after closing the page. The grid button next to the counter opens the overview of the round.</li>" +
    "</ul>" +

    "<h2>Exam simulation</h2>" +
    "<p>Catalogs with enough questions offer an exam: " + EXAM.QUESTIONS + " questions in " + EXAM.MINUTES + " minutes, drawn by domain weight as in the Exam Guide, without feedback until you submit. You can go back, change answers, mark questions and pause (the real exam cannot be paused). When time runs out, the exam is submitted automatically. Wrong answers go to box 1.</p>" +
    '<p class="hint">The pass line of ' + EXAM.PASS_PERCENT + " % is only an approximation of the real score of 720 out of 1000 points.</p>" +

    "<h2>Statistics and weak areas</h2>" +
    "<p>The statistics show your rate for the last " + CONFIG.LAST_ANSWERS_WINDOW + " answers and for all answers, your rate per domain, how much of a catalog you have seen, your latest rounds and exams. A domain is a weak area when its rate is below " + CONFIG.WEAK_THRESHOLD + " % after at least " + CONFIG.MIN_ANSWERS + " answers. The ready indicator is only a guide based on this app's questions and no promise for the real exam.</p>" +

    "<h2>Your data and backup</h2>" +
    "<p>Everything stays in this browser on this device. Nothing is sent to a server. Phone and laptop have separate progress. Clearing the browser data deletes your progress. \"Reset progress\" on a catalog page deletes it for that catalog.</p>" +
    "<p>At the bottom of the start page, <strong>Export progress</strong> saves a backup file with your progress, answer history, rounds, exams, reports and imported catalogs. <strong>Restore from backup</strong> merges such a file into the browser you are using: for a question that exists in both, the newer answer wins, and nothing is deleted. Use it to move your progress between phone and laptop, or to keep a copy.</p>" +
    '<p class="hint">Paused rounds, a running exam, the theme and your last round settings are not part of the backup. On an iPhone, a page saved to the home screen has its own storage, separate from Safari: use Export and Restore to move your progress into it.</p>' +

    "<h2>Install on your phone</h2>" +
    "<p>You can add the app to your home screen so it opens like a normal app, in full screen and with its own icon. After the first visit it also opens without a connection. This works when the app is opened from a web address (https), not from a file.</p>" +
    "<ul>" +
    "<li><strong>iPhone (Safari):</strong> tap the Share button, then Add to Home Screen.</li>" +
    "<li><strong>Android (Chrome):</strong> open the browser menu, then Install app or Add to Home screen.</li>" +
    "<li><strong>Computer (Chrome or Edge):</strong> click the install icon at the right end of the address bar.</li>" +
    "</ul>" +
    '<p class="hint">An installed app on the iPhone has its own storage, separate from Safari. Export your progress before you install and restore it in the installed app. After an update of the app, close and reopen it once to get the new version.</p>' +

    "<h2>Keyboard</h2>" +
    '<table class="help-table"><tbody>' + shortcuts + "</tbody></table>" +
    '<p class="hint">The light and dark theme can be switched at the top right of every page.</p>' +

    "<h2>Use your own questions</h2>" +
    "<p>You can import a catalog from a JSON file. The file is only read, nothing in it is run. It stays in this browser. Importing a catalog with the same id replaces it.</p>" +
    "<ol>" +
    "<li>Download the template below, or copy the prompt and give it to an AI together with your material. Check the questions it writes.</li>" +
    "<li>Save the result as a file ending in .json.</li>" +
    "<li>Press Import catalog on the start page and choose the file. The app checks it and names every problem it finds.</li>" +
    "</ol>" +
    '<div class="button-row">' +
    '<button class="button" data-action="download-template">Download template (JSON)</button>' +
    '<button class="button secondary" data-action="copy-prompt">Copy prompt for an AI</button>' +
    "</div>" +
    '<p class="hint"><strong>Copy prompt for an AI</strong> puts a ready-made instruction on your clipboard. Paste it into an AI chat (for example Claude) and replace three things in it: <code>[LANGUAGE]</code> (the language of the questions), <code>[NUMBER]</code> (how many questions) and <code>[PASTE YOUR MATERIAL HERE]</code> at the end (your text or notes). The AI then answers with the JSON file. If the button does not work, the same prompt is shown in a box further down on this page: select the text and copy it by hand.</p>' +
    "<h3>Fields</h3>" +
    '<table class="help-table fields"><thead><tr><th>Field</th><th>Needed</th><th>Meaning</th></tr></thead><tbody>' +
    "<tr><th scope=\"row\">id</th><td>yes</td><td>Letters, digits, - and _. It never changes. Progress is stored under it.</td></tr>" +
    "<tr><th scope=\"row\">title</th><td>yes</td><td>Name on the start page.</td></tr>" +
    "<tr><th scope=\"row\">description, basedOn</th><td>no</td><td>Short texts for the start page.</td></tr>" +
    "<tr><th scope=\"row\">createdAt, sourcesCheckedAt</th><td>no</td><td>Dates like 2026-10-20. The check date is shown next to the sources.</td></tr>" +
    "<tr><th scope=\"row\">scenarios</th><td>no</td><td>Background stories with id, title and description. A question points to one with scenario.</td></tr>" +
    "<tr><th scope=\"row\">questions[].id</th><td>yes</td><td>Unique in the catalog. Do not change it later, or the progress of that question is lost.</td></tr>" +
    "<tr><th scope=\"row\">domain</th><td>yes</td><td>D1 to D5. The statistics group by it. For other topics use D1 to D5 as five groups of your own.</td></tr>" +
    "<tr><th scope=\"row\">question</th><td>yes</td><td>The question text. For two correct answers end with (Select 2).</td></tr>" +
    "<tr><th scope=\"row\">options</th><td>yes</td><td>2 to " + limits.MAX_OPTIONS + " texts. 4 is usual, 5 for Select 2. The app shuffles them.</td></tr>" +
    "<tr><th scope=\"row\">correct</th><td>yes</td><td>Positions of the correct options, counted from 0. [1] or [1, 3].</td></tr>" +
    "<tr><th scope=\"row\">explanation</th><td>no</td><td>Why the correct answer is right.</td></tr>" +
    "<tr><th scope=\"row\">optionExplanations</th><td>no</td><td>One text per option, same order as options. Shown for wrong choices.</td></tr>" +
    "<tr><th scope=\"row\">source, docs</th><td>no</td><td>label, url and quote. Links must start with http:// or https://.</td></tr>" +
    "</tbody></table>" +
    '<p class="hint">Limits: file up to ' + Math.round(limits.MAX_FILE_BYTES / 1048576) + " MB, up to " + limits.MAX_QUESTIONS + " questions per catalog. Browsers store about 5 MB per site, so very large catalogs may not fit.</p>" +
    "<h3>The prompt</h3>" +
    '<p class="hint">Replace [LANGUAGE], [NUMBER] and the material at the end. Always read the questions before you use them: an AI can make mistakes.</p>' +
    '<pre class="code-block" tabindex="0">' + escapeHtml(catalogPromptText()) + "</pre>" +
    '<div class="button-row"><button class="button secondary" data-action="copy-prompt">Copy prompt for an AI</button></div>' +
    "<h2>About</h2>" +
    "<p>CCAR-F Study, version " + APP_VERSION + " (" + APP_BUILD_DATE + "). When a new version is published, the app shows a Reload button at the top. Your progress is kept.</p>" +
    "</section>";
}
