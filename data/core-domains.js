/* One catalog per exam domain, made from the questions of the core catalog (data/core/*).
   No question is copied: each domain catalog holds the same question objects, so a fix in data/core/ shows up here too.
   progressId points at the core catalog, so answers, boxes and statistics are shared with it.
   Load this file after data/core/d5.js. */
(function () {
  const core = (window.CATALOGS || []).find(function (catalog) { return catalog.id === "core-ccar-f"; });
  if (!core) return;

  // Names and weights as in the Exam Guide v1.0, section 4 (the weights also stand in EXAM.DOMAIN_WEIGHTS in js/config.js)
  const domains = [
    { domain: "D1", name: "Agentic Architecture & Orchestration", weight: 27 },
    { domain: "D2", name: "Tool Design & MCP Integration", weight: 18 },
    { domain: "D3", name: "Claude Code Configuration & Workflows", weight: 20 },
    { domain: "D4", name: "Prompt Engineering & Structured Output", weight: 20 },
    { domain: "D5", name: "Context Management & Reliability", weight: 15 }
  ];

  domains.forEach(function (item, position) {
    window.CATALOGS.push({
      id: "core-ccar-f-" + item.domain.toLowerCase(),
      progressId: core.id,
      title: "Domain " + (position + 1) + ": " + item.name,
      description: "Only the " + item.domain + " questions of the core catalog. Exam Guide weight: " + item.weight + " %.",
      createdAt: core.createdAt,
      sourcesCheckedAt: core.sourcesCheckedAt,
      basedOn: core.basedOn,
      scenarios: core.scenarios,
      noExam: true, // the exam simulation needs questions from every domain
      questions: core.questions.filter(function (question) { return question.domain === item.domain; })
    });
  });
})();
