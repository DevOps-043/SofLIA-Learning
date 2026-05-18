import { logger as techDebtLogger } from '@/lib/utils/logger'
/**
 * ContextBuilderService
 * 
 * Servicio principal que orquesta la construcción de contexto para LIA.
 * Coordina múltiples providers y combina sus fragmentos de contexto
 * de manera eficiente y priorizada.
 */

import type { 
  ContextFragment, 
  ContextBuildOptions,
  EnrichedMetadata 
} from '../types';
import { BaseContextProvider } from '../providers/base/BaseContextProvider';
import { PageContextProvider } from '../providers/page/PageContextProvider';
import { BugReportContextProvider } from '../providers/bug-report/BugReportContextProvider';
import { CourseContextProvider } from '../providers/course/CourseContextProvider';
import { UserContextProvider } from '../providers/user/UserContextProvider';
import { PlatformContextProvider } from '../providers/platform/PlatformContextProvider';
import { recordContextUsage } from './context-metrics.service';

/**
 * Configuración del builder de contexto
 */
interface ContextBuilderConfig {
  /** Máximo de tokens total permitido */
  maxTokens: number;
  /** Si debe incluir contexto de página */
  includePageContext: boolean;
  /** Si debe incluir contexto de bugs */
  includeBugContext: boolean;
  /** Si debe incluir contexto de usuario */
  includeUserContext: boolean;
  /** Si debe incluir contexto de plataforma */
  includePlatformContext: boolean;
  /** Si debe registrar métricas */
  enableMetrics: boolean;
}

const DEFAULT_CONFIG: ContextBuilderConfig = {
  maxTokens: 4000,
  includePageContext: true,
  includeBugContext: true,
  includeUserContext: true,
  includePlatformContext: true,
  enableMetrics: true
};

export class ContextBuilderService {
  private providers: BaseContextProvider[] = [];
  private config: ContextBuilderConfig;

  constructor(config: Partial<ContextBuilderConfig> = {}) {
    this.config = { ...DEFAULT_CONFIG, ...config };
    this.registerDefaultProviders();
  }

  /**
   * Registra los providers por defecto
   */
  private registerDefaultProviders() {
    // Registrar providers disponibles
    if (this.config.includePageContext) {
      this.providers.push(new PageContextProvider());
    }

    // Registrar provider de bugs
    if (this.config.includeBugContext) {
      this.providers.push(new BugReportContextProvider());
    }

    // Registrar provider de cursos
    this.providers.push(new CourseContextProvider());

    // Registrar provider de usuario
    if (this.config.includeUserContext) {
      this.providers.push(new UserContextProvider());
    }

    // Registrar provider de plataforma
    if (this.config.includePlatformContext) {
      this.providers.push(new PlatformContextProvider());
    }

    // Ordenar por prioridad (mayor primero)
    this.providers.sort((a, b) => b.priority - a.priority);
  }

  /**
   * Registra un provider adicional
   */
  registerProvider(provider: BaseContextProvider) {
    this.providers.push(provider);
    // Reordenar por prioridad
    this.providers.sort((a, b) => b.priority - a.priority);
  }

  /**
   * Construye el contexto completo para LIA
   * @param options - Opciones de construcción
   * @returns Contexto combinado como string
   */
  async buildContext(options: ContextBuildOptions): Promise<string> {
    const startTime = Date.now();
    const fragments: ContextFragment[] = [];
    const providersUsed: string[] = [];
    let totalTokens = 0;

    // Obtener fragmentos de cada provider relevante
    for (const provider of this.providers) {
      // Verificar si el provider debe incluirse
      if (!provider.shouldInclude(options.contextType)) {
        continue;
      }

      try {
        const fragment = await provider.getContext(options);
        
        if (fragment && fragment.content) {
          providersUsed.push(provider.name);
          
          // Verificar si tenemos espacio para este fragmento
          if (totalTokens + fragment.tokens <= this.config.maxTokens) {
            fragments.push(fragment);
            totalTokens += fragment.tokens;
          } else {
            // Intentar incluir una versión truncada
            const remainingTokens = this.config.maxTokens - totalTokens;
            if (remainingTokens > 100) { // Solo si hay espacio significativo
              const truncatedContent = this.truncateContent(
                fragment.content, 
                remainingTokens
              );
              fragments.push({
                ...fragment,
                content: truncatedContent,
                tokens: remainingTokens
              });
              totalTokens += remainingTokens;
            }
            break; // No hay más espacio
          }
        }
      } catch (error) {
        techDebtLogger.error(`Error en provider ${provider.name}:`, error);
        // Continuar con los demás providers
      }
    }

    // Registrar métricas si está habilitado
    if (this.config.enableMetrics) {
      const buildTimeMs = Date.now() - startTime;
      recordContextUsage({
        contextType: options.contextType,
        currentPage: options.currentPage,
        providersUsed,
        totalTokens,
        buildTimeMs,
        isBugReport: options.isBugReport || false,
        userId: options.userId,
        cached: false, // TODO: Implementar detección de cache
        fragmentCount: fragments.length
      });
    }

    // Combinar fragmentos en orden de prioridad
    return this.combineFragments(fragments);
  }

  /**
   * Construye contexto específico para reporte de bugs
   */
  async buildBugReportContext(
    userId?: string,
    currentPage?: string,
    enrichedMetadata?: EnrichedMetadata
  ): Promise<string> {
    return this.buildContext({
      userId,
      currentPage,
      contextType: 'bug-report',
      enrichedMetadata,
      isBugReport: true
    });
  }

  /**
   * Construye contexto general
   */
  async buildGeneralContext(
    userId?: string,
    currentPage?: string
  ): Promise<string> {
    return this.buildContext({
      userId,
      currentPage,
      contextType: 'general',
      isBugReport: false
    });
  }

  /**
   * Combina fragmentos de contexto en un solo string
   */
  private combineFragments(fragments: ContextFragment[]): string {
    if (fragments.length === 0) {
      return '';
    }

    // Ordenar por prioridad (ya deberían estar ordenados, pero por seguridad)
    const sorted = [...fragments].sort((a, b) => b.priority - a.priority);

    // Combinar con separadores
    return sorted.map(f => f.content).join('\n\n---\n\n');
  }

  /**
   * Trunca contenido para ajustarse a un límite de tokens
   */
  private truncateContent(content: string, maxTokens: number): string {
    const maxChars = maxTokens * 4;
    if (content.length <= maxChars) return content;

    // Intentar cortar en un punto lógico (fin de línea)
    const truncated = content.substring(0, maxChars);
    const lastNewline = truncated.lastIndexOf('\n');
    
    if (lastNewline > maxChars * 0.7) {
      return truncated.substring(0, lastNewline) + '\n...[contenido truncado]';
    }

    return truncated + '...[contenido truncado]';
  }

  /**
   * Obtiene estadísticas del builder
   */
  getStats() {
    return {
      registeredProviders: this.providers.length,
      providerNames: this.providers.map(p => p.name),
      maxTokens: this.config.maxTokens
    };
  }
}

// Instancia singleton para uso general
let defaultBuilder: ContextBuilderService | null = null;

/**
 * Obtiene la instancia por defecto del builder
 */
export function getContextBuilder(): ContextBuilderService {
  if (!defaultBuilder) {
    defaultBuilder = new ContextBuilderService();
  }
  return defaultBuilder;
}

/**
 * Función de conveniencia para construir contexto
 */
export async function buildLiaContext(
  options: ContextBuildOptions
): Promise<string> {
  const builder = getContextBuilder();
  return builder.buildContext(options);
}

