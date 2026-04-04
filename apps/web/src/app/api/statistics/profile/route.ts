import { NextRequest, NextResponse } from 'next/server';
import { logger } from '@/lib/utils/logger';
import { createClient } from '../../../../lib/supabase/server';

export async function GET(request: NextRequest) {
  try {
    const supabase = await createClient();

    // Obtener el usuario actual
    const { SessionService } = await import('../../../../features/auth/services/session.service');
    const user = await SessionService.getCurrentUser();

    if (!user) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 });
    }

    // Buscar perfil del usuario
    const { data: profile, error: profileError } = await supabase
      .from('user_perfil')
      .select('*')
      .eq('user_id', user.id)
      .single();

    if (profileError && profileError.code !== 'PGRST116') {
      logger.error('Error fetching user profile:', profileError);
      return NextResponse.json(
        { error: 'Error al obtener el perfil' },
        { status: 500 }
      );
    }

    // Si no existe perfil, retornar null
    if (!profile) {
      return NextResponse.json(null);
    }

    return NextResponse.json(profile);

  } catch (error) {
    logger.error('Error in profile GET:', error);
    return NextResponse.json(
      { error: 'Error interno del servidor' },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient();

    // Obtener el usuario actual
    const { SessionService } = await import('../../../../features/auth/services/session.service');
    const user = await SessionService.getCurrentUser();

    if (!user) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 });
    }

    const body = await request.json();
    const {
      cargo_titulo,
      rol_id,
      nivel_id,
      area_id,
      relacion_id,
      tamano_id,
      sector_id,
      pais,
      dificultad_id,
      uso_ia_respuesta
    } = body;

    // Validar datos requeridos
    if (!cargo_titulo || !nivel_id || !area_id || !relacion_id || !dificultad_id || !uso_ia_respuesta) {
      logger.error('Campos faltantes:', {
        cargo_titulo: !!cargo_titulo,
        nivel_id: !!nivel_id,
        area_id: !!area_id,
        relacion_id: !!relacion_id,
        dificultad_id: !!dificultad_id,
        uso_ia_respuesta: !!uso_ia_respuesta,
        rol_id: rol_id
      });
      return NextResponse.json(
        { error: 'Faltan campos requeridos: cargo_titulo, nivel_id, area_id, relacion_id, dificultad_id, uso_ia_respuesta son obligatorios' },
        { status: 400 }
      );
    }

    // Validar que rol_id esté presente y sea válido
    if (!rol_id || rol_id <= 0) {
      logger.error('rol_id inválido o faltante:', { rol_id, user_id: user.id });
      return NextResponse.json(
        { error: 'El rol es requerido. Por favor selecciona un cargo válido.' },
        { status: 400 }
      );
    }

    // Validar que dificultad_id esté en el rango válido (1-5)
    if (dificultad_id < 1 || dificultad_id > 5) {
      logger.error('dificultad_id fuera de rango:', { dificultad_id, user_id: user.id });
      return NextResponse.json(
        { error: 'El nivel de dificultad debe estar entre 1 y 5.' },
        { status: 400 }
      );
    }

    logger.log('Guardando perfil:', {
      user_id: user.id,
      rol_id,
      area_id,
      nivel_id,
      dificultad_id,
      cargo_titulo
    });

    // Verificar si ya existe un perfil
    const { data: existingProfile } = await supabase
      .from('user_perfil')
      .select('id')
      .eq('user_id', user.id)
      .single();

    let result;

    if (existingProfile) {
      // Preparar datos de actualización
      // IMPORTANTE: Asegurar que rol_id se guarde correctamente
      const updateData: Record<string, unknown> = {
        cargo_titulo,
        rol_id: rol_id, // Siempre guardar rol_id (ya validado arriba)
        nivel_id,
        area_id,
        relacion_id,
        tamano_id: tamano_id && tamano_id > 0 ? tamano_id : null,
        sector_id: sector_id && sector_id > 0 ? sector_id : null,
        pais: pais && pais.trim() !== '' ? pais.trim() : null,
        actualizado_en: new Date().toISOString()
      };

      // Solo agregar dificultad_id y uso_ia_respuesta si existen en la tabla
      // (para compatibilidad con bases de datos que aún no tienen estos campos)
      if (dificultad_id && dificultad_id >= 1 && dificultad_id <= 5) {
        updateData.dificultad_id = dificultad_id;
      }
      if (uso_ia_respuesta && uso_ia_respuesta.trim() !== '') {
        updateData.uso_ia_respuesta = uso_ia_respuesta.trim();
      }

      // Actualizar perfil existente en user_perfil
      const { data, error } = await supabase
        .from('user_perfil')
        .update(updateData)
        .eq('user_id', user.id)
        .select()
        .single();

      if (error) {
        logger.error('Error updating profile:', error);
        logger.error('Error details:', JSON.stringify(error, null, 2));
        return NextResponse.json(
          { 
            error: 'Error al actualizar el perfil',
            details: error.message || 'Error desconocido',
            code: error.code || 'UNKNOWN'
          },
          { status: 500 }
        );
      }

      // También actualizar type_rol en la tabla users con el cargo_titulo del cuestionario
      // type_rol almacena el cargo profesional del usuario obtenido del cuestionario
      const { error: userError } = await supabase
        .from('users')
        .update({
          type_rol: cargo_titulo,
          updated_at: new Date().toISOString()
        })
        .eq('id', user.id);

      if (userError) {
        logger.error('Error updating user type_rol:', userError);
        // No retornamos error aquí para no interrumpir el flujo principal
      }

      result = data;
    } else {
      // Preparar datos de inserción
      // IMPORTANTE: Asegurar que rol_id se guarde correctamente
      const insertData: Record<string, unknown> = {
        user_id: user.id,
        cargo_titulo,
        rol_id: rol_id, // Siempre guardar rol_id (ya validado arriba)
        nivel_id,
        area_id,
        relacion_id,
        tamano_id: tamano_id && tamano_id > 0 ? tamano_id : null,
        sector_id: sector_id && sector_id > 0 ? sector_id : null,
        pais: pais && pais.trim() !== '' ? pais.trim() : null,
        creado_en: new Date().toISOString(),
        actualizado_en: new Date().toISOString()
      };

      // Solo agregar dificultad_id y uso_ia_respuesta si existen en la tabla
      // (para compatibilidad con bases de datos que aún no tienen estos campos)
      if (dificultad_id && dificultad_id >= 1 && dificultad_id <= 5) {
        insertData.dificultad_id = dificultad_id;
      }
      if (uso_ia_respuesta && uso_ia_respuesta.trim() !== '') {
        insertData.uso_ia_respuesta = uso_ia_respuesta.trim();
      }

      // Crear nuevo perfil en user_perfil
      const { data, error } = await supabase
        .from('user_perfil')
        .insert(insertData)
        .select()
        .single();

      if (error) {
        logger.error('Error creating profile:', error);
        logger.error('Error details:', JSON.stringify(error, null, 2));
        return NextResponse.json(
          { 
            error: 'Error al crear el perfil',
            details: error.message || 'Error desconocido',
            code: error.code || 'UNKNOWN'
          },
          { status: 500 }
        );
      }

      // También actualizar type_rol en la tabla users con el cargo_titulo del cuestionario
      // type_rol almacena el cargo profesional del usuario obtenido del cuestionario
      const { error: userError } = await supabase
        .from('users')
        .update({
          type_rol: cargo_titulo,
          updated_at: new Date().toISOString()
        })
        .eq('id', user.id);

      if (userError) {
        logger.error('Error updating user type_rol:', userError);
        // No retornamos error aquí para no interrumpir el flujo principal
      }

      result = data;
    }

    return NextResponse.json(result);

  } catch (error) {
    logger.error('Error in profile POST:', error);
    return NextResponse.json(
      { error: 'Error interno del servidor' },
      { status: 500 }
    );
  }
}
