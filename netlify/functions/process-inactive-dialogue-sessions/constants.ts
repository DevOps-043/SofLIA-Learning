/**
 * Mirrors DIALOGUE_INACTIVITY_THRESHOLD_SECONDS in
 * apps/web/src/features/courses/services/soflia-dialogue/dialogue-session/dialogue-timing.constants.ts.
 * Netlify Functions are self-contained bundles that don't import from
 * apps/web/src, so this value is intentionally duplicated. Keep both in sync.
 */
export const INACTIVITY_THRESHOLD_SECONDS = 300
export const PROCESSING_BATCH_SIZE = 100
