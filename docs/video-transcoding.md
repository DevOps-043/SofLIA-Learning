# Video Transcoding

SofLIA can generate adaptive HLS renditions for course and intro videos when the runtime has FFmpeg available. The feature is intentionally backend-only: browsers upload or register the original asset, and the server decides whether it can create HLS safely.

## Environment

Set these variables in the web runtime:

```bash
VIDEO_TRANSCODING_ENABLED=true
FFMPEG_PATH=/usr/bin/ffmpeg
FFPROBE_PATH=/usr/bin/ffprobe
```

## Netlify

Netlify does not guarantee FFmpeg in the serverless runtime. To enable this feature there, place Linux x64 static binaries in:

```text
apps/web/bin/ffmpeg
apps/web/bin/ffprobe
```

`netlify.toml` already includes `apps/web/bin/**` in the function bundle and sets:

```env
FFMPEG_PATH=/var/task/apps/web/bin/ffmpeg
FFPROBE_PATH=/var/task/apps/web/bin/ffprobe
```

After the Linux binaries are committed/deployed, add this variable in the Netlify UI:

```env
VIDEO_TRANSCODING_ENABLED=true
```

Keep it disabled until the binaries are present. Otherwise uploads will still fall back safely, but the server will spend time attempting a transcode that cannot run.

## Local Windows Setup

Install FFmpeg locally with one of these options:

```powershell
winget install Gyan.FFmpeg
```

or, if you use Chocolatey:

```powershell
choco install ffmpeg
```

Then confirm the install:

```powershell
ffmpeg -version
ffprobe -version
```

If both commands work from any terminal, use this in `apps/web/.env.local`:

```env
VIDEO_TRANSCODING_ENABLED=true
FFMPEG_PATH=ffmpeg
FFPROBE_PATH=ffprobe
```

If the commands are not on `PATH`, point to the exact executables:

```env
VIDEO_TRANSCODING_ENABLED=true
FFMPEG_PATH=C:\ffmpeg\bin\ffmpeg.exe
FFPROBE_PATH=C:\ffmpeg\bin\ffprobe.exe
```

Restart `npm run dev:web` after changing `.env.local`.

Optional limits:

```bash
VIDEO_TRANSCODING_MAX_SYNC_BYTES=367001600
VIDEO_TRANSCODING_TIMEOUT_MS=240000
VIDEO_TRANSCODING_FFMPEG_PRESET=veryfast
VIDEO_TRANSCODING_CRF=23
```

If FFmpeg is unavailable, disabled, the source is too large for synchronous processing, or transcoding fails, the upload still succeeds and playback falls back to the original MP4/WebM.

## Output

Generated HLS files are stored next to the original asset:

```text
course-videos/videos/{source}.mp4
course-videos/videos/hls/{source}/master.m3u8
course-videos/videos/hls/{source}/{rendition}/index.m3u8
course-videos/videos/hls/{source}/{rendition}/segment_000.ts
```

The lesson or intro-video URL points to `master.m3u8` when processing succeeds.

## Production Notes

The current implementation is synchronous and bounded for safety. For very large libraries or high upload concurrency, move the same service behind a queue/worker so uploads return immediately while transcoding runs asynchronously.
