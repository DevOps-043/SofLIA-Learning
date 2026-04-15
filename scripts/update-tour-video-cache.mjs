/**
 * update-tour-video-cache.mjs
 *
 * One-time maintenance script: updates the Cache-Control header on the tour
 * videos stored in Supabase Storage so browsers and the Supabase CDN can
 * cache them long-term.
 *
 * WHY THIS MATTERS
 * ────────────────
 * Supabase Storage uploads have `Cache-Control: no-cache` by default when no
 * cacheControl option is specified. This means every user re-downloads the
 * video on each visit, regardless of whether it has changed.
 *
 * Setting max-age=31536000 (1 year) + immutable tells:
 *   • The browser   → serve from local cache on repeat views (instant, 0 bytes)
 *   • The CDN edge  → cache the file at the edge node close to the user
 *
 * HOW IT WORKS
 * ────────────
 * Supabase Storage has no "update metadata" endpoint. The only way to change
 * the Cache-Control on an existing object is to re-upload it (upsert). This
 * script downloads each video blob and re-uploads it with the correct header.
 *
 * USAGE
 * ─────
 * Run from the project root (needs NEXT_PUBLIC_SUPABASE_URL and
 * SUPABASE_SERVICE_ROLE_KEY in the environment or in apps/web/.env.local):
 *
 *   node --env-file=apps/web/.env.local scripts/update-tour-video-cache.mjs
 *
 * Run once; re-run only if you upload new tour videos.
 */

import { createClient } from '@supabase/supabase-js';

// ── Config ─────────────────────────────────────────────────────────────────

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL;
const SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!SUPABASE_URL || !SERVICE_ROLE_KEY) {
  console.error(
    '❌  Missing env vars: NEXT_PUBLIC_SUPABASE_URL and/or SUPABASE_SERVICE_ROLE_KEY\n' +
    '    Run with: node --env-file=apps/web/.env.local scripts/update-tour-video-cache.mjs'
  );
  process.exit(1);
}

const BUCKET = 'assets';

// Cache-Control value:
//   public        → can be stored by CDN edges and shared caches
//   max-age=31536000 → 1 year in seconds (videos are effectively immutable)
//   immutable     → tells browser "don't revalidate during max-age, ever"
const CACHE_CONTROL = 'public, max-age=31536000, immutable';

const TOUR_VIDEOS = [
  { path: 'TourB2B.mp4', contentType: 'video/mp4' },
  { path: 'TourB2C.mp4', contentType: 'video/mp4' },
];

// ── Supabase admin client (bypasses RLS) ───────────────────────────────────

const supabase = createClient(SUPABASE_URL, SERVICE_ROLE_KEY, {
  auth: { autoRefreshToken: false, persistSession: false },
});

// ── Main ───────────────────────────────────────────────────────────────────

async function updateCacheControl({ path, contentType }) {
  process.stdout.write(`  → ${path} — downloading... `);

  const { data: blob, error: downloadError } = await supabase.storage
    .from(BUCKET)
    .download(path);

  if (downloadError) {
    console.error(`\n    ❌ Download failed: ${downloadError.message}`);
    return false;
  }

  process.stdout.write('re-uploading with new cache headers... ');

  const { error: uploadError } = await supabase.storage
    .from(BUCKET)
    .upload(path, blob, {
      upsert: true,
      contentType,
      cacheControl: CACHE_CONTROL,
    });

  if (uploadError) {
    console.error(`\n    ❌ Upload failed: ${uploadError.message}`);
    return false;
  }

  console.log('✓ done');
  return true;
}

console.log(`\nUpdating Cache-Control headers for tour videos in bucket "${BUCKET}"`);
console.log(`Target: ${CACHE_CONTROL}\n`);

let allOk = true;
for (const video of TOUR_VIDEOS) {
  const ok = await updateCacheControl(video);
  if (!ok) allOk = false;
}

if (allOk) {
  console.log('\n✅  All tour videos updated successfully.');
  console.log('    Browsers will now cache these files for 1 year after the first download.\n');
} else {
  console.error('\n⚠️  Some videos failed to update. Check errors above.\n');
  process.exit(1);
}
