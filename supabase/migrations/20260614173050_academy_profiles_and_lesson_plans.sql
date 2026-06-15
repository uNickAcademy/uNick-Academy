-- Profiles table: one row per auth user, tracks subscription state
create table public.profiles (
  id uuid primary key references auth.users (id) on delete cascade,
  email text not null,
  full_name text,
  stripe_customer_id text unique,
  subscription_status text not null default 'none'
    check (subscription_status in ('none', 'active', 'past_due', 'cancelled')),
  subscription_currency text
    check (subscription_currency in ('usd', 'eur', 'pln')),
  subscription_plan text
    check (subscription_plan in ('monthly', 'annual')),
  is_admin boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table public.profiles enable row level security;

create policy "Users can view their own profile"
  on public.profiles for select
  using (auth.uid() = id);

create policy "Users can update their own profile"
  on public.profiles for update
  using (auth.uid() = id);

-- Keep profiles in sync with new auth users
create function public.handle_new_user()
returns trigger
language plpgsql
security definer set search_path = public
as $$
begin
  insert into public.profiles (id, email)
  values (new.id, new.email);
  return new;
end;
$$;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure public.handle_new_user();

-- Generic updated_at maintenance
create function public.set_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

create trigger set_profiles_updated_at
  before update on public.profiles
  for each row execute procedure public.set_updated_at();

-- Lesson plans library
create table public.lesson_plans (
  id uuid primary key default gen_random_uuid(),
  title text not null,
  description text,
  cefr_level text not null check (cefr_level in ('A1','A2','B1','B2','C1','C2')),
  age_group text not null check (age_group in ('young_learners','teens','adults')),
  skills text[] not null default '{}',
  pdf_path text not null,
  is_free boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table public.lesson_plans enable row level security;

create trigger set_lesson_plans_updated_at
  before update on public.lesson_plans
  for each row execute procedure public.set_updated_at();

create policy "Free lesson plans are visible to everyone"
  on public.lesson_plans for select
  using (is_free = true);

create policy "Active subscribers can view all lesson plans"
  on public.lesson_plans for select
  using (
    exists (
      select 1 from public.profiles
      where profiles.id = auth.uid()
        and profiles.subscription_status = 'active'
    )
  );

create policy "Admins can insert lesson plans"
  on public.lesson_plans for insert
  with check (
    exists (
      select 1 from public.profiles
      where profiles.id = auth.uid() and profiles.is_admin = true
    )
  );

create policy "Admins can update lesson plans"
  on public.lesson_plans for update
  using (
    exists (
      select 1 from public.profiles
      where profiles.id = auth.uid() and profiles.is_admin = true
    )
  );

create policy "Admins can delete lesson plans"
  on public.lesson_plans for delete
  using (
    exists (
      select 1 from public.profiles
      where profiles.id = auth.uid() and profiles.is_admin = true
    )
  );
