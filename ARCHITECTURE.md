# StudyOS Architecture

## System Overview
```
                         TRYEUStudyHUB
                               │
              ┌────────────────┼────────────────┐
              │                │                │
              ▼                ▼                ▼
        STUDENT APP       KNOWLEDGE CORE      ADMIN
              │                │                │
              ▼                ▼                ▼
        Student Model     Knowledge Base    Moderation
        Learning Data     Knowledge Graph   Audit
        Privacy           Hybrid RAG        Evaluation
              │                │                │
              └────────────────┼────────────────┘
                               ▼
                         AI ORCHESTRATOR
                               │
              ┌─────────────────┼─────────────────┐
              ▼                 ▼                 ▼
            Tutor            Examiner           Coach
            Reviewer         Mentor             Solver
                               │
                               ▼
                            OmniRoute
                               │
                          Selected Model
```

## Tech Stack
- Frontend: Next.js 16, React 19, TypeScript (strict), App Router, Tailwind CSS v4, shadcn/ui, Lucide
- Backend: Next.js Server Actions / Route Handlers, TypeScript
- Database: Supabase PostgreSQL + pgvector
- Auth: Supabase Auth
- Storage: Supabase Storage
- AI Gateway: OmniRoute (via abstraction layer)
- Validation: Zod
- AI SDK: Vercel AI SDK (`ai` package)

## Directory Structure
```
src/
├── app/
│   ├── (auth)/          # login, register
│   ├── dashboard/       # student dashboard
│   ├── tutor/           # AI tutor
│   ├── questions/       # question bank
│   ├── progress/        # learning progress
│   ├── knowledge/       # knowledge base
│   ├── profile/         # student profile
│   ├── settings/        # privacy & settings
│   └── admin/           # admin dashboard
├── components/
│   ├── ui/              # shadcn components
│   ├── dashboard/
│   ├── tutor/
│   ├── questions/
│   ├── progress/
│   ├── knowledge/
│   └── admin/
├── lib/
│   ├── ai/              # AI orchestrator + providers
│   │   ├── orchestrator/
│   │   ├── providers/
│   │   ├── prompts/
│   │   ├── tools/
│   │   ├── evaluation/
│   │   └── usage/
│   ├── auth/            # auth helpers
│   ├── rag/             # RAG pipeline
│   ├── knowledge/       # knowledge graph
│   ├── learning/        # adaptive learning
│   ├── mastery/         # knowledge tracing
│   ├── questions/       # question logic
│   ├── recommendations/ # recommendation engine
│   ├── ingestion/       # document processing
│   ├── evaluation/      # RAG/AI evaluation
│   ├── analytics/       # learning analytics
│   ├── security/        # rate limiting, validation
│   └── supabase/        # supabase clients
├── types/
└── config/
database/
├── migrations/
├── seed/
└── functions/
scripts/
tests/
docs/
```

## Key Principles
- Server Components by default, Client only when needed
- No hard-coded secrets
- Supabase service-role key NEVER on client
- All API inputs validated with Zod
- Server-side authorization mandatory
- Raw data (attempts) immutable; derived data (mastery) computed
- Feature flags for experimental features
- Version everything: documents, algorithms, models, experiments
