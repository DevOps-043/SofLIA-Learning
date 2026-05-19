import type { TranscodingJobStatus } from '../../hooks/useTranscodingJobStatus'

export const FAILURE_REASON_COPY: Record<string, string> = {
  missing_url: 'Falta NETLIFY_URL / URL en env vars',
  missing_secret: 'Falta TRANSCODING_INTERNAL_SECRET en env vars',
  network_error: 'Error de red al llamar a la BG function',
  non_202_response: 'La BG function no devolvio 202',
}

export const REFRESH_INTERVAL_MS = 5000

export const STATUS_META: Record<
  TranscodingJobStatus,
  { label: string; tone: string; bg: string; border: string }
> = {
  queued: { label: 'En cola', tone: 'text-gray-500', bg: 'bg-gray-200/60 dark:bg-white/5', border: 'border-gray-200 dark:border-white/10' },
  processing: { label: 'Procesando', tone: 'text-primary dark:text-accent', bg: 'bg-accent/10', border: 'border-accent/40' },
  completed: { label: 'Completado', tone: 'text-success', bg: 'bg-success/10', border: 'border-success/40' },
  failed: { label: 'Fallo', tone: 'text-error', bg: 'bg-error/10', border: 'border-error/40' },
  skipped: { label: 'Omitido', tone: 'text-gray-500', bg: 'bg-gray-500/10', border: 'border-gray-500/30' },
  disabled: { label: 'Desactivado', tone: 'text-gray-500', bg: 'bg-gray-500/10', border: 'border-gray-500/30' },
}
