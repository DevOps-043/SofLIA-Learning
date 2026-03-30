/**
 * Format Utilities
 * Pure date/time/status formatting helpers shared across services.
 * No external service dependencies — safe to import anywhere.
 */

// Module-level timezone that is set per-request via setCurrentTimezone()
let currentTimezone = 'America/Mexico_City'; // Default: México

export function setCurrentTimezone(tz: string) {
  currentTimezone = tz || 'America/Mexico_City';
}

export function getCurrentTimezone(): string {
  return currentTimezone;
}

// Función para obtener el offset de zona horaria (ej: "-06:00" para México, "-05:00" para Colombia)
export function getTimezoneOffset(timezone: string): string {
  const timezoneOffsets: Record<string, string> = {
    'America/Mexico_City': '-06:00',
    'America/Bogota': '-05:00',
    'America/New_York': '-05:00',
    'America/Los_Angeles': '-08:00',
    'America/Chicago': '-06:00',
    'America/Denver': '-07:00',
    'America/Sao_Paulo': '-03:00',
    'America/Buenos_Aires': '-03:00',
    'America/Lima': '-05:00',
    'America/Santiago': '-03:00',
    'Europe/Madrid': '+01:00',
    'Europe/London': '+00:00',
    'UTC': '+00:00',
  };
  return timezoneOffsets[timezone] || '-06:00'; // Default México
}

export function formatPreferredDays(days: number[]): string {
  const dayNames = ['Dom', 'Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb'];
  return days.map(d => dayNames[d]).join(', ');
}

export function formatDate(date: Date, timezone?: string): string {
  const tz = timezone || currentTimezone;
  const options: Intl.DateTimeFormatOptions = {
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric',
    timeZone: tz
  };
  return date.toLocaleDateString('es-MX', options);
}

export function formatTime(date: Date, timezone?: string): string {
  const tz = timezone || currentTimezone;
  return date.toLocaleTimeString('es-MX', {
    hour: '2-digit',
    minute: '2-digit',
    timeZone: tz
  });
}

export function translateStatus(status: string): string {
  const statusMap: Record<string, string> = {
    'planned': 'Planificada',
    'in_progress': 'En progreso',
    'completed': 'Completada',
    'missed': 'Perdida',
    'rescheduled': 'Reprogramada',
  };
  return statusMap[status] || status;
}

export function formatDateTime(date: Date): string {
  return `${formatDate(date)} a las ${formatTime(date)}`;
}
