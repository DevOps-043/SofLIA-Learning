import { normalizeContentForRenderer } from '@/lib/course-content';

/**
 * Segmentación de lecturas: ÚNICA fuente de verdad compartida por el lector
 * (que renderiza y subraya por bloque), el reproductor de voz (que reproduce
 * segmento a segmento) y la pre-generación de audio (que sintetiza por
 * segmento). Mantener una sola función garantiza que el texto de cada segmento
 * sea idéntico en todos los consumidores → las claves de caché de audio
 * coinciden y el subrayado se alinea 1:1 con el audio que suena.
 */

export type FormattedContentItem = {
  content: string;
  type:
    | 'checklist'
    | 'example'
    | 'highlight'
    | 'list'
    | 'main-title'
    | 'paragraph'
    | 'section-title'
    | 'subsection-title';
  checked?: boolean;
};

export interface ReadingSegment {
  /** Índice del segmento, alineado 1:1 con el bloque renderizado. */
  index: number;
  /** Texto limpio que se sintetiza/lee en voz alta (puede ser '' → no se locuta). */
  text: string;
}

/** Contexto de síntesis por segmento (define el prompt/voz, ver gemini-tts-prompts). */
export type ReadingSegmentContext = 'reading' | 'reading_continuation';

export interface ReadingSpeechRequest extends ReadingSegment {
  context: ReadingSegmentContext;
}

const BLOCK_LEVEL_HTML_SELECTOR = 'p, li, h1, h2, h3, h4, h5, blockquote';

/** Detecta si el contenido es HTML enriquecido (mismo criterio que el lector). */
export function isHtmlReadingContent(raw: string): boolean {
  return /<[a-z][\s\S]*>/i.test(raw);
}

/**
 * Convierte el contenido (plano/markdown) en bloques tipados. Es la lógica que
 * el lector usa para renderizar; vive aquí para que la segmentación de audio y
 * el render compartan exactamente los mismos bloques (y por tanto los índices).
 */
export function buildFormattedContent(readingContent: string): FormattedContentItem[] {
  const lines = readingContent
    .split('\n')
    .map((line) => line.trim())
    .filter(Boolean);

  return lines.map((line, index, allLines) => {
    const checklistMatch = line.match(/^\[([\sxX])\]\s*(.+)$/);
    if (checklistMatch) {
      return {
        checked: checklistMatch[1].toLowerCase() === 'x',
        content: checklistMatch[2].trim(),
        type: 'checklist',
      } satisfies FormattedContentItem;
    }

    if (
      /^(Introducción|Introduccion|Cuerpo|Cierre|Conclusión|Conclusion|Resumen):?$/iu.test(line)
    ) {
      return { content: line.replace(/:$/, ''), type: 'main-title' } satisfies FormattedContentItem;
    }

    if (/^(\d+)[.)]\s+(.+)$/u.test(line) && line.length < 120) {
      return { content: line, type: 'subsection-title' } satisfies FormattedContentItem;
    }

    if (
      line.length < 90 &&
      /^[A-ZÁÉÍÓÚÑ][^.!?]*$/u.test(line) &&
      !line.includes(':') &&
      index < allLines.length - 1 &&
      (allLines[index + 1]?.length || 0) > 50
    ) {
      return { content: line, type: 'section-title' } satisfies FormattedContentItem;
    }

    if (/^Ejemplos?:?/iu.test(line) || /por ejemplo/iu.test(line)) {
      return { content: line, type: 'example' } satisfies FormattedContentItem;
    }

    if (
      (line.startsWith('"') && line.endsWith('"')) ||
      (line.startsWith("'") && line.endsWith("'"))
    ) {
      return { content: line.slice(1, -1), type: 'highlight' } satisfies FormattedContentItem;
    }

    if (/^[-*•]\s+/u.test(line)) {
      return { content: line.replace(/^[-*•]\s+/u, ''), type: 'list' } satisfies FormattedContentItem;
    }

    return { content: line, type: 'paragraph' } satisfies FormattedContentItem;
  });
}

/** Limpia los marcadores de markdown de un bloque para que la voz lea texto natural. */
export function toSpokenText(blockContent: string): string {
  return blockContent
    .replace(/<[^>]+>/g, ' ')
    .replace(/&amp;/g, '&').replace(/&lt;/g, '<').replace(/&gt;/g, '>')
    .replace(/&nbsp;/g, ' ').replace(/&quot;/g, '"')
    .replace(/^#{1,6}\s+/gm, '')
    .replace(/\*\*([^*]+)\*\*/g, '$1').replace(/__([^_]+)__/g, '$1')
    .replace(/([^*])\*([^*]+)\*([^*])/g, '$1$2$3')
    .replace(/`([^`]+)`/g, '$1')
    .replace(/\[([^\]]+)\]\([^)]+\)/g, '$1')
    .replace(/\s+/g, ' ')
    .trim();
}

function segmentPlainReading(raw: string): ReadingSegment[] {
  return buildFormattedContent(raw).map((block, index) => ({
    index,
    text: toSpokenText(block.content),
  }));
}

/**
 * Segmenta HTML enriquecido por bloque de nivel (p, li, h1–h5, blockquote), en
 * el MISMO orden que el lector resalta (`querySelectorAll`). Requiere DOM, así
 * que solo se usa en cliente; la pre-generación server-side omite HTML (ver
 * `canPregenerateReadingContent`) y el HTML se locuta on-demand.
 */
function segmentHtmlReadingFromDom(raw: string): ReadingSegment[] {
  if (typeof document === 'undefined') {
    return segmentHtmlReadingWithoutDom(raw);
  }

  const container = document.createElement('div');
  container.innerHTML = raw;
  const nodes = Array.from(container.querySelectorAll(BLOCK_LEVEL_HTML_SELECTOR));

  return nodes.map((node, index) => ({
    index,
    text: (node.textContent ?? '').replace(/\s+/g, ' ').trim(),
  }));
}

function segmentHtmlReadingWithoutDom(raw: string): ReadingSegment[] {
  const blockPattern = /<(p|li|h[1-6]|blockquote)\b[^>]*>([\s\S]*?)<\/\1>/giu;
  const segments: ReadingSegment[] = [];
  let match: RegExpExecArray | null;

  while ((match = blockPattern.exec(raw)) !== null) {
    const text = toSpokenText(match[2]);
    if (text) {
      segments.push({ index: segments.length, text });
    }
  }

  if (segments.length > 0) {
    return segments;
  }

  const fallbackText = toSpokenText(raw);
  return fallbackText ? [{ index: 0, text: fallbackText }] : [];
}

/**
 * Segmentos de una lectura, alineados 1:1 con los bloques que renderiza/subraya
 * el lector. Para HTML enriquecido fuera del navegador devuelve `[]`.
 */
export function segmentReadingContent(content: unknown): ReadingSegment[] {
  const raw = normalizeContentForRenderer(content);
  if (!raw.trim()) {
    return [];
  }

  return isHtmlReadingContent(raw)
    ? segmentHtmlReadingFromDom(raw)
    : segmentPlainReading(raw);
}

/**
 * La pre-generación server-side solo cubre contenido plano/markdown (segmentación
 * determinista sin DOM). El HTML enriquecido se locuta on-demand en cliente.
 */
export function canPregenerateReadingContent(content: unknown): boolean {
  const raw = normalizeContentForRenderer(content);
  if (!raw.trim()) return false;
  if (!isHtmlReadingContent(raw)) return true;
  return segmentHtmlReadingWithoutDom(raw).some((segment) => segment.text.length > 0);
}

/**
 * Asigna a cada segmento su contexto de síntesis: el PRIMER segmento con texto
 * usa `reading`; el resto `reading_continuation`. Los segmentos vacíos se marcan
 * pero no se locutan. Lo usan IDÉNTICAMENTE el reproductor (runtime) y la
 * pre-generación (server) para que las claves de caché de audio coincidan.
 */
export function buildReadingSpeechRequests(
  segments: ReadingSegment[],
): ReadingSpeechRequest[] {
  let spokenCount = 0;

  return segments.map((segment) => {
    if (!segment.text) {
      return { ...segment, context: 'reading_continuation' as const };
    }

    const context: ReadingSegmentContext =
      spokenCount === 0 ? 'reading' : 'reading_continuation';
    spokenCount += 1;
    return { ...segment, context };
  });
}
