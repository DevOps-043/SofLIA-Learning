import { NextRequest, NextResponse } from 'next/server';

import { apiError } from '@/lib/api/errors';
import { withZodBody } from '@/lib/api/with-validation';
import { SELECT_COLUMNS } from '@/lib/supabase/select-types';
import { logger } from '@/lib/utils/logger';
import { createClient } from '../../../../lib/supabase/server';
import {
  statisticsProfileSchema,
  type StatisticsProfileBody,
} from './schema';

export async function GET(_request: NextRequest) {
  try {
    const supabase = await createClient();
    const { SessionService } = await import(
      '../../../../features/auth/services/session.service'
    );
    const user = await SessionService.getCurrentUser();

    if (!user) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 });
    }

    const { data: profile, error: profileError } = await supabase
      .from('user_perfil')
      .select(SELECT_COLUMNS.user_perfil)
      .eq('user_id', user.id)
      .single();

    if (profileError && profileError.code !== 'PGRST116') {
      logger.error('Error fetching user profile:', profileError);
      return NextResponse.json(
        { error: 'Error al obtener el perfil' },
        { status: 500 }
      );
    }

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

async function handlePost(
  _request: NextRequest,
  body: StatisticsProfileBody,
) {
  try {
    const supabase = await createClient();
    const { SessionService } = await import(
      '../../../../features/auth/services/session.service'
    );
    const user = await SessionService.getCurrentUser();

    if (!user) {
      return apiError('UNAUTHORIZED', 'No autorizado', 401);
    }

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
      uso_ia_respuesta,
    } = body;

    logger.log('Guardando perfil:', {
      user_id: user.id,
      rol_id,
      area_id,
      nivel_id,
      dificultad_id,
      cargo_titulo,
    });

    const { data: existingProfile } = await supabase
      .from('user_perfil')
      .select('id')
      .eq('user_id', user.id)
      .single();

    let result;

    if (existingProfile) {
      const updateData: Record<string, unknown> = {
        cargo_titulo,
        rol_id,
        nivel_id,
        area_id,
        relacion_id,
        tamano_id: tamano_id && tamano_id > 0 ? tamano_id : null,
        sector_id: sector_id && sector_id > 0 ? sector_id : null,
        pais: pais && pais.trim() !== '' ? pais.trim() : null,
        actualizado_en: new Date().toISOString(),
      };

      if (dificultad_id && dificultad_id >= 1 && dificultad_id <= 5) {
        updateData.dificultad_id = dificultad_id;
      }
      if (uso_ia_respuesta && uso_ia_respuesta.trim() !== '') {
        updateData.uso_ia_respuesta = uso_ia_respuesta.trim();
      }

      const { data, error } = await supabase
        .from('user_perfil')
        .update(updateData)
        .eq('user_id', user.id)
        .select()
        .single();

      if (error) {
        logger.error('Error updating profile:', error);
        logger.error('Error details:', JSON.stringify(error, null, 2));
        return apiError('PROFILE_UPDATE_FAILED', 'Error al actualizar el perfil', 500);
      }

      // El cargo del usuario ya queda guardado en `user_perfil.cargo_titulo`
      // (y, dentro de una organización, en `organization_users.job_title`).
      // Antes se replicaba en `users.type_rol`, columna que fue eliminada de la
      // base: ese UPDATE fallaba en cada guardado de perfil.

      result = data;
    } else {
      const insertData: Record<string, unknown> = {
        user_id: user.id,
        cargo_titulo,
        rol_id,
        nivel_id,
        area_id,
        relacion_id,
        tamano_id: tamano_id && tamano_id > 0 ? tamano_id : null,
        sector_id: sector_id && sector_id > 0 ? sector_id : null,
        pais: pais && pais.trim() !== '' ? pais.trim() : null,
        creado_en: new Date().toISOString(),
        actualizado_en: new Date().toISOString(),
      };

      if (dificultad_id && dificultad_id >= 1 && dificultad_id <= 5) {
        insertData.dificultad_id = dificultad_id;
      }
      if (uso_ia_respuesta && uso_ia_respuesta.trim() !== '') {
        insertData.uso_ia_respuesta = uso_ia_respuesta.trim();
      }

      const { data, error } = await supabase
        .from('user_perfil')
        .insert(insertData)
        .select()
        .single();

      if (error) {
        logger.error('Error creating profile:', error);
        logger.error('Error details:', JSON.stringify(error, null, 2));
        return apiError('PROFILE_CREATE_FAILED', 'Error al crear el perfil', 500);
      }

      // Ver nota de arriba: `users.type_rol` ya no existe.
      result = data;
    }

    return NextResponse.json(result);
  } catch (error) {
    logger.error('Error in profile POST:', error);
    return apiError('PROFILE_INTERNAL_ERROR', 'Error interno del servidor', 500);
  }
}

export const POST = withZodBody(statisticsProfileSchema, handlePost);
