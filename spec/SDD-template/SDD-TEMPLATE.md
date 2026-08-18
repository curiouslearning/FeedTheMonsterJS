# Spec-Driven Development (SDD) Generator Prompt

You are a senior Software Architect and Technical Lead following Spec-Driven Development (SDD) principles.

Your task is to analyze the current repository and generate a production-ready specification document for the work described below.

## Instructions

* First determine whether this is:

  * a **new feature**
  * an **improvement**
  * a **bug fix**
  * a **performance optimization**
  * an **architectural refactor**
  * or a combination of the above.

* Inspect the existing project structure before making recommendations.

* Reuse the existing architecture whenever possible.

* Avoid proposing unnecessary refactoring unless it provides measurable business value.

* Follow existing coding standards, naming conventions, dependency patterns, and project architecture.

* If introducing new abstractions, explain why they are needed.

* Keep recommendations incremental and implementation-focused.

---

## Inputs

Fill in the four sections below for the specific ticket/task before running this prompt.

### Ticket Context

<Replace with Jira ticket or task description>

### Business Goal

<Replace>

### Problem Statement

<Replace>

### Acceptance Criteria

<Replace>

---

# Generate a specification document using the following structure.

# 1. Executive Summary

* Brief overview
* Business objective
* Expected user impact
* Success metrics

---

# 2. Current State Analysis

Describe:

* Existing implementation
* Current architecture
* Relevant modules
* Current limitations
* Technical debt (only if relevant)

---

# 3. Root Cause Analysis

Explain:

* Why the issue exists
* Performance bottlenecks
* Architectural bottlenecks
* Runtime bottlenecks
* CPU/Memory impact
* Offline impact (if applicable)

Support every recommendation with reasoning.

---

# 4. Proposed Solution

Describe:

* High-level approach
* Why this approach was selected
* Alternative approaches considered
* Trade-offs
* Business value

Do not recommend architecture changes unless justified.

---

# 5. Architecture Hooks

Document:

* Existing modules involved
* Components affected
* Services affected
* Hooks/events/lifecycle methods
* State management changes
* Performance-sensitive paths
* Rendering paths
* Asset loading flow
* Audio/image loading flow (if applicable)

Clearly explain where the implementation integrates with the current architecture.

---

# 6. Folder Structure

Provide the exact folder structure.

Example:

* Existing files modified
* New files created
* Files removed (if any)

Show complete relative paths.

Example:

src/
assessment/
performance/
hooks/
services/
components/

Do not invent folders that do not fit the project.

---

# 7. File-Level Implementation Plan

For every affected file provide:

* File path
* Purpose
* Required changes
* Public APIs affected
* Internal methods affected

---

# 8. Performance Considerations

Include:

* CPU optimization
* Memory optimization
* Rendering optimization
* Asset loading optimization
* Drag interaction optimization
* Offline performance
* Low-end device considerations

Include measurable expectations whenever possible.

---

# 9. Risks

Document:

* Technical risks
* User risks
* Regression risks
* Deployment risks

Provide mitigation strategies.

---

# 10. Acceptance Criteria Mapping

Create a table mapping every acceptance criterion to:

* implementation
* validation
* expected outcome

Ensure every criterion is testable.

---

# 11. Unit Testing

Generate a unit test plan including:

* files to test
* scenarios
* edge cases
* failure cases
* performance-related tests
* mocks required
* coverage recommendations

---

# 12. End-to-End Testing

Generate an E2E testing plan covering:

* happy paths
* regression scenarios
* negative scenarios
* offline scenarios
* low-end device scenarios
* performance validation
* cross-browser/platform validation (if applicable)

---

# 13. Rollout Strategy

Document:

* implementation order
* deployment strategy
* rollback plan
* monitoring requirements
* success metrics

---

# 14. Open Questions

List assumptions and questions that should be clarified before development.

---

# Output Requirements

Generate a Markdown file named:

`spec/<ticket-name>.md`

The document should:

* follow professional engineering standards
* be implementation-ready
* avoid unnecessary architectural redesign
* prioritize measurable business value
* align with existing project architecture
* include actionable implementation guidance rather than generic recommendations
* remain reusable so only the **Ticket Context**, **Problem Statement**, **Business Goal**, and **Acceptance Criteria** need to be updated for future tasks.
