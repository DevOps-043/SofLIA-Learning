alter table public.course_modules
  drop constraint if exists course_modules_course_id_fkey;

alter table public.course_modules
  add constraint course_modules_course_id_fkey
  foreign key (course_id)
  references public.courses(id)
  on delete cascade;

alter table public.certificate_ledger
  drop constraint if exists certificate_ledger_cert_id_fkey;

alter table public.certificate_ledger
  add constraint certificate_ledger_cert_id_fkey
  foreign key (cert_id)
  references public.user_course_certificates(certificate_id)
  on delete cascade;

alter table public.course_lessons
  drop constraint if exists course_lessons_module_id_fkey;

alter table public.course_lessons
  add constraint course_lessons_module_id_fkey
  foreign key (module_id)
  references public.course_modules(module_id)
  on delete cascade;

alter table public.course_question_responses
  drop constraint if exists course_question_responses_question_id_fkey;

alter table public.course_question_responses
  add constraint course_question_responses_question_id_fkey
  foreign key (question_id)
  references public.course_questions(id)
  on delete cascade;

alter table public.course_question_responses
  drop constraint if exists course_question_responses_parent_response_id_fkey;

alter table public.course_question_responses
  add constraint course_question_responses_parent_response_id_fkey
  foreign key (parent_response_id)
  references public.course_question_responses(id)
  on delete cascade;

alter table public.course_question_reactions
  drop constraint if exists course_question_reactions_question_id_fkey;

alter table public.course_question_reactions
  add constraint course_question_reactions_question_id_fkey
  foreign key (question_id)
  references public.course_questions(id)
  on delete cascade;

alter table public.course_question_reactions
  drop constraint if exists course_question_reactions_response_id_fkey;

alter table public.course_question_reactions
  add constraint course_question_reactions_response_id_fkey
  foreign key (response_id)
  references public.course_question_responses(id)
  on delete cascade;

alter table public.lesson_materials
  drop constraint if exists lesson_materials_lesson_id_fkey;

alter table public.lesson_materials
  add constraint lesson_materials_lesson_id_fkey
  foreign key (lesson_id)
  references public.course_lessons(lesson_id)
  on delete cascade;

alter table public.lesson_activities
  drop constraint if exists lesson_activities_lesson_id_fkey;

alter table public.lesson_activities
  add constraint lesson_activities_lesson_id_fkey
  foreign key (lesson_id)
  references public.course_lessons(lesson_id)
  on delete cascade;

alter table public.lesson_checkpoints
  drop constraint if exists lesson_checkpoints_lesson_id_fkey;

alter table public.lesson_checkpoints
  add constraint lesson_checkpoints_lesson_id_fkey
  foreign key (lesson_id)
  references public.course_lessons(lesson_id)
  on delete cascade;

alter table public.lesson_feedback
  drop constraint if exists lesson_feedback_lesson_id_fkey;

alter table public.lesson_feedback
  add constraint lesson_feedback_lesson_id_fkey
  foreign key (lesson_id)
  references public.course_lessons(lesson_id)
  on delete cascade;

alter table public.lesson_time_estimates
  drop constraint if exists lesson_time_estimates_lesson_id_fkey;

alter table public.lesson_time_estimates
  add constraint lesson_time_estimates_lesson_id_fkey
  foreign key (lesson_id)
  references public.course_lessons(lesson_id)
  on delete cascade;

alter table public.lesson_tracking
  drop constraint if exists lesson_tracking_lesson_id_fkey;

alter table public.lesson_tracking
  add constraint lesson_tracking_lesson_id_fkey
  foreign key (lesson_id)
  references public.course_lessons(lesson_id)
  on delete cascade;

alter table public.lia_common_questions
  drop constraint if exists lia_common_questions_lesson_id_fkey;

alter table public.lia_common_questions
  add constraint lia_common_questions_lesson_id_fkey
  foreign key (lesson_id)
  references public.course_lessons(lesson_id)
  on delete cascade;

alter table public.lia_common_questions
  drop constraint if exists lia_common_questions_activity_id_fkey;

alter table public.lia_common_questions
  add constraint lia_common_questions_activity_id_fkey
  foreign key (activity_id)
  references public.lesson_activities(activity_id)
  on delete cascade;

alter table public.lia_conversations
  drop constraint if exists lia_conversations_course_id_fkey;

alter table public.lia_conversations
  add constraint lia_conversations_course_id_fkey
  foreign key (course_id)
  references public.courses(id)
  on delete cascade;

alter table public.lia_conversations
  drop constraint if exists lia_conversations_module_id_fkey;

alter table public.lia_conversations
  add constraint lia_conversations_module_id_fkey
  foreign key (module_id)
  references public.course_modules(module_id)
  on delete cascade;

alter table public.lia_conversations
  drop constraint if exists lia_conversations_lesson_id_fkey;

alter table public.lia_conversations
  add constraint lia_conversations_lesson_id_fkey
  foreign key (lesson_id)
  references public.course_lessons(lesson_id)
  on delete cascade;

alter table public.lia_conversations
  drop constraint if exists lia_conversations_activity_id_fkey;

alter table public.lia_conversations
  add constraint lia_conversations_activity_id_fkey
  foreign key (activity_id)
  references public.lesson_activities(activity_id)
  on delete cascade;

alter table public.lia_messages
  drop constraint if exists lia_messages_conversation_id_fkey;

alter table public.lia_messages
  add constraint lia_messages_conversation_id_fkey
  foreign key (conversation_id)
  references public.lia_conversations(conversation_id)
  on delete cascade;

alter table public.lia_user_feedback
  drop constraint if exists lia_user_feedback_message_id_fkey;

alter table public.lia_user_feedback
  add constraint lia_user_feedback_message_id_fkey
  foreign key (message_id)
  references public.lia_messages(message_id)
  on delete cascade;

alter table public.lia_user_feedback
  drop constraint if exists lia_user_feedback_conversation_id_fkey;

alter table public.lia_user_feedback
  add constraint lia_user_feedback_conversation_id_fkey
  foreign key (conversation_id)
  references public.lia_conversations(conversation_id)
  on delete cascade;

alter table public.lia_activity_completions
  drop constraint if exists lia_activity_completions_conversation_id_fkey;

alter table public.lia_activity_completions
  add constraint lia_activity_completions_conversation_id_fkey
  foreign key (conversation_id)
  references public.lia_conversations(conversation_id)
  on delete cascade;

alter table public.lia_activity_completions
  drop constraint if exists lia_activity_completions_activity_id_fkey;

alter table public.lia_activity_completions
  add constraint lia_activity_completions_activity_id_fkey
  foreign key (activity_id)
  references public.lesson_activities(activity_id)
  on delete cascade;

alter table public.study_sessions
  drop constraint if exists study_sessions_lesson_id_fkey;

alter table public.study_sessions
  add constraint study_sessions_lesson_id_fkey
  foreign key (lesson_id)
  references public.course_lessons(lesson_id)
  on delete cascade;

alter table public.user_activity_log
  drop constraint if exists user_activity_log_course_id_fkey;

alter table public.user_activity_log
  add constraint user_activity_log_course_id_fkey
  foreign key (course_id)
  references public.courses(id)
  on delete cascade;

alter table public.user_activity_log
  drop constraint if exists user_activity_log_lesson_id_fkey;

alter table public.user_activity_log
  add constraint user_activity_log_lesson_id_fkey
  foreign key (lesson_id)
  references public.course_lessons(lesson_id)
  on delete cascade;

alter table public.user_lesson_notes
  drop constraint if exists user_lesson_notes_lesson_id_fkey;

alter table public.user_lesson_notes
  add constraint user_lesson_notes_lesson_id_fkey
  foreign key (lesson_id)
  references public.course_lessons(lesson_id)
  on delete cascade;

alter table public.user_lesson_progress
  drop constraint if exists user_lesson_progress_lesson_id_fkey;

alter table public.user_lesson_progress
  add constraint user_lesson_progress_lesson_id_fkey
  foreign key (lesson_id)
  references public.course_lessons(lesson_id)
  on delete cascade;

alter table public.user_quiz_submissions
  drop constraint if exists user_quiz_submissions_lesson_id_fkey;

alter table public.user_quiz_submissions
  add constraint user_quiz_submissions_lesson_id_fkey
  foreign key (lesson_id)
  references public.course_lessons(lesson_id)
  on delete cascade;

alter table public.user_quiz_submissions
  drop constraint if exists user_quiz_submissions_material_id_fkey;

alter table public.user_quiz_submissions
  add constraint user_quiz_submissions_material_id_fkey
  foreign key (material_id)
  references public.lesson_materials(material_id)
  on delete cascade;

alter table public.user_quiz_submissions
  drop constraint if exists user_quiz_submissions_activity_id_fkey;

alter table public.user_quiz_submissions
  add constraint user_quiz_submissions_activity_id_fkey
  foreign key (activity_id)
  references public.lesson_activities(activity_id)
  on delete cascade;
