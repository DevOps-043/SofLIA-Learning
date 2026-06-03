-- Migración para añadir duración de quizzes a los intentos de usuario
ALTER TABLE public.user_quiz_submissions
ADD COLUMN duration_seconds integer default null;

comment on column public.user_quiz_submissions.duration_seconds is 'Tiempo en segundos que tardó el usuario en resolver el quiz';
