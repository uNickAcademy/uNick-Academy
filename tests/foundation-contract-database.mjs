import { createRequire } from "node:module";
import fs from "node:fs/promises";
import assert from "node:assert/strict";
const require = createRequire(import.meta.url);
const { PGlite } = require(process.env.PGLITE_MODULE || "@electric-sql/pglite");
const db = new PGlite();
await db.exec(
  `create role anon;create role authenticated;create role service_role bypassrls;create schema auth;create table auth.users(id uuid primary key);create type public.user_role as enum('admin','student');create function public.current_user_role() returns public.user_role language sql stable as $$select current_setting('test.user_role',true)::public.user_role$$;create table public.foundation_interest_declarations(id uuid primary key);insert into auth.users values('11111111-1111-4111-8111-111111111111');insert into public.foundation_interest_declarations values('22222222-2222-4222-8222-222222222222');`,
);
for (const name of [
  "20261113213234_foundation_participant_contracts",
  "20261120165847_foundation_confirmation_responses",
  "20261120231307_foundation_participant_details_and_mailings",
  "20261121064120_foundation_schedule_response_changes",
])
  await db.exec(await fs.readFile(`supabase/migrations/${name}.sql`, "utf8"));
const invitation = "33333333-3333-4333-8333-333333333333",
  hash = "a".repeat(64);
async function invite(id, declaration, tokenHash) {
  return db.query(
    `insert into public.foundation_contract_invites(id,declaration_id,participant_label,token_hash,groups,first_support,last_support,documents,created_by,expires_at) values($1,$2,'Test',$3,'[{"id":"G5"}]','2026-12-03','2027-04-30','{}','11111111-1111-4111-8111-111111111111',now()+interval '1 day')`,
    [id, declaration, tokenHash],
  );
}
await invite(invitation, "22222222-2222-4222-8222-222222222222", hash);
await db.exec("set role anon");
for (const table of ["invites", "responses", "submissions", "settings", "mailings"])
  await assert.rejects(
    () => db.query(`select * from public.${table==='mailings'?'foundation_confirmation_mailings':'foundation_contract_'+table}`),
    /permission denied/,
  );
await db.exec("reset role;set role authenticated;set test.user_role='student'");
assert.equal(
  (await db.query("select * from public.foundation_contract_invites")).rows
    .length,
  0,
);
await assert.rejects(
  () =>
    db.query(
      "insert into public.foundation_contract_responses(invite_id,choice) values($1,'yes')",
      [invitation],
    ),
  /permission denied/,
);
await db.exec("set test.user_role='admin'");
assert.equal(
  (await db.query("select * from public.foundation_contract_invites")).rows
    .length,
  1,
);
await db.exec("reset role;set role service_role");
const submit = () =>
  db.query(
    `select public.foundation_submit_contract($1,'{"participantFirstName":"Test"}','{}',$2,$3) as id`,
    [hash, "x".repeat(100), "b".repeat(64)],
  );
await assert.rejects(submit, /schedule_not_confirmed/);
await db.query(
  "insert into public.foundation_contract_responses(invite_id,choice) values($1,'yes')",
  [invitation],
);
const recordChoice=(choice,note='')=>db.query('select public.foundation_record_schedule_response($1,$2,$3) as response',[hash,choice,note]);
const initialHistory=(await db.query('select count(*) as n from public.foundation_contract_response_history')).rows[0].n;
await recordChoice('no','Pasuje mi wtorek po 17:00.');
assert.equal((await db.query('select choice from public.foundation_contract_responses')).rows[0].choice,'no');
await assert.rejects(submit,/schedule_not_confirmed/);
await assert.rejects(()=>db.query(`select public.foundation_save_participant_details($1,'{}',false)`,[hash]),/schedule_not_confirmed/);
await recordChoice('no','Pasuje mi wtorek po 17:00.');
assert.equal((await db.query('select count(*) as n from public.foundation_contract_response_history')).rows[0].n,initialHistory+1);
await recordChoice('yes');
assert.equal((await db.query('select count(*) as n from public.foundation_contract_response_history')).rows[0].n,initialHistory+2);
await assert.rejects(()=>db.query("update public.foundation_contract_response_history set note='changed'"),/permission denied/);
const saveDetails=()=>db.query(`select public.foundation_save_participant_details($1,'{"participantFirstName":"Jan","address":"ul. Testowa 1, 62-090 Rokietnica"}',false) as id`,[hash]);
const [detail1,detail2]=await Promise.all([saveDetails(),saveDetails()]);assert.equal(detail1.rows[0].id,detail2.rows[0].id);
assert.equal((await db.query('select * from public.foundation_participant_details')).rows.length,1);
assert.equal((await db.query('select count(*) as n from public.foundation_contract_submissions')).rows[0].n,0);
await assert.rejects(()=>db.query(`insert into public.foundation_participant_details(invite_id,participant) values($1,'{"participationAccepted":true}')`,[invitation]),/check constraint/);
const [a, b] = await Promise.all([submit(), submit()]);
assert.equal(a.rows[0].id, b.rows[0].id);
assert.equal(
  (await db.query("select * from public.foundation_contract_submissions")).rows
    .length,
  1,
);
await db.query(
  "update public.foundation_contract_submissions set scan_received_at=now() where id=$1",
  [a.rows[0].id],
);
assert.equal(
  (
    await db.query(
      "select signed_at from public.foundation_contract_submissions",
    )
  ).rows[0].signed_at,
  null,
);
await db.query(
  "update public.foundation_contract_invites set revoked_at=now() where id=$1",
  [invitation],
);
await assert.rejects(submit, /invalid_invitation/);
await assert.rejects(()=>recordChoice('no'),/invalid_invitation/);
await db.query(
  "update public.foundation_contract_invites set revoked_at=null,expires_at=now()-interval '1 minute' where id=$1",
  [invitation],
);
await assert.rejects(submit, /invalid_invitation/);
await db.query(
  "update public.foundation_contract_invites set revoked_at=now() where id=$1",
  [invitation],
);
await db.exec("reset role");
// Thirteen simultaneous requests must not overbook a twelve-person group.
const additions = [];
for (let index = 0; index < 13; index++) {
  const declaration = `00000000-0000-4000-8000-${String(index + 1).padStart(12, "0")}`;
  await db.query(
    "insert into public.foundation_interest_declarations values($1)",
    [declaration],
  );
  additions.push(() =>
    invite(
      `10000000-0000-4000-8000-${String(index + 1).padStart(12, "0")}`,
      declaration,
      String(index + 1).padStart(64, "0"),
    ),
  );
}
const capacity = await Promise.allSettled(additions.map((run) => run()));
assert.equal(
  capacity.filter((result) => result.status === "fulfilled").length,
  12,
);
assert.equal(
  capacity.filter(
    (result) =>
      result.status === "rejected" &&
      String(result.reason).includes("group_capacity_exceeded"),
  ).length,
  1,
);
console.log(
  "OK: both migrations; anonymous/student isolation; admin access; response changes with immutable history and idempotency; current-schedule gate; idempotent submissions; scan/original separation; revocation/expiry; 12-person capacity.",
);
await db.close();
