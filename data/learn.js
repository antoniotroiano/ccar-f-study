/* Study notes ("Learn" screen). D1 is in this file, D2 to D5 in learn-d2.js to learn-d5.js (same shape).
   Own short summaries written from the official docs (cached 20 Oct 2026), with a link for every topic.
   They are not copies of the Exam Guide or of the docs. Keep them short and check every claim against the linked page.
   Per topic: points, optional "current" (where the docs differ from the Exam Guide), traps (a wrong answer that sounds right, and why it is wrong).
   Practice ids are stored in the browser (ccarf.practice.v1): never change an id once published. */
window.LEARN = window.LEARN || {};
window.LEARN.D1 = {
    checked: "2026-10-20",
    topics: [
      {
        id: "1.1",
        title: "Agentic loops",
        points: [
          "The loop: send the request, look at stop_reason. While it is \"tool_use\", run the requested tools, append the results to the conversation and call again. Stop when it is \"end_turn\".",
          "Tool results go back in a user message, so the model sees them when it decides the next step. With parallel tool calls, all results of one response go back together in a single user message.",
          "Claude decides which tool comes next from the context. A fixed order of tools is a workflow you wrote, not a model-driven loop.",
          "Signs of a weak loop: reading the assistant's text to guess that it is done, or using an iteration cap as the main way to stop. A cap such as max_turns is a safety net against runaway sessions, the real stop signal is stop_reason."
        ],
        docs: [
          { label: "How tool use works", url: "https://platform.claude.com/docs/en/agents-and-tools/tool-use/how-tool-use-works.md" },
          { label: "Parallel tool use", url: "https://platform.claude.com/docs/en/agents-and-tools/tool-use/parallel-tool-use.md" },
          { label: "Agent SDK: the agent loop", url: "https://code.claude.com/docs/en/agent-sdk/agent-loop.md" }
        ],
        traps: [
          { wrong: "End the loop as soon as the reply contains text.", why: "A response can hold text and a tool request together. The signal is stop_reason: \"tool_use\" means go on, \"end_turn\" means done." },
          { wrong: "Stop after a fixed number of iterations.", why: "A cap can cut the task off halfway. Keep it as a safety net, not as the way the loop normally ends." },
          { wrong: "Always call the tools in the same hard-coded order.", why: "That is a workflow you wrote. In an agentic loop Claude chooses the next tool from the context." },
          { wrong: "Send only the latest tool result back.", why: "The model needs the conversation so far. Append each result to the history, in a user message." }
        ],
        current: "In the Agent SDK you usually do not write this loop yourself: the SDK runs it and ends with a result message whose subtype says whether the task succeeded or hit a limit such as max turns or a budget. The exam still asks how the loop itself works."
      },
      {
        id: "1.2",
        title: "Coordinator and subagents",
        points: [
          "Hub and spoke: one coordinator decides what to delegate, collects the results and handles errors. In this pattern all communication goes through the coordinator, which keeps it observable and errors handled in one place.",
          "A subagent runs in its own context. Its tool calls and results stay inside it, and only its final message comes back to the coordinator.",
          "The coordinator should pick subagents by what the query needs, not always run the whole pipeline.",
          "If the coordinator splits a broad topic too narrowly, whole areas are never covered. Give each subagent a distinct part of the scope to avoid overlap, then check the combined result for gaps and send targeted follow-up work."
        ],
        docs: [
          { label: "Agent SDK: subagents", url: "https://code.claude.com/docs/en/agent-sdk/subagents.md" },
          { label: "Claude Code: subagents", url: "https://code.claude.com/docs/en/sub-agents.md" }
        ],
        traps: [
          { wrong: "Subagents see the coordinator's conversation.", why: "They start fresh. Only what the coordinator puts into the subagent's prompt reaches it." },
          { wrong: "Run every subagent for every query.", why: "The coordinator should choose subagents by what the query needs." },
          { wrong: "Let subagents talk to each other directly.", why: "In this pattern everything goes through the coordinator, so you keep one place for routing and error handling." },
          { wrong: "Split a broad topic into a few narrow subtasks.", why: "Narrow pieces leave gaps. The coordinator should check coverage and send targeted follow-up work." }
        ]
      },
      {
        id: "1.3",
        title: "Spawning subagents and passing context",
        points: [
          "A subagent starts without the coordinator's history. The only thing that reaches it from the parent is the prompt the coordinator writes for it, so put everything it needs into that prompt: earlier findings, the goal, how to judge success.",
          "A subagent is defined by a description (tells Claude when to use it), a prompt (its own system prompt) and an optional tool list. Leaving the tool list out gives it all tools that subagents can have.",
          "Independent subtasks run in parallel when the coordinator starts several subagents in one response. The total time is about that of the slowest one.",
          "Pass findings as structured data and keep the content apart from its source (URL, document, page), so attribution survives the handoff.",
          "Describe goals and quality criteria, not a step-by-step script. That leaves room for the subagent to adapt.",
          "A fork is the exception to the clean start: it begins with a copy of the parent's conversation. Use it when a normal subagent would need too much background.",
          "Naming: the Exam Guide calls the tool that starts subagents the Task tool. The current docs call it the Agent tool (older versions used \"Task\"). The coordinator must be allowed to use it."
        ],
        docs: [
          { label: "Agent SDK: subagents", url: "https://code.claude.com/docs/en/agent-sdk/subagents.md" },
          { label: "Claude Code: subagents (forks)", url: "https://code.claude.com/docs/en/sub-agents.md" }
        ],
        traps: [
          { wrong: "The subagent shares the parent's memory.", why: "Its context is separate. The only channel from the parent is the prompt string." },
          { wrong: "A subagent with no tool list gets no tools.", why: "Leaving the list out means it inherits the tools available to subagents. Name the tools to restrict it." },
          { wrong: "Start independent subagents one per turn.", why: "Several subagents started in one response run in parallel." },
          { wrong: "Write the coordinator prompt as a step-by-step script.", why: "Goals and quality criteria let the subagent adapt. A script makes it brittle." }
        ],
        current: "Naming: the Exam Guide says Task tool, the current docs say Agent tool (older versions emitted \"Task\"). In SDK code the coordinator's allowed tools must include it. Forks are the one case where a subagent starts with the parent's conversation."
      },
      {
        id: "1.4",
        title: "Workflows with enforcement and handoff",
        points: [
          "Order of steps can be guided by a prompt or enforced by code. A prompt is followed most of the time, code is followed every time.",
          "When a rule must always hold (for example: verify the customer before a refund), enforce it: block the later tool call until the earlier step has returned what it needs.",
          "When a case goes to a human, send a summary that works without the transcript: who the customer is, what the cause is, what was done and what you recommend.",
          "A request with several concerns can be split into separate items, investigated in parallel with shared context, then combined into one answer."
        ],
        docs: [
          { label: "Claude Code: hooks guide", url: "https://code.claude.com/docs/en/hooks-guide.md" },
          { label: "Agent SDK: hooks", url: "https://code.claude.com/docs/en/agent-sdk/hooks.md" }
        ],
        traps: [
          { wrong: "Put \"always verify the customer first\" into the system prompt.", why: "A prompt is followed most of the time. When a rule must always hold, block the later call in code until the prerequisite step has returned." },
          { wrong: "Hand the human the full transcript.", why: "The human may not have it, and it is long. Send a short structured summary: who, cause, what was done, what you recommend." },
          { wrong: "Handle a request with several concerns as one blob.", why: "Split it into separate items, look at them in parallel with shared context, then combine the answers." }
        ]
      },
      {
        id: "1.5",
        title: "Hooks on tool calls",
        points: [
          "PreToolUse runs before a tool executes. It can deny the call (with a reason the model sees), change the input, or hand the decision on. Use it to block or redirect, for example a refund above a limit goes to a human instead.",
          "PostToolUse runs after the tool has succeeded. It cannot undo the action. It can replace the output before Claude sees it (updatedToolOutput), which suits cleaning up different formats such as timestamps or status codes.",
          "Hooks give deterministic control: the action always happens. A prompt instruction only makes it likely.",
          "A matcher limits a hook to certain tools. In a subagent, the hook input names the agent (agent_id, agent_type)."
        ],
        docs: [
          { label: "Agent SDK: hooks", url: "https://code.claude.com/docs/en/agent-sdk/hooks.md" },
          { label: "Claude Code: hooks reference", url: "https://code.claude.com/docs/en/hooks.md" },
          { label: "Claude Code: hooks guide", url: "https://code.claude.com/docs/en/hooks-guide.md" }
        ],
        traps: [
          { wrong: "Use a PostToolUse hook to block a call.", why: "It runs after the tool has succeeded and cannot undo it. Blocking needs PreToolUse." },
          { wrong: "Enforce a hard limit with a prompt instruction.", why: "A prompt makes the limit likely. A hook makes it certain." },
          { wrong: "Clean up different data formats in the system prompt.", why: "A PostToolUse hook can change the result before Claude sees it, so the model gets one consistent format." }
        ],
        current: "The docs list more hook events than the exam text uses. A PreToolUse hook can allow, deny, ask or defer, and can change the tool input. For results, updatedToolOutput replaces what Claude sees, for any tool."
      },
      {
        id: "1.6",
        title: "Task decomposition",
        points: [
          "Prompt chaining: fixed sequential steps. It fits predictable work with several aspects, and when you want to inspect the output between steps.",
          "Dynamic decomposition: the plan is built from what each step finds. It fits open-ended work, such as adding tests to an unfamiliar codebase: map the structure first, find the high-impact parts, make a prioritised plan and adjust it as dependencies appear.",
          "For a large review, analyse each file on its own, then run a separate pass for how the files interact. One huge pass over everything dilutes attention.",
          "Prompting tip from the docs: general instructions often work better than a prescriptive list of steps."
        ],
        docs: [
          { label: "Prompting best practices", url: "https://platform.claude.com/docs/en/build-with-claude/prompt-engineering/claude-prompting-best-practices.md" },
          { label: "Claude Code: best practices", url: "https://code.claude.com/docs/en/best-practices.md" }
        ],
        traps: [
          { wrong: "Review all files in one big pass.", why: "Attention gets diluted. Review each file on its own, then do a separate pass for how the files interact." },
          { wrong: "Use a fixed chain for an open-ended investigation.", why: "You do not know the steps in advance. Build the plan from what each step finds." },
          { wrong: "Plan dynamically for a routine, predictable review.", why: "A fixed chain is simpler and easier to inspect when the steps are known." }
        ]
      },
      {
        id: "1.7",
        title: "Sessions: resume and fork",
        points: [
          "Resume continues a specific earlier session. In the SDK you pass its session ID, in the CLI you can resume by name: claude --resume <name>.",
          "Fork starts a new session with a copy of the original history and goes its own way from there. Use it to compare two approaches from the same analysis.",
          "After files changed, tell the resumed agent what changed. Old tool results may no longer be true.",
          "If much of the earlier context is stale, a fresh session that starts from a short summary of the results you need is more reliable than resuming."
        ],
        docs: [
          { label: "Agent SDK: sessions", url: "https://code.claude.com/docs/en/agent-sdk/sessions.md" },
          { label: "Claude Code: CLI reference", url: "https://code.claude.com/docs/en/cli-reference.md" }
        ],
        traps: [
          { wrong: "Always resume the old session.", why: "If files changed, old tool results may be wrong. Tell the agent what changed, or start fresh from a short summary." },
          { wrong: "Resume the session to try a second approach.", why: "Resuming continues the same session. To explore a different approach from the same starting point, fork it." },
          { wrong: "A fork keeps following the original.", why: "It starts with a copy of the history and then goes its own way." }
        ],
        current: "In the SDK, resume takes a session ID, and continue picks up the most recent session without one. The CLI can resume by ID or by name (claude --resume <name>)."
      }
    ],
    // Decision guides: short tables for "which one when" questions
    guides: [
      {
        title: "Hook or prompt instruction?",
        headers: ["", "Hook", "Prompt instruction"],
        rows: [
          ["Behaviour", "Runs every time the event happens", "Usually followed, not guaranteed"],
          ["Use for", "Rules that must always hold: blocking an action, required step order, data clean-up", "Style, preferences, how to approach a task"],
          ["Cost of a miss", "Handled in code", "Needs a check somewhere else"]
        ]
      },
      {
        title: "PreToolUse or PostToolUse?",
        headers: ["", "PreToolUse", "PostToolUse"],
        rows: [
          ["Runs", "Before the tool executes", "After the tool has succeeded"],
          ["Can", "Deny, change the input, ask or defer", "Change what Claude sees as the result. Cannot undo the action"],
          ["Typical use", "Block a forbidden call, send it to a human", "Normalise formats before the model reads them"]
        ]
      },
      {
        title: "Prompt chaining or dynamic decomposition?",
        headers: ["", "Prompt chaining", "Dynamic decomposition"],
        rows: [
          ["Plan", "Fixed steps in a fixed order", "Built from what earlier steps find"],
          ["Fits", "Predictable, repeatable work", "Open-ended investigation"],
          ["Example", "Per-file review, then a cross-file pass", "Tests for a legacy codebase: map, rank, plan, adjust"]
        ]
      },
      {
        title: "Resume, fork or start fresh?",
        headers: ["Situation", "Use"],
        rows: [
          ["Earlier context is still valid, you want to go on", "Resume the session"],
          ["You want to try two approaches from the same starting point", "Fork the session"],
          ["Earlier tool results are stale (files changed a lot)", "New session with a short summary of what you need"]
        ]
      },
      {
        title: "Subagent or one agent?",
        headers: ["", "Subagents", "One agent"],
        rows: [
          ["Fits", "Independent subtasks, a lot of reading that would clutter the main context, tool limits per role", "Small tasks, steps that depend on each other closely"],
          ["Watch out", "The subagent knows only its prompt. The docs warn that some models (they name Claude Opus 4.6) may spawn subagents when a direct approach would do", "One long conversation can fill up with detail"]
        ]
      }
    ],
    // Things to build once. Ids are stored when ticked.
    practice: [
      { id: "d1-loop", text: "Write an agent loop by hand with the Messages API. Continue while stop_reason is \"tool_use\", return the tool results, stop on \"end_turn\"." },
      { id: "d1-parallel", text: "Get two independent tool calls in one response and return both results in a single user message." },
      { id: "d1-subagent", text: "Define a subagent with a description, a system prompt and a short tool list. Check what it can and cannot do." },
      { id: "d1-context", text: "Ask a subagent something that needs earlier findings. See it fail, then pass the findings in its prompt." },
      { id: "d1-parallel-sub", text: "Make a coordinator start two independent subagents in the same response." },
      { id: "d1-hook-block", text: "Write a PreToolUse hook that denies a tool call (for example a write to .env) and gives a reason." },
      { id: "d1-hook-post", text: "Write a PostToolUse hook that changes a tool result, for example one timestamp format into another." },
      { id: "d1-gate", text: "Make one tool call impossible until a prerequisite tool has returned (for example refund only after customer lookup)." },
      { id: "d1-chain", text: "Review three files with one pass per file and one final pass for how they fit together." },
      { id: "d1-resume", text: "Resume a named session after you changed a file, and tell the agent what changed." },
      { id: "d1-fork", text: "Fork a session and try two different approaches from the same starting point." }
    ]
};
