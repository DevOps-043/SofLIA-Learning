# Service Role Audit

Snapshot: 2026-05-18

Scope: static inventory of `SUPABASE_SERVICE_ROLE_KEY` references for task 1.7.

Unique files with references: 92.
Files that read `process.env.SUPABASE_SERVICE_ROLE_KEY`: 86.
Convention violations: 0.

Convention: service-role code must live in an API route, backend/serverless job, test, local script, `.server.ts` file, or a module guarded by `import 'server-only'`.

Guardrail: `apps/web/src/lib/security/__tests__/service-role-convention.test.ts` fails if an `apps/web/src` env read is added outside those scopes.

| Archivo | Funcion / Proposito | Veredicto | Accion | Estado |
|---|---|---|---|---|
| `apps/api/src/config/env.production.ts` | Documentation or user-facing diagnostic string | Justificado | No env read | Done |
| `apps/api/src/config/env.resolve.ts` | Documentation or user-facing diagnostic string | Justificado | No env read | Done |
| `apps/api/src/config/env.schema.ts` | Documentation or user-facing diagnostic string | Justificado | No env read | Done |
| `apps/api/src/core/supabase/service-client.ts` | Documentation or user-facing diagnostic string | Justificado | No env read | Done |
| `apps/web/src/app/api/[orgSlug]/business-user/lp/[lpId]/intro-video/route.get.ts` | Next API route server-side operation | Justificado | Prefer shared admin helper when touched | Done |
| `apps/web/src/app/api/[orgSlug]/business-user/lp/[lpId]/intro-video/route.post.ts` | Next API route server-side operation | Justificado | Prefer shared admin helper when touched | Done |
| `apps/web/src/app/api/[orgSlug]/business/hierarchy/chats/[chatId]/messages/[messageId]/route.delete.ts` | Next API route server-side operation | Justificado | Prefer shared admin helper when touched | Done |
| `apps/web/src/app/api/[orgSlug]/business/hierarchy/chats/[chatId]/messages/[messageId]/route.put.ts` | Next API route server-side operation | Justificado | Prefer shared admin helper when touched | Done |
| `apps/web/src/app/api/[orgSlug]/business/hierarchy/chats/[chatId]/messages/route.ts` | Next API route server-side operation | Justificado | Prefer shared admin helper when touched | Done |
| `apps/web/src/app/api/[orgSlug]/business/hierarchy/chats/[chatId]/read/route.ts` | Next API route server-side operation | Justificado | Prefer shared admin helper when touched | Done |
| `apps/web/src/app/api/[orgSlug]/business/hierarchy/chats/[chatId]/route.ts` | Next API route server-side operation | Justificado | Prefer shared admin helper when touched | Done |
| `apps/web/src/app/api/[orgSlug]/business/hierarchy/chats/route.ts` | Next API route server-side operation | Justificado | Prefer shared admin helper when touched | Done |
| `apps/web/src/app/api/[orgSlug]/business/hierarchy/nodes/[nodeId]/route.ts` | Next API route server-side operation | Justificado | Prefer shared admin helper when touched | Done |
| `apps/web/src/app/api/[orgSlug]/business/hierarchy/nodes/route.post.ts` | Next API route server-side operation | Justificado | Prefer shared admin helper when touched | Done |
| `apps/web/src/app/api/[orgSlug]/business/intro-videos/course/[courseId]/route.delete.ts` | Next API route server-side operation | Justificado | Prefer shared admin helper when touched | Done |
| `apps/web/src/app/api/[orgSlug]/business/intro-videos/course/[courseId]/route.get.ts` | Next API route server-side operation | Justificado | Prefer shared admin helper when touched | Done |
| `apps/web/src/app/api/[orgSlug]/business/intro-videos/course/[courseId]/route.put.ts` | Next API route server-side operation | Justificado | Prefer shared admin helper when touched | Done |
| `apps/web/src/app/api/[orgSlug]/business/intro-videos/learning-path/[lpId]/route.delete.ts` | Next API route server-side operation | Justificado | Prefer shared admin helper when touched | Done |
| `apps/web/src/app/api/[orgSlug]/business/intro-videos/learning-path/[lpId]/route.get.ts` | Next API route server-side operation | Justificado | Prefer shared admin helper when touched | Done |
| `apps/web/src/app/api/[orgSlug]/business/intro-videos/learning-path/[lpId]/route.put.ts` | Next API route server-side operation | Justificado | Prefer shared admin helper when touched | Done |
| `apps/web/src/app/api/[orgSlug]/business/intro-videos/upload-url/route.ts` | Next API route server-side operation | Justificado | Prefer shared admin helper when touched | Done |
| `apps/web/src/app/api/[orgSlug]/business/users/upload-picture/route.ts` | Next API route server-side operation | Justificado | Prefer shared admin helper when touched | Done |
| `apps/web/src/app/api/admin/transcoding/drain/route.ts` | Next API route server-side operation | Justificado | Prefer shared admin helper when touched | Done |
| `apps/web/src/app/api/admin/transcoding/jobs/route.ts` | Next API route server-side operation | Justificado | Prefer shared admin helper when touched | Done |
| `apps/web/src/app/api/admin/transcoding/reprocess/reprocess-transcoding.helpers.ts` | Server-only module with service role access | Justificado | Guarded by server-only import or .server.ts | Done |
| `apps/web/src/app/api/admin/transcoding/scan-and-queue/route.ts` | Next API route server-side operation | Justificado | Prefer shared admin helper when touched | Done |
| `apps/web/src/app/api/admin/upload/course-materials/route.ts` | Next API route server-side operation | Justificado | Prefer shared admin helper when touched | Done |
| `apps/web/src/app/api/admin/upload/course-videos/route.ts` | Next API route server-side operation | Justificado | Prefer shared admin helper when touched | Done |
| `apps/web/src/app/api/admin/upload/course-videos/status/[jobId]/route.ts` | Next API route server-side operation | Justificado | Prefer shared admin helper when touched | Done |
| `apps/web/src/app/api/admin/upload/course-videos/transcode/route.ts` | Next API route server-side operation | Justificado | Prefer shared admin helper when touched | Done |
| `apps/web/src/app/api/admin/upload/organization-image/route.ts` | Next API route server-side operation | Justificado | Prefer shared admin helper when touched | Done |
| `apps/web/src/app/api/admin/upload/skill-icon/route.ts` | Next API route server-side operation | Justificado | Prefer shared admin helper when touched | Done |
| `apps/web/src/app/api/business/hierarchy/chats/[chatId]/messages/[messageId]/route.ts` | Next API route server-side operation | Justificado | Prefer shared admin helper when touched | Done |
| `apps/web/src/app/api/business/hierarchy/chats/[chatId]/messages/route.ts` | Next API route server-side operation | Justificado | Prefer shared admin helper when touched | Done |
| `apps/web/src/app/api/business/hierarchy/chats/[chatId]/read/route.ts` | Next API route server-side operation | Justificado | Prefer shared admin helper when touched | Done |
| `apps/web/src/app/api/business/hierarchy/chats/[chatId]/route.ts` | Next API route server-side operation | Justificado | Prefer shared admin helper when touched | Done |
| `apps/web/src/app/api/business/hierarchy/chats/hierarchy-chats/service-client.ts` | Server-only module with service role access | Justificado | Guarded by server-only import or .server.ts | Done |
| `apps/web/src/app/api/business/hierarchy/nodes/[nodeId]/route.ts` | Next API route server-side operation | Justificado | Prefer shared admin helper when touched | Done |
| `apps/web/src/app/api/business/hierarchy/nodes/route.post.ts` | Next API route server-side operation | Justificado | Prefer shared admin helper when touched | Done |
| `apps/web/src/app/api/business/users/upload-picture/route.ts` | Next API route server-side operation | Justificado | Prefer shared admin helper when touched | Done |
| `apps/web/src/app/api/communities/[slug]/moderation/reports/route.ts` | Next API route server-side operation | Justificado | Prefer shared admin helper when touched | Done |
| `apps/web/src/app/api/communities/[slug]/posts/[postId]/report/route.ts` | Next API route server-side operation | Justificado | Prefer shared admin helper when touched | Done |
| `apps/web/src/app/api/communities/[slug]/reports/[reportId]/resolve/route.ts` | Next API route server-side operation | Justificado | Prefer shared admin helper when touched | Done |
| `apps/web/src/app/api/courses/[slug]/intro-videos/route.ts` | Next API route server-side operation | Justificado | Prefer shared admin helper when touched | Done |
| `apps/web/src/app/api/courses/[slug]/intro-videos/watched/route.ts` | Next API route server-side operation | Justificado | Prefer shared admin helper when touched | Done |
| `apps/web/src/app/api/courses/import/course-import/service-client.ts` | Server-only module with service role access | Justificado | Guarded by server-only import or .server.ts | Done |
| `apps/web/src/app/api/courses/import/route.ts` | Next API route server-side operation | Justificado | Prefer shared admin helper when touched | Done |
| `apps/web/src/app/api/lia/chat/lia-chat-history.service.ts` | Server-only module with service role access | Justificado | Guarded by server-only import or .server.ts | Done |
| `apps/web/src/app/api/profile/upload-picture/route.ts` | Next API route server-side operation | Justificado | Prefer shared admin helper when touched | Done |
| `apps/web/src/app/api/study-planner/active-plan/route.ts` | Next API route server-side operation | Justificado | Prefer shared admin helper when touched | Done |
| `apps/web/src/app/api/study-planner/calendar/check-changes/check-changes-db.service.ts` | Server-only module with service role access | Justificado | Guarded by server-only import or .server.ts | Done |
| `apps/web/src/app/api/study-planner/calendar/cleanup/route.ts` | Next API route server-side operation | Justificado | Prefer shared admin helper when touched | Done |
| `apps/web/src/app/api/study-planner/calendar/delete-plan-events/route.ts` | Next API route server-side operation | Justificado | Prefer shared admin helper when touched | Done |
| `apps/web/src/app/api/study-planner/calendar/events/__tests__/calendar-events.db.test.ts` | Test fixture or service-role guardrail | Justificado | OK | Done |
| `apps/web/src/app/api/study-planner/calendar/insert-events/route.ts` | Next API route server-side operation | Justificado | Prefer shared admin helper when touched | Done |
| `apps/web/src/app/api/study-planner/calendar/list/calendar-list-admin-client.ts` | Server-only module with service role access | Justificado | Guarded by server-only import or .server.ts | Done |
| `apps/web/src/app/api/study-planner/calendar/status/route.ts` | Next API route server-side operation | Justificado | Prefer shared admin helper when touched | Done |
| `apps/web/src/app/api/study-planner/dashboard/chat/calendar-access.service.ts` | Server-only module with service role access | Justificado | Guarded by server-only import or .server.ts | Done |
| `apps/web/src/app/api/study-planner/dashboard/plan/route.ts` | Next API route server-side operation | Justificado | Prefer shared admin helper when touched | Done |
| `apps/web/src/app/api/study-planner/dashboard/sync-calendar/check/calendar-change-check.service.ts` | Server-only module with service role access | Justificado | Guarded by server-only import or .server.ts | Done |
| `apps/web/src/app/api/study-planner/events/[id]/event-update.service.ts` | Server-only module with service role access | Justificado | Guarded by server-only import or .server.ts | Done |
| `apps/web/src/app/api/study-planner/events/calendar-event-sync.service.ts` | Server-only module with service role access | Justificado | Guarded by server-only import or .server.ts | Done |
| `apps/web/src/app/api/study-planner/events/calendar-token-manager.client.ts` | Server-only module with service role access | Justificado | Guarded by server-only import or .server.ts | Done |
| `apps/web/src/app/api/study-planner/lesson-tracking/complete/route.ts` | Next API route server-side operation | Justificado | Prefer shared admin helper when touched | Done |
| `apps/web/src/app/api/study-planner/lesson-tracking/event/route.ts` | Next API route server-side operation | Justificado | Prefer shared admin helper when touched | Done |
| `apps/web/src/app/api/study-planner/lesson-tracking/route.ts` | Next API route server-side operation | Justificado | Prefer shared admin helper when touched | Done |
| `apps/web/src/app/api/study-planner/lesson-tracking/start/route.ts` | Next API route server-side operation | Justificado | Prefer shared admin helper when touched | Done |
| `apps/web/src/app/api/study-planner/save-plan/save-plan-organization.service.ts` | Server-only module with service role access | Justificado | Guarded by server-only import or .server.ts | Done |
| `apps/web/src/app/api/study-planner/status/route.ts` | Next API route server-side operation | Justificado | Prefer shared admin helper when touched | Done |
| `apps/web/src/app/api/test-translation/lesson-es/route.ts` | Next API route server-side operation | Justificado | Prefer shared admin helper when touched | Done |
| `apps/web/src/app/api/tours/route.ts` | Next API route server-side operation | Justificado | Prefer shared admin helper when touched | Done |
| `apps/web/src/app/api/upload/route.ts` | Next API route server-side operation | Justificado | Prefer shared admin helper when touched | Done |
| `apps/web/src/app/study-planner/calendar/callback/page.tsx` | Documentation or user-facing diagnostic string | Justificado | No env read | Done |
| `apps/web/src/core/reporting/report-problem.server.ts` | Server-only module with service role access | Justificado | Guarded by server-only import or .server.ts | Done |
| `apps/web/src/core/services/content-translation/content-translation.write-client.ts` | Server-only module with service role access | Justificado | Guarded by server-only import or .server.ts | Done |
| `apps/web/src/core/services/content-translation/translation-client.ts` | Server-only module with service role access | Justificado | Guarded by server-only import or .server.ts | Done |
| `apps/web/src/core/services/lia-personalization.service.ts` | Server-only module with service role access | Justificado | Guarded by server-only import or .server.ts | Done |
| `apps/web/src/core/services/soflia-personalization.service.ts` | Server-only module with service role access | Justificado | Guarded by server-only import or .server.ts | Done |
| `apps/web/src/features/admin/services/admin-prompts/admin-prompts-transform.service.ts` | Server-only module with service role access | Justificado | Guarded by server-only import or .server.ts | Done |
| `apps/web/src/features/admin/services/admin-users/client.ts` | Server-only module with service role access | Justificado | Guarded by server-only import or .server.ts | Done |
| `apps/web/src/features/admin/services/auditLog.service.ts` | Server-only module with service role access | Justificado | Guarded by server-only import or .server.ts | Done |
| `apps/web/src/features/business-panel/services/__tests__/business-users-server.client.test.ts` | Test fixture or service-role guardrail | Justificado | OK | Done |
| `apps/web/src/features/business-panel/services/business-users-server/client.ts` | Server-only module with service role access | Justificado | Guarded by server-only import or .server.ts | Done |
| `apps/web/src/features/study-planner/services/calendar-db-legacy-admin.service.ts` | Server-only module with service role access | Justificado | Guarded by server-only import or .server.ts | Done |
| `apps/web/src/features/study-planner/services/calendar-sync.service.ts` | Server-only module with service role access | Justificado | Guarded by server-only import or .server.ts | Done |
| `apps/web/src/lib/course-import/admin-client.ts` | Server-only module with service role access | Justificado | Guarded by server-only import or .server.ts | Done |
| `apps/web/src/lib/security/__tests__/service-role-convention.test.ts` | Test fixture or service-role guardrail | Justificado | OK | Done |
| `apps/web/src/lib/supabase/admin.ts` | Server-only module with service role access | Justificado | Guarded by server-only import or .server.ts | Done |
| `netlify/functions/process-inactive-lessons/client.ts` | Background/serverless job | Justificado | Keep in Netlify function scope | Done |
| `netlify/functions/transcode-video-background/env.ts` | Documentation or user-facing diagnostic string | Justificado | No env read | Done |
| `scripts/reorderTest.ts` | Local maintenance script | Justificado | Keep outside client bundle | Done |
| `scripts/verify-progress.js` | Local maintenance script | Justificado | Keep outside client bundle | Done |
