/**
 * API Endpoint: Get Active Plan
 * 
 * GET /api/study-planner/active-plan
 * 
 * Obtiene el plan activo más reciente del usuario
 */

import { NextRequest, NextResponse } from 'next/server';
import { SessionService } from '../../../../features/auth/services/session.service';
import { createClient } from '@supabase/supabase-js';
import { logger } from '@/lib/logger';
import { listUserStudyPlans } from '@/features/study-planner/services/study-planner-plans.server.service';

// Crear cliente admin para bypass de RLS
export function createLegacyAdminClient() {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!supabaseUrl || !supabaseServiceKey) {
    throw new Error('Variables de Supabase no configuradas');
  }

  return createClient(supabaseUrl, supabaseServiceKey, {
    auth: {
      autoRefreshToken: false,
      persistSession: false
    }
  });
}

export async function GET(request: NextRequest): Promise<NextResponse> {
  try {
    // Verificar autenticación
    const user = await SessionService.getCurrentUser();
    
    if (!user) {
      return NextResponse.json({ 
        planId: null,
        error: 'No autorizado'
      }, { status: 401 });
    }

    const plans = await listUserStudyPlans(user.id);
    
    // Obtener el plan activo más reciente del usuario
    const activePlan = plans[0];
    
    if (!activePlan) {
      return NextResponse.json({ 
        planId: null,
        hasActivePlan: false,
        hasMultiplePlans: false,
        plansCount: 0,
      });
    }

    return NextResponse.json({
      planId: activePlan.id,
      hasActivePlan: true,
      hasMultiplePlans: plans.length > 1,
      plansCount: plans.length,
    });

  } catch (error) {
    logger.error('Error en GET /api/study-planner/active-plan:', error);
    return NextResponse.json({ 
      planId: null,
      error: error instanceof Error ? error.message : 'Error interno del servidor'
    }, { status: 500 });
  }
}
