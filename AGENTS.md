# AGENTS.md

This document governs how AI agents work on this VSCOde plugin project. We follow **Extreme Programming (XP)** as our primary development discipline. All work must align with XP values, principles, and practices while respecting VSCode plugin guidelines and SOLID principles.

## XP Values (Non-Negotiable)

- **Communication**: Prefer clear, concise explanations and code that communicates intent. Face complexity with questions, not assumptions.
- **Simplicity**: Do the simplest thing that could possibly work. Avoid speculative design; solve today’s requirements, not tomorrow’s guesses.
- **Feedback**: Work in tiny cycles, run tests constantly, and validate assumptions early.
- **Courage**: Refactor mercilessly, delete dead code, and raise concerns about technical debt or process issues.
- **Respect**: Write code that others can read, maintain, and improve. Respect teammates’ time and the customer’s goals.

## XP Engineering Practices

### Test-First Development (TDD)

- **Always write a failing test before production code.**
- Cycle: write failing test → confirm it fails → write minimal code to pass → refactor → repeat.
- Keep tests fast, independent, and deterministic. Mock external dependencies; never test the real network or database in unit/widget tests.
- Run all tests before every commit. No commit should leave the suite red.

### Continuous Integration

- Integrate code frequently — multiple times per day.
- Fix broken builds immediately; do not continue feature work on a red pipeline.

### Simple Design

- Follow the **Four Rules of Simple Design** (in priority order):
  1. Passes all tests.
  2. Reveals intention (clear names and structure).
  3. No duplication (DRY).
  4. Fewest elements (remove unused code, abstractions, and indirection).
- Avoid over-engineering; add abstraction only when duplication or pain demands it.

### Refactoring / Design Improvement

- Refactor continuously, not in big batches.
- Refactoring is safe only with passing tests. Run tests after every small change.

### Pair Programming

- Treat every change as if written in a pair: one person driving, one reviewing.
- As an AI pair partner, explain the “why” behind non-obvious decisions and invite alternatives.
- Rotate ideas and approaches; avoid heroics or single-person silos.

### Collective Code Ownership

- Any agent may improve any code anywhere in the project.
- Leave code cleaner than you found it.
- Do not tolerate “someone else’s code” as an excuse for poor quality.

## SOLID practices

Apply SOLID as a check on design, not as a reason to add layers. Prefer the smallest change that still keeps these boundaries clear.

- **Single Responsibility (SRP)**: A class or widget has one reason to change. Split UI, state, and I/O; keep widgets small and extract when a type mixes unrelated concerns.
- **Open/Closed (OCP)**: Extend behavior by adding types, not by rewriting working ones. Use composition, callbacks, and small interfaces; avoid growing `if`/`switch` trees for every new variant.
- **Liskov Substitution (LSP)**: Subtypes must honor the contract of their base type. Do not override methods in ways that surprise callers (narrower preconditions, extra side effects, or throwing where the parent does not).
- **Interface Segregation (ISP)**: Depend only on the methods you use. Prefer small, focused abstracts (or mixins) over one fat interface that forces unused members.
- **Dependency Inversion (DIP)**: High-level code depends on abstractions, not concrete I/O. Inject repositories, clients, and clocks; mock those boundaries in tests — never the real network or database.
