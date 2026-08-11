-- Odrabianie zajęć: propozycja terminu wysyłana przez ucznia lub nauczyciela,
-- którą druga strona musi zaakceptować, zanim powstanie nowa lekcja.
-- Zastępuje dotychczasowe natychmiastowe samo-zapisywanie się na wolny termin
-- (MakeupActions) — teraz każdy nowy termin wymaga zgody drugiej strony.

create table if not exists public.makeup_proposals (
  id uuid primary key default gen_random_uuid(),
  lesson_id uuid not null references public.lessons(id) on delete cascade,
  student_id uuid not null references public.students(id) on delete cascade,
  teacher_id uuid not null references public.teachers(id) on delete cascade,
  proposed_by text not null check (proposed_by in ('student', 'teacher')),
  proposed_starts_at timestamptz not null,
  proposed_ends_at timestamptz not null,
  meeting_url text,
  status text not null default 'pending' check (status in ('pending', 'accepted', 'declined', 'cancelled')),
  created_lesson_id uuid references public.lessons(id) on delete set null,
  created_at timestamptz not null default now(),
  responded_at timestamptz
);

create index if not exists makeup_proposals_lesson_id_idx on public.makeup_proposals(lesson_id);
create index if not exists makeup_proposals_student_id_idx on public.makeup_proposals(student_id);
create index if not exists makeup_proposals_teacher_id_idx on public.makeup_proposals(teacher_id);
create index if not exists makeup_proposals_status_idx on public.makeup_proposals(status);

-- Lekcja odrabiana → oryginalna, odwołana lekcja (do historii/raportów).
alter table public.lessons add column if not exists makeup_for_lesson_id uuid references public.lessons(id) on delete set null;
create index if not exists lessons_makeup_for_lesson_id_idx on public.lessons(makeup_for_lesson_id);

alter table public.makeup_proposals enable row level security;

-- Zapis/odpowiedź zawsze idzie przez API (service role) — walidacja ról,
-- powiadomienia mailowe i tworzenie lekcji po akceptacji dzieją się tam razem.
-- RLS tutaj pilnuje tylko odczytu z poziomu przeglądarki (panel ucznia/nauczyciela).
create policy "Uczeń widzi swoje propozycje odrabiania" on public.makeup_proposals
  for select using (student_id in (select id from public.students where profile_id = auth.uid()));

create policy "Nauczyciel widzi propozycje odrabiania swoich uczniów" on public.makeup_proposals
  for select using (teacher_id in (select id from public.teachers where profile_id = auth.uid()));

create policy "Admin/recepcja zarządzają propozycjami odrabiania" on public.makeup_proposals
  for all using (current_user_role() = any (array['admin'::user_role, 'reception'::user_role]))
  with check (current_user_role() = any (array['admin'::user_role, 'reception'::user_role]));
