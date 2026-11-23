// Publishing & Invite management for Family-Circle Sharing.
import { supabase } from '../account/supabase';

export interface PublishedProject {
  id: string;
  projectId: string;
  title: string;
  code: string;
  updatedAt: string;
}

export interface FamilyInvite {
  id: string;
  token: string;
  recipientName: string;
  isRevoked: boolean;
  viewCount: number;
  lastViewedAt: string | null;
  createdAt: string;
}

export interface ChildAppreciation {
  id: number;
  recipientName: string;
  projectTitle: string;
  preset: string;
  createdAt: string;
}

function generateSecureToken(): string {
  const chars = 'abcdefghjkmnpqrstuvwxyz23456789';
  let token = '';
  const bytes = new Uint8Array(16);
  crypto.getRandomValues(bytes);
  for (let i = 0; i < 16; i++) {
    token += chars[bytes[i] % chars.length];
  }
  return token;
}

export async function publishProjectSnapshot(
  childId: string,
  projectId: string,
  title: string,
  code: string,
): Promise<PublishedProject> {
  if (!supabase) throw new Error('Database is not connected');

  const { data, error } = await supabase
    .from('published_projects')
    .upsert(
      {
        child_id: childId,
        project_id: projectId,
        title: title.trim(),
        code,
        updated_at: new Date().toISOString(),
      },
      { onConflict: 'child_id,project_id' },
    )
    .select('id, project_id, title, code, updated_at')
    .single();

  if (error || !data) throw new Error(error?.message || 'Could not save project snapshot');

  return {
    id: data.id,
    projectId: data.project_id,
    title: data.title,
    code: data.code,
    updatedAt: data.updated_at,
  };
}

export async function createFamilyInvite(childId: string, recipientName: string): Promise<FamilyInvite> {
  if (!supabase) throw new Error('Database is not connected');

  const token = generateSecureToken();
  const { data, error } = await supabase
    .from('invites')
    .insert({
      child_id: childId,
      recipient_name: recipientName.trim(),
      token,
    })
    .select('id, token, recipient_name, is_revoked, view_count, last_viewed_at, created_at')
    .single();

  if (error || !data) throw new Error(error?.message || 'Could not create invite');

  return {
    id: data.id,
    token: data.token,
    recipientName: data.recipient_name,
    isRevoked: data.is_revoked,
    viewCount: data.view_count,
    lastViewedAt: data.last_viewed_at,
    createdAt: data.created_at,
  };
}

export async function listChildInvites(childId: string): Promise<FamilyInvite[]> {
  if (!supabase) return [];

  const { data, error } = await supabase
    .from('invites')
    .select('id, token, recipient_name, is_revoked, view_count, last_viewed_at, created_at')
    .eq('child_id', childId)
    .order('created_at', { ascending: false });

  if (error || !data) return [];

  return data.map((d) => ({
    id: d.id,
    token: d.token,
    recipientName: d.recipient_name,
    isRevoked: d.is_revoked,
    viewCount: d.view_count,
    lastViewedAt: d.last_viewed_at,
    createdAt: d.created_at,
  }));
}

export async function revokeInvite(inviteId: string): Promise<void> {
  if (!supabase) return;
  const { error } = await supabase.from('invites').update({ is_revoked: true }).eq('id', inviteId);
  if (error) throw new Error(error.message);
}

/** Fetch all compliment reactions sent by family for a child's published projects. */
export async function fetchChildAppreciations(childId: string): Promise<ChildAppreciation[]> {
  if (!supabase) return [];

  try {
    // 1. Get published projects for this child
    const { data: projects, error: pErr } = await supabase
      .from('published_projects')
      .select('id, title')
      .eq('child_id', childId);

    if (pErr || !projects || projects.length === 0) return [];

    const projectMap = new Map(projects.map((p) => [p.id, p.title]));
    const projectUuids = projects.map((p) => p.id);

    // 2. Get invites for this child
    const { data: invites, error: iErr } = await supabase
      .from('invites')
      .select('id, recipient_name')
      .eq('child_id', childId);

    if (iErr || !invites || invites.length === 0) return [];

    const inviteMap = new Map(invites.map((i) => [i.id, i.recipient_name]));

    // 3. Get reactions for these projects
    const { data: reactions, error: rErr } = await supabase
      .from('reactions')
      .select('id, invite_id, published_project_id, preset_reaction, created_at')
      .in('published_project_id', projectUuids)
      .order('created_at', { ascending: false });

    if (rErr || !reactions) return [];

    return reactions.map((r) => ({
      id: Number(r.id),
      recipientName: inviteMap.get(r.invite_id) || 'Family',
      projectTitle: projectMap.get(r.published_project_id) || 'Project',
      preset: r.preset_reaction,
      createdAt: r.created_at,
    }));
  } catch {
    return [];
  }
}
