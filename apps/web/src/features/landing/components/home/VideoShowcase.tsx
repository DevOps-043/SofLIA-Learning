"use client";

import { Pause, Play } from "lucide-react";
import {
  motion,
  useInView,
  useMotionValue,
  useReducedMotion,
  useSpring,
  useTransform,
} from "motion/react";
import { useEffect, useRef, useState, type RefObject } from "react";
import { useTranslation } from "react-i18next";
import styles from "./SofliaHome.module.css";

const VIDEO_STORY_QUERY =
  "(min-width: 1024px) and (min-height: 900px) and (prefers-reduced-motion: no-preference)";

function useVideoStoryProgress(sectionRef: RefObject<HTMLElement>) {
  const progress = useMotionValue(0);

  useEffect(() => {
    const section = sectionRef.current;
    if (!section) return;

    const mediaQuery = window.matchMedia(VIDEO_STORY_QUERY);
    const body = document.body;
    const root = document.documentElement;
    const scroller = body.scrollHeight > root.scrollHeight ? body : root;
    const usesDocument = scroller === root;
    const scrollTarget = (usesDocument ? window : scroller) as EventTarget;
    let animationFrame = 0;

    const updateProgress = () => {
      window.cancelAnimationFrame(animationFrame);
      animationFrame = window.requestAnimationFrame(() => {
        if (!mediaQuery.matches) {
          progress.set(0);
          return;
        }

        const scrollTop = usesDocument ? window.scrollY : scroller.scrollTop;
        const viewportHeight = usesDocument
          ? window.innerHeight
          : scroller.clientHeight;
        const sectionTop = section.getBoundingClientRect().top + scrollTop;
        const scrollableDistance = Math.max(
          section.offsetHeight - viewportHeight,
          1,
        );
        const nextProgress = Math.min(
          1,
          Math.max(0, (scrollTop - sectionTop) / scrollableDistance),
        );

        progress.set(nextProgress);
      });
    };

    updateProgress();
    scrollTarget.addEventListener("scroll", updateProgress, { passive: true });
    window.addEventListener("resize", updateProgress, { passive: true });
    mediaQuery.addEventListener("change", updateProgress);

    return () => {
      window.cancelAnimationFrame(animationFrame);
      scrollTarget.removeEventListener("scroll", updateProgress);
      window.removeEventListener("resize", updateProgress);
      mediaQuery.removeEventListener("change", updateProgress);
    };
  }, [progress, sectionRef]);

  return progress;
}

export function VideoShowcase() {
  const { t } = useTranslation("home");
  const sectionRef = useRef<HTMLElement>(null);
  const videoRef = useRef<HTMLVideoElement>(null);
  const userPausedRef = useRef(false);
  const shouldReduceMotion = useReducedMotion();
  const isInView = useInView(sectionRef, { amount: 0.12 });
  const [isVideoPlaying, setIsVideoPlaying] = useState(false);
  const rawProgress = useVideoStoryProgress(sectionRef);
  const progress = useSpring(rawProgress, {
    stiffness: 105,
    damping: 28,
    mass: 0.35,
    restDelta: 0.0005,
  });

  const frameTop = useTransform(
    progress,
    [0, 0.24, 0.64],
    ["24%", "24%", "1.5%"],
  );
  const frameRight = useTransform(
    progress,
    [0, 0.24, 0.64],
    ["7%", "7%", "1.5%"],
  );
  const frameBottom = useTransform(
    progress,
    [0, 0.24, 0.64],
    ["18%", "18%", "1.5%"],
  );
  const frameLeft = useTransform(
    progress,
    [0, 0.24, 0.64],
    ["50%", "50%", "1.5%"],
  );
  const frameRadius = useTransform(
    progress,
    [0, 0.24, 0.64],
    ["3rem", "3rem", "1.25rem"],
  );
  const frameRotateX = useTransform(progress, [0, 0.24, 0.64], [3.2, 3.2, 0]);
  const videoScale = useTransform(
    progress,
    [0, 0.24, 0.64, 1],
    [1.06, 1.06, 1.01, 1],
  );
  const videoFilter = useTransform(
    progress,
    [0, 0.24, 0.64],
    [
      "saturate(0.86) contrast(0.96) brightness(0.9)",
      "saturate(0.86) contrast(0.96) brightness(0.9)",
      "saturate(1) contrast(1.02) brightness(0.98)",
    ],
  );
  const overlayOpacity = useTransform(
    progress,
    [0, 0.24, 0.64],
    [0.28, 0.24, 0.1],
  );
  const introOpacity = useTransform(progress, [0, 0.08, 0.18], [1, 1, 0]);
  const introY = useTransform(progress, [0, 0.18], [0, -24]);
  const chromeOpacity = useTransform(progress, [0, 0.38, 0.64], [1, 0.7, 0]);
  const finalOpacity = useTransform(progress, [0, 0.64, 0.82], [0, 0, 1]);
  const finalY = useTransform(progress, [0, 0.64, 0.86], [36, 36, 0]);

  useEffect(() => {
    const video = videoRef.current;
    if (!video) return;

    const syncPlaybackState = () => setIsVideoPlaying(!video.paused);
    video.addEventListener("play", syncPlaybackState);
    video.addEventListener("pause", syncPlaybackState);

    return () => {
      video.removeEventListener("play", syncPlaybackState);
      video.removeEventListener("pause", syncPlaybackState);
    };
  }, []);

  useEffect(() => {
    const video = videoRef.current;
    if (!video) return;

    if (shouldReduceMotion || !isInView) {
      video.pause();
      return;
    }

    if (!userPausedRef.current) {
      void video.play();
    }
  }, [isInView, shouldReduceMotion]);

  const toggleVideoPlayback = () => {
    const video = videoRef.current;
    if (!video) return;

    if (video.paused) {
      userPausedRef.current = false;
      void video.play();
    } else {
      userPausedRef.current = true;
      video.pause();
    }
  };

  return (
    <section
      ref={sectionRef}
      className={styles.videoShowcase}
      aria-labelledby="video-showcase-title"
    >
      <div className={styles.videoShowcaseSticky}>
        <motion.div
          className={`${styles.videoShowcaseIntro} ${styles.shell}`}
          style={{ opacity: introOpacity, y: introY }}
        >
          <p className={styles.eyebrow}>{t("showcase.eyebrow")}</p>
          <h2 id="video-showcase-title">{t("showcase.title")}</h2>
          <p>{t("showcase.description")}</p>
        </motion.div>

        <motion.div
          className={styles.videoShowcaseFrame}
          style={{
            top: frameTop,
            right: frameRight,
            bottom: frameBottom,
            left: frameLeft,
            borderRadius: frameRadius,
            rotateX: frameRotateX,
          }}
        >
          <motion.video
            ref={videoRef}
            className={styles.videoShowcaseMedia}
            src="/video-home.mp4"
            muted
            loop
            playsInline
            preload="metadata"
            aria-hidden="true"
            tabIndex={-1}
            style={{ scale: videoScale, filter: videoFilter }}
          />
          <motion.div
            className={styles.videoShowcaseOverlay}
            style={{ opacity: overlayOpacity }}
            aria-hidden="true"
          />

          <motion.div
            className={styles.videoShowcaseChrome}
            style={{ opacity: chromeOpacity }}
            aria-hidden="true"
          />

          <button
            type="button"
            className={styles.videoShowcaseControl}
            onClick={toggleVideoPlayback}
            aria-label={
              isVideoPlaying
                ? t("showcase.pauseVideo")
                : t("showcase.playVideo")
            }
          >
            {isVideoPlaying ? (
              <Pause size={15} aria-hidden="true" />
            ) : (
              <Play size={15} aria-hidden="true" />
            )}
            <span>
              {isVideoPlaying
                ? t("showcase.pauseVideoShort")
                : t("showcase.playVideoShort")}
            </span>
          </button>

          <span className={styles.videoShowcaseProgress} aria-hidden="true">
            <motion.i style={{ scaleX: progress }} />
          </span>
        </motion.div>

        <motion.div
          className={styles.videoShowcaseFinal}
          style={{ opacity: finalOpacity, y: finalY }}
        >
          <span>{t("showcase.closingKicker")}</span>
          <h2 id="video-showcase-closing-title">
            {t("showcase.closingTitle")}
          </h2>
        </motion.div>
      </div>
    </section>
  );
}
