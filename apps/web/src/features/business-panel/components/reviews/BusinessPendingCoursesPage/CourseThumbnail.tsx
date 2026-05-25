import { FileText } from 'lucide-react'
import { useBusinessPanelTheme } from '../../../hooks/useBusinessPanelTheme'

interface CourseThumbnailProps {
  thumbnailUrl?: string
  title: string
}

export function CourseThumbnail({ thumbnailUrl, title }: CourseThumbnailProps) {
  const panelTheme = useBusinessPanelTheme()

  if (thumbnailUrl) {
    return <img src={thumbnailUrl} alt={title} className="w-full h-full object-cover" />
  }

  return (
    <div
      className="w-full h-full flex items-center justify-center"
      style={{
        background: `radial-gradient(circle at top, ${panelTheme.actionSurface}, ${panelTheme.hoverBg})`,
      }}
    >
      <div
        className="w-16 h-16 rounded-2xl flex items-center justify-center border"
        style={{
          backgroundColor: panelTheme.inputBg,
          borderColor: panelTheme.borderColor,
        }}
      >
        <FileText className="w-8 h-8" style={{ color: panelTheme.actionColor }} />
      </div>
    </div>
  )
}
