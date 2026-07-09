/**
 * Inactivity threshold for capping inter-turn gaps when computing real
 * SofLIA Dialogue active time (see compute-active-seconds.ts). Mirrors the
 * existing 5-minute chat-inactivity threshold already used for
 * `lesson_tracking` (`lia_inactivity_5m`, see
 * netlify/functions/process-inactive-lessons/constants.ts
 * INACTIVITY_THRESHOLD_MINUTES) so chat-inactivity semantics stay consistent
 * across the platform.
 *
 * netlify/functions/process-inactive-dialogue-sessions/constants.ts
 * duplicates this exact value — Netlify Functions are self-contained bundles
 * that don't import from apps/web/src. If you change this value, change both.
 */
export const DIALOGUE_INACTIVITY_THRESHOLD_SECONDS = 300
