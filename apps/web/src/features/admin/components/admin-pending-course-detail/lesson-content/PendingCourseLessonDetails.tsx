import { useState } from "react";
import type { PendingCourseLesson } from "../types";
import { PendingCourseLessonPanel } from "./PendingCourseLessonPanel";
import { PendingCourseLessonTabs } from "./PendingCourseLessonTabs";
import { PendingCourseVideoPlayer } from "./PendingCourseVideoPlayer";
import type { LessonTab } from "./types";

export function PendingCourseLessonDetails({ lesson }: { lesson: PendingCourseLesson }) {
  const [activeTab, setActiveTab] = useState<LessonTab>("summary");

  return (
    <>
      <div className="mx-auto mb-6 aspect-video max-w-2xl overflow-hidden rounded-lg bg-black">
        <PendingCourseVideoPlayer
          provider={lesson.video_provider}
          providerId={lesson.video_provider_id}
        />
      </div>

      <PendingCourseLessonTabs
        activeTab={activeTab}
        lesson={lesson}
        setActiveTab={setActiveTab}
      />
      <PendingCourseLessonPanel activeTab={activeTab} lesson={lesson} />
    </>
  );
}
