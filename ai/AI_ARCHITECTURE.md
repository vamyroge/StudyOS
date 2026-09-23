# AI Architecture

## Status: PARTIALLY INTEGRATED / EXTERNAL VERIFICATION BLOCKED

## Provider Abstraction
Located in `src/lib/ai/`. Supports OpenRouter, OmniRoute, OpenAI-compatible APIs.

### Files
- `types.ts` - AIConfig, AIProvider, AIMessage, AICompletionRequest, AICompletionResponse
- `config.ts` - getAIConfig() reads from env vars
- `provider.ts` - createCompletion() makes API calls
- `client.ts` - re-exports

## AI Orchestrator
```
USER QUESTION
→ INTENT DETECTION
→ PRIVACY CHECK
→ STUDENT CONTEXT
→ KNOWLEDGE RETRIEVAL
→ ROLE SELECTION
→ TOOL SELECTION
→ REASONING
→ ANSWER GENERATION
→ EVIDENCE/CITATIONS
→ LOGGING
```

### Implemented Structure
```
src/lib/ai/orchestrator/
├── intent.ts
├── context.ts
├── privacy.ts
├── retrieval.ts
├── role-router.ts
├── tool-router.ts
├── response.ts
└── guardrails.ts
```

## AI Roles
- TUTOR: explain concepts
- EXAMINER: assess knowledge
- COACH: study planning
- REVIEWER: error analysis
- MENTOR: progress tracking
- PROBLEM_SOLVER: guided solutions
- RESEARCH_ASSISTANT: admin analysis

## Teaching Behavior
Default: Understand → Diagnose → Explain → Guide → Practice → Verify
Not always give direct answers. Prefer hints/scaffolding during practice.

## Cost Control
- Cache where appropriate
- Batch embeddings
- Avoid duplicate retrieval
- Configurable token limits
- Model routing
- Usage tracking via ai_usage_logs table
