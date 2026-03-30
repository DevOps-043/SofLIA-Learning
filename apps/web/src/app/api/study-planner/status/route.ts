import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { SessionService } from '@/features/auth/services/session.service';

export const dynamic = 'force-dynamic';

/**
 * GET /api/study-planner/status
 * 
 * Verifica si el usuario actual tiene un plan de estudio activo.
 * Retorna { hasPlan: boolean, planId?: string }
 */
export async function GET(request: NextRequest) {
    try {
        const user = await SessionService.getCurrentUser();

        if (!user) {
            return NextResponse.json(
                { success: false, error: 'No autenticado' },
                { status: 401 }
            );
        }


        let supabase;
        // Intenta usar la clave de servicio (admin) si está disponible para omitir RLS
        const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

        if (serviceRoleKey) {
            const { createClient: createSupabaseClient } = await import('@supabase/supabase-js');
            supabase = createSupabaseClient(
                process.env.NEXT_PUBLIC_SUPABASE_URL!,
                serviceRoleKey,
                {
                    auth: {
                        persistSession: false,
                        autoRefreshToken: false,
                        detectSessionInUrl: false
                    }
                }
            );
        } else {
            // CRITICAL FIX: createClient is async in server.ts
            supabase = await createClient();
        }

        // Consultar el plan más reciente del usuario
        const { data: plans, error } = await supabase
            .from('study_plans')
            .select('id, user_id, name, created_at')
            .eq('user_id', user.id)
            .order('created_at', { ascending: false })
            .limit(1);

        if (error) {
            console.error('Error verificando estado del plan de estudio:', error);
            // Si el error es por RLS (PGRST301 o similar), podría ser útil loguearlo
            return NextResponse.json(
                { success: false, error: 'Error al verificar estado del plan' },
                { status: 500 }
            );
        }

        const hasPlan = plans && plans.length > 0;

        return NextResponse.json({
            success: true,
            hasPlan,
            planId: hasPlan ? plans[0].id : null
        });

    } catch (error) {
        console.error('Error interno en status de study planner:', error);
        return NextResponse.json(
            { success: false, error: 'Error interno del servidor' },
            { status: 500 }
        );
    }
}
