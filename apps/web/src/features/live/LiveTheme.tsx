"use client";
import type { CSSProperties, ReactNode } from "react";
import { useCourseTheme } from "@/features/courses/hooks/useCourseTheme";
import styles from "./Live.module.css";
export function LiveTheme({ children }: { children: ReactNode }) {
  const theme = useCourseTheme();
  return (
    <div
      className={styles.page}
      style={
        {
          "--live-bg": theme.bgPrimary,
          "--live-card": theme.bgSecondary,
          "--live-text": theme.text,
          "--live-accent": theme.accent,
        } as CSSProperties
      }
    >
      {children}
    </div>
  );
}
