/**
 * CalendarIntegrationService
 * 
 * Servicio para integrar y analizar calendarios de Google y Microsoft
 * para el planificador de estudios.
 */

import { createClient } from '../../../lib/supabase/server';
import { createClient as createServiceClient } from '@supabase/supabase-js';
import type { Database } from '../../../lib/supabase/types';
import type {
  CalendarIntegration,
  CalendarEvent,
  CalendarAvailability,
  CalendarIntegrationMetadata,
  TimeBlock,
} from '../types/user-context.types';

// Configuración de OAuth - buscar en múltiples nombres de variables para compatibilidad
const GOOGLE_CLIENT_ID = process.env.GOOGLE_CALENDAR_CLIENT_ID ||
  process.env.NEXT_PUBLIC_GOOGLE_CALENDAR_CLIENT_ID ||
  process.env.GOOGLE_CLIENT_ID ||
  process.env.GOOGLE_OAUTH_CLIENT_ID;

const GOOGLE_CLIENT_SECRET = process.env.GOOGLE_CALENDAR_CLIENT_SECRET ||
  process.env.GOOGLE_CLIENT_SECRET ||
  process.env.GOOGLE_OAUTH_CLIENT_SECRET;

const MICROSOFT_CLIENT_ID = process.env.MICROSOFT_CALENDAR_CLIENT_ID ||
  process.env.NEXT_PUBLIC_MICROSOFT_CALENDAR_CLIENT_ID ||
  process.env.NEXT_PUBLIC_MICROSOFT_CLIENT_ID ||
  process.env.MICROSOFT_CLIENT_ID ||
  process.env.MICROSOFT_OAUTH_CLIENT_ID;

const MICROSOFT_CLIENT_SECRET = process.env.MICROSOFT_CALENDAR_CLIENT_SECRET ||
  process.env.NEXT_PUBLIC_MICROSOFT_CLIENT_SECRET ||
  process.env.MICROSOFT_CLIENT_SECRET ||
  process.env.MICROSOFT_OAUTH_CLIENT_SECRET;

const REDIRECT_URI = (process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000') + '/api/study-planner/calendar/callback';

/**
 * Crea un cliente de Supabase con Service Role Key para bypass de RLS
 * Útil para operaciones del servidor donde ya validamos la autenticación
 */
function createAdminClient() {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!supabaseUrl || !supabaseServiceKey) {
    throw new Error('SUPABASE_SERVICE_ROLE_KEY no está configurada. Necesaria para operaciones del servidor.');
  }

  return createServiceClient<Database>(supabaseUrl, supabaseServiceKey, {
    auth: {
      autoRefreshToken: false,
      persistSession: false
    }
  });
}

// Nombre del calendario secundario de la plataforma
const PLATFORM_CALENDAR_NAME = 'SofLIA - Sesiones de Estudio';

export class CalendarIntegrationService {
  /**
   * Genera la URL de autorización para Google Calendar
   * Usa scopes completos para crear calendarios secundarios y consultar todos los calendarios
   */
  static getGoogleAuthUrl(userId: string): string {
    // calendar: permite crear, ver, editar y borrar calendarios y eventos
    // calendar.settings.readonly: permite consultar configuración del usuario
    const scopes = [
      'https://www.googleapis.com/auth/calendar',
      'https://www.googleapis.com/auth/calendar.settings.readonly',
    ].join(' ');

    const params = new URLSearchParams({
      client_id: GOOGLE_CLIENT_ID || '',
      redirect_uri: REDIRECT_URI,
      response_type: 'code',
      scope: scopes,
      access_type: 'offline',
      prompt: 'consent',
      state: JSON.stringify({ provider: 'google', userId }),
    });

    return `https://accounts.google.com/o/oauth2/v2/auth?${params.toString()}`;
  }

  /**
   * Genera la URL de autorización para Microsoft Calendar
   */
  static getMicrosoftAuthUrl(userId: string): string {
    const scopes = [
      'offline_access',
      'Calendars.Read',
      'Calendars.ReadWrite',
      'User.Read',
    ].join(' ');

    const params = new URLSearchParams({
      client_id: MICROSOFT_CLIENT_ID || '',
      redirect_uri: REDIRECT_URI,
      response_type: 'code',
      scope: scopes,
      state: JSON.stringify({ provider: 'microsoft', userId }),
    });

    return `https://login.microsoftonline.com/common/oauth2/v2.0/authorize?${params.toString()}`;
  }

  /**
   * Conecta Google Calendar usando el código de autorización
   * Verifica que el email del calendario coincida con el del usuario de la app
   */
  static async connectGoogleCalendar(userId: string, authCode: string, expectedEmail?: string): Promise<CalendarIntegration | null> {
    try {
      // Construir redirect_uri de forma consistente
      const redirectUri = REDIRECT_URI;

      console.log('[Calendar Integration] Intercambiando código por tokens:', {
        clientId: GOOGLE_CLIENT_ID ? `${GOOGLE_CLIENT_ID.substring(0, 20)}...` : 'NO CONFIGURADO',
        redirectUri,
        hasClientSecret: !!GOOGLE_CLIENT_SECRET,
        codeLength: authCode.length
      });

      // Intercambiar código por tokens
      const tokenResponse = await fetch('https://oauth2.googleapis.com/token', {
        method: 'POST',
        headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
        body: new URLSearchParams({
          client_id: GOOGLE_CLIENT_ID || '',
          client_secret: GOOGLE_CLIENT_SECRET || '',
          code: authCode,
          grant_type: 'authorization_code',
          redirect_uri: redirectUri,
        }),
      });

      if (!tokenResponse.ok) {
        const errorText = await tokenResponse.text();
        let errorData;
        try {
          errorData = JSON.parse(errorText);
        } catch {
          errorData = { error: 'unknown_error', error_description: errorText };
        }
        console.error('[Calendar Integration] Error obteniendo tokens de Google:', {
          status: tokenResponse.status,
          statusText: tokenResponse.statusText,
          error: errorData,
          redirectUriUsed: redirectUri,
          clientIdUsed: GOOGLE_CLIENT_ID ? `${GOOGLE_CLIENT_ID.substring(0, 20)}...` : 'NO CONFIGURADO'
        });

        // Detectar errores específicos de modo de prueba y verificación
        const errorMsg = this.parseGoogleOAuthError(errorData);
        throw new Error(errorMsg);
      }

      const tokens = await tokenResponse.json();

      // VERIFICACIÓN DE SEGURIDAD: Obtener el email del usuario del calendario
      const calendarUserEmail = await this.getGoogleUserEmail(tokens.access_token);

      if (calendarUserEmail) {

        // Si tenemos email esperado, verificar que coincida
        if (expectedEmail && expectedEmail.toLowerCase() !== calendarUserEmail.toLowerCase()) {
          console.warn('[Calendar Integration] âš ï¸ El email del calendario no coincide con el usuario de la app:', {
            emailApp: expectedEmail,
            emailCalendar: calendarUserEmail
          });
          throw new Error(`EMAIL_MISMATCH: El calendario conectado pertenece a "${calendarUserEmail}" pero estás logueado como "${expectedEmail}". Por favor, inicia sesión en Google con la cuenta correcta o cierra la sesión de Google y vuelve a intentar.`);
        }
      }

      // Guardar en base de datos con el email del calendario
      const integration = await this.saveCalendarIntegration(userId, 'google', tokens, calendarUserEmail);

      // CREAR CALENDARIO SECUNDARIO: Al conectar por primera vez, crear el calendario de la plataforma
      if (integration) {
        console.log('[Calendar Integration] Creando calendario secundario de la plataforma...');
        const secondaryCalendarId = await this.getOrCreatePlatformCalendar(tokens.access_token);

        if (secondaryCalendarId) {
          await this.saveSecondaryCalendarId(userId, secondaryCalendarId);
          console.log('[Calendar Integration] ✅ Calendario secundario creado y guardado:', secondaryCalendarId);
        } else {
          console.warn('[Calendar Integration] âš ï¸ No se pudo crear el calendario secundario, se usará el principal');
        }
      }

      return integration;

    } catch (error) {
      console.error('Error conectando Google Calendar:', error);
      // Re-lanzar el error para que se maneje en el callback
      if (error instanceof Error) {
        throw error;
      }
      throw new Error('Error desconocido al conectar con Google Calendar');
    }
  }

  /**
   * Obtiene el email del usuario de Google usando el access token
   */
  private static async getGoogleUserEmail(accessToken: string): Promise<string | null> {
    try {
      const response = await fetch('https://www.googleapis.com/oauth2/v2/userinfo', {
        headers: {
          Authorization: `Bearer ${accessToken}`,
        },
      });

      if (!response.ok) {
        console.error('Error obteniendo info de usuario de Google:', await response.text());
        return null;
      }

      const data = await response.json();
      return data.email || null;
    } catch (error) {
      console.error('Error obteniendo email de Google:', error);
      return null;
    }
  }

  /**
   * Obtiene la lista de todos los calendarios del usuario de Google
   */
  static async getGoogleCalendarList(accessToken: string): Promise<Array<{
    id: string;
    summary: string;
    primary: boolean;
    accessRole: string;
    backgroundColor?: string;
  }>> {
    try {
      const response = await fetch(
        'https://www.googleapis.com/calendar/v3/users/me/calendarList',
        {
          headers: {
            Authorization: `Bearer ${accessToken}`,
          },
        }
      );

      if (!response.ok) {
        console.error('[Calendar] Error obteniendo lista de calendarios:', await response.text());
        return [];
      }

      const data = await response.json();
      return (data.items || []).map((cal: any) => ({
        id: cal.id,
        summary: cal.summary || 'Sin nombre',
        primary: cal.primary || false,
        accessRole: cal.accessRole || 'reader',
        backgroundColor: cal.backgroundColor,
      }));
    } catch (error) {
      console.error('[Calendar] Error obteniendo lista de calendarios:', error);
      return [];
    }
  }

  /**
   * Obtiene la lista de todos los calendarios del usuario de Microsoft
   */
  static async getMicrosoftCalendarList(accessToken: string): Promise<Array<{
    id: string;
    name: string;
    isDefaultCalendar: boolean;
    canEdit: boolean;
    color?: string;
  }>> {
    try {
      const response = await fetch(
        'https://graph.microsoft.com/v1.0/me/calendars',
        {
          headers: {
            Authorization: `Bearer ${accessToken}`,
          },
        }
      );

      if (!response.ok) {
        console.error('[Calendar] Error obteniendo lista de calendarios de Microsoft:', await response.text());
        return [];
      }

      const data = await response.json();
      return (data.value || []).map((cal: any) => ({
        id: cal.id,
        name: cal.name || 'Sin nombre',
        isDefaultCalendar: cal.isDefaultCalendar || false,
        canEdit: cal.canEdit || false,
        color: cal.hexColor,
      }));
    } catch (error) {
      console.error('[Calendar] Error obteniendo lista de calendarios de Microsoft:', error);
      return [];
    }
  }

  /**
   * Obtiene los IDs de calendarios seleccionados por el usuario desde metadata
   * Retorna null si no hay selección guardada (= usar default)
   */
  static async getSelectedCalendarIds(userId: string): Promise<string[] | null> {
    try {
      const supabase = createAdminClient();
      const { data } = await supabase
        .from('calendar_integrations')
        .select('metadata')
        .eq('user_id', userId)
        .order('updated_at', { ascending: false })
        .limit(1)
        .single();

      if (!data?.metadata) return null;
      const metadata = data.metadata as CalendarIntegrationMetadata;
      return metadata.selected_calendar_ids || null;
    } catch (error) {
      console.error('[Calendar] Error obteniendo calendarios seleccionados:', error);
      return null;
    }
  }

  /**
   * Guarda los IDs de calendarios seleccionados en metadata
   * Preserva campos existentes como secondary_calendar_id
   */
  static async saveSelectedCalendarIds(userId: string, calendarIds: string[]): Promise<void> {
    const supabase = createAdminClient();

    // Leer metadata existente para no sobreescribir otros campos
    const { data } = await supabase
      .from('calendar_integrations')
      .select('metadata')
      .eq('user_id', userId)
      .order('updated_at', { ascending: false })
      .limit(1)
      .single();

    const existingMetadata = (data?.metadata || {}) as CalendarIntegrationMetadata;

    await supabase
      .from('calendar_integrations')
      .update({
        metadata: {
          ...existingMetadata,
          selected_calendar_ids: calendarIds,
        },
        updated_at: new Date().toISOString(),
      })
      .eq('user_id', userId);
  }

  /**
   * Busca el calendario secundario de la plataforma por nombre
   */
  private static async findPlatformCalendar(accessToken: string): Promise<string | null> {
    const calendars = await this.getGoogleCalendarList(accessToken);
    const platformCal = calendars.find(cal => cal.summary === PLATFORM_CALENDAR_NAME);
    return platformCal?.id || null;
  }

  /**
   * Crea un calendario secundario para la plataforma
   */
  private static async createPlatformCalendar(accessToken: string): Promise<string | null> {
    try {
      const response = await fetch(
        'https://www.googleapis.com/calendar/v3/calendars',
        {
          method: 'POST',
          headers: {
            Authorization: `Bearer ${accessToken}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            summary: PLATFORM_CALENDAR_NAME,
            description: 'Calendario de sesiones de estudio creado por SofLIA',
            timeZone: Intl.DateTimeFormat().resolvedOptions().timeZone,
          }),
        }
      );

      if (!response.ok) {
        console.error('[Calendar] Error creando calendario secundario:', await response.text());
        return null;
      }

      const data = await response.json();
      console.log('[Calendar] Calendario secundario creado:', data.id);
      return data.id;
    } catch (error) {
      console.error('[Calendar] Error creando calendario secundario:', error);
      return null;
    }
  }

  /**
   * Obtiene o crea el calendario secundario de la plataforma
   * Retorna el calendarId del calendario secundario
   */
  static async getOrCreatePlatformCalendar(accessToken: string): Promise<string | null> {
    // Primero buscar si ya existe
    let calendarId = await this.findPlatformCalendar(accessToken);

    if (calendarId) {
      console.log('[Calendar] Calendario secundario existente encontrado:', calendarId);
      return calendarId;
    }

    // Si no existe, crearlo
    calendarId = await this.createPlatformCalendar(accessToken);
    return calendarId;
  }

  /**
   * Obtiene información de disponibilidad (free/busy) de todos los calendarios del usuario
   * Usa la API freeBusy para consultar múltiples calendarios en una sola petición
   */
  static async getFreeBusyInfo(
    accessToken: string,
    startDate: Date,
    endDate: Date,
    calendarIds?: string[],
    userId?: string
  ): Promise<{
    calendars: Record<string, { busy: Array<{ start: string; end: string }> }>;
    allBusySlots: Array<{ start: Date; end: Date }>;
  }> {
    try {
      // Si no se especifican calendarios, intentar cargar selección del usuario
      let idsToQuery = calendarIds;
      if (!idsToQuery || idsToQuery.length === 0) {
        if (userId) {
          const selectedIds = await this.getSelectedCalendarIds(userId);
          if (selectedIds && selectedIds.length > 0) {
            idsToQuery = selectedIds;
          }
        }
      }
      // Si aún no hay IDs, obtener todos los calendarios accesibles
      if (!idsToQuery || idsToQuery.length === 0) {
        const calendars = await this.getGoogleCalendarList(accessToken);
        idsToQuery = calendars
          .filter(cal => ['owner', 'writer', 'reader'].includes(cal.accessRole))
          .map(cal => cal.id);
      }

      if (idsToQuery.length === 0) {
        return { calendars: {}, allBusySlots: [] };
      }

      const response = await fetch(
        'https://www.googleapis.com/calendar/v3/freeBusy',
        {
          method: 'POST',
          headers: {
            Authorization: `Bearer ${accessToken}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            timeMin: startDate.toISOString(),
            timeMax: endDate.toISOString(),
            items: idsToQuery.map(id => ({ id })),
          }),
        }
      );

      if (!response.ok) {
        console.error('[Calendar] Error obteniendo free/busy:', await response.text());
        return { calendars: {}, allBusySlots: [] };
      }

      const data = await response.json();
      const calendars: Record<string, { busy: Array<{ start: string; end: string }> }> = {};
      const allBusySlots: Array<{ start: Date; end: Date }> = [];

      // Procesar respuesta
      for (const [calId, calData] of Object.entries(data.calendars || {})) {
        const busyInfo = calData as { busy?: Array<{ start: string; end: string }> };
        calendars[calId] = { busy: busyInfo.busy || [] };

        // Agregar todos los slots ocupados a la lista combinada
        for (const slot of busyInfo.busy || []) {
          allBusySlots.push({
            start: new Date(slot.start),
            end: new Date(slot.end),
          });
        }
      }

      // Ordenar y fusionar slots superpuestos
      allBusySlots.sort((a, b) => a.start.getTime() - b.start.getTime());
      const mergedSlots: Array<{ start: Date; end: Date }> = [];

      for (const slot of allBusySlots) {
        if (mergedSlots.length === 0) {
          mergedSlots.push({ ...slot });
        } else {
          const last = mergedSlots[mergedSlots.length - 1];
          if (slot.start <= last.end) {
            // Slots se superponen, fusionar
            last.end = new Date(Math.max(last.end.getTime(), slot.end.getTime()));
          } else {
            mergedSlots.push({ ...slot });
          }
        }
      }

      return { calendars, allBusySlots: mergedSlots };
    } catch (error) {
      console.error('[Calendar] Error obteniendo free/busy:', error);
      return { calendars: {}, allBusySlots: [] };
    }
  }

  /**
   * Guarda el calendarId del calendario secundario en la integración del usuario
   */
  static async saveSecondaryCalendarId(userId: string, calendarId: string): Promise<void> {
    const supabase = createAdminClient();

    const { error } = await supabase
      .from('calendar_integrations')
      .update({
        metadata: { secondary_calendar_id: calendarId },
        updated_at: new Date().toISOString(),
      })
      .eq('user_id', userId)
      .eq('provider', 'google');

    if (error) {
      console.error('[Calendar] Error guardando secondary_calendar_id:', error);
    } else {
      console.log('[Calendar] secondary_calendar_id guardado:', calendarId);
    }
  }

  /**
   * Obtiene el calendarId del calendario secundario guardado en la BD
   */
  static async getSecondaryCalendarId(userId: string): Promise<string | null> {
    const supabase = createAdminClient();

    const { data, error } = await supabase
      .from('calendar_integrations')
      .select('metadata')
      .eq('user_id', userId)
      .eq('provider', 'google')
      .single();

    if (error || !data) {
      return null;
    }

    const metadata = data.metadata as { secondary_calendar_id?: string } | null;
    return metadata?.secondary_calendar_id || null;
  }

  /**
   * Parsea errores de OAuth de Google y devuelve mensajes claros
   */
  private static parseGoogleOAuthError(errorData: { error?: string; error_description?: string }): string {
    const error = errorData.error || '';
    const description = errorData.error_description || '';

    // Error de usuario no autorizado (modo de prueba)
    if (error === 'access_denied' || description.includes('access_denied')) {
      if (description.includes('test') || description.includes('Testing')) {
        return 'TEST_MODE_USER_NOT_ADDED: Tu email no está agregado como usuario de prueba. Ve a Google Cloud Console > OAuth consent screen > Test users y agrega tu email.';
      }
      return 'ACCESS_DENIED: Acceso denegado. Asegúrate de aceptar todos los permisos solicitados.';
    }

    // App no verificada o rechazo por políticas
    if (description.includes("doesn't comply with Google's OAuth 2.0 policy") ||
      description.includes('OAuth 2.0 policy') ||
      description.includes('unverified') ||
      description.includes('validation rules')) {
      // Mensaje más específico con posibles causas
      return 'APP_NOT_VERIFIED: Google rechazó la conexión por políticas de OAuth. Posibles causas:\n' +
        '1. Los cambios en Google Cloud Console pueden tardar 10-20 minutos en aplicarse\n' +
        '2. Verifica que el redirect URI en Credentials coincida EXACTAMENTE con: ' + REDIRECT_URI + '\n' +
        '3. Asegúrate de que tu email esté en usuarios de prueba y espera unos minutos\n' +
        '4. Si el problema persiste, intenta crear nuevas credenciales OAuth 2.0';
    }

    // Error de redirect_uri
    if (error === 'redirect_uri_mismatch' || description.includes('redirect_uri')) {
      return 'REDIRECT_URI_MISMATCH: La URI de redirección no coincide. Verifica que tengas configurado: ' + REDIRECT_URI + ' en Google Cloud Console > Credentials > OAuth 2.0 Client ID.';
    }

    // Error de client_id
    if (error === 'invalid_client' || description.includes('client_id')) {
      return 'INVALID_CLIENT: El Client ID es inválido. Verifica tu configuración en Google Cloud Console.';
    }

    // Error de código expirado
    if (error === 'invalid_grant' || description.includes('expired')) {
      return 'CODE_EXPIRED: El código de autorización ha expirado. Por favor, intenta conectar de nuevo.';
    }

    // Error genérico
    return description || error || 'Error desconocido al conectar con Google Calendar';
  }

  /**
   * Conecta Microsoft Calendar usando el código de autorización
   * Verifica que el email del calendario coincida con el del usuario de la app
   */
  static async connectMicrosoftCalendar(userId: string, authCode: string, expectedEmail?: string): Promise<CalendarIntegration | null> {
    try {
      // Intercambiar código por tokens
      const tokenResponse = await fetch('https://login.microsoftonline.com/common/oauth2/v2.0/token', {
        method: 'POST',
        headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
        body: new URLSearchParams({
          client_id: MICROSOFT_CLIENT_ID || '',
          client_secret: MICROSOFT_CLIENT_SECRET || '',
          code: authCode,
          grant_type: 'authorization_code',
          redirect_uri: REDIRECT_URI,
          scope: 'offline_access Calendars.Read Calendars.ReadWrite User.Read',
        }),
      });

      if (!tokenResponse.ok) {
        console.error('Error obteniendo tokens de Microsoft:', await tokenResponse.text());
        return null;
      }

      const tokens = await tokenResponse.json();

      // VERIFICACIÓN DE SEGURIDAD: Obtener el email del usuario del calendario
      const calendarUserEmail = await this.getMicrosoftUserEmail(tokens.access_token);

      if (calendarUserEmail) {

        // Si tenemos email esperado, verificar que coincida
        if (expectedEmail && expectedEmail.toLowerCase() !== calendarUserEmail.toLowerCase()) {
          console.warn('[Calendar Integration] âš ï¸ El email del calendario Microsoft no coincide con el usuario de la app:', {
            emailApp: expectedEmail,
            emailCalendar: calendarUserEmail
          });
          throw new Error(`EMAIL_MISMATCH: El calendario conectado pertenece a "${calendarUserEmail}" pero estás logueado como "${expectedEmail}". Por favor, inicia sesión en Microsoft con la cuenta correcta o cierra la sesión y vuelve a intentar.`);
        }
      }

      // Guardar en base de datos
      return await this.saveCalendarIntegration(userId, 'microsoft', tokens, calendarUserEmail);

    } catch (error) {
      console.error('Error conectando Microsoft Calendar:', error);
      if (error instanceof Error) {
        throw error;
      }
      return null;
    }
  }

  /**
   * Obtiene el email del usuario de Microsoft usando el access token
   */
  private static async getMicrosoftUserEmail(accessToken: string): Promise<string | null> {
    try {
      const response = await fetch('https://graph.microsoft.com/v1.0/me', {
        headers: {
          Authorization: `Bearer ${accessToken}`,
        },
      });

      if (!response.ok) {
        console.error('Error obteniendo info de usuario de Microsoft:', await response.text());
        return null;
      }

      const data = await response.json();
      return data.mail || data.userPrincipalName || null;
    } catch (error) {
      console.error('Error obteniendo email de Microsoft:', error);
      return null;
    }
  }

  /**
   * Guarda o actualiza la integración de calendario en la base de datos
   * Usa Service Role Key para bypass de RLS ya que este proyecto no usa Supabase Auth
   */
  private static async saveCalendarIntegration(
    userId: string,
    provider: 'google' | 'microsoft',
    tokens: {
      access_token: string;
      refresh_token?: string;
      expires_in?: number;
      scope?: string;
    },
    calendarEmail?: string | null
  ): Promise<CalendarIntegration | null> {
    // Usar cliente admin con Service Role Key para bypass de RLS
    // Ya validamos la autenticación del usuario antes de llegar aquí
    const supabase = createAdminClient();

    const expiresAt = tokens.expires_in
      ? new Date(Date.now() + tokens.expires_in * 1000).toISOString()
      : null;

    // Verificar si ya existe una integración
    const { data: existing } = await supabase
      .from('calendar_integrations')
      .select('id, refresh_token')
      .eq('user_id', userId)
      .eq('provider', provider)
      .single();

    let result;

    if (existing) {
      // Actualizar existente
      // ✅ CORRECCIÓN: Preservar refresh_token existente si no viene uno nuevo
      // Google no siempre devuelve un nuevo refresh_token al refrescar,
      // por lo que debemos preservar el existente
      const refreshTokenToSave = tokens.refresh_token || existing.refresh_token;

      const { data, error } = await supabase
        .from('calendar_integrations')
        .update({
          access_token: tokens.access_token,
          refresh_token: refreshTokenToSave,
          expires_at: expiresAt,
          scope: tokens.scope,
          updated_at: new Date().toISOString(),
        })
        .eq('id', existing.id)
        .select()
        .single();

      if (error) {
        console.error('Error actualizando integración:', error);

        // Si es error de RLS, dar mensaje más específico
        if (error.code === '42501' || error.message?.includes('row-level security')) {
          throw new Error('RLS_ERROR: No tienes permisos para actualizar integraciones de calendario. Las políticas RLS están bloqueando la operación. Verifica las políticas de la tabla calendar_integrations en Supabase.');
        }

        throw error;
      }
      result = data;
    } else {
      // Crear nueva
      const { data, error } = await supabase
        .from('calendar_integrations')
        .insert({
          user_id: userId,
          provider,
          access_token: tokens.access_token,
          refresh_token: tokens.refresh_token,
          expires_at: expiresAt,
          scope: tokens.scope,
        })
        .select()
        .single();

      if (error) {
        console.error('Error creando integración:', error);

        // Si es error de RLS, dar mensaje más específico
        if (error.code === '42501' || error.message?.includes('row-level security')) {
          throw new Error('RLS_ERROR: No tienes permisos para crear integraciones de calendario. Las políticas RLS están bloqueando la operación. Verifica las políticas de la tabla calendar_integrations en Supabase.');
        }

        throw error;
      }
      result = data;
    }

    return {
      id: result.id,
      userId: result.user_id,
      provider: result.provider as 'google' | 'microsoft',
      isConnected: true,
      expiresAt: result.expires_at || undefined,
      scope: result.scope || undefined,
    };
  }

  /**
   * Obtiene la integración de calendario del usuario
   * Usa Service Role Key para leer de la BD
   */
  static async getCalendarIntegration(userId: string): Promise<CalendarIntegration | null> {
    const supabase = createAdminClient();

    const { data, error } = await supabase
      .from('calendar_integrations')
      .select('*')
      .eq('user_id', userId)
      .order('updated_at', { ascending: false })
      .limit(1)
      .single();

    if (error || !data) {
      return null;
    }

    const isConnected = !!data.access_token &&
      (!data.expires_at || new Date(data.expires_at) > new Date());

    return {
      id: data.id,
      userId: data.user_id,
      provider: data.provider as 'google' | 'microsoft',
      isConnected,
      expiresAt: data.expires_at || undefined,
      scope: data.scope || undefined,
    };
  }

  /**
   * Refresca el token de acceso si está expirado
   * Usa Service Role Key para leer de la BD
   */
  static async refreshTokenIfNeeded(userId: string): Promise<string | null> {
    const supabase = createAdminClient();

    const { data: integration } = await supabase
      .from('calendar_integrations')
      .select('*')
      .eq('user_id', userId)
      .single();

    if (!integration) {
      return null;
    }

    // Verificar si el token está por expirar (menos de 5 minutos)
    const expiresAt = integration.expires_at ? new Date(integration.expires_at) : null;
    const needsRefresh = !expiresAt ||
      (expiresAt.getTime() - Date.now()) < 5 * 60 * 1000;

    if (!needsRefresh) {
      return integration.access_token;
    }

    if (!integration.refresh_token) {
      console.error('No hay refresh token disponible');
      return null;
    }

    // Refrescar token según el proveedor
    let tokenUrl: string;
    let bodyParams: Record<string, string>;

    if (integration.provider === 'google') {
      tokenUrl = 'https://oauth2.googleapis.com/token';
      bodyParams = {
        client_id: GOOGLE_CLIENT_ID || '',
        client_secret: GOOGLE_CLIENT_SECRET || '',
        refresh_token: integration.refresh_token,
        grant_type: 'refresh_token',
      };
    } else {
      tokenUrl = 'https://login.microsoftonline.com/common/oauth2/v2.0/token';
      bodyParams = {
        client_id: MICROSOFT_CLIENT_ID || '',
        client_secret: MICROSOFT_CLIENT_SECRET || '',
        refresh_token: integration.refresh_token,
        grant_type: 'refresh_token',
        scope: 'offline_access Calendars.Read Calendars.ReadWrite User.Read',
      };
    }

    try {
      const response = await fetch(tokenUrl, {
        method: 'POST',
        headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
        body: new URLSearchParams(bodyParams),
      });

      if (!response.ok) {
        console.error('Error refrescando token:', await response.text());
        return null;
      }

      const tokens = await response.json();

      // Actualizar en base de datos
      const newExpiresAt = tokens.expires_in
        ? new Date(Date.now() + tokens.expires_in * 1000).toISOString()
        : null;

      // ✅ CORRECCIÓN: Guardar nuevo refresh_token si viene en la respuesta
      // Preservar el existente si no viene uno nuevo
      const refreshTokenToSave = tokens.refresh_token || integration.refresh_token;

      await supabase
        .from('calendar_integrations')
        .update({
          access_token: tokens.access_token,
          refresh_token: refreshTokenToSave,
          expires_at: newExpiresAt,
          updated_at: new Date().toISOString(),
        })
        .eq('id', integration.id);

      return tokens.access_token;

    } catch (error) {
      console.error('Error refrescando token:', error);
      return null;
    }
  }

  /**
   * Obtiene eventos del calendario de Google desde TODOS los calendarios del usuario
   */
  static async getGoogleCalendarEvents(
    accessToken: string,
    startDate: Date,
    endDate: Date,
    selectedCalendarIds?: string[]
  ): Promise<CalendarEvent[]> {
    try {
      // Primero, obtener la lista de calendarios del usuario
      const calendarsResponse = await fetch(
        'https://www.googleapis.com/calendar/v3/users/me/calendarList',
        {
          headers: {
            Authorization: `Bearer ${accessToken}`,
          },
        }
      );

      if (!calendarsResponse.ok) {
        console.error('Error obteniendo lista de calendarios:', await calendarsResponse.text());
        // Fallback: intentar solo con primary
        return await this.getEventsFromSingleCalendar(accessToken, 'primary', startDate, endDate);
      }

      const calendarsData = await calendarsResponse.json();
      const calendars = calendarsData.items || [];

      // Obtener eventos filtrados por selección del usuario
      const allEvents: CalendarEvent[] = [];

      for (const calendar of calendars) {
        // Si hay calendarios seleccionados, solo incluir esos
        if (selectedCalendarIds && selectedCalendarIds.length > 0) {
          if (!selectedCalendarIds.includes(calendar.id)) continue;
        } else if (!(['owner', 'writer', 'reader'].includes(calendar.accessRole) || calendar.primary)) {
          // Sin selección guardada: incluir todos con acceso de lectura o superior
          continue;
        }

        const events = await this.getEventsFromSingleCalendar(accessToken, calendar.id, startDate, endDate);
        allEvents.push(...events);
      }

      // Ordenar por fecha de inicio
      allEvents.sort((a, b) => new Date(a.startTime).getTime() - new Date(b.startTime).getTime());

      return allEvents;
    } catch (error) {
      console.error('Error obteniendo eventos de Google:', error);
      return [];
    }
  }

  /**
   * Obtiene eventos de un calendario específico de Google
   */
  private static async getEventsFromSingleCalendar(
    accessToken: string,
    calendarId: string,
    startDate: Date,
    endDate: Date
  ): Promise<CalendarEvent[]> {
    try {
      const params = new URLSearchParams({
        timeMin: startDate.toISOString(),
        timeMax: endDate.toISOString(),
        singleEvents: 'true',
        orderBy: 'startTime',
        maxResults: '250',
      });

      const response = await fetch(
        `https://www.googleapis.com/calendar/v3/calendars/${encodeURIComponent(calendarId)}/events?${params}`,
        {
          headers: {
            Authorization: `Bearer ${accessToken}`,
          },
        }
      );

      if (!response.ok) {
        console.error(`Error obteniendo eventos del calendario ${calendarId}:`, await response.text());
        return [];
      }

      const data = await response.json();

      return (data.items || []).map((event: any) => ({
        id: event.id,
        title: event.summary || 'Sin título',
        description: event.description,
        startTime: event.start?.dateTime || event.start?.date,
        endTime: event.end?.dateTime || event.end?.date,
        isAllDay: !!event.start?.date,
        isRecurring: !!event.recurringEventId,
        location: event.location,
        status: event.status === 'confirmed' ? 'confirmed' :
          event.status === 'tentative' ? 'tentative' : 'cancelled',
        calendarId: calendarId,
      }));

    } catch (error) {
      console.error(`Error obteniendo eventos del calendario ${calendarId}:`, error);
      return [];
    }
  }

  /**
   * Obtiene eventos del calendario de Microsoft
   */
  static async getMicrosoftCalendarEvents(
    accessToken: string,
    startDate: Date,
    endDate: Date,
    selectedCalendarIds?: string[]
  ): Promise<CalendarEvent[]> {
    try {
      const mapMicrosoftEvent = (event: any, calId?: string): CalendarEvent => ({
        id: event.id,
        title: event.subject || 'Sin título',
        description: event.bodyPreview,
        startTime: event.start?.dateTime,
        endTime: event.end?.dateTime,
        isAllDay: event.isAllDay,
        isRecurring: !!event.seriesMasterId,
        location: event.location?.displayName,
        status: event.showAs === 'busy' ? 'confirmed' :
          event.showAs === 'tentative' ? 'tentative' : 'cancelled',
        calendarId: calId,
      });

      // Si hay calendarios seleccionados, obtener eventos por calendario individual
      if (selectedCalendarIds && selectedCalendarIds.length > 0) {
        const allEvents: CalendarEvent[] = [];
        for (const calId of selectedCalendarIds) {
          const params = new URLSearchParams({
            startDateTime: startDate.toISOString(),
            endDateTime: endDate.toISOString(),
            $orderby: 'start/dateTime',
            $top: '100',
          });

          const response = await fetch(
            `https://graph.microsoft.com/v1.0/me/calendars/${encodeURIComponent(calId)}/calendarView?${params}`,
            {
              headers: {
                Authorization: `Bearer ${accessToken}`,
              },
            }
          );

          if (!response.ok) {
            console.error(`[Calendar] Error obteniendo eventos de Microsoft calendario ${calId}:`, await response.text());
            continue;
          }

          const data = await response.json();
          allEvents.push(...(data.value || []).map((e: any) => mapMicrosoftEvent(e, calId)));
        }
        return allEvents;
      }

      // Sin selección: usar endpoint por defecto (todos los calendarios)
      const params = new URLSearchParams({
        startDateTime: startDate.toISOString(),
        endDateTime: endDate.toISOString(),
        $orderby: 'start/dateTime',
        $top: '100',
      });

      const response = await fetch(
        `https://graph.microsoft.com/v1.0/me/calendarview?${params}`,
        {
          headers: {
            Authorization: `Bearer ${accessToken}`,
          },
        }
      );

      if (!response.ok) {
        console.error('Error obteniendo eventos de Microsoft:', await response.text());
        return [];
      }

      const data = await response.json();
      return (data.value || []).map((e: any) => mapMicrosoftEvent(e));

    } catch (error) {
      console.error('Error obteniendo eventos de Microsoft:', error);
      return [];
    }
  }

  /**
   * Obtiene eventos del calendario del usuario
   */
  static async getCalendarEvents(
    userId: string,
    startDate: Date,
    endDate: Date
  ): Promise<CalendarEvent[]> {
    // Refrescar token si es necesario
    const accessToken = await this.refreshTokenIfNeeded(userId);

    if (!accessToken) {
      return [];
    }

    // Obtener integración para saber el proveedor
    const integration = await this.getCalendarIntegration(userId);

    if (!integration || !integration.isConnected) {
      return [];
    }

    // Cargar calendarios seleccionados por el usuario
    const selectedCalendarIds = await this.getSelectedCalendarIds(userId);

    if (integration.provider === 'google') {
      return this.getGoogleCalendarEvents(accessToken, startDate, endDate, selectedCalendarIds || undefined);
    } else {
      return this.getMicrosoftCalendarEvents(accessToken, startDate, endDate, selectedCalendarIds || undefined);
    }
  }

  /**
   * Analiza la disponibilidad basándose en eventos del calendario
   */
  static analyzeAvailability(
    events: CalendarEvent[],
    startDate: Date,
    endDate: Date,
    preferredDays: number[] = [1, 2, 3, 4, 5], // Lunes a viernes por defecto
    workingHours: { start: number; end: number } = { start: 8, end: 20 }
  ): CalendarAvailability[] {
    const availability: CalendarAvailability[] = [];

    // Iterar por cada día en el rango
    const currentDate = new Date(startDate);
    while (currentDate <= endDate) {
      const dayOfWeek = currentDate.getDay();

      // Solo analizar días preferidos
      if (preferredDays.includes(dayOfWeek)) {
        const dayStart = new Date(currentDate);
        dayStart.setHours(workingHours.start, 0, 0, 0);

        const dayEnd = new Date(currentDate);
        dayEnd.setHours(workingHours.end, 0, 0, 0);

        // Obtener eventos del día
        const dayEvents = events.filter(event => {
          const eventStart = new Date(event.startTime);
          const eventEnd = new Date(event.endTime);
          return eventStart.toDateString() === currentDate.toDateString() ||
            (eventStart < dayEnd && eventEnd > dayStart);
        });

        // Calcular slots ocupados y libres
        const busySlots: TimeBlock[] = [];
        for (const event of dayEvents) {
          if (event.status === 'cancelled') continue;

          const eventStart = new Date(event.startTime);
          const eventEnd = new Date(event.endTime);

          busySlots.push({
            startHour: eventStart.getHours(),
            startMinute: eventStart.getMinutes(),
            endHour: eventEnd.getHours(),
            endMinute: eventEnd.getMinutes(),
          });
        }

        // Ordenar slots ocupados
        busySlots.sort((a, b) =>
          (a.startHour * 60 + a.startMinute) - (b.startHour * 60 + b.startMinute)
        );

        // Calcular slots libres
        const freeSlots: TimeBlock[] = [];
        let lastEndHour = workingHours.start;
        let lastEndMinute = 0;

        for (const busy of busySlots) {
          // Si hay espacio antes del slot ocupado
          if (busy.startHour * 60 + busy.startMinute > lastEndHour * 60 + lastEndMinute) {
            freeSlots.push({
              startHour: lastEndHour,
              startMinute: lastEndMinute,
              endHour: busy.startHour,
              endMinute: busy.startMinute,
            });
          }

          // Actualizar fin del último slot ocupado
          const busyEndMinutes = busy.endHour * 60 + busy.endMinute;
          const lastEndMinutes = lastEndHour * 60 + lastEndMinute;
          if (busyEndMinutes > lastEndMinutes) {
            lastEndHour = busy.endHour;
            lastEndMinute = busy.endMinute;
          }
        }

        // Agregar slot libre al final del día si hay
        if (lastEndHour * 60 + lastEndMinute < workingHours.end * 60) {
          freeSlots.push({
            startHour: lastEndHour,
            startMinute: lastEndMinute,
            endHour: workingHours.end,
            endMinute: 0,
          });
        }

        // Calcular totales
        let totalFreeMinutes = 0;
        for (const slot of freeSlots) {
          totalFreeMinutes += (slot.endHour * 60 + slot.endMinute) - (slot.startHour * 60 + slot.startMinute);
        }

        let totalBusyMinutes = 0;
        for (const slot of busySlots) {
          totalBusyMinutes += (slot.endHour * 60 + slot.endMinute) - (slot.startHour * 60 + slot.startMinute);
        }

        availability.push({
          date: currentDate.toISOString().split('T')[0],
          freeSlots,
          busySlots,
          totalFreeMinutes,
          totalBusyMinutes,
        });
      }

      // Avanzar al siguiente día
      currentDate.setDate(currentDate.getDate() + 1);
    }

    return availability;
  }

  /**
   * Encuentra slots libres que cumplan con la duración mínima requerida
   */
  static findFreeTimeSlots(
    availability: CalendarAvailability[],
    minDurationMinutes: number
  ): Array<{ date: string; slot: TimeBlock }> {
    const suitableSlots: Array<{ date: string; slot: TimeBlock }> = [];

    for (const day of availability) {
      for (const slot of day.freeSlots) {
        const slotDuration = (slot.endHour * 60 + slot.endMinute) -
          (slot.startHour * 60 + slot.startMinute);

        if (slotDuration >= minDurationMinutes) {
          suitableSlots.push({
            date: day.date,
            slot,
          });
        }
      }
    }

    return suitableSlots;
  }

  /**
   * Desconecta el calendario del usuario
   * Usa Service Role Key para operaciones de BD
   */
  static async disconnectCalendar(userId: string, provider?: 'google' | 'microsoft'): Promise<boolean> {
    const supabase = createAdminClient();

    let query = supabase
      .from('calendar_integrations')
      .delete()
      .eq('user_id', userId);

    if (provider) {
      query = query.eq('provider', provider);
    }

    const { error } = await query;

    if (error) {
      console.error('Error desconectando calendario:', error);
      return false;
    }

    return true;
  }

  // ==========================================
  // FUNCIONES CRUD PARA EVENTOS DE CALENDARIO
  // ==========================================

  /**
   * Crea un evento en el calendario secundario de Google
   * IMPORTANTE: Los eventos se crean ÚNICAMENTE en el calendario secundario de la plataforma
   */
  static async createGoogleEvent(
    accessToken: string,
    event: {
      title: string;
      description?: string;
      startTime: string;
      endTime: string;
      timezone: string;
      location?: string;
    },
    calendarId: string | null
  ): Promise<{ id: string; htmlLink?: string } | null> {
    try {
      // Usar el calendario secundario si está disponible, sino el primario
      const targetCalendarId = calendarId || 'primary';

      const response = await fetch(
        `https://www.googleapis.com/calendar/v3/calendars/${encodeURIComponent(targetCalendarId)}/events`,
        {
          method: 'POST',
          headers: {
            Authorization: `Bearer ${accessToken}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            summary: event.title,
            description: event.description || '',
            location: event.location || '',
            start: {
              dateTime: event.startTime,
              timeZone: event.timezone,
            },
            end: {
              dateTime: event.endTime,
              timeZone: event.timezone,
            },
            reminders: {
              useDefault: false,
              overrides: [
                { method: 'popup', minutes: 15 },
              ],
            },
          }),
        }
      );

      if (!response.ok) {
        console.error('[Calendar] Error creando evento:', await response.text());
        return null;
      }

      const data = await response.json();
      return { id: data.id, htmlLink: data.htmlLink };
    } catch (error) {
      console.error('[Calendar] Error creando evento:', error);
      return null;
    }
  }

  /**
   * Actualiza un evento en el calendario secundario de Google
   */
  static async updateGoogleEvent(
    accessToken: string,
    eventId: string,
    event: {
      title?: string;
      description?: string;
      startTime?: string;
      endTime?: string;
      timezone?: string;
      location?: string;
    },
    calendarId: string | null
  ): Promise<boolean> {
    try {
      const targetCalendarId = calendarId || 'primary';

      const updateData: any = {};
      if (event.title) updateData.summary = event.title;
      if (event.description !== undefined) updateData.description = event.description;
      if (event.location !== undefined) updateData.location = event.location;
      if (event.startTime && event.timezone) {
        updateData.start = { dateTime: event.startTime, timeZone: event.timezone };
      }
      if (event.endTime && event.timezone) {
        updateData.end = { dateTime: event.endTime, timeZone: event.timezone };
      }

      const response = await fetch(
        `https://www.googleapis.com/calendar/v3/calendars/${encodeURIComponent(targetCalendarId)}/events/${eventId}`,
        {
          method: 'PATCH',
          headers: {
            Authorization: `Bearer ${accessToken}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(updateData),
        }
      );

      if (!response.ok) {
        console.error('[Calendar] Error actualizando evento:', await response.text());
        return false;
      }

      return true;
    } catch (error) {
      console.error('[Calendar] Error actualizando evento:', error);
      return false;
    }
  }

  /**
   * Elimina un evento del calendario secundario de Google
   */
  static async deleteGoogleEvent(
    accessToken: string,
    eventId: string,
    calendarId: string | null
  ): Promise<boolean> {
    try {
      const targetCalendarId = calendarId || 'primary';

      const response = await fetch(
        `https://www.googleapis.com/calendar/v3/calendars/${encodeURIComponent(targetCalendarId)}/events/${eventId}`,
        {
          method: 'DELETE',
          headers: {
            Authorization: `Bearer ${accessToken}`,
          },
        }
      );

      if (response.ok) return true;

      // Si es 404 y estamos usando calendario secundario, intentar en primary como fallback
      if (response.status === 404 && targetCalendarId !== 'primary') {
        const fallbackResponse = await fetch(
          `https://www.googleapis.com/calendar/v3/calendars/primary/events/${eventId}`,
          {
            method: 'DELETE',
            headers: {
              Authorization: `Bearer ${accessToken}`,
            },
          }
        );
        if (fallbackResponse.ok || fallbackResponse.status === 404) {
          return true;
        }
        return false;
      }

      // 404 en primary = evento ya no existe
      if (response.status === 404) return true;

      console.error('[Calendar] Error eliminando evento:', await response.text());
      return false;
    } catch (error) {
      console.error('[Calendar] Error eliminando evento:', error);
      return false;
    }
  }

  /**
   * Crea un evento en Microsoft Calendar
   * @param accessToken - Token de acceso de Microsoft
   * @param event - Datos del evento
   * @returns ID del evento creado o null si falla
   */
  static async createMicrosoftEvent(
    accessToken: string,
    event: {
      title: string;
      description?: string;
      startTime: string;
      endTime: string;
      timezone: string;
      location?: string;
    }
  ): Promise<{ id: string } | null> {
    try {
      console.log('[Calendar] Creando evento en Microsoft Calendar:', event.title);

      const response = await fetch('https://graph.microsoft.com/v1.0/me/events', {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${accessToken}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          subject: event.title,
          body: {
            contentType: 'HTML',
            content: event.description || '',
          },
          start: {
            dateTime: event.startTime,
            timeZone: event.timezone,
          },
          end: {
            dateTime: event.endTime,
            timeZone: event.timezone,
          },
          location: event.location ? { displayName: event.location } : undefined,
          reminderMinutesBeforeStart: 15,
          isReminderOn: true,
        }),
      });

      if (!response.ok) {
        const errorText = await response.text();
        console.error('[Calendar] Error creando evento en Microsoft:', errorText);
        return null;
      }

      const data = await response.json();
      console.log('[Calendar] Evento de Microsoft creado exitosamente:', data.id);
      return { id: data.id };
    } catch (error) {
      console.error('[Calendar] Error creando evento en Microsoft:', error);
      return null;
    }
  }

  /**
   * Obtiene el calendario secundario del usuario, creándolo si no existe
   * Esta función es una conveniencia para obtener todo lo necesario para operaciones de calendario
   */
  static async getCalendarIdForUser(userId: string): Promise<{
    calendarId: string | null;
    accessToken: string | null;
    provider: 'google' | 'microsoft' | null;
  }> {
    // Refrescar token si es necesario
    const accessToken = await this.refreshTokenIfNeeded(userId);
    if (!accessToken) {
      return { calendarId: null, accessToken: null, provider: null };
    }

    // Obtener integración
    const integration = await this.getCalendarIntegration(userId);
    if (!integration || !integration.isConnected) {
      return { calendarId: null, accessToken: null, provider: null };
    }

    // Solo Google tiene calendario secundario
    if (integration.provider !== 'google') {
      return { calendarId: null, accessToken, provider: integration.provider };
    }

    // Obtener o crear calendario secundario
    let calendarId = await this.getSecondaryCalendarId(userId);

    if (!calendarId) {
      calendarId = await this.getOrCreatePlatformCalendar(accessToken);
      if (calendarId) {
        await this.saveSecondaryCalendarId(userId, calendarId);
      }
    }

    return { calendarId, accessToken, provider: integration.provider };
  }
  /**
   * Elimina un evento de Microsoft Calendar
   */
  static async deleteMicrosoftEvent(
    accessToken: string,
    eventId: string
  ): Promise<boolean> {
    try {
      const response = await fetch(`https://graph.microsoft.com/v1.0/me/events/${eventId}`, {
        method: 'DELETE',
        headers: {
          Authorization: `Bearer ${accessToken}`,
        },
      });

      if (!response.ok && response.status !== 404) {
        const errorText = await response.text();
        console.error('[Calendar] Error eliminando evento de Microsoft:', errorText);
        return false;
      }

      return true;
    } catch (error) {
      console.error('[Calendar] Error eliminando evento de Microsoft:', error);
      return false;
    }
  }
}

