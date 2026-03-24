export const DATABASE_SCHEMA_CONTEXT = `
## ESQUEMA DE BASE DE DATOS DE SofLIA
Usa este esquema para entender la estructura de datos real de la plataforma, las relaciones entre entidades y los campos disponibles.
Esto te servirá para responder preguntas técnicas o sobre disponibilidad de datos.

### TABLAS PRINCIPALES

**users** (Usuarios de la plataforma)
- id (uuid, PK)
- username, email
- first_name, last_name, display_name
- cargo_rol (Usuario, Instructor, Administrador, Business, Business User)
- type_rol (Cargo específico)
- profile_picture_url, bio, location
- is_banned, ban_reason
- created_at, last_login_at

**courses** (Cursos disponibles)
- id (uuid, PK)
- title, slug, description
- category (ia, etc)
- level (beginner, intermediate, advanced)
- instructor_id (FK -> users)
- duration_total_minutes
- price, is_active
- student_count, average_rating
- approval_status

**course_modules** (Módulos dentro de un curso)
- module_id (uuid, PK)
- course_id (FK -> courses)
- module_title, module_description
- module_order_index

**course_lessons** (Lecciones dentro de un módulo)
- lesson_id (uuid, PK)
- module_id (FK -> course_modules)
- instructor_id (FK -> users)
- lesson_title, lesson_description
- video_provider, video_provider_id
- duration_seconds
- transcript_content, summary_content
- is_published

**user_course_enrollments** (Inscripciones de usuarios a cursos)
- enrollment_id (uuid, PK)
- user_id (FK -> users)
- course_id (FK -> courses)
- enrollment_status (active, completed, paused, cancelled)
- overall_progress_percentage
- enrolled_at, last_accessed_at, completed_at

**user_lesson_progress** (Progreso detallado por lección)
- progress_id (uuid, PK)
- user_id (FK -> users)
- lesson_id (FK -> course_lessons)
- enrollment_id (FK -> user_course_enrollments)
- lesson_status (not_started, in_progress, completed)
- video_progress_percentage
- time_spent_minutes
- is_completed

### BUSINESS B2B (Empresas y Equipos)

**organizations** (Empresas/Clientes B2B)
- id (uuid, PK)
- name, description
- subscription_plan, subscription_status
- brand_color_primary, brand_logo_url (Personalización)
- max_users

**organization_users** (Miembros de la organización)
- user_id (FK -> users)
- organization_id (FK -> organizations)
- role (owner, admin, member)
- status (active, invited)

**work_teams** (Equipos dentro de una organización)
- team_id (uuid, PK)
- organization_id (FK -> organizations)
- name, description
- team_leader_id (FK -> users)

**work_team_members** (Miembros de un equipo)
- team_id (FK -> work_teams)
- user_id (FK -> users)
- role (member, leader)

**work_team_course_assignments** (Asignaciones de cursos a equipos)
- team_id (FK -> work_teams)
- course_id (FK -> courses)
- due_date (Fecha límite)
- status (assigned, in_progress, completed)

### INTERACTIVIDAD Y LIA

**lia_conversations** (Historial de chat con LIA)
- conversation_id (uuid, PK)
- user_id (FK -> users)
- context_type (course, dashboard, etc)
- course_id, lesson_id
- started_at, ended_at

**lia_messages** (Mensajes individuales)
- conversation_id (FK -> lia_conversations)
- role (user, assistant, system)
- content
- created_at

**lesson_activities** (Actividades interactivas en lecciones)
- activity_id (uuid, PK)
- lesson_id (FK -> course_lessons)
- activity_type (reflection, quiz, roleplay, etc)
- activity_content, ai_prompts

**lia_activity_completions** (Intentos de actividades con IA)
- completion_id (uuid, PK)
- user_id, activity_id
- status, generated_output
- feedback

### OTRAS TABLAS IMPORTANTES

**study_plans** (Planificador de estudios)
- user_id, goal_hours_per_week
- preferred_days, preferred_time_blocks

**user_streaks** (Rachas de estudio)
- user_id, current_streak, longest_streak
- total_study_minutes

**certificates** (Certificados obtenidos)
- certificate_id, user_id, course_id
- certificate_url
- issued_at

**reportes_problemas** (Feedback y bugs)
- user_id, titulo, descripcion, categoria
- pagina_url, estado

**ai_apps** (Directorio de Apps de IA)
- app_id, name, description, category_id
- pricing_model, website_url

**communities** (Comunidades - implícito, no veo tabla explícita pero mencionado en código)
- (Probablemente gestioanda via categories o externa)

**news** (Noticias - similar a communities)

`;
