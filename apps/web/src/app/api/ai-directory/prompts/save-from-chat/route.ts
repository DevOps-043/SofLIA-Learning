import { NextRequest, NextResponse } from 'next/server';
import { logger } from '@/lib/utils/logger';
import { createClient } from '../../../../../lib/supabase/server';
import { SessionService } from '../../../../../features/auth/services/session.service';
import crypto from 'crypto';

/**
 * Endpoint para guardar prompts generados desde el chat de LIA
 * POST /api/ai-directory/prompts/save-from-chat
 */

// Función para generar slug único
function generateSlug(title: string): string {
  const baseSlug = title
    .toLowerCase()
    .replace(/[^\w\s-]/g, '') // Remover caracteres especiales
    .replace(/\s+/g, '-') // Reemplazar espacios con guiones
    .replace(/-+/g, '-') // Reemplazar múltiples guiones con uno solo
    .trim();
  
  // Agregar timestamp para asegurar unicidad
  const timestamp = Date.now();
  return `${baseSlug}-${timestamp}`;
}

// Función para validar datos del prompt
function validatePromptData(data: {
  title?: string
  description?: string
  content?: string
  tags?: unknown
  use_cases?: unknown
  tips?: unknown
  difficulty_level?: string
}): { valid: boolean; errors: string[] } {
  const errors: string[] = [];

  if (!data.title || data.title.trim().length === 0) {
    errors.push('El título es requerido');
  } else if (data.title.length > 200) {
    errors.push('El título no puede exceder 200 caracteres');
  }

  if (!data.content || data.content.trim().length === 0) {
    errors.push('El contenido del prompt es requerido');
  } else if (data.content.length > 10000) {
    errors.push('El contenido no puede exceder 10,000 caracteres');
  }

  if (data.description && data.description.length > 500) {
    errors.push('La descripción no puede exceder 500 caracteres');
  }

  if (data.tags && !Array.isArray(data.tags)) {
    errors.push('Las etiquetas deben ser un array');
  }

  if (data.use_cases && !Array.isArray(data.use_cases)) {
    errors.push('Los casos de uso deben ser un array');
  }

  if (data.tips && !Array.isArray(data.tips)) {
    errors.push('Los consejos deben ser un array');
  }

  if (
    data.difficulty_level &&
    !['beginner', 'intermediate', 'advanced'].includes(data.difficulty_level)
  ) {
    errors.push(
      'El nivel de dificultad debe ser: beginner, intermediate o advanced'
    );
  }

  return {
    valid: errors.length === 0,
    errors,
  };
}

export async function POST(request: NextRequest) {
  try {
    // 1. Verificar autenticación
    const user = await SessionService.getCurrentUser();
    if (!user) {
      return NextResponse.json(
        { error: 'No autorizado. Debes iniciar sesión para guardar prompts.' },
        { status: 401 }
      );
    }

    // 2. Obtener datos del request
    const body = await request.json();
    const {
      title,
      description,
      content,
      tags = [],
      difficulty_level = 'beginner',
      use_cases = [],
      tips = [],
      category_id,
      conversation_id,
    } = body;

    // 3. Validar datos
    const validation = validatePromptData({
      title,
      description,
      content,
      tags,
      difficulty_level,
      use_cases,
      tips,
    });

    if (!validation.valid) {
      return NextResponse.json(
        {
          error: 'Datos inválidos',
          details: validation.errors,
        },
        { status: 400 }
      );
    }

    // 4. Generar slug único
    const slug = generateSlug(title);
    const prompt_id = crypto.randomUUID();

    // 5. Preparar datos para insertar
    const promptData = {
      prompt_id,
      title: title.trim(),
      slug,
      description: description?.trim() || null,
      content: content.trim(),
      tags: tags.length > 0 ? tags : null,
      difficulty_level,
      use_cases: use_cases.length > 0 ? use_cases : null,
      tips: tips.length > 0 ? tips : null,
      category_id: category_id || null,
      author_id: user.id,
      source: 'ai_chat', // Identificar que proviene del chat
      conversation_id: conversation_id || null, // Vincular con la conversación
      is_active: true,
      is_featured: false,
      is_verified: false,
      view_count: 0,
      like_count: 0,
      download_count: 0,
      rating_count: 0,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };

    // 6. Guardar en la base de datos
    const supabase = await createClient();
    const { data, error } = await supabase
      .from('ai_prompts')
      .insert(promptData)
      .select()
      .single();

    if (error) {
      logger.error('Error guardando prompt desde chat:', error);
      return NextResponse.json(
        {
          error: 'Error al guardar el prompt',
          details: error.message,
        },
        { status: 500 }
      );
    }

    // 7. Log de éxito
    logger.info('Prompt guardado desde chat:', {
      prompt_id,
      user_id: user.id,
      title,
      source: 'ai_chat',
    });

    // 8. Retornar respuesta exitosa
    return NextResponse.json(
      {
        success: true,
        message: 'Prompt guardado exitosamente en tu biblioteca',
        prompt: {
          id: data.prompt_id,
          title: data.title,
          slug: data.slug,
        },
        redirectUrl: `/prompt-directory/${slug}`,
      },
      { status: 201 }
    );
  } catch (error) {
    logger.error('Error en endpoint save-from-chat:', error);
    return NextResponse.json(
      {
        error: 'Error interno del servidor',
        details:
          error instanceof Error ? error.message : 'Error desconocido',
      },
      { status: 500 }
    );
  }
}
