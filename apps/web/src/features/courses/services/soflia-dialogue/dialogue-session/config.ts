import {
  isDialogueActivityConfig,
  type DialogueActivityConfig,
} from '../../../types/dialogue-runtime'
import type { CourseActivityContext } from '../../activity-submission.server.service'
import { DialogueRuntimeError } from '../dialogue-runtime.errors'

export function resolveDialogueConfig(
  context: CourseActivityContext,
): DialogueActivityConfig {
  if (!isDialogueActivityConfig(context.resolvedActivityConfig)) {
    throw new DialogueRuntimeError(
      'DIALOGUE_CONFIG_INVALID',
      400,
      'La actividad no tiene configuracion SOFLIA_DIALOGUE valida',
    )
  }

  return context.resolvedActivityConfig
}
