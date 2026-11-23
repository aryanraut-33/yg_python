-- yg python · family accounts (Phase 2)
-- Run once: Supabase dashboard → SQL Editor → New query → paste this whole file → Run.
--
-- Privacy rules built in here (DPDP Act):
--   * A parent's account is the family. Children never log in themselves.
--   * We keep the child's FIRST name and birth year only.
--   * Every table has row-level security: a parent can only ever reach their own family's rows.
--   * Nothing is readable without signing in (the anon role gets no access at all).
--   * delete_my_account() removes the parent and, through ON DELETE CASCADE, everything else.

-- ---------- Tables ----------

create table public.parents (
  id uuid primary key references auth.users (id) on delete cascade,
  weekly_email boolean not null default true,
  created_at timestamptz not null default now()
);

-- Each consent is a permanent record: what was agreed, when, and under which policy version.
create table public.consents (
  id bigint generated always as identity primary key,
  parent_id uuid not null references public.parents (id) on delete cascade,
  policy_version text not null check (char_length(policy_version) <= 40),
  agreed jsonb not null check (pg_column_size(agreed) < 2000),
  agreed_at timestamptz not null default now()
);
create index consents_parent_idx on public.consents (parent_id);

create table public.children (
  id uuid primary key default gen_random_uuid(),
  parent_id uuid not null references public.parents (id) on delete cascade,
  first_name text not null check (char_length(btrim(first_name)) between 1 and 30),
  birth_year int not null check (birth_year between 2006 and 2022),
  created_at timestamptz not null default now()
);
create index children_parent_idx on public.children (parent_id);

-- One row per child per project (key = project id), plus key 'onboarding'.
-- data holds the same JSON the browser keeps locally.
create table public.progress (
  child_id uuid not null references public.children (id) on delete cascade,
  key text not null check (char_length(key) between 1 and 80),
  data jsonb not null check (pg_column_size(data) < 300000),
  updated_at timestamptz not null default now(),
  primary key (child_id, key)
);

-- Usage events (runs, errors, hints, checks) for improving lessons. Our own table: no third-party analytics.
create table public.events (
  id bigint generated always as identity primary key,
  child_id uuid not null references public.children (id) on delete cascade,
  type text not null check (char_length(type) <= 40),
  data jsonb check (data is null or pg_column_size(data) < 4000),
  at timestamptz not null default now()
);
create index events_child_at_idx on public.events (child_id, at);

-- Concepts a child has used in a finished project (for the weekly parent email).
create table public.concepts_learned (
  child_id uuid not null references public.children (id) on delete cascade,
  concept text not null check (char_length(concept) <= 60),
  project text not null check (char_length(project) <= 80),
  learned_at timestamptz not null default now(),
  primary key (child_id, concept)
);

-- ---------- Row-level security ----------

alter table public.parents enable row level security;
alter table public.consents enable row level security;
alter table public.children enable row level security;
alter table public.progress enable row level security;
alter table public.events enable row level security;
alter table public.concepts_learned enable row level security;

-- True when the child belongs to the signed-in parent.
create or replace function public.is_my_child (child uuid)
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select exists (
    select 1 from public.children c
    where c.id = child and c.parent_id = (select auth.uid())
  );
$$;

create policy "parents: own row" on public.parents
  for all to authenticated
  using (id = (select auth.uid()))
  with check (id = (select auth.uid()));

create policy "consents: read own" on public.consents
  for select to authenticated
  using (parent_id = (select auth.uid()));
create policy "consents: add own" on public.consents
  for insert to authenticated
  with check (parent_id = (select auth.uid()));
-- No update or delete policy: a consent record can't be changed after it's made.

create policy "children: own family" on public.children
  for all to authenticated
  using (parent_id = (select auth.uid()))
  with check (parent_id = (select auth.uid()));

create policy "progress: own children" on public.progress
  for all to authenticated
  using (public.is_my_child (child_id))
  with check (public.is_my_child (child_id));

create policy "events: read own children" on public.events
  for select to authenticated
  using (public.is_my_child (child_id));
create policy "events: add for own children" on public.events
  for insert to authenticated
  with check (public.is_my_child (child_id));

create policy "concepts: own children" on public.concepts_learned
  for all to authenticated
  using (public.is_my_child (child_id))
  with check (public.is_my_child (child_id));

-- ---------- Grants: only signed-in parents, only what the app needs ----------

revoke all on public.parents, public.consents, public.children, public.progress, public.events, public.concepts_learned from anon;
grant select, insert, update on public.parents to authenticated;
grant select, insert on public.consents to authenticated;
grant select, insert, update, delete on public.children to authenticated;
grant select, insert, update, delete on public.progress to authenticated;
grant select, insert on public.events to authenticated;
grant select, insert, update, delete on public.concepts_learned to authenticated;
grant usage, select on all sequences in schema public to authenticated;

revoke all on function public.is_my_child (uuid) from public, anon;
grant execute on function public.is_my_child (uuid) to authenticated;

-- ---------- Delete my account (DPDP: right to erasure) ----------

create or replace function public.delete_my_account ()
returns void
language plpgsql
security definer
set search_path = ''
as $$
begin
  if (select auth.uid()) is null then
    raise exception 'Not signed in';
  end if;
  -- Cascades to parents → consents, children → progress, events, concepts_learned.
  delete from auth.users where id = (select auth.uid());
end;
$$;

revoke all on function public.delete_my_account () from public, anon;
grant execute on function public.delete_my_account () to authenticated;
