/**
 * CSRF (Cross-Site Request Forgery) Protection Middleware
 *
 * Implementa protección contra ataques CSRF usando tokens únicos por sesión
 * basado en el patrón Synchronizer Token
 *
 * @see https://owasp.org/www-community/attacks/csrf
 */

import { NextRequest, NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import crypto from 'crypto';

/**
 * Nombre de la cookie que almacena el token CSRF
 */
const CSRF_COOKIE_NAME = '__Host-csrf-token';

/**
 * Nombre del header HTTP donde se espera el token CSRF en las peticiones
 */
const CSRF_HEADER_NAME = 'x-csrf-token';

/**
 * Tiempo de expiración del token CSRF (24 horas)
 */
const CSRF_TOKEN_EXPIRY = 24 * 60 * 60 * 1000;

/**
 * Métodos HTTP que requieren protección CSRF
 * GET, HEAD y OPTIONS son seguros por diseño (idempotentes)
 */
const CSRF_PROTECTED_METHODS = ['POST', 'PUT', 'DELETE', 'PATCH'];

/**
 * Rutas que están excluidas de la protección CSRF
 * Útil para webhooks o APIs públicas
 */
const CSRF_EXCLUDED_PATHS = [
  '/api/webhooks/',
  '/api/public/',
];

/**
 * Genera un token CSRF seguro aleatorio
 *
 * @returns Token CSRF de 32 bytes en formato base64url
 */
export function generateCSRFToken(): string {
  return crypto.randomBytes(32).toString('base64url');
}

/**
 * Obtiene o genera el token CSRF almacenado en la cookie
 *
 * @returns Token CSRF actual o recién generado
 */
export async function getOrCreateCSRFToken(): Promise<string> {
  const cookieStore = cookies();
  const existingToken = cookieStore.get(CSRF_COOKIE_NAME)?.value;

  if (existingToken && isValidCSRFToken(existingToken)) {
    return existingToken;
  }

  // Generar nuevo token si no existe o es inválido
  const newToken = generateCSRFToken();

  // Configurar cookie con el token
  cookieStore.set(CSRF_COOKIE_NAME, newToken, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'strict', // ✅ Strict para máxima protección CSRF
    path: '/',
    maxAge: CSRF_TOKEN_EXPIRY / 1000, // maxAge en segundos
  });

  return newToken;
}

/**
 * Valida que un token CSRF tenga el formato correcto
 *
 * @param token - Token a validar
 * @returns true si el token es válido
 */
export function isValidCSRFToken(token: string): boolean {
  if (!token || typeof token !== 'string') {
    return false;
  }

  // Validar longitud (32 bytes en base64url = ~43 caracteres)
  if (token.length < 40 || token.length > 50) {
    return false;
  }

  // Validar que solo contenga caracteres base64url
  const base64UrlRegex = /^[A-Za-z0-9_-]+$/;
  return base64UrlRegex.test(token);
}

/**
 * Verifica que el token CSRF del request coincida con el de la cookie
 *
 * @param request - NextRequest object
 * @returns true si los tokens coinciden
 */
export async function verifyCSRFToken(request: NextRequest): Promise<boolean> {
  const cookieStore = cookies();
  const cookieToken = cookieStore.get(CSRF_COOKIE_NAME)?.value;

  if (!cookieToken) {
    return false;
  }

  // Obtener token del header
  const headerToken = request.headers.get(CSRF_HEADER_NAME);

  if (!headerToken) {
    return false;
  }

  // Comparación constant-time para prevenir timing attacks
  return timingSafeEqual(cookieToken, headerToken);
}

/**
 * Comparación constant-time de strings para prevenir timing attacks
 *
 * @param a - String A
 * @param b - String B
 * @returns true si son iguales
 */
function timingSafeEqual(a: string, b: string): boolean {
  if (a.length !== b.length) {
    return false;
  }

  const bufferA = Buffer.from(a);
  const bufferB = Buffer.from(b);

  return crypto.timingSafeEqual(bufferA, bufferB);
}

/**
 * Verifica si una ruta está excluida de la protección CSRF
 *
 * @param pathname - Ruta a verificar
 * @returns true si la ruta está excluida
 */
export function isCSRFExcludedPath(pathname: string): boolean {
  return CSRF_EXCLUDED_PATHS.some(excludedPath =>
    pathname.startsWith(excludedPath)
  );
}

/**
 * Middleware de protección CSRF para Next.js
 *
 * Uso en middleware.ts:
 *
 * ```ts
 * import { csrfProtectionMiddleware } from '@/lib/middleware/csrf-protection';
 *
 * export async function middleware(request: NextRequest) {
 *   return await csrfProtectionMiddleware(request);
 * }
 * ```
 *
 * @param request - NextRequest object
 * @returns NextResponse con token CSRF o error 403
 */
export async function csrfProtectionMiddleware(
  request: NextRequest
): Promise<NextResponse> {
  const { pathname, method } = request.nextUrl;

  // Permitir rutas excluidas
  if (isCSRFExcludedPath(pathname)) {
    return NextResponse.next();
  }

  // Solo proteger métodos que modifican datos
  if (!CSRF_PROTECTED_METHODS.includes(method.toUpperCase())) {
    // Para GET requests, generar/refrescar token CSRF
    const token = await getOrCreateCSRFToken();

    const response = NextResponse.next();

    // Incluir token en header de respuesta para que el cliente lo use
    response.headers.set(CSRF_HEADER_NAME, token);

    return response;
  }

  // Para métodos protegidos (POST, PUT, DELETE, PATCH), verificar token
  const isValid = await verifyCSRFToken(request);

  if (!isValid) {

    return new NextResponse(
      JSON.stringify({
        success: false,
        error: {
          message: 'CSRF token inválido o faltante',
          code: 'CSRF_TOKEN_INVALID',
        },
      }),
      {
        status: 403,
        headers: {
          'Content-Type': 'application/json',
        },
      }
    );
  }

  // Token válido, continuar con el request
  return NextResponse.next();
}

/**
 * Hook de React para obtener el token CSRF y enviarlo en requests
 *
 * Uso en componentes:
 *
 * ```tsx
 * 'use client';
 * import { useCSRFToken } from '@/lib/middleware/csrf-protection';
 *
 * function MyForm() {
 *   const csrfToken = useCSRFToken();
 *
 *   const handleSubmit = async (data) => {
 *     await fetch('/api/endpoint', {
 *       method: 'POST',
 *       headers: {
 *         'Content-Type': 'application/json',
 *         'x-csrf-token': csrfToken,
 *       },
 *       body: JSON.stringify(data),
 *     });
 *   };
 * }
 * ```
 */
export function useCSRFToken(): string | null {
  if (typeof window === 'undefined') {
    return null;
  }

  // Leer token de meta tag insertado por el servidor
  const metaTag = document.querySelector('meta[name="csrf-token"]');
  return metaTag?.getAttribute('content') || null;
}

/**
 * Utilidad para incluir el token CSRF en FormData
 *
 * @param formData - FormData object
 * @returns FormData con el token CSRF incluido
 */
export function includeCSRFTokenInFormData(formData: FormData): FormData {
  const token = useCSRFToken();

  if (token) {
    formData.append('_csrf', token);
  }

  return formData;
}

/**
 * Componente para incluir el token CSRF en un formulario HTML
 *
 * Uso:
 * ```tsx
 * <form>
 *   <CSRFTokenInput />
 *   <input name="email" />
 *   <button>Submit</button>
 * </form>
 * ```
 */
export function CSRFTokenInput() {
  const token = useCSRFToken();

  if (!token) {
    return null;
  }

  return <input type="hidden" name="_csrf" value={token} />;
}
