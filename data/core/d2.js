/* Domain 2: Tool Design & MCP Integration (Exam Guide weight 18%) */
(function () {
  const source = window.CORE_CATALOG.examGuideSource;

  window.CORE_CATALOG.addQuestions([
    {
      id: "core-d2-001",
      domain: "D2",
      scenario: "s3",
      question: "The document analysis subagent has a single generic tool, analyze_document(document_id, instructions), which it uses to pull figures from reports, to summarize papers and to check whether a claim is supported by a source. The synthesis agent expects a fixed result structure for each of these tasks, but results arrive in many different shapes, and claim checks sometimes come back as plain summaries. What is the best way to redesign the tool interface?",
      options: [
        "Keep analyze_document, but expand its description with detailed examples of how to phrase the instructions parameter for each kind of task.",
        "Add few-shot examples to the subagent's system prompt that show the expected output for figure extraction, summaries and claim checks.",
        "Have the synthesis agent convert every incoming result with an extra Claude call into the structure it expects for that kind of task.",
        "Replace it with three tools, one per task, each taking only the inputs that task needs and returning its own defined result structure."
      ],
      correct: [3],
      explanation: "The tool interface is what the model uses to choose and fill in a tool. A single tool with a free-text instructions parameter has no contract: the model has to invent the task and the output shape on every call, which explains the varying results. Purpose-specific tools, each with only the inputs its task needs and a defined result structure, make the choice obvious and give the synthesis agent predictable output for each kind of task. Note: the API docs also recommend consolidating closely related operations into one tool with a fixed action parameter; that differs from one tool whose free-text parameter leaves both the task and the output shape open.",
      optionExplanations: [
        "A better description helps the model phrase instructions, but one tool with a free-text parameter still has no fixed output contract per task.",
        "Few-shot examples can make outputs more consistent, but one tool still cannot offer task-specific parameters and a fixed schema for each task.",
        "An extra conversion call adds cost and latency and treats the symptom; the unclear interface remains.",
        "Purpose-specific tools with defined input and output contracts give each task a clear interface, so the model picks the right one and results have a predictable shape."
      ],
      source: source("2.1", "Splitting generic tools into purpose-specific tools with defined input/output contracts"),
      docs: [
        { label: "Claude API docs: Define tools", url: "https://platform.claude.com/docs/en/agents-and-tools/tool-use/define-tools.md", quote: "Consolidate related operations into fewer tools. Rather than creating a separate tool for every action (create_pr, review_pr, merge_pr), group them into a single tool with an action parameter." },
        { label: "Claude API docs: Define tools", url: "https://platform.claude.com/docs/en/agents-and-tools/tool-use/define-tools.md", quote: "Fewer, more capable tools reduce selection ambiguity and make your tool surface easier for Claude to navigate." }
      ]
    },
    {
      id: "core-d2-002",
      domain: "D2",
      scenario: "s1",
      question: "When process_refund cannot complete a refund, it returns the text \"Operation failed\", whether the payment service timed out, the order ID was malformed, or the refund violates the 30-day return policy. Logs show that the agent retries policy rejections up to five times and then tells customers that \"a technical problem occurred\", which leads to many repeat contacts. How should the tool report a refund that is rejected because it violates the return policy?",
      options: [
        "As an error with the category transient, isRetryable set to true and a suggested backoff, so that the agent waits a while before trying the refund again.",
        "As a validation error that asks the agent to collect the order ID and the purchase date from the customer again before calling the tool once more.",
        "As an error that identifies it as a policy rejection, marks it as not worth retrying, and gives a reason the agent can explain to the customer.",
        "With the generic message as before, while the detailed cause is logged on the server so support staff can look it up when the customer calls back."
      ],
      correct: [2],
      explanation: "The agent cannot react sensibly to an error it cannot tell apart from others. A policy rejection is a business-rule violation: retrying will never succeed, and the customer needs to hear why. Returning it as an error that is clearly identified, marked as not retryable and accompanied by a customer-friendly reason lets the agent stop retrying and explain the decision, while genuine timeouts can still be retried.",
      optionExplanations: [
        "A policy rule will not change after a backoff, so marking it as transient and retryable produces exactly the wasted retries seen in the logs.",
        "The input was valid; asking the customer for the same data again does not change a policy decision and frustrates the customer.",
        "Business-rule violations should come back as non-retryable with a customer-friendly explanation, so the agent stops retrying and can tell the customer why.",
        "The agent still cannot distinguish this error from a timeout, so the retries and the misleading message to the customer remain."
      ],
      source: source("2.2", "Including retriable: false flags and customer-friendly explanations for business rule violations"),
      docs: [
        { label: "MCP specification: Tools", url: "https://modelcontextprotocol.io/specification/2026-07-28/server/tools.md", quote: "Tool Execution Errors contain actionable feedback that language models can use to self-correct and retry with adjusted parameters:" },
        { label: "Claude API docs: Handle tool calls", url: "https://platform.claude.com/docs/en/agents-and-tools/tool-use/handle-tool-calls.md", quote: "Write instructive error messages. Instead of generic errors like \"failed\", include what went wrong and what Claude should try next" }
      ]
    },
    {
      id: "core-d2-003",
      domain: "D2",
      objectives: ["O35"],
      scenario: "s4",
      question: "Your team of twelve developers wants everyone to have the same GitHub MCP server in Claude Code as soon as they clone the repository. Each developer has a personal access token in an environment variable. Security policy forbids secrets in version control. In addition, two developers want to try an experimental internal MCP server without affecting anyone else. Which configuration meets all of these requirements?",
      options: [
        "Add both servers to the project's .mcp.json with the token referenced as ${GITHUB_TOKEN}, and ask everyone else to ignore the experimental server's tools.",
        "Have every developer add the GitHub server with their own token to ~/.claude.json, and add the experimental server there as well for the two developers.",
        "Add the GitHub server to the project's .mcp.json with the token referenced as ${GITHUB_TOKEN}, and the experimental server to the two developers' ~/.claude.json.",
        "Add the GitHub server to the project's .mcp.json with ${GITHUB_TOKEN}, and the experimental server to .mcp.json on a branch only the two developers use."
      ],
      correct: [2],
      explanation: "Each requirement points to a different configuration mechanism. Servers the whole team needs belong in the project-scoped .mcp.json, which is shared through version control. Environment variable expansion such as ${GITHUB_TOKEN} lets that file reference each developer's own token without committing it. Personal or experimental servers belong in the user-scoped ~/.claude.json. Putting them into .mcp.json would affect everyone, because tools from all configured servers are available to the agent at the same time. Note: in the current Claude Code docs, ~/.claude.json holds both the default local scope (this project only, suggested for experiments) and the user scope; either keeps the experiment personal.",
      optionExplanations: [
        "Tools from all configured servers are available to the agent at the same time, so the experimental server would affect everyone's sessions.",
        "User-level configuration is not shared through the repository, so new developers do not get the server when they clone it.",
        "Project scope shares the GitHub server through the repository, environment variable expansion keeps the token out of version control, and user scope keeps the experiment personal.",
        "Personal experiments then depend on a branch, can leak to everyone when that branch is merged, and user-level configuration is the intended place for them."
      ],
      source: source("2.4", "Environment variable expansion in .mcp.json (e.g., ${GITHUB_TOKEN}) for credential management without committing secrets"),
      docs: [
        { label: "Claude Code docs: MCP", url: "https://code.claude.com/docs/en/mcp.md", quote: "Check .mcp.json into version control so everyone on your team gets the same MCP tools and services." },
        { label: "Claude Code docs: MCP", url: "https://code.claude.com/docs/en/mcp.md", quote: "Use local scope for personal development servers, experimental configurations, or servers with credentials you don't want in version control." }
      ]
    },
    {
      id: "core-d2-004",
      domain: "D2",
      objectives: ["O33"],
      scenario: "s3",
      question: "To keep the research system flexible, every subagent can use all 14 available tools, from web search and document fetching to database queries and chart rendering. The logs show that the document analysis subagent runs new web searches in about a quarter of its runs, fetching sources the coordinator already provided, and that the report-writing subagent sometimes queries the database for figures instead of using the analysed results. What is the most effective change?",
      options: [
        "Rewrite the descriptions of all 14 tools so that each one states clearly which subagent should use it and in which situations.",
        "Give each subagent only the tools that its role requires, and route needs outside that role through the coordinator.",
        "Add a section to each subagent's system prompt that lists the tools it is allowed to use and asks it to ignore all others.",
        "Merge the 14 tools into four generic tools with flexible parameters, so that every subagent has fewer tools to choose from."
      ],
      correct: [1],
      explanation: "When agents can reach tools outside their specialization, they tend to use them, and the more tools they see, the less reliable their selection becomes. Restricting each subagent to the tools of its role removes the wrong choices entirely: an analysis agent without search tools cannot start new searches. Requests outside the role go through the coordinator, which keeps control of the information flow. Better descriptions or prompt rules only make misuse less likely.",
      optionExplanations: [
        "Clearer descriptions help selection, but each agent still sees 14 options, many outside its role, so misuse stays possible.",
        "Scoped tool access removes cross-role tools and reduces the number of decisions each agent has to make.",
        "A prompt list is guidance the model may not follow, while the unwanted tools remain available.",
        "Merging unrelated tools into generic ones with free-form parameters blurs their contracts; consolidation helps only for closely related operations with a defined action parameter, and it still leaves cross-role tools available."
      ],
      source: source("2.3", "Restricting each subagent's tool set to those relevant to its role, preventing cross-specialization misuse"),
      docs: [
        { label: "Claude Code docs: Subagents", url: "https://code.claude.com/docs/en/sub-agents.md", quote: "Enforce constraints by limiting which tools a subagent can use" },
        { label: "Claude API docs: Define tools", url: "https://platform.claude.com/docs/en/agents-and-tools/tool-use/define-tools.md", quote: "Fewer, more capable tools reduce selection ambiguity and make your tool surface easier for Claude to navigate." }
      ]
    },
    {
      id: "core-d2-005",
      domain: "D2",
      objectives: ["O34"],
      scenario: "s4",
      question: "Your developer productivity agent connects to an internal MCP server that gives access to about 600 architecture and runbook documents. Traces show that in every session the agent first spends 8 to 12 tool calls listing folders and running searches just to find out which documents exist, before it starts the engineer's actual task. The document collection changes weekly. How can you remove this exploration overhead most effectively?",
      options: [
        "Add a list_folder tool that returns one folder level per call, so that the agent can browse the collection systematically instead of searching.",
        "Maintain a hand-written index of the documents in CLAUDE.md and update it whenever the documentation team publishes changes.",
        "Improve the search tool's description with an overview of the document types that exist, so that the agent's searches become more targeted.",
        "Have the MCP server publish its list of available documents as a resource that the agent can read in one step at the start of a session."
      ],
      correct: [3],
      explanation: "MCP resources exist for this purpose: they expose a content catalog, such as a documentation hierarchy, so that the agent knows what data is available without making exploratory tool calls. Because the server provides the catalog, it stays current when the collection changes each week. A browsing tool or a better search description makes discovery tidier but still leaves it to exploratory tool calls, and a hand-maintained index goes out of date. Note: in Claude Code, resources are offered through @-mentions and built-in resource tools rather than injected automatically; one catalog read replaces the exploratory calls.",
      optionExplanations: [
        "Systematic browsing is tidier than free searching, but the agent still has to discover the catalog through a series of tool calls in every session.",
        "A manual index works at first but drifts out of date with weekly changes and duplicates what the server already knows.",
        "More targeted searches are still exploratory calls; the agent still has to search to learn what exists.",
        "A resource gives the agent visibility into the available documents directly, and the server keeps it up to date."
      ],
      source: source("2.4", "Exposing content catalogs as MCP resources to give agents visibility into available data without requiring exploratory tool calls"),
      docs: [
        { label: "MCP specification: Resources", url: "https://modelcontextprotocol.io/specification/2026-07-28/server/resources.md", quote: "Resources allow servers to share data that provides context to language models, such as files, database schemas, or application-specific information." },
        { label: "Claude Code docs: MCP", url: "https://code.claude.com/docs/en/mcp.md", quote: "Claude Code automatically provides tools to list and read MCP resources when servers support them" }
      ]
    },
    {
      id: "core-d2-006",
      domain: "D2",
      objectives: ["O32"],
      scenario: "s4",
      question: "The agent has to change the request timeout of the payments service in a 900-line YAML file that defines six services copied from one template. Every Edit attempt returns the error \"Found 6 matches of the string to replace\", and the agent keeps retrying with the same text. The six blocks are identical except for the service name on their first line, about 40 lines above each timeout. Only the payments block may change. What should the agent do?",
      options: [
        "Read the whole file, change the timeout inside the payments block, and write the complete updated content back with Write.",
        "Use Grep to find the line number of the timeout in the payments block, then call Edit for that line so only that occurrence changes.",
        "Retry Edit with the option to replace all matches, since every timeout line in the file has exactly the same text anyway.",
        "Split the YAML file into six smaller files, one per service, so that each timeout line becomes unique and Edit can be used."
      ],
      correct: [0],
      explanation: "Edit changes text by matching a unique anchor. The error shows that the text around the timeout appears six times; the only unique anchor would be a fragile block of about 40 lines reaching up to the service name. The reliable fallback is to read the full file, make the change in the right block, and write the complete content back. This changes only the payments block and leaves the other five services untouched.",
      optionExplanations: [
        "Read plus Write is the fallback when Edit cannot find a unique anchor, and it changes exactly the intended block.",
        "Edit matches text, not line numbers (general knowledge about the tool), so a line number from Grep does not make the match unique.",
        "Replacing all matches would also change the timeouts of the five other services.",
        "Restructuring the configuration is a large, risky change to work around a tool limitation that Read and Write already solve."
      ],
      source: source("2.5", "Using Read to load full file contents followed by Write when Edit cannot find unique anchor text")
    },
    {
      id: "core-d2-007",
      domain: "D2",
      scenario: "s1",
      question: "During a 20-minute database incident, your support agent told 140 customers that no orders exist for their account, and many of them assumed their purchase had failed and ordered again. In the traces from the incident window, every lookup_order call returned an empty list with a success status, exactly as it does for customers who have never ordered. How should lookup_order report its results?",
      options: [
        "Return isError with the message \"Operation failed\" whenever the database query does not complete, and an empty list otherwise.",
        "Cache the last successful result for each customer inside the tool, and return it whenever the database cannot be reached.",
        "Keep the tool as it is, but have the agent ask for an order number whenever the list is empty, before saying that no orders exist.",
        "Keep the empty list for queries that ran, and return a retryable \"database unreachable\" error when the query failed."
      ],
      correct: [3],
      explanation: "An empty list should mean \"the query ran and found nothing\"; a timeout means \"we do not know\". When both look the same, the agent cannot tell a real absence of orders from a failed lookup, and customers get wrong information. A proper error that says what happened and that a retry may succeed lets the agent retry or explain a temporary problem, while valid empty results keep their meaning.",
      optionExplanations: [
        "Flagging the failure is an improvement, but a generic message gives the agent no basis for deciding whether to retry or what to tell the customer.",
        "Cached results can be outdated and hide the incident, so customers may get answers that no longer match their orders.",
        "Asking for an order number helps a little, but during the incident that lookup fails the same way, and the agent still cannot tell why.",
        "Separating access failures from valid empty results lets the agent react correctly to each case."
      ],
      source: source("2.2", "Distinguishing between access failures (needing retry decisions) and valid empty results"),
      docs: [
        { label: "Agent SDK docs: Custom tools", url: "https://code.claude.com/docs/en/agent-sdk/custom-tools.md", quote: "is_error marks this as a failed call rather than odd-looking data." },
        { label: "Claude API docs: Handle tool calls", url: "https://platform.claude.com/docs/en/agents-and-tools/tool-use/handle-tool-calls.md", quote: "Instead of generic errors like \"failed\", include what went wrong and what Claude should try next (for example, \"Rate limit exceeded. Retry after 60 seconds.\")." }
      ]
    },
    {
      id: "core-d2-008",
      domain: "D2",
      objectives: ["O36"],
      scenario: "s4",
      question: "Your team connected an MCP server whose code_search tool queries a semantic index of the monorepo, including call graphs and code ownership. Its description lists only the two input parameters, query and limit. Two weeks later, traces show the agent still uses Grep for 90% of questions about code and often misses callers that are wired through dependency injection. What is the most likely cause, and the best fix?",
      options: [
        "The description gives no reason to prefer code_search; describe what it returns that a text search cannot, such as injected callers and call graphs.",
        "The agent has too many overlapping tools; remove Grep, so that code_search remains the only tool for questions about code.",
        "No instruction mentions code_search; add a rule to CLAUDE.md that the agent must use it for every question about code.",
        "The name code_search sounds generic; rename it to search_code_advanced, so that it stands out against Grep."
      ],
      correct: [0],
      explanation: "The agent chooses tools based on their descriptions. A description that only lists parameters says nothing about why the MCP tool is better than the built-in Grep, which the model already knows well, so it keeps using Grep. Describing the tool's capabilities and outputs gives the agent a reason to pick it for questions that need call graphs or injected callers, while Grep stays available for exact text matches.",
      optionExplanations: [
        "A description of capabilities and outputs is what lets the agent prefer the more capable MCP tool for the right questions.",
        "Grep is still the right tool for exact text matches; removing it trades one problem for another.",
        "A rule may increase usage, but it forces code_search even for simple text matches and leaves the agent without information about what the tool returns.",
        "A name hints at capability, but without a description of the results, the agent still cannot tell when the tool is the better choice."
      ],
      source: source("2.4", "Enhancing MCP tool descriptions to explain capabilities and outputs in detail, preventing the agent from preferring built-in tools"),
      docs: [
        { label: "Claude API docs: Define tools", url: "https://platform.claude.com/docs/en/agents-and-tools/tool-use/define-tools.md", quote: "Provide extremely detailed descriptions. This is by far the most important factor in tool performance." },
        { label: "Claude API docs: Define tools", url: "https://platform.claude.com/docs/en/agents-and-tools/tool-use/define-tools.md", quote: "Any important caveats or limitations, such as what information the tool does not return if the tool name is unclear." }
      ]
    },
    {
      id: "core-d2-009",
      domain: "D2",
      objectives: ["O36"],
      scenario: "s1",
      question: "Last week three changes went live: a new sentence in the system prompt, \"Always check the customer's account status first\"; a new returns_portal tool; and an update to a newer model version. No tool descriptions were changed. General questions used to be answered with the faq_lookup tool. Since then, the agent calls get_customer at the start of every conversation, including questions about opening hours or shipping costs. This adds two seconds of latency and fails for guest users. returns_portal is only called for return requests, as intended. What is the most likely cause, and the fix?",
      options: [
        "The description of get_customer is too broad; rewrite it so that it states clearly that the tool is only for account-specific requests.",
        "The newer model calls tools more eagerly than the old one; roll back the model update until the behavior has been analyzed.",
        "The new instruction ties every request to get_customer; reword it so that it applies only when a request concerns the customer's account.",
        "faq_lookup is now used too rarely; add few-shot examples that show the agent answering general questions with faq_lookup first."
      ],
      correct: [2],
      explanation: "The agent now calls exactly the tool that the new instruction names, for every request, while the new tool behaves as intended, which points to the prompt rather than the model. An absolute instruction such as \"always check the account status first\" can override otherwise clear tool descriptions and create an association between every request and get_customer. Scoping it to account-related requests restores the intended tool selection.",
      optionExplanations: [
        "The description did not change, and the behavior started together with the new instruction.",
        "A model change is possible, but the pattern matches the new instruction precisely, and a rollback would also lose the benefits of the update.",
        "System prompt wording can override well-written tool descriptions; scoping the instruction removes the unintended association.",
        "Examples might reduce the effect, but they work against the instruction instead of fixing it."
      ],
      source: source("2.1", "Reviewing system prompts for keyword-sensitive instructions that might override well-written tool descriptions"),
      docs: [
        { label: "Claude API docs: Prompting best practices", url: "https://platform.claude.com/docs/en/build-with-claude/prompt-engineering/claude-prompting-best-practices.md", quote: "If your prompts were designed to reduce undertriggering on tools or skills, these models may now overtrigger. The fix is to dial back any aggressive language." }
      ]
    },
    {
      id: "core-d2-010",
      domain: "D2",
      objectives: ["O33"],
      scenario: "s4",
      question: "Your developer productivity agent has a generic run_sql tool on the engineering metadata database, which it uses to look up service owners, on-call rotations and configuration values. Last month it ran an UPDATE statement while \"tidying up\" stale data, and several of its queries scanned whole tables for 40 seconds, slowing down production dashboards. Traces show it has used run_sql only for these three kinds of lookups. What is the best change?",
      options: [
        "Add a rule to the system prompt that run_sql may only be used for SELECT statements with a WHERE clause.",
        "Keep run_sql, but connect it with a read-only database user, so that the agent can no longer change any data.",
        "Replace run_sql with three narrow tools, such as get_service_owner, that take validated parameters and run fixed queries.",
        "Remove run_sql and let engineers look these values up themselves, since database access is too risky for an agent."
      ],
      correct: [2],
      explanation: "A generic SQL tool gives the agent far more power than its three lookups require, which made both the accidental update and the expensive scans possible. Replacing it with narrow tools that accept validated parameters and run fixed, efficient queries limits the agent to exactly what it needs. Writes become impossible, query cost becomes predictable, and the tool interfaces also make it clearer when to use which lookup.",
      optionExplanations: [
        "A prompt rule is guidance the model may not follow, and a SELECT with a WHERE clause can still scan whole tables.",
        "A read-only user prevents writes, but arbitrary queries can still run full-table scans that slow down production.",
        "Constrained tools with fixed queries prevent both writes and expensive scans while keeping the lookups the agent needs.",
        "Removing the tool eliminates the risk but also the value; the lookups can be offered safely with narrower tools."
      ],
      source: source("2.3", "Replacing generic tools with constrained alternatives"),
      docs: [
        { label: "Claude Code docs: Subagents", url: "https://code.claude.com/docs/en/sub-agents.md", quote: "Enforce constraints by limiting which tools a subagent can use" },
        { label: "Claude Code docs: Subagents", url: "https://code.claude.com/docs/en/sub-agents.md", quote: "A subagent that allows Bash access but validates commands to permit only read-only SQL queries." }
      ]
    },
    {
      id: "core-d2-011",
      domain: "D2",
      objectives: ["O35"],
      scenario: "s4",
      question: "Every developer's agent on your team needs two integrations: reading and posting Slack messages, and triggering your company's internal deployment approval flow. A teammate proposes custom MCP servers for both, estimated at two weeks of work plus ongoing maintenance. A maintained community MCP server for Slack exists and supports reading and posting; it passed your security team's third-party review last month. How should you proceed?",
      options: [
        "Use the community server for Slack and build a custom server only for the deployment approval flow, both configured for the whole team.",
        "Build custom servers for both, since third-party code in an agent that can post messages is a supply-chain risk for the team.",
        "Use the community server for Slack configured in your own ~/.claude.json, and add the custom deployment server to the project.",
        "Use the community server for Slack and drop the deployment integration, letting engineers trigger approvals manually instead."
      ],
      correct: [0],
      explanation: "Slack is a standard integration, and a maintained community server that passed the security review already covers it, so building it again adds cost and maintenance without benefit. The deployment approval flow is specific to the company, which is where a custom server is worth the effort. Both belong in the project configuration, because every developer's agent needs them.",
      optionExplanations: [
        "Reusing the reviewed community server for the standard integration and building only the team-specific one saves effort where it is safe to.",
        "The supply-chain concern is real in general, but this server already passed the security review, so rebuilding it adds two weeks for no gain.",
        "A server in your personal ~/.claude.json is not shared with the team, so the other developers' agents would not get Slack.",
        "Dropping the deployment integration avoids building it but fails the requirement that the agent can trigger approvals."
      ],
      source: source("2.4", "Choosing existing community MCP servers over custom implementations for standard integrations"),
      docs: [
        { label: "Claude Code docs: MCP", url: "https://code.claude.com/docs/en/mcp.md", quote: "Directory connectors use the same MCP infrastructure as Claude Code, so you can add any remote server listed there with claude mcp add." },
        { label: "Claude Code docs: MCP", url: "https://code.claude.com/docs/en/mcp.md", quote: "Check .mcp.json into version control so everyone on your team gets the same MCP tools and services." }
      ]
    },
    {
      id: "core-d2-012",
      domain: "D2",
      objectives: ["O17"],
      scenario: "s4",
      question: "An engineer asks your agent: \"Where is the loyalty discount applied during checkout?\" The repository has 1,400 Python files. The agent's trace shows that it listed all files with Glob and then read them in alphabetical order; after 120 files, the context was nearly full and the answer still missing. The engineer expects an answer within a few minutes. How should the agent approach questions like this?",
      options: [
        "Glob for files whose names contain \"checkout\" or \"discount\", read all of them in full, and answer from what they contain.",
        "Search file contents for discount-related names first, open only the matching files, and read onward through the modules they call.",
        "Read every file as before, but write a short summary of each one to a scratchpad file so that the context does not fill up.",
        "Delegate reading the whole repository to an Explore subagent, so that the main conversation only receives the final summary."
      ],
      correct: [1],
      explanation: "Reading files without a lead wastes context and time on code that has nothing to do with the question. Searching the contents for relevant names finds the places where the discount actually appears; reading those files and following the modules they call then builds understanding step by step, only where it matters. This answers the question in minutes and keeps the context focused.",
      optionExplanations: [
        "File names are a weak signal: the logic may live in files like pricing_rules.py, and reading every match in full still wastes context.",
        "A content search finds the relevant code directly, and reading onward from there builds understanding incrementally.",
        "Summaries save context, but reading 1,400 files still takes far longer than the few minutes the engineer expects.",
        "An Explore subagent protects the main context, but it would still read the entire repository, which is slow and costly."
      ],
      source: source("2.5", "starting with Grep to find entry points, then using Read to follow imports and trace flows"),
      docs: [
        { label: "Claude Code docs: Best practices", url: "https://code.claude.com/docs/en/best-practices.md", quote: "You ask Claude to \"investigate\" something without scoping it. Claude reads hundreds of files, filling the context." },
        { label: "Claude Code docs: Best practices", url: "https://code.claude.com/docs/en/best-practices.md", quote: "Scope investigations narrowly or use subagents so the exploration doesn't consume your main context." }
      ]
    },
    {
      id: "core-d2-013",
      domain: "D2",
      scenario: "s4",
      question: "Your team's update_ticket MCP tool returns isError with the text \"Request failed\" in two situations: when the requested status is not one the workflow allows, and when the service account lacks permission for the project. Traces show the agent responding to both the same way: it keeps trying different status names, up to eight attempts, and then tells the engineer the ticket system is down. How should the tool report these errors?",
      options: [
        "Return the HTTP status code from the ticket system with each error, so that the agent can look up what the code means.",
        "Keep the message, but limit the agent to two attempts per ticket, after which it must ask the engineer for help.",
        "Return the full list of statuses the workflow allows with every error, so that the agent can pick a valid one next time.",
        "Say in each error whether the input or the access was the problem and whether another attempt could succeed, with a short reason."
      ],
      correct: [3],
      explanation: "The two failures need opposite reactions. An invalid status is a validation error: the agent can correct the input and try again with an allowed value. A missing permission fails no matter how often it is retried and has to be reported to a person. When the tool says which kind of problem occurred, whether another attempt could succeed, and why, the agent can fix the input in one case and explain the access problem in the other.",
      optionExplanations: [
        "A bare status code leaves the agent to interpret it, and similar codes are often used for different problems.",
        "A retry limit reduces wasted attempts but still treats both errors alike and still produces a misleading message.",
        "The list helps with the invalid status, but the agent still cannot recognize the permission problem and keeps retrying it.",
        "Telling input errors from access errors, with retry guidance, lets the agent react correctly to each."
      ],
      source: source("2.2", "validation errors (invalid input), business errors (policy violations), and permission errors"),
      docs: [
        { label: "MCP specification: Tools", url: "https://modelcontextprotocol.io/specification/2026-07-28/server/tools.md", quote: "Input validation errors (e.g., date in wrong format, value out of range)" },
        { label: "Claude API docs: Handle tool calls", url: "https://platform.claude.com/docs/en/agents-and-tools/tool-use/handle-tool-calls.md", quote: "Instead of generic errors like \"failed\", include what went wrong and what Claude should try next" }
      ]
    },
    {
      id: "core-d2-014",
      domain: "D2",
      objectives: ["O35"],
      scenario: "s4",
      question: "Your team added an internal ticketing MCP server to the project's .mcp.json, with its token referenced as ${TICKETS_TOKEN}. Most developers can use its tools, but on two machines every ticket tool call fails with an authentication error, and Claude starts calling the ticket API with curl through Bash instead. Both developers pulled the latest commit. What is the best first step?",
      options: [
        "Copy the server entry with a hard-coded token into the two developers' personal ~/.claude.json files, so that it works for them.",
        "Add a sentence to CLAUDE.md telling Claude to use the ticketing MCP tools instead of calling the ticket API through Bash.",
        "On the two machines, check the server's warnings in /mcp or claude mcp list and whether TICKETS_TOKEN is set.",
        "Remove the server from .mcp.json and give everyone a shell script that calls the ticket API, so that all machines behave the same."
      ],
      correct: [2],
      explanation: "Configured servers and their tools are picked up from the shared .mcp.json, but the credentials come from each developer's environment. If TICKETS_TOKEN is not set on a machine, Claude Code warns about the missing variable and still loads the server with the unexpanded ${TICKETS_TOKEN} text, so every call fails authentication there. Checking the server's warnings and the variable on the affected machines finds this before anything is changed for the team.",
      optionExplanations: [
        "A hard-coded token in personal files is a security risk and hides the actual cause instead of finding it.",
        "An instruction does not fix the failing authentication, so the ticket tools keep failing on these machines.",
        "The server warnings and the environment variable show why the tools fail only on these machines.",
        "Dropping the server removes a working integration for everyone because of a local problem on two machines."
      ],
      source: source("2.4", "Environment variable expansion in .mcp.json (e.g., ${GITHUB_TOKEN}) for credential management without committing secrets"),
      docs: [
        { label: "Claude Code docs: MCP", url: "https://code.claude.com/docs/en/mcp.md", quote: "If a referenced environment variable isn't set and has no default value, the config still loads: Claude Code reports a missing-variable warning for that server in claude mcp list output and uses the unexpanded ${VAR} text as-is." }
      ]
    },
    {
      id: "core-d2-015",
      domain: "D2",
      objectives: ["O32"],
      scenario: "s4",
      question: "An engineer asks the agent to list every RSpec file in a large monorepo. All of them end in _spec.rb, spread across many directories. Which tool fits best?",
      options: [
        "Glob with a pattern such as **/*_spec.rb.",
        "Grep for files that require spec_helper.",
        "Read each directory's files one by one.",
        "Bash with a script that walks the whole tree."
      ],
      correct: [0],
      explanation: "The request is about file names, not file contents, so a path pattern answers it directly. Glob matches files by name or extension across directories, so **/*_spec.rb returns exactly the spec files in one call. Searching contents, reading files one by one or writing a custom script all do more work and are less precise for a question about names.",
      optionExplanations: [
        "Glob matches file paths by pattern, which is exactly what a naming convention asks for.",
        "A content search depends on a convention inside the files and misses specs that load helpers differently.",
        "Reading files one by one is slow and fills the context with content nobody asked for.",
        "A custom script works but replaces a built-in tool that does this directly and reliably."
      ],
      source: source("2.5", "Glob for file path pattern matching (finding files by name or extension patterns)")
    },
    {
      id: "core-d2-016",
      domain: "D2",
      objectives: ["O37"],
      scenario: "s3",
      question: "Each research run must start with get_research_brief, which returns the client's scope and a list of sources the client has excluded; the search tools need both as input. In 5% of runs the coordinator starts searching straight away, and those reports cite excluded sources. The team wants a fix that uses only request settings, without writing hook code. What should you configure?",
      options: [
        "Add a sentence to the coordinator's system prompt that get_research_brief must always be the first tool it calls in a run.",
        "Set tool_choice to \"any\" on the first request of each run, so that the coordinator must begin with a tool call of some kind.",
        "Force get_research_brief through tool_choice on the first request, then return to automatic tool choice for the following turns.",
        "Merge get_research_brief into each search tool, so that every search loads the brief again before it queries any source."
      ],
      correct: [2],
      explanation: "The brief has to be loaded first every time, so the order should be set by the request rather than requested in the prompt. Forcing get_research_brief with tool_choice on the first request guarantees that the scope and exclusions are known before anything else; afterwards the coordinator chooses tools freely, now with the data the search tools need. \"any\" only guarantees that some tool is called. Note: the current API docs say forced tool use is not supported on every model and setting; where it is not, the same guarantee needs a programmatic check instead.",
      optionExplanations: [
        "A prompt instruction makes the order more likely but not certain, which the 5% already show.",
        "\"any\" guarantees a tool call, not which tool, so a search can still come first.",
        "Forcing the specific tool first and then returning to automatic choice guarantees the order and keeps flexibility later.",
        "Merging changes tool code, which the constraint excludes; it would also repeat the same call for every search."
      ],
      source: source("2.3", "Using tool_choice forced selection to ensure a specific tool is called first"),
      docs: [
        { label: "Claude API docs: Define tools", url: "https://platform.claude.com/docs/en/agents-and-tools/tool-use/define-tools.md", quote: "In some cases, you may want Claude to use a specific tool to answer the user's question, even if Claude would otherwise answer directly without calling a tool." }
      ]
    },
    {
      id: "core-d2-017",
      domain: "D2",
      objectives: ["O17"],
      scenario: "s4",
      question: "Before removing the legacy function send_email, an engineer asks the agent to list all its callers. Grep for send_email finds 4 call sites, but production logs show the function being invoked from 11 places. The file notifications/__init__.py imports send_email, and most of the unexplained calls come from modules that import from the notifications package. How should the agent find all callers?",
      options: [
        "First find every name under which the notifications package passes the function on, then search the codebase for each of those names.",
        "Repeat the Grep for send_email with case-insensitive matching and a wider file filter, so that unusual spellings are found too.",
        "Read every file that imports anything from the notifications package, from top to bottom, and note each place that sends an email.",
        "Glob for files with \"email\" or \"mail\" in their names and read them, since callers of an email function are likely to be found there."
      ],
      correct: [0],
      explanation: "The direct search misses callers that reach the function through the wrapper's own names. Tracing usage across a wrapper module means first identifying every name it exports for the function, for example aliases such as notify_user, and then searching for each of those names across the codebase. That finds all call sites with a few targeted searches instead of reading large parts of the code.",
      optionExplanations: [
        "Identifying the exported aliases first and then searching each name finds callers that use the wrapper.",
        "Different casing does not match calls made under another name, so callers using the package's own names stay missing.",
        "Reading every importing file may work, but it is slow, fills the context and can still miss indirect paths.",
        "File names say little about where a function is called, so this both misses callers and reads unrelated files."
      ],
      source: source("2.5", "Tracing function usage across wrapper modules by first identifying all exported names, then searching for each name across the codebase")
    },
    {
      id: "core-d2-018",
      domain: "D2",
      objectives: ["O34"],
      scenario: "s4",
      question: "You are designing an MCP server for your platform team's agent. It should give the agent access to five capabilities: the service dependency map, the library of operational runbooks, creating an incident ticket, restarting a service, and computing and saving a cost forecast. Engineers complain that today the agent spends many calls just discovering what exists. Which TWO capabilities should be exposed as resources rather than tools? (Select 2)",
      options: [
        "Computing a cost forecast for a service from its metrics and saving the forecast for the finance team.",
        "The service dependency map, as browsable content describing which service calls which.",
        "Creating an incident ticket with a title, a severity and an affected service.",
        "The library of operational runbooks, as a catalog of documents the agent can look into.",
        "Restarting a service after the agent has diagnosed that it is unhealthy."
      ],
      correct: [1, 3],
      explanation: "Resources suit content that the agent should be able to see and browse, such as catalogs and reference material; tools suit actions and parameterized operations that the model decides to invoke. The dependency map and the runbook library are content catalogs, so exposing them as resources lets the agent see what exists without exploratory calls. Creating tickets, restarting services and computing and saving forecasts are actions, so they belong to tools. Note: the MCP specification also has resource templates for parameterized read-only data; the guide frames catalogs as resources and actions as tools.",
      optionExplanations: [
        "Computing and saving a forecast is an operation with a side effect, so it fits a tool.",
        "A dependency map is reference content to browse, which resources are designed for.",
        "Creating a ticket changes state, so it is an action and belongs to a tool.",
        "A runbook library is a content catalog, so exposing it as a resource avoids exploratory calls.",
        "Restarting a service is an action with side effects and belongs to a tool."
      ],
      source: source("2.4", "MCP resources as a mechanism for exposing content catalogs"),
      docs: [
        { label: "MCP specification: Resources", url: "https://modelcontextprotocol.io/specification/2026-07-28/server/resources.md", quote: "Resources in MCP are designed to be application-driven" },
        { label: "MCP specification: Tools", url: "https://modelcontextprotocol.io/specification/2026-07-28/server/tools.md", quote: "Tools in MCP are designed to be model-controlled" }
      ]
    },
    {
      id: "core-d2-019",
      domain: "D2",
      objectives: ["O36"],
      scenario: "s4",
      question: "Your agent helps engineers investigate incidents through an MCP tool search_logs(query), described as \"Searches application logs.\" In 35% of calls the backend answers \"invalid query syntax\": the agent sends questions such as \"errors in payment service yesterday\", while the backend expects field:value filters and an ISO 8601 time range. Each failed call costs a full extra round trip, and the team wants most queries to succeed on the first attempt. What is the most effective fix?",
      options: [
        "Rename the parameter from query to filter_expression, so that the agent understands that it must send filters rather than questions.",
        "Make the tool return a detailed syntax error with the expected format, so that the agent can correct its query on the next attempt.",
        "Rewrite the description to document the field:value grammar and the ISO 8601 range, with two sample queries and what an empty result means.",
        "Put a separate model call in front of the tool that translates the agent's natural-language question into valid filter syntax."
      ],
      correct: [2],
      explanation: "The agent can only form valid inputs if the tool description tells it what valid input looks like. \"Searches application logs\" names the purpose but not the query format, so the agent guesses natural language. Documenting the syntax, the time format, an example and the edge cases lets it build a valid query on the first call. A new parameter name only hints at the format, and better error messages help recovery, but every query would still fail once first.",
      optionExplanations: [
        "A clearer parameter name hints at filters, but it does not document the grammar, the time format or the edge cases.",
        "Detailed errors help the second attempt, but the requirement is success on the first one.",
        "A description with input format, example and edge cases gives the agent what it needs to call the tool correctly.",
        "An extra translation call adds latency and cost for a problem a better description solves."
      ],
      source: source("2.1", "The importance of including input formats, example queries, edge cases, and boundary explanations in tool descriptions"),
      docs: [
        { label: "Claude API docs: Define tools", url: "https://platform.claude.com/docs/en/agents-and-tools/tool-use/define-tools.md", quote: "Provide extremely detailed descriptions. This is by far the most important factor in tool performance." }
      ]
    },
    {
      id: "core-d2-020",
      domain: "D2",
      objectives: ["O36"],
      scenario: "s3",
      question: "Since fetch_url was added, your research agent still often passes full URLs to search_web, described as \"Finds information on the web,\" and gets search results instead of the page. What is the best fix?",
      options: [
        "Remove search_web, so that the agent always uses fetch_url instead.",
        "Describe search_web as taking keywords and point to fetch_url for known URLs.",
        "Make search_web reject any query containing a URL with an error.",
        "Add the system prompt line \"Use fetch_url for web pages.\" to the agent."
      ],
      correct: [1],
      explanation: "The agent picks tools by their descriptions, and \"Finds information on the web\" fits a known URL just as well as a search. Stating what input search_web expects and pointing to fetch_url for known addresses draws the boundary where the agent makes its choice. Rejecting URLs only turns a wrong call into a failed one, and a short prompt line can create new keyword associations without fixing the overlapping description.",
      optionExplanations: [
        "Removing search_web leaves the agent unable to search when it has no URL.",
        "A description that states the expected input and names the alternative removes the overlap where the choice is made.",
        "An error stops wrong results but still costs a wasted call each time and does not tell the agent which tool to use.",
        "A keyword-based prompt line may misroute other requests that mention web pages and leaves the vague description in place."
      ],
      source: source("2.1", "Writing tool descriptions that clearly differentiate each tool's purpose, expected inputs, outputs, and when to use it versus similar alternatives"),
      docs: [
        { label: "Claude API docs: Define tools", url: "https://platform.claude.com/docs/en/agents-and-tools/tool-use/define-tools.md", quote: "When it should be used (and when it shouldn't)" }
      ]
    },
    {
      id: "core-d2-021",
      domain: "D2",
      objectives: [],
      scenario: "s1",
      question: "During a flash sale, your inventory MCP tool check_stock hits the warehouse API's rate limit for a few seconds at a time and then returns isError with the text \"check_stock error\". Traces show two reactions: in some conversations the agent calls check_stock again immediately, up to eight times in a row, which prolongs the rate limiting; in others it tells the customer that the item is out of stock. What should check_stock return in this situation?",
      options: [
        "An error marked as temporary and retryable, with how long to wait before the next attempt and a short note the agent can pass on.",
        "An empty stock list, so that the agent treats the item as unavailable for the moment and stops calling the warehouse API.",
        "The last cached stock level, presented as the current one, so that the customer gets an answer without another API call.",
        "A JSON-RPC protocol error for every failure, so that the MCP client rather than the agent decides how to handle it."
      ],
      correct: [0],
      explanation: "\"check_stock error\" tells the agent neither whether retrying makes sense nor when, so it either hammers the API or gives up and guesses. Marking the error as temporary and retryable, with a wait time, lets the agent retry once at the right moment and keep the customer informed. An empty list and a stale value presented as current both give the customer wrong information, and a protocol error carries no category the agent could act on.",
      optionExplanations: [
        "Category, retry hint and a customer-friendly note let the agent wait briefly and retry instead of hammering or guessing.",
        "An empty list turns a short outage into a false out-of-stock answer.",
        "A cached value passed off as current can be wrong in exactly the moments a sale moves stock fastest.",
        "A protocol error hides the failure type from the agent and gives it nothing to decide on."
      ],
      source: source("2.2", "The difference between retryable and non-retryable errors, and how returning structured metadata prevents wasted retry attempts"),
      docs: [
        { label: "MCP specification: Tools", url: "https://modelcontextprotocol.io/specification/2026-07-28/server/tools.md", quote: "They are reported in tool results with `isError: true`:" }
      ]
    },
    {
      id: "core-d2-022",
      domain: "D2",
      objectives: ["O37"],
      scenario: "s1",
      question: "An email triage agent reads each incoming support email and must end every run by calling route_to_billing, route_to_technical or route_to_sales. The pipeline cannot reply to senders. In 6% of emails the agent writes a text reply instead, such as a question about which product is meant, and those emails stay unrouted until someone notices. Ambiguous emails may go to any queue, since staff can re-route them, and the pipeline runs on a model that supports forced tool use. What fixes this most reliably?",
      options: [
        "Force route_to_technical with tool_choice, since technical questions make up the largest share of the ambiguous emails.",
        "Add a system prompt rule that the agent must never ask questions and must always finish by calling one of the routing tools.",
        "Keep automatic tool choice and, when a response contains no routing call, send it back once with a request for a routing decision.",
        "Set tool_choice to \"any\", so that every response must call one of the routing tools while the agent still picks which one."
      ],
      correct: [3],
      explanation: "The pipeline needs a tool call in every response, but which of the three tools is a decision the agent should keep. \"any\" guarantees a tool call without fixing the tool, so ambiguous emails still land in some queue. Forcing one specific tool removes the agent's routing decision, and a prompt rule or a single re-prompt keeps a residual failure rate. Note: the current API docs say \"any\" and forced tool choice return an error on some newer models; there, the docs recommend automatic tool choice, optionally with strict tool use, so a re-prompt in code like option C is the fallback there.",
      optionExplanations: [
        "Forcing one tool guarantees a call but sends every email to the technical queue.",
        "A prompt rule lowers the rate of text replies but does not guarantee a tool call.",
        "A re-prompt in code catches most misses, but the second attempt can also come back as text.",
        "\"any\" guarantees a routing call and leaves the choice of queue to the agent."
      ],
      source: source("2.3", "Setting tool_choice: \"any\" to guarantee the model calls a tool rather than returning conversational text"),
      docs: [
        { label: "Claude API docs: Define tools", url: "https://platform.claude.com/docs/en/agents-and-tools/tool-use/define-tools.md", quote: "`any` tells Claude that it must use one of the provided tools, but doesn't force a particular tool." }
      ]
    },
    {
      id: "core-d2-023",
      domain: "D2",
      objectives: ["O13"],
      scenario: "s5",
      question: "Your repository's .mcp.json connects Claude Code to Jira and Slack, which developers use daily. The project's .claude/settings.json pre-approves the Jira and Slack tools so that developers are not prompted. Your CI review job runs claude -p in the same checkout and should only read code and print findings. In 3 of the last 200 runs, it created Jira tickets for findings or posted to the team's Slack channel. Developers must keep both servers in their local sessions. How should you configure the CI review?",
      options: [
        "Add a sentence to the CI prompt saying that the review must never create tickets or post messages, only print its findings.",
        "Remove .mcp.json from the repository and ask each developer to configure the Jira and Slack servers locally in their user settings.",
        "Revoke the CI service account's Jira and Slack tokens, so that the calls fail with an error when the review tries to make them.",
        "Limit the CI run to code-reading tools and remove every MCP tool from it with command-line flags, leaving the project files unchanged."
      ],
      correct: [3],
      explanation: "The review needs only to read code, so the CI invocation should give it only those tools and deny the MCP tools it inherits from the project configuration. Restricting tools per run keeps the servers available to developers while making out-of-role actions impossible in CI. A prompt sentence leaves a residual failure rate, removing the shared configuration hurts developers, and revoked tokens produce failing calls the agent may retry or report confusingly.",
      optionExplanations: [
        "A prompt instruction lowers the rate but cannot guarantee that no ticket is created.",
        "Developers would lose the shared configuration they rely on.",
        "Failing calls still reach the tools, and the agent wastes turns on errors.",
        "Restricting the run's tools and denying MCP tools removes the possibility of out-of-role actions in CI."
      ],
      source: source("2.3", "Scoped tool access: giving agents only the tools needed for their role, with limited cross-role tools for specific high-frequency needs"),
      docs: [
        { label: "Claude Code docs: CLI reference", url: "https://code.claude.com/docs/en/cli-reference.md", quote: "and `\"mcp__*\"` removes every MCP tool" }
      ]
    },
    {
      id: "core-d2-024",
      domain: "D2",
      objectives: ["O35"],
      scenario: "s4",
      question: "You added your prototype MCP server to the project's .mcp.json for your own experiments. Now every teammate is asked to approve a server they never use, and it fails to connect for them. Where should it be configured instead?",
      options: [
        "In the project's .claude/settings.json, outside of .mcp.json.",
        "In the project CLAUDE.md, as setup steps for whoever wants it.",
        "In .mcp.json, with a ${VAR} that only your machine sets.",
        "In your own configuration in ~/.claude.json, not in the project."
      ],
      correct: [3],
      explanation: "Project-level .mcp.json is for servers the whole team shares; personal and experimental servers belong in your own configuration in ~/.claude.json, where they stay private to you. Any file committed to the repository reaches every teammate, and an environment variable only you set still leaves the server in everyone's configuration, where it fails. CLAUDE.md gives instructions to Claude, it does not configure servers. Note: the current docs call the default scope of claude mcp add \"local\" (this project only) and \"user\" the scope for all projects; both are stored in ~/.claude.json.",
      optionExplanations: [
        "Project settings are shared through the repository just like .mcp.json.",
        "CLAUDE.md holds instructions for Claude and does not register MCP servers.",
        "The server stays in every teammate's configuration, still asks for approval and fails where the variable is unset.",
        "Your own configuration keeps the experimental server private to you."
      ],
      source: source("2.4", "Configuring personal/experimental MCP servers in user-scoped ~/.claude.json"),
      docs: [
        { label: "Claude Code docs: MCP", url: "https://code.claude.com/docs/en/mcp.md", quote: "A local-scoped server loads only in the project where you added it and stays private to you." }
      ]
    },
    {
      id: "core-d2-025",
      domain: "D2",
      objectives: ["O32"],
      scenario: "s4",
      question: "An engineer asks your agent which files under src/auth/ changed in the last three commits. Which built-in tool fits this best?",
      options: [
        "Glob with src/auth/** to list the files in that folder.",
        "Grep for \"auth\" across the repository's file contents.",
        "Bash, running git log for those commits limited to src/auth/.",
        "Read on each file in src/auth/ to compare their contents."
      ],
      correct: [2],
      explanation: "The question is about version history, which only git can answer; neither file names nor file contents show what changed in which commit. Running git through Bash for the last three commits, limited to the folder, answers it directly (general knowledge: git log can be restricted to a path). Glob lists files, Grep searches contents, and Read shows the current state, none of which reveals changes.",
      optionExplanations: [
        "Glob lists the files that exist, not which of them changed.",
        "Content search does not show commit history.",
        "Git history through Bash answers which files the commits touched.",
        "Reading current contents cannot show what was changed."
      ],
      source: source("2.5", "Select and apply built-in tools (Read, Write, Edit, Bash, Grep, Glob)")
    },
    {
      id: "core-d2-026",
      domain: "D2",
      objectives: ["O36"],
      scenario: "s1",
      question: "Your support agent has two tools, search_kb (\"Searches knowledge.\") and search_tickets (\"Searches support data.\"). search_kb covers product manuals; search_tickets covers past customer tickets. In 25% of conversations the agent searches the wrong one, for example manuals when the customer asks whether others have reported the same problem. Which two changes most directly reduce this misrouting? (Select 2)",
      options: [
        "Add a sentence to the system prompt saying that search_kb should always be tried first for any question.",
        "Rewrite both descriptions to say what each tool searches, what it returns, and when to use it instead of the other.",
        "Rename search_kb to search_product_manuals, so that its name already says which content it covers.",
        "Add a third tool, search_all, that queries both sources at once for cases where the agent is unsure.",
        "Add a few examples of ticket-history questions to the system prompt, each showing a call to search_tickets."
      ],
      correct: [1, 2],
      explanation: "The agent picks tools by name and description, and both currently say almost nothing about their content. Descriptions that state what each tool covers and when to prefer it, together with a name that reflects the content, remove the overlap at its source. A blanket \"try search_kb first\" rule creates a new bias, a combined tool adds a third overlapping option, and examples in the system prompt cover only the questions they show while the vague descriptions remain.",
      optionExplanations: [
        "A fixed preference sends ticket questions to the manuals even more often.",
        "Specific descriptions with boundaries give the agent the information it selects tools by.",
        "A descriptive name reinforces the boundary between the two tools.",
        "A catch-all tool adds a third overlapping choice instead of clarifying the two.",
        "Examples help for the questions they cover, but the vague descriptions keep misleading the agent on other questions."
      ],
      source: source("2.1", "Renaming tools and updating descriptions to eliminate functional overlap (e.g., renaming analyze_content to extract_web_results with a web-specific description)")
    },
    {
      id: "core-d2-027",
      domain: "D2",
      objectives: [],
      scenario: "s1",
      question: "Your order-management MCP server is being updated to return structured errors with an isRetryable flag. The agent will retry a call with the same input, after a short wait, whenever that flag is true. For which two failures should the server set isRetryable to true? (Select 2)",
      options: [
        "The payment service did not answer within the 10-second timeout.",
        "The refund was rejected because the order is outside the 30-day return window.",
        "The service account is not permitted to modify orders in this region.",
        "The payment service returned a conflict because another request is already refunding the same order.",
        "The warehouse API returned a rate-limit error and asked the client to wait two seconds."
      ],
      correct: [0, 4],
      explanation: "Retrying the same call only helps when the cause is temporary, as with a timeout or a rate limit that clears after a short wait. A policy rejection and a missing permission will fail again in exactly the same way, and repeating a refund that another request is already processing risks paying twice. These should be marked as not retryable; the agent then explains the policy, escalates the access problem or checks the refund's status instead of repeating the call.",
      optionExplanations: [
        "A timeout is transient, so the same call may succeed shortly after.",
        "A policy rejection is a business error that will not change on retry.",
        "A permission error persists until someone changes the access rights.",
        "Repeating the refund while another one is in progress risks a double refund; the agent should check the refund status instead.",
        "A rate limit clears after the requested wait, so retrying makes sense."
      ],
      source: source("2.2", "The difference between retryable and non-retryable errors, and how returning structured metadata prevents wasted retry attempts")
    }
  ]);
})();
