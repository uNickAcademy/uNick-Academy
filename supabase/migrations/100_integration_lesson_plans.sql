-- ============================================================
-- Academy / Strefa nauczyciela: sklep z konspektami (lesson_plans)
-- Bezpieczne, ADDYTYWNE, idempotentne. Dostosowane do istniejącego
-- schematu produkcyjnego (profiles.role zamiast is_admin).
-- ============================================================

-- 1) Kolumny abonamentu na istniejącym profiles (addytywnie)
alter table public.profiles
  add column if not exists subscription_status text not null default 'none'
    check (subscription_status in ('none','active','past_due','cancelled')),
  add column if not exists subscription_plan text
    check (subscription_plan in ('monthly','annual')),
  add column if not exists subscription_currency text
    check (subscription_currency in ('usd','eur','pln')),
  add column if not exists stripe_customer_id text;

-- 2) Funkcja updated_at (jeśli brak)
create or replace function public.set_updated_at()
returns trigger as $$
begin
  new.updated_at = now();
  return new;
end;
$$ language plpgsql;

-- 3) Tabela lesson_plans
create table if not exists public.lesson_plans (
  id uuid primary key default gen_random_uuid(),
  title text not null,
  description text,
  cefr_level text not null check (cefr_level in ('A1','A2','B1','B2','C1','C2')),
  age_group text not null check (age_group in ('young_learners','teens','adults')),
  themes text[] not null default '{}',
  pdf_path text not null,
  is_free boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table public.lesson_plans enable row level security;

drop trigger if exists set_lesson_plans_updated_at on public.lesson_plans;
create trigger set_lesson_plans_updated_at
  before update on public.lesson_plans
  for each row execute procedure public.set_updated_at();

-- 4) Polityki RLS (dopasowane do role='admin')
drop policy if exists "Free lesson plans are visible to everyone" on public.lesson_plans;
create policy "Free lesson plans are visible to everyone"
  on public.lesson_plans for select using (is_free = true);

drop policy if exists "Active subscribers can view all lesson plans" on public.lesson_plans;
create policy "Active subscribers can view all lesson plans"
  on public.lesson_plans for select using (
    exists (select 1 from public.profiles
      where profiles.id = auth.uid() and profiles.subscription_status = 'active')
  );

drop policy if exists "Admins manage lesson plans" on public.lesson_plans;
create policy "Admins manage lesson plans"
  on public.lesson_plans for all using (
    exists (select 1 from public.profiles
      where profiles.id = auth.uid() and profiles.role = 'admin')
  );

-- Bez danych przykładowych — realne konspekty dodaje się przez panel admina
-- albo bezpośrednio w bazie.
