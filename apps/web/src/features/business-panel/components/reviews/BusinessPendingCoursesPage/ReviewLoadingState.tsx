import { useBusinessPanelTheme } from '../../../hooks/useBusinessPanelTheme'

export function ReviewLoadingState() {
  const panelTheme = useBusinessPanelTheme()

  return (
    <div className="flex items-center justify-center py-24">
      <div
        className="w-14 h-14 rounded-full border-4 animate-spin"
        style={{
          borderColor: `${panelTheme.actionColor}22`,
          borderTopColor: panelTheme.actionColor,
        }}
      />
    </div>
  )
}
