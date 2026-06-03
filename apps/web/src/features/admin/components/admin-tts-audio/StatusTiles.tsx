import type { TFunction } from 'i18next';

import { STATUS_KEYS, STATUS_STYLES } from './constants';
import type { ReadingAudioJobStatus } from './types';

interface StatusTilesProps {
  summary: Record<ReadingAudioJobStatus, number> | undefined;
  t: TFunction<'admin'>;
}

export function StatusTiles({ summary, t }: StatusTilesProps) {
  if (!summary) return null;

  return (
    <div className="mb-6 grid grid-cols-2 gap-3 md:grid-cols-4">
      {STATUS_KEYS.map((status) => (
        <div key={status} className={`rounded-lg border p-4 ${STATUS_STYLES[status]}`}>
          <p className="text-xs font-semibold uppercase tracking-wide">
            {t(`ttsAudio.status.${status}`)}
          </p>
          <p className="mt-1 text-2xl font-semibold">{summary[status]}</p>
        </div>
      ))}
    </div>
  );
}
