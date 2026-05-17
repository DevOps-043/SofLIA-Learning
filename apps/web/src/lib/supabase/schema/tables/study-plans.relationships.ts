export type StudyPlansRelationships = [
  { foreignKeyName: "study_plans_organization_id_fkey"; columns: ["organization_id"]; isOneToOne: false; referencedRelation: "organizations"; referencedColumns: ["id"] },
  { foreignKeyName: "study_plans_organization_id_fkey"; columns: ["organization_id"]; isOneToOne: false; referencedRelation: "v_organization_stats"; referencedColumns: ["organization_id"] },
  { foreignKeyName: "study_plans_organization_id_fkey"; columns: ["organization_id"]; isOneToOne: false; referencedRelation: "v_organization_users_detailed"; referencedColumns: ["organization_id"] },
  { foreignKeyName: "study_plans_user_id_fkey"; columns: ["user_id"]; isOneToOne: false; referencedRelation: "moderation_stats"; referencedColumns: ["user_id"] },
  { foreignKeyName: "study_plans_user_id_fkey"; columns: ["user_id"]; isOneToOne: false; referencedRelation: "users"; referencedColumns: ["id"] },
  { foreignKeyName: "study_plans_user_id_fkey"; columns: ["user_id"]; isOneToOne: false; referencedRelation: "v_organization_users_detailed"; referencedColumns: ["user_id"] },
  { foreignKeyName: "study_plans_user_id_fkey"; columns: ["user_id"]; isOneToOne: false; referencedRelation: "v_user_security_summary"; referencedColumns: ["user_id"] },
]
