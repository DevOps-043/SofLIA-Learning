/**
 * ContextMetricsService
 * 
 * Servicio para registrar y analizar métricas sobre el uso del contexto de LIA.
 * Permite entender qué contexto es más útil y optimizar el sistema.
 */

/**
 * Métrica individual de uso de contexto
 */
interface ContextUsageMetric {
  timestamp: Date;
  contextType: string;
  pageType?: string;
  currentPage?: string;
  providersUsed: string[];
  totalTokens: number;
  buildTimeMs: number;
  isBugReport: boolean;
  userId?: string;
  cached: boolean;
  fragmentCount: number;
}

/**
 * Estadísticas agregadas
 */
interface ContextStats {
  totalRequests: number;
  averageTokens: number;
  averageBuildTime: number;
  cacheHitRate: number;
  providerUsageCount: Record<string, number>;
  contextTypeCount: Record<string, number>;
  pageTypeCount: Record<string, number>;
  bugReportCount: number;
  lastUpdated: Date;
}

/**
 * Almacenamiento en memoria de métricas (para producción usar BD)
 */
const metricsStore: ContextUsageMetric[] = [];
const MAX_METRICS = 1000; // Mantener últimas 1000 métricas

/**
 * Servicio de métricas de contexto
 */
export class ContextMetricsService {
  private static instance: ContextMetricsService;
  private sessionStart: Date;
  private sessionMetrics: ContextUsageMetric[] = [];

  constructor() {
    this.sessionStart = new Date();
  }

  /**
   * Obtiene la instancia singleton
   */
  static getInstance(): ContextMetricsService {
    if (!ContextMetricsService.instance) {
      ContextMetricsService.instance = new ContextMetricsService();
    }
    return ContextMetricsService.instance;
  }

  /**
   * Registra una métrica de uso de contexto
   */
  recordUsage(metric: Omit<ContextUsageMetric, 'timestamp'>): void {
    const fullMetric: ContextUsageMetric = {
      ...metric,
      timestamp: new Date()
    };

    // Agregar a store global
    metricsStore.push(fullMetric);
    
    // Mantener límite de métricas
    if (metricsStore.length > MAX_METRICS) {
      metricsStore.shift();
    }

    // Agregar a métricas de sesión
    this.sessionMetrics.push(fullMetric);

    // Log para debugging (en producción, enviar a analytics)
    if (process.env.NODE_ENV === 'development') {
    }
  }

  /**
   * Obtiene estadísticas agregadas
   */
  getStats(): ContextStats {
    if (metricsStore.length === 0) {
      return this.emptyStats();
    }

    const totalRequests = metricsStore.length;
    const totalTokens = metricsStore.reduce((sum, m) => sum + m.totalTokens, 0);
    const totalBuildTime = metricsStore.reduce((sum, m) => sum + m.buildTimeMs, 0);
    const cachedCount = metricsStore.filter(m => m.cached).length;
    const bugReportCount = metricsStore.filter(m => m.isBugReport).length;

    // Contar uso de providers
    const providerUsageCount: Record<string, number> = {};
    metricsStore.forEach(m => {
      m.providersUsed.forEach(p => {
        providerUsageCount[p] = (providerUsageCount[p] || 0) + 1;
      });
    });

    // Contar tipos de contexto
    const contextTypeCount: Record<string, number> = {};
    metricsStore.forEach(m => {
      contextTypeCount[m.contextType] = (contextTypeCount[m.contextType] || 0) + 1;
    });

    // Contar tipos de página
    const pageTypeCount: Record<string, number> = {};
    metricsStore.forEach(m => {
      if (m.pageType) {
        pageTypeCount[m.pageType] = (pageTypeCount[m.pageType] || 0) + 1;
      }
    });

    return {
      totalRequests,
      averageTokens: Math.round(totalTokens / totalRequests),
      averageBuildTime: Math.round(totalBuildTime / totalRequests),
      cacheHitRate: (cachedCount / totalRequests) * 100,
      providerUsageCount,
      contextTypeCount,
      pageTypeCount,
      bugReportCount,
      lastUpdated: new Date()
    };
  }

  /**
   * Obtiene estadísticas de la sesión actual
   */
  getSessionStats(): ContextStats & { sessionDuration: number } {
    const baseStats = this.calculateStatsFromMetrics(this.sessionMetrics);
    const sessionDuration = Date.now() - this.sessionStart.getTime();
    
    return {
      ...baseStats,
      sessionDuration
    };
  }

  /**
   * Obtiene el top de páginas con más uso de contexto
   */
  getTopPages(limit: number = 10): Array<{ page: string; count: number }> {
    const pageCounts: Record<string, number> = {};
    
    metricsStore.forEach(m => {
      if (m.currentPage) {
        pageCounts[m.currentPage] = (pageCounts[m.currentPage] || 0) + 1;
      }
    });

    return Object.entries(pageCounts)
      .map(([page, count]) => ({ page, count }))
      .sort((a, b) => b.count - a.count)
      .slice(0, limit);
  }

  /**
   * Obtiene métricas de rendimiento por provider
   */
  getProviderPerformance(): Record<string, { avgTokens: number; usagePercent: number }> {
    const providerStats: Record<string, { totalTokens: number; count: number }> = {};
    const totalRequests = metricsStore.length;

    metricsStore.forEach(m => {
      const tokensPerProvider = m.totalTokens / (m.providersUsed.length || 1);
      m.providersUsed.forEach(p => {
        if (!providerStats[p]) {
          providerStats[p] = { totalTokens: 0, count: 0 };
        }
        providerStats[p].totalTokens += tokensPerProvider;
        providerStats[p].count += 1;
      });
    });

    const result: Record<string, { avgTokens: number; usagePercent: number }> = {};
    for (const [provider, stats] of Object.entries(providerStats)) {
      result[provider] = {
        avgTokens: Math.round(stats.totalTokens / stats.count),
        usagePercent: (stats.count / totalRequests) * 100
      };
    }

    return result;
  }

  /**
   * Obtiene métricas de reportes de bugs
   */
  getBugReportStats(): {
    total: number;
    avgTokens: number;
    topPages: Array<{ page: string; count: number }>;
  } {
    const bugMetrics = metricsStore.filter(m => m.isBugReport);
    
    if (bugMetrics.length === 0) {
      return { total: 0, avgTokens: 0, topPages: [] };
    }

    const totalTokens = bugMetrics.reduce((sum, m) => sum + m.totalTokens, 0);
    
    const pageCounts: Record<string, number> = {};
    bugMetrics.forEach(m => {
      if (m.currentPage) {
        pageCounts[m.currentPage] = (pageCounts[m.currentPage] || 0) + 1;
      }
    });

    return {
      total: bugMetrics.length,
      avgTokens: Math.round(totalTokens / bugMetrics.length),
      topPages: Object.entries(pageCounts)
        .map(([page, count]) => ({ page, count }))
        .sort((a, b) => b.count - a.count)
        .slice(0, 5)
    };
  }

  /**
   * Limpia métricas antiguas
   */
  cleanup(olderThanMs: number = 24 * 60 * 60 * 1000): number {
    const cutoff = Date.now() - olderThanMs;
    const initialLength = metricsStore.length;
    
    // Filtrar métricas más nuevas que el cutoff
    const filtered = metricsStore.filter(m => m.timestamp.getTime() > cutoff);
    metricsStore.length = 0;
    metricsStore.push(...filtered);

    return initialLength - metricsStore.length;
  }

  /**
   * Reinicia métricas de sesión
   */
  resetSession(): void {
    this.sessionMetrics = [];
    this.sessionStart = new Date();
  }

  /**
   * Exporta métricas para análisis externo
   */
  exportMetrics(): ContextUsageMetric[] {
    return [...metricsStore];
  }

  /**
   * Calcula stats desde un array de métricas
   */
  private calculateStatsFromMetrics(metrics: ContextUsageMetric[]): ContextStats {
    if (metrics.length === 0) {
      return this.emptyStats();
    }

    const totalRequests = metrics.length;
    const totalTokens = metrics.reduce((sum, m) => sum + m.totalTokens, 0);
    const totalBuildTime = metrics.reduce((sum, m) => sum + m.buildTimeMs, 0);
    const cachedCount = metrics.filter(m => m.cached).length;
    const bugReportCount = metrics.filter(m => m.isBugReport).length;

    const providerUsageCount: Record<string, number> = {};
    metrics.forEach(m => {
      m.providersUsed.forEach(p => {
        providerUsageCount[p] = (providerUsageCount[p] || 0) + 1;
      });
    });

    const contextTypeCount: Record<string, number> = {};
    metrics.forEach(m => {
      contextTypeCount[m.contextType] = (contextTypeCount[m.contextType] || 0) + 1;
    });

    const pageTypeCount: Record<string, number> = {};
    metrics.forEach(m => {
      if (m.pageType) {
        pageTypeCount[m.pageType] = (pageTypeCount[m.pageType] || 0) + 1;
      }
    });

    return {
      totalRequests,
      averageTokens: Math.round(totalTokens / totalRequests),
      averageBuildTime: Math.round(totalBuildTime / totalRequests),
      cacheHitRate: (cachedCount / totalRequests) * 100,
      providerUsageCount,
      contextTypeCount,
      pageTypeCount,
      bugReportCount,
      lastUpdated: new Date()
    };
  }

  /**
   * Stats vacías
   */
  private emptyStats(): ContextStats {
    return {
      totalRequests: 0,
      averageTokens: 0,
      averageBuildTime: 0,
      cacheHitRate: 0,
      providerUsageCount: {},
      contextTypeCount: {},
      pageTypeCount: {},
      bugReportCount: 0,
      lastUpdated: new Date()
    };
  }
}

// Funciones helper para uso directo
export function recordContextUsage(
  metric: Omit<ContextUsageMetric, 'timestamp'>
): void {
  ContextMetricsService.getInstance().recordUsage(metric);
}

export function getContextStats(): ContextStats {
  return ContextMetricsService.getInstance().getStats();
}

export function getProviderPerformance(): Record<string, { avgTokens: number; usagePercent: number }> {
  return ContextMetricsService.getInstance().getProviderPerformance();
}









