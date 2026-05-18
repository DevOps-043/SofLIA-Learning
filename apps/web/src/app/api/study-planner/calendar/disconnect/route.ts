import { logger as techDebtLogger } from '@/lib/utils/logger'
/**
 * API Endpoint: Disconnect Calendar
 * 
 * POST /api/study-planner/calendar/disconnect
 * 
 * Desconecta el calendario del usuario.
 */

import { NextRequest, NextResponse } from 'next/server';
import { SessionService } from '../../../../../features/auth/services/session.service';
import { CalendarIntegrationService } from '../../../../../features/study-planner/services/calendar-integration.service';

interface DisconnectCalendarRequest {
  provider?: 'google' | 'microsoft';
}

interface DisconnectCalendarResponse {
  success: boolean;
  message?: string;
  error?: string;
}

export async function POST(request: NextRequest): Promise<NextResponse<DisconnectCalendarResponse>> {
  try {
    // Verificar autenticación
    const user = await SessionService.getCurrentUser();
    
    if (!user) {
      return NextResponse.json(
        { success: false, error: 'No autenticado' },
        { status: 401 }
      );
    }
    
    const body: DisconnectCalendarRequest = await request.json().catch(() => ({}));
    
    // Desconectar calendario
    const success = await CalendarIntegrationService.disconnectCalendar(
      user.id,
      body.provider
    );
    
    if (!success) {
      return NextResponse.json(
        { success: false, error: 'No se pudo desconectar el calendario' },
        { status: 500 }
      );
    }
    
    return NextResponse.json({
      success: true,
      message: body.provider 
        ? `Calendario de ${body.provider === 'google' ? 'Google' : 'Microsoft'} desconectado exitosamente`
        : 'Calendario desconectado exitosamente',
    });
    
  } catch (error) {
    techDebtLogger.error('Error desconectando calendario:', error);
    return NextResponse.json(
      { 
        success: false, 
        error: error instanceof Error ? error.message : 'Error interno del servidor' 
      },
      { status: 500 }
    );
  }
}

