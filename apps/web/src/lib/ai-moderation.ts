import OpenAI from 'openai';
import type { SupabaseClient } from '@supabase/supabase-js';

// Tipos
export interface AIModerationResult {
  isInappropriate: boolean;
  confidence: number; // 0.0 a 1.0
  categories: string[];
  reasoning: string;
  requiresHumanReview: boolean;
  processingTimeMs: number;
}

export interface ModerationCategory {
  hate: boolean;
  'hate/threatening': boolean;
  harassment: boolean;
  'harassment/threatening': boolean;
  'self-harm': boolean;
  'self-harm/intent': boolean;
  'self-harm/instructions': boolean;
  sexual: boolean;
  'sexual/minors': boolean;
  violence: boolean;
  'violence/graphic': boolean;
}

// Configuración
const OPENAI_API_KEY = process.env.OPENAI_API_KEY;
const OPENAI_MODEL = process.env.OPENAI_MODEL || 'gpt-4o-mini';
const AI_MODERATION_ENABLED = process.env.OPENAI_MODERATION_ENABLED === 'true';
const CONFIDENCE_THRESHOLD = parseFloat(process.env.AI_MODERATION_CONFIDENCE_THRESHOLD || '0.7');
const AUTO_BAN_THRESHOLD = parseFloat(process.env.AI_MODERATION_AUTO_BAN_THRESHOLD || '0.95');

// Cliente de OpenAI
let openai: OpenAI | null = null;

if (OPENAI_API_KEY) {
  openai = new OpenAI({
    apiKey: OPENAI_API_KEY,
  });
}

/**
 * Analiza contenido usando la API de Moderación de OpenAI
 */
export async function analyzeContentWithAI(
  content: string,
  context?: {
    contentType: 'post' | 'comment';
    userId: string;
    previousWarnings?: number;
  }
): Promise<AIModerationResult> {
  const startTime = Date.now();

  // Si la moderación AI está desactivada o no hay API key
  if (!AI_MODERATION_ENABLED || !openai) {
    return {
      isInappropriate: false,
      confidence: 0,
      categories: [],
      reasoning: 'AI moderation disabled',
      requiresHumanReview: false,
      processingTimeMs: Date.now() - startTime,
    };
  }

  try {
    // Usar la API de Moderación de OpenAI
    const moderationResponse = await openai.moderations.create({
      input: content,
    });

    const result = moderationResponse.results[0];
    const processingTimeMs = Date.now() - startTime;

    // Extraer categorías flaggeadas
    let flaggedCategories: string[] = [];
    let maxScore = 0;

    Object.entries(result.categories).forEach(([category, isFlagged]) => {
      if (isFlagged) {
        flaggedCategories.push(category);
        const score = result.category_scores[category as keyof typeof result.category_scores];
        if (score > maxScore) {
          maxScore = score;
        }
      }
    });

    // Si hay categorías flaggeadas, usar el score más alto
    let confidence = flaggedCategories.length > 0 ? maxScore : 0;
    let isInappropriate = result.flagged && confidence >= CONFIDENCE_THRESHOLD;

    // 🔍 ANÁLISIS DUAL: SIEMPRE ejecutar GPT en paralelo para máxima precisión
    // GPT detecta leetspeak, contexto, amenazas veladas que OpenAI puede perder
    
    try {
      const gptAnalysis = await analyzeContentWithGPT(content, context);
      
      
      // Usar el análisis más estricto (mayor confianza)
      if (gptAnalysis.confidence > confidence) {
        confidence = gptAnalysis.confidence;
        isInappropriate = gptAnalysis.isInappropriate;
        flaggedCategories = [...flaggedCategories, ...gptAnalysis.categories];
      } else if (gptAnalysis.isInappropriate && !isInappropriate) {
        // Si GPT dice que es inapropiado pero OpenAI no, confiar en GPT
        isInappropriate = true;
        flaggedCategories.push(...gptAnalysis.categories);
      }
      
    } catch (gptError) {
      // Si GPT falla, seguir solo con OpenAI
    }

    // Generar razonamiento basado en categorías
    let reasoning = '';
    if (result.flagged && flaggedCategories.length > 0) {
      reasoning = `Contenido flaggeado por: ${flaggedCategories.join(', ')}. Confianza: ${(confidence * 100).toFixed(1)}%`;
    } else {
      reasoning = 'Contenido apropiado según análisis de IA';
    }

    // Determinar si requiere revisión humana
    const requiresHumanReview = 
      isInappropriate && 
      confidence < AUTO_BAN_THRESHOLD &&
      confidence >= CONFIDENCE_THRESHOLD;


    return {
      isInappropriate,
      confidence,
      categories: flaggedCategories,
      reasoning,
      requiresHumanReview,
      processingTimeMs,
    };

  } catch (error) {
    
    // En caso de error, ser conservador y permitir el contenido
    // pero registrar para revisión manual
    return {
      isInappropriate: false,
      confidence: 0,
      categories: ['error'],
      reasoning: `Error en moderación AI: ${error instanceof Error ? error.message : 'Unknown error'}`,
      requiresHumanReview: true,
      processingTimeMs: Date.now() - startTime,
    };
  }
}

/**
 * Analiza contenido con análisis contextual avanzado usando GPT
 * (Alternativa más cara pero más precisa)
 */
export async function analyzeContentWithGPT(
  content: string,
  context?: {
    contentType: 'post' | 'comment';
    userId: string;
    previousWarnings?: number;
  }
): Promise<AIModerationResult> {
  const startTime = Date.now();

  if (!AI_MODERATION_ENABLED || !openai) {
    return {
      isInappropriate: false,
      confidence: 0,
      categories: [],
      reasoning: 'AI moderation disabled',
      requiresHumanReview: false,
      processingTimeMs: Date.now() - startTime,
    };
  }

  try {
    const systemPrompt = `Eres un moderador de contenido ULTRA-ESTRICTO para una comunidad educativa profesional. 
Tu objetivo es PROTEGER la comunidad detectando TODO contenido inapropiado, sin importar cómo esté escrito.

🚨 REGLAS DE DETECCIÓN CRÍTICA:

1. LEETSPEAK Y EVASIÓN:
   - mu3rt3, mue3te, mvrte = MUERTE (confianza: 0.95)
   - 1d10t4, idi0ta, 1d1ot4 = IDIOTA (confianza: 0.80)
   - dr0gas, dr0g4s, dr0gs = DROGAS (confianza: 0.95)
   - 3xpl0t4r, expl0tar = EXPLOTAR (confianza: 0.98)
   - m4t4r, m4tar, mvtar = MATAR (confianza: 0.95)
   - Cualquier letra reemplazada por número o símbolo similar

2. ABREVIATURAS Y SLANG:
   - csm, ctm, ptm = Groserías (confianza: 0.90)
   - hdp, hpt, hp = Insultos graves (confianza: 0.90)
   - wtf, stfu = Lenguaje ofensivo (confianza: 0.70)

3. AMENAZAS Y VIOLENCIA:
   - Torres gemelas, bomba, atentado = Terrorismo (confianza: 0.99)
   - Voy a + verbo violento = Amenaza (confianza: 0.95)
   - Referencias a armas + intención = Peligro (confianza: 0.95)

4. DROGAS E ILEGALIDADES:
   - Cualquier referencia a drogas ilegales (confianza: 0.90)
   - "Arriba las drogas" = Apología (confianza: 0.95)
   - Referencias a consumo o venta (confianza: 0.90)

5. INSULTOS Y ACOSO:
   - Insultos directos o indirectos (confianza: 0.75-0.90)
   - Lenguaje despectivo hacia personas (confianza: 0.80)
   - Burlas o humillaciones (confianza: 0.70)

6. DISCURSO DE ODIO:
   - Racismo, sexismo, homofobia (confianza: 0.90)
   - Lenguaje despectivo hacia grupos (confianza: 0.85)

⚡ INSTRUCCIONES ESPECIALES:
- Si detectas MÚLTIPLES categorías en un mensaje, suma +0.10 a la confianza
- Si encuentras amenazas + insultos + violencia = confianza mínima 0.95
- NUNCA consideres el contexto como excusa para lenguaje violento
- SIEMPRE detecta leetspeak como si fuera la palabra real

📊 FORMATO DE RESPUESTA:
Responde SOLO con JSON válido:
{
  "isInappropriate": boolean,
  "confidence": number (0.0 a 1.0),
  "categories": ["violence", "threats", "drugs", "harassment", "hate", etc.],
  "reasoning": "Explicación clara de por qué es inapropiado"
}`;

    const userPrompt = `Analiza este ${context?.contentType || 'contenido'} y determina si es apropiado:

━━━━━━━━━━━━━━━━━━━━━
CONTENIDO A ANALIZAR:
"${content}"
━━━━━━━━━━━━━━━━━━━━━

${context?.previousWarnings ? `⚠️ CONTEXTO: Este usuario tiene ${context.previousWarnings} advertencias previas por contenido inapropiado.\n` : ''}

INSTRUCCIONES:
1. Lee el contenido completo
2. Identifica TODAS las palabras ofensivas (incluso con números)
3. Detecta amenazas explícitas o implícitas
4. Evalúa el tono y la intención
5. Asigna confianza alta si encuentras múltiples problemas

Recuerda: Leetspeak y números NO son excusa. "mu3rt3" = "muerte"`;

    const completion = await openai.chat.completions.create({
      model: OPENAI_MODEL,
      messages: [
        { role: 'system', content: systemPrompt },
        { role: 'user', content: userPrompt },
      ],
      temperature: 0.1, // Muy bajo para respuestas más consistentes y estrictas
      max_tokens: 400,
      response_format: { type: 'json_object' },
    });

    const responseText = completion.choices[0]?.message?.content || '{}';
    const analysis = JSON.parse(responseText);

    const processingTimeMs = Date.now() - startTime;

    return {
      isInappropriate: analysis.isInappropriate || false,
      confidence: analysis.confidence || 0,
      categories: analysis.categories || [],
      reasoning: analysis.reasoning || 'Sin razón proporcionada',
      requiresHumanReview: 
        analysis.isInappropriate && 
        analysis.confidence < AUTO_BAN_THRESHOLD &&
        analysis.confidence >= CONFIDENCE_THRESHOLD,
      processingTimeMs,
    };

  } catch (error) {
    
    return {
      isInappropriate: false,
      confidence: 0,
      categories: ['error'],
      reasoning: `Error en moderación GPT: ${error instanceof Error ? error.message : 'Unknown error'}`,
      requiresHumanReview: true,
      processingTimeMs: Date.now() - startTime,
    };
  }
}

/**
 * Registra el análisis de IA en la base de datos
 */
export async function logAIModerationAnalysis(
  userId: string,
  contentType: 'post' | 'comment',
  contentId: string | null,
  content: string,
  result: AIModerationResult,
  supabase: SupabaseClient
): Promise<void> {
  try {
    
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { error } = await (supabase as unknown as { rpc: (fn: string, args: Record<string, unknown>) => Promise<{ error: unknown }> }).rpc('register_ai_moderation_analysis', {
      p_user_id: userId,
      p_content_type: contentType,
      p_content_id: contentId,
      p_content_text: content,
      p_is_flagged: result.isInappropriate,
      p_confidence_score: result.confidence,
      p_categories: JSON.stringify(result.categories),
      p_reasoning: result.reasoning,
      p_model_used: OPENAI_MODEL,
      p_api_response: null,
      p_processing_time_ms: result.processingTimeMs,
    });

    if (error) {
    }
  } catch (error) {
  }
}

/**
 * Verifica si el usuario debe ser baneado automáticamente
 * basado en el nivel de confianza de la IA
 */
export function shouldAutoBan(result: AIModerationResult): boolean {
  return result.isInappropriate && result.confidence >= AUTO_BAN_THRESHOLD;
}
