-- Visit logs migration (runs after initial_schema).

create table if not exists public.visit_logs (
  id uuid primary key default gen_random_uuid(),
  created_at timestamptz not null default now(),
  user_id uuid references public.profiles(id) on delete set null,
  session_id text,
  event text not null default 'page_view' check (event in ('page_view','login')),
  path text,
  referrer text,
  country text,
  region text,
  city text,
  ip_masked text,
  timezone text,
  language text,
  device_type text,
  os text,
  browser text,
  screen text,
  user_agent text
);
create index if not exists visit_logs_time_idx on public.visit_logs(created_at desc);
create index if not exists visit_logs_user_idx on public.visit_logs(user_id);

alter table public.visit_logs enable row level security;

-- insert permission is added by consent.sql (signed-in, consented clients only)
-- only admins can read or delete
create policy "visits admin read" on public.visit_logs for select using (public.is_admin());
create policy "visits admin delete" on public.visit_logs for delete using (public.is_admin());
