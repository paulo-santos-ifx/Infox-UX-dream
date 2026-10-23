---
name: custom-protocol
description: Orchestrates a full engineering workflow driven by requirements, executable specs, tests, refactoring, and code review, with the human as the thinking mind and the AI as the builder. Use when implementing features, fixing bugs, starting projects from scratch, defining architecture, creating ADRs, writing tests before code, or when the user wants an XP/TDD-style process with AI. Requires Lexomni for guidelines and Context7 for library, framework, and API documentation.
---

# Custom Protocol

## Objective

Apply a complete `requirement -> specification -> tests -> code -> refactor -> validation -> critical code review` workflow, inspired by XP/TDD and adapted for a human + AI pair.

Roles:
- Human: the thinking mind, owner of business rules, priorities, trade-offs, and acceptance.
- AI: builder, technical executor, synthesizer, implementer, and reviewer.

Core principle:
- No spec, no test.
- No test, no code.
- No refactoring, no real green.

> **CRITICAL — Protocol Adherence:**
> The AI must read this entire skill before taking any action. Steps are sequential and non-skippable. The excitement of a detailed requirement does **not** authorize jumping ahead. No matter how clear the sprint context seems, every step must be executed in order — especially in sprint mode. Skipping a step, even with good intentions, breaks the protocol and invalidates the output.
> **When in doubt: stop, re-read the current phase, and complete it before advancing.**

## When to Use

Use this skill when:
- the user asks for feature implementation;
- the user asks for a bug fix;
- the project is at the beginning and still has no stack or ADRs;
- the user wants to follow TDD, XP, spec-driven development, or test-first;
- the task requires architectural definition before coding;
- a full requirement > code > improvement cycle is needed.

## Mandatory Rules

0. **Read this skill in full before doing anything.** Do not act on partial context.
1. Consult Lexomni before planning or implementing.
   1b. **Consult the project's own skills before writing ADRs.** The repository's `.claude/skills/`
   encodes decisions and scars that are not in the code or in git history, and they routinely
   contradict choices made from scratch. Sweep them in Phase 0.2 and again before Phase 0.7. See
   Phase 2.0.
2. Consult Context7 whenever a library, framework, API, configuration, or stack-dependent code generation is involved.
3. Confirm and enrich the requirement with the human before writing tests or code.
4. Correlate the task with existing ADRs.
5. ADRs are **mandatory**: at least one ADR must exist before structural implementation begins. If none exist, build the minimum stack rules, guidelines, and ADRs with the human before proceeding.
6. Record the plan and steps before execution.
7. Write tests before production code.
8. Review the spec and tests with the human before implementation when the change is not trivial.
9. Code only what is necessary to satisfy the tests.
10. Refactor before considering the delivery complete.
11. Run critical code review at the end.
    11b. **Run the security scan when the change has a surface** — `security-scan/SKILL.md`, Phase 13: dependencies added or upgraded, a real form or input handling, a third-party integration or script, or any server code. A purely presentational change (styles, layouts, static content) is exempt.
12. For any frontend task: read and apply **both** `frontend-master/SKILL.md` (how it looks) and `frontend-guidelines/SKILL.md` (how it behaves and what it says) before writing UI code; apply `design-motion-principles/SKILL.md` whenever the task creates or changes motion (transitions, hover states, micro-interactions, enter/exit animations); run `web-design-guidelines/SKILL.md` during critical code review. The full chain and its order are in the Cascade section of `frontend-master/SKILL.md`.
13. **Never commit without the human approving the message, never push, and never commit on the
   default branch outside a `chore`.** See the Commit Policy section.
14. **Every settled way of doing things becomes a skill.** When a business rule or an
    implementation is complete, tested end-to-end, and signed off by the human, propose — or write —
    the skill that encodes it. See the Skill Harvesting section.
15. **Sprint mode — strict sequential execution:** in sprint mode, each step in the Phase 0 checklist is a hard gate. The AI must complete and confirm each step with the human before advancing to the next. A rich or detailed requirement does not justify skipping or merging steps. Collecting data during dialogue does not mean steps are done — they must be explicitly executed, confirmed, and checked off.
16. **Sprint mode — tasks are written when they become active, never all up front.** Planning
    produces the sprint roadmap in the README (one line per task); the task file and its spec are
    written only when that task becomes the active one. See the Incremental Tasks section.

## Cascading Skills

This skill is the main orchestrator. When a phase needs deeper specialization, load the skills below in cascade using relative paths:
- `context7-mcp/SKILL.md` — current documentation for libraries, frameworks, and APIs.
- `large-scale-refactor/SKILL.md` — large refactors, oversized files, structural migrations, and modularization.
- `critical-code-review/SKILL.md` — cold, independent audit after implementation/refactoring.
- `security-scan/SKILL.md` — security sweep before delivery: secret exposure, third-party scripts, input handling, disclosure, dependency vulnerabilities. Produces `security-scan.md` and hands every finding to the human to decide. **Mandatory in Phase 13 when the change has a surface (rule 11b).**
- `backend-guidelines/SKILL.md` — how the backend **behaves**, independent of stack. This project has no backend; load it only if a server, an API route, or a data layer is ever introduced.
- `frontend-master/SKILL.md` — production-grade frontend implementation: components, pages, layouts, dashboards, and any UI code. **Mandatory** whenever the task touches the frontend.
- `frontend-guidelines/SKILL.md` — how the frontend **behaves and communicates**, independent of stack: server/client rendering boundary, separation of responsibilities, end-user copy, loading/empty/error/partial states, what a failure discloses, accessibility floor. **Mandatory alongside `frontend-master` on every frontend task** — that one covers how it looks, this one covers how it works.
- `design-motion-principles/SKILL.md` — motion and interaction design (Emil Kowalski, Jakub Krehel, Jhey Tompkins). Two modes: **Create** builds components with purposeful motion, **Audit** reviews existing animations and emits an HTML report with looping demos. **Mandatory** whenever the task creates or changes UI motion: transitions, hover states, micro-interactions, enter/exit animations, in React, Framer Motion, CSS, or HTML.
- `web-design-guidelines/SKILL.md` — Web Interface Guidelines audit. Apply during critical code review for any UI change.
- `generating-end-to-end-tests/SKILL.md` — generate E2E tests (Playwright, Cypress, Selenium) for multi-step user workflows. Load on-demand in Phase 7 when the change is exercised through a browser flow rather than a unit boundary.
- `llm-council/SKILL.md` — multi-perspective decision support. Runs any high-stakes question, architectural trade-off, or strategic decision through 5 independent AI advisors (Contrarian, First Principles Thinker, Expansionist, Outsider, Executor) followed by anonymous peer review and a chairman synthesis. Load on-demand whenever there are genuine competing options and the cost of a wrong call is high. Do not invoke for trivial choices or questions with one right answer.

**These subskills live INSIDE this skill's directory** (`custom-protocol/<name>/SKILL.md`), not at
the top level of `.claude/skills/`. Look there before declaring one missing — a review that skips
them because `ls .claude/skills` did not list them is a protocol violation, not a workspace gap.

Rule:
- do not replace Custom Protocol with these subskills;
- use the subskills as phase specializations;
- always return to this workflow as the main protocol.

## Official Workflow

Copy this checklist and keep progress updated. In sprint mode, items 7a to 16b repeat once per task:
tick them here for the sprint as a whole, and track each task's pass through them in the Progresso
section of its task file.

```text
Custom Protocol Progress
- [ ] 0.   Escolher modo (sprints ou fluxo direto)
- [ ] 0.1. [Sprints] Coletar requisito inicial do usuário
- [ ] 0.2. [Sprints] Aprofundar requisito via diálogo
- [ ] 0.3. [Sprints] Propor nome da sprint (numeração sequencial primeiro, até 3 palavras)
- [ ] 0.4. [Sprints] Criar estrutura /.sprints/<NN> <Nome>/{tasks/, specs/, ADRs/, README.md, PRD.md}
- [ ] 0.5. [Sprints] Preencher PRD.md com requisito aprofundado
- [ ] 0.6. [Sprints] Preencher README.md com o rascunho do roteiro (só linhas — nenhum task-NN.md ainda)
- [ ] 0.6b. [Sprints] Varrer skills locais do repositório (obrigatório — ver Phase 2.0)
- [ ] 0.7. [Sprints] Criar ADRs mínimos da sprint (obrigatório — ver Phase 0.7)
- [ ] 1. Entender o requisito
- [ ] 2. Confirmar detalhes com o humano
- [ ] 2.5 Varrer skills locais do repositório
- [ ] 3. Consultar Lexomni
- [ ] 4. Consultar Context7 se houver stack/lib/API
- [ ] 5. Correlacionar com ADRs
- [ ] 6. Criar ou ajustar ADRs/guidelines se necessario
- [ ] 7. Gerar plano de acao ([Sprints] fechar o roteiro e aprovar com o humano)
- [ ] 7a. [Sprints] Ativar a próxima task: revisar o roteiro e só então escrever tasks/task-NN.md (ver Incremental Tasks)
- [ ] 8. Registrar steps
- [ ] 9. Escrever spec executavel
- [ ] 10. Escrever testes
- [ ] 11. Revisar spec/testes com o humano
- [ ] 12. Rodar SÓ os specs afetados (por caminho explícito) e confirmar RED
- [ ] 13. Implementar
- [ ] 14. Refatorar
- [ ] 15. Rodar SÓ os specs afetados, lint, typecheck, build
- [ ] 16. Repetir loop ate GREEN
- [ ] 16b. [Sprints] Fechar a task ativa (Registro + README) e voltar ao 7a até o roteiro acabar
- [ ] 17. Fazer critical code review
- [ ] 17b. Rodar o security scan e gerar security-scan.md, se a mudança tiver superfície (ver regra 11b)
- [ ] 17c. Decidir com o humano cada achado: corrigir agora ou aceitar o risco
- [ ] 18. Entregar com resumo e riscos residuais
- [ ] 19. Colher a skill da entrega (ver Skill Harvesting)
```

## Phase 0: Sprint Setup

> **STRICT SEQUENTIAL EXECUTION — Sprint Mode**
> Each step below is a **hard gate**. The AI must complete each step fully, produce its output, and confirm with the human before advancing. Steps must not be merged, abbreviated, or implicitly satisfied by context gathered in dialogue. Even when the human provides rich upfront detail, every step must still be explicitly executed in sequence. The checklist in the Official Workflow is the single source of truth for progress — mark each item only after the step is truly complete.

Before starting the main workflow, ask the human:

> "Deseja usar o modo sprints para organizar este trabalho?"

### If no — skip to Phase 1.

### If yes — execute the following sequence:

**Step 0.1 — Collect the initial requirement**

Ask the human for a brief description of what needs to be built. One or two sentences is enough at this point.

**Step 0.2 — Deepen the requirement via dynamic dialogue**

Conduct an open, adaptive dialogue — not a fixed questionnaire. Read each answer and decide what to ask next based on what is still unclear. The goal is to build a shared understanding, not to fill a form.

The dialogue must converge on at minimum:
- the real problem being solved;
- who the users or stakeholders are;
- the expected behaviors and outcomes;
- hard constraints (technical, time, business);
- what is explicitly out of scope;
- what "done" looks like.

Keep asking until those points are covered. If the human cannot answer something, record it as an open risk in the PRD and move on. Never ask more questions than necessary — stop as soon as the picture is clear enough to write the PRD.

**Decision gate — LLM Council:** if the human is genuinely torn between two or more product directions, positioning angles, or scope bets where the cost of a wrong call is high, load `llm-council/SKILL.md` and run the council before writing the PRD. The council output informs the direction, not replaces the human's final call.

**Step 0.3 — Propose a sprint name**

Based on the deepened requirement, propose a name for the sprint folder. Rules:
- **The number comes first**, then a single space, then the name.
- The number is sequential: the next one after the highest folder in `/.sprints/`.
- The name has **up to 3 words**, each starting with a capital letter, separated by single spaces.
- The name must reflect the core subject of the sprint.
- Examples: `12 Google Analytics`, `3 User Auth`, `47 Wallet Core SDK`, `8 Dark Mode`.

Confirm the name with the human before creating any folder.

**Step 0.4 — Create the sprint folder structure**

After name confirmation, create the following structure at the project root:

```
/.sprints/
  <NN> <Sprint Name>/          ← número sequencial primeiro, nome com até 3 palavras
    tasks/        ← vazia até a primeira ativação (ver Incremental Tasks)
    specs/
    ADRs/
    README.md     ← orchestration index (see template)
    PRD.md        ← product requirements document (see template)
```

**Step 0.5 — Fill PRD.md**

Use the deepened requirement from Step 0.2 to populate `PRD.md` using the fixed template in `templates.md`.

**Step 0.6 — Fill README.md**

Create the initial `README.md` using the sprint orchestration template in `templates.md`, with a
**draft of the sprint roadmap**: one row per planned task — number, title, one-line objective, what
it depends on, status 🔲. The Task and Spec columns stay without links: no `task-NN.md` and no
`spec-NN.md` exist yet. The draft is not approved here: the skill sweep (0.6b), the ADRs (0.7) and
the consultations of Phase 2 still change it. It is closed and approved in Phase 4. Until then,
edits to the draft are not roadmap changes and do not go in the roadmap-changes table. See the
Incremental Tasks section.

**Rule — README.md is a live document and a checkpoint gate:**

Every time a task is activated, link its file in its roadmap row, and link its spec when the spec
is written; every time an approved roadmap row changes, record it in the README's roadmap-changes
table; every time an ADR is created, link it.
The README is the single source of truth for sprint navigation.

Before moving between the phases of the active task (spec → tests → implementation → refactor),
update the Progresso section of its task file; before moving between sprint gates (roadmap approved
→ tasks done → review → delivery), update the checkpoint section in `README.md`. A phase must not
start until its predecessor is marked complete.

**Step 0.7 — Create mandatory sprint ADRs**

ADRs are **mandatory** for every sprint. Before any implementation begins, create at minimum one ADR that captures the most relevant architectural decision of the sprint. Rules:
- Create ADRs inside `.sprints/<Sprint Name>/ADRs/` as `adr-01.md`, `adr-02.md`, etc.
- Use the ADR Quick Start template from `templates.md`.
- The ADR must cover a real decision made during sprint planning — stack choice, data model, integration pattern, contract policy, or structural trade-off.
- If no structural decision is evident, create an ADR that records the "definition of done" and testing strategy for the sprint.
- Do not proceed to Phase 1 until at least one ADR is created and linked in the README.

The sprint `README.md` is the only board: there is no issue tracker in this workflow.

---

## Phase 1: Understand the Requirement

Before any code:
1. Rewrite the request in behavioral terms.
2. Identify the objective, constraints, success cases, error cases, and out-of-scope items.
3. If context is missing, ask the human.

Minimum questions:
- What real problem needs to be solved?
- What is the expected behavior?
- What counts as done?
- Are there stack, architecture, or UX constraints?
- Which edge cases and failure cases matter?

If the task is ambiguous, stop and clarify before moving forward.

## Phase 2: Consult Required Sources

### 2.0 Project Skills — MANDATORY

Before Lexomni and Context7, sweep the skills that live inside the repository. They are the
highest-signal source available, because they record decisions and regressions specific to this
codebase.

Procedure:
1. List every skill directory in the repository, including the subskills of this one:
   `ls -d .claude/skills/*/ .claude/skills/custom-protocol/*/`
2. Read the `description` frontmatter of each — it carries explicit TRIGGER/SKIP guidance.
3. Open in full every skill whose TRIGGER matches the sprint's domain.
4. Record in the sprint README which skills were consulted and **what each one changed**
   in the decision. A skill that was read and changed nothing is still worth listing.

Never write an ADR before this sweep. A well-reasoned decision made without these skills is
still likely to be the wrong decision for this codebase.

### 2.1 Lexomni

Always consult Lexomni before planning or implementing to gather:
- user guidelines;
- architectural principles;
- refactoring, TDD, XP, DX, and maintainability material;
- process patterns.

Goal:
- avoid improvising the process;
- align execution with the defined guidelines;
- ground the approach in explicit references.

### 2.2 Context7

Always consult Context7 when there is:
- a framework;
- a library;
- a third-party API;
- setup/configuration;
- stack-dependent code generation.

Mandatory flow:
1. `resolve-library-id`
2. choose the best matching library
3. `query-docs`
4. use the returned documentation in the implementation

Never rely on memory alone for framework/API details.

Read and follow: `context7-mcp/SKILL.md`

## Phase 3: Correlate with ADRs

ADRs are **mandatory**. There must be at least one ADR in scope before implementation begins. This is not optional — skip only if Phase 0.7 already produced the required ADRs for the current sprint.

Before coding:
1. Look for existing ADRs.
2. Identify whether the task:
   - follows an existing ADR;
   - needs an exception;
   - requires a new ADR.
3. If a new structural decision is being made, create the ADR now and link it in the sprint README.

**Decision gate — LLM Council:** when multiple architectural approaches are on the table and the trade-offs are non-obvious (e.g., monorepo vs. polyrepo, REST vs. GraphQL, data model choices with long-term consequences), load `llm-council/SKILL.md` before committing to an ADR. The council pressure-tests the options; the chosen direction becomes the ADR.

If there are no ADRs yet:
1. Stop — do not proceed to implementation.
2. Align with the human on:
   - stack;
   - architectural guidelines;
   - organization rules;
   - quality criteria;
3. Create the minimum ADRs before shaping the implementation.

For greenfield projects, never skip the minimum definition of:
- stack;
- testing strategy;
- folder structure;
- contract policy;
- component/service/hook policy;
- definition of done.

## Phase 4: Generate the Action Plan

Produce a plan before implementing.

The plan must contain:
- summarized understanding of the requirement;
- architectural dependencies;
- affected files/layers;
- testing strategy;
- implementation steps;
- risks;
- final validations.

In sprint mode the plan works at two levels. The sprint-level plan is the roadmap in the README:
which tasks, in which order, depending on what. The detailed plan of a task — its steps, the files
it touches, its acceptance criteria — is written in its task file when it becomes active, not here.
Do not detail a task that is not active yet.

**Sprint mode — close and approve the roadmap here.** Turn the draft from Step 0.6 into the final
roadmap with what the skill sweep, the ADRs and the consultations taught, and get the human's
approval. From this point every change to a row is a roadmap change (see Incremental Tasks).

If the task is large, get human approval before proceeding.

**Decision gate — LLM Council:** if the plan involves a genuinely uncertain approach — multiple valid implementation strategies with real trade-offs, or a high-risk architectural move — load `llm-council/SKILL.md` to pressure-test the plan before execution. Skip this gate for straightforward tasks with a clear path.

If the change involves:
- large files;
- modularization;
- duplication reduction;
- architectural migration;
- multi-step refactoring;

read and apply: `large-scale-refactor/SKILL.md`

## Phase 5: Record the Steps

Record execution steps using the available task tool. If none exists, maintain a textual checklist.

The record must show:
- what is in progress;
- what is pending;
- what is completed;
- what depends on a human answer.

## Incremental Tasks — Sprint Mode (checklist 7a)

The roadmap is written up front; each task is written when it starts. (7a is an item number
of the Official Workflow checklist, not a phase: it runs after Phase 5 and before Phase 6.
Registro, Contexto na ativação and Progresso are section names of the Task template, kept in the
team's language.) Building a sprint discovers
things — a contract that does not fit, a library that behaves differently, a rule the human only
names when they see the screen. Task files written all at once go stale as soon as the first of
those lands: they need rewriting, they drift from the code, and the ones nobody rewrote mislead the
agent that reads them later.

### What exists before the first task

- the PRD and the minimum ADRs;
- the roadmap in the README, approved in Phase 4: one row per task with number, title, one-line
  objective, dependencies and status. A row is a promise of scope, not a design.

Nothing else. No `task-NN.md` and no `spec-NN.md` for a task that is not active.

A sprint that started before this rule keeps the task files it has. At its next activation, its
remaining task files count as the roadmap rows, and each is reviewed and rewritten when it becomes
active. Those files are not a violation; writing new ones ahead is.

### Activating a task

A task becomes active when the previous one is closed. In order:
1. **Review the roadmap against what the closed tasks taught.** Read their Registro sections and the
   code as it is now. Change, split, merge, reorder, drop or add rows as needed, and record every
   change in the README's roadmap-changes table with its reason. When a change alters scope the
   human approved — a dropped feature, a new one, a different order of delivery — ask before
   applying it.
2. **Write `tasks/task-NN.md`** from the Task template in `templates.md`, from the code as it is
   now, not from the plan as it was. The Contexto na ativação section states what the previous
   tasks delivered and found that shapes this one.
3. Link the task file in its roadmap row and mark it 🔄.
4. Continue with Phase 6 (spec) for this task, then the TDD loop through Phase 12.

### Blocked tasks

A task is 🚫 when it cannot go on without something outside the sprint's control: a human answer, an
external resource, a decision another task still has to make. Record what it waits on in its task
file and in the README's open-decisions table, and activate the next task that does not depend on
it. When the blocker clears, the task returns to 🔄 at the next activation.

### While the task is active

- Only the active task's file is detailed. A discovery that affects a future task changes **its
  roadmap row** (and the roadmap-changes table), never a new file written ahead of time.
- The active task's own file is updated in place when a discovery changes it; the Registro records
  what changed and why.

### Closing a task

1. Fill the Registro section: what was delivered, what differed from the task as written, and what
   the next tasks need to know.
2. Mark the roadmap row ✅ and propose the task's commit (Commit Policy).
3. Go back to step 1 of Activating.

The loop ends when every row is ✅ or 🗑️. A 🚫 row is not an ending: resolve the blocker, or ask the
human to drop the task (🗑️, with the reason in the roadmap-changes table). Only then go to the
critical code review (checklist 17).

A fix decided after every task is closed — a "fix now" from the code review or the security scan —
becomes a **new roadmap row** with the next unused number, logged in the roadmap-changes table with
the finding that caused it. It goes through the same activation and loop. The human's decision on
the finding is its scope approval; no second approval is needed.

Task numbers are identifiers, not positions. A closed task is never renumbered; a dropped task
keeps its number with status 🗑️ and the reason in the roadmap-changes table; a new task takes the
next unused number.

## Phase 6: Write the Executable Spec

Convert the requirement into verifiable behavior.

The minimum spec must answer:
- When?
- Given what?
- What must the system do?
- Which error states exist?
- What is out of scope?

Suggested format: see `templates.md`.

## Phase 7: Write Tests Before Code

Write the tests before production code.

Priority:
1. pure logic tests (design tokens, theme and style resolution, helpers);
2. hook tests;
3. component tests (rendered output, variants, states, accessible roles);
4. route smoke tests (each style and layout page renders its components);
5. browser flow tests, when the behavior only exists in a real browser.

Rules:
- test behavior, not internal implementation details;
- always include relevant success and failure cases;
- any reproducible bug must become a regression test;
- if the current code is not testable, make it testable first.

**Test scope — hard rule:** write and run tests ONLY for what is produced or changed in this session. Never run the whole suite, a whole module, or a whole `__tests__/` directory — only the affected specs, by explicit path, with the test runner defined in the stack ADR. A pre-existing spec broken _by_ the change is in scope; unrelated red is reported, not chased. Full suite only on explicit user request.

The project has no test runner yet. Choosing it (and its focused-run command) is part of the first sprint's stack ADR, and no production code is written before it exists.

## Phase 8: Review Spec and Tests with the Human

Before implementing, especially for non-trivial changes:
1. show your interpretation of the requirement;
2. show which cases will be covered;
3. confirm with the human that the tests represent the correct business rule.

If the human corrects the interpretation, adjust the tests before writing code.

## Phase 9: Confirm RED

Run the tests and confirm a legitimate failure.

Invalid RED:
- a test that starts green;
- a test that fails for an irrelevant reason;
- a test that does not validate the requested behavior.

Without a real RED, do not start implementation.

## Phase 10: Implement

Implement the minimum necessary to satisfy the tests.

Rules:
- do not introduce unnecessary generalization early;
- do not mix out-of-scope changes;
- respect ADRs and guidelines;
- preserve separation between UI, domain, services, and contracts.

**Frontend rule — mandatory when the task touches any UI:**

Before writing UI code, read and apply `frontend-master/SKILL.md`. If the stack is Next.js + Tailwind + TypeScript, also apply `frontend-guidelines/SKILL.md`. These skills govern aesthetic direction, typography, color, motion, layout composition, and anti-patterns. Never write frontend code without consulting them first.

If the change creates or modifies motion — transitions, hover states, micro-interactions, enter/exit animations, loading states — load `design-motion-principles/SKILL.md` in **Create** mode before writing the animation. It governs timing, easing, frequency, and the anti-patterns that make motion read as AI slop.

## Phase 11: Refactor

After making the tests pass:
- reduce duplication;
- improve names;
- extract functions;
- extract hooks;
- move responsibilities;
- reduce coupling;
- align with the project architecture.

Do not stop at the first green.

If the refactor goes beyond localized scope, read and apply: `large-scale-refactor/SKILL.md`

## Phase 12: Full GREEN

Only consider the task complete when:
1. the affected specs pass (only those, by explicit path — never the full suite/directory, per the Test scope rule in Phase 7);
2. lint passes;
3. typecheck passes, if it exists;
4. build passes, if the change justifies it;
5. the minimum refactor has been done;
6. the acceptance criteria were revisited.

If any step fails:
- go back to the code;
- adjust;
- rerun;
- repeat until it passes.

## Commit Policy

Committing is a gate, not a formality. It applies to every commit, including the ones inside BTFC.

### Message format

```
tipo(escopo): descrição da mudança
```

- `tipo` is a Conventional Commits type: `feat`, `fix`, `chore`, `docs`, `test`, `refactor`, `style`,
  `perf`, `build`, `ci`.
- `escopo` is the area touched: a style (`estilo-<nome>`), a layout (`layout-<nome>`), the style
  selector (`seletor`), shared components (`componentes`), design tokens (`tokens`), or `sprint`
  for sprint documents.
- The description states **what this commit changed** — not the sprint name. Repeating the sprint
  name across every commit produces a `git log` of identical subjects and destroys its readability.
- Language follows the repository convention.
- **No AI signature. No `Co-Authored-By`. No tool attribution of any kind.**

Example of a sprint's log:

```
feat(estilo-moderno): adiciona página de botões e formulários
test(tokens): cobre contraste mínimo das cores primárias
docs(sprint): registra ADR de tokens de cor
```

### Hard gates

1. **The message is approved by the human BEFORE the commit is made.** Always, with no exception for
   BTFC, for trivial changes, or for a message the human already approved in an earlier turn for a
   different commit. Propose the message, wait, then commit.
2. **Stage explicit paths — `git add <files>`, never `git add .`.** The blanket add is how unrelated
   work and generated files leak into a commit.
3. **Check the branch BEFORE the first commit of any work.** If HEAD is on the repository's default
   branch (`main`/`master`) and the work is not a plain `chore`, **stop**: state that you are on the
   default branch and propose either a new branch (`feat-*`, `fix-*`) or an existing one that fits.
   Do not commit until the human decides.
4. **Push is always manual and always the human's.** The AI never runs `git push`, not even when the
   commit was approved, not even when the human asked to "finish". Say what is pending publication
   and hand over the command.
5. **Never propose committing UI that was not seen in a browser.** Hand the human a **manual visual
   path**: the command to start the app, the routes to open, and what to look at (states, breakpoints,
   light/dark, hover and focus, motion). Open it yourself first, so the human reviews the design and
   not a broken page. A green gate means the logic is right, **not** that the screen looks right.

---

## Phase 13: Critical Code Review

At the end, apply an auditor mindset:
- bugs;
- regressions;
- coupling;
- duplication;
- performance;
- maintainability;
- ADR adherence;
- protocol adherence.

Final questions:
- Does the code only pass the tests, or does it also have good design?
- Did any responsibility end up in the wrong place?
- Was any new smell introduced?
- Is the change now easier or harder to evolve?

Read and apply mandatorily: `critical-code-review/SKILL.md`

**Frontend review — mandatory when the change touches any UI:**

After the standard code review, run `web-design-guidelines/SKILL.md` to audit Web Interface Guidelines compliance. Report findings in `file:line` format. Any critical violation must be fixed before delivery.

If the change touched motion, also run `design-motion-principles/SKILL.md` in **Audit** mode. Report findings in `file:line` format. Any critical violation must be fixed before delivery.

**Security scan — when the change has a surface (rule 11b):**

Run `security-scan/SKILL.md` after the code review, before delivery, whenever the change adds or
upgrades dependencies, handles real input, loads a third-party script or integration, or adds server
code. A purely presentational change is exempt; state in the delivery that the scan was skipped and
why.

It produces `security-scan.md` in the sprint folder — **written even when nothing is found**, so a
sprint where the scan ran cannot be confused with one where nobody looked.

**The findings are the human's to decide, one at a time.** The agent reports and orients; it never
fixes on its own judgement. For each finding the human picks: **fix now** (inside this sprint,
through the full protocol loop — a security fix is not exempt from spec and tests) or **accept the
risk** (recorded verbatim, with the reason). A critical or high finding blocks delivery until it has
been decided.

When dependencies changed, advisories are checked through `npm audit` **and** a web search, both
dated.

## Final Delivery

The final response must include:
- what was implemented;
- how the spec was satisfied;
- what was tested;
- whether a RED/GREEN loop happened;
- residual risks;
- natural next steps, if any.

## Skill Harvesting

An ADR records **why a decision was made, once**. A skill records **how the work is done, from now
on**. The protocol is not finished when the code is green — it is finished when the next person, or
the next session, cannot get it wrong.

### Trigger

Harvest a skill whenever **all** of these hold:
- a way of doing something was _defined_ — a business rule, a convention, an integration pattern;
- the implementation is **complete and tested end-to-end**;
- the human has **signed it off**.

A decision still under discussion does not become a skill. A half-built pattern does not become a
skill. Premature skills are worse than none: they harden the wrong shape.

### What to harvest

- The rule, stated so it can be followed without re-deriving it.
- **The scars** — what broke before, what the naive approach gets wrong, why the obvious choice was
  rejected. This is the part that no one can reconstruct from the code, and the reason the skill
  earns its place.
- Concrete triggers (`TRIGGER when…`, `SKIP when…`) in the `description` frontmatter, so it loads
  only when it matters.
- File paths and identifiers that anchor the rule in this codebase.

### Where it lives

Inside the repository the rule governs, at `<repo>/.claude/skills/<name>/SKILL.md` — never only in
the operator's global skills. The rule belongs to the codebase, and travels with it.

Phase 2.0 sweeps exactly these directories at the start of the next sprint. **Skill harvesting is
what makes that sweep worth doing**; skip it and Phase 2.0 slowly finds nothing.

### How to offer it

Be proactive but not unilateral: at delivery, name what the sprint settled and propose the skill in
one line. Write it when the human agrees. If the sprint settled nothing new, say so — a sprint that
produced no rule is a normal outcome, and inventing a skill to fill the slot is an anti-pattern.

### Language of a skill

A skill has two kinds of text inside it, and they do not follow the same rule. Getting this wrong is
the most common way a skill set drifts.

**English — everything the model reads as instruction:**
- the `description` frontmatter (this is what the loader matches against the request — it decides
  whether the skill loads at all);
- phase names, section headings, procedures, rules, anti-patterns;
- identifiers, file paths, test names, and any code in examples.

The reason is not preference. These files are adapted from and kept in sync with English-origin
sources, and a skill whose prose mixes two languages gives the same concept two symbols — "humano"
and "human", "quadro" and "board" — inside one loaded context. That weakens the mapping for no gain.

**The team's language — everything a human reads as output:**
- the progress checklist and any text the agent prints to the human;
- the literal questions the agent asks (Phase 0);
- templates that produce team documents — PRD, sprint README, ADRs, specs, task bodies;
- commit message bodies and delivery summaries.

Screen text and documents belong to the people who read them. Translating those into English does
not tidy the skill set; it imposes a language on the team's own documentation.

**When in doubt, ask who reads the sentence.** If the answer is "the model, to decide what to do",
it is English. If the answer is "a person, to know what happened", it is the team's language.

---

## When to Create ADRs or Guidelines

Create or propose an ADR/guideline when:
- the task defines a new pattern;
- the architecture is undefined;
- the project is starting;
- there are multiple approaches with real trade-offs;
- the implementation depends on a future structural rule.

## Forbidden Anti-Patterns

- coding before understanding the requirement;
- skipping Lexomni;
- writing an ADR without first sweeping the repository's project skills;
- skipping Context7 on stack/API work;
- skipping the Phase 13 security scan on a change that has a surface (rule 11b);
- fixing a security finding without the human deciding first;
- writing code before tests;
- accepting green without refactoring;
- letting the AI decide the business rule alone;
- using “it works here” as the definition of done;
- skipping ADRs — they are mandatory for every sprint, not optional;
- writing UI code without reading `frontend-master/SKILL.md` first;
- skipping `web-design-guidelines/SKILL.md` audit on any frontend change;
- animating anything without `design-motion-principles/SKILL.md` — default durations, gratuitous entrance animations, and motion on everything are the exact anti-patterns it exists to prevent;
- skipping or merging Phase 0 steps because the requirement already seems clear — clarity does not replace execution;
- treating dialogue-gathered context as a substitute for completing a step — a step is only done when its output exists and has been confirmed;
- advancing to the next phase without explicitly checking off the current step in the Official Workflow checklist;
- writing every task file (or spec) of the sprint up front, or detailing a task before it is active;
- activating a task without first reviewing the roadmap against what the closed tasks taught;
- committing without the human approving the message first — BTFC included;
- staging with `git add .` instead of explicit paths;
- committing non-`chore` work while on the default branch instead of proposing a branch;
- running `git push` — publication is always the human's;
- delivering a settled, end-to-end-tested rule without proposing the skill that encodes it;
- writing a skill for a decision still under discussion, or for a half-built pattern;
- writing skill instructions in a language other than English, or translating screen text and team
  documents into English — see the Language of a skill section.

## Templates

Use the templates in `templates.md`.
