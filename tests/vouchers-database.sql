begin;
do $$
declare
 test_id uuid:=gen_random_uuid();
 paid public.voucher_orders;
 operator_one uuid;
 operator_two uuid;
 failure_seen boolean;
begin
 select id into operator_one from auth.users order by created_at limit 1;
 select id into operator_two from auth.users where id<>operator_one order by created_at limit 1;
 if operator_one is null or operator_two is null then raise exception 'Two existing operator IDs are required for this rollback-only reservation test'; end if;
 insert into public.voucher_orders(id,idempotency_key,request_hash,buyer_name,buyer_email,gift,value,cash_grosze,bonus_grosze,face_grosze,terms_version)
 values(test_id,gen_random_uuid(),'rollback-only-test','Test bez wysylki','test@example.invalid',true,1000,84900,15100,100000,'bf2026-v1');
 paid:=public.voucher_complete_payment(test_id,'ROLLBACK-ONLY',84900,'UNICK-TEST-NOT-ISSUED');
 perform public.voucher_claim_activation(test_id,operator_one,false);
 failure_seen:=false;
 begin perform public.voucher_claim_activation(test_id,operator_two,false); exception when others then failure_seen:=true; end;
 if not failure_seen then raise exception 'Second operator acquired an active reservation'; end if;
 failure_seen:=false;
 begin perform public.voucher_record_activation(test_id,'12345','rollback test',operator_two); exception when others then failure_seen:=true; end;
 if not failure_seen then raise exception 'Non-owner recorded activation'; end if;
 perform public.voucher_record_activation(test_id,'12345','rollback-only references',operator_one);
 failure_seen:=false;
 begin perform public.voucher_record_activation(test_id,'12345','duplicate rollback test',operator_one); exception when others then failure_seen:=true; end;
 if not failure_seen then raise exception 'Voucher activated twice'; end if;
 failure_seen:=false;
 begin perform public.voucher_record_refund(test_id,'rollback refund','',operator_one); exception when others then failure_seen:=true; end;
 if not failure_seen then raise exception 'Refund allowed without reversing the ActiveNow activation'; end if;
 perform public.voucher_record_refund(test_id,'rollback refund','rollback reversal',operator_one);
 paid:=public.voucher_complete_payment(test_id,'ROLLBACK-ONLY',84900,'UNICK-MUST-NOT-REACTIVATE');
 if paid.status<>'refunded' then raise exception 'Late notification reactivated a refunded voucher'; end if;
 if (select sum(amount_grosze) from public.voucher_ledger where order_id=test_id)<>0 then raise exception 'Full refund did not neutralize cash and bonus separately'; end if;
 if has_table_privilege('anon','public.voucher_orders','SELECT') or has_table_privilege('authenticated','public.voucher_ledger','SELECT')
 or has_function_privilege('anon','public.voucher_record_activation(uuid,text,text,uuid)','EXECUTE') then raise exception 'Private voucher records or financial RPC exposed'; end if;
end $$;
rollback;
select (select count(*) from public.voucher_orders) as orders_after_rollback,
       (select count(*) from public.voucher_ledger) as ledger_rows_after_rollback,
       (select count(*) from public.voucher_activation_claims) as claims_after_rollback;
