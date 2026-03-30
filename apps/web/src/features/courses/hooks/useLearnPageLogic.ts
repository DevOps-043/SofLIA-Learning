"use client";

import {
  useState,
  useEffect,
  useRef,
  useCallback,
  useMemo,
} from "react";
import { useParams, useRouter } from "next/navigation";
import { useTranslation } from "react-i18next";
import { dedupedFetch } from "../../../lib/supabase/request-deduplication";
import { useAuth } from "../../auth/hooks/useAuth";
import { useSwipe } from "../../../hooks/useSwipe";
import { useCourseTheme } from "./useCourseTheme";
import { useLiaCourse } from "../context/LiaCourseContext";
import { useLessonSidebarState } from "./useLessonSidebarState";
import { useNotesManagement } from "./useNotesManagement";
import { useLessonNavigation } from "./useLessonNavigation";
import {
  canCompleteOrderedLesson,
  findOrderedLessonIndex,
  getOrderedLessons,
} from "./lessonNavigation.utils";
import { useCourseLearnTour } from "../../tours/hooks/useCourseLearnTour";
import { useUserBehaviorLog } from "./useUserBehaviorLog";
import { useLessonCompletion } from "./useLessonCompletion";
import { useVideoPlayerOptional } from "../../../app/courses/[slug]/learn/VideoPlayerContext";
import type { CourseLessonContext } from "../../../core/types/lia.types";
import type {
  LearnCourseData,
  LearnLesson,
  LearnModule,
  LearnTab,
} from "../components/learn/types";
import type React from "react";
import Joyride from "react-joyride";

type Lesson = LearnLesson;
type Module = LearnModule;
type CourseData = LearnCourseData;

const MOBILE_BOTTOM_NAV_HEIGHT_PX = 104;
const CONTENT_BOTTOM_PADDING_MOBILE = 32;

export function useLearnPageLogic() {
  const params = useParams();
  const router = useRouter();
  const slug = params.slug as string;

  const { isOpen: isLiaOpen, openLia, closeLia, liaChat } = useLiaCourse();

  const sendLiaMessage = useCallback(
    async (
      message: string,
      courseContext?: any,
      workshopContext?: any,
      isSystemMessage: boolean = false
    ) => {
      if (liaChat?.sendMessage) {
        if (!isLiaOpen) openLia();
        await liaChat.sendMessage(
          message,
          courseContext,
          workshopContext,
          isSystemMessage
        );
      } else {
        console.warn("LIA Chat no inicializado");
      }
    },
    [liaChat, isLiaOpen, openLia]
  );

  const { user } = useAuth();
  const colors = useCourseTheme();

  const { t, i18n, ready } = useTranslation("learn");
  const selectedLang =
    i18n.language === "en" ? "en" : i18n.language === "pt" ? "pt" : "es";

  const [mounted, setMounted] = useState(false);
  useEffect(() => {
    setMounted(true);
  }, []);


  // Core course state
  const [course, setCourse] = useState<CourseData | null>(null);
  const [modules, setModules] = useState<Module[]>([]);
  const [currentLesson, setCurrentLesson] = useState<Lesson | null>(null);
  const [workshopMetadata, setWorkshopMetadata] = useState<CourseLessonContext | null>(null);
  const [liaTranscript, setLiaTranscript] = useState<string | null>(null);
  const [liaSummary, setLiaSummary] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<LearnTab>("video");

  const videoPlayerContext = useVideoPlayerOptional();

  const handleTabChange = useCallback(
    async (newTab: LearnTab) => {
      if (activeTab === "video" && newTab !== "video") {
        const videoElement = document.querySelector(
          ".aspect-video video"
        ) as HTMLVideoElement | null;

        if (videoElement) {
          const isVideoCurrentlyPlaying = !videoElement.paused;
          const isPiPAlreadyActive = !!document.pictureInPictureElement;
          const isPiPSupported =
            document.pictureInPictureEnabled &&
            "requestPictureInPicture" in videoElement;

          if (isVideoCurrentlyPlaying && !isPiPAlreadyActive && isPiPSupported) {
            try {
              await videoElement.requestPictureInPicture();
              videoPlayerContext?.setIsPiPActive(true);
            } catch (err) {}
          }
        }
      }

      if (newTab === "video" && activeTab !== "video") {
        if (document.pictureInPictureElement) {
          const pipVideo = document.pictureInPictureElement as HTMLVideoElement;
          const currentTime = pipVideo.currentTime;
          const wasPlaying = !pipVideo.paused;

          if (currentLesson && videoPlayerContext) {
            videoPlayerContext.saveVideoProgress(currentLesson.lesson_id, currentTime);
          }

          pipVideo.pause();

          try {
            await document.exitPictureInPicture();
            videoPlayerContext?.setIsPiPActive(false);
          } catch (err) {}

          if (wasPlaying) {
            if (videoPlayerContext) {
              videoPlayerContext.setShouldAutoPlay(true);
            }
          }

          setActiveTab(newTab);

          if (wasPlaying) {
            setTimeout(() => {
              const mainVideo = document.querySelector(
                ".aspect-video video"
              ) as HTMLVideoElement | null;
              if (mainVideo && mainVideo.paused) {
                mainVideo.currentTime = currentTime;
                mainVideo.play().catch(() => {});
                videoPlayerContext?.setShouldAutoPlay(false);
              }
            }, 500);
          }

          return;
        }
      }

      setActiveTab(newTab);
    },
    [activeTab, videoPlayerContext, currentLesson]
  );

  const [isMobile, setIsMobile] = useState(false);
  const [screenHeight, setScreenHeight] = useState(0);
  const [visualViewportHeight, setVisualViewportHeight] = useState<number | null>(null);

  const {
    closeLeftPanel,
    expandedLessons,
    expandedModules,
    isLeftPanelOpen,
    isMaterialCollapsed,
    isNotesCollapsed,
    lessonsActivities,
    lessonsMaterials,
    lessonsQuizStatus,
    loadLessonActivitiesAndMaterials,
    openContentSection,
    openLeftPanel,
    openNotesSection,
    toggleLessonExpand,
    toggleMaterialCollapsed,
    toggleModuleExpand,
    toggleNotesCollapsed,
  } = useLessonSidebarState({
    slug,
    modules,
    currentLesson,
    isMobile,
  });

  const { joyrideProps } = useCourseLearnTour({
    enabled: true,
    onOpenLia: openLia,
    onSwitchTab: (tab) => setActiveTab(tab),
    onOpenNotes: (shouldScroll = true) => {
      openNotesSection({ collapseMaterials: false });
      if (shouldScroll) {
        setTimeout(() => {
          const element = document.getElementById("tour-notes-section");
          if (element) {
            element.scrollIntoView({ behavior: "smooth", block: "center" });
          }
        }, 100);
      }
    },
  });
  const joyrideComponentProps = joyrideProps as React.ComponentProps<typeof Joyride>;

  const [isJoyrideMounted, setIsJoyrideMounted] = useState(false);
  useEffect(() => {
    setIsJoyrideMounted(true);
  }, []);

  const [currentActivityPrompts, setCurrentActivityPrompts] = useState<string[]>([]);
  const [isPromptsCollapsed, setIsPromptsCollapsed] = useState(false);

  const isMobileBottomNavVisible = isMobile && !isLeftPanelOpen;
  const mobileContentPaddingBottom = isMobileBottomNavVisible
    ? `calc(${MOBILE_BOTTOM_NAV_HEIGHT_PX}px + env(safe-area-inset-bottom, 0px) + ${CONTENT_BOTTOM_PADDING_MOBILE}px)`
    : `calc(env(safe-area-inset-bottom, 0px) + ${CONTENT_BOTTOM_PADDING_MOBILE}px)`;

  const {
    addNoteToLocalState,
    applyServerNotesStats,
    closeDeleteNoteConfirm,
    closeNotesModal,
    confirmDeleteNote,
    editingNote,
    handleDeleteNote,
    handleSaveNote,
    initializeNotesStats,
    isDeleteNoteConfirmOpen,
    isDeletingNote,
    isNotesModalOpen,
    notesStats,
    openEditNoteModal,
    openLiaNoteModal,
    openNewNoteModal,
    savedNotes,
    updateNotesStatsOptimized,
  } = useNotesManagement({
    slug,
    modules,
    currentLesson,
    isNotesCollapsed,
    closeLia,
  });

  function handleSaveLiaNote(content: string) {
    openLiaNoteModal(content);
  }

  const [loading, setLoading] = useState(true);
  const [courseProgress, setCourseProgress] = useState(6);

  const prevPromptsLengthRef = useRef<number>(0);
  const checkedAutoRedirectRef = useRef<string | null>(null);

  const [isClearHistoryModalOpen, setIsClearHistoryModalOpen] = useState(false);

  const { userBehaviorLog, trackUserAction, analyzeUserBehavior } = useUserBehaviorLog(currentLesson);

  // Clear prompts on tab change
  useEffect(() => {
    if (activeTab !== "activities") {
      setCurrentActivityPrompts([]);
      setIsPromptsCollapsed(false);
      prevPromptsLengthRef.current = 0;
    }
  }, [activeTab]);

  // Reset collapsed state when new prompts arrive
  useEffect(() => {
    const prevLength = prevPromptsLengthRef.current;
    const currentLength = currentActivityPrompts.length;

    if (prevLength === 0 && currentLength > 0) {
      setIsPromptsCollapsed(false);
    }

    prevPromptsLengthRef.current = currentLength;
  }, [currentActivityPrompts.length]);

  const handlePromptsChange = useCallback((prompts: string[]) => {
    setCurrentActivityPrompts(prompts);
  }, []);

  // Screen size detection
  useEffect(() => {
    const checkMobile = () => {
      const mobile = window.innerWidth < 768;
      setIsMobile(mobile);
      setScreenHeight(window.innerHeight);
    };

    checkMobile();
    window.addEventListener("resize", checkMobile);
    return () => window.removeEventListener("resize", checkMobile);
  }, []);

  // Visual viewport tracking for mobile keyboard
  useEffect(() => {
    if (!isMobile) {
      setVisualViewportHeight(null);
      return;
    }

    if (typeof window !== "undefined" && window.visualViewport) {
      const updateViewportHeight = () => {
        setVisualViewportHeight(window.visualViewport?.height || null);
      };

      updateViewportHeight();
      window.visualViewport.addEventListener("resize", updateViewportHeight);
      window.visualViewport.addEventListener("scroll", updateViewportHeight);

      return () => {
        window.visualViewport?.removeEventListener("resize", updateViewportHeight);
        window.visualViewport?.removeEventListener("scroll", updateViewportHeight);
      };
    } else {
      const handleResize = () => {
        setVisualViewportHeight(window.innerHeight);
      };

      handleResize();
      window.addEventListener("resize", handleResize);
      return () => window.removeEventListener("resize", handleResize);
    }
  }, [isMobile]);

  const calculateLiaMaxHeight = useMemo(() => {
    if (isMobile) {
      if (visualViewportHeight !== null) {
        const headerHeight = 56;
        const bottomNavHeight = isMobileBottomNavVisible ? MOBILE_BOTTOM_NAV_HEIGHT_PX : 0;
        return `calc(${visualViewportHeight - headerHeight - bottomNavHeight}px - env(safe-area-inset-bottom, 0px))`;
      }
      return undefined;
    }
    return "calc(100vh - 3rem)";
  }, [isMobile, isMobileBottomNavVisible, visualViewportHeight]);

  const getInputAreaPadding = (): string => {
    if (!isMobile) return "1rem";
    if (screenHeight < 600) {
      return `calc(0.75rem + max(env(safe-area-inset-bottom, 0px), 4px))`;
    }
    if (screenHeight < 800) {
      return `calc(1rem + max(env(safe-area-inset-bottom, 0px), 8px))`;
    }
    return `calc(1rem + max(env(safe-area-inset-bottom, 0px), 8px))`;
  };

  const swipeRef = useSwipe({
    onSwipeRight: () => {
      if (isMobile && !isLeftPanelOpen) {
        openLeftPanel();
      }
    },
    onSwipeLeft: () => {},
    threshold: 50,
    velocity: 0.3,
    enabled: isMobile && !isLeftPanelOpen,
  });

  // Course data loading
  useEffect(() => {
    async function loadCourse() {
      try {
        setLoading(true);

        const lessonId =
          currentLesson?.lesson_id || modules[0]?.lessons[0]?.lesson_id;
        const queryParams = new URLSearchParams();
        if (lessonId) {
          queryParams.append("lessonId", lessonId);
        }
        queryParams.append("language", selectedLang);
        const queryString = queryParams.toString();
        const fullQuery = queryString ? `?${queryString}` : "";

        const learnData = await dedupedFetch(
          `/api/courses/${slug}/learn-data${fullQuery}`,
          { credentials: "include" }
        );

        if (learnData.course) {
          setCourse(learnData.course);

          if (learnData.course.id || learnData.course.course_id) {
            const courseId = learnData.course.id || learnData.course.course_id;
            try {
              const metadataResponse = await fetch(
                `/api/workshops/${courseId}/metadata`
              );
              if (metadataResponse.ok) {
                const metadataData = await metadataResponse.json();
                if (metadataData.success && metadataData.metadata) {
                  const workshopContext: CourseLessonContext = {
                    contextType: "workshop",
                    courseId: metadataData.metadata.workshopId,
                    courseSlug: slug,
                    courseTitle: metadataData.metadata.workshopTitle,
                    courseDescription: metadataData.metadata.workshopDescription,
                    allModules: metadataData.metadata.modules.map((m: any) => ({
                      moduleId: m.moduleId,
                      moduleTitle: m.moduleTitle,
                      moduleDescription: m.moduleDescription,
                      moduleOrderIndex: m.moduleOrderIndex,
                      lessons: m.lessons.map((l: any) => ({
                        lessonId: l.lessonId,
                        lessonTitle: l.lessonTitle,
                        lessonDescription: l.lessonDescription,
                        lessonOrderIndex: l.lessonOrderIndex,
                        durationSeconds: l.durationSeconds,
                      })),
                    })),
                    userRole: user?.job_title || undefined,
                  };
                  setWorkshopMetadata(workshopContext);
                }
              }
            } catch (error) {
              console.warn(
                "No se pudieron cargar metadatos del taller para LIA:",
                error
              );
            }
          }
        }

        if (learnData.modules) {
          setModules(learnData.modules);

          const allLessons = learnData.modules.flatMap((m: Module) => m.lessons);
          const completedLessons = allLessons.filter((l: Lesson) => l.is_completed);
          const totalProgress =
            allLessons.length > 0
              ? Math.round((completedLessons.length / allLessons.length) * 100)
              : 0;
          setCourseProgress(totalProgress);

          if (learnData.lastWatchedLessonId && allLessons.length > 0) {
            const lastWatchedLesson = allLessons.find(
              (l: Lesson) => l.lesson_id === learnData.lastWatchedLessonId
            );
            if (lastWatchedLesson) {
              setCurrentLesson(lastWatchedLesson);
            } else {
              const nextIncomplete = allLessons.find((l: Lesson) => !l.is_completed);
              setCurrentLesson(nextIncomplete || allLessons[0]);
            }
          } else if (allLessons.length > 0) {
            const nextIncomplete = allLessons.find((l: Lesson) => !l.is_completed);
            setCurrentLesson(nextIncomplete || allLessons[0]);
          }
        }

        if (learnData.notesStats) {
          applyServerNotesStats(learnData.notesStats);
        }

        if (learnData.lastWatchedLessonId && !lessonId && learnData.modules) {
          dedupedFetch(
            `/api/courses/${slug}/learn-data?lessonId=${learnData.lastWatchedLessonId}`,
            { credentials: "include" }
          ).catch(() => null);
        }
      } catch (error) {
        // Error handled silently
      } finally {
        setLoading(false);
      }
    }

    if (slug) {
      loadCourse();
    }
  }, [slug, i18n.language]);

  useEffect(() => {
    if (modules.length > 0 && notesStats.lessonsWithNotes === "0/0") {
      initializeNotesStats();
    }
  }, [initializeNotesStats, modules.length, notesStats.lessonsWithNotes]);

  // Load LIA transcript and summary context in background
  useEffect(() => {
    setLiaTranscript(null);
    setLiaSummary(null);

    if (!currentLesson?.lesson_id || !slug) return;

    const loadLiaContext = async () => {
      try {
        const tRes = await fetch(
          `/api/courses/${slug}/lessons/${currentLesson.lesson_id}/transcript?language=${selectedLang}`,
          { credentials: "include" }
        );
        if (tRes.ok) {
          const tData = await tRes.json();
          if (tData.transcript_content) setLiaTranscript(tData.transcript_content);
        }
      } catch (error) {
        if (process.env.NODE_ENV === "development")
          console.warn("Error loading transcript for LIA:", error);
      }

      try {
        const sRes = await fetch(
          `/api/courses/${slug}/lessons/${currentLesson.lesson_id}/summary?language=${selectedLang}`,
          { credentials: "include" }
        );
        if (sRes.ok) {
          const sData = await sRes.json();
          if (sData.summary_content) setLiaSummary(sData.summary_content);
        }
      } catch (error) {
        if (process.env.NODE_ENV === "development")
          console.warn("Error loading summary for LIA:", error);
      }
    };

    const timer = setTimeout(loadLiaContext, 1000);
    return () => clearTimeout(timer);
  }, [currentLesson?.lesson_id, slug, selectedLang]);

  // Fire-and-forget: update last_accessed_at in background
  useEffect(() => {
    if (currentLesson && slug) {
      fetch(
        `/api/courses/${slug}/lessons/${currentLesson.lesson_id}/access`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          credentials: "include",
        }
      ).catch(() => null);
    }
  }, [currentLesson?.lesson_id, slug]);

  // Auto-redirect to activities tab when video fully watched and activities pending
  useEffect(() => {
    if (!currentLesson?.lesson_id) return;
    const lessonId = currentLesson.lesson_id;

    if (checkedAutoRedirectRef.current === lessonId) return;

    const activitiesList = lessonsActivities[lessonId];
    if (activitiesList === undefined) return;

    checkedAutoRedirectRef.current = lessonId;

    if (activeTab !== "video") return;

    const videoFullyWatched =
      currentLesson.is_completed ||
      (currentLesson.progress_percentage ?? 0) >= 95;
    if (!videoFullyWatched) return;

    const hasPending =
      activitiesList.length > 0 && activitiesList.some((a) => !a.is_completed);
    if (hasPending) {
      setActiveTab("activities");
    }
  }, [
    currentLesson?.lesson_id,
    currentLesson?.is_completed,
    currentLesson?.progress_percentage,
    lessonsActivities,
    activeTab,
  ]);

  const orderedLessons = useMemo(() => getOrderedLessons(modules), [modules]);

  const currentLessonIndex = useMemo(
    () => findOrderedLessonIndex(orderedLessons, currentLesson?.lesson_id),
    [orderedLessons, currentLesson?.lesson_id]
  );

  const canCompleteLesson = useCallback(
    (lessonId: string) => canCompleteOrderedLesson(orderedLessons, lessonId),
    [orderedLessons]
  );

  const {
    checkQuizStatus,
    markLessonAsCompleted,
    validationModal,
    setValidationModal,
    isCourseCompletedModalOpen,
    setIsCourseCompletedModalOpen,
    isCannotCompleteModalOpen,
    setIsCannotCompleteModalOpen,
    isRatingModalOpen,
    setIsRatingModalOpen,
    hasUserRated,
    setHasUserRated,
  } = useLessonCompletion({
    slug,
    currentLesson,
    modules,
    setModules,
    setCurrentLesson,
    setCourseProgress,
    canCompleteLesson,
  });

  const {
    getPreviousLesson,
    getNextLesson,
    handleLessonChange,
    navigateToPreviousLesson,
    navigateToNextLesson,
    openLessonById,
  } = useLessonNavigation({
    orderedLessons,
    modules,
    currentLesson,
    lessonsActivities,
    lessonsMaterials,
    setCurrentLesson,
    setActiveTab,
    markLessonAsCompleted,
    loadLessonActivitiesAndMaterials,
    trackUserAction,
    videoPlayerContext,
  });

  const getLessonContext = (): CourseLessonContext | undefined => {
    if (!currentLesson || !course) return undefined;

    const currentModule = modules.find((m) =>
      m.lessons.some((l) => l.lesson_id === currentLesson.lesson_id)
    );

    if (workshopMetadata) {
      return {
        ...workshopMetadata,
        moduleTitle: currentModule?.module_title,
        lessonTitle: currentLesson.lesson_title,
        lessonDescription: currentLesson.lesson_description,
        durationSeconds: currentLesson.duration_seconds,
        userRole: user?.job_title || undefined,
      };
    }

    return {
      contextType: "course",
      courseId: course.id || course.course_id || undefined,
      courseSlug: slug || undefined,
      courseTitle: course.title || course.course_title,
      courseDescription: course.description || course.course_description,
      moduleTitle: currentModule?.module_title,
      lessonTitle: currentLesson.lesson_title,
      lessonDescription: currentLesson.lesson_description,
      durationSeconds: currentLesson.duration_seconds,
      userRole: user?.job_title || undefined,
    };
  };

  const tabs = [
    { id: "video" as const, label: t("tabs.video"), icon: "Play" },
    { id: "transcript" as const, label: t("tabs.transcript"), icon: "ScrollText" },
    { id: "summary" as const, label: t("tabs.summary"), icon: "FileText" },
    { id: "activities" as const, label: t("tabs.activities"), icon: "Activity" },
    { id: "questions" as const, label: t("tabs.questions"), icon: "MessageCircle" },
  ];

  return {
    // Routing
    slug,
    router,

    // Auth & styles
    user,
    colors,

    // i18n
    t,
    i18n,
    ready,
    selectedLang,

    // Hydration
    mounted,

    // Course data
    course,
    modules,
    currentLesson,
    setCurrentLesson,
    workshopMetadata,
    loading,
    courseProgress,

    // LIA context
    liaTranscript,
    liaSummary,
    isLiaOpen,
    openLia,
    closeLia,
    sendLiaMessage,
    handleSaveLiaNote,
    getLessonContext,

    // Tabs
    activeTab,
    setActiveTab,
    handleTabChange,
    tabs,

    // Mobile / layout
    isMobile,
    screenHeight,
    visualViewportHeight,
    isMobileBottomNavVisible,
    mobileContentPaddingBottom,
    calculateLiaMaxHeight,
    getInputAreaPadding,
    swipeRef,

    // Sidebar state
    closeLeftPanel,
    expandedLessons,
    expandedModules,
    isLeftPanelOpen,
    isMaterialCollapsed,
    isNotesCollapsed,
    lessonsActivities,
    lessonsMaterials,
    lessonsQuizStatus,
    loadLessonActivitiesAndMaterials,
    openContentSection,
    openLeftPanel,
    openNotesSection,
    toggleLessonExpand,
    toggleMaterialCollapsed,
    toggleModuleExpand,
    toggleNotesCollapsed,

    // Notes management
    addNoteToLocalState,
    closeDeleteNoteConfirm,
    closeNotesModal,
    confirmDeleteNote,
    editingNote,
    handleDeleteNote,
    handleSaveNote,
    isDeleteNoteConfirmOpen,
    isDeletingNote,
    isNotesModalOpen,
    notesStats,
    openEditNoteModal,
    openNewNoteModal,
    savedNotes,
    updateNotesStatsOptimized,

    // Lesson navigation
    getPreviousLesson,
    getNextLesson,
    handleLessonChange,
    navigateToPreviousLesson,
    navigateToNextLesson,
    openLessonById,
    orderedLessons,
    currentLessonIndex,
    canCompleteLesson,
    markLessonAsCompleted,

    // Modals
    isCourseCompletedModalOpen,
    setIsCourseCompletedModalOpen,
    isCannotCompleteModalOpen,
    setIsCannotCompleteModalOpen,
    isClearHistoryModalOpen,
    setIsClearHistoryModalOpen,
    isRatingModalOpen,
    setIsRatingModalOpen,
    hasUserRated,
    setHasUserRated,
    validationModal,
    setValidationModal,

    // Activity prompts
    currentActivityPrompts,
    isPromptsCollapsed,
    setIsPromptsCollapsed,
    handlePromptsChange,

    // User behavior tracking
    trackUserAction,
    analyzeUserBehavior,
    userBehaviorLog,

    // Tour
    joyrideComponentProps,
    isJoyrideMounted,
  };
}
