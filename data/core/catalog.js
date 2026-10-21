/* Core catalog: metadata, scenarios and the helpers the domain files use.
   The questions live in data/core/d1.js … d5.js (one file per exam domain), loaded after this file.
   Every question is written against one task statement of the official Exam Guide;
   source.quote is a verbatim excerpt of it (PDF ligatures and line breaks normalized).
   Style and difficulty follow docs/question-style-guide.md. Check with: node tools/check-catalog.js data/core */
(function () {
  const EXAM_GUIDE_URL = "https://everpath-course-content.s3-accelerate.amazonaws.com/instructor%2F6nizmqk8tpzpfjvt6qmmav7rh%2Fpublic%2F1783542750%2FClaude+Certified+Architect+%E2%80%93+Foundations+Exam+Guide.pdf";

  const catalog = {
    id: "core-ccar-f",
    title: "CCAR-F Core Catalog",
    description: "Exam-style questions based on the official Exam Guide v1.0. Reviewed by AI, spot-checked by a human.",
    createdAt: "2026-10-20",
    sourcesCheckedAt: "2026-10-20",
    basedOn: "Claude Certified Architect – Foundations Exam Guide v1.0 (July 2026)",
    scenarios: [
      { id: "s1", title: "Customer Support Resolution Agent", description: "A support agent built with the Claude Agent SDK handles returns, billing disputes and account issues. It reaches backend systems through custom MCP tools (get_customer, lookup_order, process_refund, escalate_to_human) and should resolve most cases on first contact while knowing when to escalate." },
      { id: "s2", title: "Code Generation with Claude Code", description: "A development team uses Claude Code for code generation, refactoring, debugging and documentation, and wants to fit it into their workflow with slash commands, CLAUDE.md configuration and a sensible choice between plan mode and direct execution." },
      { id: "s3", title: "Multi-Agent Research System", description: "A coordinator agent built with the Claude Agent SDK delegates to specialized subagents for web search, document analysis, synthesis and report writing, and produces cited research reports." },
      { id: "s4", title: "Developer Productivity with Claude", description: "An Agent SDK agent helps engineers explore unfamiliar codebases, understand legacy systems and automate repetitive tasks, using the built-in tools (Read, Write, Bash, Grep, Glob) and MCP servers." },
      { id: "s5", title: "Claude Code for Continuous Integration", description: "Claude Code runs inside a CI/CD pipeline to review code, generate tests and comment on pull requests. The feedback must be actionable with few false positives." },
      { id: "s6", title: "Structured Data Extraction", description: "A system extracts information from unstructured documents, validates it against JSON schemas and passes it to downstream systems. It must stay accurate and handle edge cases." }
    ],
    questions: []
  };

  window.CATALOGS = window.CATALOGS || [];
  window.CATALOGS.push(catalog);

  // Used by the domain files
  window.CORE_CATALOG = {
    addQuestions: function (questions) {
      Array.prototype.push.apply(catalog.questions, questions);
    },
    examGuideSource: function (taskStatement, quote) {
      return { label: "Exam Guide v1.0, Task Statement " + taskStatement, url: EXAM_GUIDE_URL, quote: quote };
    }
  };
})();
