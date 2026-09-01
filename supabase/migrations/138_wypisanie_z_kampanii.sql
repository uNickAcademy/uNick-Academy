-- Wypisanie z kampanii e-mail + rozpoznanie, kto już się zalogował.
--
-- Kampania „powrót" nie miała żadnego rejestru rezygnacji: w stopce była tylko
-- prośba „odpisz «rezygnuję»", a odpowiedź lądowała w skrzynce i nigdzie się
-- nie zapisywała. Przy kolejnej wysyłce ta sama osoba dostawała mail ponownie.
-- Ta tabela jest jednym miejscem prawdy o rezygnacjach: kampanie sprawdzają ją
-- przed wysyłką, więc raz wypisany adres nie wróci na listę.
--
-- Adres trzymamy znormalizowany (małe litery, bez spacji), bo to jedyny wspólny
-- klucz między kartoteką ucznia, logiem kampanii i linkiem w stopce maila.
create table if not exists public.email_optouts (
  email_norm text primary key,
  student_id uuid references public.students(id) on delete set null,
  campaign text,
  source text not null default 'link_w_mailu',
  created_at timestamptz not null default now()
);

comment on table public.email_optouts is
  'Adresy wypisane z wysyłek marketingowych. Kampanie muszą to sprawdzać przed wysyłką.';

alter table public.email_optouts enable row level security;
-- Bez polityk: dostęp ma wyłącznie service_role (omija RLS). Ani uczeń, ani
-- zalogowany pracownik nie czyta tej tabeli przez PostgREST.

-- Kto kiedykolwiek się zalogował. auth.users jest poza schematem publicznym,
-- więc PostgREST go nie widzi — a kampania musi pominąć osoby, które już
-- zrobiły to, o co prosimy w mailu.
create or replace function public.profile_ids_zalogowani()
returns table (id uuid)
language sql
stable
security definer
set search_path = public, auth
as $$
  select u.id from auth.users u where u.last_sign_in_at is not null
$$;

revoke all on function public.profile_ids_zalogowani() from public;
revoke all on function public.profile_ids_zalogowani() from anon;
revoke all on function public.profile_ids_zalogowani() from authenticated;
grant execute on function public.profile_ids_zalogowani() to service_role;
