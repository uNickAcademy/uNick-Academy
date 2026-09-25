-- Progi frekwencji na balu — po to, żeby powiadomienie o osiągnięciu progu
-- poszło DOKŁADNIE RAZ.
--
-- Klucz główny na progu robi całą robotę: druga próba wstawienia tego samego
-- progu odbija się od bazy, więc kolejne zgłoszenia po przekroczeniu setki nie
-- zasypią skrzynki tym samym mailem. Liczenie „czy już wysłaliśmy" po stronie
-- aplikacji zawiodłoby przy dwóch zgłoszeniach wysłanych w tej samej sekundzie.

create table public.ball_milestones (
  threshold integer primary key,
  reached_at timestamptz not null default now(),
  seats_at_trigger integer not null check (seats_at_trigger > 0)
);

comment on table public.ball_milestones is
  'Osiągnięte progi liczby miejsc na balu. Jeden wiersz = jedno wysłane powiadomienie.';

alter table public.ball_milestones enable row level security;
revoke all on table public.ball_milestones from public, anon, authenticated;
grant select on table public.ball_milestones to authenticated;
grant all on table public.ball_milestones to service_role;

create policy "Tylko admin odczytuje progi balu"
  on public.ball_milestones for select to authenticated
  using (public.current_user_role() = 'admin'::public.user_role);
