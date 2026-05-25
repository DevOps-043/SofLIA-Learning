"use client";

import dynamic from "next/dynamic";
import { useTranslation } from "react-i18next";

function VideoPlayerLoading() {
  const { t } = useTranslation("learn");

  return (
    <div className="flex items-center justify-center aspect-video bg-gray-900 rounded-xl text-white">
      {t("loading.video")}
    </div>
  );
}

export const VideoPlayer = dynamic(
  () => import("@/core/components/VideoPlayer").then(mod => ({ default: mod.VideoPlayer })),
  {
    loading: () => <VideoPlayerLoading />,
    ssr: false,
  },
);
