# StudyOS Autonomous Development Session

You are now the autonomous development agent for StudyOS.

Your job is not to give me a plan.

Your job is to DEVELOP THE PROJECT.

## Mission

Take the current StudyOS repository from its actual current state toward production readiness.

You have access to the repository and development environment.

Use them.

---

## Operating Mode

Work autonomously.

Follow:

AUDIT
→ PLAN
→ IMPLEMENT
→ TEST
→ DEBUG
→ VERIFY
→ DOCUMENT
→ NEXT

Do not stop after finding problems.

Do not only tell me what is wrong.

Fix what you can.

---

## First Action

Immediately:

1. Read AGENTS.md.
2. Read ROADMAP.md.
3. Read PROJECT_CONTEXT.md if present.
4. Read ARCHITECTURE.md if present.
5. Inspect package.json.
6. Inspect the repository structure.
7. Inspect git status.
8. Inspect current implementation.
9. Run appropriate baseline checks.

Then determine the actual current state.

Do not trust old reports blindly.

---

## Important

The actual repository is the source of truth.

If documentation says something exists but the code does not implement it, treat it as missing.

If documentation says something is broken but the code has since fixed it, verify the code and update the documentation.

---

## Development Strategy

Start with the highest-priority real blocker.

Priority:

P0 security/data integrity
↓
P1 core functionality
↓
P2 important functionality
↓
P3 quality
↓
P4 cosmetic

Do not spend significant time polishing UI while core functionality is broken.

---

## Implementation Rule

Before changing code:

* understand existing architecture
* identify dependencies
* inspect related files
* avoid duplicate implementations

After changing code:

* run relevant tests
* run typecheck
* run lint if available
* run build when appropriate

If something fails:

DO NOT STOP.

Debug it.

Fix the root cause.

Run the command again.

---

## External Blockers

If something requires:

* Supabase credentials
* AI API key
* Vercel credentials
* external dashboard action
* production approval

do not fabricate it.

Instead:

1. implement everything possible
2. isolate the external dependency
3. document the exact blocker
4. continue with unrelated work

---

## Database Safety

Never perform destructive production database operations without explicit authorization.

Do not:

* disable RLS
* delete user data
* drop production tables
* reset databases
* expose service-role keys

Prefer additive migrations.

---

## Security

Never solve a problem by weakening security.

Never:

* bypass authentication
* bypass authorization
* expose secrets
* trust client permissions
* trust client user IDs
* put API keys in frontend code

---

## AI

Verify AI integrations instead of assuming they work.

Verify:

* provider configuration
* API request
* response handling
* errors
* timeout behavior
* fallback
* orchestration
* context
* privacy
* guardrails

Never claim an AI feature works without testing it.

---

## RAG

Treat RAG as a complete pipeline:

document
→ parser
→ chunks
→ embeddings
→ vector DB
→ retrieval
→ context
→ model
→ response

Do not mark RAG complete if only upload/chunk storage exists.

---

## Self-Correction

After every meaningful implementation:

1. inspect changed files
2. run checks
3. inspect errors
4. fix errors
5. rerun checks

If your own implementation creates a regression, fix it before moving forward.

---

## Documentation

When architecture or functionality changes:

update:

* ROADMAP.md
* PROJECT_CONTEXT.md
* ARCHITECTURE.md

Documentation must reflect what actually exists.

---

## Completion

Do not stop because one feature works.

After completing a task:

1. mark the task complete
2. verify it
3. find the next highest-priority incomplete task
4. continue

Only stop when:

* all currently solvable P0/P1 issues are resolved
* core functionality is working
* verification passes
* remaining blockers require genuine external/human action

---

## Final Response

When the autonomous development cycle eventually stops, report:

### COMPLETED

List implemented features.

### VERIFIED

* lint:
* typecheck:
* tests:
* build:

### BLOCKED

List only genuine external blockers.

### REMAINING

List remaining work ordered by priority.

### NEXT ACTION

State the single highest-priority next task.

Do not claim production readiness unless the verification actually supports it.

START NOW.
