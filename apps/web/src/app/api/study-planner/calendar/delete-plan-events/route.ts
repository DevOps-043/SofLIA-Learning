import { NextRequest, NextResponse } from 'next/server';
import { createClient as createServiceClient } from '@supabase/supabase-js';
import { SessionService } from '@/features/auth/services/session.service';
import { CalendarIntegrationService } from '@/features/study-planner/services/calendar-integration.service';

function getErrorMessage(error: unknown, fallback: string): string {
    return error instanceof Error && error.message ? error.message : fallback;
}

// Función helper para crear cliente con service role key (bypass RLS)
function createAdminClient() {
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

    if (!supabaseUrl || !supabaseServiceKey) {
        throw new Error('SUPABASE_SERVICE_ROLE_KEY no está configurada');
    }

    return createServiceClient(supabaseUrl, supabaseServiceKey, {
        auth: {
            autoRefreshToken: false,
            persistSession: false
        }
    });
}

export async function POST(request: NextRequest) {
    try {
        // 1. Verificar autenticación
        const user = await SessionService.getCurrentUser();
        if (!user) {
            return NextResponse.json({ success: false, error: 'No autenticado' }, { status: 401 });
        }

        const body = await request.json();
        const { planId } = body;

        if (!planId) {
            return NextResponse.json({ success: false, error: 'planId es requerido' }, { status: 400 });
        }

        // 2. Obtener sesiones del plan que tengan evento externo
        const supabase = createAdminClient();
        const { data: sessions, error } = await supabase
            .from('study_sessions')
            .select('id, external_event_id')
            .eq('plan_id', planId)
            .not('external_event_id', 'is', null);

        if (error) {
            console.error('Error obteniendo sesiones:', error);
            return NextResponse.json({ success: false, error: 'Error obteniendo sesiones' }, { status: 500 });
        }

        if (!sessions || sessions.length === 0) {
            return NextResponse.json({ success: true, deletedCount: 0, message: 'No hay eventos para eliminar' });
        }

        // 3. Obtener credenciales del calendario
        const { accessToken, provider, calendarId } = await CalendarIntegrationService.getCalendarIdForUser(user.id);

        if (!accessToken || !provider) {
            return NextResponse.json({ success: true, deletedCount: 0, warning: 'No hay conexión activa con calendario' });
        }

        // 4. Eliminar eventos
        // Usa Promise.allSettled para asegurar que intentamos borrar todos aunque falle alguno
        const deletionPromises = sessions.map(async (session) => {
            if (!session.external_event_id) return false;

            let success = false;
            try {
                if (provider === 'google') {
                    success = await CalendarIntegrationService.deleteGoogleEvent(accessToken, session.external_event_id, calendarId);
                } else if (provider === 'microsoft') {
                    // @ts-ignore - Método recién agregado
                    success = await CalendarIntegrationService.deleteMicrosoftEvent(accessToken, session.external_event_id);
                }
            } catch (err) {
                console.error(`Error borrando evento ${session.external_event_id}:`, err);
                success = false;
            }
            return success;
        });

        const results = await Promise.all(deletionPromises);
        const deletedCount = results.filter(r => r).length;


        return NextResponse.json({ success: true, deletedCount });

    } catch (error: unknown) {
        console.error('Error en delete-plan-events:', error);
        return NextResponse.json({ success: false, error: getErrorMessage(error, 'Error interno') }, { status: 500 });
    }
}
