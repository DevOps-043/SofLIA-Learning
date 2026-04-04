/**
 * API Endpoint: Get Calendar Availability
 * 
 * GET /api/study-planner/calendar/availability?startDate=&endDate=&preferredDays=
 * 
 * Obtiene los eventos del calendario y analiza la disponibilidad
 * del usuario en el rango de fechas especificado.
 */

import { NextRequest, NextResponse } from 'next/server';
import { SessionService } from '../../../../../features/auth/services/session.service';
import { CalendarIntegrationService } from '../../../../../features/study-planner/services/calendar-integration.service';
import type { CalendarAvailability, CalendarEvent } from '../../../../../features/study-planner/types/user-context.types';
import { logger } from '@/lib/logger';

interface AvailabilityResponse {
  success: boolean;
  data?: {
    isConnected: boolean;
    provider?: 'google' | 'microsoft';
    events: CalendarEvent[];
    availability: CalendarAvailability[];
    summary: {
      totalDays: number;
      totalFreeMinutes: number;
      totalBusyMinutes: number;
      averageFreeMinutesPerDay: number;
    };
  };
  error?: string;
}

export async function GET(request: NextRequest): Promise<NextResponse<AvailabilityResponse>> {
  try {
    // Verificar autenticación
    const user = await SessionService.getCurrentUser();
    
    if (!user) {
      return NextResponse.json(
        { success: false, error: 'No autenticado' },
        { status: 401 }
      );
    }
    
    // Obtener parámetros
    const searchParams = request.nextUrl.searchParams;
    const startDateParam = searchParams.get('startDate');
    const endDateParam = searchParams.get('endDate');
    const preferredDaysParam = searchParams.get('preferredDays');
    
    // Validar y parsear fechas
    const startDate = startDateParam ? new Date(startDateParam) : new Date();
    const endDate = endDateParam 
      ? new Date(endDateParam) 
      : new Date(Date.now() + 14 * 24 * 60 * 60 * 1000); // +14 días por defecto
    
    // Parsear días preferidos
    let preferredDays = [1, 2, 3, 4, 5]; // Lunes a viernes por defecto
    if (preferredDaysParam) {
      try {
        preferredDays = JSON.parse(preferredDaysParam);
      } catch {
        // Usar default
      }
    }
    
    // Verificar si hay calendario conectado
    const integration = await CalendarIntegrationService.getCalendarIntegration(user.id);
    
    if (!integration || !integration.isConnected) {
      return NextResponse.json({
        success: true,
        data: {
          isConnected: false,
          events: [],
          availability: [],
          summary: {
            totalDays: 0,
            totalFreeMinutes: 0,
            totalBusyMinutes: 0,
            averageFreeMinutesPerDay: 0,
          },
        },
      });
    }
    
    // Obtener eventos del calendario
    const events = await CalendarIntegrationService.getCalendarEvents(
      user.id,
      startDate,
      endDate
    );
    
    // Analizar disponibilidad
    const availability = CalendarIntegrationService.analyzeAvailability(
      events,
      startDate,
      endDate,
      preferredDays
    );
    
    // Calcular resumen
    let totalFreeMinutes = 0;
    let totalBusyMinutes = 0;
    
    for (const day of availability) {
      totalFreeMinutes += day.totalFreeMinutes;
      totalBusyMinutes += day.totalBusyMinutes;
    }
    
    const totalDays = availability.length;
    const averageFreeMinutesPerDay = totalDays > 0 ? Math.round(totalFreeMinutes / totalDays) : 0;
    
    return NextResponse.json({
      success: true,
      data: {
        isConnected: true,
        provider: integration.provider,
        events,
        availability,
        summary: {
          totalDays,
          totalFreeMinutes,
          totalBusyMinutes,
          averageFreeMinutesPerDay,
        },
      },
    });
    
  } catch (error) {
    logger.error('Error obteniendo disponibilidad del calendario:', error);
    return NextResponse.json(
      { 
        success: false, 
        error: error instanceof Error ? error.message : 'Error interno del servidor' 
      },
      { status: 500 }
    );
  }
}
