# STUDYOS — ARCHITECTURE

## 1. STACK

```text
Frontend:
Next.js 16
React 19
TypeScript

UI:
Tailwind CSS v4
shadcn/ui

Backend:
Next.js Server
Server Actions / Route Handlers

Database:
Supabase
PostgreSQL
RLS
pgvector

AI:
OmniRoute
Provider Abstraction Layer

Retrieval:
Hybrid Search
Dense Vector + Keyword

Deployment:
Vercel-compatible architecture
```

---

# 2. HIGH-LEVEL ARCHITECTURE

```text
                    ┌─────────────────────┐
                    │      Student        │
                    └──────────┬──────────┘
                               │
                               ▼
                    ┌─────────────────────┐
                    │      Next.js UI     │
                    └──────────┬──────────┘
                               │
                               ▼
                    ┌─────────────────────┐
                    │ API / Server Action  │
                    └──────────┬──────────┘
                               │
                               ▼
                    ┌─────────────────────┐
                    │   AI Orchestrator   │
                    └──────────┬──────────┘
                               │
             ┌─────────────────┼─────────────────┐
             ▼                 ▼                 ▼
       Intent Router       Context         Retrieval
             │             Assembly            │
             │                 │                │
             └─────────────────┼────────────────┘
                               ▼
                    ┌─────────────────────┐
                    │   Provider Layer    │
                    └──────────┬──────────┘
                               │
                               ▼
                         OmniRoute / LLM
                               │
                               ▼
                    ┌─────────────────────┐
                    │ Guardrails / Parser │
                    └──────────┬──────────┘
                               │
                               ▼
                    Structured AI Response
                               │
              ┌────────────────┼────────────────┐
              ▼                ▼                ▼
            UI             Learning          Telemetry
                           Engine
```

---

# 3. LAYER RESPONSIBILITIES

## Presentation

Responsible for:

* rendering
* interaction
* loading states
* errors
* accessibility

Must NOT contain:

* provider credentials
* database business logic
* AI orchestration logic

---

## API / Server Layer

Responsible for:

* authentication
* authorization
* validation
* request orchestration
* calling domain services

---

## Domain Layer

Responsible for:

* learning logic
* mastery calculation
* quiz evaluation
* recommendations
* AI routing

---

## Infrastructure Layer

Responsible for:

* Supabase
* pgvector
* AI providers
* embeddings
* external services

---

# 4. AI REQUEST RULE

All AI requests:

```text
UI
→ Server
→ Orchestrator
→ Provider
```

Never:

```text
UI → LLM
```

---

# 5. DATA FLOW

Student question:

```text
Question
 ↓
Authentication
 ↓
Input Validation
 ↓
Intent Detection
 ↓
Agent Routing
 ↓
Student Context
 ↓
Mastery Context
 ↓
RAG Retrieval
 ↓
Prompt Assembly
 ↓
LLM
 ↓
Output Validation
 ↓
Guardrails
 ↓
Structured Response
 ↓
Learning Event
 ↓
Telemetry
```

---

# 6. FAILURE ISOLATION

External failures must not crash the entire application.

Handle:

```text
timeout
502
503
429
provider unavailable
invalid model response
invalid JSON
embedding failure
retrieval failure
database failure
```

The system should degrade gracefully where possible.

---

# 7. EXTENSIBILITY

New AI providers must be added through the provider abstraction.

New agents must be registered through the orchestrator.

New learning algorithms must not require rewriting the UI.

New knowledge sources must enter through the ingestion pipeline.
