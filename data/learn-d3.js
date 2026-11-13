/* Study notes, domain D3. Same shape and rules as data/learn.js. Sources: docs cached 20 Oct 2026. */
window.LEARN = window.LEARN || {};
window.LEARN.D3 = {
  checked: "2026-10-20",
  topics: [
    {
      id: "3.1",
      title: "CLAUDE.md hierarchy and organisation",
      points: [
        "Claude Code loads CLAUDE.md files from the current directory and every directory above it. Subdirectory files load when Claude works with files in that subdirectory.",
        "Where a file lives decides who gets it. ~/.claude/CLAUDE.md is personal and applies to all your projects, only for you. Project instructions in the repository reach the team through version control.",
        "A new teammate who does not get an instruction often has it in their user-level file instead of the project one.",
        "@path/to/file imports another file. Imports are loaded at launch together with the file that references them. This keeps CLAUDE.md modular, for example by importing the standards of one package.",
        "Split a large file into topic files under .claude/rules/. Rules without a paths field load at launch like CLAUDE.md.",
        "CLAUDE.md is context, not enforcement. To block an action no matter what Claude decides, use a PreToolUse hook."
      ],
      docs: [
        { label: "Claude Code: memory", url: "https://code.claude.com/docs/en/memory.md" },
        { label: "Claude Code: hooks guide", url: "https://code.claude.com/docs/en/hooks-guide.md" }
      ],
      traps: [
        { wrong: "Put the team's coding standards in ~/.claude/CLAUDE.md.", why: "That file is only yours. Teammates do not get it. Project-level instructions go in the repository." },
        { wrong: "One huge CLAUDE.md is easiest to keep in order.", why: "Split it by topic with @imports or files in .claude/rules/. Long, mixed files are harder to follow and to keep consistent." },
        { wrong: "Write \"never edit .env\" in CLAUDE.md to guarantee it.", why: "Claude treats CLAUDE.md as context. A hard guarantee needs a hook." },
        { wrong: "Copy the same text into every package's CLAUDE.md.", why: "Import the shared file with @path so there is one place to change." }
      ],
      current: "The Exam Guide names the /memory command for checking which files were loaded. The docs say /context shows which CLAUDE.md and rules files loaded at launch, and use /memory for browsing memory files and the auto memory switch."
    },
    {
      id: "3.2",
      title: "Slash commands and skills",
      points: [
        "A skill is a folder with a SKILL.md file whose frontmatter configures it. Project skills live in .claude/skills/ and are shared through version control, personal skills in ~/.claude/skills/ are yours across projects.",
        "Skills are loaded on demand for a task-specific workflow. CLAUDE.md is always in context, so keep only universal standards there.",
        "context: fork runs the skill in a forked subagent. Use it for verbose or exploratory work, so the output stays out of your main conversation. That subagent does not see your conversation history, so the skill text must stand on its own.",
        "argument-hint shows what arguments to give when you invoke the skill.",
        "allowed-tools lists tools Claude can use without asking during the turn that invokes the skill.",
        "To customise a team skill for yourself, make a personal one under another name. When names clash, the personal skill wins over the project one."
      ],
      docs: [
        { label: "Claude Code: skills", url: "https://code.claude.com/docs/en/skills.md" },
        { label: "Claude Code: permissions", url: "https://code.claude.com/docs/en/permissions.md" }
      ],
      traps: [
        { wrong: "Put a verbose codebase-analysis workflow into CLAUDE.md.", why: "CLAUDE.md is always loaded. A skill is loaded on demand, and context: fork keeps its output out of the main session." },
        { wrong: "Create a team command in ~/.claude/commands/.", why: "That is personal. For the whole team, put it in the project and check it in." },
        { wrong: "Use allowed-tools to make a skill unable to use other tools.", why: "It only grants permission without asking. Other tools stay available, and your permission settings still apply." },
        { wrong: "Edit the shared team skill for your own taste.", why: "That changes it for everyone. Make a personal variant with a different name." }
      ],
      current: "The docs say custom commands have been merged into skills: a file in .claude/commands/ and a skill in .claude/skills/ both create the same slash command, and commands still work. New work should use skills. The Exam Guide's wording \"restrict tool access\" for allowed-tools is looser than the docs, which describe it as pre-approving tools."
    },
    {
      id: "3.3",
      title: "Path-specific rules",
      points: [
        "A rule file in .claude/rules/ can have a paths field in its YAML frontmatter with glob patterns. Such a rule applies only when Claude works with a matching file.",
        "This saves context: rules for Terraform do not load while you edit a React component. Rules without paths load always.",
        "Glob patterns match by file type anywhere in the tree, for example **/*.test.tsx for all test files, even when they are scattered over many directories.",
        "A CLAUDE.md in a subdirectory only covers that directory. Use a path-scoped rule when a convention spans several directories."
      ],
      docs: [
        { label: "Claude Code: memory (rules)", url: "https://code.claude.com/docs/en/memory.md" }
      ],
      traps: [
        { wrong: "Put test conventions in a CLAUDE.md in each directory that has tests.", why: "Tests are spread out. One rule with a glob such as **/*.test.tsx covers them all." },
        { wrong: "Write all conventions into one always-loaded file.", why: "Everything loads every time. Path-scoped rules load only when matching files are used." },
        { wrong: "A rule file without paths is only loaded for matching files.", why: "Without paths it loads unconditionally for all files." }
      ],
      current: "The docs say a path-scoped rule loads when Claude uses Read, Write or Edit on a matching file. The Exam Guide says when editing matching files, which is narrower."
    },
    {
      id: "3.4",
      title: "Plan mode or direct execution",
      points: [
        "Plan mode lets Claude read files and propose a plan without making edits until you approve. It separates exploring from doing.",
        "Use it when you are unsure about the approach, when the change touches several files, or when you do not know the code well: restructuring services, a library migration across many files, choosing between integration approaches.",
        "Skip it when the scope is clear and the fix is small. A good test from the docs: if you could describe the diff in one sentence, skip the plan.",
        "A common combination: plan mode to investigate and agree on an approach, then direct execution to carry it out.",
        "The Explore subagent does verbose discovery work in its own context and returns a summary, so the exploration does not fill your main conversation."
      ],
      docs: [
        { label: "Claude Code: best practices", url: "https://code.claude.com/docs/en/best-practices.md" },
        { label: "Claude Code: common workflows", url: "https://code.claude.com/docs/en/common-workflows.md" },
        { label: "Claude Code: subagents", url: "https://code.claude.com/docs/en/sub-agents.md" }
      ],
      traps: [
        { wrong: "Always start in plan mode.", why: "For a small, well-scoped change a plan is overhead. Direct execution is the right choice there." },
        { wrong: "Let Claude start coding at once on a large migration.", why: "It may solve the wrong problem. Explore and plan first, then execute." },
        { wrong: "Read all the files in the main conversation to understand the code.", why: "Use the Explore subagent or narrow questions so the discovery output stays out of your main context." },
        { wrong: "Stay in plan mode while implementing.", why: "Plan mode makes no edits. After approving the plan, switch to executing it." }
      ],
      current: "The docs add that the built-in Explore and Plan subagents start without your CLAUDE.md files, to keep research fast and cheap."
    },
    {
      id: "3.5",
      title: "Iterative refinement",
      points: [
        "When a prose description is understood inconsistently, show two or three concrete input and output examples. The docs call examples one of the most reliable ways to steer the output.",
        "Give Claude a check it can run, such as tests or a build. Write the tests first, then iterate by sharing the failures.",
        "For something new or large, let Claude interview you first. It asks about technical choices, edge cases and trade-offs you may not have thought of.",
        "Name specific files, constraints and example patterns. Claude can infer intent but cannot read your mind.",
        "Several problems that affect each other belong in one detailed message. Independent problems can be fixed one after the other."
      ],
      docs: [
        { label: "Claude Code: best practices", url: "https://code.claude.com/docs/en/best-practices.md" },
        { label: "Prompting best practices", url: "https://platform.claude.com/docs/en/build-with-claude/prompt-engineering/claude-prompting-best-practices.md" }
      ],
      traps: [
        { wrong: "Describe the transformation in more and more prose.", why: "If the results stay inconsistent, show two or three input and output examples." },
        { wrong: "Fix interacting problems one by one in separate messages.", why: "Fixes that affect each other should be given together, or each fix may undo another." },
        { wrong: "Implement first and think about edge cases later.", why: "Test cases or an interview up front surface edge cases before you build on a wrong assumption." }
      ],
      current: null
    },
    {
      id: "3.6",
      title: "Claude Code in CI/CD",
      points: [
        "-p (or --print) runs Claude Code non-interactively. Without it a pipeline can hang waiting for input.",
        "--output-format json together with --json-schema gives output that matches a schema. A pipeline can then post the findings as inline comments.",
        "CLAUDE.md in the repository is how CI-run Claude gets project context: testing standards, fixtures, review criteria.",
        "A fresh instance reviews better than the session that wrote the code. The docs note that a fresh context helps because Claude will not be biased toward code it just wrote.",
        "When you review again after new commits, include the earlier findings and ask for only new or still-open issues, to avoid duplicate comments.",
        "Give existing test files as context, so generated tests do not repeat scenarios already covered.",
        "In print mode, a call that needs approval is denied unless something approves it. Limits such as maximum turns and maximum spend exist for print mode."
      ],
      docs: [
        { label: "Claude Code: headless mode", url: "https://code.claude.com/docs/en/headless.md" },
        { label: "Claude Code: CLI reference", url: "https://code.claude.com/docs/en/cli-reference.md" },
        { label: "Claude Code: GitHub Actions", url: "https://code.claude.com/docs/en/github-actions.md" }
      ],
      traps: [
        { wrong: "Run claude in the pipeline without -p.", why: "It waits for interactive input and the job hangs." },
        { wrong: "Parse the review text with a regular expression.", why: "Use --output-format json with --json-schema to get structured, machine-readable findings." },
        { wrong: "Let the session that wrote the code also review it.", why: "It is biased toward its own work. Use a separate, fresh instance for the review." },
        { wrong: "Re-run the review after a new commit with no history.", why: "It will repeat old comments. Pass the earlier findings and ask for new or unaddressed issues only." }
      ],
      current: "The docs describe a --bare option for scripts. It skips auto-discovery of hooks, skills, MCP servers and CLAUDE.md for the same result on every machine. That matters when you also rely on CLAUDE.md for CI context, so decide on purpose."
    }
  ],
  guides: [
    {
      title: "Where does an instruction file live?",
      headers: ["File", "Who gets it"],
      rows: [
        ["~/.claude/CLAUDE.md", "Only you, in all projects"],
        ["Project CLAUDE.md (root or .claude/)", "The team, through version control"],
        ["CLAUDE.md in a subdirectory", "Loaded when Claude works with files in that subdirectory"],
        [".claude/rules/ without paths", "Everyone, loaded at launch like CLAUDE.md"],
        [".claude/rules/ with paths", "Loaded only when Claude uses a matching file"]
      ]
    },
    {
      title: "Skill or CLAUDE.md?",
      headers: ["", "Skill", "CLAUDE.md"],
      rows: [
        ["Loaded", "On demand, for a task", "Always, at launch"],
        ["Fits", "A workflow for a specific task, possibly with verbose output", "Standards that apply to everything"],
        ["Isolation", "context: fork keeps output out of the main session", "None, it is always in context"]
      ]
    },
    {
      title: "Path-scoped rule or subdirectory CLAUDE.md?",
      headers: ["Situation", "Use"],
      rows: [
        ["Convention covers one directory", "CLAUDE.md in that directory"],
        ["Convention covers a file type spread over many directories", "Rule with a paths glob such as **/*.test.tsx"],
        ["Convention applies everywhere", "Project CLAUDE.md or a rule without paths"]
      ]
    },
    {
      title: "Plan mode or direct execution?",
      headers: ["", "Plan mode", "Direct execution"],
      rows: [
        ["Fits", "Uncertain approach, many files, unfamiliar code, architecture choices", "Clear scope, small fix, a diff you can describe in one sentence"],
        ["Result", "A plan to approve before any edit", "The change itself"]
      ]
    },
    {
      title: "Examples, tests or interview?",
      headers: ["Problem", "Technique"],
      rows: [
        ["Prose is read in different ways", "Two or three input and output examples"],
        ["You need a way to know it works", "Tests first, then share the failures"],
        ["Unfamiliar or large feature, unknown trade-offs", "Let Claude interview you first"],
        ["Several problems that affect each other", "One detailed message with all of them"]
      ]
    }
  ],
  practice: [
    { id: "d3-claude-md", text: "Write a project CLAUDE.md and a personal ~/.claude/CLAUDE.md. Start a session and check which files loaded." },
    { id: "d3-import", text: "Split a long CLAUDE.md with an @import of a standards file." },
    { id: "d3-rule", text: "Create a rule in .claude/rules/ with a paths glob for test files and check that it loads only when you work with a test file." },
    { id: "d3-skill", text: "Write a skill with SKILL.md frontmatter, including argument-hint, and invoke it." },
    { id: "d3-fork", text: "Make a skill with context: fork that produces long output and see that your main conversation stays short." },
    { id: "d3-plan", text: "Do one task in plan mode and one small fix with direct execution. Note the difference." },
    { id: "d3-examples", text: "Give Claude a transformation with two input and output examples instead of a description." },
    { id: "d3-interview", text: "Ask Claude to interview you before building a small feature." },
    { id: "d3-ci", text: "Run claude -p with --output-format json and --json-schema in a script and read the structured result." }
  ]
};
