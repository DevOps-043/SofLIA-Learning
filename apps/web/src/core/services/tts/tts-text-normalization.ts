/**
 * Normalización de pronunciación para la voz de SofLIA (chat y lecturas).
 *
 * Los motores TTS destrozan cuatro clases de texto, y cada una necesita un
 * tratamiento distinto:
 *
 *  1. MARCAS Y PRODUCTOS — nombres en inglés dentro de una frase en español.
 *     El motor los locuta con fonética española ("chat ge-pe-te-e") o los
 *     deletrea. Se reescriben con ortografía española que suene a la forma en
 *     que un hispanohablante los pronuncia realmente.
 *  2. SIGLAS — "IA" sale como un "iaaa" estirado, "RRHH" como ruido. Se expanden
 *     a su forma hablada.
 *  3. SÍMBOLOS Y MONEDA — "%" y "€" se omiten o se leen mal según el contexto.
 *     Se convierten a palabras.
 *  4. NÚMEROS CON TIPOGRAFÍA ESPAÑOLA — el punto de millar ("1.500") se
 *     interpreta como separador decimal a la inglesa y se locuta "uno punto
 *     quinientos". Se elimina para que el proveedor lea "mil quinientos".
 *
 * El resto de la conversión numérica (cifras a palabras, decimales, años) la
 * hace ElevenLabs con `apply_text_normalization: 'on'`; aquí solo se corrige lo
 * que el proveedor no puede saber: convenciones tipográficas del español y
 * nombres propios.
 *
 * INVARIANTES que deben mantenerse al añadir reglas:
 *  - IDEMPOTENCIA: `f(f(x)) === f(x)`. El texto de las lecturas se normaliza en
 *    la pregeneración y otra vez en la síntesis; si una regla no fuera
 *    idempotente, la clave de caché dejaría de coincidir y se re-sintetizaría
 *    audio ya pagado. Regla práctica: el reemplazo nunca debe volver a casar con
 *    su propio patrón.
 *  - ORDEN: las marcas van PRIMERO. Contienen subcadenas que las reglas de
 *    siglas y números casarían por error (p. ej. el "4" de "GPT-4").
 *  - ESPECIFICIDAD: patrones anclados en `\b` y sensibles a mayúsculas, para que
 *    "IA" nunca case dentro de "media" ni "industria".
 *
 * Solo español: las reescrituras fonéticas son específicas del idioma. En EN/PT
 * el texto se devuelve intacto (ver `normalizeTextForSpeech`).
 */

interface SpeechReplacement {
  readonly pattern: RegExp;
  readonly replacement: string;
}

/**
 * 1. MARCAS Y PRODUCTOS.
 *
 * Solo entran nombres que (a) aparecen en el contenido real de la plataforma y
 * (b) un motor español pronuncia mal. Los que ya suenan bien en español —
 * "Canva", "Gamma", "Atlas", "Excel", "Slack" — se dejan fuera a propósito:
 * cada regla es una oportunidad de falso positivo.
 *
 * Las grafías son aproximaciones fonéticas al español; conviene VALIDARLAS DE
 * OÍDO antes de dar por buena una nueva. Añadir una entrada aquí es la forma
 * correcta de arreglar un nombre mal locutado.
 */
const BRAND_PRONUNCIATIONS: readonly SpeechReplacement[] = [
  // La propia marca: sin esto el motor deletrea "Sof-L-I-A" o la parte y el
  // acento en "LIA" quedan al azar entre síntesis.
  { pattern: /\bSofLIA\b/g, replacement: 'Soflía' },
  { pattern: /\bChatGPT\b/g, replacement: 'Chat gepeté' },
  // "GPT-5", "GPT-4o" y "GPT" a secas. Va antes que el rango numérico para que
  // el guion de la versión no se convierta en " a ".
  { pattern: /\bGPT-?(\d)\b/g, replacement: 'gepeté $1' },
  { pattern: /\bGPT\b/g, replacement: 'gepeté' },
  { pattern: /\bNotebookLM\b/g, replacement: 'Notebook ele eme' },
  { pattern: /\bOpenAI\b/g, replacement: 'Open ei ai' },
  { pattern: /\bMidjourney\b/g, replacement: 'Midyérni' },
  { pattern: /\bCopilot\b/g, replacement: 'Copáilot' },
  { pattern: /\bGemini\b/g, replacement: 'Yémini' },
  { pattern: /\bClaude\b/g, replacement: 'Clod' },
  { pattern: /\bPowerPoint\b/g, replacement: 'Pauer point' },
  { pattern: /\bHubSpot\b/g, replacement: 'Jab spot' },
  { pattern: /\bZapier\b/g, replacement: 'Sapíer' },
  { pattern: /\bLinkedIn\b/g, replacement: 'Linkedín' },
  { pattern: /\bWhatsApp\b/g, replacement: 'Guatsap' },
  { pattern: /\bYouTube\b/g, replacement: 'Yutub' },
  { pattern: /\bSCORM\b/g, replacement: 'Escorm' },
  // "n8n" se deletrea fatal en cualquier motor.
  { pattern: /\bn8n\b/g, replacement: 'ene ocho ene' },
];

/**
 * 2. SIGLAS.
 *
 * Se expanden a español hablado. Las siglas anglosajonas se transcriben como
 * las dice un hispanohablante, NO se traducen a palabras inglesas: meter
 * "business to business" en una frase en español hace que el motor lo lea con
 * fonética española ("bu-si-ness"), que es justo el problema que se quería
 * evitar.
 */
const ACRONYM_REPLACEMENTS: readonly SpeechReplacement[] = [
  { pattern: /\bRR\.?\s?HH\.?/g, replacement: 'recursos humanos' },
  { pattern: /\bTIC\b/g, replacement: 'tecnologías de la información' },
  { pattern: /\bIA\b/g, replacement: 'inteligencia artificial' },
  { pattern: /\bML\b/g, replacement: 'aprendizaje automático' },
  { pattern: /\bKPIs\b/g, replacement: 'indicadores clave de desempeño' },
  { pattern: /\bKPI\b/g, replacement: 'indicador clave de desempeño' },
  { pattern: /\bROI\b/g, replacement: 'retorno de inversión' },
  { pattern: /\bB2B\b/g, replacement: 'bi tu bi' },
  { pattern: /\bB2C\b/g, replacement: 'bi tu ci' },
  { pattern: /\bPYMEs\b/g, replacement: 'pymes' },
  { pattern: /\bLLM\b/g, replacement: 'ele ele eme' },
  { pattern: /\bAPI\b/g, replacement: 'apí' },
  { pattern: /\bURL\b/g, replacement: 'úrl' },
  { pattern: /\bPDF\b/g, replacement: 'pe de efe' },
  { pattern: /\bCEO\b/g, replacement: 'ce e o' },
  { pattern: /\bCFO\b/g, replacement: 'ce efe o' },
  { pattern: /\bCTO\b/g, replacement: 'ce te o' },
  { pattern: /\bIVA\b/g, replacement: 'i ve a' },
];

/**
 * 3. SÍMBOLOS Y MONEDA.
 *
 * El "$" a secas se deja INTACTO deliberadamente: sin saber el país no se puede
 * decidir entre "pesos" y "dólares", y equivocarse de moneda en material
 * formativo es peor que una locución algo torpe. Los códigos ISO sí son
 * inequívocos y se expanden.
 */
const SYMBOL_REPLACEMENTS: readonly SpeechReplacement[] = [
  // Cubre "3,03 %", "3,03%" y "%" suelto. El espacio previo se absorbe para no
  // dejar doble espacio.
  { pattern: /\s*%/g, replacement: ' por ciento' },
  { pattern: /(\d)\s*€/g, replacement: '$1 euros' },
  // El símbolo antepuesto ("€250") debe arrastrar el número COMPLETO al otro
  // lado, no solo su primer dígito.
  { pattern: /€\s*(\d[\d.,]*)/g, replacement: '$1 euros' },
  { pattern: /\bEUR\b/g, replacement: 'euros' },
  { pattern: /\bUSD\b/g, replacement: 'dólares' },
  { pattern: /US\$/g, replacement: 'dólares' },
  { pattern: /\bMXN\b/g, replacement: 'pesos mexicanos' },
  // Indicador ordinal/numeral: "n.º 4", "nº 4". No se toca "No." porque
  // colisiona con el adverbio "no" al final de una frase.
  { pattern: /\bn\.?[º°]\s*/gi, replacement: 'número ' },
];

/**
 * 4. NÚMEROS CON TIPOGRAFÍA ESPAÑOLA.
 *
 * La coma decimal ("3,03") se deja tal cual: con `language_code: 'es'` el
 * proveedor ya la lee como "coma". Lo que no puede resolver es el punto de
 * millar, indistinguible de un decimal a la inglesa.
 */
const NUMBER_REPLACEMENTS: readonly SpeechReplacement[] = [
  // Punto de millar: solo cuando le siguen EXACTAMENTE tres dígitos y luego algo
  // que no es dígito. Así "1.500" → "1500" pero "3.14" o "v2.5" quedan intactos.
  // El flag global re-aplica la regla en "1.234.567".
  { pattern: /(\d)\.(?=\d{3}(?:\D|$))/g, replacement: '$1' },
  // Rangos de años: "2020-2026" → "2020 a 2026". Limitado a cuatro dígitos por
  // lado para no romper fechas ("12-03-2026") ni teléfonos.
  { pattern: /\b(\d{4})\s*[-–—]\s*(\d{4})\b/g, replacement: '$1 a $2' },
];

/**
 * Etapas en orden de aplicación. Las marcas primero (ver INVARIANTES).
 */
const NORMALIZATION_STAGES: readonly (readonly SpeechReplacement[])[] = [
  BRAND_PRONUNCIATIONS,
  ACRONYM_REPLACEMENTS,
  SYMBOL_REPLACEMENTS,
  NUMBER_REPLACEMENTS,
];

/**
 * Reescribe marcas, siglas, símbolos y números al español hablado.
 *
 * Pura e idempotente. Solo actúa sobre `es`; en otros idiomas devuelve el texto
 * sin tocar, porque las reescrituras fonéticas y la tipografía numérica son
 * específicas del español.
 */
export function normalizeTextForSpeech(text: string, language: string = 'es'): string {
  if (!text) return text;
  if (language !== 'es') return text;

  let out = text;
  for (const stage of NORMALIZATION_STAGES) {
    for (const { pattern, replacement } of stage) {
      out = out.replace(pattern, replacement);
    }
  }

  // Los reemplazos con espacio absorbido ("%" → " por ciento") pueden dejar
  // dobles espacios cuando el símbolo ya venía separado.
  return out.replace(/[ \t]{2,}/g, ' ');
}
