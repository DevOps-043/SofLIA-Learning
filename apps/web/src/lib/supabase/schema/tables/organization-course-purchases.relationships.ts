export type OrganizationCoursePurchasesRelationships = [
  { foreignKeyName: "organization_course_purchases_course_id_fkey"; columns: ["course_id"]; isOneToOne: false; referencedRelation: "courses"; referencedColumns: ["id"] },
  { foreignKeyName: "organization_course_purchases_course_id_fkey"; columns: ["course_id"]; isOneToOne: false; referencedRelation: "v_incomplete_lesson_times"; referencedColumns: ["course_id"] },
  { foreignKeyName: "organization_course_purchases_organization_id_fkey"; columns: ["organization_id"]; isOneToOne: false; referencedRelation: "organizations"; referencedColumns: ["id"] },
  { foreignKeyName: "organization_course_purchases_organization_id_fkey"; columns: ["organization_id"]; isOneToOne: false; referencedRelation: "v_organization_stats"; referencedColumns: ["organization_id"] },
  { foreignKeyName: "organization_course_purchases_organization_id_fkey"; columns: ["organization_id"]; isOneToOne: false; referencedRelation: "v_organization_users_detailed"; referencedColumns: ["organization_id"] },
  { foreignKeyName: "organization_course_purchases_payment_method_id_fkey"; columns: ["payment_method_id"]; isOneToOne: false; referencedRelation: "payment_methods"; referencedColumns: ["payment_method_id"] },
  { foreignKeyName: "organization_course_purchases_purchased_by_fkey"; columns: ["purchased_by"]; isOneToOne: false; referencedRelation: "moderation_stats"; referencedColumns: ["user_id"] },
  { foreignKeyName: "organization_course_purchases_purchased_by_fkey"; columns: ["purchased_by"]; isOneToOne: false; referencedRelation: "users"; referencedColumns: ["id"] },
  { foreignKeyName: "organization_course_purchases_purchased_by_fkey"; columns: ["purchased_by"]; isOneToOne: false; referencedRelation: "v_organization_users_detailed"; referencedColumns: ["user_id"] },
  { foreignKeyName: "organization_course_purchases_purchased_by_fkey"; columns: ["purchased_by"]; isOneToOne: false; referencedRelation: "v_user_security_summary"; referencedColumns: ["user_id"] },
  { foreignKeyName: "organization_course_purchases_transaction_id_fkey"; columns: ["transaction_id"]; isOneToOne: false; referencedRelation: "transactions"; referencedColumns: ["transaction_id"] },
]
