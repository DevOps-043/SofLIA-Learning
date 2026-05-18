import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { createClient } from '../../../lib/supabase/server';
import { SELECT_COLUMNS } from '@/lib/supabase/select-types';
import type { Database } from '../../../lib/supabase/types';
import {
  REPORT_PROBLEM_CATEGORIES,
  REPORT_PROBLEM_MAX_ATTACHMENTS,
  REPORT_PROBLEM_PRIORITIES,
  REPORT_PROBLEM_SOURCES,
} from '@/core/reporting/report-problem.contract';
import {
  buildLegacyScreenshotAttachment,
  buildReportProblemMetadata,
  serializeReportProblemMetadata,
  uploadReportImageAttachments,
} from '@/core/reporting/report-problem.server';

type ReportProblemInsert =
  Database['public']['Tables']['reportes_problemas']['Insert'];

type ReportProblemSummary =
  Database['public']['Tables']['reportes_problemas']['Row'];

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

const reportPayloadSchema = z.object({
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

/**
 * POST /api/reportes
 * Crear un nuevo reporte de problema
 */
export async function POST(request: NextRequest) {
  try {
    const { SessionService } = await import(
      '../../../features/auth/services/session.service'
    );
    const user = await SessionService.getCurrentUser();

    if (!user) {
      return NextResponse.json({ error: 'No autenticado' }, { status: 401 });
    }

    const rawBody = await request.json();
    const parsedBody = reportPayloadSchema.safeParse(rawBody);

    if (!parsedBody.success) {
      return NextResponse.json(
        {
          error: 'Payload de reporte inválido',
          details: parsedBody.error.issues[0]?.message || 'Error de validación',
        },
        { status: 400 }
      );
    }

    const payload = parsedBody.data;
    const supabase = await createClient();

    const attachments = [...payload.attachments];
    if (attachments.length === 0 && payload.screenshot_data) {
      const legacyAttachment = buildLegacyScreenshotAttachment(
        payload.screenshot_data
      );

      if (legacyAttachment) {
        attachments.push(legacyAttachment);
      }
    }

    const uploadedAttachments = await uploadReportImageAttachments(
      attachments,
      user.id
    );

    const reportInsertPayload: ReportProblemInsert = {
      user_id: user.id,
      titulo: payload.titulo.trim(),
      descripcion: payload.descripcion.trim(),
      categoria: payload.categoria,
      prioridad: payload.prioridad,
      pagina_url: payload.pagina_url || '',
      pathname: payload.pathname || '',
      user_agent: payload.user_agent || request.headers.get('user-agent') || '',
      screen_resolution: payload.screen_resolution || '',
      navegador: payload.navegador || '',
      pasos_reproducir: payload.pasos_reproducir?.trim() || null,
      comportamiento_esperado:
        payload.comportamiento_esperado?.trim() || null,
      screenshot_url: uploadedAttachments.primaryScreenshotUrl,
      session_recording: payload.session_recording || null,
      recording_size: payload.recording_size || null,
      recording_duration: payload.recording_duration ?? null,
      metadata: serializeReportProblemMetadata(
        buildReportProblemMetadata({
          source: payload.source,
          fromLia: payload.from_lia,
          originContext: {
            paginaUrl:
              payload.report_context?.originContext?.paginaUrl ||
              payload.pagina_url ||
              null,
            pathname:
              payload.report_context?.originContext?.pathname ||
              payload.pathname ||
              null,
            currentPage:
              payload.report_context?.originContext?.currentPage ||
              payload.pathname ||
              null,
            currentTab:
              payload.report_context?.originContext?.currentTab ||
              payload.report_context?.currentTab ||
              null,
            pageType:
              payload.report_context?.originContext?.pageType ||
              payload.report_context?.pageType ||
              null,
          },
          courseContext: payload.report_context?.courseContext || null,
          attachments: uploadedAttachments.assets,
          attachmentUploadWarnings: uploadedAttachments.warnings,
          clientContext: {
            userAgent:
              payload.user_agent || request.headers.get('user-agent') || null,
            screenResolution: payload.screen_resolution || null,
            browser: payload.navegador || null,
          },
          liaContext: payload.from_lia
            ? {
                conversationId: payload.report_context?.conversationId || null,
                hasSessionRecording: Boolean(payload.session_recording),
              }
            : undefined,
        })
      ),
    };

    const { data: reporte, error: insertError } = await supabase
      .from('reportes_problemas')
      .insert(reportInsertPayload)
      .select()
      .single();

    if (insertError) {
      return NextResponse.json(
        { error: 'Error al crear el reporte', details: insertError.message },
        { status: 500 }
      );
    }

    const reportSummary = reporte as ReportProblemSummary;

    return NextResponse.json(
      {
        success: true,
        reporte: {
          id: reportSummary.id,
          titulo: reportSummary.titulo,
          categoria: reportSummary.categoria,
          estado: reportSummary.estado,
          created_at: reportSummary.created_at,
        },
        message: 'Reporte creado exitosamente',
        warnings: uploadedAttachments.warnings,
      },
      { status: 201 }
    );
  } catch (error) {
    return NextResponse.json(
      {
        error: 'Error interno del servidor',
        details: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    );
  }
}

/**
 * GET /api/reportes
 * Obtener reportes del usuario o todos (si es admin)
 */
export async function GET(request: NextRequest) {
  try {
    const { SessionService } = await import(
      '../../../features/auth/services/session.service'
    );
    const user = await SessionService.getCurrentUser();

    if (!user) {
      return NextResponse.json({ error: 'No autenticado' }, { status: 401 });
    }

    const supabase = await createClient();

    const { searchParams } = new URL(request.url);
    const estado = searchParams.get('estado');
    const categoria = searchParams.get('categoria');
    const limit = parseInt(searchParams.get('limit') || '50');
    const offset = parseInt(searchParams.get('offset') || '0');

    const isAdmin = user.cargo_rol?.toLowerCase().trim() === 'administrador';

    let query = supabase
      .from('reportes_con_usuario')
      .select(SELECT_COLUMNS.reportes_con_usuario, { count: 'exact' })
      .order('created_at', { ascending: false });

    if (!isAdmin) {
      query = query.eq('user_id', user.id);
    }

    if (estado) {
      query = query.eq('estado', estado);
    }
    if (categoria) {
      query = query.eq('categoria', categoria);
    }

    query = query.range(offset, offset + limit - 1);

    const { data: reportes, error: queryError, count } = await query;

    if (queryError) {
      return NextResponse.json(
        { error: 'Error al obtener reportes', details: queryError.message },
        { status: 500 }
      );
    }

    return NextResponse.json({
      reportes,
      total: count,
      limit,
      offset,
      isAdmin,
    });
  } catch {
    return NextResponse.json(
      { error: 'Error interno del servidor' },
      { status: 500 }
    );
  }
}
