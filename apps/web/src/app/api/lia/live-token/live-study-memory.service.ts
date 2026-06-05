import { logger } from '@/lib/logger';
import { sanitizeUntrustedString } from '@/lib/security/context-sanitizer';
import { createClient } from '@/lib/supabase/server';

import {
  formatLiaLiveStudyMemorySection,
  type LiveLearningSummary,
  type LiveLessonNote,
} from './live-study-memory.formatter';

const RECENT_NOTES_LIMIT = 8;
const RECENT_SUMMARIES_LIMIT = 5;
const NOTE_PREVIEW_LENGTH = 260;
const SUMMARY_PREVIEW_LENGTH = 360;

type SupabaseServerClient = Awaited<ReturnType<typeof createClient>>;

interface NoteRow {
  lesson_id: string;
  note_content: string;
  note_title: string;
  source_type: string | null;
  updated_at: string | null;
}

interface SummaryRow {
  content_html: string;
  content_markdown: string;
  course_id: string;
  module_id: string;
  status: string;
  title: string;
  updated_at: string;
}

interface LessonRow {
  lesson_id: string;
  lesson_title: string | null;
  module_id: string;
}

interface ModuleRow {
  course_id: string;
  module_id: string;
  module_title: string | null;
}

interface CourseRow {
  id: string;
  title: string | null;
}

function normalizeRichText(value: string | null | undefined, maxLength: number): string {
  if (!value) return '';

  const withoutMarkup = value
    .replace(/<[^>]*>/g, ' ')
    .replace(/&nbsp;/gi, ' ')
    .replace(/&amp;/gi, '&')
    .replace(/&lt;/gi, '<')
    .replace(/&gt;/gi, '>')
    .replace(/&quot;/gi, '"')
    .replace(/&#39;/gi, "'")
    .replace(/\s+/g, ' ')
    .trim();

  return sanitizeUntrustedString(withoutMarkup, maxLength);
}

function uniqueValues(values: Array<string | null | undefined>): string[] {
  return Array.from(new Set(values.filter((value): value is string => Boolean(value))));
}

function applyOrganizationScope<T extends { or: (filters: string) => T; is: (column: string, value: null) => T }>(
  query: T,
  organizationId: string | null | undefined,
): T {
  if (organizationId) {
    return query.or(`organization_id.eq.${organizationId},organization_id.is.null`);
  }

  return query.is('organization_id', null);
}

async function resolveLessonMaps(
  supabase: SupabaseServerClient,
  lessonIds: string[],
) {
  if (lessonIds.length === 0) {
    return {
      coursesById: new Map<string, CourseRow>(),
      lessonsById: new Map<string, LessonRow>(),
      modulesById: new Map<string, ModuleRow>(),
    };
  }

  const { data: lessons, error: lessonsError } = await supabase
    .from('course_lessons')
    .select('lesson_id, lesson_title, module_id')
    .in('lesson_id', lessonIds);

  if (lessonsError) {
    logger.warn('[lia-live] no se pudieron resolver lecciones para memoria', {
      error: lessonsError.message,
    });
  }

  const lessonRows = (lessons || []) as LessonRow[];
  const moduleIds = uniqueValues(lessonRows.map((lesson) => lesson.module_id));
  const modulesResult = moduleIds.length
    ? await supabase
        .from('course_modules')
        .select('module_id, module_title, course_id')
        .in('module_id', moduleIds)
    : { data: [], error: null };

  if (modulesResult.error) {
    logger.warn('[lia-live] no se pudieron resolver modulos para memoria', {
      error: modulesResult.error.message,
    });
  }

  const moduleRows = (modulesResult.data || []) as ModuleRow[];
  const courseIds = uniqueValues(moduleRows.map((module) => module.course_id));
  const coursesResult = courseIds.length
    ? await supabase.from('courses').select('id, title').in('id', courseIds)
    : { data: [], error: null };

  if (coursesResult.error) {
    logger.warn('[lia-live] no se pudieron resolver cursos para memoria', {
      error: coursesResult.error.message,
    });
  }

  return {
    coursesById: new Map(((coursesResult.data || []) as CourseRow[]).map((course) => [course.id, course])),
    lessonsById: new Map(lessonRows.map((lesson) => [lesson.lesson_id, lesson])),
    modulesById: new Map(moduleRows.map((module) => [module.module_id, module])),
  };
}

async function resolveSummaryMaps(
  supabase: SupabaseServerClient,
  summaries: SummaryRow[],
) {
  const moduleIds = uniqueValues(summaries.map((summary) => summary.module_id));
  const courseIds = uniqueValues(summaries.map((summary) => summary.course_id));

  const [modulesResult, coursesResult] = await Promise.all([
    moduleIds.length
      ? supabase
          .from('course_modules')
          .select('module_id, module_title, course_id')
          .in('module_id', moduleIds)
      : Promise.resolve({ data: [], error: null }),
    courseIds.length
      ? supabase.from('courses').select('id, title').in('id', courseIds)
      : Promise.resolve({ data: [], error: null }),
  ]);

  if (modulesResult.error) {
    logger.warn('[lia-live] no se pudieron resolver modulos de resumenes', {
      error: modulesResult.error.message,
    });
  }

  if (coursesResult.error) {
    logger.warn('[lia-live] no se pudieron resolver cursos de resumenes', {
      error: coursesResult.error.message,
    });
  }

  return {
    coursesById: new Map(((coursesResult.data || []) as CourseRow[]).map((course) => [course.id, course])),
    modulesById: new Map(((modulesResult.data || []) as ModuleRow[]).map((module) => [module.module_id, module])),
  };
}

async function fetchRecentLessonNotes(params: {
  organizationId?: string | null;
  supabase: SupabaseServerClient;
  userId: string;
}): Promise<LiveLessonNote[]> {
  const { organizationId, supabase, userId } = params;
  let query = supabase
    .from('user_lesson_notes')
    .select('lesson_id, note_title, note_content, source_type, updated_at')
    .eq('user_id', userId);

  query = applyOrganizationScope(query, organizationId);

  const { data, error } = await query
    .order('updated_at', { ascending: false })
    .limit(RECENT_NOTES_LIMIT);

  if (error) {
    logger.warn('[lia-live] no se pudieron cargar notas recientes', { error: error.message });
    return [];
  }

  const rows = (data || []) as NoteRow[];
  const maps = await resolveLessonMaps(supabase, uniqueValues(rows.map((row) => row.lesson_id)));

  return rows
    .map((row) => {
      const lesson = maps.lessonsById.get(row.lesson_id);
      const module = lesson ? maps.modulesById.get(lesson.module_id) : undefined;
      const course = module ? maps.coursesById.get(module.course_id) : undefined;
      const contentPreview = normalizeRichText(row.note_content, NOTE_PREVIEW_LENGTH);

      return {
        contentPreview,
        courseTitle: course?.title || null,
        lessonTitle: lesson?.lesson_title || null,
        moduleTitle: module?.module_title || null,
        sourceType: row.source_type,
        title: sanitizeUntrustedString(row.note_title || 'Nota sin titulo', 120),
        updatedAt: row.updated_at,
      };
    })
    .filter((note) => note.contentPreview || note.title);
}

async function fetchRecentLearningSummaries(params: {
  organizationId?: string | null;
  supabase: SupabaseServerClient;
  userId: string;
}): Promise<LiveLearningSummary[]> {
  const { organizationId, supabase, userId } = params;
  let query = supabase
    .from('module_learning_summaries')
    .select('title, content_html, content_markdown, status, module_id, course_id, updated_at')
    .eq('user_id', userId)
    .eq('status', 'ready');

  query = applyOrganizationScope(query, organizationId);

  const { data, error } = await query
    .order('updated_at', { ascending: false })
    .limit(RECENT_SUMMARIES_LIMIT);

  if (error) {
    logger.warn('[lia-live] no se pudieron cargar resumenes recientes', {
      error: error.message,
    });
    return [];
  }

  const rows = (data || []) as SummaryRow[];
  const maps = await resolveSummaryMaps(supabase, rows);

  return rows
    .map((row) => {
      const module = maps.modulesById.get(row.module_id);
      const course = maps.coursesById.get(row.course_id);
      const sourceContent = row.content_markdown || row.content_html;

      return {
        contentPreview: normalizeRichText(sourceContent, SUMMARY_PREVIEW_LENGTH),
        courseTitle: course?.title || null,
        moduleTitle: module?.module_title || null,
        status: row.status,
        title: sanitizeUntrustedString(row.title || 'Resumen SofLIA', 140),
        updatedAt: row.updated_at,
      };
    })
    .filter((summary) => summary.contentPreview || summary.title);
}

export async function buildLiaLiveStudyMemorySection(params: {
  organizationId?: string | null;
  userId: string;
}): Promise<string> {
  try {
    const supabase = await createClient();
    const [notes, summaries] = await Promise.all([
      fetchRecentLessonNotes({ ...params, supabase }),
      fetchRecentLearningSummaries({ ...params, supabase }),
    ]);

    return formatLiaLiveStudyMemorySection({ notes, summaries });
  } catch (error) {
    logger.warn('[lia-live] no se pudo construir memoria academica', error);
    return '';
  }
}
