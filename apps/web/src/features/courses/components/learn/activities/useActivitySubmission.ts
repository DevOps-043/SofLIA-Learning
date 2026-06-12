"use client";

import { useCallback, useMemo, useState } from "react";
import { useParams } from "next/navigation";
import { useCurrentOrganizationId } from "@/core/stores/organizationStore";
import { getActivitySubmissionRequirementIssues } from "@/features/courses/services/activity-submission-requirements.service";
import { buildInitialState, buildSubmissionRequest } from "./useActivitySubmission/activity-submission-state";
import { useActivitySubmissionActions } from "./useActivitySubmission/useActivitySubmissionActions";
import { useActivitySubmissionLoader } from "./useActivitySubmission/useActivitySubmissionLoader";
import type { ActivityFormState, UseActivitySubmissionParams } from "./useActivitySubmission/types";
import type { LearnActivitySubmission } from "../types";

export function useActivitySubmission({
  activity,
  lessonId,
  onSubmissionSaved,
  organizationId: explicitOrganizationId,
  slug,
}: UseActivitySubmissionParams) {
  const params = useParams();
  const currentOrganizationId = useCurrentOrganizationId();
  const routeOrgSlug = params?.orgSlug;
  const organizationId = explicitOrganizationId ?? (routeOrgSlug ? currentOrganizationId : null);
  const [submission, setSubmission] = useState<LearnActivitySubmission | null>(null);
  const [state, setState] = useState<ActivityFormState>(() => buildInitialState(activity));
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [validating, setValidating] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [feedbackMessage, setFeedbackMessage] = useState<string | null>(null);

  useActivitySubmissionLoader({
    activity,
    lessonId,
    setError,
    setLoading,
    setState,
    setSubmission,
    slug,
    organizationId,
  });

  const requestPayload = useMemo(
    () => ({
      ...buildSubmissionRequest(activity, state),
      organizationId,
    }),
    [activity, organizationId, state],
  );
  const submissionRequirementIssues = useMemo(() => {
    if (!activity.activity_config) return [];
    return getActivitySubmissionRequirementIssues(activity.activity_config, requestPayload);
  }, [activity.activity_config, requestPayload]);

  const actions = useActivitySubmissionActions({
    activity,
    lessonId,
    onSubmissionSaved,
    requestPayload,
    setError,
    setFeedbackMessage,
    setSaving,
    setState,
    setSubmission,
    setValidating,
    slug,
    submissionRequirementIssues,
  });

  const updateResponseText = useCallback((value: string) => {
    setState((current) => ({ ...current, responseText: value }));
  }, []);

  const updateEvidenceText = useCallback((value: string) => {
    setState((current) => ({ ...current, evidenceText: value }));
  }, []);

  const updateInlineAnswer = useCallback((fieldId: string, value: string) => {
    setState((current) => ({
      ...current,
      inlineAnswers: { ...current.inlineAnswers, [fieldId]: value },
    }));
  }, []);

  const toggleChecklistItem = useCallback((itemId: string) => {
    setState((current) => ({
      ...current,
      checklist: { ...current.checklist, [itemId]: !current.checklist[itemId] },
    }));
  }, []);

  return {
    error,
    feedbackMessage,
    loading,
    requestPayload,
    saving,
    setFeedbackMessage,
    state,
    submission,
    submissionRequirementIssues,
    toggleChecklistItem,
    updateEvidenceText,
    updateInlineAnswer,
    updateResponseText,
    validateWithSoflia: actions.validateWithSoflia,
    validating,
    saveDraft: actions.saveDraft,
    submitActivity: actions.submitActivity,
  };
}
