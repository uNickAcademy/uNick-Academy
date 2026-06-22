-- Referral programme tables
-- Extends the students table (created in 20260622000000) with referral fields

-- Companies: B2B clients excluded from the referral programme
create table if not exists public.companies (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  created_at timestamptz not null default now()
);

alter table public.companies enable row level security;

-- Teachers
create table if not exists public.teachers (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  email text,
  created_at timestamptz not null default now()
);

alter table public.teachers enable row level security;

-- Add referral/company columns to students if not present
alter table public.students
  add column if not exists company_id uuid references public.companies(id),
  add column if not exists phone text,
  add column if not exists credit_balance numeric(10,2) not null default 0;

-- Enrollments: links students to teachers with schedule info
create table if not exists public.enrollments (
  id uuid primary key default gen_random_uuid(),
  student_id uuid not null references public.students(id) on delete cascade unique,
  teacher_id uuid references public.teachers(id),
  mode text,
  day_of_week text,
  start_time text,
  level text,
  notes text,
  created_at timestamptz not null default now()
);

alter table public.enrollments enable row level security;

-- Purchases
create table if not exists public.purchases (
  id uuid primary key default gen_random_uuid(),
  student_id uuid not null references public.students(id) on delete cascade,
  amount numeric(10,2) not null,
  type text not null check (type in ('trial', 'single_lesson', 'package', 'monthly')),
  status text not null default 'paid' check (status in ('paid', 'refunded', 'cancelled')),
  is_qualifying boolean not null default false,
  credit_applied numeric(10,2) not null default 0,
  created_at timestamptz not null default now()
);

create index if not exists idx_purchases_student_id on public.purchases(student_id);

alter table public.purchases enable row level security;

create policy "Users can view their own purchases"
  on public.purchases for select
  using (
    student_id in (select id from public.students where profile_id = auth.uid())
  );

-- Referrals
create table if not exists public.referrals (
  id uuid primary key default gen_random_uuid(),
  code text not null,
  referrer_id uuid not null references public.students(id),
  referred_id uuid not null references public.students(id) unique,
  status text not null default 'pending'
    check (status in ('pending', 'qualified', 'reward_pending', 'rewarded', 'rejected', 'cancelled')),
  flagged boolean not null default false,
  flag_reason text,
  admin_note text,
  qualifying_purchase_id uuid references public.purchases(id),
  qualified_at timestamptz,
  rewarded_at timestamptz,
  cancelled_at timestamptz,
  created_at timestamptz not null default now()
);

create index if not exists idx_referrals_referrer_id on public.referrals(referrer_id);

alter table public.referrals enable row level security;

create policy "Users can view referrals they are part of"
  on public.referrals for select
  using (
    referrer_id in (select id from public.students where profile_id = auth.uid())
    or referred_id in (select id from public.students where profile_id = auth.uid())
  );

-- Credit transactions (ledger)
create table if not exists public.credit_transactions (
  id uuid primary key default gen_random_uuid(),
  student_id uuid not null references public.students(id) on delete cascade,
  amount numeric(10,2) not null,
  reason text not null check (reason in (
    'referred_signup_bonus', 'referrer_bonus', 'referral_reversal',
    'redemption', 'admin_adjustment'
  )),
  status text not null default 'active' check (status in ('pending', 'active', 'cancelled')),
  referral_id uuid references public.referrals(id),
  purchase_id uuid references public.purchases(id),
  note text,
  created_at timestamptz not null default now()
);

create index if not exists idx_credit_transactions_student_id on public.credit_transactions(student_id);

alter table public.credit_transactions enable row level security;

create policy "Users can view their own credit transactions"
  on public.credit_transactions for select
  using (
    student_id in (select id from public.students where profile_id = auth.uid())
  );

-- Lessons
create table if not exists public.lessons (
  id uuid primary key default gen_random_uuid(),
  student_id uuid not null references public.students(id) on delete cascade,
  attended boolean not null default true,
  is_trial boolean not null default false,
  purchase_id uuid references public.purchases(id),
  created_at timestamptz not null default now()
);

create index if not exists idx_lessons_student_id on public.lessons(student_id);

alter table public.lessons enable row level security;

create policy "Users can view their own lessons"
  on public.lessons for select
  using (
    student_id in (select id from public.students where profile_id = auth.uid())
  );
