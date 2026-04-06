/**
 * Chat Response Formatter
 *
 * Handles post-processing of LIA's raw AI response:
 *  - Detects embedded [[BUG_REPORT:{...}]] tokens and saves them to the DB
 *  - Persists the conversation history (user message + assistant reply)
 *  - Returns the clean client-facing content string
 */

import { createClient } from '../../../../lib/supabase/server';
import { createClient as createSupabaseClient } from '@supabase/supabase-js';
import type { ChatRequest } from './platform-context.service';

export interface ProcessedResponse {
  clientContent: string;
  bugReportSaved: boolean;
}

/**
 * Processes the raw AI response:
 * 1. Extracts and saves any embedded bug report
 * 2. Persists the conversation messages to the DB
 */
export async function processAIResponse(
  finalContent: string,
  body: ChatRequest & {
    isBugReport?: boolean;
    enrichedMetadata?: Record<string, unknown>;
    sessionSnapshot?: string;
    recordingStatus?: string;
    conversationId?: string;
  },
  requestContext: ChatRequest['context'],
  request: { headers: { get: (key: string) => string | null } }
): Promise<ProcessedResponse> {
  let clientContent = finalContent;
  let bugReportSaved = false;

  // ----------------------------------------------------------------
  // STEP 1: Process embedded bug report token
  // ----------------------------------------------------------------
  const bugReportRegex = /\[\[BUG_REPORT:(\{[\s\S]*?\})\]\]/;
  const bugMatch = finalContent.match(bugReportRegex);

  if (bugMatch && bugMatch[1]) {
    try {
      let bugData: Record<string, unknown>;
      try {
        bugData = JSON.parse(bugMatch[1]);
      } catch {
        const cleanedJson = bugMatch[1]
          .replace(/[\n\r]/g, ' ')
          .replace(/\s+/g, ' ')
          .trim();
        bugData = JSON.parse(cleanedJson);
      }

      clientContent = finalContent.replace(bugMatch[0], '').trim();

      if (requestContext?.userId) {
        const supabase = await createClient();
        const messages = body.messages;
        const lastMessage = messages[messages.length - 1];

        const enrichedMeta = {
          source: 'lia_chat_automatic',
          chat_message_content: lastMessage.content,
          ai_generated_title: bugData.title,
          ...(body.enrichedMetadata ? {
            client_viewport: body.enrichedMetadata.viewport,
            client_platform: body.enrichedMetadata.platform,
            client_language: body.enrichedMetadata.language,
            client_timezone: body.enrichedMetadata.timezone,
            client_connection: body.enrichedMetadata.connection,
            client_memory: body.enrichedMetadata.memory,
            session_duration_ms: body.enrichedMetadata.sessionDuration,
            recent_errors: (body.enrichedMetadata.errors as unknown[])?.slice(-5),
            error_summary: body.enrichedMetadata.errorSummary,
            context_markers: (body.enrichedMetadata.contextMarkers as unknown[])?.slice(-10),
            session_summary: body.enrichedMetadata.sessionSummary,
            recording_info: body.enrichedMetadata.recordingInfo,
          } : {}),
          is_compressed: body.sessionSnapshot?.startsWith('gzip:') || false,
          detected_as_bug: body.isBugReport || false,
        };

        // Upload rrweb recording to bucket if present
        let recordingUrl: string | null = null;
        if (body.sessionSnapshot) {
          recordingUrl = await uploadSessionRecording(
            body.sessionSnapshot,
            requestContext.userId
          );
        }

        const reportPayload = {
          user_id: requestContext.userId,
          titulo: bugData.title || 'Reporte automático desde Lia',
          descripcion: bugData.description || lastMessage.content,
          categoria: bugData.category || 'bug',
          prioridad: bugData.priority || 'media',
          pagina_url: requestContext.currentPage || 'chat-lia',
          user_agent: request.headers.get('user-agent'),
          estado: 'pendiente',
          session_recording: recordingUrl,
          recording_size: (body.enrichedMetadata?.recordingInfo as Record<string, unknown>)?.size || null,
          recording_duration: body.enrichedMetadata?.sessionDuration
            ? Math.round((body.enrichedMetadata.sessionDuration as number) / 1000)
            : null,
          screen_resolution: body.enrichedMetadata?.viewport
            ? `${(body.enrichedMetadata.viewport as Record<string, unknown>).width}x${(body.enrichedMetadata.viewport as Record<string, unknown>).height}`
            : null,
          metadata: {
            ...enrichedMeta,
            recording_status: body.recordingStatus || 'unknown',
            has_session_recording: !!recordingUrl,
            recording_url: recordingUrl,
          }
        };

        const { error: matchError } = await supabase
          .from('reportes_problemas')
          .insert(reportPayload);

        if (matchError) {
          console.error('❌ Error guardando reporte de bug:', matchError);
          clientContent += '\n\n> ⚠️ _Nota: Hubo un problema técnico al guardar tu reporte, pero lo tengo registrado._';
        } else {
          bugReportSaved = true;
          clientContent += buildBugConfirmationMessage(body, recordingUrl);
        }
      } else {
        console.warn('⚠️ No se pudo guardar el bug report: usuario no autenticado');
        clientContent += '\n\n> ⚠️ _Para poder guardar tu reporte, necesitas estar conectado a tu cuenta._';
      }
    } catch (e) {
      console.error('❌ Error procesando JSON de bug report:', e);
      console.error('Contenido del match:', bugMatch[1]?.substring(0, 200));
    }
  }

  // ----------------------------------------------------------------
  // STEP 2: Persist conversation history
  // ----------------------------------------------------------------
  const isValidUUID = (id: string) => {
    const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
    return uuidRegex.test(id);
  };

  if (body.conversationId && !isValidUUID(body.conversationId)) {
    console.warn(`⚠️ conversationId inválido recibido (no es UUID): "${body.conversationId}" - Skipping DB persistence`);
  }

  if (body.conversationId && isValidUUID(body.conversationId)) {
    const userId = requestContext?.userId;

    if (userId) {
      const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
      const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

      if (supabaseServiceKey) {
        try {
          const supabaseAdmin = createSupabaseClient(supabaseUrl, supabaseServiceKey, {
            auth: { autoRefreshToken: false, persistSession: false }
          });

          const userMsg = body.messages[body.messages.length - 1];

          if (userMsg && userMsg.role === 'user') {
            const { error: upsertError } = await supabaseAdmin.from('lia_conversations').upsert({
              conversation_id: body.conversationId,
              user_id: userId,
              context_type: 'general',
              started_at: new Date().toISOString(),
              updated_at: new Date().toISOString()
            }, { onConflict: 'conversation_id' });

            if (upsertError) {
              console.error('❌ Error en upsert de conversación:', upsertError);
            }

            const { data: lastMessageRecord } = await supabaseAdmin
              .from('lia_messages')
              .select('message_sequence')
              .eq('conversation_id', body.conversationId)
              .order('message_sequence', { ascending: false })
              .limit(1)
              .single();

            const nextSequence = (lastMessageRecord?.message_sequence || 0) + 1;

            const { error: userMsgError } = await supabaseAdmin.from('lia_messages').insert({
              conversation_id: body.conversationId,
              role: 'user',
              content: userMsg.content,
              message_sequence: nextSequence
            });

            if (userMsgError) {
              console.error('❌ Error guardando mensaje del usuario:', userMsgError);
            }

            const { error: assistantMsgError } = await supabaseAdmin.from('lia_messages').insert({
              conversation_id: body.conversationId,
              role: 'assistant',
              content: clientContent,
              model_used: 'gemini-1.5-flash',
              tokens_used: 0,
              message_sequence: nextSequence + 1
            });

            if (assistantMsgError) {
              console.error('❌ Error guardando mensaje del asistente:', assistantMsgError);
            }
          }
        } catch (dbError) {
          console.error('❌ Error guardando historial de conversación:', dbError);
        }
      }
    }
  }

  return { clientContent, bugReportSaved };
}

/**
 * Uploads a rrweb session recording to Supabase Storage
 */
async function uploadSessionRecording(
  sessionSnapshot: string,
  userId: string
): Promise<string | null> {
  try {
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
    const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

    if (!supabaseServiceKey) {
      console.warn('⚠️ Missing SUPABASE_SERVICE_ROLE_KEY, grabación no subida');
      return null;
    }

    const supabaseAdmin = createSupabaseClient(supabaseUrl, supabaseServiceKey, {
      auth: { autoRefreshToken: false, persistSession: false }
    });

    const isCompressed = sessionSnapshot.startsWith('gzip:');
    let buffer: Buffer;
    let extension: string;
    let contentType: string;

    if (isCompressed) {
      const base64Data = sessionSnapshot.slice(5);
      buffer = Buffer.from(base64Data, 'base64');
      extension = 'json.gz';
      contentType = 'application/gzip';
    } else {
      buffer = Buffer.from(sessionSnapshot, 'utf-8');
      extension = 'json';
      contentType = 'application/json';
    }

    const timestamp = Date.now();
    const randomId = Math.random().toString(36).substring(2, 9);
    const fileName = `recording-${userId}-${timestamp}-${randomId}.${extension}`;

    const { data: uploadData, error: uploadError } = await supabaseAdmin.storage
      .from('reportes-screenshots')
      .upload(fileName, buffer, {
        contentType,
        cacheControl: '3600',
        upsert: false
      });

    if (uploadError) {
      console.error('❌ Error subiendo grabación:', uploadError);
      return null;
    }

    const { data: publicUrlData } = supabaseAdmin.storage
      .from('reportes-screenshots')
      .getPublicUrl(uploadData.path);

    return publicUrlData.publicUrl;
  } catch (uploadErr) {
    console.error('❌ Error procesando grabación:', uploadErr);
    return null;
  }
}

/**
 * Builds the confirmation message to append to the client response after saving a bug report
 */
function buildBugConfirmationMessage(
  body: { sessionSnapshot?: string; recordingStatus?: string },
  recordingUrl: string | null
): string {
  if (recordingUrl) {
    return '\n\n> ✅ **Tu reporte ha sido enviado exitosamente con grabación de sesión.** El equipo técnico podrá ver exactamente lo que pasó. ¡Gracias por ayudarnos a mejorar!';
  } else if (body.sessionSnapshot && !recordingUrl) {
    return '\n\n> ✅ **Tu reporte ha sido enviado.** _Nota: No pudimos subir la grabación, pero hemos guardado la información del problema._ ¡Gracias por reportarlo!';
  } else if (body.recordingStatus === 'unavailable') {
    return '\n\n> ✅ **Tu reporte ha sido enviado.** _Nota: La grabación de pantalla no estaba disponible, pero hemos guardado toda la información del problema._ ¡Gracias por reportarlo!';
  } else if (body.recordingStatus === 'error' || body.recordingStatus === 'inactive') {
    return '\n\n> ✅ **Tu reporte ha sido enviado.** _Nota: No pudimos capturar la grabación de pantalla, pero hemos guardado los detalles del problema._ ¡Gracias por reportarlo!';
  }
  return '\n\n> ✅ **Tu reporte ha sido enviado exitosamente.** El equipo técnico lo revisará pronto. ¡Gracias por ayudarnos a mejorar!';
}
