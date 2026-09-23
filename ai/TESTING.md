# STUDYOS — TESTING

## 1. REQUIRED CHECKS

Before declaring a significant task complete:

```text
typecheck
lint
build
```

---

# 2. UNIT TESTS

Prioritize:

```text
mastery calculations
quiz evaluation
AI routing
validation
data transformations
utility functions
```

---

# 3. INTEGRATION TESTS

Test:

```text
authentication
database access
RLS
AI orchestration
RAG retrieval
quiz submission
learning event creation
```

---

# 4. E2E TESTS

Critical flows:

```text
register
login
protected route
ask AI
retrieve knowledge
take quiz
submit answer
view progress
```

## 4.1 Supabase Auth, RLS, and Admin Verification

Run the non-destructive live verification only against a dedicated Supabase test project:

```text
TEST_SUPABASE_URL
TEST_SUPABASE_ANON_KEY
TEST_STUDENT_A_EMAIL
TEST_STUDENT_A_PASSWORD
TEST_STUDENT_B_EMAIL
TEST_STUDENT_B_PASSWORD
TEST_ADMIN_EMAIL
TEST_ADMIN_PASSWORD
ALLOW_REMOTE_SUPABASE_TESTS=true
```

Then run:

```bash
npm run test:supabase
```

The script signs in existing test accounts, verifies each account's role, confirms Student A cannot read Student B's profile or conversations, and confirms the admin can read both student profiles. It does not create, modify, or delete data.

---

# 5. AI TESTING

Do not require identical natural-language responses.

Test:

```text
schema validity
required fields
routing correctness
error handling
source handling
safety constraints
```

---

# 6. REGRESSION

When fixing a bug:

```text
reproduce
→ fix
→ add regression test
```

where practical.
