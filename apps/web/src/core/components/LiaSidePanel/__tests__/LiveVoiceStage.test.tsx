import { renderToStaticMarkup } from 'react-dom/server';
import { describe, expect, it, vi } from 'vitest';

import { LiveVoiceStage } from '../LiveVoiceStage';
import type { LiaThemeColors } from '../types';

const themeColors: LiaThemeColors = {
  panelBg: 'var(--color-bg-light)',
  headerBg: 'var(--color-bg-light)',
  borderColor: 'var(--color-gray-200)',
  messageBubbleAssistant: 'var(--color-gray-100)',
  messageBubbleUser: 'var(--color-primary)',
  textPrimary: 'var(--color-gray-900)',
  textSecondary: 'var(--color-gray-500)',
  inputBg: 'var(--color-gray-50)',
  inputBorder: 'var(--color-gray-200)',
  accentColor: 'var(--color-accent)',
};

describe('LiveVoiceStage', () => {
  it('renders the voice-only stage without chat input text', () => {
    const html = renderToStaticMarkup(
      <LiveVoiceStage
        themeColors={themeColors}
        isLightTheme
        isConnecting={false}
        isAssistantSpeaking
        onStop={vi.fn()}
      />,
    );

    expect(html).toContain('data-testid="lia-live-voice-stage"');
    expect(html).toContain('alt="SofLIA"');
    expect(html).toContain('aria-label="Detener voz en vivo"');
    expect(html).not.toContain('Escribe un mensaje');
  });
});
