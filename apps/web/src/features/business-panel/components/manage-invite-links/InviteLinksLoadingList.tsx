import { useInviteLinksTheme } from './useInviteLinksTheme'

export function InviteLinksLoadingList() {
  const theme = useInviteLinksTheme()

  return (
    <div className="space-y-4">
      {[1, 2, 3].map(index => (
        <div key={index} className="p-4 rounded-xl border animate-pulse" style={{ backgroundColor: theme.inputBg, borderColor: theme.borderColor }}>
          <div className="flex items-center gap-4">
            <div className="w-10 h-10 rounded-lg bg-gray-300 dark:bg-gray-700" />
            <div className="flex-1">
              <div className="h-4 w-32 bg-gray-300 dark:bg-gray-700 rounded mb-2" />
              <div className="h-3 w-48 bg-gray-300 dark:bg-gray-700 rounded" />
            </div>
          </div>
        </div>
      ))}
    </div>
  )
}
