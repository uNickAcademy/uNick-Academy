-- The first schedule response is retained; a corrected assignment creates a new invitation.
create table public.foundation_contract_responses (
  invite_id uuid primary key references public.foundation_contract_invites(id),
  choice text not null check(choice in ('yes','no')),
  note text not null default '' check(char_length(note)<=1500),
  created_at timestamptz not null default now()
);
alter table public.foundation_contract_responses enable row level security;
revoke all on public.foundation_contract_responses from public,anon,authenticated;
grant select,insert on public.foundation_contract_responses to service_role;
grant select on public.foundation_contract_responses to authenticated;
create policy "Admin reads schedule responses" on public.foundation_contract_responses
for select to authenticated using((select public.current_user_role())='admin'::public.user_role);
alter table public.foundation_contract_submissions
  add column scan_received_at timestamptz,
  add column scan_received_by uuid references auth.users(id);
comment on column public.foundation_contract_submissions.scan_received_at is 'Admin confirmed receiving and checking the scan sent by email; distinct from receiving the signed original.';
-- Only the trusted server may write invitations. Serializing capacity checks closes concurrent admin races.
create function public.foundation_contract_capacity_guard() returns trigger
language plpgsql security invoker set search_path='' as $$
declare group_id text;
begin
 perform pg_catalog.pg_advisory_xact_lock(pg_catalog.hashtextextended('foundation_contract_capacity',0));
 if new.revoked_at is not null or new.expires_at<=now() then return new; end if;
 for group_id in select value->>'id' from jsonb_array_elements(new.groups) loop
   if (select count(*) from public.foundation_contract_invites i
       where i.id<>new.id and i.revoked_at is null and (i.expires_at>now() or exists(select 1 from public.foundation_contract_submissions s where s.invite_id=i.id))
       and i.groups @> jsonb_build_array(jsonb_build_object('id',group_id)))>=12
   then raise exception 'group_capacity_exceeded' using errcode='P0001'; end if;
 end loop;
 return new;
end;
$$;
revoke all on function public.foundation_contract_capacity_guard() from public,anon,authenticated;
create trigger foundation_contract_capacity before insert or update on public.foundation_contract_invites
for each row execute function public.foundation_contract_capacity_guard();
-- Final submission is possible only after confirming the precise schedule snapshot.
create or replace function public.foundation_submit_contract(p_token_hash text,p_participant jsonb,p_snapshot jsonb,p_pdf text,p_sha text)
returns uuid language plpgsql security invoker set search_path='' as $$
declare invitation public.foundation_contract_invites; submission_id uuid;
begin
 select * into invitation from public.foundation_contract_invites where token_hash=p_token_hash for update;
 if not found or invitation.revoked_at is not null or invitation.expires_at<=now() then raise exception 'invalid_invitation' using errcode='P0001'; end if;
 if not exists(select 1 from public.foundation_contract_responses where invite_id=invitation.id and choice='yes') then raise exception 'schedule_not_confirmed' using errcode='P0001'; end if;
 select id into submission_id from public.foundation_contract_submissions where invite_id=invitation.id;
 if submission_id is not null then return submission_id; end if;
 insert into public.foundation_contract_submissions(invite_id,participant,snapshot,pdf_base64,pdf_sha256)
 values(invitation.id,p_participant,p_snapshot,p_pdf,p_sha) returning id into submission_id;
 return submission_id;
end;
$$;
revoke all on function public.foundation_submit_contract(text,jsonb,jsonb,text,text) from public,anon,authenticated;
grant execute on function public.foundation_submit_contract(text,jsonb,jsonb,text,text) to service_role;
