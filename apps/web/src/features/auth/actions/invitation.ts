'use server';

import { z } from 'zod';
import crypto from 'crypto';
import { createClient } from '../../../lib/supabase/server';
import { emailService } from '../services/email.service';
import { logger } from '../../../lib/logger';

// ============================================================================
// SCHEMAS DE VALIDACIÓN
// ============================================================================

const inviteUserSchema = z.object({
  email: z.string().email('Email inválido'),
  role: z.enum(['owner', 'admin', 'member']).default('member'),
  organizationId: z.string().uuid('ID de organización inválido'),
  customMessage: z.string().max(500).optional(),
  position: z.string().max(100).optional(),
});

const validateInvitationSchema = z.object({
  token: z.string().min(64, 'Token inválido').max(64, 'Token inválido'),
});

// ============================================================================
// TIPOS
// ============================================================================

interface InviteResult {
  success: boolean;
  error?: string;
  invitationId?: string;
}

interface ValidateResult {
  valid: boolean;
  email?: string;
  role?: string;
  position?: string;
  organizationId?: string;
  organizationName?: string;
  organizationSlug?: string;
  error?: string;
}

interface ConsumeResult {
  success: boolean;
  error?: string;
}

interface FindInvitationResult {
  hasInvitation: boolean;
  role?: string;
  position?: string;
  error?: string;
}

// ============================================================================
// ACTION: ENVIAR INVITACIÓN
// ============================================================================

export async function inviteUserAction(
  input: {
    email: string;
    role?: 'owner' | 'admin' | 'member';
    organizationId: string;
    customMessage?: string;
    position?: string;
  } | FormData
): Promise<InviteResult> {
  try {
    // 1. Parsear y validar datos
    let data: z.infer<typeof inviteUserSchema>;

    if (input instanceof FormData) {
      data = inviteUserSchema.parse({
        email: input.get('email'),
        role: input.get('role') || 'member',
        organizationId: input.get('organizationId'),
        customMessage: input.get('customMessage') || undefined,
        position: input.get('position') || undefined,
      });
    } else {
      data = inviteUserSchema.parse({
        ...input,
        role: input.role || 'member',
      });
    }

    const supabase = await createClient();

    // 2. Verificar que el email no esté ya registrado en la organización
    const { data: existingUser } = await supabase
      .from('users')
      .select('id')
      .ilike('email', data.email.trim())
      .single();

    if (existingUser) {
      // Verificar si ya está en la organización
      const { data: orgUser } = await supabase
        .from('organization_users')
        .select('id')
        .eq('user_id', existingUser.id)
        .eq('organization_id', data.organizationId)
        .single();

      if (orgUser) {
        return { success: false, error: 'Este usuario ya pertenece a la organización' };
      }
    }

    // 3. Verificar si ya existe invitación pendiente
    const { data: existingInvitation } = await supabase
      .from('user_invitations')
      .select('id')
      .ilike('email', data.email.trim())
      .eq('organization_id', data.organizationId)
      .eq('status', 'pending')
      .single();

    if (existingInvitation) {
      return { success: false, error: 'Ya existe una invitación pendiente para este email' };
    }

    // 4. Generar token seguro (64 caracteres hexadecimales)
    const token = crypto.randomBytes(32).toString('hex');
    const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000); // 7 días

    // 5. Crear invitación
    const { data: invitation, error: insertError } = await supabase
      .from('user_invitations')
      .insert({
        email: data.email.toLowerCase().trim(),
        token,
        role: data.role,
        organization_id: data.organizationId,
        expires_at: expiresAt.toISOString(),
        metadata: {
          position: data.position || null,
          custom_message: data.customMessage || null,
        },
      })
      .select('id')
      .single();

    if (insertError) {
      logger.error('Error creando invitación:', insertError);
      return { success: false, error: 'Error al crear invitación' };
    }

    // 6. Obtener info de organización para el email
    const { data: org } = await supabase
      .from('organizations')
      .select('name, slug, logo_url')
      .eq('id', data.organizationId)
      .single();

    // 7. Enviar email de invitación
    try {
      await emailService.sendOrganizationInvitationEmail(
        data.email,
        token,
        org?.name || 'Organización',
        org?.slug || '',
        data.customMessage,
        org?.logo_url || undefined
      );

      logger.info('Invitación enviada exitosamente', {
        email: data.email,
        organizationId: data.organizationId,
        invitationId: invitation.id,
      });
    } catch (emailError) {
      // Log error pero no fallar la invitación (ya está creada en DB)
      logger.error('Error enviando email de invitación:', emailError);
      // La invitación existe, el admin puede reenviarla después
    }

    return { success: true, invitationId: invitation.id };
  } catch (error) {
    if (error instanceof z.ZodError) {
      return { success: false, error: error.errors[0].message };
    }
    logger.error('Error en inviteUserAction:', error);
    return { success: false, error: 'Error procesando invitación' };
  }
}

// ============================================================================
// ACTION: VALIDAR TOKEN DE INVITACIÓN
// ============================================================================

export async function validateInvitationAction(
  token: string
): Promise<ValidateResult> {
  try {
    const parsed = validateInvitationSchema.parse({ token });

    const supabase = await createClient();

    // 1. Buscar invitación por token con JOIN a organizations
    const { data: invitation, error } = await supabase
      .from('user_invitations')
      .select(`
        id,
        email,
        role,
        status,
        expires_at,
        organization_id,
        metadata,
        organizations (
          id,
          name,
          slug,
          logo_url
        )
      `)
      .eq('token', parsed.token)
      .single();

    if (error || !invitation) {
      return { valid: false, error: 'Invitación no encontrada' };
    }

    // 2. Verificar estado
    if (invitation.status !== 'pending') {
      if (invitation.status === 'accepted') {
        return { valid: false, error: 'Esta invitación ya fue utilizada' };
      }
      if (invitation.status === 'revoked') {
        return { valid: false, error: 'Esta invitación fue revocada' };
      }
      return { valid: false, error: 'Esta invitación ya no es válida' };
    }

    // 3. Verificar expiración
    if (new Date(invitation.expires_at) < new Date()) {
      // Marcar como expirada
      await supabase
        .from('user_invitations')
        .update({ status: 'expired' })
        .eq('id', invitation.id);

      return { valid: false, error: 'Esta invitación ha expirado' };
    }

    // 4. Retornar datos de la invitación
    const org = invitation.organizations as any;
    const metadata = invitation.metadata as any;

    return {
      valid: true,
      email: invitation.email,
      role: invitation.role,
      position: metadata?.position || undefined,
      organizationId: invitation.organization_id,
      organizationName: org?.name,
      organizationSlug: org?.slug,
    };
  } catch (error) {
    if (error instanceof z.ZodError) {
      return { valid: false, error: 'Token inválido' };
    }
    logger.error('Error en validateInvitationAction:', error);
    return { valid: false, error: 'Error validando invitación' };
  }
}

// ============================================================================
// ACTION: CONSUMIR INVITACIÓN (marcar como aceptada)
// ============================================================================

export async function consumeInvitationAction(
  tokenOrEmail: string,
  organizationId: string,
  userId: string
): Promise<ConsumeResult> {
  try {
    const supabase = await createClient();

    // Buscar por token o por email
    let invitation;

    // Si parece un token (64 chars hex)
    if (tokenOrEmail.length === 64 && /^[a-f0-9]+$/i.test(tokenOrEmail)) {
      const { data } = await supabase
        .from('user_invitations')
        .select('id, email, role, organization_id')
        .eq('token', tokenOrEmail)
        .eq('status', 'pending')
        .single();
      invitation = data;
    } else {
      // Buscar por email
      const { data } = await supabase
        .from('user_invitations')
        .select('id, email, role, organization_id')
        .ilike('email', tokenOrEmail.trim())
        .eq('organization_id', organizationId)
        .eq('status', 'pending')
        .single();
      invitation = data;
    }

    if (!invitation) {
      // No es un error crítico si no se encuentra - puede que ya fue consumida
      logger.warn('Invitación no encontrada para consumir', { tokenOrEmail, organizationId });
      return { success: true }; // Retornamos success para no bloquear el registro
    }

    // Marcar como aceptada
    const { error: updateError } = await supabase
      .from('user_invitations')
      .update({
        status: 'accepted',
        accepted_at: new Date().toISOString(),
      })
      .eq('id', invitation.id);

    if (updateError) {
      logger.error('Error actualizando invitación:', updateError);
      return { success: false, error: 'Error actualizando invitación' };
    }

    logger.info('Invitación consumida exitosamente', {
      invitationId: invitation.id,
      userId,
      organizationId,
    });

    return { success: true };
  } catch (error) {
    logger.error('Error en consumeInvitationAction:', error);
    return { success: false, error: 'Error consumiendo invitación' };
  }
}

// ============================================================================
// ACTION: BUSCAR INVITACIÓN POR EMAIL (para SSO/registro manual)
// ============================================================================

export async function findInvitationByEmailAction(
  email: string,
  organizationId: string
): Promise<FindInvitationResult> {
  try {
    const supabase = await createClient();

    const { data: invitation } = await supabase
      .from('user_invitations')
      .select('id, role, expires_at, metadata')
      .ilike('email', email.trim())
      .eq('organization_id', organizationId)
      .eq('status', 'pending')
      .single();

    if (!invitation) {
      return { hasInvitation: false };
    }

    // Verificar expiración
    if (new Date(invitation.expires_at) < new Date()) {
      // Marcar como expirada
      await supabase
        .from('user_invitations')
        .update({ status: 'expired' })
        .eq('id', invitation.id);

      return { hasInvitation: false, error: 'La invitación ha expirado' };
    }

    // Extraer position del metadata
    const metadata = invitation.metadata as { position?: string } | null;
    const position = metadata?.position || undefined;

    return { hasInvitation: true, role: invitation.role, position };
  } catch (error) {
    logger.error('Error en findInvitationByEmailAction:', error);
    return { hasInvitation: false, error: 'Error buscando invitación' };
  }
}

// ============================================================================
// ACTION: REVOCAR INVITACIÓN
// ============================================================================

export async function revokeInvitationAction(
  invitationId: string
): Promise<{ success: boolean; error?: string }> {
  try {
    const supabase = await createClient();

    const { error } = await supabase
      .from('user_invitations')
      .update({ status: 'revoked' })
      .eq('id', invitationId)
      .eq('status', 'pending');

    if (error) {
      return { success: false, error: 'Error revocando invitación' };
    }

    return { success: true };
  } catch (error) {
    logger.error('Error en revokeInvitationAction:', error);
    return { success: false, error: 'Error revocando invitación' };
  }
}

// ============================================================================
// ACTION: LISTAR INVITACIONES DE UNA ORGANIZACIÓN
// ============================================================================

export async function listOrganizationInvitationsAction(
  organizationId: string,
  status?: 'pending' | 'accepted' | 'expired' | 'revoked'
): Promise<{
  success: boolean;
  invitations?: Array<{
    id: string;
    email: string;
    role: string;
    status: string;
    created_at: string;
    expires_at: string;
    metadata: any;
  }>;
  error?: string;
}> {
  try {
    const supabase = await createClient();

    let query = supabase
      .from('user_invitations')
      .select('id, email, role, status, created_at, expires_at, metadata')
      .eq('organization_id', organizationId)
      .order('created_at', { ascending: false });

    if (status) {
      query = query.eq('status', status);
    }

    const { data: invitations, error } = await query;

    if (error) {
      return { success: false, error: 'Error obteniendo invitaciones' };
    }

    return { success: true, invitations: invitations || [] };
  } catch (error) {
    logger.error('Error en listOrganizationInvitationsAction:', error);
    return { success: false, error: 'Error listando invitaciones' };
  }
}

// ============================================================================
// ACTION: REENVIAR INVITACIÓN
// ============================================================================

export async function resendInvitationAction(
  invitationId: string
): Promise<{ success: boolean; error?: string }> {
  try {
    const supabase = await createClient();

    // Obtener invitación
    const { data: invitation, error: fetchError } = await supabase
      .from('user_invitations')
      .select(`
        id,
        email,
        token,
        status,
        organization_id,
        metadata,
        organizations (
          name,
          slug,
          logo_url
        )
      `)
      .eq('id', invitationId)
      .single();

    if (fetchError || !invitation) {
      return { success: false, error: 'Invitación no encontrada' };
    }

    if (invitation.status !== 'pending') {
      return { success: false, error: 'Solo se pueden reenviar invitaciones pendientes' };
    }

    // Generar nuevo token y extender expiración
    const newToken = crypto.randomBytes(32).toString('hex');
    const newExpiry = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000);

    const { error: updateError } = await supabase
      .from('user_invitations')
      .update({
        token: newToken,
        expires_at: newExpiry.toISOString(),
      })
      .eq('id', invitationId);

    if (updateError) {
      return { success: false, error: 'Error actualizando invitación' };
    }

    // Reenviar email
    const org = invitation.organizations as any;
    const customMessage = (invitation.metadata as any)?.custom_message;

    try {
      await emailService.sendOrganizationInvitationEmail(
        invitation.email,
        newToken,
        org?.name || 'Organización',
        org?.slug || '',
        customMessage,
        org?.logo_url || undefined
      );
    } catch (emailError) {
      logger.error('Error reenviando email:', emailError);
      return { success: false, error: 'Error enviando email' };
    }

    return { success: true };
  } catch (error) {
    logger.error('Error en resendInvitationAction:', error);
    return { success: false, error: 'Error reenviando invitación' };
  }
}

// ============================================================================
// ACTION: CONSUMIR INVITACIÓN MASIVA (link de invitación)
// ============================================================================

export async function consumeBulkInvitationAction(
  token: string,
  userId: string
): Promise<{ success: boolean; error?: string; organizationSlug?: string }> {
  try {
    const supabase = await createClient();

    // 1. Validar el enlace de invitación
    const { data: link, error: linkError } = await supabase
      .from('bulk_invite_links')
      .select(`
        id,
        role,
        max_uses,
        current_uses,
        expires_at,
        status,
        organization_id
      `)
      .eq('token', token)
      .single();

    if (linkError || !link) {
      return { success: false, error: 'Enlace de invitación no encontrado' };
    }

    if (link.status !== 'active') {
      return { success: false, error: 'Este enlace de invitación no está activo' };
    }

    if (new Date(link.expires_at) <= new Date()) {
      await supabase.from('bulk_invite_links').update({ status: 'expired' }).eq('id', link.id);
      return { success: false, error: 'Este enlace de invitación ha expirado' };
    }

    if (link.current_uses >= link.max_uses) {
      await supabase.from('bulk_invite_links').update({ status: 'exhausted' }).eq('id', link.id);
      return { success: false, error: 'Este enlace ha alcanzado el límite de registros' };
    }

    // 2. Verificar que el usuario existe
    const { data: user, error: userError } = await supabase
      .from('users')
      .select('id')
      .eq('id', userId)
      .single();

    if (userError || !user) {
      return { success: false, error: 'Usuario no encontrado' };
    }

    // 3. Verificar si ya pertenece a la organización
    const { data: existingMember } = await supabase
      .from('organization_users')
      .select('id')
      .eq('user_id', userId)
      .eq('organization_id', link.organization_id)
      .single();

    if (existingMember) {
      return { success: false, error: 'Ya perteneces a esta organización' };
    }

    // 4. Unir al usuario a la organización
    const { error: insertError } = await supabase
      .from('organization_users')
      .insert({
        organization_id: link.organization_id,
        user_id: userId,
        role: link.role || 'member',
        status: 'active',
        joined_at: new Date().toISOString(),
      });

    if (insertError) {
      logger.error('Error al unir usuario a organización (bulk):', insertError);
      return { success: false, error: 'Error al unirte a la organización' };
    }

    // 5. Actualizar cargo_rol del usuario
    await supabase
      .from('users')
      .update({ cargo_rol: 'Business' })
      .eq('id', userId)
      .neq('cargo_rol', 'Administrador');

    // 6. Incrementar contador de usos
    await supabase
      .from('bulk_invite_links')
      .update({ current_uses: link.current_uses + 1 })
      .eq('id', link.id);

    // 7. Registrar unión
    await supabase
      .from('bulk_invite_registrations')
      .insert({
        bulk_invite_link_id: link.id,
        user_id: userId,
      });

    // 8. Obtener slug de organización
    const { data: org } = await supabase
      .from('organizations')
      .select('slug')
      .eq('id', link.organization_id)
      .single();

    return {
      success: true,
      organizationSlug: org?.slug || undefined
    };

  } catch (error) {
    logger.error('Error en consumeBulkInvitationAction:', error);
    return { success: false, error: 'Error interno al procesar invitación' };
  }
}
