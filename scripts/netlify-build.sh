#!/bin/bash
set -e  # Exit on error

echo "🚀 Starting Netlify build for Aprende y Aplica monorepo..."

# Make npm resilient to Netlify's intermittent registry network blips (ECONNRESET).
# Without retries a single dropped connection during install fails the whole deploy.
npm config set fetch-retries 5
npm config set fetch-retry-mintimeout 20000
npm config set fetch-retry-maxtimeout 120000
npm config set fetch-timeout 300000

# FFmpeg binary is NOT committed to git (would exceed Netlify's 250 MB bundle limit).
# Downloaded here only when VIDEO_TRANSCODING_ENABLED=true.
# We deliberately do NOT bundle ffprobe — video dimensions are read by parsing
# `ffmpeg -i` stderr instead, which keeps the BG function under the 250 MB cap.
# Local dev: set FFMPEG_PATH in apps/web/.env.local.
if [ "${VIDEO_TRANSCODING_ENABLED}" = "true" ]; then
  echo "🎞️ Downloading FFmpeg static binary for adaptive video transcoding..."
  mkdir -p apps/web/bin

  if [ -x apps/web/bin/ffmpeg ]; then
    echo "✅ Existing FFmpeg binary found; skipping download."
  else
    FFMPEG_ARCHIVE="ffmpeg-release-amd64-static.tar.xz"
    FFMPEG_ARCHIVE_PATH="/tmp/${FFMPEG_ARCHIVE}"
    FFMPEG_CACHE_DIR="${NETLIFY_CACHE_DIR:-.netlify/cache}/ffmpeg"
    FFMPEG_CACHE_PATH="${FFMPEG_CACHE_DIR}/${FFMPEG_ARCHIVE}"
    FFMPEG_URLS=(
      "https://johnvansickle.com/ffmpeg/releases/${FFMPEG_ARCHIVE}"
      "https://johnvansickle.com/ffmpeg/builds/ffmpeg-git-amd64-static.tar.xz"
    )

    mkdir -p "${FFMPEG_CACHE_DIR}"
    rm -f "${FFMPEG_ARCHIVE_PATH}"

    if [ -f "${FFMPEG_CACHE_PATH}" ] && tar -tJf "${FFMPEG_CACHE_PATH}" >/dev/null 2>&1; then
      echo "✅ Using cached FFmpeg archive from ${FFMPEG_CACHE_PATH}."
      cp "${FFMPEG_CACHE_PATH}" "${FFMPEG_ARCHIVE_PATH}"
    else
      rm -f "${FFMPEG_CACHE_PATH}"

      CURL_RETRY_ARGS=(
        --fail
        --location
        --silent
        --show-error
        --retry 5
        --retry-delay 10
        --connect-timeout 30
        --max-time 300
        --speed-limit 1024
        --speed-time 60
      )

      if curl --help all 2>/dev/null | grep -q -- "--retry-all-errors"; then
        CURL_RETRY_ARGS+=(--retry-all-errors)
      fi

      DOWNLOAD_SUCCEEDED=false
      for FFMPEG_URL in "${FFMPEG_URLS[@]}"; do
        echo "⬇️ Downloading FFmpeg from ${FFMPEG_URL}..."
        if curl "${CURL_RETRY_ARGS[@]}" --output "${FFMPEG_ARCHIVE_PATH}" "${FFMPEG_URL}"; then
          if tar -tJf "${FFMPEG_ARCHIVE_PATH}" >/dev/null 2>&1; then
            DOWNLOAD_SUCCEEDED=true
            cp "${FFMPEG_ARCHIVE_PATH}" "${FFMPEG_CACHE_PATH}"
            break
          fi

          echo "⚠️ Downloaded FFmpeg archive is invalid; trying the next source..."
          rm -f "${FFMPEG_ARCHIVE_PATH}"
        else
          echo "⚠️ FFmpeg download failed from ${FFMPEG_URL}; trying the next source..."
          rm -f "${FFMPEG_ARCHIVE_PATH}"
        fi
      done

      if [ "${DOWNLOAD_SUCCEEDED}" != "true" ]; then
        echo "❌ Unable to download a valid FFmpeg archive after retries."
        exit 2
      fi
    fi

    FFMPEG_EXTRACT_DIR=$(mktemp -d)
    EXTRACTED_DIR=$(tar -tJf "${FFMPEG_ARCHIVE_PATH}" | head -1 | cut -d/ -f1)

    if [ -z "${EXTRACTED_DIR}" ]; then
      echo "❌ FFmpeg archive did not contain an extractable directory."
      exit 2
    fi

    tar -xJf "${FFMPEG_ARCHIVE_PATH}" -C "${FFMPEG_EXTRACT_DIR}" "${EXTRACTED_DIR}/ffmpeg"
    cp "${FFMPEG_EXTRACT_DIR}/${EXTRACTED_DIR}/ffmpeg" apps/web/bin/ffmpeg
    chmod +x apps/web/bin/ffmpeg
    rm -rf "${FFMPEG_EXTRACT_DIR}" "${FFMPEG_ARCHIVE_PATH}"
  fi

  # Strip debug symbols (johnvansickle builds are usually already stripped — no-op then).
  strip apps/web/bin/ffmpeg 2>/dev/null || true
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
