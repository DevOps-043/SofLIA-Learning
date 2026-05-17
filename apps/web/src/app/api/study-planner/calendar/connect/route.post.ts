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

export async function POST(request: NextRequest): Promise<NextResponse<ConnectCalendarResponse>> {
  try {
    // Verificar autenticación
    const user = await SessionService.getCurrentUser();
    
    if (!user) {
      return NextResponse.json(
        { success: false, error: 'No autenticado' },
        { status: 401 }
      );
    }
    
    const body: ConnectCalendarRequest = await request.json();
    
    if (!body.provider || !['google', 'microsoft'].includes(body.provider)) {
      return NextResponse.json(
        { success: false, error: 'Proveedor de calendario inválido. Use "google" o "microsoft".' },
        { status: 400 }
      );
    }
    
    // Generar URL de autorización
    let authUrl: string;
    
    if (body.provider === 'google') {
      authUrl = CalendarIntegrationService.getGoogleAuthUrl(user.id);
    } else {
      authUrl = CalendarIntegrationService.getMicrosoftAuthUrl(user.id);
    }
    
    return NextResponse.json({
      success: true,
      data: { authUrl },
    });
    
  } catch (error) {
    console.error('Error iniciando conexión de calendario:', error);
    return NextResponse.json(
      { 
        success: false, 
        error: error instanceof Error ? error.message : 'Error interno del servidor' 
      },
      { status: 500 }
    );
  }
}
