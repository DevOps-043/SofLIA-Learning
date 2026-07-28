"use client";

import {
  Activity,
  ArrowRight,
  Blocks,
  BookOpenCheck,
  BrainCircuit,
} from "lucide-react";
import { AnimatePresence, motion, useInView } from "motion/react";
import dynamic from "next/dynamic";
import Image from "next/image";
import { useEffect, useRef, useState } from "react";
import { useTranslation } from "react-i18next";
import { useThemeStore } from "@/core/stores/themeStore";
import {
  getEcosystemTool,
  type EcosystemToolId,
} from "./logo-stage/ecosystem-tools.config";
import { useStage3DEnabled } from "./logo-stage/useStage3DEnabled";
import { SectionHeading } from "./SectionHeading";
import logoStageStyles from "./logo-stage/logo-stage.module.css";
import styles from "./SofliaHome.module.css";

const EcosystemLogoScene = dynamic(
  () =>
    import("./logo-stage/LogoStageScene").then((module) => ({
      default: module.EcosystemLogoScene,
    })),
  { ssr: false, loading: () => null },
);

interface EcosystemItem {
  id: EcosystemToolId;
  name: string;
  role: string;
  description: string;
}

const ICONS = {
  engine: BrainCircuit,
  learning: BookOpenCheck,
  agent: Activity,
  skills: Blocks,
} as const;

export function EcosystemSection() {
  const { t } = useTranslation("home");
  const stage3DEnabled = useStage3DEnabled();
  const resolvedTheme = useThemeStore((state) => state.resolvedTheme);
  const items = t("ecosystem.items", {
    returnObjects: true,
  }) as EcosystemItem[];
  // Null = nothing selected → the full SofLIA molecule is shown.
  const [activeId, setActiveId] = useState<EcosystemToolId | null>(null);
  const [accent, setAccent] = useState("rgb(0, 212, 179)");
  const sectionRef = useRef<HTMLElement>(null);
  const stageInView = useInView(sectionRef, { margin: "250px 0px 250px 0px" });

  const activeItem = activeId
    ? (items.find((item) => item.id === activeId) ?? null)
    : null;
  const activeTool = activeId ? getEcosystemTool(activeId) : null;

  useEffect(() => {
    const value = getComputedStyle(document.documentElement)
      .getPropertyValue("--color-accent")
      .trim();
    if (value) setAccent(value);
  }, [resolvedTheme]);

  return (
    <section
      id="sistema"
      ref={sectionRef}
      className={`${styles.section} ${styles.shell}`}
    >
      <SectionHeading
        eyebrow={t("ecosystem.eyebrow")}
        title={t("ecosystem.title")}
        description={t("ecosystem.description")}
      />

      <div className={styles.ecosystemLayout}>
        <ul
          className={styles.ecosystemSelector}
          aria-label={t("ecosystem.title")}
        >
          {items.map((item, index) => {
            const Icon = ICONS[item.id];
            const isActive = item.id === activeId;

            return (
              <li key={item.id}>
                <button
                  type="button"
                  className={`${styles.ecosystemRow} ${
                    isActive ? styles.ecosystemRowActive : ""
                  }`}
                  onClick={() =>
                    setActiveId((current) =>
                      current === item.id ? null : item.id,
                    )
                  }
                  aria-pressed={isActive}
                >
                  <span className={styles.ecosystemRowIcon}>
                    <Icon size={20} aria-hidden="true" />
                  </span>
                  <span className={styles.ecosystemRowText}>
                    <span className={styles.ecosystemRowName}>{item.name}</span>
                    <span className={styles.ecosystemRowRole}>{item.role}</span>
                  </span>
                  <span className={styles.ecosystemRowIndex}>
                    {String(index + 1).padStart(2, "0")}
                  </span>
                  <span className={styles.ecosystemRowArrow} aria-hidden="true">
                    <ArrowRight size={16} />
                  </span>
                </button>
              </li>
            );
          })}
        </ul>

        <div className={styles.ecosystemStage}>
          {/* Molecule by default; the selected tool's own 3D logo when picked. */}
          <div className={styles.ecosystemStageSlot}>
            {stage3DEnabled && stageInView ? (
              <div className={logoStageStyles.ecosystemCanvas}>
                <EcosystemLogoScene
                  logoUrl={activeTool?.logoUrl}
                  accent={accent}
                />
              </div>
            ) : (
              <Image
                src="/Logo.png"
                alt=""
                fill
                sizes="(min-width: 1024px) 40vw, 80vw"
                className="object-contain"
                aria-hidden="true"
              />
            )}
          </div>

          <AnimatePresence mode="wait">
            <motion.div
              key={activeItem?.id ?? "default"}
              className={styles.ecosystemDetail}
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              transition={{ duration: 0.32 }}
              aria-live="polite"
            >
              {activeItem ? (
                <>
                  <span className={styles.ecosystemRole}>
                    {activeItem.role}
                  </span>
                  <h3 className={styles.ecosystemDetailName}>
                    {activeItem.name}
                  </h3>
                  <p className={styles.ecosystemDetailText}>
                    {activeItem.description}
                  </p>
                  <div className={styles.ecosystemToolMeta}>
                    <span className={styles.ecosystemPoweredBy}>
                      {t("ecosystem.poweredBy")}
                    </span>
                  </div>
                </>
              ) : (
                <>
                  <span className={styles.ecosystemRole}>
                    {t("ecosystem.defaultRole")}
                  </span>
                  <h3 className={styles.ecosystemDetailName}>
                    {t("ecosystem.brand")}
                  </h3>
                  <p className={styles.ecosystemDetailText}>
                    {t("ecosystem.selectHint")}
                  </p>
                </>
              )}
            </motion.div>
          </AnimatePresence>
        </div>
      </div>

      <p className={styles.ecosystemMessage}>
        {t("ecosystem.messageStart")}{" "}
        <strong>{t("ecosystem.messageHighlight")}</strong>
      </p>
    </section>
  );
}
