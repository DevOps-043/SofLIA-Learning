import { plannerDateRangePath } from './schedule';
import type { FlowContext } from './flow-context';

export async function studyPlannerFlow(context: FlowContext) {
  await context.get('study-planner', 'dashboard-plan', '/api/study-planner/dashboard/plan');
  await context.get('study-planner', 'sessions', plannerDateRangePath());

  if (!context.user.lessonId) return;
  if (context.completedLessonUsers.has(context.user.userId)) return;

  const start = await context.post(
    'study-planner',
    'lesson-tracking-start',
    '/api/study-planner/lesson-tracking/start',
    {
      lessonId: context.user.lessonId,
      sessionId: context.user.sessionId,
      planId: context.user.planId,
      trigger: 'video_play',
      lessonTimeEstimates: {
        t_lesson_minutes: 30,
        t_video_minutes: 20,
        t_materials_minutes: 5,
      },
    },
    true,
  );

  const trackingState = parseTrackingStart(start.responseText);
  if (trackingState.alreadyCompleted) {
    context.completedLessonUsers.add(context.user.userId);
    return;
  }

  await context.post('study-planner', 'lesson-tracking-event', '/api/study-planner/lesson-tracking/event', {
    trackingId: trackingState.trackingId || context.seededTrackingId,
    eventType: 'activity',
  });

  if (Math.random() < 0.1) {
    const complete = await context.post(
      'study-planner',
      'lesson-tracking-complete',
      '/api/study-planner/lesson-tracking/complete',
      { lessonId: context.user.lessonId, endTrigger: 'manual' },
    );
    if (complete.ok) context.completedLessonUsers.add(context.user.userId);
  }
}

function parseTrackingStart(responseText?: string) {
  try {
    return responseText
      ? (JSON.parse(responseText) as { alreadyCompleted?: boolean; trackingId?: string })
      : {};
  } catch {
    return {};
  }
}
