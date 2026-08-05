import { cleanup, render } from '@testing-library/react';
import { afterEach, describe, expect, it } from 'vitest';

import { FormattedContentRenderer } from '../FormattedContentRenderer';
import styles from '../../ActivitiesExperience.module.css';

/**
 * Regresión del fallo reportado en producción: las lecturas y reflexiones se
 * guardan como HTML enriquecido, y esa rama del lector devolvía el HTML tal cual
 * sin recibir siquiera el reloj del reproductor. El audio sonaba y ningún bloque
 * quedaba marcado, así que el alumno perdía por dónde iba la voz.
 */

const HTML_READING = [
  '<h2>Metodologías Ágiles</h2>',
  '<p>0123456789</p>',
  '<p>0123456789</p>',
  '<p>0123456789</p>',
].join('');

const HIGHLIGHT_CLASS = styles.readAlongBlock;

function blockAt(container: HTMLElement, index: number): Element {
  return container.querySelectorAll('h2, p')[index];
}

afterEach(cleanup);

describe('FormattedContentRenderer read-along (rich HTML)', () => {
  it('marks the block being read', () => {
    const { container } = render(
      <FormattedContentRenderer
        content={HTML_READING}
        currentTime={0}
        duration={40}
        isAudioActive
      />,
    );

    expect(blockAt(container, 0).className).toContain(HIGHLIGHT_CLASS);
  });

  it('moves the mark forward as the audio advances', () => {
    const { container, rerender } = render(
      <FormattedContentRenderer
        content={HTML_READING}
        currentTime={0}
        duration={40}
        isAudioActive
      />,
    );

    rerender(
      <FormattedContentRenderer
        content={HTML_READING}
        currentTime={39}
        duration={40}
        isAudioActive
      />,
    );

    expect(blockAt(container, 0).className).not.toContain(HIGHLIGHT_CLASS);
    expect(blockAt(container, 3).className).toContain(HIGHLIGHT_CLASS);
  });

  it('marks nothing while there is no playback', () => {
    const { container } = render(
      <FormattedContentRenderer
        content={HTML_READING}
        currentTime={0}
        duration={0}
        isAudioActive={false}
      />,
    );

    expect(container.querySelector(`.${HIGHLIGHT_CLASS}`)).toBeNull();
  });
});
