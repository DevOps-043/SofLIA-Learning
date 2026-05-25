import { useState } from "react";
import { useTranslation } from "react-i18next";
import { PlayCircleIcon } from "@heroicons/react/24/outline";
import { useMediaPlaybackPolicy } from "@/core/hooks/useMediaPlaybackPolicy";
import { resolveVideoEmbedUrl } from "../utils";

interface PendingCourseVideoPlayerProps {
  provider: string;
  providerId: string;
}

export function PendingCourseVideoPlayer({
  provider,
  providerId,
}: PendingCourseVideoPlayerProps) {
  const [hasActivatedEmbed, setHasActivatedEmbed] = useState(false);
  const playbackPolicy = useMediaPlaybackPolicy("preview");
  const { t } = useTranslation("common");
  const embedUrl = resolveVideoEmbedUrl(provider, providerId);

  if (!providerId) {
    return (
      <div className="flex h-full w-full items-center justify-center bg-gray-900 text-gray-500">
        {t("media.videoUnavailable")}
      </div>
    );
  }

  if (embedUrl && (provider === "youtube" || provider === "vimeo")) {
    if (playbackPolicy.shouldUseEmbedFacade && !hasActivatedEmbed) {
      return (
        <button
          className="flex h-full w-full items-center justify-center bg-gray-900 text-white"
          onClick={() => setHasActivatedEmbed(true)}
          type="button"
        >
          <span className="flex flex-col items-center gap-2">
            <PlayCircleIcon className="h-12 w-12" />
            <span className="text-sm font-medium">{t("media.tapToPlay")}</span>
          </span>
        </button>
      );
    }

    return (
      <iframe
        allow={playbackPolicy.allowIframeAutoplay ? "autoplay; fullscreen; picture-in-picture" : "fullscreen; picture-in-picture"}
        allowFullScreen
        className="h-full w-full"
        frameBorder="0"
        loading="lazy"
        src={embedUrl}
      />
    );
  }

  return (
    <video
      className="h-full w-full object-contain"
      controls
      controlsList="nodownload"
      playsInline
      preload={playbackPolicy.nativeVideoPreload}
      src={providerId}
    />
  );
}
