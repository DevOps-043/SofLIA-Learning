import { Search } from 'lucide-react'
import { useTranslation } from 'react-i18next'
import type { BusinessLearningPathsLogic } from './types'

export function BusinessLearningPathsSearch({ logic }: { logic: BusinessLearningPathsLogic }) {
  const { t } = useTranslation('business')
  const { textColor, borderColor, inputBg } = logic.theme
  return (
    <div id="tour-paths-search" className="relative">
      <Search className="pointer-events-none absolute left-5 top-1/2 h-4 w-4 -translate-y-1/2 opacity-40" style={{ color: textColor }} />
      <input
        value={logic.searchTerm}
        onChange={(event) => logic.setSearchTerm(event.target.value)}
        placeholder={t('learningPathsPage.searchPlaceholder')}
        className="w-full rounded-[1.5rem] border py-4 pl-12 pr-5 text-sm focus:outline-none transition-all"
        style={{ backgroundColor: inputBg, borderColor, color: textColor }}
      />
    </div>
  )
}
