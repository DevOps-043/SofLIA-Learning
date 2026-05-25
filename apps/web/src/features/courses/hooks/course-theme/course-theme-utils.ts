import {
  DEFAULT_ACCENT,
  LIGHT_CARD_BACKGROUNDS,
} from "./course-theme-constants";

export function hexToRgbValues(hex: string): string {
  const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);

  if (!result) {
    return "0 212 179";
  }

  return `${parseInt(result[1], 16)} ${parseInt(result[2], 16)} ${parseInt(
    result[3],
    16
  )}`;
}

export function isLightCardBackground(cardBackground?: string | null): boolean {
  const normalized = (cardBackground || "").toLowerCase();

  return (
    LIGHT_CARD_BACKGROUNDS.includes(normalized) ||
    normalized.includes("255, 255, 255")
  );
}

export function normalizeAccentColor(accent?: string | null): string {
  return accent || DEFAULT_ACCENT;
}
