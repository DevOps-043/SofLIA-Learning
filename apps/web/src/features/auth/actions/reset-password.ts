'use server';

import { z } from 'zod';
import { createClient } from '../../../lib/supabase/server';
import { emailService } from '../services/email.service';
import { logger } from '../../../lib/logger';
import bcrypt from 'bcryptjs';
import crypto from 'crypto';

// ============================================================================
// SCHEMAS DE VALIDACIÓN
// ============================================================================

const requestResetSchema = z.object({
  email: z.string().email('Email inválido'),
});

const resetPasswordSchema = z.object({
  token: z.string().min(1, 'Token requerido'),
  newPassword: z
    .string()
    .min(8, 'La contraseña debe tener al menos 8 caracteres')
    .regex(/[A-Z]/, 'Debe contener al menos una mayúscula')
    .regex(/[a-z]/, 'Debe contener al menos una minúscula')
    .regex(/[0-9]/, 'Debe contener al menos un número'),
});

// ============================================================================
// RATE LIMITING
// ============================================================================

interface RateLimitEntry {
  count: number;
  timestamp: number;
}

const requestAttempts = new Map<string, RateLimitEntry>();
const RATE_LIMIT_WINDOW = 15 * 60 * 1000; // 15 minutos en ms
const MAX_REQUEST_ATTEMPTS = 3; // Máximo 3 solicitudes de reset
const MAX_RESET_ATTEMPTS = 5; // Máximo 5 intentos de reset

/**
 * Verifica si una IP está bloqueada por rate limiting
 */
function isRateLimited(
  ip: string,
  maxAttempts: number
): { limited: boolean; remainingTime?: number } {
  const now = Date.now();
  const userAttempts = requestAttempts.get(ip);

  if (!userAttempts) {
    return { limited: false };
  }

  // Limpiar intentos antiguos
  if (now - userAttempts.timestamp > RATE_LIMIT_WINDOW) {
    requestAttempts.delete(ip);
    return { limited: false };
  }

  if (userAttempts.count >= maxAttempts) {
    const remainingTime = RATE_LIMIT_WINDOW - (now - userAttempts.timestamp);
    return { limited: true, remainingTime };
  }

  return { limited: false };
}

/**
 * Registra un intento de operación
 */
function recordAttempt(ip: string): void {
  const now = Date.now();
  const userAttempts = requestAttempts.get(ip);

  if (!userAttempts || now - userAttempts.timestamp > RATE_LIMIT_WINDOW) {
    requestAttempts.set(ip, { count: 1, timestamp: now });
  } else {
    userAttempts.count++;
  }
}

/**
 * Obtiene la IP del cliente (simplificado para Server Actions)
 * En producción, considera usar headers de Next.js
 */
function getClientIP(): string {
  // En Server Actions de Next.js 15, no tenemos acceso directo a headers
  // En producción, podrías usar middleware para pasar la IP
  return 'unknown';
}

// ============================================================================
// ACTION: SOLICITAR RESTABLECIMIENTO DE CONTRASEÑA
// ============================================================================

export async function requestPasswordResetAction(
  formData: FormData | { email: string }
) {
  try {
    // 1. RATE LIMITING
    const clientIP = getClientIP();
    const rateLimitCheck = isRateLimited(clientIP, MAX_REQUEST_ATTEMPTS);

    if (rateLimitCheck.limited) {
      const minutes = Math.ceil((rateLimitCheck.remainingTime || 0) / 60000);
      return {
        error: `Demasiados intentos. Intenta de nuevo en ${minutes} minutos.`,
      };
    }

    // 2. PARSEAR Y VALIDAR EMAIL
    let email: string;

    if (formData instanceof FormData) {
      const parsed = requestResetSchema.parse({
        email: formData.get('email'),
      });
      email = parsed.email;
    } else {
      const parsed = requestResetSchema.parse(formData);
      email = parsed.email;
    }

    // 3. REGISTRAR INTENTO
    recordAttempt(clientIP);

    // 4. CREAR CLIENTE SUPABASE
    const supabase = await createClient();

    // 5. VERIFICAR QUE USUARIO EXISTE
    const { data: user, error: userError } = await supabase
      .from('users')
      .select('id, email, username, first_name')
      .ilike('email', email)
      .single();

    // POR SEGURIDAD: Siempre retornar el mismo mensaje
    const successMessage =
      'Si el correo está registrado, recibirás un enlace de recuperación.';

    if (userError || !user) {
      logger.error('User not found or DB error', { email, userError });
      return { success: true, message: successMessage };
    }

    logger.info('User found, proceeding with reset', { userId: user.id });

    // 6. GENERAR TOKEN SEGURO
    const resetToken = crypto.randomBytes(32).toString('hex'); // 64 caracteres hex
    const expiresAt = new Date(Date.now() + 3600000); // 1 hora

    // 7. GUARDAR TOKEN EN BASE DE DATOS
    const { error: insertError } = await supabase
      .from('password_reset_tokens')
      .insert({
        user_id: user.id,
        token: resetToken,
        expires_at: expiresAt.toISOString(),
      });

    if (insertError) {
      logger.error('Error inserting reset token', insertError);
      return {
        error: 'Error procesando solicitud. Inténtalo más tarde.',
      };
    }

    logger.info('Reset token saved, sending email');

    // 8. ENVIAR EMAIL
    try {
      if (!emailService.isReady()) {
        logger.error('Email service not ready - check SMTP configuration');
        return { success: true, message: successMessage };
      }

      const username = user.first_name || user.username || user.email.split('@')[0];
      await emailService.sendPasswordResetEmail(user.email, resetToken, username);

    } catch (emailError) {
      logger.error('Error sending password reset email', emailError);
    }

    return { success: true, message: successMessage };
  } catch (error) {
    if (error instanceof z.ZodError) {
      return { error: error.errors[0].message };
    }

    // console.error('Error en requestPasswordResetAction:', error);
    return { error: 'Error procesando solicitud. Inténtalo más tarde.' };
  }
}

// ============================================================================
// ACTION: RESTABLECER CONTRASEÑA
// ============================================================================

export async function resetPasswordAction(
  formData: FormData | { token: string; newPassword: string }
) {
  try {
    // 1. RATE LIMITING
    const clientIP = getClientIP();
    const rateLimitCheck = isRateLimited(clientIP, MAX_RESET_ATTEMPTS);

    if (rateLimitCheck.limited) {
      const minutes = Math.ceil((rateLimitCheck.remainingTime || 0) / 60000);
      return {
        error: `Demasiados intentos. Intenta de nuevo en ${minutes} minutos.`,
      };
    }

    // 2. PARSEAR Y VALIDAR DATOS
    let token: string;
    let newPassword: string;

    if (formData instanceof FormData) {
      const parsed = resetPasswordSchema.parse({
        token: formData.get('token'),
        newPassword: formData.get('newPassword'),
      });
      token = parsed.token;
      newPassword = parsed.newPassword;
    } else {
      const parsed = resetPasswordSchema.parse(formData);
      token = parsed.token;
      newPassword = parsed.newPassword;
    }

    // 3. REGISTRAR INTENTO
    recordAttempt(clientIP);

    // 4. CREAR CLIENTE SUPABASE
    const supabase = await createClient();

    // 5. VERIFICAR TOKEN EN BASE DE DATOS
    const { data: tokenData, error: tokenError } = await supabase
      .from('password_reset_tokens')
      .select('user_id, expires_at, used_at')
      .eq('token', token)
      .single();

    if (tokenError || !tokenData) {
      return { error: 'Token inválido o expirado.' };
    }

    // 6. VERIFICAR QUE NO ESTÉ USADO
    if (tokenData.used_at) {
      return { error: 'Este enlace ya fue utilizado.' };
    }

    // 7. VERIFICAR EXPIRACIÓN
    const now = new Date();
    const expiresAt = new Date(tokenData.expires_at);

    if (expiresAt < now) {
      // Token expirado - Eliminar de DB
      await supabase.from('password_reset_tokens').delete().eq('token', token);

      return {
        error: 'Token expirado. Solicita un nuevo enlace de recuperación.',
      };
    }

    // 8. ACTUALIZAR CONTRASEÑA VIA RPC (usa pgcrypto para compatibilidad con el ecosistema)
    const { data: rpcResult, error: rpcError } = await supabase.rpc('change_user_password', {
      p_user_id: tokenData.user_id,
      p_new_password: newPassword,
    });

    if (rpcError) {
      return { error: 'Error actualizando contraseña.' };
    }

    if (rpcResult && !rpcResult.success) {
      return { error: rpcResult.error || 'Error actualizando contraseña.' };
    }

    // 10. MARCAR TOKEN COMO USADO
    await supabase
      .from('password_reset_tokens')
      .update({ used_at: new Date().toISOString() })
      .eq('token', token);

    // 11. INVALIDAR SESIONES ACTIVAS (OPCIONAL)
    try {
      await supabase
        .from('user_session')
        .update({ revoked: true })
        .eq('user_id', tokenData.user_id);
    } catch (sessionError) {
      }

    // 12. RETORNAR ÉXITO
    return {
      success: true,
      message: 'Contraseña actualizada correctamente. Redirigiendo al login...',
    };
  } catch (error) {
    if (error instanceof z.ZodError) {
      return { error: error.errors[0].message };
    }

    // console.error('Error en resetPasswordAction:', error);
    return { error: 'Error procesando solicitud. Inténtalo más tarde.' };
  }
}

// ============================================================================
// ACTION: VALIDAR TOKEN (para verificar en carga de página)
// ============================================================================

export async function validateResetTokenAction(token: string) {
  try {
    const supabase = await createClient();
    const { data: tokenData, error } = await supabase
      .from('password_reset_tokens')
      .select('expires_at, used_at')
      .eq('token', token)
      .single();

    if (error || !tokenData) {
      return { valid: false, error: 'Token inválido.' };
    }

    if (tokenData.used_at) {
      return { valid: false, error: 'Este enlace ya fue utilizado.' };
    }

    const now = new Date();
    const expiresAt = new Date(tokenData.expires_at);

    if (expiresAt < now) {
      return { valid: false, error: 'Token expirado.' };
    }

    return { valid: true };
  } catch (error) {
    // console.error('Error validando token:', error);
    return { valid: false, error: 'Error validando token.' };
  }
}
