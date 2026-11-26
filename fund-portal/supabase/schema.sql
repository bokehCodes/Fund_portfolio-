-- Run this whole file once in Supabase > SQL Editor.

create extension if not exists pgcrypto;

-- PROFILES (one per login; created automatically when you add a user in Supabase)
create table if not exists public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  email text,
  full_name text default '',
  account_ref text default '',
  role text not null default 'client' check (role in ('admin','client')),
  created_at timestamptz not null default now()
);

create or replace function public.is_admin() returns boolean
language sql security definer set search_path = public stable as $$
  select exists (select 1 from public.profiles where id = auth.uid() and role = 'admin');
$$;

create or replace function public.handle_new_user() returns trigger
language plpgsql security definer set search_path = public as $$
begin
  insert into public.profiles (id, email, full_name)
  values (new.id, new.email, coalesce(new.raw_user_meta_data->>'full_name',''));
  return new;
end; $$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created after insert on auth.users
  for each row execute function public.handle_new_user();

-- SITE SETTINGS (single row, edited from the admin panel)
create table if not exists public.site_settings (
  id int primary key default 1 check (id = 1),
  site_name text default 'Your Firm Name',
  tagline text default 'Private wealth records, clearly presented',
  currency text default 'USD',
  logo_url text,
  hero_title text default 'Your portfolio, always in view',
  hero_subtitle text default 'Secure access to your balance, transaction history and market updates.',
  hero_image_url text,
  services jsonb default '[]'::jsonb,
  about_title text default 'About us',
  about_text text default 'Tell your story here.',
  contact_email text,
  contact_phone text,
  address text,
  disclaimer text default 'This portal is a record of your account held and managed by the firm. It is not a trading platform.',
  palette jsonb
);
insert into public.site_settings (id, services) values (1,
  '[{"title":"Bonds","text":"Government and corporate bond positions."},{"title":"Cryptocurrency","text":"Managed digital asset positions."},{"title":"Precious metals","text":"Gold, silver and other physical metals."}]'::jsonb)
on conflict (id) do nothing;

-- TRANSACTIONS (every deposit, withdrawal, profit, loss, fee)
create table if not exists public.transactions (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles(id) on delete cascade,
  type text not null check (type in ('deposit','withdrawal','profit','loss','fee')),
  asset_class text check (asset_class in ('bonds','crypto','precious_metals','cash')),
  asset_name text,
  amount numeric(18,2) not null check (amount >= 0),
  occurred_on date not null default current_date,
  note text,
  created_at timestamptz not null default now()
);
create index if not exists tx_user_idx on public.transactions(user_id, occurred_on desc);

-- HOLDINGS (current positions shown on the client dashboard)
create table if not exists public.holdings (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles(id) on delete cascade,
  asset_class text not null check (asset_class in ('bonds','crypto','precious_metals','cash')),
  asset_name text not null,
  invested numeric(18,2) not null default 0,
  current_value numeric(18,2) not null default 0,
  updated_at timestamptz not null default now()
);

-- NEWS
create table if not exists public.news (
  id uuid primary key default gen_random_uuid(),
  title text not null,
  summary text,
  body text,
  image_url text,
  visibility text not null default 'public' check (visibility in ('public','clients')),
  published boolean not null default true,
  published_at timestamptz not null default now()
);

-- ROW LEVEL SECURITY
alter table public.profiles enable row level security;
alter table public.site_settings enable row level security;
alter table public.transactions enable row level security;
alter table public.holdings enable row level security;
alter table public.news enable row level security;

create policy "profiles read own or admin" on public.profiles for select using (id = auth.uid() or public.is_admin());
create policy "profiles admin update" on public.profiles for update using (public.is_admin());
create policy "profiles admin delete" on public.profiles for delete using (public.is_admin());

create policy "settings public read" on public.site_settings for select using (true);
create policy "settings admin write" on public.site_settings for all using (public.is_admin()) with check (public.is_admin());

create policy "tx read own or admin" on public.transactions for select using (user_id = auth.uid() or public.is_admin());
create policy "tx admin write" on public.transactions for all using (public.is_admin()) with check (public.is_admin());

create policy "holdings read own or admin" on public.holdings for select using (user_id = auth.uid() or public.is_admin());
create policy "holdings admin write" on public.holdings for all using (public.is_admin()) with check (public.is_admin());

create policy "news public read" on public.news for select to anon using (published and visibility = 'public');
create policy "news clients read" on public.news for select to authenticated using (published or public.is_admin());
create policy "news admin write" on public.news for all using (public.is_admin()) with check (public.is_admin());

-- IMAGE STORAGE (logo, hero image, news images)
insert into storage.buckets (id, name, public) values ('site-assets','site-assets', true) on conflict (id) do nothing;
create policy "assets public read" on storage.objects for select using (bucket_id = 'site-assets');
create policy "assets admin insert" on storage.objects for insert to authenticated with check (bucket_id = 'site-assets' and public.is_admin());
create policy "assets admin update" on storage.objects for update to authenticated using (bucket_id = 'site-assets' and public.is_admin());
create policy "assets admin delete" on storage.objects for delete to authenticated using (bucket_id = 'site-assets' and public.is_admin());
