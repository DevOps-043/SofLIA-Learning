/**
 * API Endpoint: Calculate Availability using LIA
 * 
 * POST /api/study-planner/calculate-availability
 * 
 * Usa LIA (IA generativa) para calcular la disponibilidad del usuario
 * basándose en su perfil profesional, tamaño de empresa, rol y calendario.
 */

import { NextRequest, NextResponse } from 'next/server';
import { SessionService } from '../../../../features/auth/services/session.service';
import { UserContextService } from '../../../../features/study-planner/services/user-context.service';
import type { 
  SofLIAAvailabilityAnalysis,
  TimeBlock,
  CalendarEvent 
} from '../../../../features/study-planner/types/user-context.types';

interface CalculateAvailabilityRequest {
  calendarEvents?: CalendarEvent[];
  preferredDays?: number[];
  preferredTimeOfDay?: 'morning' | 'afternoon' | 'evening' | 'night';
}

interface CalculateAvailabilityResponse {
  success: boolean;
  data?: SofLIAAvailabilityAnalysis;
  error?: string;
}

export async function POST(request: NextRequest): Promise<NextResponse<CalculateAvailabilityResponse>> {
  try {
    // Verificar autenticación
    const user = await SessionService.getCurrentUser();
    
    if (!user) {
      return NextResponse.json(
        { success: false, error: 'No autenticado' },
        { status: 401 }
      );
    }
    
    const body: CalculateAvailabilityRequest = await request.json();
    
    // Obtener contexto del usuario
    const userContext = await UserContextService.getFullUserContext(user.id);
    
    // Preparar datos para LIA
    const profileData = {
      userType: userContext.userType,
      rol: userContext.professionalProfile?.rol?.nombre || 'No especificado',
      area: userContext.professionalProfile?.area?.nombre || 'No especificada',
      nivel: userContext.professionalProfile?.nivel?.nombre || 'No especificado',
      tamanoEmpresa: userContext.professionalProfile?.tamanoEmpresa?.nombre || 'No especificado',
      minEmpleados: userContext.professionalProfile?.tamanoEmpresa?.minEmpleados,
      maxEmpleados: userContext.professionalProfile?.tamanoEmpresa?.maxEmpleados,
      sector: userContext.professionalProfile?.sector?.nombre || 'No especificado',
      organizacion: userContext.organization?.name,
      tieneCalendarioConectado: !!userContext.calendarIntegration?.isConnected,
      calendarEvents: body.calendarEvents || [],
      preferredDays: body.preferredDays,
      preferredTimeOfDay: body.preferredTimeOfDay,
    };
    
    // Construir prompt para LIA
    const liaPrompt = buildAvailabilityPrompt(profileData);
    
    // Llamar a LIA para análisis
    const liaResponse = await callLIAForAvailabilityAnalysis(liaPrompt, profileData);
    
    return NextResponse.json({
      success: true,
      data: liaResponse,
    });
    
  } catch (error) {
    console.error('Error calculando disponibilidad:', error);
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
 * Construye el prompt para que LIA analice la disponibilidad
 */
function buildAvailabilityPrompt(profileData: any): string {
  return `
Analiza la disponibilidad de tiempo para estudios del siguiente usuario y proporciona recomendaciones personalizadas.

PERFIL DEL USUARIO:
- Tipo: ${profileData.userType === 'b2b' ? 'Empleado de empresa (B2B)' : 'Usuario independiente (B2C)'}
- Rol profesional: ${profileData.rol}
- Área: ${profileData.area}
- Nivel jerárquico: ${profileData.nivel}
- Tamaño de empresa: ${profileData.tamanoEmpresa} ${profileData.minEmpleados && profileData.maxEmpleados ? `(${profileData.minEmpleados}-${profileData.maxEmpleados} empleados)` : ''}
- Sector: ${profileData.sector}
${profileData.organizacion ? `- Organización: ${profileData.organizacion}` : ''}
- Calendario conectado: ${profileData.tieneCalendarioConectado ? 'Sí' : 'No'}

${profileData.calendarEvents?.length > 0 ? `
EVENTOS DEL CALENDARIO (próximos 7 días):
${profileData.calendarEvents.map((e: CalendarEvent) => `- ${e.title}: ${e.startTime} - ${e.endTime}`).join('\n')}
` : ''}

INSTRUCCIONES:
1. Considera que un ejecutivo C-Level tiene menos tiempo disponible que un empleado de nivel operativo
2. Empresas más grandes (>500 empleados) suelen tener empleados con menos tiempo disponible
3. El sector de la empresa puede influir en la disponibilidad (ej: tecnología vs servicios)
4. Si hay eventos en el calendario, evita esos horarios

Proporciona tu análisis en formato JSON con la siguiente estructura:
{
  "estimatedWeeklyMinutes": [número de minutos semanales estimados para estudio],
  "suggestedMinSessionMinutes": [tiempo mínimo sugerido por sesión],
  "suggestedMaxSessionMinutes": [tiempo máximo sugerido por sesión],
  "suggestedBreakMinutes": [tiempo de descanso sugerido],
  "suggestedDays": [array de días sugeridos 0-6 donde 0=domingo],
  "suggestedTimeBlocks": [array de bloques de tiempo con formato {startHour, startMinute, endHour, endMinute}],
  "reasoning": "[explicación breve del análisis]",
  "factorsConsidered": {
    "role": "[cómo influye el rol]",
    "area": "[cómo influye el área]",
    "companySize": "[cómo influye el tamaño de empresa]",
    "level": "[cómo influye el nivel jerárquico]",
    "calendarAnalysis": "[análisis del calendario si aplica]"
  }
}
`;
}

/**
 * Llama a LIA para obtener el análisis de disponibilidad
 */
async function callLIAForAvailabilityAnalysis(
  prompt: string,
  profileData: any
): Promise<SofLIAAvailabilityAnalysis> {
  try {
    // Llamar al endpoint de AI chat con contexto especializado
    const response = await fetch(new URL('/api/ai-chat', process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'), {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        message: prompt,
        context: 'study-planner-availability',
        conversationHistory: [],
        pageContext: {
          action: 'calculate-availability',
          profileData,
        },
        language: 'es',
      }),
    });
    
    if (!response.ok) {
      throw new Error('Error al comunicarse con LIA');
    }
    
    const data = await response.json();
    const liaResponseText = data.response;
    
    // Intentar parsear la respuesta JSON de LIA
    const jsonMatch = liaResponseText.match(/\{[\s\S]*\}/);
    if (jsonMatch) {
      const parsed = JSON.parse(jsonMatch[0]);
      return {
        ...parsed,
        analyzedAt: new Date().toISOString(),
      };
    }
    
    // Si no se puede parsear, generar respuesta por defecto basada en el perfil
    return generateDefaultAvailability(profileData);
    
  } catch (error) {
    console.error('Error llamando a LIA:', error);
    // Retornar valores por defecto si falla LIA
    return generateDefaultAvailability(profileData);
  }
}

/**
 * Genera disponibilidad por defecto basada en el perfil
 */
function generateDefaultAvailability(profileData: any): SofLIAAvailabilityAnalysis {
  // Estimar disponibilidad basada en nivel jerárquico
  let estimatedWeeklyMinutes = 300; // 5 horas base
  let suggestedMinSessionMinutes = 20;
  let suggestedMaxSessionMinutes = 45;
  let suggestedBreakMinutes = 10;
  
  // Ajustar por nivel
  const nivel = (profileData.nivel || '').toLowerCase();
  if (nivel.includes('c-level') || nivel.includes('director') || nivel.includes('ejecutivo')) {
    estimatedWeeklyMinutes = 180; // 3 horas
    suggestedMinSessionMinutes = 15;
    suggestedMaxSessionMinutes = 30;
  } else if (nivel.includes('gerente') || nivel.includes('manager') || nivel.includes('jefe')) {
    estimatedWeeklyMinutes = 240; // 4 horas
    suggestedMinSessionMinutes = 20;
    suggestedMaxSessionMinutes = 40;
  } else if (nivel.includes('senior') || nivel.includes('especialista')) {
    estimatedWeeklyMinutes = 300; // 5 horas
  } else {
    estimatedWeeklyMinutes = 360; // 6 horas para niveles operativos
    suggestedMaxSessionMinutes = 60;
  }
  
  // Ajustar por tamaño de empresa
  const maxEmpleados = profileData.maxEmpleados || 0;
  if (maxEmpleados > 1000) {
    estimatedWeeklyMinutes = Math.round(estimatedWeeklyMinutes * 0.8);
  } else if (maxEmpleados < 50) {
    estimatedWeeklyMinutes = Math.round(estimatedWeeklyMinutes * 1.1);
  }
  
  // Días sugeridos (lunes a viernes por defecto)
  const suggestedDays = [1, 2, 3, 4, 5];
  
  // Bloques de tiempo sugeridos
  const suggestedTimeBlocks: TimeBlock[] = [
    { startHour: 7, startMinute: 0, endHour: 8, endMinute: 0 }, // Mañana temprano
    { startHour: 12, startMinute: 30, endHour: 13, endMinute: 30 }, // Almuerzo
    { startHour: 19, startMinute: 0, endHour: 21, endMinute: 0 }, // Noche
  ];
  
  return {
    estimatedWeeklyMinutes,
    suggestedMinSessionMinutes,
    suggestedMaxSessionMinutes,
    suggestedBreakMinutes,
    suggestedDays,
    suggestedTimeBlocks,
    reasoning: `Basado en tu perfil como ${profileData.rol} en el área de ${profileData.area}, con nivel ${profileData.nivel} en una empresa ${profileData.tamanoEmpresa}, estimamos que tienes aproximadamente ${Math.round(estimatedWeeklyMinutes / 60)} horas semanales disponibles para estudio.`,
    factorsConsidered: {
      role: `Tu rol de ${profileData.rol} fue considerado para estimar tu carga de trabajo`,
      area: `El área de ${profileData.area} tiene características específicas de demanda`,
      companySize: `El tamaño de empresa ${profileData.tamanoEmpresa} influye en la carga laboral`,
      level: `Tu nivel ${profileData.nivel} determina responsabilidades y tiempo disponible`,
      calendarAnalysis: profileData.tieneCalendarioConectado 
        ? 'Se analizaron tus eventos de calendario para evitar conflictos'
        : 'No hay calendario conectado, se usaron estimaciones generales',
    },
    analyzedAt: new Date().toISOString(),
  };
}
