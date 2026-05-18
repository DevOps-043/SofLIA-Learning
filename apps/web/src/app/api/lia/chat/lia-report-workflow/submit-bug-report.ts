import { logger as techDebtLogger } from '@/lib/utils/logger'
import { createClient } from '@/lib/supabase/server'
import {
  buildReportProblemMetadata,
  serializeReportProblemMetadata,
} from '@/core/reporting/report-problem.server'
import type { ChatRequest } from '../platform-context.service'
import type {
  BugReportDraftTokenPayload,
  ConfirmedBugReportResult,
  LiaChatProcessingBody,
  ReportProblemInsert,
} from './types'
import { buildDraftRuntimeContext } from './runtime-context'
import { normalizeBugCategory, normalizeBugPriority, readString } from './parsing'

export async function submitConfirmedBugReport(params: {
  draft: BugReportDraftTokenPayload
  body: LiaChatProcessingBody
  requestContext: ChatRequest['context']
  request: { headers: { get: (key: string) => string | null } }
}): Promise<ConfirmedBugReportResult> {
  const { draft, body, requestContext, request } = params

  if (!requestContext?.userId) {
    return {
      bugReportSaved: false,
      clientContent: 'Puedo dejar listo el reporte tecnico, pero para enviarlo necesito que estes autenticado en tu cuenta.',
    }
  }

  const runtimeContext =
    draft.runtimeContext || (await buildDraftRuntimeContext(body, requestContext))
  const reportPayload = buildReportPayload({ draft, body, request, requestContext, runtimeContext })
  const supabase = await createClient()
  const { error } = await supabase.from('reportes_problemas').insert(reportPayload)

  if (error) {
    techDebtLogger.error('Error guardando el reporte confirmado de SofLIA:', error)
    return {
      bugReportSaved: false,
      clientContent: 'Hubo un problema tecnico al enviar tu reporte. El borrador sigue listo; puedes intentar confirmarlo de nuevo en unos segundos.',
    }
  }

  return {
    bugReportSaved: true,
    clientContent: buildBugConfirmationMessage(runtimeContext.attachments.length > 0),
  }
}

function buildReportPayload(params: {
  draft: BugReportDraftTokenPayload
  body: LiaChatProcessingBody
  requestContext: ChatRequest['context']
  request: { headers: { get: (key: string) => string | null } }
  runtimeContext: Awaited<ReturnType<typeof buildDraftRuntimeContext>>
}): ReportProblemInsert {
  const { draft, body, request, runtimeContext } = params
  const userAgent = request.headers.get('user-agent')

  return {
    user_id: params.requestContext!.userId,
    titulo: readString(draft.title) || 'Reporte tecnico desde SofLIA',
    descripcion: readString(draft.description) || runtimeContext.originalUserMessage,
    categoria: normalizeBugCategory(readString(draft.category)),
    prioridad: normalizeBugPriority(readString(draft.priority)),
    estado: 'pendiente',
    pagina_url: runtimeContext.originContext.paginaUrl || 'chat-lia',
    pathname: runtimeContext.originContext.pathname,
    user_agent: userAgent,
    screen_resolution: runtimeContext.screenResolution,
    screenshot_url: runtimeContext.attachments[0]?.publicUrl ?? null,
    metadata: serializeReportProblemMetadata(
      buildReportProblemMetadata({
        source: runtimeContext.courseContext ? 'lia_course_chat' : 'lia_chat_automatic',
        fromLia: true,
        originContext: runtimeContext.originContext,
        courseContext: runtimeContext.courseContext,
        attachments: runtimeContext.attachments,
        attachmentUploadWarnings: runtimeContext.attachmentUploadWarnings,
        clientContext: { userAgent, screenResolution: runtimeContext.screenResolution, browser: runtimeContext.browser },
        liaContext: {
          conversationId: body.conversationId || null,
          detectedAsBug: true,
          aiGeneratedTitle: readString(draft.title),
          chatMessageContent: runtimeContext.originalUserMessage,
          clientDiagnostics: runtimeContext.clientDiagnostics,
        },
      }),
    ),
  }
}

function buildBugConfirmationMessage(hasImageEvidence: boolean): string {
  return hasImageEvidence
    ? 'Reporte confirmado y enviado con evidencia visual adjunta. El equipo tecnico ya tiene el detalle tecnico validado para revisarlo.'
    : 'Reporte confirmado y enviado correctamente. El equipo tecnico ya tiene el detalle tecnico validado para revisarlo.'
}
