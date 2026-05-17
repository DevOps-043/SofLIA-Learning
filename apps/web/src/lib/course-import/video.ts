export function extractVideoInfo(url: string): {
  provider: 'youtube' | 'vimeo' | 'custom'
  id: string
} {
  if (!url) return { provider: 'custom', id: '' }

  const ytMatch = url.match(/^.*(youtu\.be\/|v\/|u\/\w\/|embed\/|watch\?v=|&v=)([^#&?]*).*/)
  if (ytMatch && ytMatch[2].length === 11) return { provider: 'youtube', id: ytMatch[2] }

  const vimeoMatch = url.match(/(?:www\.|player\.)?vimeo\.com\/(?:channels\/(?:\w+\/)?|groups\/(?:[^/]*)\/videos\/|video\/|)(\d+)/)
  if (vimeoMatch?.[1]) return { provider: 'vimeo', id: vimeoMatch[1] }

  return { provider: 'custom', id: url }
}
