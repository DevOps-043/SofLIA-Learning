import { UserProfile } from './user-context.service';
import {
  AREA_MULTIPLIERS,
  AVAILABILITY_BY_LEVEL,
  COMPANY_SIZE_MULTIPLIERS,
  C_LEVEL_PATTERNS,
  MANAGEMENT_PATTERNS,
  SENIOR_PATTERNS,
} from './availability-calculator.config';

// Tipos para disponibilidad
export interface AvailabilityEstimate {
  dailyMinutesMin: number;
  dailyMinutesMax: number;
  weeklyHoursMin: number;
  weeklyHoursMax: number;
  recommendedSessionType: 'short' | 'medium' | 'long';
  adjustmentFactors: {
    roleBase: number;
    companySizeMultiplier: number;
    areaMultiplier: number;
    finalMultiplier: number;
  };
  explanation: string;
}

export class AvailabilityCalculatorService {
  /**
   * Calcula la disponibilidad estimada basada en el perfil del usuario
   */
  static calculateAvailability(profile: UserProfile): AvailabilityEstimate {
    // 1. Determinar nivel/rol del usuario
    const roleLevel = this.determineRoleLevel(profile);
    const baseConfig = AVAILABILITY_BY_LEVEL[roleLevel] || AVAILABILITY_BY_LEVEL['default'];

    // 2. Calcular multiplicador por tamaño de empresa
    const companySizeMultiplier = this.getCompanySizeMultiplier(profile.tamano_empresa);

    // 3. Calcular multiplicador por área
    const areaMultiplier = this.getAreaMultiplier(profile.area);

    // 4. Calcular multiplicador final
    const finalMultiplier = companySizeMultiplier * areaMultiplier;

    // 5. Aplicar multiplicadores a los valores base
    const adjustedDailyMin = Math.round(baseConfig.dailyMinutesMin * finalMultiplier);
    const adjustedDailyMax = Math.round(baseConfig.dailyMinutesMax * finalMultiplier);
    const adjustedWeeklyMin = Math.round(baseConfig.weeklyHoursMin * finalMultiplier * 10) / 10;
    const adjustedWeeklyMax = Math.round(baseConfig.weeklyHoursMax * finalMultiplier * 10) / 10;

    // 6. Determinar tipo de sesión recomendada
    const recommendedSessionType = this.determineRecommendedSessionType(adjustedDailyMax);

    // 7. Generar explicación
    const explanation = this.generateExplanation(profile, roleLevel, companySizeMultiplier, areaMultiplier);

    return {
      dailyMinutesMin: adjustedDailyMin,
      dailyMinutesMax: adjustedDailyMax,
      weeklyHoursMin: adjustedWeeklyMin,
      weeklyHoursMax: adjustedWeeklyMax,
      recommendedSessionType,
      adjustmentFactors: {
        roleBase: 1,
        companySizeMultiplier,
        areaMultiplier,
        finalMultiplier
      },
      explanation
    };
  }

  /**
   * Determina el nivel/rol del usuario basado en su perfil
   */
  private static determineRoleLevel(profile: UserProfile): string {
    const rolLower = (profile.rol || '').toLowerCase();
    const nivelLower = (profile.nivel || '').toLowerCase();
    const cargoLower = (profile.cargo_titulo || '').toLowerCase();

    // Combinar rol y cargo para análisis
    const combinedText = `${rolLower} ${cargoLower}`;

    // Verificar si es C-Level
    if (C_LEVEL_PATTERNS.some(pattern => combinedText.includes(pattern))) {
      return 'c-level';
    }

    // Verificar si es gerencia/management
    if (MANAGEMENT_PATTERNS.some(pattern => combinedText.includes(pattern))) {
      return 'gerencia';
    }

    // Verificar si es senior
    if (SENIOR_PATTERNS.some(pattern => combinedText.includes(pattern))) {
      return 'senior';
    }

    // Verificar por nivel explícito
    if (nivelLower.includes('ejecutivo') || nivelLower.includes('c-level')) {
      return 'c-level';
    }
    if (nivelLower.includes('gerencia') || nivelLower.includes('dirección') || nivelLower.includes('director')) {
      return 'gerencia';
    }
    if (nivelLower.includes('senior') || nivelLower.includes('especialista')) {
      return 'senior';
    }
    if (nivelLower.includes('junior') || nivelLower.includes('trainee') || nivelLower.includes('becario')) {
      return 'junior';
    }

    return 'profesional';
  }

  /**
   * Obtiene el multiplicador por tamaño de empresa
   */
  private static getCompanySizeMultiplier(tamanoEmpresa: UserProfile['tamano_empresa']): number {
    if (!tamanoEmpresa) return 1.0;

    const maxEmpleados = tamanoEmpresa.max_empleados;

    if (maxEmpleados === null) return 1.0;

    if (maxEmpleados <= 10) return COMPANY_SIZE_MULTIPLIERS['micro'];
    if (maxEmpleados <= 50) return COMPANY_SIZE_MULTIPLIERS['pequeña'];
    if (maxEmpleados <= 200) return COMPANY_SIZE_MULTIPLIERS['mediana'];
    if (maxEmpleados <= 1000) return COMPANY_SIZE_MULTIPLIERS['grande'];
    return COMPANY_SIZE_MULTIPLIERS['corporativa'];
  }

  /**
   * Obtiene el multiplicador por área
   */
  private static getAreaMultiplier(area: string | null): number {
    if (!area) return 1.0;

    const areaLower = area.toLowerCase();

    for (const [key, multiplier] of Object.entries(AREA_MULTIPLIERS)) {
      if (areaLower.includes(key)) {
        return multiplier;
      }
    }

    return AREA_MULTIPLIERS['default'];
  }

  /**
   * Determina el tipo de sesión recomendada basado en tiempo disponible
   */
  private static determineRecommendedSessionType(dailyMinutesMax: number): 'short' | 'medium' | 'long' {
    if (dailyMinutesMax <= 35) return 'short';
    if (dailyMinutesMax <= 60) return 'medium';
    return 'long';
  }

  /**
   * Genera una explicación de la estimación de disponibilidad
   */
  private static generateExplanation(
    profile: UserProfile,
    roleLevel: string,
    companySizeMultiplier: number,
    areaMultiplier: number
  ): string {
    const parts: string[] = [];

    // Explicación del rol
    const roleName = profile.rol || profile.cargo_titulo || 'profesional';
    const roleLevelNames: Record<string, string> = {
      'c-level': 'ejecutivo de alto nivel',
      'gerencia': 'nivel gerencial',
      'senior': 'profesional senior',
      'profesional': 'profesional',
      'junior': 'profesional en formación'
    };
    parts.push(`Como ${roleName} (${roleLevelNames[roleLevel] || 'profesional'})`);

    // Explicación del tamaño de empresa
    if (profile.tamano_empresa) {
      if (companySizeMultiplier > 1) {
        parts.push(`en una empresa ${profile.tamano_empresa.nombre.toLowerCase()}, tienes más flexibilidad de tiempo`);
      } else if (companySizeMultiplier < 1) {
        parts.push(`en una empresa ${profile.tamano_empresa.nombre.toLowerCase()}, el tiempo disponible puede ser más limitado`);
      }
    }

    // Explicación del área
    if (profile.area) {
      if (areaMultiplier > 1) {
        parts.push(`Tu área de ${profile.area} suele tener mayor flexibilidad para el aprendizaje`);
      } else if (areaMultiplier < 1) {
        parts.push(`Tu área de ${profile.area} típicamente tiene una agenda más demandante`);
      }
    }

    return parts.join('. ') + '.';
  }

  /**
   * Convierte minutos diarios a descripción legible
   */
  static formatDailyTime(minutes: number): string {
    if (minutes < 60) {
      return `${minutes} minutos`;
    }
    const hours = Math.floor(minutes / 60);
    const remainingMinutes = minutes % 60;
    if (remainingMinutes === 0) {
      return `${hours} hora${hours > 1 ? 's' : ''}`;
    }
    return `${hours}h ${remainingMinutes}min`;
  }

  /**
   * Convierte el tipo de sesión a descripción con rangos
   */
  static getSessionTypeDescription(type: 'short' | 'medium' | 'long'): { name: string; range: string } {
    const descriptions = {
      'short': { name: 'Sesión Corta', range: '20-35 minutos' },
      'medium': { name: 'Sesión Media', range: '45-60 minutos' },
      'long': { name: 'Sesión Larga', range: '75-120 minutos' }
    };
    return descriptions[type];
  }

  /**
   * Obtiene los rangos de tiempo para cada tipo de sesión
   */
  static getSessionTimeRanges(): Record<'short' | 'medium' | 'long', { min: number; max: number }> {
    return {
      'short': { min: 20, max: 35 },
      'medium': { min: 45, max: 60 },
      'long': { min: 75, max: 120 }
    };
  }
}
