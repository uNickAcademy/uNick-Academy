-- ============================================================================
-- Agent Skrzynki: porządkowanie skrzynki mailowej szkoły i odpowiedzi.
--
-- Agent (src/lib/inbox-agent) czyta skrzynkę przez IMAP, przenosi maile do
-- podfolderów, odpowiada na te, na które zna odpowiedź, a resztę odkłada do
-- folderu „Do decyzji" i pyta człowieka w panelu /admin/skrzynka.
--
-- Trzy tabele:
--   inbox_agent_state     jeden wiersz: ustawienia, notatki zespołu, profil
--                         wyuczony z „Wysłanych", blokada przebiegu
--   inbox_agent_messages  dziennik: co agent zrobił z każdym mailem
--   inbox_agent_knowledge odpowiedzi potwierdzone przez zespół, do ponownego użycia
--
-- Treści maili to dane osobowe, więc dostęp ma wyłącznie service_role
-- (endpointy /api/admin/inbox-agent sprawdzają rolę admina i dopiero wtedy
-- sięgają do tych tabel). RLS jest włączone bez żadnej polityki: klient
-- przeglądarkowy nie przeczyta stąd nic.
-- ============================================================================

create table if not exists public.inbox_agent_state (
  id                  boolean primary key default true check (id),
  enabled             boolean not null default true,
  -- false = agent tylko porządkuje i proponuje, każdą odpowiedź zatwierdza
  -- człowiek. true = pewne odpowiedzi wysyła sam.
  auto_reply          boolean not null default false,
  owner_notes         text not null default '',
  signature           text not null default '',
  learned_profile     text not null default '',
  learned_profile_at  timestamptz,
  last_run_at         timestamptz,
  last_run_summary    jsonb,
  last_error          text,
  -- Blokada: dwa równoległe przebiegi mogłyby wysłać tę samą odpowiedź dwa razy.
  run_started_at      timestamptz,
  updated_at          timestamptz not null default now()
);

insert into public.inbox_agent_state (id) values (true) on conflict (id) do nothing;

create table if not exists public.inbox_agent_messages (
  id                uuid primary key default gen_random_uuid(),
  created_at        timestamptz not null default now(),
  updated_at        timestamptz not null default now(),

  -- Nagłówek Message-ID: jedyny identyfikator, który przeżywa przenoszenie
  -- między folderami (UID zmienia się przy każdym przeniesieniu).
  message_id        text not null unique,
  from_address      text not null,
  from_name         text,
  reply_to_address  text,
  subject           text,
  received_at       timestamptz,
  body_text         text,
  in_reply_to       text,
  references_ids    text[] not null default '{}',

  category          text not null,
  folder            text,
  summary           text,
  needs_reply       boolean not null default false,
  confidence        text,
  sensitive         boolean not null default false,

  status            text not null check (status in (
                      'sorted', 'needs_review', 'sending', 'replied_auto',
                      'replied_approved', 'replied_manually', 'dismissed',
                      'resolved_outside', 'error')),
  owner_question    text,
  reusable_topic    text,
  draft_body        text,
  final_body        text,
  error             text,
  attempts          int not null default 0,

  handled_by        uuid references auth.users(id) on delete set null,
  handled_at        timestamptz
);

create index if not exists inbox_agent_messages_status_idx
  on public.inbox_agent_messages (status, received_at desc);
create index if not exists inbox_agent_messages_from_idx
  on public.inbox_agent_messages (from_address, created_at desc);

create table if not exists public.inbox_agent_knowledge (
  id                 uuid primary key default gen_random_uuid(),
  created_at         timestamptz not null default now(),
  topic              text not null,
  answer             text not null,
  -- 'owner' = wpisane ręcznie w panelu, 'approved_reply' = zapamiętane przy
  -- zatwierdzaniu odpowiedzi.
  source             text not null default 'owner',
  source_message_id  uuid references public.inbox_agent_messages(id) on delete set null,
  created_by         uuid references auth.users(id) on delete set null
);

alter table public.inbox_agent_state     enable row level security;
alter table public.inbox_agent_messages  enable row level security;
alter table public.inbox_agent_knowledge enable row level security;

revoke all on public.inbox_agent_state     from anon, authenticated, public;
revoke all on public.inbox_agent_messages  from anon, authenticated, public;
revoke all on public.inbox_agent_knowledge from anon, authenticated, public;
