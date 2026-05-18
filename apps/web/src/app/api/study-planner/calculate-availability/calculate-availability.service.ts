import { logger as techDebtLogger } from '@/lib/utils/logger'
import type {
  CalendarEvent,
  SofLIAAvailabilityAnalysis,
  TimeBlock,
  UserContext,
} from '../../../../features/study-planner/types/user-context.types'

export interface CalculateAvailabilityRequest {
  calendarEvents?: CalendarEvent[]
  preferredDays?: number[]
  preferredTimeOfDay?: 'morning' | 'afternoon' | 'evening' | 'night'
}

export interface CalculateAvailabilityResponse {
  success: boolean
  data?: SofLIAAvailabilityAnalysis
  error?: string
}

export interface AvailabilityProfileData {
  userType: UserContext['userType']
  rol: string
  area: string
  nivel: string
  tamanoEmpresa: string
  minEmpleados?: number
  maxEmpleados?: number
  sector: string
  organizacion?: string
  tieneCalendarioConectado: boolean
  calendarEvents: CalendarEvent[]
  preferredDays?: number[]
  preferredTimeOfDay?: 'morning' | 'afternoon' | 'evening' | 'night'
}

export function buildAvailabilityPrompt(profileData: AvailabilityProfileData): string {
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
${profileData.calendarEvents.map((event) => `- ${event.title}: ${event.startTime} - ${event.endTime}`).join('\n')}
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
`
}

export async function callLIAForAvailabilityAnalysis(
  prompt: string,
  profileData: AvailabilityProfileData,
): Promise<SofLIAAvailabilityAnalysis> {
  try {
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
    })

    if (!response.ok) {
      throw new Error('Error al comunicarse con LIA')
    }

    const data = await response.json()
    const liaResponseText = data.response
    const jsonMatch = liaResponseText.match(/\{[\s\S]*\}/)

    if (jsonMatch) {
      return {
        ...JSON.parse(jsonMatch[0]),
        analyzedAt: new Date().toISOString(),
      }
    }

    return generateDefaultAvailability(profileData)
  } catch (error) {
    techDebtLogger.error('Error llamando a LIA:', error)
    return generateDefaultAvailability(profileData)
  }
}

function generateDefaultAvailability(profileData: AvailabilityProfileData): SofLIAAvailabilityAnalysis {
  let estimatedWeeklyMinutes = 300
  let suggestedMinSessionMinutes = 20
  let suggestedMaxSessionMinutes = 45
  const suggestedBreakMinutes = 10
  const nivel = (profileData.nivel || '').toLowerCase()

  if (nivel.includes('c-level') || nivel.includes('director') || nivel.includes('ejecutivo')) {
    estimatedWeeklyMinutes = 180
    suggestedMinSessionMinutes = 15
    suggestedMaxSessionMinutes = 30
  } else if (nivel.includes('gerente') || nivel.includes('manager') || nivel.includes('jefe')) {
    estimatedWeeklyMinutes = 240
    suggestedMinSessionMinutes = 20
    suggestedMaxSessionMinutes = 40
  } else if (!nivel.includes('senior') && !nivel.includes('especialista')) {
    estimatedWeeklyMinutes = 360
    suggestedMaxSessionMinutes = 60
  }

  const maxEmpleados = profileData.maxEmpleados || 0
  if (maxEmpleados > 1000) {
    estimatedWeeklyMinutes = Math.round(estimatedWeeklyMinutes * 0.8)
  } else if (maxEmpleados < 50) {
    estimatedWeeklyMinutes = Math.round(estimatedWeeklyMinutes * 1.1)
  }

  const suggestedTimeBlocks: TimeBlock[] = [
    { startHour: 7, startMinute: 0, endHour: 8, endMinute: 0 },
    { startHour: 12, startMinute: 30, endHour: 13, endMinute: 30 },
    { startHour: 19, startMinute: 0, endHour: 21, endMinute: 0 },
  ]

  return {
    estimatedWeeklyMinutes,
    suggestedMinSessionMinutes,
    suggestedMaxSessionMinutes,
    suggestedBreakMinutes,
    suggestedDays: [1, 2, 3, 4, 5],
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
  }
}
