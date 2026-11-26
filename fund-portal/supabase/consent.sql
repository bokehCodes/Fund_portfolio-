-- Run once in Supabase > SQL Editor (after schema.sql and visit_logs.sql).
-- Adds: privacy policy text, signed consent on first login, consent audit trail,
-- and makes visit logging possible ONLY for signed-in clients who have consented.

-- 1. Consent fields
alter table public.profiles
  add column if not exists consent_at timestamptz,
  add column if not exists consent_name text,
  add column if not exists consent_version int;

alter table public.site_settings
  add column if not exists privacy_policy text,
  add column if not exists privacy_version int not null default 1;

update public.site_settings set privacy_policy = $policy$PRIVACY POLICY AND CONSENT

(Template: have a lawyer review and complete the bracketed items before going live.)

1. Who we are
[Firm name] ("we", "us") provides this portal so that clients can view records of their account: balances, transactions, profits and news. Investments are carried out by us at our office. This portal is a record, not a trading platform. Contact: [email / phone / address].

2. Information we collect
- Account information: your name, email address, account reference.
- Account records: deposits, withdrawals, profits, losses, fees and holdings.
- Visit and device information when you use this portal: date and time of each visit, pages viewed, time zone, language, approximate location (country, region, city), IP address (partly masked), device type, operating system, browser and screen size.

3. Why we use it
- To provide and secure your account, and to detect unusual or unauthorised access.
- To improve the portal and personalise your experience.
- To send you updates, news and information about our services (marketing).

4. Your consent
By signing below you confirm that you have read this policy and consent to us collecting and using your information as described. You may withdraw consent at any time from your dashboard or by contacting us. Withdrawing does not affect processing done before withdrawal. We keep a record of the date, version and name you signed with.

5. Sharing
We do not sell your information. We share it only with service providers who host or operate this portal on our behalf, and where the law requires it.

6. Retention
We keep account records for as long as your account is active and as long as the law requires afterwards. Visit logs are kept for [12] months.

7. Your rights
You may ask to access, correct or delete your information, object to marketing, and withdraw consent, by contacting [email]. You may also complain to your data protection authority (in Nigeria, the Nigeria Data Protection Commission).

8. Changes
If we change this policy in a significant way we will ask you to review and sign it again.$policy$
where id = 1 and privacy_policy is null;

-- 2. Audit trail of every sign / withdraw
create table if not exists public.consent_events (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles(id) on delete cascade,
  action text not null check (action in ('accepted','withdrawn')),
  signed_name text,
  policy_version int,
  created_at timestamptz not null default now()
);
alter table public.consent_events enable row level security;
drop policy if exists "consent events read" on public.consent_events;
create policy "consent events read" on public.consent_events for select
  using (user_id = auth.uid() or public.is_admin());

-- 3. Functions the app calls (clients cannot edit their profile directly)
create or replace function public.accept_consent(p_name text) returns void
language plpgsql security definer set search_path = public as $$
declare v int;
begin
  if auth.uid() is null then raise exception 'Not signed in'; end if;
  if coalesce(trim(p_name), '') = '' then raise exception 'Please type your full name'; end if;
  select coalesce(privacy_version, 1) into v from public.site_settings where id = 1;
  update public.profiles
     set consent_at = now(), consent_name = trim(p_name), consent_version = v
   where id = auth.uid();
  insert into public.consent_events (user_id, action, signed_name, policy_version)
  values (auth.uid(), 'accepted', trim(p_name), v);
end; $$;

create or replace function public.withdraw_consent() returns void
language plpgsql security definer set search_path = public as $$
begin
  if auth.uid() is null then raise exception 'Not signed in'; end if;
  insert into public.consent_events (user_id, action, signed_name, policy_version)
  select id, 'withdrawn', consent_name, consent_version from public.profiles where id = auth.uid();
  update public.profiles set consent_at = null, consent_name = null, consent_version = null
   where id = auth.uid();
end; $$;

revoke all on function public.accept_consent(text) from public, anon;
revoke all on function public.withdraw_consent() from public, anon;
grant execute on function public.accept_consent(text) to authenticated;
grant execute on function public.withdraw_consent() to authenticated;

-- 4. Visit logs: signed-in + consented clients only (anonymous logging is switched off)
drop policy if exists "visits insert" on public.visit_logs;
drop policy if exists "visits insert consented" on public.visit_logs;
create policy "visits insert consented" on public.visit_logs for insert to authenticated
  with check (
    user_id = auth.uid()
    and exists (select 1 from public.profiles p where p.id = auth.uid() and p.consent_at is not null)
  );
