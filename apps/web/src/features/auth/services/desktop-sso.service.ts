import 'server-only';

import { logger } from '@/lib/logger';
import { createAdminClient } from '@/lib/supabase/admin';
import {
  buildDesktopCallbackUrl,
  buildDesktopErrorUrl,
  DESKTOP_SSO_TICKET_TTL_MS,
  generateDesktopSsoTicket,
  hashDesktopSsoTicket,
  matchesCodeChallenge,
} from '@/lib/auth/desktop-sso';

/**
 * Emision y consumo de los tickets que ligan el SSO web con el escritorio.
 *
 * Toda la tabla vive detras del rol de servicio: tiene RLS activa y ninguna
 * politica, asi que ninguna sesion de usuario puede leerla ni escribirla.
 */

export interface IssueDesktopTicketInput {
  codeChallenge: string;
  ipAddress?: string | null;
  userAgent?: string | null;
  userId: string;
}

export type ConsumeDesktopTicketResult =
  | { code: 'invalid_ticket'; ok: false }
  | { ok: true; userId: string };

interface ConsumeTicketRow {
  code_challenge: string;
  user_id: string;
}

interface DesktopTicketInsert {
  code_challenge: string;
  expires_at: string;
  ip_address: string | null;
  token_hash: string;
  user_agent: string | null;
  user_id: string;
}

interface SupabaseCallError {
  message: string;
}

/**
 * `Database` se genera desde el esquema y todavia no incluye la tabla ni la
 * funcion de este cambio. En vez de castear a `any`, el escape se acota a este
 * modulo con la forma exacta que se usa; se retira al regenerar los tipos tras
 * aplicar la migracion.
 */
interface DesktopSsoClient {
  from(table: 'desktop_sso_tickets'): {
    insert(values: DesktopTicketInsert): Promise<{ error: SupabaseCallError | null }>;
  };
  rpc(
    fn: 'consume_desktop_sso_ticket',
    params: { p_token_hash: string }
  ): Promise<{ data: ConsumeTicketRow[] | null; error: SupabaseCallError | null }>;
}

function createDesktopSsoClient(): DesktopSsoClient {
  return createAdminClient() as unknown as DesktopSsoClient;
}

/**
 * Devuelve el ticket en claro para redirigir al escritorio. Solo se persiste
 * su hash, de modo que quien lea la tabla no puede suplantar a nadie.
 */
export async function issueDesktopSsoTicket({
  codeChallenge,
  ipAddress,
  userAgent,
  userId,
}: IssueDesktopTicketInput): Promise<string> {
  const ticket = generateDesktopSsoTicket();
  const supabase = createDesktopSsoClient();

  const { error } = await supabase.from('desktop_sso_tickets').insert({
    code_challenge: codeChallenge,
    expires_at: new Date(Date.now() + DESKTOP_SSO_TICKET_TTL_MS).toISOString(),
    ip_address: ipAddress || null,
    token_hash: hashDesktopSsoTicket(ticket),
    user_agent: userAgent || null,
    user_id: userId,
  });

  if (error) {
    logger.error('SSO escritorio: no se pudo emitir el ticket', error, { userId });
    throw new Error('desktop_ticket_issue_failed');
  }

  return ticket;
}

/**
 * Consume el ticket y valida el verificador.
 *
 * El consumo ocurre ANTES de comparar el verificador, a proposito: un intento
 * con verificador incorrecto quema el ticket. Eso es lo deseable frente a quien
 * lo intercepto e intenta adivinar.
 *
 * Todos los fallos devuelven el mismo codigo. Distinguir "no existe" de
 * "expirado" o de "verificador incorrecto" le diria a un atacante con un ticket
 * interceptado si todavia esta vivo.
 */
export async function consumeDesktopSsoTicket(
  ticket: string,
  codeVerifier: string
): Promise<ConsumeDesktopTicketResult> {
  const supabase = createDesktopSsoClient();

  const { data, error } = await supabase.rpc('consume_desktop_sso_ticket', {
    p_token_hash: hashDesktopSsoTicket(ticket),
  });

  if (error) {
    logger.error('SSO escritorio: fallo el consumo del ticket', error);
    throw new Error('desktop_ticket_consume_failed');
  }

  const row = data?.[0];
  if (!row) {
    return { code: 'invalid_ticket', ok: false };
  }

  if (!matchesCodeChallenge(codeVerifier, row.code_challenge)) {
    logger.warn('SSO escritorio: verificador que no corresponde al desafio');
    return { code: 'invalid_ticket', ok: false };
  }

  return { ok: true, userId: row.user_id };
}

export interface DesktopHandoffInput {
  codeChallenge: string;
  ipAddress?: string | null;
  state: string;
  userAgent?: string | null;
  userId: string;
}

/**
 * Resuelve la URL de retorno al escritorio para una identidad ya autenticada.
 *
 * Nunca lanza: un flujo federado que falla debe devolver al escritorio con un
 * codigo que este pueda mostrar, no dejarlo esperando. El detalle de la causa
 * se queda en el registro del servidor.
 */
export async function buildDesktopHandoffUrl({
  codeChallenge,
  ipAddress,
  state,
  userAgent,
  userId,
}: DesktopHandoffInput): Promise<string> {
  try {
    if (!(await hasActiveMembership(userId))) {
      return buildDesktopErrorUrl(state, 'access_denied');
    }

    const ticket = await issueDesktopSsoTicket({
      codeChallenge,
      ipAddress,
      userAgent,
      userId,
    });

    return buildDesktopCallbackUrl(ticket, state);
  } catch (error) {
    logger.error('SSO escritorio: no se pudo preparar el retorno', error, { userId });

    return buildDesktopErrorUrl(state, 'exchange_unavailable');
  }
}

/** Ninguna emision de acceso ocurre sin membresia activa. */
export async function hasActiveMembership(userId: string): Promise<boolean> {
  const supabase = createAdminClient();

  const { data, error } = await supabase
    .from('organization_users')
    .select('id')
    .eq('user_id', userId)
    .eq('status', 'active')
    .limit(1)
    .maybeSingle();

  if (error) {
    logger.error('SSO escritorio: fallo la consulta de membresia', error, { userId });
    throw new Error('desktop_membership_lookup_failed');
  }

  return Boolean(data?.id);
}

/**
 * Genera la prueba de acceso que el escritorio canjea por una sesion.
 *
 * Se devuelve solo el `hashed_token` del enlace magico: nunca el enlace
 * completo, que serviria para abrir sesion en un navegador cualquiera.
 * `generateLink` conserva el usuario existente por correo, asi que el UUID no
 * se mueve y las politicas por fila siguen resolviendo igual.
 */
export async function generateDesktopAccessProof(
  userId: string
): Promise<{ tokenHash: string } | null> {
  const supabase = createAdminClient();

  const { data: authUser, error: userError } =
    await supabase.auth.admin.getUserById(userId);

  const email = authUser?.user?.email;
  if (userError || !email) {
    logger.error('SSO escritorio: usuario sin correo en Auth', userError, { userId });
    return null;
  }

  const { data, error } = await supabase.auth.admin.generateLink({
    email,
    type: 'magiclink',
  });

  if (error || !data?.properties?.hashed_token) {
    logger.error('SSO escritorio: no se pudo generar la prueba de acceso', error, {
      userId,
    });
    return null;
  }

  return { tokenHash: data.properties.hashed_token };
}
