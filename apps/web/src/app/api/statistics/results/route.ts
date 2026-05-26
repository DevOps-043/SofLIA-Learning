import { NextRequest, NextResponse } from 'next/server';
import { logger } from '@/lib/utils/logger';
import { createStatisticsSupabaseClient } from './statistics-results/supabase-client';
import { processAnalysis } from './statistics-results/analysis';
import { generateRecommendations } from './statistics-results/recommendations';
import { processRadarData } from './statistics-results/radar';
import { SELECT_COLUMNS } from '@/lib/supabase/select-types';

export async function GET(_request: NextRequest) {
  try {
    const supabase = createStatisticsSupabaseClient();
    if (!supabase) {
      return NextResponse.json(
        { error: 'Configuración de Supabase no encontrada' },
        { status: 500 },
      );
    }

    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) {
      return NextResponse.json({ error: 'Usuario no autenticado' }, { status: 401 });
    }

    const { data: userProfile, error: profileError } = await supabase
      .from('user_perfil')
      .select(SELECT_COLUMNS.user_perfil)
      .eq('user_id', user.id)
      .single();
    if (profileError || !userProfile) {
      return NextResponse.json({ error: 'Perfil de usuario no encontrado' }, { status: 404 });
    }

    const { data: responses, error: responsesError } = await supabase
      .from('respuestas')
      .select(`
        *,
        preguntas (
          id, section, bloque, peso, escala, scoring, respuesta_correcta,
          tipo, dimension, dificultad
        )
      `)
      .eq('user_perfil_id', userProfile.id);
    if (responsesError) {
      logger.error('Error al obtener respuestas:', responsesError);
      return NextResponse.json({ error: 'Error al obtener respuestas del usuario' }, { status: 500 });
    }

    const { data: adoptionData, error: adoptionError } = await supabase
      .from('adopcion_genai')
      .select(SELECT_COLUMNS.adopcion_genai)
      .order('indice_aipi', { ascending: false });
    if (adoptionError) logger.warn('Error al obtener datos de adopción:', adoptionError);

    const radarData = processRadarData(responses || [], userProfile.dificultad_id);
    const analysis = processAnalysis(responses || []);
    const recommendations = generateRecommendations(radarData, analysis);

    return NextResponse.json({
      success: true,
      data: {
        radarData,
        analysis,
        recommendations,
        countryData: adoptionData || [],
        userProfile,
      },
    });
  } catch (error) {
    logger.error('Error en API de estadísticas:', error);
    return NextResponse.json({ error: 'Error interno del servidor' }, { status: 500 });
  }
}
