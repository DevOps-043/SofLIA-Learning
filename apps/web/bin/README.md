# FFmpeg Binary For Netlify

On Netlify the `apps/web/bin/ffmpeg` Linux x64 binary is provisioned without
root by `scripts/netlify-build.sh` when `VIDEO_TRANSCODING_ENABLED=true`.
The script first checks whether `ffmpeg` is already on PATH; otherwise it
installs `@ffmpeg-installer/ffmpeg` in an isolated temporary directory and
copies the resulting binary here.
It is not committed to git (would exceed Netlify's 250 MB function bundle limit).

`ffprobe` is intentionally NOT bundled. Bundling both binaries pushed the
background function past Netlify's 250 MB cap. Dimensions are read by parsing
`ffmpeg -i` stderr inside `netlify/functions/transcode-video-background.ts`.

## Required environment variables (Netlify UI)

```env
VIDEO_TRANSCODING_ENABLED=true
TRANSCODING_INTERNAL_SECRET=<random secret>
```

`netlify.toml` already sets:

```env
FFMPEG_PATH=/var/task/apps/web/bin/ffmpeg
```

## Local development (Windows / macOS)

Install ffmpeg locally and set `FFMPEG_PATH` in `apps/web/.env.local`. Do NOT
place Windows `.exe` binaries in this directory — they would be uploaded to
Netlify and break the Linux runtime.
