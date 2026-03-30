import { NextRequest, NextResponse } from 'next/server';
import { createClient as createServiceClient } from '@supabase/supabase-js';
import { SessionService } from '../../../../../features/auth/services/session.service';
import { CalendarIntegrationService } from '../../../../../features/study-planner/services/calendar-integration.service';

// Crear cliente admin para bypass de RLS
function createAdminClient() {
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

    if (!supabaseUrl || !supabaseServiceKey) {
        throw new Error('Variables de Supabase no configuradas');
    }

    return createServiceClient(supabaseUrl, supabaseServiceKey, {
        auth: {
            autoRefreshToken: false,
            persistSession: false
        }
    });
}

// Tipo para la distribución de lecciones
interface LessonItem {
    courseTitle: string;
    lessonTitle: string;
    lessonOrderIndex: number;
    durationMinutes: number;
    moduleTitle?: string;
}

interface SlotDistribution {
    slot: {
        date: string;
        start: string;
        end: string;
        dayName: string;
        durationMinutes: number;
    };
    lessons: LessonItem[];
}

interface InsertEventsRequest {
    lessonDistribution: SlotDistribution[];
    timezone: string;
    planName?: string;
}

/**
 * POST /api/study-planner/calendar/insert-events
 * Inserta eventos de estudio en el calendario secundario de Google/Microsoft
 */
export async function POST(request: NextRequest) {
    try {
        // Verificar autenticación
        const user = await SessionService.getCurrentUser();

        if (!user) {
            return NextResponse.json({ error: 'No autorizado' }, { status: 401 });
        }

        // Parsear body
        const body: InsertEventsRequest = await request.json();
        const { lessonDistribution, timezone, planName } = body;

        if (!lessonDistribution || !Array.isArray(lessonDistribution) || lessonDistribution.length === 0) {
            return NextResponse.json({
                error: 'No hay sesiones para insertar'
            }, { status: 400 });
        }


        // Obtener integración de calendario del usuario
        const supabase = createAdminClient();
        const { data: integrations, error: integrationError } = await supabase
            .from('calendar_integrations')
            .select('*')
            .eq('user_id', user.id)
            .order('updated_at', { ascending: false })
            .limit(1);

        if (integrationError || !integrations || integrations.length === 0) {
            return NextResponse.json({
                error: 'No hay calendario conectado. Por favor, conecta tu calendario primero.',
                requiresConnection: true
            }, { status: 400 });
        }

        const integration = integrations[0];

        // Verificar y refrescar token si es necesario
        let accessToken = integration.access_token;
        const tokenExpiry = integration.expires_at ? new Date(integration.expires_at) : null;
        const needsRefresh = !tokenExpiry || tokenExpiry <= new Date();

        if (needsRefresh) {
            const refreshedToken = await CalendarIntegrationService.refreshTokenIfNeeded(user.id);
            if (!refreshedToken) {
                return NextResponse.json({
                    error: 'Token expirado y no se pudo refrescar. Por favor, reconecta tu calendario.',
                    requiresReconnection: true
                }, { status: 401 });
            }
            accessToken = refreshedToken;
        }

        // Obtener o crear el calendario secundario de la plataforma
        let calendarId: string | null = null;

        if (integration.provider === 'google') {
            calendarId = await CalendarIntegrationService.getOrCreatePlatformCalendar(accessToken);
            if (calendarId) {
                // Guardar el ID del calendario secundario si aún no está guardado
                await CalendarIntegrationService.saveSecondaryCalendarId(user.id, calendarId);
            } else {
                console.warn('⚠️ [Insert Events] No se pudo crear calendario secundario, usando primario');
            }
        }

        // Preparar eventos para inserción
        const eventsToInsert: Array<{
            title: string;
            description: string;
            startTime: string;
            endTime: string;
            timezone: string;
        }> = [];

        for (const session of lessonDistribution) {
            const { slot, lessons } = session;

            // Crear título del evento
            const lessonTitles = lessons.map(l => l.lessonTitle).join(' | ');
            const courseTitle = lessons[0]?.courseTitle || 'Curso';
            const title = `📚 ${courseTitle}: ${lessonTitles}`;

            // Crear descripción
            const description = createEventDescription(lessons, planName);

            // Crear fechas de inicio y fin
            const startTime = slot.start; // Ya viene en formato ISO
            const endTime = slot.end;

            eventsToInsert.push({
                title: title.length > 200 ? title.substring(0, 197) + '...' : title,
                description,
                startTime,
                endTime,
                timezone: timezone || 'America/Mexico_City'
            });
        }


        // Insertar eventos con throttling para evitar rate limiting
        const results: Array<{ success: boolean; eventId?: string; error?: string; index: number }> = [];
        const THROTTLE_MS = 150; // 150ms entre requests

        for (let i = 0; i < eventsToInsert.length; i++) {
            const event = eventsToInsert[i];

            try {
                if (integration.provider === 'google') {
                    const result = await CalendarIntegrationService.createGoogleEvent(
                        accessToken,
                        event,
                        calendarId
                    );

                    if (result) {
                        results.push({ success: true, eventId: result.id, index: i });
                    } else {
                        results.push({ success: false, error: 'No se pudo crear el evento', index: i });
                        console.error(`âŒ [Insert Events] Error en evento ${i + 1}/${eventsToInsert.length}`);
                    }
                } else if (integration.provider === 'microsoft') {
                    const result = await CalendarIntegrationService.createMicrosoftEvent(
                        accessToken,
                        event
                    );

                    if (result) {
                        results.push({ success: true, eventId: result.id, index: i });
                    } else {
                        results.push({ success: false, error: 'No se pudo crear el evento en Microsoft Calendar', index: i });
                        console.error(`âŒ [Insert Events] Error en evento Microsoft ${i + 1}/${eventsToInsert.length}`);
                    }
                }

                // Throttling para evitar rate limiting
                if (i < eventsToInsert.length - 1) {
                    await new Promise(resolve => setTimeout(resolve, THROTTLE_MS));
                }
            } catch (error: any) {
                console.error(`âŒ [Insert Events] Error insertando evento ${i + 1}:`, error);
                results.push({ success: false, error: error.message || 'Error desconocido', index: i });
            }
        }

        // Calcular resultado
        const insertedCount = results.filter(r => r.success).length;
        const failedCount = results.filter(r => !r.success).length;
        const errors = results.filter(r => !r.success).map(r => `Evento ${r.index + 1}: ${r.error}`);


        return NextResponse.json({
            success: failedCount === 0,
            insertedCount,
            failedCount,
            totalEvents: eventsToInsert.length,
            errors: errors.length > 0 ? errors : undefined,
            calendarId,
            provider: integration.provider,
            message: failedCount === 0
                ? `¡Listo! ${insertedCount} eventos insertados en tu calendario.`
                : `Se insertaron ${insertedCount} de ${eventsToInsert.length} eventos. ${failedCount} fallaron.`
        });

    } catch (error: any) {
        console.error('âŒ [Insert Events] Error general:', error);
        return NextResponse.json({
            error: error.message || 'Error interno del servidor',
            success: false
        }, { status: 500 });
    }
}

/**
 * Crea la descripción del evento con detalles de las lecciones
 */
function createEventDescription(lessons: LessonItem[], planName?: string): string {
    const lines: string[] = [];

    if (planName) {
        lines.push(`📖 Plan: ${planName}`);
        lines.push('');
    }

    lines.push('📚 Lecciones en esta sesión:');

    for (const lesson of lessons) {
        const moduleInfo = lesson.moduleTitle ? ` (${lesson.moduleTitle})` : '';
        lines.push(`• ${lesson.lessonTitle}${moduleInfo} - ${lesson.durationMinutes} min`);
    }

    const totalDuration = lessons.reduce((sum, l) => sum + l.durationMinutes, 0);
    lines.push('');
    lines.push(`⏱️ Duración total: ${totalDuration} minutos`);
    lines.push('');
    lines.push('---');
    lines.push('Creado automáticamente por SofLIA - Planificador de Estudios');

    return lines.join('\n');
}
