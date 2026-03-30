import type { SupabaseClient } from '@supabase/supabase-js';

export interface ForbiddenContentResult {
  contains: boolean;
  words: string[];
}

export interface WarningResult {
  warningCount: number;
  userBanned: boolean;
  message: string;
}

/**
 * Verifica si un texto contiene palabras prohibidas
 */
export async function containsForbiddenContent(
  text: string,
  supabase: SupabaseClient
): Promise<ForbiddenContentResult> {
  
  try {
    const { data, error } = await supabase.rpc('contains_forbidden_content', {
      p_text: text
    });
    
    if (error) {
      return { contains: false, words: [] };
    }
    
    return {
      contains: data?.contains_forbidden || false,
      words: data?.found_words || []
    };
  } catch (error) {
    return { contains: false, words: [] };
  }
}

/**
 * Registra una advertencia para un usuario
 * Si el usuario alcanza 4 advertencias, será baneado automáticamente
 */
export async function registerWarning(
  userId: string,
  content: string,
  contentType: 'post' | 'comment',
  supabase: SupabaseClient,
  contentId?: string
): Promise<WarningResult> {
  
  try {
    const { data, error } = await supabase.rpc('register_user_warning', {
      p_user_id: userId,
      p_reason: 'contenido_ofensivo',
      p_content_type: contentType,
      p_content_id: contentId || null,
      p_blocked_content: content
    });
    
    if (error) {
      throw error;
    }
    
    return {
      warningCount: data?.warning_count || 0,
      userBanned: data?.user_banned || false,
      message: data?.message || ''
    };
  } catch (error) {
    throw error;
  }
}

/**
 * Verifica si un usuario está baneado
 */
export async function isUserBanned(
  userId: string,
  supabase: SupabaseClient
): Promise<boolean> {
  
  try {
    const { data, error } = await supabase.rpc('is_user_banned', {
      p_user_id: userId
    });
    
    if (error) {
      return false;
    }
    
    return data || false;
  } catch (error) {
    return false;
  }
}

/**
 * Obtiene el historial de advertencias de un usuario
 */
export async function getUserWarningHistory(
  userId: string,
  supabase: SupabaseClient
) {
  
  try {
    const { data, error } = await supabase.rpc('get_user_warning_history', {
      p_user_id: userId
    });
    
    if (error) {
      return [];
    }
    
    return data || [];
  } catch (error) {
    return [];
  }
}

/**
 * Obtiene el conteo de advertencias de un usuario
 */
export async function getUserWarningsCount(
  userId: string,
  supabase: SupabaseClient
): Promise<number> {
  
  try {
    const { data, error } = await supabase.rpc('get_user_warnings_count', {
      p_user_id: userId
    });
    
    if (error) {
      return 0;
    }
    
    return data || 0;
  } catch (error) {
    return 0;
  }
}
