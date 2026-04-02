export function formatCourseDurationHours(totalMinutes: number): number {
  return Math.round((totalMinutes / 60) * 10) / 10;
}

export function getYouTubeID(url: string): string {
  const match = url.match(/(?:youtu\.be\/|youtube\.com\/(?:watch\?v=|embed\/|v\/))([^?&]+)/);
  return match?.[1] || url;
}

export function getVimeoID(url: string): string {
  const match = url.match(/vimeo\.com\/(\d+)/);
  return match?.[1] || url;
}

export function resolveVideoEmbedUrl(provider: string, providerId: string): string | null {
  if (!providerId) {
    return null;
  }

  if (provider === 'youtube') {
    return `https://www.youtube.com/embed/${getYouTubeID(providerId)}`;
  }

  if (provider === 'vimeo') {
    return `https://player.vimeo.com/video/${getVimeoID(providerId)}`;
  }

  return null;
}

const fieldLabels: Record<string, string> = {
  title: 'Título',
  description: 'Descripción',
  level: 'Nivel',
  category: 'Categoría',
  thumbnail_url: 'Imagen',
  module_title: 'Título del módulo',
  lesson_title: 'Título de la lección',
  video_provider_id: 'Video',
  duration_seconds: 'Duración (seg)',
  transcript_content: 'Transcripción',
  summary_content: 'Resumen',
};

export function getFieldLabel(field: string): string {
  return fieldLabels[field] || field;
}

export function truncateFieldValue(value: unknown, maxLength = 100): string {
  if (value === null || value === undefined) {
    return '(vacío)';
  }

  const stringValue = String(value);
  return stringValue.length > maxLength ? `${stringValue.substring(0, maxLength)}…` : stringValue;
}

export function parseMaterialContent(contentData: unknown): { error: string | null; parsedContent: unknown } {
  try {
    if (typeof contentData === 'string') {
      return {
        error: null,
        parsedContent: JSON.parse(contentData),
      };
    }

    return {
      error: null,
      parsedContent: contentData,
    };
  } catch {
    return {
      error: 'Error parsing content',
      parsedContent: null,
    };
  }
}
