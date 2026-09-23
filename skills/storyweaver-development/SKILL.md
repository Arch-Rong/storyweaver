---
name: storyweaver-development
description: Develop the StoryWeaver novel collaboration agent, including versioned writing workflows, agent tools, memory and consistency checks, and the Next.js/Tiptap/Python/FastAPI/PostgreSQL stack. Use for changes that affect the product's domain model or AI execution flow.
metadata:
  short-description: StoryWeaver product and agent development rules
---

# StoryWeaver Development

Use this skill for changes to StoryWeaver's novel editor, agent workflows, domain data, persistence, retrieval, background runs, or consistency checks. Read the root [`AGENTS.md`](../../AGENTS.md) and the relevant section of [`docs/novel-agent-technical-plan.md`](../../docs/novel-agent-technical-plan.md) before editing.

## Required decisions

- Treat the author as the final authority. Generated text and extracted facts are proposals until explicitly accepted.
- Keep immutable document revisions and separate draft, canon, outline, proposal, and candidate-memory states.
- Validate work against the base revision, block content hash, project ownership, and canon epoch before applying a change.
- Make agent writes idempotent and resumable. Store run inputs, prompt/model configuration, budget, step checkpoints, and evidence references. Celery is only the dispatcher; PostgreSQL is the source of truth for task state.
- Keep model calls outside database transactions. Use short transactions for accepting proposals and finalizing canon changes.
- Prefer read-only tools. Tools that alter content create proposals; author-facing APIs apply accepted changes.
- Use structured, schema-validated model output. Include source revision and block references in retrieval results.

## Workflow

1. Identify which invariant or user flow changes and inspect adjacent code before choosing an abstraction.
2. Update domain types and validation first; then implement persistence, worker behavior, API, and UI in that order where practical.
3. Test version conflicts, duplicate retries, cancellation, worker recovery, stale memory, and author accept/reject flows for relevant changes.
4. Run the smallest complete verification set for the change, including relevant Python checks, then report commands and output honestly.

## Useful references

- Product and architecture decisions: [`docs/novel-agent-technical-plan.md`](../../docs/novel-agent-technical-plan.md)
- Team-facing standards and skill routing: [`docs/agent-development-standards.md`](../../docs/agent-development-standards.md)
- Project commands and invariants: [`AGENTS.md`](../../AGENTS.md)
