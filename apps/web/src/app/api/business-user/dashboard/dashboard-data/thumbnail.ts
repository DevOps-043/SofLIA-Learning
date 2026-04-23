export function getCourseThumbnail(
  thumbnailUrl: string | null,
  title: string | null,
) {
  if (thumbnailUrl) return thumbnailUrl

  const normalizedTitle = title?.toLowerCase() || ''
  if (normalizedTitle.includes('python')) return '🐍'
  if (normalizedTitle.includes('ia') || normalizedTitle.includes('ai') || normalizedTitle.includes('generativa')) return '🤖'
  if (normalizedTitle.includes('diseño') || normalizedTitle.includes('ux') || normalizedTitle.includes('ui')) return '🎨'
  if (normalizedTitle.includes('machine learning') || normalizedTitle.includes('ml')) return '🧠'
  if (normalizedTitle.includes('datos') || normalizedTitle.includes('data')) return '📊'
  return '📚'
}
