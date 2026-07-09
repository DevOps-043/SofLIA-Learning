#!/bin/bash
set -e  # Exit on error

echo "🚀 Starting Netlify build for Aprende y Aplica monorepo..."

# Make npm resilient to Netlify's intermittent registry network blips (ECONNRESET).
# Without retries a single dropped connection during install fails the whole deploy.
npm config set fetch-retries 5
npm config set fetch-retry-mintimeout 20000
npm config set fetch-retry-maxtimeout 120000
npm config set fetch-timeout 300000

install_ffmpeg_from_apt() {
  if ! command -v apt-get >/dev/null 2>&1; then
    echo "❌ apt-get is not available in this build image; cannot provision FFmpeg."
    return 1
  fi

  local apt_get=(apt-get)
  if [ "$(id -u)" -ne 0 ] && command -v sudo >/dev/null 2>&1; then
    apt_get=(sudo apt-get)
  fi

  export DEBIAN_FRONTEND=noninteractive

  echo "📦 Installing FFmpeg from the build image package manager..."
  "${apt_get[@]}" update
  "${apt_get[@]}" install -y --no-install-recommends ffmpeg

  local installed_ffmpeg
  installed_ffmpeg="$(command -v ffmpeg || true)"

  if [ -z "${installed_ffmpeg}" ]; then
    echo "❌ apt-get finished, but ffmpeg was not found on PATH."
    return 1
  fi

  cp "${installed_ffmpeg}" apps/web/bin/ffmpeg
  chmod +x apps/web/bin/ffmpeg
}

# FFmpeg binary is NOT committed to git (would exceed Netlify's 250 MB bundle limit).
# Provisioned here only when VIDEO_TRANSCODING_ENABLED=true.
# We deliberately do NOT bundle ffprobe — video dimensions are read by parsing
# `ffmpeg -i` stderr instead, which keeps the BG function under the 250 MB cap.
# Local dev: set FFMPEG_PATH in apps/web/.env.local.
if [ "${VIDEO_TRANSCODING_ENABLED}" = "true" ]; then
  echo "🎞️ Preparing FFmpeg binary for adaptive video transcoding..."
  mkdir -p apps/web/bin

  if [ -x apps/web/bin/ffmpeg ]; then
    echo "✅ Existing FFmpeg binary found; skipping install."
  else
    if ! install_ffmpeg_from_apt; then
      echo "❌ Unable to install FFmpeg from the build image package manager."
      exit 2
    fi
  fi

  # Strip debug symbols when supported by the installed binary; no-op otherwise.
  strip apps/web/bin/ffmpeg 2>/dev/null || true
  echo "✅ FFmpeg binary ready — size:"
  ls -lh apps/web/bin/ffmpeg
  apps/web/bin/ffmpeg -version | head -1
  du -sh apps/web/bin
else
  echo "ℹ️ VIDEO_TRANSCODING_ENABLED is not set — skipping FFmpeg provisioning."
fi

# Ensure TypeScript is available for building packages
# Netlify doesn't install devDependencies in production, so we need to install TypeScript
echo "📦 Installing TypeScript for package builds..."
# Temporarily set NODE_ENV to development to ensure devDependencies are available
export NODE_ENV=development
npm install typescript@^5.3.3 --save-dev --no-save
export NODE_ENV=production

# Build shared packages first
echo "📦 Building @aprende-y-aplica/shared package..."
npm run build --workspace=@aprende-y-aplica/shared

echo "📦 Building @aprende-y-aplica/ui package..."
npm run build --workspace=@aprende-y-aplica/ui

# Build the web app
echo "🌐 Building Next.js web app..."
npm run build --workspace=apps/web

echo "✅ Build completed successfully!"
