import { NextRequest, NextResponse } from 'next/server';

import { SELECT_COLUMNS } from '@/lib/supabase/select-types';
import { apiError } from '@/lib/api/errors';
import { withZodBody } from '@/lib/api/with-validation';
import { createClient } from '../../../lib/supabase/server';
import type { Database } from '../../../lib/supabase/types';
import {
  buildLegacyScreenshotAttachment,
  buildReportProblemMetadata,
  serializeReportProblemMetadata,
  uploadReportImageAttachments,
} from '@/core/reporting/report-problem.server';
import { reportPayloadSchema, type ReportPayloadBody } from './schema';

type ReportProblemInsert =
  Database['public']['Tables']['reportes_problemas']['Insert'];

type ReportProblemSummary =
  Database['public']['Tables']['reportes_problemas']['Row'];

/**
 * POST /api/reportes
 * Crear un nuevo reporte de problema.
 */
async function handlePost(
  request: NextRequest,
  payload: ReportPayloadBody,
) {
  try {
    const { SessionService } = await import(
      '../../../features/auth/services/session.service'
    );
    const user = await SessionService.getCurrentUser();

    if (!user) {
      return apiError('UNAUTHENTICATED', 'No autenticado', 401);
    }

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
      return apiError(
        'REPORT_CREATE_FAILED',
        'Error al crear el reporte',
        500,
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
  } catch {
    return apiError(
      'REPORT_INTERNAL_ERROR',
      'Error interno del servidor',
      500,
    );
  }
}

export const POST = withZodBody(reportPayloadSchema, handlePost);

/**
 * GET /api/reportes
 * Obtener reportes del usuario o todos (si es admin).
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
