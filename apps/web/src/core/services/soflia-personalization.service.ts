import 'server-only'
import { logger as techDebtLogger } from '@/lib/utils/logger'
/**
 * SofLIAPersonalizationService
 * 
 * Servicio para gestionar la configuración de personalización de SofLIA.
 */

import { createClient as createSupabaseClient } from '@supabase/supabase-js';
import type {
  SofLIAPersonalizationSettings,
  SofLIAPersonalizationSettingsInput,
  BaseStyle,
} from '../types/soflia-personalization.types';
import type { Database } from '../../lib/supabase/types';
import { fromLoose } from '../../lib/supabase/looseQuery';
import { SELECT_COLUMNS } from '../../lib/supabase/select-types';

type SofliaPersonalizationRow = SofLIAPersonalizationSettings;
type SofliaPersonalizationWriteRow = Partial<SofLIAPersonalizationSettings> & {
  user_id?: string;
};

function createAdminClient() {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!supabaseUrl || !supabaseServiceKey) {
    throw new Error('Missing Supabase environment variables for admin client');
  }

  return createSupabaseClient<Database>(supabaseUrl, supabaseServiceKey, {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
    },
  });
}

function personalizationSettingsTable(client: unknown) {
  return fromLoose<SofliaPersonalizationRow, SofliaPersonalizationWriteRow>(
    client,
    'lia_personalization_settings'
  );
}

export class SofLIAPersonalizationService {
  /**
   * Obtiene la configuración de personalización del usuario
   */
  static async getSettings(userId: string): Promise<SofLIAPersonalizationSettings | null> {
    const adminSupabase = createAdminClient();

    const { data, error } = await personalizationSettingsTable(adminSupabase)
      .select(SELECT_COLUMNS.lia_personalization_settings)
      .eq('user_id', userId)
      .single();

    if (error) {
      if (error.code === 'PGRST116') {
        return null;
      }
      techDebtLogger.error('Error obteniendo configuración de personalización:', error);
      throw new Error(`Error al obtener configuración: ${error.message}`);
    }

    return data as SofLIAPersonalizationSettings;
  }

  /**
   * Obtiene la configuración de personalización del usuario o crea una con valores por defecto
   */
  static async getSettingsOrCreate(userId: string): Promise<SofLIAPersonalizationSettings> {
    let settings = await this.getSettings(userId);
    if (!settings) {
      settings = await this.createDefaultSettings(userId);
    }
    return settings;
  }

  /**
   * Crea una configuración de personalización con valores por defecto
   */
  static async createDefaultSettings(userId: string): Promise<SofLIAPersonalizationSettings> {
    const adminSupabase = createAdminClient();

    const defaultSettings: Partial<SofLIAPersonalizationSettings> = {
      user_id: userId,
      base_style: 'professional',
      is_friendly: true,
      is_enthusiastic: true,
      custom_instructions: null,
      nickname: null,
      voice_enabled: true,
      dictation_enabled: false,
    };

    const { data, error } = await personalizationSettingsTable(adminSupabase)
      .insert(defaultSettings)
      .select()
      .single();

    if (error) {
      techDebtLogger.error('Error creando configuración por defecto:', error);
      throw new Error(`Error al crear configuración: ${error.message}`);
    }

    return data as SofLIAPersonalizationSettings;
  }

  /**
   * Actualiza la configuración de personalización del usuario
   */
  static async updateSettings(
    userId: string,
    settings: SofLIAPersonalizationSettingsInput
  ): Promise<SofLIAPersonalizationSettings> {
    const adminSupabase = createAdminClient();

    if (settings.custom_instructions && settings.custom_instructions.length > 2000) {
      throw new Error('Las instrucciones personalizadas no pueden exceder 2000 caracteres');
    }

    if (settings.nickname && settings.nickname.length > 50) {
      throw new Error('El apodo no puede exceder 50 caracteres');
    }

    const { data: updatedData, error: updateError } = await personalizationSettingsTable(adminSupabase)
      .update(settings)
      .eq('user_id', userId)
      .select()
      .single();

    if (updateError) {
      if (updateError.code === 'PGRST116') {
        const { data: createdData, error: createError } = await personalizationSettingsTable(adminSupabase)
          .insert({
            user_id: userId,
            ...settings,
          })
          .select()
          .single();

        if (createError) {
          throw new Error(`Error al crear configuración: ${createError.message}`);
        }

        return createdData as SofLIAPersonalizationSettings;
      }
      throw new Error(`Error al actualizar configuración: ${updateError.message}`);
    }

    return updatedData as SofLIAPersonalizationSettings;
  }

  /**
   * Elimina la configuración de personalización del usuario
   */
  static async deleteSettings(userId: string): Promise<void> {
    const adminSupabase = createAdminClient();

    const { error } = await personalizationSettingsTable(adminSupabase)
      .delete()
      .eq('user_id', userId);

    if (error) {
      throw new Error(`Error al eliminar configuración: ${error.message}`);
    }
  }

  /**
   * Construye el prompt de personalización basado en la configuración
   */
  static buildPersonalizationPrompt(settings: SofLIAPersonalizationSettings): string {
    let prompt = '';

    const styleInstructions: Record<BaseStyle, string> = {
      professional: 'Usa un tono profesional y formal.',
      casual: 'Usa un tono casual y relajado.',
      technical: 'Usa un tono técnico y preciso.',
      friendly: 'Usa un tono amigable y cálido.',
      formal: 'Usa un tono formal y respetuoso.',
    };

    prompt += `\n## ESTILO Y TONO BASE\n`;
    prompt += `${styleInstructions[settings.base_style]}\n`;

    if (settings.is_friendly) {
      prompt += '- Sé amable y empático\n';
    }
    
    if (settings.is_enthusiastic) {
      prompt += '- Muestra entusiasmo\n';
    }

    if (settings.nickname) {
      prompt += `\n## INFORMACIÓN DEL USUARIO\n`;
      prompt += `- El usuario prefiere ser llamado: "${settings.nickname}"\n`;
    }

    if (settings.custom_instructions) {
      prompt += `\n## INSTRUCCIONES PERSONALIZADAS\n`;
      prompt += `${settings.custom_instructions}\n`;
    }

    prompt += `\n## RESTRICCIONES CRÍTICAS - ALCANCE\n`;
    prompt += `La personalización SOLO afecta el ESTILO y TONO, NO el ALCANCE.\n`;

    prompt += `\n## PRIORIDAD EN ACTIVIDADES EDUCATIVAS\n`;
    prompt += `Si el usuario esta dentro de una actividad, taller, leccion o evaluacion, las instrucciones pedagogicas y el contexto de aprendizaje tienen prioridad sobre cualquier personalizacion.\n`;
    prompt += `No conviertas respuestas de aprendizaje, ejemplos del usuario o situaciones hipoteticas de la actividad en reportes tecnicos, tickets, planes de accion externos ni workflows administrativos, salvo que el usuario pida explicitamente reportar un problema tecnico de la plataforma.\n`;
    prompt += `La personalizacion no puede cambiar el objetivo de la actividad, los criterios de evaluacion, el flujo conversacional ni la politica de cierre.\n`;

    return prompt;
  }
}
