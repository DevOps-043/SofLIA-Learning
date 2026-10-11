"use client";
import useSWR from "swr";
import { liveFetch } from "./client";

/** El vínculo docente pertenece a una organización, no al rol global del perfil. */
export function useInstructorPanelAccess({
  userId, orgSlug, isOpen, isAdmin, isOrgAdmin,
}: {
  userId?: string;
  orgSlug?: string;
  isOpen: boolean;
  isAdmin: boolean;
  isOrgAdmin: boolean;
}) {
  const administers = isAdmin || isOrgAdmin;
  const { data } = useSWR<{ canTeach: boolean }>(
    isOpen && userId && orgSlug && !administers
      ? [`/api/${orgSlug}/live/capabilities`, userId] : null,
    ([url]: [string, string]) => liveFetch(url),
    { dedupingInterval: 5000, shouldRetryOnError: false },
  );
  return orgSlug && (administers || data?.canTeach === true)
    ? `/${orgSlug}/instructor` : null;
}
