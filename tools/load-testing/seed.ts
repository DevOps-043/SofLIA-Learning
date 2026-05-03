import crypto from 'node:crypto';
import { getConfig, qaPrefix, qaSlug, requireSupabaseConfig } from './config';
import { ensureResultDir, manifestPath, writeJson } from './files';
import { createAdminSupabase } from './supabase';
import type { QaUser, SeedManifest } from './types';

function stableUuid(input: string) {
  const hash = crypto.createHash('sha1').update(input).digest();
  hash[6] = (hash[6] & 0x0f) | 0x40;
  hash[8] = (hash[8] & 0x3f) | 0x80;
  const hex = hash.subarray(0, 16).toString('hex');
  return `${hex.slice(0, 8)}-${hex.slice(8, 12)}-${hex.slice(12, 16)}-${hex.slice(16, 20)}-${hex.slice(20)}`;
}

const LOAD_TEST_SUBSCRIPTION_PLAN = 'enterprise';
const QA_PLACEHOLDER_PASSWORD_HASH = '$2b$10$C6UzMDM.H6dfI/f/IKcEeO4Yz6s16cNu1kiBVGh6/tT3YABiGvQFO';

function chunk<T>(values: T[], size: number) {
  const chunks: T[][] = [];
  for (let index = 0; index < values.length; index += size) {
    chunks.push(values.slice(index, index + size));
  }
  return chunks;
}

async function upsertRows(
  tableName: string,
  rows: Array<Record<string, unknown>>,
  onConflict: string,
  warnings: string[],
  required = true,
) {
  if (rows.length === 0) return;
  const config = getConfig();
  const supabase = createAdminSupabase(config);

  for (const rowChunk of chunk(rows, 100)) {
    const { error } = await (supabase
      .from(tableName) as any)
      .upsert(rowChunk, { onConflict });

    if (error) {
      const message = `Upsert failed for ${tableName}: ${error.message}`;
      if (required) throw new Error(message);
      warnings.push(message);
      return;
    }
  }
}

async function main() {
  const config = getConfig();
  requireSupabaseConfig(config);
  await ensureResultDir(config.resultDir);

  const warnings: string[] = [];
  const now = new Date();
  const nowIso = now.toISOString();
  const expiresAt = new Date(now.getTime() + 14 * 24 * 60 * 60 * 1000).toISOString();
  const prefix = qaPrefix(config.runId);
  const slugPrefix = qaSlug(prefix);
  const orgId = stableUuid(`${prefix}:org`);
  const instructorId = stableUuid(`${prefix}:instructor`);
  const courseId = stableUuid(`${prefix}:course`);
  const moduleId = stableUuid(`${prefix}:module`);
  const lessonId = stableUuid(`${prefix}:lesson`);
  const courseSlug = `${slugPrefix}-course`;

  console.log(`Seeding ${config.seedUsers} QA users for run ${config.runId}`);

  await upsertRows('organizations', [
    {
      id: orgId,
      name: `QA Load ${config.runId}`,
      slug: config.orgSlug,
      description: 'Isolated organization for SofLIA load and stress tests.',
      is_active: true,
      max_users: Math.max(config.seedUsers, 700),
      subscription_plan: LOAD_TEST_SUBSCRIPTION_PLAN,
      subscription_status: 'active',
      updated_at: nowIso,
    },
  ], 'slug', warnings);

  await upsertRows('users', [
    {
      id: instructorId,
      username: `${prefix}_instructor`,
      email: `${prefix}_instructor@load-test.invalid`,
      password_hash: QA_PLACEHOLDER_PASSWORD_HASH,
      first_name: 'QA',
      last_name: 'Instructor',
      display_name: `QA Load Instructor ${config.runId}`,
      cargo_rol: 'Instructor',
      type_rol: 'Instructor',
      email_verified: true,
      is_banned: false,
      updated_at: nowIso,
    },
  ], 'username', warnings);

  await upsertRows('courses', [
    {
      id: courseId,
      slug: courseSlug,
      title: `QA Load Course ${config.runId}`,
      description: 'Synthetic course used only for load and stress validation.',
      category: 'QA Load',
      level: 'beginner',
      instructor_id: instructorId,
      is_active: true,
      approval_status: 'approved',
      duration_total_minutes: 45,
      updated_at: nowIso,
    },
  ], 'slug', warnings);

  await upsertRows('course_modules', [
    {
      module_id: moduleId,
      course_id: courseId,
      module_title: `QA Load Module ${config.runId}`,
      module_description: 'Synthetic module for load testing.',
      module_order_index: 1,
      module_duration_minutes: 45,
      is_published: true,
      is_required: true,
      updated_at: nowIso,
    },
  ], 'module_id', warnings);

  await upsertRows('course_lessons', [
    {
      lesson_id: lessonId,
      module_id: moduleId,
      instructor_id: instructorId,
      lesson_title: `QA Load Lesson ${config.runId}`,
      lesson_description: 'Synthetic lesson for load testing.',
      lesson_order_index: 1,
      duration_seconds: 1800,
      total_duration_minutes: 30,
      video_provider: 'youtube',
      video_provider_id: 'dQw4w9WgXcQ',
      is_published: true,
      summary_content: 'Synthetic summary for load testing.',
      transcript_content: 'Synthetic transcript for load testing.',
      updated_at: nowIso,
    },
  ], 'lesson_id', warnings);

  const users: QaUser[] = Array.from({ length: config.seedUsers }, (_, index) => {
    const oneBased = index + 1;
    const padded = String(oneBased).padStart(4, '0');
    const userId = stableUuid(`${prefix}:user:${oneBased}`);
    const sessionToken = stableUuid(`${prefix}:session:${oneBased}`);
    const planId = stableUuid(`${prefix}:plan:${oneBased}`);
    const sessionId = stableUuid(`${prefix}:study-session:${oneBased}`);
    const trackingId = stableUuid(`${prefix}:tracking:${oneBased}`);

    return {
      index: oneBased,
      userId,
      username: `${prefix}_user_${padded}`,
      email: `${prefix}_user_${padded}@load-test.invalid`,
      sessionToken,
      orgId,
      orgSlug: config.orgSlug,
      courseId,
      courseSlug,
      moduleId,
      lessonId,
      planId,
      sessionId,
      trackingId,
    };
  });

  await upsertRows('users', users.map((user) => ({
    id: user.userId,
    username: user.username,
    email: user.email,
    password_hash: QA_PLACEHOLDER_PASSWORD_HASH,
    first_name: 'QA',
    last_name: `Load ${user.index}`,
    display_name: `QA Load User ${user.index}`,
    cargo_rol: 'Business',
    type_rol: 'BusinessUser',
    email_verified: true,
    is_banned: false,
    updated_at: nowIso,
  })), 'username', warnings);

  await upsertRows('organization_users', users.map((user) => ({
    id: stableUuid(`${prefix}:org-user:${user.index}`),
    organization_id: orgId,
    user_id: user.userId,
    role: 'member',
    status: 'active',
    job_title: 'QA Load Tester',
    joined_at: nowIso,
    updated_at: nowIso,
  })), 'id', warnings);

  await upsertRows('user_session', users.map((user) => ({
    id: stableUuid(`${prefix}:user-session-row:${user.index}`),
    user_id: user.userId,
    jwt_id: user.sessionToken,
    issued_at: nowIso,
    expires_at: expiresAt,
    revoked: false,
    user_agent: `SofLIA-LoadTest/${config.runId}`,
    ip: `10.240.${Math.floor(user.index / 250)}.${(user.index % 250) + 1}`,
  })), 'id', warnings);

  await upsertRows('user_course_enrollments', users.map((user) => ({
    enrollment_id: stableUuid(`${prefix}:enrollment:${user.index}`),
    user_id: user.userId,
    course_id: courseId,
    organization_id: orgId,
    enrollment_status: 'active',
    overall_progress_percentage: 5,
    enrolled_at: nowIso,
    started_at: nowIso,
    last_accessed_at: nowIso,
    updated_at: nowIso,
  })), 'enrollment_id', warnings);

  await upsertRows('study_plans', users.map((user) => ({
    id: user.planId,
    user_id: user.userId,
    organization_id: orgId,
    name: `QA Load Plan ${user.index}`,
    description: 'Synthetic plan for load testing.',
    start_date: nowIso.slice(0, 10),
    end_date: new Date(now.getTime() + 14 * 24 * 60 * 60 * 1000).toISOString().slice(0, 10),
    timezone: 'America/Mexico_City',
    preferred_days: [1, 2, 3, 4, 5],
    goal_hours_per_week: 3,
    course_ids: [courseId],
    generation_mode: 'ai_generated',
    user_type: 'b2b',
    updated_at: nowIso,
  })), 'id', warnings);

  await upsertRows('study_sessions', users.map((user) => {
    const start = new Date(now.getTime() + (user.index % 30) * 60 * 1000);
    const end = new Date(start.getTime() + 30 * 60 * 1000);

    return {
      id: user.sessionId,
      user_id: user.userId,
      organization_id: orgId,
      plan_id: user.planId,
      course_id: courseId,
      lesson_id: lessonId,
      title: `QA Load Session ${user.index}`,
      description: 'Synthetic session for load testing.',
      start_time: start.toISOString(),
      end_time: end.toISOString(),
      duration_minutes: 30,
      status: 'planned',
      is_ai_generated: true,
      session_type: 'short',
      updated_at: nowIso,
    };
  }), 'id', warnings);

  await upsertRows('lesson_tracking', users.map((user) => ({
    id: user.trackingId,
    user_id: user.userId,
    organization_id: orgId,
    plan_id: user.planId,
    session_id: user.sessionId,
    lesson_id: lessonId,
    status: 'in_progress',
    started_at: nowIso,
    start_trigger: 'page_load',
    video_started_at: nowIso,
    last_activity_at: nowIso,
    t_lesson_minutes: 30,
    t_video_minutes: 20,
    t_materials_minutes: 5,
    t_restante_minutes: 5,
    updated_at: nowIso,
  })), 'id', warnings);

  await upsertRows('course_purchases', users.map((user) => ({
    purchase_id: stableUuid(`${prefix}:purchase:${user.index}`),
    user_id: user.userId,
    course_id: courseId,
    enrollment_id: stableUuid(`${prefix}:enrollment:${user.index}`),
    access_status: 'active',
    purchased_at: nowIso,
    access_granted_at: nowIso,
    expires_at: null,
  })), 'purchase_id', warnings, false);

  const manifest: SeedManifest = {
    runId: config.runId,
    createdAt: nowIso,
    prefix,
    orgId,
    orgSlug: config.orgSlug,
    courseId,
    courseSlug,
    moduleId,
    lessonId,
    instructorId,
    users,
    warnings,
  };

  await writeJson(manifestPath(config.resultDir), manifest);

  console.log(`Seed complete: ${manifestPath(config.resultDir)}`);
  if (warnings.length > 0) {
    console.warn('Seed warnings:');
    warnings.forEach((warning) => console.warn(`- ${warning}`));
  }
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
