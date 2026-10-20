/* Domain 1: Agentic Architecture & Orchestration (Exam Guide weight 27%) */
(function () {
  const source = window.CORE_CATALOG.examGuideSource;

  window.CORE_CATALOG.addQuestions([
    {
      id: "core-d1-001",
      domain: "D1",
      scenario: "s4",
      question: "Your codebase exploration agent sometimes writes summaries that mention files it never read. In the traces of these runs, the final API response contains a short text block such as \"Next I'll look at the config loader.\" followed by a Read tool_use block, and the loop returns that text to the engineer as the answer. Runs in which Claude's responses contain only tool_use blocks until the final summary work correctly. What change to the loop fixes this most reliably?",
      options: [
        "Return a response to the engineer once its text is longer than 200 characters or contains a heading such as \"Summary\", so progress notes are skipped.",
        "Base the decision on stop_reason: run the requested tools and send their results back while Claude asks for tool use, and finish only when Claude ends its turn.",
        "Add an instruction to the system prompt that Claude must never write text in the same response as a tool call, so that mixed responses no longer occur.",
        "Scan the text for phrases that announce further work, such as \"next\", \"let me\" or \"I will\", and continue the loop whenever one of them appears."
      ],
      correct: [1],
      explanation: "The Messages API reports why each response ended. stop_reason \"tool_use\" means Claude is waiting for tool results, even when the response also contains text; \"end_turn\" means Claude has finished. Driving the loop by this field executes every requested Read before the summary is written, so the summary only refers to files that were actually read. Content-based checks such as text length or phrases only guess at completion and fail on mixed responses like the ones in the traces.",
      optionExplanations: [
        "This guesses completion from the content of the response: a long note next to a tool call would still end the loop, while the API states explicitly why the response ended.",
        "stop_reason is \"tool_use\" when Claude wants tools executed and \"end_turn\" when it is finished, so the loop continues and stops exactly when it should.",
        "Text next to a tool call is legitimate, and a prompt instruction is only followed probabilistically, so the loop would still stop early in some runs.",
        "Parsing natural-language signals to decide whether the loop ends is listed in the guide as an anti-pattern; phrasing varies and the check will miss cases."
      ],
      source: source("1.1", "continues when stop_reason is \"tool_use\" and terminates when stop_reason is \"end_turn\""),
      docs: [
        { label: "Claude API docs: How tool use works", url: "https://platform.claude.com/docs/en/agents-and-tools/tool-use/how-tool-use-works.md", quote: "In practice this reads as: while stop_reason == \"tool_use\", execute the tools and continue the conversation." },
        { label: "Claude API docs: Handle tool calls", url: "https://platform.claude.com/docs/en/agents-and-tools/tool-use/handle-tool-calls.md", quote: "The response will have a stop_reason of tool_use and one or more tool_use content blocks" }
      ]
    },
    {
      id: "core-d1-002",
      domain: "D1",
      objectives: ["O03"],
      scenario: "s3",
      question: "For the topic \"remote work and productivity\", the web search subagent returns 14 relevant sources and the document analysis subagent summarizes six studies correctly. The final report, however, cites none of these sources and relies on general statements. The coordinator's logs show that it invoked the synthesis subagent through the Task tool with the prompt \"Synthesize the research findings collected so far into a cited summary.\" What is the most effective fix?",
      options: [
        "Pass only the list of source URLs to the synthesis subagent and give it a fetch tool, so that it can read and cite the sources itself.",
        "Update the synthesis subagent's AgentDefinition so that its system prompt tells it to always build on the findings gathered by the other subagents.",
        "Run the synthesis subagent on a model with a larger context window, so that it can keep all of the earlier findings available while writing.",
        "Pass the search results and document summaries, together with their source URLs, as part of the prompt the coordinator sends to the synthesis subagent."
      ],
      correct: [3],
      explanation: "Subagents start with an isolated context: they do not see the coordinator's conversation or other subagents' results unless these are written into their prompt. The prompt \"Synthesize the findings collected so far\" refers to findings the synthesis subagent never received, so it falls back on general knowledge. Passing the search results and document summaries together with their source URLs gives it both the content and the metadata it needs for citations.",
      optionExplanations: [
        "The sources survive, but the analysed findings are lost, the documents are processed twice, and the synthesis agent gets a tool outside its role.",
        "A system prompt cannot give the subagent access to findings it never received; instructions do not replace explicit context.",
        "The findings never reach the subagent at all, so a larger context window has nothing more to hold.",
        "Subagents do not inherit the coordinator's conversation history, so the findings and their sources have to be handed over explicitly in the prompt."
      ],
      source: source("1.3", "Including complete findings from prior agents directly in the subagent's prompt"),
      docs: [
        { label: "Agent SDK docs: Subagents", url: "https://code.claude.com/docs/en/agent-sdk/subagents.md", quote: "The only content you pass from parent to subagent is the Agent tool's prompt string" },
        { label: "Agent SDK docs: Subagents", url: "https://code.claude.com/docs/en/agent-sdk/subagents.md", quote: "Its own system prompt (AgentDefinition.prompt) and the Agent tool's prompt" }
      ]
    },
    {
      id: "core-d1-003",
      domain: "D1",
      objectives: ["O01"],
      scenario: "s3",
      question: "A research run on a broad topic takes more than six minutes. The coordinator splits the topic into four independent subtopics and delegates each one to a web search subagent through the Task tool; each subagent finishes in about 90 seconds. The trace shows that the four subagent executions start at 0:05, 1:40, 3:15 and 4:50, each one right after the previous one has returned. Which change reduces the end-to-end latency the most without reducing coverage?",
      options: [
        "Have the coordinator request all four subagent tasks within the same response, so that they run concurrently instead of one after another.",
        "Use fork_session to branch the coordinator into four sessions, one per subtopic, and merge the four resulting reports at the end of the run.",
        "Submit the four subagent requests through the Message Batches API, which processes them together and at half the cost of individual calls.",
        "Reduce each subagent's search depth, so that each of the four runs finishes in about 45 seconds instead of 90 seconds."
      ],
      correct: [0],
      explanation: "The trace shows the four subagents running strictly one after another, although the subtopics are independent. A coordinator can spawn several subagents in parallel by emitting multiple Task tool calls in the same response. The run then takes roughly as long as the slowest subagent, about 90 seconds plus coordination, instead of more than six minutes, while every subtopic is still researched to the same depth. Note: in current Claude Code the Task tool is called Agent; Task still works as an alias.",
      optionExplanations: [
        "Several Task tool calls in one coordinator response spawn the subagents in parallel, so the run takes about as long as the slowest subagent.",
        "The batch API saves cost but is asynchronous with no latency guarantee (up to 24 hours), and a batch request cannot run client-side tools such as subagent delegation in a multi-turn loop.",
        "The batch API saves cost but gives no latency guarantee and does not support multi-turn tool calling within a request.",
        "Shallower searches cut coverage, which the requirement rules out, and the four runs would still happen one after another."
      ],
      source: source("1.3", "emitting multiple Task tool calls in a single coordinator response rather than across separate turns"),
      docs: [
        { label: "Agent SDK docs: Subagents", url: "https://code.claude.com/docs/en/agent-sdk/subagents.md", quote: "multiple subagents can run concurrently, so independent subtasks finish in the time of the slowest one rather than the sum of all of them." },
        { label: "Claude API docs: Parallel tool use", url: "https://platform.claude.com/docs/en/agents-and-tools/tool-use/parallel-tool-use.md", quote: "By default, Claude may call multiple tools in a single response." }
      ]
    },
    {
      id: "core-d1-004",
      domain: "D1",
      scenario: "s1",
      question: "Your support agent may issue refunds up to $500 on its own; anything above must be approved by a human. In production, about 1 in 200 refund conversations still ends with process_refund being executed for amounts between $520 and $900, usually after long, emotional exchanges. The agent's 80% first-contact resolution target must not suffer, and finance requires that no refund above $500 is ever executed without approval. What is the most appropriate change?",
      options: [
        "Detect amounts above $500 in the customer's messages and, in those turns, force a call to escalate_to_human through the tool_choice setting.",
        "Remove process_refund from the agent's tools and send every refund request to a human, so that no refund can ever be executed automatically.",
        "Intercept process_refund calls before they execute and, when the amount exceeds $500, block the call and route the case to escalate_to_human.",
        "Add a PostToolUse hook on process_refund that checks the refunded amount and alerts the finance team whenever it is above $500."
      ],
      correct: [2],
      explanation: "Finance needs a guarantee, and prompt instructions or few-shot examples only lower the failure rate. A hook that intercepts process_refund before it executes can check the amount in code, block every call above $500 and hand the case to escalate_to_human. Refunds up to $500 still run automatically, so the first-contact resolution target is not affected. A PostToolUse hook would run too late, because the refund would already have been paid out.",
      optionExplanations: [
        "The amount the agent refunds is not always the amount the customer mentions, so keyword detection misses cases and also escalates refunds that would have been small.",
        "This guarantees compliance but sends every small refund to a human as well, which sacrifices the first-contact resolution target.",
        "A hook that intercepts the outgoing tool call enforces the limit deterministically and redirects only the policy-violating cases to a human.",
        "A PostToolUse hook runs after the refund has already been executed, so it can report the violation but not prevent it."
      ],
      source: source("1.5", "Choosing hooks over prompt-based enforcement when business rules require guaranteed compliance"),
      docs: [
        { label: "Agent SDK docs: Hooks", url: "https://code.claude.com/docs/en/agent-sdk/hooks.md", quote: "Block dangerous operations before they execute, like destructive shell commands or unauthorized file access" },
        { label: "Claude Code docs: Hooks guide", url: "https://code.claude.com/docs/en/hooks-guide.md", quote: "PostToolUse hooks can't undo actions since the tool has already executed." }
      ]
    },
    {
      id: "core-d1-005",
      domain: "D1",
      objectives: ["O07"],
      scenario: "s3",
      question: "A usage analysis of your research system shows that 60% of incoming queries are narrow factual questions, such as \"When did the EU AI Act enter into force?\". Every query still passes through all four subagents (search, document analysis, synthesis and report writing), which takes about four minutes and costs roughly $0.80 per query. Analysts complain about waiting for simple answers, while broad questions do benefit from the full pipeline. What is the most effective change?",
      options: [
        "Let the coordinator assess what each query requires and invoke only the subagents that this particular query actually needs.",
        "Keep the full pipeline, but run the document analysis and report-writing subagents on a smaller and cheaper model for every query.",
        "Run all four subagents in parallel for every query, so that the full pipeline finishes faster without changing which subagents are used.",
        "Cache the final reports of earlier queries and return a cached report whenever a new query is sufficiently similar to an earlier one."
      ],
      correct: [0],
      explanation: "The coordinator is the component that understands the query, so it should decide which subagents a query actually needs instead of routing everything through the full pipeline. A narrow factual question can be answered with a search and a short synthesis, which cuts both waiting time and cost, while broad questions still get document analysis and a full report. This needs no extra infrastructure and keeps one system for both kinds of query.",
      optionExplanations: [
        "Dynamic selection matches the work to the query, so simple questions get fast, cheap answers and broad questions keep the full pipeline.",
        "A cheaper model lowers the cost per step, but every narrow question still runs through four stages it does not need, so the waiting time largely remains.",
        "The stages depend on each other (synthesis needs the search results), so they cannot simply run in parallel, and the cost stays the same.",
        "Caching only helps for repeated questions and risks outdated answers; new narrow questions would still run through the whole pipeline."
      ],
      source: source("1.2", "dynamically select which subagents to invoke rather than always routing through the full pipeline"),
      docs: [
        { label: "Claude API docs: Prompting best practices", url: "https://platform.claude.com/docs/en/build-with-claude/prompt-engineering/claude-prompting-best-practices.md", quote: "Claude Opus 4.6 has a strong predilection for subagents and may spawn them in situations where a simpler, direct approach would suffice." },
        { label: "Claude Code docs: Subagents", url: "https://code.claude.com/docs/en/sub-agents.md", quote: "Claude uses each subagent's description to decide when to delegate tasks." }
      ]
    },
    {
      id: "core-d1-006",
      domain: "D1",
      objectives: ["O03"],
      scenario: "s1",
      question: "When your support agent escalates, it calls escalate_to_human with a short note such as \"Customer needs help with a refund.\" Human agents work in a separate ticket tool, see only this note, and spend on average six minutes per case asking the customer again for their account, the order and what has already been tried. Conversations before escalation average 25 turns. How should the escalation be improved?",
      options: [
        "Have the agent write a free-text paragraph that summarizes the conversation in its own words, and attach it to the escalation.",
        "Let human agents look up the customer and the order themselves through an internal dashboard that calls get_customer and lookup_order.",
        "Have the agent pass a structured case record: who the customer is, what went wrong, what was already tried, and what it suggests next.",
        "Attach the full 25-turn conversation transcript to every escalation, so that the human agent can read everything the customer has said."
      ],
      correct: [2],
      explanation: "Human agents do not see the conversation, so everything they need has to travel with the escalation. A structured handoff with fixed fields, such as the customer, the root cause found during the investigation, what was already tried and a recommended action, lets them continue where the agent stopped instead of starting over. Fixed fields make sure the key facts are always present and quick to find, which a free-text summary or a raw transcript does not guarantee.",
      optionExplanations: [
        "A free-text summary is better than the current note, but its content and length vary from case to case, and key facts such as the root cause may be missing.",
        "Account data alone does not tell the human what went wrong, what was already tried, or what the agent recommends.",
        "A structured record hands over the key facts and the agent's findings in a form the human can act on immediately.",
        "A 25-turn transcript takes time to read, and the key facts are scattered across it; a distilled, structured handoff is faster to act on."
      ],
      source: source("1.4", "Compiling structured handoff summaries (customer ID, root cause, refund amount, recommended action)")
    },
    {
      id: "core-d1-007",
      domain: "D1",
      objectives: ["O07"],
      scenario: "s4",
      question: "Engineers asked your agent to document the undocumented internal API of the logistics platform, about 220 endpoints. The agent runs a fixed pipeline that walks through the route files alphabetically and writes one page per endpoint. After a day, half of the pages describe deprecated or health-check endpoints, the core shipment endpoints are still missing, and many pages are wrong because a shared authentication middleware rewrites requests in a module the agent only reached at the end. How should the task be decomposed?",
      options: [
        "Keep the fixed pipeline but split the route files across parallel subagents, so that all 220 endpoints are documented much faster.",
        "Write one page per endpoint in separate passes, then run a final integration pass that checks the pages for consistency across endpoints.",
        "Skip all endpoints whose path contains \"internal\", \"health\" or \"legacy\", so that the effort goes into the endpoints that matter.",
        "Investigate first which endpoints matter and how requests flow through them, document in that order, and add subtasks as new findings appear."
      ],
      correct: [3],
      explanation: "Documenting an unknown API is an open-ended task: which endpoints matter and which shared components shape their behavior only becomes clear while investigating. A fixed pipeline cannot react to that, which explains the wasted pages and the errors caused by the middleware discovered too late. An adaptive plan starts with an investigation, prioritizes the important endpoints, and generates new subtasks as discoveries are made, so the effort goes where it matters and findings feed back into the work.",
      optionExplanations: [
        "Parallel subagents make the same unprioritized pipeline faster but still document unimportant endpoints and discover the middleware too late.",
        "Separate passes plus an integration pass suit predictable multi-step work such as reviews; here the missing piece is prioritization and adaptation.",
        "A path-based heuristic guesses importance from names, misses important endpoints with other names, and does not solve the middleware problem.",
        "An adaptive investigation plan prioritizes by importance and turns discoveries, such as the shared middleware, into new subtasks."
      ],
      source: source("1.6", "The value of adaptive investigation plans that generate subtasks based on what is discovered at each step"),
      docs: [
        { label: "Claude Code docs: Best practices", url: "https://code.claude.com/docs/en/best-practices.md", quote: "Letting Claude jump straight to coding can produce code that solves the wrong problem. Use plan mode to separate exploration from execution." }
      ]
    },
    {
      id: "core-d1-008",
      domain: "D1",
      objectives: ["O02"],
      scenario: "s4",
      question: "Yesterday you analyzed the authentication module with Claude Code in a named session, \"auth-investigation\", reading 45 files and noting several suspected race conditions. Overnight, the team merged a large refactoring that changed 30 of those 45 files, including the ones with the suspected race conditions. Today you want to continue the investigation. What is the most reliable way to proceed?",
      options: [
        "Resume the session with --resume auth-investigation and tell Claude which files changed, so that it can re-analyze just those files.",
        "Start a new session and give it a structured summary of yesterday's findings, so that the current code is analyzed from a clean baseline.",
        "Resume the session with --resume auth-investigation and continue directly, since the earlier analysis still contains the relevant findings.",
        "Use fork_session on yesterday's session to create a branch, and compare the analysis in the branch with the original session."
      ],
      correct: [1],
      explanation: "Resuming is worthwhile when most of the earlier context is still valid. Here two thirds of the analyzed files changed, including the suspicious ones, so most of yesterday's tool results are stale and would mislead the analysis. Starting fresh with a structured summary of the findings keeps the useful conclusions while Claude reads the current code. Resuming with a list of changed files is the right move when only a few files have changed.",
      optionExplanations: [
        "Informing a resumed session about specific changes works when few files changed; with 30 of 45 changed, most of the old context is stale.",
        "A fresh session with injected summaries avoids stale tool results while keeping yesterday's conclusions.",
        "Continuing without mentioning the changes lets Claude reason on file contents that no longer exist.",
        "fork_session is for exploring divergent approaches from a shared baseline; a fork would inherit the same stale results."
      ],
      source: source("1.7", "starting fresh with injected summaries (when prior tool results are stale)"),
      docs: [
        { label: "Agent SDK docs: Sessions", url: "https://code.claude.com/docs/en/agent-sdk/sessions.md", quote: "Capture the results you need (analysis output, decisions, file diffs) as application state and pass them into a fresh session's prompt." },
        { label: "Claude Code docs: CLI reference", url: "https://code.claude.com/docs/en/cli-reference.md", quote: "Resume a specific session by ID or name, or show an interactive picker to choose a session." }
      ]
    },
    {
      id: "core-d1-009",
      domain: "D1",
      objectives: ["O07"],
      scenario: "s3",
      question: "Reviewers rate 30% of your research reports as incomplete. In the trace for \"economics of battery recycling\", the search subagent returned 23 sources: 21 on collection costs and processing plants, one press release that mentions regulation in passing, and none on subsidies or tax incentives. The final report covers costs and plants in depth and gives regulatory incentives a single sentence. Synthesis is the last step before the report goes out. Which change would improve coverage the most?",
      options: [
        "Allow the synthesis subagent to request extra searches from the search subagent on its own whenever a section looks thin.",
        "Split each topic into more subtopics before searching, so that every subtopic gets its own search subagent from the very start.",
        "After synthesis, have the coordinator compare the draft with the research question, send new searches for weak sections, and redo the synthesis.",
        "Have the synthesis subagent mark thinly supported sections, and deliver the report to the user together with these markers."
      ],
      correct: [2],
      explanation: "The trace shows that the first search simply did not find material on incentives, and nothing in the pipeline noticed. A coordinator that evaluates the synthesis against the research question can spot thin sections, send targeted searches for exactly those areas, and run the synthesis again until coverage is sufficient. A finer split upfront still runs only once and cannot react to what the first round missed, and markers only report the gap instead of closing it.",
      optionExplanations: [
        "This can close gaps, but it bypasses the coordinator, which then loses control over what is researched and cannot handle errors or routing consistently.",
        "Finer decomposition helps, but it is still a single pass; if a subtopic again returns little, nothing notices or follows up.",
        "An evaluation-and-refinement loop finds the thin areas after the fact and closes them with targeted research.",
        "Marking gaps is transparent, but it only reports a problem that a follow-up search could often solve."
      ],
      source: source("1.2", "Implementing iterative refinement loops where the coordinator evaluates synthesis output for gaps"),
      docs: [
        { label: "Claude API docs: Prompting best practices", url: "https://platform.claude.com/docs/en/build-with-claude/prompt-engineering/claude-prompting-best-practices.md", quote: "This structured approach helps Claude work through large corpora methodically and iteratively critique its findings." },
        { label: "Claude API docs: Prompting best practices", url: "https://platform.claude.com/docs/en/build-with-claude/prompt-engineering/claude-prompting-best-practices.md", quote: "Provide clear success criteria: Define what constitutes a successful answer to your research question." }
      ]
    },
    {
      id: "core-d1-010",
      domain: "D1",
      scenario: "s1",
      question: "In about 5% of refund conversations, your support agent quoted amounts a hundred times too high or told customers that a parcel arrived after the return cutoff when it had arrived before. The tool results in these traces show that the payments tool reports amounts as integer cents and the order tool as decimal euros, and that the shipping tool uses local time while the order tool uses UTC. The backend teams cannot change their APIs this quarter. What is the most reliable fix?",
      options: [
        "Convert amounts and times from all tools into one unit and one time zone in code after each tool call, before the results reach the agent.",
        "Describe the units and time zones of each tool in the system prompt, with examples, so that the agent can convert the values correctly itself.",
        "Give the agent a calculation tool that it can call whenever it needs to compare amounts or times that come from different backend tools.",
        "Have the agent restate every amount and date it relies on and ask the customer to confirm them before it takes any action."
      ],
      correct: [0],
      explanation: "The agent has to reconcile cents with euros and local time with UTC on its own, and it gets this wrong in a noticeable share of cases. A hook that runs after each tool call can normalize these values in code before the model processes them, so the agent always sees one unit and one time zone. This is deterministic, needs no backend changes, and removes the source of the errors instead of asking the model to be more careful.",
      optionExplanations: [
        "Normalizing tool results in code before the model sees them removes the inconsistency independent of the model's behavior.",
        "Explaining the formats helps, but the model still has to convert them correctly every time, which is exactly where it fails.",
        "A calculation tool helps only when the agent recognizes that a conversion is needed and remembers to use it.",
        "Customers cannot verify internal timestamps or units reliably, and this adds friction without removing the cause of the errors."
      ],
      source: source("1.5", "Implementing PostToolUse hooks to normalize heterogeneous data formats"),
      docs: [
        { label: "Agent SDK docs: Hooks", url: "https://code.claude.com/docs/en/agent-sdk/hooks.md", quote: "To replace the tool's output before Claude sees it, set updatedToolOutput, which works for any tool in both SDKs." },
        { label: "Claude Code docs: Hooks reference", url: "https://code.claude.com/docs/en/hooks.md", quote: "PostToolUse hooks fire after a tool has already executed successfully." }
      ]
    },
    {
      id: "core-d1-011",
      domain: "D1",
      objectives: ["O04"],
      scenario: "s3",
      question: "The coordinator's prompt for the search subagent prescribes twelve steps, starting with five queries built from fixed phrase patterns. Traces show that for niche topics, three of the five queries return nothing useful and the subagent delivers three sources. For broad topics, it returns after the fifth query, and reviewers list a dozen relevant sources it never found. What should change in the coordinator's instructions?",
      options: [
        "Keep the twelve steps, but allow the subagent to skip any step whose query returns nothing useful and continue with the next one.",
        "Remove the instructions and pass only the topic, so that the subagent decides everything about the search entirely on its own.",
        "Raise the fixed number of queries from five to fifteen, so that broad topics are covered and niche topics get more attempts.",
        "Tell the subagent what the report must answer and how to judge source quality and completeness, and leave the choice of queries to it."
      ],
      correct: [3],
      explanation: "A fixed procedure cannot adapt to what the subagent finds: it wastes queries on niche topics and stops too early on broad ones. Stating what the research has to achieve and what counts as a good source and sufficient coverage gives the subagent room to choose and refine its own queries, while it still knows what a good result looks like. That combination makes the subagent adaptable without leaving it without direction.",
      optionExplanations: [
        "Skipping empty steps saves effort on niche topics, but broad topics still stop after the fixed queries.",
        "Passing only the topic gives flexibility but removes any shared standard for what good results look like.",
        "A larger fixed number wastes effort on niche topics and still caps broad topics at an arbitrary limit.",
        "A goal plus quality criteria lets the subagent adapt its search to each topic while aiming at the same standard."
      ],
      source: source("1.3", "Designing coordinator prompts that specify research goals and quality criteria rather than step-by-step procedural instructions"),
      docs: [
        { label: "Claude API docs: Prompting best practices", url: "https://platform.claude.com/docs/en/build-with-claude/prompt-engineering/claude-prompting-best-practices.md", quote: "Provide clear success criteria: Define what constitutes a successful answer to your research question." },
        { label: "Claude API docs: Prompting best practices", url: "https://platform.claude.com/docs/en/build-with-claude/prompt-engineering/claude-prompting-best-practices.md", quote: "Prefer general instructions over prescriptive steps. A prompt like \"think thoroughly\" often produces better reasoning than a hand-written step-by-step plan." }
      ]
    },
    {
      id: "core-d1-012",
      domain: "D1",
      objectives: ["O01"],
      scenario: "s1",
      question: "A customer writes in one message that their last invoice still charged a cancelled add-on, that loyalty points from two orders are missing, and that the delivery address of an upcoming order must change. In such multi-issue messages, 25% of customers have to write again. The transcripts show the first issue resolved in detail, the second answered in one sentence, and the third often not answered at all. How should the agent handle messages like this?",
      options: [
        "Resolve only the first issue, and tell the customer that the other issues will be handled in follow-up messages one at a time.",
        "Identify each request first, work on all of them at once with the customer's account details available to each, and answer everything in one reply.",
        "Route each issue to a separate specialist subagent without shared context, and send the customer one separate reply per issue.",
        "Keep handling the issues one after another, but end with a question asking whether anything else is still open."
      ],
      correct: [1],
      explanation: "When a multi-issue message is handled as one long task, later issues get less attention or drop out. Making each request an explicit item, investigating them in parallel with the same customer context, and then combining the results into one reply ensures that every issue gets the same care and that the answers fit together. The customer receives a complete resolution instead of having to follow up.",
      optionExplanations: [
        "This stretches a solvable case over several exchanges and leaves the customer waiting for issues the agent could handle now.",
        "Explicit items, parallel investigation with shared context and one combined reply resolve all issues completely.",
        "Separate subagents without shared context repeat lookups, may contradict each other, and send the customer several disconnected answers.",
        "A closing question may catch a forgotten issue, but only after the customer notices; the uneven handling remains."
      ],
      source: source("1.4", "Decomposing multi-concern customer requests into distinct items, then investigating each in parallel using shared context"),
      docs: [
        { label: "Claude API docs: Parallel tool use", url: "https://platform.claude.com/docs/en/agents-and-tools/tool-use/parallel-tool-use.md", quote: "Independent, read-only operations are usually safe to run in parallel for lower latency." }
      ]
    },
    {
      id: "core-d1-013",
      domain: "D1",
      objectives: ["O07"],
      scenario: "s4",
      question: "Your codebase assistant always runs the same steps: Glob for candidate files, Read every match, Grep for related symbols, then answer. A question like \"Which Node version does the build use?\" triggers 38 tool calls and takes three minutes. A question like \"How does a refund reach the ledger?\" comes back incomplete, with the answer ending at the first module boundary. Engineers have added nine special cases to the sequence in two months. What is the better design?",
      options: [
        "Keep the sequence, but cap each run at ten tool calls, so that simple questions finish quickly and long runs are cut off in time.",
        "Give Claude the tools with clear descriptions and let it pick each next call from what it has found so far, stopping once it can answer.",
        "Route each question by keywords to one of several prebuilt sequences, for example \"version\" questions to a sequence for config files.",
        "Run the full sequence for every question across parallel subagents, so that long explorations finish in a fraction of the time."
      ],
      correct: [1],
      explanation: "A fixed sequence decides in advance which tools run, so it wastes calls on simple questions and cannot follow a trail that crosses module boundaries; every new case adds another special case. When Claude chooses the next tool based on what it has learned so far, a version question needs one or two reads, while a question about the refund flow can follow imports as far as needed and stop when the answer is complete.",
      optionExplanations: [
        "A cap shortens simple runs, but it also cuts off the long investigations that need more calls, and the steps are still wrong for most questions.",
        "Model-driven tool selection adapts the work to each question instead of forcing every question through the same path.",
        "Keyword routing is still a set of pre-configured sequences; it multiplies the maintenance and fails for questions between the categories.",
        "Parallel subagents make the same unsuitable steps faster, but simple questions still cost dozens of calls and trails still end at module boundaries."
      ],
      source: source("1.1", "model-driven decision-making (Claude reasons about which tool to call next based on context)"),
      docs: [
        { label: "Agent SDK docs: Agent loop", url: "https://code.claude.com/docs/en/agent-sdk/agent-loop.md", quote: "Claude evaluates your prompt, calls tools to take action, receives the results, and repeats until the task is complete." },
        { label: "Agent SDK docs: Agent loop", url: "https://code.claude.com/docs/en/agent-sdk/agent-loop.md", quote: "Claude evaluates the current state and determines how to proceed." }
      ]
    },
    {
      id: "core-d1-014",
      domain: "D1",
      objectives: ["O10"],
      scenario: "s3",
      question: "For the topic \"remote work and employee wellbeing\", the coordinator starts three search subagents with the same instruction: \"Find the most relevant sources on this topic.\" Their outputs overlap heavily: 31 of 42 sources appear in at least two results, the analysis subagent processes the same studies twice, and reviewers note that whole kinds of evidence are missing. Each run costs about $2.40 in search and analysis. How should the coordinator delegate instead?",
      options: [
        "Run a single search subagent with three times the result limit, so that no two subagents can return the same source twice.",
        "Keep the three identical instructions, and remove duplicate sources after the searches before the analysis subagent receives them.",
        "Give each of the three subagents a different search engine, so that their results come from three independent indexes.",
        "Assign each subagent its own part of the scope, for example peer-reviewed studies, public agency data, and employer surveys."
      ],
      correct: [3],
      explanation: "Three subagents with the same instruction search the same space and find the same sources, so most of the parallel work is wasted and areas no one was told to cover stay empty. When the coordinator divides the scope, by subtopic or by type of source, each subagent covers a distinct part, the overlap disappears, and kinds of evidence that were missing are covered deliberately. The parallel effort then adds breadth instead of duplicates.",
      optionExplanations: [
        "A single subagent avoids overlap but loses the parallelism, and nothing directs it toward the missing kinds of evidence.",
        "Removing duplicates afterwards saves analysis cost, but the searches remain redundant and the missing evidence is still not searched for.",
        "Different search engines tend to surface many of the same prominent sources (general experience, not from the guide), and none is directed to the gaps.",
        "Dividing the scope gives each subagent distinct ground, which removes duplication and closes coverage gaps by design."
      ],
      source: source("1.2", "Partitioning research scope across subagents to minimize duplication"),
      docs: [
        { label: "Claude Code docs: Subagents", url: "https://code.claude.com/docs/en/sub-agents.md", quote: "Research the authentication, database, and API modules in parallel using separate subagents" }
      ]
    },
    {
      id: "core-d1-015",
      domain: "D1",
      objectives: ["O18"],
      scenario: "s3",
      question: "Fact checkers sampling your research reports find that 18% of citations point to the wrong document or page, although the quoted statements themselves are accurate. The errors cluster in report paragraphs that combine findings from several analysis runs; paragraphs based on a single run are almost always correct. In the traces, each analysis run returns its findings to the coordinator as several paragraphs of prose. How should the hand-off from analysis to synthesis change?",
      options: [
        "Return each finding as a record with separate fields for the claim, the excerpt, the document name and the page.",
        "Ask the synthesis subagent to check every citation against the analysis text once more before it finalizes the report.",
        "Limit each report paragraph to findings from a single analysis run, so that combining never mixes up their sources.",
        "Have each analysis run return shorter paragraphs with one finding each, so that their sources are easier to keep apart."
      ],
      correct: [0],
      explanation: "The errors appear where findings from several runs are combined: when sources are part of the prose, rewriting and merging can separate a statement from its document or page. Passing findings as structured records, with the claim and excerpt in their own fields and the document name and page in others, keeps each claim tied to its source through every step, while the synthesis can still rephrase and combine claims freely.",
      optionExplanations: [
        "Separating content from source metadata in structured fields preserves attribution when later agents rewrite or combine findings.",
        "A second check can catch some errors, but in prose the link between a statement and its source is already ambiguous to check against.",
        "This avoids the errors by giving up synthesis across runs, which is the point of the report.",
        "Shorter paragraphs help a little, but sources are still embedded in text and can still be separated when findings are merged."
      ],
      source: source("1.3", "Using structured data formats to separate content from metadata"),
      docs: [
        { label: "Claude API docs: Prompting best practices", url: "https://platform.claude.com/docs/en/build-with-claude/prompt-engineering/claude-prompting-best-practices.md", quote: "When tracking structured information (like test results or task status), use JSON or other structured formats to help Claude understand schema requirements." }
      ]
    },
    {
      id: "core-d1-016",
      domain: "D1",
      objectives: ["O24"],
      scenario: "s6",
      question: "Your legal team reviews supplier contracts against the same six points every time: term, termination, liability cap, data protection, payment terms and governing law. Auditors require every review to follow one six-section template with comparable depth in each section. Currently one agent receives the whole contract and all six points in a single prompt. Audits show that liability caps are missed in 14% of contracts, data protection gets two pages in some reviews and two lines in others, and the section order varies. How should the task be structured?",
      options: [
        "Let the agent draw up its own investigation plan for each contract and update it as it discovers new clauses and cross-references.",
        "Keep the single prompt, but describe each of the six points in much more detail, with examples of what to look for in each.",
        "Run six focused steps, one per point and each with its own prompt, then assemble the results into the auditors' template.",
        "Let a coordinator read the contract first and spawn subagents only for the points it judges relevant to this contract."
      ],
      correct: [2],
      explanation: "The review is the same for every contract: six known points, one required template. A fixed chain of focused steps, one per point, gives each point consistent attention and produces the sections in the same order every time. Adaptive planning suits open-ended investigations, but here it would let the agent decide on depth and order, which is exactly the variation the auditors reject.",
      optionExplanations: [
        "An adaptive plan suits open-ended investigations; for a fixed checklist with a required template it reintroduces the variation.",
        "More detail helps, but one pass over six points still lets some points get less attention than others.",
        "A fixed chain of focused steps gives every point consistent depth and every review the same structure.",
        "Skipping points the coordinator considers irrelevant violates the requirement that every review covers all six."
      ],
      source: source("1.6", "prompt chaining for predictable multi-aspect reviews"),
      docs: [
        { label: "Claude API docs: Prompting best practices", url: "https://platform.claude.com/docs/en/build-with-claude/prompt-engineering/claude-prompting-best-practices.md", quote: "Explicit prompt chaining (breaking a task into sequential API calls) is still useful when you need to inspect intermediate outputs or enforce a specific pipeline structure." }
      ]
    },
    {
      id: "core-d1-017",
      domain: "D1",
      objectives: ["O02"],
      scenario: "s4",
      question: "Yesterday you spent three hours in a named Claude Code session, \"billing-audit\", reading 60 files of the billing service and building a detailed map of how invoices are calculated. This morning, a colleague merged a small fix that touched two of those files: tax_rounding.py and invoice_totals.py. You want to continue the audit where you stopped. What is the most efficient reliable way to proceed?",
      options: [
        "Resume billing-audit and tell Claude that tax_rounding.py and invoice_totals.py changed, so that it re-reads and re-checks just those two files.",
        "Start a new session and give it a structured summary of yesterday's map, so that every file is analyzed again from the current code.",
        "Resume billing-audit and run /compact first, so that yesterday's long exploration takes up less context before you continue the audit.",
        "Use fork_session on billing-audit and let the fork re-explore the whole service, then compare its map with the original session."
      ],
      correct: [0],
      explanation: "Most of yesterday's analysis is still valid: only two of 60 files changed. Resuming the named session keeps that valuable context, and telling Claude exactly which files changed lets it re-read and re-analyze those two instead of reasoning on outdated contents. Starting fresh with a summary is the better choice when most earlier results are stale, but here it would throw away three hours of still-valid work.",
      optionExplanations: [
        "Resuming keeps the valid context, and naming the changed files leads to a targeted re-analysis of exactly what is outdated.",
        "A fresh start with a summary fits when most earlier results are stale; here it repeats work on 58 unchanged files.",
        "Compacting saves context, but Claude still does not know that two files changed and will rely on their old contents.",
        "fork_session is for exploring divergent approaches; a full re-exploration repeats work and still needs a comparison afterwards."
      ],
      source: source("1.7", "Informing a resumed session about specific file changes for targeted re-analysis"),
      docs: [
        { label: "Claude Code docs: CLI reference", url: "https://code.claude.com/docs/en/cli-reference.md", quote: "Resume a specific session by ID or name, or show an interactive picker to choose a session." },
        { label: "Claude Code docs: CLI reference", url: "https://code.claude.com/docs/en/cli-reference.md", quote: "You can resume a named session with claude --resume <name>." }
      ]
    },
    {
      id: "core-d1-018",
      domain: "D1",
      objectives: ["O02"],
      scenario: "s2",
      question: "In a Claude Code session you have spent an hour analyzing how the public API paginates results: which endpoints use offsets, which use cursors, and which clients depend on each. The team now wants to compare two designs, one cursor scheme for all endpoints and a hybrid that keeps offsets for the admin API. Last time the team compared two designs one after the other in a single session, the second design quietly reused assumptions the first had introduced, which skewed the comparison. How should you set up the comparison this time?",
      options: [
        "Explore both designs one after another in the current session, but tell Claude before the second one to ignore the first design.",
        "Open two new sessions and repeat the hour of analysis in each, so that both designs start from a completely clean context.",
        "Fork the current session twice, once per design, so that each exploration continues on its own from the shared analysis.",
        "Save the analysis as a summary file, then explore both designs in one new session that starts from that summary."
      ],
      correct: [2],
      explanation: "Both designs should start from the same hour of analysis, but neither exploration should see the other. Forking the session creates two branches that both contain the full analysis and then continue separately, so assumptions from one design cannot leak into the other. Telling Claude to ignore earlier reasoning does not remove it from the context, and new sessions would repeat the analysis twice.",
      optionExplanations: [
        "An instruction to ignore the first design does not remove its reasoning from the context, which is how the skew happened last time.",
        "Clean sessions keep the explorations apart, but they repeat the whole analysis twice and may reach a different baseline.",
        "Forking from the shared analysis gives both designs the same starting point while keeping their explorations independent.",
        "A summary preserves the analysis, but exploring both designs in one session repeats last time's problem."
      ],
      source: source("1.7", "Using fork_session to create parallel exploration branches"),
      docs: [
        { label: "Agent SDK docs: Sessions", url: "https://code.claude.com/docs/en/agent-sdk/sessions.md", quote: "Forking creates a new session that starts with a copy of the original's history but diverges from that point." },
        { label: "Claude Code docs: Subagents", url: "https://code.claude.com/docs/en/sub-agents.md", quote: "Use a fork when any other subagent would need too much background to be useful, or when you want to try several approaches in parallel from the same starting point." }
      ]
    },
    {
      id: "core-d1-019",
      domain: "D1",
      scenario: "s4",
      question: "Your release agent has the tools run_test_suite and deploy_to_production. The release policy says a commit may only be deployed after the full test suite has passed for exactly that commit. The system prompt states this, yet in the last quarter three deployments went out without a test run, each time after an engineer wrote something like \"urgent, the fix is trivial\". Deployments must remain self-service for engineers. What is the most appropriate change?",
      options: [
        "Have the agent ask the engineer to confirm that the tests passed for this commit, and deploy only after the engineer has confirmed it.",
        "Require a second engineer to approve every deployment in the chat before the agent may call deploy_to_production.",
        "Add a check before deploy_to_production that warns the engineer when no passing test run exists for the commit, but lets them continue if they insist.",
        "Block deploy_to_production in code unless run_test_suite has passed for the same commit, and return a clear reason when it is blocked."
      ],
      correct: [3],
      explanation: "The policy has to hold every time, including under pressure, and instructions in the prompt have a non-zero failure rate, as the three incidents show. A programmatic prerequisite that blocks the deploy tool until a passing test run for the same commit exists makes skipping impossible, while engineers can still deploy on their own whenever the tests pass. A confirmation, a warning that can be overridden or a second approval either relies on people under the same pressure or gives up self-service.",
      optionExplanations: [
        "A confirmation shifts the check to the engineer, who was the one under pressure in all three incidents; it is not enforced.",
        "A second approval adds safety but removes self-service, and a human can still approve a deploy without tests.",
        "A warning runs at the right moment, but an engineer under pressure can override it, which is exactly how the three incidents happened.",
        "A prerequisite enforced in code guarantees the test run for the exact commit and keeps deployments self-service."
      ],
      source: source("1.4", "Implementing programmatic prerequisites that block downstream tool calls until prerequisite steps have completed"),
      docs: [
        { label: "Claude Code docs: Hooks guide", url: "https://code.claude.com/docs/en/hooks-guide.md", quote: "which gives you deterministic control: certain actions always happen rather than relying on the LLM to choose to run them." },
        { label: "Claude Code docs: Hooks reference", url: "https://code.claude.com/docs/en/hooks.md", quote: "To prevent or modify a tool call before it runs, use a PreToolUse hook instead." }
      ]
    },
    {
      id: "core-d1-020",
      domain: "D1",
      objectives: ["O10"],
      scenario: "s3",
      question: "To save time, your research subagents were allowed to call each other directly: the analysis subagent asks the search subagent for more sources, and the synthesis subagent asks the analysis subagent for clarifications. Since then, the coordinator's logs no longer explain why a report contains what it does, the same searches run several times per task, and errors from the search subagent sometimes disappear without trace. You need to debug and control the system again. What should you change?",
      options: [
        "Keep the direct calls, but have every subagent write a detailed log of each call it makes and receives to a shared log file.",
        "Remove the direct calls and let every request between subagents go through the coordinator, which decides, delegates and records it.",
        "Replace the direct calls with a shared message board that every subagent can read and post requests to whenever it needs something.",
        "Keep the direct calls, but add a shared cache of search results that every subagent checks before it starts a new search."
      ],
      correct: [1],
      explanation: "When subagents talk to each other directly, no single component sees the whole flow, so behavior cannot be traced, duplicate work goes unnoticed and errors can vanish between agents. Routing all requests through the coordinator restores one place where information flow is decided and recorded and where errors are handled consistently. The coordinator can also see that a search has already been run and reuse its result.",
      optionExplanations: [
        "Logs improve visibility, but nobody controls the flow, so duplicate searches and inconsistent error handling remain.",
        "Central routing through the coordinator gives observability, consistent error handling and control over what each agent receives.",
        "A shared board spreads the same uncontrolled communication to everyone and makes the flow even harder to follow.",
        "A cache removes duplicate searches, but the flow still cannot be traced and errors can still disappear between agents."
      ],
      source: source("1.2", "Routing all subagent communication through the coordinator for observability"),
      docs: [
        { label: "Claude Code docs: Subagents", url: "https://code.claude.com/docs/en/sub-agents.md", quote: "the subagent does that work in its own context and returns only the summary." }
      ]
    },
    {
      id: "core-d1-021",
      domain: "D1",
      objectives: ["O01"],
      scenario: "s1",
      question: "To answer \"Where are my three orders?\", Claude used to request three lookup_order calls in one response, and multi-order questions took about four seconds. Last sprint the loop was changed to append each tool result as a separate user message, in completion order, before the next API call. Since then, traces show Claude increasingly requesting one lookup per turn, and multi-order questions take three to four times as long. What should you change in the loop?",
      options: [
        "Add an instruction to the system prompt asking Claude to always look up all mentioned orders at once in one single turn.",
        "Keep the separate messages per result, but add a short summary of all results to the last of them before the next API call.",
        "Return all results of one response together in a single user message, with one tool_result block per requested call.",
        "Replace the per-order lookups with a lookup_orders tool that accepts a list of order IDs and returns all of them together."
      ],
      correct: [2],
      explanation: "When Claude requests several tools in one response, the loop should answer with all tool results in one user message, one result block per call. Spreading the results over separate messages breaks that pattern, and the docs warn that it reduces parallel tool use, which is what the traces show after the change. Keeping the results together lets Claude continue to batch independent lookups in one turn and keeps round trips low.",
      optionExplanations: [
        "The instruction fights the symptom; as long as the loop returns results in separate messages, parallel calls keep declining.",
        "A summary adds information, but it keeps the separate messages that caused the decline.",
        "One message with all results matches how Claude expects parallel tool results and keeps parallel calls working.",
        "A batch tool can help for this one case, but every other set of independent calls would still suffer from the changed loop."
      ],
      source: source("1.1", "How tool results are appended to conversation history so the model can reason about the next action"),
      docs: [
        { label: "Claude API docs: Parallel tool use", url: "https://platform.claude.com/docs/en/agents-and-tools/tool-use/parallel-tool-use.md", quote: "all tool results together in a single user message" }
      ]
    },
    {
      id: "core-d1-022",
      domain: "D1",
      objectives: ["O06"],
      scenario: "s3",
      question: "Your coordinator is configured with allowed_tools=[\"WebSearch\", \"Read\"] and an agents parameter that defines search, analysis and synthesis subagents, each with a clear description and prompt. In every trace, the coordinator runs all searches itself, reads the documents itself and writes the report on its own; no subagent is ever started. What is the most likely cause?",
      options: [
        "The tool that starts subagents (Agent, formerly Task) is missing from the coordinator's permitted tools, so delegation never happens.",
        "The subagent descriptions are too short, so the coordinator does not recognize when one of them would fit the task better.",
        "The coordinator's system prompt does not tell it to delegate, so it prefers to do the work with the tools it already has.",
        "The subagents have no tools of their own, so the coordinator decides that they could not complete their tasks anyway."
      ],
      correct: [0],
      explanation: "Subagents are started through a dedicated tool, called Task in the guide and Agent in current Claude Code. A coordinator whose allowed tools omit it has no working way to delegate, so it does everything itself with the tools it has, exactly as the traces show. Adding the tool to the coordinator's allowed tools restores delegation; descriptions and prompts only matter once delegation is possible. Note: in the current Agent SDK docs, allowed_tools auto-approves the listed tools, and tools not listed still exist but need approval through the permission mode or a callback.",
      optionExplanations: [
        "Without the spawning tool among its allowed tools, the coordinator cannot start subagents, which matches the traces.",
        "Descriptions influence which subagent is chosen, but here none is ever started, even though they are described clearly.",
        "A delegation instruction cannot work while the tool that performs delegation is unavailable to the coordinator.",
        "Subagents without tools inherit the available tools by default, and the coordinator never gets as far as considering them."
      ],
      source: source("1.3", "the requirement that allowedTools must include \"Task\" for a coordinator to invoke subagents"),
      docs: [
        { label: "Agent SDK docs: Subagents", url: "https://code.claude.com/docs/en/agent-sdk/subagents.md", quote: "Claude invokes subagents through the Agent tool." },
        { label: "Agent SDK docs: Permissions", url: "https://code.claude.com/docs/en/agent-sdk/permissions.md", quote: "Other tools not listed here still exist, and calls to them that need approval fall through to the permission" }
      ]
    },
    {
      id: "core-d1-023",
      domain: "D1",
      objectives: ["O05"],
      scenario: "s4",
      question: "Your code-review subagent should only read code and report findings. Its AgentDefinition was copied from a minimal example and given a description and a detailed prompt that says \"Never modify files\". In two of the last 40 runs it \"helpfully\" applied its own suggested fixes, once with Edit and once with a Bash sed command, and one of those changes broke the build. It needs to read, search and list files to do its job. What is the best fix?",
      options: [
        "Repeat \"Never modify files\" at the start and end of the subagent's prompt and add an example of a review that only reports findings.",
        "Add Edit to the subagent's disallowed tools, so that the tool it used most often for unwanted changes is removed from its tool set.",
        "Ask the coordinator to check every subagent result for file changes and to revert them before the review is passed on.",
        "Give the subagent's definition an explicit list of tools containing only Read, Grep and Glob, so it has nothing that can change files."
      ],
      correct: [3],
      explanation: "A subagent definition without a tools list inherits all tools available to subagents, including the ones that change files, and a prompt instruction only makes misuse less likely. Restricting the AgentDefinition to the tools the role needs, here Read, Grep and Glob, makes changes impossible for this subagent while it keeps everything it needs for reviewing. Removing a single tool leaves other ways to change files, as the Bash incident shows.",
      optionExplanations: [
        "Stronger wording lowers the rate but cannot guarantee it, and the subagent still has the tools to change files.",
        "Removing Edit closes one path, but Write and Bash remain available, and one of the incidents already used Bash.",
        "Reverting afterwards is fragile and comes too late if anything runs on the changed files in the meantime.",
        "An explicit list limited to the role's needs prevents changes technically while keeping what it needs to review."
      ],
      source: source("1.3", "The AgentDefinition configuration including descriptions, system prompts, and tool restrictions for each subagent type"),
      docs: [
        { label: "Agent SDK docs: Subagents", url: "https://code.claude.com/docs/en/agent-sdk/subagents.md", quote: "Array of allowed tool names. If omitted, inherits every tool available to subagents" },
        { label: "Agent SDK docs: Subagents", url: "https://code.claude.com/docs/en/agent-sdk/subagents.md", quote: "subagents can be limited to specific tools, reducing the risk of unintended actions" }
      ]
    },
    {
      id: "core-d1-024",
      domain: "D1",
      objectives: ["O02"],
      scenario: "s2",
      question: "After resuming yesterday's named session, Claude explains the payment flow using the old signature of charge_card(), which a teammate changed this morning. What should you have done when resuming?",
      options: [
        "Run /compact right after resuming to shrink yesterday's context.",
        "Tell Claude which files changed since yesterday, so it re-reads them.",
        "Start a new session without any summary of yesterday's work.",
        "Fork the session and continue the explanation in the fork."
      ],
      correct: [1],
      explanation: "A resumed session still holds yesterday's file contents, so Claude reasons from them unless it learns that something changed. Telling it which files were modified since then lets it re-read exactly those and correct its picture, while the rest of yesterday's still-valid analysis is kept. Compacting, forking or starting over without a summary either keep the stale content or throw away useful work.",
      optionExplanations: [
        "Compacting shrinks the old context but keeps the outdated signature in it.",
        "Naming the changed files lets Claude re-read them and keeps the rest of the valid analysis.",
        "A fresh session without a summary loses all of yesterday's work instead of fixing one stale part.",
        "A fork inherits the same outdated file contents."
      ],
      source: source("1.7", "The importance of informing the agent about changes to previously analyzed files when resuming sessions after code modifications")
    },
    {
      id: "core-d1-025",
      domain: "D1",
      objectives: ["O04"],
      scenario: "s3",
      question: "Your coordinator tells the analysis subagent: \"Open each PDF, read pages 1 to 5, extract the first table, summarize it in three bullets.\" For reports whose key figures are in appendices, it returns irrelevant results. What should change?",
      options: [
        "Add a step: also read the last five pages of each PDF.",
        "State what the analysis must find and how to judge relevance.",
        "Let the subagent read every page of every PDF in full.",
        "Have the coordinator extract all tables itself instead."
      ],
      correct: [1],
      explanation: "The fixed steps assume where the important data sits, so the subagent dutifully extracts the wrong table whenever a report is structured differently. Telling it what the analysis has to deliver and how to judge relevance lets it look wherever the key figures actually are. Adding more fixed steps or reading everything only shifts the problem or wastes effort.",
      optionExplanations: [
        "One more fixed step covers this layout but fails for the next report structured differently.",
        "A goal and quality criteria let the subagent adapt to each document's structure.",
        "Reading everything costs far more and still does not tell the subagent what matters.",
        "Pulling the work back into the coordinator defeats the delegation and overloads its context."
      ],
      source: source("1.3", "Designing coordinator prompts that specify research goals and quality criteria rather than step-by-step procedural instructions")
    },
    {
      id: "core-d1-026",
      domain: "D1",
      objectives: ["O06"],
      scenario: "s3",
      question: "Your coordinator passes the analysis subagent a list of local PDF paths to analyse. Reviewers notice that its findings cite web articles instead of the PDFs. In the traces, the analysis subagent calls WebSearch with each document's title and summarizes the search results; it never calls Read, and the PDFs are readable from the agent's working directory. The coordinator's prompt clearly says to analyse the provided files. What should you check first?",
      options: [
        "The analysis subagent's description, since a vague description can make the coordinator send it tasks that suit another subagent better.",
        "The coordinator's prompt to the subagent, since a stronger instruction to use only the provided files would stop the web searches.",
        "The tool list in the analysis subagent's AgentDefinition, since a definition copied from the search subagent may not include Read.",
        "The coordinator's own tools, since the coordinator could read the PDFs itself and pass their full text to the subagent instead."
      ],
      correct: [2],
      explanation: "The subagent receives the right task and the right paths, yet never reads a file and falls back to the tools it has. That pattern points to its own configuration: an AgentDefinition whose tool list lacks Read, for example because it was copied from the search subagent, leaves web search as the only way to do the job. Checking and fixing the tool list addresses the cause; stronger prompts cannot give the subagent a tool it does not have.",
      optionExplanations: [
        "The routing is fine: the analysis subagent does receive the analysis tasks, so its description is not the problem here.",
        "The prompt already says to use the files; an instruction cannot make up for a tool the subagent does not have.",
        "A tool list without Read explains why the subagent never opens the files and falls back to web search.",
        "Moving the reading into the coordinator works around the misconfiguration and loads every PDF into the coordinator's context."
      ],
      source: source("1.3", "The AgentDefinition configuration including descriptions, system prompts, and tool restrictions for each subagent type"),
      docs: [
        { label: "Agent SDK docs: Subagents", url: "https://code.claude.com/docs/en/agent-sdk/subagents.md", quote: "Array of allowed tool names. If omitted, inherits every tool available to subagents" }
      ]
    },
    {
      id: "core-d1-027",
      domain: "D1",
      objectives: ["O07"],
      scenario: "s4",
      question: "After a release with 40 commits, p95 latency at checkout rose from 300 ms to 1.9 s. Your agent investigates with a fixed chain: summarize every commit, summarize every configuration change, then write a report. Runs take 50 minutes, and the reports list all 40 changes with equal weight but name no cause. In one run, a dropped database index appeared only as a side remark in a commit summary. How should the investigation be structured?",
      options: [
        "Add a ranking step to the chain that orders all commit and configuration summaries by their likely impact on latency before the report is written.",
        "Let the agent start from where the extra time is spent, create follow-up tasks for the parts that show the slowdown, and revise its plan as each finding narrows the cause.",
        "Run the commit summaries and the configuration summaries in parallel subagents, so that the chain finishes sooner and the report is ready earlier.",
        "Pass the trace of a slow checkout request to the report step, so that the report can link each of the 40 changes to the slow spans."
      ],
      correct: [1],
      explanation: "Finding the cause of a regression is open-ended: which component to look at next depends on what the last step found. A fixed chain treats all 40 changes alike and cannot follow a lead, so the decisive detail drowns in summaries. Starting from the observed symptom and generating subtasks from each intermediate finding focuses the effort on the slow path. Adding a ranking step or a trace at the end still processes every change in the same fixed order.",
      optionExplanations: [
        "Ranking at the end still summarizes every change first and cannot follow a lead found along the way.",
        "An adaptive plan that generates subtasks from each finding fits an open-ended investigation like this.",
        "Parallel subagents make the run faster but produce the same unfocused summaries.",
        "The trace is the right evidence, but at the end of the chain it cannot steer which parts get investigated."
      ],
      source: source("1.6", "The value of adaptive investigation plans that generate subtasks based on what is discovered at each step")
    },
    {
      id: "core-d1-028",
      domain: "D1",
      objectives: ["O24"],
      scenario: "s5",
      question: "Last quarter you split your CI code review into one pass per changed file, and per-file feedback became consistent. This month, four changes still broke staging: in one, a field in an API response model was renamed in one file while two consumers in other files still read the old name. Each per-file pass approved its own file. The per-file feedback quality must stay as it is. How should you change the review?",
      options: [
        "Return to a single review pass over all changed files, so that the reviewer sees a renamed field and its consumers together.",
        "Give each per-file pass the full contents of all other changed files as extra context, so that it can check its file against them.",
        "Add a rule to every per-file prompt that flags any renamed field or changed signature as a possible breaking change for human review.",
        "After the per-file passes, run one more pass that receives each file's interface changes and checks them against each other."
      ],
      correct: [3],
      explanation: "Per-file passes see one file at a time, so problems that only exist between files, like a rename and its stale consumers, are invisible to each of them. A separate integration pass that compares the interface changes across files closes this gap and leaves the per-file passes untouched. Loading all files into every pass, or returning to one large pass, brings back the diluted attention that the split removed.",
      optionExplanations: [
        "A single pass over everything gives up the consistent per-file feedback the team wants to keep.",
        "Loading all other files into every pass dilutes each pass's attention and multiplies the input size.",
        "Flagging every rename creates noise for safe renames and still does not check whether consumers were updated.",
        "A cross-file integration pass catches mismatches between files without changing the per-file passes."
      ],
      source: source("1.6", "Splitting large code reviews into per-file local analysis passes plus a separate cross-file integration pass to avoid attention dilution")
    },
    {
      id: "core-d1-029",
      domain: "D1",
      objectives: [],
      scenario: "s4",
      question: "Your codebase agent's loop stops after 8 iterations, a cap chosen when most tasks needed three to five tool calls. Since the agent was pointed at a much larger monorepo, 22% of its answers end mid-investigation with a partial explanation; in those runs, the trace shows that Claude had just requested another Grep or Read when the loop ended. A teammate proposes raising the cap to 30. Runaway loops must still be prevented. How should the loop decide when to stop?",
      options: [
        "Stop when Claude ends its turn instead of asking for tools, and keep a high cap only as a safeguard that flags incomplete runs.",
        "Raise the cap to 30 iterations, so that tasks in the larger monorepo have enough room to finish before the loop stops them.",
        "Instruct Claude to write \"TASK COMPLETE\" in its final message and end the loop as soon as that phrase appears in a response.",
        "After every iteration, ask a second, cheaper model whether the task looks finished, and stop the loop when it says yes."
      ],
      correct: [0],
      explanation: "Claude signals through stop_reason whether it needs another tool result or has finished, so the loop should follow that signal: continue on tool use, stop at the end of the turn. A fixed cap as the main stopping rule cuts off tasks that legitimately need more steps, whatever its value. A cap still has a place as a safety net against runaway loops, as long as hitting it is reported as an incomplete run. Text phrases and judge models guess at what stop_reason already states.",
      optionExplanations: [
        "Following stop_reason ends the loop when Claude is done, and a high cap that flags incompletion still guards against runaway loops.",
        "A bigger cap is still an arbitrary limit that will cut off the next, larger task.",
        "A phrase in the text is a natural-language signal the model may omit or produce early.",
        "A judge model adds cost and guesses at completion that stop_reason already reports."
      ],
      source: source("1.1", "Implementing agentic loop control flow that continues when stop_reason is \"tool_use\" and terminates when stop_reason is \"end_turn\""),
      docs: [
        { label: "Claude API docs: How tool use works", url: "https://platform.claude.com/docs/en/agents-and-tools/tool-use/how-tool-use-works.md", quote: "Repeat from step 2 while `stop_reason` is `\"tool_use\"`." }
      ]
    },
    {
      id: "core-d1-030",
      domain: "D1",
      objectives: [],
      scenario: "s1",
      question: "Your support agent's process_refund call is blocked in code until get_customer has returned a verified customer. A review of 3,000 refunds found 9 that went to orders of a different account than the one verified. In each case, a verified customer asked about a family member's order, gave its order number, and the agent refunded it. Policy says refunds may only go to orders of the verified account. What should you change?",
      options: [
        "Have get_customer also return the verified customer's order list, so that the agent can check ownership before it refunds.",
        "Require get_customer to be called again right before every refund, so that verification is always fresh when money is moved.",
        "Extend the code check so that process_refund is also blocked unless the order belongs to the customer ID that verification returned.",
        "Escalate every refund to a human agent whenever the conversation mentions a family member or any other person."
      ],
      correct: [2],
      explanation: "The gate guarantees that someone was verified, but not that the refunded order belongs to that person, which is what the policy requires. Checking the order's owner against the verified customer ID in the same code gate closes the gap deterministically. Giving the agent the order list still leaves the check to the agent, verifying the same person again does not check ownership, and keyword-based escalation misses cases where nobody mentions another person.",
      optionExplanations: [
        "The order list helps the agent check, but the check still depends on the agent and can be skipped.",
        "Fresh verification confirms the same customer again but still does not check whose order is refunded.",
        "Tying the gate to the order's owner enforces exactly what the policy demands.",
        "Keyword-based escalation floods humans with harmless cases and misses those that mention no one."
      ],
      source: source("1.4", "Implementing programmatic prerequisites that block downstream tool calls until prerequisite steps have completed (e.g., blocking process_refund until get_customer has returned a verified customer ID)")
    },
    {
      id: "core-d1-031",
      domain: "D1",
      objectives: [],
      scenario: "s4",
      question: "Your developer agent has a PreToolUse hook that denies force pushes to the main branch; the self-hosted Git server offers no branch protection. When the hook fires, the agent receives a denial with no further text. Traces show the agent then retrying with other spellings such as git push -f and git push origin +main, all denied, and finally telling engineers that the push failed because of a network problem. Engineers want the agent to push its work to a feature branch and open a pull request instead. What should you change?",
      options: [
        "Extend the hook's pattern list to cover every spelling of a force push, so that no variant of the command can get through.",
        "Add a rule to the system prompt that force pushes to main are not allowed and that the agent should open a pull request instead.",
        "Have the hook's denial state the reason, that main accepts no force pushes, and tell the agent to push a feature branch and open a pull request.",
        "Have the hook rewrite the denied command into a push to a new feature branch, so that the push succeeds without the agent noticing."
      ],
      correct: [2],
      explanation: "The hook already guarantees that nothing reaches main, but a bare denial leaves the agent guessing, so it tries variants and invents an explanation. A denial that states the rule and the permitted alternative turns the block into a redirect: the agent understands why and switches to the intended workflow. More patterns keep blocking without guidance, a prompt rule does not explain the denial it meets, and silently rewriting the command leaves the agent reporting the wrong branch.",
      optionExplanations: [
        "More patterns are fine but still give the agent no reason or alternative, so it keeps retrying and misreporting.",
        "A prompt rule helps sometimes, but the denial the agent receives still explains nothing.",
        "A denial with reason and alternative keeps the guarantee and steers the agent to the intended workflow.",
        "The push lands somewhere, but the agent reports the wrong branch and never opens a pull request."
      ],
      source: source("1.5", "Implementing tool call interception hooks that block policy-violating actions (e.g., refunds exceeding $500) and redirect to alternative workflows (e.g., human escalation)"),
      docs: [
        { label: "Agent SDK docs: Hooks", url: "https://code.claude.com/docs/en/agent-sdk/hooks.md", quote: "permissionDecisionReason` tells the model why." }
      ]
    },
    {
      id: "core-d1-032",
      domain: "D1",
      objectives: ["O05"],
      scenario: "s3",
      question: "Your coordinator spawns a fact-check subagent to verify the 20 key claims of a draft report against the cited source documents. Its prompt contains the whole coordinator conversation so far, about 90,000 tokens of search results, drafts and reviewer comments, and its definition lists no tools. In recent runs it rewrote report sections, ran new web searches, and checked only 11 of the 20 claims. What should you change?",
      options: [
        "Add a sentence to the subagent's prompt saying that it must only check claims and must never edit the report or search the web.",
        "Define it with only Read and a fact-checking system prompt, and pass it just the 20 claims with their sources.",
        "Remove Write and WebSearch from its definition, but keep passing the full coordinator conversation so that it has all the context.",
        "Let the coordinator check the 20 claims itself, so that no subagent receives more context or tools than it actually needs."
      ],
      correct: [1],
      explanation: "The subagent drifts because nothing confines it to its role: without a tool list it inherits every tool, and a prompt full of drafts and comments invites it to work on them. Restricting its tools, giving it a role-specific system prompt and passing only the claims and sources keeps it on task and its attention on the 20 claims. Removing two tools alone leaves the oversized context, and moving the work into the coordinator loads its context instead.",
      optionExplanations: [
        "A prompt instruction does not remove the tools or the distracting context.",
        "Scoped tools, a role-specific system prompt and a focused task prompt constrain the subagent to fact-checking.",
        "Fewer tools stop the edits and searches, but the 90,000 tokens of unrelated context remain.",
        "The coordinator would carry the checking work and its context itself, giving up the benefit of a focused subagent."
      ],
      source: source("1.3", "The AgentDefinition configuration including descriptions, system prompts, and tool restrictions for each subagent type"),
      docs: [
        { label: "Agent SDK docs: Subagents", url: "https://code.claude.com/docs/en/agent-sdk/subagents.md", quote: "Array of allowed tool names. If omitted, inherits every tool available to subagents" }
      ]
    },
    {
      id: "core-d1-033",
      domain: "D1",
      objectives: ["O05"],
      scenario: "s3",
      question: "Your research system's three subagents for web search, document analysis and synthesis all share one system prompt: \"You are a helpful research assistant.\" Each receives its task through the coordinator's prompt. The coordinator's merging step fails in 15% of runs because outputs vary: the search subagent sometimes writes a finished summary instead of a source list, and the analysis subagent sometimes drafts report sections. The task prompts already describe each task clearly. What should you change?",
      options: [
        "Add a merging step to the coordinator that accepts any output shape and converts summaries and drafts back into source lists and findings.",
        "Add the expected output format for all three roles to the shared system prompt, so that every subagent knows what each of the others returns.",
        "Give each subagent its own system prompt that defines its role, what lies outside it, and the exact shape of the output it returns.",
        "Restrict each subagent's tools to those of its role, so that the search subagent cannot read documents or draft report text."
      ],
      correct: [2],
      explanation: "A generic shared system prompt tells none of the subagents what its job is or what it must hand back, so each one drifts toward producing the finished report itself. A role-specific system prompt that sets the scope and the output contract constrains every subagent to its part of the pipeline. Repairing outputs in the coordinator treats the symptom, tool restrictions do not define the output, and one shared prompt mixes every role's contract into each agent's instructions.",
      optionExplanations: [
        "Repairing outputs afterwards adds fragile code and leaves the subagents unconstrained.",
        "A shared prompt that mixes every role's output contract leaves each subagent to work out which contract applies to it.",
        "Role-specific system prompts with scope and output contract keep each subagent to its designated job.",
        "Tool restrictions limit what a subagent can do, but the drift here is in the shape of what it returns."
      ],
      source: source("1.3", "The AgentDefinition configuration including descriptions, system prompts, and tool restrictions for each subagent type")
    },
    {
      id: "core-d1-034",
      domain: "D1",
      objectives: ["O05"],
      scenario: "s3",
      question: "Early in a session, the client tells your coordinator: only sources from 2023 to 2025, no vendor blogs, and figures in euros. The coordinator confirms this and then delegates searches with prompts such as \"Find sources on heat pump adoption in Germany.\" The final report cites a 2019 study and two vendor blogs and gives prices in dollars. The coordinator's own summaries respect all three constraints, and other clients set different constraints. What is the most effective fix?",
      options: [
        "Have the coordinator write the client's constraints into every task prompt it sends to a subagent, along with the topic to research.",
        "Pass the subagents the coordinator's complete conversation history, so that they see everything the client has said in this session.",
        "Have the coordinator filter the subagents' results afterwards and remove every source and figure that violates one of the constraints.",
        "Add the three constraints to each subagent's system prompt, so that they apply automatically in every run of the research system."
      ],
      correct: [0],
      explanation: "Subagents do not inherit the coordinator's conversation; they know only what their task prompt tells them. The constraints were agreed in the coordinator's history and never passed on, so the subagents searched without them. Stating the constraints in each task prompt gives every subagent what it needs to search correctly the first time. Filtering afterwards wastes searches and can leave gaps, the full history floods each subagent with unrelated context, and system prompts would fix one client's constraints for all future runs.",
      optionExplanations: [
        "Including the session's constraints in each task prompt is the only way the subagents learn them.",
        "The full history adds a lot of unrelated context when only three constraints are needed.",
        "Filtering afterwards discards wasted work and may leave topics without valid sources.",
        "System prompts apply to every run, but these constraints belong to this client's session."
      ],
      source: source("1.3", "That subagent context must be explicitly provided in the prompt—subagents do not automatically inherit parent context or share memory between invocations"),
      docs: [
        { label: "Agent SDK docs: Subagents", url: "https://code.claude.com/docs/en/agent-sdk/subagents.md", quote: "The only content you pass from parent to subagent is the Agent tool's prompt string" }
      ]
    },
    {
      id: "core-d1-035",
      domain: "D1",
      objectives: ["O06"],
      scenario: "s3",
      question: "You added a statistics subagent to the research system's agents configuration, with the description \"Helper agent\", a detailed prompt for checking numerical claims, and the tools it needs. The coordinator has the tool for starting subagents. In two weeks of traces, it delegated to the statistics subagent twice out of 140 runs; otherwise it checked numbers itself, often wrongly. New subagents are added every few weeks, and the team does not want to edit the coordinator's prompt for each one. How should you fix the wiring?",
      options: [
        "Add a paragraph to the coordinator's system prompt that lists every subagent and tells it to delegate numerical checks to the statistics subagent.",
        "Give the statistics subagent more tools, such as web search, so that it becomes the most capable choice for any task that involves numbers.",
        "Assign the statistics subagent a stronger model, so that its checks become accurate enough to be worth delegating to it.",
        "Rewrite the statistics subagent's description to state what it does and when to use it, for example to verify figures, percentages and growth rates."
      ],
      correct: [3],
      explanation: "The coordinator decides whom to delegate to mainly from the subagents' descriptions, and \"Helper agent\" gives it no reason to pick this one for numerical checks. A description that says what the subagent does and when to use it connects the right tasks to it. A list in the coordinator's prompt would need an edit for every new subagent, more tools do not make the purpose clearer, and a stronger model improves the checks but not the routing.",
      optionExplanations: [
        "A list in the coordinator's prompt must be edited for every new subagent, which the team wants to avoid.",
        "Extra tools make the subagent broader, not easier to match to numerical checks.",
        "A stronger model improves the checks it runs, but the coordinator still has no reason to delegate to it.",
        "A specific description tells the coordinator when this subagent is the right choice."
      ],
      source: source("1.3", "The AgentDefinition configuration including descriptions, system prompts, and tool restrictions for each subagent type"),
      docs: [
        { label: "Agent SDK docs: Subagents", url: "https://code.claude.com/docs/en/agent-sdk/subagents.md", quote: "description tells Claude when to use this subagent" }
      ]
    },
    {
      id: "core-d1-036",
      domain: "D1",
      objectives: ["O06"],
      scenario: "s3",
      question: "You defined three AgentDefinitions in code and allowed the Agent tool, but the coordinator never delegates to them; asked, it names only a general-purpose helper and none of your three. What is the most likely cause?",
      options: [
        "The subagents' descriptions are too vague to be selected.",
        "The definitions were never passed in the coordinator's agents option.",
        "The coordinator's system prompt does not mention the subagents.",
        "The definitions do not list any tools for the subagents."
      ],
      correct: [1],
      explanation: "The coordinator does not know your three subagents at all, so they were never registered: definitions in code only take effect when they are passed to the coordinator's query through the agents option. Vague descriptions or a silent system prompt would lead to poor routing, not to missing subagents, and a definition without a tool list inherits the available tools.",
      optionExplanations: [
        "Vague descriptions cause wrong or rare delegation, but the subagents would still be listed.",
        "Definitions that are not passed in the agents option are invisible to the coordinator.",
        "The system prompt does not register subagents; the agents option does.",
        "Without a tool list a subagent inherits the available tools; it would still exist."
      ],
      source: source("1.3", "The AgentDefinition configuration including descriptions, system prompts, and tool restrictions for each subagent type"),
      docs: [
        { label: "Agent SDK docs: Subagents", url: "https://code.claude.com/docs/en/agent-sdk/subagents.md", quote: "Define subagents directly in your code using the `agents` parameter." }
      ]
    },
    {
      id: "core-d1-037",
      domain: "D1",
      objectives: ["O01"],
      scenario: "s1",
      question: "Since last month's release, customer messages with several independent requests, such as a voucher balance, a delivery slot and a loyalty tier, take about 14 seconds instead of 5. The traces show one tool call per response: get_voucher, then get_delivery_slots, then get_loyalty_tier, each in its own round trip, and every response ends with stop_reason \"tool_use\" and a complete tool_use block. The release notes list a new support FAQ in the system prompt, a newer model version, and request settings copied from a debugging script. What is the most likely cause?",
      options: [
        "The longer system prompt with the FAQ makes each round trip slower, so the three sequential calls add up to the extra seven seconds.",
        "The newer model version reasons more carefully and therefore prefers to wait for each result before it requests the next lookup.",
        "The copied request settings disable parallel tool use, so Claude can request at most one tool per response even for independent lookups.",
        "The copied settings lower max_tokens so far that each response has room for only one tool_use block, so further lookups move to later turns."
      ],
      correct: [2],
      explanation: "The three lookups do not depend on each other, so Claude would normally request them in one response and get all results back in a single round trip. A trace with exactly one call per response for independent lookups points to a setting that limits tool use to one call per turn, which matches settings copied from a debugging script. A longer prompt slows each call slightly but does not change their number, and the complete tool_use blocks rule out a token limit cutting responses short. In the API, the setting is disable_parallel_tool_use inside tool_choice.",
      optionExplanations: [
        "A longer prompt adds some latency per call but does not turn one round trip into three.",
        "The model version does not explain why independent lookups are suddenly never combined.",
        "Disabling parallel tool use forces one call per response, which matches the trace and the release notes.",
        "Every response ends normally with a complete tool_use block, so nothing is being cut off by a token limit."
      ],
      source: source("1.4", "Decomposing multi-concern customer requests into distinct items, then investigating each in parallel using shared context before synthesizing a unified resolution"),
      docs: [
        { label: "Claude API docs: Parallel tool use", url: "https://platform.claude.com/docs/en/agents-and-tools/tool-use/parallel-tool-use.md", quote: "Parallel tool use is on by default." }
      ]
    },
    {
      id: "core-d1-038",
      domain: "D1",
      objectives: ["O04"],
      scenario: "s3",
      question: "Your coordinator switched its search subagents from step-by-step instructions to goals such as \"Find the strongest evidence on rural broadband adoption since 2022.\" Coverage improved noticeably. But when a report has a gap, the coordinator cannot tell whether a subagent never searched a subtopic or searched and found nothing, because each subagent returns only its final list of sources. The team wants to keep the goal-based delegation. What should you add?",
      options: [
        "Go back to step-by-step instructions for each subagent, so that the coordinator knows in advance exactly which searches will run.",
        "Have the coordinator search every subtopic again itself whenever a report shows a gap, to confirm whether sources really exist.",
        "Keep the goals, and require each subagent to return what it searched, which sources it rejected and why, alongside the sources it found.",
        "Log every tool call the subagents make to a monitoring dashboard that the team reviews once a week to find gaps in the searches."
      ],
      correct: [2],
      explanation: "Goal-based delegation lets subagents adapt, but the coordinator also needs to see what they did in order to judge gaps. Requiring a short account of searches, rejections and reasons in the result keeps the adaptive behavior and gives the coordinator the visibility to decide whether to re-delegate. Returning to fixed steps gives up the coverage gain, searching again doubles the work, and a weekly dashboard comes too late for the coordinator's decisions within a run.",
      optionExplanations: [
        "Fixed steps restore predictability but lose the coverage that goal-based delegation brought.",
        "Repeating searches in the coordinator duplicates the subagents' work and loads its context.",
        "Goals plus a report of what was searched and rejected combine adaptability with coordinator visibility.",
        "A weekly review helps the team but not the coordinator during the run."
      ],
      source: source("1.3", "Designing coordinator prompts that specify research goals and quality criteria rather than step-by-step procedural instructions, to enable subagent adaptability")
    },
    {
      id: "core-d1-039",
      domain: "D1",
      objectives: ["O10"],
      scenario: "s6",
      question: "Your contract pipeline runs three stages per document: translate it into English, extract the clauses, then check the extracted English clauses against the original text. The 3,000 documents arriving each night are processed one after another and take 9 hours, but the nightly window is 4 hours. A colleague proposes running the three stages of each document at the same time in three agents. What should you do?",
      options: [
        "Run the three stages of each document at the same time, as proposed, so that every document finishes in about a third of the time.",
        "Merge the three stages into one prompt per document, so that each document needs a single call instead of three consecutive ones.",
        "Add a coordinator that decides for each document which stages it can skip, so that simple documents pass through more quickly.",
        "Keep the three stages in sequence for each document, and run the pipeline for many documents at the same time."
      ],
      correct: [3],
      explanation: "The stages depend on each other, so they cannot run side by side for the same document; a sequential pipeline is the right structure within each document. The documents, however, are independent, so running many pipelines at once shortens the night without breaking the dependency. Merging the stages removes the separate check against the original, and skipping stages trades reliability for speed.",
      optionExplanations: [
        "Extraction needs the translation and the check needs the extraction, so the stages cannot run at the same time.",
        "One combined prompt gives up the separate check that catches extraction errors.",
        "Skipping stages risks unchecked extractions, which the pipeline exists to prevent.",
        "Sequential stages per document with many documents in parallel respect the dependencies and fit the window."
      ],
      source: source("1.6", "Selecting task decomposition patterns appropriate to the workflow: prompt chaining for predictable multi-aspect reviews, dynamic decomposition for open-ended investigation tasks")
    },
    {
      id: "core-d1-040",
      domain: "D1",
      objectives: ["O37"],
      scenario: "s1",
      question: "Your support agent sometimes calls calculate_shipping with the address exactly as the customer typed it, before validate_address has run, and 4% of shipping quotes are based on invalid addresses. Customers often change the delivery address in the middle of a conversation. A teammate proposes forcing validate_address through tool_choice on the first request of each conversation. What is the most reliable fix?",
      options: [
        "Have calculate_shipping accept only the address ID from validate_address, and reject IDs that are missing or no longer match the current address.",
        "Force validate_address on the first request, as proposed, and return to automatic tool choice for the rest of the conversation.",
        "State in calculate_shipping's description that the address must always be checked with validate_address before calling it.",
        "Force validate_address on every request of the conversation, so that the address is checked again before each response."
      ],
      correct: [0],
      explanation: "The quote must always rest on a validated address, including after a change mid-conversation. If calculate_shipping only accepts an ID that validate_address issues, the order is enforced by the tools themselves on every turn. Forcing the check on the first request covers only the start, a description makes the order likely but not certain, and forcing the tool on every request blocks turns that need other tools or a plain answer.",
      optionExplanations: [
        "Requiring the ID from validate_address makes the prerequisite impossible to skip, on every turn.",
        "Forcing the first request misses addresses that change later in the conversation.",
        "A description guides the model but cannot guarantee the order.",
        "Forcing the same tool every turn prevents the agent from doing anything else in those turns."
      ],
      source: source("1.4", "Implementing programmatic prerequisites that block downstream tool calls until prerequisite steps have completed (e.g., blocking process_refund until get_customer has returned a verified customer ID)")
    },
    {
      id: "core-d1-041",
      domain: "D1",
      objectives: ["O02"],
      scenario: "s4",
      question: "Yesterday a named Claude Code session analysed 60 files of the order service, and the team wants to build on its findings today. For which two of these overnight changes is a new session that starts from a structured summary of the findings more reliable than resuming the named session and telling it what changed? (Select 2)",
      options: [
        "A merge changed 12 of the 60 files; the merge log names all of them, and the call paths behind the main findings are untouched.",
        "A refactoring renamed and moved most of the modules the session read, so its file paths and excerpts no longer match the code.",
        "Nothing in the code changed; yesterday's discussion ended with a short tangent about logging, and the team simply wants to continue the main thread.",
        "Nearly all 60 files were rewritten from callbacks to async/await; the business logic is the same, but almost every excerpt the session holds is outdated.",
        "Two central files changed, including the signature of charge_card(), which several findings refer to; the other 58 are untouched."
      ],
      correct: [1, 3],
      explanation: "Resuming and naming the changed files works as long as most of the earlier tool results still match the code, even if a few central files changed. When almost everything the session read is outdated, as after a broad move of modules or a rewrite of nearly every file, the old results mislead more than they help, and a new session built on a structured summary of the findings is more reliable. The share of stale results decides, not how important the changed files are.",
      optionExplanations: [
        "Twelve known files out of 60, with the main call paths intact, can be re-checked after resuming.",
        "Most file paths and excerpts are stale, so a fresh start from a summary is more reliable.",
        "An unhelpful tangent is no reason to drop a session whose results are all still valid.",
        "Almost every excerpt is outdated, even though the logic is the same, so the old tool results would mislead.",
        "Two changed files, even central ones, are best handled by resuming and pointing Claude at them."
      ],
      source: source("1.7", "Choosing between session resumption (when prior context is mostly valid) and starting fresh with injected summaries (when prior tool results are stale)")
    },
    {
      id: "core-d1-042",
      domain: "D1",
      objectives: ["O01"],
      scenario: "s1",
      question: "Your support agent can request several tool calls in one response, and the loop runs them concurrently. For which two customer messages should Claude send several tool calls together in a single response? (Select 2)",
      options: [
        "\"What is the delivery status of orders 4471 and 4502?\", with both order numbers given in the message.",
        "\"Refund my last order\", where the refund amount is only known after lookup_order has returned the order.",
        "\"What is the status of order 4471?\", where one lookup_order call answers the whole question.",
        "\"How many loyalty points do I have, and is the blue kettle in stock?\", for a customer whose account ID the agent already has.",
        "\"Cancel orders 4471 and 4502\", where policy requires the customer to confirm each cancellation after seeing its fee."
      ],
      correct: [0, 3],
      explanation: "Several calls belong in one response when the question needs more than one call and none of them depends on another's result or on an answer from the customer. Two orders with known numbers, or points and stock for an identified customer, meet both conditions. A refund needs the amount from the lookup first, a single-order question needs only one call, and cancellations that require the customer to confirm a fee have to wait for that answer.",
      optionExplanations: [
        "Two independent lookups with known order numbers can go out together.",
        "The refund depends on the amount returned by lookup_order, so the calls must run in sequence.",
        "One call answers the question, so there is nothing to send together.",
        "Points and stock are independent lookups once the account ID is known.",
        "Each cancellation needs the customer's confirmation first, so the calls cannot be sent straight away."
      ],
      source: source("1.4", "Decomposing multi-concern customer requests into distinct items, then investigating each in parallel using shared context before synthesizing a unified resolution"),
      docs: [
        { label: "Claude API docs: Parallel tool use", url: "https://platform.claude.com/docs/en/agents-and-tools/tool-use/parallel-tool-use.md", quote: "Parallel tool use is on by default." }
      ]
    },
    {
      id: "core-d1-043",
      domain: "D1",
      objectives: ["O05"],
      scenario: "s4",
      question: "Your documentation agent has a link-checker subagent that must run make linkcheck to find broken links and report them. Its definition lists Read, Grep and Bash, and its prompt says \"Only run make linkcheck.\" In 4 of the last 300 runs, it also ran other commands, twice using sed to \"fix\" a broken link in a Markdown file. The team requires that this subagent can run nothing but the link check and keeps running it itself, without round trips through the coordinator. What should you do?",
      options: [
        "Remove Bash from the subagent's tools, and let the coordinator run make linkcheck whenever the subagent asks for it.",
        "Strengthen the prompt with examples of forbidden commands such as sed -i and mv, and repeat the rule at the end.",
        "Keep Bash, and add a PreToolUse hook that allows Bash calls from this subagent only when the command is make linkcheck.",
        "Keep Bash, and have the coordinator run git checkout after each run, so that any file the subagent changed is restored."
      ],
      correct: [2],
      explanation: "The subagent needs exactly one shell command, but Bash allows any command, and a prompt cannot guarantee that it is never misused. A hook that checks each Bash call from this subagent and allows only make linkcheck keeps the needed capability and blocks every other command deterministically. Removing Bash also blocks other commands, but moves every link check through the coordinator, and restoring files afterwards lets the unwanted commands run in the first place.",
      optionExplanations: [
        "Without Bash nothing else can run, but every link check becomes a coordinator round trip.",
        "More examples lower the rate but cannot guarantee that only the link check runs.",
        "A hook that allows only make linkcheck keeps the capability and blocks every other command deterministically.",
        "Restoring files afterwards does not stop other commands from running and leaves their other effects."
      ],
      source: source("1.5", "Choosing hooks over prompt-based enforcement when business rules require guaranteed compliance"),
      docs: [
        { label: "Agent SDK docs: Hooks", url: "https://code.claude.com/docs/en/agent-sdk/hooks.md", quote: "`agent_id` and `agent_type` are populated when the hook fires inside a subagent." }
      ]
    },
    {
      id: "core-d1-044",
      domain: "D1",
      objectives: ["O01"],
      scenario: "s4",
      question: "You are reviewing the agentic loop of your codebase assistant before release. It sends the conversation to Claude, inspects each response, runs any requested tools, and decides whether to continue. Which two behaviors of the loop are correct? (Select 2)",
      options: [
        "When a response contains a text block such as \"Let me check the config\" and a tool_use block, it runs the tool and continues the loop.",
        "When Claude requests three tools in one response, it sends each result back as a separate user message as soon as that tool finishes.",
        "When Claude requests three tools in one response, it returns all three results together in a single user message, one tool_result block each.",
        "When a response ends with stop_reason \"max_tokens\", it treats the task as finished and returns the partial text as the answer.",
        "It stops after five iterations in every case, because five tool calls were enough for all tasks in the test suite."
      ],
      correct: [0, 2],
      explanation: "The loop should follow what Claude asks for: as long as a response requests tools, the loop runs them and continues, even when the response also contains explanatory text. Results of tools requested in the same response go back together in one message, one result block per call. Splitting them into separate messages, passing off a truncated response as the answer, or stopping after a fixed number of iterations all cut work short or disturb how Claude reasons about the results. The single-message rule for results comes from the API docs.",
      optionExplanations: [
        "Text alongside a tool request is commentary; the tool request means the task is not finished.",
        "Separate messages per result break the pattern of one response, one set of results.",
        "All results of one response belong together in a single message.",
        "A response cut off at max_tokens is incomplete; returning it as the answer passes on a truncated result.",
        "A fixed iteration count as the stopping rule cuts off tasks that need more steps."
      ],
      source: source("1.1", "Avoiding anti-patterns such as parsing natural language signals to determine loop termination, setting arbitrary iteration caps as the primary stopping mechanism, or checking for assistant text content as a completion indicator"),
      docs: [
        { label: "Claude API docs: How tool use works", url: "https://platform.claude.com/docs/en/agents-and-tools/tool-use/how-tool-use-works.md", quote: "Repeat from step 2 while `stop_reason` is `\"tool_use\"`." },
        { label: "Claude API docs: Parallel tool use", url: "https://platform.claude.com/docs/en/agents-and-tools/tool-use/parallel-tool-use.md", quote: "every tool result returns in a single user message" }
      ]
    },
    {
      id: "core-d1-045",
      domain: "D1",
      objectives: ["O10"],
      scenario: "s3",
      question: "You are writing the responsibilities into your research coordinator's system prompt. The system has search, analysis and synthesis subagents. Run logs show that one-line factual questions average four minutes, about the same as broad research topics, and reviewers find obvious gaps in some final reports. Which two responsibilities should the coordinator take on? (Select 2)",
      options: [
        "Let the analysis subagent call the search subagent directly whenever it needs more sources, so that the coordinator is not slowed down.",
        "Decide for each query which subagents are actually needed, instead of always running search, analysis and synthesis in full.",
        "Pass every subagent the coordinator's full conversation history, so that no subagent ever lacks context about the client.",
        "Skip the analysis subagent whenever search returns fewer than ten sources, so that small queries finish faster.",
        "Check the synthesis output for gaps and send targeted follow-up tasks to search and analysis before the report is finalized."
      ],
      correct: [1, 4],
      explanation: "The coordinator owns the shape of each run: it decides which subagents a query really needs, and it reviews the synthesis for gaps and re-delegates targeted work until coverage is sufficient. Those two responsibilities address both symptoms. Direct calls between subagents bypass the coordinator's control, passing full histories floods subagents with unrelated context, and a fixed rule based on source counts replaces the coordinator's judgment about what each query needs.",
      optionExplanations: [
        "Direct subagent-to-subagent calls bypass the coordinator's visibility and error handling.",
        "Selecting subagents per query keeps simple questions fast.",
        "Subagents need the relevant context in their task, not the whole history.",
        "A fixed source-count rule ignores what the query needs; a broad topic with few sources may still need analysis.",
        "Reviewing the synthesis for gaps and re-delegating closes the gaps before the report goes out."
      ],
      source: source("1.2", "Designing coordinator agents that analyze query requirements and dynamically select which subagents to invoke rather than always routing through the full pipeline")
    },
    {
      id: "core-d1-046",
      domain: "D1",
      objectives: [],
      scenario: "s1",
      question: "Your support agent's business rules are being moved from the system prompt into Agent SDK hooks. Some rules must act before a tool runs, others on what a tool returns. Which two rules belong in a hook that runs before the tool call, rather than in one that runs after it? (Select 2)",
      options: [
        "Block apply_discount for discounts above 30% and route the case to a supervisor instead.",
        "Convert amounts that the payments tool reports in cents into decimal amounts with a currency code.",
        "Mask card numbers in get_customer results so that the model never receives them.",
        "Deny delete_account for accounts that still have open invoices, with a reason the agent can explain.",
        "Write every completed refund, with its amount and order ID, to the finance audit log."
      ],
      correct: [0, 3],
      explanation: "A rule that must stop an action has to run before the action happens, so blocking large discounts and denying account deletion belong in a pre-call hook. Rules that work on what a tool returns, such as converting amounts or masking card numbers in results, belong after the call, and logging completed refunds needs the call to have finished. Placing a blocking rule after the call would only detect the violation once the discount was granted or the account deleted.",
      optionExplanations: [
        "Stopping a large discount must happen before apply_discount executes.",
        "The amounts exist only in the result, so conversion happens after the call.",
        "Masking acts on returned data, so it belongs after the call.",
        "Denying the deletion must happen before delete_account runs.",
        "Logging a completed refund needs the call to have finished."
      ],
      source: source("1.5", "Hook patterns that intercept outgoing tool calls to enforce compliance rules (e.g., blocking refunds above a threshold)")
    },
    {
      id: "core-d1-047",
      domain: "D1",
      objectives: ["O02"],
      scenario: "s4",
      question: "Your team uses Claude Code sessions for long codebase investigations. A colleague asks when forking an existing session is the right tool rather than resuming it, starting fresh, or using subagents. For which two situations is forking the session the best choice? (Select 2)",
      options: [
        "Continuing yesterday's investigation of the auth module, whose code has not changed since then.",
        "Researching four independent subtopics at the same time, each needing its own searches.",
        "Comparing a queue-based and a polling design for the notification service, both building on the same two-hour analysis.",
        "Trying a risky schema redesign from the current analysis while keeping that analysis available for a safer alternative.",
        "Building on last week's analysis after a refactoring has moved most of the files it read."
      ],
      correct: [2, 3],
      explanation: "Forking creates independent branches from a shared baseline, so it fits when one analysis should feed two divergent explorations without them influencing each other. Comparing two notification designs and trying a risky design while keeping the baseline intact are exactly that. Unchanged work is simply resumed, independent subtopics are a job for parallel subagents, and an analysis built on files that have since moved should be replaced by a fresh session with a summary.",
      optionExplanations: [
        "Unchanged code and one line of work call for resuming the named session.",
        "Independent subtopics without a shared analysis fit parallel subagents.",
        "Two designs explored from one shared analysis is the case forking is made for.",
        "Forking keeps the baseline untouched while one branch tries the risky path.",
        "Stale results after a large refactoring call for a fresh start with a summary."
      ],
      source: source("1.7", "Using fork_session to create parallel exploration branches (e.g., comparing two testing strategies or refactoring approaches from a shared codebase analysis)")
    }
  ]);
})();
