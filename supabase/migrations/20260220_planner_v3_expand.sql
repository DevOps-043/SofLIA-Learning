-- ======================================================================================
-- MIGRATION: Planner V3 - Compliance Engine (SAFE EXPAND PHASE)
-- ======================================================================================
-- Este script es PURAMENTE ADITIVO (Expand Phase).
-- NO elimine ni modifique destructivamente nada de la versión legacy V1/V2.
-- Todos los cambios deben incluir verificaciones de existencia.

-- 1. EXTENDIENDO ENTIDAD EXISTENTE (organization_course_assignments)
-- ======================================================================================

ALTER TABLE public.organization_course_assignments
ADD COLUMN IF NOT EXISTS hard_due_date timestamptz,
ADD COLUMN IF NOT EXISTS soft_due_date timestamptz,
ADD COLUMN IF NOT EXISTS policy_version_id uuid,
ADD COLUMN IF NOT EXISTS grace_period_days int,
ADD COLUMN IF NOT EXISTS compliance_mode text DEFAULT 'strict',
ADD COLUMN IF NOT EXISTS exempted_at timestamptz,
ADD COLUMN IF NOT EXISTS exempted_by uuid REFERENCES auth.users(id),
ADD COLUMN IF NOT EXISTS exemption_reason text,
ADD COLUMN IF NOT EXISTS source_type text DEFAULT 'manual', -- manual, automation, role_based
ADD COLUMN IF NOT EXISTS source_id uuid,
ADD COLUMN IF NOT EXISTS recurrence_type text DEFAULT 'none', -- none, yearly, quarterly, custom
ADD COLUMN IF NOT EXISTS recurrence_interval int,
ADD COLUMN IF NOT EXISTS next_cycle_at timestamptz,
ADD COLUMN IF NOT EXISTS obligation_generation_hash text,
ADD COLUMN IF NOT EXISTS policy_snapshot jsonb;

-- Índices de desempeño para búsquedas de Tenant + User Constraints + Vencimientos
CREATE INDEX IF NOT EXISTS idx_org_course_assignments_tenant_user
ON public.organization_course_assignments (organization_id, user_id);

CREATE INDEX IF NOT EXISTS idx_org_course_assignments_tenant_due
ON public.organization_course_assignments (organization_id, hard_due_date);

-- 2. NUEVAS TABLAS CORE B2B (Planner Policy Layer)
-- ======================================================================================

-- 2.1 planner_policies
CREATE TABLE IF NOT EXISTS public.planner_policies (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    organization_id uuid NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
    name text NOT NULL,
    active_version_id uuid, -- Reference to planner_policy_versions (FK added later to avoid circular)
    created_at timestamptz DEFAULT now(),
    updated_at timestamptz DEFAULT now()
);

-- Index multi-tenant para políticas
CREATE INDEX IF NOT EXISTS idx_planner_policies_org_id 
ON public.planner_policies (organization_id);

-- 2.2 planner_policy_versions
CREATE TABLE IF NOT EXISTS public.planner_policy_versions (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    policy_id uuid NOT NULL REFERENCES public.planner_policies(id) ON DELETE CASCADE,
    organization_id uuid NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
    version integer NOT NULL,
    status text NOT NULL DEFAULT 'draft', -- draft, active, retired
    rules jsonb NOT NULL DEFAULT '{}'::jsonb, -- configuration engine rules
    effective_from timestamptz,
    effective_to timestamptz,
    created_by uuid REFERENCES auth.users(id),
    created_at timestamptz DEFAULT now()
);

-- Index multi-tenant
CREATE INDEX IF NOT EXISTS idx_planner_policy_versions_org_id 
ON public.planner_policy_versions (organization_id);

-- Evitar versiones duplicadas en una misma política
CREATE UNIQUE INDEX IF NOT EXISTS unique_policy_version_number 
ON public.planner_policy_versions (policy_id, version);

-- Add Circular FK to planner_policies
ALTER TABLE public.planner_policies
ADD CONSTRAINT fk_planner_policies_active_version 
FOREIGN KEY (active_version_id) REFERENCES public.planner_policy_versions(id) ON DELETE SET NULL;


-- 2.3 planner_policy_scopes (Opcional por ahora, preparativo)
CREATE TABLE IF NOT EXISTS public.planner_policy_scopes (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    policy_id uuid NOT NULL REFERENCES public.planner_policies(id) ON DELETE CASCADE,
    organization_id uuid NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
    scope_type text NOT NULL, -- whole_org, hierarchy_node, role, specific_team
    scope_id uuid, -- referenced entity id based on scope_type
    created_at timestamptz DEFAULT now()
);


-- 2.4 planner_audit_log (Auditabilidad estricta)
CREATE TABLE IF NOT EXISTS public.planner_audit_log (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    organization_id uuid NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
    actor_user_id uuid NOT NULL REFERENCES auth.users(id),
    action text NOT NULL, -- e.g., 'GRANT_EXEMPTION', 'CHANGE_DUE_DATE', 'PUBLISH_POLICY'
    entity_type text NOT NULL, -- 'LEARNING_OBLIGATION', 'POLICY', etc.
    entity_id uuid NOT NULL,
    reason text,
    before jsonb,
    after jsonb,
    created_at timestamptz DEFAULT now()
);

-- Essential index for Audit queries heavily scoped by tenant
CREATE INDEX IF NOT EXISTS idx_planner_audit_log_org_entity 
ON public.planner_audit_log (organization_id, entity_type, entity_id);


-- 3. AJUSTAR TABLAS RELACIONADAS (study_sessions legacy)
-- ======================================================================================

-- Preparar study_sessions para estar acopladas a una LearningObligation (el nuevo assignment)
ALTER TABLE public.study_sessions
ADD COLUMN IF NOT EXISTS obligation_id uuid REFERENCES public.organization_course_assignments(id) ON DELETE CASCADE,
ADD COLUMN IF NOT EXISTS course_id_uuid uuid; -- Soporte para migración de `course_id` de texto a uuid si aplica.


-- 4. VIEW DEL COMPLIANCE STATE (Opcional utilería materializada al vuelo)
-- ======================================================================================
-- Esta vista evita almacenar el "on_track", "overdue" hardcodeado, lo calcula en tiempo real.
CREATE OR REPLACE VIEW public.v_learning_obligations_compliance AS
SELECT 
    oca.id AS obligation_id,
    oca.organization_id,
    oca.user_id,
    oca.course_id,
    oca.hard_due_date,
    oca.soft_due_date,
    oca.completed_at,
    oca.exempted_at,
    CASE
        WHEN oca.completed_at IS NOT NULL THEN 'completed'
        WHEN oca.exempted_at IS NOT NULL THEN 'waived'
        WHEN oca.hard_due_date IS NOT NULL AND now() > (oca.hard_due_date + COALESCE(oca.grace_period_days, 0) * INTERVAL '1 day') THEN 'overdue'
        WHEN oca.soft_due_date IS NOT NULL AND now() > oca.soft_due_date THEN 'due_soon'
        ELSE 'on_track'
    END AS compliance_state
FROM public.organization_course_assignments oca;

-- ======================================================================================
-- FIN DE LA MIGRACIÓN
-- ======================================================================================
