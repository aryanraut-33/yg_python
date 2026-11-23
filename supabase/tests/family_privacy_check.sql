-- Proves that one family can never see or change another family's data,
-- and that someone who isn't signed in can't read anything.
--
-- Run AFTER migrations/0001_family_accounts.sql:
--   Supabase dashboard → SQL Editor → New query → paste this whole file → Run.
-- Everything happens inside a transaction that is rolled back, so no test data is left behind.
-- Expected result: one row saying "All family-privacy checks passed".
-- Any failure stops the script with an error that starts with "FAIL".

begin;

-- Two pretend families, A and B, each with one child.
insert into auth.users (id, email) values
  ('00000000-0000-4000-8000-00000000000a', 'privacy-test-a@example.invalid'),
  ('00000000-0000-4000-8000-00000000000b', 'privacy-test-b@example.invalid');
insert into public.parents (id) values
  ('00000000-0000-4000-8000-00000000000a'),
  ('00000000-0000-4000-8000-00000000000b');
insert into public.children (id, parent_id, first_name, birth_year) values
  ('00000000-0000-4000-8000-0000000000c1', '00000000-0000-4000-8000-00000000000a', 'Asha', 2014),
  ('00000000-0000-4000-8000-0000000000c2', '00000000-0000-4000-8000-00000000000b', 'Bilal', 2013);
insert into public.progress (child_id, key, data) values
  ('00000000-0000-4000-8000-0000000000c1', 'name-light-show', '{"stepIndex": 3}'),
  ('00000000-0000-4000-8000-0000000000c2', 'name-light-show', '{"stepIndex": 5}');
insert into public.events (child_id, type) values
  ('00000000-0000-4000-8000-0000000000c1', 'run'),
  ('00000000-0000-4000-8000-0000000000c2', 'run');
insert into public.consents (parent_id, policy_version, agreed) values
  ('00000000-0000-4000-8000-00000000000a', 'test', '{"terms": true}'),
  ('00000000-0000-4000-8000-00000000000b', 'test', '{"terms": true}');

-- From here on, act as parent A, signed in.
select set_config('request.jwt.claims', '{"sub": "00000000-0000-4000-8000-00000000000a", "role": "authenticated"}', true);
set local role authenticated;

do $$
declare
  n int;
  b_parent constant uuid := '00000000-0000-4000-8000-00000000000b';
  b_child constant uuid := '00000000-0000-4000-8000-0000000000c2';
begin
  -- Reading
  select count(*) into n from public.parents;
  if n <> 1 then raise exception 'FAIL: parent A can see % parent rows (expected 1)', n; end if;
  select count(*) into n from public.children;
  if n <> 1 then raise exception 'FAIL: parent A can see % children (expected 1, their own)', n; end if;
  select count(*) into n from public.progress where child_id = b_child;
  if n <> 0 then raise exception 'FAIL: parent A can read family B''s progress'; end if;
  select count(*) into n from public.events where child_id = b_child;
  if n <> 0 then raise exception 'FAIL: parent A can read family B''s events'; end if;
  select count(*) into n from public.consents;
  if n <> 1 then raise exception 'FAIL: parent A can see % consent records (expected 1)', n; end if;

  -- Changing B's rows: these must touch nothing.
  update public.children set first_name = 'Hacked' where id = b_child;
  get diagnostics n = row_count;
  if n <> 0 then raise exception 'FAIL: parent A renamed family B''s child'; end if;
  update public.progress set data = '{}' where child_id = b_child;
  get diagnostics n = row_count;
  if n <> 0 then raise exception 'FAIL: parent A changed family B''s progress'; end if;
  delete from public.progress where child_id = b_child;
  get diagnostics n = row_count;
  if n <> 0 then raise exception 'FAIL: parent A deleted family B''s progress'; end if;
  delete from public.children where id = b_child;
  get diagnostics n = row_count;
  if n <> 0 then raise exception 'FAIL: parent A deleted family B''s child'; end if;

  -- Writing into B's family: these must be refused.
  begin
    insert into public.children (parent_id, first_name, birth_year) values (b_parent, 'Sneaky', 2014);
    raise exception 'FAIL: parent A added a child to family B';
  exception when insufficient_privilege then null;
  end;
  begin
    insert into public.progress (child_id, key, data) values (b_child, 'rocket-launch', '{}');
    raise exception 'FAIL: parent A wrote progress for family B''s child';
  exception when insufficient_privilege then null;
  end;
  begin
    insert into public.events (child_id, type) values (b_child, 'run');
    raise exception 'FAIL: parent A logged events for family B''s child';
  exception when insufficient_privilege then null;
  end;
  begin
    insert into public.consents (parent_id, policy_version, agreed) values (b_parent, 'test', '{}');
    raise exception 'FAIL: parent A recorded consent for family B';
  exception when insufficient_privilege then null;
  end;

  -- Consent records can't be edited, even your own (refused outright, or zero rows changed).
  begin
    update public.consents set policy_version = 'edited';
    get diagnostics n = row_count;
    if n <> 0 then raise exception 'FAIL: a consent record was edited'; end if;
  exception when insufficient_privilege then null;
  end;
end
$$;

-- Someone who isn't signed in (the public "anon" role) must not read anything.
reset role;
set local role anon;
do $$
begin
  begin
    perform 1 from public.children;
    raise exception 'FAIL: a visitor who is not signed in can read children';
  exception when insufficient_privilege then null;
  end;
  begin
    perform 1 from public.progress;
    raise exception 'FAIL: a visitor who is not signed in can read progress';
  exception when insufficient_privilege then null;
  end;
end
$$;

reset role;
select 'All family-privacy checks passed' as result;

rollback;
