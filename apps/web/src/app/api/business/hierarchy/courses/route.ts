import { createClient } from '@/lib/supabase/server';
import { NextResponse } from 'next/server';
import { requireBusiness } from '@/lib/auth/requireBusiness';
import { logger } from '@/lib/utils/logger';

function getErrorMessage(error: unknown, fallback: string): string {
  return error instanceof Error && error.message ? error.message : fallback
}

export async function GET(request: Request) {
  try {
    // Verificar autenticación business
    const auth = await requireBusiness();
    if (auth instanceof NextResponse) return auth;

    if (!auth.organizationId) {
      return NextResponse.json(
        { success: false, error: 'No tienes una organización asignada' },
        { status: 403 }
      );
    }

    const requestUrl = new URL(request.url);
    const type = requestUrl.searchParams.get('type');
    const id = requestUrl.searchParams.get('id');

    if (!type || !id || !['region', 'zone', 'team'].includes(type)) {
      return NextResponse.json(
        { success: false, error: 'Parámetros inválidos. Se requiere type (region|zone|team) e id' },
        { status: 400 }
      );
    }

    // Validar que el ID sea un UUID válido
    if (!/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(id)) {
      logger.error(`ID inválido para ${type}: ${id}`)
      return NextResponse.json(
        { success: false, error: 'ID inválido. Debe ser un UUID válido' },
        { status: 400 }
      )
    }

    const supabase = await createClient();

    logger.info(`📚 Obteniendo cursos para ${type} con ID: ${id}`)

    // Llamada a la RPC
    const { data, error } = await supabase.rpc('get_hierarchy_courses', {
      p_entity_type: type,
      p_entity_id: id
    });

    if (error) {
      logger.error('❌ Error en RPC get_hierarchy_courses:', {
        error: error.message,
        code: error.code,
        details: error.details,
        hint: error.hint,
        type,
        id
      });
      
      // Si la función no existe, dar un mensaje más claro
      if (error.code === '42883' || error.message?.includes('does not exist')) {
        return NextResponse.json(
          { 
            success: false, 
            error: 'La función get_hierarchy_courses no existe en la base de datos. Por favor ejecuta la migración SQL en Supabase.',
            hint: 'Ejecuta el archivo supabase/migrations/20260109_get_hierarchy_courses.sql en el SQL Editor de Supabase'
          },
          { status: 500 }
        )
      }
      
      return NextResponse.json(
        { 
          success: false, 
          error: error.message || 'Error al obtener cursos',
          code: error.code,
          hint: error.hint
        },
        { status: 500 }
      );
    }

    logger.info(`✅ Cursos obtenidos exitosamente para ${type} ${id}`)

    return NextResponse.json({ 
      success: true, 
      data: { courses: data || [] } 
    });

  } catch (error: unknown) {
    logger.error('Error inesperado en GET /api/business/hierarchy/courses:', error);
    return NextResponse.json(
      { success: false, error: getErrorMessage(error, 'Error interno del servidor') },
      { status: 500 }
    );
  }
}
