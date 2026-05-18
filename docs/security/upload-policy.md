# Secure Upload Policy

## Scope

Applies to every endpoint that accepts multipart uploads or signed upload flows in SofLIA Learning.

## Bucket Rules

| Bucket | MIME allowed | Max size | Extra controls |
|---|---|---:|---|
| `avatars` | PNG, JPEG, WebP | 2 MB | Re-encode images server-side |
| `content-images` | PNG, JPEG, WebP, GIF | 5 MB | Re-encode static images server-side |
| `documents` | PDF, Word, Excel | 10 MB | Antimalware required |
| `community-images` | PNG, JPEG, WebP | 5 MB | Re-encode images server-side |
| `intro-videos` | MP4, WebM, OGG, QuickTime | 500 MB | Adaptive processing after upload |
| `course-videos` | MP4, WebM | 2 GB | Signed upload flow only |
| `scorm-packages` | ZIP | 100 MB | Antimalware and SCORM manifest validation required |

## Required Controls

- Validate real file signatures with magic bytes; never trust extension or `Content-Type`.
- Generate server-side filenames with opaque IDs and validated extensions.
- Reject SVG uploads in image buckets.
- Strip image metadata by re-encoding with Sharp for supported static image formats.
- Keep buckets private by default; use public buckets only for assets explicitly intended to be public.
- Use signed URLs with short TTLs for private downloads.
- Require antimalware for documents and SCORM ZIP packages. Local development may use `UPLOAD_ANTIMALWARE_MODE=bypass-local`; production must not.
- Production antimalware is configured with `UPLOAD_ANTIMALWARE_PROVIDER=clamav-http` and `CLAMAV_SCAN_URL`; provider failures keep protected buckets closed.

## Operational Notes

Security-relevant rejections emit `file-upload-rejected` events into `security_audit_log`. Upload endpoints must return safe error messages and must not log original filenames when they may contain PII.
