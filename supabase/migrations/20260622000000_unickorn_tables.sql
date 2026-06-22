-- uNickorn AI Tutor tables
-- students: links auth users to student-specific data (subscriptions, referral codes)
create table if not exists public.students (
  id uuid primary key default gen_random_uuid(),
  profile_id uuid not null references public.profiles(id) on delete cascade,
  full_name text,
  age_group text check (age_group in ('child', 'tween', 'teen', 'adult')),
  level text,
  is_unick_student boolean not null default false,
  referral_code text unique,
  stripe_customer_id text,
  unickorn_subscription_status text not null default 'none'
    check (unickorn_subscription_status in ('none', 'trialing', 'active', 'past_due', 'canceled')),
  unickorn_subscription_tier text
    check (unickorn_subscription_tier in ('unick_student', 'external')),
  unickorn_stripe_subscription_id text,
  deleted_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists idx_students_profile_id on public.students(profile_id);

alter table public.students enable row level security;

create policy "Users can view their own student record"
  on public.students for select
  using (profile_id = auth.uid());

-- student_profile: learner preferences, interests, notes (one per student)
create table if not exists public.student_profile (
  id uuid primary key default gen_random_uuid(),
  student_id uuid not null references public.students(id) on delete cascade unique,
  interests text[] default '{}',
  goals text,
  pets text,
  family_notes text,
  notes_freeform text,
  confidence_level text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table public.student_profile enable row level security;

create policy "Users can view their own student profile"
  on public.student_profile for select
  using (
    student_id in (select id from public.students where profile_id = auth.uid())
  );

-- tutor_sessions: conversation history and recaps
create table if not exists public.tutor_sessions (
  id uuid primary key default gen_random_uuid(),
  student_id uuid not null references public.students(id) on delete cascade,
  started_at timestamptz not null default now(),
  ended_at timestamptz,
  duration_minutes integer,
  topics text[] default '{}',
  new_vocabulary text[] default '{}',
  gentle_corrections jsonb default '[]',
  mood text,
  summary text,
  created_at timestamptz not null default now()
);

create index if not exists idx_tutor_sessions_student_id on public.tutor_sessions(student_id);

alter table public.tutor_sessions enable row level security;

create policy "Users can view their own tutor sessions"
  on public.tutor_sessions for select
  using (
    student_id in (select id from public.students where profile_id = auth.uid())
  );

-- usage_counters: monthly session/minute tracking per student
create table if not exists public.usage_counters (
  id uuid primary key default gen_random_uuid(),
  student_id uuid not null references public.students(id) on delete cascade,
  period text not null,
  sessions_used integer not null default 0,
  minutes_used integer not null default 0,
  unique(student_id, period)
);

alter table public.usage_counters enable row level security;

create policy "Users can view their own usage"
  on public.usage_counters for select
  using (
    student_id in (select id from public.students where profile_id = auth.uid())
  );

-- RPC: atomically increment session usage for a student/period
create or replace function public.increment_unickorn_usage(
  p_student_id uuid,
  p_period text
)
returns void
language plpgsql
security definer
as $$
begin
  insert into public.usage_counters (student_id, period, sessions_used)
  values (p_student_id, p_period, 1)
  on conflict (student_id, period)
  do update set sessions_used = usage_counters.sessions_used + 1;
end;
$$;
