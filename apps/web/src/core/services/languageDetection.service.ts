import { logger as techDebtLogger } from '@/lib/utils/logger'
/**
 * Servicio de detección de idioma usando OpenAI
 * Detecta el idioma del contenido (es, en, pt) para determinar qué traducciones hacer
 */

import { SupportedLanguage } from '../i18n/i18n';
import { trackOpenAICall, calculateOpenAIMetadata } from '../../lib/openai/usage-monitor';
import { fetchWithCircuitBreaker } from '@/lib/resilience/circuit-breaker';

type DetectableLanguage = 'es' | 'en' | 'pt';

export class LanguageDetectionService {
  private static readonly OPENAI_API_KEY = process.env.OPENAI_API_KEY;
  private static readonly OPENAI_MODEL = process.env.OPENAI_MODEL || 'gpt-4o-mini';
  private static readonly OPENAI_BASE_URL = 'https://api.openai.com/v1/chat/completions';

  /**
   * Detecta el idioma de un texto usando OpenAI
   * Retorna 'es', 'en' o 'pt'
   */
  static async detectLanguage(text: string): Promise<DetectableLanguage> {
    if (!text || text.trim().length === 0) {

      return 'es';
    }

    if (!this.OPENAI_API_KEY) {
      techDebtLogger.warn('[LanguageDetectionService] ⚠️ OPENAI_API_KEY no configurada, usando detección básica');
      return this.detectLanguageBasic(text);
    }

    // Para textos muy cortos, usar detección básica (más rápido y económico)
    if (text.trim().length < 50) {

      return this.detectLanguageBasic(text);
    }

    try {

      const systemPrompt = `Eres un detector de idiomas especializado. Tu tarea es identificar el idioma del texto proporcionado.

Idiomas soportados:
- 'es' para español
- 'en' para inglés
- 'pt' para portugués brasileño

Responde ÚNICAMENTE con el código del idioma (es, en o pt), sin explicaciones ni texto adicional.`;

      const userPrompt = `¿Cuál es el idioma del siguiente texto? Responde solo con el código (es, en o pt).

Texto:
${text.substring(0, 1000)}${text.length > 1000 ? '...' : ''}`;

      const startTime = Date.now();
      const response = await fetchWithCircuitBreaker('openai-language-detection', this.OPENAI_BASE_URL, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${this.OPENAI_API_KEY}`,
        },
        body: JSON.stringify({
          model: this.OPENAI_MODEL,
          messages: [
            {
              role: 'system',
              content: systemPrompt
            },
            {
              role: 'user',
              content: userPrompt
            }
          ],
          temperature: 0.1, // Muy baja temperatura para respuestas precisas
          max_tokens: 10, // Solo necesitamos el código del idioma
        }),
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        techDebtLogger.error(`[LanguageDetectionService] ❌ Error de OpenAI API: ${response.status}`, errorData);
        // Fallback a detección básica
        return this.detectLanguageBasic(text);
      }

      const data = await response.json();
      const responseTime = Date.now() - startTime;
      
      // ✅ Registrar uso de OpenAI para detección de idioma
      if (data.usage) {
        await trackOpenAICall(calculateOpenAIMetadata(
          data.usage,
          this.OPENAI_MODEL,
          'language-detection',
          undefined, // No tenemos userId en este contexto
          responseTime
        ));
      }
      
      const detectedLang = data.choices[0]?.message?.content?.trim().toLowerCase() || 'es';

      // Validar que sea uno de los idiomas soportados
      if (detectedLang === 'es' || detectedLang === 'en' || detectedLang === 'pt') {

        return detectedLang as DetectableLanguage;
      } else {
        techDebtLogger.warn(`[LanguageDetectionService] ⚠️ Idioma detectado no válido: "${detectedLang}", usando detección básica`);
        return this.detectLanguageBasic(text);
      }
    } catch (error) {
      techDebtLogger.error('[LanguageDetectionService] ❌ Error detectando idioma con OpenAI:', error);
      // Fallback a detección básica
      return this.detectLanguageBasic(text);
    }
  }

  /**
   * Detección básica de idioma usando patrones (fallback cuando no hay OpenAI o para textos cortos)
   */
  private static detectLanguageBasic(text: string): DetectableLanguage {
    const lowerText = text.toLowerCase().trim();
    
    // Patrones específicos para inglés
    const englishPatterns = [
      /\b(the|a|an|is|are|was|were|this|that|these|those|you|your|we|they|their|what|how|where|when|why|can|could|would|should|will)\b/i,
      /^(what|how|where|when|why|can|could|would|should|tell|show|give|help|i want|i need|i'm|i am)\b/i,
    ];
    
    // Patrones específicos para portugués
    const portuguesePatterns = [
      /\b(você|vocês|eu|nós|eles|elas|o|a|os|as|um|uma|uns|umas|que|qual|quando|onde|como|por|para|com|sem|de|do|da|dos|das|em|no|na|nos|nas)\b/i,
      /^(o que|qual|quando|onde|como|por que|você|pode|pode me|me ajuda|preciso|quero|estou|sou|o que é|qual é)\b/i,
    ];
    
    // Contar coincidencias
    const englishScore = englishPatterns.reduce((score, pattern) => {
      const matches = lowerText.match(pattern);
      return score + (matches ? matches.length : 0);
    }, 0);
    
    const portugueseScore = portuguesePatterns.reduce((score, pattern) => {
      const matches = lowerText.match(pattern);
      return score + (matches ? matches.length : 0);
    }, 0);
    
    // Si hay más patrones de inglés
    if (englishScore > portugueseScore && englishScore > 2) {
      return 'en';
    }
    
    // Si hay más patrones de portugués
    if (portugueseScore > englishScore && portugueseScore > 2) {
      return 'pt';
    }
    
    // Por defecto, español
    return 'es';
  }

  /**
   * Detecta el idioma de múltiples textos y retorna el más común
   * Útil para detectar el idioma de un curso completo
   */
  static async detectLanguageFromMultipleTexts(texts: string[]): Promise<DetectableLanguage> {
    if (!texts || texts.length === 0) {
      return 'es';
    }

    // Filtrar textos vacíos
    const validTexts = texts.filter(t => t && t.trim().length > 0);
    
    if (validTexts.length === 0) {
      return 'es';
    }

    // Si solo hay un texto, detectar directamente
    if (validTexts.length === 1) {
      return await this.detectLanguage(validTexts[0]);
    }

    // Para múltiples textos, detectar cada uno y tomar el más común
    // Limitar a los primeros 5 textos para eficiencia
    const textsToCheck = validTexts.slice(0, 5);
    const detectedLanguages = await Promise.all(
      textsToCheck.map(text => this.detectLanguage(text))
    );

    // Contar ocurrencias
    const counts: Record<DetectableLanguage, number> = { es: 0, en: 0, pt: 0 };
    detectedLanguages.forEach(lang => {
      counts[lang]++;
    });

    // Retornar el idioma más común
    const mostCommon = Object.entries(counts).reduce((a, b) => 
      counts[a[0] as DetectableLanguage] > counts[b[0] as DetectableLanguage] ? a : b
    )[0] as DetectableLanguage;

    return mostCommon;
  }
}
