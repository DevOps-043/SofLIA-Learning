import { NextRequest, NextResponse } from 'next/server';
import { logger } from '@/lib/utils/logger';
import { createClient } from '@/lib/supabase/server';

type QuestionnaireKey = string | number | null;

interface QuestionnaireUserProfileRow {
  id: string;
  area_id: QuestionnaireKey;
  rol_id: QuestionnaireKey;
  dificultad_id: QuestionnaireKey;
}

interface QuestionnaireQuestionRow extends Record<string, unknown> {
  id: number;
  bloque: string | null;
  dificultad: QuestionnaireKey;
  area_id: QuestionnaireKey;
  exclusivo_rol_id: QuestionnaireKey;
}

interface QuestionnaireAnswerRow {
  pregunta_id: number;
  valor: unknown;
}

export async function GET(request: NextRequest) {
  try {
    const supabase = await createClient();

    // Obtener el usuario actual autenticado
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    
    if (authError) {
      logger.error('Error de autenticación:', authError);
      return NextResponse.json(
        { error: 'Error de autenticación. Por favor inicia sesión nuevamente.' },
        { status: 401 }
      );
    }
    
    if (!user) {
      logger.warn('Usuario no autenticado');
      return NextResponse.json(
        { error: 'Usuario no autenticado. Por favor inicia sesión.' },
        { status: 401 }
      );
    }
    
    logger.log('Usuario autenticado:', user.id);

    // Obtener perfil del usuario (incluyendo dificultad_id)
    const { data: userProfile, error: profileError } = await supabase
      .from('user_perfil')
      .select('id, area_id, rol_id, dificultad_id')
      .eq('user_id', user.id)
      .single();

    // Si no hay perfil, retornar error
    if (profileError || !userProfile) {
      logger.error('Error fetching user profile:', profileError);
      return NextResponse.json(
        { error: 'Perfil de usuario no encontrado. Por favor completa tu perfil profesional primero.' },
        { status: 404 }
      );
    }

    // Validar que el perfil tenga los datos necesarios
    if (!userProfile.dificultad_id) {
      logger.warn('Usuario sin dificultad_id asignado', { user_id: user.id });
      return NextResponse.json(
        { error: 'Tu perfil no tiene un nivel de dificultad asignado. Por favor completa el cuestionario inicial nuevamente.' },
        { status: 400 }
      );
    }

    if (!userProfile.rol_id) {
      logger.warn('Usuario sin rol_id asignado', { user_id: user.id });
      return NextResponse.json(
        { error: 'Tu perfil no tiene un rol asignado. Por favor completa el cuestionario inicial nuevamente.' },
        { status: 400 }
      );
    }

    if (!userProfile.area_id) {
      logger.warn('Usuario sin area_id asignado', { user_id: user.id });
      return NextResponse.json(
        { error: 'Tu perfil no tiene un área asignada. Por favor completa el cuestionario inicial nuevamente.' },
        { status: 400 }
      );
    }

    // Obtener preguntas filtradas por perfil y dificultad
    // Necesitamos 6 preguntas de Adopción y 6 de Conocimiento
    // Filtrar por: dificultad, área y rol
    
    logger.log('Filtrando preguntas con:', {
      dificultad_id: userProfile.dificultad_id,
      area_id: userProfile.area_id,
      rol_id: userProfile.rol_id,
      user_id: user.id
    });
    
    // Obtener todas las preguntas con la dificultad correcta
    // Luego filtrar en memoria por bloque, área y rol
    const { data: allQuestionsByDifficulty, error: questionsError } = await supabase
      .from('preguntas')
      .select(SELECT_COLUMNS.preguntas)
      .eq('dificultad', userProfile.dificultad_id)
      .limit(500); // Obtener un conjunto razonable para filtrar
    
    if (questionsError) {
      logger.error('Error fetching questions by difficulty:', questionsError);
      return NextResponse.json(
        { error: 'Error al obtener las preguntas' },
        { status: 500 }
      );
    }
    
    if (!allQuestionsByDifficulty || allQuestionsByDifficulty.length === 0) {
      logger.warn('No se encontraron preguntas con dificultad asignada', {
        dificultad_id: userProfile.dificultad_id
      });
      return NextResponse.json(
        { error: 'No se encontraron preguntas para tu nivel de dificultad. Por favor contacta al administrador.' },
        { status: 404 }
      );
    }
    
    logger.log(`Total preguntas con dificultad ${userProfile.dificultad_id}:`, allQuestionsByDifficulty.length);
    
    // Filtrar preguntas de Adopción que coincidan con área y rol
    // Estrategia de filtrado:
    // 1. Priorizar preguntas específicas del rol (exclusivo_rol_id = rol_id)
    // 2. Luego preguntas específicas del área (area_id = area_id)
    // 3. Finalmente preguntas generales (area_id = null, exclusivo_rol_id = null)
    const typedQuestions = (allQuestionsByDifficulty as QuestionnaireQuestionRow[] | null) || [];

    const adopcionFiltered = typedQuestions
      .filter((q) => {
        // Verificar bloque
        if (!q.bloque) return false;
        const bloqueLower = q.bloque.toLowerCase();
        const isAdopcion = bloqueLower.includes('adopción') || 
                          bloqueLower.includes('adopcion') ||
                          q.bloque === 'Adopción/uso';
        if (!isAdopcion) return false;
        
        // Verificar dificultad (ya está filtrado, pero por seguridad)
        if (q.dificultad !== userProfile.dificultad_id) return false;
        
        // Verificar área (igual o null)
        const areaMatch = q.area_id === userProfile.area_id || q.area_id === null;
        
        // Verificar rol (igual o null)
        // IMPORTANTE: exclusivo_rol_id debe coincidir con rol_id del perfil
        const rolMatch = q.exclusivo_rol_id === userProfile.rol_id || q.exclusivo_rol_id === null;
        
        return areaMatch && rolMatch;
      })
      .sort((a, b) => {
        // Prioridad 1: Preguntas específicas del rol (mayor prioridad)
        const aIsRolSpecific = a.exclusivo_rol_id === userProfile.rol_id;
        const bIsRolSpecific = b.exclusivo_rol_id === userProfile.rol_id;
        if (aIsRolSpecific && !bIsRolSpecific) return -1;
        if (!aIsRolSpecific && bIsRolSpecific) return 1;
        
        // Prioridad 2: Preguntas específicas del área
        const aIsAreaSpecific = a.area_id === userProfile.area_id;
        const bIsAreaSpecific = b.area_id === userProfile.area_id;
        if (aIsAreaSpecific && !bIsAreaSpecific) return -1;
        if (!aIsAreaSpecific && bIsAreaSpecific) return 1;
        
        // Prioridad 3: Ordenar por ID (consistencia)
        return a.id - b.id;
      })
      .slice(0, 6);
    
    // Filtrar preguntas de Conocimiento que coincidan con área y rol
    // Misma estrategia de filtrado que Adopción
    const conocimientoFiltered = typedQuestions
      .filter((q) => {
        // Verificar bloque
        if (!q.bloque) return false;
        const isConocimiento = q.bloque.toLowerCase().includes('conocimiento');
        if (!isConocimiento) return false;
        
        // Verificar dificultad (ya está filtrado, pero por seguridad)
        if (q.dificultad !== userProfile.dificultad_id) return false;
        
        // Verificar área (igual o null)
        const areaMatch = q.area_id === userProfile.area_id || q.area_id === null;
        
        // Verificar rol (igual o null)
        // IMPORTANTE: exclusivo_rol_id debe coincidir con rol_id del perfil
        const rolMatch = q.exclusivo_rol_id === userProfile.rol_id || q.exclusivo_rol_id === null;
        
        return areaMatch && rolMatch;
      })
      .sort((a, b) => {
        // Prioridad 1: Preguntas específicas del rol (mayor prioridad)
        const aIsRolSpecific = a.exclusivo_rol_id === userProfile.rol_id;
        const bIsRolSpecific = b.exclusivo_rol_id === userProfile.rol_id;
        if (aIsRolSpecific && !bIsRolSpecific) return -1;
        if (!aIsRolSpecific && bIsRolSpecific) return 1;
        
        // Prioridad 2: Preguntas específicas del área
        const aIsAreaSpecific = a.area_id === userProfile.area_id;
        const bIsAreaSpecific = b.area_id === userProfile.area_id;
        if (aIsAreaSpecific && !bIsAreaSpecific) return -1;
        if (!aIsAreaSpecific && bIsAreaSpecific) return 1;
        
        // Prioridad 3: Ordenar por ID (consistencia)
        return a.id - b.id;
      })
      .slice(0, 6);
    
    const adopcionQuestions = adopcionFiltered;
    const conocimientoQuestions = conocimientoFiltered;
    
    logger.log('Preguntas filtradas:', {
      adopcion: adopcionQuestions.length,
      conocimiento: conocimientoQuestions.length,
      total: adopcionQuestions.length + conocimientoQuestions.length,
      total_con_dificultad: allQuestionsByDifficulty.length
    });


    // Combinar las preguntas: primero adopción, luego conocimiento
    const questions = [
      ...(adopcionQuestions || []),
      ...(conocimientoQuestions || [])
    ];

    // Validar que tengamos las preguntas necesarias
    if (questions.length < 12) {
      logger.warn(`Solo se obtuvieron ${questions.length} preguntas de 12 esperadas`, {
        adopcion: adopcionQuestions?.length || 0,
        conocimiento: conocimientoQuestions?.length || 0,
        dificultad_id: userProfile.dificultad_id,
        area_id: userProfile.area_id,
        rol_id: userProfile.rol_id,
        total_disponibles: allQuestionsByDifficulty.length,
        user_id: user.id
      });
      
      // Si no hay suficientes preguntas, intentar con preguntas más generales
      if (questions.length === 0) {
        logger.error('No se encontraron preguntas para el perfil del usuario', {
          dificultad_id: userProfile.dificultad_id,
          area_id: userProfile.area_id,
          rol_id: userProfile.rol_id,
          user_id: user.id
        });
        return NextResponse.json(
          { 
            error: 'No se encontraron preguntas para tu perfil. Por favor contacta al administrador.',
            details: `Dificultad: ${userProfile.dificultad_id}, Área: ${userProfile.area_id}, Rol: ${userProfile.rol_id}`
          },
          { status: 404 }
        );
      }
    }

    // Obtener respuestas existentes del usuario usando user_perfil_id
    const { data: existingAnswers, error: answersError } = await supabase
      .from('respuestas')
      .select('pregunta_id, valor')
      .eq('user_perfil_id', userProfile.id);

    if (answersError) {
      logger.error('Error fetching existing answers:', answersError);
    }

    // Mapear respuestas existentes
    const answersMap = (existingAnswers as QuestionnaireAnswerRow[] | null)?.reduce((acc: Record<number, unknown>, answer) => {
      acc[answer.pregunta_id] = answer.valor;
      return acc;
    }, {} as Record<number, unknown>) || {};

    // Combinar preguntas con respuestas existentes
    const questionsWithAnswers = questions?.map(question => ({
      ...question,
      respuesta_existente: answersMap[question.id] || null
    })) || [];

    return NextResponse.json({
      questions: questionsWithAnswers,
      total: questionsWithAnswers.length,
      userProfile: {
        id: userProfile.id,
        area_id: userProfile.area_id,
        rol_id: userProfile.rol_id,
        dificultad_id: userProfile.dificultad_id
      }
    });

  } catch (error) {
    logger.error('Error in questionnaire API:', error);
    const errorMessage = error instanceof Error ? error.message : String(error);
    const errorStack = error instanceof Error ? error.stack : undefined;
    
    return NextResponse.json(
      { 
        error: 'Error interno del servidor',
        details: process.env.NODE_ENV === 'development' ? errorMessage : undefined,
        stack: process.env.NODE_ENV === 'development' ? errorStack : undefined
      },
      { status: 500 }
    );
  }
}
