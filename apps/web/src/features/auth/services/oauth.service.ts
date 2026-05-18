import { createClient } from '../../../lib/supabase/server';
import { escapeIlikePattern } from '../../../lib/supabase/ilike-escape';
import type { Database } from '../../../lib/supabase/types';
import {
  OAuthAccount,
  OAuthProvider,
  OAuthTokens,
  OAuthUserRecord,
} from '../types/oauth.types';

type OAuthAccountRow = Database['public']['Tables']['oauth_accounts']['Row'];
type OAuthSupabaseClient = Awaited<ReturnType<typeof createClient>>;

interface OAuthMembershipUserRow {
  user_id: string;
}

function mapOAuthAccount(row: OAuthAccountRow): OAuthAccount {
  return {
    id: row.id,
    user_id: row.user_id,
    provider: row.provider as OAuthProvider,
    provider_account_id: row.provider_account_id,
    access_token: row.access_token ?? undefined,
    refresh_token: row.refresh_token ?? undefined,
    token_expires_at: row.token_expires_at ? new Date(row.token_expires_at) : undefined,
    scope: row.scope ?? undefined,
    token_type: row.token_type ?? undefined,
    created_at: row.created_at ? new Date(row.created_at) : new Date(0),
    updated_at: row.updated_at ? new Date(row.updated_at) : new Date(0),
  };
}

export class OAuthService {
  /**
   * Crea o actualiza una cuenta OAuth
   */
  static async upsertOAuthAccount(
    userId: string,
    provider: OAuthProvider,
    providerAccountId: string,
    tokens: OAuthTokens
  ): Promise<OAuthAccount> {
    const supabase = await createClient();

    const expiresAt = tokens.expires_at ? new Date(tokens.expires_at) : null;

    const { data, error } = await supabase
      .from('oauth_accounts')
      .upsert(
        {
          user_id: userId,
          provider,
          provider_account_id: providerAccountId,
          access_token: tokens.access_token,
          refresh_token: tokens.refresh_token || null,
          token_expires_at: expiresAt?.toISOString() ?? null,
          scope: tokens.scope,
          token_type: tokens.token_type,
          updated_at: new Date().toISOString(),
        },
        {
          onConflict: 'provider,provider_account_id',
        }
      )
      .select()
      .single();

    if (error) {
      throw new Error(`Error guardando cuenta OAuth: ${error.message}`);
    }

    return mapOAuthAccount(data);
  }

  /**
   * Busca una cuenta OAuth por proveedor y ID de proveedor
   */
  static async findOAuthAccount(
    provider: OAuthProvider,
    providerAccountId: string
  ): Promise<OAuthAccount | null> {
    const supabase = await createClient();

    const { data, error } = await supabase
      .from('oauth_accounts')
      .select('*')
      .eq('provider', provider)
      .eq('provider_account_id', providerAccountId)
      .single();

    if (error) {
      if (error.code === 'PGRST116') {
        return null; // No encontrado
      }
      throw new Error(`Error buscando cuenta OAuth: ${error.message}`);
    }

    return mapOAuthAccount(data);
  }

  /**
   * Busca cuentas OAuth por usuario
   */
  static async findOAuthAccountsByUser(userId: string): Promise<OAuthAccount[]> {
    const supabase = await createClient();

    const { data, error } = await supabase
      .from('oauth_accounts')
      .select('*')
      .eq('user_id', userId);

    if (error) {
      throw new Error(`Error buscando cuentas OAuth: ${error.message}`);
    }

    return data.map(mapOAuthAccount);
  }

  /**
   * Elimina una cuenta OAuth
   */
  static async deleteOAuthAccount(
    provider: OAuthProvider,
    providerAccountId: string
  ): Promise<void> {
    const supabase = await createClient();

    const { error } = await supabase
      .from('oauth_accounts')
      .delete()
      .eq('provider', provider)
      .eq('provider_account_id', providerAccountId);

    if (error) {
      throw new Error(`Error eliminando cuenta OAuth: ${error.message}`);
    }
  }

  /**
   * Verifica si un email ya está registrado
   */
  static async findUserByEmail(
    email: string,
    preferredOrganizationId?: string
  ): Promise<OAuthUserRecord | null> {
    const supabase = await createClient();
    const normalizedEmail = email.trim();
    if (!normalizedEmail) {
      return null;
    }

    const { data, error } = await supabase
      .from('users')
      .select('id, email, username, first_name, last_name, email_verified, cargo_rol')
      .ilike('email', escapeIlikePattern(normalizedEmail))
      .limit(10);

    if (error) {
      throw new Error(`Error buscando usuario: ${error.message}`);
    }

    const users = (data || []) as OAuthUserRecord[];

    if (users.length === 0) {
      return null;
    }

    if (users.length === 1) {
      return users[0];
    }

    const userIds = users.map((user) => user.id);
    const membershipUserId = await this.findActiveMembershipUserId(
      supabase,
      userIds,
      preferredOrganizationId
    );

    if (membershipUserId) {
      const membershipUser = users.find((user) => user.id === membershipUserId);
      if (membershipUser) {
        return membershipUser;
      }
    }

    const exactEmailUser = users.find(
      (user) => user.email?.trim().toLowerCase() === normalizedEmail.toLowerCase()
    );

    return exactEmailUser || users[0];
  }

  private static async findActiveMembershipUserId(
    supabase: OAuthSupabaseClient,
    userIds: string[],
    preferredOrganizationId?: string
  ): Promise<string | null> {
    let query = supabase
      .from('organization_users')
      .select('user_id')
      .in('user_id', userIds)
      .eq('status', 'active')
      .order('joined_at', { ascending: true })
      .limit(1);

    if (preferredOrganizationId) {
      query = query.eq('organization_id', preferredOrganizationId);
    }

    const { data } = await query;
    const membership = data?.[0] as OAuthMembershipUserRow | undefined;

    return membership?.user_id || null;
  }

  /**
   * Crea un nuevo usuario desde perfil OAuth
   * ✅ ISSUE #13: Implementa retry con exponential backoff para evitar race conditions
   * @param cargoRol - Rol del usuario (Usuario, Business, etc.)
   * @param _typeRol - DEPRECATED: Ya no se usa (eliminado por migración)
   */
  static async createUserFromOAuth(
    email: string,
    firstName: string,
    lastName: string,
    profilePicture?: string,
    cargoRol?: string,
    _typeRol?: string // Mantener parámetro por compatibilidad pero ignorarlo
  ): Promise<string> {
    const supabase = await createClient();

    // Generar username base desde email
    const baseUsername = email.split('@')[0].toLowerCase().replace(/[^a-z0-9_]/g, '');
    const maxAttempts = 5;

    // ✅ ISSUE #13: Estrategia optimistic con retry
    // Intentar crear directamente sin verificar primero (evita race condition)
    for (let attempt = 0; attempt < maxAttempts; attempt++) {
      // Generar username: primer intento sin número, luego con número aleatorio
      const username = attempt === 0
        ? baseUsername
        : `${baseUsername}${Math.floor(Math.random() * 10000)}`;

      const userId = crypto.randomUUID();

      try {
        const { data, error } = await supabase
          .from('users')
          .insert({
            id: userId,
            username,
            email,
            first_name: firstName,
            last_name: lastName,
            display_name: `${firstName} ${lastName}`.trim(),
            email_verified: true, // OAuth emails ya están verificados
            profile_picture_url: profilePicture || null,
            password_hash: '', // String vacío para usuarios OAuth
            cargo_rol: cargoRol || 'Usuario',
            // NOTA: type_rol fue eliminado - el cargo va en organization_users.job_title
          })
          .select()
          .single();

        // ✅ Éxito - usuario creado
        if (!error) {
          if (attempt > 0) {
          }
          return userId;
        }

        // ✅ ISSUE #13: Si error es por username duplicado (23505), reintentar
        if (error.code === '23505' && error.message.includes('username')) {
          // Exponential backoff: 0ms, 100ms, 200ms, 300ms, 400ms
          const backoffMs = attempt * 100;
          if (backoffMs > 0) {
            await new Promise(resolve => setTimeout(resolve, backoffMs));
          }
          continue; // Reintentar con nuevo username
        }

        // Otro tipo de error (no relacionado con username)
        throw new Error(`Error creando usuario: ${error.message}`);

      } catch (err) {
        // Si es el último intento, propagar el error
        if (attempt === maxAttempts - 1) {
          throw new Error(
            `No se pudo crear usuario después de ${maxAttempts} intentos. ` +
            `Error: ${err instanceof Error ? err.message : 'Desconocido'}`
          );
        }
        // Si no es el último intento y es error de duplicado, continuar
        if (err instanceof Error && err.message.includes('username')) {
          continue;
        }
        // Otro error, propagar
        throw err;
      }
    }

    // Fallback (no debería llegar aquí)
    throw new Error(`No se pudo generar username único después de ${maxAttempts} intentos`);
  }
}
