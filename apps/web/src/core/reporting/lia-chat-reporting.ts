import { sessionRecorder } from '../../lib/rrweb/session-recorder';
import type { EnrichedMetadata } from '../../lib/rrweb/session-recorder';

export type LiaRecordingStatus =
  | 'active'
  | 'inactive'
  | 'restarted'
  | 'unavailable'
  | 'error';

export type LiaChatMetadata = EnrichedMetadata & {
  recordingInfo: EnrichedMetadata['recordingInfo'] & {
    status?: LiaRecordingStatus;
    error?: string;
  };
};

export interface PreparedLiaBugContext {
  isBugReport: boolean;
  sessionSnapshot?: string;
  enrichedMetadata?: LiaChatMetadata;
  recordingStatus?: LiaRecordingStatus;
}

const BUG_REPORT_KEYWORDS =
  /error|bug|falla|problema|no funciona|no carga|rompi|broken|crash|colg[oó]|lento|cuelga|no responde|pantalla en blanco|500|404|timeout|se cay[oó]/i;

function buildLiaChatMetadata(
  recordingStatus: LiaRecordingStatus,
  session?: Parameters<typeof sessionRecorder.getEnrichedMetadata>[0],
  errorMessage?: string
): LiaChatMetadata {
  const metadata = sessionRecorder.getEnrichedMetadata(session ?? null);

  return {
    ...metadata,
    recordingInfo: {
      ...metadata.recordingInfo,
      status: recordingStatus,
      ...(errorMessage ? { error: errorMessage } : {}),
    },
  };
}

export async function prepareLiaBugContext(
  message: string,
  forceBugReport: boolean = false
): Promise<PreparedLiaBugContext> {
  const isBugReport = forceBugReport || BUG_REPORT_KEYWORDS.test(message);

  if (!isBugReport) {
    return {
      isBugReport: false,
    };
  }

  let sessionSnapshot: string | undefined;
  let enrichedMetadata: LiaChatMetadata | undefined;
  let recordingStatus: LiaRecordingStatus = 'unavailable';

  try {
    const hasRequiredMethods =
      typeof sessionRecorder.isRrwebAvailable === 'function' &&
      typeof sessionRecorder.isActive === 'function' &&
      typeof sessionRecorder.captureSnapshot === 'function';

    if (!hasRequiredMethods) {
      recordingStatus = 'error';
    } else if (!sessionRecorder.isRrwebAvailable()) {
      recordingStatus = 'unavailable';
    } else if (!sessionRecorder.isActive()) {
      try {
        await sessionRecorder.startRecording(180000);
        recordingStatus = 'restarted';
        await new Promise((resolve) => setTimeout(resolve, 500));
      } catch (restartError) {
        console.error(
          '[SofLIA Reporting] No se pudo reiniciar la grabación:',
          restartError
        );
        recordingStatus = 'error';
      }
    } else if (
      typeof sessionRecorder.isPaused === 'function' &&
      sessionRecorder.isPaused()
    ) {
      if (typeof sessionRecorder.resume === 'function') {
        sessionRecorder.resume();
      }
      recordingStatus = 'active';
    } else {
      recordingStatus = 'active';
    }

    const snapshot = sessionRecorder.captureSnapshot();

    if (snapshot && snapshot.events.length > 0) {
      sessionSnapshot = await sessionRecorder.exportSessionCompressed(snapshot);
      enrichedMetadata = buildLiaChatMetadata(recordingStatus, snapshot);
    } else {
      enrichedMetadata = buildLiaChatMetadata(recordingStatus);
    }
  } catch (error) {
    recordingStatus = 'error';
    enrichedMetadata = buildLiaChatMetadata(
      recordingStatus,
      null,
      error instanceof Error ? error.message : 'Unknown error'
    );
  }

  return {
    isBugReport,
    sessionSnapshot,
    enrichedMetadata,
    recordingStatus,
  };
}
