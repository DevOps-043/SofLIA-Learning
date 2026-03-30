import { NextRequest, NextResponse } from 'next/server';
import { GoogleGenerativeAI, HarmCategory, HarmBlockThreshold } from '@google/generative-ai';
import { createClient } from '../../../../lib/supabase/server';
import { createClient as createSupabaseClient } from '@supabase/supabase-js';
import { PageContextService } from '../../../../lib/lia-context/services/page-context.service';
import { fetchPlatformContext, PlatformContext, ChatRequest } from './platform-context.service';
import { getLIASystemPrompt } from './system-prompt.service';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';
export const maxDuration = 60;

// ============================================
// API HANDLER
// ============================================
export async function POST(request: NextRequest) {

  let shouldStream = true;

  try {
    const body: ChatRequest = await request.json();
    const { messages, context: requestContext, stream = true } = body;
    shouldStream = stream;


    // Validación
    if (!messages || !Array.isArray(messages) || messages.length === 0) {
      return NextResponse.json(
        { error: 'Se requiere al menos un mensaje' },
        { status: 400 }
      );
    }

    // Verificar API Key
    const googleApiKey = process.env.GOOGLE_API_KEY;
    if (!googleApiKey) {
      console.error('âŒ GOOGLE_API_KEY no está configurada');
      return NextResponse.json(
        { error: 'GOOGLE_API_KEY no está configurada' },
        { status: 500 }
      );
    }

    // Obtener contexto enriquecido de la BD
    const platformContext = await fetchPlatformContext(requestContext?.userId);

    // Combinar con contexto de la petición
    const fullContext: PlatformContext = {
      ...platformContext,
      ...requestContext,
      userName: requestContext?.userName || platformContext.userName,
      userRole: requestContext?.userRole || platformContext.userRole,
    };

    // ✅ FALLBACK: Extraer organizationSlug del pathname si no se obtuvo de la BD
    // Esto es crítico para evitar que LIA redirija a rutas B2C incorrectas
    if (!fullContext.organizationSlug && fullContext.currentPage) {
      const pathMatch = fullContext.currentPage.match(/^\/([^/]+)\/(business-panel|business-user)/);
      if (pathMatch && pathMatch[1]) {
        fullContext.organizationSlug = pathMatch[1];
      }
    }


    // ✅ SEGUNDA CARGA: Si detectamos que es usuario de business pero los cursos no se cargaron
    // (porque organizationSlug no estaba disponible durante fetchPlatformContext)
    if (fullContext.organizationSlug && requestContext?.userId && !fullContext.coursesWithContent) {
      try {
        const supabase = await createClient();
        const { data: assignedCourses, error } = await supabase
          .from('organization_course_assignments')
          .select('course:courses!inner(id, title, slug, description, level, duration_total_minutes)')
          .eq('user_id', requestContext.userId)
          .limit(20);

        if (error) {
          console.error('âš ï¸ Error cargando cursos asignados:', error);
        } else if (assignedCourses && assignedCourses.length > 0) {
          fullContext.coursesWithContent = assignedCourses.map((assignment: any) => ({
            title: assignment.course?.title,
            slug: assignment.course?.slug,
            description: assignment.course?.description,
            level: assignment.course?.level,
            durationMinutes: assignment.course?.duration_total_minutes,
            isAssigned: true
          }));
        } else {
          fullContext.coursesWithContent = [];
          fullContext.noCoursesAssigned = true;
        }
      } catch (err) {
        console.error('âš ï¸ Error en segunda carga de cursos:', err);
      }
    }

    // Inicializar Gemini
    const genAI = new GoogleGenerativeAI(googleApiKey);
    const modelName = process.env.GEMINI_MODEL || 'gemini-2.0-flash-exp';

    const model = genAI.getGenerativeModel({
      model: modelName,
      safetySettings: [
        {
          category: HarmCategory.HARM_CATEGORY_HARASSMENT,
          threshold: HarmBlockThreshold.BLOCK_NONE,
        },
        {
          category: HarmCategory.HARM_CATEGORY_HATE_SPEECH,
          threshold: HarmBlockThreshold.BLOCK_NONE,
        },
        {
          category: HarmCategory.HARM_CATEGORY_SEXUALLY_EXPLICIT,
          threshold: HarmBlockThreshold.BLOCK_NONE,
        },
        {
          category: HarmCategory.HARM_CATEGORY_DANGEROUS_CONTENT,
          threshold: HarmBlockThreshold.BLOCK_NONE,
        },
      ],
      generationConfig: {
        maxOutputTokens: 8192,
        temperature: 0.7,
      },
    });

    // Preparar historial (excluir el último mensaje y asegurar que comience con usuario)
    let history = messages
      .filter(m => m.role !== 'system')
      .slice(0, -1)
      .map(m => ({
        role: m.role === 'assistant' ? 'model' : 'user',
        parts: [{ text: m.content }]
      }));

    // Filtrar historial para que comience con 'user'
    while (history.length > 0 && history[0].role === 'model') {
      history = history.slice(1);
    }

    // Limpiar mensajes consecutivos del mismo rol
    const cleanHistory: typeof history = [];
    for (let i = 0; i < history.length; i++) {
      const msg = history[i];
      const lastMsg = cleanHistory[cleanHistory.length - 1];

      if (lastMsg && lastMsg.role === msg.role) {
        lastMsg.parts[0].text += '\n' + msg.parts[0].text;
      } else {
        cleanHistory.push(msg);
      }
    }


    // Obtener el último mensaje del usuario
    const lastMessage = messages[messages.length - 1];
    if (!lastMessage || lastMessage.role !== 'user') {
      return NextResponse.json(
        { error: 'Se requiere un mensaje del usuario' },
        { status: 400 }
      );
    }

    // Construir prompt con contexto
    let systemPrompt = getLIASystemPrompt(fullContext);

    // ✅ Cargar configuración de personalización de LIA
    if (requestContext?.userId) {
      try {
        const { LiaPersonalizationService } = await import('@/core/services/lia-personalization.service');
        const personalizationSettings = await LiaPersonalizationService.getSettings(requestContext.userId);
        if (personalizationSettings) {
          const personalizationPrompt = LiaPersonalizationService.buildPersonalizationPrompt(personalizationSettings);
          systemPrompt += personalizationPrompt;
        }
      } catch (error) {
        // No fallar si hay error cargando personalización, solo loguear
        console.warn('âš ï¸ Error cargando personalización de LIA:', error);
      }
    }

    // ✅ DETECCIÓN Y CONTEXTO PARA REPORTES DE BUGS
    // Si el mensaje parece ser un reporte de bug, agregar contexto técnico adicional
    const bugKeywords = /error|bug|falla|problema|no funciona|no carga|rompi|broken|crash|colgó|lento|cuelga|no responde|pantalla en blanco|500|404|timeout|se cayó/i;
    const isBugReport = body.isBugReport || bugKeywords.test(lastMessage.content.toLowerCase());

    if (isBugReport && fullContext.currentPage) {
      try {
        const bugContext = PageContextService.buildBugReportContext(fullContext.currentPage);
        if (bugContext && !bugContext.includes('No hay metadata')) {
          systemPrompt += '\n\n---\n\n' + bugContext;
        }
      } catch (error) {
        console.warn('âš ï¸ Error obteniendo contexto de bug:', error);
      }
    }

    const messageWithContext = systemPrompt + '\n\n---\n\nUsuario: ' + lastMessage.content;

    // Iniciar chat
    const chatSession = model.startChat({
      history: cleanHistory,
      generationConfig: {
        maxOutputTokens: 8192,
        temperature: 0.7,
      },
    });

    // Enviar mensaje
    const result = await chatSession.sendMessage(messageWithContext);
    const response = result.response;
    const finalContent = response.text();


    // ----------------------------------------------------------------
    // PROCESAMIENTO DE REPORTE DE BUGS (Server-Side Tool Call)
    // MEJORAS v2.0:
    // - Regex mejorado para manejar JSON multilínea
    // - Confirmación visual al usuario
    // - Metadata enriquecida del entorno
    // ----------------------------------------------------------------
    let clientContent = finalContent;
    let bugReportSaved = false;

    // Regex mejorado: permite saltos de línea y espacios dentro del JSON
    const bugReportRegex = /\[\[BUG_REPORT:(\{[\s\S]*?\})\]\]/;
    const bugMatch = finalContent.match(bugReportRegex);

    if (bugMatch && bugMatch[1]) {
      try {

        // Intentar parsear el JSON (puede tener formato pretty o minificado)
        let bugData;
        try {
          bugData = JSON.parse(bugMatch[1]);
        } catch (parseError) {
          // Intentar limpiar el JSON si tiene problemas de formato
          const cleanedJson = bugMatch[1]
            .replace(/[\n\r]/g, ' ')
            .replace(/\s+/g, ' ')
            .trim();
          bugData = JSON.parse(cleanedJson);
        }

        // Limpiar el mensaje para el usuario
        clientContent = finalContent.replace(bugMatch[0], '').trim();

        // Insertar en Base de Datos
        if (requestContext?.userId) {
          const supabase = await createClient();

          // Construir metadata enriquecida
          const enrichedMeta = {
            source: 'lia_chat_automatic',
            chat_message_content: lastMessage.content,
            ai_generated_title: bugData.title,
            // Agregar metadata del cliente si está disponible
            ...(body.enrichedMetadata ? {
              client_viewport: body.enrichedMetadata.viewport,
              client_platform: body.enrichedMetadata.platform,
              client_language: body.enrichedMetadata.language,
              client_timezone: body.enrichedMetadata.timezone,
              client_connection: body.enrichedMetadata.connection,
              client_memory: body.enrichedMetadata.memory,
              session_duration_ms: body.enrichedMetadata.sessionDuration,
              recent_errors: body.enrichedMetadata.errors?.slice(-5), // Últimos 5 errores
              error_summary: body.enrichedMetadata.errorSummary,
              context_markers: body.enrichedMetadata.contextMarkers?.slice(-10), // Últimos 10 marcadores
              session_summary: body.enrichedMetadata.sessionSummary,
              recording_info: body.enrichedMetadata.recordingInfo,
            } : {}),
            is_compressed: body.sessionSnapshot?.startsWith('gzip:') || false,
            detected_as_bug: body.isBugReport || false,
          };

          // ðŸŽ¬ Subir grabación de rrweb al bucket si existe
          let recordingUrl: string | null = null;
          if (body.sessionSnapshot) {
            try {
              const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
              const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

              if (supabaseServiceKey) {
                const supabaseAdmin = createSupabaseClient(supabaseUrl, supabaseServiceKey, {
                  auth: {
                    autoRefreshToken: false,
                    persistSession: false
                  }
                });

                // Convertir el snapshot a buffer
                const snapshotData = body.sessionSnapshot;
                const isCompressed = snapshotData.startsWith('gzip:');
                let buffer: Buffer;
                let extension: string;
                let contentType: string;

                if (isCompressed) {
                  // Si viene como "gzip:base64data", decodificar el base64 para obtener bytes gzip reales
                  const base64Data = snapshotData.slice(5); // Quitar "gzip:"
                  buffer = Buffer.from(base64Data, 'base64');
                  extension = 'json.gz';
                  contentType = 'application/gzip';
                } else {
                  // Si es JSON plano, guardarlo como está
                  buffer = Buffer.from(snapshotData, 'utf-8');
                  extension = 'json';
                  contentType = 'application/json';
                }

                // Generar nombre único
                const timestamp = Date.now();
                const randomId = Math.random().toString(36).substring(2, 9);
                const fileName = `recording-${requestContext.userId}-${timestamp}-${randomId}.${extension}`;

                // Subir a Storage
                const { data: uploadData, error: uploadError } = await supabaseAdmin.storage
                  .from('reportes-screenshots')
                  .upload(fileName, buffer, {
                    contentType,
                    cacheControl: '3600',
                    upsert: false
                  });

                if (uploadError) {
                  console.error('âŒ Error subiendo grabación:', uploadError);
                } else {
                  // Obtener URL pública
                  const { data: publicUrlData } = supabaseAdmin.storage
                    .from('reportes-screenshots')
                    .getPublicUrl(uploadData.path);

                  recordingUrl = publicUrlData.publicUrl;
                }
              } else {
                console.warn('âš ï¸ Missing SUPABASE_SERVICE_ROLE_KEY, grabación no subida');
              }
            } catch (uploadErr) {
              console.error('âŒ Error procesando grabación:', uploadErr);
            }
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
            // URL de la grabación en el bucket (o null si no se pudo subir)
            session_recording: recordingUrl,
            // Calcular información de la grabación
            recording_size: body.enrichedMetadata?.recordingInfo?.size || null,
            recording_duration: body.enrichedMetadata?.sessionDuration
              ? Math.round(body.enrichedMetadata.sessionDuration / 1000)
              : null,
            screen_resolution: body.enrichedMetadata?.viewport
              ? `${body.enrichedMetadata.viewport.width}x${body.enrichedMetadata.viewport.height}`
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
             console.error('âŒ Error guardando reporte de bug:', matchError);
             // Agregar nota de error al mensaje
             clientContent += '\n\n> âš ï¸ _Nota: Hubo un problema técnico al guardar tu reporte, pero lo tengo registrado. El equipo técnico será notificado._';
          } else {
             bugReportSaved = true;

             // Mensaje diferenciado según si hay grabación o no
             if (recordingUrl) {
               clientContent += '\n\n> ✅ **Tu reporte ha sido enviado exitosamente con grabación de sesión.** El equipo técnico podrá ver exactamente lo que pasó. ¡Gracias por ayudarnos a mejorar!';
             } else if (body.sessionSnapshot && !recordingUrl) {
               clientContent += '\n\n> ✅ **Tu reporte ha sido enviado.** _Nota: No pudimos subir la grabación, pero hemos guardado la información del problema._ ¡Gracias por reportarlo!';
             } else if (body.recordingStatus === 'unavailable') {
               clientContent += '\n\n> ✅ **Tu reporte ha sido enviado.** _Nota: La grabación de pantalla no estaba disponible, pero hemos guardado toda la información del problema._ ¡Gracias por reportarlo!';
             } else if (body.recordingStatus === 'error' || body.recordingStatus === 'inactive') {
               clientContent += '\n\n> ✅ **Tu reporte ha sido enviado.** _Nota: No pudimos capturar la grabación de pantalla, pero hemos guardado los detalles del problema._ ¡Gracias por reportarlo!';
             } else {
               clientContent += '\n\n> ✅ **Tu reporte ha sido enviado exitosamente.** El equipo técnico lo revisará pronto. ¡Gracias por ayudarnos a mejorar!';
             }
          }
        } else {
          // Usuario no autenticado
          console.warn('âš ï¸ No se pudo guardar el bug report: usuario no autenticado');
          clientContent += '\n\n> âš ï¸ _Para poder guardar tu reporte, necesitas estar conectado a tu cuenta._';
        }
      } catch (e) {
        console.error('âŒ Error procesando JSON de bug report:', e);
        // Log del contenido que falló para debugging
        console.error('Contenido del match:', bugMatch[1]?.substring(0, 200));
      }
    }

    // ==========================================
    // GUARDAR HISTORIAL DE CONVERSACIÓN (DB)
    // ==========================================
    // Validar que conversationId sea un UUID válido (evita timestamps u otros formatos inválidos)
    const isValidUUID = (id: string) => {
      const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
      return uuidRegex.test(id);
    };

    if (body.conversationId) {
      if (!isValidUUID(body.conversationId)) {
        console.warn(`âš ï¸ conversationId inválido recibido (no es UUID): "${body.conversationId}" - Skipping DB persistence`);
      }
    }

    if (body.conversationId && isValidUUID(body.conversationId)) {
      try {
        const userId = requestContext?.userId || fullContext?.userId;

        if (userId) {
          const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
          const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

          if (supabaseServiceKey) {
            const supabaseAdmin = createSupabaseClient(supabaseUrl, supabaseServiceKey, {
              auth: { autoRefreshToken: false, persistSession: false }
            });

            // Determinar tipo de contexto - LiaSidePanel siempre es 'general'
            // para evitar mezclar con StudyPlanner o Course LIA
            const contextType = 'general';

            // 1. Upsert conversación (crear o actualizar fecha)
            // Solo insertamos campos básicos, dejamos que por defecto se llenen created_at
            // Si ya existe, actualizamos updated_at (si existe columna) o solo hacemos 'touch'
            // Asumiremos que tenemos permiso para upsert.

            // Verificar si tenemos lastMessage definido previamente
            const userMsg = messages[messages.length - 1];

            if (userMsg && userMsg.role === 'user') {
                // Upsert conversación - usar updated_at en lugar de last_message_at (que no existe)
                const { error: upsertError } = await supabaseAdmin.from('lia_conversations').upsert({
                  conversation_id: body.conversationId,
                  user_id: userId,
                  context_type: contextType,
                  started_at: new Date().toISOString(),
                  updated_at: new Date().toISOString()
                }, { onConflict: 'conversation_id' });

                if (upsertError) {
                  console.error('âŒ Error en upsert de conversación:', upsertError);
                }

                // 2. Obtener el último message_sequence para esta conversación
                const { data: lastMessage } = await supabaseAdmin
                  .from('lia_messages')
                  .select('message_sequence')
                  .eq('conversation_id', body.conversationId)
                  .order('message_sequence', { ascending: false })
                  .limit(1)
                  .single();

                const nextSequence = (lastMessage?.message_sequence || 0) + 1;

                // 3. Guardar mensaje del usuario
                const { error: userMsgError } = await supabaseAdmin.from('lia_messages').insert({
                  conversation_id: body.conversationId,
                  role: 'user',
                  content: userMsg.content,
                  message_sequence: nextSequence
                });

                if (userMsgError) {
                  console.error('âŒ Error guardando mensaje del usuario:', userMsgError);
                }

                // 4. Guardar respuesta del asistente
                const { error: assistantMsgError } = await supabaseAdmin.from('lia_messages').insert({
                  conversation_id: body.conversationId,
                  role: 'assistant',
                  content: clientContent,
                  model_used: 'gemini-1.5-flash',
                  tokens_used: 0,
                  message_sequence: nextSequence + 1
                });

                if (assistantMsgError) {
                  console.error('âŒ Error guardando mensaje del asistente:', assistantMsgError);
                }

                if (!upsertError && !userMsgError && !assistantMsgError) {
                }
            }
          }
        }
      } catch (dbError) {
        console.error('âŒ Error guardando historial de conversación:', dbError);
      }
    }

    // Responder con streaming simulado (usando contenido limpio)
    if (shouldStream) {
      const encoder = new TextEncoder();
      const readable = new ReadableStream({
        start(controller) {
          const text = clientContent;
          const chunkSize = 50;
          let i = 0;

          function push() {
            if (i >= text.length) {
              controller.enqueue(encoder.encode('data: ' + JSON.stringify({ done: true }) + '\n\n'));
              controller.close();
              return;
            }
            const chunk = text.slice(i, i + chunkSize);
            controller.enqueue(encoder.encode('data: ' + JSON.stringify({ content: chunk, done: false }) + '\n\n'));
            i += chunkSize;
            setTimeout(push, 10);
          }
          push();
        }
      });

      return new Response(readable, {
        headers: { 'Content-Type': 'text/event-stream' }
      });
    } else {
      return NextResponse.json({
        message: {
          role: 'assistant',
          content: clientContent
        }
      });
    }

  } catch (error) {
    console.error('âŒ LIA Chat API error:', error);

    let errorMessage = 'Error interno del servidor';
    if (error instanceof Error) {
      errorMessage = error.message;
      console.error('Error stack:', error.stack);
    }

    // Manejar Rate Limit
    if (errorMessage.includes('429') || errorMessage.includes('quota') || errorMessage.includes('Too Many Requests')) {
      const politeMessage = "â³ Lo siento, he alcanzado mi límite de capacidad. Por favor espera unos segundos.";

      if (shouldStream) {
        const encoder = new TextEncoder();
        const readable = new ReadableStream({
          start(controller) {
            controller.enqueue(encoder.encode('data: ' + JSON.stringify({ content: politeMessage, done: false }) + '\n\n'));
            controller.enqueue(encoder.encode('data: ' + JSON.stringify({ done: true }) + '\n\n'));
            controller.close();
          }
        });
        return new Response(readable, { headers: { 'Content-Type': 'text/event-stream' } });
      } else {
        return NextResponse.json({ message: { role: 'assistant', content: politeMessage } });
      }
    }

    return NextResponse.json(
      { error: errorMessage },
      { status: 500 }
    );
  }
}

export async function GET() {
  return NextResponse.json({
    status: 'ready',
    message: 'LIA Chat API Ready with Platform Context'
  });
}
