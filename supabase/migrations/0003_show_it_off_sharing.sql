-- Tinkora · Phase 3: Show It Off (Family-Circle Sharing, Personal Studio Pages, and Reactions)
-- Run in Supabase SQL Editor.

-- ---------- 1. Tables ----------

-- Frozen snapshots of a child's project when they tap "Share"
create table if not exists public.published_projects (
  id uuid primary key default gen_random_uuid(),
  child_id uuid not null references public.children (id) on delete cascade,
  project_id text not null check (char_length(project_id) between 1 and 80),
  title text not null check (char_length(btrim(title)) between 1 and 100),
  code text not null check (char_length(code) between 1 and 50000),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (child_id, project_id)
);
create index if not exists published_projects_child_idx on public.published_projects (child_id);

-- Personal named invites for family members (e.g. "Santosh Mama", "Dadi", "Tushar")
create table if not exists public.invites (
  id uuid primary key default gen_random_uuid(),
  token text not null unique check (char_length(token) between 12 and 64),
  child_id uuid not null references public.children (id) on delete cascade,
  recipient_name text not null check (char_length(btrim(recipient_name)) between 1 and 40),
  is_revoked boolean not null default false,
  view_count int not null default 0,
  last_viewed_at timestamptz,
  created_at timestamptz not null default now()
);
create index if not exists invites_child_idx on public.invites (child_id);
create index if not exists invites_token_idx on public.invites (token);

-- Preset reactions from family visitors (zero free-form text, child-safe compliments only)
create table if not exists public.reactions (
  id bigint generated always as identity primary key,
  invite_id uuid not null references public.invites (id) on delete cascade,
  published_project_id uuid not null references public.published_projects (id) on delete cascade,
  preset_reaction text not null check (
    preset_reaction in ('love', 'applause', 'rocket', 'laugh', 'mindblown', 'make_level_2', 'proud')
  ),
  created_at timestamptz not null default now()
);
create index if not exists reactions_project_idx on public.reactions (published_project_id);
create index if not exists reactions_invite_idx on public.reactions (invite_id);

-- ---------- 2. Row-Level Security (RLS) ----------

alter table public.published_projects enable row level security;
alter table public.invites enable row level security;
alter table public.reactions enable row level security;

-- Parents have full control over their own family's published projects & invites
create policy "published_projects: own children" on public.published_projects
  for all to authenticated
  using (public.is_my_child(child_id))
  with check (public.is_my_child(child_id));

create policy "invites: own children" on public.invites
  for all to authenticated
  using (public.is_my_child(child_id))
  with check (public.is_my_child(child_id));

create policy "reactions: view own children" on public.reactions
  for select to authenticated
  using (
    exists (
      select 1 from public.published_projects p
      where p.id = reactions.published_project_id and public.is_my_child(p.child_id)
    )
  );

-- Revoke raw table access from anon; visitors interact via secure functions only
revoke all on public.published_projects, public.invites, public.reactions from anon;
grant select, insert, update, delete on public.published_projects, public.invites to authenticated;
grant select on public.reactions to authenticated;
grant usage, select on all sequences in schema public to authenticated;

-- ---------- 3. Public RPC Functions for Visitors (No sign-up needed) ----------

-- Fetch studio page data when a family member opens their secret link
create or replace function public.get_shared_studio (invite_token text)
returns jsonb
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_invite record;
  v_child record;
  v_projects jsonb;
  v_reactions jsonb;
begin
  -- Validate token
  select * into v_invite from public.invites
  where token = invite_token and is_revoked = false;

  if not found then
    return jsonb_build_object('valid', false, 'error', 'Invite link is invalid or has been revoked.');
  end if;

  -- Update view metrics
  update public.invites
  set view_count = view_count + 1,
      last_viewed_at = now()
  where id = v_invite.id;

  -- Get child first name
  select first_name into v_child from public.children where id = v_invite.child_id;

  -- Fetch child's published projects
  select coalesce(jsonb_agg(
    jsonb_build_object(
      'id', p.id,
      'projectId', p.project_id,
      'title', p.title,
      'code', p.code,
      'updatedAt', p.updated_at
    ) order by p.updated_at desc
  ), '[]'::jsonb)
  into v_projects
  from public.published_projects p
  where p.child_id = v_invite.child_id;

  -- Fetch reactions count per project (using subquery to avoid nested aggregates)
  select coalesce(jsonb_agg(item), '[]'::jsonb)
  into v_reactions
  from (
    select jsonb_build_object(
      'projectId', r.published_project_id,
      'preset', r.preset_reaction,
      'count', count(*)
    ) as item
    from public.reactions r
    join public.published_projects p on p.id = r.published_project_id
    where p.child_id = v_invite.child_id
    group by r.published_project_id, r.preset_reaction
  ) sub;

  return jsonb_build_object(
    'valid', true,
    'childName', v_child.first_name,
    'recipientName', v_invite.recipient_name,
    'projects', v_projects,
    'reactions', v_reactions
  );
end;
$$;

revoke all on function public.get_shared_studio (text) from public;
grant execute on function public.get_shared_studio (text) to anon, authenticated;

-- Post an emoji / compliment reaction from a family member
create or replace function public.post_reaction (
  invite_token text,
  project_uuid uuid,
  reaction text
)
returns boolean
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_invite_id uuid;
  v_child_id uuid;
begin
  -- Verify invite is active
  select id, child_id into v_invite_id, v_child_id
  from public.invites
  where token = invite_token and is_revoked = false;

  if not found then
    raise exception 'Invalid or revoked invite link';
  end if;

  -- Verify project belongs to this child
  if not exists (select 1 from public.published_projects where id = project_uuid and child_id = v_child_id) then
    raise exception 'Project does not match this family member studio';
  end if;

  -- Validate reaction preset
  if reaction not in ('love', 'applause', 'rocket', 'laugh', 'mindblown', 'make_level_2', 'proud') then
    raise exception 'Invalid reaction preset';
  end if;

  -- Insert reaction
  insert into public.reactions (invite_id, published_project_id, preset_reaction)
  values (v_invite_id, project_uuid, reaction);

  return true;
end;
$$;

revoke all on function public.post_reaction (text, uuid, text) from public;
grant execute on function public.post_reaction (text, uuid, text) to anon, authenticated;
