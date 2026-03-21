import { NextRequest, NextResponse } from 'next/server';
import { SessionService } from '@/features/auth/services/session.service';
import { SofLIAPersonalizationService } from '@/core/services/soflia-personalization.service';
import type { SofLIAPersonalizationSettingsInput } from '@/core/types/soflia-personalization.types';
import { logger } from '@/lib/utils/logger';

/**
 * GET /api/lia/personalization
 * Obtiene la configuración de personalización del usuario actual
 */
export async function GET(request: NextRequest) {
  try {
    const user = await SessionService.getCurrentUser();
    if (!user) {
      return NextResponse.json(
        { error: 'No autenticado' },
        { status: 401 }
      );
    }

    const settings = await SofLIAPersonalizationService.getSettings(user.id);

    return NextResponse.json({
      settings,
      success: true,
    });
  } catch (error: any) {
    logger.error('Error obteniendo configuración de personalización:', error);
    return NextResponse.json(
      { 
        error: 'Error al obtener configuración',
        message: error.message,
        success: false 
      },
      { status: 500 }
    );
  }
}

/**
 * POST /api/lia/personalization
 * Actualiza la configuración de personalización del usuario actual
 * 
 * Body:
 * {
 *   base_style?: 'professional' | 'casual' | 'technical' | 'friendly' | 'formal',
 *   is_friendly?: boolean,
 *   is_enthusiastic?: boolean,
 *   custom_instructions?: string | null,
 *   nickname?: string | null,
 *   voice_enabled?: boolean,
 *   dictation_enabled?: boolean
 * }
 */
export async function POST(request: NextRequest) {
  try {
    const user = await SessionService.getCurrentUser();
    if (!user) {
      return NextResponse.json(
        { error: 'No autenticado' },
        { status: 401 }
      );
    }

    const body = await request.json();
    const settingsInput: SofLIAPersonalizationSettingsInput = {
      base_style: body.base_style,
      is_friendly: body.is_friendly,
      is_enthusiastic: body.is_enthusiastic,
      custom_instructions: body.custom_instructions || null,
      nickname: body.nickname || null,
      voice_enabled: body.voice_enabled,
      dictation_enabled: body.dictation_enabled,
    };

    // Validar que al menos un campo esté presente
    const hasAnyField = Object.values(settingsInput).some(
      (value) => value !== undefined
    );

    if (!hasAnyField) {
      return NextResponse.json(
        { error: 'Debe proporcionar al menos un campo para actualizar' },
        { status: 400 }
      );
    }

    // Sanitizar custom_instructions para prevenir prompt injection básico
    if (settingsInput.custom_instructions) {
      // Remover caracteres peligrosos comunes en prompt injection
      const dangerousPatterns = [
        /ignore\s+previous\s+instructions/gi,
        /disregard\s+all\s+prior\s+commands/gi,
        /act\s+as\s+a/gi,
        /jailbreak/gi,
        /forget\s+everything/gi,
        /new\s+instructions/gi,
        /override/gi,
        /system\s+prompt/gi,
        /you\s+are\s+now/gi,
        /pretend\s+to\s+be/gi,
        /roleplay\s+as/gi,
        /dan\s+mode/gi,
        /developer\s+mode/gi,
        /developer\s+mode/gi,
      ];

      let sanitized = settingsInput.custom_instructions;
      for (const pattern of dangerousPatterns) {
        sanitized = sanitized.replace(pattern, '[contenido bloqueado]');
      }

      // Si se detectó contenido peligroso, advertir pero permitir (el usuario puede querer instrucciones específicas)
      if (sanitized !== settingsInput.custom_instructions) {
        logger.warn('Se detectó posible prompt injection en custom_instructions:', {
          userId: user.id,
          originalLength: settingsInput.custom_instructions.length,
        });
        // No bloquear, solo sanitizar
        settingsInput.custom_instructions = sanitized;
      }
    }

    const updatedSettings = await SofLIAPersonalizationService.updateSettings(
      user.id,
      settingsInput
    );

    return NextResponse.json({
      settings: updatedSettings,
      success: true,
      message: 'Configuración actualizada correctamente',
    });
  } catch (error: any) {
    logger.error('Error actualizando configuración de personalización:', error);
    
    // Manejar errores de validación
    if (error.message.includes('exceder')) {
      return NextResponse.json(
        { 
          error: error.message,
          success: false 
        },
        { status: 400 }
      );
    }

    return NextResponse.json(
      { 
        error: 'Error al actualizar configuración',
        message: error.message,
        success: false 
      },
      { status: 500 }
    );
  }
}

/**
 * DELETE /api/lia/personalization
 * Elimina la configuración de personalización del usuario (restablece a valores por defecto)
 */
export async function DELETE(request: NextRequest) {
  try {
    const user = await SessionService.getCurrentUser();
    if (!user) {
      return NextResponse.json(
        { error: 'No autenticado' },
        { status: 401 }
      );
    }

    await SofLIAPersonalizationService.deleteSettings(user.id);

    return NextResponse.json({
      success: true,
      message: 'Configuración eliminada correctamente',
    });
  } catch (error: any) {
    logger.error('Error eliminando configuración de personalización:', error);
    return NextResponse.json(
      { 
        error: 'Error al eliminar configuración',
        message: error.message,
        success: false 
      },
      { status: 500 }
    );
  }
}
