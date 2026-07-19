-- 112: Powiadomienia panelu admina (nowe zapisy z publicznych formularzy).
-- Zapis robi wyłącznie service-role (API); admin/recepcja czyta i oznacza jako
-- przeczytane. Brak polityki INSERT dla ról zalogowanych — wstawia service-role.

create table if not exists public.admin_notifications (
  id uuid primary key default gen_random_uuid(),
  created_at timestamptz not null default now(),
  kind text not null,
  title text not null,
  body text,
  student_id uuid references public.students(id) on delete set null,
  read_at timestamptz
);

create index if not exists admin_notifications_unread_idx
  on public.admin_notifications (created_at desc) where read_at is null;

alter table public.admin_notifications enable row level security;

create policy "Admin i recepcja czytają powiadomienia" on public.admin_notifications
  for select using (current_user_role() in ('admin', 'reception'));

create policy "Admin i recepcja oznaczają przeczytane" on public.admin_notifications
  for update using (current_user_role() in ('admin', 'reception'))
  with check (current_user_role() in ('admin', 'reception'));
