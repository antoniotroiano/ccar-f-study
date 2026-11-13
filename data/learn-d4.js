/* Study notes, domain D4. Same shape and rules as data/learn.js. Sources: docs cached 20 Oct 2026. */
window.LEARN = window.LEARN || {};
window.LEARN.D4 = {
  checked: "2026-10-20",
  topics: [
    {
      id: "4.1",
      title: "Explicit criteria",
      points: [
        "Say exactly what to report and what to skip. A rule such as \"flag a comment only when it contradicts what the code does\" beats \"check that comments are accurate\". The docs say Claude responds well to clear, explicit instructions.",
        "General instructions like \"be conservative\" or \"only report confident findings\" do not make the model more precise. Concrete categories do: report bugs and security issues, skip minor style and local patterns.",
        "False positives cost trust. If one category is noisy, developers start to ignore the accurate categories too. Switch the noisy category off for a while and improve its prompt.",
        "For severity levels, define each level and add a concrete code example, so the same kind of problem gets the same level every time."
      ],
      docs: [
        { label: "Prompting best practices", url: "https://platform.claude.com/docs/en/build-with-claude/prompt-engineering/claude-prompting-best-practices.md" },
        { label: "Claude Code: best practices", url: "https://code.claude.com/docs/en/best-practices.md" }
      ],
      traps: [
        { wrong: "Tell the model to \"be conservative\" or to report only high-confidence findings.", why: "That is a vague instruction and does not change what counts as a finding. Write categorical criteria." },
        { wrong: "Keep a noisy category on and ask developers to ignore it.", why: "False positives undermine trust in the correct findings too. Pause the category while you fix its criteria." },
        { wrong: "Describe severity in words only.", why: "Without an example per level, classification varies. Add a concrete example for each severity level." }
      ],
      current: null
    },
    {
      id: "4.2",
      title: "Few-shot prompting",
      points: [
        "When instructions alone give inconsistent output, add examples. The docs call examples one of the most reliable ways to steer format, tone and structure.",
        "Use examples for the ambiguous cases: show the input, the choice made and why it beat the plausible alternatives. That teaches judgment that carries over to new cases.",
        "Show the exact output format you want, for example location, issue, severity and suggested fix.",
        "Include examples of code that is acceptable next to real issues, to cut false positives.",
        "For extraction, show documents with different layouts, such as inline citations versus a bibliography. This reduces empty fields and made-up values.",
        "Make examples relevant and varied, so the model does not pick up an unintended pattern."
      ],
      docs: [
        { label: "Prompting best practices", url: "https://platform.claude.com/docs/en/build-with-claude/prompt-engineering/claude-prompting-best-practices.md" }
      ],
      traps: [
        { wrong: "Add more and more rules when the output stays inconsistent.", why: "Examples usually fix inconsistency faster than extra prose." },
        { wrong: "Use ten near-identical examples.", why: "Examples should be diverse and cover edge cases. Near copies teach an accidental pattern." },
        { wrong: "Show only clear cases.", why: "The value is in the ambiguous ones, with the reasoning for the choice." }
      ],
      current: "The Exam Guide suggests 2 to 4 targeted examples. The docs say 3 to 5 examples work best. The point is the same: a few relevant, varied examples. Do not memorise one number."
    },
    {
      id: "4.3",
      title: "Structured output with tools and JSON schemas",
      points: [
        "Define an extraction tool whose input is your JSON schema and read the data from the tool call. That is the usual way to get structured output.",
        "A schema removes syntax problems, not meaning problems. Totals can still be wrong or values can sit in the wrong field.",
        "tool_choice matters here: auto may return text instead of a tool call, any forces some tool (useful when the document type is unknown and several schemas exist), a forced tool makes one particular extraction run first.",
        "Make a field optional (nullable) when the source may not contain it. A required field pushes the model to invent a value.",
        "Use an enum value like \"unclear\" for ambiguous cases. For categories that may grow, use \"other\" plus a detail text field.",
        "Say in the prompt how to normalise messy source formats. The schema fixes the shape, not the cleaning."
      ],
      docs: [
        { label: "Strict tool use", url: "https://platform.claude.com/docs/en/agents-and-tools/tool-use/strict-tool-use.md" },
        { label: "Define tools (tool_choice)", url: "https://platform.claude.com/docs/en/agents-and-tools/tool-use/define-tools.md" },
        { label: "Agent SDK: structured outputs", url: "https://code.claude.com/docs/en/agent-sdk/structured-outputs.md" }
      ],
      traps: [
        { wrong: "Mark every field required so nothing is missing.", why: "If a value is not in the document, the model may make one up. Allow null for fields the source may lack." },
        { wrong: "Assume a valid schema means correct data.", why: "A schema guarantees structure only. Check meaning separately, for example that line items add up." },
        { wrong: "Use tool_choice auto to be sure you get structured output.", why: "With auto the model may reply in plain text. Use any or force the tool." },
        { wrong: "Use a closed enum with no way out for new categories.", why: "Add \"other\" with a detail field, and \"unclear\" for ambiguous cases." }
      ],
      current: "The docs say strict: true on a tool definition is what guarantees that the tool input matches your JSON schema. Without it, the docs make no such guarantee. The Agent SDK also has a structured outputs feature that can fail if the agent cannot produce valid JSON for the schema, and recommends making fields optional when information may be missing. Prefilling the assistant reply to force JSON is no longer supported on the last turn."
    },
    {
      id: "4.4",
      title: "Validation, retry and feedback loops",
      points: [
        "Retry with feedback: send a follow-up that contains the original document, the failed result and the specific validation errors. The model can then correct itself.",
        "Retries help with format and structure errors. They do not help when the information is not in the source at all, for example when it sits in a document you did not provide.",
        "Tell apart syntax errors (a schema removes them) and semantic errors (values do not add up, a value is in the wrong field). Semantic ones need your own validation.",
        "Design checks into the output: ask for a calculated total next to the stated total to spot a mismatch, or add a conflict flag when the source contradicts itself.",
        "Add a detected_pattern field to findings. When developers dismiss findings, you can then see which code patterns cause false positives."
      ],
      docs: [
        { label: "Agent SDK: structured outputs", url: "https://code.claude.com/docs/en/agent-sdk/structured-outputs.md" },
        { label: "Strict tool use", url: "https://platform.claude.com/docs/en/agents-and-tools/tool-use/strict-tool-use.md" }
      ],
      traps: [
        { wrong: "Retry again and again when a required value is missing from the source.", why: "The information is not there. More retries cannot create it. Report it as missing." },
        { wrong: "Retry with only \"try again\".", why: "Include the failed output and the specific errors so the model knows what to fix." },
        { wrong: "Rely on the schema to catch a total that does not match its items.", why: "That is a semantic error. Add your own check, for example a calculated total beside the stated one." }
      ],
      current: null
    },
    {
      id: "4.5",
      title: "Batch processing",
      points: [
        "The Message Batches API charges 50% of the standard price. Batches usually finish within an hour, but the guarantee is up to 24 hours, after which they expire. There is no latency guarantee.",
        "So batches fit work that can wait: overnight reports, weekly audits, nightly test generation. They do not fit a blocking step such as a check before a merge. Use the normal API there.",
        "Give every request a custom_id. Results can come back in any order, so the id is how you match them to your requests.",
        "If some requests fail, resubmit only those (found by custom_id), with a fix such as splitting a document that was too long.",
        "Refine the prompt on a small sample first. That raises the first-pass success rate and saves repeated resubmission.",
        "For an SLA, add up the waiting time: the time until your next submission plus up to 24 hours of processing must fit inside it."
      ],
      docs: [
        { label: "Batch processing", url: "https://platform.claude.com/docs/en/build-with-claude/batch-processing.md" }
      ],
      traps: [
        { wrong: "Use the batch API for a check that blocks a merge.", why: "There is no latency guarantee and it can take up to 24 hours. Use a synchronous call." },
        { wrong: "Assume results arrive in the order you sent them.", why: "They can come in any order. Match by custom_id." },
        { wrong: "Resubmit the whole batch when a few items fail.", why: "Resubmit only the failed ones, found by custom_id, with the cause fixed." },
        { wrong: "Run the entire large set at once with an untested prompt.", why: "Tune the prompt on a sample first to avoid paying for resubmissions." }
      ],
      current: "The docs say server tools such as web search and code execution work in batch requests, which the Exam Guide does not mention. The exam point is about your own client-side tools: a batch is submitted once, so your code cannot run a tool in the middle of a request and send the result back."
    },
    {
      id: "4.6",
      title: "Multi-instance and multi-pass review",
      points: [
        "A model that wrote something keeps the reasoning that led to it, so it is less likely to question its own decisions in the same session.",
        "A separate reviewer instance without that reasoning is better at catching subtle problems than telling the same session to review itself. The docs describe a reviewer in a fresh subagent context that sees only the diff and your criteria.",
        "For a large change, review each file on its own for local problems, then do a separate pass for how the files interact. One giant pass dilutes attention and can produce contradictory findings.",
        "Ask the reviewer to report a confidence with each finding. You can then send low-confidence ones to a human and handle high-confidence ones automatically.",
        "Tell the reviewer what matters, for example only gaps that affect correctness or the stated requirements, so it does not flood you with optional remarks."
      ],
      docs: [
        { label: "Claude Code: best practices", url: "https://code.claude.com/docs/en/best-practices.md" }
      ],
      traps: [
        { wrong: "Ask the same session to review its own code more carefully.", why: "It still holds the reasoning behind the code. Use an independent instance." },
        { wrong: "Turn on extended thinking and let it self-review.", why: "More thinking in the same context does not give a fresh view the way a separate instance does." },
        { wrong: "Review a 30-file change in a single pass.", why: "Do per-file passes plus a cross-file integration pass." }
      ],
      current: null
    }
  ],
  guides: [
    {
      title: "tool_choice for extraction",
      headers: ["Setting", "Result", "Use when"],
      rows: [
        ["auto", "Model may answer in text", "Extraction is optional"],
        ["any", "Some tool must be called", "Several schemas exist and the document type is unknown"],
        ["forced tool", "That tool must be called", "One extraction has to run first"]
      ]
    },
    {
      title: "Retry or not?",
      headers: ["Problem", "Retry helps?"],
      rows: [
        ["Format or structure error", "Yes, send the errors back"],
        ["Value does not add up (semantic)", "Yes, with the specific discrepancy"],
        ["Information is not in the source", "No, report it as missing"]
      ]
    },
    {
      title: "Batch or synchronous API?",
      headers: ["", "Batch", "Synchronous"],
      rows: [
        ["Cost", "50% of standard price", "Standard price"],
        ["Time", "Up to 24 hours, no latency guarantee", "Immediate answer"],
        ["Fits", "Overnight reports, weekly audits, nightly test generation", "A check that blocks a merge, anything a person waits for"]
      ]
    },
    {
      title: "Few-shot or more instructions?",
      headers: ["Situation", "Prefer"],
      rows: [
        ["Output format varies between runs", "Examples that show the format"],
        ["Ambiguous cases decided inconsistently", "Examples with the reasoning for each choice"],
        ["A rule is simply missing", "Add the rule, with a concrete criterion"]
      ]
    },
    {
      title: "Self-review or independent review?",
      headers: ["", "Same session", "Independent instance"],
      rows: [
        ["Context", "Holds the reasoning that produced the code", "Sees only the diff and your criteria"],
        ["Catches", "Less, it tends to agree with itself", "More subtle issues"]
      ]
    }
  ],
  practice: [
    { id: "d4-criteria", text: "Rewrite a vague review prompt into explicit report-and-skip criteria and compare the findings." },
    { id: "d4-fewshot", text: "Fix an inconsistent output format with three varied examples instead of more instructions." },
    { id: "d4-schema", text: "Define an extraction tool with a JSON schema. Make one field nullable and give it a document that lacks the value." },
    { id: "d4-strict", text: "Try strict: true on a tool and read what changes in the documentation and the result." },
    { id: "d4-enum", text: "Add \"unclear\" and \"other\" with a detail field to an enum and run an ambiguous document." },
    { id: "d4-retry", text: "Build a retry that sends back the document, the failed result and the validation errors. Try one fixable and one unfixable case." },
    { id: "d4-total", text: "Ask for a calculated total beside the stated total and flag mismatches." },
    { id: "d4-batch", text: "Send a small batch with custom_ids, read the results and match them by id." },
    { id: "d4-review", text: "Have a fresh instance review code that another session wrote, using only the diff and your criteria." }
  ]
};
