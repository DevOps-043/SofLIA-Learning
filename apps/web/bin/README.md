# FFmpeg Binaries For Netlify

Place Linux x64 static binaries here when enabling adaptive video transcoding on Netlify:

```text
apps/web/bin/ffmpeg
apps/web/bin/ffprobe
```

Do not place Windows `.exe` binaries here for Netlify. Local Windows paths should be configured in `apps/web/.env.local` instead.

After adding the Linux binaries, enable this environment variable in Netlify:

```env
VIDEO_TRANSCODING_ENABLED=true
```

`netlify.toml` already includes this directory in the function bundle and sets:

```env
FFMPEG_PATH=/var/task/apps/web/bin/ffmpeg
FFPROBE_PATH=/var/task/apps/web/bin/ffprobe
```
