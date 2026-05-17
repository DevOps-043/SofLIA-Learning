export function getIframeAllow(allowAutoplay: boolean): string {
  return [
    'accelerometer',
    allowAutoplay ? 'autoplay' : null,
    'clipboard-write',
    'encrypted-media',
    'gyroscope',
    'picture-in-picture',
  ]
    .filter(Boolean)
    .join('; ');
}
