/**
 * API Endpoint: Connect Calendar
 * 
 * POST /api/study-planner/calendar/connect
 * 
 * Inicia el proceso de conexión de calendario (Google o Microsoft)
 * Retorna la URL de autorización OAuth.
 * 
 * GET /api/study-planner/calendar/connect?code=&state=
 * 
 * Callback para completar la conexión OAuth.
 */

import { NextRequest, NextResponse } from 'next/server';

import { SessionService } from '../../../../../features/auth/services/session.service';

import { CalendarIntegrationService } from '../../../../../features/study-planner/services/calendar-integration.service';

interface ConnectCalendarRequest {
  provider: 'google' | 'microsoft';
}

interface ConnectCalendarResponse {
  success: boolean;
  data?: {
    authUrl: string;
  };
  error?: string;
}

// Callback para completar la conexión OAuth
export async function GET(request: NextRequest): Promise<NextResponse> {
  try {
    const searchParams = request.nextUrl.searchParams;
    const code = searchParams.get('code');
    const state = searchParams.get('state');
    const error = searchParams.get('error');
    
    if (error) {
      // Redirigir con error
      return NextResponse.redirect(
        new URL(`/study-planner/create?calendar_error=${encodeURIComponent(error)}`, request.url)
      );
    }
    
    if (!code || !state) {
      return NextResponse.redirect(
        new URL('/study-planner/create?calendar_error=missing_params', request.url)
      );
    }
    
    // Parsear state
    let stateData: { provider: 'google' | 'microsoft'; userId: string };
    try {
      stateData = JSON.parse(state);
    } catch {
      return NextResponse.redirect(
        new URL('/study-planner/create?calendar_error=invalid_state', request.url)
      );
    }
    
    // Completar conexión
    let integration;
    
    if (stateData.provider === 'google') {
      integration = await CalendarIntegrationService.connectGoogleCalendar(stateData.userId, code);
    } else {
      integration = await CalendarIntegrationService.connectMicrosoftCalendar(stateData.userId, code);
    }
    
    if (!integration) {
      return NextResponse.redirect(
        new URL('/study-planner/create?calendar_error=connection_failed', request.url)
      );
    }
    
    // Redirigir con éxito
    return NextResponse.redirect(
      new URL(`/study-planner/create?calendar_connected=${stateData.provider}`, request.url)
    );
    
  } catch (error) {
    console.error('Error en callback de calendario:', error);
    return NextResponse.redirect(
      new URL('/study-planner/create?calendar_error=server_error', request.url)
    );
  }
}
