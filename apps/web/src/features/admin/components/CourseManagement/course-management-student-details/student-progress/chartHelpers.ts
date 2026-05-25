import {
  COURSE_MANAGEMENT_CHART_COLORS,
  COURSE_MANAGEMENT_CHART_TOOLTIP_STYLE,
} from '../../courseManagementTheme';

export function buildTickStyle(fontSize: number) {
  return {
    fill: COURSE_MANAGEMENT_CHART_COLORS.border,
    fontSize,
  };
}

export { COURSE_MANAGEMENT_CHART_COLORS, COURSE_MANAGEMENT_CHART_TOOLTIP_STYLE };
