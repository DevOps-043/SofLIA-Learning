/**
 * Client-side inactivity prompt for SofLIA Dialogue activities.
 *
 * After this many seconds without user activity (typing or new turns) the UI
 * shows a notice offering to restart the activity or keep going.
 *
 * Deliberately SHORTER than the 5-minute server threshold
 * (DIALOGUE_INACTIVITY_THRESHOLD_SECONDS = 300 in
 * services/soflia-dialogue/dialogue-session/dialogue-timing.constants.ts and
 * the Netlify cron): the prompt nudges the user before the cron caps the
 * session's active time. The server never terminates the session — it stays
 * resumable — so both prompt actions are always safe.
 */
export const DIALOGUE_INACTIVITY_PROMPT_SECONDS = 180
