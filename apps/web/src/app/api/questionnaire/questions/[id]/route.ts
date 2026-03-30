import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { cookies } from 'next/headers';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
  }

const supabase = supabaseUrl && supabaseAnonKey 
  ? createClient(supabaseUrl, supabaseAnonKey, {
      cookies: {
        get(name: string) {
          return cookies().get(name)?.value;
        },
      },
    })
  : null;

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const questionId = parseInt(id);

    if (!supabase) {
      return NextResponse.json(
        { error: 'Supabase no configurado. Por favor configura las variables de entorno.' },
        { status: 500 }
      );
    }

    // Obtener el usuario actual autenticado
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    
    if (authError || !user) {
      return NextResponse.json(
        { error: 'Usuario no autenticado. Por favor inicia sesión.' },
        { status: 401 }
      );
    }

    // Obtener el perfil del usuario primero
    const { data: userProfile, error: profileError } = await supabase
      .from('user_perfil')
      .select('id')
      .eq('user_id', user.id)
      .single();

    if (profileError || !userProfile) {
      return NextResponse.json(
        { error: 'Perfil de usuario no encontrado. Por favor completa tu perfil profesional primero.' },
        { status: 404 }
      );
    }

    // Obtener la pregunta específica
    const { data: question, error: questionError } = await supabase
      .from('preguntas')
      .select('*')
      .eq('id', questionId)
      .single();

    if (questionError) {
      return NextResponse.json(
        { error: 'Pregunta no encontrada' },
        { status: 404 }
      );
    }

    if (!question) {
      return NextResponse.json(
        { error: 'Pregunta no encontrada' },
        { status: 404 }
      );
    }

    // Obtener respuesta existente del usuario usando user_perfil_id
    const { data: existingAnswer, error: answerError } = await supabase
      .from('respuestas')
      .select('valor')
      .eq('user_perfil_id', userProfile.id)
      .eq('pregunta_id', questionId)
      .single();

    if (answerError && answerError.code !== 'PGRST116') {
    }

    // Combinar pregunta con respuesta existente
    const questionWithAnswer = {
      ...question,
      respuesta_existente: existingAnswer?.valor || null
    };

    return NextResponse.json(questionWithAnswer);

  } catch (error) {
    return NextResponse.json(
      { error: 'Error interno del servidor' },
      { status: 500 }
    );
  }
}

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const questionId = parseInt(id);
    const body = await request.json();
    const { valor } = body;

    if (!supabase) {
      return NextResponse.json(
        { error: 'Supabase no configurado. Por favor configura las variables de entorno.' },
        { status: 500 }
      );
    }

    // Obtener el usuario actual autenticado
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    
    if (authError || !user) {
      return NextResponse.json(
        { error: 'Usuario no autenticado. Por favor inicia sesión.' },
        { status: 401 }
      );
    }

    // Obtener el perfil del usuario primero
    const { data: userProfile, error: profileError } = await supabase
      .from('user_perfil')
      .select('id')
      .eq('user_id', user.id)
      .single();

    if (profileError || !userProfile) {
      return NextResponse.json(
        { error: 'Perfil de usuario no encontrado. Por favor completa tu perfil profesional primero.' },
        { status: 404 }
      );
    }

    // Verificar si ya existe una respuesta usando user_perfil_id
    const { data: existingAnswer, error: checkError } = await supabase
      .from('respuestas')
      .select('id')
      .eq('user_perfil_id', userProfile.id)
      .eq('pregunta_id', questionId)
      .single();

    let result;

    if (existingAnswer) {
      // Actualizar respuesta existente
      const { data, error } = await supabase
        .from('respuestas')
        .update({
          valor,
          respondido_en: new Date().toISOString()
        })
        .eq('id', existingAnswer.id)
        .select()
        .single();

      if (error) {
        return NextResponse.json(
          { error: 'Error al actualizar la respuesta' },
          { status: 500 }
        );
      }

      result = data;
    } else {
      // Crear nueva respuesta usando user_perfil_id
      const { data, error } = await supabase
        .from('respuestas')
        .insert({
          user_perfil_id: userProfile.id,
          pregunta_id: questionId,
          valor,
          respondido_en: new Date().toISOString()
        })
        .select()
        .single();

      if (error) {
        return NextResponse.json(
          { error: 'Error al guardar la respuesta' },
          { status: 500 }
        );
      }

      result = data;
    }

    return NextResponse.json({
      success: true,
      message: 'Respuesta guardada exitosamente',
      data: result
    });

  } catch (error) {
    return NextResponse.json(
      { error: 'Error interno del servidor' },
      { status: 500 }
    );
  }
}
