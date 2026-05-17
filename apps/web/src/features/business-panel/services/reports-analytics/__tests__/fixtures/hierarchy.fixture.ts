import type { ReportsAnalyticsQueryData } from "./types";

export const hierarchyFixture = {
  regions: [
    {
      id: "region-1",
      name: "Norte",
      code: "N",
      is_active: true,
    },
  ],
  zones: [
    {
      id: "zone-1",
      name: "Zona 1",
      code: "Z1",
      region_id: "region-1",
      is_active: true,
    },
  ],
  teams: [
    {
      id: "team-1",
      name: "Ventas Norte",
      code: "VN",
      zone_id: "zone-1",
      is_active: true,
    },
  ],
} satisfies Pick<ReportsAnalyticsQueryData, "regions" | "zones" | "teams">;
