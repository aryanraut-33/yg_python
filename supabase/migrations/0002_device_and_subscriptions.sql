-- Tinkora · Single device registration & per-child subscriptions (Phase 2)
-- Run in Supabase SQL Editor.

-- 1. Single active device on parents table
alter table public.parents
  add column if not exists active_device_id text,
  add column if not exists device_updated_at timestamptz;

-- Atomically register this device as the single active device for the parent
create or replace function public.register_device (device_id text)
returns boolean
language plpgsql
security definer
set search_path = ''
as $$
declare
  p_uid uuid := (select auth.uid());
begin
  if p_uid is null then
    raise exception 'Not signed in';
  end if;
  update public.parents
  set active_device_id = register_device.device_id,
      device_updated_at = now()
  where id = p_uid;
  return true;
end;
$$;
revoke all on function public.register_device (text) from public, anon;
grant execute on function public.register_device (text) to authenticated;

-- 2. Per-child subscriptions on children table
alter table public.children
  add column if not exists subscription_status text not null default 'free' check (subscription_status in ('free', 'active', 'canceled')),
  add column if not exists subscription_expires_at timestamptz,
  add column if not exists subscription_plan text default 'spark';

-- Allow parents to update/manage a child's subscription (also used by payment webhooks)
create or replace function public.set_child_subscription (child uuid, new_status text, plan text default 'spark')
returns boolean
language plpgsql
security definer
set search_path = ''
as $$
declare
  p_uid uuid := (select auth.uid());
begin
  if p_uid is null then
    raise exception 'Not signed in';
  end if;
  if not exists (select 1 from public.children where id = child and parent_id = p_uid) then
    raise exception 'Child not found or not yours';
  end if;
  update public.children
  set subscription_status = new_status,
      subscription_plan = plan,
      subscription_expires_at = case when new_status = 'active' then now() + interval '1 year' else null end
  where id = child and parent_id = p_uid;
  return true;
end;
$$;
revoke all on function public.set_child_subscription (uuid, text, text) from public, anon;
grant execute on function public.set_child_subscription (uuid, text, text) to authenticated;
