-- Migration: Add ON DELETE CASCADE to the organization hierarchy FK chain
--
-- Without cascades, deleting an organization_structure would fail with a FK
-- violation from organization_nodes.  Similarly, deleting a node would fail if
-- it has children (parent_id self-ref) or dependent rows in node_users /
-- node_courses / node_objectives.
--
-- Safe approach: drop each constraint, re-add with CASCADE.  The IF EXISTS guard
-- prevents failures if the constraint was already updated.

-- 1. organization_nodes.structure_id → organization_structures
ALTER TABLE public.organization_nodes
  DROP CONSTRAINT IF EXISTS organization_nodes_structure_id_fkey;
ALTER TABLE public.organization_nodes
  ADD CONSTRAINT organization_nodes_structure_id_fkey
    FOREIGN KEY (structure_id)
    REFERENCES public.organization_structures(id)
    ON DELETE CASCADE;

-- 2. organization_nodes.parent_id → organization_nodes (self-ref)
--    Needed so deleting a parent node cascades to its children.
ALTER TABLE public.organization_nodes
  DROP CONSTRAINT IF EXISTS organization_nodes_parent_id_fkey;
ALTER TABLE public.organization_nodes
  ADD CONSTRAINT organization_nodes_parent_id_fkey
    FOREIGN KEY (parent_id)
    REFERENCES public.organization_nodes(id)
    ON DELETE CASCADE;

-- 3. organization_node_users.node_id → organization_nodes
ALTER TABLE public.organization_node_users
  DROP CONSTRAINT IF EXISTS organization_node_users_node_id_fkey;
ALTER TABLE public.organization_node_users
  ADD CONSTRAINT organization_node_users_node_id_fkey
    FOREIGN KEY (node_id)
    REFERENCES public.organization_nodes(id)
    ON DELETE CASCADE;

-- 4. organization_node_courses.node_id → organization_nodes
ALTER TABLE public.organization_node_courses
  DROP CONSTRAINT IF EXISTS organization_node_courses_node_id_fkey;
ALTER TABLE public.organization_node_courses
  ADD CONSTRAINT organization_node_courses_node_id_fkey
    FOREIGN KEY (node_id)
    REFERENCES public.organization_nodes(id)
    ON DELETE CASCADE;

-- 5. organization_node_objectives.node_id → organization_nodes
ALTER TABLE public.organization_node_objectives
  DROP CONSTRAINT IF EXISTS organization_node_objectives_node_id_fkey;
ALTER TABLE public.organization_node_objectives
  ADD CONSTRAINT organization_node_objectives_node_id_fkey
    FOREIGN KEY (node_id)
    REFERENCES public.organization_nodes(id)
    ON DELETE CASCADE;
