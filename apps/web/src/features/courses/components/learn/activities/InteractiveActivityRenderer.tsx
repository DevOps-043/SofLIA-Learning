"use client";

import { useMemo, useState } from "react";

import { normalizeContentForRenderer } from "@/lib/course-content";
import { FormattedContentRenderer } from "../ContentRenderers";
import type { LearnActivity } from "../types";
import { SofliaDialogueActivityRenderer } from "./SofliaDialogueActivityRenderer";
import { ActivityActionButtons } from "./interactive/ActivityActionButtons";
import { ActivityInteractionBody } from "./interactive/ActivityInteractionBody";
import { ActivityMessages } from "./interactive/ActivityMessages";
import { LatestEvaluationPanel } from "./interactive/LatestEvaluationPanel";
import { SubmissionStatusBadges } from "./interactive/SubmissionStatusBadges";
import { ToolTaskActions } from "./interactive/ToolTaskActions";
import { useActivitySofliaEvaluation } from "./interactive/useActivitySofliaEvaluation";
import { useActivitySubmission } from "./useActivitySubmission";

export function InteractiveActivityRenderer({
  activity,
  lessonId,
  onSubmissionSaved,
  slug,
}: {
  activity: LearnActivity;
  lessonId: string;
  onSubmissionSaved?: () => void | Promise<void>;
  slug: string;
}) {
  const [toolActionMessage, setToolActionMessage] = useState<string | null>(null);
  const activityConfig = activity.activity_config;
  const normalizedContent = useMemo(
    () => normalizeContentForRenderer(activity.activity_content),
    [activity.activity_content]
  );
  const submissionState = useActivitySubmission({
    activity,
    lessonId,
    onSubmissionSaved,
    slug,
  });
  const soflia = useActivitySofliaEvaluation({
    activity,
    lessonId,
    requestPayload: submissionState.requestPayload,
    setFeedbackMessage: submissionState.setFeedbackMessage,
  });

  if (!activityConfig) {
    return (
      <FormattedContentRenderer
        content={activity.activity_content}
        activityId={activity.activity_id}
      />
    );
  }

  if (activityConfig.interactionType === "soflia_dialogue") {
    return (
      <SofliaDialogueActivityRenderer
        activity={activity}
        lessonId={lessonId}
        onSessionUpdated={onSubmissionSaved}
        slug={slug}
      />
    );
  }

  return (
    <div className="space-y-4">
      <SubmissionStatusBadges activity={activity} activityConfig={activityConfig} />
      <ToolTaskActions
        activity={activity}
        activityConfig={activityConfig}
        message={toolActionMessage}
        setMessage={setToolActionMessage}
      />
      <ActivityInteractionBody
        activity={activity}
        activityConfig={activityConfig}
        normalizedContent={normalizedContent}
        submissionState={submissionState}
      />
      <ActivityMessages
        error={submissionState.error}
        feedbackMessage={submissionState.feedbackMessage}
        loading={submissionState.loading}
        submissionRequirementIssues={submissionState.submissionRequirementIssues}
      />
      <LatestEvaluationPanel evaluation={submissionState.submission?.latestEvaluation?.feedback} />
      <ActivityActionButtons activityConfig={activityConfig} canEvaluateWithSoflia={soflia.canEvaluateWithSoflia} isLiaBusy={soflia.isLiaBusy} isSubmissionStructurallyComplete={submissionState.submissionRequirementIssues.length === 0} liaEvaluationPending={soflia.liaEvaluationPending} loading={submissionState.loading} onEvaluateWithSoflia={soflia.handleEvaluateWithSoflia} onSaveDraft={submissionState.saveDraft} onSubmitActivity={submissionState.submitActivity} saving={submissionState.saving} setFeedbackMessage={submissionState.setFeedbackMessage} />
    </div>
  );
}
