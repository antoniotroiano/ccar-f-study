/* Study notes, domain D5. Same shape and rules as data/learn.js. Sources: docs cached 20 Oct 2026.
   Much of D5 is design judgment that the docs cover only in parts. Where a point follows the Exam Guide alone, the topic says so under "current". */
window.LEARN = window.LEARN || {};
window.LEARN.D5 = {
  checked: "2026-10-20",
  topics: [
    {
      id: "5.1",
      title: "Context across long interactions",
      points: [
        "A longer context is not automatically better. The docs describe context rot: as the token count grows, accuracy and recall degrade. So what you keep in context matters as much as how much fits.",
        "Repeated summarising turns exact facts into vague ones: amounts, percentages, dates and what the customer said they expect. Keep such facts in a separate block of case facts that goes into every prompt, outside the summarised history.",
        "Tool results pile up. A lookup that returns 40 fields when 5 matter fills the context with noise. Trim results to the relevant fields before they accumulate.",
        "Position matters. Models handle the start and end of a long input better than the middle. Put a summary of key findings at the beginning and organise details under clear headings. The docs advise placing long documents near the top and the question after them.",
        "When a downstream agent has little room, let upstream agents return structured facts, citations and relevance scores instead of long text and reasoning.",
        "Send the full conversation history with each API request to keep the dialogue coherent."
      ],
      docs: [
        { label: "Context windows", url: "https://platform.claude.com/docs/en/build-with-claude/context-windows.md" },
        { label: "Prompting best practices", url: "https://platform.claude.com/docs/en/build-with-claude/prompt-engineering/claude-prompting-best-practices.md" }
      ],
      traps: [
        { wrong: "Keep summarising the whole conversation into a shorter text.", why: "Numbers, dates and promises get blurred. Pull transactional facts into a case-facts block that is never summarised." },
        { wrong: "Leave full tool output in the context in case it is needed.", why: "It uses tokens out of proportion to its value. Keep only the fields that matter." },
        { wrong: "Put the key findings in the middle of a long input.", why: "Information in the middle is more likely to be missed. Put a summary first and use section headings." },
        { wrong: "Send only the latest message to save tokens.", why: "The model needs the history to stay coherent." }
      ],
      current: "The docs back context rot and the advice to put long documents at the top. The case-facts block and trimming tool output follow the Exam Guide, they are design practice rather than a documented feature."
    },
    {
      id: "5.2",
      title: "Escalation and ambiguity",
      points: [
        "Good reasons to escalate: the customer asks for a human, the policy has a gap or an exception, or the agent cannot make real progress. Complexity alone is not a reason.",
        "If the customer explicitly asks for a human, hand over at once, without investigating first. If the person is only frustrated and the issue is easy, acknowledge it and offer to solve it, and escalate if they repeat the wish.",
        "Sentiment and the model's own confidence score are poor stand-ins for how hard a case is.",
        "When the policy is silent or unclear about the request, escalate. An example is a competitor price match when the policy only covers your own site.",
        "When a lookup returns several matches, ask for another identifier. Do not pick one by guesswork.",
        "Put explicit escalation criteria into the system prompt, with a few examples of when to escalate and when to resolve."
      ],
      docs: [
        { label: "Prompting best practices", url: "https://platform.claude.com/docs/en/build-with-claude/prompt-engineering/claude-prompting-best-practices.md" }
      ],
      traps: [
        { wrong: "Escalate when the customer sounds angry.", why: "Sentiment does not show how hard the case is. If the agent can fix it, acknowledge the frustration and offer to." },
        { wrong: "Try to solve the problem first even though the customer asked for a human.", why: "An explicit request is honoured immediately." },
        { wrong: "Use the agent's own confidence score to decide on escalation.", why: "Self-reported confidence is an unreliable measure of real complexity." },
        { wrong: "Pick the most likely customer when a search returns three.", why: "Ask for another identifier instead of guessing." }
      ],
      current: "This topic follows the Exam Guide. The docs have no page on escalation design, only the general advice to ask the user before hard-to-reverse actions. Treat the rules here as design guidance for the exam."
    },
    {
      id: "5.3",
      title: "Errors across agents",
      points: [
        "When a subagent fails, give the coordinator context to decide with: the failure type, what was tried, partial results and possible alternatives. \"Search unavailable\" hides all of that.",
        "A timeout (access failure) needs a retry decision. A search that found nothing is a valid empty result. Do not confuse the two.",
        "A subagent first recovers from transient problems itself. It passes up only what it cannot fix, with what it tried and any partial results.",
        "Two opposite mistakes: hiding the error by returning an empty result as if it succeeded, and stopping the whole workflow because one part failed.",
        "In the final synthesis, mark coverage: which findings are well supported and which areas have gaps because a source was unavailable."
      ],
      docs: [
        { label: "Handle tool calls", url: "https://platform.claude.com/docs/en/agents-and-tools/tool-use/handle-tool-calls.md" },
        { label: "Agent SDK: custom tools", url: "https://code.claude.com/docs/en/agent-sdk/custom-tools.md" }
      ],
      traps: [
        { wrong: "Return an empty list when a source times out.", why: "That reads as a successful search with no results and hides a gap. Report the failure." },
        { wrong: "Stop the whole research task when one subagent fails.", why: "Continue with partial results and say what is missing." },
        { wrong: "Report only \"search unavailable\".", why: "The coordinator needs the failure type, what was attempted and what could be tried instead." },
        { wrong: "Send every transient error up to the coordinator.", why: "Handle them locally first. Pass up only what could not be resolved." }
      ],
      current: "The docs say instructive error messages let Claude retry, try another tool or explain the failure. The structured error context for coordinators is the Exam Guide's design pattern, not a documented field."
    },
    {
      id: "5.4",
      title: "Context in large codebases",
      points: [
        "In long sessions answers can become inconsistent, and the model starts to talk about typical patterns instead of the specific classes it found earlier.",
        "Scratchpad files help: write key findings to a file and refer to it later, so they survive when the context fills up. The docs suggest a notes file to persist information.",
        "Let subagents do the verbose exploration, for example finding all test files or tracing a flow, and return a summary. The main agent keeps the high-level picture.",
        "Summarise one phase before the next one starts, and put that summary into the next agents' prompts.",
        "For crash recovery, have each agent write its state to a known place. The coordinator loads a manifest on resume and feeds it into the prompts.",
        "Use /compact when the context fills with discovery output. You can tell it what to focus on. /clear resets context between unrelated tasks."
      ],
      docs: [
        { label: "Claude Code: best practices", url: "https://code.claude.com/docs/en/best-practices.md" },
        { label: "Prompting best practices", url: "https://platform.claude.com/docs/en/build-with-claude/prompt-engineering/claude-prompting-best-practices.md" },
        { label: "Agent SDK: sessions", url: "https://code.claude.com/docs/en/agent-sdk/sessions.md" }
      ],
      traps: [
        { wrong: "Explore the whole codebase in the main conversation.", why: "Verbose output fills the context. Delegate it to subagents and keep their summaries." },
        { wrong: "Rely on the model to remember findings from hours ago.", why: "Context degrades. Write key findings to a scratchpad file and re-read it." },
        { wrong: "Start the next phase without carrying anything over.", why: "Summarise the findings of the last phase and inject the summary into the next one." },
        { wrong: "After a crash, start the whole exploration again.", why: "Have agents export their state so the coordinator can load a manifest and continue." }
      ],
      current: "Scratchpad files, state manifests and /compact are covered in the docs only in general terms. The manifest-based crash recovery is the Exam Guide's design pattern."
    },
    {
      id: "5.5",
      title: "Human review and confidence",
      points: [
        "A high overall accuracy, say 97 %, can hide poor results on one document type or one field. Check accuracy per document type and per field.",
        "Do this before you automate: do not cut human review for high-confidence extractions until every segment performs consistently.",
        "Sample high-confidence extractions at random, stratified by document type, to keep measuring the error rate and to spot new kinds of errors.",
        "Have the model give a confidence per field. Set review thresholds using a labelled validation set, so the confidence means something.",
        "Send low-confidence results and sources that are ambiguous or contradict each other to people, so limited reviewer time goes where it helps most."
      ],
      docs: [],
      traps: [
        { wrong: "Automate once overall accuracy is 97 %.", why: "The average can hide a weak document type or field. Check each segment first." },
        { wrong: "Stop reviewing anything the model marks as high confidence.", why: "Keep sampling them at random to find new error patterns and measure the real error rate." },
        { wrong: "Trust the model's confidence numbers as they are.", why: "Calibrate thresholds against a labelled validation set." }
      ],
      current: "This topic follows the Exam Guide. The cached docs have no page about review workflows or confidence calibration, so it was not checked against them."
    },
    {
      id: "5.6",
      title: "Provenance and uncertainty in synthesis",
      points: [
        "When findings are compressed, the link between a claim and its source is easily lost. Keep claim-source mappings (URL, document name, relevant excerpt) and make the synthesis agent preserve and merge them.",
        "Pass content and metadata separately. The docs suggest wrapping each document with its source and other metadata in tags.",
        "Sources that disagree should both appear, with their sources and context. Do not silently pick one number.",
        "Include publication or collection dates. A difference in time can look like a contradiction when it is not one.",
        "Separate well-established findings from contested ones in the report. Let the coordinator decide how to reconcile conflicts before the final synthesis.",
        "Show each kind of content in a fitting form: tables for financial data, prose for news, lists for technical findings. Do not squeeze everything into one format."
      ],
      docs: [
        { label: "Prompting best practices", url: "https://platform.claude.com/docs/en/build-with-claude/prompt-engineering/claude-prompting-best-practices.md" }
      ],
      traps: [
        { wrong: "Choose one of two conflicting statistics and drop the other.", why: "Keep both with their sources and the method behind them, and mark the conflict." },
        { wrong: "Summarise findings without their sources to save space.", why: "Attribution is lost for good. Keep a claim-source mapping through every step." },
        { wrong: "Treat two different numbers as a contradiction.", why: "They may come from different dates. Require dates in the structured output." },
        { wrong: "Present every kind of finding as the same bullet list.", why: "Use the form that fits: tables for numbers, prose for news, structured lists for technical points." }
      ],
      current: "The docs back the idea of wrapping documents with source metadata. The rest of this topic follows the Exam Guide."
    }
  ],
  guides: [
    {
      title: "Escalate or resolve?",
      headers: ["Situation", "Do"],
      rows: [
        ["Customer explicitly asks for a human", "Escalate at once"],
        ["Customer is frustrated, issue is easy", "Acknowledge, offer to resolve, escalate if they repeat the wish"],
        ["Policy is silent or unclear about the request", "Escalate"],
        ["Search returns several customers", "Ask for another identifier"],
        ["Case sounds complex but is within the agent's reach", "Resolve it, complexity alone is not a reason"]
      ]
    },
    {
      title: "Failure or empty result?",
      headers: ["What happened", "Report as"],
      rows: [
        ["The source did not answer (timeout, unavailable)", "Failure, with what was tried and what could be tried instead"],
        ["The query worked and found nothing", "Valid empty result, a successful answer"],
        ["Part of the work failed", "Continue with partial results and mark the gap"]
      ]
    },
    {
      title: "Where does the information live?",
      headers: ["Kind of information", "Keep it"],
      rows: [
        ["Exact facts: amounts, dates, order numbers", "In a case-facts block outside summarised history"],
        ["Verbose exploration output", "In a subagent, only the summary comes back"],
        ["Key findings that must survive context limits", "In a scratchpad file"],
        ["Claim and its source", "As a structured claim-source mapping through every step"]
      ]
    },
    {
      title: "Compact, clear or fresh session?",
      headers: ["Situation", "Use"],
      rows: [
        ["Context is full of discovery output, same task goes on", "/compact, optionally with a focus"],
        ["Unrelated new task", "/clear"],
        ["Several failed corrections have cluttered the session", "/clear and restate the task better"],
        ["Old tool results are stale", "New session with a short summary of the results you need"]
      ]
    },
    {
      title: "Before you automate review",
      headers: ["Check", "Why"],
      rows: [
        ["Accuracy per document type and field", "Overall accuracy can hide weak segments"],
        ["Random sample of high-confidence results", "Finds new error patterns and measures the real error rate"],
        ["Confidence calibrated on labelled data", "A raw confidence number is not a probability"]
      ]
    }
  ],
  practice: [
    { id: "d5-facts", text: "Build a case-facts block for a multi-turn support chat and include it in every prompt, outside the summary." },
    { id: "d5-trim", text: "Trim a tool result with many fields down to the few that matter and compare the context size." },
    { id: "d5-escalate", text: "Write escalation criteria with two examples into a system prompt and test an angry customer and an explicit request for a human." },
    { id: "d5-multi", text: "Make a lookup return several matches and make the agent ask for another identifier." },
    { id: "d5-error", text: "Have a subagent return a failure with what it tried and partial results. See how the coordinator reacts." },
    { id: "d5-scratch", text: "Keep a scratchpad file of findings during a long exploration and use it to answer a later question." },
    { id: "d5-compact", text: "Run /compact with a focus instruction in a long session and note what survives." },
    { id: "d5-sample", text: "Take a set of extractions with confidence values and compute accuracy per document type and field." },
    { id: "d5-provenance", text: "Make subagents return claim-source mappings with dates and keep them through a synthesis step." }
  ]
};
