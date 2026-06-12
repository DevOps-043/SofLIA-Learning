import type { LearnActivity } from '../../types';
import type { ActivitySubmissionApiPayload, SubmissionRequestPayload } from './types';

export async function parseResponse(response: Response) {
  const payload = await response.json().catch(() => ({}));

  if (!response.ok) {
    const message =
      typeof payload.error === 'string'
        ? payload.error
        : 'No fue posible procesar la actividad.';
    throw new Error(message);
  }

  return payload as ActivitySubmissionApiPayload;
}

export function buildSubmissionUrl(
  slug: string,
  lessonId: string,
  activity: LearnActivity,
  organizationId?: string | null,
) {
  const query = new URLSearchParams();
  if (organizationId) query.set('orgId', organizationId);
  const queryString = query.toString();
  return `/api/courses/${slug}/lessons/${lessonId}/activities/${activity.activity_id}/submission${queryString ? `?${queryString}` : ''}`;
}

export async function fetchActivitySubmission(
  slug: string,
  lessonId: string,
  activity: LearnActivity,
  organizationId?: string | null,
) {
  const response = await fetch(buildSubmissionUrl(slug, lessonId, activity, organizationId), {
    cache: 'no-store',
    credentials: 'include'
  });

  return parseResponse(response);
}

export async function postActivitySubmission(
  slug: string,
  lessonId: string,
  activity: LearnActivity,
  requestPayload: SubmissionRequestPayload,
  status: 'draft' | 'submitted'
) {
  const response = await fetch(buildSubmissionUrl(slug, lessonId, activity), {
    body: JSON.stringify({ ...requestPayload, status }),
    credentials: 'include',
    headers: { 'Content-Type': 'application/json' },
    method: 'POST'
  });

  return parseResponse(response);
}

export async function validateActivitySubmission(
  slug: string,
  lessonId: string,
  activity: LearnActivity,
  requestPayload: SubmissionRequestPayload
) {
  const response = await fetch(
    `/api/courses/${slug}/lessons/${lessonId}/activities/${activity.activity_id}/validate`,
    {
      body: JSON.stringify(requestPayload),
      credentials: 'include',
      headers: { 'Content-Type': 'application/json' },
      method: 'POST'
    }
  );

  return parseResponse(response);
}
