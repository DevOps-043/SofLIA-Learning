import type { FlowContext } from './flow-context';

export async function publicFlow(context: FlowContext) {
  const courseSlug = context.user.courseSlug || context.manifestCourseSlug;
  await context.get('public', 'home', '/');
  await context.get('public', 'business', '/business');
  await context.get('public', 'business-plans', '/business/plans');
  if (courseSlug) await context.get('public', 'course-detail', `/courses/${courseSlug}`);
}

export async function authenticatedFlow(context: FlowContext) {
  await context.get('auth-core', 'auth-me', '/api/auth/me');
  await context.get('auth-core', 'my-courses', '/api/my-courses');
  await context.get('auth-core', 'my-courses-stats', '/api/my-courses?stats_only=true');
  await context.get('auth-core', 'org-dashboard', `/${context.user.orgSlug}/dashboard`);
  await context.get('auth-core', 'business-user-dashboard', `/${context.user.orgSlug}/business-user/dashboard`);
}
