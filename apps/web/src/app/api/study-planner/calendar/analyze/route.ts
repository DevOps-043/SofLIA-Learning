/**
 * API Endpoint: Analyze Calendar with LIA
 * 
 * POST /api/study-planner/calendar/analyze
 * 
 * Usa LIA para analizar los eventos del calendario y generar
 * recomendaciones de horarios óptimos para estudiar.
 */

import { NextRequest, NextResponse } from 'next/server';
import { SessionService } from '../../../../../features/auth/services/session.service';
import { UserContextService } from '../../../../../features/study-planner/services/user-context.service';
import { CalendarIntegrationService } from '../../../../../features/study-planner/services/calendar-integration.service';
import type { 
  CalendarEvent,
  CalendarAvailability,
  TimeBlock,
  SofLIAAvailabilityAnalysis,
  UserContext,
} from '../../../../../features/study-planner/types/user-context.types';

interface AnalyzeCalendarRequest {
  startDate?: string;
  endDate?: string;
  preferredDays?: number[];
  minSessionMinutes?: number;
  maxSessionMinutes?: number;
}

interface AnalyzeCalendarResponse {
  success: boolean;
  data?: {
    events: CalendarEvent[];
    liaAnalysis: SofLIAAvailabilityAnalysis;
    recommendedSlots: Array<{
      date: string;
      slot: TimeBlock;
      suitability: 'excellent' | 'good' | 'fair';
      reason: string;
    }>;
  };
  error?: string;
}

export async function POST(request: NextRequest): Promise<NextResponse<AnalyzeCalendarResponse>> {
  try {
    // Verificar autenticación
    const user = await SessionService.getCurrentUser();
    
    if (!user) {
      return NextResponse.json(
        { success: false, error: 'No autenticado' },
        { status: 401 }
      );
    }
    
    const body: AnalyzeCalendarRequest = await request.json();
    
    // Obtener contexto del usuario
    const userContext = await UserContextService.getFullUserContext(user.id);
    
    // Parsear fechas
    const startDate = body.startDate ? new Date(body.startDate) : new Date();
    const endDate = body.endDate 
      ? new Date(body.endDate) 
      : new Date(Date.now() + 14 * 24 * 60 * 60 * 1000);
    
    const preferredDays = body.preferredDays || [1, 2, 3, 4, 5];
    const minSessionMinutes = body.minSessionMinutes || 20;
    const maxSessionMinutes = body.maxSessionMinutes || 60;
    
    // Obtener eventos del calendario
    let events: CalendarEvent[] = [];
    
    if (userContext.calendarIntegration?.isConnected) {
      events = await CalendarIntegrationService.getCalendarEvents(
        user.id,
        startDate,
        endDate
      );
    }
    
    // Analizar disponibilidad
    const availability = CalendarIntegrationService.analyzeAvailability(
      events,
      startDate,
      endDate,
      preferredDays
    );
    
    // Encontrar slots adecuados
    const suitableSlots = CalendarIntegrationService.findFreeTimeSlots(
      availability,
      minSessionMinutes
    );
    
    // Generar análisis con LIA
    const liaAnalysis = await generateLIAAnalysis(
      userContext,
      events,
      availability,
      {
        minSessionMinutes,
        maxSessionMinutes,
        preferredDays,
      }
    );
    
    // Clasificar slots por idoneidad
    const recommendedSlots = suitableSlots.map(({ date, slot }) => {
      const slotDuration = (slot.endHour * 60 + slot.endMinute) - 
                          (slot.startHour * 60 + slot.startMinute);
      
      let suitability: 'excellent' | 'good' | 'fair';
      let reason: string;
      
      // Determinar idoneidad basándose en duración y horario
      if (slotDuration >= maxSessionMinutes) {
        suitability = 'excellent';
        reason = `Slot amplio de ${slotDuration} minutos, ideal para sesiones completas`;
      } else if (slotDuration >= minSessionMinutes + 10) {
        suitability = 'good';
        reason = `Slot de ${slotDuration} minutos, suficiente para una sesión cómoda`;
      } else {
        suitability = 'fair';
        reason = `Slot ajustado de ${slotDuration} minutos, para sesiones cortas`;
      }
      
      // Ajustar por hora del día
      const avgHour = (slot.startHour + slot.endHour) / 2;
      if (avgHour >= 7 && avgHour <= 11) {
        reason += '. Horario matutino óptimo para concentración.';
      } else if (avgHour >= 19 && avgHour <= 21) {
        reason += '. Horario nocturno, bueno para repaso.';
      }
      
      return { date, slot, suitability, reason };
    });
    
    // Ordenar por idoneidad
    recommendedSlots.sort((a, b) => {
      const order = { excellent: 0, good: 1, fair: 2 };
      return order[a.suitability] - order[b.suitability];
    });
    
    return NextResponse.json({
      success: true,
      data: {
        events,
        liaAnalysis,
        recommendedSlots: recommendedSlots.slice(0, 20), // Limitar a 20 slots
      },
    });
    
  } catch (error) {
    console.error('Error analizando calendario:', error);
    return NextResponse.json(
      { 
        success: false, 
        error: error instanceof Error ? error.message : 'Error interno del servidor' 
      },
      { status: 500 }
    );
  }
}

/**
 * Genera análisis de disponibilidad usando LIA
 */
async function generateLIAAnalysis(
  userContext: UserContext,
  events: CalendarEvent[],
  availability: CalendarAvailability[],
  config: {
    minSessionMinutes: number;
    maxSessionMinutes: number;
    preferredDays: number[];
  }
): Promise<SofLIAAvailabilityAnalysis> {
  // Calcular estadísticas del calendario
  let totalFreeMinutes = 0;
  let totalBusyMinutes = 0;
  
  for (const day of availability) {
    totalFreeMinutes += day.totalFreeMinutes;
    totalBusyMinutes += day.totalBusyMinutes;
  }
  
  const totalDays = availability.length;
  const avgFreePerDay = totalDays > 0 ? Math.round(totalFreeMinutes / totalDays) : 0;
  
  // Estimar disponibilidad semanal
  const daysPerWeek = config.preferredDays.length;
  const estimatedWeeklyMinutes = Math.min(avgFreePerDay * daysPerWeek, 600); // Max 10 horas
  
  // Ajustar por perfil profesional
  let adjustedWeeklyMinutes = estimatedWeeklyMinutes;
  const nivel = (userContext.professionalProfile?.nivel?.nombre || '').toLowerCase();
  
  if (nivel.includes('c-level') || nivel.includes('director') || nivel.includes('ejecutivo')) {
    adjustedWeeklyMinutes = Math.min(adjustedWeeklyMinutes, 180); // Max 3 horas
  } else if (nivel.includes('gerente') || nivel.includes('manager')) {
    adjustedWeeklyMinutes = Math.min(adjustedWeeklyMinutes, 240); // Max 4 horas
  }
  
  // Determinar bloques de tiempo sugeridos
  const suggestedTimeBlocks: TimeBlock[] = [];
  
  // Analizar cuándo hay más tiempo libre
  const morningFree = availability.reduce((sum, day) => {
    const morningSlots = day.freeSlots.filter((s: TimeBlock) => s.startHour < 12);
    return sum + morningSlots.reduce((slotSum: number, s: TimeBlock) => 
      slotSum + ((s.endHour * 60 + s.endMinute) - (s.startHour * 60 + s.startMinute)), 0);
  }, 0);
  
  const eveningFree = availability.reduce((sum, day) => {
    const eveningSlots = day.freeSlots.filter((s: TimeBlock) => s.startHour >= 17);
    return sum + eveningSlots.reduce((slotSum: number, s: TimeBlock) => 
      slotSum + ((s.endHour * 60 + s.endMinute) - (s.startHour * 60 + s.startMinute)), 0);
  }, 0);
  
  // Sugerir bloques según disponibilidad
  if (morningFree > eveningFree) {
    suggestedTimeBlocks.push({
      startHour: 7,
      startMinute: 0,
      endHour: 8,
      endMinute: 30,
    });
  }
  
  if (eveningFree > 0) {
    suggestedTimeBlocks.push({
      startHour: 19,
      startMinute: 0,
      endHour: 21,
      endMinute: 0,
    });
  }
  
  // Agregar horario de almuerzo si hay tiempo
  if (avgFreePerDay > 60) {
    suggestedTimeBlocks.push({
      startHour: 12,
      startMinute: 30,
      endHour: 13,
      endMinute: 30,
    });
  }
  
  // Calcular tiempos de sesión recomendados
  const avgSlotDuration = availability.reduce((sum, day) => {
    const avgDay = day.freeSlots.length > 0 
      ? day.freeSlots.reduce((s: number, slot: TimeBlock) => 
          s + ((slot.endHour * 60 + slot.endMinute) - (slot.startHour * 60 + slot.startMinute)), 0) 
        / day.freeSlots.length
      : 0;
    return sum + avgDay;
  }, 0) / (totalDays || 1);
  
  const suggestedMinSessionMinutes = Math.max(
    config.minSessionMinutes,
    Math.min(avgSlotDuration * 0.5, 30)
  );
  
  const suggestedMaxSessionMinutes = Math.min(
    config.maxSessionMinutes,
    Math.max(avgSlotDuration * 0.8, 45)
  );
  
  // Tiempo de descanso
  const suggestedBreakMinutes = suggestedMaxSessionMinutes > 45 ? 15 : 10;
  
  return {
    estimatedWeeklyMinutes: adjustedWeeklyMinutes,
    suggestedMinSessionMinutes: Math.round(suggestedMinSessionMinutes),
    suggestedMaxSessionMinutes: Math.round(suggestedMaxSessionMinutes),
    suggestedBreakMinutes,
    suggestedDays: config.preferredDays,
    suggestedTimeBlocks,
    reasoning: generateReasoningText(
      userContext,
      events,
      availability,
      adjustedWeeklyMinutes
    ),
    factorsConsidered: {
      role: userContext.professionalProfile?.rol?.nombre || 'No especificado',
      area: userContext.professionalProfile?.area?.nombre || 'No especificada',
      companySize: userContext.professionalProfile?.tamanoEmpresa?.nombre || 'No especificado',
      level: userContext.professionalProfile?.nivel?.nombre || 'No especificado',
      calendarAnalysis: events.length > 0 
        ? `Se analizaron ${events.length} eventos en tu calendario. Tienes aproximadamente ${Math.round(avgFreePerDay)} minutos libres por día.`
        : 'No se encontraron eventos en el calendario.',
    },
    analyzedAt: new Date().toISOString(),
  };
}

/**
 * Genera texto de razonamiento para el análisis
 */
function generateReasoningText(
  userContext: UserContext,
  events: CalendarEvent[],
  availability: CalendarAvailability[],
  weeklyMinutes: number
): string {
  const hours = Math.round(weeklyMinutes / 60 * 10) / 10;
  const nivel = userContext.professionalProfile?.nivel?.nombre || 'tu nivel profesional';
  const area = userContext.professionalProfile?.area?.nombre || 'tu área';
  
  let reasoning = `Basándonos en tu perfil como profesional de ${area} con nivel ${nivel}`;
  
  if (events.length > 0) {
    reasoning += ` y el análisis de ${events.length} eventos en tu calendario`;
  }
  
  reasoning += `, estimamos que dispones de aproximadamente ${hours} horas semanales para estudio. `;
  
  if (userContext.userType === 'b2b') {
    reasoning += 'Como empleado de una organización, consideramos también tus compromisos laborales. ';
  }
  
  const avgFreePerDay = availability.length > 0
    ? availability.reduce((sum, day) => sum + day.totalFreeMinutes, 0) / availability.length
    : 0;
  
  if (avgFreePerDay < 60) {
    reasoning += 'Tu agenda está bastante ocupada, recomendamos sesiones cortas pero frecuentes.';
  } else if (avgFreePerDay < 120) {
    reasoning += 'Tienes tiempo moderado disponible, las sesiones de duración media serán ideales.';
  } else {
    reasoning += 'Tienes buen tiempo disponible, puedes optar por sesiones más largas y profundas.';
  }
  
  return reasoning;
}
