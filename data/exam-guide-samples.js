/* Official sample questions: the 12 questions of section 9 of the Exam Guide v1.0, word for word,
   with the explanations the guide gives for them (shortened into one sentence per option).
   The domain and scenario of each question were assigned by us from the guide's task statements.
   The guide itself is the source: source.quote is a verbatim excerpt of the explanation in section 9.
   Check with: node tools/check-catalog.js data/exam-guide-samples.js */
(function () {
  const GUIDE_URL = "https://everpath-course-content.s3-accelerate.amazonaws.com/instructor%2F6nizmqk8tpzpfjvt6qmmav7rh%2Fpublic%2F1783542750%2FClaude+Certified+Architect+%E2%80%93+Foundations+Exam+Guide.pdf";

  function guideSource(number, quote) {
    return { label: "Exam Guide v1.0, Section 9, Sample question " + number, url: GUIDE_URL, quote: quote };
  }

  const catalog = {
    id: "exam-guide-samples",
    title: "Exam Guide sample questions",
    fixedRound: true, // small catalog: every round uses all questions, no length or domain choice, no exam
    description: "The 12 official sample questions from section 9 of the Exam Guide v1.0, with the guide's own explanations.",
    createdAt: "2026-10-20",
    sourcesCheckedAt: "2026-10-20",
    basedOn: "Claude Certified Architect – Foundations Exam Guide v1.0 (July 2026), section 9",
    scenarios: [
      { id: "s1", title: "Customer Support Resolution Agent", description: "A support agent built with the Claude Agent SDK handles returns, billing disputes and account issues. It reaches backend systems through custom MCP tools (get_customer, lookup_order, process_refund, escalate_to_human) and should resolve most cases on first contact while knowing when to escalate." },
      { id: "s2", title: "Code Generation with Claude Code", description: "A development team uses Claude Code for code generation, refactoring, debugging and documentation, and wants to fit it into their workflow with slash commands, CLAUDE.md configuration and a sensible choice between plan mode and direct execution." },
      { id: "s3", title: "Multi-Agent Research System", description: "A coordinator agent built with the Claude Agent SDK delegates to specialized subagents for web search, document analysis, synthesis and report writing, and produces cited research reports." },
      { id: "s5", title: "Claude Code for Continuous Integration", description: "Claude Code runs inside a CI/CD pipeline to review code, generate tests and comment on pull requests. The feedback must be actionable with few false positives." }
    ],
    questions: [
      {
        id: "guide-q01", domain: "D1", scenario: "s1",
        question: "Production data shows that in 12% of cases, your agent skips get_customer entirely and calls lookup_order using only the customer's stated name, occasionally leading to misidentified accounts and incorrect refunds. What change would most effectively address this reliability issue?",
        options: [
          "Add a programmatic prerequisite that blocks lookup_order and process_refund calls until get_customer has returned a verified customer ID.",
          "Enhance the system prompt to state that customer verification via get_customer is mandatory before any order operations.",
          "Add few-shot examples showing the agent always calling get_customer first, even when customers volunteer order details.",
          "Implement a routing classifier that analyzes each request and enables only the subset of tools appropriate for that request type."
        ],
        correct: [0],
        explanation: "When a specific tool sequence is required for critical business logic, such as verifying customer identity before processing refunds, programmatic enforcement provides deterministic guarantees that prompt-based approaches cannot. Options B and C rely on probabilistic LLM compliance, which is insufficient when errors have financial consequences.",
        optionExplanations: [
          "Programmatic enforcement guarantees that get_customer runs and returns a verified ID before any order operation.",
          "Relies on probabilistic LLM compliance, which is insufficient when errors have financial consequences.",
          "Relies on probabilistic LLM compliance, which is insufficient when errors have financial consequences.",
          "Addresses tool availability rather than tool ordering, which is not the actual problem."
        ],
        source: guideSource(1, "programmatic enforcement provides deterministic guarantees that prompt-based approaches cannot")
      },
      {
        id: "guide-q02", domain: "D2", scenario: "s1",
        question: "Production logs show the agent frequently calls get_customer when users ask about orders (e.g., \"check my order #12345\"), instead of calling lookup_order. Both tools have minimal descriptions (\"Retrieves customer information\" / \"Retrieves order details\") and accept similar identifier formats. What's the most effective first step to improve tool selection reliability?",
        options: [
          "Add few-shot examples to the system prompt demonstrating correct tool selection patterns, with 5-8 examples showing order-related queries routing to lookup_order.",
          "Expand each tool's description to include input formats it handles, example queries, edge cases, and boundaries explaining when to use it versus similar tools.",
          "Implement a routing layer that parses user input before each turn and pre-selects the appropriate tool based on detected keywords and identifier patterns.",
          "Consolidate both tools into a single lookup_entity tool that accepts any identifier and internally determines which backend to query."
        ],
        correct: [1],
        explanation: "Tool descriptions are the primary mechanism LLMs use for tool selection. When descriptions are minimal, models lack the context to differentiate between similar tools. Expanding them directly addresses this root cause with a low-effort, high-leverage fix.",
        optionExplanations: [
          "Few-shot examples add token overhead without fixing the underlying issue.",
          "Richer descriptions address the root cause (minimal descriptions) with a low-effort, high-leverage fix.",
          "A routing layer is over-engineered and bypasses the LLM's natural language understanding.",
          "Consolidating tools is a valid architectural choice, but it requires more effort than a first step warrants when the immediate problem is inadequate descriptions."
        ],
        source: guideSource(2, "Tool descriptions are the primary mechanism LLMs use for tool selection")
      },
      {
        id: "guide-q03", domain: "D5", scenario: "s1",
        question: "Your agent achieves 55% first-contact resolution, well below the 80% target. Logs show it escalates straightforward cases (standard damage replacements with photo evidence) while attempting to autonomously handle complex situations requiring policy exceptions. What's the most effective way to improve escalation calibration?",
        options: [
          "Add explicit escalation criteria to your system prompt with few-shot examples demonstrating when to escalate versus resolve autonomously.",
          "Have the agent self-report a confidence score (1-10) before each response and automatically route requests to humans when confidence falls below a threshold.",
          "Deploy a separate classifier model trained on historical tickets to predict which requests need escalation before the main agent begins processing.",
          "Implement sentiment analysis to detect customer frustration levels and automatically escalate when negative sentiment exceeds a threshold."
        ],
        correct: [0],
        explanation: "Adding explicit escalation criteria with few-shot examples directly addresses the root cause: unclear decision boundaries. This is the proportionate first response before adding infrastructure.",
        optionExplanations: [
          "Explicit criteria with few-shot examples fix the unclear decision boundaries, which is the root cause.",
          "LLM self-reported confidence is poorly calibrated: the agent is already incorrectly confident on hard cases.",
          "Over-engineered: it requires labeled data and ML infrastructure when prompt optimization hasn't been tried.",
          "Solves a different problem entirely: sentiment doesn't correlate with case complexity, which is the actual issue."
        ],
        source: guideSource(3, "This is the proportionate first response before adding infrastructure")
      },
      {
        id: "guide-q04", domain: "D3", scenario: "s2",
        question: "You want to create a custom /review slash command that runs your team's standard code review checklist. This command should be available to every developer when they clone or pull the repository. Where should you create this command file?",
        options: [
          "In the .claude/commands/ directory in the project repository",
          "In ~/.claude/commands/ in each developer's home directory",
          "In the CLAUDE.md file at the project root",
          "In a .claude/config.json file with a commands array"
        ],
        correct: [0],
        explanation: "Project-scoped custom slash commands should be stored in the .claude/commands/ directory within the repository. These commands are version-controlled and automatically available to all developers when they clone or pull the repo.",
        optionExplanations: [
          "Commands in the repository's .claude/commands/ directory are version-controlled and shared with every developer.",
          "~/.claude/commands/ is for personal commands that aren't shared via version control.",
          "CLAUDE.md is for project instructions and context, not command definitions.",
          "Describes a configuration mechanism that doesn't exist in Claude Code."
        ],
        source: guideSource(4, "Project-scoped custom slash commands should be stored in the .claude/commands/ directory within the repository")
      },
      {
        id: "guide-q05", domain: "D3", scenario: "s2",
        question: "You've been assigned to restructure the team's monolithic application into microservices. This will involve changes across dozens of files and requires decisions about service boundaries and module dependencies. Which approach should you take?",
        options: [
          "Enter plan mode to explore the codebase, understand dependencies, and design an implementation approach before making changes.",
          "Start with direct execution and make changes incrementally, letting the implementation reveal the natural service boundaries.",
          "Use direct execution with comprehensive upfront instructions detailing exactly how each service should be structured.",
          "Begin in direct execution mode and only switch to plan mode if you encounter unexpected complexity during implementation."
        ],
        correct: [0],
        explanation: "Plan mode is designed for complex tasks involving large-scale changes, multiple valid approaches, and architectural decisions, which is exactly what a monolith-to-microservices restructuring requires. It enables safe codebase exploration and design before committing to changes.",
        optionExplanations: [
          "Plan mode enables safe exploration and design before committing to changes across dozens of files.",
          "Risks costly rework when dependencies are discovered late.",
          "Assumes you already know the right structure without exploring the code.",
          "Ignores that the complexity is already stated in the requirements, not something that might emerge later."
        ],
        source: guideSource(5, "Plan mode is designed for complex tasks involving large-scale changes, multiple valid approaches, and architectural decisions")
      },
      {
        id: "guide-q06", domain: "D3", scenario: "s2",
        question: "Your codebase has distinct areas with different coding conventions: React components use functional style with hooks, API handlers use async/await with specific error handling, and database models follow a repository pattern. Test files are spread throughout the codebase alongside the code they test (e.g., Button.test.tsx next to Button.tsx), and you want all tests to follow the same conventions regardless of location. What's the most maintainable way to ensure Claude automatically applies the correct conventions when generating code?",
        options: [
          "Create rule files in .claude/rules/ with YAML frontmatter specifying glob patterns to conditionally apply conventions based on file paths",
          "Consolidate all conventions in the root CLAUDE.md file under headers for each area, relying on Claude to infer which section applies",
          "Create skills in .claude/skills/ for each code type that include the relevant conventions in their SKILL.md files",
          "Place a separate CLAUDE.md file in each subdirectory containing that area's specific conventions"
        ],
        correct: [0],
        explanation: "Rules in .claude/rules/ with glob patterns (for example **/*.test.tsx) apply conventions automatically based on file paths regardless of directory location, which is essential for test files spread throughout the codebase.",
        optionExplanations: [
          "Glob-pattern rules apply conventions automatically by file path, wherever the files live.",
          "Relies on inference rather than explicit matching, making it unreliable.",
          "Skills require manual invocation or rely on Claude choosing to load them, which contradicts the need for deterministic automatic application based on file paths.",
          "Can't easily handle files spread across many directories, since CLAUDE.md files are directory-bound."
        ],
        source: guideSource(6, "allows conventions to be automatically applied based on file paths regardless of directory location")
      },
      {
        id: "guide-q07", domain: "D1", scenario: "s3",
        question: "After running the system on the topic \"impact of AI on creative industries,\" you observe that each subagent completes successfully: the web search agent finds relevant articles, the document analysis agent summarizes papers correctly, and the synthesis agent produces coherent output. However, the final reports cover only visual arts, completely missing music, writing, and film production. When you examine the coordinator's logs, you see it decomposed the topic into three subtasks: \"AI in digital art creation,\" \"AI in graphic design,\" and \"AI in photography.\" What is the most likely root cause?",
        options: [
          "The synthesis agent lacks instructions for identifying coverage gaps in the findings it receives from other agents.",
          "The coordinator agent's task decomposition is too narrow, resulting in subagent assignments that don't cover all relevant domains of the topic.",
          "The web search agent's queries are not comprehensive enough and need to be expanded to cover more creative industry sectors.",
          "The document analysis agent is filtering out sources related to non-visual creative industries due to overly restrictive relevance criteria."
        ],
        correct: [1],
        explanation: "The coordinator's logs reveal the root cause directly: it decomposed the topic into only visual arts subtasks, completely omitting music, writing, and film. The subagents executed their assigned tasks correctly; the problem is what they were assigned.",
        optionExplanations: [
          "Blames a downstream agent that is working correctly within its assigned scope.",
          "The coordinator's decomposition covers only visual arts, so the narrow assignments are the root cause.",
          "Blames a downstream agent that is working correctly within its assigned scope.",
          "Blames a downstream agent that is working correctly within its assigned scope."
        ],
        source: guideSource(7, "The subagents executed their assigned tasks correctly")
      },
      {
        id: "guide-q08", domain: "D5", scenario: "s3",
        question: "The web search subagent times out while researching a complex topic. You need to design how this failure information flows back to the coordinator agent. Which error propagation approach best enables intelligent recovery?",
        options: [
          "Return structured error context to the coordinator including the failure type, the attempted query, any partial results, and potential alternative approaches.",
          "Implement automatic retry logic with exponential backoff within the subagent, returning a generic \"search unavailable\" status only after all retries are exhausted.",
          "Catch the timeout within the subagent and return an empty result set marked as successful.",
          "Propagate the timeout exception directly to a top-level handler that terminates the entire research workflow."
        ],
        correct: [0],
        explanation: "Structured error context gives the coordinator the information it needs to make intelligent recovery decisions: retry with a modified query, try an alternative approach, or proceed with partial results.",
        optionExplanations: [
          "Structured error context lets the coordinator choose between retrying, an alternative approach, or partial results.",
          "A generic status hides valuable context from the coordinator, preventing informed decisions.",
          "Suppresses the error by marking failure as success, which prevents any recovery and risks incomplete research outputs.",
          "Terminates the entire workflow unnecessarily when recovery strategies could succeed."
        ],
        source: guideSource(8, "Structured error context gives the coordinator the information it needs to make intelligent recovery decisions")
      },
      {
        id: "guide-q09", domain: "D2", scenario: "s3",
        question: "During testing, you observe that the synthesis agent frequently needs to verify specific claims while combining findings. Currently, when verification is needed, the synthesis agent returns control to the coordinator, which invokes the web search agent, then re-invokes synthesis with results. This adds 2-3 round trips per task and increases latency by 40%. Your evaluation shows that 85% of these verifications are simple fact-checks (dates, names, statistics) while 15% require deeper investigation. What's the most effective approach to reduce overhead while maintaining system reliability?",
        options: [
          "Give the synthesis agent a scoped verify_fact tool for simple lookups, while complex verifications continue delegating to the web search agent through the coordinator.",
          "Have the synthesis agent accumulate all verification needs and return them as a batch to the coordinator at the end of its pass, which then sends them all to the web search agent at once.",
          "Give the synthesis agent access to all web search tools so it can handle any verification need directly without round-trips through the coordinator.",
          "Have the web search agent proactively cache extra context around each source during initial research, anticipating what the synthesis agent might need to verify."
        ],
        correct: [0],
        explanation: "A scoped verify_fact tool applies the principle of least privilege: the synthesis agent gets only what it needs for the 85% common case (simple fact verification), while complex cases keep the existing coordination pattern.",
        optionExplanations: [
          "A scoped tool covers the 85% simple cases and keeps the coordinator path for the complex 15%.",
          "Batching creates blocking dependencies, since synthesis steps may depend on earlier verified facts.",
          "Over-provisions the synthesis agent, violating separation of concerns.",
          "Relies on speculative caching that cannot reliably predict what the synthesis agent will need to verify."
        ],
        source: guideSource(9, "applies the principle of least privilege by giving the synthesis agent only what it needs for the 85% common case")
      },
      {
        id: "guide-q10", domain: "D3", scenario: "s5",
        question: "Your pipeline script runs claude \"Analyze this pull request for security issues\" but the job hangs indefinitely. Logs indicate Claude Code is waiting for interactive input. What's the correct approach to run Claude Code in an automated pipeline?",
        options: [
          "Add the -p flag: claude -p \"Analyze this pull request for security issues\"",
          "Set the environment variable CLAUDE_HEADLESS=true before running the command",
          "Redirect stdin from /dev/null: claude \"Analyze this pull request for security issues\" < /dev/null",
          "Add the --batch flag: claude --batch \"Analyze this pull request for security issues\""
        ],
        correct: [0],
        explanation: "The -p (or --print) flag is the documented way to run Claude Code in non-interactive mode. It processes the prompt, outputs the result to stdout, and exits without waiting for user input, which is exactly what CI/CD pipelines require.",
        optionExplanations: [
          "-p (or --print) runs Claude Code non-interactively and exits without waiting for input.",
          "References a feature that doesn't exist: there is no CLAUDE_HEADLESS environment variable.",
          "A Unix workaround that doesn't properly address Claude Code's command syntax.",
          "References a feature that doesn't exist: there is no --batch flag."
        ],
        source: guideSource(10, "The -p (or --print) flag is the documented way to run Claude Code in non-interactive mode")
      },
      {
        id: "guide-q11", domain: "D4", scenario: "s5",
        question: "Your team wants to reduce API costs for automated analysis. Currently, real-time Claude calls power two workflows: (1) a blocking pre-merge check that must complete before developers can merge, and (2) a technical debt report generated overnight for review the next morning. Your manager proposes switching both to the Message Batches API for its 50% cost savings. How should you evaluate this proposal?",
        options: [
          "Use batch processing for the technical debt reports only; keep real-time calls for pre-merge checks.",
          "Switch both workflows to batch processing with status polling to check for completion.",
          "Keep real-time calls for both workflows to avoid batch result ordering issues.",
          "Switch both to batch processing with a timeout fallback to real-time if batches take too long."
        ],
        correct: [0],
        explanation: "The Message Batches API offers 50% cost savings but has processing times up to 24 hours with no guaranteed latency SLA. That makes it unsuitable for blocking pre-merge checks where developers wait for results, but ideal for overnight batch jobs like technical debt reports.",
        optionExplanations: [
          "Matches each workflow to the right API: batch for the overnight report, real-time for the blocking check.",
          "Relying on 'often faster' completion isn't acceptable for blocking workflows.",
          "Reflects a misconception: batch results can be correlated using custom_id fields.",
          "Adds unnecessary complexity when the simpler solution is matching each API to its appropriate use case."
        ],
        source: guideSource(11, "has processing times up to 24 hours with no guaranteed latency SLA")
      },
      {
        id: "guide-q12", domain: "D4", scenario: "s5",
        question: "A pull request modifies 14 files across the stock tracking module. Your single-pass review analyzing all files together produces inconsistent results: detailed feedback for some files but superficial comments for others, obvious bugs missed, and contradictory feedback—flagging a pattern as problematic in one file while approving identical code elsewhere in the same PR. How should you restructure the review?",
        options: [
          "Split into focused passes: analyze each file individually for local issues, then run a separate integration-focused pass examining cross-file data flow.",
          "Require developers to split large PRs into smaller submissions of 3-4 files before the automated review runs.",
          "Switch to a higher-tier model with a larger context window to give all 14 files adequate attention in one pass.",
          "Run three independent review passes on the full PR and only flag issues that appear in at least two of the three runs."
        ],
        correct: [0],
        explanation: "Splitting reviews into focused passes directly addresses the root cause: attention dilution when processing many files at once. File-by-file analysis ensures consistent depth, while a separate integration pass catches cross-file issues.",
        optionExplanations: [
          "Focused passes fix attention dilution, and the integration pass still catches cross-file issues.",
          "Shifts the burden to developers without improving the system.",
          "Larger context windows don't solve attention quality issues.",
          "Would suppress detection of real bugs by requiring consensus on issues that may only be caught intermittently."
        ],
        source: guideSource(12, "directly addresses the root cause: attention dilution when processing many files at once")
      }
    ]
  };

  window.CATALOGS = window.CATALOGS || [];
  window.CATALOGS.push(catalog);
})();
