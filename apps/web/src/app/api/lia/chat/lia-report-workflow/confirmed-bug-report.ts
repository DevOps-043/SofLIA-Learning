import type { Database } from '../../../../../lib/supabase/types';
import { buildDraftRuntimeContext } from './draft-runtime-context';
import { buildBugConfirmationMessage } from './confirmation-message';
import { normalizeBugCategory, normalizeBugPriority } from './normalization';
import {
  BugReportDraftTokenPayload,
  ConfirmedBugReportResult,
  LiaChatProcessingBody,
} from './types';
import { readString } from './value-readers';

type ReportProblemInsert =
  Database['public']['Tables']['reportes_problemas']['Insert'];

export async function submitConfirmedBugReport(params: {
  draft: BugReportDraftTokenPayload;
  body: LiaChatProcessingBody;
  requestContext: LiaChatProcessingBody['context'];
  request: { headers: { get: (key: string) => string | null } };
}): Promise<ConfirmedBugReportResult> {
  const { draft, body, requestContext, request } = params;

  if (!requestContext?.userId) {
    return {
      bugReportSaved: false,
      clientContent:
        'Puedo dejar listo el reporte tecnico, pero para enviarlo necesito que estes autenticado en tu cuenta.',
    };
  }

  const runtimeContext = draft.runtimeContext || (await buildDraftRuntimeContext(body, requestContext));
  const [{ createClient }, { buildReportProblemMetadata, serializeReportProblemMetadata }] =
    await Promise.all([
      import('../../../../../lib/supabase/server'),
      import('../../../../../core/reporting/report-problem.server'),
    ]);
  const reportPayload: ReportProblemInsert = {
    user_id: requestContext.userId,
    titulo: readString(draft.title) || 'Reporte tecnico desde SofLIA',
    descripcion: readString(draft.description) || runtimeContext.originalUserMessage,
    categoria: normalizeBugCategory(readString(draft.category)),
    prioridad: normalizeBugPriority(readString(draft.priority)),
    estado: 'pendiente',
    pagina_url: runtimeContext.originContext.paginaUrl || 'chat-lia',
    pathname: runtimeContext.originContext.pathname,
    user_agent: request.headers.get('user-agent'),
    screen_resolution: runtimeContext.screenResolution,
    screenshot_url: runtimeContext.attachments[0]?.publicUrl ?? null,
    session_recording: runtimeContext.recordingUrl,
    recording_size: runtimeContext.recordingSize,
    recording_duration: runtimeContext.recordingDurationSeconds,
    metadata: serializeReportProblemMetadata(
      buildReportProblemMetadata({
        source: runtimeContext.courseContext ? 'lia_course_chat' : 'lia_chat_automatic',
        fromLia: true,
        originContext: runtimeContext.originContext,
        courseContext: runtimeContext.courseContext,
        attachments: runtimeContext.attachments,
        attachmentUploadWarnings: runtimeContext.attachmentUploadWarnings,
        clientContext: {
          userAgent: request.headers.get('user-agent'),
          screenResolution: runtimeContext.screenResolution,
          browser: runtimeContext.browser,
        },
        liaContext: {
          conversationId: body.conversationId || null,
          recordingStatus: runtimeContext.recordingStatus || 'unknown',
          hasSessionRecording: Boolean(runtimeContext.recordingUrl),
          recordingUrl: runtimeContext.recordingUrl,
          detectedAsBug: true,
          aiGeneratedTitle: readString(draft.title),
          chatMessageContent: runtimeContext.originalUserMessage,
          clientDiagnostics: runtimeContext.clientDiagnostics,
        },
      })
    ),
  };

  const supabase = await createClient();
  const { error } = await supabase.from('reportes_problemas').insert(reportPayload);

  if (error) {
    console.error('Error guardando el reporte confirmado de SofLIA:', error);
    return {
      bugReportSaved: false,
      clientContent:
        'Hubo un problema tecnico al enviar tu reporte. El borrador sigue listo; si quieres, puedes intentar confirmarlo de nuevo en unos segundos.',
    };
  }

  return {
    bugReportSaved: true,
    clientContent: buildBugConfirmationMessage({
      recordingUrl: runtimeContext.recordingUrl,
      recordingStatus: runtimeContext.recordingStatus,
      hasImageEvidence: runtimeContext.attachments.length > 0,
      attachmentUploadWarnings: runtimeContext.attachmentUploadWarnings,
    }),
  };
}
