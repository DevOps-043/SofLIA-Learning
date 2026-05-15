#!/bin/bash
set -e  # Exit on error

echo "🚀 Starting Netlify build for Aprende y Aplica monorepo..."

# FFmpeg binaries are NOT committed to git (160 MB+ would exceed Netlify's 250 MB bundle limit).
# They are downloaded here only when VIDEO_TRANSCODING_ENABLED=true.
# Local dev: set FFMPEG_PATH / FFPROBE_PATH in apps/web/.env.local.
if [ "${VIDEO_TRANSCODING_ENABLED}" = "true" ]; then
  echo "🎞️ Downloading FFmpeg static binaries for adaptive video transcoding..."
  mkdir -p apps/web/bin

  FFMPEG_ARCHIVE="ffmpeg-release-amd64-static.tar.xz"
  FFMPEG_URL="https://johnvansickle.com/ffmpeg/releases/${FFMPEG_ARCHIVE}"

  curl -fsSL "${FFMPEG_URL}" -o /tmp/ffmpeg.tar.xz
  EXTRACTED_DIR=$(tar -tJf /tmp/ffmpeg.tar.xz | head -1 | cut -d/ -f1)
  tar -xJf /tmp/ffmpeg.tar.xz -C /tmp/ "${EXTRACTED_DIR}/ffmpeg" "${EXTRACTED_DIR}/ffprobe"
  cp "/tmp/${EXTRACTED_DIR}/ffmpeg"  apps/web/bin/ffmpeg
  cp "/tmp/${EXTRACTED_DIR}/ffprobe" apps/web/bin/ffprobe
  chmod +x apps/web/bin/ffmpeg apps/web/bin/ffprobe
  rm -f /tmp/ffmpeg.tar.xz
  echo "✅ FFmpeg binaries ready"
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
