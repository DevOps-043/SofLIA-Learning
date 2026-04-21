// @vitest-environment jsdom

import { fireEvent, render, screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import { VideoPlayer } from '../VideoPlayer';

vi.mock('@/core/hooks/useMediaPlaybackPolicy', () => ({
  useMediaPlaybackPolicy: () => ({
    allowIframeAutoplay: false,
    nativeVideoPreload: 'none',
    pauseWhenHidden: true,
    pauseWhenOutsideViewport: true,
    shouldUseEmbedFacade: true,
  }),
}));

vi.mock('react-i18next', () => ({
  useTranslation: () => ({
    t: (key: string) => {
      if (key === 'media.tapToPlay') return 'Tap to play';
      if (key === 'media.videoPreview') return 'Video preview';
      return key;
    },
  }),
}));

describe('VideoPlayer embed facade', () => {
  it('does not mount a YouTube iframe until the user taps the facade', () => {
    render(
      <div className="h-64">
        <VideoPlayer
          playbackContext="lesson"
          title="Lesson video"
          videoProvider="youtube"
          videoProviderId="BPdRvEnrZA8"
        />
      </div>
    );

    expect(screen.queryByTitle('Lesson video')).not.toBeInTheDocument();

    fireEvent.click(screen.getByText('Tap to play'));

    const iframe = screen.getByTitle('Lesson video');
    expect(iframe).toBeInTheDocument();
    expect(iframe).toHaveAttribute('loading', 'lazy');
    expect(iframe.getAttribute('allow') ?? '').not.toContain('autoplay');
  });
});
