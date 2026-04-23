import { useEffect } from 'react';

interface DocumentDragParams {
  isDraggingProgress: boolean;
  isDraggingVolume: boolean;
  setIsDraggingProgress: (value: boolean) => void;
  setIsDraggingVolume: (value: boolean) => void;
  updateProgress: (clientX: number) => void;
  updateVolume: (clientY: number) => void;
}

export function useCustomVideoPlayerDocumentDrag({
  isDraggingProgress,
  isDraggingVolume,
  setIsDraggingProgress,
  setIsDraggingVolume,
  updateProgress,
  updateVolume,
}: DocumentDragParams) {
  useEffect(() => {
    const handleMouseMove = (event: MouseEvent) => {
      if (isDraggingProgress) {
        event.preventDefault();
        updateProgress(event.clientX);
      }

      if (isDraggingVolume) {
        event.preventDefault();
        updateVolume(event.clientY);
      }
    };

    const handleMouseUp = () => {
      setIsDraggingProgress(false);
      setIsDraggingVolume(false);
    };

    if (isDraggingProgress || isDraggingVolume) {
      document.addEventListener('mousemove', handleMouseMove);
      document.addEventListener('mouseup', handleMouseUp);
      document.addEventListener('mouseleave', handleMouseUp);
    }

    return () => {
      document.removeEventListener('mousemove', handleMouseMove);
      document.removeEventListener('mouseup', handleMouseUp);
      document.removeEventListener('mouseleave', handleMouseUp);
    };
  }, [
    isDraggingProgress,
    isDraggingVolume,
    setIsDraggingProgress,
    setIsDraggingVolume,
    updateProgress,
    updateVolume,
  ]);
}
