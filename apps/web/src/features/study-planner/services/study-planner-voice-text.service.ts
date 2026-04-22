export type VoicePlaybackMode = 'enqueue' | 'replace' | 'interruptByUser';

export const STUDY_PLANNER_TTS_SUMMARY_FALLBACK =
  'Ya prepare un resumen breve de la respuesta.';

function numberToWords(num: number): string {
  const numbers: Record<number, string> = {
    0: 'cero', 1: 'uno', 2: 'dos', 3: 'tres', 4: 'cuatro', 5: 'cinco',
    6: 'seis', 7: 'siete', 8: 'ocho', 9: 'nueve', 10: 'diez',
    11: 'once', 12: 'doce', 13: 'trece', 14: 'catorce', 15: 'quince',
    16: 'dieciseis', 17: 'diecisiete', 18: 'dieciocho', 19: 'diecinueve', 20: 'veinte',
    21: 'veintiuno', 22: 'veintidos', 23: 'veintitres', 24: 'veinticuatro', 25: 'veinticinco',
    26: 'veintiseis', 27: 'veintisiete', 28: 'veintiocho', 29: 'veintinueve', 30: 'treinta',
  };

  if (numbers[num] !== undefined) {
    return numbers[num];
  }

  if (num < 100) {
    const tens = Math.floor(num / 10) * 10;
    const ones = num % 10;
    if (tens === 30 && ones > 0) return `treinta y ${numbers[ones] || ones}`;
    if (tens === 40 && ones > 0) return `cuarenta y ${numbers[ones] || ones}`;
    if (tens === 50 && ones > 0) return `cincuenta y ${numbers[ones] || ones}`;
  }

  return num.toString();
}

export function stripMarkdownForSpeech(text: string): string {
  return text
    .replace(/<action>[\s\S]*?<\/action>/gi, ' ')
    .replace(/```[\s\S]*?```/g, ' ')
    .replace(/`([^`]+)`/g, '$1')
    .replace(/!\[([^\]]*)\]\([^)]+\)/g, '$1')
    .replace(/\[([^\]]+)\]\([^)]+\)/g, '$1')
    .replace(/<[^>]+>/g, ' ')
    .replace(/^\s{0,3}#{1,6}\s+/gm, '')
    .replace(/^\s*>\s?/gm, '')
    .replace(/^\s*[-*+]\s+/gm, '')
    .replace(/^\s*\d+\.\s+/gm, '')
    .replace(/\|/g, ' ')
    .replace(/[*_~]/g, '')
    .replace(/\s+/g, ' ')
    .replace(/\s+([.,;:!?])/g, '$1')
    .trim();
}

function summarizeForAutoSpeech(text: string, maxCharacters = 280): string {
  const normalized = stripMarkdownForSpeech(text);
  if (!normalized) {
    return '';
  }

  const sentenceCount = normalized
    .split(/[.!?]+/)
    .map(sentence => sentence.trim())
    .filter(Boolean)
    .length;

  if (normalized.length > maxCharacters || sentenceCount >= 4) {
    const summarySentences = normalized
      .split(/(?<=[.!?])\s+/)
      .map((sentence) => sentence.trim())
      .filter(Boolean)
      .slice(0, 2);

    const spokenSummary = summarySentences.join(' ').trim();
    if (spokenSummary.length === 0) {
      return STUDY_PLANNER_TTS_SUMMARY_FALLBACK;
    }

    if (spokenSummary.length <= maxCharacters) {
      return spokenSummary;
    }

    return `${spokenSummary.slice(0, maxCharacters - 1).trimEnd()}.`;
  }

  return normalized;
}

export function buildStudyPlannerSpeechText(
  text: string,
  maxCharacters = 220,
): string {
  const normalized = stripMarkdownForSpeech(text);
  if (!normalized) {
    return '';
  }

  if (normalized.length <= maxCharacters) {
    return normalized;
  }

  const summarySentences = normalized
    .split(/(?<=[.!?])\s+/)
    .map((sentence) => sentence.trim())
    .filter(Boolean);

  const condensed = summarySentences
    .slice(0, 2)
    .join(' ')
    .trim();

  if (!condensed) {
    return STUDY_PLANNER_TTS_SUMMARY_FALLBACK;
  }

  if (condensed.length <= maxCharacters) {
    return condensed;
  }

  return `${condensed.slice(0, maxCharacters - 1).trimEnd()}.`;
}

export function formatTextForTTS(text: string): string {
  let formatted = summarizeForAutoSpeech(text);

  if (
    formatted.includes('Soy SofLIA')
    && formatted.includes('Planificador de Estudios')
    && formatted.includes('Tienes asignado el siguiente curso')
  ) {
    const courseMatch = formatted.match(/Curso:\s*([^\n]+)/i);
    const courseName = courseMatch ? courseMatch[1].trim() : 'tu curso asignado';

    formatted = [
      'Soy SofLIA, tu asistente de planificacion.',
      `He analizado tu perfil y veo que tienes asignado el curso de ${courseName}.`,
      'Te gustaria que programemos sesiones rapidas, normales o largas?',
    ].join(' ');
  }

  const processedMarkers = new Set<string>();

  formatted = formatted.replace(/(\d{1,2})\s*:\s*(\d{2})\s*(AM|PM|a\.m\.|p\.m\.)/gi, (match, hour, minute, period) => {
    const marker = `TIME_${match}`;
    if (processedMarkers.has(marker)) return match;
    processedMarkers.add(marker);

    const h = parseInt(hour, 10);
    const m = parseInt(minute, 10);
    const periodText = period.toLowerCase().includes('p') ? 'de la tarde' : 'de la manana';
    const hourText = numberToWords(h);

    if (m === 0) return `${hourText} ${periodText}`;
    return `${hourText} y ${numberToWords(m)} ${periodText}`;
  });

  formatted = formatted.replace(/(\d{1,2})\s+(AM|PM|a\.m\.|p\.m\.)/gi, (match, hour, period) => {
    const marker = `TIME2_${match}`;
    if (processedMarkers.has(marker)) return match;
    processedMarkers.add(marker);

    const h = parseInt(hour, 10);
    const periodText = period.toLowerCase().includes('p') ? 'de la tarde' : 'de la manana';
    return `${numberToWords(h)} ${periodText}`;
  });

  formatted = formatted.replace(/(\d{1,2})\s+de\s+(enero|febrero|marzo|abril|mayo|junio|julio|agosto|septiembre|octubre|noviembre|diciembre)/gi, (match, day, month) => {
    const marker = `DATE_${match}`;
    if (processedMarkers.has(marker)) return match;
    processedMarkers.add(marker);

    const parsedDay = parseInt(day, 10);
    const dayText = parsedDay === 1 ? 'primero' : numberToWords(parsedDay);
    return `${dayText} de ${month}`;
  });

  formatted = formatted.replace(/(\d+)%/g, (match, num) => {
    const marker = `PERCENT_${match}`;
    if (processedMarkers.has(marker)) return match;
    processedMarkers.add(marker);

    return `${numberToWords(parseInt(num, 10))} por ciento`;
  });

  formatted = formatted.replace(/\b(\d{1,2})\b/g, (match, num) => {
    const marker = `NUM_${match}`;
    if (processedMarkers.has(marker)) return match;

    const parsed = parseInt(num, 10);
    if (parsed <= 30 && parsed >= 0) {
      processedMarkers.add(marker);
      return numberToWords(parsed);
    }
    return match;
  });

  formatted = formatted.replace(/(\d{1,2})\.\s/g, (match, num) => {
    const parsed = parseInt(num, 10);
    if (parsed <= 30) return `${numberToWords(parsed)}. `;
    return match;
  });

  return formatted
    .replace(/\s+/g, ' ')
    .replace(/\s+([.,;:!?])/g, '$1')
    .replace(/([.,;:!?])\s*([.,;:!?])/g, '$1 $2')
    .trim();
}

export function resolveSpeechQueue(
  queue: string[],
  nextText: string,
  mode: VoicePlaybackMode,
): string[] {
  if (!nextText.trim()) {
    return mode === 'enqueue' ? [...queue] : [];
  }

  if (mode === 'enqueue') {
    return [...queue, nextText];
  }

  return [nextText];
}
