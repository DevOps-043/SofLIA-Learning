import { logger as techDebtLogger } from '@/lib/utils/logger'
import { NextRequest, NextResponse } from 'next/server';
import { SessionService } from '../../../../../features/auth/services/session.service';
import { CalendarIntegrationService } from '../../../../../features/study-planner/services/calendar-integration.service';

export const dynamic = 'force-dynamic'

export async function GET(request: NextRequest): Promise<NextResponse> {
  try {
    const searchParams = request.nextUrl.searchParams;
    const code = searchParams.get('code');
    const state = searchParams.get('state');
    const error = searchParams.get('error');
    const errorDescription = searchParams.get('error_description');
    
    // Si hay un error de OAuth
    if (error) {
      techDebtLogger.error('Error de OAuth:', error, errorDescription);
      
      // Verificar si viene de un popup
      let isPopup = false;
      try {
        if (state) {
          const stateData = JSON.parse(state);
          isPopup = stateData.usePopup === true;
        }
      } catch {
        // Si no se puede parsear, asumimos que no es popup
      }
      
      if (isPopup) {
        // Si es popup, redirigir a la página de callback del cliente
        return NextResponse.redirect(
          new URL(
            `/study-planner/calendar/callback?error=${encodeURIComponent(error)}${errorDescription ? `&error_description=${encodeURIComponent(errorDescription)}` : ''}${state ? `&state=${encodeURIComponent(state)}` : ''}`,
            request.url
          )
        );
      }
      
      // Si no es popup, redirigir normalmente
      return NextResponse.redirect(
        new URL(
          `/study-planner/create?calendar_error=${encodeURIComponent(error)}${errorDescription ? `&error_description=${encodeURIComponent(errorDescription)}` : ''}`,
          request.url
        )
      );
    }
    
    // Validar parámetros requeridos
    if (!code || !state) {
      // Verificar si viene de un popup (aunque falten parámetros)
      let isPopup = false;
      try {
        if (state) {
          const stateData = JSON.parse(state);
          isPopup = stateData.usePopup === true;
        }
      } catch {
        // Si no se puede parsear, asumimos que no es popup
      }
      
      if (isPopup) {
        return NextResponse.redirect(
          new URL(`/study-planner/calendar/callback?error=missing_params&error_description=${encodeURIComponent('Faltan parámetros requeridos')}&state=${encodeURIComponent(state || '')}`, request.url)
        );
      }
      
      return NextResponse.redirect(
        new URL('/study-planner/create?calendar_error=missing_params', request.url)
      );
    }
    
    // Obtener usuario actual de la sesión
    const user = await SessionService.getCurrentUser();
    
    if (!user) {
      return NextResponse.redirect(
        new URL('/auth?error=session_expired', request.url)
      );
    }
    
    // Parsear state para obtener provider (el userId ahora lo obtenemos de la sesión)
    let stateData: { provider?: 'google' | 'microsoft'; returnUrl?: string; usePopup?: boolean };
    let isPopup = false;
    try {
      // Intentar parsear el state (puede estar codificado)
      try {
        stateData = JSON.parse(state);
      } catch {
        // Si falla, intentar decodificar primero
        try {
          stateData = JSON.parse(decodeURIComponent(state));
        } catch {
          // Si aún falla, intentar decodificar dos veces
          stateData = JSON.parse(decodeURIComponent(decodeURIComponent(state)));
        }
      }
      isPopup = stateData.usePopup === true;
    } catch (parseError) {
      techDebtLogger.error('Error parseando state:', parseError, 'State recibido:', state);
      
      // Si es popup, redirigir a la página de callback del cliente
      if (state && state.includes('usePopup')) {
        return NextResponse.redirect(
          new URL(`/study-planner/calendar/callback?error=invalid_state&error_description=${encodeURIComponent('Error al procesar los parámetros de autorización')}&state=${encodeURIComponent(state)}`, request.url)
        );
      }
      
      return NextResponse.redirect(
        new URL('/study-planner/create?calendar_error=invalid_state', request.url)
      );
    }
    
    // Validar que state contenga provider
    if (!stateData.provider || !['google', 'microsoft'].includes(stateData.provider)) {
      return NextResponse.redirect(
        new URL('/study-planner/create?calendar_error=invalid_provider', request.url)
      );
    }
    
    // Completar conexión del calendario
    // isPopup ya está definido arriba
    let integration;
    
    try {
      // Pasar el email del usuario de la app para verificar que coincida con el del calendario
      const userEmail = user.email;
      
      if (stateData.provider === 'google') {
        integration = await CalendarIntegrationService.connectGoogleCalendar(user.id, code, userEmail);
      } else if (stateData.provider === 'microsoft') {
        integration = await CalendarIntegrationService.connectMicrosoftCalendar(user.id, code, userEmail);
      } else {
        if (isPopup) {
          return NextResponse.redirect(
            new URL(`/study-planner/calendar/callback?error=invalid_provider&error_description=${encodeURIComponent('Proveedor de calendario inválido')}&state=${encodeURIComponent(state)}`, request.url)
          );
        }
        return NextResponse.redirect(
          new URL('/study-planner/create?calendar_error=invalid_provider', request.url)
        );
      }
      
      if (!integration) {
        // Si es popup, redirigir a la página de callback del cliente con error
        if (isPopup) {
          return NextResponse.redirect(
            new URL(`/study-planner/calendar/callback?error=connection_failed&error_description=${encodeURIComponent('No se pudo conectar el calendario. Verifica tu configuración de OAuth.')}&state=${encodeURIComponent(state)}`, request.url)
          );
        }
        return NextResponse.redirect(
          new URL('/study-planner/create?calendar_error=connection_failed', request.url)
        );
      }
      
      // Si es popup, redirigir a la página de callback del cliente con éxito
      if (isPopup) {
        // No enviamos el code porque ya se procesó, solo el state y success
        return NextResponse.redirect(
          new URL(`/study-planner/calendar/callback?success=true&provider=${stateData.provider}&state=${encodeURIComponent(state)}`, request.url)
        );
      }
      
      // Si no es popup, redirigir normalmente
      // Si hay returnUrl en el state, usarlo; sino, usar la URL por defecto
      const redirectUrl = stateData.returnUrl || '/study-planner/create';
      return NextResponse.redirect(
        new URL(`${redirectUrl}?calendar_connected=${stateData.provider}`, request.url)
      );
      
    } catch (connectionError) {
      techDebtLogger.error('Error conectando calendario:', connectionError);
      
      // Parsear error para obtener mensaje descriptivo y tipo de error
      let errorMsg = 'Error desconocido al conectar el calendario';
      let errorType = 'connection_error';
      
      if (connectionError instanceof Error) {
        errorMsg = connectionError.message;
        
        // Detectar tipo de error específico para mostrar ayuda adecuada
        if (errorMsg.startsWith('RLS_ERROR:')) {
          errorType = 'rls_error';
          errorMsg = errorMsg.replace('RLS_ERROR: ', '');
        } else if (errorMsg.startsWith('EMAIL_MISMATCH:')) {
          errorType = 'email_mismatch';
          errorMsg = errorMsg.replace('EMAIL_MISMATCH: ', '');
        } else if (errorMsg.startsWith('TEST_MODE_USER_NOT_ADDED:')) {
          errorType = 'test_mode_user_not_added';
          errorMsg = errorMsg.replace('TEST_MODE_USER_NOT_ADDED: ', '');
        } else if (errorMsg.startsWith('APP_NOT_VERIFIED:')) {
          errorType = 'app_not_verified';
          errorMsg = errorMsg.replace('APP_NOT_VERIFIED: ', '');
        } else if (errorMsg.startsWith('ACCESS_DENIED:')) {
          errorType = 'access_denied';
          errorMsg = errorMsg.replace('ACCESS_DENIED: ', '');
        } else if (errorMsg.startsWith('REDIRECT_URI_MISMATCH:')) {
          errorType = 'redirect_uri_mismatch';
          errorMsg = errorMsg.replace('REDIRECT_URI_MISMATCH: ', '');
        } else if (errorMsg.startsWith('INVALID_CLIENT:')) {
          errorType = 'invalid_client';
          errorMsg = errorMsg.replace('INVALID_CLIENT: ', '');
        } else if (errorMsg.startsWith('CODE_EXPIRED:')) {
          errorType = 'code_expired';
          errorMsg = errorMsg.replace('CODE_EXPIRED: ', '');
        } else if (errorMsg.includes("doesn't comply with Google's OAuth 2.0 policy") || 
                   errorMsg.includes('OAuth 2.0 policy')) {
          errorType = 'app_not_verified';
          errorMsg = "La aplicación requiere verificación. Configura el modo de prueba en Google Cloud Console y agrega tu email como usuario de prueba.";
        }
      }
      
      // Usar isPopup ya definido arriba, o parsearlo si no está disponible
      let finalIsPopup = isPopup;
      if (state) {
        try {
          const stateData = JSON.parse(state);
          finalIsPopup = stateData.usePopup === true;
        } catch {
          // Usar el valor ya definido
        }
      }
      
      if (finalIsPopup) {
        return NextResponse.redirect(
          new URL(`/study-planner/calendar/callback?error=${encodeURIComponent(errorType)}&error_description=${encodeURIComponent(errorMsg)}&state=${encodeURIComponent(state || '')}`, request.url)
        );
      }
      
      return NextResponse.redirect(
        new URL(`/study-planner/create?calendar_error=${encodeURIComponent(errorMsg)}`, request.url)
      );
    }
    
  } catch (error: unknown) {
    techDebtLogger.error('Error en callback de calendario:', error);
    return NextResponse.redirect(
      new URL('/study-planner/create?calendar_error=server_error', request.url)
    );
  }
}
