/**
 * Middleware de autenticación y autorización para rutas Business
 * 
 * Este middleware:
 * 1. Verifica que el usuario esté autenticado (tiene sesión válida)
 * 2. Verifica que el usuario tenga rol de Business (admin de organización)
 * 3. Retorna el ID del usuario business para logging/auditoría
 * 
 * Uso en route handlers:
 * ```typescript
 * import { requireBusiness } from '@/lib/auth/requireBusiness';
 * 
 * export async function POST(request: NextRequest) {
 *   const auth = await requireBusiness();
 *   if (auth instanceof NextResponse) return auth; // Error response
 *   
 *   const businessUserId = auth.userId; // UUID del admin de organización
 *   // ... resto del código
 * }
 * ```
 */

import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { createClient } from '@/lib/supabase/server';
import { logger } from '@/lib/logger';

/**
 * Resultado exitoso de autenticación
 */
export interface BusinessAuth {
  userId: string;
  userEmail: string;
  userRole: string;
  /** Organization ID (from organization_users or request context) */
  organizationId?: string;
  /** Organization slug for URL building */
  organizationSlug?: string;
  /** User's role in the organization */
  organizationRole?: 'owner' | 'admin' | 'member';
  /** Whether user is an admin/owner of the organization */
  isOrgAdmin?: boolean;
}

/**
 * Options for requireBusiness middleware
 */
export interface RequireBusinessOptions {
  /**
   * Specific organization ID to verify membership against.
   * If provided, verifies user belongs to this specific org.
   */
  organizationId?: string;

  /**
   * Organization slug to verify membership against.
   * Alternative to organizationId for URL-based routing.
   */
  organizationSlug?: string;
}

/**
 * Verifica autenticación y autorización de Business Admin
 *
 * @param options - Optional configuration for organization verification
 * @returns BusinessAuth si el usuario es Business autenticado, o NextResponse con error
 *
 * @example
 * ```typescript
 * // Basic usage - uses user's default organization
 * const auth = await requireBusiness();
 *
 * // With specific organization verification
 * const auth = await requireBusiness({ organizationSlug: 'acme-corp' });
 *
 * // With organization ID
 * const auth = await requireBusiness({ organizationId: 'uuid-here' });
 * ```
 */
export async function requireBusiness(options?: RequireBusinessOptions): Promise<BusinessAuth | NextResponse> {
  try {
    const cookieStore = await cookies();
    const supabase = await createClient();

    let userId: string | null = null;
    let sessionValidated = false;

    // PASO 1: Intentar primero con el sistema de refresh tokens (nuevo)
    const accessToken = cookieStore.get('access_token')?.value;
    const refreshToken = cookieStore.get('refresh_token')?.value;

    if (accessToken && refreshToken) {
      logger.debug('requireBusiness: Usando sistema de refresh tokens');

      // Generar hash del refresh token para búsqueda directa
      const crypto = await import('crypto');
      const tokenHash = crypto.createHash('sha256').update(refreshToken).digest('hex');

      // Query directo por hash
      const { data: token, error: tokenError } = await supabase
        .from('refresh_tokens')
        .select('id, user_id, expires_at')
        .eq('token_hash', tokenHash)
        .eq('is_revoked', false)
        .gt('expires_at', new Date().toISOString())
        .single();

      if (!tokenError && token) {
        userId = token.user_id;
        sessionValidated = true;
        logger.debug('requireBusiness: Sesión validada via refresh token', { userId });
      }
    }

    // PASO 2: Fallback al sistema legacy (user_session)
    if (!sessionValidated) {
      const sessionCookie = cookieStore.get('aprende-y-aplica-session');

      if (!sessionCookie) {
        logger.warn('Business route accessed without any session');
        return NextResponse.json(
          {
            success: false,
            error: 'No autenticado. Por favor, inicia sesión.'
          },
          { status: 401 }
        );
      }

      const sessionToken = sessionCookie.value;
      logger.debug('requireBusiness: Validando sesión legacy', { hasToken: !!sessionToken });

      const { data: session, error: sessionError } = await supabase
        .from('user_session')
        .select('user_id, expires_at, revoked')
        .eq('jwt_id', sessionToken)
        .single();

      if (sessionError || !session) {
        logger.warn('Invalid session token', { error: sessionError?.message });
        return NextResponse.json(
          {
            success: false,
            error: 'Sesión inválida. Por favor, inicia sesión nuevamente.'
          },
          { status: 401 }
        );
      }

      // Verificar que la sesión no esté revocada
      if (session.revoked) {
        logger.warn('Attempted access with revoked session', { userId: session.user_id });
        return NextResponse.json(
          {
            success: false,
            error: 'Sesión revocada. Por favor, inicia sesión nuevamente.'
          },
          { status: 401 }
        );
      }

      // Verificar que la sesión no esté expirada
      const now = new Date();
      const expiresAt = new Date(session.expires_at);

      if (now > expiresAt) {
        logger.warn('Attempted access with expired session', {
          userId: session.user_id,
          expiresAt: session.expires_at
        });

        return NextResponse.json(
          {
            success: false,
            error: 'Sesión expirada. Por favor, inicia sesión nuevamente.'
          },
          { status: 401 }
        );
      }

      userId = session.user_id;
    }

    // PASO 3: Verificar que tenemos userId
    if (!userId) {
      logger.warn('No se pudo obtener userId de ninguna sesión');
      return NextResponse.json(
        {
          success: false,
          error: 'No autenticado. Por favor, inicia sesión.'
        },
        { status: 401 }
      );
    }

    // PASO 4: Obtener información del usuario y verificar rol
    // NOTA: organization_id ya no existe en users, se obtiene de organization_users
    const { data: user, error: userError } = await supabase
      .from('users')
      .select('id, email, cargo_rol')
      .eq('id', userId)
      .single();

    if (userError || !user) {
      logger.error('User not found for valid session', {
        userId: userId,
        error: userError?.message
      });
      return NextResponse.json(
        {
          success: false,
          error: 'Usuario no encontrado.'
        },
        { status: 401 }
      );
    }


    // PASO 6: Verificar que el usuario sea Business o Administrador
    // Los Administradores tienen acceso elevado y pueden acceder a rutas de Business
    // NOTA: 'Business User' ya no existe en cargo_rol - todos son 'Business'
    // La diferenciación se hace en organization_users.role (owner/admin/member)
    const normalizedRole = user.cargo_rol?.toLowerCase().trim() || '';
    const isBusiness = normalizedRole === 'business';
    const isAdmin = normalizedRole === 'administrador';

    if (!isBusiness && !isAdmin) {
      logger.warn('Non-business/admin user attempted to access business route', {
        userId: user.id,
        email: user.email,
        role: user.cargo_rol,
        normalizedRole
      });
      return NextResponse.json(
        {
          success: false,
          error: `Permisos insuficientes. Se requiere rol de Business o Administrador. Rol actual: ${user.cargo_rol || 'sin rol'}`
        },
        { status: 403 }
      );
    }

    // PASO 7: Obtener organizationId desde organization_users (única fuente de verdad)
    let organizationId: string | undefined = undefined;
    let organizationSlug: string | undefined = undefined;
    let organizationRole: 'owner' | 'admin' | 'member' | undefined = undefined;

    // If specific organization is requested via options, verify membership
    if (options?.organizationId || options?.organizationSlug) {
      // Build query based on what was provided
      let orgQuery = supabase
        .from('organizations')
        .select('id, slug')
        .eq('is_active', true);

      if (options.organizationId) {
        orgQuery = orgQuery.eq('id', options.organizationId);
      } else if (options.organizationSlug) {
        // Verificar si el slug parece un UUID
        const isUUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(options.organizationSlug);
        if (isUUID) {
          // Si es un UUID, buscar por ID o por slug (por si acaso el slug ES un UUID)
          orgQuery = orgQuery.or(`slug.eq.${options.organizationSlug},id.eq.${options.organizationSlug}`);
        } else {
          orgQuery = orgQuery.eq('slug', options.organizationSlug);
        }
      }

      const { data: requestedOrg, error: orgError } = await orgQuery.single();

      if (orgError || !requestedOrg) {
        logger.warn('Requested organization not found', {
          organizationId: options.organizationId,
          organizationSlug: options.organizationSlug
        });
        return NextResponse.json(
          {
            success: false,
            error: 'Organización no encontrada.'
          },
          { status: 404 }
        );
      }

      // Verify user belongs to this specific organization
      const { data: membership, error: membershipError } = await supabase
        .from('organization_users')
        .select('role')
        .eq('organization_id', requestedOrg.id)
        .eq('user_id', user.id)
        .eq('status', 'active')
        .single();

      if (membershipError || !membership) {
        logger.warn('User not member of requested organization', {
          userId: user.id,
          organizationId: requestedOrg.id
        });
        return NextResponse.json(
          {
            success: false,
            error: 'No tienes acceso a esta organización.'
          },
          { status: 403 }
        );
      }

      organizationId = requestedOrg.id;
      organizationSlug = requestedOrg.slug;
      organizationRole = membership.role as 'owner' | 'admin' | 'member';
    } else {
      // Default: get user's most recent organization
      const { data: userOrgs } = await supabase
        .from('organization_users')
        .select(`
          organization_id,
          role,
          joined_at,
          organizations!inner (
            id,
            slug,
            is_active
          )
        `)
        .eq('user_id', user.id)
        .eq('status', 'active')
        .eq('organizations.is_active', true)
        .order('joined_at', { ascending: false })
        .limit(1);

      if (userOrgs && userOrgs.length > 0) {
        const org = userOrgs[0];
        organizationId = org.organization_id;
        organizationRole = org.role as 'owner' | 'admin' | 'member';
        // Access nested organization data
        const orgData = org.organizations as unknown as { id: string; slug: string };
        organizationSlug = orgData?.slug;
      }
    }

    const isOrgAdmin = organizationRole === 'owner' || organizationRole === 'admin';

    // ✅ AUTENTICACIÓN Y AUTORIZACIÓN EXITOSA
    logger.auth('Business access granted', {
      userId: user.id,
      email: user.email,
      organizationId: organizationId,
      organizationSlug: organizationSlug,
      organizationRole: organizationRole,
      isOrgAdmin: isOrgAdmin
    });

    return {
      userId: user.id,
      userEmail: user.email,
      userRole: user.cargo_rol,
      organizationId: organizationId,
      organizationSlug: organizationSlug,
      organizationRole: organizationRole,
      isOrgAdmin: isOrgAdmin
    };

  } catch (error) {
    logger.error('Error in requireBusiness middleware', error instanceof Error ? error : undefined);
    return NextResponse.json(
      {
        success: false,
        error: 'Error interno del servidor.'
      },
      { status: 500 }
    );
  }
}

/**
 * Options for requireBusinessUser middleware
 */
export interface RequireBusinessUserOptions {
  /**
   * Specific organization ID to verify membership against.
   * If provided, verifies user belongs to this specific org.
   */
  organizationId?: string;

  /**
   * Organization slug to verify membership against.
   * Alternative to organizationId for URL-based routing.
   */
  organizationSlug?: string;
}

/**
 * Verifica autenticación y autorización de Business User (empleado)
 * Permite acceso a usuarios con rol Business User dentro de una organización
 *
 * @param options - Optional configuration for organization verification
 * @returns BusinessAuth si el usuario es Business User autenticado, o NextResponse con error
 *
 * @example
 * ```typescript
 * // Basic usage - uses user's default organization
 * const auth = await requireBusinessUser();
 *
 * // With specific organization verification (RECOMMENDED for org-scoped routes)
 * const auth = await requireBusinessUser({ organizationSlug: 'acme-corp' });
 *
 * // With organization ID
 * const auth = await requireBusinessUser({ organizationId: 'uuid-here' });
 * ```
 */
export async function requireBusinessUser(options?: RequireBusinessUserOptions): Promise<BusinessAuth | NextResponse> {
  try {
    const cookieStore = await cookies();
    const supabase = await createClient();

    let userId: string | null = null;
    let sessionValidated = false;

    // PASO 1: Intentar primero con el sistema de refresh tokens (nuevo)
    const accessToken = cookieStore.get('access_token')?.value;
    const refreshToken = cookieStore.get('refresh_token')?.value;

    if (accessToken && refreshToken) {
      logger.debug('requireBusinessUser: Usando sistema de refresh tokens');

      const crypto = await import('crypto');
      const tokenHash = crypto.createHash('sha256').update(refreshToken).digest('hex');

      const { data: token, error: tokenError } = await supabase
        .from('refresh_tokens')
        .select('id, user_id, expires_at')
        .eq('token_hash', tokenHash)
        .eq('is_revoked', false)
        .gt('expires_at', new Date().toISOString())
        .single();

      if (!tokenError && token) {
        userId = token.user_id;
        sessionValidated = true;
      }
    }

    // PASO 2: Fallback al sistema legacy (user_session)
    if (!sessionValidated) {
      const sessionCookie = cookieStore.get('aprende-y-aplica-session');

      if (!sessionCookie) {
        return NextResponse.json(
          {
            success: false,
            error: 'No autenticado. Por favor, inicia sesión.'
          },
          { status: 401 }
        );
      }

      const sessionToken = sessionCookie.value;

      const { data: session, error: sessionError } = await supabase
        .from('user_session')
        .select('user_id, expires_at, revoked')
        .eq('jwt_id', sessionToken)
        .single();

      if (sessionError || !session || session.revoked) {
        return NextResponse.json(
          {
            success: false,
            error: 'Sesión inválida o expirada.'
          },
          { status: 401 }
        );
      }

      // Verificar expiración
      if (new Date() > new Date(session.expires_at)) {
        return NextResponse.json(
          {
            success: false,
            error: 'Sesión expirada. Por favor, inicia sesión nuevamente.'
          },
          { status: 401 }
        );
      }

      userId = session.user_id;
    }

    // PASO 3: Verificar que tenemos userId
    if (!userId) {
      return NextResponse.json(
        {
          success: false,
          error: 'No autenticado. Por favor, inicia sesión.'
        },
        { status: 401 }
      );
    }

    // NOTA: organization_id ya no existe en users, se obtiene de organization_users
    const { data: user, error: userError } = await supabase
      .from('users')
      .select('id, email, cargo_rol')
      .eq('id', userId)
      .single();

    if (userError || !user) {
      return NextResponse.json(
        {
          success: false,
          error: 'Usuario no encontrado.'
        },
        { status: 401 }
      );
    }


    // Verificar que el usuario sea Business
    // NOTA: 'Business User' ya no existe en cargo_rol - todos son 'Business'
    // La diferenciación se hace en organization_users.role (owner/admin/member)
    const normalizedRole = user.cargo_rol?.toLowerCase().trim() || '';
    const isBusiness = normalizedRole === 'business';

    if (!isBusiness) {
      logger.warn('Unauthorized access attempt - invalid role', {
        userId: user.id,
        role: user.cargo_rol,
        normalizedRole
      });
      return NextResponse.json(
        {
          success: false,
          error: `Permisos insuficientes. Se requiere rol de Business. Rol actual: ${user.cargo_rol || 'sin rol'}`
        },
        { status: 403 }
      );
    }

    // Obtener organizationId desde organization_users (única fuente de verdad)
    let organizationId: string | undefined = undefined;
    let organizationSlug: string | undefined = undefined;
    let organizationRole: 'owner' | 'admin' | 'member' | undefined = undefined;

    // If specific organization is requested via options, verify membership
    if (options?.organizationId || options?.organizationSlug) {
      // Build query based on what was provided
      let orgQuery = supabase
        .from('organizations')
        .select('id, slug')
        .eq('is_active', true);

      if (options.organizationId) {
        orgQuery = orgQuery.eq('id', options.organizationId);
      } else if (options.organizationSlug) {
        // Verificar si el slug parece un UUID
        const isUUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(options.organizationSlug);
        if (isUUID) {
          // Si es un UUID, buscar por ID o por slug
          orgQuery = orgQuery.or(`slug.eq.${options.organizationSlug},id.eq.${options.organizationSlug}`);
        } else {
          orgQuery = orgQuery.eq('slug', options.organizationSlug);
        }
      }

      const { data: requestedOrg, error: orgError } = await orgQuery.single();

      if (orgError || !requestedOrg) {
        logger.warn('Requested organization not found', {
          organizationId: options.organizationId,
          organizationSlug: options.organizationSlug
        });
        return NextResponse.json(
          {
            success: false,
            error: 'Organización no encontrada.'
          },
          { status: 404 }
        );
      }

      // Verify user belongs to this specific organization
      const { data: membership, error: membershipError } = await supabase
        .from('organization_users')
        .select('role')
        .eq('organization_id', requestedOrg.id)
        .eq('user_id', user.id)
        .eq('status', 'active')
        .single();

      if (membershipError || !membership) {
        logger.warn('User not member of requested organization', {
          userId: user.id,
          organizationId: requestedOrg.id,
          organizationSlug: requestedOrg.slug
        });
        return NextResponse.json(
          {
            success: false,
            error: 'No tienes acceso a esta organización.'
          },
          { status: 403 }
        );
      }

      organizationId = requestedOrg.id;
      organizationSlug = requestedOrg.slug;
      organizationRole = membership.role as 'owner' | 'admin' | 'member';
    } else {
      // Default: get user's most recent organization
      const { data: userOrgs } = await supabase
        .from('organization_users')
        .select(`
          organization_id,
          role,
          joined_at,
          organizations!inner (
            id,
            slug,
            is_active
          )
        `)
        .eq('user_id', user.id)
        .eq('status', 'active')
        .eq('organizations.is_active', true)
        .order('joined_at', { ascending: false })
        .limit(1);

      if (userOrgs && userOrgs.length > 0) {
        const org = userOrgs[0];
        organizationId = org.organization_id;
        organizationRole = org.role as 'owner' | 'admin' | 'member';
        // Access nested organization data
        const orgData = org.organizations as unknown as { id: string; slug: string };
        organizationSlug = orgData?.slug;
      }
    }

    const isOrgAdmin = organizationRole === 'owner' || organizationRole === 'admin';

    logger.auth('Business User access granted', {
      userId: user.id,
      email: user.email,
      role: user.cargo_rol,
      organizationId: organizationId,
      organizationSlug: organizationSlug,
      organizationRole: organizationRole
    });

    return {
      userId: user.id,
      userEmail: user.email,
      userRole: user.cargo_rol,
      organizationId: organizationId,
      organizationSlug: organizationSlug,
      organizationRole: organizationRole,
      isOrgAdmin: isOrgAdmin
    };

  } catch (error) {
    logger.error('Error in requireBusinessUser middleware', error instanceof Error ? error : undefined);
    return NextResponse.json(
      {
        success: false,
        error: 'Error interno del servidor.'
      },
      { status: 500 }
    );
  }
}

