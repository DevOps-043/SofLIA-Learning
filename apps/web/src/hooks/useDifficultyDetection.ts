/**
 * 🔍 useDifficultyDetection Hook
 * 
 * Hook de React que monitorea continuamente la sesión rrweb del usuario
 * para detectar patrones de dificultad y disparar intervenciones proactivas de LIA.
 * 
 * Uso:
 * ```tsx
 * const { analysis, shouldShowHelp, dismissHelp } = useDifficultyDetection({
 *   workshopId: 'workshop-123',
 *   enabled: true,
 *   checkInterval: 30000, // 30 segundos
 *   onDifficultyDetected: (analysis) => {
 *     console.log('Dificultad detectada:', analysis);
 *   }
 * });
 * ```
 */

import { useEffect, useState, useCallback, useRef } from 'react';
import { sessionRecorder } from '../lib/rrweb/session-recorder';
import { evaluateRecordingGate } from '../lib/rrweb/recording-gate';
import { 
  DifficultyPatternDetector,
  type DifficultyAnalysis,
  type DetectionThresholds 
} from '../lib/rrweb/difficulty-pattern-detector';

export interface UseDifficultyDetectionOptions {
  /** ID del taller actual (opcional, para contexto) */
  workshopId?: string;
  
  /** ID de la actividad actual (opcional, para contexto) */
  activityId?: string;
  
  /** Si está habilitada la detección (default: true) */
  enabled?: boolean;
  
  /** Intervalo de chequeo en ms (default: 30000 = 30s) */
  checkInterval?: number;
  
  /** Umbrales personalizados de detección */
  thresholds?: Partial<DetectionThresholds>;
  
  /** Callback cuando se detecta dificultad */
  onDifficultyDetected?: (analysis: DifficultyAnalysis) => void;
  
  /** Callback cuando usuario acepta ayuda */
  onHelpAccepted?: (analysis: DifficultyAnalysis) => void;
  
  /** Callback cuando usuario rechaza ayuda */
  onHelpDismissed?: (analysis: DifficultyAnalysis) => void;
}

export interface UseDifficultyDetectionReturn {
  /** Análisis actual de dificultad (null si no hay problemas) */
  analysis: DifficultyAnalysis | null;
  
  /** Si se debe mostrar el diálogo de ayuda proactiva */
  shouldShowHelp: boolean;
  
  /** Función para aceptar la ayuda ofrecida */
  acceptHelp: () => void;
  
  /** Función para rechazar/dismissar la ayuda */
  dismissHelp: () => void;
  
  /** Función para resetear el detector */
  reset: () => void;
  
  /** Si el detector está activo */
  isActive: boolean;
}

export function useDifficultyDetection(
  options: UseDifficultyDetectionOptions = {}
): UseDifficultyDetectionReturn {
  const {
    workshopId,
    activityId,
    enabled = true,
    checkInterval = 30000, // 30 segundos
    thresholds,
    onDifficultyDetected,
    onHelpAccepted,
    onHelpDismissed
  } = options;

  const [analysis, setAnalysis] = useState<DifficultyAnalysis | null>(null);
  const [shouldShowHelp, setShouldShowHelp] = useState(false);
  const [isActive, setIsActive] = useState(false);
  
  const detectorRef = useRef<DifficultyPatternDetector | null>(null);
  const intervalRef = useRef<NodeJS.Timeout | null>(null);
  const lastInterventionTimeRef = useRef<number>(0);

  // Inicializar detector
  useEffect(() => {
    if (enabled && evaluateRecordingGate().allowed) {
      detectorRef.current = new DifficultyPatternDetector(thresholds);
      setIsActive(true);

    } else {
      setIsActive(false);
    }

    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
    };
  }, [enabled, thresholds, workshopId, activityId, checkInterval]);

  // Función de análisis
  const analyzeSession = useCallback(() => {
    if (!enabled || !detectorRef.current) return;

    try {
      const recordingDecision = evaluateRecordingGate();
      if (
        !recordingDecision.allowed ||
        !sessionRecorder.isActive() ||
        sessionRecorder.isPaused()
      ) {
        return;
      }

      // Capturar snapshot de la sesión actual
      const snapshot = sessionRecorder.captureSnapshot();
      
      if (!snapshot || snapshot.events.length === 0) {

        return;
      }

      // Analizar patrones de dificultad
      const currentAnalysis = detectorRef.current.detect(snapshot.events);

      // Si se debe intervenir y han pasado al menos 2 minutos desde última intervención
      const timeSinceLastIntervention = Date.now() - lastInterventionTimeRef.current;
      const minTimeBetweenInterventions = 2 * 60 * 1000; // 2 minutos

      if (currentAnalysis.shouldIntervene && timeSinceLastIntervention > minTimeBetweenInterventions) {
        setAnalysis(currentAnalysis);
        setShouldShowHelp(true);
        lastInterventionTimeRef.current = Date.now();

        // Llamar callback si existe
        if (onDifficultyDetected) {
          onDifficultyDetected(currentAnalysis);
        }
      }
    } catch (error) {
      console.error('❌ Error al analizar sesión:', error);
    }
  }, [enabled, onDifficultyDetected]);

  // Iniciar análisis periódico
  useEffect(() => {
    if (!enabled) return;
    if (!evaluateRecordingGate().allowed) return;

    // Análisis inicial después de 30 segundos
    const initialTimeout = setTimeout(() => {
      analyzeSession();
    }, checkInterval);

    // Análisis periódico
    intervalRef.current = setInterval(() => {
      analyzeSession();
    }, checkInterval);

    return () => {
      clearTimeout(initialTimeout);
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
    };
  }, [enabled, checkInterval, analyzeSession]);

  // Función para aceptar ayuda
  const acceptHelp = useCallback(() => {

    setShouldShowHelp(false);
    
    if (analysis && onHelpAccepted) {
      onHelpAccepted(analysis);
    }
  }, [analysis, onHelpAccepted]);

  // Función para rechazar ayuda
  const dismissHelp = useCallback(() => {

    setShouldShowHelp(false);
    setAnalysis(null);
    
    if (analysis && onHelpDismissed) {
      onHelpDismissed(analysis);
    }
  }, [analysis, onHelpDismissed]);

  // Función para resetear detector
  const reset = useCallback(() => {

    if (detectorRef.current) {
      detectorRef.current.reset();
    }
    setAnalysis(null);
    setShouldShowHelp(false);
    lastInterventionTimeRef.current = 0;
  }, []);

  return {
    analysis,
    shouldShowHelp,
    acceptHelp,
    dismissHelp,
    reset,
    isActive
  };
}
