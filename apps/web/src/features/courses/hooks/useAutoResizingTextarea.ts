"use client";

import { useCallback } from "react";

type AutoResizingTextareaOptions = {
  minHeight?: number;
};

export function useAutoResizingTextarea({
  minHeight = 20,
}: AutoResizingTextareaOptions = {}) {
  return useCallback(
    (textarea: HTMLTextAreaElement | null, maxHeight = 128) => {
      if (!textarea) {
        return;
      }

      textarea.style.height = "0px";
      const nextHeight = Math.min(
        Math.max(textarea.scrollHeight, minHeight),
        maxHeight,
      );
      textarea.style.height = `${nextHeight}px`;
      textarea.style.overflowY =
        textarea.scrollHeight > maxHeight ? "auto" : "hidden";
    },
    [minHeight],
  );
}
