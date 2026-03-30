/**
 * Servicio orquestador para construir contexto de LIA
 * Agrupa fragmentos de múltiples providers y construye el prompt final
 */

import type { ContextRequest, BuiltContext, ContextFragment } from '../types';
import type { LiaContextProvider } from '../providers/base/types';

export class ContextBuilderService {
  private static providers: LiaContextProvider[] = [];
  
  /**
   * Registra un provider de contexto
   */
  static registerProvider(provider: LiaContextProvider) {
    this.providers.push(provider);
    // Ordenar por prioridad (mayor primero)
    this.providers.sort((a, b) => b.priority - a.priority);
  }
  
  /**
   * Construye el contexto completo para LIA
   */
  static async buildContext(
    request: ContextRequest,
    basePrompt: string = ''
  ): Promise<BuiltContext> {
    const startTime = Date.now();
    let cacheHits = 0;
    let cacheMisses = 0;
    
    // 1. Obtener fragmentos de todos los providers relevantes
    const relevantProviders = this.providers.filter(p => 
      p.shouldInclude(request)
    );
    
    
    const fragmentPromises = relevantProviders.map(async (provider) => {
      const providerStartTime = Date.now();
      try {
        const fragment = await provider.getContext(request);
        const providerTime = Date.now() - providerStartTime;
        
        if (fragment) {
          // Por ahora no podemos distinguir hits/misses fácilmente sin modificar caché
          // En fase posterior se puede mejorar
          cacheMisses++;
          return fragment;
        }
        return null;
      } catch (error) {
        const providerTime = Date.now() - providerStartTime;
        console.error(`[ContextBuilder] Error en provider ${provider.name} (${providerTime}ms):`, error);
        return null;
      }
    });
    
    const fragments = (await Promise.all(fragmentPromises))
      .filter((f): f is ContextFragment => f !== null);
    
    // 2. Calcular tokens totales
    const totalTokens = fragments.reduce(
      (sum, f) => sum + f.tokens,
      0
    );
    
    // 3. Calcular tiempo de construcción
    const buildTime = Date.now() - startTime;
    
    
    return {
      basePrompt,
      fragments,
      totalTokens,
      metadata: {
        buildTime,
        cacheHits,
        cacheMisses,
        providersUsed: relevantProviders.map(p => p.name),
      },
    };
  }
  
  /**
   * Formatea el contexto como string para el prompt
   */
  static formatContextForPrompt(context: BuiltContext): string {
    let prompt = context.basePrompt;
    
    // Agregar fragmentos en orden de prioridad
    for (const fragment of context.fragments) {
      prompt += `\n\n## ${fragment.type.toUpperCase()}\n`;
      prompt += fragment.content;
    }
    
    return prompt;
  }
  
  /**
   * Obtiene lista de providers registrados
   */
  static getRegisteredProviders(): string[] {
    return this.providers.map(p => p.name);
  }
  
  /**
   * Limpia todos los providers registrados (útil para testing)
   */
  static clearProviders() {
    this.providers = [];
  }
}

