/**
 * Platform onboarding tour videos (stored in the public `assets` bucket).
 *
 * - B2B: shown before the business admin panel tour.
 * - B2C: shown before the business user dashboard tour.
 *
 * Returns an empty string when the Supabase URL is not configured, in which
 * case the tour simply skips the video phase and starts the Joyride directly.
 */
const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL ?? ''

function assetVideoUrl(fileName: string): string {
  return SUPABASE_URL
    ? `${SUPABASE_URL}/storage/v1/object/public/assets/${fileName}`
    : ''
}

export const PLATFORM_TOUR_VIDEO_B2B = assetVideoUrl('TourB2B.mp4')
export const PLATFORM_TOUR_VIDEO_B2C = assetVideoUrl('TourB2C.mp4')
