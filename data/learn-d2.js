/* Study notes, domain D2. Same shape and rules as data/learn.js. Sources: docs cached 20 Oct 2026. */
window.LEARN = window.LEARN || {};
window.LEARN.D2 = {
  checked: "2026-10-20",
  topics: [
    {
      id: "2.1",
      title: "Tool descriptions and boundaries",
      points: [
        "Claude chooses a tool mainly from its description. The docs call detailed descriptions by far the most important factor for tool performance.",
        "A good description says what the tool does, when to use it and when not to, what each input means and what the tool does not return.",
        "Two tools with near-identical descriptions get mixed up. Make their purposes clearly different: rename them, rewrite the descriptions, or split a vague generic tool into specific ones with clear inputs and outputs.",
        "The system prompt can pull tool choice off course. Strong keyword-style instructions can tie a word to the wrong tool and override a good description, and the docs warn that aggressive wording can make newer models over-trigger tools."
      ],
      docs: [
        { label: "Define tools", url: "https://platform.claude.com/docs/en/agents-and-tools/tool-use/define-tools.md" },
        { label: "Prompting best practices", url: "https://platform.claude.com/docs/en/build-with-claude/prompt-engineering/claude-prompting-best-practices.md" }
      ],
      traps: [
        { wrong: "A short name is enough, the model will work it out.", why: "The description is the main signal for choosing a tool. A thin description makes selection unreliable, especially between similar tools." },
        { wrong: "Keep two overlapping tools and add a rule to the system prompt.", why: "That treats the symptom. Make the tools themselves distinct, in name and description." },
        { wrong: "Add ALWAYS and MUST to the system prompt so the tool gets used.", why: "Keyword-heavy or aggressive wording can create unintended associations and make tools fire when they should not." },
        { wrong: "One generic tool with a vague description is simplest.", why: "A broad tool with an unclear contract is picked and used badly. Clear purpose and clear inputs and outputs work better." }
      ],
      current: "The docs lean toward fewer, more capable tools (for example one tool with an action parameter instead of one tool per action). The Exam Guide's example splits a vague generic tool into specific ones. Both aim at the same thing: no overlap and a clear contract. Ask what removes the ambiguity in the case in front of you."
    },
    {
      id: "2.2",
      title: "Structured tool errors",
      points: [
        "Tell the model that a call failed. In the Claude API a tool result carries is_error, in MCP the result carries isError. That marks a failure instead of leaving it looking like odd data.",
        "MCP separates protocol errors from tool execution errors. Execution errors, such as invalid input, carry feedback the model can use to correct itself and try again.",
        "A generic \"Operation failed\" gives the agent nothing to decide with. Say what failed, whether trying again can help and what to do instead.",
        "Kinds of failure call for different handling: transient (timeout, service down) may be worth a retry, a validation error needs different input, a business-rule refusal should not be retried and needs a clear explanation, a permission error needs another route.",
        "A search that finds nothing is a valid empty result, not an error. Do not mix it up with an access failure.",
        "In a multi-agent setup, a subagent should first try to recover from transient failures itself. It passes up only what it could not fix, together with partial results and what it already tried."
      ],
      docs: [
        { label: "Handle tool calls", url: "https://platform.claude.com/docs/en/agents-and-tools/tool-use/handle-tool-calls.md" },
        { label: "MCP specification: tools", url: "https://modelcontextprotocol.io/specification/2026-07-28/server/tools.md" },
        { label: "Agent SDK: custom tools", url: "https://code.claude.com/docs/en/agent-sdk/custom-tools.md" }
      ],
      traps: [
        { wrong: "Return \"Operation failed\" for every problem.", why: "The agent cannot tell whether to retry, change the input or give up." },
        { wrong: "Retry every error automatically.", why: "Validation, business-rule and permission errors will fail the same way again. Retries only help for transient problems." },
        { wrong: "Report a search with no results as an error.", why: "An empty result is a successful answer. Calling it an error sends the agent into needless recovery." },
        { wrong: "A subagent passes every transient error straight to the coordinator.", why: "Handle what can be fixed locally first. Pass up the rest with partial results and what was tried." }
      ],
      current: "isError (MCP) and is_error (Claude API) are real fields. Names such as errorCategory and isRetryable come from the Exam Guide as a design pattern. The docs and the MCP specification do not define them, so you put such fields into the error content yourself."
    },
    {
      id: "2.3",
      title: "Tools per agent and tool_choice",
      points: [
        "Too many tools hurt selection. The Exam Guide contrasts about 18 tools with 4 or 5. The docs also say fewer, more capable tools reduce selection ambiguity.",
        "Give each agent the tools its role needs. An agent with tools outside its job tends to use them, for example a synthesis agent starting web searches. In Claude Code you limit a subagent by listing its tools.",
        "Replace a broad tool with a constrained one (a document loader that checks URLs instead of a free fetch). For a frequent small need across roles, give a narrow scoped tool and route the hard cases through the coordinator.",
        "tool_choice controls whether a tool is called: auto lets the model decide (the default), any means it must call some tool but you do not pick which, a forced tool means it must call that one, none turns tools off.",
        "To make sure one tool runs first, force it, then continue in follow-up turns. To make sure the reply is a tool call rather than chat text, use any."
      ],
      docs: [
        { label: "Define tools (tool_choice)", url: "https://platform.claude.com/docs/en/agents-and-tools/tool-use/define-tools.md" },
        { label: "Claude Code: subagents", url: "https://code.claude.com/docs/en/sub-agents.md" }
      ],
      traps: [
        { wrong: "Give every agent all tools to keep it flexible.", why: "More tools make the choice harder, and agents misuse tools outside their role." },
        { wrong: "Use tool_choice any to make sure a particular tool runs first.", why: "any only guarantees that some tool is called. To pick the tool, force it." },
        { wrong: "Use auto to guarantee a tool call.", why: "With auto the model may simply answer in text." },
        { wrong: "Let the synthesis agent use the full web-search tool for the odd fact check.", why: "Give it a narrow scoped tool for that need and send bigger questions back through the coordinator." }
      ],
      current: "The docs list four tool_choice options, including none. The Exam Guide names three. The docs also say not every model and setting supports forced tool use, where any and a forced tool fail while auto and none still work."
    },
    {
      id: "2.4",
      title: "MCP servers in Claude Code",
      points: [
        "Scopes decide who gets a server. Project scope is a .mcp.json in the repository that you check in, so the whole team gets the same tools. Local scope (the default) keeps a server private to you in one project. User scope makes it available in all your projects. Local and user servers are stored in ~/.claude.json.",
        "Do not put secrets in a shared file. .mcp.json supports ${VAR} expansion, so the token stays in the environment. If the variable is not set and has no default, the config still loads, with a warning, and the literal ${VAR} text is used.",
        "MCP resources expose content such as documents, database schemas or issue summaries. The agent can see what exists without exploring with tool calls. Claude Code provides tools to list and read resources.",
        "Tools are designed to be chosen by the model, resources to be chosen by the application.",
        "A thin MCP tool description can lose against a built-in tool such as Grep. Describe what the MCP tool can do and return.",
        "For a standard integration such as Jira, use an existing server first. Write a custom server for team-specific workflows."
      ],
      docs: [
        { label: "Claude Code: MCP", url: "https://code.claude.com/docs/en/mcp.md" },
        { label: "MCP specification: resources", url: "https://modelcontextprotocol.io/specification/2026-07-28/server/resources.md" },
        { label: "MCP specification: tools", url: "https://modelcontextprotocol.io/specification/2026-07-28/server/tools.md" }
      ],
      traps: [
        { wrong: "Write the API token straight into .mcp.json.", why: "The file is committed. Use ${VAR} expansion and keep the token in the environment." },
        { wrong: "Add a personal experimental server to the project .mcp.json.", why: "That shares it with the whole team. Use local or user scope for personal servers." },
        { wrong: "Build a custom server for a standard tool like Jira.", why: "Start with an existing server and keep custom ones for what is specific to your team." },
        { wrong: "Keep the MCP tool description short, the agent will find the tool.", why: "The agent may prefer a built-in tool like Grep. A detailed description shows what the MCP tool does better." },
        { wrong: "Let the agent find the database tables with repeated exploratory tool calls.", why: "Expose the schema as a resource so it sees what exists up front." }
      ],
      current: "The Exam Guide mentions project scope (.mcp.json) and user scope (~/.claude.json). The docs name three scopes: local (the default, private to you in this project), project and user. Local and user entries both live in ~/.claude.json."
    },
    {
      id: "2.5",
      title: "Built-in tools: Read, Write, Edit, Bash, Grep, Glob",
      points: [
        "Grep searches file contents: callers of a function, an error message, an import. Glob finds files by name pattern, for example all test files.",
        "Read and Write work on whole files. Edit changes a targeted piece of text that it finds by matching it, so the match has to be unique.",
        "If Edit cannot find a unique match, fall back to reading the whole file and writing it back.",
        "Build understanding step by step: Grep to find entry points, Read to follow imports and trace the flow. Do not read every file up front.",
        "To trace a function used through wrapper modules, first list the names a module exports, then search for each name.",
        "The Claude Code docs back the idea of narrow exploration: scope investigations or use subagents so the exploration does not fill your main context."
      ],
      docs: [
        { label: "Claude Code: best practices", url: "https://code.claude.com/docs/en/best-practices.md" }
      ],
      traps: [
        { wrong: "Use Glob to find every caller of a function.", why: "Glob matches file paths. Finding callers means searching contents, which is Grep." },
        { wrong: "Read every file first to understand the codebase.", why: "That floods the context. Start from entry points found with Grep and follow the trail." },
        { wrong: "Retry Edit with the same short snippet when it matches several places.", why: "A match must be unique. Read the file and write it back instead." },
        { wrong: "Use Grep to find files named *.test.tsx.", why: "Matching names is Glob's job." }
      ],
      current: "This topic follows the Exam Guide. The cached docs have no page with the full tool reference, so the exact tool behaviour was not checked there. Check the current tools reference in the Claude Code docs for details."
    }
  ],
  guides: [
    {
      title: "tool_choice options",
      headers: ["Option", "What happens"],
      rows: [
        ["auto (default)", "The model decides whether to call a tool"],
        ["any", "The model must call one of the tools, you do not choose which"],
        ["tool (forced)", "The model must call the tool you name"],
        ["none", "No tool calls"]
      ]
    },
    {
      title: "Which error, which reaction?",
      headers: ["Kind", "Typical reaction"],
      rows: [
        ["Transient (timeout, service down)", "Retry, maybe after a wait"],
        ["Validation (bad input)", "Fix the input, then try again"],
        ["Business rule (policy says no)", "Do not retry, explain clearly"],
        ["Permission", "Do not retry the same call, take another route or ask"],
        ["Valid empty result", "Not an error, report that nothing matched"]
      ]
    },
    {
      title: "MCP scopes in Claude Code",
      headers: ["Scope", "Who gets the server", "Where"],
      rows: [
        ["Local (default)", "You, in this project only", "~/.claude.json"],
        ["Project", "Everyone who uses the repository", ".mcp.json in the project, checked in"],
        ["User", "You, in all projects", "~/.claude.json"]
      ]
    },
    {
      title: "Tools or resources?",
      headers: ["", "Tools", "Resources"],
      rows: [
        ["Chosen by", "The model", "The application"],
        ["For", "Doing something or fetching on demand", "Showing what content exists, such as schemas or documents"]
      ]
    },
    {
      title: "Which built-in tool?",
      headers: ["I want to", "Use"],
      rows: [
        ["Find where a function or error message appears", "Grep"],
        ["Find files by name or extension", "Glob"],
        ["See a whole file", "Read"],
        ["Change a small unique piece of text", "Edit"],
        ["Edit when the text is not unique", "Read the file, then Write it back"]
      ]
    }
  ],
  practice: [
    { id: "d2-desc", text: "Define two tools with similar descriptions and watch Claude mix them up. Rewrite the descriptions and test again." },
    { id: "d2-error", text: "Make a tool return a failure with is_error and a clear message. See how the agent reacts to a transient and to a validation error." },
    { id: "d2-empty", text: "Return \"no results\" once as a successful empty result and once as an error. Compare what the agent does next." },
    { id: "d2-toolchoice", text: "Call the API with tool_choice auto, any and a forced tool. Note when text comes back instead of a tool call." },
    { id: "d2-scope", text: "Give a subagent a list of three tools and check that it cannot use anything else." },
    { id: "d2-mcp-project", text: "Add an MCP server to a project .mcp.json with a ${VAR} token. Start without the variable set and read the warning." },
    { id: "d2-mcp-user", text: "Add an MCP server with user scope and confirm that it also appears in another project." },
    { id: "d2-resource", text: "Expose a document or schema as an MCP resource and let Claude read it." },
    { id: "d2-builtin", text: "Trace one function through a codebase with Grep and Read. Then make an Edit fail on non-unique text and recover." }
  ]
};
