# SofLIA Dialogue Runtime Tasks

## Implementation Checklist

- [x] Create implementation plan document.
- [x] Create task tracker document.
- [x] Add dialogue runtime schemas and type guards.
- [x] Add Supabase migration for dialogue runtime tables.
- [x] Add backend services for session, evaluation, policy, tutor, events, and result sync.
- [x] Switch dialogue evaluator and tutor runtime to OpenAI.
- [x] Add dialogue session and message API routes.
- [x] Add learning UI renderer for `soflia_dialogue`.
- [x] Wire renderer into activity cards without changing legacy `ai_chat`.
- [x] Add focused tests for schemas and policy engine.
- [ ] Run focused tests.
- [ ] Run web type-check.
- [ ] Perform manual QA with a seeded `SOFLIA_DIALOGUE` activity.

## Manual QA Scenarios

- [ ] Correct response completes the activity.
- [ ] Partial response triggers a probe or hint.
- [ ] Keyword-only response does not complete.
- [ ] Repeated low-evidence responses trigger rescue or retry state.
- [ ] Prompt injection attempt is blocked from completion.
- [ ] Refreshing the page resumes the active session.
- [ ] Completed session disables further input.
