"use client";

import { motion } from "framer-motion";
import { ArrowLeft, Building2, TrendingUp } from "lucide-react";
import type { ReactNode } from "react";
import { useTranslation } from "react-i18next";
import { NotificationBell } from "@/core/components/NotificationBell";
import styles from "./LearnPageHeader.module.css";

interface LearnPageHeaderProps {
  courseTitle: string;
  courseProgress: number;
  onBack: () => void;
  organizationName?: string | null;
  tourAction?: ReactNode;
  disableHeavyEffects?: boolean;
  headerBg?: string;
  primaryColor?: string;
  accentColor?: string;
}

export function LearnPageHeader({
  courseTitle,
  courseProgress,
  onBack,
  organizationName,
  tourAction,
  disableHeavyEffects = false,
  headerBg,
  primaryColor,
  accentColor,
}: LearnPageHeaderProps) {
  const { t } = useTranslation("learn");

  const progressColor =
    primaryColor && accentColor
      ? `linear-gradient(90deg, ${primaryColor}, ${accentColor})`
      : undefined;

  return (
    <motion.div
      data-tour-id="course-learn--header"
      initial={disableHeavyEffects ? false : { opacity: 0, y: -20 }}
      animate={disableHeavyEffects ? undefined : { opacity: 1, y: 0 }}
      className={styles.shell}
    >
      <div
        className={styles.navbar}
        style={
          headerBg
            ? ({ "--learn-card-bg": headerBg } as React.CSSProperties)
            : undefined
        }
      >
        <div className={styles.identity}>
          <button
            onClick={onBack}
            className={styles.backButton}
            aria-label={t("header.backButton")}
            title={t("header.backButton")}
            type="button"
          >
            <ArrowLeft aria-hidden="true" />
          </button>

          <span className={styles.divider} aria-hidden="true" />

          <div className={styles.courseCopy}>
            <h1 className={styles.title}>{courseTitle}</h1>
            {organizationName ? (
              <p className={styles.organization}>
                <Building2 aria-hidden="true" />
                <span>{organizationName}</span>
              </p>
            ) : null}
          </div>
        </div>

        <div className={styles.actions}>
          {tourAction ? (
            <span className={styles.utilityAction}>{tourAction}</span>
          ) : null}
          <NotificationBell />

          <div
            data-tour-id="course-learn--progress"
            className={styles.progressCard}
          >
            <div className={styles.progressMeta}>
              <span className={styles.progressLabel}>
                <TrendingUp aria-hidden="true" />
                <span>Progreso</span>
              </span>
              <span className={styles.progressValue}>{courseProgress}%</span>
            </div>
            <div
              className={styles.progressTrack}
              role="progressbar"
              aria-label="Progreso del curso"
              aria-valuemin={0}
              aria-valuemax={100}
              aria-valuenow={courseProgress}
            >
              <motion.div
                initial={disableHeavyEffects ? false : { width: 0 }}
                animate={{ width: `${courseProgress}%` }}
                transition={disableHeavyEffects ? undefined : { duration: 0.8 }}
                className={styles.progressBar}
                style={
                  progressColor ? { background: progressColor } : undefined
                }
              />
            </div>
          </div>
        </div>
      </div>
    </motion.div>
  );
}
