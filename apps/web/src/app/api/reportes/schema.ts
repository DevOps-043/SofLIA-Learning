import { z } from 'zod';

import {
  REPORT_PROBLEM_CATEGORIES,
  REPORT_PROBLEM_MAX_ATTACHMENTS,
  REPORT_PROBLEM_PRIORITIES,
  REPORT_PROBLEM_SOURCES,
} from '@/core/reporting/report-problem.contract';

const reportAttachmentSchema = z.object({
  kind: z.literal('image'),
  fileName: z.string().min(1).max(255),
  mimeType: z.string().min(1).max(120),
  size: z.number().int().positive(),
  dataUrl: z.string().min(1),
  width: z.number().int().positive().nullable().optional(),
  height: z.number().int().positive().nullable().optional(),
});

const reportContextSchema = z
  .object({
    conversationId: z.string().uuid().nullable().optional(),
    pageType: z.string().nullable().optional(),
    currentTab: z.string().nullable().optional(),
    originContext: z
      .object({
        paginaUrl: z.string().nullable().optional(),
        pathname: z.string().nullable().optional(),
        currentPage: z.string().nullable().optional(),
        currentTab: z.string().nullable().optional(),
        pageType: z.string().nullable().optional(),
      })
      .optional(),
    courseContext: z
      .object({
        contextType: z.enum(['course', 'workshop']).optional(),
        courseId: z.string().optional(),
        courseSlug: z.string().optional(),
        courseTitle: z.string().optional(),
        moduleId: z.string().optional(),
        moduleTitle: z.string().optional(),
        lessonId: z.string().optional(),
        lessonTitle: z.string().optional(),
        currentTab: z.string().optional(),
        currentPage: z.string().optional(),
      })
      .nullable()
      .optional(),
  })
  .optional();

export const reportPayloadSchema = z.object({
  titulo: z.string().min(1).max(200),
  descripcion: z.string().min(1).max(5000),
  categoria: z.enum(REPORT_PROBLEM_CATEGORIES),
  prioridad: z.enum(REPORT_PROBLEM_PRIORITIES).default('media'),
  pagina_url: z.string().optional(),
  pathname: z.string().optional(),
  user_agent: z.string().optional(),
  screen_resolution: z.string().optional(),
  navegador: z.string().optional(),
  pasos_reproducir: z.string().nullable().optional(),
  comportamiento_esperado: z.string().nullable().optional(),
  screenshot_data: z.string().nullable().optional(),
  attachments: z
    .array(reportAttachmentSchema)
    .max(REPORT_PROBLEM_MAX_ATTACHMENTS)
    .default([]),
  session_recording: z.string().nullable().optional(),
  recording_size: z.string().nullable().optional(),
  recording_duration: z.number().int().nonnegative().nullable().optional(),
  from_lia: z.boolean().default(false),
  source: z.enum(REPORT_PROBLEM_SOURCES).default('manual_modal'),
  report_context: reportContextSchema,
});

export type ReportPayloadBody = z.infer<typeof reportPayloadSchema>;
