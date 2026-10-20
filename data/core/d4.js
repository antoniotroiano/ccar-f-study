/* Domain 4: Prompt Engineering & Structured Output (Exam Guide weight 20%) */
(function () {
  const source = window.CORE_CATALOG.examGuideSource;

  window.CORE_CATALOG.addQuestions([
    {
      id: "core-d4-001",
      domain: "D4",
      objectives: ["O31"],
      scenario: "s5",
      question: "Your CI review posts about 25 comments per pull request. Developers now dismiss roughly 70% of them, mostly remarks about naming style and about patterns the team uses on purpose, and they have started to overlook the comments about real bugs as well. The review prompt currently says: \"Be conservative. Only report findings you are highly confident about.\" What is the most effective change?",
      options: [
        "Replace the general instruction with explicit criteria for which issue types to report, such as bugs and security problems, and which to skip, such as naming style.",
        "Add three few-shot examples of well-written review comments that show the desired format: location, issue, severity and a suggested fix.",
        "Add a second Claude instance that reads the first review and removes every finding it judges to be of low value before anything is posted.",
        "Limit the review to the five most important findings per pull request, so that developers only see a short and focused list of comments."
      ],
      correct: [0],
      explanation: "The current prompt relies on vague instructions such as \"be conservative\", which the model cannot turn into a consistent decision about what to report. Explicit criteria name the categories that matter, such as bugs and security problems, and the ones to skip, such as naming style and deliberate team patterns. This removes the false-positive categories that make developers distrust the review, so comments about real bugs get attention again.",
      optionExplanations: [
        "General instructions such as \"be conservative\" do not improve precision; specific categorical criteria tell the model exactly which issues matter.",
        "Few-shot examples make the format consistent, but examples of good comments alone do not tell the model which categories of findings to leave out.",
        "A second instance without explicit criteria has the same vague notion of \"low value\", and it adds cost and latency.",
        "A fixed limit can hide real bugs on large pull requests and does not stop style remarks from taking the five slots."
      ],
      source: source("4.1", "general instructions like \"be conservative\" or \"only report high-confidence findings\" fail to improve precision"),
      docs: [
        { label: "Claude API docs: Prompting best practices", url: "https://platform.claude.com/docs/en/build-with-claude/prompt-engineering/claude-prompting-best-practices.md", quote: "Claude responds well to clear, explicit instructions. Being specific about your desired output can help enhance results." },
        { label: "Claude Code docs: Best practices", url: "https://code.claude.com/docs/en/best-practices.md", quote: "Tell the reviewer to flag only gaps that affect correctness or the stated requirements, and treat the rest as optional." }
      ]
    },
    {
      id: "core-d4-002",
      domain: "D4",
      objectives: ["O26"],
      scenario: "s6",
      question: "Your invoice extraction tool uses a JSON schema in which due_date is a required string. An audit of 400 extractions shows that about 12% of the invoices contain no due date, and for these the model returns plausible dates, often exactly 30 days after the invoice date. Downstream, these invented dates trigger incorrect payment reminders. What is the best fix?",
      options: [
        "Keep due_date required, but add a strong instruction to the prompt never to infer or invent dates that are not written in the document.",
        "Add a validation-retry loop that rejects dates exactly 30 days after the invoice date and asks the model to extract the due date again.",
        "Make due_date optional and nullable in the schema, and instruct the model to return null when the document does not state a due date.",
        "Force the extraction tool with tool_choice and enable strict schema mode, so that the model can only return values matching the schema."
      ],
      correct: [2],
      explanation: "A required field forces the model to put something into due_date even when the invoice has none, so it produces a plausible guess, here the invoice date plus 30 days. Making the field optional and nullable gives the model a legitimate way to say that the information is missing. Instructions or strict schema mode do not remove that pressure, and retries cannot extract a date that is not in the document.",
      optionExplanations: [
        "As long as the schema demands a value, the model is pushed to provide one; the instruction alone does not remove that pressure (reasoning based on 4.3).",
        "Retries cannot help when the information is absent from the source document, and the heuristic would also reject correct 30-day dates.",
        "A nullable field lets the model report that the information is missing instead of fabricating a value to satisfy a required field.",
        "Strict schemas prevent syntax errors, not semantic errors: an invented date is still a valid string."
      ],
      source: source("4.3", "preventing the model from fabricating values to satisfy required fields"),
      docs: [
        { label: "Agent SDK docs: Structured outputs", url: "https://code.claude.com/docs/en/agent-sdk/structured-outputs.md", quote: "If the task might not have all the information your schema requires, make those fields optional." },
        { label: "Claude API docs: Strict tool use", url: "https://platform.claude.com/docs/en/agents-and-tools/tool-use/strict-tool-use.md", quote: "Setting strict: true on a tool definition guarantees Claude's tool inputs match your JSON Schema by constraining the model's token sampling to schema-valid outputs" }
      ]
    },
    {
      id: "core-d4-003",
      domain: "D4",
      objectives: ["O23"],
      scenario: "s6",
      question: "Contracts arrive continuously and must be extracted and validated within 30 hours of arrival. You move extraction to the Message Batches API, which completes a batch within at most 24 hours but gives no faster latency guarantee. After each batch completes, a downstream validation job needs up to 3 hours. You collect incoming contracts and submit them as one batch at a fixed interval. What is the longest submission interval that still guarantees the SLA?",
      options: [
        "Every 2 hours, which keeps each batch small and the queue of waiting contracts short.",
        "Every 3 hours, which produces eight batches per day of roughly equal size.",
        "Every 4 hours, the interval commonly used for a 30-hour SLA with 24-hour batch processing.",
        "Every 6 hours, which produces four larger batches per day and fewer jobs to monitor."
      ],
      correct: [1],
      explanation: "Plan for the worst case. A contract that arrives right after a submission waits one full interval before it is sent. The batch can then take up to 24 hours, because the Message Batches API gives no faster guarantee, and validation adds up to 3 hours. So the interval plus 24 plus 3 must not exceed 30 hours, which allows at most 3 hours. Shorter intervals also meet the SLA, but 3 hours is the longest that does. Note: per the API docs, results are available after at most 24 hours, and requests not processed by then expire, so 24 hours is a ceiling, not a completion guarantee.",
      optionExplanations: [
        "Two hours also meets the SLA, but it is not the longest interval that does.",
        "In the worst case a contract waits a full interval, then 24 hours of processing and 3 hours of validation follow; 3 + 24 + 3 = 30 hours.",
        "Four hours fits a 30-hour SLA only without the validation step; here the worst case is 4 + 24 + 3 = 31 hours.",
        "This ignores the validation job: 6 + 24 + 3 = 33 hours."
      ],
      source: source("4.5", "Calculating batch submission frequency based on SLA constraints"),
      docs: [
        { label: "Claude API docs: Batch processing", url: "https://platform.claude.com/docs/en/build-with-claude/batch-processing.md", quote: "You can access batch results when all messages have completed or after 24 hours, whichever comes first. Batches expire if processing does not complete within 24 hours." }
      ]
    },
    {
      id: "core-d4-004",
      domain: "D4",
      objectives: ["O29"],
      scenario: "s6",
      question: "Your pipeline extracts line items from supplier invoices into a required items array. Invoices that list items in a table are extracted correctly in 98% of cases. Some suppliers instead describe deliveries in running text, such as \"We delivered 40 units of the M8 bolts and two replacement pumps\", and for these the array comes back empty in about 35% of cases. The prompt explains that items can appear in tables or in running text. What is the most effective improvement?",
      options: [
        "Make the items field nullable, so that the model can return null instead of an empty array when it cannot find a table.",
        "Show the model two or three sample invoices in the prompt, one with a table and one in running text, each with the items it should return.",
        "Extend the written instructions with detailed rules for recognizing items, quantities and units in sentences of running text.",
        "Add a validation-retry loop that sends the request again with the message \"items must not be empty\" whenever the array is empty."
      ],
      correct: [1],
      explanation: "The model handles one document format reliably and the other poorly, although the instructions mention both. Few-shot examples that show correct extraction from each format, a table and a delivery described in prose, are the most effective way to get consistent results when instructions alone are not enough. They demonstrate what to extract from the unfamiliar structure, which also addresses the empty results for a required field.",
      optionExplanations: [
        "The items exist in these invoices; a nullable field would hide the failure instead of fixing the extraction.",
        "Examples for both formats show the model how to handle the case it currently misses.",
        "More rules can help a little, but written instructions alone are what has produced the inconsistent results so far.",
        "A retry tells the model that something is missing, but not how to find items in running text, so it is likely to fail again."
      ],
      source: source("4.2", "Adding few-shot examples showing correct extraction from documents with varied formats"),
      docs: [
        { label: "Claude API docs: Prompting best practices", url: "https://platform.claude.com/docs/en/build-with-claude/prompt-engineering/claude-prompting-best-practices.md", quote: "Examples are one of the most reliable ways to steer Claude's output format, tone, and structure." },
        { label: "Claude API docs: Prompting best practices", url: "https://platform.claude.com/docs/en/build-with-claude/prompt-engineering/claude-prompting-best-practices.md", quote: "Diverse: Cover edge cases and vary enough that Claude doesn't pick up unintended patterns." }
      ]
    },
    {
      id: "core-d4-005",
      domain: "D4",
      objectives: ["O29"],
      scenario: "s6",
      question: "Your purchase order extraction uses a validation-retry loop with up to three retries that include the validation error. Logs show that 70% of retries succeed, mostly for date and currency format errors. For about 8% of documents, however, the delivery_address field fails on all three retries. In these orders, the address section only says \"Deliver to the address on the attached delivery note.\" What should you change?",
      options: [
        "Loosen the schema for delivery_address so that it accepts any free-text value, which lets these orders pass validation as well.",
        "When no delivery address is stated, have the model use the customer's billing address instead, so that the field is always filled.",
        "Keep retrying format errors, but stop when the address is absent from the document and route the order for review.",
        "Raise the retry limit to five and make the error message more specific, so that the model has more chances to find the address."
      ],
      correct: [2],
      explanation: "Retries with error feedback work when the model made a fixable mistake, such as a wrong date format, which is why 70% of them succeed. They cannot work when the required information is not in the document at all: here the address is only on a delivery note the model never receives. The loop should keep retrying fixable errors and handle missing source information differently, for example by obtaining the delivery note or routing the order to a person.",
      optionExplanations: [
        "A looser schema would accept the placeholder sentence as an address and pass wrong data downstream.",
        "The billing address is a guess that is often wrong for deliveries; it fabricates a value instead of reporting that the real one is missing.",
        "Distinguishing fixable errors from absent information keeps the useful retries and avoids pointless ones.",
        "More retries cannot produce information that the provided document does not contain; they only add cost."
      ],
      source: source("4.4", "Identifying when retries will be ineffective (e.g., information exists only in an external document not provided)"),
      docs: [
        { label: "Agent SDK docs: Structured outputs", url: "https://code.claude.com/docs/en/agent-sdk/structured-outputs.md", quote: "If the task might not have all the information your schema requires, make those fields optional." },
        { label: "Agent SDK docs: Structured outputs", url: "https://code.claude.com/docs/en/agent-sdk/structured-outputs.md", quote: "Structured output generation can fail when the agent cannot produce valid JSON matching your schema." }
      ]
    },
    {
      id: "core-d4-006",
      domain: "D4",
      scenario: "s5",
      question: "In your CI pipeline, Claude generates a fix for each failing test and then, in the same session, is asked to \"review your changes critically before committing\". Over the last month, the self-review approved 96% of the fixes, but engineers later found subtle bugs, such as missing null checks and broken edge cases, in about one fix out of five. You want the review step to catch more of these issues. What is the most effective change?",
      options: [
        "Have each fix checked by a separate Claude session that sees only the diff and the failing test, not the conversation that produced the fix.",
        "Enable extended thinking for the self-review step, so that Claude reasons more thoroughly about its own changes before approving them.",
        "Make the self-review prompt stricter, telling Claude to assume that every change contains at least one bug and to search until it finds it.",
        "Give the self-review a detailed checklist covering null handling, edge cases and error paths, and keep it in the same session."
      ],
      correct: [0],
      explanation: "A model reviewing its own work in the same session keeps the reasoning that led to the change, so it tends to confirm its own decisions. An independent instance that sees only the code, without the generator's context, looks at the change with fresh eyes and is more effective at catching subtle issues than review instructions or extended thinking within the same session. This explains the high approval rate despite real bugs.",
      optionExplanations: [
        "An independent reviewer without the generator's reasoning context is the most effective way to catch subtle issues.",
        "Extended thinking in the same session still starts from the reasoning that produced the change.",
        "Forcing the model to find a bug tends to produce invented findings (general experience, not stated in the guide), and the bias toward its own decisions remains.",
        "A checklist focuses the review, but the reviewer still shares the generator's reasoning and tends to confirm it."
      ],
      source: source("4.6", "Using a second independent Claude instance to review generated code without the generator's reasoning context"),
      docs: [
        { label: "Claude Code docs: Best practices", url: "https://code.claude.com/docs/en/best-practices.md", quote: "A fresh context improves code review since Claude won't be biased toward code it just wrote." },
        { label: "Claude Code docs: Best practices", url: "https://code.claude.com/docs/en/best-practices.md", quote: "A reviewer running in a fresh subagent context sees only the diff and the criteria you give it, not the reasoning that produced the change" }
      ]
    },
    {
      id: "core-d4-007",
      domain: "D4",
      objectives: ["O26"],
      scenario: "s6",
      question: "Your contract extraction schema has a contract_type enum with eight values. An audit found that 109 of 120 licensing agreements with a service component were labeled \"service\", that all 14 joint-venture contracts were labeled \"partnership\", and that contracts which the analysts themselves could not classify were spread across all eight values. Reporting is built on the eight categories but must not lose new or mixed contract types. How should the field change?",
      options: [
        "Turn contract_type into a free-text field, so that the model can describe the type of each contract in its own words.",
        "Add every type found in the audit as a new enum value, which brings the list to fourteen categories in total.",
        "Keep the eight categories and add a catch-all value with a free-text description, plus a value for contracts that cannot be classified.",
        "Keep the enum as it is, and instruct the model to choose the closest category carefully when a contract does not fit."
      ],
      correct: [2],
      explanation: "The audit shows the model picking a known value even when none fits, and spreading unclassifiable contracts at random. Keeping the eight categories for reporting, adding a catch-all value with a description for new types, and a separate value for ambiguous cases lets the model record what it actually sees. Reporting keeps its categories, nothing is silently forced into the wrong one, and the descriptions show which new types deserve their own category.",
      optionExplanations: [
        "Free text loses the categories that reporting is built on.",
        "Six more values fix today's cases, but the next new type will again be forced into the closest value.",
        "A catch-all value with a description keeps the schema extensible, and an explicit value for ambiguity handles unclear contracts honestly.",
        "Choosing carefully still means choosing a wrong value when none fits; the schema leaves no correct option."
      ],
      source: source("4.3", "Adding enum values like \"unclear\" for ambiguous cases and \"other\" + detail fields for extensible categorization"),
      docs: [
        { label: "Agent SDK docs: Structured outputs", url: "https://code.claude.com/docs/en/agent-sdk/structured-outputs.md", quote: "The SDK supports standard JSON Schema features including all basic types (object, array, string, number, boolean, null), enum, const, required, nested objects" }
      ]
    },
    {
      id: "core-d4-008",
      domain: "D4",
      objectives: ["O29"],
      scenario: "s6",
      question: "Your system extracts hours from scanned contractor timesheets: seven daily entries and a weekly total written by the contractor. On 4% of sheets the daily hours do not add up to the weekly total. Sometimes the extraction misread a digit, and sometimes the contractor simply added wrongly. Payroll must see every mismatch for review, and the extracted values must reflect what is written on the sheet. Which design fits?",
      options: [
        "Tighten the validation so that any extraction whose daily hours do not add up to the weekly total is rejected and not processed.",
        "Extract the weekly total as written and a total calculated from the daily hours, and set a flag whenever the two differ.",
        "Retry the extraction with the error \"daily hours do not add up to the total\" until the numbers match, then pass the result on.",
        "Recalculate the weekly total from the daily hours in code, and store only that value instead of the total written on the sheet."
      ],
      correct: [1],
      explanation: "Schema validation guarantees the structure of the output, not that the values make sense together. Extracting the total as written alongside a total calculated from the daily entries, and flagging any difference, turns this semantic check into explicit data: every mismatch reaches payroll, and the values still show exactly what the contractor wrote. A reviewer can then see whether a digit was misread or the contractor made a mistake.",
      optionExplanations: [
        "Rejecting mismatches means sheets with genuine contractor mistakes can never be processed, although they must reach payroll.",
        "Both totals side by side plus a flag make every mismatch visible without changing what the sheet says.",
        "Retries can fix a misread digit, but for real contractor mistakes they push the model to alter correct values until they match.",
        "Replacing the written total discards the evidence of the contractor's mistake, so payroll can no longer see the mismatch."
      ],
      source: source("4.4", "extracting \"calculated_total\" alongside \"stated_total\" to flag discrepancies"),
      docs: [
        { label: "Claude API docs: Strict tool use", url: "https://platform.claude.com/docs/en/agents-and-tools/tool-use/strict-tool-use.md", quote: "Setting strict: true on a tool definition guarantees Claude's tool inputs match your JSON Schema by constraining the model's token sampling to schema-valid outputs" }
      ]
    },
    {
      id: "core-d4-009",
      domain: "D4",
      objectives: ["O31"],
      scenario: "s5",
      question: "Your CI review comments on five categories. A month of data shows that security, bug and API-contract findings are accepted 85 to 90% of the time, while performance findings are accepted only 15%, mostly speculative remarks about loops over small collections. Developers have started dismissing all comments without reading them. You need their trust back within a week, and good criteria for performance findings will take longer to design. What should you do first?",
      options: [
        "Keep all five categories, but add the instruction to report performance issues only when Claude is certain about their impact.",
        "Write new performance criteria with concrete code examples of real and speculative issues, and deploy the improved prompt.",
        "Switch the whole review off until the performance criteria are ready, then switch it back on with all five categories at once.",
        "Pause the performance category, keep the other four running, and bring it back once its criteria have been reworked."
      ],
      correct: [3],
      explanation: "One noisy category is undermining trust in the accurate ones. Pausing the performance findings removes the noise immediately, while security, bug and API-contract findings keep delivering value. In parallel, the team can design explicit criteria with examples for performance issues and reintroduce the category once its precision is acceptable. Better criteria are the right long-term fix, but they cannot be ready within the week the team has.",
      optionExplanations: [
        "\"Only when certain\" is the kind of general instruction that does not improve precision.",
        "Explicit criteria with examples are the right long-term fix, but designing them takes longer than the one week available.",
        "Switching everything off also removes the findings developers value, and trust has to be rebuilt from scratch.",
        "Pausing the noisy category restores trust quickly while the other categories keep providing value."
      ],
      source: source("4.1", "Temporarily disabling high false-positive categories to restore developer trust while improving prompts for those categories"),
      docs: [
        { label: "Claude Code docs: Best practices", url: "https://code.claude.com/docs/en/best-practices.md", quote: "Tell the reviewer to flag only gaps that affect correctness or the stated requirements, and treat the rest as optional." }
      ]
    },
    {
      id: "core-d4-010",
      domain: "D4",
      objectives: ["O29"],
      scenario: "s1",
      question: "Your compensation policy has explicit thresholds: a voucher for delays of one to two days, a shipping refund for three days or more, escalation when goods are damaged. Most conversations are handled correctly, but borderline messages such as \"Two days late, and the box was dented but the contents seem fine\" are not: in 50 similar cases the agent chose a voucher 21 times, a refund 18 times and escalation 11 times. Rules added last quarter for two such combinations each produced new borderline cases, and the combinations customers describe keep changing. How do you make these decisions consistent?",
      options: [
        "Add further thresholds to the policy, for example separate rules for dented packaging with intact contents and for partial delays.",
        "Set the temperature to 0, so that the agent always reaches the same decision when it sees the same kind of message.",
        "Ask the agent to name the policy rule it applied in every reply, so that its reasoning for each decision becomes visible.",
        "Add two to four borderline cases to the prompt that show which option was chosen and why the others were rejected."
      ],
      correct: [3],
      explanation: "The policy is already explicit; the inconsistency arises in cases that sit between its rules. A few targeted examples of such borderline cases, each showing which option was chosen and why the alternatives were not, demonstrate the judgment the agent should apply. Because they teach reasoning rather than adding rules, they also help with variations that the examples do not cover word for word. Note: the guide recommends 2 to 4 targeted examples; Anthropic's general prompting docs suggest 3 to 5, so treat the number as a guideline.",
      optionExplanations: [
        "More thresholds cover today's borderline cases, but last quarter's added rules show that each new rule creates new boundary cases.",
        "A low temperature makes identical inputs more repeatable (general knowledge), but similar messages with different wording still get different decisions.",
        "Stating the rule makes decisions visible, but it does not tell the agent how to decide when two rules seem to apply.",
        "Examples that show the reasoning behind a choice teach the agent how to resolve ambiguous cases consistently."
      ],
      source: source("4.2", "few-shot examples for ambiguous scenarios that show reasoning for why one action was chosen over plausible alternatives"),
      docs: [
        { label: "Claude API docs: Prompting best practices", url: "https://platform.claude.com/docs/en/build-with-claude/prompt-engineering/claude-prompting-best-practices.md", quote: "Include 3–5 examples for best results. You can also ask Claude to evaluate your examples for relevance and diversity" },
        { label: "Claude API docs: Prompting best practices", url: "https://platform.claude.com/docs/en/build-with-claude/prompt-engineering/claude-prompting-best-practices.md", quote: "Examples are one of the most reliable ways to steer Claude's output format, tone, and structure." }
      ]
    },
    {
      id: "core-d4-011",
      domain: "D4",
      objectives: ["O27"],
      scenario: "s6",
      question: "Suppliers email invoices, credit notes and delivery notes to one intake address, without saying which is which. Your pipeline offers Claude one extraction tool per document type. Logs show that in 9% of requests Claude replies in prose, such as \"This appears to be a credit note for order 4471\", instead of calling any tool, and the pipeline then stops with a parsing error. What is the most reliable fix?",
      options: [
        "Add a sentence to the prompt that every response must consist of exactly one tool call and no text, and keep tool selection automatic.",
        "Require a tool call on every request through tool_choice, while leaving the choice among the three extraction tools to Claude.",
        "Force the invoice tool through tool_choice, since invoices are the most frequent type, and correct the other types afterwards.",
        "Call all three extraction tools on every document, and keep the result whose output validates with the fewest errors."
      ],
      correct: [1],
      explanation: "With automatic tool choice, the model may answer in text instead of calling a tool, which breaks the pipeline. Forcing one specific tool would guarantee a call but use the wrong schema whenever a document is not an invoice. Setting tool_choice to \"any\" combines both needs: Claude must call a tool, so the output is always structured, and it still chooses the extraction tool that matches the document. Note: the current API docs state that some newer models (such as Claude Opus 5.5 and Sonnet 5.5) reject tool_choice \"any\" and \"tool\" and recommend auto with strict tool use or structured outputs there. The exam follows the guide.",
      optionExplanations: [
        "A prompt instruction makes tool calls more likely but cannot guarantee them, so some prose answers remain.",
        "Requiring some tool call guarantees structured output, and the choice of the matching schema stays with the model.",
        "Forcing one tool guarantees a call, but credit notes and delivery notes are then extracted with the wrong schema.",
        "Running every tool triples the cost and can still pick a wrong schema that happens to validate."
      ],
      source: source("4.3", "to guarantee structured output when multiple extraction schemas exist and the document type is unknown"),
      docs: [
        { label: "Claude API docs: Define tools", url: "https://platform.claude.com/docs/en/agents-and-tools/tool-use/define-tools.md", quote: "any tells Claude that it must use one of the provided tools, but doesn't force a particular tool." },
        { label: "Claude API docs: Define tools", url: "https://platform.claude.com/docs/en/agents-and-tools/tool-use/define-tools.md", quote: "Not every model and setting supports forced tool use." }
      ]
    },
    {
      id: "core-d4-012",
      domain: "D4",
      objectives: ["O28"],
      scenario: "s6",
      question: "You submit 2,000 contracts as one Message Batches API job each night. Last night, 46 requests failed: 41 with a \"prompt is too long\" error because they exceed the context window, all of them contracts over 300 pages, and 5 with transient server errors. The other 1,954 results are fine and already stored. The extracted data feeds a report that is assembled the next afternoon. What is the best way to handle the failures?",
      options: [
        "Resubmit all 2,000 contracts in a new batch, so that every result in the report comes from one consistent run.",
        "Resubmit the 46 failed contracts unchanged in a new batch, since occasional errors usually pass on a second attempt.",
        "Match the failures by custom_id and resubmit only those, sending the long contracts in smaller parts and the other five unchanged.",
        "Move every contract over 300 pages to synchronous API calls from now on, and keep the batch API for all shorter contracts."
      ],
      correct: [2],
      explanation: "Each batch request carries a custom_id, so failed results can be matched to their documents and only those resubmitted. The two failure types need different treatment: the oversized contracts will fail again unless they are split into parts that fit, while the transient errors can simply be retried. Resubmitting everything wastes cost, and resending the long contracts unchanged repeats the same error.",
      optionExplanations: [
        "Rerunning 1,954 successful requests doubles the cost without improving any result.",
        "The transient errors may pass on retry, but the oversized contracts will fail again for the same reason.",
        "Matching failures by custom_id and fixing the cause per type resubmits only what failed, in a form that can succeed.",
        "Synchronous calls have the same context window limit, so the long contracts would still fail unless they are split."
      ],
      source: source("4.5", "resubmitting only failed documents (identified by custom_id) with appropriate modifications"),
      docs: [
        { label: "Claude API docs: Batch processing", url: "https://platform.claude.com/docs/en/build-with-claude/batch-processing.md", quote: "Batch results can be returned in any order, and may not match the ordering of requests when the batch was created." },
        { label: "Claude API docs: Context windows", url: "https://platform.claude.com/docs/en/build-with-claude/context-windows.md", quote: "If the input alone already exceeds the model's context window, the API returns a 400 invalid_request_error (\"prompt is too long\") on every model." }
      ]
    },
    {
      id: "core-d4-013",
      domain: "D4",
      objectives: ["O22"],
      scenario: "s5",
      question: "On large pull requests, your CI review produces about 40 findings, but the two senior reviewers can triage only about ten per pull request. Posting everything leads to ignored comments; posting nothing loses real bugs. The team has 300 past findings that reviewers already labeled as valid or invalid, and CI cost per pull request may grow by at most 10%. How should you decide which findings are posted directly and which go to human triage?",
      options: [
        "Use the 300 labeled findings to choose a severity cutoff, and post only findings above it while dropping the rest without review.",
        "Have a second, independent Claude instance re-review the code behind each finding, and post only findings that both instances confirm.",
        "Add \"only report findings you are highly confident about\" to the prompt, so that fewer and better findings are produced.",
        "Have Claude add a confidence rating to each finding in its review output, set thresholds on the labeled findings, and send uncertain ones to triage."
      ],
      correct: [3],
      explanation: "The goal is to send scarce reviewer time to the findings that need it. When Claude reports its confidence for each finding as part of its review output, the team gets a routing signal at almost no extra cost, and the 300 labeled findings let it choose thresholds that match actual accuracy: confident findings are posted, uncertain ones go to triage. Re-reviewing the code behind 40 findings with a second instance would add a large share of a second review, far beyond the 10% budget.",
      optionExplanations: [
        "A severity cutoff tuned on labeled data still ranks importance, not correctness, and silently drops findings that may be real bugs.",
        "An independent re-review can catch issues, but re-examining the code behind 40 findings per pull request breaks the 10% cost limit.",
        "General instructions like this do not improve precision and give no basis for routing.",
        "Confidence ratings calibrated on labeled findings route each finding by its likely accuracy, at little extra cost."
      ],
      source: source("4.6", "Running verification passes where the model self-reports confidence alongside each finding")
    },
    {
      id: "core-d4-014",
      domain: "D4",
      objectives: ["O30"],
      scenario: "s5",
      question: "Developers dismiss 40% of your CI review findings, and the dismissals are spread across all categories: bugs, security and API contracts alike. Reviewers keep saying that \"the same kinds of false alarms come back every week\", but nobody can say which ones or how often. Each finding contains a location, a message and a severity. You want data to improve the prompt systematically. What should you add?",
      options: [
        "A tag on every finding naming the rule or code shape that produced it, so that dismissed findings can be grouped by it.",
        "A required comment field for developers, explaining in their own words why they dismissed each finding they reject.",
        "A temporary switch that disables the category with the most dismissals until better criteria for it have been written.",
        "A limit of five findings per pull request, so that developers see fewer comments while the prompt is being improved."
      ],
      correct: [0],
      explanation: "To improve the prompt, the team needs to know what kind of code or check produces the findings developers reject. Recording that trigger with every finding turns dismissals into data that can be grouped and counted, so the recurring false alarms become visible and can be addressed with explicit criteria or examples. Disabling a category does not help when the noise is spread across all categories.",
      optionExplanations: [
        "Recording what triggered each finding makes dismissal patterns measurable, which is the basis for systematic prompt improvement.",
        "Free-text reasons add work for developers, are often skipped, and are hard to aggregate into patterns.",
        "Disabling a category helps when the noise sits in one category; here it is spread across all of them.",
        "A cap reduces annoyance but produces no information about which kinds of findings cause the noise."
      ],
      source: source("4.4", "Adding detected_pattern fields to structured findings")
    },
    {
      id: "core-d4-015",
      domain: "D4",
      objectives: ["O23"],
      scenario: "s6",
      question: "You need to extract key terms from 50,000 archived contracts with the Message Batches API. The extraction prompt is a first draft that has not been tested, and for audit reasons every contract must be processed with the same prompt version. In a similar project last year, about 30% of results failed validation, and documents had to be resubmitted up to three times, which tripled the cost and delayed delivery by two weeks. How should you run this job?",
      options: [
        "Submit all 50,000 contracts at once, then resubmit the failed ones by custom_id with an improved prompt until all of them pass.",
        "Split the job into ten batches of 5,000 contracts, and adjust the prompt between batches based on the failures of the previous one.",
        "Test and refine the prompt on a few hundred representative contracts first, then submit the full set as a batch.",
        "Use the synchronous API for all 50,000 contracts instead, so that failures become visible immediately and can be fixed right away."
      ],
      correct: [2],
      explanation: "An untested prompt applied to 50,000 documents multiplies every weakness by the size of the batch. Refining it first on a small, representative sample, where results come back quickly and cheaply, raises the first-pass success rate before the big run, and the whole set is then processed with one final prompt version. Handling failures by custom_id remains useful for the few remaining errors, but it should not be the main way of finding prompt problems.",
      optionExplanations: [
        "Resubmitting by custom_id handles remaining failures well, but here it repeats last year's costly cycle and mixes prompt versions.",
        "Adjusting between batches improves later batches, but contracts end up processed with different prompt versions, which the audit rules out.",
        "Refining on a representative sample first maximizes first-pass success, and the full run uses a single prompt version.",
        "Synchronous calls cost about twice as much and still apply the untested prompt to every document."
      ],
      source: source("4.5", "Using prompt refinement on a sample set before batch-processing large volumes"),
      docs: [
        { label: "Claude API docs: Batch processing", url: "https://platform.claude.com/docs/en/build-with-claude/batch-processing.md", quote: "Dry run a single request shape with the Messages API to avoid validation errors." },
        { label: "Claude API docs: Batch processing", url: "https://platform.claude.com/docs/en/build-with-claude/batch-processing.md", quote: "All usage is charged at 50% of the standard API prices." }
      ]
    },
    {
      id: "core-d4-016",
      domain: "D4",
      objectives: ["O25"],
      scenario: "s6",
      question: "Your extraction service asks Claude to \"respond only with JSON matching this schema\" and starts the assistant turn with an opening brace. About 2% of responses still fail downstream, usually because a required field is missing or a number comes back as a string. Downstream systems need output that always matches the schema, and the team plans to upgrade to a newer model next quarter. What should you switch to?",
      options: [
        "Keep the prompt approach, but add three complete example responses to the prompt and retry every response that fails validation.",
        "Keep the prompt approach, validate each response with a JSON parser, and silently drop the responses that fail validation.",
        "Keep starting the assistant turn with an opening brace, but lower the temperature so that the output becomes more consistent.",
        "Define an extraction tool whose input schema is the target JSON schema, ideally with strict mode, and read the tool call's input."
      ],
      correct: [3],
      explanation: "Prompt-based formatting and a prefilled opening brace only make valid output likely; they cannot guarantee schema compliance, which explains the 2% failures. Defining the target structure as a tool's input schema makes Claude return it as a tool call, and strict mode constrains the output to the schema, so missing fields and wrong types no longer occur. Note: the current docs also state that prefilled responses on the last assistant turn are no longer supported on newer models and return a 400 error.",
      optionExplanations: [
        "Examples and retries reduce failures but keep a method that cannot guarantee compliance, at the cost of extra calls.",
        "Dropping invalid responses hides the failures but loses data, which downstream systems cannot accept.",
        "Temperature does not enforce a schema, and the prefill approach will stop working on newer models.",
        "Tool use with a JSON schema, ideally strict, is the most reliable way to get schema-compliant structured output."
      ],
      source: source("4.3", "Tool use (tool_use) with JSON schemas as the most reliable approach for guaranteed schema-compliant structured output"),
      docs: [
        { label: "Claude API docs: Strict tool use", url: "https://platform.claude.com/docs/en/agents-and-tools/tool-use/strict-tool-use.md", quote: "Setting strict: true on a tool definition guarantees Claude's tool inputs match your JSON Schema" },
        { label: "Claude API docs: Prompting best practices", url: "https://platform.claude.com/docs/en/build-with-claude/prompt-engineering/claude-prompting-best-practices.md", quote: "prefilled responses (providing a partial assistant message for Claude to continue from) on the last assistant turn are no longer supported" }
      ]
    },
    {
      id: "core-d4-017",
      domain: "D4",
      objectives: ["O24"],
      scenario: "s5",
      question: "Your CI review uses one prompt that asks for security issues, business-logic errors and API-design problems, with a few examples of each. Since API-design examples were added last month, accepted API findings rose by 40%, and the team wants to keep that gain. A security audit, however, found that the review now misses about twice as many injection flaws as before; the other categories look unchanged. How should the review be restructured?",
      options: [
        "Remove the API-design examples again, since they appear to have pushed the security findings out of the single prompt.",
        "Run separate review passes, one per concern, each with its own focused prompt and examples, and merge their findings.",
        "Keep one prompt, but list security first and mark it as the most important category for the reviewer.",
        "Ask for twice as many findings per review, so that security issues have more room among the other categories."
      ],
      correct: [1],
      explanation: "In a single prompt, the concerns compete for the model's attention, so adding weight to one category reduced recall in another. Separate passes give each concern a focused prompt with matching examples, so the API-design gain can be kept without costing security findings, and the results are merged afterwards. Note: the guide's multi-pass principle is phrased for splitting large reviews by file; the score-report objective applies the same idea to separating concerns.",
      optionExplanations: [
        "This brings security recall back but gives up the API-design gain that the team wants to keep.",
        "Focused passes per concern avoid competition inside one prompt, so each category can be improved independently.",
        "Reordering shifts attention toward security but keeps all concerns competing in one pass.",
        "More findings per review adds noise across all categories instead of improving focus."
      ],
      source: source("4.6", "Multi-pass review: splitting large reviews into per-file local analysis passes plus cross-file integration passes to avoid attention dilution")
    },
    {
      id: "core-d4-018",
      domain: "D4",
      objectives: ["O28"],
      scenario: "s5",
      question: "For large pull requests, your review returns all findings for 60 files in one structured tool call. On the biggest PRs, the response stops with stop_reason \"max_tokens\" in the middle of the findings array, so the JSON is incomplete and the pipeline drops the whole review. Raising max_tokens helped until the next, even larger PR. What is the most robust fix?",
      options: [
        "Raise max_tokens to the highest value the model allows, so that even very large pull requests fit into a single response.",
        "Ask Claude to keep each finding to one short sentence, so that more findings fit into the same output budget.",
        "Review in smaller scoped calls, per file or group of files plus one cross-file pass, and merge the findings in code.",
        "Retry the same request whenever the response is truncated, since output length varies from one attempt to the next."
      ],
      correct: [2],
      explanation: "The output of one call grows with the size of the pull request, so any fixed limit will eventually be exceeded, as the last PR showed. Splitting the review into smaller scoped calls keeps each response well within the output limit, a separate cross-file pass keeps issues that span files, and merging the structured results in code produces the complete set of findings.",
      optionExplanations: [
        "A higher ceiling postpones the failure to a larger PR and makes each response slower and costlier.",
        "Shorter findings lose useful detail and only move the point at which truncation happens.",
        "Scoped calls keep each output bounded, the cross-file pass keeps wider issues, and merging restores the full result.",
        "The same request produces output of roughly the same size, so retries keep failing."
      ],
      source: source("4.6", "Splitting large multi-file reviews into focused per-file passes for local issues plus separate integration passes for cross-file data flow analysis"),
      docs: [
        { label: "Agent SDK docs: Agent loop", url: "https://code.claude.com/docs/en/agent-sdk/agent-loop.md", quote: "Common values are end_turn (model finished normally), max_tokens (hit the output token limit), and refusal (the model declined the request)." }
      ]
    },
    {
      id: "core-d4-019",
      domain: "D4",
      objectives: ["O29"],
      scenario: "s6",
      question: "Your extraction tool returns schema-valid output for supplier invoices from 14 countries, but matching in the ERP system, which runs the next day, fails for 9% of them. The failing values are valid strings in different shapes: dates such as \"03.04.2026\", \"4/3/26\" and \"2026-04-03\", amounts written as \"1.234,50\" or \"1,234.50\", and country names in three languages. The budget allows no extra model calls per invoice. What is the most effective fix?",
      options: [
        "Add rules to the prompt for how to normalize dates, amounts and country names, alongside the existing schema.",
        "Add enum constraints for the country field only, since country names cause the most visible matching failures.",
        "Add a validation-retry loop that sends any value that fails ERP matching back to the model with the error.",
        "Add a free-text format_hint field next to each value, so that the ERP team can interpret every format themselves."
      ],
      correct: [0],
      explanation: "A schema guarantees the structure of the output, but not that values follow one format when the sources differ. Normalization rules in the prompt, such as ISO dates, decimal amounts with a point and ISO country codes, tell the model how to convert what it reads, within the same call. For dates like 4/3/26 the rules also need the day-month order per supplier country. Retries could fix format errors, but they need extra calls and the matching runs a day later.",
      optionExplanations: [
        "Normalization rules next to the schema turn varied source formats into one consistent format within the same call.",
        "Enums can standardize countries, but dates and amounts, which cause most failures, stay inconsistent.",
        "Retries with feedback can fix format errors, but they need extra model calls, and the ERP matching runs only the next day.",
        "A format hint shifts the interpretation to every consumer and keeps the ambiguity, such as day versus month."
      ],
      source: source("4.3", "Including format normalization rules in prompts alongside strict output schemas to handle inconsistent source formatting")
    },
    {
      id: "core-d4-020",
      domain: "D4",
      objectives: ["O31"],
      scenario: "s6",
      question: "Your contract extraction pulls clauses from scanned agreements. Typed clauses are extracted correctly 97% of the time, but handwritten margin notes, about 5% of extracted items, are wrong in more than half of the cases. Legal reviewers have started to double-check every extracted clause, including the typed ones, which removes most of the time savings. The model's confidence scores have not yet been validated against labeled data. What should you change first?",
      options: [
        "Route every extracted item below 0.9 confidence to human review, so that uncertain clauses are always checked by a person.",
        "Keep extracting the margin notes, but add a warning to every report that handwritten content may be inaccurate.",
        "Ask the model to be especially careful with handwritten text and to double-check each margin note it extracts.",
        "Define explicitly that handwritten margin notes are excluded from extraction and only flagged for a person to read."
      ],
      correct: [3],
      explanation: "One unreliable category is undermining trust in the reliable ones, so reviewers now check everything. Explicit criteria that exclude handwritten margin notes from extraction, and only flag them for a person, remove the source of most errors while keeping the accurate typed clauses; the category can return once its accuracy improves. Reviewers can then trust the typed results again and spend their time on the few flagged notes.",
      optionExplanations: [
        "Confidence-based routing needs scores validated against labeled data, which do not exist yet, and it keeps the unreliable category in the output.",
        "A general warning keeps the wrong extractions in the results and does not help reviewers trust the typed clauses.",
        "A request to be careful does not change how reliably handwriting is read.",
        "Excluding the unreliable category and flagging it restores trust in the reliable output."
      ],
      source: source("4.1", "The impact of false positive rates on developer trust: high false positive categories undermine confidence in accurate categories")
    },
    {
      id: "core-d4-021",
      domain: "D4",
      objectives: ["O25"],
      scenario: "s6",
      question: "Which approach guarantees that your extracted fields match the JSON schema, including required fields and types?",
      options: [
        "A prompt saying \"respond only with valid JSON\".",
        "Prefilling the reply with an opening brace.",
        "Setting the temperature to 0 for all requests.",
        "A tool with that schema as input, in strict mode."
      ],
      correct: [3],
      explanation: "Instructions, a prefilled brace or a low temperature make valid JSON more likely, but none of them constrains what the model can produce. Defining the schema as a tool's input and enabling strict mode constrains the tool input to schema-valid values, so required fields and types are guaranteed whenever the model calls the tool. Note: prefilled responses are no longer supported on newer models.",
      optionExplanations: [
        "An instruction raises the chance of valid JSON but cannot guarantee required fields or types.",
        "A prefill nudges the format but does not enforce the schema, and newer models reject it.",
        "Temperature makes output more repeatable, not schema-compliant.",
        "Tool use with a strict schema constrains the tool input to the schema."
      ],
      source: source("4.3", "Defining extraction tools with JSON schemas as input parameters and extracting structured data from the tool_use response"),
      docs: [
        { label: "Claude API docs: Strict tool use", url: "https://platform.claude.com/docs/en/agents-and-tools/tool-use/strict-tool-use.md", quote: "Setting strict: true on a tool definition guarantees Claude's tool inputs match your JSON Schema" }
      ]
    },
    {
      id: "core-d4-022",
      domain: "D4",
      objectives: ["O27"],
      scenario: "s6",
      question: "Your intake pipeline sends each scanned delivery note with two tools: extract_delivery_note and lookup_vendor, which should only be used after extraction. With automatic tool choice, about 4% of responses are text such as \"This scan is too blurry to read\", and the pipeline crashes because it expects a tool call. Unreadable scans must reach a human queue. What is the best fix?",
      options: [
        "Set tool_choice to \"any\", so that every response contains a tool call, and route unreadable scans based on whichever tool was called.",
        "Force extract_delivery_note through tool_choice, and add a status field such as \"ok\" or \"unreadable\" with the content fields nullable.",
        "Keep automatic tool choice, and add an instruction that the model must never answer in text, even when a scan cannot be read.",
        "Force extract_delivery_note through tool_choice and keep all of its content fields required, so the record is always complete."
      ],
      correct: [1],
      explanation: "With automatic tool choice, the model may answer in text, which breaks a pipeline that expects structured output. Forcing the extraction tool guarantees a tool call, and a status field with nullable content fields gives the model a structured way to report an unreadable scan without inventing values, which the pipeline can route to the human queue. \"any\" would also force a call, but the model could pick lookup_vendor first. Note: forced tool choice is not supported on every model; check the current docs for yours.",
      optionExplanations: [
        "\"any\" forces a tool call but leaves the choice of tool open, so lookup_vendor could come first and unreadable scans have no defined signal.",
        "Forcing the extraction tool guarantees structured output, and the status field turns \"unreadable\" into data the pipeline can route.",
        "An instruction with automatic choice cannot guarantee a tool call, and the model then has no proper way to report an unreadable scan.",
        "Forcing the call is right, but required fields on an unreadable scan push the model to invent values instead of reporting the problem."
      ],
      source: source("4.3", "The distinction between tool_choice: \"auto\" (model may return text instead of calling a tool)"),
      docs: [
        { label: "Claude API docs: Define tools", url: "https://platform.claude.com/docs/en/agents-and-tools/tool-use/define-tools.md", quote: "In some cases, you may want Claude to use a specific tool to answer the user's question, even if Claude would otherwise answer directly without calling a tool." }
      ]
    },
    {
      id: "core-d4-023",
      domain: "D4",
      objectives: ["O30"],
      scenario: "s5",
      question: "Your CI review, which runs claude -p on every pull request, keeps flagging two patterns the team uses on purpose: raw SQL in migration files and broad exception handlers in the job runner's top-level loop. Developers dismiss these comments on almost every pull request, about 30% of all findings, and have started to skim the rest. Both patterns are documented in an architecture decision record that the review never sees. What should you change?",
      options: [
        "Add the two accepted patterns to the project CLAUDE.md, with a short example of each and when they are acceptable, so every review applies them.",
        "Ask developers to add a note to each pull request explaining which patterns are intentional, so that the review can take them into account.",
        "Switch off the categories for SQL usage and exception handling entirely, so that these comments no longer appear in any review.",
        "Raise the confidence threshold for posting findings, so that fewer of the borderline comments reach the pull requests."
      ],
      correct: [0],
      explanation: "The review flags these patterns because nothing tells it they are accepted here. Documenting the accepted patterns, with examples and the conditions under which they are fine, in the CLAUDE.md that every review loads gives the reviewer persistent project context, so the false positives disappear while real SQL or exception problems elsewhere are still reported.",
      optionExplanations: [
        "Persistent project context with examples removes the known false positives in every review.",
        "Notes per pull request rely on every author remembering them and do not persist across reviews.",
        "Switching off whole categories also hides genuine SQL and exception-handling problems.",
        "A threshold is not tied to these patterns, so they may still appear while some real findings are suppressed."
      ],
      source: source("4.2", "Providing few-shot examples distinguishing acceptable code patterns from genuine issues to reduce false positives while enabling generalization")
    },
    {
      id: "core-d4-024",
      domain: "D4",
      objectives: [],
      scenario: "s5",
      question: "Your CI review assigns each finding one of three severities, and only critical findings block the merge. The prompt defines them as \"critical: serious problems; major: important problems; minor: small issues.\" The same unvalidated redirect parameter was rated critical in one pull request and minor in another, and developers now argue about blocks instead of fixing them. What change would make the ratings most consistent?",
      options: [
        "Have the model report a confidence score for each finding, and treat only findings with a confidence above 0.9 as critical.",
        "Run the review three times for each pull request and assign each finding the severity that most of the runs gave it.",
        "Rewrite each level's definition around the conditions that place a finding there, each illustrated with a short snippet of a typical case.",
        "Add the instruction \"When unsure between two levels, choose the lower severity\" to the prompt."
      ],
      correct: [2],
      explanation: "Words like \"serious\" and \"important\" leave the boundary between levels to the model's judgment in each run, so the same issue lands on different sides of it. Concrete criteria plus a short code sample per level show where the boundaries lie, which makes classification repeatable. Confidence measures how sure the model is that a finding is real, not how severe it is, and majority voting repeats the same vague definitions three times.",
      optionExplanations: [
        "Confidence describes certainty, not severity, so it does not fix the vague definitions.",
        "Voting smooths random variation at triple cost, but the boundaries stay undefined.",
        "Specific criteria with concrete samples per level make the boundaries clear and the ratings consistent.",
        "A tie-break rule shifts doubtful cases in one direction, but the boundaries between levels stay as vague as before."
      ],
      source: source("4.1", "Defining explicit severity criteria with concrete code examples for each severity level to achieve consistent classification")
    },
    {
      id: "core-d4-025",
      domain: "D4",
      objectives: [],
      scenario: "s5",
      question: "Your triage bot posts a summary comment on each new bug report through an existing integration that accepts only free text, and the team wants no extra code between the model and that integration. The prompt describes the format in detail: affected component, user impact, reproduction steps and a workaround. Still, about a third of comments omit the reproduction steps or the workaround, and some merge two reports into one paragraph. How can you make the comments consistent?",
      options: [
        "Define a JSON schema for the summary and have the model return each summary through a tool call with that schema.",
        "Add three sample comments to the prompt, each summarizing a single bug report in exactly the required layout.",
        "Expand the format description with a separate paragraph that explains each required element and why it matters.",
        "Ask the model to compare its comment with the format description and correct it before it finishes the response."
      ],
      correct: [1],
      explanation: "When detailed instructions still produce varied output, showing the target is more effective than describing it again. A few sample comments that each cover one report with every element in place give the model a concrete pattern to follow. A JSON schema would need code to turn the output into text, which the team rules out, and a longer description or a self-check against the same description repeats what already fails.",
      optionExplanations: [
        "A schema would work, but turning tool output into comments needs the extra code the team does not want.",
        "Sample comments in the required layout are the most effective way to get consistent format.",
        "More description of the same format is what has already proven unreliable.",
        "A self-check against the same description relies on the instructions that are already followed inconsistently."
      ],
      source: source("4.2", "Including few-shot examples that demonstrate specific desired output format (location, issue, severity, suggested fix) to achieve consistency"),
      docs: [
        { label: "Claude API docs: Prompting best practices", url: "https://platform.claude.com/docs/en/build-with-claude/prompt-engineering/claude-prompting-best-practices.md", quote: "Examples are one of the most reliable ways to steer Claude's output format, tone, and structure." }
      ]
    },
    {
      id: "core-d4-026",
      domain: "D4",
      objectives: [],
      scenario: "s6",
      question: "Your invoice extraction validates each result: line items must add up to the subtotal, and VAT must appear in the tax field, not among the line items. When validation fails, the pipeline sends the identical request again, up to three times, and only 18% of these retries pass. A sample shows that the needed values are present in every failed invoice. How should the retry work?",
      options: [
        "Retry with the invoice, the model's previous output and the exact checks that failed, and ask the model to fix those points.",
        "Enable strict mode on the extraction tool's schema, so that every retry is guaranteed to return a valid result.",
        "Raise the temperature on each retry, so that the model produces a different extraction instead of repeating its mistake.",
        "Send every invoice that still fails after two retries straight to human review, since its values are evidently hard to extract."
      ],
      correct: [0],
      explanation: "An identical retry gives the model no hint about what was wrong, so it tends to repeat the error. Sending the source, the failed output and the specific failed checks lets it correct exactly those points, and it can succeed because the values are in the document. Strict mode guarantees the schema, not that sums match or values sit in the right field, and more randomness is not a correction.",
      optionExplanations: [
        "Specific error feedback with the original document and output gives the model what it needs to self-correct.",
        "Strict schemas prevent format errors, but these are semantic errors that a valid schema does not catch.",
        "Higher temperature changes the output randomly rather than fixing the identified problems.",
        "Human review is for information that is missing; here the values are present and a guided retry can work."
      ],
      source: source("4.4", "Retry-with-error-feedback: appending specific validation errors to the prompt on retry to guide the model toward correction")
    },
    {
      id: "core-d4-027",
      domain: "D4",
      objectives: ["O23"],
      scenario: "s6",
      question: "To halve costs, your team moves its overnight supplier-risk assessment to the Message Batches API. During each assessment, the model calls your own tool get_payment_history, which queries an internal database, usually two or three times per supplier. In the first batch, most results end with stop_reason \"tool_use\" and contain no assessment. The batch is submitted at 11 p.m., results are needed by 8 a.m., and each supplier's payment history is small. What should you change?",
      options: [
        "Submit the results of the requested tool calls as a new batch, and repeat this until every supplier's assessment is complete.",
        "Increase max_tokens for the batch requests, so that the model has room to finish its assessment within a single response.",
        "Fetch each supplier's payment history before submitting and include it in the request, so that no tool call is needed during processing.",
        "Move the assessment back to the synchronous API, since the Message Batches API cannot be used for workloads that involve any tools."
      ],
      correct: [2],
      explanation: "A batch request cannot pause, wait for your code to run a tool and continue, so the model stops at its first tool request. Because the data is small and known in advance, loading it up front removes the need for tool calls and keeps the batch savings. Chaining batches cannot guarantee the deadline, since each round may take up to 24 hours. Note: the current docs say server-side tools such as web search do run inside batch requests; tools that your own code executes still need a new request.",
      optionExplanations: [
        "Each extra round may take up to 24 hours, so two or three rounds cannot guarantee the 8 a.m. deadline.",
        "The responses stop to request a tool, not because they run out of tokens.",
        "Supplying the data in the request removes the tool round trips and keeps the batch discount.",
        "Giving up the batch discount is unnecessary when the tool calls can be avoided, and some tools do work in batches."
      ],
      source: source("4.5", "The batch API does not support multi-turn tool calling within a single request (cannot execute tools mid-request and return results)"),
      docs: [
        { label: "Claude API docs: Batch processing", url: "https://platform.claude.com/docs/en/build-with-claude/batch-processing.md", quote: "The batch worker runs the same server-side agentic loop as the synchronous Messages API." }
      ]
    },
    {
      id: "core-d4-028",
      domain: "D4",
      objectives: ["O25"],
      scenario: "s6",
      question: "Your extraction pipeline produces two outputs from each batch of purchase orders: a weekly summary in Markdown that managers read in an email, and one record per order that is loaded into the ERP system, which rejects any record with a missing required field or a wrong type. Rejected records currently need manual rework. Both outputs come from prompt instructions such as \"respond in this format\". Which approach fits best?",
      options: [
        "Keep prompt-based formatting for both outputs, and add more detailed format instructions and an example of a valid ERP record.",
        "Keep prompt-based formatting for the summary, and produce the ERP records through a tool whose input schema matches the ERP's requirements.",
        "Produce both the summary and the ERP records through tools with JSON schemas, so that every output follows a schema.",
        "Keep prompt-based JSON for the ERP records, and add a parser that drops every record that fails validation against the ERP schema."
      ],
      correct: [1],
      explanation: "The right method depends on how strict the consumer is. The ERP rejects anything off-schema, so the records need tool use with a JSON schema, the most reliable way to get schema-compliant output. The summary is read by people, for whom small format variations do not matter, so prompt instructions suffice there. Putting the summary into a schema adds effort without benefit, and dropping invalid records loses orders instead of preventing the errors.",
      optionExplanations: [
        "Better instructions reduce errors but cannot guarantee the compliance the ERP requires.",
        "Each output gets the method its consumer needs: a schema for the strict ERP, prompt formatting for human readers.",
        "A schema for a human-read summary adds effort without a benefit.",
        "Dropping invalid records loses orders rather than preventing invalid output."
      ],
      source: source("4.3", "Tool use (tool_use) with JSON schemas as the most reliable approach for guaranteed schema-compliant structured output, eliminating JSON syntax errors")
    },
    {
      id: "core-d4-029",
      domain: "D4",
      objectives: ["O26"],
      scenario: "s6",
      question: "Your supplier onboarding extraction has a nullable field vat_id, and the model returns null whenever a registration form shows no VAT ID. Downstream, a null always triggers an email asking the supplier for the missing number. About a third of these emails go to small businesses that had ticked \"VAT exempt\" on the form, and they complain. Finance must be able to tell exempt suppliers from forms that simply lack the number. What should you change in the schema?",
      options: [
        "Add a vat_status enum with values such as provided, exempt and not_stated, and keep vat_id nullable for the number itself.",
        "Have the model write the text \"EXEMPT\" into vat_id for exempt suppliers, so that the downstream system can recognize them.",
        "Keep vat_id nullable and have the model explain in its reply text why it returned null for that supplier.",
        "Add a free-text notes field in which the model can describe anything unusual about the supplier's VAT situation."
      ],
      correct: [0],
      explanation: "A single nullable field can say that no number was found, but not why. An enum that separates exempt suppliers from forms without a number gives downstream systems an explicit, machine-readable reason, while vat_id stays null when there is no number. A marker string mixes a status into a field meant for IDs, an explanation outside the record never reaches the downstream logic, and free text cannot be processed reliably.",
      optionExplanations: [
        "An explicit status enum separates exempt from missing while vat_id keeps holding only real numbers.",
        "A marker string puts a status into a field meant for VAT IDs and invites inconsistent spellings.",
        "An explanation in free reply text is not part of the record that downstream systems process.",
        "Free text describes the case but gives downstream systems nothing reliable to branch on."
      ],
      source: source("4.3", "Adding enum values like \"unclear\" for ambiguous cases and \"other\" + detail fields for extensible categorization")
    },
    {
      id: "core-d4-030",
      domain: "D4",
      objectives: ["O27"],
      scenario: "s1",
      question: "To stop occasional text-only replies in an extraction step, a teammate set tool_choice to \"any\" for every request of your support chat agent. Since then, customers who write \"Thanks, that's all!\" get an order lookup instead of a goodbye. What is the best fix?",
      options: [
        "Use automatic tool choice for chat turns, and require a tool only for the extraction request.",
        "Add an end_conversation tool, so that \"any\" always has a fitting tool to call.",
        "Keep \"any\" and tell the model in the system prompt when not to look up orders.",
        "Set tool_choice to \"none\" for every chat turn, so the agent answers in text."
      ],
      correct: [0],
      explanation: "\"any\" guarantees a tool call, which suits a step whose output must be structured, but chat turns sometimes need a plain text answer. Requiring a tool only where structured output is needed and leaving the conversation on automatic tool choice gives each step what it needs. An extra tool for goodbyes or a prompt rule works around a setting that is wrong for chat, and \"none\" blocks the lookups chat turns need. Note: the current docs state that Claude Opus 5.5, Sonnet 5.5 and Fable 5.1 reject \"any\" and forced tool choice with a 400 error and recommend automatic tool choice with strict tool use instead.",
      optionExplanations: [
        "Scoping the tool requirement to the extraction step lets chat turns answer in text again.",
        "A goodbye tool works around the setting instead of using it only where it belongs.",
        "With \"any\", the model must still call some tool, whatever the prompt says.",
        "\"none\" restores text replies but also blocks the lookups that chat turns legitimately need."
      ],
      source: source("4.3", "The distinction between tool_choice: \"auto\" (model may return text instead of calling a tool), \"any\" (model must call a tool but can choose which), and forced tool selection (model must call a specific named tool)")
    },
    {
      id: "core-d4-031",
      domain: "D4",
      objectives: ["O23"],
      scenario: "s6",
      question: "Your weekly compliance report must be ready by Monday 9 a.m. The 30,000 documents it covers become available on Friday at 6 p.m., and the team wants to halve the extraction cost. A colleague objects that the Message Batches API gives no latency guarantee and proposes the synchronous API to be safe. When and how should you run the extraction?",
      options: [
        "Run it synchronously on Monday at 5 a.m., so that the results are as fresh as possible when the report is assembled at 9 a.m.",
        "Run it synchronously on Friday evening, since a compliance deadline cannot depend on an API without a guaranteed processing time.",
        "Submit it as a Message Batch on Friday evening, right after the documents become available.",
        "Submit it as a Message Batch on Sunday at 11 p.m., so that the run is close to the report date."
      ],
      correct: [2],
      explanation: "The batch window is at most 24 hours, and Friday 6 p.m. to Monday 9 a.m. is more than twice that, so even the worst case meets the deadline while saving half the cost; requests that expire unprocessed after 24 hours can still be resubmitted on Saturday evening. The lack of a faster guarantee matters only when the window is shorter than 24 hours. Submitting on Sunday night relies on the typical case rather than the guaranteed one, and synchronous processing pays full price without need.",
      optionExplanations: [
        "Synchronous processing pays full price, and a 5 a.m. start leaves little margin.",
        "The 63-hour window easily covers the 24-hour maximum, so the safety argument does not hold.",
        "A Friday batch meets the deadline even in the worst case and halves the cost.",
        "Ten hours before the deadline is shorter than the 24-hour maximum, so the deadline is not guaranteed."
      ],
      source: source("4.5", "The Message Batches API: 50% cost savings, up to 24-hour processing window, no guaranteed latency SLA"),
      docs: [
        { label: "Claude API docs: Batch processing", url: "https://platform.claude.com/docs/en/build-with-claude/batch-processing.md", quote: "The system processes each batch as fast as possible, with most batches completing within 1 hour." }
      ]
    },
    {
      id: "core-d4-032",
      domain: "D4",
      objectives: ["O31"],
      scenario: "s6",
      question: "Your pipeline extracts risk factors from earnings-call transcripts for an investor dashboard. Analysts complain that 30% of the extracted risks are speculation from analysts' questions or the model's own inferences, such as \"rising rates may hurt demand\", rather than risks the company's management actually named. The prompt says \"Extract all relevant risks.\" What change improves precision most?",
      options: [
        "Ask the model to add a confidence score to each risk, and drop every risk that scores below 0.7.",
        "Tell the model to be conservative and report only the most important risks it finds in each transcript.",
        "Run a second call that checks each extracted risk against the transcript and removes risks that do not appear in it.",
        "Define that only risks named by management count, exclude analyst questions and inferences, and show an example of each."
      ],
      correct: [3],
      explanation: "\"All relevant risks\" gives the model no boundary, so it includes analysts' speculation and its own reasoning. Stating exactly what counts and what does not, with an example of each, removes the categories where the extraction goes wrong. Confidence scores and \"be conservative\" do not define the boundary, and a check against the transcript keeps analyst speculation, which does appear in the transcript.",
      optionExplanations: [
        "Confidence filtering does not tell the model that analyst speculation is out of scope.",
        "A general call for caution does not define what counts as a reportable risk.",
        "Analyst questions are in the transcript, so a check against it would keep them.",
        "Explicit inclusion and exclusion criteria with examples target exactly the categories that cause errors."
      ],
      source: source("4.1", "The importance of explicit criteria over vague instructions (e.g., \"flag comments only when claimed behavior contradicts actual code behavior\" vs \"check that comments are accurate\")")
    },
    {
      id: "core-d4-033",
      domain: "D4",
      objectives: ["O24"],
      scenario: "s5",
      question: "One CI review prompt covers security, business logic and API design, with examples for each. After you added five security examples, security recall rose from 70% to 91%, but business-logic recall fell from 88% to 74%; API-design findings stayed stable at 85%. Business logic must get back above 85%, security must stay above 90%, and the review's per-PR cost may at most double; each pass costs roughly as much as today's single review. What should you do?",
      options: [
        "Run three separate passes, one per concern, each with its own focused prompt and examples, and merge their findings.",
        "Give business logic its own pass with its own examples, and keep security and API design together in the existing pass.",
        "Remove two of the five new security examples, so that the prompt finds a balance between security and business-logic recall.",
        "Keep one pass, and add five business-logic examples so that both concerns are represented as strongly as each other."
      ],
      correct: [1],
      explanation: "The concerns compete for attention in one prompt, so the dropped concern needs a pass of its own. Three passes would triple the cost, which the budget rules out, while two passes stay within it: business logic gets a focused pass and recovers, and the pass that keeps security still contains the examples that lifted it. Trimming examples gives back part of the security gain, and adding more examples to the shared prompt continues the same competition.",
      optionExplanations: [
        "Three passes would separate all concerns, but they triple the cost, beyond the allowed doubling.",
        "Two passes isolate the concern that suffered and stay within the cost limit.",
        "Fewer security examples trade one recall against the other instead of removing the competition.",
        "More examples in the same prompt keep the concerns competing and may push another one down."
      ],
      source: source("4.6", "Multi-pass review: splitting large reviews into per-file local analysis passes plus cross-file integration passes to avoid attention dilution and contradictory findings")
    },
    {
      id: "core-d4-034",
      domain: "D4",
      objectives: ["O29"],
      scenario: "s6",
      question: "Your invoice extraction uses a tool with a strict schema in which invoice_date must be an ISO 8601 date. Every output is valid, yet an audit finds wrong dates in 8% of invoices: \"03/04/2025\" from a German supplier became 2025-03-04 instead of 2025-04-03. The supplier's country is known for every invoice, and a few invoices mix both conventions within the same document. What change addresses this best?",
      options: [
        "Tighten the schema with a regular expression for ISO 8601 dates, so that the model can only return correctly formatted values.",
        "Add three examples to the prompt that show slash-separated dates from European suppliers converted correctly to ISO 8601.",
        "Run every extracted date through a date-parsing library after extraction, so that the format is normalized in code.",
        "Add prompt rules to read ambiguous dates by the supplier's country convention and to flag invoices that mix both conventions."
      ],
      correct: [3],
      explanation: "The schema already guarantees a valid format; the error is in how ambiguous source values are interpreted, which a schema cannot catch. Normalization rules that tie the reading to the supplier's country, and route documents with mixed conventions to review, address exactly that. Examples help but give no rule for invoices that mix both conventions, and a parser after extraction sees only the already converted ISO date, so it cannot recover the original day and month.",
      optionExplanations: [
        "The output is already valid ISO 8601; a stricter pattern does not fix a swapped day and month.",
        "Examples help for typical cases but give no rule for invoices that mix both conventions.",
        "After extraction the value is already in ISO form, so a parser cannot see the original ambiguity.",
        "Rules based on the supplier's country, plus a flag for mixed conventions, target the actual interpretation error."
      ],
      source: source("4.3", "Including format normalization rules in prompts alongside strict output schemas to handle inconsistent source formatting")
    },
    {
      id: "core-d4-035",
      domain: "D4",
      objectives: ["O26"],
      scenario: "s6",
      question: "An audit of your insurance claim extraction finds two problems. When a claim form leaves the date of the incident blank, incident_date, a required string, is filled with dates such as the form's submission date. And for a kitchen flooded by fire-fighting water, claim_type (theft, water_damage, fire) is set to one of the two plausible types with no sign of doubt. Which two schema changes address these problems? (Select 2)",
      options: [
        "Let incident_date be null, and say in its description to leave it null when the form gives no incident date.",
        "Add a validation rule that rejects any incident_date equal to the submission date, so that the field cannot simply repeat it.",
        "Add an \"other\" value with a detail string to claim_type, for claims that fit none of the three listed types.",
        "Move incident_date into a free-text notes field, so that the model can describe in words what the form says about the date.",
        "Add a value to claim_type that the model uses when a claim fits two of the listed types equally well."
      ],
      correct: [0, 4],
      explanation: "A required field forces the model to put a date in even when the form has none, so incident_date must be allowed to stay empty. A claim that fits two listed types is ambiguous rather than unlisted, so claim_type needs a value that expresses this doubt. An \"other\" value covers types outside the list, a validation rule against one specific date only pushes the model toward a different invented date, and free text loses the structured field downstream systems rely on.",
      optionExplanations: [
        "A nullable field lets the model report a missing date instead of substituting another one.",
        "The rule blocks one wrong date but still forces the model to invent some date.",
        "\"other\" is meant for types outside the list; this claim fits two listed types.",
        "Free text gives up the structured date field that downstream processing needs.",
        "A value for ambiguous cases lets the model signal that two listed types fit."
      ],
      source: source("4.3", "Adding enum values like \"unclear\" for ambiguous cases and \"other\" + detail fields for extensible categorization")
    },
    {
      id: "core-d4-036",
      domain: "D4",
      objectives: ["O23"],
      scenario: "s6",
      question: "Your team wants to move as much work as possible to the Message Batches API for its 50% discount. Which two of these workloads are good fits for batch processing? (Select 2)",
      options: [
        "A merge check whose results developers need within 10 minutes, submitted as a new batch every 5 minutes.",
        "Re-tagging 200,000 catalogue items for a product launch in three weeks, with the work started this weekend.",
        "An assessment agent that calls your own get_payment_history tool two or three times while working on each supplier.",
        "Categorizing last quarter's 1 million support tickets for a management report due in two weeks.",
        "A support chat in which customers wait for each answer before they type their next message."
      ],
      correct: [1, 3],
      explanation: "Batch processing suits work that nobody waits for and that can take up to 24 hours. Re-tagging a catalogue weeks before a launch and categorizing tickets for a report due in two weeks both qualify. A merge check needed within 10 minutes cannot rely on batches that have no latency guarantee, however often they are submitted. An agent that must call your own tool mid-request cannot do so inside a batch request, and a live chat blocks a waiting customer.",
      optionExplanations: [
        "Frequent submission does not change the missing latency guarantee; a 10-minute need is not met reliably.",
        "Weeks of lead time easily absorb the batch processing window.",
        "A batch request cannot pause to run your own tool and continue.",
        "A two-week deadline comfortably covers batch processing.",
        "Customers waiting for each reply need synchronous responses."
      ],
      source: source("4.5", "Matching API approach to workflow latency requirements: synchronous API for blocking pre-merge checks, batch API for overnight/weekly analysis")
    },
    {
      id: "core-d4-037",
      domain: "D4",
      objectives: ["O29"],
      scenario: "s6",
      question: "Your insurance claim extraction validates every result. When validation fails, it sends the claim form, the failed output and the specific validation error back to the model. For which two failures will re-sending this feedback lead to a corrected extraction? (Select 2)",
      options: [
        "The incident date was returned as \"3rd of March\" although the field description asks for ISO 8601.",
        "The claimant's bank details are on a second form that was not uploaded with the claim.",
        "The repair estimate was placed in the deductible field instead of the estimate field.",
        "The page with the damage description is completely blank in the scan the model receives.",
        "The output stopped at max_tokens because the claim lists 900 damaged household items."
      ],
      correct: [0, 2],
      explanation: "Error feedback helps when the information is in the form and the model put it in the wrong format or field, as with a wrongly formatted date or an amount in the wrong field. It cannot help when the information is not in what the model receives, whether it is on a form that was never uploaded or on a blank page. A response cut off at max_tokens will be cut off again; it needs the work split into smaller parts, not feedback.",
      optionExplanations: [
        "A format mismatch is a typical case that feedback with the error corrects.",
        "No feedback can extract details from a form the model never sees.",
        "A value in the wrong field can be moved once the error points it out.",
        "A blank page contains nothing to extract.",
        "The output limit is reached again on retry; splitting the work is needed instead."
      ],
      source: source("4.4", "Implementing follow-up requests that include the original document, the failed extraction, and specific validation errors for model self-correction")
    }
  ]);
})();
