# STUDYOS — DEVELOPMENT WORKFLOW

## 1. BEFORE CODING

Inspect:

```text
repository structure
existing implementation
related components
database schema
migrations
AI services
environment variables
tests
```

---

# 2. PLAN

For non-trivial changes:

```text
Goal
Affected modules
Files likely to change
Database changes
API changes
Security impact
Testing plan
```

---

# 3. IMPLEMENTATION

Prefer small, composable changes.

Do not rewrite unrelated code.

Do not silently remove existing features.

---

# 4. VALIDATION

Run appropriate:

```text
typecheck
lint
tests
build
```

---

# 5. DEBUGGING

When a bug occurs:

```text
Reproduce
 ↓
Find root cause
 ↓
Fix root cause
 ↓
Test
 ↓
Check regressions
```

Do not repeatedly patch symptoms.

---

# 6. DEPENDENCIES

Before installing a package:

1. Check whether an existing dependency solves the problem.
2. Check whether the functionality can be implemented simply without a dependency.
3. Avoid unnecessary packages.

---

# 7. DATABASE CHANGES

Never modify production schema manually without a migration.

---

# 8. DOCUMENTATION

When architecture changes, update the corresponding `.ai/*.md` file.

Documentation is part of the implementation.
