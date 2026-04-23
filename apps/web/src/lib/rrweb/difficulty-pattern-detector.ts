/**
 * 🔍 Difficulty Pattern Detector
 * 
 * Analiza eventos de sesión rrweb en tiempo real para detectar patrones
 * que indican que el usuario está teniendo dificultades.
 * 
 * Patrones detectados:
 * - ⏱️ Inactividad prolongada
 * - 🔄 Ciclos repetitivos (volver atrás)
 * - ❌ Intentos fallidos consecutivos
 * - 📜 Scroll excesivo
 * - ⌨️ Borrado frecuente
 * - 🖱️ Clicks erróneos
 */

import type { eventWithTime } from '@rrweb/types';

export interface DifficultyPattern {
  type: 'inactivity' | 'repetitive_cycles' | 'failed_attempts' | 'excessive_scroll' | 'frequent_deletion' | 'erroneous_clicks';
  severity: 'low' | 'medium' | 'high';
  description: string;
  timestamp: number;
  metadata?: Record<string, unknown>;
}

export interface DetectionThresholds {
  inactivityThreshold: number; // ms (default: 120000 = 2 min)
  scrollRepeatThreshold: number; // times (default: 4)
  repetitiveCyclesThreshold: number; // times (default: 5)
  failedAttemptsThreshold: number; // times (default: 3)
  deleteKeysThreshold: number; // times (default: 10)
  erroneousClicksThreshold: number; // times (default: 5)
  analysisWindow: number; // ms (default: 180000 = 3 min)
}

export interface DifficultyAnalysis {
  overallScore: number; // 0-1
  patterns: DifficultyPattern[];
  shouldIntervene: boolean;
  interventionMessage: string;
  detectedAt: number;
}

const DEFAULT_THRESHOLDS: DetectionThresholds = {
  inactivityThreshold: 120000, // 2 minutos
  // Aumentado para evitar que la ayuda se dispare demasiado rápido al hacer scroll
  scrollRepeatThreshold: 8,
  // Umbral para detectar ciclos repetitivos (navegación entre secciones/backs)
  repetitiveCyclesThreshold: 8,
  failedAttemptsThreshold: 3,
  deleteKeysThreshold: 10,
  erroneousClicksThreshold: 5,
  analysisWindow: 180000 // 3 minutos
};

interface IncrementalEventData {
  source?: number;
  id?: string | number;
  key?: string;
  x?: number;
  y?: number;
}

function getIncrementalEventData(event: eventWithTime): IncrementalEventData | null {
  if (event.type !== 3 || !event.data || typeof event.data !== 'object') {
    return null;
  }

  return event.data as IncrementalEventData;
}

export class DifficultyPatternDetector {
  private thresholds: DetectionThresholds;
  private lastActivityTimestamp: number = Date.now();
  private scrollPositions: number[] = [];
  private clickTargets: string[] = [];
  private deleteKeyPresses: number = 0;
  private submitAttempts: number = 0;

  // 🆕 Timestamp de inicio de sesión para período de warm-up
  private sessionStartTime: number = Date.now();

  constructor(thresholds: Partial<DetectionThresholds> = {}) {
    this.thresholds = { ...DEFAULT_THRESHOLDS, ...thresholds };
  }

  /**
   * Analiza eventos recientes para detectar patrones de dificultad
   */
  public detect(events: eventWithTime[]): DifficultyAnalysis {
    const now = Date.now();
    const patterns: DifficultyPattern[] = [];

    // 🆕 FASE 1: Validación de Warm-Up (no intervenir en los primeros 45 segundos)
    // Esto evita falsos positivos cuando el usuario apenas está familiarizándose con la interfaz
    const sessionDuration = now - this.sessionStartTime;
    const warmUpPeriod = 45 * 1000; // 45 segundos

    if (sessionDuration < warmUpPeriod) {
      return this.createAnalysis(0, [], false, '');
    }

    // Filtrar eventos dentro de la ventana de análisis
    const recentEvents = this.filterRecentEvents(events, this.thresholds.analysisWindow);


    if (recentEvents.length === 0) {
      return this.createAnalysis(0, [], false, '');
    }

    // Detectar diferentes patrones
    const inactivityPattern = this.detectInactivity(recentEvents);
    if (inactivityPattern) patterns.push(inactivityPattern);

    const repetitiveCyclesPattern = this.detectRepetitiveCycles(recentEvents);
    if (repetitiveCyclesPattern) patterns.push(repetitiveCyclesPattern);

    const failedAttemptsPattern = this.detectFailedAttempts(recentEvents);
    if (failedAttemptsPattern) patterns.push(failedAttemptsPattern);

    const excessiveScrollPattern = this.detectExcessiveScroll(recentEvents);
    if (excessiveScrollPattern) patterns.push(excessiveScrollPattern);

    const frequentDeletionPattern = this.detectFrequentDeletion(recentEvents);
    if (frequentDeletionPattern) patterns.push(frequentDeletionPattern);

    const erroneousClicksPattern = this.detectErroneousClicks(recentEvents);
    if (erroneousClicksPattern) patterns.push(erroneousClicksPattern);

    // Calcular score general de dificultad
    const overallScore = this.calculateOverallScore(patterns);
    
    // Determinar si se debe intervenir
    const shouldIntervene = overallScore >= 0.6;
    
    // Generar mensaje de intervención
    const interventionMessage = shouldIntervene 
      ? this.generateInterventionMessage(patterns)
      : '';

    return this.createAnalysis(overallScore, patterns, shouldIntervene, interventionMessage);
  }

  /**
   * Filtra eventos dentro de la ventana de tiempo especificada
   */
  private filterRecentEvents(events: eventWithTime[], windowMs: number): eventWithTime[] {
    const now = Date.now();
    return events.filter(event => (now - event.timestamp) <= windowMs);
  }

  /**
   * Detecta inactividad prolongada
   * Solo considera eventos de INTERACCIÓN real del usuario (clicks, input, scroll)
   */
  private detectInactivity(events: eventWithTime[]): DifficultyPattern | null {
    if (events.length === 0) return null;

    // Filtrar solo eventos de interacción REAL del usuario
    const interactionEvents = events.filter(e => {
      // IncrementalSnapshot (type=3) con source específicos
      if (e.type === 3 && e.data && typeof e.data === 'object' && 'source' in e.data) {
        const source = getIncrementalEventData(e)?.source;
        // source: 2=MouseInteraction (clicks), 3=Scroll, 5=Input
        return source !== undefined && [2, 3, 5].includes(source);
      }
      return false;
    });

    const now = Date.now();
    
    if (interactionEvents.length === 0) {
      // Si no hay eventos de interacción en toda la ventana (3 min), usuario está MUY inactivo
      const oldestEventTime = events[0].timestamp;
      const timeSinceOldest = now - oldestEventTime;
      
      if (timeSinceOldest > this.thresholds.inactivityThreshold) {
        const minutes = Math.floor(timeSinceOldest / 60000);
        const seconds = Math.floor((timeSinceOldest % 60000) / 1000);

        return {
          type: 'inactivity',
          severity: timeSinceOldest > 180000 ? 'high' : 'medium',
          description: `Usuario inactivo por ${minutes} minuto${minutes !== 1 ? 's' : ''} y ${seconds} segundo${seconds !== 1 ? 's' : ''}`,
          timestamp: now,
          metadata: {
            inactivityDuration: timeSinceOldest,
            totalEvents: events.length,
            interactionEvents: 0,
            reason: 'no_interactions_in_window'
          }
        };
      }
      return null;
    }

    // Hay interacciones, verificar cuándo fue la última
    const lastInteraction = interactionEvents[interactionEvents.length - 1];
    const timeSinceLastActivity = now - lastInteraction.timestamp;

    if (timeSinceLastActivity > this.thresholds.inactivityThreshold) {
      const minutes = Math.floor(timeSinceLastActivity / 60000);
      const seconds = Math.floor((timeSinceLastActivity % 60000) / 1000);

      return {
        type: 'inactivity',
        severity: timeSinceLastActivity > 180000 ? 'high' : 'medium',
        description: `Usuario inactivo por ${minutes} minuto${minutes !== 1 ? 's' : ''} y ${seconds} segundo${seconds !== 1 ? 's' : ''}`,
        timestamp: now,
        metadata: {
          inactivityDuration: timeSinceLastActivity,
          lastInteractionType: getIncrementalEventData(lastInteraction)?.source,
          lastInteractionTime: new Date(lastInteraction.timestamp).toLocaleTimeString(),
          totalEvents: events.length,
          interactionEvents: interactionEvents.length,
          reason: 'long_time_since_last_interaction'
        }
      };
    }

    return null;
  }

  /**
   * Detecta ciclos repetitivos (usuario vuelve atrás repetidamente o cambia entre secciones)
   */
  private detectRepetitiveCycles(events: eventWithTime[]): DifficultyPattern | null {
    // Contar eventos de navegación hacia atrás o clicks en "anterior"
    const backNavigationEvents = events.filter(event => {
      if (event.type === 3) { // MouseInteraction
        const data = getIncrementalEventData(event);
        if (!data) return false;
        // Detectar clicks en botones de navegación
        if (data.source === 2) { // Click
          const target = data.id?.toString() || '';
          return target.includes('back') || target.includes('prev') || target.includes('anterior');
        }
      }
      return false;
    });

    // NUEVO: Detectar cambios frecuentes entre tabs/secciones
    // En rrweb, los IDs son numéricos internos, no IDs del DOM
    // Estrategia: detectar clicks repetidos alternando entre un conjunto pequeño de IDs
    const clickEvents = events.filter(event => {
      if (event.type === 3) { // MouseInteraction
        const data = getIncrementalEventData(event);
        if (!data) return false;
        return data.source === 2; // Solo clicks
      }
      return false;
    });

    // Extraer secuencia de IDs clickeados
    const clickedIds = clickEvents.map(e => getIncrementalEventData(e)?.id);

    // Detectar patrón de ciclos: si hay muchos clicks alternando entre pocos IDs únicos
    // Ejemplo: [177, 184, 192, 177, 184, 192] = cambio entre tabs
    const uniqueIds = new Set(clickedIds);
    const tabClickEvents: eventWithTime[] = [];
    let alternations = 0;
    
    // Si hay 5+ clicks alternando entre 3-15 elementos únicos = probable navegación entre tabs
    // (aumentado a 15 para capturar interfaces con múltiples tabs y botones)
    if (clickedIds.length >= 5 && uniqueIds.size >= 3 && uniqueIds.size <= 15) {
      // Verificar que hay alternancia real (no clicks en el mismo elemento)
      for (let i = 1; i < clickedIds.length; i++) {
        if (clickedIds[i] !== clickedIds[i - 1]) {
          alternations++;
          tabClickEvents.push(clickEvents[i]);
        }
      }
    }

    // Si hay suficientes cambios de tab/sección en la ventana de análisis, es un ciclo repetitivo
    const totalNavigationEvents = backNavigationEvents.length + alternations;
    const repetitionThreshold = this.thresholds.repetitiveCyclesThreshold ?? 5;

    if (totalNavigationEvents >= repetitionThreshold) {
      return {
        type: 'repetitive_cycles',
        severity: alternations >= (repetitionThreshold + 2) ? 'high' : 'medium',
        description: `Usuario ha cambiado entre secciones ${totalNavigationEvents} veces`,
        timestamp: Date.now(),
        metadata: {
          navigationCount: totalNavigationEvents,
          backNavigationCount: backNavigationEvents.length,
          tabChanges: alternations
        }
      };
    }

    return null;
  }

  /**
   * Detecta intentos fallidos consecutivos
   */
  private detectFailedAttempts(events: eventWithTime[]): DifficultyPattern | null {
    // Contar eventos de submit/enviar
    const submitEvents = events.filter(event => {
      if (event.type === 3) { // MouseInteraction
        const data = getIncrementalEventData(event);
        if (!data) return false;
        if (data.source === 2) { // Click
          const target = data.id?.toString() || '';
          return target.includes('submit') || target.includes('enviar') || target.includes('verify');
        }
      }
      return false;
    });

    // Si hay múltiples submits en poco tiempo, probablemente están fallando
    if (submitEvents.length >= this.thresholds.failedAttemptsThreshold) {
      // Verificar que no hay navegación exitosa después (eso indicaría éxito)
      const lastSubmit = submitEvents[submitEvents.length - 1];
      const eventsAfterLastSubmit = events.filter(e => e.timestamp > lastSubmit.timestamp);
      
      // Si hay pocos eventos después del último submit, probablemente sigue intentando
      if (eventsAfterLastSubmit.length < 10) {
        return {
          type: 'failed_attempts',
          severity: 'high',
          description: `${submitEvents.length} intentos fallidos detectados`,
          timestamp: Date.now(),
          metadata: {
            attemptCount: submitEvents.length
          }
        };
      }
    }

    return null;
  }

  /**
   * Detecta scroll excesivo (usuario busca información repetidamente)
   */
  private detectExcessiveScroll(events: eventWithTime[]): DifficultyPattern | null {
    // rrweb scroll events pueden ser:
    // - Type 3, source 0 (Scroll) - PERO en práctica son mutaciones
    // - Type 3, source 6 (ViewportResize) 
    // - Necesitamos buscar cambios en la posición del scroll de otra forma
    
    // CRÍTICO: Solo analizar si hay interacciones reales del usuario
    // Si no hay suficientes interacciones, el usuario está AFK y los eventos son solo ruido del DOM
    const interactionEvents = events.filter(event => {
      if (event.type !== 3) return false;
      const data = getIncrementalEventData(event);
      if (!data) return false;
      // Solo MouseMove, Click, o Input
      return data.source === 1 || data.source === 2 || data.source === 5;
    });
    
    // Requerir al menos 10 interacciones reales para considerar que hay actividad real del usuario
    if (interactionEvents.length < 10) {

      return null;
    }
    
    // Estrategia alternativa: contar eventos de mutación frecuentes como indicador de scroll
    const incrementalSnapshots = events.filter(event => event.type === 3);

    // Si hay muchos eventos incrementales en poco tiempo, probablemente hay scroll activo
    // Contar "ráfagas" de eventos (grupos de eventos muy juntos en tiempo)
    if (incrementalSnapshots.length < 100) {

      return null;
    }
    
    // Estrategia simplificada: detectar períodos de actividad intensa
    // Dividir los eventos en ventanas de 1 segundo y contar cuántas ventanas tienen actividad
    const timeWindows = new Map<number, number>(); // segundo -> cantidad de eventos
    
    incrementalSnapshots.forEach(event => {
      const second = Math.floor(event.timestamp / 1000);
      timeWindows.set(second, (timeWindows.get(second) || 0) + 1);
    });
    
    // Filtrar ventanas con actividad significativa (50+ eventos por segundo = scroll activo)
    const activeWindows = Array.from(timeWindows.entries())
      .filter((entry) => entry[1] >= 50)
      .map(([second, count]) => ({ second, count }))
      .sort((a, b) => a.second - b.second);
    
    // Detectar "cambios de dirección" = silencios entre períodos activos
    let directionChanges = 0;
    for (let i = 1; i < activeWindows.length; i++) {
      const gap = activeWindows[i].second - activeWindows[i - 1].second;
      // Si hay más de 2 segundos de silencio, considerarlo un cambio de dirección
      if (gap > 2) {
        directionChanges++;
      }
    }

    // 🛑 VALIDACIÓN CRÍTICA: Solo detectar si hay interacciones reales del usuario
    // Si no hay clicks, inputs, o teclas presionadas, no hay scroll intencional
    if (interactionEvents.length < 5) {

      return null;
    }

    // Detectar de dos formas:
    // 1. Cambios de dirección (scroll arriba-abajo-arriba)
    // 2. Volumen alto (15+ segundos de scroll continuo = usuario buscando algo)
    //    AUMENTADO de 8 a 15 para evitar falsos positivos
    const detectedByChanges = directionChanges >= this.thresholds.scrollRepeatThreshold;
    const detectedByVolume = activeWindows.length >= 15;

    if (detectedByChanges || detectedByVolume) {
      return {
        type: 'excessive_scroll',
        severity: 'medium',
        description: detectedByChanges 
          ? `Patrón de scroll repetitivo detectado (${directionChanges} cambios de dirección)`
          : `Scroll excesivo detectado (${activeWindows.length} segundos de actividad)`,
        timestamp: Date.now(),
        metadata: {
          scrollEventCount: incrementalSnapshots.length,
          directionChanges,
          activeWindows: activeWindows.length,
          detectionMethod: detectedByChanges ? 'direction_changes' : 'volume'
        }
      };
    }

    return null;
  }

  /**
   * Detecta borrado frecuente (usuario escribe y borra muchas veces)
   */
  private detectFrequentDeletion(events: eventWithTime[]): DifficultyPattern | null {
    // Contar eventos de teclado (backspace/delete)
    const keyboardEvents = events.filter(event => event.type === 3 && getIncrementalEventData(event)?.source === 5);
    
    let deleteCount = 0;
    
    keyboardEvents.forEach(event => {
      const data = getIncrementalEventData(event);
      if (!data) return;
      if (data.key === 'Backspace' || data.key === 'Delete') {
        deleteCount++;
      }
    });

    if (deleteCount >= this.thresholds.deleteKeysThreshold) {
      return {
        type: 'frequent_deletion',
        severity: 'medium',
        description: `Usuario ha borrado contenido ${deleteCount} veces`,
        timestamp: Date.now(),
        metadata: {
          deleteCount
        }
      };
    }

    return null;
  }

  /**
   * Detecta clicks erróneos (clicks en elementos que no responden)
   */
  private detectErroneousClicks(events: eventWithTime[]): DifficultyPattern | null {
    const clickEvents = events.filter(event => 
      event.type === 3 && getIncrementalEventData(event)?.source === 2
    );

    if (clickEvents.length < 5) return null;

    // Detectar clicks en el mismo lugar repetidamente (probablemente elemento no responde)
    const clickPositions = clickEvents.map(event => {
      const data = getIncrementalEventData(event);
      if (!data) return '0,0';
      return `${data.x || 0},${data.y || 0}`;
    });

    const repeatedClicks = clickPositions.filter((pos, idx) => 
      clickPositions.indexOf(pos) !== idx
    );

    if (repeatedClicks.length >= this.thresholds.erroneousClicksThreshold) {
      return {
        type: 'erroneous_clicks',
        severity: 'low',
        description: `${repeatedClicks.length} clicks repetidos en misma posición`,
        timestamp: Date.now(),
        metadata: {
          repeatedClickCount: repeatedClicks.length
        }
      };
    }

    return null;
  }

  /**
   * Calcula score general de dificultad (0-1)
   */
  private calculateOverallScore(patterns: DifficultyPattern[]): number {
    if (patterns.length === 0) return 0;

    const severityWeights = {
      low: 0.3,
      medium: 0.6,
      high: 1.0
    };

    const totalWeight = patterns.reduce((sum, pattern) => {
      return sum + severityWeights[pattern.severity];
    }, 0);

    // Normalizar entre 0 y 1
    const maxPossibleWeight = patterns.length * 1.0; // Todos high
    return Math.min(totalWeight / maxPossibleWeight, 1);
  }

  /**
   * Genera mensaje de intervención contextual
   */
  private generateInterventionMessage(patterns: DifficultyPattern[]): string {
    if (patterns.length === 0) return '';

    // Priorizar el patrón más severo
    const sortedPatterns = [...patterns].sort((a, b) => {
      const severityOrder = { high: 3, medium: 2, low: 1 };
      return severityOrder[b.severity] - severityOrder[a.severity];
    });

    const primaryPattern = sortedPatterns[0];

    const messages: Record<DifficultyPattern['type'], string> = {
      inactivity: '¡Hola! Noto que llevas un rato sin actividad. ¿Te gustaría que te dé algunas pistas sobre esta actividad?',
      repetitive_cycles: 'Veo que has vuelto atrás varias veces. ¿Te gustaría que revisemos juntos esta sección?',
      failed_attempts: 'He notado varios intentos. ¿Quieres que analice qué podría estar faltando en tu respuesta?',
      excessive_scroll: 'Parece que estás buscando información específica. ¿Puedo ayudarte a encontrar lo que necesitas?',
      frequent_deletion: 'Veo que estás ajustando tu respuesta varias veces. ¿Te gustaría revisar un ejemplo similar?',
      erroneous_clicks: 'Noto algunos clicks que no parecen estar funcionando. ¿Necesitas ayuda con la interfaz?'
    };

    return messages[primaryPattern.type];
  }

  /**
   * Crea objeto de análisis
   */
  private createAnalysis(
    score: number,
    patterns: DifficultyPattern[],
    shouldIntervene: boolean,
    message: string
  ): DifficultyAnalysis {
    return {
      overallScore: score,
      patterns,
      shouldIntervene,
      interventionMessage: message,
      detectedAt: Date.now()
    };
  }

  /**
   * Reset internal state (útil para testing)
   */
  public reset(): void {
    this.lastActivityTimestamp = Date.now();
    this.sessionStartTime = Date.now(); // 🆕 Resetear también el contador de sesión
    this.scrollPositions = [];
    this.clickTargets = [];
    this.deleteKeyPresses = 0;
    this.submitAttempts = 0;
  }
}

export const difficultyDetector = new DifficultyPatternDetector();
