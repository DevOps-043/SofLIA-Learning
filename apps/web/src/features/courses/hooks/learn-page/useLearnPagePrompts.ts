import { useCallback, useEffect, useRef, useState } from 'react'

import type { LearnTab } from '../../components/learn/types'

export function useLearnPagePrompts(activeTab: LearnTab) {
  const [currentActivityPrompts, setCurrentActivityPrompts] = useState<string[]>(
    [],
  )
  const [isPromptsCollapsed, setIsPromptsCollapsed] = useState(false)
  const prevPromptsLengthRef = useRef<number>(0)

  useEffect(() => {
    if (activeTab !== 'activities') {
      setCurrentActivityPrompts([])
      setIsPromptsCollapsed(false)
      prevPromptsLengthRef.current = 0
    }
  }, [activeTab])

  useEffect(() => {
    const previousLength = prevPromptsLengthRef.current
    const currentLength = currentActivityPrompts.length

    if (previousLength === 0 && currentLength > 0) {
      setIsPromptsCollapsed(false)
    }

    prevPromptsLengthRef.current = currentLength
  }, [currentActivityPrompts.length])

  const handlePromptsChange = useCallback((prompts: string[]) => {
    setCurrentActivityPrompts(prompts)
  }, [])

  return {
    currentActivityPrompts,
    isPromptsCollapsed,
    setIsPromptsCollapsed,
    handlePromptsChange,
  }
}
