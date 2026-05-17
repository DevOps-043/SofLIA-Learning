import { useEffect, useState } from 'react'

export function useChatSuggestionsExpanded(forceCollapse?: boolean | number) {
  const [isExpanded, setIsExpanded] = useState(!forceCollapse)

  useEffect(() => {
    if (forceCollapse) {
      setIsExpanded(false)
    }
  }, [forceCollapse])

  return {
    isExpanded,
    toggleExpanded: () => setIsExpanded((currentValue) => !currentValue),
  }
}
