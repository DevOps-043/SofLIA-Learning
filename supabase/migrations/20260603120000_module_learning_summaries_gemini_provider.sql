alter table public.module_learning_summaries
  alter column model_provider set default 'gemini';

update public.module_learning_summaries
set model_provider = 'gemini'
where model_provider <> 'gemini'
  and status = 'generating';
