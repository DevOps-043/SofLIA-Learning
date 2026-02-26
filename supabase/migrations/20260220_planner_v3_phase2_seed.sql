-- ======================================================================================
-- MIGRATION: Planner V3 - Compliance Engine (PHASE 2 - SEED DEFAULT POLICIES)
-- ======================================================================================
-- Objetivo: Asegurar que cada tenant (Organización) tenga una política base inicial.
-- Esto permite que los nuevos assignments puedan enlazar a 'policy_version_id'.

BEGIN;

DO $$ 
DECLARE
    org_record RECORD;
    new_policy_id UUID;
    new_version_id UUID;
BEGIN
    -- Iterar sobre todas las organizaciones activas en la plataforma
    FOR org_record IN SELECT id FROM public.organizations WHERE is_active = true
    LOOP
        -- 1. Verificar si la organización YA tiene una política (idempotencia)
        IF NOT EXISTS (
            SELECT 1 FROM public.planner_policies 
            WHERE organization_id = org_record.id AND name = 'Política de Cumplimiento General'
        ) THEN

            -- 2. Crear la política contenedora (Policy Root)
            INSERT INTO public.planner_policies (
                organization_id, 
                name, 
                created_at, 
                updated_at
            ) 
            VALUES (
                org_record.id, 
                'Política de Cumplimiento General', 
                now(), 
                now()
            ) RETURNING id INTO new_policy_id;

            -- 3. Crear la Primera Versión Inmutable (PolicyVersion v1)
            -- Las reglas definen 7 días de gracia, un umbral de 7 días de alerta 'due_soon'
            -- y por defecto el uso estricto congelado en el assignment.
            INSERT INTO public.planner_policy_versions (
                policy_id, 
                organization_id, 
                version, 
                status, 
                rules, 
                effective_from, 
                created_at
            ) 
            VALUES (
                new_policy_id, 
                org_record.id, 
                1, 
                'active', 
                '{
                    "defaultGracePeriodDays": 7,
                    "dueSoonThresholdDays": 7,
                    "allowCalendarSync": true,
                    "policyApplicationMode": "frozen_on_assignment"
                }'::jsonb, 
                now(), 
                now()
            ) RETURNING id INTO new_version_id;

            -- 4. Actualizar el Root para apuntar a la versión Activa
            UPDATE public.planner_policies 
            SET active_version_id = new_version_id 
            WHERE id = new_policy_id;

            RAISE NOTICE 'Creada Politica Default y Versión 1 para Organización: %', org_record.id;
        ELSE
            RAISE NOTICE 'La Organización % ya tiene una Política Default. Se omitió.', org_record.id;
        END IF;

    END LOOP;
END $$;

COMMIT;
