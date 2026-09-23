# STUDYOS — AI ARCHITECTURE

## 1. AI ORCHESTRATOR

The orchestrator is the single entry point for StudyOS AI behavior.

Responsibilities:

```text
Intent Detection
Agent Routing
Context Assembly
RAG Retrieval
Model Selection
Prompt Construction
Response Parsing
Guardrails
Telemetry
```

---

# 2. AGENTS

Initial logical agents:

```text
Math Tutor
Physics Tutor
Chemistry Tutor
Literature / Humanities Tutor
Quiz Generator
Knowledge / RAG Agent
Progress / Diagnostic Agent
```

Agents are logical capabilities, not necessarily separate LLM instances.

Do not create unnecessary independent agents.

---

# 3. ROUTING

Example:

```text
"Giải phương trình..."
→ Math Tutor

"Tại sao phản ứng này xảy ra?"
→ Chemistry Tutor

"Tạo 10 câu trắc nghiệm..."
→ Quiz Generator

"Tôi yếu phần dao động..."
→ Progress / Diagnostic

"Trong tài liệu này nói gì về..."
→ Knowledge / RAG
```

---

# 4. MODEL ABSTRACTION

Application code must depend on:

```text
AI Provider Interface
```

rather than directly depending on one provider.

Conceptually:

```text
StudyOS
 ↓
AI Provider Interface
 ↓
OmniRoute
 ↓
Model
```

This allows future provider replacement.

---

# 5. STRUCTURED RESPONSE

AI responses should use structured schemas whenever the output is consumed programmatically.

Conceptual response:

```json
{
  "answer": "...",
  "intent": "...",
  "agent": "...",
  "sources": [],
  "hints": [],
  "nextAction": null,
  "learningEvent": null
}
```

Never depend on fragile string parsing when structured output is possible.

---

# 6. AI TELEMETRY

Track appropriate metadata:

```text
run_id
user_id
session_id
agent
model
prompt_version
retrieval_sources
latency
success
failure_type
created_at
```

Do not store unnecessary sensitive content.

---

# 7. AI SAFETY

The system must:

* avoid fabricated sources
* distinguish retrieved knowledge from generated explanation
* handle uncertainty
* avoid claiming actions that were not performed
* validate structured responses
* reject malformed model output
* protect private user data
