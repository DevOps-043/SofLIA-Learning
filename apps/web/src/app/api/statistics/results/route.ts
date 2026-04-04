import { NextRequest, NextResponse } from 'next/server';
import { logger } from '@/lib/utils/logger';
import { createClient } from '@supabase/supabase-js';
import { cookies } from 'next/headers';

interface StatisticsQuestionData {
  section?: string | null;
  bloque?: string | null;
  peso?: number | null;
  escala?: Record<string, number> | null;
  respuesta_correcta?: string | null;
  texto?: string | null;
  dimension?: string[] | null;
}

interface StatisticsResponseRow {
  valor: unknown;
  preguntas?: StatisticsQuestionData | null;
}

interface StatisticsUserProfile {
  dificultad_id?: number | null;
}

interface RadarDimensionScore {
  dimension: string;
  score: number;
  rawScore: number;
  maxPossibleScore: number;
}

interface AnalysisSummary {
  adoption: {
    score: number;
    level: string;
    description: string;
    totalQuestions: number;
  };
  knowledge: {
    score: number;
    correct: number;
    total: number;
    level: string;
    description: string;
  };
}

interface RecommendationItem {
  title: string;
  description: string;
  priority: 'high' | 'medium' | 'low';
}

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

export async function GET(request: NextRequest) {
  try {
    if (!supabaseUrl || !supabaseAnonKey) {
      return NextResponse.json(
        { error: 'Configuración de Supabase no encontrada' },
        { status: 500 }
      );
    }

    const supabase = createClient(supabaseUrl, supabaseAnonKey, {
      cookies: {
        get(name: string) {
          return cookies().get(name)?.value;
        },
      },
    });

    // Verificar autenticación
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    
    if (authError || !user) {
      return NextResponse.json(
        { error: 'Usuario no autenticado' },
        { status: 401 }
      );
    }

    // Obtener perfil del usuario
    const { data: userProfile, error: profileError } = await supabase
      .from('user_perfil')
      .select('*')
      .eq('user_id', user.id)
      .single();

    if (profileError || !userProfile) {
      return NextResponse.json(
        { error: 'Perfil de usuario no encontrado' },
        { status: 404 }
      );
    }

    // Obtener respuestas del usuario con información de las preguntas
    const { data: responses, error: responsesError } = await supabase
      .from('respuestas')
      .select(`
        *,
        preguntas (
          id,
          section,
          bloque,
          peso,
          escala,
          scoring,
          respuesta_correcta,
          tipo,
          dimension,
          dificultad
        )
      `)
      .eq('user_perfil_id', userProfile.id);

    if (responsesError) {
      logger.error('Error al obtener respuestas:', responsesError);
      return NextResponse.json(
        { error: 'Error al obtener respuestas del usuario' },
        { status: 500 }
      );
    }

    // Obtener datos de adopción por países
    const { data: adoptionData, error: adoptionError } = await supabase
      .from('adopcion_genai')
      .select('*')
      .order('indice_aipi', { ascending: false });

    if (adoptionError) {
      logger.warn('Error al obtener datos de adopción:', adoptionError);
    }

    // Procesar datos para el radar (pasar dificultad_id del usuario)
    const radarData = processRadarData(responses || [], userProfile.dificultad_id);

    // Procesar análisis
    const analysis = processAnalysis(responses || [], userProfile);

    // Generar recomendaciones
    const recommendations = generateRecommendations(radarData, analysis);

    return NextResponse.json({
      success: true,
      data: {
        radarData,
        analysis,
        recommendations,
        countryData: adoptionData || [],
        userProfile
      }
    });

  } catch (error) {
    logger.error('Error en API de estadísticas:', error);
    return NextResponse.json(
      { error: 'Error interno del servidor' },
      { status: 500 }
    );
  }
}

/**
 * Normaliza el score según la dificultad del usuario
 * - Dificultad 1: máximo 20 puntos (20%) - escala proporcional
 * - Dificultad 2: máximo 40 puntos (40%) - escala proporcional
 * - Dificultad 3: máximo 60 puntos (60%) - escala proporcional
 * - Dificultad 4: máximo 80 puntos (80%) - escala proporcional
 * - Dificultad 5: máximo 100 puntos (100%) - sin escalar
 * 
 * Ejemplo: Si el usuario tiene dificultad 1 y obtiene 50 puntos (50%),
 * el score normalizado será 10 puntos (50% de 20 = 10)
 */
function normalizeScoreByDifficulty(score: number, userDifficulty: number | null | undefined): number {
  if (!userDifficulty || userDifficulty < 1 || userDifficulty > 5) {
    // Si no hay dificultad definida, retornar el score sin normalizar
    return score;
  }

  const maxScoreByDifficulty: { [key: number]: number } = {
    1: 20,
    2: 40,
    3: 60,
    4: 80,
    5: 100
  };

  const maxScore = maxScoreByDifficulty[userDifficulty] || 100;
  
  // Normalización proporcional: escalar el score según el máximo permitido
  // Si el score es 50 y el máximo es 20, entonces: 50 * 20 / 100 = 10
  // Si el score es 100 y el máximo es 20, entonces: 100 * 20 / 100 = 20
  const normalizedScore = (score * maxScore) / 100;
  
  return Math.round(normalizedScore);
}

function processRadarData(responses: StatisticsResponseRow[], userDifficulty: number | null | undefined = null): RadarDimensionScore[] {
  const dimensions = ['Conocimiento', 'Aplicación', 'Productividad', 'Estrategia', 'Inversión'];

  const scores = dimensions.map(dimension => {
    const relevantResponses = responses.filter(response => {
      // Usar el campo dimension directamente de la pregunta (es un array jsonb)
      const questionDimensions = response.preguntas?.dimension;
      
      // Si la pregunta tiene el campo dimension, usarlo directamente
      if (questionDimensions && Array.isArray(questionDimensions)) {
        return questionDimensions.includes(dimension);
      }
      
      // Fallback: usar la lógica anterior si no hay campo dimension
      const section = response.preguntas?.section || '';
      const bloque = response.preguntas?.bloque || '';
      
      // Mapear sección/bloque a dimensión
      let mappedDimension = dimension;
      if (section === 'Adopción' || bloque === 'Adopción') {
        mappedDimension = 'Aplicación';
      } else if (section === 'Conocimiento' || bloque === 'Conocimiento' || bloque === 'Técnico') {
        mappedDimension = 'Conocimiento';
      } else if (section === 'Cuestionario') {
        // Para preguntas generales, distribuir entre dimensiones
        if (response.preguntas?.texto?.toLowerCase().includes('productividad') || 
            response.preguntas?.texto?.toLowerCase().includes('eficiencia')) {
          mappedDimension = 'Productividad';
        } else if (response.preguntas?.texto?.toLowerCase().includes('estrategia') ||
                   response.preguntas?.texto?.toLowerCase().includes('planificación')) {
          mappedDimension = 'Estrategia';
        } else if (response.preguntas?.texto?.toLowerCase().includes('inversión') ||
                   response.preguntas?.texto?.toLowerCase().includes('presupuesto')) {
          mappedDimension = 'Inversión';
        } else {
          mappedDimension = 'Aplicación';
        }
      }
      
      return mappedDimension === dimension;
    });

    let totalScore = 0;
    let totalWeight = 0;

    relevantResponses.forEach(response => {
      const weight = response.preguntas?.peso || 1;
      let value = response.valor;
      
      // Manejar valor como jsonb - puede venir como string JSON o ya parseado
      if (value && typeof value === 'string' && value.startsWith('"') && value.endsWith('"')) {
        // Si es un string JSON, parsearlo
        try {
          value = JSON.parse(value);
        } catch (e) {
          // Si falla el parse, usar el valor original
        }
      }
      
      // Calcular puntuación basada en el tipo de respuesta
      let score = 0;
      if (typeof value === 'string') {
        // Para respuestas de texto, usar escala si está disponible
        const escala = response.preguntas?.escala;
        if (escala && typeof escala === 'object') {
          score = escala[value] || 0;
        } else {
          // Puntuación por defecto basada en la respuesta
          if (value.includes('A)')) score = 0;
          else if (value.includes('B)')) score = 25;
          else if (value.includes('C)')) score = 50;
          else if (value.includes('D)')) score = 75;
          else if (value.includes('E)')) score = 100;
          else score = 50; // Respuesta por defecto
        }
      } else if (typeof value === 'number') {
        score = value;
      }

      totalScore += score * weight;
      totalWeight += weight;
    });

    const finalScore = totalWeight > 0 ? Math.round(totalScore / totalWeight) : 0;
    
    // Aplicar normalización por dificultad del usuario
    const normalizedScore = normalizeScoreByDifficulty(finalScore, userDifficulty);
    
    return {
      dimension,
      score: Math.min(100, Math.max(0, normalizedScore)),
      rawScore: finalScore, // Guardar el score sin normalizar para referencia
      maxPossibleScore: userDifficulty ? (userDifficulty * 20) : 100 // Máximo posible según dificultad
    };
  });

  return scores;
}

function processAnalysis(responses: StatisticsResponseRow[], userProfile: StatisticsUserProfile): AnalysisSummary {
  const adoptionResponses = responses.filter(r => 
    r.preguntas?.section === 'Adopción' || 
    r.preguntas?.bloque === 'Adopción' ||
    (r.preguntas?.section === 'Cuestionario' && r.preguntas?.bloque === 'Adopción')
  );
  
  const knowledgeResponses = responses.filter(r => 
    r.preguntas?.section === 'Conocimiento' || 
    r.preguntas?.bloque === 'Conocimiento' ||
    (r.preguntas?.section === 'Cuestionario' && r.preguntas?.bloque === 'Conocimiento')
  );

  // Calcular puntuación de adopción
  let adoptionScore = 0;
  if (adoptionResponses.length > 0) {
    const totalAdoption = adoptionResponses.reduce((sum, response) => {
      let value = response.valor;
      
      // Manejar valor como jsonb
      if (value && typeof value === 'string' && value.startsWith('"') && value.endsWith('"')) {
        try {
          value = JSON.parse(value);
        } catch (e) {
          // Si falla el parse, usar el valor original
        }
      }
      
      let score = 0;
      if (typeof value === 'string') {
        if (value.includes('A)')) score = 0;
        else if (value.includes('B)')) score = 25;
        else if (value.includes('C)')) score = 50;
        else if (value.includes('D)')) score = 75;
        else if (value.includes('E)')) score = 100;
        else score = 50;
      }
      return sum + score;
    }, 0);
    adoptionScore = Math.round(totalAdoption / adoptionResponses.length);
  }

  // Calcular puntuación de conocimiento
  let knowledgeScore = 0;
  let correctAnswers = 0;
  if (knowledgeResponses.length > 0) {
    knowledgeResponses.forEach(response => {
      const correctAnswer = response.preguntas?.respuesta_correcta;
      let userAnswer = response.valor;
      
      // Manejar valor como jsonb
      if (userAnswer && typeof userAnswer === 'string' && userAnswer.startsWith('"') && userAnswer.endsWith('"')) {
        try {
          userAnswer = JSON.parse(userAnswer);
        } catch (e) {
          // Si falla el parse, usar el valor original
        }
      }
      
      if (correctAnswer && userAnswer === correctAnswer) {
        correctAnswers++;
      }
    });
    knowledgeScore = Math.round((correctAnswers / knowledgeResponses.length) * 100);
  }

  return {
    adoption: {
      score: adoptionScore,
      level: getLevel(adoptionScore),
      description: getAdoptionDescription(adoptionScore),
      totalQuestions: adoptionResponses.length
    },
    knowledge: {
      score: knowledgeScore,
      correct: correctAnswers,
      total: knowledgeResponses.length,
      level: getLevel(knowledgeScore),
      description: getKnowledgeDescription(knowledgeScore, correctAnswers, knowledgeResponses.length)
    }
  };
}

function getLevel(score: number) {
  if (score >= 80) return 'Avanzado';
  if (score >= 60) return 'Intermedio';
  if (score >= 40) return 'Medio';
  if (score >= 20) return 'Básico';
  return 'Principiante';
}

function getAdoptionDescription(score: number) {
  if (score >= 80) return 'Excelente nivel de adopción de IA. Has integrado herramientas de IA de manera efectiva en múltiples áreas de tu trabajo.';
  if (score >= 60) return 'Buen nivel de adopción de IA. Has comenzado a integrar herramientas de IA en algunos aspectos de tu trabajo.';
  if (score >= 40) return 'Nivel medio de adopción de IA. Estás explorando algunas herramientas de IA en tu trabajo diario.';
  if (score >= 20) return 'Nivel básico de adopción de IA. Has comenzado a experimentar con algunas herramientas de IA.';
  return 'Nivel principiante de adopción de IA. Hay muchas oportunidades para comenzar a integrar IA en tu trabajo.';
}

function getKnowledgeDescription(score: number, correct: number, total: number) {
  if (score >= 80) return `Excelente comprensión técnica de IA. Respondiste correctamente ${correct} de ${total} preguntas (${score}%).`;
  if (score >= 60) return `Buena comprensión técnica de IA. Respondiste correctamente ${correct} de ${total} preguntas (${score}%).`;
  if (score >= 40) return `Comprensión media de IA. Respondiste correctamente ${correct} de ${total} preguntas (${score}%).`;
  if (score >= 20) return `Comprensión básica de IA. Respondiste correctamente ${correct} de ${total} preguntas (${score}%).`;
  return `Comprensión principiante de IA. Respondiste correctamente ${correct} de ${total} preguntas (${score}%). Hay oportunidades significativas para expandir tu entendimiento técnico.`;
}

function generateRecommendations(radarData: RadarDimensionScore[], analysis: AnalysisSummary): RecommendationItem[] {
  const recommendations: RecommendationItem[] = [];
  
  // Recomendación basada en la dimensión más baja
  const lowestDimension = radarData.reduce((min, current) => 
    current.score < min.score ? current : min
  );
  
  if (lowestDimension.score < 40) {
    recommendations.push({
      title: `Mejora en: ${lowestDimension.dimension}`,
      description: `Tu puntuación en ${lowestDimension.dimension} es de ${lowestDimension.score} puntos. Enfócate en desarrollar esta área para equilibrar tu perfil de competencias.`,
      priority: 'high'
    });
  }

  // Recomendación basada en conocimiento técnico
  if (analysis.knowledge.score < 50) {
    recommendations.push({
      title: 'Profundiza tus conocimientos técnicos',
      description: `Con ${analysis.knowledge.correct}/${analysis.knowledge.total} respuestas correctas (${analysis.knowledge.score}%), enfócate en entender mejor los fundamentos de la IA y las mejores prácticas.`,
      priority: 'high'
    });
  }

  // Recomendación basada en adopción
  if (analysis.adoption.score < 60) {
    recommendations.push({
      title: 'Aumenta tu adopción de IA',
      description: 'Explora más herramientas de IA y busca oportunidades para integrarlas en tu flujo de trabajo diario.',
      priority: 'medium'
    });
  }

  // Recomendación basada en fortalezas
  const highestDimension = radarData.reduce((max, current) => 
    current.score > max.score ? current : max
  );
  
  if (highestDimension.score > 70) {
    recommendations.push({
      title: `Aprovecha tu fortaleza en ${highestDimension.dimension}`,
      description: `Tu puntuación de ${highestDimension.score} puntos en ${highestDimension.dimension} es excelente. Considera compartir tu conocimiento o mentorar a otros en esta área.`,
      priority: 'low'
    });
  }

  return recommendations;
}
