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
import { createAdminClient as createSharedAdminClient } from '@/lib/supabase/admin';

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

    const supabase = createSharedAdminClient();
    
    // Obtener el plan activo más reciente del usuario
    const { data: activePlan, error: planError } = await supabase
      .from('study_plans')
      .select('id')
      .eq('user_id', user.id)
      .order('created_at', { ascending: false })
      .limit(1)
      .single();
    
    if (planError || !activePlan) {
      return NextResponse.json({ 
        planId: null,
        hasActivePlan: false
      });
    }

    return NextResponse.json({
      planId: activePlan.id,
      hasActivePlan: true
    });

  } catch (error) {
    console.error('Error en GET /api/study-planner/active-plan:', error);
    return NextResponse.json({ 
      planId: null,
      error: error instanceof Error ? error.message : 'Error interno del servidor'
    }, { status: 500 });
  }
}


