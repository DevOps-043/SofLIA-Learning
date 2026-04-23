export function extractVideoInfo(url: string): {
  provider: 'youtube' | 'vimeo' | 'custom'
  id: string
} {
  if (!url) return { provider: 'custom', id: '' }

  const ytRegex = /^.*(youtu.be\/|v\/|u\/\w\/|embed\/|watch\?v=|&v=)([^#&?]*).*/
  const ytMatch = url.match(ytRegex)
  if (ytMatch && ytMatch[2].length === 11) {
    return { provider: 'youtube', id: ytMatch[2] }
  }

  const vimeoRegex = /(?:www\.|player\.)?vimeo.com\/(?:channels\/(?:\w+\/)?|groups\/(?:[^\/]*)\/videos\/|album\/(?:\d+)\/video\/|video\/|)(\d+)(?:[a-zA-Z0-9_\-]+)?/
  const vimeoMatch = url.match(vimeoRegex)
  if (vimeoMatch?.[1]) return { provider: 'vimeo', id: vimeoMatch[1] }

  return { provider: 'custom', id: url }
}
