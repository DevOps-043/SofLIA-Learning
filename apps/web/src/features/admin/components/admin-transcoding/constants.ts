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
  queued: { label: 'En cola', tone: 'text-[#6C757D]', bg: 'bg-[#E9ECEF]/60 dark:bg-white/5', border: 'border-[#E9ECEF] dark:border-white/10' },
  processing: { label: 'Procesando', tone: 'text-[#0A2540] dark:text-[#00D4B3]', bg: 'bg-[#00D4B3]/10', border: 'border-[#00D4B3]/40' },
  completed: { label: 'Completado', tone: 'text-[#10B981]', bg: 'bg-[#10B981]/10', border: 'border-[#10B981]/40' },
  failed: { label: 'Fallo', tone: 'text-[#ef4444]', bg: 'bg-[#ef4444]/10', border: 'border-[#ef4444]/40' },
  skipped: { label: 'Omitido', tone: 'text-[#6C757D]', bg: 'bg-[#6C757D]/10', border: 'border-[#6C757D]/30' },
  disabled: { label: 'Desactivado', tone: 'text-[#6C757D]', bg: 'bg-[#6C757D]/10', border: 'border-[#6C757D]/30' },
}
