-- Cash received and promotional credit are separate immutable ledger entries.
-- These tables do not modify students, transactions or ActiveNow balances.
create table public.voucher_orders (
  id uuid primary key,
  idempotency_key uuid not null unique,
  request_hash text not null,
  buyer_name text not null check (char_length(buyer_name) between 2 and 100),
  buyer_email text not null check (char_length(buyer_email) between 3 and 254),
  gift boolean not null,
  invoice jsonb,
  value integer not null,
  cash_grosze integer not null,
  bonus_grosze integer not null,
  face_grosze integer not null check (face_grosze = cash_grosze + bonus_grosze),
  status text not null default 'pending' check (status in ('pending','paid','canceled','refunded')),
  payu_order_id text unique,
  checkout_url text,
  voucher_code text unique,
  paid_at timestamptz,
  expires_on date,
  terms_version text not null,
  terms_accepted_at timestamptz not null default now(),
  email_claimed_at timestamptz,
  email_sent_at timestamptz,
  email_provider_id text,
  created_at timestamptz not null default now(),
  constraint voucher_offer_amounts check (
    (value,cash_grosze,bonus_grosze,face_grosze) in (
      (250,23900,1100,25000),(500,44900,5100,50000),
      (1000,84900,15100,100000),(5000,399900,100100,500000)
    )
  ),
  constraint paid_voucher_has_code check (
    status not in ('paid','refunded') or (voucher_code is not null and paid_at is not null and expires_on is not null)
  )
);

create table public.voucher_ledger (
  id bigint generated always as identity primary key,
  order_id uuid not null references public.voucher_orders(id),
  kind text not null check (kind in ('cash_received','promotional_bonus','cash_refunded','promotional_bonus_revoked')),
  amount_grosze integer not null,
  created_at timestamptz not null default now(),
  unique(order_id,kind),
  check ((kind in ('cash_received','promotional_bonus') and amount_grosze > 0)
    or (kind in ('cash_refunded','promotional_bonus_revoked') and amount_grosze < 0))
);

create table public.voucher_activations (
  order_id uuid primary key references public.voucher_orders(id),
  active_now_client_id text not null check (active_now_client_id ~ '^[0-9]{1,16}$'),
  active_now_reference text not null check (char_length(active_now_reference) between 3 and 500),
  activated_by uuid not null references auth.users(id),
  activated_at timestamptz not null default now()
);

create table public.voucher_request_limits (
  fingerprint text not null,
  window_start timestamptz not null,
  requests integer not null check (requests > 0),
  primary key(fingerprint,window_start)
);

create table public.voucher_refunds (
  order_id uuid primary key references public.voucher_orders(id),
  payu_reference text not null check (char_length(payu_reference) between 3 and 500),
  active_now_reversal_reference text,
  recorded_by uuid not null references auth.users(id),
  recorded_at timestamptz not null default now()
);

alter table public.voucher_orders enable row level security;
alter table public.voucher_ledger enable row level security;
alter table public.voucher_activations enable row level security;
alter table public.voucher_request_limits enable row level security;
alter table public.voucher_refunds enable row level security;
revoke all on public.voucher_orders,public.voucher_ledger,public.voucher_activations,public.voucher_request_limits,public.voucher_refunds from public,anon,authenticated;
grant select,insert,update on public.voucher_orders to service_role;
grant select,insert on public.voucher_ledger,public.voucher_activations to service_role;
grant select,insert on public.voucher_refunds to service_role;
grant select,insert,update,delete on public.voucher_request_limits to service_role;
grant usage,select on sequence public.voucher_ledger_id_seq to service_role;

create function public.voucher_allow_checkout(p_fingerprint text)
returns boolean language plpgsql security invoker set search_path = '' as $$
declare count_now integer;
begin
  insert into public.voucher_request_limits(fingerprint,window_start,requests)
    values(p_fingerprint,date_trunc('hour',now()),1)
    on conflict(fingerprint,window_start) do update set requests=public.voucher_request_limits.requests+1
    returning requests into count_now;
  delete from public.voucher_request_limits where window_start < now()-interval '48 hours';
  return count_now <= 12;
end;
$$;

create function public.voucher_complete_payment(
  p_order_id uuid,p_payu_order_id text,p_amount integer,p_code text
) returns public.voucher_orders language plpgsql security invoker set search_path = '' as $$
declare voucher public.voucher_orders;
begin
  select * into voucher from public.voucher_orders where id=p_order_id for update;
  if not found then raise exception 'Unknown order'; end if;
  if voucher.cash_grosze <> p_amount or
    (voucher.payu_order_id is not null and voucher.payu_order_id <> p_payu_order_id)
    then raise exception 'Order mismatch'; end if;
  -- A verified COMPLETED notification is authoritative even after a stale CANCELED notice.
  if voucher.status='refunded' then return voucher; end if;
  if voucher.status <> 'paid' then
    update public.voucher_orders set status='paid',payu_order_id=p_payu_order_id,
      voucher_code=p_code,paid_at=now(),
      expires_on=((now() at time zone 'Europe/Warsaw')+interval '1 year')::date
      where id=p_order_id returning * into voucher;
    insert into public.voucher_ledger(order_id,kind,amount_grosze) values
      (p_order_id,'cash_received',voucher.cash_grosze),
      (p_order_id,'promotional_bonus',voucher.bonus_grosze);
  end if;
  return voucher;
end;
$$;

create function public.voucher_claim_email(p_order_id uuid)
returns public.voucher_orders language plpgsql security invoker set search_path = '' as $$
declare voucher public.voucher_orders;
begin
  update public.voucher_orders set email_claimed_at=now()
    where id=p_order_id and status='paid' and email_sent_at is null
    and (email_claimed_at is null or email_claimed_at < now()-interval '5 minutes')
    returning * into voucher;
  return voucher;
end;
$$;

create function public.voucher_record_activation(
 p_order_id uuid,p_client_id text,p_reference text,p_actor uuid
) returns void language plpgsql security invoker set search_path = '' as $$
declare voucher public.voucher_orders;
begin
 select * into voucher from public.voucher_orders where id=p_order_id for update;
 if not found or voucher.status <> 'paid' or voucher.expires_on < (now() at time zone 'Europe/Warsaw')::date
 then raise exception 'Voucher is not available'; end if;
 insert into public.voucher_activations(order_id,active_now_client_id,active_now_reference,activated_by)
 values(p_order_id,p_client_id,p_reference,p_actor);
end;
$$;

revoke all on function public.voucher_allow_checkout(text) from public,anon,authenticated;
revoke all on function public.voucher_complete_payment(uuid,text,integer,text) from public,anon,authenticated;
revoke all on function public.voucher_claim_email(uuid) from public,anon,authenticated;
revoke all on function public.voucher_record_activation(uuid,text,text,uuid) from public,anon,authenticated;
grant execute on function public.voucher_allow_checkout(text),public.voucher_complete_payment(uuid,text,integer,text),
  public.voucher_claim_email(uuid),public.voucher_record_activation(uuid,text,text,uuid) to service_role;

-- Records an already completed manual full refund; never initiates a transfer.
create function public.voucher_record_refund(p_order_id uuid,p_payu_reference text,p_reversal_reference text,p_actor uuid)
returns void language plpgsql security invoker set search_path = '' as $$
declare voucher public.voucher_orders;
begin
 select * into voucher from public.voucher_orders where id=p_order_id for update;
 if not found or voucher.status <> 'paid' then raise exception 'Voucher is not refundable'; end if;
 if exists(select 1 from public.voucher_activations where order_id=p_order_id)
   and coalesce(char_length(p_reversal_reference),0)<3 then raise exception 'ActiveNow reversal reference required'; end if;
 insert into public.voucher_refunds(order_id,payu_reference,active_now_reversal_reference,recorded_by)
 values(p_order_id,p_payu_reference,nullif(p_reversal_reference,''),p_actor);
 update public.voucher_orders set status='refunded' where id=p_order_id;
 insert into public.voucher_ledger(order_id,kind,amount_grosze) values
  (p_order_id,'cash_refunded',-voucher.cash_grosze),
  (p_order_id,'promotional_bonus_revoked',-voucher.bonus_grosze);
end;
$$;
revoke all on function public.voucher_record_refund(uuid,text,text,uuid) from public,anon,authenticated;
grant execute on function public.voucher_record_refund(uuid,text,text,uuid) to service_role;
