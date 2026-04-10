"use client";

import { useCallback, useEffect, useMemo, useState } from "react";

import type {
  LearnActivity,
  LearnActivitySubmission,
} from "../types";

type ActivityFormState = {
  checklist: Record<string, boolean>;
  evidenceText: string;
  inlineAnswers: Record<string, string>;
  responseText: string;
};

function buildInitialState(activity: LearnActivity): ActivityFormState {
  const activityConfig = activity.activity_config;

  const inlineAnswers =
    activityConfig?.interactionType === "inline_answers"
      ? Object.fromEntries(
          activityConfig.submission.fields.map((field) => [field.id, ""])
        )
      : {};

  const checklist =
    activityConfig?.interactionType === "checklist"
      ? Object.fromEntries(
          activityConfig.submission.checklistItems.map((item) => [item.id, false])
        )
      : {};

  return {
    checklist,
    evidenceText: "",
    inlineAnswers,
    responseText: "",
  };
}

function buildSubmissionRequest(activity: LearnActivity, state: ActivityFormState) {
  const activityConfig = activity.activity_config;
  const evidencePayload = state.evidenceText.trim()
    ? { text: state.evidenceText.trim() }
    : null;

  if (!activityConfig) {
    return {
      evidencePayload,
      responsePayload: { text: state.responseText },
      responseText: state.responseText,
    };
  }

  if (activityConfig.interactionType === "inline_answers") {
    return {
      evidencePayload,
      responsePayload: {
        answers: state.inlineAnswers,
      },
      responseText: state.responseText,
    };
  }

  if (activityConfig.interactionType === "checklist") {
    return {
      evidencePayload,
      responsePayload: {
        checklist: state.checklist,
        text: state.responseText,
      },
      responseText: state.responseText,
    };
  }

  if (activityConfig.interactionType === "external_tool_task") {
    return {
      evidencePayload,
      responsePayload: {
        text: state.responseText,
        toolKey: activityConfig.toolTask.toolKey,
      },
      responseText: state.responseText,
    };
  }

  return {
    evidencePayload,
    responsePayload: {
      text: state.responseText,
    },
    responseText: state.responseText,
  };
}

function applySubmissionToState(
  activity: LearnActivity,
  submission: LearnActivitySubmission | null
): ActivityFormState {
  const baseState = buildInitialState(activity);
  if (!submission) {
    return baseState;
  }

  const responsePayload = submission.responsePayload || {};
  const evidencePayload = submission.evidencePayload || {};

  return {
    checklist: {
      ...baseState.checklist,
      ...(typeof responsePayload.checklist === "object" &&
      responsePayload.checklist !== null &&
      !Array.isArray(responsePayload.checklist)
        ? (responsePayload.checklist as Record<string, boolean>)
        : {}),
    },
    evidenceText:
      typeof evidencePayload.text === "string" ? evidencePayload.text : "",
    inlineAnswers: {
      ...baseState.inlineAnswers,
      ...(typeof responsePayload.answers === "object" &&
      responsePayload.answers !== null &&
      !Array.isArray(responsePayload.answers)
        ? (responsePayload.answers as Record<string, string>)
        : {}),
    },
    responseText:
      submission.responseText ||
      (typeof responsePayload.text === "string" ? responsePayload.text : ""),
  };
}

async function parseResponse(response: Response) {
  const payload = await response.json().catch(() => ({}));

  if (!response.ok) {
    const message =
      typeof payload.error === "string"
        ? payload.error
        : "No fue posible procesar la actividad.";
    throw new Error(message);
  }

  return payload as {
    evaluation?: unknown;
    submission?: LearnActivitySubmission | null;
  };
}

export function useActivitySubmission({
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
  const [submission, setSubmission] = useState<LearnActivitySubmission | null>(
    null
  );
  const [state, setState] = useState<ActivityFormState>(() =>
    buildInitialState(activity)
  );
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [validating, setValidating] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [feedbackMessage, setFeedbackMessage] = useState<string | null>(null);

  useEffect(() => {
    let isMounted = true;

    async function loadSubmission() {
      if (!activity.activity_config) {
        if (!isMounted) {
          return;
        }

        setSubmission(null);
        setState(buildInitialState(activity));
        setLoading(false);
        return;
      }

      try {
        setLoading(true);
        setError(null);

        const response = await fetch(
          `/api/courses/${slug}/lessons/${lessonId}/activities/${activity.activity_id}/submission`,
          {
            cache: "no-store",
            credentials: "include",
          }
        );
        const payload = await parseResponse(response);

        if (!isMounted) {
          return;
        }

        setSubmission(payload.submission || null);
        setState(applySubmissionToState(activity, payload.submission || null));
      } catch (fetchError) {
        if (!isMounted) {
          return;
        }

        setSubmission(null);
        setState(buildInitialState(activity));
        setError(
          fetchError instanceof Error
            ? fetchError.message
            : "No fue posible cargar la actividad."
        );
      } finally {
        if (isMounted) {
          setLoading(false);
        }
      }
    }

    void loadSubmission();

    return () => {
      isMounted = false;
    };
  }, [activity, lessonId, slug]);

  const requestPayload = useMemo(
    () => buildSubmissionRequest(activity, state),
    [activity, state]
  );

  const updateResponseText = useCallback((value: string) => {
    setState((currentState) => ({
      ...currentState,
      responseText: value,
    }));
  }, []);

  const updateEvidenceText = useCallback((value: string) => {
    setState((currentState) => ({
      ...currentState,
      evidenceText: value,
    }));
  }, []);

  const updateInlineAnswer = useCallback((fieldId: string, value: string) => {
    setState((currentState) => ({
      ...currentState,
      inlineAnswers: {
        ...currentState.inlineAnswers,
        [fieldId]: value,
      },
    }));
  }, []);

  const toggleChecklistItem = useCallback((itemId: string) => {
    setState((currentState) => ({
      ...currentState,
      checklist: {
        ...currentState.checklist,
        [itemId]: !currentState.checklist[itemId],
      },
    }));
  }, []);

  const saveSubmission = useCallback(
    async (status: "draft" | "submitted") => {
      try {
        setSaving(true);
        setError(null);

        const response = await fetch(
          `/api/courses/${slug}/lessons/${lessonId}/activities/${activity.activity_id}/submission`,
          {
            body: JSON.stringify({
              ...requestPayload,
              status,
            }),
            credentials: "include",
            headers: { "Content-Type": "application/json" },
            method: "POST",
          }
        );

        const payload = await parseResponse(response);
        setSubmission(payload.submission || null);
        if (payload.submission) {
          setState(applySubmissionToState(activity, payload.submission));
        }
        setFeedbackMessage(
          status === "draft"
            ? "Borrador guardado."
            : "Actividad enviada correctamente."
        );
        await onSubmissionSaved?.();
      } catch (saveError) {
        setError(
          saveError instanceof Error
            ? saveError.message
            : "No fue posible guardar la actividad."
        );
      } finally {
        setSaving(false);
      }
    },
    [activity, lessonId, onSubmissionSaved, requestPayload, slug]
  );

  const validateWithSoflia = useCallback(async () => {
    try {
      setValidating(true);
      setError(null);

      const response = await fetch(
        `/api/courses/${slug}/lessons/${lessonId}/activities/${activity.activity_id}/validate`,
        {
          body: JSON.stringify(requestPayload),
          credentials: "include",
          headers: { "Content-Type": "application/json" },
          method: "POST",
        }
      );

      const payload = await parseResponse(response);
      setSubmission(payload.submission || null);
      if (payload.submission) {
        setState(applySubmissionToState(activity, payload.submission));
      }
      setFeedbackMessage("Retroalimentacion de SofLIA actualizada.");
      await onSubmissionSaved?.();
    } catch (validationError) {
      setError(
        validationError instanceof Error
          ? validationError.message
          : "No fue posible validar la actividad."
      );
    } finally {
      setValidating(false);
    }
  }, [activity, lessonId, onSubmissionSaved, requestPayload, slug]);

  return {
    error,
    feedbackMessage,
    loading,
    requestPayload,
    saving,
    setFeedbackMessage,
    state,
    submission,
    toggleChecklistItem,
    updateEvidenceText,
    updateInlineAnswer,
    updateResponseText,
    validateWithSoflia,
    validating,
    saveDraft: () => saveSubmission("draft"),
    submitActivity: () => saveSubmission("submitted"),
  };
}
