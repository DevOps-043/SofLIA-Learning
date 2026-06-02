-- Migration: 20260530153000_remove_question_title.sql
-- Elimina la columna title de la tabla course_questions ya que no es requerida por la UI.

ALTER TABLE public.course_questions DROP COLUMN IF EXISTS title;
