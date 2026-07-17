-- 109: Tabela zgłoszeń "Bezpłatna konsultacja" (modal na stronach publicznych).
-- Dotąd modal POST-ował na /api/consultation, którego NIE BYŁO — każdy submit
-- kończył się błędem "Unexpected token '<' … is not valid JSON" (404 HTML).
-- Zapis robi wyłącznie service-role z API; admin czyta/zarządza przez RLS.

create table if not exists public.consultation_requests (
  id uuid primary key default gen_random_uuid(),
  created_at timestamptz not null default now(),
  status text not null default 'new' check (status in ('new', 'contacted', 'closed')),
  name text not null,
  email text not null,
  phone text,
  audience text,
  message text,
  source text not null default 'formularz www'
);

alter table public.consultation_requests enable row level security;

create policy "Admin zarządza zgłoszeniami konsultacji" on public.consultation_requests
  for all
  using (current_user_role() = 'admin'::user_role)
  with check (current_user_role() = 'admin'::user_role);
