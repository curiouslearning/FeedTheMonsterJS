<!--
Sync Impact Report
==================
Version change: (uninitialized template) → 1.0.0
Rationale: Initial ratification. The file previously contained only unfilled template
placeholders, so this is the first concrete constitution and receives baseline 1.0.0.

Principles defined (5):
  - I. Feature / Domain / Module Structure
  - II. OOP + FP Discipline (SOLID & Pure Functions)
  - III. Unit Testing with Jest (Gherkin Style, NON-NEGOTIABLE)
  - IV. Green Build & Passing Tests
  - V. Native TypeScript First

Added sections:
  - Additional Constraints (structure, legacy migration, library sourcing)
  - Development Workflow & Quality Gates
  - Governance (formal governance intentionally deferred per project direction)

Removed sections: none (template placeholders replaced in place)

Follow-up TODOs:
  - Governance: No formal governance/amendment process is adopted yet ("No governance
    for now"). Revisit when the team decides to formalize amendment and review rules.
-->

# Feed the Monster Constitution

## Core Principles

### I. Feature / Domain / Module Structure
Every feature MUST belong to a clearly identified domain or module and live under a
feature/domain/module-driven folder structure. Each unit MUST be independently testable,
buildable, and have a single clear purpose; organizational-only groupings with no behavior
are not permitted. Legacy code is exempt at rest but MUST be migrated toward this structure
incrementally as it is touched ("legacy follows suit in iteration").
Rationale: Bounded, purpose-driven modules keep the codebase navigable and let features be
reasoned about, tested, and shipped in isolation.

### II. OOP + FP Discipline (SOLID & Pure Functions)
The codebase deliberately combines object-oriented and functional styles. OOP code MUST
observe the SOLID principles (single responsibility, open/closed, Liskov substitution,
interface segregation, dependency inversion). FP code MUST be expressed as pure functions:
deterministic output for a given input, no hidden side effects, no shared mutable state.
Rationale: SOLID keeps object graphs maintainable and substitutable; pure functions keep
logic predictable and trivially testable, and the two together let each problem use the
model that fits it best.

### III. Unit Testing with Jest (Gherkin Style, NON-NEGOTIABLE)
Every feature MUST ship with unit tests written in Jest using a Gherkin-style
Given/When/Then structure. At minimum the happy path MUST be covered; additional edge and
failure cases are encouraged. Tests are a required deliverable, not an afterthought.
Rationale: Gherkin-structured tests document intended behavior in business terms and make
the happy path an explicit, verifiable contract for every feature.

### IV. Green Build & Passing Tests
No change is complete until `npm test` (unit tests) passes and the project build succeeds.
Both MUST be green before work is considered done or merged.
Rationale: A green build and passing suite are the objective, non-negotiable definition of
"working" and protect every other principle from silent regression.

### V. Native TypeScript First
Application source MUST be written in native TypeScript and MUST avoid application
frameworks. External libraries MAY be recommended only when they provide clear, necessary
value; when a library is needed, internal libraries published under the `@curiouslearning`
scope MUST be preferred over third-party alternatives.
Rationale: Native TypeScript keeps the app lean, portable, and free of framework lock-in,
while favoring `@curiouslearning` libraries maximizes internal reuse and consistency.

## Additional Constraints

- Folder layout is organized by feature → domain → module; new code MUST follow this layout.
- Legacy code migrates opportunistically: when a legacy area is modified, move it toward the
  feature/domain/module structure rather than extending it in place.
- Dependency direction MUST flow toward stable abstractions (per Principle II); modules MUST
  not create circular dependencies across domains.
- Prefer `@curiouslearning`-scoped internal libraries; document the justification whenever a
  third-party dependency is introduced.

## Development Workflow & Quality Gates

- Each feature is delivered with its Gherkin-style Jest unit tests (Principle III).
- Quality gate for "done": unit tests pass AND build succeeds (Principle IV).
- OOP contributions are reviewed for SOLID adherence; FP contributions are reviewed for
  purity (no side effects, no shared mutable state) (Principle II).
- Structural placement (correct feature/domain/module) is checked during review (Principle I).

## Governance

Formal governance is intentionally deferred at this stage ("No governance for now"). This
constitution currently serves as shared engineering guidance rather than an enforced legal
process. A formal amendment, approval, and compliance-review procedure will be defined in a
future iteration when the team chooses to adopt one. Until then, the principles above are the
agreed default and changes to them SHOULD be discussed by the team before adoption.

**Version**: 1.0.0 | **Ratified**: 2026-08-10 | **Last Amended**: 2026-08-10
