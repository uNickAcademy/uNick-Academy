create table public.lesson_material_access_requests (
  token_hash text primary key,
  email text not null,
  client_hash text not null,
  locale text not null check (locale in ('pl', 'en')),
  topic text,
  consent_version text,
  created_at timestamptz not null default now(),
  used_at timestamptz
);

create index lesson_material_requests_email_idx
  on public.lesson_material_access_requests (email, created_at desc);
create index lesson_material_requests_client_idx
  on public.lesson_material_access_requests (client_hash, created_at desc);
create index lesson_material_requests_created_idx
  on public.lesson_material_access_requests (created_at);

create table public.lesson_material_contacts (
  id uuid not null default gen_random_uuid() unique,
  email text primary key,
  locale text not null check (locale in ('pl', 'en')),
  first_verified_at timestamptz not null default now(),
  last_verified_at timestamptz not null default now(),
  newsletter_opted_in_at timestamptz,
  newsletter_consent_version text,
  newsletter_unsubscribed_at timestamptz
);

alter table public.lesson_material_access_requests enable row level security;
alter table public.lesson_material_contacts enable row level security;
revoke all on public.lesson_material_access_requests, public.lesson_material_contacts
  from public, anon, authenticated;
grant select, insert, update, delete
  on public.lesson_material_access_requests, public.lesson_material_contacts to service_role;

create function public.request_lesson_material_access(
  requested_email text, request_hash text, requester_hash text,
  request_locale text, request_topic text, request_consent_version text
) returns boolean
language plpgsql
set search_path = ''
as $$
begin
  -- Serialize reservations to prevent parallel requests from bypassing the limits.
  perform pg_advisory_xact_lock(hashtextextended('lesson-materials-requests', 0));

  if (select count(*) from public.lesson_material_access_requests
      where client_hash = requester_hash and created_at > now() - interval '15 minutes') >= 10
    or (select count(*) from public.lesson_material_access_requests
      where created_at > now() - interval '1 hour') >= 300 then
    return false;
  end if;

  if exists (select 1 from public.lesson_material_access_requests
      where email = requested_email and created_at > now() - interval '1 minute')
    or (select count(*) from public.lesson_material_access_requests
      where email = requested_email and created_at > now() - interval '1 hour') >= 3 then
    return false;
  end if;

  insert into public.lesson_material_access_requests
    (email, token_hash, client_hash, locale, topic, consent_version)
  values
    (requested_email, request_hash, requester_hash, request_locale, request_topic, request_consent_version);
  return true;
end;
$$;

create function public.confirm_lesson_material_access(request_hash text)
returns table (language text, requested_topic text)
language plpgsql
set search_path = ''
as $$
declare
  confirmed public.lesson_material_access_requests%rowtype;
begin
  update public.lesson_material_access_requests r set used_at = now()
    where r.token_hash = request_hash and r.used_at is null
      and r.created_at > now() - interval '30 minutes'
    returning r.* into confirmed;

  if not found then return; end if;

  insert into public.lesson_material_contacts as c
    (email, locale, newsletter_opted_in_at, newsletter_consent_version)
  values (confirmed.email, confirmed.locale,
    case when confirmed.consent_version is not null then now() end, confirmed.consent_version)
  on conflict (email) do update set
    last_verified_at = now(),
    locale = excluded.locale,
    newsletter_opted_in_at = case when confirmed.consent_version is not null
      and (c.newsletter_unsubscribed_at is null or confirmed.created_at > c.newsletter_unsubscribed_at)
      then excluded.newsletter_opted_in_at else c.newsletter_opted_in_at end,
    newsletter_consent_version = case when confirmed.consent_version is not null
      and (c.newsletter_unsubscribed_at is null or confirmed.created_at > c.newsletter_unsubscribed_at)
      then excluded.newsletter_consent_version else c.newsletter_consent_version end;

  return query select confirmed.locale, confirmed.topic;
end;
$$;

create function public.prune_lesson_material_contacts()
returns void
language sql
set search_path = ''
as $$
  delete from public.lesson_material_access_requests where created_at < now() - interval '1 day';
  delete from public.lesson_material_contacts
    where last_verified_at < now() - interval '90 days'
      and (newsletter_opted_in_at is null
        or (newsletter_unsubscribed_at >= newsletter_opted_in_at
          and newsletter_unsubscribed_at < now() - interval '90 days'));
$$;

revoke all on function public.request_lesson_material_access(text,text,text,text,text,text),
  public.confirm_lesson_material_access(text), public.prune_lesson_material_contacts()
  from public, anon, authenticated;
grant execute on function public.request_lesson_material_access(text,text,text,text,text,text),
  public.confirm_lesson_material_access(text), public.prune_lesson_material_contacts()
  to service_role;

insert into storage.buckets (id, name, public, allowed_mime_types, file_size_limit)
values ('lesson-material-pdfs', 'lesson-material-pdfs', false, array['application/pdf'], 15000000);
