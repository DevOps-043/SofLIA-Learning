/**
 * API Endpoint: Calendar Integration Status
 * 
 * GET /api/study-planner/calendar/status
 * 
 * Verifica si el usuario ya tiene un calendario conectado
 */

import { NextResponse } from 'next/server';
import { SessionService } from '../../../../../features/auth/services/session.service';
import { createClient } from '@supabase/supabase-js';
import { createAdminClient as createSharedAdminClient } from '@/lib/supabase/admin';

// Crear cliente admin para bypass de RLS
export function createLegacyAdminClient() {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!supabaseUrl || !supabaseServiceKey) {
    throw new Error('SUPABASE_SERVICE_ROLE_KEY no está configurada');
  }

  return createClient(supabaseUrl, supabaseServiceKey, {
    auth: {
      autoRefreshToken: false,
      persistSession: false
    }
  });
}

export async function GET(): Promise<NextResponse> {
  try {
    // Verificar autenticación
    const user = await SessionService.getCurrentUser();
    
    if (!user) {
      return NextResponse.json({ 
        isConnected: false, 
        error: 'No autorizado' 
      }, { status: 401 });
    }

    // Buscar integración de calendario existente
    const supabase = createSharedAdminClient();
    
    const { data: integration, error } = await supabase
      .from('calendar_integrations')
      .select('id, provider, access_token, refresh_token, expires_at, updated_at')
      .eq('user_id', user.id)
      .order('updated_at', { ascending: false })
      .limit(1)
      .single();

    if (error || !integration) {
      return NextResponse.json({ 
        isConnected: false,
        provider: null,
        message: 'No hay calendario conectado'
      });
    }

    // Verificar si el token aún es válido
    const isExpired = integration.expires_at 
      ? new Date(integration.expires_at) < new Date() 
      : false;

    // Si está expirado pero hay refresh_token, aún se considera conectado
    // (el sistema refrescará el token automáticamente cuando sea necesario)
    const hasValidConnection = integration.access_token && 
      (!isExpired || integration.refresh_token);

    return NextResponse.json({ 
      isConnected: hasValidConnection,
      provider: integration.provider,
      expiresAt: integration.expires_at,
      isExpired,
      canRefresh: !!integration.refresh_token,
      lastUpdated: integration.updated_at
    });

  } catch (error) {
    console.error('Error verificando estado de calendario:', error);
    return NextResponse.json({ 
      isConnected: false, 
      error: error instanceof Error ? error.message : 'Error interno' 
    }, { status: 500 });
  }
}

