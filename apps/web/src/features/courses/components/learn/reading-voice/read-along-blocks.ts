/**
 * Recolección de los bloques que se subrayan durante la lectura en voz alta.
 *
 * El audio de una lectura es UN solo MP3 (ver `buildFullReadingSpeechText`: une
 * el texto de todos los segmentos y sintetiza una única pista), así que no hay
 * marcas de tiempo por bloque. El bloque activo se estima repartiendo la
 * duración proporcionalmente a la longitud de cada bloque, igual que hace el
 * lector de texto plano.
 *
 * Para que esa estimación sea fiel al audio, la lista de bloques debe coincidir
 * con el texto que realmente se locutó. De ahí las dos reglas:
 *
 * 1. Solo bloques EXTERIORES. `querySelectorAll('p, li, …')` devuelve tanto un
 *    `<li>` como el `<p>` que contiene; contar los dos duplicaría esos
 *    caracteres y desplazaría el subrayado respecto a la voz.
 * 2. Sin bloques vacíos, porque la síntesis también los descarta
 *    (`.filter(Boolean)` antes de unir el texto).
 */

/**
 * Marca explícita para bloques que el lector compone con `div`/`span` (listas
 * con viñeta propia, pasos numerados, notas). Sin ella esos bloques quedarían
 * fuera del selector semántico y se saltarían al subrayar.
 */
export const READ_ALONG_BLOCK_ATTRIBUTE = 'data-read-along-block';

/** Mismo criterio de bloque que usa la segmentación de audio, más la marca explícita. */
export const READ_ALONG_BLOCK_SELECTOR = `p, li, h1, h2, h3, h4, h5, h6, blockquote, [${READ_ALONG_BLOCK_ATTRIBUTE}]`;

export interface ReadAlongBlock {
  element: HTMLElement;
  /** Texto normalizado; su longitud es el peso del bloque en la línea temporal. */
  text: string;
}

/**
 * Normaliza igual que la segmentación de audio, para que los pesos coincidan.
 * La viñeta de las listas compuestas se descarta porque no se locuta (el
 * segmentador la elimina también en `buildFormattedContent`).
 */
function normalizeBlockText(element: Element): string {
  return (element.textContent ?? '')
    .replace(/\s+/g, ' ')
    .trim()
    .replace(/^[-*•●○]\s*/u, '');
}

/**
 * Bloques subrayables de un contenedor ya renderizado, en orden de lectura.
 * Devuelve `[]` cuando no hay contenedor o no hay nada locutable.
 */
export function collectReadAlongBlocks(
  container: HTMLElement | null,
): ReadAlongBlock[] {
  if (!container) return [];

  const matched = Array.from(
    container.querySelectorAll<HTMLElement>(READ_ALONG_BLOCK_SELECTOR),
  );
  const matchedSet = new Set<HTMLElement>(matched);

  return matched
    .filter((element) => {
      const ancestorBlock = element.parentElement?.closest<HTMLElement>(
        READ_ALONG_BLOCK_SELECTOR,
      );
      return !(ancestorBlock && matchedSet.has(ancestorBlock));
    })
    .map((element) => ({ element, text: normalizeBlockText(element) }))
    .filter((block) => block.text.length > 0);
}
