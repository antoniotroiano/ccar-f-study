/* Domain 5: Context Management & Reliability (Exam Guide weight 15%) */
(function () {
  const source = window.CORE_CATALOG.examGuideSource;

  window.CORE_CATALOG.addQuestions([
    {
      id: "core-d5-001",
      domain: "D5",
      scenario: "s1",
      question: "A customer opens a chat about a double charge on their credit card. When the agent asks for the order number, the customer replies: \"I want a real person, not a bot. Please transfer me.\" The agent has the tools to look up the order and refund duplicate charges, and similar cases are usually resolved within two minutes. What should the agent do next?",
      options: [
        "Acknowledge the frustration, explain that the double charge can be fixed within two minutes, and escalate only if the customer insists once more.",
        "Escalate only if a sentiment check rates the conversation as strongly negative, since the issue itself is simple and within the agent's capability.",
        "Look up the order and the duplicate charge first, so that the human agent receives a complete case file, and then hand over the conversation.",
        "Hand the conversation to a human right away, with a structured summary of what is known so far, without looking into the charge first."
      ],
      correct: [3],
      explanation: "When a customer explicitly asks for a human, the agent honors the request immediately, even if it could solve the problem itself. Offering a quick resolution first is appropriate for a customer who is frustrated but has not asked for a person. A structured handoff summary helps the human agent, who does not see the conversation transcript. Sentiment scores are an unreliable signal for when to escalate.",
      optionExplanations: [
        "Offering to resolve first fits a customer who is frustrated but has not asked for a person; an explicit request for a human is honored immediately.",
        "Sentiment is an unreliable proxy for when to escalate and ignores what the customer explicitly asked for.",
        "Investigating first delays the handover the customer explicitly demanded.",
        "An explicit request for a human agent is honored immediately, without first attempting investigation; the summary helps the human, who cannot see the transcript."
      ],
      source: source("5.2", "Honoring explicit customer requests for human agents immediately without first attempting investigation")
    },
    {
      id: "core-d5-002",
      domain: "D5",
      scenario: "s3",
      question: "The document analysis subagent processes twelve PDFs per research task. About once per task, loading one PDF times out briefly and succeeds on a second attempt; occasionally a PDF is permanently unavailable. Today the subagent reports every error straight to the coordinator, which then restarts the entire analysis, roughly doubling the runtime. How should the error handling be redesigned?",
      options: [
        "Have the coordinator restart only the analysis subagent instead of the whole task whenever that subagent reports any kind of error.",
        "Have the coordinator spawn an extra analysis subagent for each PDF that failed, while the first subagent continues with the remaining documents.",
        "Let the subagent retry brief timeouts on its own and pass only unrecoverable failures to the coordinator, together with what it tried and what it has.",
        "Have the subagent retry every failed load with exponential backoff until it succeeds, so that the coordinator never has to handle document errors."
      ],
      correct: [2],
      explanation: "Brief timeouts are transient: a second attempt usually succeeds, so the subagent should retry them itself. Only failures it cannot resolve, such as a permanently unavailable PDF, need to reach the coordinator, together with what was attempted and the partial results that exist. The coordinator can then decide how to continue, for example by finishing the report with a noted gap, instead of restarting the whole analysis.",
      optionExplanations: [
        "Restarting a whole subagent for a brief timeout still throws away completed work; transient errors should be recovered locally.",
        "This moves the handling of a simple transient error up to the coordinator and adds subagents, where a local retry would do.",
        "Local recovery handles transient errors cheaply, and only unresolved failures reach the coordinator, with enough context to decide what to do.",
        "Endless retries hang on permanently unavailable PDFs, and the coordinator never learns that a document is missing."
      ],
      source: source("5.3", "Having subagents implement local recovery for transient failures and only propagate errors they cannot resolve"),
      docs: [
        { label: "Claude API docs: Handle tool calls", url: "https://platform.claude.com/docs/en/agents-and-tools/tool-use/handle-tool-calls.md", quote: "Instead of generic errors like \"failed\", include what went wrong and what Claude should try next" },
        { label: "Claude Code docs: Agent SDK custom tools", url: "https://code.claude.com/docs/en/agent-sdk/custom-tools.md", quote: "In both cases Claude can retry, try a different tool, or explain the failure." }
      ]
    },
    {
      id: "core-d5-003",
      domain: "D5",
      scenario: "s1",
      question: "A customer writes in one message: (1) the blender they bought 20 days ago arrived with a cracked jug, and they attach a photo; (2) they saw the same blender $40 cheaper at a competitor last week and want the difference refunded. The return policy covers damaged items within 30 days with photo evidence. The price-adjustment policy covers price drops on the company's own website within 14 days of purchase; it does not mention competitor prices. The customer is calm and has not asked for a human. What should the agent do?",
      options: [
        "Arrange the replacement for the damaged blender under the return policy, and escalate the competitor price-match request to a human for a decision.",
        "Escalate the whole conversation to a human, because one of the two requests falls outside policy and the case should stay with a single owner.",
        "Arrange the replacement, and decline the price-match request, explaining that the policy only covers price drops on the company's own website.",
        "Arrange the replacement, and refund the $40 as a goodwill gesture, since the amount is well within the agent's refund limit and keeps the customer happy."
      ],
      correct: [0],
      explanation: "The two requests need different handling. The damaged blender is fully covered by the return policy, so the agent resolves it on its own. The competitor price match is not covered: the policy only addresses price drops on the company's own website and says nothing about competitors. When policy is silent or ambiguous on a specific request, the agent escalates that request instead of deciding it on its own, neither by declining nor by granting it.",
      optionExplanations: [
        "The covered request is resolved autonomously, and only the request the policy is silent on goes to a human, so the customer gets a fast fix for the damage.",
        "The damage replacement is a straightforward, covered case; escalating it as well delays the customer and works against first-contact resolution.",
        "The policy does not forbid competitor price matching, it simply does not address it; declining fills a policy gap with the agent's own decision.",
        "Granting money that no policy covers is also the agent deciding a policy gap on its own; the refund limit says what the agent may pay, not what it should pay."
      ],
      source: source("5.2", "Escalating when policy is ambiguous or silent on the customer's specific request")
    },
    {
      id: "core-d5-004",
      domain: "D5",
      objectives: ["O21"],
      scenario: "s1",
      question: "Long support conversations regularly exceed your context budget, so after turn 15 earlier turns are replaced by a running summary. In 9% of conversations longer than 30 turns, the agent later confirms a wrong refund amount or refers to the wrong order. In these cases the summary reads like \"Customer had an issue with a recent order; a partial refund was discussed.\" What is the most effective change?",
      options: [
        "Instruct the summarization step to keep every number, date and order reference it finds, and to quote them exactly in the running summary.",
        "Call lookup_order again before every answer that mentions an order, so that the agent always works with the current order data.",
        "Stop summarizing and always send the complete history, since the model needs all earlier turns to answer consistently.",
        "Keep the agreed refund sum, the affected order IDs and key deadlines in a structured section that every request includes and that is never condensed."
      ],
      correct: [3],
      explanation: "Progressive summarization tends to turn exact values such as amounts, dates and order numbers into vague statements, which is what the example summary shows. Extracting these transactional facts into a structured block that is sent with every request, but kept out of the summarized history, preserves them exactly while the rest of the conversation can still be condensed to fit the context budget.",
      optionExplanations: [
        "Better summarization instructions help, but the values still pass through a step that condenses text, so they remain at risk.",
        "Fresh lookups help with order data, but not with what was agreed in the conversation, such as the discussed amount, and they add a tool call to every answer.",
        "The conversations already exceed the context budget, which is why summarization was introduced in the first place.",
        "A separate block keeps the critical values exact, independent of how the rest of the history is summarized."
      ],
      source: source("5.1", "Extracting transactional facts (amounts, dates, order numbers, statuses) into a persistent \"case facts\" block"),
      docs: [
        { label: "Claude API docs: Context windows", url: "https://platform.claude.com/docs/en/build-with-claude/context-windows.md", quote: "As token count grows, accuracy and recall degrade, a phenomenon known as context rot." },
        { label: "Claude Code docs: Best practices", url: "https://code.claude.com/docs/en/best-practices.md", quote: "Customize compaction behavior in CLAUDE.md with instructions like \"When compacting, always preserve the full list of modified files and any test commands\" to ensure critical context survives summarization" }
      ]
    },
    {
      id: "core-d5-005",
      domain: "D5",
      objectives: ["O20"],
      scenario: "s4",
      question: "An engineer spends a whole afternoon exploring a legacy order system with your agent, which reads about 40 files along the way. The context is compacted several times. Late in the session, the agent mixes up the roles of OrderLedger and RefundSaga, two classes it had analyzed correctly earlier, and its answers to similar questions start to contradict each other. Each compaction summary keeps only a high-level description. How should the agent preserve its findings across the session?",
      options: [
        "Compact the context more often, so that each summary covers a shorter period and keeps more of the specific details.",
        "Keep a scratchpad file in which the agent records key findings as it goes and that it reads again before answering follow-up questions.",
        "Ask the agent to read all 40 relevant files again at the start of each new question, so that it always answers from the actual code.",
        "Ask the engineer to repeat the relevant class names and their roles in each new question, so that they stay in the recent context."
      ],
      correct: [1],
      explanation: "In long sessions the model's grasp of earlier details degrades, and compaction keeps only high-level summaries, so specific findings such as class names and their roles get lost. A scratchpad file in which the agent records key findings, and which it consults for later questions, persists these findings outside the context window. The agent can then answer consistently without re-reading the code or relying on lossy summaries.",
      optionExplanations: [
        "More frequent compaction still produces lossy summaries; the specific findings are not stored anywhere else.",
        "A scratchpad persists key findings across context boundaries and counteracts the degradation described.",
        "Re-reading 40 files for every question is slow and expensive and refills the context, which brings the problem back.",
        "This shifts the agent's memory to the engineer, who has to know the correct roles already; the agent's own findings are still not preserved."
      ],
      source: source("5.4", "Having agents maintain scratchpad files recording key findings, referencing them for subsequent questions to counteract context degradation"),
      docs: [
        { label: "Claude API docs: Prompting best practices", url: "https://platform.claude.com/docs/en/build-with-claude/prompt-engineering/claude-prompting-best-practices.md", quote: "Use unstructured text for progress notes: Freeform progress notes work well for tracking general progress and context." },
        { label: "Claude API docs: Prompting best practices", url: "https://platform.claude.com/docs/en/build-with-claude/prompt-engineering/claude-prompting-best-practices.md", quote: "Update a hypothesis tree or research notes file to persist information and provide transparency." }
      ]
    },
    {
      id: "core-d5-006",
      domain: "D5",
      objectives: ["O22"],
      scenario: "s6",
      question: "Your extraction system reaches 94% field accuracy on its validation set, above the agreed target of 90% per field, and management wants to stop human review for extractions the model marks as high-confidence. The validation set is 80% purchase orders; delivery notes and customs forms make up the rest. Next quarter, customs forms will be 30% of production volume. What should you do before reducing human review?",
      options: [
        "Break the validation results down by document type and by field, and keep review for every combination that falls below the target.",
        "Raise the confidence threshold for skipping review from 0.8 to 0.95 for all document types, so only the most certain extractions skip it.",
        "Plan stratified random sampling of high-confidence extractions after the switch, so that the error rate is measured continuously.",
        "Double the size of the validation set with more purchase orders, so that the overall accuracy figure becomes more reliable."
      ],
      correct: [0],
      explanation: "An overall figure dominated by purchase orders can hide poor accuracy on customs forms, which will soon be a large share of production. Breaking the results down by document type and field shows whether every segment meets the target before review is removed for it; where one falls short, human review stays. Ongoing stratified sampling is valuable, but it measures errors after automation has started, not before the decision.",
      optionExplanations: [
        "Segment-level accuracy checks that each document type and field performs well before automation is trusted there.",
        "A higher global threshold reduces risk somewhat, but it does not show whether customs forms are handled well.",
        "Stratified sampling is the right way to monitor afterwards, but the question is what to verify before reducing review.",
        "More purchase orders make the figure even less representative of customs forms."
      ],
      source: source("5.5", "Analyzing accuracy by document type and field to verify consistent performance across all segments before reducing human review")
    },
    {
      id: "core-d5-007",
      domain: "D5",
      objectives: ["O19"],
      scenario: "s3",
      question: "A report on electric vehicle adoption states an 18% market share. A reviewer comments: \"Your own sources include the government's 14% for 2023; the 18% is from an industry release in mid-2024. Which is it?\" In the trace, the search subagent returned each figure as a number with its source URL, and the synthesis subagent used the larger one without comment. How should the pipeline handle figures like these?",
      options: [
        "Have the synthesis subagent always prefer government sources over industry sources whenever two figures in its input conflict.",
        "Have the synthesis subagent present both figures side by side, each with its source, whenever two figures disagree.",
        "Have the search subagent return the period and publication date with every figure, and let synthesis present the figures in that context.",
        "Drop every statistic for which the sources disagree, so that the report contains only figures that are not in dispute."
      ],
      correct: [2],
      explanation: "Without dates, two figures from different periods look like a contradiction, and the synthesis subagent resolved it arbitrarily. When the search subagent returns the period and publication date with each figure, the synthesis can recognize a change over time and describe it correctly. Where sources genuinely disagree for the same period, both values should appear with their sources. Showing both without dates still presents a trend as a conflict.",
      optionExplanations: [
        "A fixed preference is still an arbitrary choice, and here both figures may be correct for their periods.",
        "Attribution is better than a silent choice, but without dates the report still presents a change over time as a disagreement.",
        "Dates enable correct temporal interpretation, so the report can describe the figures accurately.",
        "Dropping disputed figures removes relevant information and hides that the topic has changing or conflicting data."
      ],
      source: source("5.6", "Requiring subagents to include publication or data collection dates in structured outputs to enable correct temporal interpretation"),
      docs: [
        { label: "Claude API docs: Prompting best practices", url: "https://platform.claude.com/docs/en/build-with-claude/prompt-engineering/claude-prompting-best-practices.md", quote: "When using multiple documents, wrap each document in <document> tags with <document_content> and <source> (and other metadata) subtags for clarity." }
      ]
    },
    {
      id: "core-d5-008",
      domain: "D5",
      objectives: ["O21"],
      scenario: "s3",
      question: "The synthesis subagent receives the outputs of twelve analysis runs, concatenated in the order they finished, about 60,000 tokens in total. Reviewers notice a pattern: findings from the first two and the last two runs almost always appear in the report, while important findings from runs five to eight are often missing, even when they are among the strongest results. What change would most improve how the middle findings are used?",
      options: [
        "Open the input with a short digest of each run's top results, and label each run's detailed block clearly.",
        "Shuffle the order of the twelve outputs on every run, so that no run is always in the middle position.",
        "Run two synthesis passes of six outputs each, and join the two resulting reports at the end of the run.",
        "Ask the analysis runs to write longer outputs, so that their findings carry more weight in the input."
      ],
      correct: [0],
      explanation: "Models reliably use information at the beginning and end of long inputs but tend to overlook material in the middle. A digest of the most important results at the start puts every run's key findings in a position that gets attention, and clear labels make the detailed blocks easier to locate. Shuffling only moves the losses around, and longer outputs make the input even longer.",
      optionExplanations: [
        "A digest of key results up front plus clear section labels counters the position effect for every run.",
        "Shuffling spreads the losses across runs but does not reduce them; some findings are still overlooked each time.",
        "Two passes shorten each input, but joining two separate reports loses the overall synthesis and needs another step to reconcile them.",
        "Longer outputs increase the total length, which makes findings in the middle even easier to overlook."
      ],
      source: source("5.1", "Placing key findings summaries at the beginning of aggregated inputs"),
      docs: [
        { label: "Claude API docs: Prompting best practices", url: "https://platform.claude.com/docs/en/build-with-claude/prompt-engineering/claude-prompting-best-practices.md", quote: "Place your long documents and inputs near the top of your prompt, above your query, instructions, and examples." },
        { label: "Claude API docs: Context windows", url: "https://platform.claude.com/docs/en/build-with-claude/context-windows.md", quote: "As token count grows, accuracy and recall degrade, a phenomenon known as context rot." }
      ]
    },
    {
      id: "core-d5-009",
      domain: "D5",
      scenario: "s1",
      question: "A customer named Anna Schmidt asks to change the delivery address of her latest order. get_customer, searched by name, returns three accounts. The agent picks the account with the most recent order and changes that address. Over the past month, 7 of 52 such changes were made on the wrong account, causing parcels to go to strangers. How should the agent handle a lookup that returns several matching customers?",
      options: [
        "Choose the account whose email domain matches the one the customer is writing from, and fall back to the most recent order if none matches.",
        "Escalate every conversation in which a name search returns more than one account to a human agent, without asking anything first.",
        "Show the customer the three accounts with their addresses and let them pick the one that belongs to them.",
        "Ask the customer for one more detail that tells the accounts apart, such as an order number or the postcode, before making any change."
      ],
      correct: [3],
      explanation: "Several matches mean the agent does not yet know which customer it is talking to, and any rule for picking one, however clever, will sometimes pick wrong. Asking the customer for an additional identifier, such as an order number or postcode, resolves the ambiguity with certainty before an irreversible change is made. Showing other customers' data or escalating every case would create new problems.",
      optionExplanations: [
        "A better heuristic reduces errors but still guesses, and a wrong guess sends a parcel to a stranger.",
        "Escalating every ambiguous match uses human time for a question the customer can answer in one message.",
        "Showing three accounts with their addresses discloses other customers' personal data to this customer.",
        "An additional identifier resolves the ambiguity reliably before the agent acts."
      ],
      source: source("5.2", "ask for additional identifiers when tool results return multiple matches"),
      docs: [
        { label: "Claude API docs: Prompting best practices", url: "https://platform.claude.com/docs/en/build-with-claude/prompt-engineering/claude-prompting-best-practices.md", quote: "for actions that are hard to reverse, affect shared systems, or could be destructive, ask the user before proceeding." }
      ]
    },
    {
      id: "core-d5-010",
      domain: "D5",
      objectives: ["O09"],
      scenario: "s3",
      question: "Your overnight research job runs a coordinator and up to twelve subagents for about six hours. Each subagent writes its full results to files and sends the coordinator only a short status. In one of eight runs, the host restarts during the night, and the whole job starts again from the beginning, so the report misses the morning deadline. Work packages take 20 to 40 minutes each and finish at different times. How should the system recover from such a crash?",
      options: [
        "Run the job on a more reliable host with automatic restarts, so that crashes become rare and the job is restarted immediately.",
        "Have each agent record its finished and in-progress work in a fixed place, and let the coordinator read these records after a restart and hand them on.",
        "Resume the coordinator's conversation with --resume after a restart, so that it continues from where its own session stopped.",
        "Split the job into six one-hour jobs that an operator starts one after another, so that a crash only loses one hour of work."
      ],
      correct: [1],
      explanation: "After a crash, the system has to know which packages are done, which were running, and where their results are. When every agent exports its state to a known location, the coordinator can read these records on restart, skip completed work, restart only what was interrupted, and give the agents the context they need. A more reliable host makes crashes rarer but still loses everything when one happens.",
      optionExplanations: [
        "Fewer crashes help, but an automatic restart still starts the whole job from scratch.",
        "Structured state records that the coordinator loads on restart let the job continue instead of starting over.",
        "The coordinator's conversation holds only short status messages, so it does not know which packages were in progress or where their partial results are.",
        "Manual chunking reduces the loss but needs an operator at night and still loses up to an hour of work per crash."
      ],
      source: source("5.4", "Designing crash recovery using structured agent state exports (manifests)"),
      docs: [
        { label: "Claude Code docs: Agent SDK sessions", url: "https://code.claude.com/docs/en/agent-sdk/sessions.md", quote: "Capture the results you need (analysis output, decisions, file diffs) as application state and pass them into a fresh session's prompt." },
        { label: "Claude API docs: Prompting best practices", url: "https://platform.claude.com/docs/en/build-with-claude/prompt-engineering/claude-prompting-best-practices.md", quote: "Use structured formats for state data: When tracking structured information (like test results or task status), use JSON or other structured formats" }
      ]
    },
    {
      id: "core-d5-011",
      domain: "D5",
      objectives: ["O19"],
      scenario: "s3",
      question: "During last night's research run on drug pricing policy, two of the five source databases were unreachable for most of the night. The finished report presents its conclusions with the same confidence as usual. A week later, the policy team found that it lacked evidence from both databases on the two topics they cover. The report must be ready each morning, whatever the state of the sources. What should change in the output?",
      options: [
        "Add a general note at the end of every report saying that some sources may occasionally be unavailable during a research run.",
        "List the unreachable databases in the operator's run log, so that the team can check which sources failed on any given night.",
        "Tone down the wording of every conclusion in the report whenever any source was unavailable at some point during the run.",
        "For each section, state which findings rest on solid evidence and which topics are thin because named sources could not be reached."
      ],
      correct: [3],
      explanation: "A report that hides its gaps looks complete and leads readers to trust conclusions that rest on partial evidence. Marking, per section, which findings are well supported and which topics lack evidence because particular sources were unavailable keeps the report on time while telling readers exactly where to be careful. A generic note, a log entry the readers never see, or uniformly cautious wording do not show where the gaps are.",
      optionExplanations: [
        "A generic disclaimer appears every day, so readers learn to ignore it, and it does not say which topics are affected.",
        "The run log records the failure, but the readers of the report never see it when they rely on the conclusions.",
        "Uniform caution weakens the well-supported conclusions too and still does not show which topics have gaps.",
        "Specific coverage notes show readers which conclusions are solid and where evidence is missing."
      ],
      source: source("5.3", "Structuring synthesis output with coverage annotations")
    },
    {
      id: "core-d5-012",
      domain: "D5",
      objectives: ["O22"],
      scenario: "s6",
      question: "Your invoice extraction outputs a confidence score per field, and every field below 0.8 goes to human review. An audit shows that for fields scored 0.9, the currency field is wrong 12% of the time while the invoice date is wrong only 1% of the time. Reviewers can check about 15% of all fields. You have 2,000 invoices whose fields were checked by hand, and the routing rules must be finalized before go-live next week. What should you do?",
      options: [
        "Use the 2,000 hand-checked invoices to set a separate confidence threshold for each field based on its observed accuracy.",
        "Raise the threshold for all fields from 0.8 to 0.95, so that more of the uncertain extractions go to human review.",
        "Keep the 0.8 threshold and set up stratified random sampling of high-confidence extractions to measure the error rate after go-live.",
        "Instruct the model to be more cautious when it assigns confidence scores, especially for currency fields in unusual formats."
      ],
      correct: [0],
      explanation: "The same confidence score means very different accuracy for different fields, so one global threshold sends too many date fields to review and lets too many wrong currencies through. Calibrating thresholds per field against the hand-checked invoices ties each score to measured accuracy. Ongoing stratified sampling is valuable after go-live, but the routing rules have to be right before that.",
      optionExplanations: [
        "Per-field thresholds calibrated on labeled data match routing to the actual reliability of each field.",
        "A higher global threshold catches more currency errors but floods reviewers with date fields that are almost always correct.",
        "Sampling after go-live is good monitoring, but it leaves the known currency problem in place for now.",
        "An instruction does not calibrate the scores; the model's self-reported confidence is not reliable without checking it against labeled data."
      ],
      source: source("5.5", "Field-level confidence scores calibrated using labeled validation sets")
    },
    {
      id: "core-d5-013",
      domain: "D5",
      objectives: ["O20"],
      scenario: "s4",
      question: "The main agent must find which of 30 large logs show a rare timeout problem without filling its context. Each service words it differently, so text search returns hundreds of unrelated lines. How should this step run?",
      options: [
        "Grep all logs for \"timeout\" and read the matching lines.",
        "Let a subagent read the logs and return the cases it finds.",
        "Run /compact after every fifth log file it reads.",
        "Read only the first 200 lines of each log file."
      ],
      correct: [1],
      explanation: "Finding a problem that each service words differently needs judgment, not just a text match, and that means reading a lot of verbose output the main agent does not need. A subagent can do this reading in its own context and return which logs show the problem and where, so the main agent keeps its context for the next steps. A plain search returns too much noise here, and compacting only reduces the damage afterwards.",
      optionExplanations: [
        "Grep is usually the right first step, but here the wording varies and the search returns hundreds of unrelated lines to read.",
        "A subagent isolates the verbose reading and returns only the findings the main agent needs.",
        "Compacting summarizes what was read but still fills the context first and may lose the exact cases.",
        "A rare problem may appear anywhere in a log, so reading only the beginning can miss it."
      ],
      source: source("5.4", "Subagent delegation for isolating verbose exploration output while the main agent coordinates high-level understanding")
    },
    {
      id: "core-d5-014",
      domain: "D5",
      objectives: ["O09"],
      scenario: "s3",
      question: "After a crash, your coordinator restarts a research job. The finished subagents' results are lost, because they existed only in those subagents' contexts. What design change fixes this?",
      options: [
        "Resume the coordinator's session transcript.",
        "Give the coordinator a larger context window.",
        "Log which subagents finished, without results.",
        "Have each agent save its state to a known place."
      ],
      correct: [3],
      explanation: "Work that lives only in an agent's context disappears with that context. When each agent exports its state and results to a known location, the coordinator can load them after a restart, skip finished work and pass the results on. Resuming the coordinator's transcript or logging only which subagents finished does not bring back the results themselves.",
      optionExplanations: [
        "The transcript holds the coordinator's conversation, not the results that lived in the subagents' contexts.",
        "A larger window holds more while running but is lost in a crash just the same.",
        "Knowing which subagents finished helps, but without their results the work still has to be redone.",
        "Exported state in a known place survives the crash and lets the coordinator resume."
      ],
      source: source("5.4", "Structured state persistence for crash recovery: each agent exports state to a known location, and the coordinator loads a manifest on resume")
    },
    {
      id: "core-d5-015",
      domain: "D5",
      objectives: ["O18"],
      scenario: "s3",
      question: "Readers of your market research reports say they cannot compare the numbers or follow the news section. The synthesis subagent writes every section as dense bullet lists: quarterly revenue for eight competitors becomes 32 separate bullets, and the news section becomes one-line fragments without context. The underlying data is correct in every report. How should the synthesis output change?",
      options: [
        "Switch every section from bullet lists to flowing prose, so that the whole report reads in one consistent and connected style.",
        "Keep the bullets, but add an appendix at the end of each report that repeats all numbers from the report in one long list.",
        "Choose the layout of each section by how readers use it, for example a comparison grid for competitor figures and short paragraphs for news.",
        "Keep the bullets, but sort them within each section so that the most important items appear first and less relevant ones at the end."
      ],
      correct: [2],
      explanation: "Different content needs different forms: comparing eight competitors across quarters is easiest in a table, news needs a few connected sentences of context, and technical findings often work best as a structured list. Forcing every section into one format, whether bullets or prose, makes some sections hard to use. Choosing the layout per section by how readers use it keeps the correct data and makes it usable.",
      optionExplanations: [
        "One format for everything just moves the problem; competitor figures are just as hard to compare in prose.",
        "An appendix repeats the numbers without making the comparison easier where readers need it.",
        "Matching the layout to how each kind of content is used makes every section easy to read and compare.",
        "Sorting helps readers find important items but keeps the figures hard to compare and the news without context."
      ],
      source: source("5.6", "Rendering different content types appropriately in synthesis outputs")
    },
    {
      id: "core-d5-016",
      domain: "D5",
      objectives: ["O18"],
      scenario: "s3",
      question: "Your analysis subagents return each finding as a record with a claim, an excerpt and its source. Fact checkers still cannot trace 25% of the statements in the final reports back to any source. The traces show that the synthesis subagent merges and rewords claims from several records into new sentences and keeps only a general reference list at the end. How should synthesis change?",
      options: [
        "Ask the analysis subagents to include longer excerpts, so that the synthesis subagent has more context for every claim it rewrites.",
        "Have the synthesis subagent carry each claim's source references into every sentence it writes, citing all sources a merged statement rests on.",
        "Have the synthesis subagent copy the analysis records into the report unchanged, so that no source link can ever be lost.",
        "Add a final fact-checking subagent that searches the web for a source for every statement the report makes."
      ],
      correct: [1],
      explanation: "The mapping from claims to sources exists in the analysis output, but it is lost in the synthesis step, where claims are merged and rewritten. Requiring the synthesis to carry those links through every merge, so that each statement cites the sources it rests on, keeps provenance intact while still allowing a readable synthesis. Searching for sources afterwards may find different ones than the claims actually came from.",
      optionExplanations: [
        "Longer excerpts do not help if the synthesis drops the link between a statement and its source.",
        "Preserving and merging claim-source mappings keeps every statement traceable after synthesis.",
        "Copying records unchanged keeps the links but gives up the synthesis the report exists for.",
        "Searching for sources afterwards may attach the wrong ones and does not restore the original provenance."
      ],
      source: source("5.6", "The importance of structured claim-source mappings that the synthesis agent must preserve and merge when combining findings")
    },
    {
      id: "core-d5-017",
      domain: "D5",
      objectives: ["O21"],
      scenario: "s1",
      question: "Customers often raise several issues in one chat, for example a refund, an address change and a missing item. In conversations with three or more issues, the agent applies the refund amount of one order to another, or reports an issue as resolved that is still open, in 14% of cases. The full history is sent with every request and stays below a third of the context window. All issues must still be handled in one conversation. What should you change?",
      options: [
        "Summarize each issue into a short paragraph once it is resolved, so that the conversation the agent works with becomes shorter and clearer.",
        "Add a system prompt instruction that tells the agent to double-check the order number and amount before it processes any refund.",
        "Keep a record per issue with the order, the agreed sum and its current state, update it after each tool result, and send it with every request.",
        "Ask customers to open a separate conversation for each further issue, so that every conversation only ever deals with one order."
      ],
      correct: [2],
      explanation: "The context is not full, so the errors come from details of several issues mixed together in free-flowing text. A structured record per issue, kept current after each tool result and sent with every request, gives the agent one reliable place for each order's amount and status. Summaries make the details vaguer, a reminder to double-check does not tell the agent where the right values are, and separate chats break the requirement.",
      optionExplanations: [
        "Summaries condense the amounts and statuses that the agent is mixing up, which makes the problem worse.",
        "A reminder may help sometimes, but the agent still has to find the right values in mixed free text.",
        "Separate, structured issue data keeps each order's facts distinct and current throughout the session.",
        "Separate conversations violate the requirement to handle all issues in one conversation."
      ],
      source: source("5.1", "Extracting and persisting structured issue data (order IDs, amounts, statuses) into a separate context layer for multi-issue sessions")
    },
    {
      id: "core-d5-018",
      domain: "D5",
      objectives: ["O21"],
      scenario: "s4",
      question: "Your dependency audit agent calls get_package_info for each of 300 packages. Every result has about 60 fields, around 2,000 tokens, including download statistics, maintainer lists and the full README; the audit needs only the license, the latest version and known vulnerabilities. After about 80 packages, the context fills up, and the final report misses or misstates packages from early in the run. The team wants to keep the single-agent loop. What is the most effective fix?",
      options: [
        "Reduce each get_package_info result to the license, latest version and vulnerability fields before it is added to the conversation.",
        "Trigger compaction earlier and more often, so that older package results are summarized before the context window fills up.",
        "Distribute the 300 packages across ten subagents, so that each one only has to keep about 30 package results in its context.",
        "Instruct the agent in its system prompt to ignore all fields in package results that are not relevant to the audit."
      ],
      correct: [0],
      explanation: "Each result spends most of its tokens on fields the audit never uses, so the context fills with noise long before the work is done. Keeping only the three relevant fields before the result enters the conversation cuts the per-package cost to a small fraction, leaving room for all 300 packages. Compaction summarizes away exact versions and licenses, an instruction to ignore fields does not remove their tokens, and subagents change the architecture the team wants to keep.",
      optionExplanations: [
        "Trimming results to the relevant fields stops irrelevant data from accumulating in context.",
        "Summaries of older results lose the exact licenses and versions the report needs.",
        "Subagents would spread the load, but the team wants to keep the single-agent loop.",
        "Ignored fields still occupy the context; the instruction does not remove them."
      ],
      source: source("5.1", "Trimming verbose tool outputs to only relevant fields before they accumulate in context (e.g., keeping only return-relevant fields from order lookups)")
    },
    {
      id: "core-d5-019",
      domain: "D5",
      objectives: [],
      scenario: "s3",
      question: "Two recent research reports state that no relevant patents exist for their topic. A check shows that the patent database was timing out during both runs. In the traces, the patent search subagent returns the same success response with an empty result list after a timeout as after a search that completed without matches. How should the subagent report its outcomes?",
      options: [
        "Retry timeouts briefly; if they persist, return an error naming the failure and the query, and keep empty success for completed searches.",
        "Treat every empty result list as a possible failure, so that the coordinator repeats each search that returned no patents before it accepts the outcome.",
        "Have the subagent return whatever pages of results arrived before a timeout, so that the coordinator sees at least some patents.",
        "Have the subagent attach a confidence score to each result list, so that the coordinator can give less weight to empty lists."
      ],
      correct: [0],
      explanation: "A timeout and a search without matches mean different things: one says nothing about the topic, the other is a real finding. Reporting both as an empty success hides the failure, so the coordinator writes a false conclusion. The subagent should recover locally where it can and otherwise report the failure with its context, while empty results stay a valid answer. Partial pages or a confidence score still leave the coordinator unable to tell a failure from a real answer.",
      optionExplanations: [
        "Local retries plus a structured error that is clearly separate from a valid empty result let the coordinator decide correctly.",
        "Repeating every empty search wastes calls, because no matches is often a valid result.",
        "Partial pages help when some arrived, but an empty timeout still looks exactly like a search without matches.",
        "A score turns a known fact, the search failed, into a vague probability the coordinator has to interpret."
      ],
      source: source("5.3", "Distinguishing access failures from valid empty results in error reporting so the coordinator can make appropriate decisions")
    },
    {
      id: "core-d5-020",
      domain: "D5",
      objectives: [],
      scenario: "s3",
      question: "Your research pipeline stops the whole run, often after two hours of work, whenever any subagent reports an error it could not resolve. One run in five ends this way, and in almost all of them only one of eight subtopics was affected while the others had finished. Readers must be able to see which parts of a report rest on incomplete sources. How should such failures be handled?",
      options: [
        "Restart the whole run automatically after a failure, up to three times, so that a complete report is produced in most cases.",
        "Continue the run, pass on the failing subagent's error details and partial results, and mark that subtopic as a gap in the report.",
        "Continue the run and leave failed subtopics out of the report, so that only findings from complete sources are published.",
        "Delegate every subtopic to two subagents in parallel, so that a single failing subagent never leaves a subtopic uncovered."
      ],
      correct: [1],
      explanation: "Ending the whole run because one subtopic failed throws away seven finished subtopics, but hiding the failure would mislead readers. Continuing, with the failing subagent passing on structured context and partial results, keeps the completed work and lets the report state openly where coverage is incomplete. Restarts repeat two hours of work for one failure, and doubling every subagent doubles the cost for a rare problem.",
      optionExplanations: [
        "Restarting repeats all finished work and can fail again for the same reason.",
        "Continuing with structured error context and a visible gap keeps the work and tells readers what is missing.",
        "Silently dropping the subtopic hides the gap, which readers must be able to see.",
        "Redundant subagents double the cost for every subtopic, and both can fail for the same cause."
      ],
      source: source("5.3", "Why silently suppressing errors (returning empty results as success) or terminating entire workflows on single failures are both anti-patterns")
    },
    {
      id: "core-d5-021",
      domain: "D5",
      objectives: ["O22"],
      scenario: "s6",
      question: "For three months, invoice extractions with confidence of at least 0.95, about 70% of volume, have skipped human review. To monitor them, a reviewer checks the first 50 high-confidence invoices processed each Monday, and the measured error rate has stayed at 1%. A downstream audit now finds that since one supplier changed its invoice layout six weeks ago, 9% of its due dates are wrong. Most of its invoices arrive late in the week. How should monitoring change?",
      options: [
        "Raise the threshold for skipping review from 0.95 to 0.98, so that fewer extractions go to downstream systems without a human check.",
        "Each week, review a random sample of high-confidence extractions drawn across all days, suppliers and document types, with a minimum per group.",
        "Review all high-confidence extractions from newly onboarded suppliers during their first month, since new layouts cause most errors.",
        "Increase the Monday sample from 50 to 500 invoices, so that the measured error rate becomes more precise and stable."
      ],
      correct: [1],
      explanation: "The Monday sample is not random: it sees the same kind of invoices every week and never the late-week ones, so a new error pattern stays invisible. Sampling randomly across the whole week and across every supplier and document type measures each group and catches new patterns early. A larger Monday sample repeats the same bias, and checking only new suppliers misses layout changes from existing ones.",
      optionExplanations: [
        "A higher threshold reduces automation but still gives no measurement that would detect new error patterns.",
        "Random samples per supplier and document type measure every group and reveal new error patterns.",
        "The layout change came from an existing supplier, which onboarding checks would not cover.",
        "A larger sample from the same biased slot gives a more precise estimate of the wrong population."
      ],
      source: source("5.5", "Implementing stratified random sampling of high-confidence extractions for ongoing error rate measurement and novel pattern detection")
    },
    {
      id: "core-d5-022",
      domain: "D5",
      objectives: ["O22"],
      scenario: "s6",
      question: "Reviewers can check 200 of the 2,000 daily extractions; the rest go straight to the ERP. Error rates are measured separately. To stop the most wrong extractions, which should reviewers get?",
      options: [
        "A random 10% of all extractions, for an unbiased view.",
        "The 200 documents from the largest customers each day.",
        "The first 200 documents that are processed each morning.",
        "Those whose fields scored below threshold or whose pages disagree."
      ],
      correct: [3],
      explanation: "When review capacity is limited, it should go where errors are most likely: fields the model is unsure about and documents whose sources contradict themselves. A random sample is useful for measuring error rates, but as the only review it spends most of the capacity on documents that were extracted correctly. Customer size and processing order say nothing about extraction risk.",
      optionExplanations: [
        "Random sampling measures quality but does not direct review to the riskiest documents.",
        "Customer size does not indicate which extractions are likely wrong.",
        "Processing order has no relation to extraction quality.",
        "Low confidence and contradictory sources are the strongest signals that a human check is needed."
      ],
      source: source("5.5", "Routing extractions with low model confidence or ambiguous/contradictory source documents to human review, prioritizing limited reviewer capacity")
    },
    {
      id: "core-d5-023",
      domain: "D5",
      objectives: [],
      scenario: "s1",
      question: "A customer writes: \"Third late delivery this month. This is ridiculous!\" Policy lets the agent reship or refund the shipping fee for late orders, and the customer has not asked for a person. What should the agent do first?",
      options: [
        "Transfer the customer to a human, given the strong frustration.",
        "Acknowledge the frustration and offer the remedy the policy allows.",
        "Apply the shipping refund at once without replying to the complaint.",
        "Apologize for the carrier's delays and wait for a remedy request."
      ],
      correct: [1],
      explanation: "Frustration alone is not a reason to escalate when the issue is within the agent's policy and the customer has not asked for a person. Acknowledging the frustration and offering the remedy resolves the case directly; if the customer then repeats that they want a human, the agent escalates. Frustration is a poor proxy for whether a case needs a human, and ignoring the complaint makes a fixable situation worse.",
      optionExplanations: [
        "Escalating a case the agent can resolve wastes human capacity and delays the customer.",
        "Acknowledging the frustration and offering the allowed remedy resolves the case where it should be resolved.",
        "Acting without acknowledging the complaint fixes the order but ignores the customer.",
        "An apology without an offer leaves the customer to ask for what the agent could simply provide."
      ],
      source: source("5.2", "Acknowledging frustration while offering resolution when the issue is within the agent's capability, escalating only if the customer reiterates their preference")
    },
    {
      id: "core-d5-024",
      domain: "D5",
      objectives: [],
      scenario: "s1",
      question: "A customer's refund for a returned laptop is stuck. process_refund returns \"refund already in progress\", but the payment service shows no pending refund, and the order system marks the return as received 19 days ago. The agent has retried twice and checked both systems again. Policy covers refunds but says nothing about records that disagree. The customer is calm and has not asked for a person. What should the agent do?",
      options: [
        "Keep retrying process_refund at intervals during the conversation, since the conflict between the systems may resolve itself.",
        "Tell the customer that the refund is in progress, since that is the status the refund tool reports, and close the case.",
        "Escalate to a human with a summary of the conflicting records and the steps already taken, since the records still conflict after repeated checks.",
        "Issue store credit for the laptop's value instead, since that settles the customer's claim without involving the payment service."
      ],
      correct: [2],
      explanation: "The agent has used the tools it has, the systems contradict each other, and the policy does not say how to handle that. When an agent cannot make meaningful progress, escalation is the right step even without a request from the customer, and a summary of the conflicting records spares the human from starting over. More retries repeat what already failed, the reported status is contradicted by the payment service, and store credit goes beyond what the policy covers.",
      optionExplanations: [
        "Further retries repeat a step that has already failed twice without new information.",
        "The reported status is contradicted by the payment service, so passing it on may mislead the customer.",
        "No further progress and a policy gap are both triggers for escalation with a structured summary.",
        "Store credit is an exception the policy does not cover, which the agent should not decide alone."
      ],
      source: source("5.2", "Appropriate escalation triggers: customer requests for a human, policy exceptions/gaps (not just complex cases), and inability to make meaningful progress")
    },
    {
      id: "core-d5-025",
      domain: "D5",
      objectives: ["O19"],
      scenario: "s3",
      question: "Your document analysis subagent reads two credible reports on youth unemployment in one country for the same year: the national statistics office reports 24.8%, an international agency 26.9%, using a different age band and survey method. The subagent currently keeps the figure from the source with the larger sample and drops the other. Editors then found reports stating one figure while their cited sources said otherwise. How should the subagent handle such cases?",
      options: [
        "Return the average of both figures with both sources cited, so that the synthesis has one value that reflects both reports.",
        "Keep the figure with the larger sample as the main value and mention the other one in a short note without its method.",
        "Leave out figures on which the sources disagree, so that reports only contain statistics that all sources confirm.",
        "Return both figures with their sources and methods, mark them as conflicting, and let the coordinator decide how to reconcile them."
      ],
      correct: [3],
      explanation: "Both figures are credible, and the difference comes from definitions, so choosing one silently loses information and misrepresents the sources. Passing both values on with their source and method, flagged as a conflict, lets the coordinator decide how to present them, for example side by side with an explanation. An average is a number no source reports, and dropping disputed statistics removes relevant findings.",
      optionExplanations: [
        "An average creates a figure that no source states.",
        "A note without the method still presents one figure as the answer and hides why they differ.",
        "Omitting disputed figures loses findings that readers need.",
        "Both figures with attribution and an explicit conflict flag preserve the evidence for the coordinator's decision."
      ],
      source: source("5.6", "Completing document analysis with conflicting values included and explicitly annotated, letting the coordinator decide how to reconcile before passing to synthesis")
    },
    {
      id: "core-d5-026",
      domain: "D5",
      objectives: ["O20"],
      scenario: "s4",
      question: "Your agent analyses a legacy billing system in two phases: first it maps the modules and data flows, then it spawns subagents to write migration notes for each of the 17 modules. Each subagent receives the instruction \"Write migration notes for module X.\" Their notes contradict the mapping phase, for example three describe a shared tax module as unused, and several re-explore code the mapping already covered, adding 40 minutes per run. What should you change?",
      options: [
        "Write the mapping results each module depends on, such as shared components, into each subagent's task.",
        "Pass each subagent the full transcript of the mapping phase, so that it has every detail the main agent saw while mapping.",
        "Run the subagents one after another, each reading the notes written by the previous subagents before it starts its own module.",
        "Drop the mapping phase and let each subagent explore the whole system by itself before it writes the notes for its module."
      ],
      correct: [0],
      explanation: "Subagents start with a fresh context and know only what their prompt tells them, so the mapping results never reach them. A concise summary of the key findings, injected into each subagent's first prompt, gives every module the shared picture without re-exploration. The full transcript would flood each subagent with verbose output, sequential runs are slow and still lack the map, and dropping the mapping multiplies the exploration.",
      optionExplanations: [
        "A summary of earlier findings in each subagent's prompt passes on the shared picture compactly.",
        "The full transcript fills each subagent's context with verbose exploration output.",
        "Running in sequence is slower and passes on notes rather than the mapping results.",
        "Each subagent would repeat the whole exploration, which multiplies the time spent."
      ],
      source: source("5.4", "Summarizing key findings from one exploration phase before spawning sub-agents for the next phase, injecting summaries into initial context"),
      docs: [
        { label: "Agent SDK docs: Subagents", url: "https://code.claude.com/docs/en/agent-sdk/subagents.md", quote: "The only content you pass from parent to subagent is the Agent tool's prompt string" }
      ]
    },
    {
      id: "core-d5-027",
      domain: "D5",
      objectives: ["O09"],
      scenario: "s3",
      question: "After a crash, your research job resumes from a manifest kept by the coordinator. While they work, subagents append their findings to one shared findings.jsonl, and the manifest marks a subtopic as done only when its subagent finishes. After a resumption, the reports list 10 to 20% of findings twice, and a few contain half-written records. What design change fixes this?",
      options: [
        "Have each subagent keep its state in its own file per subtopic, writing a complete new copy and swapping it in on every save, with the manifest pointing to these files.",
        "Remove duplicate lines from findings.jsonl by exact text before synthesis, and skip any line that cannot be parsed as JSON.",
        "Have the coordinator take over the subtopics that were in progress at the crash and finish them itself, using the shared findings file as input.",
        "Restart the whole job from scratch after any crash, so that the shared file is always written by one complete run."
      ],
      correct: [0],
      explanation: "Restarted subagents append their findings a second time to a file that already holds the first attempt, and a crash mid-write leaves a broken line. If every agent keeps its own state file and swaps in a complete new copy on each save (general knowledge: this avoids half-written files), a restart simply replaces the earlier state, and the coordinator loads exactly one version per subtopic through the manifest. Deduplicating by text misses reworded repeats, having the coordinator finish the work still builds on the corrupted shared file, and a full restart repeats hours of finished work.",
      optionExplanations: [
        "Per-agent state files that are replaced as a whole make resumption repeatable without duplicates or broken records.",
        "Exact-text deduplication misses findings that were worded differently on the second attempt.",
        "The coordinator still reads the shared file with its duplicates and broken lines, and takes on work that belongs to subagents.",
        "A full restart repeats all completed work, which resumption is meant to avoid."
      ],
      source: source("5.4", "Structured state persistence for crash recovery: each agent exports state to a known location, and the coordinator loads a manifest on resume")
    },
    {
      id: "core-d5-028",
      domain: "D5",
      objectives: ["O19"],
      scenario: "s3",
      question: "Your analysis subagents record each claim together with the source's own wording, such as \"a pilot with 40 participants suggests\" or \"a meta-analysis of 60 trials found\". In the final reports, both become \"research shows\". Readers complain that weak findings are presented as settled, although the analysis records themselves are accurate. What should change?",
      options: [
        "Have the synthesis leave out findings from small studies, so that the report only contains claims backed by robust evidence.",
        "Have the synthesis add a closing disclaimer to each report saying that the strength of the evidence varies between findings.",
        "Have the synthesis carry each claim's original wording on study size and design into the report, grouping strong and preliminary evidence separately.",
        "Ask the synthesis subagent to add a confidence percentage to every claim, based on its own judgment of the evidence."
      ],
      correct: [2],
      explanation: "The analysis preserved how strong each finding is, but the synthesis flattens every claim into the same confident phrase. Keeping the original characterizations and separating established from tentative findings lets readers see how much each statement rests on. Dropping small studies loses relevant evidence, a general disclaimer does not say which findings are weak, and a self-assigned percentage replaces the sources' own descriptions with the model's guess.",
      optionExplanations: [
        "Dropping small studies removes findings readers may still need, labeled for what they are.",
        "A blanket disclaimer does not show which claims are weak.",
        "Preserving the sources' characterizations and separating established from tentative findings keeps the uncertainty visible.",
        "A self-assigned percentage substitutes the model's judgment for what the sources actually say."
      ],
      source: source("5.6", "Structuring reports with explicit sections distinguishing well-established findings from contested ones, preserving original source characterizations and methodological context")
    },
    {
      id: "core-d5-029",
      domain: "D5",
      objectives: [],
      scenario: "s1",
      question: "Your policy covers refunds for items that arrived damaged, if reported within 30 days of delivery, and lets the agent change the email address on an account. It says nothing about payment plans or compensation for lost time. A calm customer who has not asked for a person raises five requests in one message. Which two should the agent resolve on its own? (Select 2)",
      options: [
        "A refund for a mug that arrived broken 12 days ago, with a photo of the damage attached.",
        "Splitting the payment for a $900 order into three monthly instalments.",
        "Changing the email address on the customer's account to a new one.",
        "A refund for a lamp that arrived damaged 45 days ago; the customer asks for an exception because they were abroad.",
        "Compensation for a day off work spent waiting for a courier who never came."
      ],
      correct: [0, 2],
      explanation: "The agent resolves what the policy clearly covers: an item that arrived damaged within 30 days, and an email change it is allowed to make. A payment plan and compensation for lost time are not addressed by the policy, and the late refund is an explicit request for an exception to the 30-day rule; all three go to a human. Handling the covered parts and escalating only the rest serves the customer quickly without the agent inventing policy.",
      optionExplanations: [
        "An item that arrived damaged, reported within 30 days, is exactly what the policy covers.",
        "The policy says nothing about payment plans, so this part needs a human.",
        "The policy explicitly lets the agent change the account email.",
        "The customer asks for an exception to the 30-day rule, which the agent should not grant on its own.",
        "Compensation for lost time is not addressed by the policy."
      ],
      source: source("5.2", "Appropriate escalation triggers: customer requests for a human, policy exceptions/gaps (not just complex cases), and inability to make meaningful progress")
    },
    {
      id: "core-d5-030",
      domain: "D5",
      objectives: ["O21"],
      scenario: "s1",
      question: "Long support conversations show two problems. After the history is summarized at turn 20, the agent forgets amounts it agreed with the customer earlier, such as a $37.50 partial refund. And the context fills up after about 25 turns; traces show it growing by about 4,000 tokens with each lookup_order result, while the agent's replies only ever mention an order's status, amount and date. Which two changes address these problems most directly? (Select 2)",
      options: [
        "Store the agreed amounts and order details in a block that is resent with every request and never summarized.",
        "Summarize the history more often, every 10 turns instead of every 20, so that the context never gets close to its limit.",
        "Reduce each lookup_order result to the fields the agent actually uses before it is added to the conversation.",
        "Have a second model call summarize each lookup_order result in a few sentences before it is added to the conversation.",
        "Switch to a model version with a larger context window, so that summarization is needed later in the conversation."
      ],
      correct: [0, 2],
      explanation: "Each problem has its own cause. Summaries blur exact amounts, so facts the agent must keep belong in a block that is never summarized and travels with every request. The context fills up because verbose tool results pile up, so trimming them to the needed fields before they enter the conversation removes most of the growth. Summarizing more often loses even more detail, a larger window only delays both problems, and summarizing each result with another model call adds cost and can lose exact values that simple field filtering keeps.",
      optionExplanations: [
        "A persistent case-facts block keeps exact amounts out of the lossy summary.",
        "More frequent summaries condense the agreed amounts even sooner.",
        "Trimming tool results removes the main source of context growth.",
        "A summary saves tokens but costs an extra call per lookup and may drop the exact values the agent needs.",
        "A larger window postpones the problems but leaves both causes in place."
      ],
      source: source("5.1", "Extracting transactional facts (amounts, dates, order numbers, statuses) into a persistent \"case facts\" block included in each prompt, outside summarized history")
    },
    {
      id: "core-d5-031",
      domain: "D5",
      objectives: ["O20"],
      scenario: "s4",
      question: "An engineer is investigating a legacy pricing engine with your agent over three days, starting a new session each morning. Each morning the agent spends about 40 minutes re-reading the same 30 files to rebuild what it learned the day before. Within a day the context holds up fine. The repository receives about 50 commits a day, some in the pricing engine, and the solution must not depend on a manual step at the end of each day. What is the best way to carry the understanding from one day to the next?",
      options: [
        "Have the agent keep a scratchpad file of key findings, read it each morning, and re-check the files changed since.",
        "Resume the previous day's session each morning, so that everything the agent read and concluded is available again immediately.",
        "Delegate each morning's re-reading to an Explore subagent, so that the 30 files no longer fill the main session's context.",
        "Each evening, run /compact with an instruction to keep the key findings, and paste the result into the next morning's first message."
      ],
      correct: [0],
      explanation: "The problem is not context size within a day but knowledge lost between sessions. A scratchpad of key findings, read at the start of each session, carries that knowledge forward, and checking only the files that changed since keeps it current despite the daily commits. Resuming brings back tool results that may be stale after 50 commits, an Explore subagent still repeats the 40-minute reading, and a focused /compact still depends on someone running it and carrying the summary over each evening.",
      optionExplanations: [
        "A scratchpad of findings plus targeted re-checks carries knowledge across sessions and handles the daily changes.",
        "Resuming restores tool results that the daily commits may have made stale, and nothing in this option re-checks the changed files.",
        "A subagent protects the main context but still re-reads everything each morning.",
        "A focused /compact can keep findings, but it is a manual step each evening, which the team rules out."
      ],
      source: source("5.4", "Having agents maintain scratchpad files recording key findings, referencing them for subsequent questions to counteract context degradation")
    },
    {
      id: "core-d5-032",
      domain: "D5",
      objectives: ["O22"],
      scenario: "s6",
      question: "Your invoice extraction reaches 95.8% overall accuracy on a validation set, and management wants to stop human review for extractions the model marks as high-confidence. Which two steps should come before human review is reduced? (Select 2)",
      options: [
        "Accept the 95.8% overall figure as proof of quality, since it is well above the agreed 90% target.",
        "Check the error rate for each kind of invoice and each extracted field on its own, against the same target.",
        "Route extractions to review by the confidence scores the model reports, without checking them against labeled data.",
        "Plan ongoing random sampling of high-confidence extractions, drawn from every document type, to catch new error patterns.",
        "Replace human review with a second model that re-extracts every document and flags disagreements."
      ],
      correct: [1, 3],
      explanation: "An overall figure can hide segments that perform badly, so accuracy must be checked per document type and field before review is reduced. After that, ongoing sampling of high-confidence extractions across all types keeps measuring error rates and reveals new patterns. Uncalibrated confidence scores are not a reliable guide, and a second model adds cost without the independent check that sampling against human judgment provides.",
      optionExplanations: [
        "An overall figure can mask document types or fields that fall below the target.",
        "Per-segment accuracy shows whether every type and field meets the target.",
        "Confidence scores need calibration on labeled data before they can route review.",
        "Ongoing stratified sampling catches errors and new patterns after automation starts.",
        "A second model shares many blind spots and does not replace measured human review."
      ],
      source: source("5.5", "The importance of validating accuracy by document type and field segment before automating high-confidence extractions")
    },
    {
      id: "core-d5-033",
      domain: "D5",
      objectives: ["O19"],
      scenario: "s3",
      question: "During last night's research run, one of three statistics databases was unreachable, and two credible sources reported different average rents for the same city and year because one covers the city alone and the other the whole metropolitan area. Which two things should the synthesized report do? (Select 2)",
      options: [
        "State which topics rest on fewer sources than planned because one database was unreachable.",
        "Report only the more recent of the two rent figures, since newer data is usually more reliable.",
        "Leave out every section that relied on the unreachable database, so that readers see only complete findings.",
        "Present both rent figures with their sources and area definitions, marked as a conflict.",
        "Report the topics that depended on the unreachable database as \"no relevant data found\"."
      ],
      correct: [0, 3],
      explanation: "Readers need to see both kinds of uncertainty. Coverage notes show which topics have thinner evidence because a source was unavailable, and conflicting figures stay visible with their sources and definitions instead of being reduced to one value. Picking the newer figure hides a real difference in definitions, dropping sections removes findings that are still partly supported, and reporting \"no relevant data\" turns an access failure into a false finding.",
      optionExplanations: [
        "Coverage notes tell readers where the evidence is thinner than planned.",
        "Choosing one figure hides that the sources measure different things.",
        "Dropping sections loses findings that other sources still support.",
        "Both figures with attribution and definitions keep the conflict visible.",
        "An unreachable source is not an empty result; this misstates what happened."
      ],
      source: source("5.6", "How to handle conflicting statistics from credible sources: annotating conflicts with source attribution rather than arbitrarily selecting one value")
    }
  ]);
})();
