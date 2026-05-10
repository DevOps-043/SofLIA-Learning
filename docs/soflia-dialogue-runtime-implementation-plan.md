# SofLIA Dialogue Runtime - Implementation Plan

## Summary

Implement a new `SOFLIA_DIALOGUE` runtime in SofLIA Learning for evaluable workshop conversations. The runtime is separate from the legacy `ai_chat` activity flow and is designed to execute structured dialogue configurations created manually or imported later from Course Engine.

## Decisions

- Keep legacy `ai_chat` behavior unchanged.
- Introduce dialogue activities through `activity_config.interactionType = "soflia_dialogue"` and `runtimeType = "SOFLIA_DIALOGUE"`.
- Do not add superadmin editing UI in this phase.
- Persist dialogue-specific traceability in dedicated tables.
- Sync final dialogue results into existing activity progress so lesson completion continues to work.

## Runtime Flow

1. Load or create a dialogue session for the current user, enrollment, lesson, and activity.
2. Show the configured `openingMessage`.
3. On each student turn:
   - sanitize and persist the student message,
   - evaluate the response against the activity rubric,
   - run the deterministic policy engine,
   - generate the tutor response for the decided next action,
   - persist turn, evaluation, policy decision, and event records,
   - close and sync progress when the policy reaches a terminal state.
4. Expose session state to the UI without leaking internal prompts, full rubric, rescue content, or evaluator notes.

## Implementation Areas

- Activity schemas: add `soflia_dialogue` configuration and runtime result contracts.
- Database: add tables for sessions, turns, evaluations, results, and events.
- Backend services: session orchestration, evaluator, policy engine, tutor response, events, result sync.
- API routes:
  - `GET /api/courses/[slug]/lessons/[lessonId]/activities/[activityId]/dialogue/session`
  - `POST /api/courses/[slug]/lessons/[lessonId]/activities/[activityId]/dialogue/message`
- UI: add an embedded dialogue renderer for learning activities.

## Validation Commands

```bash
npm run test --workspace=apps/web -- src/features/courses/types/__tests__/dialogue-runtime.test.ts src/features/courses/services/soflia-dialogue/__tests__/dialogue-policy-engine.service.test.ts
npm run type-check --workspace=apps/web
```

## Risks

- LLM output may be malformed. Mitigation: strict Zod parsing, recoverable API errors, and event logging.
- Tutor could become too permissive. Mitigation: tutor does not decide completion; backend policy does.
- Existing activity progress could ignore dialogue sessions. Mitigation: sync terminal result to `user_activity_submissions`.
- Course Engine contract may evolve. Mitigation: version `schemaVersion`, `rubricVersion`, and `promptVersion` in config and snapshots.
