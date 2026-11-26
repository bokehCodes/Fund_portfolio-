-- Grant the API roles the SQL privileges required to reach the existing RLS
-- policies. These grants do not change row access; RLS remains authoritative.

grant select, update, delete on public.profiles to authenticated;

grant select on public.site_settings to anon, authenticated;
grant insert, update, delete on public.site_settings to authenticated;

grant select, insert, update, delete
  on public.transactions, public.holdings to authenticated;

grant select on public.news to anon, authenticated;
grant insert, update, delete on public.news to authenticated;

grant select, insert, delete on public.visit_logs to authenticated;
grant select on public.consent_events to authenticated;

grant select on storage.objects to anon, authenticated;
grant insert, update, delete on storage.objects to authenticated;
