import { NextResponse } from 'next/server';

import {
  resolveCourseLessonByLanguage,
  type LearnLanguage,
} from '@/app/api/courses/_services/lesson-language-resolution.service';
import { computeReadingContentHash } from '@/core/services/tts/server/tts-reading-pregeneration.service';
import {
  loadCourseEnrollments,
  resolveCourseEnrollment,
} from '@/features/courses/services/course-enrollment.server.service';
import type { createAdminClient } from '@/lib/supabase/admin';

export type ReadingAudioSourceType =
  | 'activity_reading'
  | 'material_reading'
  | 'lesson_transcript'
  | 'lesson_summary';

export interface ResolvedReadingAudioSource {
  contentHash: string;
  expectedSegments: number;
  language: LearnLanguage;
  lessonId: string;
  sourceId: string;
  sourceType: ReadingAudioSourceType;
  text: string;
}

type AdminClient = ReturnType<typeof createAdminClient>;

export function normalizeReadingAudioLanguage(value: string | null): LearnLanguage {
  return value === 'en' || value === 'pt' ? value : 'es';
}

export function normalizeSourceType(value: string | null): ReadingAudioSourceType | null {
  if (
    value === 'activity_reading' ||
    value === 'lesson_transcript' ||
    value === 'lesson_summary'
  ) {
    return value;
  }
  return null;
}

export async function loadCourseIdBySlug(supabase: AdminClient, slug: string): Promise<string | null> {
  const { data } = await supabase
    .from('courses')
    .select('id')
    .eq('slug', slug)
    .maybeSingle();

  return (data as { id?: string } | null)?.id ?? null;
}

export async function assertLessonBelongsToCourse(
  supabase: AdminClient,
  courseId: string,
  lessonId: string,
): Promise<boolean> {
  const { data } = await supabase
    .from('course_lessons')
    .select('lesson_id, course_modules!inner (course_id)')
    .eq('lesson_id', lessonId)
    .eq('course_modules.course_id', courseId)
    .maybeSingle();

  return Boolean(data);
}

export async function assertUserCanAccessCourse(
  supabase: AdminClient,
  userId: string,
  courseId: string,
  organizationId: string | null = null,
): Promise<boolean> {
  // Con organización: resolución scopeada estricta.
  if (organizationId) {
    const enrollment = await resolveCourseEnrollment(supabase, userId, courseId, organizationId);
    return Boolean(enrollment);
  }

  // Sin contexto de organización (p. ej. el reproductor de audio de lectura): basta
  // con que el usuario tenga ALGÚN enrollment del curso, en cualquier organización o
  // personal. Tras el org-scoping (migración 20260611120000) los enrollments dejaron
  // de tener `organization_id = null`, así que filtrar por null ya no encontraba nada
  // y bloqueaba el acceso a contenido del curso al que el usuario sí está inscrito.
  const enrollments = await loadCourseEnrollments(supabase, userId, courseId);
  return enrollments.length > 0;
}

async function loadContentTranslation(
  supabase: AdminClient,
  entityType: 'activity',
  entityId: string,
  language: LearnLanguage,
): Promise<Record<string, unknown>> {
  if (language === 'es') return {};

  const { data } = await supabase
    .from('content_translations')
    .select('translations')
    .eq('entity_type', entityType)
    .eq('entity_id', entityId)
    .eq('language_code', language)
    .maybeSingle();

  const translations = (data as { translations?: unknown } | null)?.translations;
  return translations && typeof translations === 'object' && !Array.isArray(translations)
    ? translations as Record<string, unknown>
    : {};
}

function countExpectedSegments(text: string) {
  return text.trim() ? 1 : 0;
}

function asTranslatedText(value: unknown): string | null {
  return typeof value === 'string' && value.trim() ? value : null;
}

export async function resolveReadingAudioSource(params: {
  courseId: string;
  language: LearnLanguage;
  lessonId: string;
  sourceId: string;
  sourceType: ReadingAudioSourceType;
  supabase: AdminClient;
}): Promise<ResolvedReadingAudioSource | null> {
  const { courseId, language, lessonId, sourceId, sourceType, supabase } = params;

  if (!(await assertLessonBelongsToCourse(supabase, courseId, lessonId))) {
    return null;
  }

  let text: string | null = null;
  let resolvedLanguage = language;

  if (sourceType === 'lesson_transcript' || sourceType === 'lesson_summary') {
    const resolvedLesson = await resolveCourseLessonByLanguage({
      supabase,
      courseId,
      lessonId,
      requestedLanguage: language,
    });
    if (!resolvedLesson.lesson) return null;

    const field = sourceType === 'lesson_transcript' ? 'transcript_content' : 'summary_content';
    const missingPiece = sourceType === 'lesson_transcript' ? 'transcript' : 'summary';
    text = resolvedLesson.lesson[field] || null;
    resolvedLanguage = resolvedLesson.translationContext.missingPieces.includes(missingPiece)
      ? 'es'
      : resolvedLesson.translationContext.resolvedLanguage;
  }

  if (sourceType === 'activity_reading') {
    const { data } = await supabase
      .from('lesson_activities')
      .select('activity_id, activity_type, activity_content, lesson_id')
      .eq('activity_id', sourceId)
      .eq('lesson_id', lessonId)
      .maybeSingle();
    const activity = data as {
      activity_content?: string | null;
      activity_type?: string | null;
    } | null;
    if (!activity?.activity_content || activity.activity_type !== 'reflection') return null;

    const translations = await loadContentTranslation(supabase, 'activity', sourceId, language);
    text = asTranslatedText(translations.activity_content) ?? activity.activity_content;
    resolvedLanguage = asTranslatedText(translations.activity_content) ? language : 'es';
  }

  if (!text?.trim()) return null;

  return {
    contentHash: computeReadingContentHash(text),
    expectedSegments: countExpectedSegments(text),
    language: resolvedLanguage,
    lessonId,
    sourceId,
    sourceType,
    text,
  };
}

export function unauthorizedResponse() {
  return NextResponse.json({ error: 'No autenticado' }, { status: 401 });
}
