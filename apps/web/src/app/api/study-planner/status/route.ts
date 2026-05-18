import { logger as techDebtLogger } from '@/lib/utils/logger'
import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { SessionService } from '@/features/auth/services/session.service';
import { cacheHeaders } from '@/lib/utils/cache-headers';

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
        const orgSlug = request.nextUrl.searchParams.get('orgSlug');
        let organizationId: string | null = null;

        if (orgSlug) {
            const { data: membership, error: membershipError } = await supabase
                .from('organization_users')
                .select('organization_id, organizations!inner(slug)')
                .eq('user_id', user.id)
                .eq('status', 'active')
                .eq('organizations.slug', orgSlug)
                .maybeSingle();

            if (membershipError) {
                techDebtLogger.error('Error verificando organización del planificador:', membershipError);
                return NextResponse.json(
                    { success: false, error: 'Error al verificar organización' },
                    { status: 500 }
                );
            }

            organizationId = typeof membership?.organization_id === 'string'
                ? membership.organization_id
                : null;

            if (!organizationId) {
                return NextResponse.json({
                    success: true,
                    hasPlan: false,
                    planId: null
                }, { headers: cacheHeaders.privateShort });
            }
        }

        let planQuery = supabase
            .from('study_plans')
            .select('id, user_id, name, created_at, organization_id')
            .eq('user_id', user.id);

        if (organizationId) {
            planQuery = planQuery.eq('organization_id', organizationId);
        }

        const { data: plans, error } = await planQuery
            .order('created_at', { ascending: false })
            .limit(1);

        if (error) {
            techDebtLogger.error('Error verificando estado del plan de estudio:', error);
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
        }, { headers: cacheHeaders.privateShort });

    } catch (error) {
        techDebtLogger.error('Error interno en status de study planner:', error);
        return NextResponse.json(
            { success: false, error: 'Error interno del servidor' },
            { status: 500 }
        );
    }
}
