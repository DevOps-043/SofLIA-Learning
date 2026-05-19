import { describe, expect, it } from 'vitest';
import {
  getEmbeddedLiaColors,
  getEmbeddedLiaModes,
  getEmbeddedLiaNavbarHeight,
  tokenizeEmbeddedLiaText,
} from '../embedded-lia-panel/service';

describe('embedded-lia-panel.service', () => {
  it('builds panel colors from theme styles', () => {
    const colors = getEmbeddedLiaColors(
      {
        accent_color: 'var(--color-legacy-112233)',
        secondary_button_color: 'var(--color-legacy-445566)',
        card_background: 'var(--color-legacy-778899)',
        text_color: 'var(--color-bg-light)',
      },
      { primary: 'var(--color-black)' }
    );

    expect(colors).toEqual({
      primary: 'var(--color-legacy-112233)',
      accent: 'var(--color-legacy-445566)',
      cardBg: 'var(--color-legacy-778899)',
      text: 'var(--color-bg-light)',
    });
  });

  it('uses dashboard navbar height and exposes default mode', () => {
    expect(getEmbeddedLiaNavbarHeight('/dashboard')).toBe('5rem');
    expect(getEmbeddedLiaModes({ primary: '#1', accent: '#2', cardBg: '#3', text: '#4' })[0].id).toBe('context');
  });

  it('tokenizes markdown links while preserving text', () => {
    expect(tokenizeEmbeddedLiaText('Visita [Cursos](/courses) ahora')).toEqual([
      { type: 'text', content: 'Visita ' },
      { type: 'link', content: 'Cursos', href: '/courses' },
      { type: 'text', content: ' ahora' },
    ]);
  });
});
