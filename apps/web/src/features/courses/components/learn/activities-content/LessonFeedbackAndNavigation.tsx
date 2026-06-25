import { useState } from "react";
import { CheckCircle2, ChevronRight, Loader2, ThumbsDown, ThumbsUp } from "lucide-react";
import { useTranslation } from "react-i18next";

import type { ActivitiesData } from "./types";

export function LessonFeedbackAndNavigation(props: {
  data: ActivitiesData;
  hasNextLesson?: boolean;
  onCompleteCourse?: () => void | Promise<void>;
  onNavigateNext?: () => void | Promise<void>;
}) {
  const { t } = useTranslation("learn");

  return (
    <div className="mt-6 flex flex-col gap-4 md:flex-row md:items-center md:justify-between pt-4 border-t border-gray-200 dark:border-white/5">
      <div className="flex items-center gap-3">
        <span className="text-xs text-gray-500 dark:text-white/40">
          {t("activities.feedback.useful")}
        </span>
        <FeedbackButton
          active={props.data.lessonFeedback === "like"}
          disabled={props.data.feedbackLoading}
          icon={ThumbsUp}
          label={t("activities.feedback.yes")}
          onClick={() => void props.data.handleLessonFeedback("like")}
          variant="positive"
        />
        <FeedbackButton
          active={props.data.lessonFeedback === "dislike"}
          disabled={props.data.feedbackLoading}
          icon={ThumbsDown}
          label={t("activities.feedback.no")}
          onClick={() => void props.data.handleLessonFeedback("dislike")}
          variant="negative"
        />
      </div>
      {props.hasNextLesson && props.onNavigateNext ? (
        <NavigationButton onClick={props.onNavigateNext} label={t("navigation.nextVideo")} />
      ) : null}
      {!props.hasNextLesson && props.onCompleteCourse ? (
        <NavigationButton onClick={props.onCompleteCourse} label={t("navigation.finishCourse")} finish />
      ) : null}
    </div>
  );
}

function FeedbackButton(props: {
  active: boolean;
  disabled: boolean;
  icon: typeof ThumbsUp;
  label: string;
  onClick: () => void;
  variant: "negative" | "positive";
}) {
  const Icon = props.icon;
  const activeClasses =
    props.variant === "positive"
      ? ""
      : "bg-red-100 dark:bg-red-500/10 text-red-600 dark:text-red-400";

  return (
    <button
      onClick={props.onClick}
      disabled={props.disabled}
      className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-medium transition-colors ${props.active ? activeClasses : "text-gray-500 dark:text-white/50 hover:bg-gray-100 dark:hover:bg-white/5"} ${props.disabled ? "opacity-50" : ""}`}
      style={props.active && props.variant === 'positive' ? {
        backgroundColor: 'color-mix(in srgb, var(--learn-accent) 15%, transparent)',
        color: 'var(--learn-accent)',
      } : undefined}
    >
      <Icon className={`w-3.5 h-3.5 ${props.active ? "fill-current" : ""}`} />
      {props.label}
    </button>
  );
}

function NavigationButton(props: {
  finish?: boolean;
  label: string;
  onClick: () => void | Promise<void>;
}) {
  const Icon = props.finish ? CheckCircle2 : ChevronRight;
  const [isLoading, setIsLoading] = useState(false);

  const handleClick = async () => {
    if (isLoading) return;

    setIsLoading(true);
    try {
      await props.onClick();
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <button
      onClick={() => void handleClick()}
      disabled={isLoading}
      className="flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-colors disabled:cursor-wait disabled:opacity-70"
      style={{ backgroundColor: 'var(--learn-action)', color: 'var(--learn-on-action)' }}
    >
      {props.label}
      {isLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Icon className="w-4 h-4" />}
    </button>
  );
}
