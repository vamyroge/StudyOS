# StudyOS — Autonomous Development Roadmap

> **Purpose:** This file is the execution roadmap for autonomous AI coding agents working on StudyOS.
>
> **Product:** StudyOS — an AI-Native Adaptive Learning Operating System for Vietnamese THPT students.
>
> **Priority:** P0 → P1 → P2 → P3 → P4.
>
> **Source of truth:** The repository is the implementation source of truth. This roadmap is the task-management source of truth. Architecture documentation is the architectural source of truth.

---

# 1. Autonomous Development Objective

Build StudyOS into a stable, secure, research-ready AI learning platform for Vietnamese high-school students.

StudyOS should combine:

* AI tutoring
* Question solving
* Practice and quizzes
* Knowledge/RAG
* Student profile/context
* Mastery tracking
* Weakness detection
* Personalized recommendations
* Learning history
* Knowledge contribution and moderation
* AI telemetry
* Research/KHKT data collection
* Explainable learning analytics

StudyOS is **not** intended to become a generic ChatGPT clone.

The system should understand:

> **Student → Goal → Knowledge → Questions → Mistakes → Mastery → Recommendation → Improvement**

---

# 2. Core Development Principles

AI agents MUST follow these principles:

1. Inspect the existing repository before modifying anything.
2. Reuse existing architecture and abstractions whenever possible.
3. Do not create duplicate systems for functionality that already exists.
4. Prefer the smallest correct implementation.
5. Do not over-engineer early.
6. Security takes priority over convenience.
7. Database/RLS changes require explicit verification.
8. AI calls must go through the project AI/provider abstraction.
9. Student-specific data must remain isolated between users.
10. Every important learning/AI action should be traceable when appropriate.
11. Do not mark a task complete merely because code exists.
12. Run relevant tests after implementation.
13. Update this roadmap after meaningful progress.
14. Never silently rewrite architecture to solve a local problem.
15. Preserve compatibility with the existing StudyOS architecture unless a deliberate architectural change is required.

---

# 3. Status Rules

Use the following statuses consistently.

```text
[x]          = Implemented and verified
[VERIFY]     = Implementation appears to exist, but real verification is still required
[ ]          = Not implemented
[PARTIAL]    = Partially implemented; acceptance criteria not fully satisfied
[BLOCKED]    = Cannot proceed because of an explicit dependency/blocker
```

## Critical Rule

Agents MUST NOT change:

```text
[VERIFY] → [x]
[ ] → [x]
[PARTIAL] → [x]
[BLOCKED] → [x]
```

based only on code inspection.

A task becomes `[x]` only when its acceptance criteria have actually been verified.

If verification cannot be performed, use `[VERIFY]`.

---

# 4. Autonomous Execution Loop

For every development task, the agent MUST follow:

```text
READ
↓
UNDERSTAND
↓
AUDIT
↓
PLAN
↓
IMPLEMENT
↓
TEST
↓
SECURITY CHECK
↓
ARCHITECTURE CHECK
↓
UPDATE ROADMAP
↓
REPORT
```

Before starting a task:

1. Read `ai/INDEX.md`.
2. Read `ai/SYSTEM.md`.
3. Read the relevant architecture documents.
4. Read this roadmap.
5. Inspect the actual repository.
6. Verify the task is still unresolved.
7. Check blockers and dependencies.
8. Implement the smallest correct change.
9. Run relevant tests.
10. Verify acceptance criteria.
11. Update task status.
12. Report changed files, tests, remaining issues, and next step.

---

# 5. Priority System

Agents MUST work in this order:

```text
P0 → P1 → P2 → P3 → P4
```

Priority meaning:

| Priority | Meaning                                                          |
| -------- | ---------------------------------------------------------------- |
| P0       | Security, data loss, authentication, critical production blocker |
| P1       | Core functionality required for StudyOS to work                  |
| P2       | Important learning/research/admin functionality                  |
| P3       | Reliability, performance, testing, production hardening          |
| P4       | UI polish, optional improvements, visual enhancements            |

Do not work on a lower-priority task when an unresolved higher-priority blocker prevents the core system from functioning.

---

# 6. Phase 0 — Repository Baseline

**Priority:** P0
**Status:** [x]

## Latest Verified Snapshot

Verified on 2026-09-22 from the current repository and production deployment:

* [x] Typecheck passes.
* [x] Lint passes.
* [x] Production build passes.
* [x] Automated unit/regression tests: 67 passing.
* [x] Vercel production deployment succeeds.
* [x] Tutor provider errors, retries, response normalization, and output sanitization have regression coverage.
* [VERIFY] Supabase-backed E2E flows, RLS isolation, and admin authorization still require real-account verification.

## Objective

Establish the actual state of the repository before autonomous development begins.

## Completed Audit

Audit date:

```text
2026-09-22
```

Current reported environment:

* Next.js 16
* React 19
* TypeScript
* Tailwind CSS v4
* shadcn/ui
* Supabase
* PostgreSQL
* pgvector
* xKiro AI
* HuggingFace embeddings
* AI provider abstraction
* RAG pipeline

## Current Reported State

* Database migrations: 7 applied
* Typecheck: PASS
* Lint: PASS
* Tests: PASS
* Build: PASS
* Authentication: implemented
* Middleware/proxy protection: implemented
* AI orchestration: implemented
* Embeddings: implemented
* RAG: implemented
* Tutor API: implemented
* Knowledge upload API: implemented
* Core UI pages: implemented

## Acceptance Criteria

* Repository has been inspected.
* Current architecture is documented.
* Major blockers are known.
* Roadmap reflects actual implementation state.

---

# 7. Phase 1 — Security & Authentication

**Priority:** P0/P1
**Status:** [VERIFY]

## Objective

Guarantee that authentication, authorization, sessions, protected routes, and user data isolation work correctly.

## Tasks

### Route Protection

* [x] Middleware/proxy implementation exists.
* [VERIFY] `/dashboard` protection.
* [VERIFY] `/tutor` protection.
* [VERIFY] `/questions` protection.
* [VERIFY] `/progress` protection.
* [VERIFY] `/knowledge` protection.
* [VERIFY] `/profile` protection.
* [VERIFY] `/settings` protection.

### Authentication

* [VERIFY] Register.
* [VERIFY] Login.
* [VERIFY] Logout.
* [VERIFY] Session persistence.
* [VERIFY] Auth callback.
* [VERIFY] Server-side authentication.
* [VERIFY] Profile creation.
* [x] Auth callback continuation paths reject external redirects. Regression-tested on 2026-09-22.

### Authorization

* [VERIFY] User can access only their own private data.
* [VERIFY] Admin routes require admin authorization.
* [VERIFY] RLS policies correctly isolate users.
* [VERIFY] Service-role credentials never reach the client.
* [VERIFY] A non-destructive Supabase auth/RLS/admin verification harness is available as `npm run test:supabase`; it requires dedicated test-project credentials before results can be marked verified.

### Security

* [VERIFY] Environment variables audited.
* [VERIFY] Server/client boundaries audited.
* [VERIFY] Sensitive data exposure audited.
* [x] Tutor prompt-injection boundary isolates retrieved knowledge as untrusted reference data. Regression-tested on 2026-09-22.
* [VERIFY] API authorization reviewed.

## Acceptance Criteria

An unauthenticated user cannot access protected resources.

A normal student cannot access another student's private data.

A normal student cannot access admin functionality.

No server secret is exposed to the browser.

## Next Verification

Perform:

```text
Register
→ Login
→ Dashboard
→ Tutor
→ Questions
→ Knowledge
→ Profile
→ Logout
→ Re-login
```

Then verify cross-user data isolation.

---

# 8. Phase 2 — Database Integrity

**Priority:** P0/P1
**Status:** [VERIFY]

## Objective

Maintain a coherent, secure, migration-controlled database.

## Completed Areas

* [VERIFY] 7 migrations exist and define the schema.
* [VERIFY] Profiles, curriculum, knowledge, questions, learning, conversations, audit, and research schema are defined by migrations.
* [VERIFY] pgvector, HNSW index, foreign keys, indexes, and RLS policies are defined by migrations.
* [BLOCKED] Applied production database schema and RLS behavior cannot be verified locally without a verified target database connection and test accounts.

## Acceptance Criteria

Database schema is internally consistent.

Migrations can reproduce the required schema.

RLS protects user-owned data.

---

# 9. Phase 3 — Core Application

**Priority:** P1
**Status:** [PARTIAL]

## Objective

Provide the minimum complete StudyOS student experience.

## Areas

* [VERIFY] Dashboard, student profile, Tutor, questions, progress, knowledge, conversations, and navigation pages exist.
* [VERIFY] Tutor conversation persistence is implemented in the API route.
* [PARTIAL] Tutor uses normal request/response, not verified streaming. The existing streaming provider helper is not used by the Tutor UI.
* [PARTIAL] Loading, empty, and error states exist on core pages but have not received an end-to-end accessibility review.
* [x] Tutor request validation uses Zod.

## Acceptance Criteria

A student can:

```text
Create account
→ Login
→ Complete profile
→ Ask AI
→ Practice
→ Record answers
→ View progress
→ Review weaknesses
```

without hitting an unresolved critical application error.

---

# 10. Phase 4 — AI Orchestration

**Priority:** P1
**Status:** [PARTIAL]

## Objective

Ensure StudyOS behaves as an orchestrated learning system rather than a simple chatbot.

## Provider Layer

* [x] Provider abstraction and model configuration exist.
* [VERIFY] xKiro is configured in production and has been observed in production logs.
* [VERIFY] 9router, OpenRouter, OmniRoute, and generic OpenAI-compatible provider configuration paths exist but have not been verified against real providers.

## Intent Detection

Supported intents:

```text
explain
solve
practice
review
diagnose
plan
analyze_error
```

* [x] Intent detection and role routing have unit coverage, including the rule that ordinary questions do not become quizzes.

## Logical AI Roles

* [x] Tutor, examiner, coach, reviewer, and problem-solver roles are implemented in routing logic.

Future roles may be added only when justified by actual product requirements.

## Context Pipeline

```text
Student Request
↓
Intent Detection
↓
Role Routing
↓
Privacy Check
↓
Student Context
↓
Mastery Context
↓
RAG Context
↓
Model Provider
↓
Guardrails
↓
Structured Response
↓
Telemetry
```

## Reliability

* [x] Timeout handling. Verified by provider timeout configuration and regression tests on 2026-09-22.
* [x] Provider error normalization. Verified for 400/401/403/429/502/503/504 handling in code and unit tests.
* [PARTIAL] Fallback behavior. Transient upstream failures retry at most twice with exponential backoff; a distinct configured fallback provider/model is not implemented.
* [x] AI error logging. Request ID, provider, model, intent, latency, retry count, and normalized error code are logged without secrets.
* [x] Structured responses. Tutor responses are normalized through the orchestrator before persistence and rendering.
* [x] Source attribution is returned when retrieval succeeds.
* [PARTIAL] Confidence metadata exists in the older orchestrator response type but is not returned by the current Tutor API contract.

## Acceptance Criteria

AI requests are routed through the orchestrator.

The system does not bypass the architecture with arbitrary direct model calls.

---

# 11. Phase 5 — Knowledge & RAG

**Priority:** P1/P2
**Status:** [VERIFY]

## Objective

Allow StudyOS to answer using a controlled learning knowledge base.

## Ingestion

* [VERIFY] Admin-only synchronous upload route, TXT/Markdown/CSV parsing, chunking, metadata, embedding, and vector-storage code exist. Embeddings use bounded concurrency (3 chunks) to reduce request time without a background queue.

## Retrieval

* [VERIFY] pgvector RPC, HNSW migration, subject filtering, context construction, and source attribution are implemented.
* [PARTIAL] Retrieval is dense-vector similarity search only; the documented hybrid keyword + dense ranking is not implemented.
* [VERIFY] End-to-end upload, embedding, retrieval, and Tutor source attribution with the current production providers remains unverified.

## Current Configuration

Embedding dimension:

```text
768
```

Current embedding model:

```text
dangvantuan/vietnamese-embedding
```

## Current Limitations

* [ ] PDF parsing.
* [ ] OCR.
* [ ] Asynchronous ingestion queue.
* [ ] Advanced hybrid ranking.
* [ ] Large-scale ingestion optimization.

These are not blockers unless actual product requirements require them.

## Acceptance Criteria

A valid source can be ingested.

Relevant chunks can be retrieved.

Retrieved information is correctly passed into the AI context.

Sources can be traced.

---

# 12. Phase 6 — Learning Engine

**Priority:** P2
**Status:** [VERIFY]

## Objective

Transform StudyOS from an AI chatbot into an adaptive learning system.

## Data

* [VERIFY] Attempts, answer history, mistakes, mastery, recommendations, and weakness-detection code plus unit tests exist.
* [VERIFY] The full database-backed attempt-to-recommendation loop has not been verified with a real student account.

## Current Explainable Algorithm

Correct answer:

```text
mastery += 0.10
```

Incorrect answer:

```text
mastery -= 0.15
```

Clamp:

```text
0 ≤ mastery ≤ 1
```

Weakness threshold:

```text
mastery < 0.40
```

Recommendation:

```text
Top 3 weaknesses
```

## Acceptance Criteria

Student attempts affect learning state.

Learning state affects recommendations.

Recommendations are explainable.

The algorithm is versioned so future algorithms can be compared.

---

# 13. Phase 7 — Knowledge Contribution & Moderation

**Priority:** P2
**Status:** [PARTIAL]

## Objective

Allow knowledge to grow while maintaining data quality and research transparency.

## Data Model

Submission statuses:

```text
pending
processing
flagged
approved
rejected
archived
```

## Implemented

* [x] Submission schema.
* [x] Moderation statuses.
* [x] Moderation queue.
* [x] Approval/rejection.
* [x] Source metadata.
* [x] Audit trail.
* [x] Trusted/untrusted distinction.
* [x] Admin moderation.

## Remaining

* [x] Student-facing contribution form with title, source, subject, text content, and private TXT/Markdown/CSV upload validation.
* [x] Contribution workflow code: student submission → pending moderation → approved content publishing to RAG.
* [x] Clear submission feedback and per-contribution moderation status.
* [x] Contribution provenance display in student and admin moderation views.
* [VERIFY] Migration `008_knowledge_contributions.sql` and the full Supabase-backed workflow need application and verification in a dedicated test project.

## Acceptance Criteria

A student can submit knowledge.

The submission enters moderation.

Admin can approve/reject it.

Every decision is traceable.

Unapproved knowledge must not silently become trusted knowledge.

---

# 14. Phase 8 — Admin & Research

**Priority:** P2
**Status:** [PARTIAL]

## Objective

Make StudyOS suitable for controlled development, demonstration, and KHKT research.

## Admin

* [VERIFY] Admin dashboard, user management, moderation, AI usage, and audit pages exist and enforce `requireRole(["ADMIN"])` server-side.
* [VERIFY] Middleware admin role handling is implemented with the request cookie store, but requires real student/admin E2E verification.

## Research

* [VERIFY] Experiment/audit schema and telemetry code exist.
* [PARTIAL] The complete research trace from student action to mastery change and export has not been verified end-to-end.

## Research Principles

Important AI/learning events should preserve:

```text
timestamp
student/context identifier
model
prompt/version where applicable
retrieval/version where applicable
action
result
learning impact where applicable
```

Do not collect unnecessary personal information.

## Acceptance Criteria

The project can demonstrate:

```text
Student
→ Interaction
→ AI decision
→ Learning event
→ Mastery change
→ Recommendation
```

with sufficient provenance for research analysis.

---

# 15. Phase 9 — Testing

**Priority:** P2/P3
**Status:** [PARTIAL]

## Objective

Build confidence that StudyOS continues working while autonomous agents modify the repository.

## Automated Tests

* [x] Unit tests.
* [x] AI orchestration tests.
* [x] RAG tests.
* [x] Learning engine tests.
* [PARTIAL] API validation tests cover AI helper behavior but do not exercise route handlers against Supabase.
* [x] Provider/config tests.
* [x] Embedding tests.
* [VERIFY] Database schema validation is limited to migration/code inspection; no live migration or RLS integration test currently runs.
* [x] Security/rate-limit tests where available.

## Must Verify

* [x] Exact current automated test count: 67 tests passing on 2026-09-22.
* [VERIFY] All tests pass in a clean environment. They pass in the current working environment; a clean-install CI run is not configured.
* [ ] End-to-end authentication flow.
* [ ] End-to-end tutor flow.
* [ ] End-to-end question flow.
* [ ] End-to-end knowledge upload/retrieval.
* [ ] Cross-user isolation.
* [ ] Admin authorization.
* [BLOCKED] Live Supabase harness exists but cannot run until a dedicated test project and three existing test accounts are configured through `TEST_*` environment variables. The harness was verified to fail closed when these values are absent on 2026-09-22.

## Important

Do not report:

```text
100% tested
```

until the critical E2E/manual flows have actually been verified.

## Acceptance Criteria

A clean repository install can run the test suite successfully.

Critical user flows are verified.

---

# 16. Phase 10 — Production Quality

**Priority:** P3
**Status:** [PARTIAL]

## Performance

* [VERIFY] Basic caching may exist in code but has not been profiled or verified in production.
* [ ] Performance baseline.
* [ ] AI latency measurement.
* [ ] RAG latency measurement.
* [ ] Database query profiling.
* [ ] Large upload performance testing.

## Rate Limiting

Current reported limits:

```text
Tutor: 20 requests/minute
Knowledge upload: 10 requests/hour
```

* [x] Process-local rate limiting.
* [ ] Distributed production-safe rate limiting.

## Reliability

* [x] Tutor AI error handling and request logging are verified by unit tests and production logs.
* [VERIFY] Error handling and logging for all other application flows require broader E2E verification.
* [ ] External error monitoring.
* [ ] Production alerting.

## Accessibility

* [PARTIAL] Accessibility audit.
* [ ] Keyboard navigation audit.
* [ ] Screen-reader audit.
* [ ] Contrast audit.

## Security

* [PARTIAL] Static security review completed for Tutor middleware, server/client boundaries, and AI secret handling. Live RLS and cross-user tests remain outstanding.
* [ ] Final production security review.
* [ ] Dependency audit verification.
* [ ] API abuse review.

## Dependency Status

Known development dependency issue:

```text
Vitest GHSA-82fw-gwwq-j7x9
```

Current reported state:

```text
Runtime dependencies: 0 vulnerabilities
Vitest: development dependency issue reported
```

Do not upgrade or change dependencies automatically if doing so risks destabilizing the test environment.

---

# 17. Phase 11 — UI/UX Polish

**Priority:** P4
**Status:** [PARTIAL]

## Design Direction

StudyOS should follow:

```text
Linear
+
Vercel
+
Notion
+
Modern Education SaaS
```

Principles:

* clean
* modern
* information-dense
* responsive
* accessible
* consistent
* minimal unnecessary decoration

## Completed Areas

* [VERIFY] Dashboard, Tutor, knowledge, profile, progress, admin, navigation, and shared UI components have been implemented.
* [PARTIAL] Responsive behavior and accessibility require manual browser verification at the documented breakpoints.
* [PARTIAL] Page transitions are not implemented as a dedicated route-transition system.

## Rule

UI polish must not take priority over unresolved P0/P1/P2/P3 issues.

---

# 18. Current Critical Backlog

Agents MUST evaluate this section before starting new work.

## P0

* [VERIFY] Authentication and protected-route E2E verification.
* [VERIFY] RLS cross-user isolation.
* [VERIFY] Admin authorization.
* [PARTIAL] Secret/client boundary. Static audit plus auth-callback open-redirect and Tutor prompt-injection regression tests pass; browser bundle and live Supabase RLS verification remain outstanding.

## P1

* [VERIFY] Core student flow.
* [VERIFY] AI tutor end-to-end flow.
* [VERIFY] RAG end-to-end flow.
* [PARTIAL] Provider failure/fallback behavior. Retry behavior for 502/503/504 is verified; no alternate provider fallback is configured.

## P2

* [PARTIAL] Student knowledge contribution UI and provenance UX are implemented with regression coverage; migration application and live workflow verification remain outstanding.
* [VERIFY] Research telemetry completeness.
* [VERIFY] Exact automated test inventory.

## P3

* [ ] E2E test suite.
* [ ] Performance baseline.
* [ ] External monitoring.
* [ ] Production rate limiting.
* [ ] Accessibility audit.
* [ ] Dependency security verification.

## P4

No new P4 work should begin until P0–P3 blockers are resolved.

---

# 19. Definition of Done

A feature is considered complete only when:

```text
Implementation
+
Tests
+
Security
+
Error Handling
+
Loading/Empty States
+
Authorization
+
Documentation
+
Acceptance Criteria Verification
```

are satisfied where applicable.

Code existing in the repository does NOT automatically mean the feature is complete.

---

# 20. Agent Decision Rules

When multiple tasks are available:

### Rule 1

Choose the highest-priority unresolved task.

### Rule 2

If blocked, identify the exact blocker.

### Rule 3

Do not hide blockers.

### Rule 4

Do not modify unrelated systems.

### Rule 5

Do not rewrite working architecture without justification.

### Rule 6

If the roadmap conflicts with the repository:

```text
Inspect repository
→ determine actual state
→ preserve intentional architecture
→ update roadmap
```

### Rule 7

If architecture conflicts with implementation:

Do not silently choose one.

Inspect:

```text
ai/ARCHITECTURE.md
ai/SYSTEM.md
actual repository
recent implementation
```

Then make the smallest justified correction.

---

# 21. Roadmap Update Protocol

After completing a task, the agent MUST update:

1. Task status.
2. Relevant phase.
3. Blockers.
4. Acceptance criteria.
5. Test status.
6. Current critical backlog if necessary.

Do not rewrite historical information unnecessarily.

When a task is verified, change:

```text
[VERIFY]
```

to:

```text
[x]
```

When implementation is incomplete:

```text
[PARTIAL]
```

When implementation has not started:

```text
[ ]
```

When a dependency prevents progress:

```text
[BLOCKED]
```

and include the exact blocker.

---

# 22. Current Autonomous Next Step

The next autonomous task should be selected from the highest unresolved priority.

Current sequence:

```text
1. Verify authentication E2E
2. Verify RLS/data isolation
3. Verify admin authorization
4. Verify AI tutor end-to-end
5. Verify RAG end-to-end
6. Implement student knowledge contribution UI
7. Add critical E2E tests
8. Performance baseline
9. Production hardening
```

Do NOT jump directly to UI polish.

---

# 23. Final Autonomous Rule

The agent must continuously ask:

> "What is the highest-priority unresolved problem that prevents StudyOS from becoming a secure, reliable, adaptive learning platform?"

Then:

```text
Inspect
→ Fix
→ Test
→ Verify
→ Document
→ Continue
```

The objective is not to maximize the number of files changed.

The objective is to move StudyOS toward a **stable, secure, adaptive, research-ready learning system** with the smallest number of correct changes.
