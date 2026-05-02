import { getConfig, qaPrefix, requireSupabaseConfig } from './config';
import { readSeedManifest } from './files';
import { createAdminSupabase, safeDeleteEq, safeDeleteIn } from './supabase';

async function main() {
  const config = getConfig();
  requireSupabaseConfig(config);

  const manifest = await readSeedManifest(config.resultDir);
  const expectedPrefix = qaPrefix(config.runId);
  if (manifest.prefix !== expectedPrefix || !manifest.prefix.startsWith('qa_load_')) {
    throw new Error(`Refusing cleanup: manifest prefix "${manifest.prefix}" does not match run ${config.runId}.`);
  }

  const supabase = createAdminSupabase(config);
  const warnings: string[] = [];
  const userIds = manifest.users.map((user) => user.userId);
  const sessionTokens = manifest.users.map((user) => user.sessionToken);
  const planIds = manifest.users.map((user) => user.planId).filter(Boolean) as string[];
  const sessionIds = manifest.users.map((user) => user.sessionId).filter(Boolean) as string[];
  const trackingIds = manifest.users.map((user) => user.trackingId).filter(Boolean) as string[];

  console.log(`Cleaning QA load-test data for run ${config.runId}`);

  await safeDeleteIn(supabase, 'lesson_tracking', 'id', trackingIds, warnings);
  await safeDeleteIn(supabase, 'lesson_tracking', 'user_id', userIds, warnings);
  await safeDeleteIn(supabase, 'study_sessions', 'id', sessionIds, warnings);
  await safeDeleteIn(supabase, 'study_plans', 'id', planIds, warnings);
  await safeDeleteIn(supabase, 'course_purchases', 'user_id', userIds, warnings);
  await safeDeleteIn(supabase, 'user_course_enrollments', 'user_id', userIds, warnings);
  await safeDeleteIn(supabase, 'organization_users', 'user_id', userIds, warnings);
  await safeDeleteIn(supabase, 'user_session', 'jwt_id', sessionTokens, warnings);
  await safeDeleteIn(supabase, 'user_session', 'user_id', userIds, warnings);
  await safeDeleteIn(supabase, 'users', 'id', userIds, warnings);

  if (manifest.lessonId) {
    await safeDeleteEq(supabase, 'course_lessons', 'lesson_id', manifest.lessonId, warnings);
  }
  if (manifest.moduleId) {
    await safeDeleteEq(supabase, 'course_modules', 'module_id', manifest.moduleId, warnings);
  }
  if (manifest.courseId) {
    await safeDeleteEq(supabase, 'courses', 'id', manifest.courseId, warnings);
  }
  if (manifest.instructorId) {
    await safeDeleteEq(supabase, 'users', 'id', manifest.instructorId, warnings);
  }

  await safeDeleteEq(supabase, 'organization_users', 'organization_id', manifest.orgId, warnings);
  await safeDeleteEq(supabase, 'organizations', 'id', manifest.orgId, warnings);

  if (warnings.length > 0) {
    console.warn('Cleanup warnings:');
    warnings.forEach((warning) => console.warn(`- ${warning}`));
  }

  console.log('Cleanup complete.');
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
