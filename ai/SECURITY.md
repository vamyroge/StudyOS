# STUDYOS — SECURITY

## 1. SECRETS

Never expose server secrets to client code.

Examples:

```text
SUPABASE_SERVICE_ROLE_KEY
AI API keys
embedding API keys
admin secrets
```

Only public Supabase values may exist client-side where appropriate.

---

# 2. AUTHENTICATION

Protected routes must verify authentication server-side.

Do not rely exclusively on frontend route guards.

---

# 3. AUTHORIZATION

Authentication answers:

```text
Who are you?
```

Authorization answers:

```text
What are you allowed to access?
```

Both must be enforced.

---

# 4. DATABASE

Every user-owned table must have appropriate RLS.

Never assume:

```text
authenticated = authorized
```

---

# 5. ADMIN

Admin functionality must have explicit authorization.

Never hide admin access only through UI.

---

# 6. AI DATA

Do not send unnecessary private student information to external models.

Context assembly must minimize data exposure.

---

# 7. USER-GENERATED KNOWLEDGE

User contributions must not automatically become trusted knowledge.

Use:

```text
pending
→ review
→ approved / rejected
```

where appropriate.

---

# 8. PROMPT INJECTION

Retrieved documents and user content are untrusted input.

Do not treat retrieved text as system instructions.

Maintain separation between:

```text
system instructions
developer rules
application context
retrieved content
user input
```
