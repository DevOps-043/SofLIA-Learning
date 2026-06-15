/**
 * Platform onboarding tour video.
 *
 * Shown before the Joyride steps the first time the business admin panel and
 * the business user dashboard tours run (and on every "Ver tour" replay).
 *
 * Source of truth: the institutional teaser stored in the public `assets`
 * bucket (`Teaser - SofLIA Nexus.mp4`), reused via
 * `buildPlatformIntroTeaserSourceUrl` so there is a single canonical URL across
 * the app (the HLS-resolution API depends on this exact string matching).
 *
 * Returns an empty string when the Supabase URL is not configured, in which
 * case the tour simply skips the video phase and starts the Joyride directly.
 */
import { buildPlatformIntroTeaserSourceUrl } from '@/lib/media/platform-intro-teaser'

const platformTourVideoUrl =
  buildPlatformIntroTeaserSourceUrl(process.env.NEXT_PUBLIC_SUPABASE_URL) ?? ''

// Both panels currently use the same institutional teaser. Kept as two named
// exports so distinct videos can be wired per audience later without touching
// the tour configs.
export const PLATFORM_TOUR_VIDEO_B2B = platformTourVideoUrl
export const PLATFORM_TOUR_VIDEO_B2C = platformTourVideoUrl
