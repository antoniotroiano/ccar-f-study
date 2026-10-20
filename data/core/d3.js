/* Domain 3: Claude Code Configuration & Workflows (Exam Guide weight 20%) */
(function () {
  const source = window.CORE_CATALOG.examGuideSource;

  window.CORE_CATALOG.addQuestions([
    {
      id: "core-d3-001",
      domain: "D3",
      objectives: ["O16"],
      scenario: "s2",
      question: "Your team's coding standards for naming, error handling and test layout were set up by the tech lead two months ago, and Claude Code has followed them consistently for the tech lead ever since. A developer who joined last week cloned the same repository, uses the same Claude Code version, and reports that Claude ignores the standards entirely. The repository contains no CLAUDE.md files. What is the most likely cause, and how do you fix it?",
      options: [
        "Claude Code has not indexed the new clone yet; the developer should run /memory once in the repository so that the project's memory files are loaded.",
        "The standards are in the tech lead's user-level ~/.claude/CLAUDE.md; move them into a CLAUDE.md at the project root and commit it.",
        "The standards are in a path-scoped rule whose glob does not match the new developer's files; widen the rule's paths pattern to \"**/*\".",
        "The new developer's own ~/.claude/CLAUDE.md overrides the team configuration; delete that file so that the team's standards take effect."
      ],
      correct: [1],
      explanation: "The clue is that only the tech lead gets the standards, although both developers use the same repository and version. Claude Code loads CLAUDE.md files at several levels: user, project and directory. The user-level file ~/.claude/CLAUDE.md exists only on one machine and is never shared through version control. Moving the standards into a CLAUDE.md at the project root and committing it makes them available to every developer who clones the repository.",
      optionExplanations: [
        "/memory shows the memory files that apply here; it cannot load a file that only exists on another machine. (Current docs: /memory lists and opens memory files, /context shows what actually loaded.)",
        "User-level instructions are not shared through version control; a committed project-level CLAUDE.md reaches every team member.",
        "A rule file committed in the repository would apply to both developers in the same way, so it cannot explain why only one of them sees the standards.",
        "There is no team configuration in the repository to override; the standards exist only on the tech lead's machine."
      ],
      source: source("3.1", "instructions in ~/.claude/CLAUDE.md are not shared with teammates via version control"),
      docs: [
        { label: "Claude Code docs: Memory", url: "https://code.claude.com/docs/en/memory.md", quote: "User instructions | ~/.claude/CLAUDE.md | Personal preferences for all projects | Code styling preferences, personal tooling shortcuts | Only you (all projects)" },
        { label: "Claude Code docs: Memory", url: "https://code.claude.com/docs/en/memory.md", quote: "Project architecture, coding standards, common workflows | Team members via source control" }
      ]
    },
    {
      id: "core-d3-002",
      domain: "D3",
      objectives: ["O16"],
      scenario: "s2",
      question: "To keep context small, you moved the Terraform conventions out of the root CLAUDE.md into .claude/rules/terraform.md with the frontmatter paths: [\"terraform/*\"]. When you edit terraform/main.tf, Claude follows the conventions. When you edit terraform/modules/network/vpc.tf or terraform/envs/prod/backend.tf, it does not. The conventions should load automatically, but only for Terraform files. What should you change?",
      options: [
        "Move the Terraform conventions back into the root CLAUDE.md, so that they are loaded in every session regardless of the file being edited.",
        "Change the pattern to \"terraform/**/*\", so that the rule also covers the nested directories below terraform/.",
        "Add a CLAUDE.md to terraform/modules/network/ that imports terraform.md with @import, so that the network module picks up the conventions.",
        "Run /memory before editing Terraform files, so that Claude Code reloads all rule files and applies the conventions to the session."
      ],
      correct: [1],
      explanation: "Path-scoped rules in .claude/rules/ load only when the edited file matches a glob pattern in the paths frontmatter, which is why the Terraform conventions no longer cost context elsewhere. The pattern terraform/* matches only files directly inside terraform/. Changing it to terraform/**/*, as in the guide's example, also matches nested directories such as modules/network and envs/prod, while the rule still stays out of non-Terraform work. The Claude Code docs' pattern table shows the same difference: src/**/* matches all files under src/, while a single * stays in one directory.",
      optionExplanations: [
        "The root CLAUDE.md is always loaded, which brings back the irrelevant context you wanted to remove for non-Terraform work.",
        "Under standard glob semantics a single * matches only files directly in terraform/, while ** also matches nested directories; the guide's example uses terraform/**/*.",
        "This fixes only one directory; terraform/envs/prod and every future module would still miss the conventions.",
        "/memory lets you check which memory files are loaded, but it does not change which files a glob pattern matches."
      ],
      source: source("3.3", "Creating .claude/rules/ files with YAML frontmatter path scoping (e.g., paths: [\"terraform/**/*\"])"),
      docs: [
        { label: "Claude Code docs: Memory", url: "https://code.claude.com/docs/en/memory.md", quote: "Rules can be scoped to specific files using YAML frontmatter with the paths field. These conditional rules only apply when Claude is working with files matching the specified patterns." },
        { label: "Claude Code docs: Memory", url: "https://code.claude.com/docs/en/memory.md", quote: "Use glob patterns in the paths field to match files by extension, directory, or any combination:" }
      ]
    },
    {
      id: "core-d3-003",
      domain: "D3",
      objectives: ["O13"],
      scenario: "s5",
      question: "Claude Code already reviews every pull request in your CI pipeline in non-interactive mode and writes its findings as free text into the job log. The team now wants two improvements: findings should appear automatically as inline comments on the changed lines, and when developers push follow-up commits, the review should not post the same comments again. Which TWO changes achieve this? (Select 2)",
      options: [
        "Ask Claude in the prompt to format each finding as a Markdown table row with file, line and comment, and parse that table in the pipeline.",
        "Have the CLI return its findings as JSON that is validated against a schema with file, line and message fields, and post them from the pipeline.",
        "Have the same session that generated the code changes also review the follow-up commits, since it already knows which issues were raised.",
        "On each re-run, pass the findings of the earlier reviews into the prompt and ask Claude to report only issues that are new or still unresolved.",
        "Have the pipeline compare the text of each new finding with the existing PR comments and skip exact matches before posting anything."
      ],
      correct: [1, 3],
      explanation: "Two different problems need two different changes. Automated posting needs machine-readable output: --output-format json combined with --json-schema makes Claude Code return findings in a defined structure with file, line and message, which the pipeline can post as inline comments. Avoiding duplicates needs knowledge of what was already reported: including the findings of earlier reviews in the prompt lets Claude report only issues that are new or still unresolved.",
      optionExplanations: [
        "A Markdown table in free text is written for humans and is not a dependable format for automated posting.",
        "--output-format json with --json-schema produces machine-parseable findings that can be posted reliably as inline PR comments.",
        "A session is less effective at reviewing its own changes than an independent instance, and this does not prevent duplicate comments.",
        "With the earlier findings in context, Claude can leave out issues that were already reported, which avoids duplicate comments.",
        "This is brittle: the same issue phrased slightly differently is posted again, because the review itself does not know what was already reported."
      ],
      source: source("3.6", "Including prior review findings in context when re-running reviews after new commits"),
      docs: [
        { label: "Claude Code docs: Headless / programmatic usage", url: "https://code.claude.com/docs/en/headless.md", quote: "To get output conforming to a specific schema, use --output-format json with --json-schema and a JSON Schema definition." },
        { label: "Claude Code docs: Best practices", url: "https://code.claude.com/docs/en/best-practices.md", quote: "A fresh context improves code review since Claude won't be biased toward code it just wrote." }
      ]
    },
    {
      id: "core-d3-004",
      domain: "D3",
      objectives: ["O14"],
      scenario: "s2",
      question: "Your team uses a project skill, /analyze-deps, that maps the dependencies of a package and prints a detailed report of 2,000 to 3,000 lines. Developers usually run it early in a session and then continue with the actual change. They report that, after running the skill, Claude Code loses track of instructions given earlier and the context fills up quickly. Only the skill's conclusions are needed afterwards, and the fix must not rely on developers taking an extra step after each run. What should you change?",
      options: [
        "Add allowed-tools to the skill's frontmatter, so that the skill can only use read-only tools while it analyzes the dependencies.",
        "Ask developers to run /compact right after the skill finishes, so that the long report is summarized before they continue working.",
        "Add context: fork to the skill's SKILL.md frontmatter, so that it runs in an isolated sub-agent context and returns only its result.",
        "Move the dependency analysis instructions into the project CLAUDE.md, so that Claude has them available from the start of every session."
      ],
      correct: [2],
      explanation: "The skill's verbose output lands in the main conversation, where it crowds out earlier instructions and consumes context. Setting context: fork in the skill's frontmatter runs it in an isolated sub-agent context, so the detailed exploration stays there and only the result comes back. Developers keep their session clean without any extra step, and the skill's logic does not need to change, only one line of its configuration.",
      optionExplanations: [
        "allowed-tools concerns which tools the skill may use without friction, not where its output ends up. (Current docs describe it as pre-approving tools; a separate disallowed-tools field removes tools.)",
        "/compact reduces context after the fact, but it is exactly the extra manual step the requirement rules out, and it may drop details still needed.",
        "A forked context isolates verbose output from the main session automatically, which is exactly the problem described.",
        "CLAUDE.md is always loaded; it would add the instructions to every session but still put the report into the main context."
      ],
      source: source("3.2", "Using context: fork to isolate skills that produce verbose output"),
      docs: [
        { label: "Claude Code docs: Skills", url: "https://code.claude.com/docs/en/skills.md", quote: "Add context: fork to your frontmatter when you want a skill to run in isolation." },
        { label: "Claude Code docs: Skills", url: "https://code.claude.com/docs/en/skills.md", quote: "It does not restrict which tools are available: every tool remains callable, and your permission settings still govern tools that are not listed." }
      ]
    },
    {
      id: "core-d3-005",
      domain: "D3",
      objectives: ["O08"],
      scenario: "s2",
      question: "Your team must move 70 background jobs from a cron-based scheduler to an event queue. Two approaches are possible: wrapping the existing jobs in a compatibility layer, or rewriting each job as an event consumer; they need different monitoring and retry infrastructure. In a similar change last quarter, Claude converted 25 jobs in direct execution before it became clear that the other approach was needed, and the work was redone. Which workflow should you use this time?",
      options: [
        "Explore the jobs in plan mode and settle the approach first, then leave plan mode and carry out the agreed plan.",
        "Use the Explore subagent to list all 70 jobs, then rewrite each job as an event consumer in direct execution, one job at a time.",
        "Ask Claude to implement both approaches on separate branches in direct execution, and keep whichever branch passes the tests first.",
        "Use direct execution, but tell Claude in the first prompt to list the jobs and choose an approach before it starts changing files."
      ],
      correct: [0],
      explanation: "The task combines an architectural decision with a lot of mechanical change. Plan mode is meant for the first part: exploring the codebase safely and choosing between approaches before anything is changed, which prevents the costly rework seen last quarter. Once the plan is agreed, direct execution is the efficient way to carry out the well-understood changes. Combining both uses each mode for what it does best.",
      optionExplanations: [
        "Planning the decision first and then executing the agreed plan avoids rework without slowing down the implementation.",
        "Listing the jobs helps, but this skips the decision between the two approaches, which is what caused the rework last time.",
        "Implementing both approaches doubles the work and still decides by trial instead of by analysis of the codebase.",
        "Asking for a decision first helps, but in direct execution Claude may start changing files before the approach has been explored and agreed; plan mode guarantees that separation."
      ],
      source: source("3.4", "Combining plan mode for investigation with direct execution for implementation"),
      docs: [
        { label: "Claude Code docs: Best practices", url: "https://code.claude.com/docs/en/best-practices.md", quote: "Letting Claude jump straight to coding can produce code that solves the wrong problem. Use plan mode to separate exploration from execution." },
        { label: "Claude Code docs: Best practices", url: "https://code.claude.com/docs/en/best-practices.md", quote: "Planning is most useful when you're uncertain about the approach, when the change modifies multiple files, or when you're unfamiliar with the code being modified." }
      ]
    },
    {
      id: "core-d3-006",
      domain: "D3",
      objectives: ["O12"],
      scenario: "s2",
      question: "You ask Claude Code to write a function that converts log lines from three legacy services into one normalized format, and you explain the target format in your message: timestamps, severity mapping and multi-line stack traces. After three iterations the results still differ each time: one version keeps time zones, another drops them, and stack traces are sometimes merged into one line and sometimes split. What is the most effective next step?",
      options: [
        "List all the inconsistencies you noticed in one detailed message, so that Claude can fix them together in the next iteration.",
        "Switch to plan mode, so that Claude first writes a design document for the converter before it changes the implementation again.",
        "Ask Claude to explain back in its own words how it understands the format, and continue only once its explanation matches yours.",
        "Paste two or three real log lines and, for each of them, the exact normalized line you expect the function to produce."
      ],
      correct: [3],
      explanation: "The results vary because your explanation of the format can be read in more than one way. Concrete input and output examples are the most effective way to communicate an expected transformation in that situation: a few real log lines with their exact normalized output settle details such as time zones and stack trace handling that the description leaves open. Listing the problems or restating the requirement still describes the format indirectly.",
      optionExplanations: [
        "Collecting the issues in one message helps when they interact, but it still describes the target format in words, which is what failed.",
        "Plan mode suits complex, multi-file decisions; here the requirement itself is unclear, and a design document would restate it in words.",
        "A restated understanding can surface misunderstandings, but it is still a description and does not fix the exact output format.",
        "Concrete examples show the exact expected result, including the edge cases the explanation did not settle."
      ],
      source: source("3.5", "Concrete input/output examples as the most effective way to communicate expected transformations"),
      docs: [
        { label: "Claude API docs: Prompting best practices", url: "https://platform.claude.com/docs/en/build-with-claude/prompt-engineering/claude-prompting-best-practices.md", quote: "Examples are one of the most reliable ways to steer Claude's output format, tone, and structure." },
        { label: "Claude Code docs: Best practices", url: "https://code.claude.com/docs/en/best-practices.md", quote: "Claude can infer intent, but it can't read your mind. Reference specific files, mention constraints, and point to example patterns." }
      ]
    },
    {
      id: "core-d3-007",
      domain: "D3",
      objectives: ["O16"],
      scenario: "s2",
      question: "Six service teams share one repository. The root CLAUDE.md has grown to 1,800 lines covering every team's conventions, and every session loads all of it. Each team wants to decide in its own service directory which conventions apply there. Several conventions, such as error codes and API versioning, are shared by most teams, and nobody wants copies that drift apart. Which setup fits best?",
      options: [
        "Copy the relevant sections into a CLAUDE.md in each service directory, so that every service contains exactly the conventions it needs.",
        "Keep each convention in its own file, and let each service's CLAUDE.md pull in the files that team needs with @import.",
        "Turn every convention into a skill, so that developers invoke the right conventions when they start working in a service.",
        "Keep one rule file per convention in the central rules folder, each listing the service directories it applies to."
      ],
      correct: [1],
      explanation: "The requirements are: each service gets only its relevant conventions, shared conventions exist once, and each team decides for its own service. Conventions in separate files, imported with @import into each service's CLAUDE.md, meet all three: the team chooses the imports, shared files are maintained in one place, and the root file no longer loads everything. Path-scoped rules would also avoid copies, but the decision would sit in central rule files instead of with the teams.",
      optionExplanations: [
        "Copies give each service its own conventions but drift apart over time, which the teams want to avoid.",
        "@import keeps CLAUDE.md modular: shared conventions exist once, and each team chooses what to include.",
        "Skills load on demand, while conventions should apply automatically whenever someone works in a service.",
        "Path-scoped rules avoid copies, but which service uses a convention is then decided in central files, not by the team."
      ],
      source: source("3.1", "Using @import to selectively include relevant standards files in each package's CLAUDE.md"),
      docs: [
        { label: "Claude Code docs: Memory", url: "https://code.claude.com/docs/en/memory.md", quote: "CLAUDE.md files can import additional files using @path/to/import syntax. Imported files are expanded and loaded into context at launch alongside the CLAUDE.md that references them." },
        { label: "Claude Code docs: Memory", url: "https://code.claude.com/docs/en/memory.md", quote: "Instead of loading them at launch, Claude Code loads each one once Claude reads, writes, or edits another file in that subdirectory." }
      ]
    },
    {
      id: "core-d3-008",
      domain: "D3",
      objectives: ["O16"],
      scenario: "s2",
      question: "Your team's project skill /release-notes writes release notes in the team's format. One developer also needs an internal changelog with ticket links for their weekly report. Their first attempt edited the shared skill, and the next day two teammates published release notes containing internal ticket links. The developer will keep using the team's standard /release-notes for public releases. How should they set up the internal version?",
      options: [
        "Add a parameter to the shared skill that switches the internal changelog on, and tell teammates to always leave it switched off.",
        "Edit the shared skill again, but this time on a personal branch that the developer never merges into the main branch.",
        "Create a personal skill also named /release-notes in their home directory, so that it applies only on their own machine.",
        "Copy the skill into the skills folder in their home directory, give it its own name, and add the changelog there."
      ],
      correct: [3],
      explanation: "Personal variants belong in the user-level skills directory in the developer's home folder, which is not shared through version control, so teammates are not affected. Giving the copy its own name keeps it clearly separate from the team's skill, so the developer can still run the standard /release-notes for public releases and the internal version for the weekly report.",
      optionExplanations: [
        "A switch puts the internal option into everyone's skill; one wrong invocation leaks ticket links again.",
        "A personal branch of the shared skill drifts from the team's version and is easy to merge by accident.",
        "With the same name, the developer can no longer reliably run the team's standard version for public releases; the guide recommends different names.",
        "A differently named personal skill leaves the shared skill untouched, and both versions remain available to the developer."
      ],
      source: source("3.2", "creating personal variants in ~/.claude/skills/ with different names to avoid affecting teammates"),
      docs: [
        { label: "Claude Code docs: Skills", url: "https://code.claude.com/docs/en/skills.md", quote: "Create a directory for the skill in your personal skills folder. Personal skills are available across all your projects." },
        { label: "Claude Code docs: Skills", url: "https://code.claude.com/docs/en/skills.md", quote: "Enterprise over personal, and personal over project. With deploy in both ~/.claude/skills/ and the project's .claude/skills/, /deploy runs the personal one" }
      ]
    },
    {
      id: "core-d3-009",
      domain: "D3",
      objectives: ["O15"],
      scenario: "s5",
      question: "Claude Code generates unit tests in CI for every pull request, and developers reject 60% of them. Typical review comments: \"duplicates test_refund_partial in test_refunds.py\", \"already covered by test_coupon_expiry\", \"use make_order() from conftest instead of building Order by hand\" and \"we never build fixtures inline\". Which TWO changes address these rejections most directly? (Select 2)",
      options: [
        "Include the test files that already exist for the changed modules in the prompt of each CI run.",
        "Ask Claude to generate twice as many tests per change, and let the pipeline keep only those tests that pass on the first run.",
        "Run the test generation in plan mode, so that Claude lists the scenarios it intends to cover before it writes any test code.",
        "Write the team's test conventions and shared helpers such as make_order() into the CLAUDE.md that the CI run loads.",
        "Generate the tests with a second, independent Claude instance, so that they are not influenced by the code author's reasoning."
      ],
      correct: [0, 3],
      explanation: "The comments point to two different gaps. Duplicates appear because Claude cannot see what the existing tests already cover; including those test files in the prompt lets it add only new scenarios. Hand-built objects appear because Claude does not know the team's helpers and conventions; documenting them in the CLAUDE.md that CI loads gives every run that project context. More tests, a planning step or another instance do not supply the missing information.",
      optionExplanations: [
        "With the existing tests in context, Claude can avoid scenarios that are already covered.",
        "Passing tests can still be duplicates and still ignore the helpers; this only increases the volume to review.",
        "A list of planned scenarios still lacks knowledge of the existing tests and the team's helpers.",
        "CLAUDE.md is how CI-invoked Claude Code learns the team's testing conventions and available fixtures.",
        "An independent instance helps reviews catch subtle issues, but it has the same missing knowledge about existing tests and helpers."
      ],
      source: source("3.6", "Providing existing test files in context so test generation avoids suggesting duplicate scenarios"),
      docs: [
        { label: "Claude Code docs: GitHub Actions", url: "https://code.claude.com/docs/en/github-actions.md", quote: "Create a CLAUDE.md file in your repository root to define code style guidelines, review criteria, project-specific rules, and preferred patterns." },
        { label: "Claude Code docs: Best practices", url: "https://code.claude.com/docs/en/best-practices.md", quote: "look at how existing widgets are implemented on the home page to understand the patterns." }
      ]
    },
    {
      id: "core-d3-010",
      domain: "D3",
      scenario: "s2",
      question: "Your team's /new-endpoint skill scaffolds a REST endpoint and needs a resource name and an HTTP method. Usage logs show that in 40% of runs developers type /new-endpoint without arguments; Claude then guesses the resource from the open file, and a third of those scaffolds land in the wrong module. Most runs without arguments come from developers who are using the skill for the first time. You want fewer runs without arguments, without adding extra round trips. What should you change?",
      options: [
        "When arguments are missing, let Claude infer the resource from the open file and ask the developer to confirm it before generating.",
        "Split the skill into one skill per HTTP method, so that developers only have to pass the resource name when they invoke it.",
        "Add a section to the project CLAUDE.md explaining that the skill needs a resource name and a method as its arguments.",
        "Add an argument-hint to the skill, so that the command shows the resource name and method it expects as someone types it."
      ],
      correct: [3],
      explanation: "Developers leave out the arguments mainly because they do not know which ones the skill expects. An argument-hint in the skill's frontmatter shows the expected parameters while the command is being typed, so more invocations include them from the start. It does not force anyone to enter them, but it addresses the stated cause at the point of use without adding a confirmation step.",
      optionExplanations: [
        "A confirmation step prevents some wrong scaffolds, but it adds the extra round trip you want to avoid and still starts from a guess.",
        "Fewer arguments help a little, but the resource name is still easy to forget, and the team now maintains several skills.",
        "CLAUDE.md is read by Claude, not shown to developers while they type the command, so it does not tell them what to enter.",
        "An argument-hint shows the expected parameters at invocation time, which addresses why developers leave them out."
      ],
      source: source("3.2", "Using argument-hint frontmatter to prompt developers for required parameters"),
      docs: [
        { label: "Claude Code docs: Skills", url: "https://code.claude.com/docs/en/skills.md", quote: "argument-hint | No | Hint shown during autocomplete to indicate expected arguments. Example: [issue-number] or [filename] [format]." }
      ]
    },
    {
      id: "core-d3-011",
      domain: "D3",
      objectives: ["O08"],
      scenario: "s2",
      question: "A ticket asks to raise the default number of HTTP retries from 3 to 5. A search shows that the constant DEFAULT_RETRIES is defined once and read in exactly one place, and an existing test checks the default value. A teammate suggests starting in plan mode, as the team does for most changes, which usually takes about ten minutes of plan review. Which approach fits this change?",
      options: [
        "Plan mode, so that Claude first explores every caller of the HTTP client and checks whether more retries could cause side effects.",
        "Ask Claude to change the constant, update the expected value in the existing test, and run the test right away without a planning round.",
        "Plan mode for the change itself, followed by an Explore subagent run that looks for other hard-coded retry values in the codebase.",
        "Ask Claude to move all retry settings into a new configuration file first, so that future changes of this kind are easier."
      ],
      correct: [1],
      explanation: "Plan mode pays off for changes with many files, several valid approaches or architectural impact. Here the search has already established that the constant has one definition and one reader, and a test covers it, so a planning round would review a one-line change for ten minutes without reducing any risk. Making the change directly and confirming it with the existing test is the proportionate approach.",
      optionExplanations: [
        "Exploring every caller is unnecessary when the constant is read in exactly one place; the scope is already known.",
        "A known, contained scope with test coverage makes direct execution the efficient choice.",
        "Planning plus an extra exploration adds effort for a change whose scope has already been established.",
        "Moving all settings turns a one-line change into a refactoring with its own risks that nobody asked for."
      ],
      source: source("3.4", "Selecting direct execution for well-understood changes with clear scope"),
      docs: [
        { label: "Claude Code docs: Best practices", url: "https://code.claude.com/docs/en/best-practices.md", quote: "For tasks where the scope is clear and the fix is small (like fixing a typo, adding a log line, or renaming a variable) ask Claude to do it directly." },
        { label: "Claude Code docs: Best practices", url: "https://code.claude.com/docs/en/best-practices.md", quote: "If you could describe the diff in one sentence, skip the plan." }
      ]
    },
    {
      id: "core-d3-012",
      domain: "D3",
      objectives: ["O08"],
      scenario: "s2",
      question: "You asked Claude Code to \"add webhooks for order events\", and it immediately produced a working implementation. In review, the team found no retry strategy, no signature verification, no handling for receivers that are down for hours, and no rule for the order of events. The codebase contains nothing comparable. Rewriting took three days. How should you start the next feature of this kind?",
      options: [
        "Before any code is written, have Claude ask you how the feature should behave in failure and edge cases, and settle those points.",
        "Write a detailed specification yourself before starting, so that Claude receives every requirement in the very first message.",
        "Let Claude implement first as before, then ask it in a second session to review the result for missing edge cases.",
        "Start in plan mode, so that Claude explores the existing order code and designs the integration before it writes anything."
      ],
      correct: [0],
      explanation: "The review findings were all design decisions that the team had not considered, so the team could not have written them into a specification. Having Claude ask questions before implementing brings up considerations such as retries, signatures, downtime and event ordering while they are still cheap to decide. Plan mode prevents rework when the answers are in the codebase, but here nothing comparable exists to explore.",
      optionExplanations: [
        "Letting Claude ask questions first surfaces design considerations the team did not anticipate, before any code is written.",
        "A specification helps, but the team cannot write down requirements it has not thought of, which was the original problem.",
        "A later review can find gaps, but only after the implementation exists, which is how three days of rework happened.",
        "Plan mode explores the codebase and designs from it, but the missing decisions were not in the code; nothing comparable exists there."
      ],
      source: source("3.5", "Using the interview pattern to surface design considerations"),
      docs: [
        { label: "Claude Code docs: Best practices", url: "https://code.claude.com/docs/en/best-practices.md", quote: "For larger features, have Claude interview you first. Start with a minimal prompt and ask Claude to interview you using the AskUserQuestion tool." },
        { label: "Claude Code docs: Best practices", url: "https://code.claude.com/docs/en/best-practices.md", quote: "Claude asks about things you might not have considered yet, including technical implementation, UI/UX, edge cases, and tradeoffs." }
      ]
    },
    {
      id: "core-d3-013",
      domain: "D3",
      objectives: ["O16"],
      scenario: "s2",
      question: "Developers report that Claude Code follows the team's testing conventions in some sessions and ignores them in others. Comparing notes, they find that the problem appears when a session is started from inside packages/api, but not when it is started from the repository root. The root CLAUDE.md and the instruction files inside packages/api are maintained by two different people. What is the best first step?",
      options: [
        "Copy the testing conventions into every CLAUDE.md file in the repository, so that they are present no matter where a session starts.",
        "Rewrite the testing conventions with stronger wording, such as MUST and NEVER, so that Claude gives them a higher priority.",
        "Start a session in both places, run /memory in each, and compare the two lists of instruction files it reports.",
        "Ask all developers to always start their sessions from the repository root, so that the conventions are loaded consistently."
      ],
      correct: [2],
      explanation: "The behavior depends on where the session starts, which suggests that different instruction files are active in the two cases. Checking with /memory in both places shows exactly which files are loaded, so the team can see whether a file is missing or a package file conflicts with the root conventions before changing anything. Copying, rewording or a new habit would change the setup without knowing the cause. Note: in the current Claude Code docs, /memory lists and opens memory files, and /context shows exactly which CLAUDE.md and rules files were loaded; the guide uses /memory for this check.",
      optionExplanations: [
        "Copies spread one person's conventions into files another person maintains, create duplicates that drift apart, and leave the cause unknown.",
        "Stronger wording does not help if the file containing the conventions is not loaded in the first place.",
        "/memory shows which memory files are loaded in each situation, which is exactly what is needed to find the difference.",
        "A new habit works around the symptom and fails as soon as someone starts in a package directory again."
      ],
      source: source("3.1", "Using the /memory command to verify which memory files are loaded"),
      docs: [
        { label: "Claude Code docs: Memory", url: "https://code.claude.com/docs/en/memory.md", quote: "To check which CLAUDE.md and rules files loaded at launch, run /context." },
        { label: "Claude Code docs: Memory", url: "https://code.claude.com/docs/en/memory.md", quote: "Claude Code loads CLAUDE.md and CLAUDE.local.md from your current working directory and every directory above it." }
      ]
    },
    {
      id: "core-d3-014",
      domain: "D3",
      objectives: ["O12"],
      scenario: "s2",
      question: "Your CSV import has three bugs that all live in the shared parsing preamble: encoding detection fails for some files, the delimiter is guessed wrongly when fields contain semicolons, and headers are mapped to the wrong columns after a byte-order mark. Separately, the PDF export, which belongs to another team's module and is released on its own schedule, rounds totals wrongly. Last week you asked Claude to fix the import bugs one at a time, and each fix broke one of the others. How should you proceed?",
      options: [
        "Describe all four bugs in one detailed message, including the export rounding, so that Claude can fix everything in a single change.",
        "Describe the three import bugs together in one detailed message with example files, and handle the export rounding as a separate task.",
        "Continue fixing the import bugs one at a time, but run the full import test suite after each fix before moving on to the next one.",
        "Fix the export rounding first, then ask Claude to rewrite the whole parsing preamble from scratch without referring to the bugs."
      ],
      correct: [1],
      explanation: "The three import bugs interact: they sit in the same preamble, and fixing one in isolation broke another. Describing them together, with example files, lets Claude design one consistent fix. The export rounding is independent and belongs to another team's module with its own release schedule, so it should be handled as a separate piece of work. Sequential fixing suits independent problems, not interacting ones.",
      optionExplanations: [
        "Bundling the export fix into the same change mixes another team's module and release into your import fix.",
        "Interacting bugs are fixed together in one detailed message, while the independent bug is handled separately.",
        "Tests catch the breakage sooner, but fixing interacting bugs one at a time keeps producing fixes that conflict.",
        "A rewrite without the concrete bugs loses the information needed to get the edge cases right."
      ],
      source: source("3.5", "Addressing multiple interacting issues in a single detailed message when fixes interact")
    },
    {
      id: "core-d3-015",
      domain: "D3",
      scenario: "s2",
      question: "Your team's /stale-branches skill should list branches without commits in the last 90 days and write a report to reports/stale-branches.md. Last week, while \"cleaning up\", it ran a command that deleted three remote branches, one of which was still needed. The skill needs to read git history and write the report file, nothing else; other team workflows do need to delete branches from time to time. Which change fits best?",
      options: [
        "Give the skill its own tool allowlist so that, while it runs, only read-only git commands and writing the report are available.",
        "Add a sentence to the skill's instructions that it must never delete branches or run any command that changes the repository.",
        "Add context: fork to the skill's frontmatter, so that it runs in an isolated sub-agent context separate from the main session.",
        "Add a deny rule for git push --delete to the project's settings, so that this command is blocked in every session for everyone."
      ],
      correct: [0],
      explanation: "The skill only needs to read history and write one file, so its tool access during execution should be limited to exactly that. Configuring allowed-tools in the skill's frontmatter scopes the restriction to this skill, as the guide describes, without affecting other workflows. An instruction not to delete is probabilistic, a forked context isolates output rather than permissions, and a project-wide deny rule blocks legitimate branch deletions elsewhere while leaving other destructive commands open. Note: the current Claude Code docs describe allowed-tools as pre-approving the listed tools without a permission prompt, not as removing other tools; to actually remove tools while a skill runs, the docs provide a disallowed-tools field. The exam follows the guide.",
      optionExplanations: [
        "Restricting the skill's tools during execution limits it to what it needs, without changing anything for other workflows.",
        "An instruction makes deletion less likely but does not prevent it, which matters for an irreversible action.",
        "A forked context keeps the skill's output out of the main session; it does not limit what the skill can do.",
        "A global deny rule blocks one command for every workflow, including the ones that need it, and leaves other destructive commands possible."
      ],
      source: source("3.2", "Configuring allowed-tools in skill frontmatter to restrict tool access during skill execution"),
      docs: [
        { label: "Claude Code docs: Skills", url: "https://code.claude.com/docs/en/skills.md", quote: "Tools Claude can use without asking permission during the turn that invokes this skill. The grant clears when you send your next message." },
        { label: "Claude Code docs: Skills", url: "https://code.claude.com/docs/en/skills.md", quote: "It does not restrict which tools are available: every tool remains callable, and your permission settings still govern tools that are not listed." }
      ]
    },
    {
      id: "core-d3-016",
      domain: "D3",
      objectives: ["O16"],
      scenario: "s2",
      question: "Files under src/generated/ are produced by a code generator and are overwritten on every build, so manual edits get lost and confuse reviewers. The root CLAUDE.md says \"Never edit files in src/generated/\", yet in the last month Claude edited them in 6 of about 200 sessions. The team wants this to never happen again, Claude may still read those files, and a blocked edit should tell Claude to change the generator instead. What should you use?",
      options: [
        "A rule file in .claude/rules/ with paths: [\"src/generated/**\"] that repeats the instruction whenever such a file is touched.",
        "A PreToolUse hook that blocks Edit and Write calls on paths under src/generated/ and tells Claude to change the generator instead.",
        "A project skill that explains the code generator, which developers invoke whenever they work near generated code.",
        "A stronger CLAUDE.md wording with the reason for the rule and an example of changing the generator instead of its output."
      ],
      correct: [1],
      explanation: "CLAUDE.md and rule files are instructions that Claude treats as context, so they make a behavior likely but cannot guarantee it, which the 6 incidents show. A PreToolUse hook runs on every tool call and can block edits to the generated folder deterministically, while reads stay allowed, and its message can point Claude to the generator. A permission deny rule for edits on that path would also block them reliably, but it cannot give that specific guidance.",
      optionExplanations: [
        "A path-scoped rule loads at the right moment, but it is still an instruction and therefore not a guarantee.",
        "A hook that blocks edits on that path enforces the rule every time and still allows reading the files.",
        "A skill depends on someone invoking it and does not stop an edit when Claude decides to make one.",
        "Better wording may lower the rate further, but the requirement is that it never happens again."
      ],
      source: source("1.5", "The distinction between using hooks for deterministic guarantees versus relying on prompt instructions for probabilistic compliance"),
      docs: [
        { label: "Claude Code docs: Memory", url: "https://code.claude.com/docs/en/memory.md", quote: "Claude treats them as context, not enforced configuration. To block an action regardless of what Claude decides, use a PreToolUse hook instead." },
        { label: "Claude Code docs: Hooks guide", url: "https://code.claude.com/docs/en/hooks-guide.md", quote: "which gives you deterministic control: certain actions always happen rather than relying on the LLM to choose to run them" }
      ]
    },
    {
      id: "core-d3-017",
      domain: "D3",
      objectives: ["O16"],
      scenario: "s2",
      question: "Your root CLAUDE.md has grown to 900 lines. About 400 of them describe the release procedure: changelog rules, version bumps, tagging and rollback steps. The team releases twice a month, and only two people do it. Everyone else works on features, and feature pull requests also add changelog entries; they find that Claude sometimes mixes release conventions into ordinary changes. Where should the release procedure live?",
      options: [
        "In a .claude/rules/ file with paths for CHANGELOG.md and the version files, so that it loads when release files are edited.",
        "In a hook that runs before every commit and prints the release procedure, so that Claude sees it when it matters.",
        "In a project skill such as /release that the two release managers invoke when they actually prepare a release.",
        "In the release managers' personal ~/.claude/CLAUDE.md files, so that only the people who release ever see it."
      ],
      correct: [2],
      explanation: "CLAUDE.md is always loaded, so it suits standards that apply to every task; a procedure needed twice a month only adds noise to everyone else's sessions. A project skill is invoked on demand for a specific workflow and is shared through the repository, so the release managers get the full procedure exactly when they release, and feature work no longer sees it.",
      optionExplanations: [
        "Path scoping helps, but feature work also touches the changelog, and the procedure starts long before any release file is edited.",
        "Printing the procedure before every commit adds it to ordinary work too, and a hook is meant for enforcement, not documentation.",
        "An on-demand skill fits a task-specific workflow and keeps it out of everyday sessions.",
        "Personal files are not shared through the repository, so the procedure would drift and a new release manager would lack it."
      ],
      source: source("3.2", "Choosing between skills (on-demand invocation for task-specific workflows) and CLAUDE.md (always-loaded universal standards)")
    },
    {
      id: "core-d3-018",
      domain: "D3",
      objectives: ["O13"],
      scenario: "s5",
      question: "You are setting up Claude Code to review pull requests in CI. Requirements: the review must apply the team's review checklist, which changes often and is maintained in the repository; it must never change files or push anything; and its findings must be posted automatically as inline comments, in a fixed structure the posting script can rely on without manual fixes. Which configuration meets all three requirements?",
      options: [
        "Checklist in the project CLAUDE.md; editing and Bash tools denied for the run; -p with --output-format json and --json-schema.",
        "Checklist in the project CLAUDE.md; editing and Bash tools denied for the run; -p with --output-format json and no schema.",
        "Checklist pasted into the CI prompt; an instruction in that prompt not to change files; -p with --json-schema.",
        "Checklist in the CI runner's ~/.claude/CLAUDE.md; editing and Bash tools denied; -p with --output-format json and --json-schema."
      ],
      correct: [0],
      explanation: "Each requirement maps to a mechanism. The checklist belongs in the project CLAUDE.md, which CI-invoked Claude Code loads and which is versioned with the code. Denying the editing and Bash tools for the run removes them, so the review cannot change or push anything. JSON output validated against a schema gives findings a fixed structure that the pipeline can post as inline comments; without a schema, the shape of the JSON can vary.",
      optionExplanations: [
        "Project context via CLAUDE.md, denied write tools and schema-based JSON output cover all three requirements.",
        "Everything fits except the output: JSON without a schema has no guaranteed structure for reliable inline posting.",
        "Structured output is covered, but the checklist is not maintained in the repository and a prompt instruction does not guarantee read-only behavior.",
        "Read-only and structured output are covered, but a runner's user-level file is not maintained in the repository with the code."
      ],
      source: source("3.6", "CLAUDE.md as the mechanism for providing project context (testing standards, fixture conventions, review criteria) to CI-invoked Claude Code"),
      docs: [
        { label: "Claude Code docs: Headless mode", url: "https://code.claude.com/docs/en/headless.md", quote: "To get output conforming to a specific schema, use --output-format json with --json-schema and a JSON Schema definition." },
        { label: "Claude Code docs: Permissions", url: "https://code.claude.com/docs/en/permissions.md", quote: "A bare tool name like Bash removes the tool from Claude's context entirely, so Claude never sees it." }
      ]
    },
    {
      id: "core-d3-019",
      domain: "D3",
      objectives: ["O11"],
      scenario: "s5",
      question: "A nightly CI job runs claude -p \"Fix all lint warnings\" with --dangerously-skip-permissions. Last week one run took nine hours, made about 1,400 tool calls, cost $310, and also edited files outside the src/ folder. The job must stay unattended, must stop once a set budget is reached, and may only edit files under src/. Which configuration fits best?",
      options: [
        "Keep -p, allow edits only under src/ through permission rules instead of skipping them, and add --max-turns and --max-budget-usd.",
        "Keep the current flags, but wrap the whole job in a 60-minute CI timeout that stops the process as soon as the time is up.",
        "Keep -p, but run the job in plan mode instead, so that Claude cannot change any files outside src/ during the night.",
        "Keep -p and --dangerously-skip-permissions, and add --max-turns 30 so that every run ends after a bounded number of turns."
      ],
      correct: [0],
      explanation: "Each requirement needs its own mechanism. -p keeps the run non-interactive; permission rules instead of skipping all checks restrict edits to src/; and --max-turns and --max-budget-usd stop the run when it reaches a set number of turns or an estimated spend, so a runaway night ends predictably (the docs note the cost check uses a client-side estimate). A timeout or a turn limit alone leaves permissions wide open and only limits the damage roughly.",
      optionExplanations: [
        "Scoped permissions plus turn and budget limits keep the job unattended, bounded and inside src/.",
        "A timeout stops the process abruptly, possibly mid-edit, and edits outside src/ are still allowed until then.",
        "Plan mode does not make changes at all, so the lint warnings would never be fixed.",
        "A turn limit bounds the run, but skipped permissions still allow edits outside src/, and spend is not capped directly."
      ],
      source: source("3.6", "The -p (or --print) flag for running Claude Code in non-interactive mode in automated pipelines"),
      docs: [
        { label: "Claude Code docs: CLI reference", url: "https://code.claude.com/docs/en/cli-reference.md", quote: "Limit the number of agentic turns (print mode only). Exits with an error when the limit is reached." },
        { label: "Claude Code docs: CLI reference", url: "https://code.claude.com/docs/en/cli-reference.md", quote: "Stop the run once estimated spend on API calls reaches this amount (print mode only)." }
      ]
    },
    {
      id: "core-d3-020",
      domain: "D3",
      objectives: ["O14"],
      scenario: "s2",
      question: "Your team's /summarize-decisions skill should list the design decisions made so far in the current conversation, for the meeting notes. To keep its output tidy, someone added context: fork to the skill's frontmatter. Since then, its summaries are generic (\"The team discussed architecture options\") and miss every concrete decision from the session. What should you change?",
      options: [
        "Keep context: fork, but extend the skill's instructions with a detailed list of which kinds of decisions to look for and how to format them.",
        "Remove context: fork, so that the skill runs where the conversation's history is available, since that history is its input.",
        "Add allowed-tools: Read to the skill, so that the forked context can read the project files in which the decisions are documented.",
        "Keep context: fork and switch the skill to a more capable model, so that it reconstructs the decisions more accurately."
      ],
      correct: [1],
      explanation: "context: fork runs a skill in an isolated subagent that does not see the conversation history. That is useful for verbose work whose input is self-contained, but this skill's whole input is the conversation, so the forked run has nothing to summarize and produces generic text. Removing the option lets the skill run with the history it needs. Better instructions or a stronger model cannot recover information the forked context never receives.",
      optionExplanations: [
        "More detailed instructions do not give the forked context access to the decisions it is supposed to summarize.",
        "Without the fork, the skill sees the conversation history, which is exactly the input it needs.",
        "The decisions were made in the conversation, not written to project files, so reading files does not recover them.",
        "No model can reconstruct a conversation it cannot see."
      ],
      source: source("3.2", "The context: fork frontmatter option for running skills in an isolated sub-agent context"),
      docs: [
        { label: "Claude Code docs: Skills", url: "https://code.claude.com/docs/en/skills.md", quote: "The subagent doesn't see your conversation history, so the skill's instructions have to stand on their own." }
      ]
    },
    {
      id: "core-d3-021",
      domain: "D3",
      objectives: ["O15"],
      scenario: "s5",
      question: "Claude Code generates unit tests in CI, and coverage rose from 61% to 84% within a month. Yet a bug in the discount calculation reached production, and reviewers note that most new tests assert getters, check that mocked functions were called, or repeat the implementation's logic. The team's notion of a valuable test exists only in the heads of two senior engineers, and CI time and token cost per run must not grow. What is the most effective change?",
      options: [
        "Raise the coverage target in CI from 84% to 90%, so that Claude has to write tests for the remaining untested code paths as well.",
        "Generate twice as many tests per change, and let the pipeline keep only those tests that fail when the code under test is mutated.",
        "Have a second, independent Claude instance review each generated test and reject the ones it judges to be of low value.",
        "Write down in the project CLAUDE.md what makes a test valuable for this team, with examples of good and trivial tests and the available fixtures."
      ],
      correct: [3],
      explanation: "The generator does not know what this team considers a valuable test, so it optimizes for what is easy to measure. Documenting the criteria in CLAUDE.md, such as testing behavior and edge cases instead of getters and mocks, with examples and the available fixtures, gives every CI run that project context. A higher coverage target rewards exactly the trivial tests the reviewers complain about.",
      optionExplanations: [
        "A higher target pushes for more of the same trivial tests, since they raise coverage most cheaply.",
        "Mutation-based filtering can drop weak tests, but generating twice as many tests breaks the limit on CI time and cost.",
        "An independent reviewer without the criteria has the same unclear notion of value as the generator.",
        "Documented criteria with examples give test generation the project context it is missing."
      ],
      source: source("3.6", "Documenting testing standards, valuable test criteria, and available fixtures in CLAUDE.md to improve test generation quality and reduce low-value test output")
    },
    {
      id: "core-d3-022",
      domain: "D3",
      objectives: ["O16"],
      scenario: "s2",
      question: "Your monorepo has 12 services, each with its own migrations folder of SQL files. The migration conventions, about 150 lines, sit in the root CLAUDE.md, so every session loads them, although most developers touch migrations only a few times a month. New services are added every few weeks, and nobody wants to remember to copy convention files when that happens. Where should the conventions live?",
      options: [
        "In a CLAUDE.md inside each service's migrations folder, so that the conventions load only when someone works on migrations.",
        "In a project skill that developers invoke whenever they are about to write or change a migration in any of the services.",
        "In a .claude/rules/ file with paths: [\"**/migrations/*.sql\"], so that they load whenever a migration file is being edited.",
        "In the root CLAUDE.md as before, but shortened to the 20 most important lines so that it costs less context in every session."
      ],
      correct: [2],
      explanation: "The conventions are needed only when migration files are edited, and those files are spread across many directories that keep growing. A path-scoped rule with a glob pattern loads exactly when a matching file is touched, wherever it lives, so everyday sessions no longer carry the conventions and new services are covered automatically. Directory files would have to be copied for every new service.",
      optionExplanations: [
        "Directory files load at the right time, but each new service needs another copy, which is what the team wants to avoid.",
        "A skill depends on developers remembering to invoke it, so the conventions are not applied automatically.",
        "A glob-scoped rule loads only for matching files in any service, including future ones.",
        "A shorter section still loads in every session and loses most of the conventions."
      ],
      source: source("3.3", "How path-scoped rules load only when editing matching files, reducing irrelevant context and token usage")
    },
    {
      id: "core-d3-023",
      domain: "D3",
      objectives: ["O16"],
      scenario: "s2",
      question: "To reduce context, a teammate moved 600 lines of conventions for specific file types, such as Kafka consumer classes and Flyway migration scripts spread across 20 modules, out of the root CLAUDE.md into separate files under docs/conventions/. CLAUDE.md now imports each file with an @ reference. A week later, the context used at session start is the same as before. The conventions must still apply automatically whenever matching files are worked on. What should you do instead?",
      options: [
        "Keep the imports, but move the @ references to the end of CLAUDE.md, so that the convention files are read only after the general instructions.",
        "Keep the imports, but cut each convention file to at most 30 lines, so that the context used at session start stays small.",
        "Move each file into .claude/rules/ with a paths pattern for its file type, such as **/*Consumer.java, and remove the imports from CLAUDE.md.",
        "Replace the imports with a sentence telling Claude to read the matching file in docs/conventions/ before it edits a file of that type."
      ],
      correct: [2],
      explanation: "Imported files are loaded together with the CLAUDE.md that references them, so splitting the text into imports changes the layout but not the context cost. Rule files with a paths pattern by file type load only when Claude works on a matching file, wherever it sits, which cuts the startup context and keeps the conventions automatic. Shortening the files drops conventions the team needs, and an instruction to read a file may simply be skipped.",
      optionExplanations: [
        "The position of an import does not matter; the imported files still load at session start.",
        "Shorter files cost less but still load in every session, and cutting them loses conventions.",
        "Path-scoped rules by file type load only for matching files across all modules and remove the startup cost.",
        "An instruction to read a file is followed only probabilistically, so the conventions may be missed."
      ],
      source: source("3.3", "Using glob patterns in path-specific rules to apply conventions to files by type regardless of directory location (e.g., **/*.test.tsx for all test files)"),
      docs: [
        { label: "Claude Code docs: Memory", url: "https://code.claude.com/docs/en/memory.md", quote: "Imported files are expanded and loaded into context at launch alongside the CLAUDE.md that references them." }
      ]
    },
    {
      id: "core-d3-024",
      domain: "D3",
      objectives: ["O16"],
      scenario: "s2",
      question: "You created .claude/rules/auth.md with conventions for the files under auth/. Claude now loads these conventions in every session, even when only documentation is edited. What is missing?",
      options: [
        "A paths field in the file's frontmatter that matches auth/**/*.",
        "A reference to the rule file from the project's root CLAUDE.md.",
        "A CLAUDE.md file inside auth/ that points to the rule file.",
        "Moving the file to ~/.claude/rules/ so that it loads per user."
      ],
      correct: [0],
      explanation: "Rule files load at startup for every session unless their frontmatter limits them with a paths pattern. Adding paths that match the auth files makes the rule load only when Claude works on those files. A reference from CLAUDE.md or a pointer file changes nothing about when the rule loads, and a user-level rule still loads in every session of that user.",
      optionExplanations: [
        "A paths pattern turns the always-loaded rule into one that loads only for matching files.",
        "A reference from CLAUDE.md does not make the rule conditional.",
        "A pointer file in auth/ does not stop the rule itself from loading at startup.",
        "A user-level rule without paths also loads in every session."
      ],
      source: source("3.3", ".claude/rules/ files with YAML frontmatter paths fields containing glob patterns for conditional rule activation"),
      docs: [
        { label: "Claude Code docs: Memory", url: "https://code.claude.com/docs/en/memory.md", quote: "Rules without a `paths` field are loaded unconditionally and apply to all files." }
      ]
    },
    {
      id: "core-d3-025",
      domain: "D3",
      objectives: ["O08"],
      scenario: "s2",
      question: "Your team's backlog has five tickets. Which two should Claude Code start in plan mode rather than with direct execution? (Select 2)",
      options: [
        "Change the date format in 60 test fixture files from DD.MM.YYYY to ISO 8601, using a replacement rule the team has already agreed on.",
        "Move user sessions from process memory to shared storage so the app can run on several instances; a central cache and signed client tokens are both under discussion.",
        "Rename the misspelled private helper calcualte_tax to calculate_tax in the three places where it is used within one module.",
        "Add an audit trail for every write to customer data, which could live in the ORM layer, in database triggers or in an event log.",
        "Raise the log level of the payment client from INFO to DEBUG in its configuration file for the next two weeks."
      ],
      correct: [1, 3],
      explanation: "Plan mode pays off when the task has several valid approaches with architectural consequences, because exploring and agreeing on a design first prevents costly rework. The session storage change and the audit trail both involve such a choice, each with different infrastructure and data implications. The fixture update touches many files but follows one clear rule, and the rename and log level change are small and well scoped, so direct execution fits them.",
      optionExplanations: [
        "Many files, but one mechanical rule and no design choice, so direct execution fits.",
        "Two architectures with different infrastructure needs make this a planning task.",
        "A rename within one module is small and well scoped.",
        "Three possible places with different trade-offs call for exploration and a design decision first.",
        "A one-line configuration change needs no plan."
      ],
      source: source("3.4", "Selecting plan mode for tasks with architectural implications (e.g., microservice restructuring, library migrations affecting 45+ files, choosing between integration approaches with different infrastructure requirements)"),
      docs: [
        { label: "Claude Code docs: Common workflows", url: "https://code.claude.com/docs/en/common-workflows.md", quote: "Claude reads files and proposes a plan but makes no edits until you approve." }
      ]
    },
    {
      id: "core-d3-026",
      domain: "D3",
      objectives: ["O20"],
      scenario: "s4",
      question: "A three-phase task removes the deprecated config key legacy_timeout: find every place it is read, decide on a replacement, then implement it. In earlier sessions, the search phase put several thousand lines of matches into the conversation, and by implementation the context was nearly full. After a /compact last week, decisions from the design discussion survived only as one vague line. Every usage must be found, implementation needs the exact list of locations, and the workflow must not rely on a manual step. How should you run the search phase?",
      options: [
        "Limit each search command to the first 50 matches, so that the output added to the conversation stays small enough for later phases.",
        "Run /compact right after the search phase, so that the long search output is summarized before the design discussion starts.",
        "Start a fresh session for the implementation and paste the complete search output and the design decisions into its first message.",
        "Delegate the search to the Explore subagent, which works in its own context and returns every location, grouped by usage pattern."
      ],
      correct: [3],
      explanation: "Verbose discovery output is useful only once, but it stays in the main conversation and crowds out what later phases need. The Explore subagent runs the search in its own context and hands back the locations grouped by pattern instead of raw matches, so the main conversation keeps room for the design and implementation. Truncating the search breaks the requirement to find every usage, and /compact is a manual step whose summary has already shown that it can blur exact details.",
      optionExplanations: [
        "Cutting the output at 50 matches can miss usages, which the task does not allow.",
        "/compact is a manual step, and its summary can blur the exact list of locations the implementation needs.",
        "Pasting the full output into a new session brings the same verbose content back into context.",
        "An Explore subagent isolates the verbose search and returns a compact, complete list of locations."
      ],
      source: source("3.4", "Using the Explore subagent for verbose discovery phases to prevent context window exhaustion during multi-phase tasks"),
      docs: [
        { label: "Claude Code docs: Subagents", url: "https://code.claude.com/docs/en/sub-agents.md", quote: "This keeps exploration results out of your main conversation context." }
      ]
    },
    {
      id: "core-d3-027",
      domain: "D3",
      objectives: ["O12"],
      scenario: "s2",
      question: "You ask Claude Code to implement a rate limiter for your public API: 100 requests per minute per key, bursts of up to 20, and at most 2 ms added per request. Over three rounds you described the problems in prose, such as \"bursts still feel off\" and \"seems slow under load\", and each round fixed one problem while breaking another. You want every round checked automatically against all three requirements, without relying on how precisely you describe each problem. What should you do next?",
      options: [
        "Collect every problem found so far in one detailed message, so that Claude can consider all of them together in the next round.",
        "Ask Claude to interview you about the rate limiter's requirements before it writes the next version of the implementation.",
        "Have Claude first write tests for the rate, the bursts, boundary cases and the 2 ms budget, then give it the failing test output each round.",
        "Switch to plan mode and have Claude write a detailed design document for the rate limiter before it changes any more code."
      ],
      correct: [2],
      explanation: "The requirements are already clear, but vague prose feedback gives Claude nothing precise to aim at and no way to notice when a fix breaks something else. A test suite that covers the limit, the bursts, boundary cases and the latency budget turns every round into a measurable step, and the failing tests tell Claude exactly what is still wrong. A combined message is still prose, and an interview or a design document does not verify the code.",
      optionExplanations: [
        "One message helps with interacting problems, but it still depends on your description, and nothing checks the requirements automatically.",
        "An interview surfaces open design questions, but here the requirements are already known.",
        "Tests written first, with their failures fed back each round, give precise feedback and catch regressions.",
        "A design document adds planning, but nothing checks whether the implementation meets the requirements."
      ],
      source: source("3.5", "Writing test suites covering expected behavior, edge cases, and performance requirements before implementation, then iterating by sharing test failures"),
      docs: [
        { label: "Claude Code docs: Best practices", url: "https://code.claude.com/docs/en/best-practices.md", quote: "Give Claude a check it can run: tests, a build, a screenshot to compare." }
      ]
    },
    {
      id: "core-d3-028",
      domain: "D3",
      objectives: ["O16"],
      scenario: "s2",
      question: "Your root CLAUDE.md has grown to 1,100 lines maintained by four teams: accessibility, observability, data privacy and release management. Every instruction in it applies to all work in the repository. Merge conflicts in the file occur several times a week, and nobody knows who owns which section. The teams want to own their instructions in separate files and to add new topics later without editing any shared file. What should you do?",
      options: [
        "Give each team its own instruction file inside .claude/rules/ without a paths field, so that every one of them loads in every session.",
        "Move each team's section into its own file and import all of these files from the root CLAUDE.md with @ references, one per line.",
        "Move each team's section into a CLAUDE.md in the directory where most of that team's code and configuration lives.",
        "Have each team keep its instructions in its members' ~/.claude/CLAUDE.md files, so that the shared file shrinks for good."
      ],
      correct: [0],
      explanation: "Topic files in .claude/rules/ are discovered automatically, and without a paths field they load in every session, just like the old CLAUDE.md content. Each team owns its file, and a new topic is a new file rather than an edit to a shared one. Imports work too, but every new topic means editing the shared CLAUDE.md again. Directory files would hide instructions that apply everywhere, and user-level files are not shared with the team.",
      optionExplanations: [
        "Separate rule files keep the content loaded everywhere, give each team its own file and need no shared edits for new topics.",
        "Imports split the content, but each new topic still requires an edit to the shared CLAUDE.md.",
        "Directory files load only for work in that directory, but these instructions apply to the whole repository.",
        "User-level files are personal and not shared through the repository."
      ],
      source: source("3.1", "Splitting large CLAUDE.md files into focused topic-specific files in .claude/rules/ (e.g., testing.md, api-conventions.md, deployment.md)"),
      docs: [
        { label: "Claude Code docs: Memory", url: "https://code.claude.com/docs/en/memory.md", quote: "Rules without [`paths` frontmatter](#path-specific-rules) are loaded at launch with the same priority as `.claude/CLAUDE.md`." }
      ]
    },
    {
      id: "core-d3-029",
      domain: "D3",
      objectives: ["O13"],
      scenario: "s5",
      question: "Your review standards live in .claude/rules/review.md with paths: [\"src/**/*\"], and developers who review locally get findings that follow them. The CI review runs claude -p \"Review the changes in this pull request\" from the repository root, and its findings ignore the standards in most runs. The CI trace shows Claude reading the pull request through git diff and commenting on it without opening any file under src/. The standards must apply to every review. What should you change?",
      options: [
        "Move the review standards into the project CLAUDE.md, or remove the paths field from the rule, so that they load at the start of every session.",
        "Widen the rule's pattern to paths: [\"**/*\"], so that the review standards match every file in the repository, not just those under src/.",
        "Paste the review standards into the CI job's prompt, so that the review receives them directly with every pull request.",
        "Tell the CI review to open every changed file with Read before commenting, so that the path-scoped rule is triggered for each file under src/."
      ],
      correct: [0],
      explanation: "A path-scoped rule loads only when Claude works with a matching file, and a review that reads only the diff never does, so the standards stay unloaded. Standards that must apply to every review belong in configuration that loads unconditionally, such as the project CLAUDE.md or a rule without paths. A wider pattern still depends on a file being opened, a pasted copy drifts from the repository version, and an instruction to open files first only makes loading likely, not certain.",
      optionExplanations: [
        "Unconditional project configuration loads the standards in every session, local or CI.",
        "Any pattern still loads only when a matching file is opened, which the diff-based review does not do.",
        "A pasted copy has to be kept in sync with the repository by hand.",
        "An instruction to open files makes loading probable, but the review can still skip it."
      ],
      source: source("3.3", "How path-scoped rules load only when editing matching files, reducing irrelevant context and token usage"),
      docs: [
        { label: "Claude Code docs: Memory", url: "https://code.claude.com/docs/en/memory.md", quote: "A path-scoped rule loads when Claude uses the Read, Write, or Edit tool on a matching file." }
      ]
    },
    {
      id: "core-d3-030",
      domain: "D3",
      objectives: ["O11"],
      scenario: "s5",
      question: "A nightly CI job runs claude -p \"Update the test snapshots after the dependency bump and run npm test\". It finishes in 40 seconds with exit code 0, but no file changes; the output ends with \"I couldn't edit the snapshot files because permission was denied.\" The job must update files only under tests/__snapshots__/, may run npm test, and must not do anything else. How should you change the invocation?",
      options: [
        "Add --dangerously-skip-permissions, so that the job can edit the snapshots and run the tests without any permission check.",
        "Pre-approve edits under tests/__snapshots__/ and the npm test command with --allowedTools, so that only these calls run without approval.",
        "Add --permission-mode acceptEdits, so that Claude Code accepts file edits automatically while everything else keeps its normal checks.",
        "Remove -p, so that Claude Code can ask for permission when it needs to edit a file, and let the job wait for the answer."
      ],
      correct: [1],
      explanation: "In print mode, a call that needs approval is denied when nothing approves it, so the job ran but could not edit. Pre-approving exactly the edits and the command the job needs lets it work unattended and keeps everything else denied. Skipping all checks removes every restriction, acceptEdits allows edits anywhere in the working directory and still leaves npm test unapproved, and without -p the job waits for input that never comes.",
      optionExplanations: [
        "Skipping permissions makes every action possible, which the job must not allow.",
        "Scoped pre-approval allows exactly the needed edits and command while other calls stay denied.",
        "acceptEdits allows edits outside the snapshot folder and does not approve npm test.",
        "Without -p the job waits for an answer that no one in CI will give."
      ],
      source: source("3.6", "Running Claude Code in CI with the -p flag to prevent interactive input hangs"),
      docs: [
        { label: "Claude Code docs: Headless mode", url: "https://code.claude.com/docs/en/headless.md", quote: "a call that needs approval is denied unless something approves it" }
      ]
    },
    {
      id: "core-d3-031",
      domain: "D3",
      objectives: ["O14"],
      scenario: "s2",
      question: "Your /security-audit skill tells Claude to act as a strict auditor: treat every input as hostile and flag anything that might be exploitable. Developers run it in the middle of a session and then continue normal work. Afterwards, Claude rejects ordinary changes as \"potentially exploitable\" and adds defensive checks to every later edit for the rest of the session. The audit needs only the files named in its arguments, and developers need the decisions made earlier in the session afterwards. What should you change?",
      options: [
        "Add an instruction at the end of the skill telling Claude to return to its normal behavior once the audit report is complete.",
        "Ask developers to run /clear after every audit, so that the rest of the session starts again from an empty conversation.",
        "Add context: fork to the skill's frontmatter, so that the audit runs in an isolated subagent and only its report comes back.",
        "Move the auditor instructions into the project CLAUDE.md under a security heading, so that Claude applies them consistently."
      ],
      correct: [2],
      explanation: "The auditor instructions stay in the main conversation after the skill runs, so they keep shaping later work. Running the skill in a forked subagent context keeps its instructions and intermediate reasoning out of the main session, and only the report returns. A closing instruction may or may not undo the persona, /clear throws away the session's useful context, and CLAUDE.md would make the strict persona permanent.",
      optionExplanations: [
        "A closing instruction relies on the model to drop a persona that is still in its context.",
        "/clear removes the auditor persona but also everything else the session had built up.",
        "A forked context isolates the auditor persona, and only the findings reach the main session.",
        "CLAUDE.md would apply the strict auditor behavior to every session."
      ],
      source: source("3.2", "The context: fork frontmatter option for running skills in an isolated sub-agent context, preventing skill outputs from polluting the main conversation"),
      docs: [
        { label: "Claude Code docs: Skills", url: "https://code.claude.com/docs/en/skills.md", quote: "Set to `fork` to run in a forked subagent context." },
        { label: "Claude Code docs: Skills", url: "https://code.claude.com/docs/en/skills.md", quote: "Once a skill loads, its content stays in context across turns" }
      ]
    },
    {
      id: "core-d3-032",
      domain: "D3",
      objectives: ["O16"],
      scenario: "s2",
      question: "Your team collects five requirements for its Claude Code setup. Which two can only be met reliably with hooks, rather than with CLAUDE.md, .claude/rules/, skills or permission rules? (Select 2)",
      options: [
        "Append every shell command Claude runs, with a timestamp, to an audit log file.",
        "Follow the team's naming conventions in every session, whatever file is being worked on.",
        "Load the Terraform conventions only while Claude works on .tf files.",
        "Reject any edit that adds a TODO comment without a ticket number in it.",
        "Offer a release checklist that the two release managers call up a few times a month."
      ],
      correct: [0, 3],
      explanation: "Hooks run code at fixed points, so an action happens every time instead of depending on Claude remembering it. Logging every shell command and checking the content of each edit for TODOs without ticket numbers both need that guarantee, and a permission rule can allow or deny a tool or path but cannot inspect what an edit adds. Conventions for all sessions belong in CLAUDE.md, conventions for one file type in a path-scoped rule, and an on-demand checklist in a skill.",
      optionExplanations: [
        "A hook on each shell command writes the log entry every time, without relying on Claude to do it.",
        "Conventions that apply everywhere belong in CLAUDE.md.",
        "File-type conventions belong in a path-scoped rule.",
        "Only a hook can inspect each edit's content and block it deterministically.",
        "An occasional, on-demand procedure fits a skill."
      ],
      source: source("1.5", "The distinction between using hooks for deterministic guarantees versus relying on prompt instructions for probabilistic compliance"),
      docs: [
        { label: "Claude Code docs: Hooks guide", url: "https://code.claude.com/docs/en/hooks-guide.md", quote: "certain actions always happen rather than relying on the LLM to choose to run them" }
      ]
    },
    {
      id: "core-d3-033",
      domain: "D3",
      objectives: ["O16"],
      scenario: "s2",
      question: "Your team is trimming its 1,000-line root CLAUDE.md, and each section must move to the mechanism that fits it best. Which two sections should become project skills? (Select 2)",
      options: [
        "Naming and error-handling conventions that apply to every file in the repository.",
        "The steps for adding a new payment provider integration, which the team needs about twice a year.",
        "Conventions for Storybook story files, which are spread across all feature folders.",
        "A checklist for writing a new database migration, used when someone creates one.",
        "One developer's reminder that Claude should explain code to them in German."
      ],
      correct: [1, 3],
      explanation: "Skills hold task-specific procedures that are loaded when someone needs them, so the payment-provider steps and the migration checklist fit. Conventions that apply everywhere stay in CLAUDE.md, conventions for story files spread across the repository belong in a path-scoped rule, and one developer's personal preference belongs in their user-level CLAUDE.md.",
      optionExplanations: [
        "Conventions for every file belong in CLAUDE.md.",
        "A rare, task-specific procedure fits a skill invoked when needed.",
        "Conventions for one file type spread across folders fit a path-scoped rule.",
        "A checklist used only when creating a migration fits an on-demand skill.",
        "A personal preference belongs in that developer's user-level CLAUDE.md."
      ],
      source: source("3.2", "Choosing between skills (on-demand invocation for task-specific workflows) and CLAUDE.md (always-loaded universal standards)")
    },
    {
      id: "core-d3-034",
      domain: "D3",
      objectives: ["O12"],
      scenario: "s2",
      question: "You are working through several problems with Claude Code. For which two should you describe all the issues together in one detailed message, rather than fixing them one at a time? (Select 2)",
      options: [
        "A typo in an error message in the billing module, and an outdated link in the README file.",
        "Three bugs in the shared date-range filter, whose fixes all change how range boundaries are handled.",
        "A caching layer for an unfamiliar external API, where you have not yet decided on expiry rules.",
        "A data model change that requires matching changes to the API responses and to the database migration.",
        "A failing unit test whose stack trace points to one missing null check."
      ],
      correct: [1, 3],
      explanation: "Issues belong in one message when their fixes interact, so that Claude can design one consistent change instead of undoing earlier fixes. Filter bugs that all touch boundary handling, and a model change that ripples into the API and the migration, both interact. Unrelated small fixes and a clear single bug are faster one at a time, and an unfamiliar design with open decisions calls for Claude to ask questions first.",
      optionExplanations: [
        "Two unrelated small fixes do not interact and can be handled separately.",
        "Fixes that all change boundary handling interact and should be designed together.",
        "Open design decisions in an unfamiliar area call for an interview first.",
        "The model, API and migration changes depend on each other and belong together.",
        "A single clear bug needs no bundled description."
      ],
      source: source("3.5", "Addressing multiple interacting issues in a single detailed message when fixes interact, versus sequential iteration for independent issues")
    },
    {
      id: "core-d3-035",
      domain: "D3",
      objectives: ["O16"],
      scenario: "s2",
      question: "A new developer asks which instruction files Claude Code loads for everyone on the team, in every session, regardless of which files they work on. Which two of these files does that apply to? (Select 2)",
      options: [
        "The tech lead's ~/.claude/CLAUDE.md, which contains the team's review standards.",
        "The CLAUDE.md file at the root of the repository.",
        "A .claude/rules/security.md file in the repository without a paths field in its frontmatter.",
        "A .claude/rules/ios.md file in the repository with paths: [\"mobile/**/*.swift\"].",
        "A CLAUDE.md file in packages/api/ that holds the API team's conventions."
      ],
      correct: [1, 2],
      explanation: "Project-level instructions in the repository load for everyone at the start of each session: the root CLAUDE.md, and rule files without a paths field. A user-level file applies only to its owner, a rule with a paths pattern loads only when matching files are worked on, and a subdirectory CLAUDE.md loads only when Claude works in that directory.",
      optionExplanations: [
        "A user-level file applies only to the person whose home directory it is in.",
        "The root CLAUDE.md is project-level and loads for everyone.",
        "A rule without paths loads at launch for every session.",
        "A rule with paths loads only for matching files.",
        "A subdirectory CLAUDE.md loads only when Claude works in that directory."
      ],
      source: source("3.1", "The CLAUDE.md configuration hierarchy: user-level (~/.claude/CLAUDE.md), project-level (.claude/CLAUDE.md or root CLAUDE.md), and directory-level (subdirectory CLAUDE.md files)"),
      docs: [
        { label: "Claude Code docs: Memory", url: "https://code.claude.com/docs/en/memory.md", quote: "Rules without [`paths` frontmatter](#path-specific-rules) are loaded at launch with the same priority as `.claude/CLAUDE.md`." }
      ]
    }
  ]);
})();
