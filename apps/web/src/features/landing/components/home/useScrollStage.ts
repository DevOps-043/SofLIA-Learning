"use client";

import { useCallback, useEffect, useState, type RefObject } from "react";

const STICKY_STAGE_QUERY =
  "(min-width: 1200px) and (min-height: 900px) and (prefers-reduced-motion: no-preference)";

function getPageScroller() {
  const body = document.body;
  const root = document.documentElement;
  return body.scrollHeight > root.scrollHeight ? body : root;
}

function getScrollMetrics(scroller: HTMLElement) {
  const usesDocument = scroller === document.documentElement;

  return {
    scrollTop: usesDocument ? window.scrollY : scroller.scrollTop,
    viewportHeight: usesDocument ? window.innerHeight : scroller.clientHeight,
    scrollTarget: (usesDocument ? window : scroller) as EventTarget,
    usesDocument,
  };
}

export function useScrollStage<T extends HTMLElement>(
  sectionRef: RefObject<T>,
  stageCount: number,
) {
  const [activeStage, setActiveStage] = useState(0);

  useEffect(() => {
    const section = sectionRef.current;
    if (!section || stageCount < 2) return;

    const mediaQuery = window.matchMedia(STICKY_STAGE_QUERY);
    const scroller = getPageScroller();
    const { scrollTarget } = getScrollMetrics(scroller);
    let animationFrame = 0;

    const updateStage = () => {
      window.cancelAnimationFrame(animationFrame);
      animationFrame = window.requestAnimationFrame(() => {
        if (!mediaQuery.matches) return;

        const { scrollTop, viewportHeight } = getScrollMetrics(scroller);
        const sectionTop = section.getBoundingClientRect().top + scrollTop;
        const scrollableDistance = Math.max(
          section.offsetHeight - viewportHeight,
          1,
        );
        const progress = Math.min(
          1,
          Math.max(0, (scrollTop - sectionTop) / scrollableDistance),
        );
        const nextStage = Math.min(
          stageCount - 1,
          Math.floor(progress * stageCount),
        );

        setActiveStage((current) =>
          current === nextStage ? current : nextStage,
        );
      });
    };

    updateStage();
    scrollTarget.addEventListener("scroll", updateStage, { passive: true });
    window.addEventListener("resize", updateStage, { passive: true });
    mediaQuery.addEventListener("change", updateStage);

    return () => {
      window.cancelAnimationFrame(animationFrame);
      scrollTarget.removeEventListener("scroll", updateStage);
      window.removeEventListener("resize", updateStage);
      mediaQuery.removeEventListener("change", updateStage);
    };
  }, [sectionRef, stageCount]);

  const goToStage = useCallback(
    (index: number) => {
      const section = sectionRef.current;
      const safeIndex = Math.min(
        Math.max(index, 0),
        Math.max(stageCount - 1, 0),
      );

      setActiveStage(safeIndex);
      if (
        !section ||
        stageCount < 2 ||
        !window.matchMedia(STICKY_STAGE_QUERY).matches
      ) {
        return;
      }

      const scroller = getPageScroller();
      const { scrollTop, viewportHeight, usesDocument } =
        getScrollMetrics(scroller);
      const sectionTop = section.getBoundingClientRect().top + scrollTop;
      const scrollableDistance = Math.max(
        section.offsetHeight - viewportHeight,
        1,
      );
      const segmentCenter = (safeIndex + 0.5) / stageCount;
      const target = sectionTop + segmentCenter * scrollableDistance;

      if (usesDocument) {
        window.scrollTo({ top: target, behavior: "smooth" });
      } else {
        scroller.scrollTo({ top: target, behavior: "smooth" });
      }
    },
    [sectionRef, stageCount],
  );

  return { activeStage, goToStage };
}
