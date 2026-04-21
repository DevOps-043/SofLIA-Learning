# Study Planner Debugging Guide

## Dashboard chat flow

1. Request enters [route.ts](/C:/Users/fysg5/OneDrive/Escritorio/Pulse%20Hub/Soflia%20Learning/SofLIA-Learning/apps/web/src/app/api/study-planner/dashboard/chat/route.ts)
2. Plan context is assembled in [context.service.ts](/C:/Users/fysg5/OneDrive/Escritorio/Pulse%20Hub/Soflia%20Learning/SofLIA-Learning/apps/web/src/app/api/study-planner/dashboard/chat/context.service.ts)
3. Gemini responds through [gemini-chat.service.ts](/C:/Users/fysg5/OneDrive/Escritorio/Pulse%20Hub/Soflia%20Learning/SofLIA-Learning/apps/web/src/app/api/study-planner/dashboard/chat/gemini-chat.service.ts)
4. `<action>` tags are parsed in [chat-actions.service.ts](/C:/Users/fysg5/OneDrive/Escritorio/Pulse%20Hub/Soflia%20Learning/SofLIA-Learning/apps/web/src/app/api/study-planner/dashboard/chat/chat-actions.service.ts)
5. Mutative actions stay as proposals until [confirm/route.ts](/C:/Users/fysg5/OneDrive/Escritorio/Pulse%20Hub/Soflia%20Learning/SofLIA-Learning/apps/web/src/app/api/study-planner/dashboard/chat/confirm/route.ts) executes them
6. The dashboard UI renders status and confirmation controls in [StudyPlannerDashboardAssistant.tsx](/C:/Users/fysg5/OneDrive/Escritorio/Pulse%20Hub/Soflia%20Learning/SofLIA-Learning/apps/web/src/features/study-planner/components/dashboard/StudyPlannerDashboardAssistant.tsx)

## Where to debug by symptom

### Wrong lesson counts or “faltan X lecciones”
- Deterministic source: [study-planner-coverage.server.service.ts](/C:/Users/fysg5/OneDrive/Escritorio/Pulse%20Hub/Soflia%20Learning/SofLIA-Learning/apps/web/src/features/study-planner/services/study-planner-coverage.server.service.ts)
- Pure coverage rules: [study-planner-coverage.shared.ts](/C:/Users/fysg5/OneDrive/Escritorio/Pulse%20Hub/Soflia%20Learning/SofLIA-Learning/apps/web/src/features/study-planner/services/study-planner-coverage.shared.ts)
- Endpoint: [coverage/route.ts](/C:/Users/fysg5/OneDrive/Escritorio/Pulse%20Hub/Soflia%20Learning/SofLIA-Learning/apps/web/src/app/api/study-planner/coverage/route.ts)
- Prompt injection point: `COBERTURA DETERMINISTICA DEL PLAN` in [context.service.ts](/C:/Users/fysg5/OneDrive/Escritorio/Pulse%20Hub/Soflia%20Learning/SofLIA-Learning/apps/web/src/app/api/study-planner/dashboard/chat/context.service.ts)

### Action parser or confirmation bugs
- Main orchestrator: [chat-actions.service.ts](/C:/Users/fysg5/OneDrive/Escritorio/Pulse%20Hub/Soflia%20Learning/SofLIA-Learning/apps/web/src/app/api/study-planner/dashboard/chat/chat-actions.service.ts)
- Validation and schemas: [chat-action-validation.service.ts](/C:/Users/fysg5/OneDrive/Escritorio/Pulse%20Hub/Soflia%20Learning/SofLIA-Learning/apps/web/src/app/api/study-planner/dashboard/chat/chat-action-validation.service.ts)
- Missing `sessionId` resolution: [chat-action-session-reference.service.ts](/C:/Users/fysg5/OneDrive/Escritorio/Pulse%20Hub/Soflia%20Learning/SofLIA-Learning/apps/web/src/app/api/study-planner/dashboard/chat/chat-action-session-reference.service.ts)
- Confirmation execution: [confirm/route.ts](/C:/Users/fysg5/OneDrive/Escritorio/Pulse%20Hub/Soflia%20Learning/SofLIA-Learning/apps/web/src/app/api/study-planner/dashboard/chat/confirm/route.ts)

### Calendar identity or selection confusion
- API response shaping: [calendar/list/route.ts](/C:/Users/fysg5/OneDrive/Escritorio/Pulse%20Hub/Soflia%20Learning/SofLIA-Learning/apps/web/src/app/api/study-planner/calendar/list/route.ts)
- Metadata persistence: [calendar-db.service.ts](/C:/Users/fysg5/OneDrive/Escritorio/Pulse%20Hub/Soflia%20Learning/SofLIA-Learning/apps/web/src/features/study-planner/services/calendar-db.service.ts)
- UI rendering: [CalendarCheckboxItem.tsx](/C:/Users/fysg5/OneDrive/Escritorio/Pulse%20Hub/Soflia%20Learning/SofLIA-Learning/apps/web/src/features/study-planner/components/CalendarSelection/CalendarCheckboxItem.tsx)

### Voice/TTS issues
- Text cleanup and queue rules: [study-planner-voice-text.service.ts](/C:/Users/fysg5/OneDrive/Escritorio/Pulse%20Hub/Soflia%20Learning/SofLIA-Learning/apps/web/src/features/study-planner/services/study-planner-voice-text.service.ts)
- Runtime playback hook: [useStudyPlannerVoiceInteraction.ts](/C:/Users/fysg5/OneDrive/Escritorio/Pulse%20Hub/Soflia%20Learning/SofLIA-Learning/apps/web/src/features/study-planner/hooks/useStudyPlannerVoiceInteraction.ts)

## Trace IDs

- Each dashboard chat request generates a `traceId` in [route.ts](/C:/Users/fysg5/OneDrive/Escritorio/Pulse%20Hub/Soflia%20Learning/SofLIA-Learning/apps/web/src/app/api/study-planner/dashboard/chat/route.ts)
- The same `traceId` flows to proposals, confirmation execution, and UI messages
- When the user reports an action error, start by searching that `traceId` in server logs and the rendered assistant message

## Focused tests

- Action orchestration: [chat-actions.service.test.ts](/C:/Users/fysg5/OneDrive/Escritorio/Pulse%20Hub/Soflia%20Learning/SofLIA-Learning/apps/web/src/app/api/study-planner/dashboard/chat/__tests__/chat-actions.service.test.ts)
- Action validation: [chat-action-validation.service.test.ts](/C:/Users/fysg5/OneDrive/Escritorio/Pulse%20Hub/Soflia%20Learning/SofLIA-Learning/apps/web/src/app/api/study-planner/dashboard/chat/__tests__/chat-action-validation.service.test.ts)
- Coverage rules: [study-planner-coverage.server.service.test.ts](/C:/Users/fysg5/OneDrive/Escritorio/Pulse%20Hub/Soflia%20Learning/SofLIA-Learning/apps/web/src/features/study-planner/services/__tests__/study-planner-coverage.server.service.test.ts)
- Voice cleanup: [study-planner-voice-text.service.test.ts](/C:/Users/fysg5/OneDrive/Escritorio/Pulse%20Hub/Soflia%20Learning/SofLIA-Learning/apps/web/src/features/study-planner/services/__tests__/study-planner-voice-text.service.test.ts)

## Recommended next refactors

1. Replace the inline calendar list prompt block in `context.service.ts` with `buildCalendarListContext`
2. Split `context.service.ts` into plan data, calendar prompt data, and proactive analysis assembly
3. Split `calendar.service.ts` into token access, event normalization, and provider-specific fetch helpers
