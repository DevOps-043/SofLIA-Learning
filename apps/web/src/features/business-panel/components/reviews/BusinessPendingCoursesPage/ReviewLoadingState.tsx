import { useBusinessPanelTheme } from '../../../hooks/useBusinessPanelTheme'

export function ReviewLoadingState() {
  const panelTheme = useBusinessPanelTheme()

  return (
    <div className="flex items-center justify-center py-24">
      <div
        className="w-14 h-14 rounded-full border-4 animate-spin"
        style={{
          borderColor: `color-mix(in srgb, ${panelTheme.actionColor} 13.3%, transparent)`,
          borderTopColor: panelTheme.actionColor,
        }}
      />
    </div>
  )
}
