# StudyOS

AI Study Platform cho học sinh THPT Việt Nam.

## Tech Stack

- Next.js 16 + TypeScript (strict) + App Router
- Tailwind CSS v4 + shadcn/ui
- Supabase (Auth, PostgreSQL, Storage)
- OmniRoute / OpenRouter (AI via abstraction layer)
- Zod (validation)

## Getting Started

```bash
cp .env.example .env.local
# Fill in Supabase and AI credentials in .env.local

npm install
npm run migrate # requires DATABASE_URL
npm run seed    # requires Supabase credentials and applied migrations
npm run dev
```

Open http://localhost:3000.

## Commands

| Command | Description |
|---------|-------------|
| `npm run dev` | Start development server |
| `npm run build` | Production build |
| `npm run lint` | Run ESLint |
| `npm run typecheck` | TypeScript type checking |
| `npm test` | Run unit tests |
| `npm run migrate` | Apply tracked SQL migrations using DATABASE_URL |
| `npm run seed` | Seed runnable curriculum and question data |
| `npm start` | Start production server |

## Project Structure

See ARCHITECTURE.md for full directory structure.

## Documentation

- AGENTS.md - Development rules
- PROJECT_CONTEXT.md - Product overview
- ARCHITECTURE.md - System architecture
- ROADMAP.md - Development phases
- DATABASE.md - Database schema
- AI_ARCHITECTURE.md - AI system design
- RAG.md - Retrieval architecture
- LEARNING_ENGINE.md - Knowledge tracing & adaptive learning
- EVALUATION.md - Testing & benchmark framework
- SECURITY.md - Security principles
- TESTING.md - Testing strategy

## MVP Subjects

- Toán (Math)
- Vật lý (Physics)
- Hóa học (Chemistry)

## Roles

- STUDENT - Primary user
- ADMIN - System management

## Implementation Status

- Authentication, protected routes, role helpers, profile editing, privacy controls, question attempts, and deterministic learning updates are implemented in code.
- Tutor orchestration, conversation persistence, usage logging, and RAG integration are implemented in code but require a configured Supabase database, Storage bucket, AI provider, and embedding provider to verify end-to-end.
- TXT, Markdown, and CSV knowledge ingestion is supported when embeddings are configured. PDF/OCR is intentionally rejected until a real extractor is added.
- The process-local rate limiter is a safe single-instance fallback. Production requires shared rate-limit storage.
