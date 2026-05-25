import { useState } from 'react';
import { CONTENT_ZOOM_STEPS } from './activity-card.constants';

export function useActivityZoom() {
  const [contentZoom, setContentZoom] = useState(1);
  const canZoomIn = contentZoom < CONTENT_ZOOM_STEPS[CONTENT_ZOOM_STEPS.length - 1];
  const canZoomOut = contentZoom > CONTENT_ZOOM_STEPS[0];

  const zoomIn = () => {
    const currentIndex = CONTENT_ZOOM_STEPS.indexOf(contentZoom as typeof CONTENT_ZOOM_STEPS[number]);
    if (currentIndex < CONTENT_ZOOM_STEPS.length - 1) {
      setContentZoom(CONTENT_ZOOM_STEPS[currentIndex + 1]);
    }
  };

  const zoomOut = () => {
    const currentIndex = CONTENT_ZOOM_STEPS.indexOf(contentZoom as typeof CONTENT_ZOOM_STEPS[number]);
    if (currentIndex > 0) {
      setContentZoom(CONTENT_ZOOM_STEPS[currentIndex - 1]);
    }
  };

  return { canZoomIn, canZoomOut, contentZoom, zoomIn, zoomOut };
}
