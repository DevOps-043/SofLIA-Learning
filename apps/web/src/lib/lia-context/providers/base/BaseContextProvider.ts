/**
 * BaseContextProvider
 * 
 * Clase base abstracta para todos los providers de contexto de LIA.
 * Los providers son responsables de construir fragmentos de contexto
 * específicos para diferentes situaciones (bugs, páginas, usuarios, etc.)
 */

import type { ContextFragment, ContextBuildOptions, EnrichedMetadata } from '../../types';

function isPromptUnsafeControlChar(char: string): boolean {
  const code = char.charCodeAt(0);
  return code <= 0x08 || code === 0x0b || code === 0x0c || (code >= 0x0e && code <= 0x1f) || code === 0x7f;
}

/**
 * Clase base abstracta para providers de contexto
 */
export abstract class BaseContextProvider {
  /** Nombre único del provider */
  abstract readonly name: string;
  
  /** Prioridad del provider (mayor = más importante) */
  abstract readonly priority: number;

  /**
   * Obtiene el fragmento de contexto para esta situación
   * @param options - Opciones de construcción de contexto
   * @returns Fragmento de contexto o null si no aplica
   */
  abstract getContext(options: ContextBuildOptions): Promise<ContextFragment | null>;

  /**
   * Determina si este provider debe incluirse dado el tipo de contexto
   * @param contextType - Tipo de contexto requerido
   * @returns true si el provider debe incluirse
   */
  abstract shouldInclude(contextType: string): boolean;

  /**
   * Estima el número de tokens de un texto
   * Aproximación: ~4 caracteres por token
   * @param text - Texto a estimar
   * @returns Número estimado de tokens
   */
  protected estimateTokens(text: string): number {
    return Math.ceil(text.length / 4);
  }

  /**
   * Trunca un texto para que no exceda un límite de tokens
   * @param text - Texto a truncar
   * @param maxTokens - Máximo de tokens permitidos
   * @returns Texto truncado si es necesario
   */
  protected truncateToTokens(text: string, maxTokens: number): string {
    const maxChars = maxTokens * 4;
    if (text.length <= maxChars) return text;
    return text.substring(0, maxChars - 3) + '...';
  }

  /**
   * Formatea una fecha para mostrar en el contexto
   * @param date - Fecha a formatear
   * @returns String formateado
   */
  protected formatDate(date: Date | string): string {
    const d = typeof date === 'string' ? new Date(date) : date;
    return d.toLocaleDateString('es-ES', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  }

  /**
   * Construye una sección de contexto con header
   * @param header - Título de la sección
   * @param content - Contenido de la sección
   * @returns Sección formateada
   */
  protected buildSection(header: string, content: string): string {
    return `## ${header}\n\n${content}`;
  }

  /**
   * Construye una lista de items
   * @param items - Items a listar
   * @param prefix - Prefijo para cada item (default: '- ')
   * @returns Lista formateada
   */
  protected buildList(items: string[], prefix: string = '- '): string {
    return items.map(item => `${prefix}${item}`).join('\n');
  }

  /**
   * Sanitiza contenido para evitar inyección en prompts
   * @param content - Contenido a sanitizar
   * @returns Contenido sanitizado
   */
  protected sanitize(content: string): string {
    // Eliminar caracteres de control
    let sanitized = Array.from(content).filter((char) => !isPromptUnsafeControlChar(char)).join('');
    // Limitar longitud excesiva
    if (sanitized.length > 10000) {
      sanitized = sanitized.substring(0, 10000) + '...[truncated]';
    }
    return sanitized;
  }

  /**
   * Extrae información relevante de metadata enriquecida
   * @param metadata - Metadata del cliente
   * @returns Resumen de metadata
   */
  protected extractMetadataSummary(metadata: EnrichedMetadata): string {
    const parts: string[] = [];

    if (metadata.viewport) {
      parts.push(`Viewport: ${metadata.viewport.width}x${metadata.viewport.height}`);
    }

    if (metadata.platform) {
      const platform = metadata.platform;
      parts.push(`Browser: ${platform.browser || 'Unknown'} ${platform.version || ''}`);
      parts.push(`OS: ${platform.os || 'Unknown'}`);
    }

    if (metadata.sessionDuration) {
      const minutes = Math.floor(metadata.sessionDuration / 60000);
      parts.push(`Sesión: ${minutes} minutos`);
    }

    if (metadata.errors && metadata.errors.length > 0) {
      parts.push(`Errores en sesión: ${metadata.errors.length}`);
    }

    return parts.join(' | ');
  }
}

/**
 * Tipo para el constructor de providers
 */
export type ContextProviderConstructor = new () => BaseContextProvider;
