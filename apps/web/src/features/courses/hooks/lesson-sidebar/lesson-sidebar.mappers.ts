import type {
  LearnActivitySummary,
  LearnMaterialSummary,
} from "../../components/learn/types";

export function mapActivities(
  activities: Array<Record<string, unknown>> | undefined
): LearnActivitySummary[] {
  return (activities || []).map((activity) => ({
    activity_id: String(activity.activity_id || ""),
    activity_title: String(activity.activity_title || ""),
    activity_description:
      typeof activity.activity_description === "string"
        ? activity.activity_description
        : undefined,
    activity_type: String(activity.activity_type || ""),
    is_required: Boolean(activity.is_required),
    is_completed: Boolean(activity.is_completed),
  }));
}

export function mapMaterials(
  materials: Array<Record<string, unknown>> | undefined
): LearnMaterialSummary[] {
  return (materials || []).map((material) => ({
    material_id: String(material.material_id || ""),
    material_title: String(material.material_title || ""),
    material_description:
      typeof material.material_description === "string"
        ? material.material_description
        : undefined,
    material_type: String(material.material_type || ""),
    is_required:
      Boolean(material.is_required) || String(material.material_type) === "quiz",
  }));
}
