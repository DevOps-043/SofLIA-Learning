export interface DeleteTableConfig {
  tableName: string
  column?: string
}

/**
 * Tablas de las que se eliminan registros del usuario antes de borrar el usuario.
 * Verificado contra database-optimization/02-schema/NewBDStructure.sql (2026-04-04).
 * Orden: dependencias primero, tablas principales después.
 */
export const USER_SIMPLE_DELETE_TABLES: DeleteTableConfig[] = [
  // LIA y conversaciones
  { tableName: 'lia_user_feedback' },
  { tableName: 'lia_activity_completions' },
  { tableName: 'lia_conversations' },

  // Certificados y progreso académico
  { tableName: 'user_course_certificates' },
  { tableName: 'user_quiz_submissions' },
  { tableName: 'lesson_tracking' },
  { tableName: 'user_lesson_progress' },
  { tableName: 'daily_progress' },
  { tableName: 'user_lesson_notes' },

  // Study planner
  { tableName: 'study_sessions' },
  { tableName: 'calendar_sync_history' },
  { tableName: 'study_plans' },
  { tableName: 'study_preferences' },
  { tableName: 'user_streaks' },

  // Asignaciones organizacionales
  { tableName: 'organization_course_assignments' },
  { tableName: 'organization_course_assignments', column: 'assigned_by' },
  { tableName: 'organization_course_purchases', column: 'purchased_by' },

  // Q&A de cursos
  { tableName: 'course_question_reactions' },
  { tableName: 'course_question_responses' },
  { tableName: 'course_questions' },
  { tableName: 'course_reviews' },
  { tableName: 'lesson_feedback' },

  // Notificaciones
  { tableName: 'notification_email_queue' },
  { tableName: 'notification_push_subscriptions' },
  { tableName: 'notification_stats' },
  { tableName: 'user_notification_preferences' },
  { tableName: 'user_notifications' },

  // Calendario
  { tableName: 'user_calendar_events' },
  { tableName: 'calendar_subscription_tokens' },
  { tableName: 'calendar_integrations' },

  // Pagos y suscripciones
  { tableName: 'transactions' },
  { tableName: 'subscriptions' },
  { tableName: 'payment_methods' },

  // Auth y sesiones
  { tableName: 'oauth_accounts' },
  { tableName: 'password_reset_tokens' },
  { tableName: 'refresh_tokens' },
  { tableName: 'user_session' },

  // Reportes y admin
  { tableName: 'reportes_problemas' },

  // Perfil de onboarding (user_perfil → users FK)
  { tableName: 'user_perfil' },

  // Activity, tours, warnings, moderación
  { tableName: 'user_activity_log' },
  { tableName: 'user_tour_progress' },
  { tableName: 'user_warnings' },
  { tableName: 'ai_moderation_logs' },

  // Audit logs
  { tableName: 'audit_logs' },
  { tableName: 'audit_logs', column: 'admin_user_id' },

  // Favoritos de herramientas (user_favorite_tools → users FK)
  { tableName: 'user_favorite_tools' },

  // Hierarchy y jerarquía organizacional
  { tableName: 'hierarchy_chat_messages', column: 'sender_id' },
  { tableName: 'hierarchy_chat_participants' },
  { tableName: 'hierarchy_course_assignments', column: 'assigned_by' },
  { tableName: 'organization_node_users' },
  { tableName: 'organization_join_requests' },

  // LIA personalización
  { tableName: 'lia_personalization_settings' },

  // Invitaciones
  { tableName: 'bulk_invite_links', column: 'created_by' },
  { tableName: 'bulk_invite_registrations' },
  { tableName: 'user_invitations', column: 'created_by' },

  // Lecciones traducidas del instructor (instructor_id NOT NULL → FK users)
  { tableName: 'course_lessons_en', column: 'instructor_id' },
  { tableName: 'course_lessons_pt', column: 'instructor_id' },

  // Enrollments (después de sus dependencias)
  { tableName: 'user_course_enrollments' },

  // Organization users (al final, antes del user)
  { tableName: 'organization_users' },
]

/**
 * Tablas donde se pone NULL la referencia al usuario en lugar de eliminar el registro.
 * Verificado contra database-optimization/02-schema/NewBDStructure.sql (2026-04-04).
 */
export const USER_NULL_UPDATE_TABLES: DeleteTableConfig[] = [
  { tableName: 'reportes_problemas', column: 'admin_asignado' },
  { tableName: 'organization_nodes', column: 'manager_id' },
  { tableName: 'organization_users', column: 'invited_by' },
  { tableName: 'courses', column: 'instructor_id' },
  { tableName: 'courses', column: 'approved_by' },
  { tableName: 'course_lessons', column: 'instructor_id' },
  // content_translations.created_by → users FK (nullable)
  { tableName: 'content_translations', column: 'created_by' },
  // scorm_packages.created_by → users FK (nullable)
  { tableName: 'scorm_packages', column: 'created_by' },
  // organization_regions — created_by y manager_id (nullable)
  { tableName: 'organization_regions', column: 'created_by' },
  { tableName: 'organization_regions', column: 'manager_id' },
  // organization_teams — created_by y leader_id (nullable)
  { tableName: 'organization_teams', column: 'created_by' },
  { tableName: 'organization_teams', column: 'leader_id' },
  // organization_zones — created_by y manager_id (nullable)
  { tableName: 'organization_zones', column: 'created_by' },
  { tableName: 'organization_zones', column: 'manager_id' },
  // organization_join_requests — reviewed_by (nullable)
  { tableName: 'organization_join_requests', column: 'reviewed_by' },
]
