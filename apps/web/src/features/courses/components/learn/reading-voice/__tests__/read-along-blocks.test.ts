import { describe, expect, it } from 'vitest';

import {
  READ_ALONG_BLOCK_ATTRIBUTE,
  collectReadAlongBlocks,
} from '../read-along-blocks';
import { buildTimedSegments, getActiveSegmentIndex } from '../reading-highlight';

function render(html: string): HTMLElement {
  const container = document.createElement('div');
  container.innerHTML = html;
  return container;
}

describe('collectReadAlongBlocks', () => {
  it('reads rich HTML blocks in reading order', () => {
    const container = render(
      '<h2>Metodologías Ágiles</h2><p>El mapeo <strong>emerge</strong> como estrategia.</p><blockquote>Cita</blockquote>',
    );

    expect(collectReadAlongBlocks(container).map((block) => block.text)).toEqual([
      'Metodologías Ágiles',
      'El mapeo emerge como estrategia.',
      'Cita',
    ]);
  });

  /**
   * Un `<li>` con un `<p>` dentro coincide dos veces con el selector. Contar los
   * dos duplicaría esos caracteres y el subrayado se adelantaría a la voz.
   */
  it('counts a nested block only once, keeping the outer element', () => {
    const container = render('<ul><li><p>Sistemas biométricos</p></li></ul>');
    const blocks = collectReadAlongBlocks(container);

    expect(blocks).toHaveLength(1);
    expect(blocks[0].element.tagName).toBe('LI');
  });

  it('ignores blocks without spoken text', () => {
    const container = render('<p>Con texto</p><p></p><p>   </p>');

    expect(collectReadAlongBlocks(container)).toHaveLength(1);
  });

  /**
   * Las listas del lector de texto plano pintan la viñeta en su propio `span`.
   * Se descarta del peso porque la voz no la lee; contarla desplazaría el
   * subrayado un carácter por cada item.
   */
  it('recognises composed blocks and drops the bullet glyph', () => {
    const container = render(
      `<div ${READ_ALONG_BLOCK_ATTRIBUTE}><span>•</span><span>Multas millonarias</span></div>`,
    );

    expect(collectReadAlongBlocks(container).map((block) => block.text)).toEqual([
      'Multas millonarias',
    ]);
  });

  it('returns nothing when there is no container', () => {
    expect(collectReadAlongBlocks(null)).toEqual([]);
  });
});

/**
 * Regresión del fallo reportado: la lectura sonaba pero ningún bloque quedaba
 * marcado porque el lector de HTML enriquecido nunca calculaba el bloque activo.
 */
describe('read-along timeline over rich HTML', () => {
  const container = render(
    '<p>1234567890</p><p>1234567890</p><p>1234567890</p><p>1234567890</p>',
  );
  const blocks = collectReadAlongBlocks(container);
  const { segments, totalChars } = buildTimedSegments(
    blocks.map((block) => block.text),
  );

  it('advances the active block as the audio progresses', () => {
    expect(getActiveSegmentIndex(segments, totalChars, 0, 40)).toBe(0);
    expect(getActiveSegmentIndex(segments, totalChars, 15, 40)).toBe(1);
    expect(getActiveSegmentIndex(segments, totalChars, 25, 40)).toBe(2);
    expect(getActiveSegmentIndex(segments, totalChars, 40, 40)).toBe(3);
  });

  it('highlights nothing while the duration is still unknown', () => {
    expect(getActiveSegmentIndex(segments, totalChars, 0, 0)).toBe(-1);
  });
});
