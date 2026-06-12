import { useEffect } from 'react';
import type { Dispatch, SetStateAction } from 'react';
import type { LearnActivity, LearnActivitySubmission } from '../../types';
import { applySubmissionToState, buildInitialState } from './activity-submission-state';
import { fetchActivitySubmission } from './activity-submission-api';
import type { ActivityFormState } from './types';

interface UseActivitySubmissionLoaderParams {
  activity: LearnActivity;
  lessonId: string;
  organizationId?: string | null;
  setError: Dispatch<SetStateAction<string | null>>;
  setLoading: Dispatch<SetStateAction<boolean>>;
  setState: Dispatch<SetStateAction<ActivityFormState>>;
  setSubmission: Dispatch<SetStateAction<LearnActivitySubmission | null>>;
  slug: string;
}

export function useActivitySubmissionLoader({
  activity,
  lessonId,
  organizationId,
  setError,
  setLoading,
  setState,
  setSubmission,
  slug
}: UseActivitySubmissionLoaderParams) {
  useEffect(() => {
    let isMounted = true;

    async function loadSubmission() {
      if (!activity.activity_config) {
        if (isMounted) resetLocalSubmission(activity, setSubmission, setState, setLoading);
        return;
      }

      try {
        setLoading(true);
        setError(null);
        const payload = await fetchActivitySubmission(
          slug,
          lessonId,
          activity,
          organizationId,
        );
        if (!isMounted) return;
        setSubmission(payload.submission || null);
        setState(applySubmissionToState(activity, payload.submission || null));
      } catch (error) {
        if (!isMounted) return;
        setSubmission(null);
        setState(buildInitialState(activity));
        setError(error instanceof Error ? error.message : 'No fue posible cargar la actividad.');
      } finally {
        if (isMounted) setLoading(false);
      }
    }

    void loadSubmission();

    return () => {
      isMounted = false;
    };
  }, [activity, lessonId, organizationId, setError, setLoading, setState, setSubmission, slug]);
}

function resetLocalSubmission(
  activity: LearnActivity,
  setSubmission: Dispatch<SetStateAction<LearnActivitySubmission | null>>,
  setState: Dispatch<SetStateAction<ActivityFormState>>,
  setLoading: Dispatch<SetStateAction<boolean>>
) {
  setSubmission(null);
  setState(buildInitialState(activity));
  setLoading(false);
}
