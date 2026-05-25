export function extractVideoInfo(
  url: string
): { id: string; provider: 'youtube' | 'vimeo' | 'custom' } {
  if (!url) {
    return { id: '', provider: 'custom' }
  }

  const ytRegex = /^.*(youtu.be\/|v\/|u\/\w\/|embed\/|watch\?v=|&v=)([^#&?]*).*/
  const ytMatch = url.match(ytRegex)
  if (ytMatch && ytMatch[2].length === 11) {
    return { id: ytMatch[2], provider: 'youtube' }
  }

  const vimeoRegex =
    /(?:www\.|player\.)?vimeo.com\/(?:channels\/(?:\w+\/)?|groups\/(?:[^\/]*)\/videos\/|album\/(?:\d+)\/video\/|video\/|)(\d+)(?:[a-zA-Z0-9_\-]+)?/
  const vimeoMatch = url.match(vimeoRegex)
  if (vimeoMatch && vimeoMatch[1]) {
    return { id: vimeoMatch[1], provider: 'vimeo' }
  }

  return { id: url, provider: 'custom' }
}
