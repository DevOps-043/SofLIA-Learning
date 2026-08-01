-- Compatibilidad para instalaciones que ya aplicaron la migracion base de
-- documentos diarios antes de incorporar la persistencia del analisis visible.

begin;

alter table public.daily_ai_report_documents
  add column if not exists report_payload jsonb;

-- La version v3 inaugura el contrato de un unico corte organizacional por dia.
-- El predicado por scope permite conservar documentos legacy sin borrarlos y
-- evita que variantes previas impidan desplegar el nuevo indice.
create unique index if not exists daily_ai_report_documents_org_day_idx
  on public.daily_ai_report_documents (organization_id, report_date)
  where report_type = 'org_reports_analytics'
    and scope_key = 'template=premium-unified-v3';

comment on column public.daily_ai_report_documents.report_payload is
  'Snapshot publico y analisis reconciliado usados para renderizar el PDF persistente.';

commit;
