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
      { id: "s1", title: "Customer Support Resolution Agent", description: "You are building a customer support resolution agent using the Claude Agent SDK. The agent handles high-ambiguity requests like returns, billing disputes, and account issues. It has access to your backend systems through custom Model Context Protocol (MCP) tools (get_customer, lookup_order, process_refund, escalate_to_human). Your target is 80%+ first-contact resolution while knowing when to escalate. Primary domains: Agentic Architecture & Orchestration, Tool Design & MCP Integration, Context Management & Reliability" },
      { id: "s2", title: "Code Generation with Claude Code", description: "You are using Claude Code to accelerate software development. Your team uses it for code generation, refactoring, debugging, and documentation. You need to integrate it into your development workflow with custom slash commands, CLAUDE.md configurations, and understand when to use plan mode vs direct execution. Primary domains: Claude Code Configuration & Workflows, Context Management & Reliability" },
      { id: "s3", title: "Multi-Agent Research System", description: "You are building a multi-agent research system using the Claude Agent SDK. A coordinator agent delegates to specialized subagents: one searches the web, one analyzes documents, one synthesizes findings, and one generates reports. The system researches topics and produces comprehensive, cited reports. Primary domains: Agentic Architecture & Orchestration, Tool Design & MCP Integration, Context Management & Reliability" },
      { id: "s4", title: "Developer Productivity with Claude", description: "You are building developer productivity tools using the Claude Agent SDK. The agent helps engineers explore unfamiliar codebases, understand legacy systems, generate boilerplate code, and automate repetitive tasks. It uses the built-in tools (Read, Write, Bash, Grep, Glob) and integrates with Model Context Protocol (MCP) servers. Primary domains: Tool Design & MCP Integration, Claude Code Configuration & Workflows, Agentic Architecture & Orchestration" },
      { id: "s5", title: "Claude Code for Continuous Integration", description: "You are integrating Claude Code into your Continuous Integration/Continuous Deployment (CI/CD) pipeline. The system runs automated code reviews, generates test cases, and provides feedback on pull requests. You need to design prompts that provide actionable feedback and minimize false positives. Primary domains: Claude Code Configuration & Workflows, Prompt Engineering & Structured Output" },
      { id: "s6", title: "Structured Data Extraction", description: "You are building a structured data extraction system using Claude. The system extracts information from unstructured documents, validates the output using JavaScript Object Notation (JSON) schemas, and maintains high accuracy. It must handle edge cases gracefully and integrate with downstream systems. Primary domains: Prompt Engineering & Structured Output, Context Management & Reliability" }
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
