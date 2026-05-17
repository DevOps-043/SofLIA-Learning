import type { ActivityConfig, ExternalToolKey } from '../../types/activity-config'

export function mergeToolTask(
  activityConfig: ActivityConfig,
  toolKey: ExternalToolKey | null,
  aiPrompts: string[],
): ActivityConfig {
  if (activityConfig.interactionType === 'soflia_dialogue' || !toolKey) {
    return activityConfig
  }

  const currentPromptTemplate = activityConfig.toolTask?.promptTemplate || aiPrompts[0] || ''

  if (activityConfig.interactionType === 'external_tool_task') {
    return {
      ...activityConfig,
      toolTask: {
        toolKey,
        promptTemplate: currentPromptTemplate,
        openInNewTab: activityConfig.toolTask.openInNewTab,
        showCopyButton: activityConfig.toolTask.showCopyButton,
      },
    }
  }

  return {
    ...activityConfig,
    toolTask: {
      toolKey,
      promptTemplate: currentPromptTemplate,
      openInNewTab: true,
      showCopyButton: true,
    },
  }
}

export function mergeValidationState(
  activityConfig: ActivityConfig,
  requiresSofliaValidation: boolean,
): ActivityConfig {
  if (activityConfig.interactionType === 'soflia_dialogue' || !requiresSofliaValidation) {
    return activityConfig
  }

  return {
    ...activityConfig,
    validation: {
      ...activityConfig.validation,
      enabled: true,
    },
  }
}
