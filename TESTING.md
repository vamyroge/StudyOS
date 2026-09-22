# TESTING.md - StudyOS Testing Strategy

## Status: PARTIALLY IMPLEMENTED

Vitest is configured and runs unit tests for AI configuration, deterministic intent/role routing, guardrails, embedding configuration, and local rate limiting. Database, API, Storage, provider, and E2E tests remain blocked until a dedicated Supabase environment and external provider test credentials are available.

## Planned Testing Layers

### Unit Tests
- Business logic in `src/lib/`
- Utility functions
- Data transformations
- Zod schema validations

### Integration Tests
- API routes
- Server Actions
- Supabase queries
- AI provider integration

### Component Tests
- Interactive UI components
- Form validation
- State management

### E2E Tests
- Critical user flows
- Authentication
- Study session workflows

## Tools
- Test runner: Vitest
- Component testing: not configured
- E2E: not configured

## Guidelines
- New features must include tests
- Tests must not use fake educational data as real data
- AI-dependent tests should use mocks
- Database tests should use a test schema/project
