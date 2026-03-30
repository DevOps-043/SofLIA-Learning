/**
 * Migration Script: Add total_duration_minutes to course_lessons
 * 
 * This script adds a column to store the total duration of each lesson
 * including video time + materials time + activities time
 * 
 * Run this script by executing the SQL manually in Supabase SQL Editor
 */

export const migrationSQL = `
-- Migration: Add total_duration_minutes column to course_lessons
-- This column stores the total duration of the lesson including:
-- - Video duration (converted from duration_seconds to minutes)
-- - Estimated time from materials
-- - Estimated time from activities

-- STEP 1: Add the column to course_lessons table
ALTER TABLE course_lessons 
ADD COLUMN IF NOT EXISTS total_duration_minutes INTEGER DEFAULT 0;

-- STEP 2: Update existing lessons to calculate total_duration_minutes
UPDATE course_lessons cl
SET total_duration_minutes = (
  COALESCE(ROUND(cl.duration_seconds / 60.0), 0) +
  COALESCE((SELECT SUM(COALESCE(lm.estimated_time_minutes, 0)) FROM lesson_materials lm WHERE lm.lesson_id = cl.lesson_id), 0) +
  COALESCE((SELECT SUM(COALESCE(la.estimated_time_minutes, 0)) FROM lesson_activities la WHERE la.lesson_id = cl.lesson_id), 0)
);

-- STEP 3: Update course_modules.module_duration_minutes
UPDATE course_modules cm
SET module_duration_minutes = (
  SELECT COALESCE(SUM(COALESCE(cl.total_duration_minutes, 0)), 0)
  FROM course_lessons cl
  WHERE cl.module_id = cm.module_id
);

-- STEP 4: Create function for materials/activities changes
CREATE OR REPLACE FUNCTION recalculate_lesson_duration()
RETURNS TRIGGER AS $$
DECLARE
  v_module_id UUID;
  v_lesson_id UUID;
BEGIN
  IF TG_OP = 'DELETE' THEN v_lesson_id := OLD.lesson_id;
  ELSE v_lesson_id := NEW.lesson_id; END IF;

  UPDATE course_lessons cl
  SET total_duration_minutes = (
    COALESCE(ROUND(cl.duration_seconds / 60.0), 0) +
    COALESCE((SELECT SUM(COALESCE(lm.estimated_time_minutes, 0)) FROM lesson_materials lm WHERE lm.lesson_id = cl.lesson_id), 0) +
    COALESCE((SELECT SUM(COALESCE(la.estimated_time_minutes, 0)) FROM lesson_activities la WHERE la.lesson_id = cl.lesson_id), 0)
  )
  WHERE cl.lesson_id = v_lesson_id
  RETURNING module_id INTO v_module_id;

  IF v_module_id IS NOT NULL THEN
    UPDATE course_modules SET module_duration_minutes = (
      SELECT COALESCE(SUM(COALESCE(cl.total_duration_minutes, 0)), 0) FROM course_lessons cl WHERE cl.module_id = v_module_id
    ) WHERE module_id = v_module_id;
  END IF;

  IF TG_OP = 'DELETE' THEN RETURN OLD; END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Triggers for materials and activities
DROP TRIGGER IF EXISTS trigger_recalc_lesson_duration_materials ON lesson_materials;
CREATE TRIGGER trigger_recalc_lesson_duration_materials
AFTER INSERT OR UPDATE OR DELETE ON lesson_materials
FOR EACH ROW EXECUTE FUNCTION recalculate_lesson_duration();

DROP TRIGGER IF EXISTS trigger_recalc_lesson_duration_activities ON lesson_activities;
CREATE TRIGGER trigger_recalc_lesson_duration_activities
AFTER INSERT OR UPDATE OR DELETE ON lesson_activities
FOR EACH ROW EXECUTE FUNCTION recalculate_lesson_duration();

-- Function for lesson video duration changes
CREATE OR REPLACE FUNCTION recalculate_lesson_duration_on_lesson_update()
RETURNS TRIGGER AS $$
BEGIN
  IF OLD.duration_seconds IS DISTINCT FROM NEW.duration_seconds THEN
    NEW.total_duration_minutes := (
      COALESCE(ROUND(NEW.duration_seconds / 60.0), 0) +
      COALESCE((SELECT SUM(COALESCE(lm.estimated_time_minutes, 0)) FROM lesson_materials lm WHERE lm.lesson_id = NEW.lesson_id), 0) +
      COALESCE((SELECT SUM(COALESCE(la.estimated_time_minutes, 0)) FROM lesson_activities la WHERE la.lesson_id = NEW.lesson_id), 0)
    );
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trigger_recalc_lesson_duration_on_update ON course_lessons;
CREATE TRIGGER trigger_recalc_lesson_duration_on_update
BEFORE UPDATE ON course_lessons
FOR EACH ROW EXECUTE FUNCTION recalculate_lesson_duration_on_lesson_update();

-- Trigger for new lesson creation
CREATE OR REPLACE FUNCTION recalculate_lesson_duration_on_insert()
RETURNS TRIGGER AS $$
BEGIN
  NEW.total_duration_minutes := COALESCE(ROUND(NEW.duration_seconds / 60.0), 0);
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trigger_recalc_lesson_duration_on_insert ON course_lessons;
CREATE TRIGGER trigger_recalc_lesson_duration_on_insert
BEFORE INSERT ON course_lessons
FOR EACH ROW EXECUTE FUNCTION recalculate_lesson_duration_on_insert();

-- After insert trigger to update module duration
CREATE OR REPLACE FUNCTION update_module_duration_after_lesson_insert()
RETURNS TRIGGER AS $$
BEGIN
  UPDATE course_modules SET module_duration_minutes = (
    SELECT COALESCE(SUM(COALESCE(cl.total_duration_minutes, 0)), 0)
    FROM course_lessons cl WHERE cl.module_id = NEW.module_id
  ) WHERE module_id = NEW.module_id;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trigger_update_module_after_lesson_insert ON course_lessons;
CREATE TRIGGER trigger_update_module_after_lesson_insert
AFTER INSERT ON course_lessons
FOR EACH ROW EXECUTE FUNCTION update_module_duration_after_lesson_insert();
`;

