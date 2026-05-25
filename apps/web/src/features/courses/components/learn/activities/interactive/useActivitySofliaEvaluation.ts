import { useCallback, useState } from "react";

import type { CourseLessonContext } from "@/core/types/lia.types";
import {
  buildActivitySofliaEvaluationMessage,
  hasActivityResponseForSofliaEvaluation,
} from "@/features/courses/services/activity-soflia-evaluation-message.service";
import { useLiaCourse } from "../../../../context/LiaCourseContext";
import type { LearnActivity } from "../../types";
import type { useActivitySubmission } from "../useActivitySubmission";

type RequestPayload = ReturnType<typeof useActivitySubmission>["requestPayload"];

export function useActivitySofliaEvaluation(input: {
  activity: LearnActivity;
  lessonId: string;
  requestPayload: RequestPayload;
  setFeedbackMessage: (message: string | null) => void;
}) {
  const [liaEvaluationPending, setLiaEvaluationPending] = useState(false);
  const { liaChat, openLia, closeLia, courseContext, isLiaChatLoading, isInteractionBlocked } = useLiaCourse();
  const canEvaluateWithSoflia = hasActivityResponseForSofliaEvaluation({
    activity: input.activity,
    request: input.requestPayload,
  });

  const handleEvaluateWithSoflia = useCallback(async () => {
    input.setFeedbackMessage(null);

    if (isInteractionBlocked) {
      closeLia();
      return;
    }

    if (isLiaChatLoading) {
      input.setFeedbackMessage(
        "SofLIA ya esta generando una respuesta. Deten la generacion actual en el panel y vuelve a intentarlo."
      );
      return;
    }

    const evaluationPrompt = buildActivitySofliaEvaluationMessage({
      activity: input.activity,
      request: input.requestPayload,
    });

    if (!evaluationPrompt) {
      input.setFeedbackMessage(
        "Completa al menos una respuesta antes de pedir la evaluacion de SofLIA."
      );
      return;
    }

    openLia();

    if (!liaChat?.sendMessage) {
      input.setFeedbackMessage(
        "SofLIA todavia no esta lista. Intenta de nuevo en unos segundos."
      );
      return;
    }

    input.setFeedbackMessage("SofLIA esta evaluando tu actividad en el panel derecho.");
    setLiaEvaluationPending(true);

    try {
      await liaChat.sendMessage(
        evaluationPrompt,
        buildEvaluationContext(input.activity, input.lessonId, courseContext),
        undefined,
        true
      );
    } finally {
      setLiaEvaluationPending(false);
    }
  }, [closeLia, courseContext, input, isInteractionBlocked, isLiaChatLoading, liaChat, openLia]);

  return {
    canEvaluateWithSoflia,
    handleEvaluateWithSoflia,
    isLiaBusy: isLiaChatLoading,
    liaEvaluationPending,
  };
}

function buildEvaluationContext(
  activity: LearnActivity,
  lessonId: string,
  courseContext: CourseLessonContext | null
): CourseLessonContext {
  return {
    ...courseContext,
    lessonId: courseContext?.lessonId ?? lessonId,
    activitiesContext: {
      ...courseContext?.activitiesContext,
      completedActivities: activity.latest_submission_summary?.completionSatisfied ? 1 : 0,
      currentActivityFocus: {
        description: activity.activity_description || activity.activity_title,
        isCompleted: !!activity.latest_submission_summary?.completionSatisfied,
        isRequired: activity.is_required,
        title: activity.activity_title,
        type: activity.activity_type,
      },
      pendingRequiredCount:
        activity.is_required && !activity.latest_submission_summary?.completionSatisfied ? 1 : 0,
      requiredActivities: activity.is_required ? 1 : 0,
      totalActivities: 1,
    },
  } satisfies CourseLessonContext;
}
