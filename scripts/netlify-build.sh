#!/bin/bash
set -e  # Exit on error

echo "🚀 Starting Netlify build for Aprende y Aplica monorepo..."

# FFmpeg binary is NOT committed to git (would exceed Netlify's 250 MB bundle limit).
# Downloaded here only when VIDEO_TRANSCODING_ENABLED=true.
# We deliberately do NOT bundle ffprobe — video dimensions are read by parsing
# `ffmpeg -i` stderr instead, which keeps the BG function under the 250 MB cap.
# Local dev: set FFMPEG_PATH in apps/web/.env.local.
if [ "${VIDEO_TRANSCODING_ENABLED}" = "true" ]; then
  echo "🎞️ Downloading FFmpeg static binary for adaptive video transcoding..."
  mkdir -p apps/web/bin

  FFMPEG_ARCHIVE="ffmpeg-release-amd64-static.tar.xz"
  FFMPEG_URL="https://johnvansickle.com/ffmpeg/releases/${FFMPEG_ARCHIVE}"

  curl -fsSL "${FFMPEG_URL}" -o /tmp/ffmpeg.tar.xz
  EXTRACTED_DIR=$(tar -tJf /tmp/ffmpeg.tar.xz | head -1 | cut -d/ -f1)
  tar -xJf /tmp/ffmpeg.tar.xz -C /tmp/ "${EXTRACTED_DIR}/ffmpeg"
  cp "/tmp/${EXTRACTED_DIR}/ffmpeg"  apps/web/bin/ffmpeg
  chmod +x apps/web/bin/ffmpeg
  # Strip debug symbols (johnvansickle builds are usually already stripped — no-op then).
  strip apps/web/bin/ffmpeg 2>/dev/null || true
  rm -f /tmp/ffmpeg.tar.xz
  echo "✅ FFmpeg binary ready — size:"
  ls -lh apps/web/bin/ffmpeg
  du -sh apps/web/bin
else
  echo "ℹ️ VIDEO_TRANSCODING_ENABLED is not set — skipping FFmpeg download."
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
