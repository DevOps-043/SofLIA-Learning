/**
 * Opciones de configuración para el hook de tracking de video
 */
export interface VideoTrackingOptions {
    /** ID de la lección que se está viendo */
    lessonId: string;
    enrollmentId?: string | null;
    organizationId?: string | null;
    /** ID del tracking activo (opcional) */
    trackingId?: string;
    /** Callback para manejar errores */
    onError?: (error: Error) => void;
}

/**
 * Datos de respuesta del endpoint de resume
 */
export interface VideoResumeData {
    /** Posición en segundos donde se dejó el video */
    checkpointSeconds: number;
    /** Velocidad de reproducción guardada */
    playbackRate: number;
    /** Indica si el usuario ya ha visto este video anteriormente */
    hasWatched: boolean;
    /** Porcentaje de completitud del video (0-100) */
    completionPercentage: number;
    /** Estado del tracking */
    status?: 'not_started' | 'in_progress' | 'completed';
}

/**
 * Payload para actualizar el progreso del video
 */
export interface UpdateProgressPayload {
    /** ID de la lección */
    lessonId: string;
    enrollmentId?: string | null;
    organizationId?: string | null;
    /** ID del tracking (opcional) */
    trackingId?: string;
    /** Posición actual en segundos */
    checkpoint: number;
    /** Punto máximo alcanzado en segundos */
    maxReached: number;
    /** Duración total del video en segundos */
    totalDuration: number;
    /** Velocidad de reproducción */
    playbackRate: number;
}

/**
 * Respuesta del endpoint de update progress
 */
export interface UpdateProgressResponse {
    /** Indica si la operación fue exitosa */
    success: boolean;
    /** ID del tracking (útil si se creó uno nuevo) */
    trackingId?: string;
    /** Mensaje de error si falló */
    error?: string;
}
