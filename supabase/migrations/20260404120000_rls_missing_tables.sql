-- RLS for study_plans
ALTER TABLE public.study_plans ENABLE ROW LEVEL SECURITY;

CREATE POLICY "study_plans_select_own" ON public.study_plans
  FOR SELECT TO authenticated USING (user_id = auth.uid());

CREATE POLICY "study_plans_insert_own" ON public.study_plans
  FOR INSERT TO authenticated WITH CHECK (user_id = auth.uid());

CREATE POLICY "study_plans_update_own" ON public.study_plans
  FOR UPDATE TO authenticated USING (user_id = auth.uid());

CREATE POLICY "study_plans_delete_own" ON public.study_plans
  FOR DELETE TO authenticated USING (user_id = auth.uid());

CREATE POLICY "study_plans_service_role" ON public.study_plans
  TO service_role USING (true) WITH CHECK (true);

-- RLS for lia_messages
ALTER TABLE public.lia_messages ENABLE ROW LEVEL SECURITY;

CREATE POLICY "lia_messages_select_own_conv" ON public.lia_messages
  FOR SELECT TO authenticated
  USING (
    conversation_id IN (
      SELECT id FROM public.lia_conversations WHERE user_id = auth.uid()
    )
  );

CREATE POLICY "lia_messages_insert_own_conv" ON public.lia_messages
  FOR INSERT TO authenticated
  WITH CHECK (
    conversation_id IN (
      SELECT id FROM public.lia_conversations WHERE user_id = auth.uid()
    )
  );

CREATE POLICY "lia_messages_service_role" ON public.lia_messages
  TO service_role USING (true) WITH CHECK (true);

-- RLS for calendar_integrations
ALTER TABLE public.calendar_integrations ENABLE ROW LEVEL SECURITY;

CREATE POLICY "calendar_integrations_select_own" ON public.calendar_integrations
  FOR SELECT TO authenticated USING (user_id = auth.uid());

CREATE POLICY "calendar_integrations_upsert_own" ON public.calendar_integrations
  FOR ALL TO authenticated
  USING (user_id = auth.uid()) WITH CHECK (user_id = auth.uid());

CREATE POLICY "calendar_integrations_service_role" ON public.calendar_integrations
  TO service_role USING (true) WITH CHECK (true);
