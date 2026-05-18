import type { NextRequest } from 'next/server';
import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import type { Tables } from '@/lib/supabase/types';
import { apiError } from './errors';

export type AuthRole = 'Admin' | 'Business' | 'BusinessUser' | 'Instructor';

export type AuthContext = {
  email: string;
  role: AuthRole;
  userId: string;
};

export type RouteContext = unknown;

export type AuthenticatedRouteHandler<TContext = RouteContext> = (
  request: NextRequest,
  auth: AuthContext,
  context: TContext,
) => Promise<Response>;

type UserProfileRow = Pick<Tables<'users'>, 'cargo_rol' | 'email' | 'id'>;

const ROLE_ALIASES: Record<string, AuthRole> = {
  admin: 'Admin',
  administrador: 'Admin',
  business: 'Business',
  empresa: 'Business',
  empresariales: 'Business',
  'business user': 'BusinessUser',
  businessuser: 'BusinessUser',
  business_user: 'BusinessUser',
  instructor: 'Instructor',
  learner: 'BusinessUser',
  member: 'BusinessUser',
  usuario: 'BusinessUser',
};

export function normalizeAuthRole(role: string | null | undefined): AuthRole | null {
  const normalized = role
    ?.normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .trim()
    .toLowerCase();
  return normalized ? ROLE_ALIASES[normalized] ?? null : null;
}

export function withAuth<TContext = RouteContext>(
  handler: AuthenticatedRouteHandler<TContext>,
  opts: { roles?: AuthRole[] } = {},
) {
  return async (request: NextRequest, context: TContext): Promise<Response> => {
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return apiError('UNAUTHENTICATED', 'Debes iniciar sesion para continuar.', 401);
    }

    const { data: profile, error: profileError } = await supabase
      .from('users')
      .select('id, email, cargo_rol')
      .eq('id', user.id)
      .single<UserProfileRow>();

    if (profileError || !profile) {
      return apiError('PROFILE_NOT_FOUND', 'No se encontro el perfil del usuario autenticado.', 403);
    }

    const role = normalizeAuthRole(profile.cargo_rol);

    if (!role) {
      return apiError('FORBIDDEN', 'El rol del usuario no permite acceder a este recurso.', 403);
    }

    if (opts.roles && !opts.roles.includes(role)) {
      return apiError('FORBIDDEN', 'No tienes permisos para acceder a este recurso.', 403);
    }

    return handler(
      request,
      {
        email: profile.email ?? user.email ?? '',
        role,
        userId: user.id,
      },
      context,
    );
  };
}

export function isAuthResponse(value: AuthContext | Response): value is NextResponse {
  return value instanceof NextResponse;
}
