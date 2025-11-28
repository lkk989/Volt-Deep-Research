---
description: "Guidelines for GitHub Copilot's Memory Bank and Project Instructions"
applyTo: '**'
---
# Copilot Memory Bank & Project Instructions

## Summary

This document defines how GitHub Copilot maintains project memory and context across sessions. Copilot’s memory resets between sessions, so all project knowledge must be captured in the Memory Bank to ensure continuity, accuracy, and effective collaboration.

---

## Core Principle

**Copilot MUST read ALL memory bank files at the start of EVERY task.**

* No exceptions.
* Use this checklist before any work:

  * [ ] Read `projectbrief.md`
  * [ ] Read `productContext.md`
  * [ ] Read `systemPatterns.md`
  * [ ] Read `techContext.md`
  * [ ] Read `activeContext.md`
  * [ ] Read `progress.md`
  * [ ] Read `copilot-rules.md`
  * [ ] Read any additional context files in `/memory-bank/`

---

## Memory Bank Structure

The Memory Bank consists of required core files and optional context files, all in Markdown. Files build upon each other in a clear hierarchy:

```mermaid
flowchart TD
    PB[projectbrief.md] --> PC[productContext.md]
    PB --> SP[systemPatterns.md]
    PB --> TC[techContext.md]

    PC --> AC[activeContext.md]
    SP --> AC
    TC --> AC

    AC --> P[progress.md]
    AC --> CR[copilot-rules.md]
```

### Core Files (Required)

1. **projectbrief.md**
   Foundation document for all others. Defines core requirements, goals, and project scope.
2. **productContext.md**
   Why this project exists, problems it solves, user experience goals.
3. **systemPatterns.md**
   System architecture, key technical decisions, design patterns, component relationships.
4. **techContext.md**
   Technologies used, development setup, technical constraints, dependencies.
5. **activeContext.md**
   Current work focus, recent changes, next steps, active decisions.
6. **progress.md**
   What works, what’s left to build, current status, known issues.
7. **copilot-rules.md**
   Project rules, Copilot guidance, safety/security policies, evolving project patterns.

### Additional Context

Add extra files/folders in `/memory-bank/` for:

* Complex features
* Integration specs
* API docs
* Testing strategies
* Deployment procedures

---

## Core Workflows

### Plan Mode

```mermaid
flowchart TD
    Start[Start] --> ReadFiles[Read Memory Bank]
    ReadFiles --> CheckFiles{Files Complete?}
    CheckFiles -->|No| Plan[Create Plan]
    Plan --> Document[Document in Chat]
    CheckFiles -->|Yes| Verify[Verify Context]
    Verify --> Strategy[Develop Strategy]
    Strategy --> Present[Present Approach]
```

**Description:**

* Always start by reading all memory bank files.
* If files are missing, create a plan and document it.
* If files are complete, verify context and develop a strategy before acting.

### Act Mode

```mermaid
flowchart TD
    Start[Start] --> Context[Check Memory Bank]
    Context --> Update[Update Documentation]
    Update --> Rules[Update copilot-rules.md if needed]
    Rules --> Execute[Execute Task]
    Execute --> Document[Document Changes]
```

**Description:**

* Check memory bank before any action.
* Update documentation as you work.
* Update `copilot-rules.md` if new patterns or rules are discovered.
* Document all changes.

---

## Documentation Updates

Update the Memory Bank when:

1. Discovering new project patterns or rules
2. After significant changes
3. When the user requests with **update memory bank** (review ALL files)
4. When context needs clarification

```mermaid
flowchart TD
    Start[Update Process]
    subgraph Process
        P1[Review ALL Files]
        P2[Document Current State]
        P3[Clarify Next Steps]
        P4[Update copilot-rules.md]
        P1 --> P2 --> P3 --> P4
    end
    Start --> Process
```

**Note:**
On **update memory bank**, review every file, even if some don’t require changes.
Focus on `activeContext.md` and `progress.md` for current state.

---

## Project Rules (`copilot-rules.md`)

This file is Copilot’s and the team’s learning journal for the project. It captures:

* Critical implementation paths
* User preferences and workflow
* Project-specific patterns
* Security requirements and known challenges
* Evolution of project decisions
* Tool usage patterns

**Example: Core Security Rule**

```markdown
## 🚨 Security: Never Upload Secrets

- Never copy, move, or commit secret files or values (e.g., `.env`, `secrets.json`, API keys, tokens, passwords) to version control or into example/sample config files.
- Example files like `.env.example` must be built by hand with only safe placeholder values.
- Always verify that no secrets are present before staging, committing, or pushing code.
- If a secret is ever committed, treat as a security incident: remove from history and rotate affected credentials immediately.
- Use secret scanning tools (e.g., GitHub Secret Scanning, TruffleHog, git-secrets) for extra safety.
```

---

## How to Use This Document

* Reference this file at the start of every session.
* Use the checklists and diagrams to guide your workflow.
* Update the Memory Bank and `copilot-rules.md` as you learn.
* Treat this as a living document—improve it as the project evolves.

---

**REMEMBER:**
After every memory reset, Copilot begins completely fresh. The Memory Bank is the only link to previous work. Maintain it with precision and clarity—project effectiveness and security depend on its accuracy.

---

*Last updated: 2025-06-30*
*Version: 1.1.0*
