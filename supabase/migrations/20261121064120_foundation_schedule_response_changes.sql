-- Current response can change; an append-only audit retains every prior answer.
alter table public.foundation_contract_responses add column updated_at timestamptz not null default now();
create table public.foundation_contract_response_history (
 id bigint generated always as identity primary key,
 invite_id uuid not null references public.foundation_contract_invites(id),
 choice text not null check(choice in ('yes','no')),
 note text not null check(char_length(note)<=1500),
 recorded_at timestamptz not null default clock_timestamp()
);
alter table public.foundation_contract_response_history enable row level security;
revoke all on public.foundation_contract_response_history from public,anon,authenticated;
grant select,insert on public.foundation_contract_response_history to service_role;
grant usage on sequence public.foundation_contract_response_history_id_seq to service_role;
grant select on public.foundation_contract_response_history to authenticated;
create policy "Admin reads schedule response history" on public.foundation_contract_response_history for select to authenticated using((select public.current_user_role())='admin'::public.user_role);
create index foundation_schedule_history_invite on public.foundation_contract_response_history(invite_id,id);
insert into public.foundation_contract_response_history(invite_id,choice,note,recorded_at) select invite_id,choice,note,created_at from public.foundation_contract_responses;
create function public.foundation_audit_schedule_response() returns trigger
language plpgsql security invoker set search_path='' as $$
begin
 if tg_op='INSERT' or (new.choice,new.note) is distinct from (old.choice,old.note) then
  insert into public.foundation_contract_response_history(invite_id,choice,note) values(new.invite_id,new.choice,new.note);
 end if;
 return new;
end;
$$;
revoke all on function public.foundation_audit_schedule_response() from public,anon,authenticated;
create trigger foundation_schedule_response_audit after insert or update of choice,note on public.foundation_contract_responses for each row execute function public.foundation_audit_schedule_response();
grant update(choice,note,updated_at) on public.foundation_contract_responses to service_role;
create function public.foundation_record_schedule_response(p_token_hash text,p_choice text,p_note text)
returns jsonb language plpgsql security invoker set search_path='' as $$
declare invitation public.foundation_contract_invites;
begin
 select * into invitation from public.foundation_contract_invites where token_hash=p_token_hash for update;
 if not found or invitation.revoked_at is not null or invitation.expires_at<=now() then raise exception 'invalid_invitation'; end if;
 if p_choice is null or p_choice not in ('yes','no') or p_note is null or char_length(p_note)>1500 then raise exception 'invalid_response'; end if;
 insert into public.foundation_contract_responses(invite_id,choice,note)
 values(invitation.id,p_choice,p_note)
 on conflict(invite_id) do update set choice=excluded.choice,note=excluded.note,updated_at=clock_timestamp()
 where (public.foundation_contract_responses.choice,public.foundation_contract_responses.note) is distinct from (excluded.choice,excluded.note);
 return jsonb_build_object('choice',p_choice,'note',p_note);
end;
$$;
revoke all on function public.foundation_record_schedule_response(text,text,text) from public,anon,authenticated;
grant execute on function public.foundation_record_schedule_response(text,text,text) to service_role;
