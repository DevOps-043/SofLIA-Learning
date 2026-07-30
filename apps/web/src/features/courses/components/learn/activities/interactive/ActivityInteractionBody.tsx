import { normalizeContentForRenderer } from "@/lib/course-content";
import { FormattedContentRenderer } from "../../ContentRenderers";
import type { LearnActivity } from "../../types";
import { ChecklistActivityRenderer } from "../ChecklistActivityRenderer";
import { ExternalToolActivityRenderer } from "../ExternalToolActivityRenderer";
import { InlineAnswersActivityRenderer } from "../InlineAnswersActivityRenderer";
import { LongTextActivityRenderer } from "../LongTextActivityRenderer";
import type { useActivitySubmission } from "../useActivitySubmission";

type SubmissionState = ReturnType<typeof useActivitySubmission>;

export function ActivityInteractionBody(props: {
  activity: LearnActivity;
  activityConfig: NonNullable<LearnActivity["activity_config"]>;
  normalizedContent: ReturnType<typeof normalizeContentForRenderer>;
  submissionState: SubmissionState;
}) {
  const { activity, activityConfig, normalizedContent, submissionState } = props;
  const { state } = submissionState;

  return (
    <>
      {shouldShowFormattedContent(activityConfig.interactionType, normalizedContent) && (
        <FormattedContentRenderer
          content={activity.activity_content}
          activityId={activity.activity_id}
          presentation="editorial"
        />
      )}
      {activityConfig.interactionType === "long_text" && (
        <LongTextActivityRenderer evidencePlaceholder={activityConfig.submission.evidencePlaceholder} evidenceValue={state.evidenceText} onEvidenceChange={submissionState.updateEvidenceText} onResponseChange={submissionState.updateResponseText} placeholder={activityConfig.submission.responsePlaceholder} responseValue={state.responseText} />
      )}
      {activityConfig.interactionType === "inline_answers" && (
        <InlineAnswersActivityRenderer content={normalizedContent} evidencePlaceholder={activityConfig.submission.evidencePlaceholder} evidenceValue={state.evidenceText} fields={activityConfig.submission.fields} onEvidenceChange={submissionState.updateEvidenceText} onFieldChange={submissionState.updateInlineAnswer} values={state.inlineAnswers} />
      )}
      {activityConfig.interactionType === "checklist" && (
        <ChecklistActivityRenderer content={normalizedContent} evidencePlaceholder={activityConfig.submission.evidencePlaceholder} evidenceValue={state.evidenceText} items={activityConfig.submission.checklistItems} noteValue={state.responseText} onEvidenceChange={submissionState.updateEvidenceText} onNoteChange={submissionState.updateResponseText} onToggleItem={submissionState.toggleChecklistItem} values={state.checklist} />
      )}
      {activityConfig.interactionType === "external_tool_task" && (
        <ExternalToolActivityRenderer evidencePlaceholder={activityConfig.submission.evidencePlaceholder} evidenceValue={state.evidenceText} onEvidenceChange={submissionState.updateEvidenceText} onResponseChange={submissionState.updateResponseText} promptTemplate={activityConfig.toolTask.promptTemplate} responseValue={state.responseText} />
      )}
    </>
  );
}

function shouldShowFormattedContent(type: string, normalizedContent: string) {
  return ["long_text", "external_tool_task"].includes(type) && normalizedContent.trim().length > 0;
}
