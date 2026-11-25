create table public.voucher_activation_claims (
 id bigint generated always as identity primary key,
 order_id uuid not null references public.voucher_orders(id),
 actor_id uuid not null references auth.users(id),
 claimed_at timestamptz not null default now(),
 released_at timestamptz,
 completed_at timestamptz
);
create unique index voucher_one_active_claim on public.voucher_activation_claims(order_id)
 where released_at is null and completed_at is null;
alter table public.voucher_activation_claims enable row level security;
revoke all on public.voucher_activation_claims from public,anon,authenticated;
grant select,insert,update on public.voucher_activation_claims to service_role;
grant usage,select on sequence public.voucher_activation_claims_id_seq to service_role;

create function public.voucher_claim_activation(p_order_id uuid,p_actor uuid,p_release boolean default false)
returns void language plpgsql security invoker set search_path='' as $$
declare voucher public.voucher_orders; claimant uuid;
begin
 select * into voucher from public.voucher_orders where id=p_order_id for update;
 if not found or voucher.status<>'paid' or voucher.expires_on<(now() at time zone 'Europe/Warsaw')::date
  or exists(select 1 from public.voucher_activations where order_id=p_order_id)
 then raise exception 'Voucher unavailable'; end if;
 select actor_id into claimant from public.voucher_activation_claims where order_id=p_order_id and released_at is null and completed_at is null;
 if p_release then
   if claimant is distinct from p_actor then raise exception 'Reservation owner required'; end if;
   update public.voucher_activation_claims set released_at=now() where order_id=p_order_id and actor_id=p_actor and released_at is null and completed_at is null;
 elsif claimant is null then
   insert into public.voucher_activation_claims(order_id,actor_id) values(p_order_id,p_actor);
 elsif claimant<>p_actor then raise exception 'Another operator reserved this voucher';
 end if;
end;
$$;

create or replace function public.voucher_record_activation(p_order_id uuid,p_client_id text,p_reference text,p_actor uuid)
returns void language plpgsql security invoker set search_path='' as $$
declare voucher public.voucher_orders;
begin
 select * into voucher from public.voucher_orders where id=p_order_id for update;
 if not found or voucher.status<>'paid' or voucher.expires_on<(now() at time zone 'Europe/Warsaw')::date
 then raise exception 'Voucher is not available'; end if;
 if not exists(select 1 from public.voucher_activation_claims where order_id=p_order_id and actor_id=p_actor and released_at is null and completed_at is null)
 then raise exception 'Reserve this voucher before changing ActiveNow'; end if;
 insert into public.voucher_activations(order_id,active_now_client_id,active_now_reference,activated_by)
 values(p_order_id,p_client_id,p_reference,p_actor);
 update public.voucher_activation_claims set completed_at=now() where order_id=p_order_id and actor_id=p_actor and released_at is null and completed_at is null;
end;
$$;

create or replace function public.voucher_record_refund(p_order_id uuid,p_payu_reference text,p_reversal_reference text,p_actor uuid)
returns void language plpgsql security invoker set search_path='' as $$
declare voucher public.voucher_orders;
begin
 select * into voucher from public.voucher_orders where id=p_order_id for update;
 if not found or voucher.status<>'paid' then raise exception 'Voucher is not refundable'; end if;
 if exists(select 1 from public.voucher_activation_claims where order_id=p_order_id and released_at is null and completed_at is null)
 then raise exception 'Finish or release activation before recording refund'; end if;
 if exists(select 1 from public.voucher_activations where order_id=p_order_id)
 and coalesce(char_length(p_reversal_reference),0)<3 then raise exception 'ActiveNow reversal reference required'; end if;
 insert into public.voucher_refunds(order_id,payu_reference,active_now_reversal_reference,recorded_by)
 values(p_order_id,p_payu_reference,nullif(p_reversal_reference,''),p_actor);
 update public.voucher_orders set status='refunded' where id=p_order_id;
 insert into public.voucher_ledger(order_id,kind,amount_grosze) values
 (p_order_id,'cash_refunded',-voucher.cash_grosze),(p_order_id,'promotional_bonus_revoked',-voucher.bonus_grosze);
end;
$$;
revoke all on function public.voucher_claim_activation(uuid,uuid,boolean) from public,anon,authenticated;
grant execute on function public.voucher_claim_activation(uuid,uuid,boolean) to service_role;
