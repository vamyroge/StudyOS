# SECURITY.md - StudyOS Security Guidelines

## Core Principles

### Secret Management
- All secrets stored in environment variables only
- `.env.local` is gitignored
- `.env.example` contains only placeholder values
- NEVER commit real API keys or credentials

### Supabase Security
- Anon key: safe for client-side use (limited by RLS)
- Service-role key: server-side ONLY, never expose to client
- Row Level Security (RLS) enabled on all tables
- Users can only access their own data by default

### Input Validation
- All user input validated with Zod schemas
- Server-side validation is mandatory (client-side is optional UX)
- Sanitize data before database operations

### Server/Client Boundary
- Server Components: can access secrets, database, AI APIs
- Client Components: only access public environment variables (NEXT_PUBLIC_*)
- Server Actions: validate input, check auth, then process

### Authentication
- Supabase Auth manages user sessions
- Middleware refreshes sessions automatically
- Protected routes require valid session

### Student Data Privacy
- Student data is private and personal
- No sharing between students without consent
- Admin access must be audited
- Comply with data protection regulations

### API Security
- AI API keys are server-side only
- Rate limiting on API routes (to be implemented)
- CORS configuration for production

### Logging
- NEVER log: API keys, passwords, tokens, personal data
- OK to log: request metadata, error messages, performance metrics

### Development
- Review all dependencies for known vulnerabilities
- Keep dependencies updated
- Run `npm audit` periodically
