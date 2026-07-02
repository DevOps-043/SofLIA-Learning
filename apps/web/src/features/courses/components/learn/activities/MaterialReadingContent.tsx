"use client";

import { useTranslation } from "react-i18next";

import { ReadingContentRenderer } from "../ContentRenderers";
import { ReadingAudioPlayer } from "../reading-voice/ReadingAudioPlayer";
import { useReadingAudioPlayer } from "../reading-voice/useReadingAudioPlayer";
import type { LearnMaterial } from "../types";

interface MaterialReadingContentProps {
  lessonId: string;
  material: LearnMaterial;
  slug: string;
}

/**
 * Reading-material body: a "listen" audio player above the reading renderer.
 * Mirrors the reflection-activity reader (`ReadingActivityContent`) but for the
 * `reading` material type. The player streams the pre-generated MP3; if none
 * exists yet it shows the `unavailable` state instead of triggering synthesis.
 */
export function MaterialReadingContent({
  lessonId,
  material,
  slug,
}: MaterialReadingContentProps) {
  const { t } = useTranslation("learn");
  const player = useReadingAudioPlayer({
    lessonId,
    slug,
    sourceId: material.material_id,
    sourceType: "material_reading",
  });

  return (
    <>
      <div className="mb-2 flex justify-end">
        <ReadingAudioPlayer player={player} t={t} />
      </div>
      <ReadingContentRenderer
        content={material.content_data || material.material_description}
      />
    </>
  );
}
