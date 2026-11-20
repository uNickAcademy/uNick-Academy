-- Separate post-admission documents; never overwrite initial interest declarations.
create table public.foundation_contract_invites (
  id uuid primary key default gen_random_uuid(),
  declaration_id uuid not null references public.foundation_interest_declarations(id),
  participant_label text not null check(char_length(participant_label) between 1 and 120),
  token_hash text not null unique check(token_hash ~ '^[a-f0-9]{64}$'),
  groups jsonb not null check(jsonb_typeof(groups)='array' and jsonb_array_length(groups) between 1 and 8),
  first_support date not null, last_support date not null check(last_support >= first_support),
  documents jsonb not null check(jsonb_typeof(documents)='object'),
  created_by uuid not null references auth.users(id), created_at timestamptz not null default now(),
  expires_at timestamptz not null, revoked_at timestamptz, revoked_by uuid references auth.users(id)
);
create unique index foundation_contract_active_invite on public.foundation_contract_invites(declaration_id) where revoked_at is null;
create table public.foundation_contract_submissions (
  id uuid primary key default gen_random_uuid(),
  invite_id uuid not null unique references public.foundation_contract_invites(id),
  participant jsonb not null check(jsonb_typeof(participant)='object'),
  snapshot jsonb not null check(jsonb_typeof(snapshot)='object'),
  pdf_base64 text not null check(octet_length(pdf_base64) between 100 and 2000000),
  pdf_sha256 text not null check(pdf_sha256 ~ '^[a-f0-9]{64}$'),
  created_at timestamptz not null default now(), signed_at timestamptz, signed_by uuid references auth.users(id)
);
alter table public.foundation_contract_invites enable row level security;
alter table public.foundation_contract_submissions enable row level security;
revoke all on public.foundation_contract_invites,public.foundation_contract_submissions from public,anon,authenticated;
grant all on public.foundation_contract_invites,public.foundation_contract_submissions to service_role;
grant select on public.foundation_contract_invites,public.foundation_contract_submissions to authenticated;
create policy "Admin reads contract invitations" on public.foundation_contract_invites for select to authenticated using(public.current_user_role()='admin'::public.user_role);
create policy "Admin reads contract submissions" on public.foundation_contract_submissions for select to authenticated using(public.current_user_role()='admin'::public.user_role);
-- Lock + recheck closes revocation, expiry and duplicate-submit races. Only trusted server can invoke.
create function public.foundation_submit_contract(p_token_hash text,p_participant jsonb,p_snapshot jsonb,p_pdf text,p_sha text)
returns uuid language plpgsql security invoker set search_path='' as $$
declare invitation public.foundation_contract_invites; submission_id uuid;
begin
 select * into invitation from public.foundation_contract_invites where token_hash=p_token_hash for update;
 if not found or invitation.revoked_at is not null or invitation.expires_at<=now() then raise exception 'invalid_invitation' using errcode='P0001'; end if;
 select id into submission_id from public.foundation_contract_submissions where invite_id=invitation.id;
 if submission_id is not null then return submission_id; end if;
 insert into public.foundation_contract_submissions(invite_id,participant,snapshot,pdf_base64,pdf_sha256)
 values(invitation.id,p_participant,p_snapshot,p_pdf,p_sha) returning id into submission_id;
 return submission_id;
end;
$$;
revoke all on function public.foundation_submit_contract(text,jsonb,jsonb,text,text) from public,anon,authenticated;
grant execute on function public.foundation_submit_contract(text,jsonb,jsonb,text,text) to service_role;
comment on table public.foundation_contract_submissions is 'Immutable parent-submitted data, exact document snapshot and PDF; signed_at tracks paper signature receipt, not online acceptance.';
create table public.foundation_contract_settings (
  id boolean primary key default true check(id), settings jsonb not null,
  updated_by uuid not null references auth.users(id), updated_at timestamptz not null default now()
);
alter table public.foundation_contract_settings enable row level security;
revoke all on public.foundation_contract_settings from public,anon,authenticated;
grant all on public.foundation_contract_settings to service_role;
grant select on public.foundation_contract_settings to authenticated;
create policy "Admin reads contract settings" on public.foundation_contract_settings for select to authenticated using(public.current_user_role()='admin'::public.user_role);
