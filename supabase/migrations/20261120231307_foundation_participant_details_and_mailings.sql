-- Data collection is separate from contract acceptance and issued PDF documents.
create table public.foundation_participant_details (
 invite_id uuid primary key references public.foundation_contract_invites(id),
 participant jsonb not null check(jsonb_typeof(participant)='object' and octet_length(participant::text)<=12000),
 name_needs_review boolean not null default false,
 created_at timestamptz not null default now(),
 check(not (participant ?| array['participationAccepted','privacyAcknowledged','residenceConfirmed','authorityConfirmed','birthDate','token']))
);
alter table public.foundation_participant_details enable row level security;
revoke all on public.foundation_participant_details from public,anon,authenticated;
grant select,insert on public.foundation_participant_details to service_role;
grant select on public.foundation_participant_details to authenticated;
create policy "Admin reads participant details" on public.foundation_participant_details for select to authenticated using((select public.current_user_role())='admin'::public.user_role);
create function public.foundation_save_participant_details(p_token_hash text,p_participant jsonb,p_needs_review boolean)
returns uuid language plpgsql security invoker set search_path='' as $$
declare invitation public.foundation_contract_invites;
begin
 select * into invitation from public.foundation_contract_invites where token_hash=p_token_hash for update;
 if not found or invitation.revoked_at is not null or invitation.expires_at<=now() then raise exception 'invalid_invitation'; end if;
 if not exists(select 1 from public.foundation_contract_responses where invite_id=invitation.id and choice='yes') then raise exception 'schedule_not_confirmed'; end if;
 insert into public.foundation_participant_details(invite_id,participant,name_needs_review) values(invitation.id,p_participant,p_needs_review) on conflict(invite_id) do nothing;
 return invitation.id;
end;
$$;
revoke all on function public.foundation_save_participant_details(text,jsonb,boolean) from public,anon,authenticated;
grant execute on function public.foundation_save_participant_details(text,jsonb,boolean) to service_role;
-- Recipient snapshots and provider receipt IDs make an authorized campaign reviewable and resumable.
-- Tokens and complete message bodies are never stored in this table.
create table public.foundation_confirmation_mailings (
 id uuid primary key default gen_random_uuid(),
 campaign text not null,
 declaration_id uuid not null references public.foundation_interest_declarations(id),
 participant_label text not null,
 salutation_name text not null,
 grammatical_gender text not null check(grammatical_gender in ('male','female','neutral')),
 to_email text not null,
 groups jsonb not null check(jsonb_typeof(groups)='array' and jsonb_array_length(groups) between 1 and 8),
 first_support date not null,last_support date not null,
 sort_order integer not null,
 status text not null default 'queued' check(status in ('queued','sending','sent','error')),
 invite_id uuid references public.foundation_contract_invites(id),
 sender text not null default 'hello@unick-academy.pl' check(sender='hello@unick-academy.pl'),
 provider_message_id text,
 created_at timestamptz not null default now(),sent_at timestamptz,last_error text,
 unique(campaign,declaration_id)
);
alter table public.foundation_confirmation_mailings enable row level security;
revoke all on public.foundation_confirmation_mailings from public,anon,authenticated;
grant all on public.foundation_confirmation_mailings to service_role;
grant select on public.foundation_confirmation_mailings to authenticated;
create policy "Admin reads confirmation mailing" on public.foundation_confirmation_mailings for select to authenticated using((select public.current_user_role())='admin'::public.user_role);
create index foundation_confirmation_mailings_queue on public.foundation_confirmation_mailings(campaign,status,sort_order);
comment on table public.foundation_participant_details is 'Preparatory participant/contact details only. Contains no contract acceptance, privacy acknowledgement, marketing consent or issued PDF.';
